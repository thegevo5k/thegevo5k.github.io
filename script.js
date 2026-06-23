// script.js
let allDownloads = [];

async function loadDownloads() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`downloads.json?t=${timestamp}`);
    allDownloads = await response.json();

    renderHomepage();

    // Check if we should show a specific item
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
    const coverSrc = `images/${item.sku}/01.jpg`;
    
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

  // Update URL
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

  // Render images
  renderItemImages(item);

  // Render requirements if any
  if (item.requirements) renderRequirements(item.requirements);
}

function renderItemImages(item) {
  const container = document.getElementById('slideshow');
  if (!container) return;

  let imagesHTML = '';
  for (let i = 1; i <= (item.imageCount || 1); i++) {
    const src = `images/${item.sku}/${i.toString().padStart(2, '0')}.jpg`;
    imagesHTML += `<img src="${src}" class="modal-main-image" style="margin: 10px 0; max-width: 100%; border-radius: 10px;" onerror="this.style.display='none'">`;
  }

  container.innerHTML = imagesHTML;
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
      // Internal item
      div.innerHTML = `
        <img src="images/${dep.sku}/01.jpg" alt="${dep.name}" class="item-image" onerror="this.style.display='none'">
        <h3>${dep.name}</h3>
        <p>${req.note || ''}</p>
      `;
      div.onclick = () => showItemDetail(dep.sku);
    } else if (req.url) {
      // External link
      div.innerHTML = `
        <img src="${req.image || 'https://via.placeholder.com/300x200?text=External'}" alt="${req.name}" class="item-image" onerror="this.style.display='none'">
        <h3>${req.name || 'External Requirement'}</h3>
        <p>${req.note || ''}</p>
        <small style="color:var(--gold);">External Link ↗</small>
      `;
      div.onclick = () => window.open(req.url, '_blank');
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

// Handle browser back/forward buttons
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