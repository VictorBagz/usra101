// Tournament structure and functionality

// Tournament data structure
const tournamentStructure = {
    'central-leagues': {
        mainLeague: {
            id: 'central-main-2025',
            name: 'Central Schools Main League',
            enrollment_status: 'open',
            description: 'Premier division of central region schools rugby',
            start_date: '2025-11-01',
            location: 'Various Venues, Central Region'
        },
        divisionTwo: {
            id: 'central-div2-2025',
            name: 'Central Schools Division II League',
            description: 'Second division of central region schools rugby',
            start_date: '2025-11-01',
            location: 'Various Venues, Central Region'
        }
    },
    'zonal-leagues': {
        westAcholi: {
            id: 'west-acholi-2025',
            name: 'West Acholi Zone League',
            description: 'West Acholi zonal schools competition',
            start_date: '2025-11-15',
            location: 'West Acholi Zone'
        },
        eastAcholi: {
            id: 'east-acholi-2025',
            name: 'East Acholi Zone League',
            description: 'East Acholi zonal schools competition',
            start_date: '2025-11-15',
            location: 'East Acholi Zone'
        },
        masaka: {
            id: 'masaka-2025',
            name: 'Masaka Zone League',
            description: 'Masaka zonal schools competition',
            start_date: '2025-11-15',
            location: 'Masaka Zone'
        },
        kigezi: {
            id: 'kigezi-2025',
            name: 'Kigezi Zone League',
            description: 'Kigezi zonal schools competition',
            start_date: '2025-11-15',
            location: 'Kigezi Zone'
        },
        teso: {
            id: 'teso-2025',
            name: 'Teso Zone League',
            description: 'Teso zonal schools competition',
            start_date: '2025-11-15',
            location: 'Teso Zone'
        },
        rwenzori: {
            id: 'rwenzori-2025',
            name: 'Rwenzori Zone League',
            description: 'Rwenzori zonal schools competition',
            start_date: '2025-11-15',
            location: 'Rwenzori Zone'
        },
        bugisu: {
            id: 'bugisu-2025',
            name: 'Bugisu Zone League',
            description: 'Bugisu zonal schools competition',
            start_date: '2025-11-15',
            location: 'Bugisu Zone'
        },
        busoga: {
            id: 'busoga-2025',
            name: 'Busoga Zone League',
            description: 'Busoga zonal schools competition',
            start_date: '2025-11-15',
            location: 'Busoga Zone'
        },
        ankole: {
            id: 'ankole-2025',
            name: 'Ankole Zone League',
            description: 'Ankole zonal schools competition',
            start_date: '2025-11-15',
            location: 'Ankole Zone'
        },
        bukedi: {
            id: 'bukedi-2025',
            name: 'Bukedi Zone League',
            description: 'Bukedi zonal schools competition',
            start_date: '2025-11-15',
            location: 'Bukedi Zone'
        },
        lango: {
            id: 'lango-2025',
            name: 'Lango Zone League',
            description: 'Lango zonal schools competition',
            start_date: '2025-11-15',
            location: 'Lango Zone'
        }
    },
    'regional-leagues': {
        western: {
            id: 'western-2025',
            name: 'Western Regional League',
            description: 'Western region schools competition',
            start_date: '2025-12-01',
            location: 'Western Region'
        },
        central: {
            id: 'central-2025',
            name: 'Central Regional League',
            description: 'Central region schools competition',
            start_date: '2025-12-01',
            location: 'Central Region'
        },
        northern: {
            id: 'northern-2025',
            name: 'Northern Regional League',
            description: 'Northern region schools competition',
            start_date: '2025-12-01',
            location: 'Northern Region'
        },
        eastern: {
            id: 'eastern-2025',
            name: 'Eastern Regional League',
            description: 'Eastern region schools competition',
            start_date: '2025-12-01',
            location: 'Eastern Region'
        }
    },
    'cups': {
        independence: {
            id: 'independence-2025',
            name: 'Independence Cup 2025',
            description: 'National schools independence cup competition',
            start_date: '2025-10-09',
            location: 'Kampala, Uganda'
        }
    },
    'international': {
        abudhabi: {
            id: 'abudhabi-2026',
            name: 'World Schools Festival Abu-Dhabi 2026',
            description: 'International schools rugby tournament hosted in Abu-Dhabi, UAE',
            start_date: '2026-01-15',
            location: 'Abu-Dhabi, UAE'
        }
    }
};

