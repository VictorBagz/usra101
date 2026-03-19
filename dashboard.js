// dashboard.js (Complete Fixed Version)

document.addEventListener("DOMContentLoaded", async () => {
  // Wait for supabase to be initialized
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!window.supabase && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  const supabase = window.supabase;
  const errorDisplay = document.getElementById("dashboard-error");
  const modal = document.getElementById("playerModal");
  const modalClose = document.querySelector(".modal-close");

  // Close modal when clicking the close button or outside the modal
  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  if (!supabase) {
    ErrorHandler.showError("Critical configuration error. Please refresh the page.");
    return;
  }

  // Check URL parameters for school view mode
  const urlParams = new URLSearchParams(window.location.search);
  const viewMode = urlParams.get('mode');
  const schoolId = urlParams.get('schoolId');

  if (viewMode === 'view' && schoolId) {
    // School view mode - load school data directly
    try {
      const { data: schoolData, error } = await supabase
        .from("schools")
        .select('*')
        .eq("id", schoolId)
        .single();

      if (error) throw error;
      if (!schoolData) throw new Error("School not found");

      populateProfileData({ schools: schoolData });
      if (schoolData.id) {
        loadPlayers(schoolData.id);
      }
      
      // Hide certain elements in view mode
      document.querySelector('.action-buttons').style.display = 'none';
      return;
    } catch (error) {
      ErrorHandler.showError("Could not load school data. Please try again.");
      return;
    }
  }

  // Normal mode - proceed with user authentication
  let sessionData;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      window.location.href = "signin.html";
      return;
    }
    sessionData = data.session;
  } catch (error) {
    ErrorHandler.showError("Could not verify session. Please sign in again.");
    setTimeout(() => { window.location.href = "signin.html"; }, 2000);
    return;
  }

  const user = sessionData.user;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(`*, schools (*)`)
      .eq("id", user.id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Your profile could not be found.");
    
    populateProfileData(data);
    
    // Show chairman's dashboard link for authorized email
    const chairmansDashboard = document.getElementById('chairmansDashboard');
    if (chairmansDashboard) {
        if (user.email === 'victorbaguma34@gmail.com') {
            chairmansDashboard.style.display = 'flex';
            chairmansDashboard.innerHTML = '<i class="fas fa-chart-line"></i> Analytics';
            chairmansDashboard.href = 'chairmans-stats.html';
        } else {
            chairmansDashboard.style.display = 'none';
        }
    }
    
    if (data.schools?.id) {
        loadPlayers(data.schools.id);
    }

  } catch (error) {
    ErrorHandler.handleError(error, "Could not fetch your profile data.");
  }
});

function populateProfileData(data) {
  const schoolData = data.schools;
  const defaultProfilePic = "https://placehold.co/100x100/EFEFEF/333333?text=No+Photo";
  const defaultSchoolBadge = "https://placehold.co/150x150/EFEFEF/333333?text=No+Badge";
  
  document.getElementById("sidebar-user-name").textContent = data.full_name || "N/A";
  document.getElementById("sidebar-school-name").textContent = schoolData?.school_name || "N/A";
  document.getElementById("sidebar-profile-photo").src = data.profile_photo_url || defaultProfilePic;
  document.getElementById("sidebar-profile-photo").onerror = function() { this.src = defaultProfilePic; };

  const setData = (field, value, fallback = "...") => {
    const elements = document.querySelectorAll(`[data-field="${field}"]`);
    if (elements.length > 0) {
        elements.forEach(el => {
            const finalValue = value || fallback;
            if (el.dataset.type === "image") {
                el.src = finalValue;
                el.onerror = function() { this.src = defaultSchoolBadge; };
            } else if (el.dataset.type === "link") {
                el.href = finalValue;
                el.textContent = value ? "View Document" : "No Document";
                if (!value) el.classList.add("disabled");
            } else if (el.dataset.type === "background") {
                if (value) el.style.backgroundImage = `url('${finalValue}')`;
            } else {
                el.textContent = finalValue;
            }
        });
    }
  };
  
  const dashboardContainer = document.querySelector('.dashboard-container');
  if (dashboardContainer && schoolData?.school_badge_url) {
    dashboardContainer.style.setProperty('--school-badge-bg', `url('${schoolData.school_badge_url}')`);
  }

  setData("schoolName", schoolData?.school_name);
  setData("centerNumber", schoolData?.center_number);
  setData("schoolEmail", schoolData?.school_email);
  setData("region", schoolData?.region);
  setData("district", schoolData?.district);
  setData("schoolBadge", schoolData?.school_badge_url, defaultSchoolBadge);

  setData("adminFullName", data.full_name);
  setData("nin", data.nin);
  setData("repEmail", data.email);
  setData("role", data.role);
  setData("contact1", data.contact_1);
  setData("qualifications", data.qualifications);
  setData("documents", data.documents_url);
}

