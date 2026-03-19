// handles the tournament enrollment UI interaction
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Supabase to be initialized
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!window.supabase && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }

    if (!window.supabase) {
        console.error('Supabase failed to initialize');
        return;
    }

    // Get the enroll button and overlay elements
    const enrollButton = document.getElementById('enrollBtn');
    const tournamentOverlay = document.getElementById('tournamentOverlay');
    const closeButton = document.querySelector('.tournament-close');

    // Add click event listener to the enroll button
    if (enrollButton) {
        enrollButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Enroll button clicked'); // Debug log
            if (tournamentOverlay) {
                tournamentOverlay.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
                
                // Get school ID from the page
                const schoolIdElement = document.querySelector('[data-field="schoolId"]');
                const centerNumber = schoolIdElement?.textContent?.trim();
                
                // Load tournaments if center number exists
                if (centerNumber && typeof loadTournaments === 'function') {
                    // First get the actual UUID for the school
                    window.supabase
                        .from('schools')
                        .select('id')
                        .eq('center_number', centerNumber)
                        .single()
                        .then(({ data: schoolData, error: schoolError }) => {
                            if (schoolError) throw schoolError;
                            if (!schoolData) throw new Error('School not found');
                            
                            // Use the actual UUID from the schools table
                            return loadTournaments(schoolData.id);
                        })
                        .catch(error => {
                            console.error('Error loading tournaments:', error);
                            ErrorHandler.showError('Failed to load tournaments. Please try again.');
                        });
                } else {
                    console.error('School ID not found or loadTournaments function not available');
                    ErrorHandler.showError('Could not load tournaments. Please try again later.');
                }
            } else {
                console.error('Tournament overlay not found');
                ErrorHandler.showError('Could not open tournament enrollment. Please refresh the page.');
            }
        });
    } else {
        console.error('Enroll button not found');
    }

    // Add click event listener to the close button
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            if (tournamentOverlay) {
                // Remove active class first to trigger slide-out animation
                tournamentOverlay.classList.remove('active');
                // Wait for animation to complete before hiding
                setTimeout(() => {
                    tournamentOverlay.style.display = 'none';
                    document.body.style.overflow = ''; // Restore background scrolling
                }, 300); // Match the CSS transition duration
            }
        });
    }

    // Close overlay when clicking outside
    if (tournamentOverlay) {
        tournamentOverlay.addEventListener('click', function(e) {
            if (e.target === tournamentOverlay) {
                // Remove active class first to trigger slide-out animation
                tournamentOverlay.classList.remove('active');
                // Wait for animation to complete before hiding
                setTimeout(() => {
                    tournamentOverlay.style.display = 'none';
                    document.body.style.overflow = '';
                }, 300); // Match the CSS transition duration
            }
        });
    }

    // Close overlay when pressing ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && tournamentOverlay && tournamentOverlay.style.display === 'block') {
            // Remove active class first to trigger slide-out animation
            tournamentOverlay.classList.remove('active');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                tournamentOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }, 300); // Match the CSS transition duration
        }
    });
});