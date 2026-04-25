import fetch from "node-fetch";
import { GeminiModel } from "./GeminiModel.js";

export class DictionaryModel {
  static async fetchFromLingva(word) {
    const response = await fetch(`https://lingva.ml/api/v1/en/es/${encodeURIComponent(word)}`);
    if (!response.ok) throw new Error("Error en la respuesta de Lingva");
    return await response.json();
  }

  static async fetchFromFreeDictionary(word) {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) throw new Error("No encontrado");
    return await response.json();
  }

  static async fetchFromMyMemory(word) {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|es`);
    if (!response.ok) throw new Error("Error en MyMemory");
    return await response.json();
  }

  static async fetchFromGemini(word, apiKey, selectedModel = "auto") {
    if (!apiKey) throw new Error("Falta la API Key proporcionada por el usuario.");
    const prompt = `Actúa como un diccionario avanzado de Inglés. Analiza la palabra en inglés: "${word}".
      Devuelve estrictamente un objeto JSON con esta estructura en idioma inglés:
      {
        "word": "general description of the word",
        "phonetic": "transcripción fonética (ej. /wɜːrd/)",
        "translations": ["traducción principal 1", "traducción principal 2"],
        "grammatical_categories": {
          "noun": { "definition": "noun definition", "synonyms": ["synonym 1", "synonym 2"], "examples": ["example 1", "example 2"] },
          "verb": {
            "definition": "verb definition ",
            "tenses":"present: verb in present, past: verb in past, future: verb in future, past participle: verb in past participle, gerund: verb in gerund",
            "synonyms": ["synonym 1", "synonym 2"],
            "examples": ["[past] example in past", "[present] example in present", "[future] example in future", "[past_participle] example in past participle", "[gerund] example in gerund"]
          },
          "adjective": { "definition": "adjective definition", "synonyms": ["synonym 1", "synonym 2"], "examples": ["example 1", "example 2"] },
          "adverb": { "definition": "adverb definition", "synonyms": ["synonym 1", "synonym 2"], "examples": ["example 1", "example 2"] },
          "pronoun": { "definition": "pronoun definition", "synonyms": ["synonym 1", "synonym 2"], "examples": ["example 1", "example 2"] },
          "preposition": { "definition": "preposition definition", "synonyms": ["synonym 1", "synonym 2"], "examples": ["example 1", "example 2"] },
          "conjunction": { "definition": "conjunction definition", "synonyms": ["synonym 1", "synonym 2"], "examples": ["example 1", "example 2"] },
          "interjection": { "definition": "interjection definition", "synonyms": ["synonym 1", "synonym 2"], "examples": ["example 1", "example 2"] }
        }
      }`;

    let models = [];
    if (selectedModel && selectedModel !== "auto") {
      models = [selectedModel];
    } else {
      models = await GeminiModel.getBestDictionaryModels(apiKey);
    }

    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } })
        });

        if (response.ok) {
          const data = await response.json();
          let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          console.info(`Diccionario: Funcionó con el modelo ${model}. Palabra: ${word}`);
          return JSON.parse(text);
        } else {
          console.warn(`Diccionario: El modelo ${model} falló (${response.status}).`);
        }
      } catch (err) {
        console.warn(`Diccionario: Fallo con el modelo ${model}. Error: ${err.message}`);
      }
    } throw new Error(`Utilice otra configuración para obtener el diccionario de la palabra ${word}`);
  }
}