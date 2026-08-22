/* ============================================================
   BRAND MANUAL — A4 landscape spreads (NO flip 3D / NO revista)
   Prioridad: diseño completo sin crop + detalle con zoom.
   Contenedor lógico = pliego A4 horizontal (2 × 297:210).
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('brandManual');
  if (!root) return;

  var backdrop = document.getElementById('brandManualBackdrop');
  var closeBtn = document.getElementById('brandManualClose');
  var titleEl = document.getElementById('brandManualTitle');
  var counterEl = document.getElementById('brandManualCounter');
  var stage = document.getElementById('brandManualStage');
  var frame = document.getElementById('brandManualFrame');
  var zoomStage = document.getElementById('brandManualZoomStage');
  var zoomControls = document.getElementById('brandManualZoomControls');
  var zoomLevel = document.getElementById('brandManualZoomLevel');
  var spreadEl = document.getElementById('brandManualSpread');
  var imgLeft = document.getElementById('brandManualImgLeft');
  var imgRight = document.getElementById('brandManualImgRight');
  var prevBtn = document.getElementById('brandManualPrev');
  var nextBtn = document.getElementById('brandManualNext');
  var railEl = document.getElementById('brandManualRail');
  var progressEl = document.getElementById('brandManualProgress');

  /* Single A4 landscape page ratio 297:210 ≈ 1.4142857
     Spread (two pages side by side) ≈ 2.828571 */
  var PAGE_AR = 297 / 210;
  var SPREAD_AR = PAGE_AR * 2;

  var open = false;
  var pages = [];
  var spreadIndex = 0;
  var spreadCount = 0;
  var touchX = null;
  var preloadDone = {};
  var fitRaf = 0;

  var mediaZoom =
    typeof window.createMediaZoom === 'function' && zoomStage && spreadEl
      ? window.createMediaZoom({
          stage: zoomStage,
          target: spreadEl,
          controls: zoomControls,
          levelEl: zoomLevel,
          min: 1,
          max: 4,
          step: 0.25,
          enableWheel: true
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

  function normalizePages(input, pageCount) {
    var n = parseInt(pageCount, 10) || 0;
    var dir = String(input || '').replace(/\/+$/, '');
    if (!dir || n < 1) return [];
    var list = [];
    for (var i = 1; i <= n; i++) {
      var num = i < 10 ? '0' + i : String(i);
      list.push(dir + '/page-' + num + '.jpg');
    }
    return list;
  }

  function spreadCountFrom(len) {
    return Math.ceil(len / 2);
  }

  function pagePair(si) {
    var a = si * 2;
    var b = a + 1;
    return {
      left: pages[a] || '',
      right: pages[b] || '',
      leftNum: a + 1,
      rightNum: b + 1,
      hasRight: !!pages[b]
    };
  }

  function preloadAround(si) {
    var idxs = [si - 1, si, si + 1];
    idxs.forEach(function (s) {
      if (s < 0 || s >= spreadCount) return;
      var pair = pagePair(s);
      [pair.left, pair.right].forEach(function (src) {
        if (!src || preloadDone[src]) return;
        preloadDone[src] = true;
        var im = new Image();
        im.decoding = 'async';
        im.src = src;
      });
    });
  }

  /* Fit logical A4 container into available viewport WITHOUT cropping pages.
     Uses contain math on the frame; pages fill the frame with object-fit:contain. */
  function fitFrame() {
    if (!frame || !stage || !open) return;
    var workspace = stage.querySelector('.brand-manual__workspace') || stage;
    var box = workspace.getBoundingClientRect();
    /* side nav columns ~48+48 + gaps; keep a little breathing room */
    var padX = 108;
    var padY = 6;
    if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) {
      padX = 16;
    }
    var availW = Math.max(160, box.width - padX);
    var availH = Math.max(140, box.height - padY);

    var pair = pagePair(spreadIndex);
    var ar = pair.hasRight ? SPREAD_AR : PAGE_AR;

    /* contain: largest A4 box that fits without crop */
    var w = availW;
    var h = w / ar;
    if (h > availH) {
      h = availH;
      w = h * ar;
    }

    var W = Math.max(120, Math.floor(w));
    var H = Math.max(90, Math.floor(h));
    frame.style.width = W + 'px';
    frame.style.height = H + 'px';
    frame.style.maxWidth = '100%';
    frame.style.maxHeight = '100%';
    frame.style.aspectRatio = String(ar);
    frame.classList.toggle('is-single', !pair.hasRight);

    if (zoomStage) {
      zoomStage.style.width = '100%';
      zoomStage.style.height = '100%';
    }
    if (spreadEl) {
      spreadEl.style.width = '100%';
      spreadEl.style.height = '100%';
    }
  }

  function scheduleFit() {
    if (fitRaf) cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(function () {
      fitRaf = 0;
      fitFrame();
    });
  }

  function setOpen(on) {
    open = !!on;
    root.classList.toggle('is-open', open);
    root.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('brand-manual-open', open);
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      scheduleFit();
    } else {
      if (
        !document.body.classList.contains('pg-viewer-open') &&
        !document.body.classList.contains('modal-open') &&
        !document.body.classList.contains('carta-revista-open') &&
        !document.body.classList.contains('figma-proto-open')
      ) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    }
  }

  function updateChrome() {
    var pair = pagePair(spreadIndex);
    if (counterEl) {
      if (pair.hasRight) {
        counterEl.textContent =
          'Págs. ' + pair.leftNum + '–' + pair.rightNum + ' · ' + pages.length;
      } else {
        counterEl.textContent = 'Pág. ' + pair.leftNum + ' · ' + pages.length;
      }
    }
    if (prevBtn) prevBtn.disabled = spreadIndex <= 0;
    if (nextBtn) nextBtn.disabled = spreadIndex >= spreadCount - 1;

    if (progressEl) {
      var pct = spreadCount <= 1 ? 100 : (spreadIndex / (spreadCount - 1)) * 100;
      progressEl.style.width = pct + '%';
      progressEl.setAttribute('aria-valuenow', String(spreadIndex + 1));
      progressEl.setAttribute('aria-valuemax', String(spreadCount));
    }

    if (railEl) {
      var thumbs = railEl.querySelectorAll('.brand-manual__thumb');
      for (var t = 0; t < thumbs.length; t++) {
        thumbs[t].classList.toggle('is-active', t === spreadIndex);
      }
      var active = railEl.querySelector('.brand-manual__thumb.is-active');
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  function paintSpread(si, animate) {
    var pair = pagePair(si);
    if (!imgLeft) return;

    function apply() {
      imgLeft.src = pair.left;
      imgLeft.alt = 'Página ' + pair.leftNum + ' del manual';
      if (imgRight) {
        if (pair.hasRight) {
          imgRight.hidden = false;
          imgRight.removeAttribute('hidden');
          imgRight.src = pair.right;
          imgRight.alt = 'Página ' + pair.rightNum + ' del manual';
        } else {
          imgRight.removeAttribute('src');
          imgRight.alt = '';
          imgRight.hidden = true;
        }
      }
      if (spreadEl) spreadEl.classList.toggle('is-single', !pair.hasRight);
      if (frame) frame.classList.toggle('is-single', !pair.hasRight);
      scheduleFit();
    }

    function onReady() {
      /* wait both images if pair */
      var pending = 1 + (pair.hasRight ? 1 : 0);
      var done = 0;
      function tick() {
        done++;
        if (done >= pending) scheduleFit();
      }
      if (imgLeft.complete && imgLeft.naturalWidth) tick();
      else imgLeft.addEventListener('load', tick, { once: true });
      if (pair.hasRight && imgRight) {
        if (imgRight.complete && imgRight.naturalWidth) tick();
        else imgRight.addEventListener('load', tick, { once: true });
      }
    }

    if (animate && spreadEl) {
      spreadEl.classList.add('is-fading');
      window.setTimeout(function () {
        apply();
        onReady();
        spreadEl.classList.remove('is-fading');
      }, 120);
    } else {
      apply();
      onReady();
    }
    preloadAround(si);
    updateChrome();
  }

  function buildRail() {
    if (!railEl) return;
    railEl.innerHTML = '';
    for (var i = 0; i < spreadCount; i++) {
      (function (idx) {
        var pair = pagePair(idx);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'brand-manual__thumb';
        btn.setAttribute(
          'aria-label',
          pair.hasRight
            ? 'Pliego ' + (idx + 1) + ': páginas ' + pair.leftNum + ' y ' + pair.rightNum
            : 'Pliego ' + (idx + 1) + ': página ' + pair.leftNum
        );
        var mark = document.createElement('span');
        mark.className = 'brand-manual__thumb-mark';
        mark.textContent = pair.hasRight
          ? pair.leftNum + '–' + pair.rightNum
          : String(pair.leftNum);
        var img = document.createElement('img');
        img.src = pair.left;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        btn.appendChild(img);
        btn.appendChild(mark);
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          goTo(idx);
        });
        railEl.appendChild(btn);
      })(i);
    }
  }

  function goTo(si) {
    if (!pages.length) return;
    var next = Math.max(0, Math.min(spreadCount - 1, si));
    if (next === spreadIndex && open) {
      updateChrome();
      scheduleFit();
      return;
    }
    if (isZoomed()) resetZoom();
    var animate = open && next !== spreadIndex;
    spreadIndex = next;
    paintSpread(spreadIndex, animate);
  }

  function nextSpread() {
    goTo(spreadIndex + 1);
  }
  function prevSpread() {
    goTo(spreadIndex - 1);
  }

  function openBrandManual(input, title, pageCount) {
    pages = normalizePages(input, pageCount);
    if (!pages.length) return;
    preloadDone = {};
    spreadCount = spreadCountFrom(pages.length);
    spreadIndex = 0;

    if (titleEl) titleEl.textContent = title || 'Manual de marca';
    buildRail();
    paintSpread(0, false);
    setOpen(true);
    resetZoom();
    setZoomEnabled(true);
    scheduleFit();
    window.setTimeout(scheduleFit, 40);
    window.setTimeout(scheduleFit, 200);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeBrandManual() {
    if (!open) return;
    setOpen(false);
    resetZoom();
    setZoomEnabled(false);
    if (imgLeft) imgLeft.removeAttribute('src');
    if (imgRight) {
      imgRight.removeAttribute('src');
      imgRight.hidden = false;
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeBrandManual);
  if (backdrop) backdrop.addEventListener('click', closeBrandManual);
  if (prevBtn)
    prevBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      prevSpread();
    });
  if (nextBtn)
    nextBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      nextSpread();
    });

  /* Side hit zones on frame only when not zoomed */
  if (frame) {
    frame.addEventListener('click', function (e) {
      if (!open || isZoomed()) return;
      if (
        e.target.closest &&
        e.target.closest(
          '.zoom-controls, .brand-manual__nav, .brand-manual__rail, .brand-manual__top, button, a'
        )
      ) {
        return;
      }
      var r = frame.getBoundingClientRect();
      var x = e.clientX - r.left;
      if (x < r.width * 0.18) prevSpread();
      else if (x > r.width * 0.82) nextSpread();
    });
  }

  if (zoomStage) {
    zoomStage.addEventListener(
      'touchstart',
      function (e) {
        if (!open || isZoomed()) return;
        if (!e.changedTouches || !e.changedTouches[0]) return;
        touchX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    zoomStage.addEventListener(
      'touchend',
      function (e) {
        if (touchX == null || !open || isZoomed()) return;
        if (!e.changedTouches || !e.changedTouches[0]) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) < 48) return;
        if (dx < 0) nextSpread();
        else prevSpread();
      },
      { passive: true }
    );
  }

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
        closeBrandManual();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (!isZoomed()) nextSpread();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (!isZoomed()) prevSpread();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(spreadCount - 1);
      } else if (e.key === '+' || e.key === '=') {
        if (mediaZoom && mediaZoom.zoomBy) mediaZoom.zoomBy(1);
      } else if (e.key === '-' || e.key === '_') {
        if (mediaZoom && mediaZoom.zoomBy) mediaZoom.zoomBy(-1);
      }
    },
    true
  );

  window.addEventListener('resize', function () {
    if (open) scheduleFit();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
      if (open) scheduleFit();
    });
  }

  window.openBrandManual = openBrandManual;
  window.closeBrandManual = closeBrandManual;
})();
