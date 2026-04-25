export async function handleLingvaTranslation(word, container) {
  container.innerHTML = `<p style="text-align:center; color:#94a3b8;">Traduciendo con Lingva...</p>`;
  
  try {
    // Consultamos a través de nuestro servidor para evitar bloqueos por CORS
    const response = await fetch("/api/lingva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word })
    });
    if (!response.ok) throw new Error("Error en la petición a Lingva");
    
    const data = await response.json();
    console.log("Lingva API response:", data);
    
    let html = `
      <div class="dict-header">
        <span class="dict-phonetic" style="margin-bottom:0; color: #3b82f6;">Traductor Lingva</span>
      </div>
      <div class="dict-part">
        <h4>Traducción al Español</h4>
        <ul>
          <li style="font-size: 1.1rem; color: #64748B;">${data.translation}</li>
        </ul>
      </div>
    `;

    // Si la API proporciona definiciones adicionales opcionales, las renderizamos
    if (data.info && data.info.definitions && data.info.definitions.length > 0) {
      html += `<div class="dict-part"><h4>Definiciones extra</h4><ul>`;
      data.info.definitions.forEach(def => {
        if (def.list && def.list.length > 0) {
          def.list.forEach(item => {
            html += `<li>${item.definition}</li>`;
          });
        }
      });
      html += `</ul></div>`;
    }
    
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; text-align:center;">No se pudo traducir la palabra con Lingva.</p>`;
  }
}