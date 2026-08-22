/* ============================================================
   PROYECTOS — galería modular (filtros + viewer + motion)
   ============================================================ */

/* Cursor personalizado (paridad con el home) */
(function () {
  'use strict';
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  (function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  const hoverables = 'a, button, .pg-cell, .btn, .pg-filter__btn';
  document.querySelectorAll(hoverables).forEach((el) => {
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

  /* estela (larga exposición) */
  const trail = document.getElementById('trailCanvas');
  if (trail && window.CanvasRenderingContext2D) {
    const ctx = trail.getContext('2d');
    let prevX = 0, prevY = 0, hasPrev = false, hot = false;
    function sizeTrail() {
      trail.width = window.innerWidth;
      trail.height = window.innerHeight;
      ctx.clearRect(0, 0, trail.width, trail.height);
    }
    sizeTrail();
    window.addEventListener('resize', sizeTrail);
    (function fadeTrail() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, trail.width, trail.height);
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(fadeTrail);
    })();
    document.addEventListener('mousemove', (e) => {
      const x = e.clientX, y = e.clientY;
      if (hasPrev) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = hot ? 'rgba(255,197,211,0.9)' : 'rgba(255,197,211,0.65)';
        ctx.shadowBlur = hot ? 22 : 14;
        ctx.strokeStyle = hot ? 'rgba(255,210,220,0.85)' : 'rgba(255,197,211,0.55)';
        ctx.lineWidth = hot ? 3.2 : 2;
        ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = hot ? 'rgba(255,235,240,1)' : 'rgba(255,220,228,0.9)';
        ctx.beginPath(); ctx.arc(x, y, hot ? 3 : 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      prevX = x; prevY = y; hasPrev = true;
    });
    document.querySelectorAll(hoverables).forEach((el) => {
      el.addEventListener('mouseenter', () => { hot = true; });
      el.addEventListener('mouseleave', () => { hot = false; });
    });
  }
})();

(function () {
  'use strict';

  const cells = Array.from(document.querySelectorAll('.pg-cell[data-title]'));
  const sections = Array.from(document.querySelectorAll('.pg-section'));
  const filterBtns = Array.from(document.querySelectorAll('.pg-filter__btn'));
  const totalEl = document.getElementById('pgTotalCount');
  const filterBar = document.getElementById('pgFilter');

  const viewer = document.getElementById('pgViewer');
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
  const mediaZoom = (typeof createMediaZoom === 'function') ? createMediaZoom({
    stage: document.getElementById('pgZoomStage'),
    target: vImg,
    controls: document.getElementById('pgZoomControls'),
    levelEl: document.getElementById('pgZoomLevel')
  }) : null;
  const zoomStage = document.getElementById('pgZoomStage');

  let activeFilter = 'all';
  let visibleCells = cells.slice();
  let currentIndex = -1;

  function setVideoFill(on) {
    // deprecado: nunca crop
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
      zoomStage.style.setProperty('--media-ar', String(w / h));
      zoomStage.classList.add('is-fitted');
    } else {
      zoomStage.style.removeProperty('--media-ar');
      zoomStage.classList.remove('is-fitted');
    }
  }

  function updateCount() {
    if (totalEl) {
      const n = visibleCells.length;
      totalEl.textContent = n + (n === 1 ? ' pieza' : ' piezas');
    }
  }

  function applyFilter(key) {
    activeFilter = key;
    filterBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === key));

    visibleCells = [];
    sections.forEach((sec) => {
      const secKey = sec.dataset.section;
      const showSec = key === 'all' || key === secKey;
      const secCells = Array.from(sec.querySelectorAll('.pg-cell[data-title]'));
      let shown = 0;
      secCells.forEach((cell) => {
        const on = showSec;
        cell.classList.toggle('is-hidden', !on);
        cell.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (on) {
          shown += 1;
          visibleCells.push(cell);
        }
      });
      sec.classList.toggle('is-hidden', !showSec || shown === 0);
    });

    // re-stagger visible
    visibleCells.forEach((c, i) => {
      c.style.setProperty('--stagger', (i % 8) * 40 + 'ms');
      c.classList.remove('is-in');
      // force reflow for re-anim when filtering
      void c.offsetWidth;
      requestAnimationFrame(() => c.classList.add('is-in'));
    });

    updateCount();
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyFilter(btn.dataset.filter || 'all');
      // smooth scroll to first visible section if filtered
      if ((btn.dataset.filter || 'all') !== 'all') {
        const target = document.getElementById('sec-' + btn.dataset.filter);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const main = document.getElementById('pgMain');
        if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* sticky filter shadow on scroll */
  if (filterBar) {
    const onScroll = () => {
      filterBar.classList.toggle('is-stuck', window.scrollY > 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* reveal on scroll */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  cells.forEach((c, i) => {
    c.style.setProperty('--stagger', (i % 8) * 45 + 'ms');
    io.observe(c);
  });
  document.querySelectorAll('.pg-section__head, .pg-hero__title, .pg-hero__sub').forEach((el) => {
    io.observe(el);
  });

  /* gif hover inside cells (only .pg-cell__media--gif-hover — MM) */
  document.querySelectorAll('.pg-cell__media--gif-hover').forEach((img) => {
    const still = img.getAttribute('data-still') || img.getAttribute('src');
    const gif = img.getAttribute('data-gif');
    if (!gif) return;
    const cell = img.closest('.pg-cell');
    if (!cell) return;
    const showGif = () => {
      const join = gif.indexOf('?') >= 0 ? '&' : '?';
      img.src = gif + join + 't=' + Date.now();
    };
    const showStill = () => {
      img.src = still;
    };
    cell.addEventListener('mouseenter', showGif);
    cell.addEventListener('mouseleave', showStill);
    cell.addEventListener('focusin', showGif);
    cell.addEventListener('focusout', (e) => {
      if (!cell.contains(e.relatedTarget)) showStill();
    });
  });

  /* video hover play inside cells */
  document.querySelectorAll('.pg-cell video').forEach((video) => {
    const cell = video.closest('.pg-cell');
    if (!cell) return;
    cell.addEventListener('mouseenter', () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
    cell.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });

  /* subtle magnetic hover on frames (desktop) */
  if (window.matchMedia('(hover: hover)').matches) {
    cells.forEach((cell) => {
      const frame = cell.querySelector('.pg-cell__frame');
      if (!frame) return;
      cell.addEventListener('mousemove', (e) => {
        const r = frame.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 6;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 6;
        frame.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(1.01)`;
      });
      cell.addEventListener('mouseleave', () => {
        frame.style.transform = '';
      });
    });
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

  function openViewer(cell) {
    if (!viewer || !cell) return;
    visibleCells = cells.filter((c) => !c.classList.contains('is-hidden'));
    currentIndex = visibleCells.indexOf(cell);
    if (currentIndex < 0) {
      visibleCells = cells.slice();
      currentIndex = visibleCells.indexOf(cell);
    }

    const title = cell.dataset.title || '';
    const cat = cell.dataset.cat || '';
    const desc = cell.dataset.desc || '';
    const behance = cell.dataset.behance || '';
    const type = cell.dataset.type || 'image';
    const media = cell.dataset.media || '';
    const poster = cell.dataset.poster || '';
    const extraVideo = cell.dataset.video || '';
    const idxLabel = cell.querySelector('.pg-cell__idx');

    clearViewerMedia();

    // Imagen/poster primero. Si es video nativo (redes), abre video.
    // Piezas con data-video (Fly Moon / Tokyo) abren el still y el motion es opt-in.
    if (type === 'video') {
      vVideo.style.display = 'block';
      if (poster) vVideo.poster = poster;
      vVideo.src = media;
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
      vImg.src = media;
      vImg.alt = title;
      var onLoad = function () {
        fitStageToMedia(vImg);
        vImg.removeEventListener('load', onLoad);
      };
      vImg.addEventListener('load', onLoad);
      if (vImg.complete && vImg.naturalWidth) fitStageToMedia(vImg);
      setVideoFill(false);
      if (mediaZoom) mediaZoom.setEnabled(!!media);
    }

    vTitle.textContent = title;
    vCat.textContent = cat;
    vDesc.textContent = desc;
    vIdx.textContent = idxLabel ? idxLabel.textContent : String(currentIndex + 1).padStart(2, '0');

    vActions.innerHTML = '';
    const isRedes = (cell.dataset.section === 'redes') || (cat || '').indexOf('Social') === 0;
    const figmaProto = cell.dataset.figmaProto || '';
    const cartaDir = cell.dataset.carta || '';
    const cartaPages = cell.dataset.cartaPages || '';
    const manualDir = cell.dataset.manual || '';
    const manualPages = cell.dataset.manualPages || '';
    if (isRedes) {
      // Redes → botón "Ver Instagram" (abre prototipo Figma si data-figma-proto)
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
    if (extraVideo && type !== 'video') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pg-viewer__link pg-viewer__link--ghost';
      b.textContent = 'Ver motion →';
      b.addEventListener('click', () => {
        // Motion opt-in: video completo sin crop, stage sigue el aspect del still o del video
        if (vImg.naturalWidth && vImg.naturalHeight && zoomStage) {
          fitStageToMedia(vImg);
        }
        vImg.style.display = 'none';
        vVideo.style.display = 'block';
        if (media) vVideo.poster = media;
        vVideo.src = extraVideo;
        var onMeta = function () {
          fitStageToMedia(vVideo);
          vVideo.removeEventListener('loadedmetadata', onMeta);
        };
        vVideo.addEventListener('loadedmetadata', onMeta);
        setVideoFill(false);
        vVideo.play().catch(() => {});
        if (mediaZoom) mediaZoom.setEnabled(false);
        b.disabled = true;
        b.textContent = 'Motion';
      });
      vActions.appendChild(b);
    }

    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= visibleCells.length - 1;

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
    if (next < 0 || next >= visibleCells.length) return;
    openViewer(visibleCells[next]);
  }

  cells.forEach((cell) => {
    cell.addEventListener('click', (e) => {
      e.preventDefault();
      openViewer(cell);
    });
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openViewer(cell);
      }
    });
  });

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

  // init
  applyFilter('all');
  // hero in immediately (evita título invisible si el observer falla)
  document.querySelectorAll('.pg-hero__title, .pg-hero__sub').forEach((el) => {
    el.classList.add('is-in');
  });

  console.log('▦ Galería modular lista —', cells.length, 'piezas');
})();
