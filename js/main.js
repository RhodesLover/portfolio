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

    const interactiveEls = document.querySelectorAll('a, button, .project-card, .btn');
    interactiveEls.forEach(el => {
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
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- NAV SCROLL EFFECT ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 80);
    });
  }

  /* ---------- MOBILE MENU ---------- */
  const toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('nav--open');
      toggle.classList.toggle('active');
    });

    document.querySelectorAll('.nav__link').forEach(link => {
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

  /* ---------- HERO PARALLAX ---------- */
  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const bg = hero.querySelector('.hero__bg');
      if (bg) {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        bg.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  }

  /* ============================================================
     MODAL SYSTEM
     ============================================================ */
  const modal = document.getElementById('projectModal');

  if (modal) {
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalClose');
    const titleEl = document.getElementById('modalTitle');
    const catEl = document.getElementById('modalCategory');
    const descEl = document.getElementById('modalDescription');
    const gallery = document.getElementById('modalGallery');
    const actions = document.getElementById('modalActions');

    // Abrir modal
    function openModal(card) {
      titleEl.textContent = card.dataset.title || 'Proyecto';
      catEl.textContent = card.dataset.category || '';
      descEl.textContent = card.dataset.description || '';

      // Galería placeholder
      gallery.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.className = 'modal__gallery-item';
        item.textContent = i === 0 ? '📸 Imagen principal' : `📸 Imagen ${i + 1}`;
        gallery.appendChild(item);
      }

      // Botón Behance
      actions.innerHTML = '';
      if (card.dataset.behance) {
        const btn = document.createElement('a');
        btn.href = card.dataset.behance;
        btn.target = '_blank';
        btn.className = 'modal__behance-btn';
        btn.textContent = 'Ver completo en Behance →';
        actions.appendChild(btn);
      }

      modal.classList.add('modal--open');
      document.body.style.overflow = 'hidden';
    }

    // Cerrar modal
    function closeModal() {
      modal.classList.remove('modal--open');
      document.body.style.overflow = '';
    }

    // Event listeners
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('modal--open')) closeModal();
    });

    // Asignar click a cada card
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        openModal(this);
      });
    });

    // Hover glow en cards
    document.querySelectorAll('.project-card').forEach(card => {
      const media = card.querySelector('.project-card__media');
      if (!media) return;
      card.addEventListener('mouseenter', () => {
        media.style.boxShadow = '0 0 30px rgba(255,197,211,0.08)';
      });
      card.addEventListener('mouseleave', () => {
        media.style.boxShadow = 'none';
      });
    });
  }

  console.log('🐦 Portfolio ready.');
});
