/* ============================================================
   EDITORIAL WORK SEQUENCE
   Grammar: ENTER → FOCUS → EXIT (scroll = direction)
   Composition unit: image + title + meta move together
   No helix, no particles, no decorative FX
   ============================================================ */
(function () {
  'use strict';

  const root = document.querySelector('[data-ed-work]');
  if (!root) return;

  const track = document.getElementById('edTrack');
  const scenes = Array.from(root.querySelectorAll('.ed-scene'));
  const bar = document.getElementById('edProgress');
  if (!track || !scenes.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // Each scene gets a long sticky runway so focus can breathe
  const RUN_VH = isCoarse ? 1.15 : 1.35;

  function setRunway() {
    const vh = window.innerHeight;
    // intro height + per-scene runway
    const intro = root.querySelector('.ed-work__intro');
    const introH = intro ? intro.offsetHeight : 0;
    const run = Math.round(vh * RUN_VH * scenes.length);
    root.style.setProperty('--ed-run', run + 'px');
    root.style.minHeight = introH + run + vh * 0.15 + 'px';
  }

  // Map global section progress 0..1 → active scene + local t 0..1
  function sectionProgress() {
    const rect = root.getBoundingClientRect();
    const total = Math.max(1, root.offsetHeight - window.innerHeight);
    const scrolled = Math.max(0, Math.min(total, -rect.top));
    return scrolled / total;
  }

  // Ease helpers
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Layout-specific motion profiles (same system, different rhythm)
  function profileFor(layout, local) {
    // local 0..1 inside scene interval
    // phases: enter 0-0.28 | focus 0.28-0.72 | exit 0.72-1
    const enter = smoothstep(0.0, 0.28, local);
    const focus = smoothstep(0.22, 0.45, local) * (1 - smoothstep(0.68, 0.9, local));
    const exit = smoothstep(0.72, 1.0, local);
    const presence = clamp(enter * (1 - exit * 0.95) + focus * 0.15, 0, 1);

    // base: whole composition as one unit
    let y = lerp(72, 0, enter) + lerp(0, -64, exit);
    let x = 0;
    let scale = lerp(0.94, 1, enter) * lerp(1, 0.96, exit);
    let rot = 0;
    let opacity = clamp(presence, 0, 1);

    if (layout === 'L') {
      x = lerp(-48, 0, enter) + lerp(0, 36, exit);
    } else if (layout === 'R') {
      x = lerp(48, 0, enter) + lerp(0, -36, exit);
    } else if (layout === 'C') {
      y = lerp(56, 0, enter) + lerp(0, -48, exit);
      scale = lerp(0.9, 1.02, enter) * lerp(1.02, 0.94, exit);
    } else if (layout === 'T') {
      y = lerp(40, 0, enter) + lerp(0, -40, exit);
      x = lerp(-20, 0, enter);
      scale = lerp(0.96, 1, enter);
    }

    // calm hold at focus — almost still
    if (focus > 0.85 && !reduceMotion) {
      y *= 0.15;
      x *= 0.15;
    }

    return { x, y, scale, rot, opacity, focus, enter, exit };
  }

  let currentActive = -1;
  let raf = 0;
  let targetP = 0;
  let currentP = 0;

  function applyScene(el, local, isActive) {
    const layout = el.dataset.layout || 'L';
    const stage = el.querySelector('.ed-scene__stage');
    if (!stage) return;
    const m = reduceMotion
      ? { x: 0, y: 0, scale: 1, rot: 0, opacity: isActive ? 1 : 0.15, focus: isActive ? 1 : 0 }
      : profileFor(layout, local);

    stage.style.opacity = String(m.opacity);
    stage.style.transform =
      'translate3d(' +
      m.x.toFixed(2) +
      'px,' +
      m.y.toFixed(2) +
      'px,0) scale(' +
      m.scale.toFixed(4) +
      ')';
    el.classList.toggle('is-active', isActive);
    el.classList.toggle('is-focus', m.focus > 0.55);
    el.setAttribute('aria-hidden', isActive || m.opacity > 0.2 ? 'false' : 'true');

    // video only when near focus
    const v = el.querySelector('video');
    if (v) {
      if (isActive && m.focus > 0.35) v.play().catch(function () {});
      else v.pause();
    }
  }

  function render() {
    raf = requestAnimationFrame(render);
    targetP = sectionProgress();
    if (reduceMotion) currentP = targetP;
    else currentP += (targetP - currentP) * 0.08;

    if (bar) bar.style.transform = 'scaleX(' + clamp(currentP, 0, 1).toFixed(4) + ')';

    const n = scenes.length;
    // progress spans all scenes evenly
    const pos = currentP * n;
    const active = clamp(Math.floor(pos), 0, n - 1);
    const local = pos - active;

    scenes.forEach(function (el, i) {
      let localT;
      if (i === active) localT = local;
      else if (i === active - 1) localT = 1 + local; // still exiting slightly overlaid? keep exit complete
      else if (i < active) localT = 1;
      else localT = 0;

      // allow slight anticipation: next scene starts early
      if (i === active + 1) {
        localT = clamp((local - 0.72) / 0.28, 0, 0.35);
      }
      if (i === active - 1 && local < 0.2) {
        // previous still faintly leaving
        localT = clamp(0.85 + local, 0.85, 1);
      }

      applyScene(el, clamp(localT, 0, 1), i === active);
    });

    if (active !== currentActive) {
      currentActive = active;
      root.dataset.active = String(active);
    }
  }

  // Click / keyboard open — let main.js modal system handle via project-card
  scenes.forEach(function (el) {
    const openBtn = el.querySelector('.ed-scene__open');
    if (openBtn) {
      openBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        el.click();
      });
    }
  });

  // Intersection soft for intro header
  const intro = root.querySelector('.ed-work__intro');
  if (intro && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) intro.classList.add('is-in');
        });
      },
      { threshold: 0.35 }
    );
    io.observe(intro);
  } else if (intro) {
    intro.classList.add('is-in');
  }

  function onResize() {
    setRunway();
  }

  setRunway();
  window.addEventListener('resize', onResize);
  raf = requestAnimationFrame(render);

  // expose for debug
  window.__ED_WORK__ = {
    scenes: scenes.length,
    progress: function () {
      return currentP;
    },
  };
})();
