# Video Oído y Cerebro

Proyecto Node.js que transcribe videos desde enlaces de YouTube, X, Instagram, TikTok o Facebook usando la API de Gemini para generar transcripciones, palabras clave, traducciones de diccionarios y resúmenes. Implementa arquitectura MVC y Programación Orientada a Objetos (POO).

## Estructura

- `server.js`: Punto de entrada de la aplicación y configuración del servidor Express.
- `src/controllers/`: Controladores para manejar la lógica de las peticiones (ej. `VideoController.js`, `DictionaryController.js`).
- `src/models/`: Clases de lógica de negocio e integración con APIs externas (ej. `VideoModel.js`, `GeminiModel.js`, `DictionaryModel.js`).
- `src/routes/`: Definición de los endpoints de la API (ej. `videoRoutes.js`, `dictionaryRoutes.js`).
- `src/utils/`: Utilidades y gestión de almacenamiento (ej. `cacheManager.js`, `helpers.js`).
- `public/`: Recursos estáticos que conforman la Vista (HTML, CSS).
- `src/components/`: Lógica del frontend y componentes de interfaz de usuario.
- `cache/`: Almacenamiento local de respuestas (Gemini, FreeDictionary, Lingva, MyMemory) optimizando los tiempos de respuesta y costos de API.

## Requisitos

- Node.js 18+
- `ffmpeg` instalado y disponible en PATH (winget install Gyan.FFmpeg)
- `yt-dlp` instalado o `youtube-dl-exec` con soporte para descargas
- `GEMINI_API_KEY` configurada en `.env`

## Instalación

1. Instalar dependencias Node:

```bash
npm install
```

2. Crear `.env` basado en `.env.example` y configurar:

```env
GEMINI_API_KEY=tu_api_key_gemini
```

3. Instalar dependencias Python:

```bash
python -m pip install faster-whisper
```

4. Iniciar el servidor:

```bash
npm start
```

## Uso

1. Abrir `http://localhost:3000`
2. Pegar el enlace del video en el panel izquierdo
3. Presionar "Transcribir y analizar"
4. Ver transcripción, palabras clave y resumen en el panel derecho
