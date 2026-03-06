const https = require('https');

const BACKEND_URL = 'https://etf-backend-t3j5.onrender.com';
const SITE_URL = 'https://en-toutefranchise.com';
const DEFAULT_IMAGE = SITE_URL + '/logo.png';
const SITE_NAME = 'En Toute Franchise';

function esc(t) {
  return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fetchArticle(slug) {
  return new Promise((resolve) => {
    https.get(`${BACKEND_URL}/api/articles/${encodeURIComponent(slug)}`, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(res.statusCode === 200 ? JSON.parse(data) : null); }
        catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = async (req, res) => {
  const slug = (req.query.slug || req.url || '').replace(/^\/api\/og-blog\/?/, '').replace(/\?.*$/, '').replace(/\/$/, '');

  if (!slug) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(genericOG());
  }

  const article = await fetchArticle(slug);

  if (!article) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(genericOG());
  }

  const title = esc(article.title || SITE_NAME);
  const desc = esc(article.excerpt || article.metaDescription || 'Association de défense des commerçants-artisans');
  const image = article.image || article.featuredImage || DEFAULT_IMAGE;
  const url = `${SITE_URL}/blog/${slug}`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8">
<title>${title} — ${esc(SITE_NAME)}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(image)}">
</head>
<body>
<h1>${title}</h1>
<p>${desc}</p>
<img src="${esc(image)}" alt="${title}">
<a href="${url}">Lire l'article</a>
</body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).send(html);
};

function genericOG() {
  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8"><title>${esc(SITE_NAME)}</title>
<meta property="og:title" content="${esc(SITE_NAME)}">
<meta property="og:description" content="Association nationale de défense des commerçants-artisans">
<meta property="og:image" content="${DEFAULT_IMAGE}">
<meta property="og:url" content="${SITE_URL}">
</head><body><a href="${SITE_URL}">${esc(SITE_NAME)}</a></body></html>`;
}