async function loadPlayers(schoolId) {
    const supabase = window.supabase;
    if (!supabase || !schoolId) return;

    try {
        const { data: players, error } = await supabase
            .from('players')
            .select('*')
            .eq('school_id', schoolId)
            .order('full_name');

        if (error) throw error;

        const groupedPlayers = {
            boys: {
                u20: players.filter(p => p.gender === 'male' && p.age_category === 'U20'),
                u17: players.filter(p => p.gender === 'male' && p.age_category === 'U17'),
                u15: players.filter(p => p.gender === 'male' && p.age_category === 'U15')
            },
            girls: {
                u20: players.filter(p => p.gender === 'female' && p.age_category === 'U20'),
                u17: players.filter(p => p.gender === 'female' && p.age_category === 'U17'),
                u15: players.filter(p => p.gender === 'female' && p.age_category === 'U15')
            }
        };

        renderPlayers(groupedPlayers);
    } catch (error) {
        ErrorHandler.handleError(error, "Failed to load players.");
    }
}

function renderPlayers(groupedPlayers) {
    const supabase = window.supabase;
    const placeholder = 'https://placehold.co/50x50/EFEFEF/333333?text=...';

    function createPlayerItem(player) {
        let photoUrl = placeholder;

        if (player.photo_url) {
            const { data } = supabase
                .storage
                .from('player_photos') 
                .getPublicUrl(player.photo_url);
            
            if (data) {
                photoUrl = data.publicUrl;
            }
        }
        
        return `
            <li class="player-item" data-player-id="${player.id}" onclick="showPlayerDetails('${player.id}')">
                <div class="player-photo-container">
                    <img src="${photoUrl}" 
                         alt="Photo of ${player.full_name}" 
                         class="player-photo"
                         onerror="this.src='${placeholder}'">
                </div>
                <div class="player-info">
                    <span class="player-name">${player.full_name}</span>
                    <span class="player-details">Age: ${player.age || 'N/A'}</span>
                </div>
            </li>
        `;
    }

    function renderCategory(listId, players) {
        const listElement = document.getElementById(listId);
        if (!listElement) return;

        if (players.length > 0) {
            listElement.innerHTML = players.map(createPlayerItem).join('');
        } else {
            listElement.innerHTML = '<li class="no-players">No players registered in this category.</li>';
        }

        const showMoreLink = listElement.nextElementSibling;
        const allItems = listElement.querySelectorAll('.player-item');

        if (allItems.length > 3) {
            showMoreLink.style.display = 'block';
            showMoreLink.textContent = `View All ${allItems.length} Players`;

            allItems.forEach((item, index) => {
                if (index >= 3) {
                    item.classList.add('hidden');
                }
            });

            showMoreLink.addEventListener('click', (e) => {
                e.preventDefault();
                const isHidden = listElement.querySelector('.player-item.hidden');
                
                if (isHidden) {
                    allItems.forEach(item => item.classList.remove('hidden'));
                    e.target.textContent = 'Show Less';
                } else {
                    allItems.forEach((item, index) => {
                        if (index >= 3) item.classList.add('hidden');
                    });
                    e.target.textContent = `View All ${allItems.length} Players`;
                }
            });
        }
    }

    ['u20', 'u17', 'u15'].forEach(category => {
        renderCategory(`boys-${category}`, groupedPlayers.boys[category]);
        renderCategory(`girls-${category}`, groupedPlayers.girls[category]);
    });
}

