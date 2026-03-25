// api/article.js
// Vercel serverless function — serves OG-tagged HTML for social media crawlers
// Real users get instantly redirected to the actual news-detail.html page

const SUPABASE_URL = 'https://vzvtymgtegqupyjezfgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dnR5bWd0ZWdxdXB5amV6ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjUyNTgsImV4cCI6MjA3NTIwMTI1OH0.hhThAdMLbc3Ircx9YnEOfvPFr3LjQUjISl6zW5ZpFtE';
const BASE_URL = 'https://ugandaschoolsrugby.com';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtml(str) {
  return String(str || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

module.exports = async function handler(req, res) {
  const articleId = req.query.id;

  if (!articleId) {
    return res.redirect(302, '/news.html');
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/news?id=eq.${encodeURIComponent(articleId)}&select=title,content,image_url,created_at&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const articles = await response.json();
    const article = articles?.[0];

    if (!article) {
      return res.redirect(302, '/news.html');
    }

    // Build absolute image URL
    let imageUrl = article.image_url || `${BASE_URL}/photos/logos/usraLogo.png`;
    if (!imageUrl.startsWith('http')) {
      imageUrl = `${BASE_URL}/${imageUrl.replace(/^\//, '')}`;
    }

    // Build description from article content
    const plainText = stripHtml(article.content);
    const description = plainText.length > 160
      ? plainText.substring(0, 157) + '...'
      : plainText || article.title;

    const articleUrl = `${BASE_URL}/news-detail.html?id=${articleId}`;
    const title = article.title || 'USRA News';

    // This page is shown to crawlers (WhatsApp, Facebook, etc.)
    // Real users are instantly redirected via meta refresh + JS
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} | USRA News</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph (WhatsApp, Facebook, LinkedIn) -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="USRA - Uganda Schools Rugby Association">
  <meta property="og:locale" content="en_UG">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Redirect real users to the actual article page immediately -->
  <meta http-equiv="refresh" content="0;url=${articleUrl}">
  <link rel="canonical" href="${articleUrl}">
</head>
<body>
  <p>Loading article... <a href="${articleUrl}">Click here if not redirected</a></p>
  <script>window.location.replace("${articleUrl}");</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=3600');
    return res.status(200).send(html);

  } catch (err) {
    console.error('Error in /api/article:', err);
    return res.redirect(302, `/news-detail.html?id=${articleId}`);
  }
};