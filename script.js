document.addEventListener("DOMContentLoaded", () => {
  // ======== STICKY NAVBAR & SCROLL EFFECT ========
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  }

  // ======== MOBILE SIDE DRAWER ========
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const backdrop = document.querySelector(".nav-backdrop");

  function openMenu() {
    navMenu.classList.add("active");
    hamburger.classList.add("is-active");
    hamburger.setAttribute("aria-expanded", "true");
    if (backdrop) backdrop.classList.add("active");
    document.documentElement.classList.add("menu-open");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    navMenu.classList.remove("active");
    hamburger.classList.remove("is-active");
    hamburger.setAttribute("aria-expanded", "false");
    if (backdrop) backdrop.classList.remove("active");
    document.documentElement.classList.remove("menu-open");
    document.body.classList.remove("menu-open");
    document.querySelectorAll(".dropdown.open").forEach(d => d.classList.remove("open"));
  }

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.contains("active") ? closeMenu() : openMenu();
    });

    if (backdrop) backdrop.addEventListener("click", closeMenu);

    navMenu.querySelectorAll("a:not(.dropdown-toggle)").forEach(link => {
      link.addEventListener("click", e => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          closeMenu();
          setTimeout(() => {
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: "smooth" });
          }, 50);
        } else {
          closeMenu();
        }
      });
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && navMenu.classList.contains("active")) closeMenu();
    });
  }

  // ======== DROPDOWN TOGGLE (mobile + desktop) ========
  const dropdowns = document.querySelectorAll(".dropdown");
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector(".dropdown-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function(e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const isOpen = dropdown.classList.contains("open");
        // Close all others
        dropdowns.forEach(d => { if (d !== dropdown) d.classList.remove("open"); });
        dropdown.classList.toggle("open", !isOpen);
        toggle.setAttribute("aria-expanded", !isOpen);
      }
    });
  });

  // Close desktop dropdown on outside click
  document.addEventListener("click", e => {
    if (window.innerWidth > 768) {
      dropdowns.forEach(d => {
        if (!d.contains(e.target)) d.classList.remove("open");
      });
    }
  });
  const revealElements = document.querySelectorAll(".reveal");
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealElements.forEach((el) => {
      revealObserver.observe(el);
    });
  }

  // ======== ANIMATED COUNTERS ========
  const statsSection = document.querySelector(".stats");
  if (statsSection) {
    const counters = document.querySelectorAll(".counter");
    let hasAnimated = false;

    const countUp = () => {
      counters.forEach((counter) => {
        const target = +counter.getAttribute("data-target");
        const duration = 2000; // 2 seconds
        let current = 0;
        const increment = target / (duration / 10);

        const updateCount = () => {
          current += increment;
          if (current < target) {
            counter.innerText = Math.ceil(current);
            setTimeout(updateCount, 10);
          } else {
            counter.innerText = target;
          }
        };
        updateCount();
      });
      hasAnimated = true;
    };

    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            countUp();
          }
        });
      },
      { threshold: 0.5 }
    );

    statsObserver.observe(statsSection);
  }

  // ======== GALLERY LIGHTBOX ========
  const lightbox = document.getElementById("lightbox");
  const galleryItems = document.querySelectorAll(".gallery-item");

  if (lightbox && galleryItems.length > 0) {
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector(".lightbox-close");

    galleryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const imgSrc = item.querySelector("img").src;
        lightboxImg.src = imgSrc;
        lightbox.classList.add("active");
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove("active");
    };

    if (closeBtn) {
      closeBtn.addEventListener("click", closeLightbox);
    }

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

});