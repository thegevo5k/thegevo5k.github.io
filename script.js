// script.js
async function loadDownloads() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`downloads.json?t=${timestamp}`);
    const downloads = await response.json();

    renderSection('routes-grid', downloads.filter(d => d.category === "Routes"));
    renderSection('locomotives-grid', downloads.filter(d => d.category === "Locomotives"));
    renderSection('rollingstock-grid', downloads.filter(d => d.category === "Rolling Stock"));

    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;
  } catch (error) {
    console.error("Could not load downloads.json", error);
  }
}

function getImagePath(sku, number) {
  return `images/${sku}/${number.toString().padStart(2, '0')}.jpg`;
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
      <button onclick="showItemModal(${item.id})" class="btn-small">View & Download</button>
    `;
    container.appendChild(div);
  });
}

let allDownloads = [];
let currentSKU = '';
let currentImageIndex = 1;
let maxImages = 0;   // Will be detected automatically

async function showItemModal(id) {
  if (allDownloads.length === 0) {
    const timestamp = new Date().getTime();
    const res = await fetch(`downloads.json?t=${timestamp}`);
    allDownloads = await res.json();
  }

  const item = allDownloads.find(i => i.id === id);
  if (!item) return;

  currentSKU = item.sku;
  currentImageIndex = 1;
  maxImages = 0; // reset

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${item.name}</h2>
      <span class="close" onclick="closeModal()">×</span>
    </div>
    
    <div class="slideshow-container" id="slideshow"></div>

    <p><strong>Version:</strong> ${item.version} | <strong>Size:</strong> ${item.size}</p>
    <p><strong>Compatibility:</strong> ${item.compatibility}</p>
    <p>${item.description}</p>
    <a href="${item.download_url}" target="_blank" class="btn-small" style="font-size:1.1rem; padding:16px 32px;">Download</a>
  `;

  document.getElementById('itemModal').style.display = 'block';
  showCurrentImage();
}

function showCurrentImage() {
  const container = document.getElementById('slideshow');
  container.innerHTML = `
    <button onclick="prevImage()" class="arrow-btn left">←</button>
    <button onclick="nextImage()" class="arrow-btn right">→</button>
  `;

  const img = document.createElement('img');
  img.src = getImagePath(currentSKU, currentImageIndex);
  img.className = 'modal-main-image fade-in';
  
  img.onload = () => {
    if (currentImageIndex > maxImages) maxImages = currentImageIndex;
  };

  img.onerror = () => {
    if (currentImageIndex > 1) {
      maxImages = currentImageIndex - 1;
      currentImageIndex = maxImages;   // go to last image
      showCurrentImage();
    }
  };
  
  container.appendChild(img);
}

function nextImage() {
  currentImageIndex++;
  showCurrentImage();
}

function prevImage() {
  currentImageIndex--;
  if (currentImageIndex < 1) {
    currentImageIndex = maxImages || 20;   // go to last known image
  }
  showCurrentImage();
}

function closeModal() {
  document.getElementById('itemModal').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('itemModal');
  if (event.target === modal) closeModal();
};

window.onload = loadDownloads;