export async function handleMyMemoryTranslation(word, container) {
  container.innerHTML = `<p style="text-align:center; color:#94a3b8;">Buscando en MyMemory...</p>`;
  
  try {
    const response = await fetch("/api/mymemory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word })
    });
    if (!response.ok) throw new Error("Error en el servidor");
    
    const data = await response.json();
    
    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || "No encontrado");
    }

    const translatedText = data.responseData.translatedText;

    let html = `
      <div class="dict-header">
        <button id="play-word" class="play-audio-btn" title="Escuchar pronunciación original">🔊</button>
      </div>
      <div class="dict-translations" style="color: #f59e0b; font-size: 1.4rem;">${translatedText}</div>
    `;

    // Filtrar traducciones alternativas si existen
    if (data.matches && data.matches.length > 0) {
      const alternatives = data.matches
        .map(m => m.translation)
        .filter(t => t.toLowerCase() !== translatedText.toLowerCase());
      
      const uniqueAlternatives = [...new Set(alternatives)].slice(0, 4); // Mostramos hasta 4 distintas
      if (uniqueAlternatives.length > 0) {
        html += `<div class="dict-part"><h4>Otras alternativas</h4><ul>`;
        uniqueAlternatives.forEach(alt => html += `<li>${alt}</li>`);
        html += `</ul></div>`;
      }
    }

    container.innerHTML = html;
    document.getElementById("play-word").addEventListener("click", () => {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    });
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; text-align:center;">No se pudo encontrar la traducción en MyMemory.</p>`;
  }
}