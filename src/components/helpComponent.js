export function setupHelpComponent() {
  const helpBtn = document.getElementById("btn-main-help");
  if (!helpBtn) return;
  
  // Prevenir que se agreguen múltiples event listeners si se inicializa de nuevo
  if (helpBtn.dataset.helpInitialized) return;
  helpBtn.dataset.helpInitialized = "true";

  helpBtn.addEventListener("click", showHelpModal);

  function showHelpModal() {
    let modal = document.getElementById("help-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "help-modal";
      modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(5px); padding: 1rem;";
      
      const modalContent = document.createElement("div");
      modalContent.className = "modal-content";
      modalContent.style.cssText = "width: 100%; max-width: 800px; background: #FFFFFF; border-radius: 16px; padding: 2.5rem; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;";
      
      modalContent.innerHTML = `
        <button id="close-help-modal" style="position: absolute; top: 1.5rem; right: 1.5rem; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #64748B; transition: color 0.2s;">✖</button>
        <h2 style="margin-top: 0; color: #0F172A; display: flex; align-items: center; gap: 0.75rem; font-size: 1.8rem;">📚 Guía de Uso del Sistema</h2>
        
        <div style="margin-bottom: 2rem; color: #475569; line-height: 1.6; font-size: 1.05rem;">
          <h3 style="color: #1E293B; border-bottom: 2px solid #E2E8F0; padding-bottom: 0.5rem;">📖 Aprender con Videos de la Biblioteca</h3>
          <p>Puedes practicar utilizando los videos ya creados y almacenados en la biblioteca. Al cargar uno, visualizarás toda esta información:</p>
          
          <img src="data:image/svg+xml;utf8,<svg width='100%' height='250' viewBox='0 0 400 250' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='%23F8FAFC' rx='10' /><text x='200' y='35' font-family='Arial' font-size='18' font-weight='bold' fill='%231E293B' text-anchor='middle'>Contenido Analizado</text><rect x='20' y='55' width='175' height='35' fill='%23E0E7FF' rx='5' /><text x='107' y='77' font-family='Arial' font-size='13' font-weight='bold' fill='%233730A3' text-anchor='middle'>👂 Transcripción</text><rect x='205' y='55' width='175' height='35' fill='%23E0E7FF' rx='5' /><text x='292' y='77' font-family='Arial' font-size='13' font-weight='bold' fill='%233730A3' text-anchor='middle'>📝 Palabras clave</text><rect x='20' y='100' width='175' height='35' fill='%23DCFCE7' rx='5' /><text x='107' y='122' font-family='Arial' font-size='13' font-weight='bold' fill='%23166534' text-anchor='middle'>📝 Resumen (EN)</text><rect x='205' y='100' width='175' height='35' fill='%23DCFCE7' rx='5' /><text x='292' y='122' font-family='Arial' font-size='13' font-weight='bold' fill='%23166534' text-anchor='middle'>📝 Resumen (ES)</text><rect x='20' y='145' width='175' height='35' fill='%23FEF3C7' rx='5' /><text x='107' y='167' font-family='Arial' font-size='13' font-weight='bold' fill='%2392400E' text-anchor='middle'>🧠 Verbos</text><rect x='205' y='145' width='175' height='35' fill='%23FEF3C7' rx='5' /><text x='292' y='167' font-family='Arial' font-size='13' font-weight='bold' fill='%2392400E' text-anchor='middle'>🧠 Verbos Frasales</text><rect x='100' y='190' width='200' height='35' fill='%23FEE2E2' rx='5' /><text x='200' y='212' font-family='Arial' font-size='13' font-weight='bold' fill='%23991B1B' text-anchor='middle'>🗣️ Expr. Coloquiales</text></svg>" alt="Opciones de aprendizaje" style="max-width: 100%; height: auto; display: block; margin: 1rem auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 10px;" />
          
          <ul style="margin-top: 1rem; padding-left: 1.5rem;">
            <li>📝 <strong>Transcripción del video:</strong> Texto sincronizado con el audio.</li>
            <li>🇺🇸 <strong>Resumen en Inglés y 🇪🇸 en Español:</strong> Para comprender el contexto de la historia.</li>
            <li>🧠 <strong>Verbos Principales y Frasales (Phrasal Verbs):</strong> Aprende sus traducciones, conjugaciones y ejemplos de uso.</li>
            <li>🗣️ <strong>Expresiones Coloquiales / Marcadores:</strong> Conoce las frases y muletillas nativas utilizadas.</li>
          </ul>
        </div>

        <div style="background: #F0FDF4; padding: 1.5rem; border-radius: 12px; border: 1px solid #BBF7D0; margin-bottom: 2rem;">
          <h3 style="margin-top: 0; color: #166534; border-bottom: 2px solid #DCFCE7; padding-bottom: 0.5rem;">🎮 Práctica y Evaluación (Quizzes & Dictado)</h3>
          <p style="color: #15803D;">Además del contenido estático, puedes evaluar tu aprendizaje:</p>
          
          <img src="data:image/svg+xml;utf8,<svg width='100%' height='160' viewBox='0 0 400 160' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='%23F0FDF4' rx='10' /><text x='200' y='35' font-family='Arial' font-size='18' font-weight='bold' fill='%23166534' text-anchor='middle'>Evaluación del Conocimiento</text><rect x='60' y='55' width='280' height='35' fill='%23BBF7D0' rx='5' /><text x='200' y='78' font-family='Arial' font-size='14' font-weight='bold' fill='%23166534' text-anchor='middle'>🎮 Dictado</text><rect x='20' y='105' width='175' height='35' fill='%23BBF7D0' rx='5' /><text x='107' y='128' font-family='Arial' font-size='11' font-weight='bold' fill='%23166534' text-anchor='middle'>🎮 Cuestionario de Vocabulario</text><rect x='205' y='105' width='175' height='35' fill='%23BBF7D0' rx='5' /><text x='292' y='128' font-family='Arial' font-size='12' font-weight='bold' fill='%23166534' text-anchor='middle'>🎬 Cuestionario del Video</text></svg>" alt="Opciones de evaluación" style="max-width: 100%; height: auto; display: block; margin: 1rem auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 10px;" />
          
          <ul style="color: #15803D; padding-left: 1.5rem; margin-top: 1rem;">
            <li><strong>🎧 Dictado Interactivo:</strong> Escucha fragmentos del video e intenta escribir lo que oyes. <strong>Podrás ver tus resultados y métricas al finalizar.</strong></li>
            <li><strong>📚 Cuestionario de Vocabulario:</strong> Preguntas de opción múltiple para evaluar tu conocimiento sobre los verbos y frases.</li>
            <li><strong>🎬 Cuestionario del Video:</strong> Preguntas de opción múltiple enfocadas en entender la trama del video.</li>
          </ul>
          <p style="margin-bottom: 0; font-weight: bold; color: #166534; margin-top: 1rem;">🏆 Al terminar cualquier cuestionario o el dictado, el sistema te mostrará tus resultados, puntaje y estadísticas detalladas.</p>
        </div>

        <div style="background: #EEF2FF; padding: 1.5rem; border-radius: 12px; border: 1px solid #C7D2FE; margin-bottom: 1.5rem;">
          <h3 style="margin-top: 0; color: #3730A3; border-bottom: 2px solid #E0E7FF; padding-bottom: 0.5rem;">➕ ¿Cómo Agregar y Analizar un Nuevo Video?</h3>
          <p style="color: #312E81; margin-bottom: 1rem;">Si deseas agregar un video a la biblioteca, debes cumplir con algunos requisitos:</p>
          
          <img src="data:image/svg+xml;utf8,<svg width='100%' height='150' viewBox='0 0 400 150' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='%23EEF2FF' rx='10' /><text x='200' y='30' font-family='Arial' font-size='18' font-weight='bold' fill='%23312E81' text-anchor='middle'>Pasos para Analizar un Video Nuevo</text><circle cx='70' cy='80' r='25' fill='%233B82F6' /><text x='70' y='85' font-family='Arial' font-size='16' font-weight='bold' fill='white' text-anchor='middle'>1</text><text x='70' y='125' font-family='Arial' font-size='12' font-weight='bold' fill='%231E293B' text-anchor='middle'>Iniciar Sesión</text><line x1='105' y1='80' x2='165' y2='80' stroke='%2394A3B8' stroke-width='3' /><circle cx='200' cy='80' r='25' fill='%2310B981' /><text x='200' y='85' font-family='Arial' font-size='16' font-weight='bold' fill='white' text-anchor='middle'>2</text><text x='200' y='125' font-family='Arial' font-size='12' font-weight='bold' fill='%231E293B' text-anchor='middle'>API Key Gemini</text><line x1='235' y1='80' x2='295' y2='80' stroke='%2394A3B8' stroke-width='3' /><circle cx='330' cy='80' r='25' fill='%23EF4444' /><text x='330' y='85' font-family='Arial' font-size='16' font-weight='bold' fill='white' text-anchor='middle'>3</text><text x='330' y='125' font-family='Arial' font-size='12' font-weight='bold' fill='%231E293B' text-anchor='middle'>Límite &lt; 5 min</text></svg>" alt="Pasos para nuevo video" style="max-width: 100%; height: auto; display: block; margin: 1rem auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 10px;" />
          
          <ol style="color: #312E81; padding-left: 1.5rem; line-height: 1.6;">
            <li style="margin-bottom: 0.5rem;"><strong>Iniciar Sesión con Gmail:</strong> Haz clic en el botón superior de "Iniciar Sesión" (o icono de Google) y selecciona tu cuenta. Es obligatorio para llevar registro de quién agregó el video.</li>
            <li style="margin-bottom: 0.5rem;"><strong>Registrar tu API Key de Gemini:</strong> Presiona el botón <strong>"GEMINI"</strong> en el menú principal y pega tu clave API de Google AI Studio. Esto permite usar la inteligencia artificial para generar la transcripción y el análisis.</li>
            <li><strong>Límite de Duración:</strong> Pega el enlace del video y reprodúcelo o analízalo. Ten en cuenta que existe un <strong>límite máximo de 5 minutos</strong> de duración por video.</li>
          </ol>
        </div>

        <div style="text-align: right; margin-top: 2rem;">
          <button id="btn-close-help-bottom" class="ui-btn ui-btn-teal" style="background: #0F172A; color: white; padding: 0.75rem 2rem; font-size: 1rem; border-radius: 8px; border: none; cursor: pointer; font-weight: bold;">Cerrar Ayuda</button>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      const closeM = () => modal.style.display = "none";
      document.getElementById("close-help-modal").addEventListener("click", closeM);
      document.getElementById("btn-close-help-bottom").addEventListener("click", closeM);
      modal.addEventListener("click", (ev) => { if (ev.target === modal) closeM(); });
    } else {
      modal.style.display = "flex";
    }
  }
}

// Auto-inicializar la ayuda de forma independiente
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupHelpComponent);
} else {
  setTimeout(setupHelpComponent, 500);
}