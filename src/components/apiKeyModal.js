export function showApiKeyModal() {
  // Función para mostrar una alerta visual estilizada (Toast notification)
  const showCustomAlert = (message, isSuccess) => {
    let alertBox = document.getElementById("custom-api-alert");
    if (!alertBox) {
      alertBox = document.createElement("div");
      alertBox.id = "custom-api-alert";
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
    alertBox.style.backgroundColor = isSuccess ? "#14B8A6" : "#F43F5E";
    alertBox.innerHTML = isSuccess ? `✅ ${message}` : `⚠️ ${message}`;
    alertBox.style.display = "block";
    void alertBox.offsetWidth; // Forzar reflow para que funcione la transición CSS
    alertBox.style.opacity = "1";
    alertBox.style.transform = "translateY(0)";
    
    setTimeout(() => {
      alertBox.style.opacity = "0";
      alertBox.style.transform = "translateY(20px)";
      setTimeout(() => { if (alertBox.style.opacity === "0") alertBox.style.display = "none"; }, 300);
    }, 3000);
  };

  // Función extraída para cargar el video de forma segura evitando conflictos con videoPanel.js
  const loadModalVideo = () => {
    const wrapper = document.getElementById("api-key-video-wrapper");
    if (!wrapper) return;
    
    // Reconstruir el contenedor de YouTube desde cero, justo como lo hace videoPanel.js
    wrapper.innerHTML = '<div id="api-key-yt-player" style="width: 100%; height: 100%;"></div>';
    
    const initYTModal = () => {
      if (!document.getElementById('api-key-yt-player')) return;
      new window.YT.Player('api-key-yt-player', {
        videoId: 'jV1vkYPCGVs',
        playerVars: { 'playsinline': 1, 'rel': 0, 'modestbranding': 1 }
      });
    };

    if (window.YT && window.YT.Player) {
      initYTModal();
    } else {
      if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement('script');
        tag.id = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      // Polling: Espera silenciosa a que cargue la API sin sobrescribir window.onYouTubeIframeAPIReady
      const ytCheck = setInterval(() => { if (window.YT && window.YT.Player) { clearInterval(ytCheck); initYTModal(); } }, 100);
    }
  };

  let modal = document.getElementById("api-key-modal");
  
  if (!modal) {
    // Crear el contenedor del modal si no existe
    modal = document.createElement("div");
    modal.id = "api-key-modal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(15, 23, 42, 0.75)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "9999";
    modal.style.backdropFilter = "blur(4px)";

    const currentKey = localStorage.getItem('gemini_api_key') || '';

    // Estructura HTML de la interfaz del modal
    modal.innerHTML = `
      <div class="modal-content" style="width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 2.5rem; position: relative; box-sizing: border-box;">
        <button id="close-api-modal" style="position: absolute; top: 1.5rem; right: 1.5rem; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; padding: 0;" class="close-btn">✖</button>
        
        <h2 style="margin-top: 0; color: #0F172A; display: flex; align-items: center; gap: 0.75rem; font-size: 1.6rem; border-bottom: none;">
          <span style="font-size: 2rem;">🔑</span> Configurar API Key de Gemini
        </h2>
        
        <div style="background: #EEF2FF; border-left: 4px solid #6366F1; padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <h4 style="margin: 0 0 0.5rem 0; color: #4F46E5; font-size: 1.1rem;">¿Para qué se necesita esta clave?</h4>
          <p style="margin: 0; color: #1E293B; font-size: 0.95rem; line-height: 1.6;">
            La API Key conecta la aplicación con el cerebro de la Inteligencia Artificial. Es un requisito indispensable para procesar los videos y poder obtener: 
            <strong>Transcripciones precisas</strong>, <strong>Resúmenes en Inglés y Español</strong>, <strong>Palabras clave</strong>, <strong>Verbos Frasales (Phrasal Verbs)</strong> y generar el texto para los <strong>ejercicios de dictado</strong>.
          </p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="margin: 0 0 0.5rem 0; color: #0F172A; font-size: 1.1rem;">Instrucciones para obtenerla gratis</h4>
          <ol style="margin: 0; padding-left: 1.5rem; color: #334155; font-size: 0.95rem; line-height: 1.6;">
            <li>Ingresa al portal de <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #14B8A6; text-decoration: none; font-weight: bold;">Google AI Studio</a> e inicia sesión con tu cuenta de Google.</li>
            <li>Haz clic en el botón azul <strong>"Create API key"</strong>.</li>
            <li>Copia la clave alfanumérica que se generará y pégala en el campo inferior.</li>
          </ol>
        </div>

        <div id="api-key-video-wrapper" style="margin-bottom: 0.5rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); background: #0f172a; height: 280px; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-weight: bold;">
        </div>
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <a href="https://youtu.be/jV1vkYPCGVs" target="_blank" style="font-size: 0.85rem; color: #6366F1; text-decoration: none; font-weight: bold; transition: color 0.2s;" onmouseover="this.style.color='#4F46E5';" onmouseout="this.style.color='#6366F1';">
            ¿El video no carga o está bloqueado? Míralo directamente en YouTube ↗
          </a>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label for="gemini-key-input" style="font-weight: bold; color: #1E293B;">Tu API Key:</label>
          <div style="position: relative; width: 100%;">
            <input type="password" id="gemini-key-input" class="search-input" placeholder="Pega tu clave AIzaSy..." value="${currentKey}" style="width: 100%; box-sizing: border-box; padding-right: 2.5rem;" />
            <button id="toggle-key-visibility" type="button" title="Mostrar/Ocultar" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; font-size: 1.25rem; color: #64748B; padding: 0; outline: none;">👁️</button>
          </div>
        </div>

        <div style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
          <button id="cancel-api-modal" class="ui-btn" style="background: #F1F5F9; color: #475569; box-shadow: 0 4px 0 #CBD5E1;">Cancelar</button>
          <button id="save-api-modal" class="ui-btn ui-btn-teal">Guardar y Continuar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => {
      // Limpiar el contenedor detiene el video de raíz y evita consumo de memoria
      const wrapper = document.getElementById("api-key-video-wrapper");
      if (wrapper) wrapper.innerHTML = '';
      modal.style.display = "none";
    };

    document.getElementById("close-api-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-api-modal").addEventListener("click", closeModal);
    document.getElementById("save-api-modal").addEventListener("click", () => { 
      const key = document.getElementById("gemini-key-input").value.trim(); 
      if (key) { 
        localStorage.setItem('gemini_api_key', key); 
        showCustomAlert("¡Excelente! API Key configurada exitosamente.", true); 
        closeModal(); 
      } else { 
        showCustomAlert("Por favor, ingresa una API Key válida antes de guardar.", false); 
      } 
    });
    document.getElementById("toggle-key-visibility").addEventListener("click", function() {
      const input = document.getElementById("gemini-key-input");
      if (input.type === "password") { input.type = "text"; this.textContent = "🙈"; }
      else { input.type = "password"; this.textContent = "👁️"; }
    });
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    
    loadModalVideo();
  } else {
    document.getElementById("gemini-key-input").value = localStorage.getItem('gemini_api_key') || '';
    // Reseteamos el input al estado original por si el usuario lo había dejado en "texto visible"
    document.getElementById("gemini-key-input").type = "password";
    document.getElementById("toggle-key-visibility").textContent = "👁️";
    modal.style.display = "flex";
    
    loadModalVideo();
  }
}