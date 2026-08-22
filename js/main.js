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

  /* ---------- GIF HOVER (Mercado Montañés only via class) ---------- */
  document.querySelectorAll('.project-card__img--gif-hover').forEach((img) => {
    const still = img.getAttribute('data-still') || img.getAttribute('src');
    const gif = img.getAttribute('data-gif');
    if (!gif) return;
    const card = img.closest('.project-card');
    if (!card) return;
    const showGif = () => {
      // restart gif by cache-busting query on each enter
      const join = gif.indexOf('?') >= 0 ? '&' : '?';
      img.src = gif + join + 't=' + Date.now();
    };
    const showStill = () => {
      img.src = still;
    };
    card.addEventListener('mouseenter', showGif);
    card.addEventListener('mouseleave', showStill);
    card.addEventListener('focusin', showGif);
    card.addEventListener('focusout', (e) => {
      if (!card.contains(e.relatedTarget)) showStill();
    });
  });

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
    const lightboxStage = document.getElementById('modalLightboxZoomStage');
    const projectStage = document.getElementById('modalProjectZoomStage');

    function fitModalStage(stage, el) {
      if (!stage || !el) return;
      var w = 0, h = 0;
      if (el.tagName === 'VIDEO') {
        w = el.videoWidth || 0;
        h = el.videoHeight || 0;
      } else {
        w = el.naturalWidth || 0;
        h = el.naturalHeight || 0;
      }
      if (w > 0 && h > 0) {
        stage.style.setProperty('--media-ar', String(w / h));
        stage.classList.add('is-fitted');
      } else {
        stage.style.removeProperty('--media-ar');
        stage.classList.remove('is-fitted');
      }
    }
    function clearModalStages() {
      [lightboxStage, projectStage].forEach(function (st) {
        if (!st) return;
        st.style.removeProperty('--media-ar');
        st.classList.remove('is-fitted', 'is-video-fill');
        st.style.aspectRatio = '';
      });
    }

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
      if (typeof clearModalStages === 'function') clearModalStages();

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
        var onLb = function () {
          fitModalStage(lightboxStage, lightboxImg);
          lightboxImg.removeEventListener('load', onLb);
        };
        lightboxImg.addEventListener('load', onLb);
        if (lightboxImg.complete && lightboxImg.naturalWidth) fitModalStage(lightboxStage, lightboxImg);
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
          // Show video completo (sin crop) en el panel media
          projImg.style.display = 'none';
          projVideo.style.display = 'block';
          projVideo.src = mediaSrc;
          var onVm = function () {
            fitModalStage(projectStage, projVideo);
            projVideo.removeEventListener('loadedmetadata', onVm);
          };
          projVideo.addEventListener('loadedmetadata', onVm);
          if (projVideo.readyState >= 1) fitModalStage(projectStage, projVideo);
          projVideo.play().catch(() => {});
          if (projectZoom) projectZoom.setEnabled(false);
        } else {
          projVideo.style.display = 'none';
          projImg.style.display = 'block';
          projImg.src = mediaSrc || '';
          projImg.alt = title;
          var onPi = function () {
            fitModalStage(projectStage, projImg);
            projImg.removeEventListener('load', onPi);
          };
          projImg.addEventListener('load', onPi);
          if (projImg.complete && projImg.naturalWidth) fitModalStage(projectStage, projImg);
          if (projectZoom) projectZoom.setEnabled(!!mediaSrc);
        }
        if (lightboxZoom) lightboxZoom.setEnabled(false);
        
        projActions.innerHTML = '';
        const isSocial = (category || '').indexOf('Social') === 0;
        const figmaProto = card.dataset.figmaProto || '';
        const cartaDir = card.dataset.carta || '';
        const cartaPages = card.dataset.cartaPages || '';
        const manualDir = card.dataset.manual || '';
        const manualPages = card.dataset.manualPages || '';
        if (isSocial) {
          // Redes → botón "Ver Instagram" (abre prototipo Figma si data-figma-proto)
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'modal__behance-btn modal__behance-btn--insta';
          btn.textContent = 'Ver Instagram →';
          if (figmaProto && typeof window.openFigmaProto === 'function') {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.openFigmaProto(figmaProto, title);
            });
          } else if (figmaProto) {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              window.open(figmaProto, '_blank', 'noopener');
            });
          } else {
            btn.disabled = true;
            btn.title = 'Prototipo próximamente';
            btn.setAttribute('aria-disabled', 'true');
          }
          projActions.appendChild(btn);
        } else if (manualDir && typeof window.openBrandManual === 'function') {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'modal__behance-btn';
          btn.textContent = 'Ver manual de marca →';
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.openBrandManual(manualDir, title || 'Manual de marca', manualPages);
          });
          projActions.appendChild(btn);
        } else if (cartaDir && typeof window.openCartaRevista === 'function') {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'modal__behance-btn';
          btn.textContent = 'Diseño de carta →';
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.openCartaRevista(cartaDir, title || 'Diseño de carta', cartaPages);
          });
          projActions.appendChild(btn);
        } else if (behance) {
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
      if (typeof clearModalStages === 'function') clearModalStages();
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
        // Posters/Ilustraciones (lightbox) → modal; Redes/Branding/Proyectos → viewer galería
        if (this.dataset.modal === 'lightbox') {
          openModal(this);
        } else if (window.__openHomeViewer) {
          window.__openHomeViewer(this);
        } else {
          openModal(this);
        }
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

/* ============================================================
   MARQUEE — loop infinito quirúrgico
   Clona el set base en 2 mitades idénticas, cada una más ancha
   que el viewport, para que translateX(-50%) reinicie sin corte.
   ============================================================ */
(function () {
  'use strict';
  const track = document.getElementById('marqueeTrack');
  if (!track) return;

  const base = Array.from(track.children).map((el) => el.cloneNode(true));

  function build() {
    // medir el ancho de UN set (los ítems base) fuera del flujo
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;width:max-content;display:flex;white-space:nowrap;';
    base.forEach((el) => probe.appendChild(el.cloneNode(true)));
    document.body.appendChild(probe);
    const setWidth = probe.scrollWidth || 1;
    probe.remove();

    const viewport = window.innerWidth || 1;
    // sets por mitad: al menos 1, y suficientes para cubrir el viewport
    const perHalf = Math.max(1, Math.ceil(viewport / setWidth));
    const copies = perHalf * 2; // dos mitades idénticas

    track.innerHTML = '';
    for (let i = 0; i < copies; i++) {
      base.forEach((el) => track.appendChild(el.cloneNode(true)));
    }
  }

  build();
  window.addEventListener('resize', build);
})();

/* ============================================================
   HOME VIEWER — viewer estilo galería (Redes / Branding / Proyectos)
   Posters/Ilustraciones siguen con el modal lightbox.
   ============================================================ */
(function () {
  'use strict';
  const viewer = document.getElementById('pgViewer');
  if (!viewer) return;

  const backdrop = document.getElementById('pgViewerBackdrop');
  const closeBtn = document.getElementById('pgViewerClose');
  const prevBtn = document.getElementById('pgViewerPrev');
  const nextBtn = document.getElementById('pgViewerNext');
  const vImg = document.getElementById('pgViewerImg');
  const vVideo = document.getElementById('pgViewerVideo');
  const vTitle = document.getElementById('pgViewerTitle');
  const vCat = document.getElementById('pgViewerCat');
  const vDesc = document.getElementById('pgViewerDesc');
  const vIdx = document.getElementById('pgViewerIdx');
  const vActions = document.getElementById('pgViewerActions');
  const zoomStage = document.getElementById('pgZoomStage');

  const mediaZoom = (typeof createMediaZoom === 'function') ? createMediaZoom({
    stage: zoomStage,
    target: vImg,
    controls: document.getElementById('pgZoomControls'),
    levelEl: document.getElementById('pgZoomLevel')
  }) : null;

  // solo las cards que NO son lightbox (Redes / Branding / Proyectos)
  const viewerCards = Array.from(document.querySelectorAll('.project-card'))
    .filter((c) => c.dataset.modal !== 'lightbox');
  let currentIndex = -1;

  function getCardMedia(card) {
    const vid = card.querySelector('.project-card__video');
    if (vid) {
      return { type: 'video', media: vid.getAttribute('src') || vid.currentSrc || '', poster: vid.getAttribute('poster') || '' };
    }
    const img = card.querySelector('.project-card__img');
    return { type: 'image', media: img ? (img.getAttribute('src') || '') : '', poster: '' };
  }

  function setVideoFill(on) {
    // deprecado: nunca crop. se mantiene por compat pero no activa cover.
    if (zoomStage) zoomStage.classList.remove('is-video-fill');
  }

  function fitStageToMedia(el) {
    if (!zoomStage || !el) return;
    var w = 0, h = 0;
    if (el.tagName === 'VIDEO') {
      w = el.videoWidth || 0;
      h = el.videoHeight || 0;
    } else {
      w = el.naturalWidth || 0;
      h = el.naturalHeight || 0;
    }
    if (w > 0 && h > 0) {
      var ar = w / h;
      zoomStage.style.setProperty('--media-ar', String(ar));
      zoomStage.classList.add('is-fitted');
    } else {
      zoomStage.style.removeProperty('--media-ar');
      zoomStage.classList.remove('is-fitted');
    }
  }

  function clearViewerMedia() {
    vVideo.pause();
    vVideo.removeAttribute('src');
    vVideo.load();
    vVideo.style.display = 'none';
    vImg.removeAttribute('src');
    vImg.style.display = 'none';
    if (mediaZoom) mediaZoom.setEnabled(false);
    setVideoFill(false);
    if (zoomStage) {
      zoomStage.style.aspectRatio = '';
      zoomStage.style.removeProperty('--media-ar');
      zoomStage.classList.remove('is-fitted', 'is-video-fill');
    }
  }

  function openViewer(card) {
    if (!viewer || !card) return;
    currentIndex = viewerCards.indexOf(card);
    if (currentIndex < 0) return;

    const title = card.dataset.title || '';
    const category = card.dataset.category || '';
    const desc = card.dataset.description || '';
    const behance = card.dataset.behance || '';
    const media = getCardMedia(card);

    clearViewerMedia();

    if (media.type === 'video' && media.media) {
      vVideo.style.display = 'block';
      if (media.poster) vVideo.poster = media.poster;
      vVideo.src = media.media;
      var onMeta = function () {
        fitStageToMedia(vVideo);
        vVideo.removeEventListener('loadedmetadata', onMeta);
      };
      vVideo.addEventListener('loadedmetadata', onMeta);
      if (vVideo.readyState >= 1) fitStageToMedia(vVideo);
      vVideo.play().catch(function () {});
      setVideoFill(false);
      if (mediaZoom) mediaZoom.setEnabled(false);
    } else {
      vImg.style.display = 'block';
      vImg.src = media.media;
      vImg.alt = title;
      var onLoad = function () {
        fitStageToMedia(vImg);
        vImg.removeEventListener('load', onLoad);
      };
      vImg.addEventListener('load', onLoad);
      if (vImg.complete && vImg.naturalWidth) fitStageToMedia(vImg);
      setVideoFill(false);
      if (mediaZoom) mediaZoom.setEnabled(!!media.media);
    }

    vTitle.textContent = title;
    vCat.textContent = category;
    vDesc.textContent = desc;
    vIdx.textContent = String(currentIndex + 1).padStart(2, '0');

    vActions.innerHTML = '';
    const isSocial = (category || '').indexOf('Social') === 0;
    const figmaProto = card.dataset.figmaProto || '';
    const cartaDir = card.dataset.carta || '';
    const cartaPages = card.dataset.cartaPages || '';
    const manualDir = card.dataset.manual || '';
    const manualPages = card.dataset.manualPages || '';
    if (isSocial) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pg-viewer__link';
      b.textContent = 'Ver Instagram →';
      if (figmaProto && typeof window.openFigmaProto === 'function') {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.openFigmaProto(figmaProto, title);
        });
      } else if (figmaProto) {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(figmaProto, '_blank', 'noopener');
        });
      } else {
        b.disabled = true;
        b.title = 'Prototipo próximamente';
        b.setAttribute('aria-disabled', 'true');
      }
      vActions.appendChild(b);
    } else if (manualDir && typeof window.openBrandManual === 'function') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pg-viewer__link';
      b.textContent = 'Ver manual de marca →';
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openBrandManual(manualDir, title || 'Manual de marca', manualPages);
      });
      vActions.appendChild(b);
    } else if (cartaDir && typeof window.openCartaRevista === 'function') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pg-viewer__link';
      b.textContent = 'Diseño de carta →';
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openCartaRevista(cartaDir, title || 'Diseño de carta', cartaPages);
      });
      vActions.appendChild(b);
    } else if (behance) {
      const a = document.createElement('a');
      a.href = behance;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'pg-viewer__link';
      a.textContent = 'Ver en Behance →';
      vActions.appendChild(a);
    }

    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= viewerCards.length - 1;

    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pg-viewer-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function closeViewer() {
    if (!viewer) return;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pg-viewer-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    clearViewerMedia();
  }

  function navigate(dir) {
    if (currentIndex < 0) return;
    const next = currentIndex + dir;
    if (next < 0 || next >= viewerCards.length) return;
    openViewer(viewerCards[next]);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeViewer);
  if (backdrop) backdrop.addEventListener('click', closeViewer);
  if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

  document.addEventListener('keydown', (e) => {
    if (!viewer || !viewer.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  window.__openHomeViewer = openViewer;
})();
