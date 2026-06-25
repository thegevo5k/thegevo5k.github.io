// script.js
let allDownloads = [];
let searchTerm = '';

async function loadDownloads() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`downloads.json?t=${timestamp}`);
    allDownloads = await response.json();

    renderHomepage();
    setupSearch();
    setupLightbox();
    setupTabs();

    const urlParams = new URLSearchParams(window.location.search);
    const itemSku = urlParams.get('item');
    if (itemSku) {
      showItemDetail(itemSku);
    } else if (urlParams.get('tab') === 'downloads') {
      applyTab('downloads');
      document.title = tabTitle('downloads');
    }

    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;
  } catch (error) {
    console.error("Could not load downloads.json", error);
  }
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    searchTerm = input.value.trim().toLowerCase();
    renderHomepage();
  });
}

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function applyTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `${tab}-tab`);
  });
}

function tabTitle(tab) {
  return tab === 'downloads' ? 'We Play Simulators | Downloads' : 'We Play Simulators';
}

// Used for user-initiated tab clicks: updates the DOM AND pushes a new URL/title
function switchTab(tab) {
  applyTab(tab);
  document.title = tabTitle(tab);
  const url = tab === 'downloads' ? '?tab=downloads' : window.location.pathname;
  window.history.pushState({}, '', url);
}

function setupLightbox() {
  document.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;

    // Never expand the site logo
    if (img.classList.contains('logo')) return;

    // Skip requirement-card thumbnails — they already navigate/open links on click
    if (img.closest('.link-preview-item')) return;

    // Skip homepage catalog thumbnails
    if (img.closest('.download-grid')) return;

    // Skip the lightbox's own image/close button
    if (img.closest('#lightbox')) return;

    // The product detail slideshow gets a synced, navigable lightbox
    if (img.id === 'detail-main-image' && currentDetailItem && (currentDetailItem.detectedImageCount || 1) > 1) {
      openLightboxSlideshow();
      return;
    }

    openLightbox(img.src);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();

    const overlay = document.getElementById('lightbox');
    if (overlay && overlay.classList.contains('open') && overlay.classList.contains('slideshow-mode')) {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    }
  });
}

function openLightbox(src) {
  const overlay = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!overlay || !img) return;

  overlay.classList.remove('slideshow-mode');
  img.src = src;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openLightboxSlideshow() {
  const overlay = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!overlay || !img || !currentDetailItem) return;

  img.src = getImagePath(currentDetailItem.sku, currentImageIndex);
  overlay.classList.add('open', 'slideshow-mode');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const overlay = document.getElementById('lightbox');
  if (!overlay) return;

  overlay.classList.remove('open', 'slideshow-mode');
  document.body.style.overflow = '';
}

function matchesSearch(item) {
  if (!searchTerm) return true;
  return (item.name || '').toLowerCase().includes(searchTerm)
      || (item.short || '').toLowerCase().includes(searchTerm)
      || (item.category || '').toLowerCase().includes(searchTerm);
}

function getImagePath(sku, number = 1) {
  return `images/${sku}/${number.toString().padStart(2, '0')}.jpg`;
}

// Auto-detects how many sequential numbered images exist for a SKU (01.jpg, 02.jpg, ...)
// by probing each in order until one fails to load. Cached per SKU for the session.
const imageCountCache = {};

function detectImageCount(sku, maxCheck = 30) {
  if (imageCountCache[sku] !== undefined) {
    return Promise.resolve(imageCountCache[sku]);
  }

  return new Promise(resolve => {
    let found = 0;

    function probe(n) {
      if (n > maxCheck) {
        imageCountCache[sku] = found;
        resolve(found);
        return;
      }

      const img = new Image();
      img.onload = () => {
        found = n;
        probe(n + 1);
      };
      img.onerror = () => {
        imageCountCache[sku] = found;
        resolve(found);
      };
      img.src = getImagePath(sku, n);
    }

    probe(1);
  });
}

