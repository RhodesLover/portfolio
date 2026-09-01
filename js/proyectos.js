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

/* Desc helper: emoji/heart at full opacity (proyectos page has no main.js) */
(function (w) {
  if (w.setDescWithFullEmoji) return;
  w.setDescWithFullEmoji = function (el, text) {
    if (!el) return;
    var s = text == null ? '' : String(text);
    if (!s) {
      el.textContent = '';
      return;
    }
    var re = /(\u2764\uFE0F|\u2764|\u2665\uFE0F|\u2665|\uD83D[\uDC93-\uDC9F\uDDA4]|\uD83E\uDDE1)/g;
    if (!re.test(s)) {
      el.textContent = s;
      return;
    }
    re.lastIndex = 0;
    var html = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(re, '<span class="emoji-full" aria-hidden="false">$1</span>');
        el.innerHTML = html;
      };
    })(window);

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
  let galleryState = { list: [], idx: 0, chrome: null, _bound: false };
    (function initGalleryChrome() {
      // Host fijo: NUNCA montar en #pgViewerActions (openViewer hace innerHTML='' y borra el carrusel)
      var host =
        document.getElementById('pgViewerGallery') ||
        document.querySelector('.pg-viewer__info') ||
        document.getElementById('pgViewerActions');
      var ens = typeof ensureGalleryChrome === 'function' ? ensureGalleryChrome : window.ensureGalleryChrome;
      if (ens && host) {
        galleryState.chrome = ens(host, { nav: 'pgGalleryNav', label: 'pgGalleryLabel', dots: 'pgGalleryDots' });
      }
    })();

  // chrome host: actions area under info


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

  function isProcessYoutube(src) {
        var s = String(src || '');
        return /^yt:/i.test(s) || /youtube\.com|youtu\.be/i.test(s);
      }

      function youtubeId(src) {
        var s = String(src || '').trim();
        if (/^yt:/i.test(s)) return s.slice(3).trim();
        var m = s.match(/[?&]v=([\w-]{6,})/) || s.match(/youtu\.be\/([\w-]{6,})/) || s.match(/embed\/([\w-]{6,})/);
        return m ? m[1] : '';
      }

      function ensureProcessFrame() {
        var fr = document.getElementById('pgViewerProcess');
        if (fr) return fr;
        if (!zoomStage) return null;
        fr = document.createElement('iframe');
        fr.id = 'pgViewerProcess';
        fr.className = 'pg-viewer__process';
        fr.title = 'Proceso';
        fr.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        fr.setAttribute('allowfullscreen', '');
        fr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        fr.hidden = true;
        // Keep overlay on top of process media
        var ov = document.getElementById('pgGalOverlay');
        if (ov && ov.parentNode === zoomStage) zoomStage.insertBefore(fr, ov);
        else zoomStage.appendChild(fr);
        return fr;
      }

      function hideProcessFrame() {
        var fr = document.getElementById('pgViewerProcess');
        if (!fr) return;
        fr.hidden = true;
        fr.style.display = 'none';
        try { fr.src = 'about:blank'; } catch (e) {}
      }

      function showProcessMedia(src, stillSrc) {
        var fr = ensureProcessFrame();
        if (isProcessYoutube(src)) {
          try { vVideo.pause(); } catch (e) {}
          vVideo.removeAttribute('src');
          try { vVideo.load(); } catch (e) {}
          vVideo.style.display = 'none';
          vImg.style.display = 'none';
          if (fr) {
            var id = youtubeId(src);
            var url = id ? ('https://www.youtube.com/embed/' + id + '?rel=0') : '';
            fr.hidden = false;
            fr.style.display = 'block';
            if (url && fr.getAttribute('src') !== url) fr.src = url;
            if (zoomStage) {
              zoomStage.style.aspectRatio = '16 / 9';
              zoomStage.classList.add('is-fitted');
            }
          }
          if (mediaZoom) mediaZoom.setEnabled(false);
          setVideoFill(false);
          return;
        }
        hideProcessFrame();
        vImg.style.display = 'none';
        vVideo.style.display = 'block';
        if (stillSrc) vVideo.poster = stillSrc;
        vVideo.muted = false;
        if (vVideo.getAttribute('src') !== src) vVideo.src = src;
        else {
          try { vVideo.currentTime = 0; } catch (e) {}
        }
        var onMetaP = function () {
          fitStageToMedia(vVideo);
          vVideo.removeEventListener('loadedmetadata', onMetaP);
        };
        vVideo.addEventListener('loadedmetadata', onMetaP);
        if (vVideo.readyState >= 1) fitStageToMedia(vVideo);
        setVideoFill(false);
        vVideo.play().catch(function () {});
        if (mediaZoom) mediaZoom.setEnabled(false);
      }

      function clearViewerMedia() {
        vVideo.pause();
        try { vVideo.muted = false; } catch (e) {}
        vVideo.removeAttribute('src');
        vVideo.load();
        vVideo.style.display = 'none';
        vImg.removeAttribute('src');
        vImg.style.display = 'none';
        hideProcessFrame();
        if (mediaZoom) mediaZoom.setEnabled(false);
        setVideoFill(false);
        if (zoomStage) {
          zoomStage.style.aspectRatio = '';
          zoomStage.style.removeProperty('--media-ar');
          zoomStage.classList.remove('is-fitted', 'is-video-fill');
        }
        var ov = document.getElementById('pgGalOverlay');
        if (ov) {
          ov.hidden = true;
          ov.classList.remove('is-on');
          var bp = ov.querySelector('[data-gal="-1"]');
          var bn = ov.querySelector('[data-gal="1"]');
          if (bp) bp.hidden = false;
          if (bn) bn.hidden = false;
        }
      }


  function parseGallery(el) {
    if (!el) return [];
    var raw = el.dataset.gallery || el.getAttribute('data-gallery') || '';
    var list = raw
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (!list.length) {
      var one = el.dataset.media || el.getAttribute('data-media') || '';
      if (one) list = [one];
    }
    return list;
  }

  function galleryLabel(src, idx, total) {
    var s = String(src || '').toLowerCase();
    if (s.indexOf('label-front') !== -1 || s.indexOf('frente') !== -1) return 'Etiqueta frente';
    if (s.indexOf('label-back') !== -1 || s.indexOf('trasera') !== -1 || s.indexOf('dorso') !== -1) return 'Etiqueta dorso';
    return 'Imagen ' + (idx + 1) + ' / ' + total;
  }

  function ensureGalleryChrome(host, ids) {
    if (!host) return null;
    var navId = ids.nav;
    var labelId = ids.label;
    var dotsId = ids.dots;
    var nav = document.getElementById(navId);
    if (!nav) {
      nav = document.createElement('div');
      nav.className = 'viewer-gallery-nav';
      nav.id = navId;
      nav.innerHTML =
        '<button type="button" class="viewer-gallery-nav__btn" data-gal="-1" aria-label="Anterior">‹</button>' +
        '<span class="viewer-gallery-nav__label" id="' + labelId + '"></span>' +
        '<button type="button" class="viewer-gallery-nav__btn" data-gal="1" aria-label="Siguiente">›</button>';
      host.appendChild(nav);
    }
    var dots = document.getElementById(dotsId);
    if (!dots) {
      dots = document.createElement('div');
      dots.className = 'viewer-gallery-dots';
      dots.id = dotsId;
      host.appendChild(dots);
    }
    return { nav: nav, label: document.getElementById(labelId), dots: dots };
  }

  function bindGallery(state) {
      if (state._bound) return;
      state._bound = true;
      function step(d) {
        if (!state.list || state.list.length < 2 || !d) return;
        // no wrap: stop at edges
        var next = state.idx + d;
        if (next < 0 || next >= state.list.length) return;
        state.idx = next;
        state.render();
      }
      var nav = state.chrome && state.chrome.nav;
      if (nav) {
        nav.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-gal]');
          if (!btn || !state.list || state.list.length < 2) return;
          var d = parseInt(btn.getAttribute('data-gal'), 10) || 0;
          step(d);
        });
      }
      var ov = document.getElementById('pgGalOverlay');
      if (ov && !ov._galBound) {
        ov._galBound = true;
        ov.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-gal]');
          if (!btn || !state.list || state.list.length < 2) return;
          e.preventDefault();
          e.stopPropagation();
          var d = parseInt(btn.getAttribute('data-gal'), 10) || 0;
          step(d);
        });
      }
    }

    function setGallery(state, list, onShow, opts) {
      state.list = list || [];
      state.idx = 0;
      state.onShow = onShow;
      state.overlay = !!(opts && opts.overlay);
      state.render = function () {
        var list = state.list || [];
        var multi = list.length > 1;
        var useOverlay = multi && state.overlay;
        if (state.chrome && state.chrome.nav) {
          // panel nav only when multi AND not image-overlay mode
          state.chrome.nav.classList.toggle('is-on', multi && !useOverlay);
        }
        if (state.chrome && state.chrome.dots) {
          state.chrome.dots.classList.toggle('is-on', multi);
          state.chrome.dots.innerHTML = '';
          if (multi) {
            list.forEach(function (_, i) {
              var b = document.createElement('button');
              b.type = 'button';
              b.setAttribute('aria-label', 'Ir a imagen ' + (i + 1));
              if (i === state.idx) b.classList.add('is-active');
              b.addEventListener('click', function () {
                state.idx = i;
                state.render();
              });
              state.chrome.dots.appendChild(b);
            });
          }
        }
        if (state.chrome && state.chrome.label) {
          var src = list[state.idx] || '';
          state.chrome.label.textContent = multi && !useOverlay ? galleryLabel(src, state.idx, list.length) : (multi ? galleryLabel(src, state.idx, list.length) : '');
        }
        var ov = document.getElementById('pgGalOverlay');
        if (ov) {
          if (useOverlay) {
            ov.hidden = false;
            ov.classList.add('is-on');
            var bp = ov.querySelector('[data-gal="-1"]');
            var bn = ov.querySelector('[data-gal="1"]');
            // first: no left; last: no right
            if (bp) bp.hidden = state.idx <= 0;
            if (bn) bn.hidden = state.idx >= list.length - 1;
          } else {
            ov.hidden = true;
            ov.classList.remove('is-on');
          }
        }
        if (typeof state.onShow === 'function') state.onShow(list[state.idx] || '', state.idx, list);
      };
      bindGallery(state);
      state.render();
    }

  window.parseGallery = parseGallery;
  window.setGallery = setGallery;
  window.ensureGalleryChrome = ensureGalleryChrome;
  window.galleryLabel = galleryLabel;

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
    const galleryList = parseGallery(cell);
    const media0 = galleryList[0] || media || '';

    const poster = cell.dataset.poster || '';
    const extraVideo = cell.dataset.video || '';
    const idxLabel = cell.querySelector('.pg-cell__idx');

    clearViewerMedia();

    // Imagen/poster primero. Si es video nativo (redes), abre video.
    // Piezas con data-video (Fly Moon / Tokyo) abren el still y el motion es opt-in.
    if (type === 'video') {
          vVideo.style.display = 'block';
          if (poster) vVideo.poster = poster;
          vVideo.muted = false;
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
          var useOverlay = cell.dataset.galleryOverlay === '1' || cell.dataset.galleryOverlay === 'true';
          setGallery(galleryState, galleryList.length ? galleryList : [media0 || media || ''], function (src) {
          if (!src) {
            vImg.removeAttribute('src');
            vImg.style.display = 'none';
            return;
          }
          vImg.style.display = 'block';
          vImg.src = src;
          vImg.alt = title;
          const onGalLoad = function () {
            if (typeof fitStageToMedia === 'function') fitStageToMedia(vImg);
            vImg.removeEventListener('load', onGalLoad);
          };
          vImg.addEventListener('load', onGalLoad);
          if (vImg.complete && vImg.naturalWidth && typeof fitStageToMedia === 'function') fitStageToMedia(vImg);
          if (typeof viewerZoom !== 'undefined' && viewerZoom) {
            try { if (viewerZoom.reset) viewerZoom.reset(); } catch (e) {}
            try { if (viewerZoom.setEnabled) viewerZoom.setEnabled(true); } catch (e) {}
          } else if (typeof pgZoom !== 'undefined' && pgZoom) {
            try { if (pgZoom.reset) pgZoom.reset(); } catch (e) {}
            try { if (pgZoom.setEnabled) pgZoom.setEnabled(true); } catch (e) {}
          }
        }, { overlay: useOverlay });
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
        if (window.setDescWithFullEmoji) window.setDescWithFullEmoji(vDesc, desc);
        else vDesc.textContent = desc;
        vIdx.textContent = idxLabel ? idxLabel.textContent : String(currentIndex + 1).padStart(2, '0');

    vActions.innerHTML = '';
        // CTAs van a #pgViewerActions; el carrusel vive en #pgViewerGallery (no se borra acá)
        const isRedes = (cell.dataset.section === 'redes') || (cat || '').indexOf('Social') === 0;
    const figmaProto = cell.dataset.figmaProto || '';
    const cartaDir = cell.dataset.carta || '';
        const cartaPages = cell.dataset.cartaPages || '';
        const revistaDir = cell.dataset.revista || '';
                const revistaPages = cell.dataset.revistaPages || '';
                const manualDir = cell.dataset.manual || '';
                const manualPages = cell.dataset.manualPages || '';
                const cdDir = cell.dataset.cd || '';
                const bottleDir = cell.dataset.bottle || '';
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
        } else if (revistaDir && (typeof window.openRevista === 'function' || typeof window.openCartaRevista === 'function')) {
                  const b = document.createElement('button');
                  b.type = 'button';
                  b.className = 'pg-viewer__link';
                  b.textContent = 'Ver revista →';
                  b.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const open =
                      typeof window.openRevista === 'function'
                        ? window.openRevista
                        : function (dir, t, n) {
                            window.openCartaRevista(dir, t, n, { kind: 'revista', size: 'large' });
                          };
                    open(revistaDir, title || 'Revista', revistaPages);
                  });
                  vActions.appendChild(b);
                } else if (cdDir && typeof window.openCdCase === 'function') {
                                  const b = document.createElement('button');
                                  b.type = 'button';
                                  // Pack Desembarco: naranja (resto del portfolio = rosa pastel)
                                  b.className = 'pg-viewer__link pg-viewer__link--pack';
                                  b.textContent = 'Ver caja de CD →';
                                  b.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.openCdCase({ dir: cdDir, title: title || 'Desembarco — CD' });
                                  });
                                  vActions.appendChild(b);
                                } else if (bottleDir && typeof window.openBottle3d === 'function') {
                                  const b = document.createElement('button');
                                  b.type = 'button';
                                  // Pack Fernet: naranja (resto del portfolio = rosa pastel)
                                  b.className = 'pg-viewer__link pg-viewer__link--pack';
                                  b.textContent = 'Ver botella →';
                                  b.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.openBottle3d({ dir: bottleDir, title: title || 'Fernet Cordobita' });
                                  });
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
          // Motion / proceso / still: se puede volver a cualquiera (no se deshabilitan)
          const processVideo = cell.dataset.process || '';
          const stillSrc = media0 || media || '';
          const btnMotion = document.createElement('button');
          btnMotion.type = 'button';
          btnMotion.className = 'pg-viewer__link pg-viewer__link--ghost';
          btnMotion.textContent = 'Ver motion →';
          btnMotion.dataset.mediaMode = 'motion';
          let btnProcess = null;
          if (processVideo) {
            btnProcess = document.createElement('button');
            btnProcess.type = 'button';
            btnProcess.className = 'pg-viewer__link pg-viewer__link--ghost';
            btnProcess.textContent = 'Ver proceso →';
            btnProcess.dataset.mediaMode = 'process';
          }
          const btnStill = document.createElement('button');
          btnStill.type = 'button';
          btnStill.className = 'pg-viewer__link pg-viewer__link--ghost';
          btnStill.textContent = 'Ver imagen →';
          btnStill.dataset.mediaMode = 'still';
          btnStill.hidden = true;

          function setMediaMode(mode) {
            var isStill = mode === 'still';
            var isMotion = mode === 'motion';
            var isProcess = mode === 'process';
            if (isStill) {
                          try { vVideo.pause(); } catch (e) {}
                          vVideo.removeAttribute('src');
                          try { vVideo.load(); } catch (e) {}
                          vVideo.style.display = 'none';
                          hideProcessFrame();
                          if (stillSrc) {
                            vImg.style.display = 'block';
                            if (vImg.getAttribute('src') !== stillSrc) vImg.src = stillSrc;
                            var onStill = function () {
                              if (typeof fitStageToMedia === 'function') fitStageToMedia(vImg);
                              vImg.removeEventListener('load', onStill);
                            };
                            vImg.addEventListener('load', onStill);
                            if (vImg.complete && vImg.naturalWidth && typeof fitStageToMedia === 'function') fitStageToMedia(vImg);
                          }
                          if (mediaZoom) mediaZoom.setEnabled(!!stillSrc);
                          setVideoFill(false);
                        } else {
                          var src = isProcess ? processVideo : extraVideo;
                          if (isProcess) {
                            showProcessMedia(src, stillSrc);
                          } else {
                            hideProcessFrame();
                            if (vImg.naturalWidth && vImg.naturalHeight && zoomStage) fitStageToMedia(vImg);
                            vImg.style.display = 'none';
                            vVideo.style.display = 'block';
                            if (stillSrc) vVideo.poster = stillSrc;
                            vVideo.muted = false;
                            if (vVideo.getAttribute('src') !== src) vVideo.src = src;
                            else {
                              try { vVideo.currentTime = 0; } catch (e) {}
                            }
                            var onMeta = function () {
                              fitStageToMedia(vVideo);
                              vVideo.removeEventListener('loadedmetadata', onMeta);
                            };
                            vVideo.addEventListener('loadedmetadata', onMeta);
                            if (vVideo.readyState >= 1) fitStageToMedia(vVideo);
                            setVideoFill(false);
                            vVideo.play().catch(function () {});
                            if (mediaZoom) mediaZoom.setEnabled(false);
                          }
                        }
            btnMotion.classList.toggle('is-active', isMotion);
            btnMotion.textContent = isMotion ? 'Motion' : 'Ver motion →';
            btnStill.hidden = isStill;
            btnStill.classList.toggle('is-active', isStill);
            if (btnProcess) {
              btnProcess.classList.toggle('is-active', isProcess);
              btnProcess.textContent = isProcess ? 'Proceso' : 'Ver proceso →';
            }
          }

          btnMotion.addEventListener('click', function () { setMediaMode('motion'); });
          btnStill.addEventListener('click', function () { setMediaMode('still'); });
          if (btnProcess) btnProcess.addEventListener('click', function () { setMediaMode('process'); });
          vActions.appendChild(btnMotion);
          if (btnProcess) vActions.appendChild(btnProcess);
          vActions.appendChild(btnStill);
        } else {
          const processVideo = cell.dataset.process || '';
          if (processVideo && type !== 'video') {
            const stillSrc = media0 || media || '';
            const bp = document.createElement('button');
            bp.type = 'button';
            bp.className = 'pg-viewer__link pg-viewer__link--ghost';
            bp.textContent = 'Ver proceso →';
            const bs = document.createElement('button');
            bs.type = 'button';
            bs.className = 'pg-viewer__link pg-viewer__link--ghost';
            bs.textContent = 'Ver imagen →';
            bs.hidden = true;
            function setProcMode(mode) {
                          if (mode === 'still') {
                            try { vVideo.pause(); } catch (e) {}
                            vVideo.removeAttribute('src');
                            try { vVideo.load(); } catch (e) {}
                            vVideo.style.display = 'none';
                            hideProcessFrame();
                            if (stillSrc) {
                              vImg.style.display = 'block';
                              if (vImg.getAttribute('src') !== stillSrc) vImg.src = stillSrc;
                              if (vImg.complete && vImg.naturalWidth) fitStageToMedia(vImg);
                            }
                            if (mediaZoom) mediaZoom.setEnabled(!!stillSrc);
                            bp.classList.remove('is-active');
                            bp.textContent = 'Ver proceso →';
                            bs.hidden = true;
                          } else {
                            showProcessMedia(processVideo, stillSrc);
                            bp.classList.add('is-active');
                            bp.textContent = 'Proceso';
                            bs.hidden = false;
                          }
                        }
            bp.addEventListener('click', function () { setProcMode('process'); });
            bs.addEventListener('click', function () { setProcMode('still'); });
            vActions.appendChild(bp);
            vActions.appendChild(bs);
          }
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
    if (galleryState) {
      galleryState.list = [];
      galleryState.idx = 0;
      if (galleryState.chrome && galleryState.chrome.nav) galleryState.chrome.nav.classList.remove('is-on');
      if (galleryState.chrome && galleryState.chrome.dots) {
        galleryState.chrome.dots.classList.remove('is-on');
        galleryState.chrome.dots.innerHTML = '';
      }
      if (galleryState.chrome && galleryState.chrome.label) galleryState.chrome.label.textContent = '';
    }
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
