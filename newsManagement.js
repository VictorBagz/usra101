// News management functions
async function deleteNews(newsId) {
    if (!confirm('Are you sure you want to delete this news article?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', newsId);

        if (error) throw error;

        // Remove the news card from the UI
        const newsCard = document.querySelector(`article[data-id="${newsId}"]`);
        if (newsCard) {
            newsCard.style.opacity = '0';
            newsCard.style.transform = 'translateY(20px)';
            setTimeout(() => newsCard.remove(), 300);
        }

        // Show success message
        showNotification('News article deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting news:', error);
        showNotification('Failed to delete news article', 'error');
    }
}

function editNews(newsId) {
    const newsItem = allNews.find(item => item.id === newsId);
    if (!newsItem) return;

    // Redirect to the edit page with the news ID
    window.location.href = `news-edit.html?id=${newsId}`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}