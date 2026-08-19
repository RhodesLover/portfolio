/* ============================================================
   CARTA REVISTA — libro 3D (portada + spreads)
   PDF 5 págs → estados:
     0: portada cerrada (p1)
     1: spread p2 | p3
     2: spread p4 | p5

   Fix crítico: la tapa NO se deja sobre el pliego abierto
   (antes el dorso beige tapaba la página izquierda / p2).
   ============================================================ */
(function () {
  'use strict';

  const root = document.getElementById('cartaRevista');
  if (!root) return;

  const backdrop = document.getElementById('cartaRevistaBackdrop');
  const closeBtn = document.getElementById('cartaRevistaClose');
  const book = document.getElementById('cartaBook');
  const cover = document.getElementById('cartaCover');
  const flipper = document.getElementById('cartaFlipper');
  const imgCover = document.getElementById('cartaImgCover');
  const imgLeft = document.getElementById('cartaImgLeft');
  const imgRight = document.getElementById('cartaImgRight');
  const flipFront = document.getElementById('cartaFlipFront');
  const flipBack = document.getElementById('cartaFlipBack');
  const counter = document.getElementById('cartaRevistaCounter');
  const titleEl = document.getElementById('cartaRevistaTitle');
  const prevBtn = document.getElementById('cartaRevistaPrev');
  const nextBtn = document.getElementById('cartaRevistaNext');
  const dotsEl = document.getElementById('cartaRevistaDots');
  const shell = document.getElementById('cartaBookShell');
    const zoomStage = document.getElementById('cartaZoomStage');
    const zoomControls = document.getElementById('cartaZoomControls');
    const zoomLevel = document.getElementById('cartaZoomLevel');

    const FLIP_MS = 880;

    let open = false;
    let busy = false;
    let pages = [];
    let state = 0; // 0 cover, 1 = 2|3, 2 = 4|5
    let maxState = 0;
    let touchX = null;
    let closeTimer = null;

    const mediaZoom =
          typeof window.createMediaZoom === 'function' && zoomStage && book
            ? window.createMediaZoom({
                stage: zoomStage,
                target: book,
                controls: zoomControls,
                levelEl: zoomLevel,
                min: 1,
                max: 3.5,
                step: 0.25,
                // rueda la maneja la revista (página vs zoom)
                enableWheel: false
              })
            : null;

    function isZoomed() {
      return !!(mediaZoom && mediaZoom.isZoomed && mediaZoom.isZoomed());
    }

    function resetZoom() {
      if (mediaZoom) mediaZoom.reset();
    }

    function setZoomEnabled(on) {
      if (mediaZoom) mediaZoom.setEnabled(!!on);
    }

  function blank() {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function normalizePages(input, pageCount) {
    if (Array.isArray(input)) return input.filter(Boolean);
    if (typeof input === 'string' && input.trim()) {
      var s = input.trim();
      if (s.indexOf(',') >= 0) {
        return s.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      }
      var base = s.replace(/\/+$/, '');
      var n = parseInt(pageCount, 10);
      if (!n || n < 1) n = 5;
      var list = [];
      for (var i = 1; i <= n; i++) {
        var num = i < 10 ? '0' + i : String(i);
        list.push(base + '/page-' + num + '.webp');
      }
      return list;
    }
    return [];
  }

  function preload(list) {
    list.forEach(function (src) {
      if (!src) return;
      var im = new Image();
      im.decoding = 'async';
      im.src = src;
    });
  }

  function setSrc(el, src) {
    if (!el) return;
    var next = src || blank();
    if (el.getAttribute('src') !== next) el.src = next;
  }

  function setOpen(on) {
    open = !!on;
    root.classList.toggle('is-open', open);
    root.classList.remove('is-closing');
    root.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('carta-revista-open', open);
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }

  function stateLabel() {
    if (state === 0) return 'Portada';
    if (state === 1) return 'Págs. 2–3';
    if (state === 2) return 'Págs. 4–5';
    return String(state);
  }

  /** Páginas reales del pliego actual (1-based), null = tapa sola */
  function spreadPages() {
    if (state === 0) return { left: null, right: 1 };
    if (state === 1) return { left: 2, right: 3 };
    return { left: 4, right: 5 };
  }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    for (var i = 0; i <= maxState; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carta-revista__dot' + (i === state ? ' is-active' : '');
      b.setAttribute('aria-label', i === 0 ? 'Portada' : 'Pliego ' + i);
      (function (idx) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          goTo(idx);
        });
      })(i);
      dotsEl.appendChild(b);
    }
  }

  function updateDots() {
    if (!dotsEl) return;
    var dots = dotsEl.querySelectorAll('.carta-revista__dot');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('is-active', i === state);
    }
  }

  function setMode(mode) {
    if (!book) return;
    book.setAttribute('data-mode', mode);
    book.setAttribute('data-state', String(state));
  }

  function resetFlipper() {
    if (!flipper) return;
    book && book.classList.remove('is-flipping');
    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(0deg)';
    flipper.style.opacity = '0';
    flipper.setAttribute('aria-hidden', 'true');
    // reflow
    void flipper.offsetWidth;
    flipper.style.transition = '';
  }

  function stowCover(stowed) {
      if (!cover || !book) return;
      book.classList.toggle('is-cover-stowed', !!stowed);
      cover.setAttribute('aria-hidden', stowed ? 'true' : 'false');
      if (stowed) {
        // fuera del stack visual: no tapa la página izquierda
        cover.style.visibility = 'hidden';
        cover.style.pointerEvents = 'none';
        cover.style.opacity = '0';
      } else {
        cover.style.visibility = '';
        cover.style.pointerEvents = '';
        cover.style.opacity = '';
      }
    }

    function hardResetCoverStyles() {
      if (!cover) return;
      cover.style.transition = '';
      cover.style.transform = '';
      cover.style.left = '';
      cover.style.right = '';
      cover.style.width = '';
      cover.style.opacity = '';
      cover.style.visibility = '';
      cover.style.pointerEvents = '';
    }

    /** Posiciona la tapa en la mitad derecha (bisagra al lomo) sin animar left/right. */
    function pinCoverRightHalf(rotationY) {
      if (!cover) return;
      cover.style.transition = 'none';
      cover.style.left = 'auto';
      cover.style.right = '0';
      cover.style.width = '50%';
      cover.style.transform = 'rotateY(' + rotationY + 'deg)';
      cover.style.opacity = '1';
      cover.style.visibility = 'visible';
      cover.style.pointerEvents = 'none';
      void cover.offsetWidth;
    }

    function updateChrome() {
      if (counter) counter.textContent = stateLabel();
      if (prevBtn) prevBtn.disabled = state <= 0 || busy;
      if (nextBtn) nextBtn.disabled = state >= maxState || busy;
      updateDots();
      root.setAttribute('data-state', String(state));
      var sp = spreadPages();
      root.setAttribute('data-left', sp.left == null ? '' : String(sp.left));
      root.setAttribute('data-right', sp.right == null ? '' : String(sp.right));
      // no pisar modes de animación
      if (!busy && book) {
        if (state === 0) {
          setMode('closed');
          stowCover(false);
        } else {
          setMode('open');
          stowCover(true);
        }
      }
    }

    /**
     * Pinta el pliego base según estado.
     * Índices 0-based en `pages`: p1=0 … p5=4
     * Portada sola no usa left; interiors siempre left|right correctos.
     */
    function paintSpread(s) {
      if (!pages.length) return;
      setSrc(imgCover, pages[0]);

      if (s <= 0) {
        setSrc(imgLeft, blank());
        // peek bajo la tapa (no se ve cerrada, pero listo al abrir)
        setSrc(imgRight, pages[1] || blank());
        if (imgLeft) imgLeft.alt = '';
        if (imgRight) imgRight.alt = pages[1] ? 'Página 2' : '';
        if (imgCover) imgCover.alt = 'Portada';
        return;
      }

      if (s === 1) {
        setSrc(imgLeft, pages[1] || blank());   // p2
        setSrc(imgRight, pages[2] || blank());  // p3
        if (imgLeft) imgLeft.alt = 'Página 2';
        if (imgRight) imgRight.alt = 'Página 3';
        return;
      }

      // s >= 2 → p4 | p5
      setSrc(imgLeft, pages[3] || blank());
      setSrc(imgRight, pages[4] || blank());
      if (imgLeft) imgLeft.alt = 'Página 4';
      if (imgRight) imgRight.alt = 'Página 5';
    }

    async function openCover() {
      if (!book || !cover) return;

      // pliego 2|3 debajo ANTES de girar
      paintSpread(1);
      resetFlipper();
      book.classList.remove('is-cover-stowed');
      book.classList.add('is-opening-cover');
      setMode('opening');

      // anclar YA en mitad derecha, sin transición de left/right
      pinCoverRightHalf(0);

      cover.style.transition =
        'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
      cover.style.transform = 'rotateY(-180deg)';

      await wait(FLIP_MS + 40);

      state = 1;
      paintSpread(1);
      setMode('open');
      book.classList.remove('is-opening-cover');
      hardResetCoverStyles();
      stowCover(true);
      resetFlipper();
      updateChrome();
    }

    async function closeCover() {
      if (!book || !cover) return;

      // Volver a portada: misma bisagra (mitad derecha).
      // Importante: pinear a la derecha ANTES de hacerse visible,
      // para no animar un salto desde la posición stowed.
      book.classList.add('is-closing-cover');
      book.classList.remove('is-cover-stowed');
      setMode('closing');
      paintSpread(1);

      // 1) invisible + anclada a la derecha en -180 (como si estuviera abierta)
      cover.style.transition = 'none';
      cover.style.left = 'auto';
      cover.style.right = '0';
      cover.style.width = '50%';
      cover.style.transform = 'rotateY(-180deg)';
      cover.style.opacity = '0';
      cover.style.visibility = 'hidden';
      cover.style.pointerEvents = 'none';
      void cover.offsetWidth;

      // 2) mostrar ya en posición correcta (sin slide)
      cover.style.opacity = '1';
      cover.style.visibility = 'visible';
      void cover.offsetWidth;

      // 3) solo girar a 0 (cierra sobre la derecha)
      cover.style.transition =
        'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
      cover.style.transform = 'rotateY(0deg)';

      await wait(FLIP_MS + 40);

      // 4) estacionar cerrada a ancho completo (sin animar left/width del flip)
      state = 0;
      paintSpread(0);
      book.classList.remove('is-closing-cover');
      hardResetCoverStyles();
      stowCover(false);
      setMode('closed');
      resetFlipper();
      updateChrome();
    }

  async function flipForwardInterior() {
    // 1 (p2|p3) → 2 (p4|p5)
    if (!flipper || !book) return;

    book.classList.add('is-flipping');
    flipper.setAttribute('aria-hidden', 'false');
    flipper.style.opacity = '1';

    // frente del flip = p3 actual; dorso = p4 entrante
    setSrc(flipFront, pages[2] || blank());
    setSrc(flipBack, pages[3] || blank());

    // bajo el flipper, la derecha ya es p5; izquierda sigue p2 hasta mitad
    setSrc(imgRight, pages[4] || blank());
    setSrc(imgLeft, pages[1] || blank());

    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(0deg)';
    void flipper.offsetWidth;
    flipper.style.transition =
      'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
    flipper.style.transform = 'rotateY(-180deg)';

    await wait(FLIP_MS * 0.5);
    // a mitad de camino la izquierda ya es p4
    setSrc(imgLeft, pages[3] || blank());
    await wait(FLIP_MS * 0.5 + 40);

    state = 2;
    paintSpread(2);
    resetFlipper();
    stowCover(true);
    setMode('open');
    updateChrome();
  }

  async function flipBackInterior() {
    // 2 (p4|p5) → 1 (p2|p3)
    if (!flipper || !book) return;

    book.classList.add('is-flipping');
    flipper.setAttribute('aria-hidden', 'false');
    flipper.style.opacity = '1';

    setSrc(flipFront, pages[2] || blank()); // p3
    setSrc(flipBack, pages[3] || blank());  // p4

    // destino bajo el flip
    setSrc(imgLeft, pages[1] || blank());  // p2
    setSrc(imgRight, pages[2] || blank()); // p3

    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(-180deg)';
    void flipper.offsetWidth;
    flipper.style.transition =
      'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
    flipper.style.transform = 'rotateY(0deg)';

    await wait(FLIP_MS + 40);

    state = 1;
    paintSpread(1);
    resetFlipper();
    stowCover(true);
    setMode('open');
    updateChrome();
  }

  async function goTo(target) {
        if (!open || busy) return;
        target = Math.max(0, Math.min(maxState, target | 0));
        if (target === state) return;

        // al cambiar de pliego, volver a 100%
        if (isZoomed()) resetZoom();

        busy = true;
        updateChrome();
        try {
          while (state < target) {
            if (state === 0) await openCover();
            else if (state === 1) await flipForwardInterior();
            else break;
          }
          while (state > target) {
            if (state === 2) await flipBackInterior();
            else if (state === 1) await closeCover();
            else break;
          }
        } finally {
          busy = false;
          // garantía final de coherencia UI ↔ contenido
          paintSpread(state);
          resetFlipper();
          if (state === 0) {
            setMode('closed');
            stowCover(false);
          } else {
            setMode('open');
            stowCover(true);
          }
          updateChrome();
        }
      }

    function nextPage() {
      goTo(state + 1);
    }
    function prevPage() {
      goTo(state - 1);
    }

    function openCartaRevista(input, title, pageCount) {
      pages = normalizePages(input, pageCount);
      if (!pages.length) return;

      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }

      // portada + spreads de a 2 a partir de p2
      // 5 páginas → estados 0,1,2
      if (pages.length <= 1) maxState = 0;
      else if (pages.length <= 3) maxState = 1;
      else maxState = 2;

      state = 0;
      busy = false;

      if (titleEl) titleEl.textContent = title || 'Diseño de carta';
      preload(pages);

      if (book) {
        book.classList.remove(
          'is-flipping',
          'is-opening-cover',
          'is-closing-cover',
          'is-cover-stowed'
        );
      }
      hardResetCoverStyles();
      stowCover(false);
      resetFlipper();
      paintSpread(0);
      setMode('closed');
      buildDots();
      updateChrome();
      setOpen(true);
      resetZoom();
      setZoomEnabled(true);
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function closeCartaRevista() {
      if (!open && !root.classList.contains('is-open')) return;
      root.classList.add('is-closing');
      root.classList.remove('is-open');
      setZoomEnabled(false);
      resetZoom();
      closeTimer = setTimeout(function () {
        setOpen(false);
        root.classList.remove('is-closing');
        if (imgCover) imgCover.removeAttribute('src');
        if (imgLeft) imgLeft.removeAttribute('src');
        if (imgRight) imgRight.removeAttribute('src');
        if (flipFront) flipFront.removeAttribute('src');
        if (flipBack) flipBack.removeAttribute('src');
        pages = [];
        state = 0;
        busy = false;
        hardResetCoverStyles();
        stowCover(false);
        resetFlipper();
        if (book) {
          book.classList.remove(
            'is-flipping',
            'is-opening-cover',
            'is-closing-cover',
            'is-cover-stowed'
          );
          setMode('closed');
        }
        var viewerOpen = document.body.classList.contains('pg-viewer-open');
        var modalOpen = document.body.classList.contains('modal-open');
        var figmaOpen = document.body.classList.contains('figma-proto-open');
        if (!viewerOpen && !modalOpen && !figmaOpen) {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }
        closeTimer = null;
      }, 280);
    }

  if (closeBtn) closeBtn.addEventListener('click', closeCartaRevista);
  if (backdrop) backdrop.addEventListener('click', closeCartaRevista);
  if (prevBtn) {
    prevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      prevPage();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      nextPage();
    });
  }

  if (shell) {
      shell.addEventListener('click', function (e) {
        if (!open || busy) return;
        if (isZoomed()) return; // pan/zoom activo: no pasar página
        if (e.target.closest && e.target.closest('.zoom-controls, button')) return;
        var rect = shell.getBoundingClientRect();
        var ratio = (e.clientX - rect.left) / rect.width;
        if (state === 0 || ratio > 0.52) nextPage();
        else prevPage();
      });
    }

    if (cover) {
      cover.addEventListener('click', function (e) {
        if (!open || busy) return;
        if (isZoomed()) return;
        e.stopPropagation();
        if (state === 0) nextPage();
      });
    }

    function onPointerDown(e) {
      if (!open || busy || isZoomed()) return;
      touchX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    }
    function onPointerUp(e) {
      if (!open || touchX == null || isZoomed()) {
        touchX = null;
        return;
      }
      var endX =
        e.changedTouches && e.changedTouches[0]
          ? e.changedTouches[0].clientX
          : e.clientX;
      var dx = endX - touchX;
      touchX = null;
      if (Math.abs(dx) < 48) return;
      if (dx < 0) nextPage();
      else prevPage();
    }
    if (book) {
      book.addEventListener('mousedown', onPointerDown);
      book.addEventListener('mouseup', onPointerUp);
      book.addEventListener('touchstart', onPointerDown, { passive: true });
      book.addEventListener('touchend', onPointerUp, { passive: true });
    }

    // Rueda: zoom si ya hay zoom o Ctrl/Meta; si no, pasar página.
        root.addEventListener(
          'wheel',
          function (e) {
            if (!open) return;
            e.preventDefault();
            if (busy) return;

            var wantZoom =
              isZoomed() || e.ctrlKey || e.metaKey || e.altKey;
            if (wantZoom && mediaZoom && mediaZoom.zoomBy) {
              var dir = e.deltaY > 0 ? -1 : 1;
              mediaZoom.zoomBy(dir, e.clientX, e.clientY);
              return;
            }
            if (isZoomed()) return;
            if (e.deltaY > 10 || e.deltaX > 10) nextPage();
            else if (e.deltaY < -10 || e.deltaX < -10) prevPage();
          },
          { passive: false }
        );

    document.addEventListener(
      'keydown',
      function (e) {
        if (!open) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (isZoomed()) {
            resetZoom();
            return;
          }
          closeCartaRevista();
          return;
        }
        if (busy) return;
        if (e.key === '+' || e.key === '=' ) {
          // leave to buttons; optional no-op
        }
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          nextPage();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          prevPage();
        } else if (e.key === 'Home') {
          e.preventDefault();
          if (isZoomed()) resetZoom();
          goTo(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          if (isZoomed()) resetZoom();
          goTo(maxState);
        }
      },
      true
    );

  window.openCartaRevista = openCartaRevista;
  window.closeCartaRevista = closeCartaRevista;
})();
