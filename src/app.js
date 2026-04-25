import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import videoRoutes from "./routes/videoRoutes.js";
import dictionaryRoutes from "./routes/dictionaryRoutes.js";

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

export default app;