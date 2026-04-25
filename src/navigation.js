export function setupNavigation(refreshLibrary, earComponent) {
  const homeView = document.getElementById("home-view");
  const playerView = document.getElementById("player-view");
  const btnBackHome = document.getElementById("btn-back-home");

  function openPlayer(url = "") {
    homeView.style.display = "none"; playerView.style.display = "grid"; btnBackHome.style.display = "block";
    document.getElementById("video-url").value = url;
    
    if (url) {
      document.getElementById("load-video").click(); document.getElementById("process-video").click();
    } else {
      document.getElementById("stop-video").click(); document.getElementById("video-container").innerHTML = ""; document.getElementById("video-info").style.display = "none";
      earComponent.showTranscript("Esperando audio...");
      ['keywords', 'summary', 'summary-es', 'analysis'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = `<p>Vacío</p>`; });
      document.getElementById("dict-text-display").value = "Esperando transcripción...";
    }
  }

  document.getElementById("btn-new-video").addEventListener("click", () => openPlayer(""));
  btnBackHome.addEventListener("click", () => {
    playerView.style.display = "none"; homeView.style.display = "block"; btnBackHome.style.display = "none";
    document.getElementById("stop-video").click(); document.getElementById("video-container").innerHTML = ""; document.getElementById("video-url").value = "";
    if (refreshLibrary) refreshLibrary();
  });

  return { openPlayer };
}