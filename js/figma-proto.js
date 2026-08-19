/* ============================================================
   FIGMA PROTO — overlay blur + iframe centrado (sin marco phone)
   API: window.openFigmaProto(url, title?) / window.closeFigmaProto()
   ============================================================ */
(function () {
  'use strict';

  const root = document.getElementById('figmaProto');
  if (!root) return;

  const backdrop = document.getElementById('figmaProtoBackdrop');
  const closeBtn = document.getElementById('figmaProtoClose');
  const frame = document.getElementById('figmaProtoFrame');
  const label = document.getElementById('figmaProtoLabel');
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
    // Si el viewer/modal sigue abierto, no devolvemos el scroll al body.
    // close() deja que el viewer padre mantenga el lock.
  }

  function openFigmaProto(url, title) {
    if (!url || !frame) return;
    if (label) {
      const name = (title || '').trim();
      label.textContent = name ? (name + ' · Prototipo Instagram') : 'Prototipo · Instagram';
    }
    // Solo recargar si cambió la URL (evita flash al reabrir el mismo)
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
    // Liberar el iframe al cerrar (CPU/red). La próxima apertura rehidrata src.
    if (frame) {
      frame.src = 'about:blank';
      lastUrl = '';
    }
    // Restaurar scroll solo si no hay otro overlay abierto
    const viewerOpen = document.body.classList.contains('pg-viewer-open');
    const modalOpen = document.body.classList.contains('modal-open');
    if (!viewerOpen && !modalOpen) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeFigmaProto);
  if (backdrop) backdrop.addEventListener('click', closeFigmaProto);

  // Capture: Esc cierra el proto ANTES que el viewer/modal de abajo
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
