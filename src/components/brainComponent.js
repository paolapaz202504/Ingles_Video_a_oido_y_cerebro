export function setupBrainComponent() {
  const keywordsBox = document.getElementById("keywords");
  const summaryBox = document.getElementById("summary");
  const analysisBox = document.getElementById("analysis");

  function showAnalysis(analysis) {
    const { keywords, summary, raw, colloquial_expressions } = analysis;
    // Formatear de forma amigable si Gemini devuelve un arreglo u objeto en lugar de texto
    const formattedKeywords = Array.isArray(keywords) ? keywords.join(", ") : keywords;
    
    let formattedRaw = raw;
    if (typeof raw === "object" && raw !== null) {
      const numSpeakers = raw.numberOfSpeakers || raw.numero_de_personas || raw.numero_personas;
      const dialogue = raw.dialogueBySpeaker || raw.dialogo_por_hablante || raw.dialogo;

      if (numSpeakers !== undefined || dialogue) {
        formattedRaw = "";
        if (numSpeakers !== undefined) {
          formattedRaw += `<p>👥 <strong>Número de hablantes:</strong> ${numSpeakers}</p>`;
        }
        if (dialogue && typeof dialogue === "object") {
          for (const [speaker, text] of Object.entries(dialogue)) {
            formattedRaw += `<p>🗣️ <strong>${speaker}:</strong><br/>"${text}"</p>`;
          }
        }
      } else {
        formattedRaw = "";
        // Fallback por si la IA devuelve una estructura no esperada
        const fallbackText = Object.entries(raw)
          .filter(([key]) => !['transcription', 'phasal_verbs', 'keywords', 'summary', 'summary_es', 'colloquial_expressions'].includes(key))
          .map(([key, value]) => `• <strong>${key}:</strong> ${typeof value === "object" ? JSON.stringify(value) : value}`)
          .join("<br><br>");
        if (fallbackText) formattedRaw += `<p>${fallbackText}</p>`;
      }

    } else {
      formattedRaw = raw ? `<p>${raw}</p>` : "";
    }

    // Renderizar Expresiones Coloquiales (Asegurado fuera del condicional de texto crudo)
    if (colloquial_expressions && Array.isArray(colloquial_expressions) && colloquial_expressions.length > 0) {
      formattedRaw += `<h3 style="margin-top: 2rem; color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 0.5rem;">🗣️ Expresiones Coloquiales / Marcadores</h3>`;
      formattedRaw += `<div style="display: grid; gap: 1rem; margin-top: 1rem;">`;
      colloquial_expressions.forEach(exp => {
        const examplesHtml = (exp.examples || []).map(ex => `<li style="margin-bottom: 0.5rem;"><em>"${ex.english}"</em> <br/> <span style="color:#64748B;">${ex.spanish}</span></li>`).join('');
        formattedRaw += `
          <div style="background: #F8FAFC; border-left: 4px solid #F59E0B; padding: 1rem; border-radius: 8px; border: 1px solid #E2E8F0;">
            <h4 style="margin: 0 0 0.5rem 0; color: #D97706; font-size: 1.1rem;">${exp.expression}</h4>
            <p style="margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #334155;"><strong>Significado y uso:</strong> ${exp.meaning_and_usage}</p>
            <p style="margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #334155;"><strong>Traducción:</strong> ${exp.spanish_translation}</p>
            <p style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #334155;"><strong>En el contexto actual:</strong> ${exp.contextual_meaning}</p>
            <div style="background: #FFFFFF; padding: 0.75rem; border-radius: 6px; border: 1px dashed #CBD5E1;">
              <strong style="font-size: 0.85rem; color: #1E293B;">Ejemplos:</strong>
              <ul style="margin: 0.25rem 0 0 0; padding-left: 1.2rem; font-size: 0.85rem; color: #475569;">
                ${examplesHtml}
              </ul>
            </div>
          </div>
        `;
      });
      formattedRaw += `</div>`;
    }

    keywordsBox.textContent = formattedKeywords || "No se generaron palabras clave.";
    summaryBox.textContent = summary || "No se generó resumen.";

    // Si el contenedor ya tiene los verbos frasales renderizados, sumamos el contenido debajo.
    if (analysisBox.innerHTML && analysisBox.innerHTML.trim() !== "") {
      if (!analysisBox.innerHTML.includes(formattedRaw)) {
         analysisBox.innerHTML += formattedRaw;
      }
    } else {
      analysisBox.innerHTML = formattedRaw || "No se encontró información adicional.";
    }
  }

  return {
    showAnalysis
  };
}
