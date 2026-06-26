// scripts/generate-pages.js
//
// Generates one static, crawlable HTML page per item in downloads.json under /downloads/,
// plus a sitemap.xml listing the homepage and every generated page.
//
// Runs automatically via .github/workflows/deploy.yml on every push to main.
// No dependencies beyond Node's built-in fs/path — nothing to npm install.

const fs = require('fs');
const path = require('path');

// Keep this list in sync with the CATEGORIES array in script.js
const CATEGORIES = [
  { id: 'locomotives', label: 'Locomotives' },
  { id: 'quickdrives', label: 'Quick Drives' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'routes', label: 'Routes' },
  { id: 'rollingstock', label: 'Rolling Stock' },
  { id: 'scenery', label: 'Scenery' },
  { id: 'sounds', label: 'Sounds' }
];

const ROOT = __dirname;
const SITE_URL = 'https://www.weplaysimulators.com';
const downloads = JSON.parse(fs.readFileSync(path.join(ROOT, 'downloads.json'), 'utf8'));

function slugify(sku) {
  return String(sku).toLowerCase();
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Checks the real filesystem for the item's first image so og:image always points
// to something that actually exists, falling back to the generic placeholder.
function getCoverImage(sku) {
  const real = path.join(ROOT, 'images', sku, '01.jpg');
  return fs.existsSync(real) ? `images/${sku}/01.jpg` : 'images/generic.jpg';
}

// Plain, crawlable requirements list (no-JS fallback). script.js progressively
// enhances this into the rich preview cards once it loads, using the same
// renderRequirements() function as the rest of the site.
function renderStaticRequirements(requirements, allItems) {
  if (!requirements || requirements.length === 0) return '';

  const rows = [];
  requirements.forEach(req => {
    (req.skus || (req.sku ? [req.sku] : [])).forEach(sku => {
      const dep = allItems.find(d => d.sku === sku);
      if (dep) rows.push(`<li><a href="../${slugify(dep.sku)}/">${escapeHtml(dep.name)}</a></li>`);
    });
    (req.urls || (req.url ? [req.url] : [])).forEach(url => {
      let host = url;
      try { host = new URL(url).hostname.replace('www.', ''); } catch (e) {}
      rows.push(`<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(host)}</a></li>`);
    });
  });

  return `
    <h3 class="detail-section-title">Requirements</h3>
    <ul class="requirements-fallback-list">${rows.join('')}</ul>
    <div class="requirements-grid" id="req-grid"></div>
  `;
}

function formatReleaseDate(dateStr) {
  const parts = String(dateStr || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr || '';
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderPage(item, allItems) {
  const slug = slugify(item.sku);
  const cover = getCoverImage(item.sku);
  const description = (item.short || item.description || '').slice(0, 160);
  const pageUrl = `${SITE_URL}/downloads/${slug}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(item.name)} | We Play Simulators</title>

  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${pageUrl}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="We Play Simulators">
  <meta property="og:title" content="${escapeHtml(item.name)} | We Play Simulators">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${SITE_URL}/${cover}">
  <meta property="og:url" content="${pageUrl}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(item.name)} | We Play Simulators">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${SITE_URL}/${cover}">

  <link rel="stylesheet" href="../../styles.css">
  <link rel="icon" href="../../logo.png">

  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: item.name,
    applicationCategory: 'Game',
    operatingSystem: 'Windows',
    description: description,
    url: pageUrl,
    image: `${SITE_URL}/${cover}`,
    softwareVersion: item.version || ''
  }, null, 2).replace(/</g, '\\u003c')}
  </script>
</head>
<body>
  <header>
    <a href="../../index.html"><img src="../../logo.png" alt="We Play Simulators Logo" class="logo"></a>
    <h1>We Play Simulators</h1>
  </header>

  <div class="tab-nav">
    <a class="tab-btn" href="../../index.html">Home</a>
    <div class="tab-dropdown" id="downloads-dropdown-wrapper">
      <button class="tab-btn" id="downloads-tab-btn">Downloads ▾</button>
      <div class="tab-dropdown-menu" id="downloads-dropdown-menu">
        <a href="../../index.html?tab=downloads">Latest Releases</a>
        ${CATEGORIES.map(cat => `<a href="../../index.html?tab=downloads&category=${cat.id}">${cat.label}</a>`).join('')}
      </div>
    </div>
    <a class="tab-btn" href="../../index.html?tab=terms">Terms of Use</a>
  </div>

  <div class="item-detail-page page-fade-in" style="display:block;">
    <div class="container">
      <a href="../../index.html" class="btn-small" style="margin-bottom: 20px; display:inline-block;" onclick="return goBackToCatalog(event);">← Back to Catalog</a>

      <div id="detail-content">
        <div class="modal-header" style="margin-bottom: 20px;">
          <h2>${escapeHtml(item.name)}</h2>
        </div>

        <div class="slideshow-container" id="slideshow" style="margin-bottom: 30px;">
          <img src="../../${cover}" id="detail-main-image" style="max-height:70vh; width:100%; object-fit:contain; border-radius:10px; display:block;" alt="${escapeHtml(item.name)}">
        </div>

        <div class="detail-meta">
          <span class="meta-badge"><span class="meta-label">Version</span>${escapeHtml(item.version)}</span>
          <span class="meta-badge"><span class="meta-label">Size</span>${escapeHtml(item.size)}</span>
          <span class="meta-badge"><span class="meta-label">Compatibility</span>${escapeHtml(item.compatibility)}</span>
          ${item.releaseDate ? `<span class="meta-badge"><span class="meta-label">Released</span>${escapeHtml(formatReleaseDate(item.releaseDate))}</span>` : ''}
        </div>

        <p class="detail-description">${escapeHtml(item.description)}</p>

        ${renderStaticRequirements(item.requirements, allItems)}

        <div style="margin-top: 30px;">
          ${item.download_url === '#'
            ? `<span class="btn-small" style="background:#444; color:#888; cursor:not-allowed; font-size:1.1rem; padding:16px 32px;">Unavailable</span>`
            : `<a href="${escapeHtml(item.download_url)}" target="_blank" class="btn-small" style="font-size:1.1rem; padding:16px 32px;">Download</a>`}
        </div>
      </div>
    </div>
  </div>

  <footer>
    <p>&copy; 2026 We Play Simulators</p>
  </footer>

  <script>
    // Tells script.js this is a standalone item page (not the homepage SPA),
    // so it can skip catalog/search/tab setup and just enhance this one item.
    window.STATIC_ITEM = ${JSON.stringify(item).replace(/</g, '\\u003c')};
  </script>
  <script src="../../script.js"></script>
</body>
</html>
`;
}

function generateSitemap(items) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    ...items.map(item => ({
      loc: `${SITE_URL}/downloads/${slugify(item.sku)}/`,
      priority: '0.8',
      lastmod: item.releaseDate || undefined
    }))
  ];

  const body = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>\n    ` : ''}<priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function main() {
  const outDir = path.join(ROOT, 'downloads');
  fs.mkdirSync(outDir, { recursive: true });

  downloads.forEach(item => {
    if (!item.sku) return;
    const html = renderPage(item, downloads);
    const slugDir = path.join(outDir, slugify(item.sku));
    fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(path.join(slugDir, 'index.html'), html);
  });

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), generateSitemap(downloads));

  console.log(`Generated ${downloads.length} item page(s) and sitemap.xml`);
}

main();
