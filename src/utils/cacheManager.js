import crypto from "crypto";
import { mkdir, readFile, writeFile, readdir, unlink, rm } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "../../"); // Ruta a la carpeta raíz del proyecto
const CACHE_GEMINI_DIR = path.join(ROOT_DIR, "cache", "gemini_analysis");

const DICT_DIRS = {
  gemini: path.join(ROOT_DIR, "cache", "dictionary", "gemini"),
  freeDictionary: path.join(ROOT_DIR, "cache", "dictionary", "freeDictionary"),
  myMemory: path.join(ROOT_DIR, "cache", "dictionary", "myMemory"),
  lingva: path.join(ROOT_DIR, "cache", "dictionary", "lingva")
};
const CACHE_THUMBNAIL_DIR = path.join(ROOT_DIR, "cache", "gemini_analysis_thumbnail");

export class CacheManager {
  // 1. Limpieza automática: borra los archivos de caché viejos al iniciar el servidor
  static async cleanOldCache() {
  // Elimina físicamente la antigua carpeta de transcripciones que ya no se utiliza
  try {
    const oldCacheDir = path.join(ROOT_DIR, "cache", "transcriptions");
    await rm(oldCacheDir, { recursive: true, force: true });
  } catch (error) {}

  try {
    await mkdir(CACHE_GEMINI_DIR, { recursive: true });
    const files = await readdir(CACHE_GEMINI_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(CACHE_GEMINI_DIR, file);
        try {
          const content = await readFile(filePath, "utf8");
          const parsed = JSON.parse(content);
          // Si el archivo no tiene la nueva estructura (videoUrl), lo eliminamos
          if (!parsed.videoUrl) {
            await unlink(filePath);
            console.log(`[Caché] Archivo con formato antiguo eliminado: ${file}`);
          }
        } catch (err) {
          // Si es inválido o no se puede leer, lo eliminamos
          await unlink(filePath);
        }
      }
    }
  } catch (error) {
    // Ignoramos errores si el directorio apenas se va a crear por primera vez
  }
}

  static async getCachedAnalysis(url) {
  if (!url) return null;
  try {
    const hash = crypto.createHash("sha256").update(url).digest("hex");
    const cachePath = path.join(CACHE_GEMINI_DIR, `${hash}.json`);
    const data = await readFile(cachePath, "utf8");
    const parsedData = JSON.parse(data);
    
    if (parsedData && parsedData.analysis) {
      return parsedData.analysis;
    }
    return null;
  } catch (error) {
    return null;
  }
}

  static async saveAnalysisToCache(url, prompt, analysis) {
  if (!url || !analysis) return;
  try {
    await mkdir(CACHE_GEMINI_DIR, { recursive: true });
    const cacheData = {
      videoUrl: url,
      prompt: prompt,
      analysis: analysis
    };
    const hash = crypto.createHash("sha256").update(url).digest("hex");
    const cachePath = path.join(CACHE_GEMINI_DIR, `${hash}.json`);
    await writeFile(cachePath, JSON.stringify(cacheData, null, 2), "utf8");
  } catch (error) {
    console.error("Error guardando en la capa de caché de Gemini:", error);
  }
}

  static async getCachedDictionary(provider, word) {
  if (!word || !DICT_DIRS[provider]) return null;
  try {
    const hash = crypto.createHash("sha256").update(word.toLowerCase()).digest("hex");
    const cachePath = path.join(DICT_DIRS[provider], `${hash}.json`);
    const data = await readFile(cachePath, "utf8");
    const parsedData = JSON.parse(data);
    
    if (parsedData && parsedData.data) {
      return parsedData.data;
    }
    return parsedData; // Fallback por seguridad
  } catch (error) {
    return null;
  }
}

  static async saveDictionaryToCache(provider, word, data) {
  if (!word || !data || !DICT_DIRS[provider]) return;
  try {
    await mkdir(DICT_DIRS[provider], { recursive: true });
    const cacheData = {
      word: word.toLowerCase(),
      provider: provider,
      data: data
    };
    const hash = crypto.createHash("sha256").update(word.toLowerCase()).digest("hex");
    const cachePath = path.join(DICT_DIRS[provider], `${hash}.json`);
    await writeFile(cachePath, JSON.stringify(cacheData, null, 2), "utf8");
  } catch (error) {
    console.error(`Error guardando en la capa de caché de diccionario (${provider}):`, error);
  }
}

  static async getAndCacheThumbnail(videoUrl, thumbnailUrl) {
  if (!videoUrl || !thumbnailUrl) return thumbnailUrl;
  try {
    await mkdir(CACHE_THUMBNAIL_DIR, { recursive: true });
    const hash = crypto.createHash("sha256").update(videoUrl).digest("hex");
    
    const extMatch = thumbnailUrl.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const filename = `${hash}.${safeExt}`;
    const cachePath = path.join(CACHE_THUMBNAIL_DIR, filename);

    try {
      await readFile(cachePath);
      return `/thumbnails/${filename}`; // Retorna ruta local si ya existe
    } catch (e) {}

    const response = await fetch(thumbnailUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    if (!response.ok) return thumbnailUrl;
    
    const buffer = await response.buffer();
    await writeFile(cachePath, buffer);
    return `/thumbnails/${filename}`;
  } catch (error) {
    console.error("Error guardando miniatura en caché:", error);
    return thumbnailUrl; // En caso de fallo, devuelve la URL original como respaldo
  }
}
}

// Inicializar la limpieza de caché automáticamente
CacheManager.cleanOldCache();