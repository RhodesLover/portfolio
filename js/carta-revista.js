/* ============================================================
   CARTA / REVISTA — libro 3D (portada + spreads N páginas)
   pages[0] = tapa (cerrada)
   pages[n-1] puede ser contratapa (PDF: 2ª hoja al inicio → al final)
   state 0  = cerrada
   state k  = pliego openLeafIndices(k)
     pares normales: left=2k-1 | right=2k  (0-based)
     si sobra 1 hoja al final (contratapa): left=blank | right=última
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

  const FLIP_MS = 720;

  let open = false;
    let busy = false;
    let pages = [];
    let state = 0;
    let maxState = 0;
    let touchX = null;
    let closeTimer = null;
    let kind = 'carta'; // 'carta' | 'revista'
    let pageRatio = 1.414; // h/w de una hoja
    let resizeTimer = null;
    let flipGen = 0; // invalidate in-flight flips (rapid clicks / far jumps)

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

    /**
     * Calcula --page-w / --page-h para que el libro (1 hoja o 2) quepa
     * centrado sin max-height que deforme el aspect y deje bandas.
     */
    function fitBook() {
      if (!book || !root) return;
      var large = root.classList.contains('is-large');
      var vw = window.innerWidth || document.documentElement.clientWidth || 1024;
      var vh = window.innerHeight || document.documentElement.clientHeight || 768;

      // aire del overlay: padding simétrico + chrome (meta/controls/hint)
            // + barras fijas de zoom (izq) y close (der) arriba — no tapar libro
            var padX = large
              ? Math.max(36, Math.min(72, vw * 0.05))
              : Math.max(32, Math.min(64, vw * 0.05));
            // top chrome (zoom/close) + bottom chrome (nav/dots/hint/meta)
            var chromeTop = large
              ? Math.max(64, Math.min(88, vh * 0.12))
              : Math.max(58, Math.min(80, vh * 0.11));
            var chromeBottom = large
              ? Math.max(100, Math.min(140, vh * 0.18))
              : Math.max(92, Math.min(128, vh * 0.18));
            if (vw <= 720) {
              padX = Math.max(20, Math.min(40, vw * 0.06));
              chromeTop = Math.max(52, Math.min(72, vh * 0.12));
              chromeBottom = Math.max(84, Math.min(112, vh * 0.18));
            }
            var chromeY = chromeTop + chromeBottom;

            var availW = Math.max(160, vw - padX * 2);
            var availH = Math.max(180, vh - chromeY);

      // preferimos dimensionar para el pliego abierto (2 hojas)
      var openW = availW;
      var openH = openW / 2 * pageRatio;
      if (openH > availH) {
        openH = availH;
        openW = (openH / pageRatio) * 2;
      }

      var pageW = openW / 2;
      // techos cómodos por modo (sigue siendo grande en revista)
      var maxPage = large
        ? (vw >= 1400 ? 520 : vw >= 1100 ? 470 : vw >= 900 ? 400 : 360)
        : (vw >= 1200 ? 360 : vw >= 900 ? 320 : 280);
      if (vw <= 720) maxPage = large ? 250 : 210;
      if (vw <= 480) maxPage = large ? 200 : 170;
      if (pageW > maxPage) {
        pageW = maxPage;
        openW = pageW * 2;
        openH = pageW * pageRatio;
      }

      // piso legible
      var minPage = vw <= 480 ? 120 : vw <= 720 ? 140 : 160;
      if (pageW < minPage) {
        pageW = minPage;
        openW = pageW * 2;
        openH = pageW * pageRatio;
      }

      pageW = Math.round(pageW * 10) / 10;
      var pageH = Math.round(pageW * pageRatio * 10) / 10;

      book.style.setProperty('--page-w', pageW + 'px');
      book.style.setProperty('--page-h', pageH + 'px');
      book.style.setProperty('--page-ratio', String(pageRatio));
      root.style.setProperty('--page-w', pageW + 'px');
      root.style.setProperty('--page-h', pageH + 'px');

      // meta alineada al ancho del libro actual (cerrado = 1 hoja)
      var meta = root.querySelector('.carta-revista__meta');
      if (meta) {
        var metaW = state === 0 ? pageW : pageW * 2;
        meta.style.maxWidth = Math.round(metaW) + 'px';
      }
    }

    function scheduleFit() {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resizeTimer = null;
        if (!open) return;
        var wasZoomed = isZoomed();
        if (wasZoomed) resetZoom();
        fitBook();
      }, 80);
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

    function whenDecoded(el) {
      if (!el) return Promise.resolve();
      try {
        if (typeof el.decode === 'function') {
          return el.decode().catch(function () {});
        }
      } catch (e) {}
      if (el.complete) return Promise.resolve();
      return new Promise(function (resolve) {
        var done = function () {
          el.removeEventListener('load', done);
          el.removeEventListener('error', done);
          resolve();
        };
        el.addEventListener('load', done);
        el.addEventListener('error', done);
      });
    }

    function setSrcAndDecode(el, src) {
      setSrc(el, src);
      return whenDecoded(el);
    }

    function currentFlipGen() {
      return flipGen;
    }

    function bumpFlipGen() {
      flipGen += 1;
      return flipGen;
    }

    /** Instant settle to a state (no animation) — used for far jumps / recovery */
    function hardSetState(s) {
      s = Math.max(0, Math.min(maxState, s | 0));
      state = s;
      if (book) {
        book.classList.remove(
          'is-flipping',
          'is-flipping-forward',
          'is-flipping-back',
          'is-opening-cover',
          'is-closing-cover'
        );
      }
      resetFlipper();
      hardResetCoverStyles();
      paintSpread(s);
      if (s === 0) {
        setMode('closed');
        stowCover(false);
      } else {
        setMode('open');
        stowCover(true);
      }
      updateChrome();
    }

    /** Lee ratio real de la tapa / primera página interior para matchear el mockup. */
    function learnRatioFrom(src, fallback) {
      return new Promise(function (resolve) {
        if (!src) {
          resolve(fallback || 1.414);
          return;
        }
        var im = new Image();
        im.onload = function () {
          if (im.naturalWidth > 0 && im.naturalHeight > 0) {
            resolve(im.naturalHeight / im.naturalWidth);
          } else {
            resolve(fallback || 1.414);
          }
        };
        im.onerror = function () {
          resolve(fallback || 1.414);
        };
        im.src = src;
      });
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

  /**
     * Índices 0-based del pliego abierto (s >= 1).
     * null = hoja en blanco.
     * Si el total de interiores es impar, la última hoja (contratapa)
     * va SIEMPRE a la derecha del último pliego.
     */
    function openLeafIndices(s) {
      if (s <= 0) return { li: null, ri: null };
      var li = 2 * s - 1;
      var ri = 2 * s;
      // última hoja suelta → derecha (contratapa al cerrar)
      if (li < pages.length && ri >= pages.length) {
        return { li: null, ri: li };
      }
      return {
        li: li < pages.length ? li : null,
        ri: ri < pages.length ? ri : null
      };
    }

    /** 1-based page numbers of current spread; cover = right only */
    function spreadPages() {
      if (state === 0) return { left: null, right: 1 };
      var idx = openLeafIndices(state);
      return {
        left: idx.li == null ? null : idx.li + 1,
        right: idx.ri == null ? null : idx.ri + 1
      };
    }

    function stateLabel() {
      if (state === 0) return 'Portada';
      var sp = spreadPages();
      // última página sola a la derecha = contratapa
      if (
        sp.left == null &&
        sp.right != null &&
        sp.right === pages.length
      ) {
        return 'Contratapa';
      }
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
    if (book) {
      book.classList.remove('is-flipping', 'is-flipping-forward', 'is-flipping-back');
    }
    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(0deg)';
    flipper.style.opacity = '0';
    flipper.style.visibility = 'hidden';
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
      // meta width sigue al libro (1 hoja / pliego)
      var meta = root.querySelector('.carta-revista__meta');
      if (meta && book) {
        var pw = parseFloat(getComputedStyle(book).getPropertyValue('--page-w')) || 320;
        meta.style.maxWidth = Math.round(state === 0 ? pw : pw * 2) + 'px';
      }
    }

  /**
     * Pinta el pliego base.
     * pages 0-based: cover=0, interior starts at 1
     * state s>=1 → openLeafIndices(s); contratapa final a la derecha
     */
    function paintSpread(s) {
      if (!pages.length) return;
      setSrc(imgCover, pageSrc(0));

      if (s <= 0) {
        setSrc(imgLeft, blank());
        setSrc(imgRight, blank());
        if (imgLeft) imgLeft.alt = '';
        if (imgRight) imgRight.alt = '';
        if (imgCover) imgCover.alt = 'Portada';
        return;
      }

      var idx = openLeafIndices(s);
      var li = idx.li;
      var ri = idx.ri;
      setSrc(imgLeft, li == null ? blank() : pageSrc(li));
      setSrc(imgRight, ri == null ? blank() : pageSrc(ri));
      if (imgLeft) {
        imgLeft.alt =
          li == null ? '' : 'Página ' + (li + 1);
      }
      if (imgRight) {
        if (ri == null) imgRight.alt = '';
        else if (ri === pages.length - 1 && li == null) imgRight.alt = 'Contratapa';
        else imgRight.alt = 'Página ' + (ri + 1);
      }
    }

  async function openCover() {
    if (!book || !cover) return;
    var gen = currentFlipGen();

    // Expand book width FIRST (no transition) so hinge geometry is stable
    setMode('opening');
    book.classList.remove('is-cover-stowed');
    book.classList.add('is-opening-cover');
    paintSpread(1);
    resetFlipper();
    await Promise.all([
      setSrcAndDecode(imgCover, pageSrc(0)),
      setSrcAndDecode(imgLeft, pageSrc(openLeafIndices(1).li)),
      setSrcAndDecode(imgRight, pageSrc(openLeafIndices(1).ri))
    ]);
    if (gen !== currentFlipGen() || !open) return;

    pinCoverRightHalf(0);
    void cover.offsetWidth;

    cover.style.transition =
      'transform ' + FLIP_MS + 'ms cubic-bezier(0.25, 0.1, 0.25, 1)';
    cover.style.transform = 'rotateY(-180deg)';

    await wait(FLIP_MS + 30);
    if (gen !== currentFlipGen() || !open) return;

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
    var gen = currentFlipGen();

    book.classList.add('is-closing-cover');
    book.classList.remove('is-cover-stowed');
    setMode('closing');
    paintSpread(1);
    await setSrcAndDecode(imgCover, pageSrc(0));
    if (gen !== currentFlipGen() || !open) return;

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
      'transform ' + FLIP_MS + 'ms cubic-bezier(0.25, 0.1, 0.25, 1)';
    cover.style.transform = 'rotateY(0deg)';

    await wait(FLIP_MS + 30);
    if (gen !== currentFlipGen() || !open) return;

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
      var gen = currentFlipGen();

      var s = state;
      var cur = openLeafIndices(s);
      var nxt = openLeafIndices(s + 1);

      // Paint stable under-layer: left stays current until mid-flip;
      // right under-layer becomes NEXT right (revealed as flipper leaves).
      setSrc(imgLeft, cur.li == null ? blank() : pageSrc(cur.li));
      setSrc(imgRight, nxt.ri == null ? blank() : pageSrc(nxt.ri));
      setSrc(flipFront, cur.ri == null ? blank() : pageSrc(cur.ri));
      setSrc(flipBack, nxt.li == null ? blank() : pageSrc(nxt.li));

      await Promise.all([
        whenDecoded(imgRight),
        whenDecoded(flipFront),
        whenDecoded(flipBack)
      ]);
      if (gen !== currentFlipGen() || !open) return;

      book.classList.add('is-flipping', 'is-flipping-forward');
      flipper.setAttribute('aria-hidden', 'false');
      flipper.style.visibility = 'visible';
      flipper.style.opacity = '1';

      flipper.style.transition = 'none';
      flipper.style.transform = 'rotateY(0deg)';
      void flipper.offsetWidth;
      flipper.style.transition =
        'transform ' + FLIP_MS + 'ms cubic-bezier(0.25, 0.1, 0.25, 1)';
      flipper.style.transform = 'rotateY(-180deg)';

      // Mid-turn: swap left leaf to destination (hidden under flipper back)
      await wait(Math.round(FLIP_MS * 0.48));
      if (gen !== currentFlipGen() || !open) return;
      setSrc(imgLeft, nxt.li == null ? blank() : pageSrc(nxt.li));

      await wait(Math.round(FLIP_MS * 0.52) + 24);
      if (gen !== currentFlipGen() || !open) return;

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
      var gen = currentFlipGen();

      var s = state;
      var prev = s - 1;
      var cur = openLeafIndices(s);
      var prv = openLeafIndices(prev);

      // Destination under-layer ready; flipper starts folded open (-180)
      setSrc(imgLeft, prv.li == null ? blank() : pageSrc(prv.li));
      setSrc(imgRight, prv.ri == null ? blank() : pageSrc(prv.ri));
      setSrc(flipFront, prv.ri == null ? blank() : pageSrc(prv.ri));
      setSrc(flipBack, cur.li == null ? blank() : pageSrc(cur.li));

      await Promise.all([
        whenDecoded(imgLeft),
        whenDecoded(imgRight),
        whenDecoded(flipFront),
        whenDecoded(flipBack)
      ]);
      if (gen !== currentFlipGen() || !open) return;

      book.classList.add('is-flipping', 'is-flipping-back');
      flipper.setAttribute('aria-hidden', 'false');
      flipper.style.visibility = 'visible';
      flipper.style.opacity = '1';

      flipper.style.transition = 'none';
      flipper.style.transform = 'rotateY(-180deg)';
      void flipper.offsetWidth;
      flipper.style.transition =
        'transform ' + FLIP_MS + 'ms cubic-bezier(0.25, 0.1, 0.25, 1)';
      flipper.style.transform = 'rotateY(0deg)';

      await wait(FLIP_MS + 24);
      if (gen !== currentFlipGen() || !open) return;

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

    var delta = target - state;
    // Far jumps (dots / Home / End): hard settle — chaining many 3D flips
    // is what "se rompe" on multi-page revistas (Gotham/Inrock). Animate only ±1.
    if (Math.abs(delta) > 1) {
      bumpFlipGen();
      busy = true;
      updateChrome();
      try {
        hardSetState(target);
      } finally {
        busy = false;
        updateChrome();
      }
      return;
    }

    var gen = bumpFlipGen();
    busy = true;
    updateChrome();
    try {
      if (delta === 1) {
        if (state === 0) await openCover();
        else await flipForwardInterior();
      } else if (delta === -1) {
        if (state === 1) await closeCover();
        else await flipBackInterior();
      }
      // If a newer navigation cancelled us mid-flight, hard recover
      if (gen !== currentFlipGen()) return;
    } catch (err) {
      hardSetState(target);
    } finally {
      if (gen === currentFlipGen()) {
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
      } else {
        busy = false;
      }
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

          bumpFlipGen();
          if (book) {
            book.classList.remove(
              'is-flipping',
              'is-flipping-forward',
              'is-flipping-back',
              'is-opening-cover',
              'is-closing-cover',
              'is-cover-stowed'
            );
            book.style.transform = '';
          }
          hardResetCoverStyles();
          stowCover(false);
          resetFlipper();
          paintSpread(0);
          setMode('closed');
          buildDots();

          // ratio real de la portada → sizing sin bandas; fallback A4
          pageRatio = 1.414;
          fitBook();
          setOpen(true);
          updateChrome();
          resetZoom();
          setZoomEnabled(true);
          if (closeBtn) closeBtn.focus({ preventScroll: true });

          learnRatioFrom(pages[0], 1.414).then(function (r) {
            if (!open) return;
            // clamp sensato (evita hojas ridículas si un asset sale mal)
            if (r > 1.05 && r < 1.9) {
              pageRatio = r;
              fitBook();
              updateChrome();
            }
          });
        }

  function closeCartaRevista() {
    if (!open && !root.classList.contains('is-open')) return;
    bumpFlipGen();
    busy = false;
    root.classList.add('is-closing');
    root.classList.remove('is-open');
    setZoomEnabled(false);
    resetZoom();
    if (book) book.style.transform = '';
    closeTimer = setTimeout(function () {
          setOpen(false);
          root.classList.remove('is-closing');
          root.classList.remove('is-large', 'is-revista');
          if (book) {
            book.style.removeProperty('--page-w');
            book.style.removeProperty('--page-h');
            book.style.removeProperty('--page-ratio');
          }
          root.style.removeProperty('--page-w');
          root.style.removeProperty('--page-h');
          var meta = root.querySelector('.carta-revista__meta');
          if (meta) meta.style.maxWidth = '';
          if (imgCover) imgCover.removeAttribute('src');
          if (imgLeft) imgLeft.removeAttribute('src');
          if (imgRight) imgRight.removeAttribute('src');
          if (flipFront) flipFront.removeAttribute('src');
          if (flipBack) flipBack.removeAttribute('src');
          pages = [];
          state = 0;
          busy = false;
          kind = 'carta';
          pageRatio = 1.414;
          hardResetCoverStyles();
          stowCover(false);
          resetFlipper();
          if (book) {
            book.classList.remove(
              'is-flipping',
              'is-flipping-forward',
              'is-flipping-back',
              'is-opening-cover',
              'is-closing-cover',
              'is-cover-stowed'
            );
            book.style.transform = '';
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

    window.addEventListener('resize', scheduleFit);
    window.addEventListener('orientationchange', scheduleFit);
  })();
