/* ============================================================
   WORK ORBIT — scroll spiral (Active Theory feel, CSS/JS light)
   ============================================================ */
(function () {
  'use strict';

  const section = document.querySelector('.work-orbit');
  if (!section) return;

  const ring = document.getElementById('orbitRing');
  const items = Array.from(section.querySelectorAll('.spiral__item'));
  const progressBar = document.getElementById('orbitProgress');
  const idxEl = document.getElementById('orbitIndex');
  const focusCat = document.getElementById('orbitFocusCat');
  const focusTitle = document.getElementById('orbitFocusTitle');
  const focusDesc = document.getElementById('orbitFocusDesc');
  const openBtn = document.getElementById('orbitOpenBtn');
  const stage = document.getElementById('orbitStage');

  if (!ring || !items.length) return;

  const N = items.length;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  let active = 0;
  let raf = 0;
  let targetT = 0;
  let smoothT = 0;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function layoutMetrics() {
    const w = stage ? stage.clientWidth : window.innerWidth;
    const h = stage ? stage.clientHeight : window.innerHeight;
    const base = Math.min(w, h);
    // radius scales with viewport; keep cards readable
    const radius = clamp(base * (isCoarse ? 0.34 : 0.38), 140, 340);
    const cardW = clamp(base * 0.28, 150, 260);
    return { radius, cardW, w, h };
  }

  function sectionProgress() {
    const rect = section.getBoundingClientRect();
    const total = Math.max(1, section.offsetHeight - window.innerHeight);
    // when sticky starts, rect.top ~ 0; progress goes 0→1 while sticky holds
    const scrolled = clamp(-rect.top, 0, total);
    return scrolled / total;
  }

  function setFocus(i) {
    const item = items[i];
    if (!item) return;
    if (focusCat) focusCat.textContent = item.dataset.category || '';
    if (focusTitle) focusTitle.textContent = item.dataset.title || '';
    if (focusDesc) {
      const d = item.dataset.description || '';
      focusDesc.textContent = d.length > 140 ? d.slice(0, 137) + '…' : d;
    }
    if (idxEl) idxEl.textContent = String(i + 1).padStart(2, '0');
    items.forEach((el, k) => el.classList.toggle('is-active', k === i));
  }

  function place(t) {
    const { radius, cardW } = layoutMetrics();
    // full spiral turns while scrolling
    const turns = isCoarse ? 1.15 : 1.45;
    const baseAngle = -Math.PI / 2; // start top-center-ish
    const spread = Math.PI * 2 * turns;

    items.forEach((el, i) => {
      const u = i / N;
      // item's own angle offset by scroll t
      const ang = baseAngle + (u - t) * spread;
      // depth: items near active (u≈t) come forward
      const delta = u - t;
      // wrap-ish closeness on spiral path
      let d = Math.abs(delta);
      if (d > 0.5) d = 1 - d;
      const proximity = 1 - clamp(d * 2.4, 0, 1);

      const r = radius * (0.72 + (1 - proximity) * 0.38);
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r * 0.72; // elliptical for screen
      const z = (proximity - 0.5) * 220;
      const scale = 0.55 + proximity * 0.7;
      const opacity = 0.22 + proximity * 0.78;
      const blur = (1 - proximity) * 1.6;
      const rot = ang * (180 / Math.PI) * 0.08;

      el.style.width = cardW + 'px';
      el.style.zIndex = String(10 + Math.round(proximity * 100));
      el.style.opacity = String(opacity);
      el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : 'none';
      el.style.transform =
        `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), ${z.toFixed(2)}px)` +
        ` rotateZ(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.setProperty('--prox', proximity.toFixed(3));
    });

    if (progressBar) progressBar.style.transform = `scaleX(${clamp(t, 0, 1)})`;

    // nearest item to focus
    let best = 0;
    let bestD = 1e9;
    items.forEach((_, i) => {
      const u = i / N;
      let d = Math.abs(u - t);
      if (d > 0.5) d = 1 - d;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best !== active) {
      active = best;
      setFocus(active);
      // video hover-play style for active motion cards
      items.forEach((el, i) => {
        const v = el.querySelector('video');
        if (!v) return;
        if (i === active) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    }
  }

  function tick() {
    raf = 0;
    const p = sectionProgress();
    targetT = p;
    if (reduceMotion) {
      smoothT = targetT;
    } else {
      smoothT += (targetT - smoothT) * 0.12;
    }
    place(smoothT);
    if (Math.abs(targetT - smoothT) > 0.0008) {
      raf = requestAnimationFrame(tick);
    }
  }

  function requestTick() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // scroll height: sticky runway proportional to pieces
  function setRunway() {
    const vh = window.innerHeight;
    const run = Math.round(vh * (isCoarse ? 0.55 : 0.72) * N);
    section.style.setProperty('--orbit-run', run + 'px');
  }

  setRunway();
  setFocus(0);
  place(0);

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', () => {
    setRunway();
    place(smoothT);
  });

  // open focused piece
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const card = items[active];
      if (card) card.click();
    });
  }

  // keyboard: when section in view, arrows cycle focus by scrolling
  document.addEventListener('keydown', (e) => {
    const rect = section.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.3;
    if (!inView) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (document.body.classList.contains('modal-open')) return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = clamp(active + dir, 0, N - 1);
    const total = Math.max(1, section.offsetHeight - window.innerHeight);
    const y = section.offsetTop + (next / Math.max(1, N - 1)) * total;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  // loco-style line reveals inside orbit copy
  const revealEls = section.querySelectorAll('.loco-reveal, .loco-line');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // first paint after fonts/layout
  requestAnimationFrame(requestTick);
})();
