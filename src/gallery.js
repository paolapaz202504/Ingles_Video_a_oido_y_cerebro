export function setupGallery(onPlayVideo) {
  const galleryEl = document.getElementById("video-gallery");
  let videos = [];
  let currentPage = 1;
  let pageSize = 10;

  async function loadLibrary() {
    try {
      const res = await fetch("/api/library");
      videos = await res.json();
      populateFilters(); renderGallery();
    } catch (e) { console.error(e); }
  }

  function populateFilters() {
    const cat = new Set(), tag = new Set();
    videos.forEach(v => { if (v.category) cat.add(v.category); if (v.tags) v.tags.forEach(t => tag.add(t)); });
    document.getElementById("search-category").innerHTML = '<option value="">Todas</option>' + [...cat].map(c => `<option value="${c}">${c}</option>`).join("");
    document.getElementById("search-tag").innerHTML = '<option value="">Todos</option>' + [...tag].map(t => `<option value="${t}">${t}</option>`).join("");
  }

  function parseDate(d) {
    if (!d) return 0;
    const p = d.split(" "); if (p.length !== 2) return 0;
    const [D, M, Y] = p[0].split("/"); const [h, m, s] = p[1].split(":");
    return new Date(Y, M - 1, D, h, m, s).getTime();
  }

  function renderGallery(resetPage = false) {
    if (resetPage === true) currentPage = 1;

    const text = document.getElementById("search-text")?.value.toLowerCase() || "";
    const cat = document.getElementById("search-category")?.value || "";
    const tag = document.getElementById("search-tag")?.value || "";
    const sort = document.getElementById("search-sort")?.value || "desc";
    
    const filtered = videos.filter(v => (v.title.toLowerCase().includes(text) || v.description.toLowerCase().includes(text)) && (!cat || v.category === cat) && (!tag || (v.tags && v.tags.includes(tag))));
    filtered.sort((a, b) => sort === "desc" ? parseDate(b.date) - parseDate(a.date) : parseDate(a.date) - parseDate(b.date));

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedVideos = filtered.slice(startIndex, startIndex + pageSize);

    const cardsHtml = paginatedVideos.map(v => {
      let icon = '🌐 Web';
      if (v.platform.includes('youtube')) icon = '▶️ YouTube'; else if (v.platform.includes('x')) icon = '𝕏 X'; else if (v.platform.includes('twitter')) icon = '𝕏 X'; else if (v.platform.includes('tiktok')) icon = '🎵 TikTok'; else if (v.platform.includes('instagram')) icon = '📸 IG'; else if (v.platform.includes('facebook')) icon = 'Facebook';
      return `<div class="gallery-card">
        <div style="height: 180px; background: #0f172a; position: relative;">
          ${v.thumbnail ? `<img src="${v.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="padding:2rem; text-align:center; color:#888; height:100%; display:flex; align-items:center; justify-content:center;">Sin portada</div>`}
          <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem; font-weight: bold;">${v.totalTime ? v.totalTime.replace(/^0h\s*/, '') : '00:00'}</div>
        </div>
        <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
          <h3 style="margin: 0 0 0.5rem 0;">${v.title}</h3>
          <p style="margin: 0 0 1rem 0; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${v.description}</p>
          <div style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <span class="badge badge-indigo">${v.category}</span><span class="badge badge-teal">${icon}</span>
            <span class="badge" style="background: #F8FAFC; color: #475569; border: 1px solid #E2E8F0; text-transform: none; letter-spacing: normal;" title="Procesado por">👤 ${v.createdBy || 'Desconocido'}</span>
          </div>
          <button class="ui-btn play-lib-btn" data-url="${v.url}" style="width: 100%;">▶ Aprender</button>
        </div>
      </div>`;
    }).join("");

    const paginationHtml = `
      <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: #FFFFFF; border-radius: 16px; border: 2px solid #E2E8F0; margin-top: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label for="page-size" style="font-weight: bold; color: #1E293B;">Mostrar:</label>
          <select id="page-size" class="search-input" style="padding: 0.5rem 2rem 0.5rem 1rem; min-width: auto;">
            <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
            <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button id="btn-prev-page" class="ui-btn" ${currentPage === 1 ? 'disabled' : ''} style="padding: 8px 16px;">Anterior</button>
          <span style="font-weight: bold; color: #64748B;">Página ${currentPage} de ${totalPages}</span>
          <button id="btn-next-page" class="ui-btn" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 8px 16px;">Siguiente</button>
        </div>
      </div>
    `;

    galleryEl.innerHTML = totalItems > 0 
      ? cardsHtml + paginationHtml 
      : '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748B; font-size: 1.2rem; background: #FFFFFF; border-radius: 16px; border: 2px solid #E2E8F0;">No se encontraron videos con esos filtros.</div>';

    document.querySelectorAll('.play-lib-btn').forEach(btn => {
      btn.addEventListener('click', (e) => onPlayVideo(e.target.dataset.url));
    });

    if (totalItems > 0) {
      document.getElementById('page-size').addEventListener('change', (e) => { pageSize = parseInt(e.target.value); currentPage = 1; renderGallery(false); });
      document.getElementById('btn-prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderGallery(false); } });
      document.getElementById('btn-next-page').addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderGallery(false); } });
    }
  }

  const filterHandler = () => renderGallery(true);

  document.getElementById("search-text")?.addEventListener("input", filterHandler);
  document.getElementById("search-category")?.addEventListener("change", filterHandler);
  document.getElementById("search-tag")?.addEventListener("change", filterHandler);
  document.getElementById("search-sort")?.addEventListener("change", filterHandler);

  return { loadLibrary };
}