// Single source of truth for all catalog categories: id (used for element IDs/slugs),
// label (shown to users), category (matches the "category" field in downloads.json),
// and a CSS class suffix for the colored badge.
const CATEGORIES = [
  { id: 'locomotives',  label: 'Locomotives',  category: 'Locomotives',  badgeClass: 'locomotives' },
  { id: 'quickdrives',  label: 'Quick Drives',  category: 'Quick Drives',  badgeClass: 'quickdrives' },
  { id: 'dependencies', label: 'Dependencies',  category: 'Dependencies',  badgeClass: 'dependencies' },
  { id: 'routes',       label: 'Routes',        category: 'Routes',        badgeClass: 'routes' },
  { id: 'rollingstock', label: 'Rolling Stock', category: 'Rolling Stock', badgeClass: 'rollingstock' },
  { id: 'scenery',      label: 'Scenery',       category: 'Scenery',       badgeClass: 'scenery' },
  { id: 'sounds',       label: 'Sounds',        category: 'Sounds',        badgeClass: 'sounds' }
];

function renderHomepage() {
  document.getElementById('main-content').innerHTML = CATEGORIES.map(cat => `
    <section id="${cat.id}">
      <h2>${cat.label}</h2>
      <div id="${cat.id}-grid" class="download-grid"></div>
    </section>
  `).join('');

  const filtered = allDownloads.filter(matchesSearch);

  CATEGORIES.forEach(cat => {
    renderSection(`${cat.id}-grid`, filtered.filter(d => d.category === cat.category));
  });

  // Hide a section entirely if search leaves it with no results
  CATEGORIES.forEach(cat => {
    const section = document.getElementById(cat.id);
    const grid = document.getElementById(`${cat.id}-grid`);
    if (section && grid) {
      section.style.display = grid.children.length === 0 ? 'none' : '';
    }
  });
}

function renderSection(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'download-item';
    const coverSrc = getImagePath(item.sku, 1);
    const categoryClass = (CATEGORIES.find(c => c.category === item.category) || {}).badgeClass || 'dependencies';

    div.innerHTML = `
      <div class="image-wrap">
        <span class="category-badge ${categoryClass}">${item.category}</span>
        <img src="${coverSrc}" alt="${item.name}" class="item-image" onerror="this.style.display='none'">
      </div>
      <h3>${item.name}</h3>
      <p>${item.short}</p>
      <button onclick="showItemDetail('${item.sku}')" class="btn-small">View & Download</button>
    `;
    container.appendChild(div);
  });
}

function showItemDetail(sku) {
  const item = allDownloads.find(i => i.sku === sku);
  if (!item) return;

  const detailPage = document.getElementById('item-detail');
  const catalogView = document.getElementById('catalog-view');

  // Smooth scroll to top so user isn't stuck at the bottom layout height
  window.scrollTo({ top: 0, behavior: 'smooth' });

  applyTab('downloads');
  catalogView.style.display = 'none';
  detailPage.style.display = 'block';
  detailPage.style.animation = 'fadeInUp 0.4s ease-out';

  window.history.pushState({}, '', `?item=${sku}`);
  document.title = `We Play Simulators | ${item.name}`;

  let requirementsHTML = '';
  if (item.requirements && item.requirements.length > 0) {
    requirementsHTML = `
      <h3 class="detail-section-title">Requirements</h3>
      <div class="requirements-grid" id="req-grid"></div>
    `;
  }

  document.getElementById('detail-content').innerHTML = `
    <div class="modal-header" style="margin-bottom: 20px;">
      <h2>${item.name}</h2>
    </div>

    <div class="slideshow-container" id="slideshow" style="margin-bottom: 30px;"></div>

    <div class="detail-meta">
      <span class="meta-badge"><span class="meta-label">Version</span>${item.version}</span>
      <span class="meta-badge"><span class="meta-label">Size</span>${item.size}</span>
      <span class="meta-badge"><span class="meta-label">Compatibility</span>${item.compatibility}</span>
    </div>

    <p class="detail-description">${item.description}</p>

    ${requirementsHTML}

    <div style="margin-top: 30px;">
      ${item.download_url === "#" 
        ? `<span class="btn-small" style="background:#444; color:#888; cursor:not-allowed; font-size:1.1rem; padding:16px 32px;">Unavailable</span>`
        : `<a href="${item.download_url}" target="_blank" class="btn-small" style="font-size:1.1rem; padding:16px 32px;">Download</a>`}
    </div>
  `;

  setTimeout(() => {
    renderItemImages(item);
    if (item.requirements) renderRequirements(item.requirements);
  }, 50);
}

function goBackToHome() {
  const detailPage = document.getElementById('item-detail');
  const catalogView = document.getElementById('catalog-view');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  detailPage.style.display = 'none';
  catalogView.style.display = 'block';
  catalogView.style.animation = 'fadeInUp 0.4s ease-out';
  
  applyTab('downloads');
  window.history.pushState({}, '', '?tab=downloads');
  document.title = tabTitle('downloads');
}

