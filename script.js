/* ============================================================================
   CleanTrack — script.js (Enhanced)
   ============================================================================
   Handles:
   01. Preloader hide with smooth fade
   02. Scroll reveal with stagger support
   03. Custom cursor follower + glow
   04. Hover tilt effect with spring animation
   05. KPI bar animations on scroll
   ============================================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* 01. Preloader ----------------------------------------------------------- */
  const preloader = document.getElementById("ct-preloader");
  if (preloader) {
    // Hide on window load
    window.addEventListener("load", () => {
      preloader.classList.add("fade-out");
      setTimeout(() => {
        if (document.body.contains(preloader)) preloader.remove();
      }, 1200);
    });
    // Fallback: always hide after 4s
    setTimeout(() => {
      if (document.body.contains(preloader)) {
        preloader.classList.add("fade-out");
        setTimeout(() => {
          if (document.body.contains(preloader)) preloader.remove();
        }, 1200);
      }
    }, 4000);
  }

  /* 02. Scroll Reveal ------------------------------------------------------- */
  const reveals = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right, .reveal-zoom, .stagger"
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target;

            // stagger support
            if (target.classList.contains("stagger")) {
              [...target.children].forEach((child, i) => {
                setTimeout(() => {
                  child.classList.add("is-visible");
                }, i * 120);
              });
            } else {
              target.classList.add("is-visible");
            }

            // activate KPI bars
            if (target.classList.contains("kpi-bar")) {
              target.classList.add("active");
            }

            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.2 }
    );

    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }
  /* 03. Custom Cursor Follower + Glow -------------------------------------- */
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorOutline = document.querySelector(".cursor-dot-outline");
  let mouseX = 0,
    mouseY = 0,
    outlineX = 0,
    outlineY = 0;

  if (cursorDot && cursorOutline) {
    document.body.classList.add("ct-cursor-active");

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    // smooth trailing outline
    function animateCursor() {
      outlineX += (mouseX - outlineX) * 0.12;
      outlineY += (mouseY - outlineY) * 0.12;
      cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // interactive scaling
    const interactive = "a, button, .btn, .hover-lift, .hover-tilt";
    document.querySelectorAll(interactive).forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursorDot.style.transform += " scale(1.6)";
        cursorOutline.style.transform += " scale(1.8)";
        cursorOutline.style.borderColor = "rgba(30,136,229,0.6)";
      });
      el.addEventListener("mouseleave", () => {
        cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(1)`;
        cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px) scale(1)`;
        cursorOutline.style.borderColor = "rgba(0,191,166,0.5)";
      });
    });
  }
  /* Login button */
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    let preloader = document.getElementById("ct-preloader");

    // If preloader was removed after initial load → rebuild it
    if (!preloader) {
      preloader = document.createElement("div");
      preloader.id = "ct-preloader";
      preloader.innerHTML = `
        <div class="logo-mark">
          <video autoplay muted loop playsinline class="logo-video">
            <source src="assets/CleanTrackLogoAnimation.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>`;
      document.body.appendChild(preloader);
    } else {
      preloader.style.display = "flex";
      preloader.classList.remove("fade-out"); // ensure it’s visible
    }

    // Wait for animation, then redirect
    setTimeout(() => {
      window.location.href = "login.html";  // must exist in same folder
    }, 1200); // match your fade duration
  });
}


  /* 04. Hover Tilt Effect --------------------------------------------------- */
  const tiltCards = document.querySelectorAll(".hover-tilt");
  tiltCards.forEach((card) => {
    const tiltEl = card.querySelector(".tilt") || card;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * 14; // stronger tilt
      const rotateY = ((x / rect.width) - 0.5) * -14;
      tiltEl.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener("mouseleave", () => {
      tiltEl.style.transition = "transform 0.6s cubic-bezier(.22,1,.36,1)";
      tiltEl.style.transform = "rotateX(0) rotateY(0) scale(1)";
      setTimeout(() => {
        tiltEl.style.transition = "";
      }, 600);
    });
  });

  /* 05. KPI Bar Animations -------------------------------------------------- */
  const kpiBars = document.querySelectorAll(".kpi-bar");
  kpiBars.forEach((bar) => {
    const fill = bar.querySelector("span");
    if (!fill) return;

    if ("IntersectionObserver" in window) {
      const barObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              bar.classList.add("active");
              barObs.unobserve(bar);
            }
          });
        },
        { threshold: 0.4 }
      );
      barObs.observe(bar);
    } else {
      bar.classList.add("active");
    }
  });

  /* Debug Fallback --------------------------------------------------------- */
  console.log("✅ CleanTrack script loaded and running");
});
