/* ============================================================
   CARTA / REVISTA — libro 3D (portada + spreads N páginas)
   pages[0] = tapa
   state 0  = cerrada
   state k  = pliego pages[2k-1] | pages[2k]  (1-based: 2k | 2k+1)
   maxState = ceil((n-1)/2)

   opts.size = 'large' → mockup más grande (revistas)
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
  let state = 0;
  let maxState = 0;
  let touchX = null;
  let closeTimer = null;
  let kind = 'carta'; // 'carta' | 'revista'

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

  function normalizePages(input, pageCount, ext) {
      if (Array.isArray(input)) return input.filter(Boolean);
      if (typeof input === 'string' && input.trim()) {
        var s = input.trim();
        if (s.indexOf(',') >= 0) {
          return s
            .split(',')
            .map(function (x) {
              return x.trim();
            })
            .filter(Boolean);
        }
        var base = s.replace(/\/+$/, '');
        var n = parseInt(pageCount, 10);
        if (!n || n < 1) n = 5;
        var e = (ext || 'webp').replace(/^\./, '');
        var list = [];
        for (var i = 1; i <= n; i++) {
          var num = i < 10 ? '0' + i : String(i);
          list.push(base + '/page-' + num + '.' + e);
        }
        return list;
      }
      return [];
    }

  function pageSrc(i) {
    if (i == null || i < 0 || i >= pages.length) return blank();
    return pages[i] || blank();
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
    if (el.getAttribute('src') !== next) {
      el.src = next;
      el.style.imageRendering = 'auto';
    }
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

  /** 1-based page numbers of current spread; cover = right only */
  function spreadPages() {
    if (state === 0) return { left: null, right: 1 };
    var L = 2 * state; // state1 → 2
    var R = 2 * state + 1;
    if (L > pages.length) L = null;
    if (R > pages.length) R = null;
    return { left: L, right: R };
  }

  function stateLabel() {
    if (state === 0) return 'Portada';
    var sp = spreadPages();
    if (sp.left != null && sp.right != null) {
      return 'Págs. ' + sp.left + '–' + sp.right;
    }
    if (sp.left != null) return 'Pág. ' + sp.left;
    if (sp.right != null) return 'Pág. ' + sp.right;
    return String(state);
  }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    // muchas páginas: puntos compactos; si >14, solo cada 2 + extremos
    var step = maxState > 14 ? 2 : 1;
    var made = {};
    function addDot(idx) {
      if (made[idx]) return;
      made[idx] = true;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carta-revista__dot' + (idx === state ? ' is-active' : '');
      b.setAttribute('aria-label', idx === 0 ? 'Portada' : 'Pliego ' + idx);
      b.dataset.state = String(idx);
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        goTo(idx);
      });
      dotsEl.appendChild(b);
    }
    addDot(0);
    for (var i = step; i < maxState; i += step) addDot(i);
    addDot(maxState);
  }

  function updateDots() {
    if (!dotsEl) return;
    var dots = dotsEl.querySelectorAll('.carta-revista__dot');
    for (var i = 0; i < dots.length; i++) {
      var idx = parseInt(dots[i].dataset.state, 10);
      dots[i].classList.toggle('is-active', idx === state);
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
    void flipper.offsetWidth;
    flipper.style.transition = '';
  }

  function stowCover(stowed) {
    if (!cover || !book) return;
    book.classList.toggle('is-cover-stowed', !!stowed);
    cover.setAttribute('aria-hidden', stowed ? 'true' : 'false');
    if (stowed) {
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
   * Pinta el pliego base.
   * pages 0-based: cover=0, interior starts at 1
   * state s>=1 → left=2s-1, right=2s
   */
  function paintSpread(s) {
    if (!pages.length) return;
    setSrc(imgCover, pageSrc(0));

    if (s <= 0) {
      setSrc(imgLeft, blank());
      setSrc(imgRight, pageSrc(1));
      if (imgLeft) imgLeft.alt = '';
      if (imgRight) imgRight.alt = pages[1] ? 'Página 2' : '';
      if (imgCover) imgCover.alt = 'Portada';
      return;
    }

    var li = 2 * s - 1;
    var ri = 2 * s;
    setSrc(imgLeft, pageSrc(li));
    setSrc(imgRight, pageSrc(ri));
    if (imgLeft) imgLeft.alt = pages[li] ? 'Página ' + (li + 1) : '';
    if (imgRight) imgRight.alt = pages[ri] ? 'Página ' + (ri + 1) : '';
  }

  async function openCover() {
    if (!book || !cover) return;

    paintSpread(1);
    resetFlipper();
    book.classList.remove('is-cover-stowed');
    book.classList.add('is-opening-cover');
    setMode('opening');

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

    book.classList.add('is-closing-cover');
    book.classList.remove('is-cover-stowed');
    setMode('closing');
    paintSpread(1);

    cover.style.transition = 'none';
    cover.style.left = 'auto';
    cover.style.right = '0';
    cover.style.width = '50%';
    cover.style.transform = 'rotateY(-180deg)';
    cover.style.opacity = '0';
    cover.style.visibility = 'hidden';
    cover.style.pointerEvents = 'none';
    void cover.offsetWidth;

    cover.style.opacity = '1';
    cover.style.visibility = 'visible';
    void cover.offsetWidth;

    cover.style.transition =
      'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
    cover.style.transform = 'rotateY(0deg)';

    await wait(FLIP_MS + 40);

    state = 0;
    paintSpread(0);
    book.classList.remove('is-closing-cover');
    hardResetCoverStyles();
    stowCover(false);
    setMode('closed');
    resetFlipper();
    updateChrome();
  }

  /** s → s+1 con s >= 1 */
  async function flipForwardInterior() {
    if (!flipper || !book || state < 1 || state >= maxState) return;

    var s = state;
    var curL = 2 * s - 1;
    var curR = 2 * s;
    var nextL = 2 * (s + 1) - 1;
    var nextR = 2 * (s + 1);

    book.classList.add('is-flipping');
    flipper.setAttribute('aria-hidden', 'false');
    flipper.style.opacity = '1';

    setSrc(flipFront, pageSrc(curR));
    setSrc(flipBack, pageSrc(nextL));
    setSrc(imgRight, pageSrc(nextR));
    setSrc(imgLeft, pageSrc(curL));

    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(0deg)';
    void flipper.offsetWidth;
    flipper.style.transition =
      'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
    flipper.style.transform = 'rotateY(-180deg)';

    await wait(FLIP_MS * 0.5);
    setSrc(imgLeft, pageSrc(nextL));
    await wait(FLIP_MS * 0.5 + 40);

    state = s + 1;
    paintSpread(state);
    resetFlipper();
    stowCover(true);
    setMode('open');
    updateChrome();
  }

  /** s → s-1 con s >= 2 */
  async function flipBackInterior() {
    if (!flipper || !book || state < 2) return;

    var s = state;
    var prev = s - 1;
    var prevL = 2 * prev - 1;
    var prevR = 2 * prev;
    var curL = 2 * s - 1;

    book.classList.add('is-flipping');
    flipper.setAttribute('aria-hidden', 'false');
    flipper.style.opacity = '1';

    setSrc(flipFront, pageSrc(prevR));
    setSrc(flipBack, pageSrc(curL));
    setSrc(imgLeft, pageSrc(prevL));
    setSrc(imgRight, pageSrc(prevR));

    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(-180deg)';
    void flipper.offsetWidth;
    flipper.style.transition =
      'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
    flipper.style.transform = 'rotateY(0deg)';

    await wait(FLIP_MS + 40);

    state = prev;
    paintSpread(state);
    resetFlipper();
    stowCover(true);
    setMode('open');
    updateChrome();
  }

  async function goTo(target) {
    if (!open || busy) return;
    target = Math.max(0, Math.min(maxState, target | 0));
    if (target === state) return;

    if (isZoomed()) resetZoom();

    busy = true;
    updateChrome();
    try {
      while (state < target) {
        if (state === 0) await openCover();
        else await flipForwardInterior();
      }
      while (state > target) {
        if (state === 1) await closeCover();
        else await flipBackInterior();
      }
    } finally {
      busy = false;
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

  /**
   * @param {string|string[]} input  dir o lista de urls
   * @param {string} title
   * @param {number|string} pageCount
   * @param {object} [opts]
   * @param {'default'|'large'} [opts.size]
   * @param {'carta'|'revista'} [opts.kind]
   */
  function openCartaRevista(input, title, pageCount, opts) {
      opts = opts || {};
      kind = opts.kind === 'revista' ? 'revista' : 'carta';
      // carta: SVG nítido (assets/carta-mm); revista: webp raster del PDF
      var ext = opts.ext || (kind === 'revista' ? 'webp' : 'svg');
      pages = normalizePages(input, pageCount, ext);
      if (!pages.length) return;

      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }

      var large =
        opts.size === 'large' ||
        opts.large === true ||
        kind === 'revista';
      root.classList.toggle('is-large', !!large);
      root.classList.toggle('is-revista', kind === 'revista');
      root.setAttribute(
        'aria-label',
        kind === 'revista' ? 'Revista' : 'Diseño de carta'
      );
      if (closeBtn) {
        closeBtn.setAttribute(
          'aria-label',
          kind === 'revista' ? 'Cerrar revista' : 'Cerrar carta'
        );
      }

      // portada + pliegos de a 2
      if (pages.length <= 1) maxState = 0;
      else maxState = Math.ceil((pages.length - 1) / 2);

    state = 0;
    busy = false;

    if (titleEl) {
      titleEl.textContent =
        title || (kind === 'revista' ? 'Revista' : 'Diseño de carta');
    }
    // precarga tapa + primeros pliegos; el resto en idle
    preload(pages.slice(0, Math.min(pages.length, 7)));
    if (pages.length > 7 && window.requestIdleCallback) {
      window.requestIdleCallback(function () {
        preload(pages.slice(7));
      });
    } else if (pages.length > 7) {
      setTimeout(function () {
        preload(pages.slice(7));
      }, 600);
    }

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
      root.classList.remove('is-large', 'is-revista');
      if (imgCover) imgCover.removeAttribute('src');
      if (imgLeft) imgLeft.removeAttribute('src');
      if (imgRight) imgRight.removeAttribute('src');
      if (flipFront) flipFront.removeAttribute('src');
      if (flipBack) flipBack.removeAttribute('src');
      pages = [];
      state = 0;
      busy = false;
      kind = 'carta';
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
      var manualOpen = document.body.classList.contains('brand-manual-open');
      if (!viewerOpen && !modalOpen && !figmaOpen && !manualOpen) {
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
      if (isZoomed()) return;
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

  root.addEventListener(
    'wheel',
    function (e) {
      if (!open) return;
      e.preventDefault();
      if (busy) return;

      var wantZoom = isZoomed() || e.ctrlKey || e.metaKey || e.altKey;
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
  /** Atajo semántico para revistas (siempre large) */
  window.openRevista = function (input, title, pageCount, opts) {
    opts = Object.assign({}, opts || {}, { kind: 'revista', size: 'large' });
    openCartaRevista(input, title, pageCount, opts);
  };
})();
