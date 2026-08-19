/* ============================================================
   CARTA REVISTA — libro 3D (portada + spreads + flip real)
   PDF 5 págs → estados:
     0: portada cerrada (p1)
     1: spread p2 | p3
     2: spread p4 | p5
   API: openCartaRevista(dir|list, title?, pageCount?)
        closeCartaRevista()
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

  const FLIP_MS = 900;

  let open = false;
  let busy = false;
  let pages = []; // [p1..p5]
  let state = 0;  // 0 cover, 1 first spread, 2 second spread
  let maxState = 0;
  let touchX = null;
  let dragStartX = null;
  let closeTimer = null;

  function blank() {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
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

  function stateLabel() {
    if (state === 0) return 'Portada';
    if (state === 1) return 'Págs. 2–3';
    if (state === 2) return 'Págs. 4–5';
    return (state + 1) + ' / ' + (maxState + 1);
  }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    for (var i = 0; i <= maxState; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carta-revista__dot' + (i === state ? ' is-active' : '');
      b.setAttribute('aria-label', 'Ir a ' + (i === 0 ? 'portada' : 'sección ' + i));
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

  function updateChrome() {
    if (counter) counter.textContent = stateLabel();
    if (prevBtn) prevBtn.disabled = state <= 0 || busy;
    if (nextBtn) nextBtn.disabled = state >= maxState || busy;
    updateDots();
    if (book) {
      book.setAttribute('data-mode', state === 0 ? 'closed' : 'open');
      book.setAttribute('data-state', String(state));
    }
  }

  function paintSpread(s) {
    // s: 0 cover, 1 = p2|p3, 2 = p4|p5
    if (!pages.length) return;
    if (imgCover) imgCover.src = pages[0] || blank();
    if (s === 0) {
      if (imgLeft) imgLeft.src = blank();
      if (imgRight) imgRight.src = pages[1] || blank(); // under cover peek
      return;
    }
    if (s === 1) {
      if (imgLeft) imgLeft.src = pages[1] || blank();
      if (imgRight) imgRight.src = pages[2] || blank();
      return;
    }
    // s >= 2
    if (imgLeft) imgLeft.src = pages[3] || blank();
    if (imgRight) imgRight.src = pages[4] || blank();
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function openCover() {
      if (!book || !cover) return;
      // 1) expandir libro + preparar spread debajo
      paintSpread(1);
      book.classList.add('is-opening-cover');
      book.setAttribute('data-mode', 'opening'); // ancho doble, tapa a la derecha
      cover.style.transition = 'none';
      cover.style.transform = 'rotateY(0deg)';
      void cover.offsetWidth;
      // 2) girar tapa hacia la izquierda
      cover.style.transition = 'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
      cover.style.transform = 'rotateY(-180deg)';
      await wait(FLIP_MS + 30);
      // 3) estacionar abierta
      book.setAttribute('data-mode', 'open');
      book.classList.remove('is-opening-cover');
      cover.style.transition = '';
      cover.style.transform = '';
      state = 1;
      paintSpread(1);
      updateChrome();
    }

    async function closeCover() {
      if (!book || !cover) return;
      book.classList.add('is-closing-cover');
      book.setAttribute('data-mode', 'closing'); // ancho doble mientras cierra
      cover.style.transition = 'none';
      cover.style.transform = 'rotateY(-180deg)';
      void cover.offsetWidth;
      cover.style.transition = 'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
      cover.style.transform = 'rotateY(0deg)';
      await wait(FLIP_MS + 30);
      book.setAttribute('data-mode', 'closed');
      book.classList.remove('is-closing-cover');
      cover.style.transition = '';
      cover.style.transform = '';
      state = 0;
      paintSpread(0);
      updateChrome();
    }

  async function flipForwardInterior() {
    // state 1 → 2 : right page (p3) flips, back shows p4, under becomes p4|p5
    if (!flipper || !book) return;
    book.classList.add('is-flipping');
    // front of flipper = current right (p3), back = new left (p4)
    if (flipFront) flipFront.src = pages[2] || blank();
    if (flipBack) flipBack.src = pages[3] || blank();
    // under right becomes p5; left stays p2 until halfway then becomes p4
    if (imgRight) imgRight.src = pages[4] || blank();
    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(0deg)';
    void flipper.offsetWidth;
    flipper.style.transition = 'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
    flipper.style.transform = 'rotateY(-180deg)';
    // mid-swap left
    await wait(FLIP_MS * 0.48);
    if (imgLeft) imgLeft.src = pages[3] || blank();
    await wait(FLIP_MS * 0.52 + 20);
    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(0deg)';
    book.classList.remove('is-flipping');
    state = 2;
    paintSpread(2);
    updateChrome();
  }

  async function flipBackInterior() {
    // state 2 → 1
    if (!flipper || !book) return;
    book.classList.add('is-flipping');
    // animate from open (-180) back to 0: front will be p3, back p4
    if (flipFront) flipFront.src = pages[2] || blank();
    if (flipBack) flipBack.src = pages[3] || blank();
    // under: left should end as p2, right as p3
    if (imgLeft) imgLeft.src = pages[1] || blank();
    if (imgRight) imgRight.src = pages[2] || blank();
    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(-180deg)';
    void flipper.offsetWidth;
    flipper.style.transition = 'transform ' + FLIP_MS + 'ms cubic-bezier(0.33, 0.1, 0.25, 1)';
    flipper.style.transform = 'rotateY(0deg)';
    await wait(FLIP_MS * 0.48);
    // during unflip right under can stay p3
    await wait(FLIP_MS * 0.52 + 20);
    flipper.style.transition = 'none';
    flipper.style.transform = 'rotateY(0deg)';
    book.classList.remove('is-flipping');
    state = 1;
    paintSpread(1);
    updateChrome();
  }

  async function goTo(target) {
    if (!open || busy) return;
    target = Math.max(0, Math.min(maxState, target | 0));
    if (target === state) return;
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
      updateChrome();
    }
  }

  function nextPage() { goTo(state + 1); }
  function prevPage() { goTo(state - 1); }

  function openCartaRevista(input, title, pageCount) {
    pages = normalizePages(input, pageCount);
    if (!pages.length) return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    maxState = pages.length >= 5 ? 2 : (pages.length <= 1 ? 0 : 1);
    // if 3 pages: cover + one spread p2|p3
    if (pages.length === 3) maxState = 1;
    if (pages.length === 4) maxState = 2; // cover + p2|p3 + p4|blank
    state = 0;
    busy = false;
    if (titleEl) titleEl.textContent = title || 'Diseño de carta';
    preload(pages);
    paintSpread(0);
    if (cover) {
      cover.style.transition = '';
      cover.style.transform = '';
    }
    if (flipper) {
      flipper.style.transition = 'none';
      flipper.style.transform = 'rotateY(0deg)';
    }
    if (book) {
      book.classList.remove('is-flipping', 'is-opening-cover', 'is-closing-cover');
      book.setAttribute('data-mode', 'closed');
    }
    buildDots();
    updateChrome();
    setOpen(true);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeCartaRevista() {
    if (!open && !root.classList.contains('is-open')) return;
    root.classList.add('is-closing');
    root.classList.remove('is-open');
    // short close anim then cleanup
    closeTimer = setTimeout(function () {
      setOpen(false);
      root.classList.remove('is-closing');
      if (imgCover) imgCover.removeAttribute('src');
      if (imgLeft) imgLeft.removeAttribute('src');
      if (imgRight) imgRight.removeAttribute('src');
      pages = [];
      state = 0;
      busy = false;
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
  if (prevBtn) prevBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    prevPage();
  });
  if (nextBtn) nextBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    nextPage();
  });

  // click zones on book
  if (shell) {
    shell.addEventListener('click', function (e) {
      if (!open || busy) return;
      var rect = shell.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var ratio = x / rect.width;
      if (state === 0 || ratio > 0.55) nextPage();
      else prevPage();
    });
  }
  if (cover) {
    cover.addEventListener('click', function (e) {
      if (!open || busy) return;
      e.stopPropagation();
      if (state === 0) nextPage();
    });
  }

  // drag / swipe
  function onPointerDown(e) {
    if (!open || busy) return;
    dragStartX = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
    touchX = dragStartX;
  }
  function onPointerUp(e) {
    if (!open || touchX == null) return;
    var endX = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : e.clientX);
    var dx = endX - touchX;
    touchX = null;
    dragStartX = null;
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
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(maxState);
      }
    },
    true
  );

  window.openCartaRevista = openCartaRevista;
  window.closeCartaRevista = closeCartaRevista;
})();
