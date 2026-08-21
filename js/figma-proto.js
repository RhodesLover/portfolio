/* ============================================================
   FIGMA PROTO — fullscreen + blur de página
   API: window.openFigmaProto(url) / window.closeFigmaProto()
   ============================================================ */
(function () {
  'use strict';

  const root = document.getElementById('figmaProto');
  if (!root) return;

  const backdrop = document.getElementById('figmaProtoBackdrop');
  const closeBtn = document.getElementById('figmaProtoClose');
  const frame = document.getElementById('figmaProtoFrame');
  let open = false;
  let lastUrl = '';

  /**
   * Clean Figma embed URL so the visitor sees only the prototype:
   * - hide-ui=1 removes the bottom Figma bar (file name / edited…)
   * - keep embed-host=share
   * - prefer scale-down so the device fills the viewport as much as possible
   * Still an iframe — interaction stays fully on Figma's side.
   */
  function normalizeFigmaEmbedUrl(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    var url = raw.trim();
    try {
      var u = new URL(url, window.location.href);
      var host = (u.hostname || '').toLowerCase();
      var isFigma =
        host === 'www.figma.com' ||
        host === 'figma.com' ||
        host === 'embed.figma.com' ||
        host.endsWith('.figma.com');
      if (!isFigma) return url;

      // Prefer the embed host when given a /proto/ share path on www
      if ((host === 'www.figma.com' || host === 'figma.com') && /\/proto\//i.test(u.pathname)) {
        u.hostname = 'embed.figma.com';
      }

      u.searchParams.set('hide-ui', '1');
      u.searchParams.set('embed-host', u.searchParams.get('embed-host') || 'share');

      // Maximize usable canvas inside the iframe while keeping proportions.
      // scale-down = fit entire frame in the available area (no crop).
      var scaling = (u.searchParams.get('scaling') || '').toLowerCase();
      if (!scaling || scaling === 'min-zoom') {
        u.searchParams.set('scaling', 'scale-down');
      }
      // fixed content-scaling keeps device chrome crisp; leave if already set
      if (!u.searchParams.has('content-scaling')) {
        u.searchParams.set('content-scaling', 'fixed');
      }

      // Strip leftovers that re-enable chrome when present
      u.searchParams.delete('show-proto-sidebar');
      u.searchParams.delete('hotspot-hints');
      u.searchParams.delete('hide-ui-new');

      return u.toString();
    } catch (err) {
      // Fallback string append if URL() fails
      if (!/[?&]hide-ui=/.test(url)) {
        url += (url.indexOf('?') >= 0 ? '&' : '?') + 'hide-ui=1';
      }
      return url;
    }
  }

  function setOpen(on) {
    open = !!on;
    root.classList.toggle('is-open', open);
    root.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('figma-proto-open', open);
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }

  function openFigmaProto(url) {
    if (!url || !frame) return;
    var clean = normalizeFigmaEmbedUrl(url);
    if (lastUrl !== clean) {
      frame.src = clean;
      lastUrl = clean;
    }
    setOpen(true);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeFigmaProto() {
    if (!open) return;
    setOpen(false);
    if (frame) {
      frame.src = 'about:blank';
      lastUrl = '';
    }
    var viewerOpen = document.body.classList.contains('pg-viewer-open');
    var modalOpen = document.body.classList.contains('modal-open');
    if (!viewerOpen && !modalOpen) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeFigmaProto);
  // backdrop click: only if target is backdrop (iframe covers full screen, so rare)
  if (backdrop) {
    backdrop.addEventListener('click', closeFigmaProto);
  }

  document.addEventListener(
    'keydown',
    function (e) {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeFigmaProto();
      }
    },
    true
  );

  window.openFigmaProto = openFigmaProto;
  window.closeFigmaProto = closeFigmaProto;
  window.__normalizeFigmaEmbedUrl = normalizeFigmaEmbedUrl;
})();
