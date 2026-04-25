import express from "express";
import { DictionaryController } from "../controllers/DictionaryController.js";

const router = express.Router();

router.post("/dictionary", DictionaryController.getGeminiDictionary);
router.post("/lingva", DictionaryController.getLingvaDictionary);
router.post("/freedictionary", DictionaryController.getFreeDictionary);
router.post("/mymemory", DictionaryController.getMyMemoryDictionary);

export default router;