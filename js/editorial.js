/* ============================================================
   EDITORIAL WORK — structured sequence (no stacking)
   One project per block in document flow.
   Scroll progress per scene: ENTER → FOCUS → EXIT
   ============================================================ */
(function () {
  'use strict';

  const root = document.querySelector('[data-ed-work]');
  if (!root) return;

  const scenes = Array.from(root.querySelectorAll('.ed-scene'));
  const bar = document.getElementById('edProgress');
  if (!scenes.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / Math.max(0.0001, e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /** local 0..1 = how far through this scene's own block */
  function sceneLocal(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const total = Math.max(1, el.offsetHeight - vh * 0.15);
    // when top hits ~15% viewport → start; when bottom leaves → end
    const scrolled = clamp(-rect.top + vh * 0.12, 0, total);
    return scrolled / total;
  }

  function profile(layout, local) {
    const enter = smoothstep(0.0, 0.22, local);
    const exit = smoothstep(0.78, 1.0, local);
    const focus = smoothstep(0.18, 0.38, local) * (1 - smoothstep(0.7, 0.88, local));
    const presence = clamp(enter * (1 - exit) + focus * 0.05, 0, 1);

    let y = lerp(36, 0, enter) + lerp(0, -28, exit);
    let x = 0;
    let scale = lerp(0.97, 1, enter);

    if (layout === 'L') x = lerp(-28, 0, enter);
    else if (layout === 'R') x = lerp(28, 0, enter);
    else if (layout === 'C') {
      y = lerp(28, 0, enter) + lerp(0, -20, exit);
      scale = lerp(0.96, 1, enter);
    } else if (layout === 'T') {
      y = lerp(24, 0, enter);
    }

    if (reduceMotion) {
      return { x: 0, y: 0, scale: 1, opacity: 1, focus: local > 0.15 && local < 0.9 ? 1 : 0 };
    }

    return {
      x,
      y,
      scale,
      opacity: clamp(0.35 + presence * 0.65, 0.35, 1),
      focus,
    };
  }

  let active = -1;
  let raf = 0;

  function render() {
    raf = requestAnimationFrame(render);
    const vh = window.innerHeight || 1;
    let best = 0;
    let bestScore = -1;

    scenes.forEach(function (el, i) {
      const local = sceneLocal(el);
      const layout = el.dataset.layout || 'L';
      const stage = el.querySelector('.ed-scene__stage');
      const m = profile(layout, local);

      if (stage) {
        stage.style.opacity = String(m.opacity);
        stage.style.transform =
          'translate3d(' +
          m.x.toFixed(2) +
          'px,' +
          m.y.toFixed(2) +
          'px,0) scale(' +
          m.scale.toFixed(4) +
          ')';
      }

      el.classList.toggle('is-focus', m.focus > 0.45);
      el.classList.toggle('is-active', false);

      // score by how centered the block is
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height * 0.4;
      const score = 1 - Math.abs(mid - vh * 0.45) / vh;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }

      const v = el.querySelector('video');
      if (v) {
        if (m.focus > 0.4) v.play().catch(function () {});
        else v.pause();
      }
    });

    if (scenes[best]) {
      scenes[best].classList.add('is-active');
      if (best !== active) {
        active = best;
        root.dataset.active = String(best);
      }
    }

    // overall progress bar
    if (bar) {
      const rootRect = root.getBoundingClientRect();
      const total = Math.max(1, root.offsetHeight - vh);
      const scrolled = clamp(-rootRect.top, 0, total);
      bar.style.transform = 'scaleX(' + (scrolled / total).toFixed(4) + ')';
    }
  }

  scenes.forEach(function (el) {
    const openBtn = el.querySelector('.ed-scene__open');
    if (openBtn) {
      openBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        el.click();
      });
    }
  });

  const intro = root.querySelector('.ed-work__intro');
  if (intro && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) intro.classList.add('is-in');
        });
      },
      { threshold: 0.3 }
    );
    io.observe(intro);
  } else if (intro) {
    intro.classList.add('is-in');
  }

  raf = requestAnimationFrame(render);
  window.__ED_WORK__ = {
    scenes: scenes.length,
    active: function () {
      return active;
    },
  };
})();
