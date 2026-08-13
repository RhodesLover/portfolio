/* ============================================================
   WORK ORBIT v2 — 3D spiral + particles/lights (AT-inspired)
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
  const fx = document.getElementById('orbitFx');

  if (!ring || !items.length || !stage) return;

  const N = items.length;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  let active = 0;
  let raf = 0;
  let targetT = 0;
  let smoothT = 0;
  let pointerX = 0;
  let pointerY = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  let time = 0;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function layoutMetrics() {
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    const base = Math.min(w, h);
    const radius = clamp(base * (isCoarse ? 0.36 : 0.42), 160, 390);
    const cardW = clamp(base * (isCoarse ? 0.3 : 0.27), 158, 280);
    return { radius, cardW, w, h, base };
  }

  function sectionProgress() {
    const rect = section.getBoundingClientRect();
    const total = Math.max(1, section.offsetHeight - window.innerHeight);
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
      focusDesc.textContent = d.length > 160 ? d.slice(0, 157) + '…' : d;
    }
    if (idxEl) idxEl.textContent = String(i + 1).padStart(2, '0');
    items.forEach((el, k) => el.classList.toggle('is-active', k === i));
  }

  function place(t) {
    const { radius, cardW } = layoutMetrics();
    const turns = isCoarse ? 1.35 : 1.85;
    const baseAngle = -Math.PI / 2 + parallaxX * 0.18;
    const spread = Math.PI * 2 * turns;
    const px = parallaxX * 26;
    const py = parallaxY * 18;

    items.forEach((el, i) => {
      const u = i / Math.max(1, N - 1);
      const ang = baseAngle + (u - t) * spread;

      let d = Math.abs(u - t);
      // keep nearest on path without harsh wrap jumps for linear u
      const proximity = 1 - clamp(d * 2.15, 0, 1);

      // helical depth + radius breathe
      const helix = Math.sin((u - t) * Math.PI * 2) * 0.08;
      const r = radius * (0.62 + (1 - proximity) * 0.48 + helix);
      const x = Math.cos(ang) * r + px;
      const y = Math.sin(ang) * r * 0.66 + py + (0.5 - proximity) * 18;
      const z = (proximity - 0.42) * 340 - Math.abs(u - t) * 40;

      const scale = 0.42 + proximity * 0.9;
      const opacity = 0.14 + proximity * 0.86;
      const blur = (1 - proximity) * 2.4;
      const rotY = Math.sin(ang) * 28 + parallaxX * -8;
      const rotX = Math.cos(ang) * -10 + parallaxY * 6;
      const rotZ = ang * (180 / Math.PI) * 0.05;

      el.style.width = cardW + 'px';
      el.style.zIndex = String(20 + Math.round(proximity * 200));
      el.style.opacity = String(opacity);
      el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : 'none';
      el.style.transform =
        `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), ${z.toFixed(2)}px)` +
        ` rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)` +
        ` scale(${scale.toFixed(3)})`;
      el.style.setProperty('--prox', proximity.toFixed(3));
    });

    if (progressBar) progressBar.style.transform = `scaleX(${clamp(t, 0, 1)})`;

    let best = 0;
    let bestD = 1e9;
    items.forEach((_, i) => {
      const u = i / Math.max(1, N - 1);
      const d = Math.abs(u - t);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best !== active) {
      active = best;
      setFocus(active);
      items.forEach((el, i) => {
        const v = el.querySelector('video');
        if (!v) return;
        if (i === active) v.play().catch(() => {});
        else v.pause();
      });
    }
  }

  /* ---------- particles / lights canvas ---------- */
  let ctx = null;
  let particles = [];
  let dpr = 1;

  function seedParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        a: Math.random() * Math.PI * 2,
        r: 0.18 + Math.random() * 0.72,
        y: (Math.random() - 0.5) * 1.2,
        s: 0.5 + Math.random() * 2.2,
        sp: 0.15 + Math.random() * 0.55,
        a0: Math.random() * Math.PI * 2,
        pink: Math.random() > 0.35,
      });
    }
  }

  function sizeFx() {
    if (!fx || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    fx.width = Math.max(1, Math.floor(w * dpr));
    fx.height = Math.max(1, Math.floor(h * dpr));
    fx.style.width = w + 'px';
    fx.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFx(t) {
    if (!fx || !ctx) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5 + parallaxX * 20;
    const cy = h * 0.48 + parallaxY * 14;
    const base = Math.min(w, h);

    // volumetric core
    const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.42);
    g0.addColorStop(0, 'rgba(255,197,211,0.20)');
    g0.addColorStop(0.35, 'rgba(255,197,211,0.08)');
    g0.addColorStop(1, 'rgba(255,197,211,0)');
    ctx.fillStyle = g0;
    ctx.beginPath();
    ctx.arc(cx, cy, base * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // soft rings
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.12 + parallaxX * 0.2);
    for (let i = 0; i < 3; i++) {
      const rr = base * (0.18 + i * 0.11 + Math.sin(t * 0.7 + i) * 0.01);
      ctx.beginPath();
      ctx.ellipse(0, 0, rr * 1.15, rr * 0.55, 0.4 + i * 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,197,211,${0.14 - i * 0.03})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // floating particles along helix
    const turns = 1.85;
    particles.forEach((p) => {
      const ang = p.a + t * p.sp + smoothT * Math.PI * 2 * turns * 0.35;
      const rad = base * (0.16 + p.r * 0.34);
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad * 0.58 + p.y * base * 0.08;
      const tw = 0.45 + 0.55 * Math.sin(t * 1.4 + p.a0);
      const alpha = 0.15 + tw * 0.55;
      ctx.beginPath();
      ctx.fillStyle = p.pink
        ? `rgba(255,197,211,${alpha})`
        : `rgba(255,255,255,${alpha * 0.75})`;
      ctx.shadowColor = p.pink ? 'rgba(255,197,211,0.8)' : 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 8 + p.s * 3;
      ctx.arc(x, y, p.s * (0.7 + tw * 0.5), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // light streaks
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const a = t * 0.25 + i * 1.1 + smoothT * 4;
      const len = base * (0.18 + (i % 3) * 0.05);
      const x1 = cx + Math.cos(a) * base * 0.08;
      const y1 = cy + Math.sin(a) * base * 0.05;
      const x2 = cx + Math.cos(a) * len;
      const y2 = cy + Math.sin(a) * len * 0.55;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, 'rgba(255,197,211,0.0)');
      grad.addColorStop(0.4, 'rgba(255,197,211,0.22)');
      grad.addColorStop(1, 'rgba(255,197,211,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function tick(now) {
    raf = 0;
    time = (now || performance.now()) * 0.001;
    const p = sectionProgress();
    targetT = p;
    const ease = reduceMotion ? 1 : 0.1;
    smoothT += (targetT - smoothT) * ease;
    parallaxX += (pointerX - parallaxX) * 0.06;
    parallaxY += (pointerY - parallaxY) * 0.06;
    place(smoothT);
    if (!reduceMotion) drawFx(time);
    // keep loop while in page (smooth idle motion)
    raf = requestAnimationFrame(tick);
  }

  function setRunway() {
    const vh = window.innerHeight;
    const run = Math.round(vh * (isCoarse ? 0.62 : 0.8) * N);
    section.style.setProperty('--orbit-run', run + 'px');
  }

  if (fx && fx.getContext) {
    ctx = fx.getContext('2d');
    seedParticles(isCoarse ? 36 : 70);
    sizeFx();
  }

  setRunway();
  setFocus(0);
  place(0);

  window.addEventListener(
    'scroll',
    () => {
      /* rAF loop already reads scroll */
    },
    { passive: true }
  );
  window.addEventListener('resize', () => {
    setRunway();
    sizeFx();
  });

  if (!isCoarse && stage) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stage.addEventListener('pointerleave', () => {
      pointerX = 0;
      pointerY = 0;
    });
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const card = items[active];
      if (card) card.click();
    });
  }

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

  raf = requestAnimationFrame(tick);
})();
