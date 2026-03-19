// registration.js (Fixed for RLS errors)

async function registerUser(formData) {
  const supabaseClient = window.supabase;
  
  try {
    // Step 1: Create the auth user
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    console.log("Auth user created:", authData.user.id);

    // Step 2: Create the profile record
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert([
        {
          id: authData.user.id,  // Same ID as auth user
          full_name: formData.fullName,
          email: formData.email,
          role: formData.role,
          school_id: formData.schoolId || null,
          created_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Important: If profile creation fails, delete the auth user to maintain consistency
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log("Profile created successfully");
    return { success: true, user: authData.user };

  } catch (error) {
    console.error("Registration error:", error);
    ErrorHandler._showModal(error.message || "Registration failed. Please try again.", 'error');
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Check if the Supabase client was initialized by createClient.js
  if (!window.supabase || typeof window.supabase.auth?.signUp !== "function") {
    console.error(
      "Supabase client is not initialized correctly! Make sure createClient.js is loaded before this script."
    );
    ErrorHandler.showError("A critical configuration error occurred. Please refresh the page or contact support.");
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Configuration Error";
    }
    return;
  }

  // --- ELEMENT SELECTIONS ---
  const supabase = window.supabase;
  const form = document.getElementById("schoolRegistrationForm");
  const nextButtons = document.querySelectorAll(".next-step");
  const prevButtons = document.querySelectorAll(".prev-step");
  const formSteps = document.querySelectorAll(".form-step");
  const progressSteps = document.querySelectorAll(".progress-step");
  const submitBtn = document.getElementById("submitBtn");
  const districtSelect = document.getElementById("district");

  // Populate districts dropdown
  if (window.ugandaDistricts && districtSelect) {
    ugandaDistricts.forEach(district => {
      const option = document.createElement('option');
      option.value = district;
      option.textContent = district;
      districtSelect.appendChild(option);
    });
  }

  // Password related elements
  const passwordInput = document.getElementById("adminPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const passwordToggles = document.querySelectorAll(".password-toggle");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");
  const passwordMatchError = document.getElementById("password-match-error");

  // All required fields for final validation
  const allRequiredInputs = form.querySelectorAll(
    "input[required], select[required]"
  );
  const termsCheckbox = document.getElementById("termsAccept");

  let currentStep = 1;

  // --- FORM NAVIGATION ---
  const updateFormSteps = () => {
    formSteps.forEach((step) => {
      step.classList.toggle(
        "active",
        parseInt(step.dataset.step) === currentStep
      );
    });
  };

  const updateProgressBar = () => {
    progressSteps.forEach((step, idx) => {
      const stepNum = idx + 1;
      step.classList.toggle("active", stepNum <= currentStep);
      step.classList.toggle("completed", stepNum < currentStep);
    });
  };

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const currentFormStep = form.querySelector(
        `.form-step[data-step="${currentStep}"]`
      );
      const requiredInputsInStep = currentFormStep.querySelectorAll(
        "input[required], select[required]"
      );
      let stepIsValid = true;

      requiredInputsInStep.forEach((input) => {
        input.style.borderColor = "";
        if (!input.value.trim()) {
          stepIsValid = false;
          input.style.borderColor = "red";
        }
      });

      if (!stepIsValid) {
        ErrorHandler.showError("Please fill in all required fields in this step.");
        return;
      }

      if (currentStep === 2) {
        if (passwordInput.value !== confirmPasswordInput.value) {
          passwordMatchError.textContent = "Passwords do not match.";
          passwordMatchError.style.display = "block";
          return;
        }
        passwordMatchError.textContent = "";
        passwordMatchError.style.display = "none";
      }

      if (currentStep < 3) {
        currentStep++;
        updateFormSteps();
        updateProgressBar();
        if (currentStep === 3) {
          updateSummary();
        }
      }
    });
  });

  prevButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (currentStep > 1) {
        currentStep--;
        updateFormSteps();
        updateProgressBar();
      }
    });
  });

  // --- IMAGE & FILE PREVIEWS ---
  const fileInputs = document.querySelectorAll("input[type='file']");
  fileInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const fileLabelText =
        e.target.nextElementSibling.querySelector(".file-label-text");

      if (file) {
        fileLabelText.textContent = file.name;
        const previewId = e.target.dataset.preview;
        if (previewId) {
          const previewElement = document.getElementById(previewId);
          if (previewElement) {
            const reader = new FileReader();
            reader.onload = (event) => {
              previewElement.src = event.target.result;
              previewElement.style.display = "block";
            };
            reader.readAsDataURL(file);
          }
        }
      } else {
        fileLabelText.textContent = "Choose file...";
      }
    });
  });

  // --- PASSWORD FEATURES ---
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.previousElementSibling;
      const type =
        input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);
      toggle.classList.toggle("fa-eye");
      toggle.classList.toggle("fa-eye-slash");
    });
  });

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const password = passwordInput.value;
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;

      let text = "Weak";
      let color = "#dc3545";
      let width = "20%";
      switch (strength) {
        case 2:
          text = "Fair";
          color = "#ffc107";
          width = "40%";
          break;
        case 3:
          text = "Good";
          color = "#ffc107";
          width = "60%";
          break;
        case 4:
          text = "Strong";
          color = "#28a745";
          width = "80%";
          break;
        case 5:
          text = "Very Strong";
          color = "#28a745";
          width = "100%";
          break;
      }
      strengthBar.style.width = password.length > 0 ? width : "0%";
      strengthBar.style.backgroundColor = color;
      strengthText.textContent = password.length > 0 ? `Strength: ${text}` : "";
    });
  }

  // --- SUMMARY & FINAL VALIDATION ---
  const updateSummary = () => {
    document.querySelectorAll("[data-summary]").forEach((field) => {
      const inputElement = document.getElementById(field.dataset.summary);
      if (inputElement) {
        let value = inputElement.value || "Not provided";
        if (inputElement.type === "file") {
          value = inputElement.files[0]?.name || "Not provided";
        }
        field.textContent = value;
      }
    });
  };

  const checkFormValidity = () => {
    let allValid = true;
    allRequiredInputs.forEach((input) => {
      if (!input.value.trim()) allValid = false;
    });
    submitBtn.disabled = !(allValid && termsCheckbox.checked);
  };

  allRequiredInputs.forEach((input) =>
    input.addEventListener("input", checkFormValidity)
  );
  termsCheckbox.addEventListener("change", checkFormValidity);

  // --- FORM SUBMISSION TO SUPABASE ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      console.log("Starting registration process...");
      
      const repEmail = document.getElementById("repEmail").value;
      const password = document.getElementById("adminPassword").value;
      const schoolBadgeFile = document.getElementById("schoolBadge").files[0];
      const profilePhotoFile = document.getElementById("profilePhoto").files[0];
      const documentsFile = document.getElementById("documents").files[0];

      // Validate inputs before proceeding
      if (!repEmail || !password) {
        ErrorHandler._showModal("Please fill in all required fields.", 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Registration";
        return;
      }

      // Check if email exists in auth system
      console.log("Checking if email is already registered...");
      try {
        const { data: signInCheck, error: signInError } = await supabase.auth.signInWithPassword({
          email: repEmail,
          password: "dummy-password-for-check"
        });

        if (!signInError || (signInError && signInError.message.includes("Invalid login credentials"))) {
          // If we got no error or an invalid credentials error, the email exists
          throw new Error("This email address is already registered. Please use a different email address or try signing in.");
        }
      } catch (authError) {
        // If we get an error that's not about invalid credentials, we can continue
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("This email address is already registered. Please use a different email address or try signing in.");
        }
        // Otherwise, the error means the email doesn't exist, so we can continue
      }

      console.log("Files to upload:", {
        schoolBadge: schoolBadgeFile?.name,
        profilePhoto: profilePhotoFile?.name,
        documents: documentsFile?.name
      });

      // Step 1: Create auth user with autoConfirm option
      console.log("Step 1: Creating auth user...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: repEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signin.html`,
          data: {
            full_name: document.getElementById("adminFullName").value,
          }
        }
      });
      
      if (authError) {
        console.error("Auth error:", authError);
        let userMessage = "Registration failed. ";
        if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
          userMessage += "This email address is already in use. Please use a different email address.";
        } else if (authError.message.includes("password")) {
          userMessage += "Please ensure your password meets the minimum requirements.";
        } else {
          userMessage += `${authError.message}`;
        }
        throw new Error(userMessage);
      }
      
      console.log("User created successfully:", authData.user.id);
      const userId = authData.user.id;
      
      // Step 2: Handle session - it might not exist if email confirmation is required
      console.log("Step 2: Checking for session...");
      let session = authData.session;
      
      // If no session, we need to sign in with the credentials to get one
      // This works if email confirmation is disabled in Supabase settings
      if (!session) {
        console.log("No session from signup, attempting sign in...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: repEmail,
          password: password,
        });
        
        if (!signInError && signInData.session) {
          session = signInData.session;
          console.log("Session obtained from sign in");
        } else if (signInError) {
          console.error("Sign in error:", signInError);
        }
      } else {
        console.log("Session obtained from signup");
      }
      
      // If still no session, check if email confirmation is required
      if (!session) {
        console.warn("No session available - email confirmation may be required");
        console.log("User created with ID:", userId);
        // We'll proceed without a session and handle uploads differently
      }

      // Step 3: Upload files (works with or without session)
      console.log("Step 3: Starting file uploads...");
      const uploadFile = async (file, bucket) => {
        if (!file) {
          console.log(`No file to upload for ${bucket}`);
          return null;
        }
        
        console.log(`Uploading ${file.name} to ${bucket}...`);
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) {
          console.error(`Upload error for ${bucket}:`, error);
          // Provide more specific error message
          if (error.message.includes("row-level security") || error.message.includes("policy")) {
            throw new Error(`Storage permission error for ${bucket}. Please ensure you've set up the correct RLS policies or contact support.`);
          }
          throw new Error(`Failed to upload ${bucket.replace('_', ' ')}: ${error.message}`);
        }
        
        console.log(`Successfully uploaded to ${bucket}:`, data.path);
        
        // For private buckets (documents), use signed URLs; for public buckets use public URLs
        if (bucket === 'documents') {
          // If we have a session, create signed URL
          if (session) {
            const { data: urlData, error: urlError } = await supabase.storage
              .from(bucket)
              .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year expiry
              
            if (urlError) throw urlError;
            return urlData.signedUrl;
          } else {
            // Without session, just store the path - will need to generate signed URL later
            return data.path;
          }
        } else {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);
          return urlData.publicUrl;
        }
      };

      // Upload files sequentially to better handle errors
      let schoolBadgeUrl = null;
      let profilePhotoUrl = null;
      let documentsUrl = null;

      try {
        schoolBadgeUrl = await uploadFile(schoolBadgeFile, "school_badges");
        profilePhotoUrl = await uploadFile(profilePhotoFile, "profile_photos");
        documentsUrl = await uploadFile(documentsFile, "documents");
        console.log("All files uploaded successfully");
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        // Don't sign out if we don't have a session
        if (session) {
          await supabase.auth.signOut();
        }
        throw uploadError;
      }

      // Step 4: Check if school email already exists
      console.log("Step 4: Checking for existing school email...");
      const { data: existingSchool } = await supabase
        .from("schools")
        .select("school_email, school_name")
        .eq("school_email", document.getElementById("schoolEmail").value)
        .single();

      if (existingSchool) {
        console.warn("School email already exists");
        // Clean up uploads and auth if school exists
        if (session) {
          await supabase.auth.signOut();
        }
        throw new Error("This school email address is already registered. Please use a different email address for your school registration.");
      }

      // Step 5: Insert school data
      console.log("Step 5: Inserting school data...");
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .insert({
          school_name: document.getElementById("schoolName").value,
          center_number: document.getElementById("centerNumber").value,
          school_email: document.getElementById("schoolEmail").value,
          region: document.getElementById("region").value,
          district: document.getElementById("district").value,
          school_badge_url: schoolBadgeUrl,
        })
        .select()
        .single();
        
      if (schoolError) {
        console.error("School insert error:", schoolError);
        if (session) {
          await supabase.auth.signOut();
        }
        throw new Error(`Failed to register school: ${schoolError.message}`);
      }
      
      console.log("School data inserted successfully:", schoolData.id);

      // Step 6: Insert profile data
      console.log("Step 6: Inserting profile data...");
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        school_id: schoolData.id,
        full_name: document.getElementById("adminFullName").value,
        nin: document.getElementById("nin").value,
        email: repEmail,
        role: document.getElementById("role").value,
        contact_1: document.getElementById("contact1").value,
        qualifications: document.getElementById("qualifications").value,
        profile_photo_url: profilePhotoUrl,
        documents_url: documentsUrl,
      });
      
      if (profileError) {
        console.error("Profile insert error:", profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }
      
      console.log("Profile data inserted successfully");

      // Success!
      console.log("Registration completed successfully!");
      ErrorHandler._showModal("Registration successful! Please check your email to confirm your account.", 'success');
      
      // Sign out if we have a session and redirect
      if (session) {
        await supabase.auth.signOut();
      }
      setTimeout(() => {
        window.location.href = "signin.html";
      }, 2000);
      
    } catch (error) {
      console.error("Registration Error:", error);
      
      let userMessage = "";
      if (error.message.includes("email") || error.message.includes("already")) {
        userMessage = error.message;
      } else if (error.message.includes("password")) {
        userMessage = "Please ensure your password is at least 8 characters long and includes numbers and special characters.";
      } else if (error.message.includes("upload") || error.message.includes("storage")) {
        userMessage = error.message;
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        userMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message.includes("timeout")) {
        userMessage = "The request timed out. Please try again.";
      } else if (error.message.includes("session")) {
        userMessage = error.message;
      } else {
        userMessage = "An error occurred during registration. Please try again or contact support if the problem persists.";
      }
      
      ErrorHandler._showModal(userMessage, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Registration";
    }
  });

  // --- INITIALIZE PAGE STATE ---
  updateProgressBar();
  checkFormValidity();
});