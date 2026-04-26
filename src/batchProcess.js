export function setupBatchProcess(auth, gallery) {
  // ============================================================================
  // FUNCIÓN INTERNA DE CONSOLA: Reprocesamiento Masivo de Videos
  // Uso: Abre la consola de tu navegador (F12) y ejecuta:
  // window.batchReprocess(["https://url1", "https://url2"])
  // ============================================================================
  window.batchReprocess = async (urls) => {
    const apiKey = auth.getApiKey();
    const currentUser = auth.getCurrentUser();

    if (!apiKey) {
      console.error("❌ Falta la API Key de Gemini. Configúrala en la interfaz primero.");
      return;
    }
    if (!Array.isArray(urls) || urls.length === 0) {
      console.error("⚠️ Proporciona un arreglo de URLs. Ejemplo: window.batchReprocess(['url1', 'url2'])");
      return;
    }
    
    console.log(`🚀 Iniciando reprocesamiento de ${urls.length} videos...`);
    
    for (let i = 0; i < urls.length; i++) {
      const videoUrl = urls[i];
      console.log(`⏳ [${i + 1}/${urls.length}] Procesando: ${videoUrl}`);
      try {
        // Se envía el flag "forceReprocess" para que el backend sepa que debe ignorar/borrar la caché
        const response = await fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            videoUrl, 
            apiKey, 
            forceReprocess: true,
            createdBy: currentUser ? currentUser.email : "Desconocido"
          })
        });
        
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`);
        console.log(`✅ [ÉXITO] Video analizado: ${videoUrl}`);
      } catch (error) {
        console.error(`❌ [ERROR] Falló ${videoUrl}:`, error.message);
      }
    }
    console.log("🎉 Lote completado. Recargando la galería...");
    if (gallery) gallery.loadLibrary();
  };
}