/* ============================================================
   TOMI ZÁRATE — PORTFOLIO JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- CURSOR ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const trail = document.getElementById('lightTrail');

  if (dot && ring) {
    let mx = 0, my = 0, rx = 0, ry = 0, tx = 0, ty = 0;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
      if (!document.body.classList.contains('trail-active')) {
        document.body.classList.add('trail-active');
      }
    });

    function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';

      // Light trail: lerp más lento → estela de luz que sigue al cursor
      if (trail) {
        tx += (mx - tx) * 0.06;
        ty += (my - ty) * 0.06;
        trail.style.left = tx + 'px';
        trail.style.top = ty + 'px';
      }
      requestAnimationFrame(animRing);
    }
    animRing();

    document.querySelectorAll('a, button, .project-card, .btn').forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.style.width = '16px'; dot.style.height = '16px';
        ring.style.width = '60px'; ring.style.height = '60px';
        ring.style.borderColor = 'rgba(255, 197, 211, 0.6)';
        ring.style.backgroundColor = 'rgba(255, 197, 211, 0.05)';
        if (trail) trail.classList.add('light-trail--hot');
      });
      el.addEventListener('mouseleave', () => {
        dot.style.width = '8px'; dot.style.height = '8px';
        ring.style.width = '40px'; ring.style.height = '40px';
        ring.style.borderColor = 'rgba(255, 197, 211, 0.4)';
        ring.style.backgroundColor = 'transparent';
        if (trail) trail.classList.remove('light-trail--hot');
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

  /* ---------- ANIMATED TITLES (staggered) ---------- */
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, i * 100);
        titleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.anim-title').forEach(el => titleObserver.observe(el));

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

  /* ---------- VIDEO HOVER PLAY ---------- */
  document.querySelectorAll('.project-card video').forEach(video => {
    const card = video.closest('.project-card');
    if (!card) return;
    card.addEventListener('mouseenter', () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });

  /* ============================================================
     MODAL SYSTEM
     ============================================================ */
  const modal = document.getElementById('projectModal');

  if (modal) {
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalClose');
    const modalLightbox = document.getElementById('modalLightbox');
    const modalProject = document.getElementById('modalProject');
    
    // Lightbox elements
    const lightboxImg = document.getElementById('modalLightboxImg');
    const lightboxTitle = document.getElementById('modalLightboxTitle');
    
    // Project elements
    const projImg = document.getElementById('modalProjectImg');
    const projVideo = document.getElementById('modalProjectVideo');
    const projTitle = document.getElementById('modalProjectTitle');
    const projCat = document.getElementById('modalProjectCat');
    const projDesc = document.getElementById('modalProjectDesc');
    const projActions = document.getElementById('modalProjectActions');

    // Nav elements
    const navPrev = document.getElementById('modalPrev');
    const navNext = document.getElementById('modalNext');
    const relatedGrid = document.getElementById('modalRelatedGrid');

    // Estado de navegación: todas las cards + índice actual
    const allCards = Array.from(document.querySelectorAll('.project-card'));
    let currentIndex = -1;

    function getMediaSrc(card, forThumb = false) {
      const imgEl = card.querySelector('.project-card__img, .project-card__video');
      if (!imgEl) return { src: '', isVideo: false };
      const src = imgEl.src || '';
      if (imgEl.tagName === 'VIDEO') {
        // Para thumbnails siempre usar el poster (un <img> no renderiza un .mp4)
        const thumb = forThumb ? (imgEl.poster || '') : (src || imgEl.poster || '');
        return { src: thumb, isVideo: true };
      }
      return { src, isVideo: false };
    }

    function renderRelated(currentCard) {
      if (!relatedGrid) return;
      const others = allCards.filter(c => c !== currentCard);
      // Mezclar y tomar hasta 4
      const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 4);
      relatedGrid.innerHTML = '';
      shuffled.forEach(card => {
        const media = getMediaSrc(card, true);
        const item = document.createElement('div');
        item.className = 'modal__related-card';
        const img = document.createElement('img');
        img.src = media.src || '';
        img.alt = card.dataset.title || '';
        img.loading = 'lazy';
        // Si no hay poster para un video, mostrar un placeholder con la inicial
        if (!media.src && media.isVideo) {
          img.style.display = 'none';
          item.style.background = 'rgba(255,197,211,0.06)';
          const ph = document.createElement('span');
          ph.className = 'modal__related-card__ph';
          ph.textContent = '▶';
          item.appendChild(ph);
        }
        item.appendChild(img);
        const label = document.createElement('span');
        label.className = 'modal__related-card__label';
        label.textContent = card.dataset.title || '';
        item.appendChild(label);
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          openModal(card);
        });
        relatedGrid.appendChild(item);
      });
    }

    function updateNav() {
      if (navPrev) navPrev.disabled = currentIndex <= 0;
      if (navNext) navNext.disabled = currentIndex >= allCards.length - 1;
    }

    function openModal(card) {
      const title = card.dataset.title || 'Proyecto';
      const category = card.dataset.category || '';
      const description = card.dataset.description || '';
      const behance = card.dataset.behance || '';
      const modalType = card.dataset.modal || 'project'; // 'lightbox' or 'project'
      
      currentIndex = allCards.indexOf(card);
      updateNav();
      renderRelated(card);

      // Get the media source from the card (image or video)
      const { src: mediaSrc, isVideo } = getMediaSrc(card);
      
      // Reset previous modal state
      modal.classList.remove('modal--lightbox', 'modal--project');
      projVideo.pause();
      projVideo.removeAttribute('src');
      projVideo.load();
      projImg.removeAttribute('src');

      // Control de visibilidad inline (inmune a CSS cacheado viejo)
      modalProject.style.display = 'none';
      modalLightbox.style.display = 'none';

      if (modalType === 'lightbox') {
        // LIGHTBOX mode: image + title + X
        modal.classList.add('modal--lightbox');
        modalLightbox.style.display = 'flex';
        lightboxImg.src = mediaSrc || '';
        lightboxImg.alt = title;
        lightboxTitle.textContent = title;
      } else {
        // PROJECT mode: media left + description right + Behance
        modal.classList.add('modal--project');
        modalProject.style.display = 'grid';
        projTitle.textContent = title;
        projCat.textContent = category;
        projDesc.textContent = description;
        
        if (isVideo && mediaSrc) {
          // Show video (or poster image) in the media panel
          projImg.style.display = 'none';
          projVideo.style.display = 'block';
          projVideo.src = mediaSrc;
          projVideo.play().catch(() => {});
        } else {
          projVideo.style.display = 'none';
          projImg.style.display = 'block';
          projImg.src = mediaSrc || '';
          projImg.alt = title;
        }
        
        projActions.innerHTML = '';
        if (behance) {
          const btn = document.createElement('a');
          btn.href = behance;
          btn.target = '_blank';
          btn.className = 'modal__behance-btn';
          btn.textContent = 'Ver más →';
          projActions.appendChild(btn);
        }
      }

      modal.classList.add('modal--open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('modal--open', 'modal--lightbox', 'modal--project');
      document.body.style.overflow = '';
      projVideo.pause();
      projVideo.removeAttribute('src');
      projVideo.load();
      projImg.removeAttribute('src');
      lightboxImg.removeAttribute('src');
      modalProject.style.display = '';
      modalLightbox.style.display = '';
    }

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('modal--open')) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'ArrowLeft') { navigate(-1); }
      if (e.key === 'ArrowRight') { navigate(1); }
    });

    function navigate(dir) {
      if (currentIndex < 0) return;
      const next = currentIndex + dir;
      if (next < 0 || next >= allCards.length) return;
      openModal(allCards[next]);
    }

    if (navPrev) navPrev.addEventListener('click', () => navigate(-1));
    if (navNext) navNext.addEventListener('click', () => navigate(1));

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
