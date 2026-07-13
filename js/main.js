/* ============================================================
   TOMI ZÁRATE — PORTFOLIO JS
   Cursor, Scroll Reveal, Nav, Modal, Project System
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

    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        toggle.classList.remove('active');
      });
    });
  }

  /* ---------- SMOOTH ANCHOR SCROLL ---------- */
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

  /* ---------- PARALLAX HERO ---------- */
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

  /* ---------- CARD HOVER GLOW ---------- */
  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    const media = card.querySelector('.project-card__media');
    if (!media) return;
    card.addEventListener('mouseenter', () => {
      media.style.boxShadow = '0 0 30px rgba(255,197,211,0.08)';
    });
    card.addEventListener('mouseleave', () => {
      media.style.boxShadow = 'none';
    });
  });

  /* ============================================================
     MODAL SYSTEM (index.html only)
     ============================================================ */
  const modal = document.getElementById('projectModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalDescription = document.getElementById('modalDescription');
  const modalGallery = document.getElementById('modalGallery');
  const modalActions = document.getElementById('modalActions');

  // Only init modal if elements exist (they're only in index.html)
  if (modal && modalClose && modalBackdrop) {

    // Open modal
    function openModal(card) {
      const title = card.dataset.title || 'Proyecto';
      const category = card.dataset.category || '';
      const description = card.dataset.description || '';
      const behance = card.dataset.behance || '';

      modalTitle.textContent = title;
      modalCategory.textContent = category;
      modalDescription.textContent = description;

      // Build gallery
      modalGallery.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.className = 'modal__gallery-item';
        item.textContent = i === 0 ? '📸 Imagen principal' : `📸 Imagen ${i + 1}`;
        modalGallery.appendChild(item);
      }

      // Build actions
      modalActions.innerHTML = '';
      if (behance) {
        const btn = document.createElement('a');
        btn.href = behance;
        btn.target = '_blank';
        btn.className = 'modal__behance-btn';
        btn.textContent = 'Ver completo en Behance →';
        modalActions.appendChild(btn);
      }

      // Show modal
      modal.classList.add('modal--open');
      document.body.style.overflow = 'hidden';

      // Disable custom cursor inside modal
      if (dot) dot.style.display = 'none';
      if (ring) ring.style.display = 'none';
    }

    // Close modal
    function closeModal() {
      modal.classList.remove('modal--open');
      document.body.style.overflow = '';
      if (dot) dot.style.display = '';
      if (ring) ring.style.display = '';
    }

    // Close on backdrop click
    modalBackdrop.addEventListener('click', closeModal);
    // Close on X button
    modalClose.addEventListener('click', closeModal);
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
        closeModal();
      }
    });

    // Click on project cards to open modal
    cards.forEach(card => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        openModal(this);
      });
    });
  }

  console.log('🐦 Heru is watching — Portfolio ready.');
});
