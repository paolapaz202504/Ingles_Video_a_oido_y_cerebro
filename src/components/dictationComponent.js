export function setupDictationComponent(videoPanel) {
  const playBtn = document.getElementById("dict-play-btn");
  const prevBtn = document.getElementById("dict-prev-btn");
  const nextBtn = document.getElementById("dict-next-btn");
  const segInfo = document.getElementById("dict-segment-info");
  const totalInfo = document.getElementById("dict-total-info");
  const complexitySelect = document.getElementById("dict-complexity");
  const textDisplay = document.getElementById("dict-text-display");
  
  prevBtn.title = "Ant. (Ctrl + A)";
  playBtn.title = "Reproducir (Ctrl + Z)";
  nextBtn.title = "Sig. (Ctrl + S)";

  const segCorrectEl = document.getElementById("dict-seg-correct");
  const segIncorrectEl = document.getElementById("dict-seg-incorrect");
  const globCorrectEl = document.getElementById("dict-glob-correct");
  const globIncorrectEl = document.getElementById("dict-glob-incorrect");

  let segments = [];
  let currentIndex = 0;
  let complexity = 25;
  
  let globCorrect = 0;
  let globIncorrect = 0;
  let segCorrect = 0;
  let segIncorrect = 0;

  let originalText = "";
  let displayedText = "";
  let currentCharIndex = 0;
  let currentAttempts = 0;
  let sessionStats = [];
  let segmentPlayCount = 0;

  // Inyectar control de velocidad dinámicamente junto a la complejidad
  if (complexitySelect && complexitySelect.parentNode && !document.getElementById("dict-speed-container")) {
    let targetParent = complexitySelect.parentNode;
    let targetSibling = complexitySelect.nextSibling;

    // Asegurar que todo el bloque se alinee a la derecha y tenga buen espaciado
    targetParent.style.display = "flex";
    targetParent.style.justifyContent = "flex-end";
    targetParent.style.alignItems = "flex-end";
    targetParent.style.flexWrap = "wrap";
    targetParent.style.gap = "0.75rem";

    // 1. Envolver y ajustar el componente de Complejidad existente para consistencia
    const complexLabel = document.querySelector('label[for="dict-complexity"]');
    if (complexLabel && complexLabel.parentNode === targetParent) {
      const complexContainer = document.createElement("span");
      complexContainer.style.display = "inline-flex";
      complexContainer.style.flexDirection = "column";
      complexContainer.style.alignItems = "flex-end"; // Texto y combo alineados a la derecha
      targetParent.insertBefore(complexContainer, complexLabel);
      complexContainer.appendChild(complexLabel);
      complexContainer.appendChild(complexitySelect);
      complexLabel.style.marginBottom = "0.2rem";
      complexLabel.style.marginRight = "0";
      complexLabel.style.fontSize = "0.75rem";
      complexitySelect.style.fontSize = "0.75rem";
      complexitySelect.style.padding = "0.3rem 1.5rem 0.3rem 0.75rem";
      targetSibling = complexContainer.nextSibling;
    }

    const speedContainer = document.createElement("span");
    speedContainer.id = "dict-speed-container";
    speedContainer.style.display = "inline-flex";
    speedContainer.style.flexDirection = "column";
    speedContainer.style.alignItems = "flex-end";
    speedContainer.innerHTML = `
      <label for="dict-speed" style="font-size: 0.75rem; font-weight: bold; color: #1E293B; margin-bottom: 0.2rem;">Velocidad:</label>
      <select id="dict-speed" class="search-input" style="padding: 0.3rem 1.5rem 0.3rem 0.75rem; width: auto; font-size: 0.75rem;">
        <option value="0.25">0.25x</option>
        <option value="0.5">0.5x</option>
        <option value="0.75">0.75x</option>
        <option value="1" selected>1x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="1.75">1.75x</option>
        <option value="2">2x</option>
        <option value="2.5">2.5x</option>
      </select>`;
    targetParent.insertBefore(speedContainer, targetSibling);
    
    document.getElementById("dict-speed").addEventListener("change", (e) => {
      if (videoPanel && typeof videoPanel.setPlaybackRate === 'function') {
        videoPanel.setPlaybackRate(parseFloat(e.target.value));
      }
      textDisplay.focus();
    });

    // Inyectar el contenedor de Frecuencia (Filtro de audio) y el botón de Info
    const freqContainer = document.createElement("span");
    freqContainer.id = "dict-freq-container";
    freqContainer.style.display = "inline-flex";
    freqContainer.style.flexDirection = "column";
    freqContainer.style.alignItems = "center";
    freqContainer.innerHTML = `
      <label for="dict-freq" style="font-size: 0.75rem; font-weight: bold; color: #1E293B; margin-bottom: 0.2rem;">Filtro de Voz:</label>
      <div style="display: flex; align-items: center; justify-content: flex-end;">
        <select id="dict-freq" class="search-input" style="padding: 0.3rem 1rem 0.3rem 0.5rem; width: auto; font-size: 0.75rem;">
          <option value="normal" selected style="font-size: 0.75rem">Normal</option>
          <option value="intelligibility" style="font-size: 0.75rem">Máxima Inteligibilidad</option>
          <option value="laughs" style="font-size: 0.75rem">Limpieza de Risas</option>
          <option value="consonants" style="font-size: 0.75rem">Resaltar Consonantes</option>
          <option value="hum" style="font-size: 0.75rem">Reducción de Hum/Motor</option>
        </select>
        <button id="btn-freq-info" style="background: none; border: none; cursor: pointer; font-size: 1.0rem; transition: transform 0.2s; padding: 0rem" title="Información sobre filtros">ℹ️</button>
      </div>
    `;
    targetParent.insertBefore(freqContainer, speedContainer.nextSibling);

    document.getElementById("dict-freq").addEventListener("change", (e) => {
      if (videoPanel && typeof videoPanel.setAudioFilter === 'function') {
        videoPanel.setAudioFilter(e.target.value);
      }
      textDisplay.focus();
    });

    document.getElementById("btn-freq-info").addEventListener("click", () => {
      let modal = document.getElementById("freq-info-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "freq-info-modal";
        modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.75); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px);";
        modal.innerHTML = `
          <div class="modal-content" style="width: 90%; max-width: 850px; max-height: 90vh; overflow-y: auto; padding: 2.5rem; position: relative;">
            <button id="close-freq-modal" style="position: absolute; top: 1.5rem; right: 1.5rem; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #64748B;">✖</button>
            <h2 style="margin-top: 0; color: #0F172A; display: flex; align-items: center; gap: 0.75rem; font-size: 1.6rem;">🎛️ Filtros DSP de Frecuencia</h2>
            <p style="color: #475569; margin-bottom: 1.5rem; line-height: 1.6;">Estos filtros utilizan la API Web Audio para ecualizar el sonido de los videos en tiempo real. Están diseñados para limpiar el ruido y aislar acústicamente las frecuencias críticas de la voz humana, ayudando a tu cerebro a captar reducciones fonéticas y palabras enmascaradas.</p>
            
            <div style="overflow-x: auto; border-radius: 12px; border: 2px solid #E2E8F0;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
                <thead>
                  <tr style="background: #F8FAFC; color: #1E293B;">
                    <th style="padding: 14px; border-bottom: 2px solid #E2E8F0;">Objetivo</th>
                    <th style="padding: 14px; border-bottom: 2px solid #E2E8F0;">Rango (Filtro)</th>
                    <th style="padding: 14px; border-bottom: 2px solid #E2E8F0;">Ganancia (Boost)</th>
                    <th style="padding: 14px; border-bottom: 2px solid #E2E8F0;">Razón Técnica</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">Voz Estándar (Normal)</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">80Hz - 8,000Hz</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">Neutro</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">Captura la calidez de los graves y la claridad de los agudos originales.</td></tr>
                  <tr style="background: #F8FAFC;"><td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">Máxima Inteligibilidad</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">300Hz - 3,000Hz</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">+3dB en 1.5kHz</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">Elimina ruidos sordos y resalta el "core" del lenguaje humano.</td></tr>
                  <tr><td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">Limpieza de Risas/Ambiente</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">500Hz - 4,000Hz</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">N/A</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">Las risas tienen mucha energía en los graves (&lt;400Hz). Cortar ahí las aleja de la voz principal.</td></tr>
                  <tr style="background: #F8FAFC;"><td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">Resaltar Consonantes (S, T, P)</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">2,000Hz - 7,000Hz</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">+5dB en 5kHz</td><td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">Las consonantes son ráfagas de frecuencias altas. Vital para distinguir "smile's" de "smile".</td></tr>
                  <tr><td style="padding: 12px; font-weight: bold; color: #0F172A;">Reducción de Hum/Motor</td><td style="padding: 12px;">Corte en 100Hz</td><td style="padding: 12px;">N/A</td><td style="padding: 12px;">Elimina el molesto zumbido eléctrico (60Hz) o de ventiladores de fondo.</td></tr>
                </tbody>
              </table>
            </div>
            <div style="text-align: right; margin-top: 1.5rem;">
              <button id="btn-close-freq-modal" class="ui-btn ui-btn-teal">Entendido</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        
        const closeM = () => modal.style.display = "none";
        document.getElementById("close-freq-modal").addEventListener("click", closeM);
        document.getElementById("btn-close-freq-modal").addEventListener("click", closeM);
        modal.addEventListener("click", (ev) => { if (ev.target === modal) closeM(); });
      } else {
        modal.style.display = "flex";
      }
    });
  }
  
  // Inyectar el contador de reproducciones al lado de "Verificación"
  if (textDisplay && textDisplay.parentNode && !document.getElementById("dict-play-count-badge")) {
    const playCountBadge = document.createElement("span");
    playCountBadge.id = "dict-play-count-badge";
    playCountBadge.style.cssText = "font-size: 0.75rem; background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 12px; font-weight: bold; border: 1px solid #E2E8F0;";
    playCountBadge.innerHTML = `▶️ Reproducciones: <span id="dict-play-count-val" style="color: #0F172A;">0</span>`;
    const label = document.getElementById("label-dict-text-display");
    if (label) {
      // Envolver ambos elementos en un contenedor div flexible bloque para forzar la alineación
      const headerContainer = document.createElement("div");
      headerContainer.style.display = "flex";
      headerContainer.style.justifyContent = "space-between";
      headerContainer.style.alignItems = "center";
      headerContainer.style.width = "100%";
      headerContainer.style.marginBottom = "0.5rem";
      
      label.parentNode.insertBefore(headerContainer, label);
      label.style.marginBottom = "0"; // Quitar margen al label para que no estorbe
      headerContainer.appendChild(label);
      headerContainer.appendChild(playCountBadge);
    } else {
      textDisplay.parentNode.insertBefore(playCountBadge, textDisplay);
    }
  }

  // Inyectar botones de Iniciar Dictado y Ver Resultado debajo del campo de verificación
  if (textDisplay && textDisplay.parentNode && !document.getElementById("dict-action-buttons")) {
    const actionButtonsContainer = document.createElement("div");
    actionButtonsContainer.id = "dict-action-buttons";
    actionButtonsContainer.style.display = "flex";
    actionButtonsContainer.style.justifyContent = "center";
    actionButtonsContainer.style.gap = "1rem";
    actionButtonsContainer.style.marginTop = "1rem";

    const restartBtn = document.createElement("button");
    restartBtn.id = "btn-restart-dictation";
    restartBtn.className = "ui-btn";
    restartBtn.textContent = "INICIAR DICTADO";

    const viewResultsBtn = document.createElement("button");
    viewResultsBtn.id = "btn-view-results";
    viewResultsBtn.className = "ui-btn ui-btn-teal";
    viewResultsBtn.textContent = "VER RESULTADO";

    actionButtonsContainer.appendChild(restartBtn);
    actionButtonsContainer.appendChild(viewResultsBtn);
    
    textDisplay.parentNode.insertBefore(actionButtonsContainer, textDisplay.nextSibling);

    restartBtn.addEventListener("click", () => {
      if (!segments || segments.length === 0) return;
      currentIndex = 0; globCorrect = 0; globIncorrect = 0; sessionStats = [];
      renderSegment();
      textDisplay.focus();
    });

    viewResultsBtn.addEventListener("click", () => {
      if (!segments || segments.length === 0) return;
      showResultsModal();
    });
  }

  function formatTime(seconds) {
    if (seconds === undefined) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updateCounters() {
    segCorrectEl.textContent = segCorrect;
    segIncorrectEl.textContent = segIncorrect;
    globCorrectEl.textContent = globCorrect;
    globIncorrectEl.textContent = globIncorrect;
  }

  function playCurrentSegment() {
    if (!segments[currentIndex]) return;
    const seg = segments[currentIndex];
    videoPanel.playSegment(seg.start || 0, seg.end || 0);
    segmentPlayCount++;
    const playCountVal = document.getElementById("dict-play-count-val");
    if (playCountVal) playCountVal.textContent = segmentPlayCount;
  }

  function handleSegmentComplete() {
    // Retirar la selección (cursor) al terminar
    textDisplay.setSelectionRange(originalText.length, originalText.length);
    
    // Guardar estadísticas del segmento actual en base a su dificultad
    sessionStats[currentIndex] = {
      segment: currentIndex + 1,
      complexity: complexity,
      correct: segCorrect,
      incorrect: segIncorrect,
      accuracy: segCorrect + segIncorrect > 0 ? Math.round((segCorrect / (segCorrect + segIncorrect)) * 100) : 100,
      playCount: segmentPlayCount,
      charCount: originalText.length
    };

    if (currentIndex < segments.length - 1) {
      setTimeout(() => {
        currentIndex++;
        renderSegment();
        playCurrentSegment();
      }, 1000); // 1 segundo de pausa antes de avanzar al siguiente
    } else {
      setTimeout(() => {
        showResultsModal();
      }, 500);
    }
  }

  function showResultsModal() {
    let modal = document.getElementById("dict-results-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "dict-results-modal";
      modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(5px);";
      document.body.appendChild(modal);
    }

    // Generación dinámica del gráfico de barras CSS
    let chartHTML = `<div style="display: flex; align-items: flex-end; justify-content: space-around; height: 150px; margin-top: 1rem; border-bottom: 2px solid #E2E8F0; padding-bottom: 0.5rem; gap: 4px;">`;
    let totalAccuracy = 0;
    let validSegments = 0;
    let totalPlays = 0;
    let totalChars = 0;

    sessionStats.forEach(stat => {
      if (!stat) return;
      validSegments++;
      totalAccuracy += stat.accuracy;
      totalPlays += stat.playCount;
      totalChars += stat.charCount;
      // Asignar colores según el rendimiento (Teal > 80%, Amber > 50%, Rose < 50%)
      const color = stat.accuracy >= 80 ? '#14B8A6' : stat.accuracy >= 50 ? '#F59E0B' : '#F43F5E';
      chartHTML += `
        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; width: 100%; max-width: 40px; height: 100%; position: relative;" title="Reproducciones: ${stat.playCount} | Caracteres: ${stat.charCount}">
          <span style="font-size: 0.65rem; color: #64748B; margin-bottom: 2px; font-weight: 600;">▶️${stat.playCount}</span>
          <span style="font-size: 0.7rem; color: #64748B; margin-bottom: 4px; font-weight: bold;">${stat.accuracy}%</span>
          <div style="width: 100%; background: ${color}; height: ${stat.accuracy}%; border-radius: 4px 4px 0 0; min-height: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
          <span style="font-size: 0.7rem; font-weight: bold; color: #1E293B; margin-top: 6px;">S${stat.segment}</span>
        </div>
      `;
    });
    chartHTML += `</div>`;

    const avgAccuracy = validSegments > 0 ? Math.round(totalAccuracy / validSegments) : 0;
    const avgPlays = validSegments > 0 ? (totalPlays / validSegments).toFixed(1) : 0;
    const playToCharRatio = totalChars > 0 ? totalPlays / totalChars : 0;

    let listeningAnalysis = "";
    if (totalPlays === validSegments) {
      listeningAnalysis = "¡Oído biónico! 🦾 Entendiste todo a la primera reproducción. Tu nivel de comprensión auditiva es sobresaliente.";
    } else if (playToCharRatio < 0.05) {
      listeningAnalysis = "¡Excelente retención! 🧠 Necesitaste muy pocas repeticiones para captar los detalles fonéticos.";
    } else if (playToCharRatio < 0.15) {
      listeningAnalysis = "Buen trabajo. 👍 Estás desarrollando una buena memoria a corto plazo para los sonidos en inglés.";
    } else {
      listeningAnalysis = "Te apoyaste bastante en las repeticiones. 🔁 Sigue practicando; bajar la velocidad te ayudará a captar los sonidos más rápido.";
    }

    modal.innerHTML = `
      <div class="modal-content" style="width: 90%; max-width: 650px; background: #FFFFFF; border-radius: 16px; padding: 2.5rem; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <button id="close-results-modal" style="position: absolute; top: 1.5rem; right: 1.5rem; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #64748B; transition: color 0.2s;">✖</button>
        <h2 style="margin-top: 0; color: #0F172A; display: flex; align-items: center; gap: 0.75rem; font-size: 1.6rem;"><span style="font-size: 2rem;">📈</span> Reporte de Aprendizaje</h2>
        
        <div style="background: #EEF2FF; padding: 1.25rem; border-radius: 12px; border: 1px solid #C7D2FE; margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 0.5rem 0; color: #4F46E5; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">🧠 Análisis de Comprensión Auditiva</h3>
          <p style="margin: 0; color: #312E81; font-size: 0.9rem; line-height: 1.5;">${listeningAnalysis} <br><span style="opacity: 0.8; font-size: 0.85rem;">(Promedio: ${avgPlays} reproducciones por segmento)</span></p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="background: #F8FAFC; padding: 1rem; border-radius: 12px; text-align: center; border: 1px solid #E2E8F0;">
            <div style="font-size: 0.85rem; color: #64748B; font-weight: bold; text-transform: uppercase;">Precisión Global</div>
            <div style="font-size: 2rem; font-weight: 800; color: #0F172A; margin-top: 0.5rem;">${avgAccuracy}%</div>
          </div>
          <div style="background: #F0FDF4; padding: 1rem; border-radius: 12px; text-align: center; border: 1px solid #BBF7D0;">
            <div style="font-size: 0.85rem; color: #166534; font-weight: bold; text-transform: uppercase;">Teclas Correctas</div>
            <div style="font-size: 2rem; font-weight: 800; color: #15803D; margin-top: 0.5rem;">${globCorrect}</div>
          </div>
          <div style="background: #FEF2F2; padding: 1rem; border-radius: 12px; text-align: center; border: 1px solid #FECACA;">
            <div style="font-size: 0.85rem; color: #991B1B; font-weight: bold; text-transform: uppercase;">Errores</div>
            <div style="font-size: 2rem; font-weight: 800; color: #B91C1C; margin-top: 0.5rem;">${globIncorrect}</div>
          </div>
        </div>
        <h3 style="margin: 0 0 1rem 0; color: #1E293B; font-size: 1.1rem;">Rendimiento de Precisión por Segmento</h3>
        <div style="background: #F8FAFC; padding: 1.5rem; border-radius: 12px; border: 1px solid #E2E8F0; overflow-x: auto;">
          ${chartHTML}
        </div>
        <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
          <button id="btn-close-results" class="ui-btn ui-btn-teal" style="padding: 0.75rem 2rem; font-size: 1rem;">Continuar Aprendiendo</button>
        </div>
      </div>
    `;

    modal.style.display = "flex";
    const closeModal = () => modal.style.display = "none";
    document.getElementById("close-results-modal").addEventListener("click", closeModal);
    document.getElementById("btn-close-results").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if(e.target === modal) closeModal(); });
  }

  function updateCursor() {
    //textDisplay.focus();
    if (currentCharIndex < originalText.length) {
      // Simulamos el cursor seleccionando/resaltando únicamente el carácter actual
      textDisplay.setSelectionRange(currentCharIndex, currentCharIndex + 1);
    } else {
      textDisplay.setSelectionRange(currentCharIndex, currentCharIndex);
    }
  }

  function renderSegment() {
    if (!segments || segments.length === 0) return;
    
    const seg = segments[currentIndex];
    const start = seg.start || 0;
    const end = seg.end || 0;
    
    segInfo.textContent = `Segmento ${currentIndex + 1} (${formatTime(start)} - ${formatTime(end)})`;
    
    segCorrect = 0;
    segIncorrect = 0;
    updateCounters();
    
    segmentPlayCount = 0;
    const playCountVal = document.getElementById("dict-play-count-val");
    if (playCountVal) playCountVal.textContent = segmentPlayCount;

    originalText = (seg.text || "").trim();
    
    // Extraer y mezclar índices aleatorios solo para las letras y números (ignorando espacios y signos)
    const wordCharIndices = [];
    for(let i = 0; i < originalText.length; i++) {
       if(/[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]/.test(originalText[i])) {
           wordCharIndices.push(i);
       }
    }
    const maskCount = Math.floor(wordCharIndices.length * (complexity / 100));
    const shuffled = [...wordCharIndices].sort(() => 0.5 - Math.random());
    const indicesToMask = new Set(shuffled.slice(0, maskCount));
    
    displayedText = "";
    currentCharIndex = 0;
    currentAttempts = 0;

    for (let i = 0; i < originalText.length; i++) {
        const isMasked = indicesToMask.has(i);
        displayedText += isMasked ? "*" : originalText[i];
    }

    textDisplay.value = displayedText;
    updateCursor();
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === segments.length - 1;
  }

  // Evitar que el usuario cambie la posición del cursor manualmente haciendo click
  textDisplay.addEventListener("click", (e) => { e.preventDefault(); updateCursor(); });
  textDisplay.addEventListener("focus", updateCursor);
  textDisplay.addEventListener("select", (e) => { e.preventDefault(); updateCursor(); });

  textDisplay.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return; // Permite atajos de teclado del navegador
    
    e.preventDefault(); // Evita que el usuario edite o borre texto de forma libre nativamente
    
    if (e.key.length > 1) return; // Ignora teclas especiales (Enter, Backspace, Shift, etc.)
    if (currentCharIndex >= originalText.length) return;
    
    const expectedChar = originalText[currentCharIndex];

    if (e.key === expectedChar) {
      if (currentAttempts === 0) { segCorrect++; globCorrect++; }
      
      // Actualizar el string para destapar la letra
      displayedText = displayedText.substring(0, currentCharIndex) + expectedChar + displayedText.substring(currentCharIndex + 1);
      textDisplay.value = displayedText;
      
      currentCharIndex++;
      currentAttempts = 0;
      updateCounters();
      
      if (currentCharIndex >= originalText.length) handleSegmentComplete();
      else updateCursor();
    } else {
      currentAttempts++;
      if (currentAttempts === 1) { segIncorrect++; globIncorrect++; updateCounters(); }
      
      if (currentAttempts >= 3) {
        // Revelar letra tras 3 intentos fallidos
        displayedText = displayedText.substring(0, currentCharIndex) + expectedChar + displayedText.substring(currentCharIndex + 1);
        textDisplay.value = displayedText;
        
        currentCharIndex++;
        currentAttempts = 0;
        
        if (currentCharIndex >= originalText.length) handleSegmentComplete();
        else updateCursor();
      }
    }
  });

  playBtn.addEventListener("click", () => { playCurrentSegment(); textDisplay.focus(); });
  prevBtn.addEventListener("click", () => { if (currentIndex > 0) { currentIndex--; renderSegment(); playCurrentSegment(); } });
  nextBtn.addEventListener("click", () => { if (currentIndex < segments.length - 1) { currentIndex++; renderSegment(); playCurrentSegment(); } });
  complexitySelect.addEventListener("change", (e) => { complexity = parseInt(e.target.value); renderSegment(); textDisplay.focus(); });

  // Atajos de teclado globales para el dictado
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "a") { e.preventDefault(); prevBtn.click(); }
      if (key === "z") { e.preventDefault(); playBtn.click(); }
      if (key === "s") { e.preventDefault(); nextBtn.click(); }
    }
  });

  return {
    loadSegments: (newSegments) => {
      if (!newSegments || newSegments.length === 0) return;
      segments = newSegments; currentIndex = 0; globCorrect = 0; globIncorrect = 0; sessionStats = [];
      totalInfo.textContent = `Total de segmentos ${segments.length} (${formatTime(segments[segments.length - 1].end || 0)})`;
      renderSegment();
    }
  };
}