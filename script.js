// script.js
let allDownloads = [];

async function loadDownloads() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`downloads.json?t=${timestamp}`);
    allDownloads = await response.json();

    renderHomepage();

    const urlParams = new URLSearchParams(window.location.search);
    const itemSku = urlParams.get('item');
    if (itemSku) {
      showItemDetail(itemSku);
    }

    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;
  } catch (error) {
    console.error("Could not load downloads.json", error);
  }
}

function getImagePath(sku, number = 1) {
  return `images/${sku}/${number.toString().padStart(2, '0')}.jpg`;
}

function renderHomepage() {
  document.getElementById('main-content').innerHTML = `
    <section id="locomotives">
      <h2>Locomotives</h2>
      <div id="locomotives-grid" class="download-grid"></div>
    </section>

    <section id="quickdrives">
      <h2>Quick Drives</h2>
      <div id="quickdrives-grid" class="download-grid"></div>
    </section>

    <section id="dependencies">
      <h2>Dependencies</h2>
      <div id="dependencies-grid" class="download-grid"></div>
    </section>
  `;

  renderSection('locomotives-grid', allDownloads.filter(d => d.category === "Locomotives"));
  renderSection('quickdrives-grid', allDownloads.filter(d => d.category === "Quick Drives"));
  renderSection('dependencies-grid', allDownloads.filter(d => d.category === "Dependencies"));
}

function renderSection(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'download-item';
    const coverSrc = getImagePath(item.sku, 1);
    
    div.innerHTML = `
      <img src="${coverSrc}" alt="${item.name}" class="item-image" onerror="this.style.display='none'">
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
  const mainContent = document.getElementById('main-content');

  // Smooth scroll to top so user isn't stuck at the bottom layout height
  window.scrollTo({ top: 0, behavior: 'smooth' });

  mainContent.style.display = 'none';
  detailPage.style.display = 'block';
  detailPage.style.animation = 'fadeInUp 0.4s ease-out';

  window.history.pushState({}, '', `?item=${sku}`);

  let requirementsHTML = '';
  if (item.requirements && item.requirements.length > 0) {
    requirementsHTML = `<h3>Requirements</h3><div class="requirements-grid" id="req-grid"></div>`;
  }

  document.getElementById('detail-content').innerHTML = `
    <div class="modal-header" style="margin-bottom: 20px;">
      <h2>${item.name}</h2>
    </div>

    <div class="slideshow-container" id="slideshow" style="margin-bottom: 30px;"></div>

    <p><strong>Version:</strong> ${item.version} | <strong>Size:</strong> ${item.size}</p>
    <p><strong>Compatibility:</strong> ${item.compatibility}</p>
    <p>${item.description}</p>

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
  const mainContent = document.getElementById('main-content');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  detailPage.style.display = 'none';
  mainContent.style.display = 'block';
  mainContent.style.animation = 'fadeInUp 0.4s ease-out';
  
  window.history.pushState({}, '', window.location.pathname);
}

let currentImageIndex = 1;
let currentDetailItem = null;

function renderItemImages(item) {
  const container = document.getElementById('slideshow');
  if (!container) return;

  currentDetailItem = item;
  currentImageIndex = 1;

  // Render the slider structure
  container.innerHTML = `
    <button onclick="prevImage()" class="arrow-btn left">←</button>
    <button onclick="nextImage()" class="arrow-btn right">→</button>
    <img id="detail-main-image" style="max-height:70vh; width:100%; object-fit:contain; border-radius:10px; display:block;">
  `;

  showCurrentDetailImage();
}

function showCurrentDetailImage() {
  const img = document.getElementById('detail-main-image');
  if (!img || !currentDetailItem) return;

  // Set the source path
  img.src = getImagePath(currentDetailItem.sku, currentImageIndex);
  img.style.display = 'block'; // Ensure it stays visible
  
  img.onerror = function() {
    console.warn('Image failed to load:', this.src);
    this.style.display = 'none';
  };
}

