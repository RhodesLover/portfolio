/* ============================================================
   TOMI ZÁRATE — PORTFOLIO JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Page open sequence
  const intro = document.getElementById('homeIntro');
  requestAnimationFrame(() => {
    document.body.classList.add('is-intro');
    document.body.classList.remove('is-loading');
  });
  // Locomotive-style reveals + hero ready
  const armReveals = () => {
    document.body.classList.add('home-ready');
    document.querySelectorAll('.loco-reveal, .loco-line').forEach((el, i) => {
      if (el.closest('.work-orbit')) return; // orbit.js owns these
      const delay = 80 + i * 90;
      setTimeout(() => el.classList.add('is-in'), delay);
    });
  };
  // stagger intro veil out then content in
  setTimeout(() => {
    document.body.classList.add('is-entered');
    if (intro) intro.classList.add('is-done');
    armReveals();
  }, 720);
  setTimeout(() => {
    if (intro) intro.setAttribute('aria-hidden', 'true');
  }, 1400);

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

  /* ---------- PHOTO TRAIL (larga exposición) ---------- */
  const trailCanvas = document.getElementById('trailCanvas');
  if (trailCanvas && window.CanvasRenderingContext2D) {
    const ctx = trailCanvas.getContext('2d');
    let prevX = 0, prevY = 0, hasPrev = false;
    let hot = false;

    function sizeTrail() {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
      ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    }
    sizeTrail();
    window.addEventListener('resize', sizeTrail);

    // Fade muy rápido: la estela se apaga en ~2 frames (sin dejar rastro visible)
    function fadeTrail() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(fadeTrail);
    }
    fadeTrail();

    document.addEventListener('mousemove', (e) => {
      const x = e.clientX, y = e.clientY;
      if (hasPrev) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Glow neón compartido (intensidad + halo)
        ctx.shadowColor = hot ? 'rgba(255,197,211,0.9)' : 'rgba(255,197,211,0.65)';
        ctx.shadowBlur = hot ? 22 : 14;
        // Estela principal (intensa, se apaga rápido)
        ctx.strokeStyle = hot ? 'rgba(255,210,220,0.85)' : 'rgba(255,197,211,0.55)';
        ctx.lineWidth = hot ? 3.2 : 2;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
        // Núcleo brillante (la "luz" más reciente) — neón
        ctx.fillStyle = hot ? 'rgba(255,235,240,1)' : 'rgba(255,220,228,0.9)';
        ctx.beginPath();
        ctx.arc(x, y, hot ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      prevX = x; prevY = y; hasPrev = true;
    });

    document.querySelectorAll('a, button, .project-card, .btn').forEach(el => {
      el.addEventListener('mouseenter', () => { hot = true; });
      el.addEventListener('mouseleave', () => { hot = false; });
    });
  }

  /* ---------- TILT 3D ---------- */
  // Las cards se inclinan sutilmente siguiendo el mouse (perspectiva suave)
  const tiltCards = document.querySelectorAll('.project-card--tilt');
  if (tiltCards.length && window.matchMedia('(hover: hover)').matches) {
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        const rx = -py * 7;   // grados
        const ry = px * 7;
        card.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- TITLE UNDERLINE ANIMADA ---------- */
  // Los títulos se subrayan de izq → der al entrar y la línea se 'cierra' (der → izq) al salir
  document.querySelectorAll('.anim-underline').forEach(el => {
    let closingTimer = null;
    el.addEventListener('mouseenter', () => {
      clearTimeout(closingTimer);
      el.classList.remove('is-closing');
      el.classList.add('is-underlined');
    });
    el.addEventListener('mouseleave', () => {
      el.classList.remove('is-underlined');
      el.classList.add('is-closing');
      // Al terminar la transición de cierre, limpiar la clase
      closingTimer = setTimeout(() => el.classList.remove('is-closing'), 550);
    });
  });

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
    const lightboxZoom = (typeof createMediaZoom === 'function') ? createMediaZoom({
      stage: document.getElementById('modalLightboxZoomStage'),
      target: lightboxImg,
      controls: document.getElementById('modalLightboxZoomControls'),
      levelEl: document.getElementById('modalLightboxZoomLevel')
    }) : null;
    
    // Project elements
    const projImg = document.getElementById('modalProjectImg');
    const projVideo = document.getElementById('modalProjectVideo');
    const projTitle = document.getElementById('modalProjectTitle');
    const projCat = document.getElementById('modalProjectCat');
    const projDesc = document.getElementById('modalProjectDesc');
    const projStory = document.getElementById('modalProjectStory');
    const projChallenge = document.getElementById('modalProjectChallenge');
    const projDecision = document.getElementById('modalProjectDecision');
    const projActions = document.getElementById('modalProjectActions');
    const projectZoom = (typeof createMediaZoom === 'function') ? createMediaZoom({
      stage: document.getElementById('modalProjectZoomStage'),
      target: projImg,
      controls: document.getElementById('modalProjectZoomControls'),
      levelEl: document.getElementById('modalProjectZoomLevel')
    }) : null;

    // Nav elements
    const navPrev = document.getElementById('modalPrev');
    const navNext = document.getElementById('modalNext');
    const relatedGrid = document.getElementById('modalRelatedGrid');

    // Estado de navegación: todas las cards + índice actual
    const allCards = Array.from(document.querySelectorAll('.project-card'));
    let currentIndex = -1;

    function getMediaSrc(card, forThumb = false) {
      const imgEl = card.querySelector('.project-card__img, .project-card__video, .spiral__media');
      if (!imgEl) return { src: '', isVideo: false };
      const src = imgEl.currentSrc || imgEl.src || imgEl.getAttribute('src') || '';
      if (imgEl.tagName === 'VIDEO') {
        // Para thumbnails siempre usar el poster (un <img> no renderiza un .mp4)
        const thumb = forThumb ? (imgEl.poster || '') : (src || imgEl.poster || '');
        return { src: thumb, isVideo: true };
      }
      return { src, isVideo: false };
    }

    function renderRelated(currentCard) {
      if (!relatedGrid) return;
      // Excluir el actual + proyectos de la MISMA categoría (no mezclar posters con proyectos)
      const currentCat = (currentCard.dataset.category || '').split('·')[0].trim();
      const others = allCards.filter(c => {
        if (c === currentCard) return false;
        const cat = (c.dataset.category || '').split('·')[0].trim();
        return cat !== currentCat;
      });
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
      projStory.hidden = true;
      projVideo.pause();
      projVideo.removeAttribute('src');
      projVideo.load();
      projImg.removeAttribute('src');
      if (lightboxZoom) lightboxZoom.reset();
      if (projectZoom) projectZoom.reset();

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
        if (lightboxZoom) lightboxZoom.setEnabled(!!mediaSrc);
        if (projectZoom) projectZoom.setEnabled(false);
      } else {
        // PROJECT mode: media left + description right + Behance
        modal.classList.add('modal--project');
        modalProject.style.display = 'grid';
        projTitle.textContent = title;
        projCat.textContent = category;
        projDesc.textContent = description;

        // Desafío → Decisión (si la card los define)
        const challenge = card.dataset.challenge || '';
        const decision = card.dataset.decision || '';
        if (challenge || decision) {
          projStory.hidden = false;
          projChallenge.textContent = challenge;
          projDecision.textContent = decision;
        } else {
          projStory.hidden = true;
        }
        
        if (isVideo && mediaSrc) {
          // Show video (or poster image) in the media panel
          projImg.style.display = 'none';
          projVideo.style.display = 'block';
          projVideo.src = mediaSrc;
          projVideo.play().catch(() => {});
          if (projectZoom) projectZoom.setEnabled(false);
        } else {
          projVideo.style.display = 'none';
          projImg.style.display = 'block';
          projImg.src = mediaSrc || '';
          projImg.alt = title;
          if (projectZoom) projectZoom.setEnabled(!!mediaSrc);
        }
        if (lightboxZoom) lightboxZoom.setEnabled(false);
        
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
      document.body.classList.add('modal-open');
      // Bloqueo de scroll robusto: html + body + guardar posición para restaurarla
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('modal--open', 'modal--lightbox', 'modal--project');
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      projVideo.pause();
      projVideo.removeAttribute('src');
      projVideo.load();
      projImg.removeAttribute('src');
      lightboxImg.removeAttribute('src');
      if (lightboxZoom) lightboxZoom.setEnabled(false);
      if (projectZoom) projectZoom.setEnabled(false);
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

    // Hover glow (legacy grid media; spiral uses frame glow via CSS)
    document.querySelectorAll('.project-card').forEach(card => {
      const media = card.querySelector('.project-card__media, .spiral__frame');
      if (!media) return;
      card.addEventListener('mouseenter', () => {
        media.style.boxShadow = '0 20px 60px rgba(255,197,211,0.08)';
      });
      card.addEventListener('mouseleave', () => {
        media.style.boxShadow = '';
      });
    });
  }

  console.log('🐦 Portfolio ready — orbit home.');
});
