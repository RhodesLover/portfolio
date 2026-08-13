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
    // path
    radius: isCoarse ? 220 : 320,
    radiusEnd: isCoarse ? 180 : 260,
    turns: isCoarse ? 1.65 : 2.35,
    verticalSpan: isCoarse ? 980 : 1480,
    depth: isCoarse ? 420 : 720,
    // camera
    cameraDistance: isCoarse ? 420 : 560,
    cameraOffsetY: isCoarse ? 24 : 18,
    lookAhead: 0.045,
    // scroll
    scrollSensitivity: isCoarse ? 0.00105 : 0.00085,
    runwayPerProject: isCoarse ? 0.72 : 0.95, // * vh
    damping: reduceMotion ? 1 : 0.085,
    velocityFriction: 0.92,
    // presentation
    projectScaleNear: 1.05,
    projectScaleFar: 0.28,
    blurFar: weakGPU ? 1.2 : 2.6,
    opacityFar: 0.12,
    // mouse
    mouseParallax: reduceMotion ? 0 : (isCoarse ? 0 : 0.012),
    mouseTilt: reduceMotion ? 0 : (isCoarse ? 0 : 0.018),
    // particles
    particleCount: weakGPU ? 28 : 64,
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
      this.x = p.x - tan.x * CONFIG.cameraDistance + mouse.x * CONFIG.mouseParallax * 140;
      this.y = p.y - tan.y * CONFIG.cameraDistance * 0.35 + CONFIG.cameraOffsetY + mouse.y * CONFIG.mouseParallax * 80;
      this.z = p.z - tan.z * CONFIG.cameraDistance + 40;

      const ahead = SpiralPath.point(Math.min(1, progress + CONFIG.lookAhead));
      this.lx = ahead.x + mouse.x * 18;
      this.ly = ahead.y + mouse.y * 10;
      this.lz = ahead.z;

      // CSS camera: translate world opposite to camera, then subtle tilt
      const tiltX = -mouse.y * CONFIG.mouseTilt * 28;
      const tiltY = mouse.x * CONFIG.mouseTilt * 32;
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
      const cardW = Math.max(150, Math.min(isCoarse ? 220 : 250, base * 0.26));

      items.forEach((el, i) => {
        const t = this.ts[i];
        const p = SpiralPath.point(t);
        const tan = SpiralPath.tangent(t);

        // distance along path parameter
        const dParam = Math.abs(t - progress);
        // world distance to camera
        const dx = p.x - Camera.x;
        const dy = p.y - Camera.y;
        const dz = p.z - Camera.z;
        const dist = Math.hypot(dx, dy, dz);
        const prox = 1 - Math.max(0, Math.min(1, dParam * 2.4));

        // orientation from tangent (yaw/pitch-ish)
        const yaw = Math.atan2(tan.x, tan.z) * (180 / Math.PI) * 0.55;
        const pitch = -tan.y * 28;
        const bank = tan.x * 10;

        // hover boost integrated in space
        const hovered = mouse.hover === i;
        const hoverBoost = hovered ? 0.14 : 0;
        const scale =
          CONFIG.projectScaleFar +
          (CONFIG.projectScaleNear - CONFIG.projectScaleFar) * (prox * 0.85 + hoverBoost);
        const opacity = CONFIG.opacityFar + (1 - CONFIG.opacityFar) * Math.pow(prox, 0.85) * (hovered ? 1 : 0.92 + (1 - Math.min(1, Math.abs(mouse.hover === -1 ? 0 : 0.15))));
        // dim others slightly when hovering one
        const dim = mouse.hover >= 0 && mouse.hover !== i ? 0.55 : 1;
        const blur = (1 - prox) * CONFIG.blurFar * (hovered ? 0.2 : 1);

        el.style.width = cardW + 'px';
        el.style.zIndex = String(100 + Math.round(prox * 500) + (hovered ? 200 : 0));
        el.style.opacity = String(Math.max(0.05, opacity * dim));
        el.style.filter = blur > 0.18 ? `blur(${blur.toFixed(2)}px)` : 'none';
        // face slightly toward camera while keeping path orientation
        const faceY = yaw * 0.35 + (Camera.x - p.x) * 0.02;
        el.style.transform =
          `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${p.z.toFixed(2)}px)` +
          ` rotateY(${(faceY).toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) rotateZ(${(bank * 0.3).toFixed(2)}deg)` +
          ` scale(${scale.toFixed(3)})`;
        el.dataset.t = t.toFixed(3);
        el.dataset.dist = dist.toFixed(1);

        if (dParam < bestD) {
          bestD = dParam;
          best = i;
        }
      });

      if (best !== this.active) {
        this.active = best;
        this.setFocus(best);
        // play video only on active
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
      CONFIG.radius = 170;
      CONFIG.radiusEnd = 140;
      CONFIG.verticalSpan = 820;
      CONFIG.cameraDistance = 360;
      CONFIG.turns = 1.45;
    } else if (w < 1024) {
      CONFIG.radius = 240;
      CONFIG.radiusEnd = 200;
      CONFIG.verticalSpan = 1100;
      CONFIG.cameraDistance = 460;
      CONFIG.turns = 1.9;
    } else {
      CONFIG.radius = isCoarse ? 220 : 320;
      CONFIG.radiusEnd = isCoarse ? 180 : 260;
      CONFIG.verticalSpan = isCoarse ? 980 : 1480;
      CONFIG.cameraDistance = isCoarse ? 420 : 560;
      CONFIG.turns = isCoarse ? 1.65 : 2.35;
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
