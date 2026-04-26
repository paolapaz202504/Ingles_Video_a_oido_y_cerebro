import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { readdir, readFile, writeFile } from "fs/promises";
import app from "./src/app.js"; // Importamos la app de Express desde su nuevo archivo
import { getGuatemalaDate } from "./src/utils/helpers.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;

// Actualizar JSONs antiguos con la fecha actual para mantener compatibilidad
async function updateExistingCaches() {
  const CACHE_GEMINI_DIR = path.join(__dirname, "cache", "gemini_analysis");
  try {
    const files = await readdir(CACHE_GEMINI_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(CACHE_GEMINI_DIR, file);
        const content = await readFile(filePath, "utf8");
        const parsed = JSON.parse(content);
        if (parsed.analysis && !parsed.analysis.generatedDate) {
          parsed.analysis.generatedDate = getGuatemalaDate();
          await writeFile(filePath, JSON.stringify(parsed, null, 2), "utf8");
        }
      }
    }
  } catch (e) {}
}

updateExistingCaches();

// El servidor ahora escucha la aplicación configurada en app.js
app.listen(port, () => {
  console.log(`🚀 Servidor MVC iniciado correctamente en http://localhost:${port} v.2026.04.25 18:29:00`);
});
