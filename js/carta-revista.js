/* ============================================================
   CARTA REVISTA — flipbook overlay (Diseño de carta)
   API: window.openCartaRevista(pages|baseDir, title?)
        window.closeCartaRevista()
   pages: string[] de URLs, o base dir "assets/carta-mm" + data-carta-pages
   ============================================================ */
(function () {
  'use strict';

  const root = document.getElementById('cartaRevista');
  if (!root) return;

  const backdrop = document.getElementById('cartaRevistaBackdrop');
  const closeBtn = document.getElementById('cartaRevistaClose');
  const stage = document.getElementById('cartaRevistaStage');
  const img = document.getElementById('cartaRevistaImg');
  const counter = document.getElementById('cartaRevistaCounter');
  const prevBtn = document.getElementById('cartaRevistaPrev');
  const nextBtn = document.getElementById('cartaRevistaNext');
  const titleEl = document.getElementById('cartaRevistaTitle');

  let open = false;
  let pages = [];
  let index = 0;
  let turning = false;
  let touchX = null;

  function setOpen(on) {
    open = !!on;
    root.classList.toggle('is-open', open);
    root.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('carta-revista-open', open);
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }

  function updateUI() {
    if (!pages.length) return;
    const src = pages[index];
    if (img && img.getAttribute('src') !== src) {
      img.src = src;
    }
    if (counter) counter.textContent = (index + 1) + ' / ' + pages.length;
    if (prevBtn) prevBtn.disabled = index <= 0;
    if (nextBtn) nextBtn.disabled = index >= pages.length - 1;
    root.setAttribute('data-page', String(index + 1));
  }

  function goTo(n, dir) {
    if (!pages.length || turning) return;
    const next = Math.max(0, Math.min(pages.length - 1, n));
    if (next === index) return;
    turning = true;
    const outClass = dir > 0 ? 'is-turn-next' : 'is-turn-prev';
    if (stage) {
      stage.classList.remove('is-turn-next', 'is-turn-prev', 'is-turn-in');
      void stage.offsetWidth;
      stage.classList.add(outClass);
    }
    window.setTimeout(function () {
      index = next;
      updateUI();
      if (stage) {
        stage.classList.remove(outClass);
        stage.classList.add('is-turn-in');
        window.setTimeout(function () {
          if (stage) stage.classList.remove('is-turn-in');
          turning = false;
        }, 220);
      } else {
        turning = false;
      }
    }, 160);
  }

  function nextPage() {
    goTo(index + 1, 1);
  }
  function prevPage() {
    goTo(index - 1, -1);
  }

  function normalizePages(input, pageCount) {
    if (Array.isArray(input)) {
      return input.filter(Boolean);
    }
    if (typeof input === 'string' && input.trim()) {
      var s = input.trim();
      if (s.indexOf(',') >= 0) {
        return s.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      }
      // base directory → page-01.webp …
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

  function openCartaRevista(input, title, pageCount) {
    pages = normalizePages(input, pageCount);
    if (!pages.length || !img) return;
    index = 0;
    turning = false;
    if (titleEl) titleEl.textContent = title || 'Diseño de carta';
    if (stage) stage.classList.remove('is-turn-next', 'is-turn-prev', 'is-turn-in');
    updateUI();
    setOpen(true);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeCartaRevista() {
    if (!open) return;
    setOpen(false);
    if (img) img.removeAttribute('src');
    pages = [];
    index = 0;
    var viewerOpen = document.body.classList.contains('pg-viewer-open');
    var modalOpen = document.body.classList.contains('modal-open');
    var figmaOpen = document.body.classList.contains('figma-proto-open');
    if (!viewerOpen && !modalOpen && !figmaOpen) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
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

  // Click en mitades de la página
  if (stage) {
    stage.addEventListener('click', function (e) {
      if (!open) return;
      var rect = stage.getBoundingClientRect();
      var x = e.clientX - rect.left;
      if (x < rect.width * 0.4) prevPage();
      else nextPage();
    });
  }

  // Scroll / rueda
  root.addEventListener(
    'wheel',
    function (e) {
      if (!open) return;
      e.preventDefault();
      if (e.deltaY > 8 || e.deltaX > 8) nextPage();
      else if (e.deltaY < -8 || e.deltaX < -8) prevPage();
    },
    { passive: false }
  );

  // Swipe
  root.addEventListener(
    'touchstart',
    function (e) {
      if (!open || !e.touches || !e.touches[0]) return;
      touchX = e.touches[0].clientX;
    },
    { passive: true }
  );
  root.addEventListener(
    'touchend',
    function (e) {
      if (!open || touchX == null) return;
      var endX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : touchX;
      var dx = endX - touchX;
      touchX = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) nextPage();
      else prevPage();
    },
    { passive: true }
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
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0, -1);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(pages.length - 1, 1);
      }
    },
    true
  );

  window.openCartaRevista = openCartaRevista;
  window.closeCartaRevista = closeCartaRevista;
})();
