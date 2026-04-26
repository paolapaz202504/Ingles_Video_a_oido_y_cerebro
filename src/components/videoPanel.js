export function setupVideoPanel(onProcess, onTimeUpdate, onStop) {
  const videoUrlInput = document.getElementById("video-url");
  const loadButton = document.getElementById("load-video");
  const processButton = document.getElementById("process-video");
  const playButton = document.getElementById("play-video");
  const pauseButton = document.getElementById("pause-video");
  const stopButton = document.getElementById("stop-video");
  const videoContainer = document.getElementById("video-container");

  loadButton.title = "Mostrar Video (Ctrl + M)";
  processButton.title = "Analizar Video (Ctrl + A)";
  playButton.title = "Reproducir (Ctrl + R)";
  pauseButton.title = "Pausa (Ctrl + P)";
  stopButton.title = "Detener (Ctrl + D)";

  let videoElement = null;
  let iframeElement = null;
  let ytPlayer = null;
  let simulatedTime = 0;
  let timeTracker = null;
  let segmentEndTime = null;
  let currentPlaybackRate = 1;
  let currentAudioFilter = "normal";
  let audioCtx = null;
  let sourceNode = null;
  let filterNodes = [];

  // Función para mostrar alertas estilizadas (Toast) integradas al diseño
  function showCustomAlert(message, isError = false) {
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
    alertBox.innerHTML = isError ? `⚠️ ${message}` : `ℹ️ ${message}`;
    alertBox.style.display = "block";
    void alertBox.offsetWidth; // Forzar el reflow para transición
    alertBox.style.opacity = "1";
    alertBox.style.transform = "translateY(0)";
    setTimeout(() => {
      alertBox.style.opacity = "0";
      alertBox.style.transform = "translateY(20px)";
      setTimeout(() => { if (alertBox.style.opacity === "0") alertBox.style.display = "none"; }, 300);
    }, 4000);
  }

  function stopTimeTracking() {
    if (timeTracker) {
      clearInterval(timeTracker);
      timeTracker = null;
    }
  }

  function startTimeTrackingNative() {
    stopTimeTracking();
    timeTracker = setInterval(() => {
      if (videoElement) {
        simulatedTime = videoElement.currentTime;
        if (onTimeUpdate) onTimeUpdate(simulatedTime);
        if (segmentEndTime !== null && simulatedTime >= segmentEndTime) {
          videoElement.pause();
          segmentEndTime = null;
        }
      }
    }, 100);
  }

  function startTimeTrackingYT() {
    stopTimeTracking();
    timeTracker = setInterval(() => {
      if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
        simulatedTime = ytPlayer.getCurrentTime();
        if (onTimeUpdate) onTimeUpdate(simulatedTime);
        if (segmentEndTime !== null && simulatedTime >= segmentEndTime) {
          ytPlayer.pauseVideo();
          segmentEndTime = null;
        }
      }
    }, 100);
  }

  function startTimeTrackingGeneric() {
    stopTimeTracking();
    timeTracker = setInterval(() => {
      simulatedTime += 0.1;
      if (onTimeUpdate) onTimeUpdate(simulatedTime);
      if (segmentEndTime !== null && simulatedTime >= segmentEndTime) { segmentEndTime = null; }
    }, 100);
  }

  function createVideoElement(url, forceNative = false, thumbnail = "") {
    videoContainer.innerHTML = "";
    videoElement = null;
    iframeElement = null;
    ytPlayer = null;
    simulatedTime = 0;
    segmentEndTime = null;
    stopTimeTracking();
    
    if (sourceNode) { sourceNode.disconnect(); sourceNode = null; }
    if (filterNodes) { filterNodes.forEach(n => n.disconnect()); filterNodes = []; }
    if (videoElement) { delete videoElement.dataset.audioRouted; }
    if (onStop) onStop();

    if (!forceNative && /youtu\.be|youtube\.com/i.test(url)) {
      const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
      const videoId = videoIdMatch?.[1] || "";
      
      const div = document.createElement("div");
      div.id = "yt-player-container";
      div.style.width = "100%";
      div.style.minHeight = "360px";
      videoContainer.appendChild(div);

      const initYT = () => {
        ytPlayer = new window.YT.Player('yt-player-container', {
          videoId: videoId,
          playerVars: { 'playsinline': 1 },
          events: {
            'onReady': (event) => {
              if (event.target.getDuration() > 300) {
                showCustomAlert("El video no debe superar los 5 minutos.", true);
                videoContainer.innerHTML = "";
                ytPlayer = null;
              }
            },
            'onStateChange': (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                startTimeTrackingYT();
              } else {
                stopTimeTracking();
              }
            }
          }
        });
      };

      if (window.YT && window.YT.Player) {
        initYT();
      } else {
        window.onYouTubeIframeAPIReady = initYT;
        if (!document.getElementById("yt-api-script")) {
          const tag = document.createElement('script');
          tag.id = "yt-api-script";
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
      }
    } else if (!forceNative && /x\.com|twitter\.com|instagram\.com|tiktok\.com|facebook\.com/i.test(url)) {
      const iframe = document.createElement("iframe");
      iframe.src = buildEmbedUrl(url);
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.style.width = "100%";
      iframe.style.minHeight = "360px";
      videoContainer.appendChild(iframe);
      iframeElement = iframe;
    } else {
      const video = document.createElement("video");
      video.controls = true;
      video.style.width = "100%";
      // Ocultar el Referer para que los CDNs de redes sociales no bloqueen el video
      video.setAttribute("referrerpolicy", "no-referrer");
      video.setAttribute("crossorigin", "anonymous"); // Permiso requerido para procesar el audio
      if (thumbnail) {
        video.setAttribute("poster", thumbnail);
      }
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        if (video.duration > 300) {
          showCustomAlert("El video no debe superar los 5 minutos.", true);
          videoContainer.innerHTML = "";
          videoElement = null;
        }
      });
      video.addEventListener("play", () => {
        startTimeTrackingNative();
        // Auto-conectar el filtro almacenado si existía
        if (currentAudioFilter !== "normal" && !video.dataset.audioRouted) {
          applyAudioFilter(currentAudioFilter);
        }
      });
      video.addEventListener("pause", stopTimeTracking);
      video.addEventListener("ended", () => {
        stopTimeTracking();
        if (onStop) onStop();
      });
      videoContainer.appendChild(video);
      videoElement = video;
    }
  }

  function buildEmbedUrl(url) {
    if (/x\.com|twitter\.com/i.test(url)) {
      const tweetIdMatch = url.match(/status\/(\d+)/);
      const tweetId = tweetIdMatch ? tweetIdMatch[1] : "";
      return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
    }
    if (/instagram\.com/i.test(url)) {
      return `https://www.instagram.com/p/${encodeURIComponent(url.split("/").pop())}/embed/`;
    }
    if (/tiktok\.com/i.test(url)) {
      const videoIdMatch = url.match(/\/video\/(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : "";
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    }
    if (/facebook\.com/i.test(url)) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
    }
    return url;
  }

  loadButton.addEventListener("click", async () => {
    const url = videoUrlInput.value.trim();
    if (!url) {
      showCustomAlert("Ingresa la URL de un video primero.", true);
      return;
    }

    // Si es una red social sin control de API, buscamos la URL nativa
    if (/youtu\.be|youtube\.com|tiktok\.com|x\.com|twitter\.com|instagram\.com|facebook\.com/i.test(url)) {
      loadButton.disabled = true;
      loadButton.textContent = "Extrayendo video...";
      try {
        const response = await fetch("/api/direct-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        if (!response.ok) throw new Error("Fallo en la extracción");
        let { directUrl, thumbnail } = await response.json();
        
        // Enrutamos videos de redes sociales a través de nuestro proxy para evadir el error 403 (CORS/Hotlinking)
        if (/youtu\.be|youtube\.com|x\.com|twitter\.com|tiktok\.com|facebook\.com|instagram\.com/i.test(url)) {
          directUrl = `/api/proxy-video?url=${encodeURIComponent(directUrl)}`;
        }

        createVideoElement(directUrl, true, thumbnail); // true = Fuerza el reproductor nativo, asignamos miniatura
      } catch (error) {
        showCustomAlert("No se pudo extraer la URL nativa. Usando reproductor incrustado (sin filtros de voz).", true);
        createVideoElement(url, false);
      }
      loadButton.disabled = false;
      loadButton.textContent = "Mostrar Video";
    } else {
      createVideoElement(url, false);
    }
  });

  playButton.addEventListener("click", () => {
    segmentEndTime = null; // Reiniciamos el límite por si el usuario le da play manualmente
    if (videoElement) {
      videoElement.play();
    } else if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      ytPlayer.playVideo();
    } else if (iframeElement) {
      showCustomAlert("Para reproductores incrustados, haz clic en el botón de reproducir directamente dentro del video.", false);
      startTimeTrackingGeneric();
    }
  });

  pauseButton.addEventListener("click", () => {
    segmentEndTime = null;
    if (videoElement) {
      videoElement.pause();
    } else if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      ytPlayer.pauseVideo();
    } else if (iframeElement) {
      showCustomAlert("Utiliza los controles dentro del reproductor de la red social para pausar el video.", false);
    }
    stopTimeTracking();
  });

  stopButton.addEventListener("click", () => {
    segmentEndTime = null;
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
      simulatedTime = 0;
    } else if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
      ytPlayer.stopVideo();
      ytPlayer.seekTo(0);
      simulatedTime = 0;
    } else if (iframeElement) {
      const currentSrc = iframeElement.src;
      iframeElement.src = currentSrc; // Recarga el iframe, cortando el audio automáticamente
    }
    stopTimeTracking();
    if (onStop) onStop();
  });

  processButton.addEventListener("click", async () => {
    const url = videoUrlInput.value.trim();
    if (!url) {
      showCustomAlert("Debes pegar un link de video primero.", true);
      return;
    }

    const storedUser = localStorage.getItem('viooido_user');
    if (!storedUser) {
      showCustomAlert("Inicia sesión con tu cuenta de Gmail para guardar un video.", true);
      return;
    }
    const user = JSON.parse(storedUser);
    const createdBy = user.email;

    // Verificación en el frontend si el video ya se cargó en el reproductor
    let duration = 0;
    if (videoElement && !isNaN(videoElement.duration)) {
      duration = videoElement.duration;
    } else if (ytPlayer && typeof ytPlayer.getDuration === 'function') {
      duration = ytPlayer.getDuration();
    }
    
    if (duration > 300) {
      showCustomAlert("El video no debe superar los 5 minutos.", true);
      return;
    }

    processButton.disabled = true;
    processButton.textContent = "Procesando...";
    await onProcess(url, createdBy);
    processButton.disabled = false;
    processButton.textContent = "Analizar Video";
  });

  // Atajos de teclado globales para la sección de Video
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "m") { e.preventDefault(); loadButton.click(); }
      if (key === "a") { e.preventDefault(); processButton.click(); }
      if (key === "r") { e.preventDefault(); playButton.click(); }
      if (key === "p") { e.preventDefault(); pauseButton.click(); }
      if (key === "d") { e.preventDefault(); stopButton.click(); }
    }
  });

  // Ecualizador Digital DSP usando Web Audio API
  function applyAudioFilter(profile) {
    currentAudioFilter = profile;
    
    if (ytPlayer || iframeElement) {
      if (profile !== "normal") {
        showCustomAlert("Los filtros de voz están bloqueados por seguridad (CORS) en YouTube. Usa un origen distinto (X/TikTok) para probarlos.", true);
        const selectUI = document.getElementById("dict-freq");
        if (selectUI) selectUI.value = "normal";
      }
      return;
    }
    
    if (!videoElement) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!videoElement.dataset.audioRouted) {
      try {
        sourceNode = audioCtx.createMediaElementSource(videoElement);
        videoElement.dataset.audioRouted = "true";
      } catch (e) {
        console.error("CORS impidió el ruteo de audio:", e);
        return;
      }
    }

    if (sourceNode) sourceNode.disconnect();
    filterNodes.forEach(n => n.disconnect());
    filterNodes = [];

    if (profile === "normal") {
      if (sourceNode) sourceNode.connect(audioCtx.destination);
      return;
    }

    const createFilter = (type, freq, gain = 0) => {
      const f = audioCtx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.gain.value = gain; return f;
    };

    if (profile === "intelligibility") {
      filterNodes = [createFilter("highpass", 300), createFilter("lowpass", 3000), createFilter("peaking", 1500, 3)];
    } else if (profile === "laughs") {
      filterNodes = [createFilter("highpass", 500), createFilter("lowpass", 4000)];
    } else if (profile === "consonants") {
      filterNodes = [createFilter("highpass", 2000), createFilter("lowpass", 7000), createFilter("peaking", 5000, 5)];
    } else if (profile === "hum") {
      filterNodes = [createFilter("highpass", 100)]; // Corte debajo de 100Hz aislando hum
    }

    if (filterNodes.length > 0 && sourceNode) {
      sourceNode.connect(filterNodes[0]);
      for (let i = 0; i < filterNodes.length - 1; i++) {
        filterNodes[i].connect(filterNodes[i+1]);
      }
      filterNodes[filterNodes.length - 1].connect(audioCtx.destination);
    }
  }

  return {
    getVideoElement: () => videoElement,
    setAudioFilter: applyAudioFilter,
    setPlaybackRate: (rate) => {
      currentPlaybackRate = rate;
      if (videoElement) {
        videoElement.playbackRate = rate;
      } else if (ytPlayer && typeof ytPlayer.setPlaybackRate === 'function') {
        ytPlayer.setPlaybackRate(rate);
      }
    },
    playSegment: (start, end) => {
      segmentEndTime = end + 1; // Añadimos 350ms de gracia (resonancia acústica) para no cortar la última sílaba abruptamente
      if (videoElement) {
        videoElement.currentTime = start === 0 ? start : start - 1; // Retrocedemos un poco para capturar la consonante inicial
        videoElement.playbackRate = currentPlaybackRate;
        videoElement.play();
      } else if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
        ytPlayer.seekTo(start, true);
        ytPlayer.setPlaybackRate(currentPlaybackRate);
        ytPlayer.playVideo();
      } else if (iframeElement) {
        showCustomAlert("El control de tiempo exacto no está disponible para reproductores incrustados.", true);
      }
    }
  };
}
