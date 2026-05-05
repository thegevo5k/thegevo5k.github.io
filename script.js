function showDownloadsModal() {
  document.getElementById('downloadsModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('downloadsModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('downloadsModal');
  if (event.target === modal) closeModal();
}
