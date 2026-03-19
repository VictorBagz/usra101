// News data structure and management
class NewsManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.currentCategory = 'all';
        this.newsData = [];
        this.isLoading = false;
        this.supabase = null;
        this.cachedNews = new Map(); // Cache for news data
        this.lastUpdate = 0; // Timestamp for cache invalidation
        this.cacheTimeout = 5 * 60 * 1000; // Cache timeout (5 minutes)
        
        // Initialize the UI
        this.initializeUI();
        this.showLoadingSpinner();
        
        // Immediately try to initialize Supabase
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
            this.loadNewsData();
        } else {
            // If not available, wait for initialization
            window.addEventListener('supabaseReady', () => {
                this.supabase = supabaseClient;
                this.loadNewsData();
            }, { once: true }); // Use once: true to auto-remove the listener
        }
    }

    showLoadingSpinner() {
        const newsGrid = document.querySelector('.news-grid');
        newsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading latest news...</p>
            </div>
        `;
    }

    initializeSupabase() {
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
            this.loadNewsData();
        }
    }

    async loadNewsData() {
        if (!this.supabase || this.isLoading) return;

        const cacheKey = `${this.currentCategory}-${this.currentPage}`;
        
        try {
            this.isLoading = true;

            // Check cache first
            const now = Date.now();
            const cachedData = this.cachedNews.get(cacheKey);

            if (cachedData && (now - this.lastUpdate) < this.cacheTimeout) {
                this.newsData = cachedData.data;
                this.renderNews(cachedData.count);
                this.isLoading = false;
                return;
            }

            // If not in cache or cache expired, fetch from Supabase
            let query = this.supabase
                .from('news')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            // Apply category filter if not 'all'
            if (this.currentCategory !== 'all') {
                query = query.eq('category', this.currentCategory);
            }

            // Apply pagination
            const from = (this.currentPage - 1) * this.itemsPerPage;
            const to = from + this.itemsPerPage - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            // Update cache
            this.cachedNews.set(cacheKey, { data: data || [], count, timestamp: Date.now() });
            this.lastUpdate = Date.now();

            this.newsData = data || [];
            this.renderNews(count);
            
            // Prefetch next page if available
            const maxPages = Math.ceil(count / this.itemsPerPage);
            if (this.currentPage < maxPages) {
                this.prefetchNextPage();
            }
        } catch (error) {
            console.error('Error loading news:', error);
            const newsGrid = document.querySelector('.news-grid');
            newsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Unable to load news at this time. Please try again later.</p>
                    <button onclick="window.location.reload()" class="retry-btn">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        } finally {
            this.isLoading = false;
        }

        this.renderNews();
    }

    initializeUI() {
        // Set up filter buttons
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.filterNews(button.dataset.category);
                // Update active button
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        // Set up pagination
        document.getElementById('prevPage').addEventListener('click', () => this.changePage(-1));
        document.getElementById('nextPage').addEventListener('click', () => this.changePage(1));
    }

    filterNews(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.renderNews();
    }

    changePage(delta) {
        const filteredNews = this.getFilteredNews();
        const maxPages = Math.ceil(filteredNews.length / this.itemsPerPage);
        
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= maxPages) {
            this.currentPage = newPage;
            this.renderNews();
        }
    }

    getFilteredNews() {
        if (this.currentCategory === 'all') {
            return this.newsData;
        }
        return this.newsData.filter(item => item.category === this.currentCategory);
    }

    showLoadingSpinner() {
        const newsGrid = document.querySelector('.news-grid');
        newsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i> Loading News...
            </div>
        `;
    }

    hideLoadingSpinner() {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    async prefetchNextPage() {
        const nextPage = this.currentPage + 1;
        const cacheKey = `${this.currentCategory}-${nextPage}`;

        // If already in cache, don't prefetch
        if (this.cachedNews.has(cacheKey)) return;

        try {
            let query = this.supabase
                .from('news')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (this.currentCategory !== 'all') {
                query = query.eq('category', this.currentCategory);
            }

            const from = (nextPage - 1) * this.itemsPerPage;
            const to = from + this.itemsPerPage - 1;
            query = query.range(from, to);

            const { data, count } = await query;
            if (data) {
                this.cachedNews.set(cacheKey, { 
                    data: data, 
                    count, 
                    timestamp: Date.now() 
                });
            }
        } catch (error) {
            console.warn('Prefetch failed:', error);
            // Non-critical error, don't throw
        }
    }

    renderNews(totalCount) {
        const newsGrid = document.querySelector('.news-grid');
        const template = document.getElementById('news-template');
        
        this.hideLoadingSpinner();

        if (!Array.isArray(this.newsData) || this.newsData.length === 0) {
            newsGrid.innerHTML = `
                <div class="no-news">
                    <i class="fas fa-newspaper"></i>
                    <p>No news articles found in this category.</p>
                </div>
            `;
            return;
        }

        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();

        // Render news items
        this.newsData.forEach((newsItem, index) => {
            if (!newsItem) return; // Skip if newsItem is null
            
            const newsElement = template.content.cloneNode(true);
            
            try {
                // Pre-load image
                const imgUrl = newsItem.image_url || 'photos/logos/usraLogo.png';
                const img = new Image();
                img.src = imgUrl;

                // Fill in the template
                const imgElement = newsElement.querySelector('img');
                imgElement.src = imgUrl;
                imgElement.alt = newsItem.title || 'News Image';
                imgElement.onerror = () => {
                    imgElement.src = 'photos/logos/usraLogo.png';
                };

                // Use innerHTML for one-time assignment instead of multiple querySelector calls
                const article = newsElement.querySelector('article');
                
                // Format all the content
                const category = newsItem.category || 'general';
                const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
                const title = newsItem.title || 'Untitled News';
                const excerpt = newsItem.excerpt || (newsItem.content ? newsItem.content.substring(0, 150) + '...' : 'No content available');
                const date = newsItem.created_at ? this.formatDate(newsItem.created_at) : 'Recent';
                
                // Batch update the DOM
                article.querySelector('.news-category').textContent = formattedCategory;
                article.querySelector('.news-title').textContent = title;
                article.querySelector('.news-excerpt').textContent = excerpt;
                article.querySelector('.date-text').textContent = date;
                article.querySelector('.read-more').href = `news-detail.html?id=${newsItem.id || '0'}`;
                
                // Add to fragment with staggered animation
                article.style.opacity = '0';
                article.style.transform = 'translateY(20px)';
                article.style.transition = `opacity 0.3s ease ${index * 0.1}s, transform 0.3s ease ${index * 0.1}s`;
                
                fragment.appendChild(newsElement);
                
            } catch (error) {
                console.error('Error rendering news item:', error);
                // Continue with next item if there's an error with current one
            }
        });

        // Clear existing content and append all new content at once
        newsGrid.innerHTML = '';
        newsGrid.appendChild(fragment);

        // Trigger animations after a brief delay to ensure DOM is ready
        requestAnimationFrame(() => {
            newsGrid.querySelectorAll('article').forEach(article => {
                article.style.opacity = '1';
                article.style.transform = 'translateY(0)';
            });
        });

        // Update pagination display with the total count
        if (totalCount !== undefined) {
            const maxPages = Math.ceil(totalCount / this.itemsPerPage);
            document.getElementById('currentPage').textContent = `Page ${this.currentPage} of ${maxPages}`;
            document.getElementById('prevPage').disabled = this.currentPage === 1;
            document.getElementById('nextPage').disabled = this.currentPage === maxPages;
        }

        this.isLoading = false;
    }

    async updatePagination() {
        // Get total count of news items for current category
        let query = this.supabase.from('news').select('id', { count: 'exact' });
        if (this.currentCategory !== 'all') {
            query = query.eq('category', this.currentCategory);
        }
        
        const { count, error } = await query;
        
        if (!error) {
            const maxPages = Math.ceil(count / this.itemsPerPage);
            document.getElementById('currentPage').textContent = `Page ${this.currentPage} of ${maxPages}`;
            document.getElementById('prevPage').disabled = this.currentPage === 1;
            document.getElementById('nextPage').disabled = this.currentPage === maxPages;
        }
    }

    initializeUI() {
        // Set up filter buttons
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.filterNews(button.dataset.category);
                // Update active button
                document.querySelectorAll('.filter-btn').forEach(btn => 
                    btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        // Set up pagination
        document.getElementById('prevPage').addEventListener('click', () => 
            this.changePage(-1));
        document.getElementById('nextPage').addEventListener('click', () => 
            this.changePage(1));
    }

    async filterNews(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        await this.loadNewsData();
    }

    async changePage(delta) {
        this.currentPage += delta;
        await this.loadNewsData();
    }
}

// Initialize the news manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const newsManager = new NewsManager();
});