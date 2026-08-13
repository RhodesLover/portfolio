/* ============================================================
   SPIRAL NAV SYSTEM v3 — spatial navigation (not decorative)
   Architecture:
     CONFIG → SpiralPath → ScrollController → CameraController
            → ProjectSystem → MouseInteraction → ParticleSystem → UI
   Stack: vanilla JS + CSS 3D (no Three.js in project)
   ============================================================ */
(function () {
  'use strict';

  const section = document.querySelector('.work-orbit');
  if (!section) return;

  const stage = document.getElementById('orbitStage');
  const world = document.getElementById('spiralWorld');
  const pathEl = document.getElementById('spiralPath');
  const ring = document.getElementById('orbitRing');
  const items = Array.from(section.querySelectorAll('.spiral__item'));
  const progressBar = document.getElementById('orbitProgress');
  const idxEl = document.getElementById('orbitIndex');
  const focusCat = document.getElementById('orbitFocusCat');
  const focusTitle = document.getElementById('orbitFocusTitle');
  const focusDesc = document.getElementById('orbitFocusDesc');
  const openBtn = document.getElementById('orbitOpenBtn');
  const fx = document.getElementById('orbitFx');
  const totalLabel = section.querySelector('.work-orbit__counter span:last-child');

  if (!stage || !world || !ring || !items.length) return;

  const N = items.length;
  if (totalLabel) totalLabel.textContent = String(N).padStart(2, '0');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const weakGPU = isCoarse || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  /* =========================================================
     CENTRAL CONFIG — single source of truth
     ========================================================= */
  const CONFIG = {
    // path — calmer helix so work stays readable (AT feel: travel, not fly)
    radius: isCoarse ? 160 : 210,
    radiusEnd: isCoarse ? 140 : 180,
    turns: isCoarse ? 0.85 : 1.05,
    verticalSpan: isCoarse ? 1100 : 1600,
    depth: isCoarse ? 220 : 320,
    // camera — closer, steadier, less look-ahead whip
    cameraDistance: isCoarse ? 360 : 430,
    cameraOffsetY: isCoarse ? 10 : 6,
    lookAhead: 0.018,
    // scroll — longer runway + heavier damping = ordered pacing
    scrollSensitivity: isCoarse ? 0.0007 : 0.00055,
    runwayPerProject: isCoarse ? 0.85 : 1.05, // * vh
    damping: reduceMotion ? 1 : 0.055,
    velocityFriction: 0.88,
    // presentation — keep pieces large & sharp (no blur pixelation)
    projectScaleNear: 1.0,
    projectScaleFar: 0.72,
    blurFar: 0,
    opacityFar: 0.28,
    focusWindow: 0.11, // only nearby pieces fully present
    // mouse — subtle influence only
    mouseParallax: reduceMotion ? 0 : (isCoarse ? 0 : 0.006),
    mouseTilt: reduceMotion ? 0 : (isCoarse ? 0 : 0.008),
    // particles — quieter guide
    particleCount: weakGPU ? 16 : 32,
  };

  /* =========================================================
     SpiralPath — parametric helix
     t in [0,1] → {x,y,z} and tangent
     ========================================================= */
  const SpiralPath = {
    point(t) {
      const tt = Math.max(0, Math.min(1, t));
      const ang = tt * Math.PI * 2 * CONFIG.turns;
      const r = CONFIG.radius + (CONFIG.radiusEnd - CONFIG.radius) * tt;
      // vertical helix (Y down positive in screen space later inverted)
      const y = (tt - 0.5) * CONFIG.verticalSpan;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r * (CONFIG.depth / Math.max(1, CONFIG.radius));
      return { x, y, z, ang, r };
    },
    // finite difference tangent (normalized)
    tangent(t) {
      const d = 0.0025;
      const a = this.point(Math.max(0, t - d));
      const b = this.point(Math.min(1, t + d));
      let x = b.x - a.x;
      let y = b.y - a.y;
      let z = b.z - a.z;
      const len = Math.hypot(x, y, z) || 1;
      return { x: x / len, y: y / len, z: z / len };
    },
  };

  /* =========================================================
     ScrollController — progress + inertia
     ========================================================= */
  const Scroll = {
    target: 0,
    current: 0,
    velocity: 0,
    sectionProgress() {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, section.offsetHeight - window.innerHeight);
      const scrolled = Math.max(0, Math.min(total, -rect.top));
      return scrolled / total;
    },
    setRunway() {
      const vh = window.innerHeight;
      const run = Math.round(vh * CONFIG.runwayPerProject * N);
      section.style.setProperty('--orbit-run', run + 'px');
    },
    sample() {
      this.target = this.sectionProgress();
    },
    step() {
      const prev = this.current;
      if (reduceMotion) {
        this.current = this.target;
        this.velocity = 0;
      } else {
        const delta = this.target - this.current;
        this.velocity = this.velocity * CONFIG.velocityFriction + delta * CONFIG.damping;
        this.current += this.velocity;
        // settle
        if (Math.abs(delta) < 0.00005 && Math.abs(this.velocity) < 0.00005) {
          this.current = this.target;
          this.velocity = 0;
        }
      }
      return { progress: this.current, velocity: this.current - prev };
    },
  };

  /* =========================================================
     MouseInteraction — subtle physical influence
     ========================================================= */
  const Mouse = {
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    hoverIndex: -1,
    init() {
      if (isCoarse) return;
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        this.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        this.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      stage.addEventListener('pointerleave', () => {
        this.x = 0;
        this.y = 0;
        this.hoverIndex = -1;
      });
      items.forEach((el, i) => {
        el.addEventListener('pointerenter', () => {
          this.hoverIndex = i;
        });
        el.addEventListener('pointerleave', () => {
          if (this.hoverIndex === i) this.hoverIndex = -1;
        });
      });
    },
    step() {
      this.sx += (this.x - this.sx) * 0.06;
      this.sy += (this.y - this.sy) * 0.06;
      return { x: this.sx, y: this.sy, hover: this.hoverIndex };
    },
  };

  /* =========================================================
     CameraController — rides the path with look-ahead
     ========================================================= */
  const Camera = {
    // camera position in world space
    x: 0,
    y: 0,
    z: 0,
    // look target
    lx: 0,
    ly: 0,
    lz: 0,
    update(progress, mouse) {
      const p = SpiralPath.point(progress);
      const tan = SpiralPath.tangent(progress);
      // place camera behind tangent
      this.x = p.x - tan.x * CONFIG.cameraDistance + mouse.x * CONFIG.mouseParallax * 70;
      this.y = p.y - tan.y * CONFIG.cameraDistance * 0.22 + CONFIG.cameraOffsetY + mouse.y * CONFIG.mouseParallax * 40;
      this.z = p.z - tan.z * CONFIG.cameraDistance + 24;

      const ahead = SpiralPath.point(Math.min(1, progress + CONFIG.lookAhead));
      this.lx = ahead.x + mouse.x * 8;
      this.ly = ahead.y + mouse.y * 5;
      this.lz = ahead.z;

      // CSS camera: translate world opposite to camera, then subtle tilt
      const tiltX = -mouse.y * CONFIG.mouseTilt * 14;
      const tiltY = mouse.x * CONFIG.mouseTilt * 16;
      world.style.transform =
        `translate3d(${(-this.x).toFixed(2)}px, ${(-this.y).toFixed(2)}px, ${(-this.z).toFixed(2)}px)` +
        ` rotateX(${tiltX.toFixed(3)}deg) rotateY(${tiltY.toFixed(3)}deg)`;
    },
  };

  /* =========================================================
     ProjectSystem — place each project on curve by t
     ========================================================= */
  const Projects = {
    // even spacing along path
    ts: items.map((_, i) => (N === 1 ? 0 : i / (N - 1))),
    active: 0,
    setFocus(i) {
      const item = items[i];
      if (!item) return;
      if (focusCat) focusCat.textContent = item.dataset.category || '';
      if (focusTitle) focusTitle.textContent = item.dataset.title || '';
      if (focusDesc) {
        const d = item.dataset.description || '';
        focusDesc.textContent = d.length > 150 ? d.slice(0, 147) + '…' : d;
      }
      if (idxEl) idxEl.textContent = String(i + 1).padStart(2, '0');
      items.forEach((el, k) => el.classList.toggle('is-active', k === i));
    },
    update(progress, mouse) {
      let best = 0;
      let bestD = 1e9;
      const base = Math.min(stage.clientWidth || 800, stage.clientHeight || 600);
      // larger readable cards — no tiny scaled bitmaps
      const cardW = Math.max(200, Math.min(isCoarse ? 280 : 340, base * 0.36));

      items.forEach((el, i) => {
        const t = this.ts[i];
        const p = SpiralPath.point(t);
        const tan = SpiralPath.tangent(t);

        // distance along path parameter
        const dParam = Math.abs(t - progress);
        const dx = p.x - Camera.x;
        const dy = p.y - Camera.y;
        const dz = p.z - Camera.z;
        const dist = Math.hypot(dx, dy, dz);
        // soft focus window: only nearby work is fully present
        const prox = 1 - Math.max(0, Math.min(1, dParam / Math.max(0.04, CONFIG.focusWindow)));

        // gentle orientation — face camera more than path spin
        const yaw = Math.atan2(tan.x, Math.max(0.15, tan.z)) * (180 / Math.PI) * 0.18;
        const pitch = -tan.y * 8;

        const hovered = mouse.hover === i;
        const hoverBoost = hovered ? 0.06 : 0;
        const scale =
          CONFIG.projectScaleFar +
          (CONFIG.projectScaleNear - CONFIG.projectScaleFar) * (0.35 + prox * 0.65) +
          hoverBoost;
        let opacity = CONFIG.opacityFar + (1 - CONFIG.opacityFar) * Math.pow(Math.max(prox, 0.15), 0.7);
        if (hovered) opacity = Math.min(1, opacity + 0.12);
        // dim non-hovered only lightly
        const dim = mouse.hover >= 0 && mouse.hover !== i ? 0.72 : 1;

        el.style.width = cardW + 'px';
        el.style.zIndex = String(100 + Math.round(prox * 500) + (hovered ? 200 : 0));
        el.style.opacity = String(Math.max(0.18, opacity * dim));
        // NEVER blur media — blur was causing pixelation on scaled bitmaps
        el.style.filter = 'none';
        // face camera primarily (readable artwork)
        const faceY = yaw * 0.25 + (Camera.x - p.x) * 0.012;
        el.style.transform =
          `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${p.z.toFixed(2)}px)` +
          ` rotateY(${faceY.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg)` +
          ` scale(${scale.toFixed(3)})`;
        el.dataset.t = t.toFixed(3);
        el.dataset.dist = dist.toFixed(1);
        el.classList.toggle('is-near', prox > 0.55);

        if (dParam < bestD) {
          bestD = dParam;
          best = i;
        }
      });

      if (best !== this.active) {
        this.active = best;
        this.setFocus(best);
        items.forEach((el, i) => {
          const v = el.querySelector('video');
          if (!v) return;
          if (i === best) v.play().catch(() => {});
          else v.pause();
        });
      }
    },
  };

  /* =========================================================
     ParticleSystem / path ribbon — subtle guide, not heavy
     ========================================================= */
  const Particles = {
    ctx: null,
    list: [],
    dpr: 1,
    init() {
      if (!fx || !fx.getContext) return;
      this.ctx = fx.getContext('2d');
      this.list = [];
      for (let i = 0; i < CONFIG.particleCount; i++) {
        this.list.push({
          t: Math.random(),
          off: (Math.random() - 0.5) * 28,
          s: 0.5 + Math.random() * 1.8,
          sp: 0.00015 + Math.random() * 0.00045,
          a0: Math.random() * Math.PI * 2,
          pink: Math.random() > 0.3,
        });
      }
      this.resize();
    },
    resize() {
      if (!this.ctx || !fx) return;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      fx.width = Math.max(1, Math.floor(w * this.dpr));
      fx.height = Math.max(1, Math.floor(h * this.dpr));
      fx.style.width = w + 'px';
      fx.style.height = h + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },
    // project world point with same camera transform approximation
    project(wx, wy, wz) {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      // after world translate -camera
      const x = wx - Camera.x;
      const y = wy - Camera.y;
      const z = wz - Camera.z + CONFIG.cameraDistance; // push into positive depth
      const f = 520 / Math.max(80, z + 520);
      return {
        x: w * 0.5 + x * f,
        y: h * 0.5 + y * f,
        f,
        z,
      };
    },
    draw(progress, time) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // subtle path polyline
      ctx.beginPath();
      let started = false;
      const steps = weakGPU ? 48 : 90;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const p = SpiralPath.point(t);
        const s = this.project(p.x, p.y, p.z);
        if (s.z < -200) continue;
        if (!started) {
          ctx.moveTo(s.x, s.y);
          started = true;
        } else ctx.lineTo(s.x, s.y);
      }
      ctx.strokeStyle = 'rgba(255,197,211,0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // glow near camera progress
      const near = SpiralPath.point(progress);
      const sn = this.project(near.x, near.y, near.z);
      const g = ctx.createRadialGradient(sn.x, sn.y, 0, sn.x, sn.y, 160);
      g.addColorStop(0, 'rgba(255,197,211,0.16)');
      g.addColorStop(1, 'rgba(255,197,211,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sn.x, sn.y, 160, 0, Math.PI * 2);
      ctx.fill();

      // particles drifting on path
      this.list.forEach((pt) => {
        pt.t += pt.sp;
        if (pt.t > 1) pt.t -= 1;
        const p = SpiralPath.point(pt.t);
        const tan = SpiralPath.tangent(pt.t);
        // offset perpendicular-ish
        const wx = p.x + tan.z * pt.off;
        const wy = p.y + Math.sin(time + pt.a0) * 6;
        const wz = p.z - tan.x * pt.off;
        const s = this.project(wx, wy, wz);
        if (s.z < -100 || s.f < 0.2) return;
        const tw = 0.4 + 0.6 * Math.sin(time * 1.3 + pt.a0);
        const alpha = 0.12 + tw * 0.45 * s.f;
        ctx.beginPath();
        ctx.fillStyle = pt.pink ? `rgba(255,197,211,${alpha})` : `rgba(255,255,255,${alpha * 0.7})`;
        ctx.shadowColor = pt.pink ? 'rgba(255,197,211,0.7)' : 'rgba(255,255,255,0.35)';
        ctx.shadowBlur = 6 + pt.s * 2;
        ctx.arc(s.x, s.y, pt.s * s.f * (0.8 + tw * 0.4), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    },
  };

  /* =========================================================
     Path DOM markers (optional subtle ticks)
     ========================================================= */
  function buildPathTicks() {
    if (!pathEl) return;
    pathEl.innerHTML = '';
    const ticks = weakGPU ? 18 : 28;
    for (let i = 0; i < ticks; i++) {
      const t = i / (ticks - 1);
      const p = SpiralPath.point(t);
      const d = document.createElement('span');
      d.className = 'work-orbit__tick';
      d.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px)`;
      pathEl.appendChild(d);
    }
  }

  /* =========================================================
     Main loop
     ========================================================= */
  let raf = 0;
  let lastNow = performance.now();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const time = now * 0.001;

    Scroll.sample();
    const { progress } = Scroll.step();
    const mouse = Mouse.step();

    Camera.update(progress, mouse);
    Projects.update(progress, mouse);
    if (!reduceMotion) Particles.draw(progress, time);

    if (progressBar) progressBar.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
  }

  function onResize() {
    Scroll.setRunway();
    Particles.resize();
    // responsive config tweaks
    const w = window.innerWidth;
    if (w < 700) {
      CONFIG.radius = 120;
      CONFIG.radiusEnd = 100;
      CONFIG.verticalSpan = 980;
      CONFIG.cameraDistance = 320;
      CONFIG.turns = 0.75;
      CONFIG.depth = 180;
    } else if (w < 1024) {
      CONFIG.radius = 170;
      CONFIG.radiusEnd = 145;
      CONFIG.verticalSpan = 1280;
      CONFIG.cameraDistance = 380;
      CONFIG.turns = 0.92;
      CONFIG.depth = 240;
    } else {
      CONFIG.radius = isCoarse ? 160 : 210;
      CONFIG.radiusEnd = isCoarse ? 140 : 180;
      CONFIG.verticalSpan = isCoarse ? 1100 : 1600;
      CONFIG.cameraDistance = isCoarse ? 360 : 430;
      CONFIG.turns = isCoarse ? 0.85 : 1.05;
      CONFIG.depth = isCoarse ? 220 : 320;
    }
    buildPathTicks();
  }

  // wheel boost for sticky feel (still uses native scroll position)
  section.addEventListener(
    'wheel',
    () => {
      // native scroll remains source of truth; damping handles feel
    },
    { passive: true }
  );

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const card = items[Projects.active];
      if (card) card.click();
    });
  }

  document.addEventListener('keydown', (e) => {
    const rect = section.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.65 && rect.bottom > window.innerHeight * 0.25;
    if (!inView || document.body.classList.contains('modal-open')) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next = Math.max(0, Math.min(N - 1, Projects.active + dir));
    const total = Math.max(1, section.offsetHeight - window.innerHeight);
    const y = section.offsetTop + Projects.ts[next] * total;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  // loco reveals
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
      { threshold: 0.2 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // init
  Mouse.init();
  Particles.init();
  Scroll.setRunway();
  buildPathTicks();
  Projects.setFocus(0);
  window.addEventListener('resize', onResize);
  onResize();
  raf = requestAnimationFrame(frame);

  // expose config for quick tuning in console (dev)
  window.__SPIRAL_NAV__ = { CONFIG, SpiralPath, Scroll, Camera, Projects };
})();
