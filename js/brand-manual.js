/* ============================================================
   BRAND MANUAL — spreads planos (NO flip 3D / NO revista-carta)
   Prioridad: ver el diseño y el detalle del manual.
   - Páginas landscape en pliegos 1|2, 3|4…
   - Crossfade suave entre pliegos
   - Zoom/pan compartido (createMediaZoom) para detalle
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
  var zoomStage = document.getElementById('brandManualZoomStage');
  var zoomControls = document.getElementById('brandManualZoomControls');
  var zoomLevel = document.getElementById('brandManualZoomLevel');
  var spreadEl = document.getElementById('brandManualSpread');
  var imgLeft = document.getElementById('brandManualImgLeft');
  var imgRight = document.getElementById('brandManualImgRight');
  var prevBtn = document.getElementById('brandManualPrev');
  var nextBtn = document.getElementById('brandManualNext');
  var dotsEl = document.getElementById('brandManualDots');
  var stripEl = document.getElementById('brandManualStrip');

  var open = false;
  var pages = [];
  var spreadIndex = 0; // 0-based spread
  var spreadCount = 0;
  var touchX = null;
  var preloadDone = {};

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

  function setOpen(on) {
    open = !!on;
    root.classList.toggle('is-open', open);
    root.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('brand-manual-open', open);
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
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
          'Págs. ' + pair.leftNum + '–' + pair.rightNum + ' / ' + pages.length;
      } else {
        counterEl.textContent = 'Pág. ' + pair.leftNum + ' / ' + pages.length;
      }
    }
    if (prevBtn) prevBtn.disabled = spreadIndex <= 0;
    if (nextBtn) nextBtn.disabled = spreadIndex >= spreadCount - 1;
    if (dotsEl) {
      var dots = dotsEl.querySelectorAll('button');
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('is-active', i === spreadIndex);
        dots[i].setAttribute('aria-current', i === spreadIndex ? 'true' : 'false');
      }
    }
    if (stripEl) {
      var thumbs = stripEl.querySelectorAll('.brand-manual__thumb');
      for (var t = 0; t < thumbs.length; t++) {
        thumbs[t].classList.toggle('is-active', t === spreadIndex);
      }
      var active = stripEl.querySelector('.brand-manual__thumb.is-active');
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
      imgLeft.alt = 'Página ' + pair.leftNum;
      if (imgRight) {
        if (pair.hasRight) {
          imgRight.hidden = false;
          imgRight.src = pair.right;
          imgRight.alt = 'Página ' + pair.rightNum;
          if (spreadEl) spreadEl.classList.remove('is-single');
        } else {
          imgRight.removeAttribute('src');
          imgRight.alt = '';
          imgRight.hidden = true;
          if (spreadEl) spreadEl.classList.add('is-single');
        }
      }
      if (spreadEl) {
        spreadEl.classList.toggle('is-single', !pair.hasRight);
      }
    }

    if (animate && spreadEl) {
      spreadEl.classList.add('is-fading');
      window.setTimeout(function () {
        apply();
        spreadEl.classList.remove('is-fading');
      }, 140);
    } else {
      apply();
    }
    preloadAround(si);
    updateChrome();
  }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    for (var i = 0; i < spreadCount; i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'brand-manual__dot';
        b.setAttribute('aria-label', 'Ir al pliego ' + (idx + 1));
        b.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          goTo(idx);
        });
        dotsEl.appendChild(b);
      })(i);
    }
  }

  function buildStrip() {
    if (!stripEl) return;
    stripEl.innerHTML = '';
    for (var i = 0; i < spreadCount; i++) {
      (function (idx) {
        var pair = pagePair(idx);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'brand-manual__thumb';
        btn.setAttribute(
          'aria-label',
          pair.hasRight
            ? 'Pliego páginas ' + pair.leftNum + ' y ' + pair.rightNum
            : 'Página ' + pair.leftNum
        );
        var img = document.createElement('img');
        img.src = pair.left;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        btn.appendChild(img);
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          goTo(idx);
        });
        stripEl.appendChild(btn);
      })(i);
    }
  }

  function goTo(si) {
    if (!pages.length) return;
    var next = Math.max(0, Math.min(spreadCount - 1, si));
    if (next === spreadIndex && open) {
      updateChrome();
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
    buildDots();
    buildStrip();
    paintSpread(0, false);
    setOpen(true);
    resetZoom();
    setZoomEnabled(true);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeBrandManual() {
    if (!open) return;
    setOpen(false);
    resetZoom();
    setZoomEnabled(false);
    // liberar memoria de imágenes grandes al cerrar
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
      prevSpread();
    });
  if (nextBtn)
    nextBtn.addEventListener('click', function (e) {
      e.preventDefault();
      nextSpread();
    });

  // click en bordes del stage (no sobre el spread) para navegar
  if (stage) {
    stage.addEventListener('click', function (e) {
      if (!open || isZoomed()) return;
      if (e.target.closest && e.target.closest('.brand-manual__spread, .zoom-controls, .brand-manual__controls, .brand-manual__strip, .brand-manual__meta, button, a')) {
        return;
      }
      var r = stage.getBoundingClientRect();
      var x = e.clientX - r.left;
      if (x < r.width * 0.22) prevSpread();
      else if (x > r.width * 0.78) nextSpread();
    });
  }

  // swipe
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
        nextSpread();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSpread();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(spreadCount - 1);
      }
    },
    true
  );

  window.openBrandManual = openBrandManual;
  window.closeBrandManual = closeBrandManual;
})();
