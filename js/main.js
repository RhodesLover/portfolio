/* ============================================================
   TOMI ZÁRATE — PORTFOLIO JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- CURSOR ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  if (dot && ring) {
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });

    function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(animRing);
    }
    animRing();

    document.querySelectorAll('a, button, .project-card, .btn').forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.style.width = '16px'; dot.style.height = '16px';
        ring.style.width = '60px'; ring.style.height = '60px';
        ring.style.borderColor = 'rgba(255, 197, 211, 0.6)';
        ring.style.backgroundColor = 'rgba(255, 197, 211, 0.05)';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.width = '8px'; dot.style.height = '8px';
        ring.style.width = '40px'; ring.style.height = '40px';
        ring.style.borderColor = 'rgba(255, 197, 211, 0.4)';
        ring.style.backgroundColor = 'transparent';
      });
    });
  }

  /* ---------- SCROLL REVEAL (sections) ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- PROJECT CARD REVEAL (staggered) ---------- */
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.project-card').forEach(el => cardObserver.observe(el));

  /* ---------- NAV SCROLL ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle('nav--scrolled', window.scrollY > 80);
          ticking = false;
        });
        ticking = true;
      }
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
        bg.style.transform = `translate(${(e.clientX / window.innerWidth - 0.5) * 20}px, ${(e.clientY / window.innerHeight - 0.5) * 20}px)`;
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

    function openModal(card) {
      titleEl.textContent = card.dataset.title || 'Proyecto';
      catEl.textContent = card.dataset.category || '';
      descEl.textContent = card.dataset.description || '';

      gallery.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.className = 'modal__gallery-item';
        item.textContent = i === 0 ? '📸 Imagen principal' : `📸 Imagen ${i + 1}`;
        gallery.appendChild(item);
      }

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

    function closeModal() {
      modal.classList.remove('modal--open');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('modal--open')) closeModal();
    });

    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        openModal(this);
      });
    });

    // Hover glow
    document.querySelectorAll('.project-card').forEach(card => {
      const media = card.querySelector('.project-card__media');
      if (!media) return;
      card.addEventListener('mouseenter', () => {
        media.style.boxShadow = '0 20px 60px rgba(255,197,211,0.08)';
      });
      card.addEventListener('mouseleave', () => {
        media.style.boxShadow = 'none';
      });
    });
  }

  console.log('🐦 Portfolio ready.');
});
