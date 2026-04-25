import fetch from "node-fetch";

let validGeminiModels = [];

let bestGeminiModel = [
  // la versión más avanzada y de mayor calidad, ideal para análisis profundos y generación de contenido detallado, 
  // aunque puede ser más lenta y consumir más recursos.
  "gemini-3.1-pro-preview", 
  "gemini-3-pro-preview", 
  "gemini-3.1-pro-preview-customtools", 
  "gemini-2.5-pro", 
  "gemini-pro-latest",
  //baja latencia y alta velocidad, ideal para pruebas rápidas y respuestas inmediatas, 
  //calidad de generación ligeramente inferior a los modelos "pro". 
  "gemini-3-flash-preview", 
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

export class GeminiModel {
  static async getValidModels(apiKey) {
    if (validGeminiModels.length > 0) return validGeminiModels;

    if (!apiKey) throw new Error("Falta la API Key proporcionada por el usuario.");
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      
      if (data.models) {
          validGeminiModels = data.models
          .filter(m => m.supportedGenerationMethods.includes("generateContent"))
          .map(m => m.name.replace("models/", ""));

        validGeminiModels.sort((a, b) => {
          const indexA = bestGeminiModel.indexOf(a);
          const indexB = bestGeminiModel.indexOf(b);
          
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;

          if (a.includes("flash") && !b.includes("flash")) return -1;
          if (!a.includes("flash") && b.includes("flash")) return 1;
          return 0;
        });

        console.log("\n=== Modelos disponibles en tu cuenta ===");
        validGeminiModels.forEach(m => console.log(`- ${m}`));
        console.log("========================================\n");

        return validGeminiModels;
      }
    } catch (error) {
      console.error("Error al consultar la lista de modelos:", error);
    }
    return ["gemini-1.5-flash", "gemini-pro"];
  }

  static async analyzeAudioMedia(base64Data, mimeType, videoUrl, videoTitle, videoDescription, apiKey, previousAnalysis = null) {
    if (!apiKey) throw new Error("Falta la API Key proporcionada por el usuario.");

    const promptPhaseA = `Tu objetivo es transcribir y procesar el audio adjunto del video: ${videoUrl || 'Desconocida'}
  
                    PASO 1: Transcripción Exhaustiva y Sincronización (NIVEL PROFESIONAL)
                    Actúa como un experto en subtitulaje (Closed Captioning) y transcripción verbatim. 
                    Transcribe el audio EN SU TOTALIDAD. No omitas ni una sola palabra, muletilla o pausa.
                    
                    REGLAS DE SINCRONIZACIÓN Y SEGMENTACIÓN:
                    1. EXACTITUD: Los valores "start" y "end" DEBEN corresponder EXACTAMENTE al momento en que inicia y termina la frase.
                    2. PREVENCIÓN DE DESFASE: Las IAs tienden a perder la cuenta de los segundos después del minuto 2. Presta extrema atención al cronómetro real del audio durante todo el archivo. Recalibra tus tiempos constantemente.
                    3. FORMATO DE TIEMPO ESTRICTO: Utiliza estrictamente el formato "MM:SS.ms" (ej. "02:11.5") para "start" y "end". Usar este formato tipo reloj es OBLIGATORIO para evitar desfases.
                    4. CORTE NATURAL: Corta los segmentos ÚNICAMENTE cuando haya una pausa natural en la respiración, un punto, una coma o un cambio de hablante. Cada segmento debe durar entre 2 y 6 segundos.
                    5. FIDELIDAD ESTRICTA: Escribe ÚNICAMENTE las palabras que suenan dentro de ese lapso de tiempo.

                    PASO 2: Formato de salida
                    Devuelve estrictamente un objeto JSON con la siguiente estructura exacta:
                    {
                      "videoUrl": "",  
                      "transcription": {
                        "segments": [
                          { "speaker": "Speaker 1", "start": "00:00.0", "end": "00:04.5", "text": "texto del primer segmento..." },
                          { "speaker": "Speaker 2", "start": "00:04.5", "end": "00:09.0", "text": "texto del segundo segmento..." }
                        ]
                      }
                    }`;

    const models = await this.getValidModels(apiKey);
    let lastError = null;
    let parsedDataA = null;
    let activeModelA = null;
    let phases = previousAnalysis?.phases || [];

    console.log("==============================================================================");
    console.log(" INICIANDO FASE A: Transcripción Exhaustiva Completa (Audio -> JSON)");
    console.log("==============================================================================");

    if (phases.includes("A") && previousAnalysis?.transcription) {
      console.log("   ⏭️ [Saltando] La Fase A ya se encuentra completada en el caché.");
      parsedDataA = previousAnalysis;
      activeModelA = models[0]; // Modelo por defecto para usar en las siguientes fases
    } else {
      if (!base64Data) throw new Error("El audio no fue procesado pero es requerido para la Fase A.");
      for (const model of models) {
        if (parsedDataA) break;
        for (let attempt = 1; attempt <= 2; attempt++) {
          console.log(`-> Fase A - Modelo: ${model} (Intento ${attempt}/2)...`);
          try {
            const responseA = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: promptPhaseA }, { inlineData: { mimeType: mimeType, data: base64Data } }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: "application/json" } })
            });
            
            if (!responseA.ok) throw new Error(`HTTP ${responseA.status}`);
            const dataA = await responseA.json();
            const messageA = dataA?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            
            // Extracción segura del JSON mitigando respuestas con texto adicional
            let parsedText = messageA.replace(/```json/gi, "").replace(/```/g, "").trim();
            const jsonStart = parsedText.indexOf('{');
            const arrayStart = parsedText.indexOf('[');
            const firstChar = jsonStart !== -1 && arrayStart !== -1 ? Math.min(jsonStart, arrayStart) : Math.max(jsonStart, arrayStart);
            const lastChar = Math.max(parsedText.lastIndexOf('}'), parsedText.lastIndexOf(']'));
            if (firstChar !== -1 && lastChar !== -1) parsedText = parsedText.substring(firstChar, lastChar + 1);
            
            parsedDataA = JSON.parse(parsedText);
            
            // Auto-correcciones súper robustas de estructura
            if (parsedDataA.data && parsedDataA.data.transcription) parsedDataA = parsedDataA.data;
            if (Array.isArray(parsedDataA)) parsedDataA = { transcription: { segments: parsedDataA } };
            if (parsedDataA.transcription && Array.isArray(parsedDataA.transcription)) parsedDataA.transcription = { segments: parsedDataA.transcription };
            if (!parsedDataA.transcription && parsedDataA.segments) parsedDataA.transcription = { segments: parsedDataA.segments };
            
            if (!parsedDataA.transcription || !Array.isArray(parsedDataA.transcription.segments)) {
              console.log(`\n❌ JSON Inválido devuelto por Fase A:\n${messageA.substring(0, 300)}...\n`);
              throw new Error("Faltan campos críticos en Fase A (no se encontró transcription.segments).");
            }
            
            console.log(`   ✅ [Éxito Fase A] Metadatos y Transcripción obtenidos con ${model}.`);
            activeModelA = model;
            if (!phases.includes("A")) phases.push("A");
            break;
          } catch (err) {
            lastError = err;
            console.log(`   ❌ [Error Fase A]: ${err.message}`);
          }
        }
      }
    }

    if (!parsedDataA) {
      throw lastError || new Error("Todos los modelos fallaron en la Fase A (Transcripción).");
    }

    console.log("\n==============================================================================");
    console.log(" INICIANDO FASE B: Análisis Lingüístico y Resúmenes (Texto -> JSON)");
    console.log("==============================================================================");

    let parsedDataB = null;
    let activeModelB = null;

    if (phases.includes("B") && (previousAnalysis?.verbs || previousAnalysis?.phasal_verbs)) {
      console.log("   ⏭️ [Saltando] La Fase B ya se encuentra completada en el caché.");
      parsedDataB = previousAnalysis;
      activeModelB = activeModelA;
    } else {
      const promptPhaseB = `Actúa como un lingüista especializado en dialectos urbanos y lenguaje informal. 
                            Basándote estrictamente en la siguiente transcripción en formato JSON extraída del video:\n\n
                            ${JSON.stringify(parsedDataA.transcription)}\n\n
                     
                            PASO 1: Metadatos Básicos
                            Analiza el título: "${videoTitle || 'No disponible'}" y descripción: "${videoDescription || 'No disponible'}".
                            Genera un título descriptivo ("videoTitleGenerated") y una descripción breve ("videoDescriptionGenerated") basados en el audio.

                            PASO 2: Resumen y Palabras Clave
                            a) Extrae palabras clave relevantes en inglés con su traducción ("keywords").
                            b) Crea un resumen del video en inglés ("summary") de máximo 40 palabras.
                            c) Crea un resumen del video en español ("summary_es") de máximo 40 palabras.
                
                            PASO 3: Análisis Lingüístico Exhaustivo
                            Identifica y extrae TODOS los elementos del lenguaje coloquial, sin omitir ninguno por ser común:
                            a) Phrasal Verbs: Incluye verbos de movimiento y estado (ej. 'pull up', 'have over', 'go on').
                            b) Marcadores de Reporte: Captura expresiones como 'I'm like' / 'He's like' explicando que se usan para introducir una cita o pensamiento (traducción: 'Yo estaba como...' / 'Yo le dije...').
                            c) Expresiones de Intensidad: Captura modificadores como 'so', 'just', o 'oh my god' si aportan tono emocional.
                            d) Slang y Relleno: Identifica 'filler words' que tengan una función social en la anécdota.
                            e) Importante: Si una palabra actúa como parte de un phrasal verb (ej. 'over' en 'have people over'), NO la ignores; desglósala en la sección correspondiente.
                            f) Verbos: Extrae los verbos principales utilizados en la transcripción, conjugándolos y explicando su significado.
                            
                            Nota: los phrasal verb deben guardarse en la formato JSON de salida denominada "phasal_verbs"
                              y los Marcadores de Reporte, Expresiones de Intensidad y Slang y Relleno deben guardarse en la sección "colloquial_expressions". 
                              No mezcles ambos tipos de elementos.  
                          
                            PASO 4: Verbos.
                            a) Es importante que extraigas como máximo los 6 verbos principales del audio, no solo los que forman parte de los phrasal verbs. 
                            Para cada verbo, debes proporcionar su conjugación en presente, pasado, futuro, gerundio, su significado general y ejemplos de uso en diferentes tiempos verbales. 
                            Esto ayudará a los usuarios a entender mejor el contexto y el uso de cada verbo dentro de la anécdota.  
                            
                            b) En la traducción al español, agrega más de una traducción, ordena este resultado de mayor a menor relevancia de la traducción, 
                            las traducciones más comunes y usadas en el día a día, no te limites a la traducción literal. 
                            Por ejemplo, para el verbo "go", la traducción literal sería "ir", pero en el contexto de una anécdota urbana, 
                            lo más común es que se traduzca como "ir a donde" o "ir hacia dónde".
                            Asegúrate de incluir estas traducciones coloquiales para que los usuarios puedan entender mejor el significado real 
                            del verbo en el contexto de la historia.

                            c) Agrega al menos dos ejemplos de uso para cada verbo, mostrando cómo se conjuga en diferentes tiempos verbales dentro del contexto
                            de la anécdota. 
                            Esto ayudará a los usuarios a comprender mejor cómo se utilizan los verbos en situaciones cotidianas y a mejorar
                            su fluidez en el idioma.
            
                            PASO 5: Formato de salida
                            Devuelve estrictamente un objeto JSON con la siguiente estructura exacta:\n
                            {
                              "videoTitleGenerated": "Generated title based on audio content",
                              "videoDescriptionGenerated": "Generated description based on audio content",
                              "totalTime": "Total time in format MM:SS",
                              "videoTitle":"",
                              "videoDescription":"",
                              "generatedDate":"datetime in format dd/mm/yyyy mm:ss",
                              "category": "Genera una categoría principal (ej. Tecnología, Comedia)",
                              "tags": ["tag1", "tag2", "tag3"],
                              "keywords": "keyword in english (translate keyword in spanish)",
                              "summary": "video summary in english language.",
                              "summary_es": "resumen del video en español.",
                              "verbs": [ { "present": "", "past": "", "future": "", "gerund": "", "meaning": "", "examples": [""], "spanish_translation": "" } ],
                              "phasal_verbs": [ {"phrasal_verb": "", "spanish":"", "meaning": "", "example": ""} ],
                              "colloquial_expressions": [ { "expression": "", "meaning_and_usage": "", "spanish_translation": "", "contextual_meaning": "", "examples": [ { "english": "", "spanish": "" } ] } ]
                            }`;

      const modelsPhaseB = activeModelA ? [activeModelA, ...models.filter(m => m !== activeModelA)] : models;

      for (const model of modelsPhaseB) {
        if (parsedDataB) break;
        for (let attempt = 1; attempt <= 2; attempt++) {
          console.log(`-> Fase B - Modelo: ${model} (Intento ${attempt}/2)...`);
          try {
            const responseB = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: promptPhaseB }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: "application/json" } })
            });
            
            if (!responseB.ok) throw new Error(`HTTP ${responseB.status}`);
            const dataB = await responseB.json();
            const messageB = dataB?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            
            parsedDataB = JSON.parse(messageB.replace(/```json/gi, "").replace(/```/g, "").trim());
            
            console.log(`   ✅ [Éxito Fase B] Análisis Lingüístico completado con ${model}.`);
            activeModelB = model;
            if (!phases.includes("B")) phases.push("B");
            break;
          } catch (err) {
            console.log(`   ❌ [Error Fase B]: ${err.message}`);
          }
        }
      }
    }

    if (!parsedDataB) {
      console.warn("\n⚠️ ADVERTENCIA: La Fase B falló. Se guardará el análisis sin lingüística para no perder la transcripción.");
      parsedDataB = previousAnalysis || { keywords: "", summary: "", summary_es: "", verbs: [], phasal_verbs: [], colloquial_expressions: [] };
    }

    console.log("\n==============================================================================");
    console.log(" INICIANDO FASE C: Generación de Cuestionarios Quizzes (Texto -> JSON)");
    console.log("==============================================================================");

    let parsedDataC = null;
    
    if (phases.includes("C") && previousAnalysis?.quiz?.length > 0) {
      console.log("   ⏭️ [Saltando] La Fase C ya se encuentra completada en el caché.");
      parsedDataC = previousAnalysis;
    } else {
      const promptPhaseC = `Actúa como un experto creador de evaluaciones educativas. 
                            Basándote estrictamente en la siguiente transcripción y vocabulario en formato 
                            JSON:\n\n${JSON.stringify({ transcription: parsedDataA.transcription, vocabulary: parsedDataB })}\n\n
                            PASO 1: Genera DOS cuestionarios de opción múltiple con exactamente 6 posibles respuestas cada pregunta 
                            (1 correcta, 5 incorrectas pero plausibles):\n1. 
                            
                            Cuestionario de Vocabulario ("quiz"): 
                            Genera al menos 15 preguntas centradas EXCLUSIVAMENTE en el vocabulario (verbos, phrasal verbs, marcadores, slang). 
                            No incluyas preguntas sobre la trama aquí.\n
                            
                            2. Cuestionario del Video ("content_quiz"): Genera al menos 15 preguntas referentes a los sucesos, 
                            hechos narrados o la trama de la historia del video.\n
                            
                            Para ambos cuestionarios, indica cuál es la respuesta correcta exacta en el campo 'correctAnswer'.\n\n
                            
                            PASO 2: Formato de salida\n
                            Devuelve estrictamente un objeto JSON con la siguiente estructura exacta:\n
                            {\n  "quiz": [ { "question": "...", "options": ["...", "..."], "correctAnswer": "..." } ],\n  
                            "content_quiz": [ { "question": "...", "options": ["...", "..."], "correctAnswer": "..." } ]\n}`;

      // Intentar Fase C priorizando el modelo que tuvo éxito en la Fase B
      const modelsPhaseC = activeModelB ? [activeModelB, ...models.filter(m => m !== activeModelB)] : models;

      for (const model of modelsPhaseC) {
        if (parsedDataC) break;
        for (let attempt = 1; attempt <= 2; attempt++) {
          console.log(`-> Fase C - Modelo: ${model} (Intento ${attempt}/2)...`);
          try {
            const responseC = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: promptPhaseC }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 8192, responseMimeType: "application/json" } })
            });
            
            if (!responseC.ok) throw new Error(`HTTP ${responseC.status}`);
            const dataC = await responseC.json();
            const messageC = dataC?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            
            parsedDataC = JSON.parse(messageC.replace(/```json/gi, "").replace(/```/g, "").trim());
            if (!parsedDataC.quiz || !parsedDataC.content_quiz) throw new Error("Faltan las matrices de quiz.");
            
            console.log(`   ✅ [Éxito Fase C] Cuestionarios generados con ${model}.`);
            if (!phases.includes("C")) phases.push("C");
            break;
          } catch (err) {
            console.log(`   ❌ [Error Fase C]: ${err.message}`);
          }
        }
      }
    }

    if (!parsedDataC) {
      console.warn("\n⚠️ ADVERTENCIA: La Fase C falló. Se guardará el análisis sin cuestionarios.");
      parsedDataC = previousAnalysis || { quiz: [], content_quiz: [] };
    }

    console.log("\n=== 🔄 Unificando Fases y enviando a caché ===");
    const finalAnalysis = { 
      ...previousAnalysis, // Preservamos metadatos originales que existieran
      ...parsedDataA, 
      ...parsedDataB,
      quiz: Array.isArray(parsedDataC.quiz) ? parsedDataC.quiz : (previousAnalysis?.quiz || []), 
      content_quiz: Array.isArray(parsedDataC.content_quiz) ? parsedDataC.content_quiz : (previousAnalysis?.content_quiz || []),
      phases: phases
    };

    return { raw: JSON.stringify(finalAnalysis), prompt: promptPhaseA, ...finalAnalysis };
  }
}