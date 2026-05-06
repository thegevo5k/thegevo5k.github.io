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
let maxImages = 0;

async function showItemModal(id) {
  // Ensure we have the full download list to reference
  if (allDownloads.length === 0) {
    const timestamp = new Date().getTime();
    const res = await fetch(`downloads.json?t=${timestamp}`);
    allDownloads = await res.json();
  }

  const item = allDownloads.find(i => i.id === id);
  if (!item) return;

  // Set state based on the selected item and its new imageCount parameter
  currentSKU = item.sku;
  currentImageIndex = 1;
  maxImages = item.imageCount || 1; // Uses the new parameter from your JSON[cite: 2]

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
  
  // Re-render buttons and image
  container.innerHTML = `
    <button onclick="prevImage()" class="arrow-btn left">←</button>
    <button onclick="nextImage()" class="arrow-btn right">→</button>
  `;

  const img = document.createElement('img');
  img.src = getImagePath(currentSKU, currentImageIndex);
  img.className = 'modal-main-image fade-in';
  
  // Error fallback: if an image fails to load, just hide it or show a placeholder[cite: 3]
  img.onerror = () => {
    img.alt = "Image not found";
    img.style.display = 'none';
  };
  
  container.appendChild(img);
}

function nextImage() {
  currentImageIndex++;
  // Cycle back to the first image if we exceed maxImages[cite: 3]
  if (currentImageIndex > maxImages) {
    currentImageIndex = 1;
  }
  showCurrentImage();
}

function prevImage() {
  currentImageIndex--;
  // Cycle to the last image if we go below 1[cite: 3]
  if (currentImageIndex < 1) {
    currentImageIndex = maxImages;
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