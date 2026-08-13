/* ============================================================
   FIREFLY FIELD — forest-firefly ambience
   - wander (sinusoidal) so they meander, not drift in a line
   - depth layers (near bright/fast · far dim/slow)
   - breathing glow
   - cursor proximity: nearby motes light up + gently pull
   - additive blending for real glow on dark
   - reduced-motion → static dust (no loop)
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let flies = [];
  let running = true;
  let mouseX = -9999;
  let mouseY = -9999;
  let smX = -9999;
  let smY = -9999;
  let hasPointer = false;
  let raf = 0;

  const PALETTE = [
    [255, 197, 211], // pink
    [255, 168, 185], // light pink
    [255, 226, 235], // pale rose
    [255, 214, 165], // warm amber
    [214, 255, 196], // faint green (firefly)
  ];

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function targetCount() {
    const area = W * H;
    const n = Math.round((area / 14000) * (isCoarse ? 0.75 : 1.15));
    return Math.max(40, Math.min(160, n));
  }

  function makeFly() {
    const depth = Math.random(); // 0 far .. 1 near
    const near = 0.25 + depth * 0.75;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      // base radius scales with depth
      r: rand(0.8, 2.6) * near,
      depth,
      near,
      // wander: slow circular meander
      angle: Math.random() * Math.PI * 2,
      angleSpeed: rand(0.25, 1.1) * (0.5 + depth * 0.7),
      wanderAmp: rand(12, 44) * (0.4 + depth * 0.6),
      // gentle upward bias like fireflies
      vx: rand(-0.1, 0.1),
      vy: rand(-0.35, -0.06) * (0.4 + depth * 0.7),
      // base alpha by depth
      baseA: rand(0.16, 0.5) * near,
      // breathing glow
      pulseSpeed: rand(0.6, 2.0),
      phase: Math.random() * Math.PI * 2,
      // glow radius
      glowR: rand(4, 10) * near,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      // cursor wake state
      wake: 0,
    };
  }

  function seed() {
    const total = targetCount();
    flies = [];
    for (let i = 0; i < total; i++) flies.push(makeFly());
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  const CURSOR_RADIUS = 130;

  function step() {
    if (!running) return;
    raf = requestAnimationFrame(step);

    // ease cursor
    if (hasPointer) {
      smX += (mouseX - smX) * 0.09;
      smY += (mouseY - smY) * 0.09;
    } else {
      smX += (-9999 - smX) * 0.02;
      smY += (-9999 - smY) * 0.02;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; // additive glow

    const t = performance.now() * 0.001;

    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];

      // --- wander ---
      f.angle += f.angleSpeed * 0.016;
      const wx = Math.cos(f.angle) * f.wanderAmp;
      const wy = Math.sin(f.angle * 1.3) * f.wanderAmp * 0.7;

      f.x += (f.vx + wx * 0.02) * f.near;
      f.y += (f.vy + wy * 0.02) * f.near;

      // --- cursor wake: light up + gentle pull ---
      if (hasPointer) {
        const dx = smX - f.x;
        const dy = smY - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CURSOR_RADIUS) {
          const k = 1 - dist / CURSOR_RADIUS;
          f.wake = Math.min(1, f.wake + k * 0.08);
          // soft attraction toward cursor
          const pull = 0.22 * k * f.near;
          f.x += (dx / (dist || 1)) * pull;
          f.y += (dy / (dist || 1)) * pull;
        }
      }
      f.wake *= 0.965; // decay

      // --- wrap edges ---
      const pad = 30;
      if (f.y < -pad) { f.y = H + pad; f.x = Math.random() * W; }
      if (f.y > H + pad) { f.y = -pad; f.x = Math.random() * W; }
      if (f.x < -pad) f.x = W + pad;
      if (f.x > W + pad) f.x = -pad;

      // --- breathing glow ---
      const breathe = 0.55 + 0.45 * Math.sin(t * f.pulseSpeed + f.phase);
      const wakeBoost = 1 + f.wake * 1.9;
      const alpha = f.baseA * breathe * wakeBoost;

      const r = f.r * (1 + f.wake * 0.5);
      const glowR = f.glowR * (1 + f.wake * 0.8);

      // soft halo
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowR);
      const c = f.color;
      const coreA = Math.min(1, alpha * 0.9);
      g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + coreA.toFixed(3) + ')');
      g.addColorStop(0.4, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (coreA * 0.35).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // bright core
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.min(1, alpha).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function onMove(e) {
    hasPointer = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
  function onLeave() {
    hasPointer = false;
  }
  function onTouch(e) {
    if (e.touches && e.touches.length) {
      hasPointer = true;
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }
  function onTouchEnd() {
    hasPointer = false;
  }

  function onVisibility() {
    running = document.visibilityState === 'visible';
    if (running && !raf) raf = requestAnimationFrame(step);
  }

  resize();

  if (reduceMotion) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.glowR);
      const c = f.color;
      g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + f.baseA.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.glowR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  } else {
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);

  window.__PARTICLES__ = {
    count: function () { return flies.length; },
    running: function () { return running; },
    setDensity: function (k) {
      const area = W * H;
      const n = Math.max(30, Math.min(220, Math.round((area / 14000) * k)));
      const cur = flies.length;
      while (flies.length < n) flies.push(makeFly());
      if (flies.length > n) flies.length = n;
      return flies.length;
    },
  };
})();
