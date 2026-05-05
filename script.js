async function loadDownloads() {
  try {
    const response = await fetch('downloads.json');
    const downloads = await response.json();

    // Group by category
    const routes = downloads.filter(d => d.category === "Routes");
    const locos = downloads.filter(d => d.category === "Locomotives");
    const rolling = downloads.filter(d => d.category === "Rolling Stock");

    renderSection('routes-grid', routes);
    renderSection('locomotives-grid', locos);
    renderSection('rollingstock-grid', rolling);
  } catch (e) {
    console.error(e);
  }
}

function renderSection(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'download-item';
    div.innerHTML = `
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
    const res = await fetch('downloads.json');
    allDownloads = await res.json();
  }

  const item = allDownloads.find(i => i.id === id);
  if (!item) return;

  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = `
    <h2>${item.name}</h2>
    <p><strong>Version:</strong> ${item.version} | <strong>Size:</strong> ${item.size}</p>
    <p><strong>Compatibility:</strong> ${item.compatibility}</p>
    <p>${item.description}</p>
    <a href="${item.download_url}" target="_blank" class="btn-small" style="font-size:1.1rem; padding:14px 32px;">⬇ Download Now</a>
  `;

  document.getElementById('itemModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('itemModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('itemModal');
  if (event.target === modal) closeModal();
}

// Load everything on page load
document.addEventListener('DOMContentLoaded', loadDownloads);
