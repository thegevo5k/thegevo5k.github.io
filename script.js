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

function getImagePath(sku, number = "01") {
  return `images/${sku}/${number}.png`;
}

function renderSection(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'download-item';
    
    const coverSrc = getImagePath(item.sku, "01");
    
    div.innerHTML = `
      <img src="${coverSrc}" alt="${item.name}" class="item-image" onerror="this.style.display='none'">
      <h3>${item.name}</h3>
      <p>${item.short}</p>
      <button onclick="showItemModal(${item.id})" class="btn-small">Download</button>
    `;
    container.appendChild(div);
  });
}

let allDownloads = [];

async function showItemModal(id) {
  if (allDownloads.length === 0) {
    const timestamp = new Date().getTime();
    const res = await fetch(`downloads.json?t=${timestamp}`);
    allDownloads = await res.json();
  }

  const item = allDownloads.find(i => i.id === id);
  if (!item) return;

  const mainImage = getImagePath(item.sku, "01");

  document.getElementById('modal-content').innerHTML = `
    <img src="${mainImage}" alt="${item.name}" class="modal-main-image" onerror="this.style.display='none'">
    <h2>${item.name}</h2>
    <p><strong>Version:</strong> ${item.version} | <strong>Size:</strong> ${item.size}</p>
    <p><strong>Compatibility:</strong> ${item.compatibility}</p>
    <p>${item.description}</p>
    <a href="${item.download_url}" target="_blank" class="btn-small" style="font-size:1.1rem; padding:16px 32px;">⬇ Download Now</a>
  `;

  document.getElementById('itemModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('itemModal').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('itemModal');
  if (event.target === modal) closeModal();
};

window.onload = loadDownloads;