let currentImageIndex = 1;
let currentDetailItem = null;

async function renderItemImages(item) {
  const container = document.getElementById('slideshow');
  if (!container) return;

  currentDetailItem = item;
  currentImageIndex = 1;

  // Show a single frame immediately while we probe for the real count
  container.innerHTML = `<img id="detail-main-image" style="max-height:70vh; width:100%; object-fit:contain; border-radius:10px; display:block;">`;
  showCurrentDetailImage();

  const count = await detectImageCount(item.sku);
  item.detectedImageCount = Math.max(count, 1);

  // Only render arrows once we know there's more than one image
  if (item.detectedImageCount > 1 && currentDetailItem === item) {
    container.innerHTML = `
      <button onclick="prevImage()" class="arrow-btn left">←</button>
      <button onclick="nextImage()" class="arrow-btn right">→</button>
      <img id="detail-main-image" style="max-height:70vh; width:100%; object-fit:contain; border-radius:10px; display:block;">
    `;
    showCurrentDetailImage();
  }
}

function showCurrentDetailImage() {
  const img = document.getElementById('detail-main-image');
  if (!img || !currentDetailItem) return;

  const src = getImagePath(currentDetailItem.sku, currentImageIndex);

  // Set the source path
  img.src = src;
  img.style.display = 'block'; // Ensure it stays visible
  
  img.onerror = function() {
    console.warn('Image failed to load:', this.src);
    this.style.display = 'none';
  };

  // Keep the lightbox in sync if it's currently showing this item's slideshow
  const overlay = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (overlay && overlay.classList.contains('open') && overlay.classList.contains('slideshow-mode') && lightboxImg) {
    lightboxImg.src = src;
  }
}

function nextImage() {
  if (!currentDetailItem) return;
  currentImageIndex = (currentImageIndex % (currentDetailItem.detectedImageCount || 1)) + 1;
  transitionSlide();
}

function prevImage() {
  if (!currentDetailItem) return;
  currentImageIndex--;
  if (currentImageIndex < 1) currentImageIndex = (currentDetailItem.detectedImageCount || 1);
  transitionSlide();
}

// Handles the fluid animation sequence between frame changes
function transitionSlide() {
  const img = document.getElementById('detail-main-image');
  if (!img) return;

  const overlay = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const syncingLightbox = overlay && overlay.classList.contains('open') && overlay.classList.contains('slideshow-mode');

  // Add the class that reduces opacity and scale
  img.classList.add('slide-changing');
  if (syncingLightbox && lightboxImg) lightboxImg.classList.add('slide-changing');

  // Wait for the fade-out animation to finish before switching the asset src
  setTimeout(() => {
    showCurrentDetailImage();
    
    // Fade back in smoothly once asset begins showing
    img.onload = () => {
      img.classList.remove('slide-changing');
    };
    if (syncingLightbox && lightboxImg) {
      lightboxImg.onload = () => lightboxImg.classList.remove('slide-changing');
    }
  }, 200); 
}

// Simple persistent cache so we don't re-fetch the same preview every page load
function getPreviewCache() {
  try {
    return JSON.parse(localStorage.getItem('linkPreviewCache') || '{}');
  } catch (e) {
    return {};
  }
}

function setPreviewCache(cache) {
  try {
    localStorage.setItem('linkPreviewCache', JSON.stringify(cache));
  } catch (e) {
    // localStorage full or unavailable; fail silently, just means no caching
  }
}

async function fetchLinkPreview(url) {
  const cache = getPreviewCache();
  const cached = cache[url];

  // Cache for 7 days
  if (cached && (Date.now() - cached.fetchedAt) < 7 * 24 * 60 * 60 * 1000) {
    return cached.data;
  }

  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
  const response = await fetch(apiUrl);
  const json = await response.json();

  if (json.status !== 'success') {
    throw new Error('Preview fetch failed');
  }

  const data = {
    title: json.data.title || url,
    description: json.data.description || '',
    image: (json.data.image && json.data.image.url) || (json.data.logo && json.data.logo.url) || null
  };

  cache[url] = { fetchedAt: Date.now(), data };
  setPreviewCache(cache);

  return data;
}

