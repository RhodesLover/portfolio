/* ============================================================
   TOMI ZÁRATE — PORTFOLIO JS
   Cursor, Scroll Reveal, Nav, Mobile Menu
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- CUSTOM CURSOR ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  if (dot && ring) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Cursor hover effect on interactive elements
    const links = document.querySelectorAll('a, button, .project-card');
    links.forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.style.width = '16px';
        dot.style.height = '16px';
        ring.style.width = '60px';
        ring.style.height = '60px';
        ring.style.borderColor = 'rgba(255, 197, 211, 0.6)';
        ring.style.backgroundColor = 'rgba(255, 197, 211, 0.05)';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.width = '8px';
        dot.style.height = '8px';
        ring.style.width = '40px';
        ring.style.height = '40px';
        ring.style.borderColor = 'rgba(255, 197, 211, 0.4)';
        ring.style.backgroundColor = 'transparent';
      });
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Don't unobserve so they can re-trigger if needed
        // but for this use case, once is fine
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ---------- NAV SCROLL EFFECT ---------- */
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  });

  /* ---------- MOBILE MENU ---------- */
  const toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('nav--open');
      toggle.classList.toggle('active');
    });

    // Close menu on link click
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        toggle.classList.remove('active');
      });
    });
  }

  /* ---------- SMOOTH ANCHOR SCROLL (fallback) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- PARALLAX DOT GRID (subtle background effect) ---------- */
  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      const bg = hero.querySelector('.hero__bg');
      if (bg) {
        bg.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  }

  /* ---------- PROJECT CARDS: random hover colors ---------- */
  // Optional: subtle variation for each card's border on hover
  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    const media = card.querySelector('.project-card__media');
    if (!media) return;
    card.addEventListener('mouseenter', () => {
      // Subtle pink glow
      media.style.boxShadow = '0 0 30px rgba(255,197,211,0.08)';
    });
    card.addEventListener('mouseleave', () => {
      media.style.boxShadow = 'none';
    });
  });

  console.log('🐦 Heru is watching — Portfolio ready.');
});
