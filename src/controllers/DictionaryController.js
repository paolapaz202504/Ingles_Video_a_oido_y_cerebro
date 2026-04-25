import { DictionaryModel } from "../models/DictionaryModel.js";
import { CacheManager } from "../utils/cacheManager.js";

export class DictionaryController {
    // Función helper interna para envolver las llamadas al diccionario con lógica de caché
    static async _getDictionaryData(provider, fetchFunction, req, res) {
        const { word } = req.body;
        if (!word) {
            return res.status(400).json({ error: "La palabra es requerida." });
        }

        try {
            // 1. Revisar caché
            const cachedData = await CacheManager.getCachedDictionary(provider, word);
            if (cachedData) {
                console.log(`[Caché] Diccionario '${provider}' HIT para: ${word}`);
                return res.json(cachedData);
            }

            console.log(`[API] Diccionario '${provider}' MISS para: ${word}. Consultando...`);
            // 2. Consultar API si no está en caché
            const data = await fetchFunction(word);

            // 3. Guardar en caché
            await CacheManager.saveDictionaryToCache(provider, word, data);

            res.json(data);
        } catch (error) {
            res.status(500).json({ error: `Error al consultar el diccionario (${provider}): ${error.message}` });
        }
    }

    static async getGeminiDictionary(req, res) {
        const { word, apiKey } = req.body;
        if (!word) return res.status(400).json({ error: "La palabra es requerida." });
        if (!apiKey) return res.status(400).json({ error: "La API Key de Gemini es requerida." });

        try {
            const cachedData = await CacheManager.getCachedDictionary('gemini', word);
            if (cachedData) return res.json(cachedData);
            
            const data = await DictionaryModel.fetchFromGemini(word, apiKey);
            await CacheManager.saveDictionaryToCache('gemini', word, data);
            res.json(data);
        } catch (error) {
             res.status(500).json({ error: `Error al consultar el diccionario (gemini): ${error.message}` });
        }
    }

    static async getFreeDictionary(req, res) {
        await DictionaryController._getDictionaryData('freeDictionary', DictionaryModel.fetchFromFreeDictionary, req, res);
    }

    static async getMyMemoryDictionary(req, res) {
        await DictionaryController._getDictionaryData('myMemory', DictionaryModel.fetchFromMyMemory, req, res);
    }

    static async getLingvaDictionary(req, res) {
        await DictionaryController._getDictionaryData('lingva', DictionaryModel.fetchFromLingva, req, res);
    }
}