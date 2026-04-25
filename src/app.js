import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import videoRoutes from "./routes/videoRoutes.js";
import dictionaryRoutes from "./routes/dictionaryRoutes.js";
import { GeminiModel } from "./models/GeminiModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));
app.use("/src", express.static(path.join(__dirname, "../src")));
app.use("/thumbnails", express.static(path.join(__dirname, "../cache/gemini_analysis_thumbnail")));

app.use("/api", videoRoutes);
app.use("/api", dictionaryRoutes);

// Endpoint para obtener la lista de modelos de Gemini para el diccionario
app.post("/api/gemini-models", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key requerida" });
    const models = await GeminiModel.getBestDictionaryModels(apiKey);
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener la lista de modelos de Gemini para la transcripción
app.post("/api/gemini-transcription-models", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key requerida" });
    const models = await GeminiModel.getBestTranscriptionModels(apiKey);
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;