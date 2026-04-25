export function setupEarComponent() {
  const transcriptBox = document.getElementById("transcript");

  let segmentsData = [];

  function showTranscript(data) {
    transcriptBox.innerHTML = "";
    
    if (!data) {
      transcriptBox.textContent = "No se encontró transcripción.";
      return;
    }

    if (typeof data === "string") {
      transcriptBox.textContent = data;
      return;
    }

    // Validar que existan segmentos y no sea un arreglo vacío
    if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
      segmentsData = data.segments;
      console.log("=== Segmentos temporales recibidos del servidor ===", segmentsData);
      
      let renderedSomething = false;

      segmentsData.forEach(seg => {
        // Soportar distintos formatos que puede devolver Python
        const textContent = seg.text !== undefined ? seg.text : (seg.word || "");
        if (textContent && textContent !== "undefined") {
          const span = document.createElement("span");
          
          if (seg.speaker) {
            const speakerTag = document.createElement("strong");
            speakerTag.style.color = "#94a3b8"; // Gris claro para distinguir al hablante
            speakerTag.textContent = `[${seg.speaker}] `;
            span.appendChild(speakerTag);
          }
          span.appendChild(document.createTextNode(textContent + " "));
          
          span.dataset.start = seg.start !== undefined ? seg.start : 0;
          span.dataset.end = seg.end !== undefined ? seg.end : (seg.start !== undefined ? seg.start + 2 : 0);
          span.className = "transcript-segment";
          span.style.color = "#64748b"; // Gris oscuro para el texto futuro
          span.style.transition = "color 0.2s, font-weight 0.2s, text-shadow 0.2s";
          transcriptBox.appendChild(span);
          renderedSomething = true;
        }
      });

      // Fallback si resulta que los segmentos estaban mal formados o vacíos de texto
      if (!renderedSomething) {
        segmentsData = [];
        transcriptBox.textContent = data.text || "No se encontró transcripción.";
      }
    } else {
      segmentsData = [];
      transcriptBox.textContent = data.text || "No se encontró transcripción.";
    }
  }

  function updateTime(currentTime) {
    console.log(`[⏱️ Tiempo actual: ${currentTime.toFixed(2)}s] -> Actualizando resaltado...`);
    console.log(`segmentsData ${segmentsData.length > 0 ? "existe y tiene" : "está vacío o no existe"} ${segmentsData.length} segmentos.`);
    if (!segmentsData.length) return;
    
    const spans = transcriptBox.querySelectorAll(".transcript-segment");
    spans.forEach(span => {
      const start = parseFloat(span.dataset.start);
      const end = parseFloat(span.dataset.end);
      
      // Texto actualmente reproducido (Resaltado intenso)
      if (currentTime >= start && currentTime < end) {
        span.style.color = "#38bdf8"; // Azul cielo
        span.style.textShadow = "0 0 8px rgba(56, 189, 248, 0.5)"; // Sombra azul cielo
        span.fontWeight = "500";
        
        if (!span.dataset.active) {
          span.dataset.active = "true";
          console.log(`[▶️ Reproduciendo ${currentTime.toFixed(2)}s] -> ${span.textContent.trim()}`);
          const scrollPos = span.offsetTop - (transcriptBox.clientHeight / 2) + (span.clientHeight / 2);
          transcriptBox.scrollTo({ top: scrollPos, behavior: "smooth" });
        }
      } 
      // Texto que YA se mencionó (Se queda de color blanco/claro)
      else if (currentTime >= end) {
        span.style.color = "#000000";
        span.style.fontWeight = "normal";
        span.style.textShadow = "none";
        span.dataset.active = "";
      } else {
        // Texto que AÚN NO se menciona (Permanece gris oscuro)
        span.style.color = "#64748b";
        span.style.fontWeight = "normal";
        span.style.textShadow = "none";
        span.dataset.active = "";
      }
    });
  }

  function resetHighlight() {
    const spans = transcriptBox.querySelectorAll(".transcript-segment");
    spans.forEach(span => {
      span.style.color = "#64748b";
      span.style.fontWeight = "normal";
      span.style.textShadow = "none";
      span.dataset.active = "";
    });
    
    // Regresar el scroll al inicio para reiniciar completamente la vista
    transcriptBox.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    showTranscript,
    updateTime,
    resetHighlight
  };
}
