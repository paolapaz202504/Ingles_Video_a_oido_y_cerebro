import { handleMyMemoryTranslation } from "./components/myMemoryDict.js";
import { handleLingvaTranslation } from "./components/lingvaDict.js";

export function setupDictionary(auth) {
  const modal = document.getElementById("dictionary-modal"), resEl = document.getElementById("dict-results"), titleEl = document.getElementById("dict-word-title");
  let currWord = "";

  document.getElementById("close-modal").addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

  const openDictionaryForSelection = () => {
    let word = "";
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      word = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
    } else {
      word = window.getSelection().toString();
    }
    word = word.replace(/^[^\wáéíóúñ]+|[^\wáéíóúñ]+$/g, '').trim();
    if (word.length < 2) return;
    currWord = word; titleEl.textContent = word;
    resEl.innerHTML = `<p style="text-align:center; color:#64748B;">Selecciona un diccionario.</p>`;
    modal.classList.remove("hidden");
  };

  // Escuchar el doble clic en toda la página
  document.addEventListener("dblclick", openDictionaryForSelection);

  document.getElementById("btn-dict-gemini").addEventListener("click", async () => {
    if (!auth.getApiKey()) return alert("No es posible buscar. Falta tu API Key de Gemini.");
    resEl.innerHTML = `<p style="text-align:center; color:#64748B;">Buscando en Gemini...</p>`;
    try {
      const selectedModel = localStorage.getItem("gemini_dict_model") || "auto";
      const res = await fetch("/api/dictionary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: currWord, apiKey: auth.getApiKey(), model: selectedModel }) });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al procesar la solicitud en Gemini.");
      }
      
      const responseData = await res.json();
      // Extraemos la información manejando tanto la estructura directa como la anidada en caché
      const data = responseData.data ? responseData.data : responseData;
      
      let html = `<div class="dict-header"><button id="play-word" class="play-audio-btn">🔊</button><span style="font-weight:bold; margin-left:10px;">${data.phonetic || ""}</span></div><p style="font-size: 1.1rem;">${(data.translations || []).join(", ")}</p>`;
      for (const [cat, det] of Object.entries(data.grammatical_categories || {})) {
        if (det && det.definition && det.definition !== "N/A") {
          html += `<div class="dict-part"><h4 style="text-transform: capitalize; margin-top:0;">${cat}</h4><p>${det.definition}</p>`;
          
          if (det.tenses && typeof det.tenses === 'object') {
            const tensesHtml = Object.entries(det.tenses)
              .filter(([_, val]) => val)
              .map(([k, v]) => `<span style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; margin-right: 4px; display: inline-block; margin-bottom: 4px;"><strong style="text-transform: capitalize;">${k.replace('_', ' ')}:</strong> ${v}</span>`)
              .join('');
            if (tensesHtml) html += `<div style="margin-bottom: 0.5rem;">${tensesHtml}</div>`;
          }
          
          if (det.synonyms && det.synonyms.length) html += `<p><strong style="color:#14B8A6;">Sinónimos:</strong> ${det.synonyms.join(", ")}</p>`;
          if (det.examples && det.examples.length) {
            html += `<div style="margin-top: 0.5rem;"><strong style="color:#6366F1;">Ejemplos:</strong><ul style="margin-top: 0.2rem; margin-bottom: 0; padding-left: 1.2rem;"><li>${det.examples.join("</li><li>")}</li></ul></div>`;
          }
          html += `</div>`;
        }
      }
      resEl.innerHTML = html;
      document.getElementById("play-word").addEventListener("click", () => { const u = new SpeechSynthesisUtterance(currWord); u.lang='en-US'; window.speechSynthesis.speak(u); });
    } catch (e) { 
      resEl.innerHTML = `<p style="color:#F43F5E; text-align:center;">${e.message}</p>`; 
    }
  });

  document.getElementById("btn-dict-free").addEventListener("click", async () => {
    resEl.innerHTML = `<p style="text-align:center; color:#64748B;">Buscando en Free Dictionary...</p>`;
    try {
      const res = await fetch("/api/freedictionary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: currWord }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      let html = `<div class="dict-header"><button id="play-word" class="play-audio-btn">🔊</button></div>`;
      data.forEach(e => e.meanings.forEach(m => {
        html += `<div class="dict-part"><h4 style="margin-top:0;">${m.partOfSpeech}</h4><ul>${m.definitions.map(d => `<li>${d.definition}</li>`).join("")}</ul></div>`;
      }));
      resEl.innerHTML = html;
      document.getElementById("play-word").addEventListener("click", () => { const u = new SpeechSynthesisUtterance(currWord); u.lang='en-US'; window.speechSynthesis.speak(u); });
    } catch (e) { resEl.innerHTML = `<p style="color:#F43F5E;">Error en Free Dictionary.</p>`; }
  });

  document.getElementById("btn-dict-mymemory").addEventListener("click", () => handleMyMemoryTranslation(currWord, resEl));
  document.getElementById("btn-dict-lingva").addEventListener("click", () => handleLingvaTranslation(currWord, resEl));
}