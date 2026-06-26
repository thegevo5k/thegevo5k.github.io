// script.js
let allDownloads = [];
let searchTerm = '';
let rawSearchTerm = '';

async function loadDownloads() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`downloads.json?t=${timestamp}`);
    allDownloads = await response.json();

    setupDownloadsDropdownMenu();
    setupFooterLinks();
    setupSearch();
    setupLightbox();
    setupTabs();
    renderPromoBanner();

    const urlParams = new URLSearchParams(window.location.search);
    const itemSku = urlParams.get('item');

    if (itemSku) {
      showItemDetail(itemSku);
    } else {
      const tabParam = urlParams.get('tab');
      if (tabParam === 'downloads') {
        const catParam = urlParams.get('category');
        selectedCategory = isValidCategoryId(catParam) ? catParam : 'latest';
        applyTab('downloads');
        document.title = categoryTitle(selectedCategory);
      } else if (tabParam === 'terms') {
        applyTab('terms');
        document.title = tabTitle('terms');
      }
      renderDownloadsGrid();
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
    rawSearchTerm = input.value.trim();
    searchTerm = rawSearchTerm.toLowerCase();
    renderDownloadsGrid();
  });
}

function setupTabs() {
  const homeBtn = document.querySelector('.tab-btn[data-tab="home"]');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      switchTab('home');
      closeDownloadsDropdown();
    });
  }

  const downloadsBtn = document.getElementById('downloads-tab-btn');
  if (downloadsBtn) {
    downloadsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDownloadsDropdown();
    });
  }

  const termsBtn = document.querySelector('.tab-btn[data-tab="terms"]');
  if (termsBtn) {
    termsBtn.addEventListener('click', () => {
      switchTab('terms');
      closeDownloadsDropdown();
    });
  }

  // Click anywhere outside the dropdown closes it
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#downloads-dropdown-wrapper')) {
      closeDownloadsDropdown();
    }
  });
}

function toggleDownloadsDropdown() {
  const menu = document.getElementById('downloads-dropdown-menu');
  if (menu) menu.classList.toggle('open');
}

function closeDownloadsDropdown() {
  const menu = document.getElementById('downloads-dropdown-menu');
  if (menu) menu.classList.remove('open');
}

function setupDownloadsDropdownMenu() {
  const menu = document.getElementById('downloads-dropdown-menu');
  if (!menu) return;

  menu.innerHTML = `
    <a href="#" data-category="latest">Latest Releases</a>
    ${CATEGORIES.map(cat => `<a href="#" data-category="${cat.id}">${cat.label}</a>`).join('')}
  `;

  menu.querySelectorAll('a[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToCategory(link.dataset.category);
      closeDownloadsDropdown();
    });
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
  if (tab === 'downloads') return 'We Play Simulators | Downloads';
  if (tab === 'terms') return 'We Play Simulators | Terms of Use';
  return 'We Play Simulators';
}

function categoryTitle(catId) {
  if (catId === 'latest') return tabTitle('downloads');
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? `We Play Simulators | ${cat.label}` : tabTitle('downloads');
}

function categoryUrl(catId) {
  return catId === 'latest' ? '?tab=downloads' : `?tab=downloads&category=${catId}`;
}

function isValidCategoryId(catId) {
  return catId === 'latest' || CATEGORIES.some(c => c.id === catId);
}

// Used for dropdown menu / footer link clicks: updates the DOM, URL, and title together
function navigateToCategory(catId) {
  selectedCategory = isValidCategoryId(catId) ? catId : 'latest';
  applyTab('downloads');
  document.title = categoryTitle(selectedCategory);
  window.history.pushState({}, '', categoryUrl(selectedCategory));
  renderDownloadsGrid();
}

// Used for user-initiated tab clicks: updates the DOM AND pushes a new URL/title
function switchTab(tab) {
  applyTab(tab);
  document.title = tabTitle(tab);
  const url = tab === 'home' ? window.location.pathname : `?tab=${tab}`;
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
      || (item.description || '').toLowerCase().includes(searchTerm);
}

