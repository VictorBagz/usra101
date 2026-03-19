// player-registration.js (Complete Rewrite)

document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENT SELECTION ---
    const supabase = window.supabase;
    const form = document.getElementById("playerRegistrationForm");
    const submitBtn = document.getElementById("submitBtn");
    const pageTitle = document.querySelector(".page-title");
    const errorDisplay = document.getElementById("form-error-message");
    
    // Form field elements
    const elements = {
        playerPhoto: document.getElementById("playerPhoto"),
        photoPreview: document.getElementById("photo-preview"),
        firstName: document.getElementById("firstName"),
        middleName: document.getElementById("middleName"),
        lastName: document.getElementById("lastName"),
        dobDay: document.getElementById("dobDay"),
        dobMonth: document.getElementById("dobMonth"),
        dobYear: document.getElementById("dobYear"),
        age: document.getElementById("age"),
        gender: document.getElementById("gender"),
        position: document.getElementById("position"),
        className: document.getElementById("className"),
        lin: document.getElementById("lin"),
        pleIndex: document.getElementById("pleIndex"),
        pleYear: document.getElementById("pleYear"),
        documentType: document.getElementById("documentType"),
        pleCertificate: document.getElementById("pleCertificate"),
        parentRelationship: document.getElementById("parentRelationship"),
        parentNames: document.getElementById("parentNames"),
        parentContact: document.getElementById("parentContact"),
        parentNin: document.getElementById("parentNin"),
        parentResidence: document.getElementById("parentResidence")
    };

    let editMode = false;
    let editPlayerId = null;
    let editGuardianId = null;

    // --- INITIALIZATION ---
    if (!supabase) {
        showError("Critical configuration error. Supabase client is not available.");
        if(submitBtn) submitBtn.disabled = true;
        return;
    }
    populateDateSelectors();
    setupEventListeners();
    checkForEditMode();

    // --- HELPER FUNCTIONS ---
    function populateDateSelectors() {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        for (let i = 1; i <= 31; i++) elements.dobDay.innerHTML += `<option value="${i}">${i}</option>`;
        months.forEach((month, index) => elements.dobMonth.innerHTML += `<option value="${index + 1}">${month}</option>`);
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i >= 1980; i--) elements.dobYear.innerHTML += `<option value="${i}">${i}</option>`;
    }

    function calculateAge() {
        if (elements.dobDay.value && elements.dobMonth.value && elements.dobYear.value) {
            const birthDate = new Date(elements.dobYear.value, elements.dobMonth.value - 1, elements.dobDay.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            elements.age.value = age >= 0 ? age : "";
        }
    }
    
    function getAgeCategory(age) {
        if (age < 15) return 'U15';
        if (age >= 15 && age < 17) return 'U17';
        if (age >= 17 && age < 20) return 'U20';
        return 'Senior'; // Fallback for older players
    }

    function handleFileInputChange(inputElement, previewElement) {
        const file = inputElement.files[0];
        const fileLabelText = inputElement.nextElementSibling.querySelector(".file-label-text");
        const documentNote = document.querySelector(".document-note");
        
        if (!file) {
            if (inputElement.id === "playerPhoto") {
                fileLabelText.textContent = "Choose photo...";
            } else {
                const docType = elements.documentType.value === "ple" ? "PLE Certificate" : "Passport";
                fileLabelText.textContent = `Upload ${docType}...`;
            }
            return;
        }
        
        fileLabelText.textContent = file.name;

        if (previewElement) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewElement.src = event.target.result;
                previewElement.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    }

    function setupEventListeners() {
        [elements.dobDay, elements.dobMonth, elements.dobYear].forEach(el => el.addEventListener("change", calculateAge));
        elements.playerPhoto.addEventListener("change", () => handleFileInputChange(elements.playerPhoto, elements.photoPreview));
        elements.pleCertificate.addEventListener("change", () => handleFileInputChange(elements.pleCertificate, null));
        elements.documentType.addEventListener("change", () => {
            const uploadLabel = elements.pleCertificate.nextElementSibling.querySelector(".file-label-text");
            const docType = elements.documentType.value === "ple" ? "PLE Certificate" : "Passport";
            uploadLabel.textContent = `Upload ${docType}...`;
            // Clear the file input when document type changes
            elements.pleCertificate.value = "";
        });
        form.addEventListener("submit", handleFormSubmit);
    }
    
    // --- EDIT MODE LOGIC ---
    async function checkForEditMode() {
        const params = new URLSearchParams(window.location.search);
        const playerId = params.get('edit');
        if (playerId) {
            editMode = true;
            editPlayerId = playerId;
            pageTitle.textContent = "Edit Player Details";
            submitBtn.textContent = "Update Player Details";
            // Make file inputs not required for editing
            elements.playerPhoto.required = false;
            elements.pleCertificate.required = false;
            await loadPlayerData(playerId);
        }
    }

    async function loadPlayerData(playerId) {
        try {
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select('*, guardians(*)') // Fetch player and their related guardian
                .eq('id', playerId)
                .single();
            
            if (playerError) throw playerError;

            const guardianData = playerData.guardians;
            editGuardianId = guardianData.id;

            // Populate player fields
            elements.firstName.value = playerData.first_name || '';
            elements.middleName.value = playerData.middle_name || '';
            elements.lastName.value = playerData.lastName || '';
            elements.gender.value = playerData.gender || '';
            elements.position.value = playerData.position || '';
            elements.className.value = playerData.class_name || '';
            elements.lin.value = playerData.lin || '';
            elements.pleIndex.value = playerData.ple_index_number || '';
            elements.pleYear.value = playerData.ple_year || '';
            
            if (playerData.date_of_birth) {
                const [year, month, day] = playerData.date_of_birth.split('-');
                elements.dobYear.value = parseInt(year);
                elements.dobMonth.value = parseInt(month);
                elements.dobDay.value = parseInt(day);
                calculateAge();
            }

            // Populate guardian fields
            elements.parentRelationship.value = guardianData.relationship_to_player || '';
            elements.parentNames.value = guardianData.full_name || '';
            elements.parentContact.value = guardianData.contact_number || '';
            elements.parentNin.value = guardianData.nin || '';
            elements.parentResidence.value = guardianData.residence || '';

        } catch (error) {
            showError("Failed to load player data for editing. " + error.message);
        }
    }


    // Generate Player ID
    function generatePlayerId(gender, birthYear) {
        // Get last 2 digits of birth year
        const yearSuffix = birthYear.toString().slice(-2);
        
        // Generate 5 random characters (uppercase letters excluding O and I, and numbers)
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ1234567890';
        let randomPart = '';
        for(let i = 0; i < 5; i++) {
            randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        // Construct the ID: USRA-[M/F][5random][2year]
        return `USRA-${gender === 'male' ? 'M' : 'F'}${randomPart}${yearSuffix}`;
    }

    // --- FORM SUBMISSION LOGIC ---
    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('Form submission started...'); // Debug log
        hideError();
        
        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        requiredFields.forEach(field => {
            if (!field.value) {
                isValid = false;
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        });

        if (!isValid) {
            showError('Please fill in all required fields.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in.");

            // Gather and calculate data
            const age = parseInt(elements.age.value);
            const age_category = getAgeCategory(age);
            const fullName = `${elements.firstName.value} ${elements.middleName.value} ${elements.lastName.value}`.replace(/\s+/g, ' ').trim();
            const dob = `${elements.dobYear.value}-${String(elements.dobMonth.value).padStart(2, '0')}-${String(elements.dobDay.value).padStart(2, '0')}`;
            
            // Generate the player ID
            const playerId = generatePlayerId(elements.gender.value, elements.dobYear.value);
            
            // Display the generated ID
            document.getElementById('playerId').value = playerId;
            document.getElementById('playerId').style.color = '#2563eb'; // Make it stand out in blue
            
            // Guardian data is the same for create/update
            const guardianData = {
                full_name: elements.parentNames.value,
                relationship_to_player: elements.parentRelationship.value,
                contact_number: elements.parentContact.value,
                nin: elements.parentNin.value || null,
                residence: elements.parentResidence.value,
            };

            // Player data is mostly the same
            let playerData = {
                player_id: playerId, // Add the generated ID
                first_name: elements.firstName.value,
                middle_name: elements.middleName.value || null,
                last_name: elements.lastName.value,
                full_name: fullName,
                date_of_birth: dob,
                gender: elements.gender.value,
                position: elements.position.value || null,
                age: age,
                age_category: age_category,
                class_name: elements.className.value,
                lin: elements.lin.value || null,
                ple_index_number: elements.pleIndex.value,
                ple_year: elements.pleYear.value,
            };

            if (editMode) {
                // --- UPDATE LOGIC ---
                // Update guardian
                const { error: guardianUpdateError } = await supabase.from('guardians').update(guardianData).eq('id', editGuardianId);
                if (guardianUpdateError) throw guardianUpdateError;

                // Update player
                const { error: playerUpdateError } = await supabase.from('players').update(playerData).eq('id', editPlayerId);
                if (playerUpdateError) throw playerUpdateError;

                ErrorHandler.showSuccess("Player details updated successfully!");

            } else {
                // --- CREATE LOGIC ---
                // Insert guardian and get ID
                const { data: newGuardian, error: guardianError } = await supabase.from('guardians').insert(guardianData).select('id').single();
                if (guardianError) throw guardianError;

                // Add guardian_id to player data
                playerData.guardian_id = newGuardian.id;
                
                // Get school_id from profile
                const { data: profile, error: profileError } = await supabase.from('profiles').select('schools (id)').eq('id', user.id).single();
                if (profileError) throw new Error('Could not fetch school information. ' + profileError.message);
                if (!profile.schools?.id) throw new Error('No school associated with this account.');
                
                playerData.school_id = profile.schools.id;


                // Upload files and add paths to player data
                const uploadFile = async (file, bucket) => {
                    if (!file) throw new Error("A required file is missing.");
                    const filePath = `${user.id}/${Date.now()}_${file.name}`;
                    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file);
                    if (error) throw error;
                    return {
                        path: data.path,
                        type: elements.documentType.value // Include the document type
                    };
                };
            
                const [playerPhotoPath, pleCertificatePath] = await Promise.all([
                    uploadFile(elements.playerPhoto.files[0], "player_photos"),
                    uploadFile(elements.pleCertificate.files[0], "player_documents"),
                ]);

                playerData.photo_url = playerPhotoPath.path;
                playerData.document_url = pleCertificatePath.path;
                playerData.document_type = pleCertificatePath.type;

                console.log('Inserting player data:', playerData); // Debug log

                // Insert player
                const { error: playerError } = await supabase.from('players').insert(playerData);
                if (playerError) throw playerError;

                console.log('Player registration successful'); // Debug log
                ErrorHandler.showSuccess("Player registered successfully!");
                
                // Delay redirect to show success message
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
            }
            
            // Note: Don't redirect here, let the success case handle it
            
        } catch (error) {
            console.error("Submission Error:", error);
            showError(error.message || "An unexpected error occurred.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = editMode ? "Update Player Details" : "Submit Player Registration";
        }
    }

    const showError = (message) => {
        ErrorHandler.showError(message);
    };

    const hideError = () => {
        // No need to do anything since modals are self-cleaning
    };
});