// Tournament loading and display functions
async function loadTournaments(schoolId, inOverlay = false) {
    const gridContainer = document.getElementById('overlayTournamentsGrid');
    const overlay = document.getElementById('tournamentOverlay');
    
    if (!gridContainer || !overlay) {
        console.error('Required elements not found');
        return;
    }

    if (!schoolId) {
        console.error('School ID is required');
        ErrorHandler.showError('School ID is missing. Please try again.');
        return;
    }

    // Show the overlay with animation
    overlay.style.display = 'block';
    // Trigger reflow
    overlay.offsetHeight;
    // Add active class for animation
    overlay.classList.add('active');

    try {
        const loadingPlaceholder = gridContainer.querySelector('.loading-placeholder');
        if (loadingPlaceholder) {
            loadingPlaceholder.style.display = 'block';
        }

        // Get existing enrollments with proper filter
        const { data: enrollments, error: enrollmentError } = await window.supabase
            .from('tournament_enrollments')
            .select('tournament_id')
            .eq('school_id', schoolId.trim());
            
        if (enrollmentError) {
            console.error('Error fetching enrollments:', enrollmentError);
            throw enrollmentError;
        }
        
        const existingEnrollments = enrollments ? enrollments.map(e => e.tournament_id) : [];

        // Clear existing tournament items
        const centralItems = gridContainer.querySelector('.tournament-category:nth-child(1) .tournament-items');
        const zoneItems = gridContainer.querySelector('.zone-tournaments');
        const regionItems = gridContainer.querySelector('.region-tournaments');
        const cupItems = gridContainer.querySelector('.tournament-category:nth-child(4) .tournament-items');
        const internationalItems = gridContainer.querySelector('.international-tournaments');

        [centralItems, zoneItems, regionItems, cupItems, internationalItems].forEach(container => {
            if (container) container.innerHTML = '';
        });

        // Setup event listeners for dropdowns
        setupTournamentDropdowns();

        // Load Central Leagues
        Object.values(tournamentStructure['central-leagues']).forEach(tournament => {
            if (centralItems) {
                centralItems.appendChild(createTournamentCard(tournament, existingEnrollments));
            }
        });

        // Load Independence Cup
        if (cupItems) {
            cupItems.appendChild(createTournamentCard(tournamentStructure.cups.independence, existingEnrollments));
        }

        // Hide loading placeholder
        if (loadingPlaceholder) {
            loadingPlaceholder.style.display = 'none';
        }

    } catch (error) {
        console.error('Error loading tournaments:', error);
        ErrorHandler.showError('Failed to load tournaments. Please try again.');
    }
}

function setupTournamentDropdowns(existingEnrollments = [], tournamentGroups = {}) {
    // Zone selector
    const zoneSelector = document.querySelector('.zone-selector');
    const zoneTournaments = document.querySelector('.zone-tournaments');
    
    if (zoneSelector && zoneTournaments) {
        zoneSelector.addEventListener('change', function() {
            const selectedZone = this.value;
            zoneTournaments.innerHTML = '';
            
            const zonalTournaments = tournamentGroups['zonal-league'] || [];
            const matchingTournament = zonalTournaments.find(t => t.category === selectedZone);
            
            if (matchingTournament) {
                zoneTournaments.style.display = 'grid';
                zoneTournaments.appendChild(createTournamentCard(matchingTournament, existingEnrollments));
            } else {
                zoneTournaments.style.display = 'none';
            }
        });
    }

    // Region selector
    const regionSelector = document.querySelector('.region-selector');
    const regionTournaments = document.querySelector('.region-tournaments');
    
    if (regionSelector && regionTournaments) {
        regionSelector.addEventListener('change', function() {
            const selectedRegion = this.value;
            regionTournaments.innerHTML = '';
            
            const regionalTournaments = tournamentGroups['regional'] || [];
            const matchingTournament = regionalTournaments.find(t => t.category === selectedRegion);
            
            if (matchingTournament) {
                regionTournaments.style.display = 'grid';
                regionTournaments.appendChild(createTournamentCard(matchingTournament, existingEnrollments));
            } else {
                regionTournaments.style.display = 'none';
            }
        });
    }

    // International selector
    const internationalSelector = document.querySelector('.international-selector');
    const internationalTournaments = document.querySelector('.international-tournaments');
    
    if (internationalSelector && internationalTournaments) {
        internationalSelector.addEventListener('change', function() {
            const selectedTournament = this.value;
            internationalTournaments.innerHTML = '';
            
            const internationalTournaments = tournamentGroups['international'] || [];
            const matchingTournament = internationalTournaments.find(t => t.category === selectedTournament);
            
            if (matchingTournament) {
                internationalTournaments.style.display = 'grid';
                internationalTournaments.appendChild(createTournamentCard(matchingTournament, existingEnrollments));
            } else {
                internationalTournaments.style.display = 'none';
            }
        });
    }
}

function createTournamentCard(tournament, existingEnrollments) {
    if (!tournament || !tournament.id) {
        console.error('Invalid tournament data:', tournament);
        return document.createElement('div');
    }

    // tournament.id is now a proper UUID from the database
    const isEnrolled = existingEnrollments.includes(tournament.id);
    const startDate = tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'Date TBD';

    const card = document.createElement('div');
    card.className = 'tournament-card';
    card.innerHTML = `
        <div class="tournament-header">
            <h3>${tournament.name}</h3>
            ${isEnrolled ? '<span class="enrolled-badge"><i class="fas fa-check-circle"></i> Enrolled</span>' : ''}
        </div>
        <div class="tournament-info">
            <p>${tournament.description}</p>
            <div class="tournament-details">
                <span><i class="fas fa-calendar"></i> ${startDate}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${tournament.location}</span>
            </div>
        </div>
        <div class="tournament-actions">
            ${isEnrolled 
                ? '<button class="btn btn-secondary" disabled><i class="fas fa-check"></i> Already Enrolled</button>'
                : `<button onclick="showPlayerSelection('${tournament.id}', '${tournament.name}')" class="btn btn-primary">
                    <i class="fas fa-users"></i> Enroll Players
                   </button>`
            }
        </div>
    `;
    return card;
}

// Export the tournament structure
window.tournamentStructure = tournamentStructure;