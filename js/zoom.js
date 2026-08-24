/* Shared media zoom for portfolio viewers (home modal + proyectos gallery) */
(function (global) {
  'use strict';

  function createMediaZoom(options) {
    const stage = options.stage;
    const target = options.target;
    const controls = options.controls || null;
    const levelEl = options.levelEl || null;
    const min = options.min || 1;
    const max = options.max || 4;
    const step = options.step || 0.25;
    const enableWheel = options.enableWheel !== false;

    if (!stage || !target) {
      return {
        reset: function () {},
        setEnabled: function () {},
        getScale: function () { return 1; },
        isZoomed: function () { return false; },
        zoomBy: function () {},
        destroy: function () {}
      };
    }

    let scale = 1;
    let tx = 0;
    let ty = 0;
    let enabled = false;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let pointers = new Map();
    let pinchStartDist = 0;
    let pinchStartScale = 1;

    function clamp(n, a, b) {
      return Math.max(a, Math.min(b, n));
    }

    /**
     * Limita el pan para que el target escalado no se salga del stage.
     * transform-origin: center + translate(tx,ty) scale(s)
     * → exceso por eje = max(0, (size*s - stage)/2)
     * offsetWidth/Height ignoran transform (a diferencia de getBoundingClientRect).
     */
    function clampPan() {
      if (scale <= min + 0.001) {
        tx = 0;
        ty = 0;
        return;
      }

      var sw = stage.clientWidth || 0;
      var sh = stage.clientHeight || 0;
      var tw = target.offsetWidth || 0;
      var th = target.offsetHeight || 0;

      // fallback si el layout aún no midió
      if (sw < 1 || sh < 1 || tw < 1 || th < 1) {
        var sr = stage.getBoundingClientRect();
        sw = sr.width || sw;
        sh = sr.height || sh;
        var prev = target.style.transform;
        target.style.transform = 'none';
        var tr = target.getBoundingClientRect();
        target.style.transform = prev;
        tw = tr.width || tw;
        th = tr.height || th;
      }

      var maxX = Math.max(0, (tw * scale - sw) / 2);
      var maxY = Math.max(0, (th * scale - sh) / 2);
      tx = clamp(tx, -maxX, maxX);
      ty = clamp(ty, -maxY, maxY);
    }

    function render() {
      clampPan();
      target.style.transform =
        'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + scale.toFixed(3) + ')';
      if (levelEl) levelEl.textContent = Math.round(scale * 100) + '%';
      stage.classList.toggle('is-zoomable', enabled && scale <= min + 0.001);
      stage.classList.toggle('is-panning', enabled && scale > min + 0.001);
      if (controls) {
        if (enabled) controls.removeAttribute('hidden');
        else controls.setAttribute('hidden', '');
      }
    }

    function reset() {
      scale = 1;
      tx = 0;
      ty = 0;
      dragging = false;
      pointers.clear();
      render();
    }

    function setEnabled(on) {
      enabled = !!on;
      if (!enabled) reset();
      else render();
    }

    function zoomBy(delta, originX, originY) {
      if (!enabled) return;
      const prev = scale;
      const next = clamp(prev + delta * step, min, max);
      if (Math.abs(next - prev) < 0.0001) return;

      // Keep visual point under cursor roughly stable
      if (typeof originX === 'number' && typeof originY === 'number') {
        const rect = stage.getBoundingClientRect();
        const cx = originX - rect.left - rect.width / 2;
        const cy = originY - rect.top - rect.height / 2;
        const ratio = next / prev;
        tx = cx - (cx - tx) * ratio;
        ty = cy - (cy - ty) * ratio;
      }

      scale = next;
      if (scale <= min + 0.001) {
        scale = min;
        tx = 0;
        ty = 0;
      }
      render();
    }

    function onWheel(e) {
      if (!enabled) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      zoomBy(dir, e.clientX, e.clientY);
    }

    function onPointerDown(e) {
      if (!enabled) return;
      if (e.target.closest && e.target.closest('.zoom-controls, button, a, video')) return;
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1 && scale > min + 0.001) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        // sin transición mientras se arrastra (evita lag + overshoot visual)
        target.style.transition = 'none';
      } else if (pointers.size === 2) {
        dragging = false;
        const pts = Array.from(pointers.values());
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        pinchStartDist = Math.hypot(dx, dy) || 1;
        pinchStartScale = scale;
      }
    }

    function onPointerMove(e) {
      if (!enabled) return;
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        const dist = Math.hypot(dx, dy) || 1;
        const next = clamp(pinchStartScale * (dist / pinchStartDist), min, max);
        scale = next;
        if (scale <= min + 0.001) {
          scale = min;
          tx = 0;
          ty = 0;
        }
        render();
        return;
      }

      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      tx += dx;
      ty += dy;
      render(); // clampPan dentro de render
    }

    function onPointerUp(e) {
      if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = 0;
      if (pointers.size === 0) {
        dragging = false;
        // restaurar transición suave del CSS
        target.style.transition = '';
        render();
      }
    }

    function onDblClick(e) {
      if (!enabled) return;
      if (e.target.closest && e.target.closest('.zoom-controls, button, a, video')) return;
      if (scale > min + 0.01) reset();
      else zoomBy((2 - scale) / step, e.clientX, e.clientY);
    }

    function onControlsClick(e) {
      const btn = e.target.closest('[data-zoom]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const val = Number(btn.getAttribute('data-zoom'));
      if (val === 0) reset();
      else zoomBy(val);
    }

    // si el stage cambia de tamaño (resize / fitBook), re-clampear
    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(function () {
        if (enabled) render();
      });
      ro.observe(stage);
      ro.observe(target);
    }

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('dblclick', onDblClick);
    if (controls) controls.addEventListener('click', onControlsClick);

    // allow external callers to opt out of stage wheel (e.g. magazine page-turn)
    if (!enableWheel) {
      stage.removeEventListener('wheel', onWheel);
    }

    render();

    return {
      reset: reset,
      setEnabled: setEnabled,
      getScale: function () { return scale; },
      isZoomed: function () { return scale > min + 0.001; },
      zoomBy: zoomBy,
      /** expuesto para tests / debug */
      _clampPan: clampPan,
      _getPan: function () { return { tx: tx, ty: ty, scale: scale }; },
      destroy: function () {
        if (ro) ro.disconnect();
        if (enableWheel) stage.removeEventListener('wheel', onWheel);
        stage.removeEventListener('pointerdown', onPointerDown);
        stage.removeEventListener('pointermove', onPointerMove);
        stage.removeEventListener('pointerup', onPointerUp);
        stage.removeEventListener('pointercancel', onPointerUp);
        stage.removeEventListener('dblclick', onDblClick);
        if (controls) controls.removeEventListener('click', onControlsClick);
      }
    };
  }

  global.createMediaZoom = createMediaZoom;
})(window);
