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

  mainContent.style.display = 'none';
  detailPage.style.display = 'block';

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

  renderItemImages(item);
  if (item.requirements) renderRequirements(item.requirements);
}

function renderItemImages(item) {
  const container = document.getElementById('slideshow');
  if (!container) return;

  container.innerHTML = ''; // Clear first

  for (let i = 1; i <= (item.imageCount || 1); i++) {
    const img = document.createElement('img');
    img.src = getImagePath(item.sku, i);
    img.className = 'modal-main-image';
    img.style.margin = '10px 0';
    img.style.maxWidth = '100%';
    img.style.borderRadius = '10px';
    img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.6)';
    
    img.onerror = function() {
      this.style.display = 'none';
      console.log('Image failed to load:', this.src);
    };
    
    container.appendChild(img);
  }
}

function renderRequirements(requirements) {
  const grid = document.getElementById('req-grid');
  if (!grid) return;

  grid.innerHTML = '';

  requirements.forEach(req => {
    const dep = allDownloads.find(d => d.sku === req.sku);
    const div = document.createElement('div');
    div.className = 'download-item';
    div.style.cursor = 'pointer';

    if (dep) {
      div.innerHTML = `
        <img src="${getImagePath(dep.sku, 1)}" alt="${dep.name}" class="item-image" onerror="this.style.display='none'">
        <h3>${dep.name}</h3>
        <p>${req.note || ''}</p>
      `;
      div.onclick = () => showItemDetail(dep.sku);
    } else if (req.url) {
      const imgSrc = req.image || 'https://via.placeholder.com/340x200/1a1a1a/888888?text=External+Link';
      div.innerHTML = `
        <img src="${imgSrc}" alt="${req.name || 'External'}" class="item-image" onerror="this.style.display='none'">
        <h3>${req.name || 'External Requirement'}</h3>
        <p>${req.note || ''}</p>
        <small style="color: var(--gold); display: block; margin-top: 8px;">↗ External Link</small>
      `;
      div.onclick = (e) => {
        e.stopPropagation();
        window.open(req.url, '_blank', 'noopener,noreferrer');
      };
    } else {
      return;
    }
    
    grid.appendChild(div);
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