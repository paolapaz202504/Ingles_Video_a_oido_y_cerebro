export async function setupPlayer(videoUrl, auth, ear, dictation) {
  const showCustomAlert = (message, isError = false) => {
    let alertBox = document.getElementById("custom-ui-alert");
    if (!alertBox) {
      alertBox = document.createElement("div");
      alertBox.id = "custom-ui-alert";
      alertBox.style.position = "fixed";
      alertBox.style.bottom = "20px";
      alertBox.style.right = "20px";
      alertBox.style.padding = "1rem 1.5rem";
      alertBox.style.borderRadius = "8px";
      alertBox.style.color = "#fff";
      alertBox.style.fontWeight = "bold";
      alertBox.style.zIndex = "10000";
      alertBox.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
      alertBox.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      document.body.appendChild(alertBox);
    }
    alertBox.style.backgroundColor = isError ? "#F43F5E" : "#14B8A6";
    alertBox.innerHTML = isError ? `⚠️ ${message}` : `✅ ${message}`;
    alertBox.style.display = "block";
    void alertBox.offsetWidth; // Forzar reflow para animación
    alertBox.style.opacity = "1";
    alertBox.style.transform = "translateY(0)";
    setTimeout(() => {
      alertBox.style.opacity = "0";
      alertBox.style.transform = "translateY(20px)";
      setTimeout(() => { if (alertBox.style.opacity === "0") alertBox.style.display = "none"; }, 300);
    }, 4000);
  };

  try {
    const apiKey = auth.getApiKey();
    if (!apiKey) throw new Error("No es posible analizar el video. Falta la API Key, configúrala en el botón superior.");

    const currentUser = auth.getCurrentUser ? auth.getCurrentUser() : null;
    const createdBy = currentUser ? currentUser.email : "Desconocido";
    const transcriptionModel = localStorage.getItem("gemini_transcription_model") || "auto";
    const response = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl, apiKey, model: transcriptionModel, createdBy })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error || "Error al procesar el video");
    }

    const { analysis } = await response.json();

    if (analysis.transcription) {
      if (Array.isArray(analysis.transcription.segments)) {
        let lastEndTime = 0;
        analysis.transcription.segments.forEach(seg => {
          let s = seg.start, e = seg.end;
          if (typeof s === "string") s = s.includes(":") ? s.split(":").reverse().reduce((a, v, i) => a + parseFloat(v) * Math.pow(60, i), 0) : parseFloat(s);
          if (typeof e === "string") e = e.includes(":") ? e.split(":").reverse().reduce((a, v, i) => a + parseFloat(v) * Math.pow(60, i), 0) : parseFloat(e);
          // Eliminado: if (s < lastEndTime) s = lastEndTime; -> Esto causaba un desfase matemático acumulativo grave.
          if (e <= s + 0.5) e = s + Math.max(1.5, (seg.text || "").trim().split(/\s+/).length * 0.4);
          seg.start = s; seg.end = e; lastEndTime = e;
        });
      }
      const tData = { text: analysis.transcription.Transcription_text, segments: analysis.transcription.segments };
      ear.showTranscript(tData);
      if (dictation && tData.segments) dictation.loadSegments(tData.segments);
    } else {
      ear.showTranscript("No se pudo generar la transcripción corregida.");
    }

    let pvHtml = "No se encontraron phrasal verbs.";
    let hasMorePhrasalVerbs = false;
    if (analysis.phasal_verbs && analysis.phasal_verbs.length > 0) {
      hasMorePhrasalVerbs = analysis.phasal_verbs.length > 4;
      const pvColors = ['#6366F1', '#14B8A6', '#F59E0B', '#8B5CF6'];
      const shapes = ['✨', '💡', '🚀', '🧠'];
      pvHtml = `<div class="pv-grid">` + analysis.phasal_verbs.map((pv, idx) => {
        const color = pvColors[idx % 4], shape = shapes[idx % 4], textColor = color === '#F59E0B' ? '#1E293B' : '#FFFFFF';
        const displayStyle = idx >= 4 ? 'display: none;' : '';
        const itemClass = idx >= 4 ? 'phrasal-verb-extra-item' : '';
        return `<div class="pv-card ${itemClass}" style="background: ${color}; color: ${textColor}; ${displayStyle}">
          <div style="font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
            <span>${pv.phrasal_verb}</span> <span style="opacity: 0.8; font-size: 1.5rem;">${shape}</span>
          </div>
          <div style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem;">${pv.spanish}</div>
          <div style="font-size: 0.9rem; margin-bottom: 0.8rem; line-height: 1.4;">${pv.meaning}</div>
          <div style="font-size: 0.9rem; font-style: italic; background: rgba(0,0,0,0.1); padding: 0.75rem; border-radius: 8px; border-left: 4px solid rgba(255,255,255,0.5);">"${pv.example}"</div>
        </div>`;
      }).join("") + `</div>`;

      if (hasMorePhrasalVerbs) {
        pvHtml += `
          <div style="text-align: center; margin-top: 1.5rem;">
            <button id="phrasal-verbs-toggle-btn" class="ui-btn" style="background: #F1F5F9; color: #475569; box-shadow: 0 4px 0 #CBD5E1; padding: 0.5rem 1.5rem; font-size: 0.9rem;">Ver más (${analysis.phasal_verbs.length - 4})</button>
          </div>
        `;
      }
    }

    let collHtml = "";
    let hasMoreColloquial = false;
    if (analysis.colloquial_expressions && analysis.colloquial_expressions.length > 0) {
      hasMoreColloquial = analysis.colloquial_expressions.length > 2;
      collHtml = `<div style="display: grid; gap: 1rem; margin-top: 0.5rem;">` + analysis.colloquial_expressions.map((exp, idx) => {
        const examplesHtml = (exp.examples || []).map(ex => `<li style="margin-bottom: 0.5rem;"><em>"${ex.english}"</em> <br/> <span style="color:#64748B;">${ex.spanish}</span></li>`).join('');
        const displayStyle = idx >= 2 ? 'display: none;' : '';
        const itemClass = idx >= 2 ? 'colloquial-extra-item' : '';
        return `
          <div class="${itemClass}" style="background: #F8FAFC; border-left: 4px solid #F59E0B; padding: 1rem; border-radius: 8px; border: 1px solid #E2E8F0; ${displayStyle}">
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
      }).join("") + `</div>`;

      if (hasMoreColloquial) {
        collHtml += `
          <div style="text-align: center; margin-top: 1.5rem;">
            <button id="colloquial-toggle-btn" class="ui-btn" style="background: #F1F5F9; color: #475569; box-shadow: 0 4px 0 #CBD5E1; padding: 0.5rem 1.5rem; font-size: 0.9rem;">Ver más (${analysis.colloquial_expressions.length - 2})</button>
          </div>
        `;
      }
    }

    let verbsHtml = "";
    let hasMoreVerbs = false;
    if (analysis.verbs && analysis.verbs.length > 0) {
      hasMoreVerbs = analysis.verbs.length > 4;
      verbsHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-top: 1rem;">`;
      verbsHtml += analysis.verbs.map((v, idx) => {
        const examplesHtml = Array.isArray(v.examples) ? v.examples.map(ex => `<li style="margin-bottom: 0.25rem;">${ex}</li>`).join('') : `<li>${v.examples || ''}</li>`;
        const displayStyle = idx >= 4 ? 'display: none;' : 'display: flex;';
        const itemClass = idx >= 4 ? 'verb-extra-item' : 'verb-item';
        return `
          <div class="${itemClass}" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1rem; flex-direction: column; gap: 0.75rem; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.05); ${displayStyle}">
            
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; gap: 0.5rem; flex-wrap: wrap;">
                <h4 style="margin: 0; font-size: 1.3rem; color: #2563EB; font-weight: 800;">${v.present}</h4>
                <span style="font-size: 0.85rem; color: #0F172A; font-weight: 700; background: #F1F5F9; padding: 2px 8px; border-radius: 6px;">${v.spanish_translation}</span>
              </div>
              <p style="margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.4;">${v.meaning}</p>
            </div>

            <div style="background: #F8FAFC; border-radius: 6px; padding: 0.5rem 0.75rem; border: 1px solid #E2E8F0; display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-size: 0.85rem;">
              <div><strong style="color: #64748B; font-size: 0.75rem; text-transform: uppercase;">Pas:</strong> <span style="color: #1E293B; font-weight: 600;">${v.past}</span></div>
              <div><strong style="color: #64748B; font-size: 0.75rem; text-transform: uppercase;">Fut:</strong> <span style="color: #1E293B; font-weight: 600;">${v.future}</span></div>
              <div><strong style="color: #64748B; font-size: 0.75rem; text-transform: uppercase;">Ger:</strong> <span style="color: #1E293B; font-weight: 600;">${v.gerund}</span></div>
            </div>

            <div style="font-size: 0.85rem; color: #475569; border-top: 1px dashed #CBD5E1; padding-top: 0.75rem;">
              <ul style="margin: 0; padding-left: 1.2rem; line-height: 1.4;">
                ${examplesHtml}
              </ul>
            </div>

          </div>
        `;
      }).join('');
      verbsHtml += `</div>`;
      
      if (hasMoreVerbs) {
        verbsHtml += `
          <div style="text-align: center; margin-top: 1.5rem;">
            <button id="verbs-toggle-btn" class="ui-btn" style="background: #F1F5F9; color: #475569; box-shadow: 0 4px 0 #CBD5E1; padding: 0.5rem 1.5rem; font-size: 0.9rem;">Ver más (${analysis.verbs.length - 4})</button>
          </div>
        `;
      }
    }

    const elKw = document.getElementById("keywords"), elSum = document.getElementById("summary"), elAn = document.getElementById("analysis"), elSumEs = document.getElementById("summary-es"), elVi = document.getElementById("video-info");
    [elKw, elSum, elAn, elSumEs, elVi].forEach(el => { if (el) el.innerHTML = ''; });

    if (elVi && (analysis.videoTitle || analysis.videoDescription)) {
      elVi.style.display = "block"; elVi.className = '';
      const title = analysis.videoTitleGenerated || analysis.videoTitle || "Sin título";
      const desc = analysis.videoDescriptionGenerated || analysis.videoDescription || "Sin descripción";
      const words = desc.split(/\s+/);
      let descHtml = `<span id="desc-content">${words.length > 40 ? words.slice(0,40).join(" ")+"..." : desc}</span>`;
      if (words.length > 40) descHtml += `<button id="desc-toggle" style="background:none; border:none; color:#6366F1; font-weight:bold; cursor:pointer; padding:0; margin-left:4px;">Ver más</button>`;
      
      let metaHtml = `<div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <span class="badge" style="background: #F8FAFC; color: #475569; border: 1px solid #E2E8F0; text-transform: none; letter-spacing: normal;" title="Procesado por">👤 ${analysis.createdBy || 'Desconocido'}</span>
        <span class="badge" style="background: #F8FAFC; color: #64748B; border: 1px solid #E2E8F0; text-transform: none; letter-spacing: normal;">📅 Generado: ${analysis.generatedDate || 'Desconocido'}</span>
      </div>`;
      
      elVi.innerHTML = `<h3 style="margin:0 0 0.5rem 0; font-size:1.25rem; color:#0F172A; line-height:1.4;">${title}</h3><p style="margin:0; font-size:0.95rem; color:#64748B; line-height:1.6;">${descHtml}</p>${metaHtml}`;
      
      if (words.length > 40) {
        let exp = false;
        document.getElementById("desc-toggle").addEventListener("click", (e) => {
          exp = !exp;
          document.getElementById("desc-content").textContent = exp ? desc : words.slice(0,40).join(" ")+"...";
          e.target.textContent = exp ? "Ver menos" : "Ver más";
        });
      }
    }

    if (elKw) { elKw.className = 'analysis-section border-amber'; elKw.innerHTML = `<h3>Palabras Clave</h3><p>${analysis.keywords || "Sin palabras clave"}</p>`; }
    if (elSum) { elSum.className = 'analysis-section border-teal'; elSum.innerHTML = `<h3>Resumen (Inglés)</h3><p>${analysis.summary || "Sin resumen"}</p>`; }
    if (elAn) { 
      elAn.className = ''; 
      let newHtml = '';
      if (verbsHtml) {
        newHtml += `<div class="analysis-section" style="border-left: 4px solid #3B82F6; margin-bottom: 1.5rem;"><h3>Verbos (Verbs)</h3>${verbsHtml}</div>`;
      }
      newHtml += `<div class="analysis-section border-purple"><h3>Verbos Frasales (Phrasal Verbs)</h3>${pvHtml}</div>`;
      if (collHtml) {
        newHtml += `<div class="analysis-section border-amber"><h3>🗣️ Expresiones Coloquiales / Marcadores</h3>${collHtml}</div>`;
      }
      elAn.innerHTML = newHtml;
      
      if (hasMoreVerbs) {
        const toggleBtn = document.getElementById("verbs-toggle-btn");
        if (toggleBtn) {
          let isExpanded = false;
          toggleBtn.addEventListener("click", () => {
            isExpanded = !isExpanded;
            const extraItems = document.querySelectorAll(".verb-extra-item");
            extraItems.forEach(item => {
              item.style.display = isExpanded ? "flex" : "none";
            });
            toggleBtn.textContent = isExpanded ? "Ver menos" : `Ver más (${analysis.verbs.length - 4})`;
          });
        }
      }

      if (hasMorePhrasalVerbs) {
        const toggleBtn = document.getElementById("phrasal-verbs-toggle-btn");
        if (toggleBtn) {
          let isExpanded = false;
          toggleBtn.addEventListener("click", () => {
            isExpanded = !isExpanded;
            document.querySelectorAll(".phrasal-verb-extra-item").forEach(item => {
              item.style.display = isExpanded ? "block" : "none";
            });
            toggleBtn.textContent = isExpanded ? "Ver menos" : `Ver más (${analysis.phasal_verbs.length - 4})`;
          });
        }
      }

      if (hasMoreColloquial) {
        const toggleBtn = document.getElementById("colloquial-toggle-btn");
        if (toggleBtn) {
          let isExpanded = false;
          toggleBtn.addEventListener("click", () => {
            isExpanded = !isExpanded;
            document.querySelectorAll(".colloquial-extra-item").forEach(item => {
              item.style.display = isExpanded ? "block" : "none";
            });
            toggleBtn.textContent = isExpanded ? "Ver menos" : `Ver más (${analysis.colloquial_expressions.length - 2})`;
          });
        }
      }
    }
    if (elSumEs) { elSumEs.className = 'analysis-section border-indigo'; elSumEs.innerHTML = `<h3>Resumen (Español)</h3><p>${analysis.summary_es || "Sin resumen"}</p>`; }

    // --- NUEVO: Motor Reutilizable de Cuestionarios (Estilo Kahoot) ---
    function buildKahootQuiz(quizData, panelId, title, insertAfterElement) {
      let quizPanel = document.getElementById(panelId);
      if (!quizPanel) {
        quizPanel = document.createElement("div");
        quizPanel.id = panelId;
        quizPanel.className = "panel-card";
        if (insertAfterElement && insertAfterElement.parentNode) {
          insertAfterElement.parentNode.insertBefore(quizPanel, insertAfterElement.nextSibling);
        } else {
          const rightPanel = document.querySelector(".right-panel");
          if (rightPanel) rightPanel.appendChild(quizPanel);
        }
      }

      if (quizData && Array.isArray(quizData) && quizData.length > 0) {
        quizPanel.style.display = "block";
        let pool = [...quizData].sort(() => 0.5 - Math.random());
        let questions = pool.slice(0, 10);
        let currentQ = 0;
        let correct = 0;
        let incorrect = 0;

        const renderQuestion = () => {
          if (currentQ >= questions.length) {
            const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
            quizPanel.innerHTML = `
              <h2 style="display: flex; align-items: center; gap: 0.5rem; color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 0.5rem; margin-top: 0; margin-bottom: 1rem; font-size: 1.3rem;">${title}</h2>
              <div style="text-align: center; padding: 2rem;">
                <h3 style="font-size: 1.5rem; color: #0F172A; margin-top: 0;">¡Cuestionario Completado!</h3>
                <div style="font-size: 3.5rem; margin: 1rem 0;">${accuracy >= 80 ? '🏆' : accuracy >= 50 ? '👍' : '📚'}</div>
                <p style="font-size: 1.2rem; color: #475569;">Puntuación final: <strong style="color: ${accuracy >= 80 ? '#14B8A6' : '#F59E0B'};">${accuracy}%</strong></p>
                <p style="color: #64748B; font-weight: bold; margin-top: 0.5rem;">✅ Correctas: ${correct} &nbsp;|&nbsp; ❌ Incorrectas: ${incorrect}</p>
                <button class="ui-btn ui-btn-teal btn-restart-quiz" style="margin-top: 2rem; padding: 0.75rem 2rem;">Jugar de nuevo (Nuevas Opciones)</button>
              </div>
            `;
            quizPanel.querySelector(".btn-restart-quiz").addEventListener("click", () => {
              pool = [...quizData].sort(() => 0.5 - Math.random());
              questions = pool.slice(0, 10);
              currentQ = 0; correct = 0; incorrect = 0;
              renderQuestion();
            });
            return;
          }

          const q = questions[currentQ];
          const correctOpt = q.correctAnswer;
          let allOptions = Array.isArray(q.options) ? [...new Set(q.options)] : [];
          let incorrectOpts = allOptions.filter(o => o !== correctOpt).sort(() => 0.5 - Math.random()).slice(0, 3);
          
          while (incorrectOpts.length < 3) { incorrectOpts.push("Opción incorrecta " + (incorrectOpts.length + 1)); }

          const finalOptions = [correctOpt, ...incorrectOpts].sort(() => 0.5 - Math.random());
          const kahootColors = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'];
          const kahootShapes = ['▲', '◆', '●', '■'];
          const totalQ = questions.length;
          const progressPct = (currentQ / totalQ) * 100;
          const accuracy = currentQ === 0 ? 0 : Math.round((correct / currentQ) * 100);

          quizPanel.innerHTML = `
            <h2 style="display: flex; align-items: center; gap: 0.5rem; color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 0.5rem; margin-top: 0; margin-bottom: 1rem; font-size: 1.3rem;">${title}</h2>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748B; margin-bottom: 0.5rem; font-weight: bold; flex-wrap: wrap; gap: 0.5rem;">
              <span>Progreso: Pregunta ${currentQ + 1} de ${totalQ}</span>
              <span>Precisión: ${accuracy}% (✅ ${correct} | ❌ ${incorrect})</span>
            </div>
            <div style="width: 100%; background: #E2E8F0; height: 8px; border-radius: 4px; margin-bottom: 1.5rem; overflow: hidden;">
              <div style="width: ${progressPct}%; background: #6366F1; height: 100%; transition: width 0.3s ease;"></div>
            </div>
            <div style="background: #FFFFFF; border: 2px solid #E2E8F0; padding: 2rem 1.5rem; border-radius: 12px; text-align: center; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <h3 style="margin: 0; color: #0F172A; font-size: 1.3rem; line-height: 1.5;">${q.question}</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;" class="quiz-options">
              ${finalOptions.map((opt, i) => `
                <button class="quiz-option-btn" data-answer="${opt.replace(/"/g, '&quot;')}" style="background: ${kahootColors[i]}; color: white; border: none; padding: 1.25rem 1rem; border-radius: 8px; font-size: 1.05rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 1rem; transition: transform 0.1s, filter 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">
                  <span style="font-size: 1.5rem; opacity: 0.9;">${kahootShapes[i]}</span>
                  <span style="text-align: left; flex: 1; line-height: 1.3;">${opt}</span>
                </button>
              `).join('')}
            </div>
          `;

          const btns = quizPanel.querySelectorAll('.quiz-option-btn');
          btns.forEach(btn => {
            btn.addEventListener('mousedown', () => { if(!btn.disabled) btn.style.transform = 'translateY(4px)'; });
            btn.addEventListener('mouseup', () => { if(!btn.disabled) btn.style.transform = 'translateY(0)'; });
            btn.addEventListener('click', function() {
              btns.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });
              const isCorrect = this.getAttribute('data-answer') === correctOpt;
              if (isCorrect) { correct++; this.style.filter = 'brightness(1.15)'; this.innerHTML += ' <span style="font-size:1.5rem; margin-left:auto;">✅</span>'; }
              else { incorrect++; this.style.filter = 'brightness(0.7)'; this.innerHTML += ' <span style="font-size:1.5rem; margin-left:auto;">❌</span>'; btns.forEach(b => { if (b.getAttribute('data-answer') === correctOpt) { b.style.filter = 'brightness(1.15)'; b.innerHTML += ' <span style="font-size:1.5rem; margin-left:auto;">✅</span>'; } else if (b !== this) b.style.opacity = '0.6'; }); }
              setTimeout(() => { currentQ++; renderQuestion(); }, 2500);
            });
          });
        };
        renderQuestion();
      } else {
        if (quizPanel) quizPanel.style.display = "none";
      }
      return quizPanel;
    }

    const dictPanel = document.getElementById("dict-text-display")?.closest(".panel-card");
    const vocabQuizPanel = buildKahootQuiz(analysis.quiz, "vocabulary-quiz-panel", "🎮 Cuestionario de Vocabulario", dictPanel);
    buildKahootQuiz(analysis.content_quiz, "content-quiz-panel", "🎬 Cuestionario del Video", vocabQuizPanel || dictPanel);

  } catch (error) { 
    showCustomAlert(error.message, true); 
  }
}