function renderRequirements(requirements) {
  const grid = document.getElementById('req-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const linkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

  requirements.forEach(req => {
    // Support either a single "sku" string or a "skus" array on the same requirement entry
    const skus = req.skus || (req.sku ? [req.sku] : []);
    skus.forEach(sku => renderInternalPreviewCard(grid, sku));

    // Support either a single "url" string or a "urls" array on the same requirement entry
    const urls = req.urls || (req.url ? [req.url] : []);
    urls.forEach(url => renderLinkPreviewCard(grid, url, linkIcon));
  });
}

function renderInternalPreviewCard(grid, sku) {
  const dep = allDownloads.find(d => d.sku === sku);
  if (!dep) return;

  const div = document.createElement('div');
  div.className = 'link-preview-item';
  div.style.cursor = 'pointer';
  div.innerHTML = `
    <img src="${getImagePath(dep.sku, 1)}" alt="${dep.name}" class="item-image" onerror="this.style.display='none'">
    <div class="link-preview-text">
      <h3 class="link-preview-title">${dep.name}</h3>
      <p class="link-preview-subtitle">${dep.category || ''}</p>
    </div>
  `;
  div.onclick = () => showItemDetail(dep.sku);
  grid.appendChild(div);
}

function renderLinkPreviewCard(grid, url, linkIcon) {
  const div = document.createElement('div');
  div.className = 'link-preview-item';
  div.style.cursor = 'pointer';

  let hostname = url;
  try { hostname = new URL(url).hostname.replace('www.', ''); } catch (e) {}

  // Show a loading skeleton, then fill in the auto-generated preview
  div.innerHTML = `
    <div class="link-preview-skeleton"></div>
    <div class="link-preview-text">
      <h3 class="link-preview-title">Loading preview… ${linkIcon}</h3>
      <p class="link-preview-subtitle">${hostname}</p>
    </div>
  `;
  div.onclick = (e) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  grid.appendChild(div);

  fetchLinkPreview(url)
    .then(data => {
      const imgEl = div.querySelector('.link-preview-skeleton');
      const titleEl = div.querySelector('.link-preview-title');
      const subtitleEl = div.querySelector('.link-preview-subtitle');

      if (data.image) {
        imgEl.outerHTML = `<img src="${data.image}" alt="${data.title}" class="item-image" onerror="this.style.display='none'">`;
      } else {
        imgEl.remove();
      }
      titleEl.innerHTML = `${data.title} ${linkIcon}`;
      subtitleEl.textContent = data.description || hostname;
    })
    .catch(() => {
      const titleEl = div.querySelector('.link-preview-title');
      if (titleEl) titleEl.innerHTML = `${url} ${linkIcon}`;
      const imgEl = div.querySelector('.link-preview-skeleton');
      if (imgEl) imgEl.remove();
    });
}

window.onpopstate = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemSku = urlParams.get('item');
  
  if (itemSku) {
    showItemDetail(itemSku);
  } else {
    document.getElementById('item-detail').style.display = 'none';
    document.getElementById('catalog-view').style.display = 'block';

    const tab = urlParams.get('tab') === 'downloads' ? 'downloads' : 'home';
    applyTab(tab);
    document.title = tabTitle(tab);
  }
};

window.onload = loadDownloads;

// Automatically return to the catalog if a nav bar shortcut link is clicked while viewing a product
window.addEventListener('hashchange', () => {
  const detailPage = document.getElementById('item-detail');
  const catalogView = document.getElementById('catalog-view');
  const targetHash = window.location.hash;
  const categoryHashes = CATEGORIES.map(cat => `#${cat.id}`);

  // Only intercept if the user is actively viewing a product detail page
  if (detailPage && detailPage.style.display === 'block') {
    detailPage.style.display = 'none';
    catalogView.style.display = 'block';
    
    // Smoothly apply our slide/fade entry animation to the catalog home grid
    catalogView.style.animation = 'fadeInUp 0.4s ease-out';
    
    applyTab('downloads');
    document.title = tabTitle('downloads');
    window.history.pushState({}, '', `?tab=downloads${targetHash}`);
  }

  // Footer category links live inside the Downloads tab — jump there too
  if (categoryHashes.includes(targetHash)) {
    applyTab('downloads');
    document.title = tabTitle('downloads');
    window.history.pushState({}, '', `?tab=downloads${targetHash}`);

    const section = document.querySelector(targetHash);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }
});