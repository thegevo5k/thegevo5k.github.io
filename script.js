const downloads = [
  {
    "id": 1, "category": "Routes", "name": "Northeast Corridor - Amtrak",
    "short": "Short test segment with modern Amtrak traffic",
    "description": "Detailed section of the NEC with Amtrak ACS-64 and ALC-42 operations. Includes signals, scenery, and AI traffic.",
    "version": "1.0", "size": "185 MB", "compatibility": "TSC 2024+",
    "download_url": "#"
  },
  {
    "id": 2, "category": "Locomotives", "name": "Amtrak ALC-42 Pack",
    "short": "Siemens Charger locos with 50th Anniversary livery",
    "description": "High-detail ALC-42 models with multiple liveries, custom sounds, and realistic physics.",
    "version": "1.1", "size": "128 MB", "compatibility": "TSC 2024+",
    "download_url": "#"
  }
];

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

function showItemModal(id) {
  const item = downloads.find(i => i.id === id);
  document.getElementById('modal-content').innerHTML = `
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

window.onload = () => {
  renderSection('routes-grid', downloads.filter(d => d.category === "Routes"));
  renderSection('locomotives-grid', downloads.filter(d => d.category === "Locomotives"));
  renderSection('rollingstock-grid', downloads.filter(d => d.category === "Rolling Stock"));
};
