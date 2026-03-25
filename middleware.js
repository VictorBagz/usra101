import { next } from '@vercel/edge';

const SUPABASE_URL = 'https://vzvtymgtegqupyjezfgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dnR5bWd0ZWdxdXB5amV6ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjUyNTgsImV4cCI6MjA3NTIwMTI1OH0.hhThAdMLbc3Ircx9YnEOfvPFr3LjQUjISl6zW5ZpFtE';
const BASE_URL = 'https://ugandaschoolsrugby.com';

export const config = {
  matcher: '/news-detail.html',
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const articleId = url.searchParams.get('id');

  // No article ID — just pass through normally
  if (!articleId) return next();

  // Check if this is a social media / bot crawler
  const userAgent = request.headers.get('user-agent') || '';
  const isCrawler = /whatsapp|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|googlebot|bingbot|crawler|spider/i.test(userAgent);

  // Only intercept for crawlers — real users get the normal page
  if (!isCrawler) return next();

  try {
    // Fetch article data from Supabase
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/news?id=eq.${articleId}&select=title,content,image_url,created_at&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const articles = await res.json();
    const article = articles?.[0];

    if (!article) return next();

    // Build absolute image URL
    let imageUrl = article.image_url || `${BASE_URL}/photos/logos/usraLogo.png`;
    if (!imageUrl.startsWith('http')) {
      imageUrl = `${BASE_URL}/${imageUrl.replace(/^\//, '')}`;
    }

    // Strip HTML tags from content for description
    const plainText = (article.content || '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const description = plainText.length > 160
      ? plainText.substring(0, 157) + '...'
      : plainText || article.title;

    const articleUrl = `${BASE_URL}/news-detail.html?id=${articleId}`;
    const title = article.title || 'USRA News';

    // Return a minimal HTML page with correct OG tags + instant JS redirect for crawlers that do run JS
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - USRA News</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="USRA - Uganda Schools Rugby Association">
  <meta property="og:locale" content="en_UG">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Redirect real users immediately -->
  <meta http-equiv="refresh" content="0;url=${articleUrl}">
  <link rel="canonical" href="${articleUrl}">
</head>
<body>
  <p>Redirecting to article...</p>
  <script>window.location.replace("${articleUrl}");</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('OG middleware error:', err);
    return next();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}