// Make showPlayerDetails globally available
window.showPlayerDetails = showPlayerDetails;

function setupCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    // Remove existing event listener by cloning
    const newFilter = categoryFilter.cloneNode(true);
    categoryFilter.parentNode.replaceChild(newFilter, categoryFilter);
    
    newFilter.addEventListener('change', () => {
        const selectedCategory = newFilter.value;
        const categorySections = document.querySelectorAll('.category-section');

        categorySections.forEach(section => {
            if (selectedCategory === 'all' || section.classList.contains(selectedCategory)) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    });
}

// Enrollment functionality
const enrollBtn = document.getElementById('enrollBtn');

if (enrollBtn) {
    enrollBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'enroll.html';
    });
}

// Settings overlay functionality
const settingsLink = document.querySelector('.sidebar-nav a[href="#"][title="Settings"]');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsClose = document.querySelector('.settings-close');

if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        settingsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

if (settingsClose) {
    settingsClose.addEventListener('click', () => {
        settingsOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}

if (settingsOverlay) {
    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
            settingsOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsOverlay?.classList.contains('active')) {
        settingsOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Player filter functionality
const playerFilter = document.getElementById('playerFilter');
if (playerFilter) {
    playerFilter.addEventListener('change', (e) => {
        const value = e.target.value;
        const boysSection = document.getElementById('boysTeams');
        const girlsSection = document.getElementById('girlsTeams');

        if (!boysSection || !girlsSection) return;

        if (value === 'all') {
            boysSection.style.display = 'block';
            girlsSection.style.display = 'block';
        } else if (value === 'boys') {
            boysSection.style.display = 'block';
            girlsSection.style.display = 'none';
        } else if (value === 'girls') {
            boysSection.style.display = 'none';
            girlsSection.style.display = 'block';
        }
    });
}

// Function to show player details in the modal
async function showPlayerDetails(playerId) {
    const supabase = window.supabase;
    if (!supabase) return;

    try {
        const { data: player, error } = await supabase
            .from('players')
            .select(`
                *,
                guardians (*)
            `)
            .eq('id', playerId)
            .single();

        if (error) throw error;

        let photoUrl = 'https://placehold.co/120x120/EFEFEF/333333?text=No+Photo';
        if (player.photo_url) {
            const { data } = supabase
                .storage
                .from('player_photos')
                .getPublicUrl(player.photo_url);
            if (data) {
                photoUrl = data.publicUrl;
            }
        }

        let pleCertUrl = '#';
        if (player.ple_certificate_url) {
            const { data } = supabase
                .storage
                .from('player_documents')
                .getPublicUrl(player.ple_certificate_url);
            if (data) {
                pleCertUrl = data.publicUrl;
            }
        }

        document.querySelector('.modal-player-photo').src = photoUrl;
        document.querySelector('.modal-player-name').textContent = player.full_name;
        document.querySelector('.modal-player-category').textContent = `${player.gender === 'male' ? 'Boys' : 'Girls'} ${player.age_category}`;

        document.getElementById('modal-playerId').textContent = player.player_id || 'N/A';
        document.getElementById('modal-firstName').textContent = player.first_name || 'N/A';
        document.getElementById('modal-middleName').textContent = player.middle_name || 'N/A';
        document.getElementById('modal-lastName').textContent = player.last_name || 'N/A';
        document.getElementById('modal-dob').textContent = new Date(player.date_of_birth).toLocaleDateString() || 'N/A';
        document.getElementById('modal-age').textContent = player.age || 'N/A';
        document.getElementById('modal-class').textContent = player.class_name || 'N/A';
        document.getElementById('modal-position').textContent = player.position || 'N/A';

        document.getElementById('modal-lin').textContent = player.lin || 'N/A';
        document.getElementById('modal-pleIndex').textContent = player.ple_index_number || 'N/A';
        document.getElementById('modal-pleYear').textContent = player.ple_year || 'N/A';
        document.getElementById('modal-pleCert').href = pleCertUrl;

        if (player.guardians) {
            document.getElementById('modal-guardianName').textContent = player.guardians.full_name || 'N/A';
            document.getElementById('modal-relationship').textContent = player.guardians.relationship_to_player || 'N/A';
            document.getElementById('modal-guardianContact').textContent = player.guardians.contact_number || 'N/A';
            document.getElementById('modal-guardianNin').textContent = player.guardians.nin || 'N/A';
            document.getElementById('modal-guardianResidence').textContent = player.guardians.residence || 'N/A';
        }

        document.getElementById('playerModal').style.display = 'block';

    } catch (error) {
        console.error('Error fetching player details:', error);
        ErrorHandler.showError('Failed to load player details. Please try again.');
    }
}

// Make downloadCategoryPDF globally available
window.downloadCategoryPDF = downloadCategoryPDF;

async function downloadCategoryPDF(categoryId, categoryName) {
    try {
        // Check if jsPDF is loaded
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            ErrorHandler.showError('PDF library not loaded. Please refresh the page.');
            return;
        }

        const { jsPDF } = window.jspdf;
        
        // Get the players from the specified category
        const categoryList = document.getElementById(categoryId);
        if (!categoryList) {
            ErrorHandler.showError('Category not found.');
            return;
        }

        const playerItems = categoryList.querySelectorAll('.player-item');
        
        if (playerItems.length === 0) {
            ErrorHandler.showError('No players found in this category.');
            return;
        }

        // Create new PDF document
        const doc = new jsPDF();

        // Load and add the USRA logo
        const img = new Image();
        img.src = 'photos/logos/usraLogo.png';
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // Calculate image dimensions to maintain aspect ratio
        const maxWidth = 40; // maximum width in the PDF
        const ratio = img.height / img.width;
        const width = maxWidth;
        const height = width * ratio;

        // Add the logo to the top right corner
        doc.addImage(img, 'PNG', 155, 10, width, height);
        
        // Get school name for the header
        const schoolName = document.querySelector('[data-field="schoolName"]')?.textContent || 'School';
        
        // Add header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(schoolName, 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text(categoryName, 105, 30, { align: 'center' });
        
        // Add date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 38, { align: 'center' });
        
        // Draw a line
        doc.setLineWidth(0.5);
        doc.line(20, 42, 190, 42);
        
        // Prepare table data
        const tableData = [];
        let playerNumber = 1;
        
        playerItems.forEach(item => {
            const name = item.querySelector('.player-name')?.textContent || 'N/A';
            const age = item.querySelector('.player-details')?.textContent?.replace('Age: ', '') || 'N/A';
            
            tableData.push([
                playerNumber++,
                name,
                age
            ]);
        });
        
        // Add table using autoTable plugin
        doc.autoTable({
            startY: 48,
            head: [['#', 'Player Name', 'Age']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [37, 99, 235], // Blue color
                textColor: 255,
                fontSize: 11,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 10
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            margin: { top: 48, left: 20, right: 20 }
        });
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(128);
            doc.text(
                `Page ${i} of ${pageCount}`,
                105,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }
        
        // Save the PDF
        const fileName = `${categoryName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        // Show success message
        ErrorHandler.showSuccess('PDF downloaded successfully!');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        ErrorHandler.showError('Failed to generate PDF. Please try again.');
    }
}