// Initialize Supabase client
(() => {
    // Supabase config (keys and URL)
    const SUPABASE_URL = 'https://vzvtymgtegqupyjezfgd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dnR5bWd0ZWdxdXB5amV6ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjUyNTgsImV4cCI6MjA3NTIwMTI1OH0.hhThAdMLbc3Ircx9YnEOfvPFr3LjQUjISl6zW5ZpFtE';

    // Initialize Supabase client
    function initializeSupabase() {
        return new Promise((resolve, reject) => {
            try {
                if (typeof supabase === 'undefined') {
                    reject(new Error('Supabase library not loaded'));
                    return;
                }
                
                const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true
                    }
                });
                
                window.supabase = client;
                console.log('Supabase client initialized successfully');
                window.dispatchEvent(new Event('supabaseReady'));
                resolve(client);
            } catch (error) {
                console.error('Error initializing Supabase client:', error);
                reject(error);
            }
        });
    }

    // Function to check if Supabase is loaded
    function checkSupabaseLoaded(maxAttempts = 10) {
        let attempts = 0;
        
        return new Promise((resolve, reject) => {
            const check = () => {
                attempts++;
                if (typeof supabase !== 'undefined') {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Supabase failed to load'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    // Initialize when everything is ready
    async function init() {
        try {
            await checkSupabaseLoaded();
            await initializeSupabase();
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            // Show error in UI if ErrorHandler is available
            if (window.ErrorHandler) {
                window.ErrorHandler.showError('Failed to initialize authentication system. Please refresh the page.');
            }
        }
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


