export function injectGamifiedStyles() {
  const style = document.createElement('style');
  style.innerHTML = `/* === Estilos Globales === */
    body { background-color: #F8FAFC !important; color: #1E293B !important; }

    /* === Botones Modernos === */
    .ui-btn {
      background: #6366F1; color: white; border: none; padding: 12px 20px; border-radius: 12px;
      font-weight: bold; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 0 #4F46E5;
      text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.1s; display: inline-block; text-align: center;
    }
    .ui-btn:active { transform: translateY(4px); box-shadow: 0 0 0 transparent; }
    .ui-btn-teal { background: #14B8A6; box-shadow: 0 4px 0 #0D9488; }
    .ui-btn-amber { background: #F59E0B; box-shadow: 0 4px 0 #D97706; color: #1E293B; }
    .ui-btn:disabled { background: #CBD5E1; box-shadow: 0 4px 0 #94A3B8; color: #64748B; cursor: not-allowed; }

    .panel-card { background: #FFFFFF; border: 2px solid #E2E8F0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); color: #1E293B; margin-bottom: 1.5rem; }
    .panel-card h2 { color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 0.5rem; margin-top: 0; margin-bottom: 0.4rem; font-size: 1.3rem; }

    .modal-content { background: #FFFFFF !important; border: 2px solid #E2E8F0; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); color: #1E293B; }
    .close-btn { color: #64748B !important; }
    .close-btn:hover { color: #0F172A !important; }

    .gallery-card {
      background: #FFFFFF; border: 2px solid #E2E8F0; border-radius: 16px; overflow: hidden;
      transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); color: #1E293B; display: flex; flex-direction: column;
    }
    .gallery-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -5px rgba(0,0,0,0.1); border-color: #CBD5E1; }
    .gallery-card h3 { color: #0F172A; font-weight: 800; letter-spacing: 0.2px; }
    .gallery-card p { color: #64748B; line-height: 1.5; }
    .badge { padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-indigo { color: #4F46E5; background: #EEF2FF; }
    .badge-teal { color: #0D9488; background: #F0FDFA; }

    /* === Buscador y Filtros === */
    .search-container {
      background: #FFFFFF; padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem;
      display: flex; gap: 1rem; flex-wrap: wrap; border: 2px solid #E2E8F0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); align-items: center;
    }
    .search-input {
      padding: 0.85rem 1.2rem; border-radius: 12px; border: 2px solid #CBD5E1;
      background: #F8FAFC; color: #1E293B; outline: none; font-size: 1rem;
      font-family: inherit; transition: all 0.2s;
    }
    .search-input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); background: #FFFFFF; }
    .search-input.flex-1 { flex: 1; min-width: 250px; }
    select.search-input { cursor: pointer; appearance: none; padding-right: 2.5rem; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1.2rem center; background-size: 1.2em; }

    /* === Tarjetas Phrasal Verbs === */
    .pv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 1rem; }
    .pv-card {
      border-radius: 16px; padding: 20px; color: white; position: relative; overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; cursor: pointer;
    }
    .pv-card:hover { transform: scale(1.02); }
    .pv-card::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 100%); pointer-events: none; }

    /* === Estilos Player & Análisis === */
    label[for="video-url"] { display: inline-block; margin-bottom: 0.25rem; font-weight: bold; font-size: 0.9rem; color: #475569; }
    #video-url {
      background: #FFFFFF; border: 2px solid #CBD5E1; border-radius: 12px;
      padding: 10px 14px; color: #1E293B; font-size: 0.95rem; width: 100%;
      box-sizing: border-box; font-family: inherit; transition: border-color 0.2s; margin-bottom: 0.5rem;
    }
    #video-url:focus { outline: none; border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    
    /* Botones de acción del video más compactos */
    #load-video, #process-video { padding: 10px 16px; font-size: 0.9rem; margin-bottom: 0.5rem; }
    
    #video-container { margin-top: 0.25rem; }

    /* === Paneles y Cajas de Texto === */
    .left-panel, .right-panel { background: transparent !important; }
    .content-box.output-box {
      background-color: #FFFFFF !important; color: #334155 !important;
      border: 2px solid #E2E8F0 !important; border-radius: 12px; padding: 1rem;
      font-size: 1rem; line-height: 1.5; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    #dict-text-display {
      background-color: #FFFFFF !important; color: #334155 !important;
      border: 2px solid #CBD5E1 !important; border-radius: 12px; padding: 1rem;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important; outline: none;
    }
    #dict-text-display:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }

    /* === Controles de Video === */
    .controls { background: #FFFFFF !important; padding: 0.75rem; display: flex; justify-content: center; gap: 0.75rem; margin-top: 0.5rem; border-radius: 12px; }
    .media-btn {
      background: #EEF2FF; color: #4F46E5; border: 2px solid #C7D2FE;
      border-radius: 12px; padding: 10px 20px; font-weight: 800; font-size: 0.95rem;
      cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 #A5B4FC;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .media-btn:active { transform: translateY(4px); box-shadow: 0 0 0 transparent; }
    .media-btn:hover { background: #E0E7FF; }

    /* === Controles de Dictado === */
    .dict-btn {
      background: #F8FAFC; color: #1E293B; border: 2px solid #CBD5E1;
      border-radius: 10px; padding: 8px 16px; font-weight: 800; font-size: 0.85rem;
      cursor: pointer; transition: all 0.1s; box-shadow: 0 3px 0 #94A3B8;
    }
    .dict-btn:active { transform: translateY(3px); box-shadow: 0 0 0 transparent; }
    .dict-btn:hover { background: #F1F5F9; }
    .dict-btn-primary { background: #F0FDFA; color: #0D9488; border-color: #99F6E4; box-shadow: 0 3px 0 #5EEAD4; }
    .dict-btn-primary:hover { background: #CCFBF1; }

    #brain-container .tabs button {
      background: transparent; color: #64748B; border: none;
      border-bottom: 3px solid transparent;
      padding: 12px 16px; cursor: pointer; border-radius: 0;
      font-weight: bold; transition: all 0.2s; margin: 0; font-size: 1rem;
    }
    #brain-container .tabs button.active { color: #6366F1; border-bottom-color: #6366F1; }

    .analysis-section {
      background: #FFFFFF; border: 2px solid #E2E8F0; border-radius: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      padding: 1.5rem; margin-bottom: 1rem; color: #334155; border-left: 6px solid #6366F1;
    }
    .analysis-section.border-teal { border-left-color: #14B8A6; }
    .analysis-section.border-amber { border-left-color: #F59E0B; }
    .analysis-section.border-purple { border-left-color: #8B5CF6; }
    .analysis-section.border-indigo { border-left-color: #6366F1; }

    .analysis-section h3 {
      margin-top: 0; color: #1E293B; border-bottom: 2px solid #F1F5F9;
      padding-bottom: 0.75rem; margin-bottom: 1rem; font-size: 1.2rem;
    }

    #transcript-container { color: #334155; line-height: 1.6; }
    #transcript-container .segment.active { background-color: #EEF2FF !important; border-left: 4px solid #6366F1; color: #0F172A; font-weight: 600; }
    #transcript-container .segment { transition: all 0.2s ease-in-out; border-left: 4px solid transparent; padding: 8px 12px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; color: #64748B; }
    #transcript-container .segment:hover { background-color: #F8FAFC; }

    /* === Scrollbar Personalizado (Transcripción) === */
    #transcript { scrollbar-width: thin; scrollbar-color: #CBD5E1 #FFFFFF; }
    #transcript::-webkit-scrollbar { width: 10px; }
    #transcript::-webkit-scrollbar-track { background: #FFFFFF; border-radius: 8px; }
    #transcript::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 8px; border: 2px solid #FFFFFF; }
    #transcript::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

    /* === Estilos Modales Diccionario === */
    .play-audio-btn {
      background: #6366F1; color: white; border: none; border-radius: 50%; width: 45px; height: 45px;
      font-size: 20px; cursor: pointer; box-shadow: 0 4px 0 #4F46E5; transition: all 0.1s; display: flex; align-items: center; justify-content: center;
    }
    .play-audio-btn:active { transform: translateY(4px); box-shadow: 0 0 0 transparent; }
    .dict-part { background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 12px; color: #334155; }
  `;
  document.head.appendChild(style);
}