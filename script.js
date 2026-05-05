// Load downloads from JSON
async function loadDownloads() {
  try {
    const response = await fetch('downloads.json');
    const downloads = await response.json();
    renderDownloads(downloads);
  } catch (error) {
    console.error("Error loading downloads:", error);
    document.getElementById('downloadsTable').innerHTML = "<p>Error loading downloads. Please try again later.</p>";
  }
}

function renderDownloads(downloads) {
  const container = document.getElementById('downloadsTable');
  container.innerHTML = '';

  downloads.forEach(item => {
    const div = document.createElement('div');
    div.className = 'download-item';
    div.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <p><strong>Version:</strong> ${item.version} | <strong>Size:</strong> ${item.size}</p>
      <p><strong>Compatibility:</strong> ${item.compatibility}</p>
      <a href="${item.download_url}" class="btn small" target="_blank">Download</a>
    `;
    container.appendChild(div);
  });
}

// Modal functions
function showDownloadsModal() {
  document.getElementById('downloadsModal').style.display = 'block';
  loadDownloads();   // Load fresh data every time
}

function closeModal() {
  document.getElementById('downloadsModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('downloadsModal');
  if (event.target === modal) closeModal();
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keyup', () => {
      // Simple client-side search (optional enhancement)
      console.log("Searching for:", searchInput.value);
    });
  }
});
