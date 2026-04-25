import { setupVideoPanel } from "./components/videoPanel.js";
import { setupEarComponent } from "./components/earComponent.js";
import { setupDictationComponent } from "./components/dictationComponent.js";
import { injectGamifiedStyles } from "./ui.js";
import { setupAuth } from "./auth.js";
import { setupDictionary } from "./dictionary.js";
import { setupGallery } from "./gallery.js";
import { setupNavigation } from "./navigation.js";
import { setupPlayer } from "./player.js";
import { setupBatchProcess } from "./batchProcess.js";

// 1. Inyección de CSS moderno
injectGamifiedStyles();

// 2. Inicialización de Estado y Autenticación
const auth = setupAuth();
const ear = setupEarComponent();

// 3. Orquestación del panel de Video
let dictation = null;
const videoPanelObj = setupVideoPanel(
  // onProcess
  (videoUrl) => setupPlayer(videoUrl, auth, ear, dictation),
  // onTimeUpdate
  (currentTime) => ear.updateTime(currentTime),
  // onStop
  () => { 
    ear.resetHighlight(); 
    ear.updateTime(0); 
  }
);

// 4. Inicialización de Módulos App
dictation = setupDictationComponent(videoPanelObj);
let gallery = null;
const navigation = setupNavigation(() => { if (gallery) gallery.loadLibrary(); }, ear);
gallery = setupGallery((url) => navigation.openPlayer(url));
setupDictionary(auth);

// 5. Inicialización de herramientas internas
setupBatchProcess(auth, gallery);

// Carga inicial de la biblioteca de videos
gallery.loadLibrary();
