export function showApiKeyModal() {
  let modal = document.getElementById("api-key-modal");

  const loadModels = async (apiKey, preselectModel = null, type = "dict") => {
    const isDict = type === "dict";
    const fetchBtn = document.getElementById(isDict ? "btn-fetch-models" : "btn-fetch-transcription-models");
    const modelSelect = document.getElementById(isDict ? "dict-model-select" : "transcription-model-select");
    const endpoint = isDict ? "/api/gemini-models" : "/api/gemini-transcription-models";
    
    fetchBtn.textContent = "CARGANDO...";
    fetchBtn.disabled = true;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey })
      });
      
      if (response.ok) {
        const models = await response.json();
        modelSelect.innerHTML = '<option value="auto">Automático</option>';
        models.forEach(m => {
          const opt = document.createElement("option");
          opt.value = m;
          opt.textContent = m;
          modelSelect.appendChild(opt);
        });
        if (preselectModel) {
          modelSelect.value = preselectModel;
        }
      } else {
        throw new Error("Error al obtener modelos");
      }
    } catch (e) {
      console.error(e);
    } finally {
      fetchBtn.textContent = "OBTENER MODELOS";
      fetchBtn.disabled = false;
    }
  };

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "api-key-modal";
    modal.className = "modal";
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(5px);";
    
    modal.innerHTML = `
      <div class="modal-content" style="width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; background: #FFFFFF; border-radius: 16px; padding: 2.5rem; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <button id="close-api-modal" style="position: absolute; top: 1.5rem; right: 1.5rem; background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #64748B;">✖</button>
        <h2 style="margin-top: 0; color: #0F172A; font-size: 1.6rem; display: flex; align-items: center; gap: 0.5rem;">🔑 Configuración Gemini</h2>
        
        <div style="margin-bottom: 1.5rem;">
          <label for="gemini-api-key-input" style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #1E293B;">Tu API Key:</label>
          <div style="position: relative; display: flex; align-items: center;">
            <input type="password" id="gemini-api-key-input" class="search-input" style="width: 100%; box-sizing: border-box; padding-right: 2.5rem;" placeholder="AIzaSy...">
            <button id="toggle-api-key-visibility" type="button" style="position: absolute; right: 0.5rem; background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #64748B;" title="Mostrar/Ocultar API Key">👁️</button>
          </div>
        </div>

        <div style="background: #F8FAFC; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #334155; font-size: 1.1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            Configuración de Diccionario
            <button id="btn-fetch-models" class="ui-btn ui-btn-amber" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">OBTENER MODELOS</button>
          </h3>
          <label for="dict-model-select" style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #475569; font-size: 0.9rem;">Modelo:</label>
          <select id="dict-model-select" class="search-input" style="width: 100%; box-sizing: border-box; cursor: pointer;">
            <option value="auto">Automático</option>
          </select>
        </div>

        <div style="background: #F8FAFC; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #334155; font-size: 1.1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            Configuración de Transcripción
            <button id="btn-fetch-transcription-models" class="ui-btn ui-btn-amber" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">OBTENER MODELOS</button>
          </h3>
          <label for="transcription-model-select" style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #475569; font-size: 0.9rem;">Modelo:</label>
          <select id="transcription-model-select" class="search-input" style="width: 100%; box-sizing: border-box; cursor: pointer;">
            <option value="auto">Automático</option>
          </select>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
          <button id="btn-save-api-key" class="ui-btn ui-btn-teal" style="padding: 0.75rem 2rem;">GUARDAR Y CONTINUAR</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("close-api-modal").addEventListener("click", () => modal.style.display = "none");
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

    document.getElementById("toggle-api-key-visibility").addEventListener("click", () => {
      const input = document.getElementById("gemini-api-key-input");
      const btn = document.getElementById("toggle-api-key-visibility");
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
      } else {
        input.type = "password";
        btn.textContent = "👁️";
      }
    });

    document.getElementById("btn-fetch-models").addEventListener("click", () => {
      const currentKey = document.getElementById("gemini-api-key-input").value.trim();
      if (!currentKey) return alert("Ingresa tu API Key primero.");
      loadModels(currentKey, document.getElementById("dict-model-select").value, "dict");
    });

    document.getElementById("btn-fetch-transcription-models").addEventListener("click", () => {
      const currentKey = document.getElementById("gemini-api-key-input").value.trim();
      if (!currentKey) return alert("Ingresa tu API Key primero.");
      loadModels(currentKey, document.getElementById("transcription-model-select").value, "transcription");
    });

    document.getElementById("btn-save-api-key").addEventListener("click", () => {
      const newKey = document.getElementById("gemini-api-key-input").value.trim();
      if (newKey) {
        localStorage.setItem("gemini_api_key", newKey);
        localStorage.setItem("gemini_dict_model", document.getElementById("dict-model-select").value);
        localStorage.setItem("gemini_transcription_model", document.getElementById("transcription-model-select").value);
        modal.style.display = "none";
      } else {
        alert("El API Key no puede estar vacío.");
      }
    });
  }

  const savedKey = localStorage.getItem("gemini_api_key") || "";
  const savedModel = localStorage.getItem("gemini_dict_model") || "auto";
  const savedTranscriptionModel = localStorage.getItem("gemini_transcription_model") || "auto";
  
  document.getElementById("gemini-api-key-input").value = savedKey;
  document.getElementById("dict-model-select").innerHTML = '<option value="auto">Automático</option>';
  document.getElementById("transcription-model-select").innerHTML = '<option value="auto">Automático</option>';
  
  if (savedKey) {
    loadModels(savedKey, savedModel, "dict");
    loadModels(savedKey, savedTranscriptionModel, "transcription");
  }
  
  modal.style.display = "flex";
}