function nextImage() {
  if (!currentDetailItem) return;
  currentImageIndex = (currentImageIndex % (currentDetailItem.imageCount || 1)) + 1;
  transitionSlide();
}

function prevImage() {
  if (!currentDetailItem) return;
  currentImageIndex--;
  if (currentImageIndex < 1) currentImageIndex = (currentDetailItem.imageCount || 1);
  transitionSlide();
}

// Handles the fluid animation sequence between frame changes
function transitionSlide() {
  const img = document.getElementById('detail-main-image');
  if (!img) return;

  // Add the class that reduces opacity and scale
  img.classList.add('slide-changing');

  // Wait for the fade-out animation to finish before switching the asset src
  setTimeout(() => {
    showCurrentDetailImage();
    
    // Fade back in smoothly once asset begins showing
    img.onload = () => {
      img.classList.remove('slide-changing');
    };
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

  requirements.forEach(req => {
    const dep = allDownloads.find(d => d.sku === req.sku);
    const div = document.createElement('div');
    div.className = 'download-item link-preview-item';
    div.style.cursor = 'pointer';

    if (dep) {
      // Internal dependency: link to the in-site detail page, no external fetch needed
      div.innerHTML = `
        <img src="${getImagePath(dep.sku, 1)}" alt="${dep.name}" class="item-image" onerror="this.style.display='none'">
        <h3>${dep.name}</h3>
        <p>${req.note || ''}</p>
      `;
      div.onclick = () => showItemDetail(dep.sku);
      grid.appendChild(div);
      return;
    }

    if (!req.url) return;

    // External requirement: show a loading skeleton, then fill in the auto-generated preview
    div.innerHTML = `
      <div class="item-image link-preview-skeleton"></div>
      <h3 class="link-preview-title">Loading preview…</h3>
      <p>${req.note || ''}</p>
      <small style="color: var(--gold); display: block; margin-top: 8px;">↗ External Link</small>
    `;
    div.onclick = (e) => {
      e.stopPropagation();
      window.open(req.url, '_blank', 'noopener,noreferrer');
    };
    grid.appendChild(div);

    fetchLinkPreview(req.url)
      .then(data => {
        const imgEl = div.querySelector('.link-preview-skeleton');
        const titleEl = div.querySelector('.link-preview-title');

        if (data.image) {
          imgEl.outerHTML = `<img src="${data.image}" alt="${data.title}" class="item-image" onerror="this.style.display='none'">`;
        } else {
          imgEl.remove();
        }
        titleEl.textContent = data.title;
      })
      .catch(() => {
        const titleEl = div.querySelector('.link-preview-title');
        if (titleEl) titleEl.textContent = req.url;
        const imgEl = div.querySelector('.link-preview-skeleton');
        if (imgEl) imgEl.remove();
      });
  });
}

function goBackToHome() {
  document.getElementById('item-detail').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
  window.history.pushState({}, '', window.location.pathname);
}

window.onpopstate = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemSku = urlParams.get('item');
  
  if (itemSku) {
    showItemDetail(itemSku);
  } else {
    document.getElementById('item-detail').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
  }
};

window.onload = loadDownloads;

// Automatically return to the catalog if a nav bar shortcut link is clicked while viewing a product
window.addEventListener('hashchange', () => {
  const detailPage = document.getElementById('item-detail');
  const mainContent = document.getElementById('main-content');
  
  // Only intercept if the user is actively viewing a product detail page
  if (detailPage && detailPage.style.display === 'block') {
    detailPage.style.display = 'none';
    mainContent.style.display = 'block';
    
    // Smoothly apply our slide/fade entry animation to the catalog home grid
    mainContent.style.animation = 'fadeInUp 0.4s ease-out';
    
    // Clean up the URL query parameters so it doesn't still say ?item=WPS-ALC-01
    const targetHash = window.location.hash;
    window.history.pushState({}, '', window.location.pathname + targetHash);
  }
});