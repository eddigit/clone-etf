// Vercel Serverless Function — Open Graph meta tags for blog articles
// Crawlers get proper OG tags, real visitors get the SPA index.html

const https = require('https');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://etf-backend-t3j5.onrender.com';
const SITE_URL = 'https://en-toutefranchise.com';
const DEFAULT_IMAGE = SITE_URL + '/logo.png';
const SITE_NAME = 'En Toute Franchise';

const CRAWLERS = [
  'facebookexternalhit', 'Facebot', 'LinkedInBot', 'Twitterbot',
  'WhatsApp', 'Slackbot', 'TelegramBot', 'Pinterest', 'Discordbot'
];

function isCrawler(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return CRAWLERS.some(bot => lower.includes(bot.toLowerCase()));
}

function esc(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fetchArticle(slug) {
  return new Promise((resolve, reject) => {
    const url = `${BACKEND_URL}/api/articles/${encodeURIComponent(slug)}`;
    https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(res.statusCode === 200 ? JSON.parse(data) : null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // If NOT a crawler, serve the SPA index.html
  if (!isCrawler(userAgent)) {
    try {
      const indexPath = path.join(__dirname, '..', 'frontend', 'build', 'index.html');
      const html = fs.readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (e) {
      // Fallback: redirect to the URL
      res.setHeader('Location', req.url);
      return res.status(302).end();
    }
  }
  
  // Extract slug from path
  const slug = (req.url || '').replace(/^\/blog\//, '').replace(/\?.*$/, '').replace(/\/$/, '');
  
  if (!slug) {
    return serveGenericOG(res);
  }
  
  // Fetch article from backend
  const article = await fetchArticle(slug);
  
  if (!article) {
    return serveGenericOG(res);
  }
  
  const title = esc(article.title || SITE_NAME);
  const description = esc(article.excerpt || article.metaDescription || 'Association de défense des commerçants-artisans');
  const image = article.image || article.featuredImage || DEFAULT_IMAGE;
  const url = `${SITE_URL}/blog/${slug}`;
  const author = esc(article.author || 'En Toute Franchise');
  const publishedAt = article.publishedAt || article.createdAt || '';
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title} — ${esc(SITE_NAME)}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:locale" content="fr_FR">
<meta property="article:author" content="${author}">
${publishedAt ? '<meta property="article:published_time" content="' + esc(publishedAt) + '">' : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${esc(image)}">
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
<img src="${esc(image)}" alt="${title}">
<a href="${url}">Lire l'article sur ${esc(SITE_NAME)}</a>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).send(html);
};

function serveGenericOG(res) {
  const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8"><title>${esc(SITE_NAME)}</title>
<meta property="og:title" content="${esc(SITE_NAME)}">
<meta property="og:description" content="Association nationale de défense des commerçants-artisans">
<meta property="og:image" content="${DEFAULT_IMAGE}">
<meta property="og:url" content="${SITE_URL}">
</head><body><a href="${SITE_URL}">${esc(SITE_NAME)}</a></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
