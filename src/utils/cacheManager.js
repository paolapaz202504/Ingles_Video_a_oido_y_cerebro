import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { Storage } from "@google-cloud/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "../../"); // Ruta a la carpeta raíz del proyecto

let storage = null;
let bucket = null;
let bucketName = null;
let storageInitPromise = null;

async function initializeStorageApi() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn("⚠️ Falta la variable GOOGLE_APPLICATION_CREDENTIALS en .env.");
    throw new Error("Faltan variables de entorno para Google Cloud Storage");
  }

  storage = new Storage({
    keyFilename: path.join(ROOT_DIR, process.env.GOOGLE_APPLICATION_CREDENTIALS)
  });
  bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "viooido_cache_bucket";
  bucket = storage.bucket(bucketName);
  
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      console.warn(`⚠️ El bucket '${bucketName}' no existe.`);
    } else {
      console.log(`✅ Google Cloud Storage conectado exitosamente. Bucket: ${bucketName}`);
    }
  } catch (error) {
    console.error("❌ Error verificando el bucket. Revisa los permisos de IAM:", error.message);
  }
}

function getStorage() {
  if (!storageInitPromise) {
    storageInitPromise = initializeStorageApi().catch((error) => {
      console.error("❌ Error inicializando GCS:", error.message);
      storageInitPromise = null; 
    });
  }
  return storageInitPromise;
}

async function readJsonFromBucket(filePath) {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [contents] = await file.download();
    return JSON.parse(contents.toString('utf8'));
  } catch (e) { 
    return null; 
  }
}

async function saveJsonToBucket(filePath, jsonData) {
  if (!bucket) return;
  try {
    const file = bucket.file(filePath);
    await file.save(JSON.stringify(jsonData, null, 2), {
      contentType: 'application/json',
      resumable: false
    });
  } catch (e) {
    console.error(`Error guardando JSON en Cloud Storage (${filePath}):`, e.message);
  }
}

async function saveBufferToBucket(filePath, fileBuffer, mimeType) {
  if (!bucket) return false;
  try {
    const file = bucket.file(filePath);
    await file.save(fileBuffer, {
      contentType: mimeType,
      resumable: false
    });
    return true;
  } catch (e) {
    console.error(`Error guardando Buffer en Cloud Storage (${filePath}):`, e.message);
    return false;
  }
}

export class CacheManager {
  static async cleanOldCache() {
    // En Google Cloud Storage la limpieza la maneja automáticamente
    // las políticas de ciclo de vida del Bucket (Lifecycle Rules).
  }

  static async getCachedAnalysis(url) {
    if (!url) return null;
    await getStorage();
    if (bucket) {
      const hash = crypto.createHash("sha256").update(url).digest("hex");
      const filePath = `prod/gemini_analysis/${hash}.json`;
      const parsedData = await readJsonFromBucket(filePath);
      if (parsedData && parsedData.analysis) return parsedData.analysis;
    }
    return null;
  }

  static async saveAnalysisToCache(url, prompt, analysis) {
    if (!url || !analysis) return;
    await getStorage();
    if (bucket) {
      const hash = crypto.createHash("sha256").update(url).digest("hex");
      const filePath = `prod/gemini_analysis/${hash}.json`;
      const cacheData = { videoUrl: url, prompt: prompt, analysis: analysis };
      await saveJsonToBucket(filePath, cacheData);
    }
  }

  static async getCachedDictionary(provider, word) {
    if (!word || !provider) return null;
    await getStorage();
    if (bucket) {
      const hash = crypto.createHash("sha256").update(word.toLowerCase()).digest("hex");
      const filePath = `prod/dictionary/${provider}/${hash}.json`;
      const parsedData = await readJsonFromBucket(filePath);
      if (parsedData && parsedData.data) return parsedData.data;
      return parsedData;
    }
    return null;
  }

  static async saveDictionaryToCache(provider, word, data) {
    if (!word || !data || !provider) return;
    await getStorage();
    if (bucket) {
      const hash = crypto.createHash("sha256").update(word.toLowerCase()).digest("hex");
      const filePath = `prod/dictionary/${provider}/${hash}.json`;
      const cacheData = { word: word.toLowerCase(), provider: provider, data: data };
      await saveJsonToBucket(filePath, cacheData);
    }
  }

  static async getAllAnalyses() {
    await getStorage();
    if (!bucket) return [];
    try {
      const [files] = await bucket.getFiles({ prefix: 'prod/gemini_analysis/' });
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      if (jsonFiles.length === 0) return [];
      
      const analysesPromises = jsonFiles.map(async (file) => {
        try {
          const [contents] = await file.download();
          const fileContent = JSON.parse(contents.toString('utf8'));
          if (fileContent.analysis && fileContent.analysis.videoUrl) {
            return fileContent.analysis;
          }
          if (fileContent.videoUrl && fileContent.transcription) {
            return fileContent;
          }
        } catch (e) {}
        return null;
      });
      const results = await Promise.all(analysesPromises);
      return results.filter(analysis => analysis != null);
    } catch (error) {
      console.error("Error obteniendo análisis de GCS:", error);
      return [];
    }
  }

  static async getAndCacheThumbnail(videoUrl, thumbnailUrl) {
    if (!videoUrl || !thumbnailUrl) return thumbnailUrl;
    try {
      const hash = crypto.createHash("sha256").update(videoUrl).digest("hex");
      const extMatch = thumbnailUrl.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const filename = `${hash}.${safeExt}`;

      await getStorage();
      if (!bucket) return thumbnailUrl;

      const filePath = `prod/gemini_analysis_thumbnail/${filename}`;
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (!exists) {
        const response = await fetch(thumbnailUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        if (!response.ok) return thumbnailUrl;
        
        const buffer = Buffer.from(await response.arrayBuffer()); // Corrección del warning
        const mimeType = `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`;
        await saveBufferToBucket(filePath, buffer, mimeType);
      }

      return `/thumbnails/${filename}`;
    } catch (error) {
      console.error("Error guardando miniatura en GCS:", error);
      return thumbnailUrl;
    }
  }

  static async streamThumbnailByName(filename, res) {
    await getStorage();
    if (!bucket) return res.status(404).send("Not found");

    try {
      const filePath = `prod/gemini_analysis_thumbnail/${filename}`;
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) return res.status(404).send("File not found in Storage");

      const [metadata] = await file.getMetadata();
      res.setHeader('Content-Type', metadata.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      file.createReadStream()
        .on('error', (err) => res.status(500).send("Error streaming image"))
        .pipe(res);
    } catch (e) {
      res.status(404).send("Error streaming from Storage");
    }
  }
}

// Inicializar la limpieza de caché automáticamente
CacheManager.cleanOldCache();