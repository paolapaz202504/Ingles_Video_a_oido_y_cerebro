import { VideoModel } from "../models/VideoModel.js";
import { GeminiModel } from "../models/GeminiModel.js";
import { CacheManager } from "../utils/cacheManager.js";
import { getGuatemalaDate, STANDARD_USER_AGENT } from "../utils/helpers.js";
import { execFile } from "child_process";
import util from "util";
import { readFile, readdir, mkdtemp, rm, writeFile } from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const execFilePromise = util.promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Usamos el binario de node_modules tal como lo hacía server_copia.js
const ytDlpExe = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const ytDlpPath = path.join(__dirname, "../../node_modules", "youtube-dl-exec", "bin", ytDlpExe);

export class VideoController {
    static async getLibrary(req, res) {
        try {
            const videos = await VideoModel.getLibraryVideos();
            res.json(videos);
        } catch (error) {
            console.error("Error al obtener la biblioteca de videos:", error);
            res.status(500).json({ error: "No se pudo cargar la biblioteca." });
        }
    }

    // Helper para estandarizar la URL y garantizar que la caché sea exacta (evita duplicados)
    static _normalizeUrl(url) {
        let normalized = url.trim().replace(/^http:\/\//i, "https://");
        
        // 1. Asegurar protocolo https://
        if (!/^https:\/\//i.test(normalized)) {
            normalized = "https://" + normalized;
        }
        
        // 2. Convertir formato corto de youtu.be a formato estándar
        if (/^https:\/\/youtu\.be\//i.test(normalized)) {
            const videoId = normalized.split("youtu.be/")[1].split("?")[0];
            normalized = `https://www.youtube.com/watch?v=${videoId}`;
        }
        
        // 3. Estandarizar youtube.com a www.youtube.com
        if (/^https:\/\/youtube\.com/i.test(normalized)) {
            normalized = normalized.replace(/youtube\.com/i, "www.youtube.com");
        }
        
        // 4. Estandarizar dominios de redes sociales y limpiar parámetros de rastreo
        if (/^https:\/\/(www\.)?(x\.com|twitter\.com)/i.test(normalized)) {
            normalized = normalized.replace(/^https:\/\/(www\.)?x\.com/i, "https://twitter.com").split('?')[0];
        } else if (/^https:\/\/(www\.)?tiktok\.com/i.test(normalized)) {
            normalized = normalized.replace(/^https:\/\/tiktok\.com/i, "https://www.tiktok.com").split('?')[0];
        } else if (/^https:\/\/(www\.)?instagram\.com/i.test(normalized)) {
            normalized = normalized.replace(/^https:\/\/instagram\.com/i, "https://www.instagram.com").split('?')[0];
        } else if (/^https:\/\/(www\.)?facebook\.com/i.test(normalized)) {
            normalized = normalized.replace(/^https:\/\/facebook\.com/i, "https://www.facebook.com");
            if (normalized.includes("/watch") && normalized.includes("v=")) {
                const match = normalized.match(/v=([^&]+)/);
                if (match) {
                    normalized = `https://www.facebook.com/watch/?v=${match[1]}`;
                }
            } else {
                normalized = normalized.split('?')[0];
            }
        }
        
        return normalized.replace(/\/$/, "");
    }

    static async processVideo(req, res) {
        let { videoUrl, apiKey } = req.body;
        if (!videoUrl) {
            return res.status(400).json({ error: "La URL del video es requerida." });
        }
        if (!apiKey) {
            return res.status(400).json({ error: "La API Key de Gemini es requerida." });
        }

        // Normalizamos la URL para que cualquier variante genere el mismo Hash en la caché
        videoUrl = VideoController._normalizeUrl(videoUrl);

        let tempDir = ""; // Usaremos un directorio temporal como en server_copia
        try {
            // 1. Revisar la caché primero
            let cachedAnalysis = await CacheManager.getCachedAnalysis(videoUrl);
            if (req.body.forceReprocess) cachedAnalysis = null; // Venimos de batchReprocess.js

            const completedPhases = cachedAnalysis?.phases || [];
            
            // Si tenemos el JSON y TODAS las fases están completadas, retornamos directo
            if (completedPhases.includes("A") && completedPhases.includes("B") && completedPhases.includes("C")) {
                console.log(`[Caché] Análisis COMPLETO HIT para: ${videoUrl}`);
                return res.status(200).json({ analysis: cachedAnalysis });
            }

            if (cachedAnalysis) {
                console.log(`[API] Análisis PARCIAL detectado. Fases completadas: [${completedPhases.join(", ")}]. Retomando fases faltantes...`);
            } else {
                console.log(`[API] Análisis MISS para: ${videoUrl}. Procesando desde cero...`);
            }

            let targetDownloadUrl = videoUrl;
            if (/x\.com|twitter\.com/i.test(videoUrl)) {
                const directMp4 = await VideoModel.getTwitterDirectUrl(videoUrl);
                if (directMp4 && directMp4.url) targetDownloadUrl = directMp4.url;
            } else if (/tiktok\.com/i.test(videoUrl)) {
                const directMp4 = await VideoModel.getTiktokDirectUrl(videoUrl);
                if (directMp4 && directMp4.url) targetDownloadUrl = directMp4.url;
            }

            // 2. Intentar obtener información (si falla, descargaremos a ciegas)
            console.log("-> Obteniendo información del video con yt-dlp...");
            let videoInfo = {};
            try {
                const { stdout } = await execFilePromise(ytDlpPath, ["--dump-json", "--no-warnings", "--no-check-certificate", videoUrl], { maxBuffer: 1024 * 1024 * 10 });
                videoInfo = JSON.parse(stdout);
            } catch (e) {
                console.warn("No se pudo obtener la metadata (Dump JSON falló). Procediendo con la descarga a ciegas como en server_copia...");
            }

            // Bloquear explícitamente en el backend si supera los 5 minutos (300 segundos)
            if (videoInfo.duration && videoInfo.duration > 300) {
                return res.status(400).json({ error: "La duración del video no debe superar los 5 minutos." });
            }

            let base64Audio = null;
            let mimeType = null;

            // ¡SOLO descargamos el audio si la Fase A no se completó!
            if (!completedPhases.includes("A")) {
                // 2.1 Crear directorio temporal y descargar con los comandos exactos de server_copia
                tempDir = await mkdtemp(path.join(tmpdir(), "video-audio-"));
                
                const ytArgs = [
                    targetDownloadUrl,
                    "--format", "bestaudio/best",
                    "--paths", tempDir,
                    "--output", "audio.%(ext)s",
                    "--no-check-certificate",
                    "--no-playlist",
                    "--prefer-free-formats",
                    "--user-agent", STANDARD_USER_AGENT
                ];

                if (/x\.com|twitter\.com/i.test(videoUrl) && targetDownloadUrl === videoUrl) {
                    ytArgs.push("--extractor-args", "twitter:api=syndication");
                }

                console.log(`-> Descargando audio...`);
                await execFilePromise(ytDlpPath, ytArgs);

                const files = await readdir(tempDir);
                if (files.length === 0) throw new Error("yt-dlp no descargó ningún archivo.");
                
                const audioPath = path.join(tempDir, files[0]);
                const ext = path.extname(files[0]).toLowerCase();

                console.log("-> Convirtiendo audio a Base64...");
                const audioBuffer = await readFile(audioPath);
                base64Audio = audioBuffer.toString("base64");
                mimeType = (ext === '.m4a' || ext === '.mp4') ? 'audio/mp4' : 'audio/webm';
            } else {
                console.log("-> ⏭️ Fase A completada previamente. Saltando descarga de yt-dlp...");
            }

            // 4. Analizar con Gemini
            console.log("-> Enviando a Gemini para análisis por fases...");
            let analysis = await GeminiModel.analyzeAudioMedia(
                base64Audio, 
                mimeType, 
                videoUrl, 
                videoInfo.title || cachedAnalysis?.videoTitle || "Desconocido", 
                videoInfo.description || cachedAnalysis?.videoDescription || "", 
                apiKey,
                cachedAnalysis // Le pasamos el caché que teníamos para que retome
            );
            
            // 5. Poblar campos adicionales y cachear la miniatura
            analysis.videoTitle = videoInfo.title || analysis.videoTitleGenerated || analysis.videoTitle || "";
            analysis.videoDescription = videoInfo.description || analysis.videoDescriptionGenerated || analysis.videoDescription || "";
            analysis.videoUrl = videoUrl;
            analysis.platform = videoInfo.extractor_key ? videoInfo.extractor_key.toLowerCase() : (analysis.platform || "desconocido");
            analysis.totalTime = videoInfo.duration ? new Date(videoInfo.duration * 1000).toISOString().substr(11, 8) : (analysis.totalTime || "00:00:00");
            analysis.generatedDate = analysis.generatedDate || getGuatemalaDate();
            
            if (videoInfo.thumbnail && !analysis.videoThumbnail) {
                console.log("-> Descargando y cacheando thumbnail...");
                analysis.videoThumbnail = await CacheManager.getAndCacheThumbnail(videoUrl, videoInfo.thumbnail);
            }

            // 6. Guardar en caché y responder
            await CacheManager.saveAnalysisToCache(videoUrl, analysis.prompt, analysis);
            console.log(`[Caché] Análisis guardado para: ${videoUrl}`);

            res.status(201).json({ analysis });

        } catch (error) {
            console.error("Error procesando el video:", error);
            res.status(500).json({ error: `Error al procesar el video: ${error.message}` });
        } finally {
            // 7. Limpiar el directorio temporal
            if (tempDir) {
                await rm(tempDir, { recursive: true, force: true }).catch(() => {});
            }
        }
    }

    static async getDirectUrl(req, res) {
        let videoUrl = req.body.url || req.body.videoUrl;
        if (!videoUrl) return res.status(400).json({ error: "La URL del video es requerida." });

        videoUrl = VideoController._normalizeUrl(videoUrl);

        try {
            if (/x\.com|twitter\.com/i.test(videoUrl)) {
                const directMp4 = await VideoModel.getTwitterDirectUrl(videoUrl);
                if (directMp4 && directMp4.url) return res.json({ directUrl: directMp4.url, thumbnail: directMp4.thumbnail });
                videoUrl = videoUrl.replace(/x\.com/i, "twitter.com");
            } else if (/tiktok\.com/i.test(videoUrl)) {
                const directMp4 = await VideoModel.getTiktokDirectUrl(videoUrl);
                if (directMp4 && directMp4.url) return res.json({ directUrl: directMp4.url, thumbnail: directMp4.thumbnail });
            }

            const formatType = "best[ext=mp4]/best";
            const ytArgs = [videoUrl, "--get-url", "-f", formatType, "--no-warnings", "--no-check-certificate", "--user-agent", STANDARD_USER_AGENT];
            if (/twitter\.com/i.test(videoUrl)) {
                ytArgs.push("--extractor-args", "twitter:api=syndication");
            }

            const { stdout } = await execFilePromise(ytDlpPath, ytArgs);
            const urls = stdout.trim().split('\n');
            const directUrl = urls[urls.length - 1]; // Tomar la última línea en caso de advertencias residuales
            res.json({ directUrl, thumbnail: "" });
        } catch (error) {
            console.error("Error al obtener URL directa:", error);
            res.status(500).json({ error: "Error interno al obtener la URL directa." });
        }
    }

    static async proxyVideo(req, res) {
        const { url } = req.query;
        if (!url) return res.status(400).send("URL es requerida");

        try {
            const headers = { 
                'User-Agent': STANDARD_USER_AGENT,
                'Accept': '*/*',
                'Connection': 'keep-alive'
            };
            
            if (url.includes('tiktok.com') || url.includes('tikwm')) {
                headers['Referer'] = 'https://www.tiktok.com/';
                headers['Origin'] = 'https://www.tiktok.com';
            } else if (url.includes('twimg.com') || url.includes('twitter.com') || url.includes('x.com')) {
                headers['Referer'] = 'https://twitter.com/';
                headers['Origin'] = 'https://twitter.com';
            } else if (url.includes('fbcdn.net') || url.includes('facebook.com')) {
                headers['Referer'] = 'https://www.facebook.com/';
                headers['Origin'] = 'https://www.facebook.com';
            } else if (url.includes('cdninstagram.com') || url.includes('instagram.com')) {
                headers['Referer'] = 'https://www.instagram.com/';
                headers['Origin'] = 'https://www.instagram.com';
            }

            // Reenviar la cabecera 'Range' es crítico para permitir adelantar/retroceder el video en el frontend
            if (req.headers.range) {
                headers['Range'] = req.headers.range;
            }

            const videoResponse = await fetch(url, { headers });
            
            res.status(videoResponse.status);
            // Forzar cabecera CORS para permitir Web Audio API en el <video crossorigin="anonymous">
            res.setHeader('Access-Control-Allow-Origin', '*');
            videoResponse.headers.forEach((value, name) => {
                // Evitar cabeceras que confunden la descompresión o duplican reglas CORS
                if (!['content-encoding', 'transfer-encoding', 'access-control-allow-origin'].includes(name.toLowerCase())) {
                    res.setHeader(name, value);
                }
            });
            videoResponse.body.pipe(res);
        } catch (error) {
            console.error("Error en el proxy de video:", error);
            res.status(500).send("Error en el proxy de video");
        }
    }
}