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
    if (lastUrl !== url) {
      frame.src = url;
      lastUrl = url;
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
    const viewerOpen = document.body.classList.contains('pg-viewer-open');
    const modalOpen = document.body.classList.contains('modal-open');
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
    (e) => {
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
})();
