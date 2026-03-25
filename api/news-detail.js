const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vzvtymgtegqupyjezfgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dnR5bWd0ZWdxdXB5amV6ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjUyNTgsImV4cCI6MjA3NTIwMTI1OH0.hhThAdMLbc3Ircx9YnEOfvPFr3LjQUjISl6zW5ZpFtE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')   // remove all HTML tags
        .replace(/&nbsp;/g, ' ')   // decode &nbsp;
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')      // collapse whitespace
        .trim();
}

module.exports = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        res.redirect(307, '/news.html');
        return;
    }

    try {
        const { data: article, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error || !article) {
            // Always preserve the id so user lands on the right page
            res.redirect(307, `/news-detail.html?id=${id}`);
            return;
        }

        const baseUrl = 'https://ugandaschoolsrugby.com';

        // Make sure image URL is absolute
        let imageUrl = article.image_url || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = baseUrl + '/' + imageUrl.replace(/^\//, '');
        }
        if (!imageUrl) {
            imageUrl = baseUrl + '/photos/logos/usraLogo.png';
        }

        // Strip HTML from Quill content to get clean plain-text description
        const plainContent = stripHtml(article.content || '');
        const description = plainContent.length > 0
            ? plainContent.substring(0, 200) + (plainContent.length > 200 ? '...' : '')
            : article.title;

        const articleUrl = `${baseUrl}/api/news-detail?id=${id}`;
        const publishedDate = new Date(article.created_at).toISOString();

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(article.title)} - USRA News</title>
    <meta name="description" content="${escapeHtml(description)}">

    <!-- Open Graph tags - read by WhatsApp, Facebook, Telegram etc -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Uganda Schools Rugby Association">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:title" content="${escapeHtml(article.title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="en_US">
    <meta property="article:published_time" content="${publishedDate}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(article.title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${imageUrl}">

    <!-- Redirect real users to the actual article page -->
    <script>window.location.replace('/news-detail.html?id=${id}');</script>
</head>
<body>
    <p>Loading article...</p>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        // No-cache so sharing bots always get fresh data
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(html);

    } catch (err) {
        console.error('Error fetching article:', err);
        res.redirect(307, `/news-detail.html?id=${id}`);
    }
};