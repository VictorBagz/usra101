const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vzvtymgtegqupyjezfgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dnR5bWd0ZWdxdXB5amV6ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjUyNTgsImV4cCI6MjA3NTIwMTI1OH0.hhThAdMLbc3Ircx9YnEOfvPFr3LjQUjISl6zW5ZpFtE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

module.exports = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        // No ID provided - send to news list
        res.redirect(307, '/news.html');
        return;
    }

    try {
        const { data: article, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !article) {
            res.redirect(307, `/news-detail.html?id=${id}`);
            return;
        }

        const baseUrl = 'https://ugandaschoolsrugby.com';
        let imageUrl = article.image_url || 'photos/logos/usraLogo.png';
        
        if (!imageUrl.startsWith('http')) {
            imageUrl = baseUrl + '/' + imageUrl.replace(/^\//, '');
        }

        // Extract description from content
        const description = article.content
            ? article.content.substring(0, 160).replace(/\n/g, ' ').trim() + '...'
            : article.title.substring(0, 160);

        const articleUrl = `${baseUrl}/api/news-detail?id=${id}`;
        const publishedDate = new Date(article.created_at).toISOString();

        // Generate HTML with proper metadata for crawlers
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(article.title)} - USRA News</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:title" content="${escapeHtml(article.title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/png">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:site_name" content="USRA - Uganda Schools Rugby Association">
    <meta property="og:locale" content="en_US">
    <meta property="article:published_time" content="${publishedDate}">
    <meta property="article:modified_time" content="${publishedDate}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(article.title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${imageUrl}">
    <link rel="icon" type="image/png" href="${imageUrl}">
    <link rel="apple-touch-icon" href="${imageUrl}">
    <!-- Redirect to actual news detail page -->
    <script>
        window.location.replace('/news-detail.html?id=${id}');
    </script>
</head>
<body>
    <p>Redirecting to article...</p>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.redirect(307, `/news-detail.html?id=${id}`);
    }
};