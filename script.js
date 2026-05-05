// script.js - We Play Simulators
async function loadDownloads() {
  try {
    // Cache-busting to force fresh load (fixes Firefox caching)
    const timestamp = new Date().getTime();
    const response = await fetch(`downloads.json?t=${timestamp}`);
    const downloads = await response.json();

    // Render each section
    renderSection('routes-grid', downloads.filter(d => d.category === "Routes"));
    renderSection('locomotives-grid', downloads.filter(d => d.category === "Locomotives"));
    renderSection('rollingstock-grid', downloads.filter(d => d.category === "Rolling Stock"));

    // Show last updated time
    document.getElementById('last-updated').textContent = 
      `Last updated: ${new Date().toLocaleString()}`;
    
  } catch (error) {
    console.error("Could not load downloads.json", error);
    document.getElementById('routes-grid').innerHTML = 
      "<p style='color:#ff6666;'>Error loading downloads. Please refresh the page.</p>";
  }
}

function renderSection(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = '<p>No items in this category yet.</p>';
    return;
  }

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
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(`downloads.json?t=${timestamp}`);
      allDownloads = await res.json();
    } catch (e) {
      console.error(e);
    }
  }

  const item = allDownloads.find(i => i.id === id);
  if (!item) return;

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

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('itemModal');
  if (event.target === modal) closeModal();
};

// Load everything when page loads
window.onload = loadDownloads;