function getImagePath(sku, number = 1) {
  return `${assetPrefix()}images/${sku}/${number.toString().padStart(2, '0')}.jpg`;
}

// Static /downloads/<sku>.html pages live one directory deeper than the homepage,
// so image paths need a "../" prefix there.
function assetPrefix() {
  return window.STATIC_ITEM ? '../' : '';
}

function genericImagePath() {
  return `${assetPrefix()}images/generic.jpg`;
}

// Static pages link to sibling pages directly (same /downloads/ folder); the homepage
// needs to descend into /downloads/ first.
function itemPageHref(sku) {
  const slug = String(sku).toLowerCase();
  return window.STATIC_ITEM ? `${slug}.html` : `downloads/${slug}.html`;
}

function formatReleaseDate(dateStr) {
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;

  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

// Single source of truth for all catalog categories: id (used for dropdown/footer values),
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

let selectedCategory = 'latest';

function setupFooterLinks() {
  const col = document.getElementById('footer-browse-col');
  if (!col) return;

  const linksHTML = CATEGORIES.map(cat =>
    `<a href="#" data-category="${cat.id}">${cat.label}</a>`
  ).join('');
  col.insertAdjacentHTML('beforeend', linksHTML);

  col.querySelectorAll('a[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToCategory(link.dataset.category);
      document.getElementById('downloads-grid').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

async function renderPromoBanner() {
  const container = document.getElementById('promo-banner-container');
  if (!container) return;

  let promo = { status: 'coming_soon', image: 'images/Promo.jpg', youtubeUrl: '' };

  try {
    const response = await fetch(`promo.json?t=${Date.now()}`);
    if (response.ok) promo = { ...promo, ...(await response.json()) };
  } catch (e) {
    // promo.json missing or unreachable — fall back to the default Coming Soon banner
  }

  if (promo.status === 'out_now') {
    const videoId = extractYouTubeId(promo.youtubeUrl);
    container.innerHTML = `
      <div class="promo-banner">
        <h2 class="promo-title">Out Now</h2>
        ${videoId
          ? `<div class="promo-video-wrap">
               <iframe src="https://www.youtube.com/embed/${videoId}" title="Out Now" frameborder="0"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
             </div>`
          : `<p class="empty-state">No video link set yet.</p>`}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="promo-banner">
        <h2 class="promo-title">Coming Soon</h2>
        <img src="${promo.image}" alt="Coming Soon" class="promo-image" onerror="this.onerror=null; this.src='images/generic.jpg';">
      </div>
    `;
  }
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function sortByReleaseDate(items) {
  return items.slice().sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
}

function renderDownloadsGrid() {
  const grid = document.getElementById('downloads-grid');
  const heading = document.getElementById('downloads-heading');
  if (!grid || !heading) return;

  const menu = document.getElementById('downloads-dropdown-menu');
  let pool;

  if (searchTerm) {
    // Search is its own view: searches the whole catalog (title + full description),
    // independent of whatever category is currently selected.
    heading.textContent = `Search Results for "${rawSearchTerm}"`;
    pool = sortByReleaseDate(allDownloads.filter(matchesSearch));

    if (menu) {
      menu.querySelectorAll('a[data-category]').forEach(link => link.classList.remove('active'));
    }
  } else if (selectedCategory === 'latest') {
    heading.textContent = 'Latest Releases';
    pool = sortByReleaseDate(allDownloads).slice(0, 6);
  } else {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    heading.textContent = cat ? cat.label : 'Downloads';
    pool = sortByReleaseDate(allDownloads.filter(d => cat && d.category === cat.category));
  }

  renderSection('downloads-grid', pool);

  if (pool.length === 0) {
    grid.innerHTML = `<p class="empty-state">No matching downloads found.</p>`;
  }

  if (menu && !searchTerm) {
    menu.querySelectorAll('a[data-category]').forEach(link => {
      link.classList.toggle('active', link.dataset.category === selectedCategory);
    });
  }
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
        <img src="${coverSrc}" alt="${item.name}" class="item-image" onerror="this.onerror=null; this.src=genericImagePath();">
      </div>
      <h3>${item.name}</h3>
      <p>${item.short}</p>
      <a href="${itemPageHref(item.sku)}" class="btn-small">View & Download</a>
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
      ${item.releaseDate ? `<span class="meta-badge"><span class="meta-label">Released</span>${formatReleaseDate(item.releaseDate)}</span>` : ''}
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
  window.history.pushState({}, '', categoryUrl(selectedCategory));
  document.title = categoryTitle(selectedCategory);
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
    console.warn('Image failed to load, using generic fallback:', this.src);
    this.onerror = null;
    this.src = genericImagePath();
  };

  // Keep the lightbox in sync if it's currently showing this item's slideshow
  const overlay = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (overlay && overlay.classList.contains('open') && overlay.classList.contains('slideshow-mode') && lightboxImg) {
    lightboxImg.src = src;
    lightboxImg.onerror = function() {
      this.onerror = null;
      this.src = genericImagePath();
    };
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

  // Hide the static no-JS fallback list (used by crawlers/no-JS visitors on generated
  // static pages) now that JS is rendering the richer preview cards instead.
  const fallbackList = document.querySelector('.requirements-fallback-list');
  if (fallbackList) fallbackList.style.display = 'none';

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

  const a = document.createElement('a');
  a.className = 'link-preview-item';
  a.href = itemPageHref(dep.sku);
  a.innerHTML = `
    <img src="${getImagePath(dep.sku, 1)}" alt="${dep.name}" class="item-image" onerror="this.onerror=null; this.src=genericImagePath();">
    <div class="link-preview-text">
      <h3 class="link-preview-title">${dep.name}</h3>
      <p class="link-preview-subtitle">${dep.category || ''}</p>
    </div>
  `;
  grid.appendChild(a);
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

    const tabParam = urlParams.get('tab');
    const tab = (tabParam === 'downloads' || tabParam === 'terms') ? tabParam : 'home';
    applyTab(tab);

    if (tab === 'downloads') {
      const catParam = urlParams.get('category');
      selectedCategory = isValidCategoryId(catParam) ? catParam : 'latest';
      document.title = categoryTitle(selectedCategory);
      renderDownloadsGrid();
    } else {
      document.title = tabTitle(tab);
    }
  }
};

window.onload = function() {
  if (window.STATIC_ITEM) {
    initStaticItemPage(window.STATIC_ITEM);
  } else {
    loadDownloads();
  }
};

// Bootstraps a generated static /downloads/<sku>.html page: the item's own data is already
// embedded inline (window.STATIC_ITEM) so the slideshow renders instantly, but we still fetch
// the full catalog so internal SKU requirement references (e.g. "Charger Dependencies") resolve.
async function initStaticItemPage(item) {
  currentDetailItem = item;
  setupLightbox();
  renderItemImages(item);

  try {
    const response = await fetch('../downloads.json');
    allDownloads = await response.json();
  } catch (e) {
    allDownloads = [item];
  }

  if (item.requirements && item.requirements.length > 0) {
    renderRequirements(item.requirements);
  }
}

// Automatically return to the catalog if a nav bar shortcut link is clicked while viewing a product
window.addEventListener('hashchange', () => {
  const detailPage = document.getElementById('item-detail');
  const catalogView = document.getElementById('catalog-view');
  const targetHash = window.location.hash;

  // Only intercept if the user is actively viewing a product detail page
  if (detailPage && detailPage.style.display === 'block') {
    detailPage.style.display = 'none';
    catalogView.style.display = 'block';
    
    // Smoothly apply our slide/fade entry animation to the catalog home grid
    catalogView.style.animation = 'fadeInUp 0.4s ease-out';
    
    applyTab('downloads');
    document.title = categoryTitle(selectedCategory);
    window.history.pushState({}, '', `${categoryUrl(selectedCategory)}${targetHash}`);
  }
});