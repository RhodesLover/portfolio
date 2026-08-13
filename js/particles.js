/* ============================================================
   AMBIENT PARTICLES — wallpaper-engine style dust + glow
   Subtle floating motes behind content, parallax with cursor.
   Respects reduced-motion and pauses when tab hidden.
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
  let particles = [];
  let running = true;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let tx = 0.5;
  let ty = 0.5;
  let raf = 0;

  const COLORS = [
    [255, 197, 211], // pink
    [255, 168, 185], // light pink
    [245, 245, 245], // off-white
    [255, 225, 235], // pale
  ];

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function targetCount() {
    // density scaled by area, capped for perf
    const area = W * H;
    const n = Math.round((area / 16000) * (isCoarse ? 0.6 : 1));
    return Math.max(30, Math.min(120, n));
  }

  function makeParticle(i, total) {
    const depth = Math.random(); // 0 near (small, fast) .. 1 far (big, slow)
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: rand(0.6, 2.6) * (0.5 + depth * 0.9),
      depth,
      vx: rand(-0.12, 0.12) * (1 - depth * 0.55),
      vy: rand(-0.22, -0.04) * (1 - depth * 0.4),
      a: rand(0.12, 0.5) * (0.5 + depth * 0.5),
      pulse: rand(0.5, 1.6),
      phase: Math.random() * Math.PI * 2,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      glow: Math.random() < 0.28,
    };
  }

  function seed() {
    const total = targetCount();
    particles = [];
    for (let i = 0; i < total; i++) particles.push(makeParticle(i, total));
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

  function step() {
    if (!running) return;
    raf = requestAnimationFrame(step);

    // ease cursor for parallax
    tx += (mouseX - tx) * 0.04;
    ty += (mouseY - ty) * 0.04;

    ctx.clearRect(0, 0, W, H);

    const t = performance.now() * 0.001;
    const px = (tx - 0.5) * 2; // -1..1
    const py = (ty - 0.5) * 2;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // drift
      p.x += p.vx + px * 0.15 * p.depth;
      p.y += p.vy + py * 0.1 * p.depth;

      // wrap
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;

      const twinkle = 0.6 + 0.4 * Math.sin(t * p.pulse + p.phase);
      const alpha = p.a * twinkle;

      if (p.glow) {
        // soft halo
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        const c = p.color;
        g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * 0.55).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function onMouse(e) {
    mouseX = e.clientX / W;
    mouseY = e.clientY / H;
  }
  function onTouch(e) {
    if (e.touches && e.touches.length) {
      mouseX = e.touches[0].clientX / W;
      mouseY = e.touches[0].clientY / H;
    }
  }

  function onVisibility() {
    running = document.visibilityState === 'visible';
    if (running && !raf) {
      raf = requestAnimationFrame(step);
    }
  }

  resize();

  if (reduceMotion) {
    // static dust only — render once, no loop
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = 'rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + p.a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);

  window.__PARTICLES__ = {
    count: function () {
      return particles.length;
    },
    running: function () {
      return running;
    },
  };
})();
