/* ============================================================
   BOTTLE 3D — packaging interactivo (Fernet Cordobita)
   API: window.openBottle3d(opts) / window.closeBottle3d()
   Texturas: label-front / label-back (webp) en opts.dir
   Three.js on-demand (misma CDN que cd-case).
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('bottle3d');
  if (!root) return;

  var backdrop = document.getElementById('bottle3dBackdrop');
  var closeBtn = document.getElementById('bottle3dClose');
  var canvasHost = document.getElementById('bottle3dCanvas');
  var titleEl = document.getElementById('bottle3dTitle');
  var hintEl = document.getElementById('bottle3dHint');
  var statusEl = document.getElementById('bottle3dStatus');

  var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
  var DEFAULT_DIR = 'assets/fernet-bottle';

  var open = false;
  var ready = false;
  var loading = false;

  var THREE = null;
  var renderer = null;
  var scene = null;
  var camera = null;
  var clock = null;
  var raf = 0;

  var rootGroup = null;
  var texDir = DEFAULT_DIR;
  var textures = {};

  // interaction — auto orbit unless user holds
  var dragging = false;
  var lastX = 0;
  var lastY = 0;
  var rotY = 0.45;
  var rotX = 0.12;
  var targetRotY = rotY;
  var targetRotX = rotX;
  var autoOrbit = true;
  var autoOrbitSpeed = 0.42;
  var autoTiltAmp = 0.04;
  var autoTiltSpeed = 0.5;
  var autoT = 0;
  var pointerId = null;

  // liquid color from reference sample (dark fernet brown)
  var LIQUID = { r: 42, g: 28, b: 18 };

  function setHint(t) {
    if (hintEl) hintEl.textContent = t || '';
  }
  function setStatus(t) {
    if (statusEl) statusEl.textContent = t || '';
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.THREE) {
        resolve(window.THREE);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () {
        if (window.THREE) resolve(window.THREE);
        else reject(new Error('THREE global missing'));
      };
      s.onerror = function () {
        reject(new Error('Failed to load Three.js'));
      };
      document.head.appendChild(s);
    });
  }

  function loadTexture(loader, url) {
    return new Promise(function (resolve, reject) {
      loader.load(
        url,
        function (tex) {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          resolve(tex);
        },
        undefined,
        function (err) {
          reject(err || new Error('tex ' + url));
        }
      );
    });
  }

  function glassMat(opts) {
    opts = opts || {};
    return new THREE.MeshPhysicalMaterial({
      color: opts.color != null ? opts.color : 0x1a1210,
      metalness: 0.05,
      roughness: opts.roughness != null ? opts.roughness : 0.18,
      transmission: opts.transmission != null ? opts.transmission : 0.55,
      thickness: opts.thickness != null ? opts.thickness : 0.35,
      ior: 1.5,
      transparent: true,
      opacity: opts.opacity != null ? opts.opacity : 0.92,
      side: THREE.DoubleSide,
      depthWrite: opts.depthWrite != null ? opts.depthWrite : false,
      envMapIntensity: 0.9
    });
  }

  function buildBottle() {
    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Profile points for LatheGeometry (x = radius, y = height). Units ~ bottle height 2.2
    // Classic tall liquor bottle: base → body → shoulder → neck → lip
    var pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.38, 0.0),
      new THREE.Vector2(0.42, 0.04),
      new THREE.Vector2(0.44, 0.12),
      new THREE.Vector2(0.45, 0.55),
      new THREE.Vector2(0.44, 1.05),
      new THREE.Vector2(0.42, 1.25),
      new THREE.Vector2(0.32, 1.42),
      new THREE.Vector2(0.2, 1.55),
      new THREE.Vector2(0.16, 1.62),
      new THREE.Vector2(0.15, 1.85),
      new THREE.Vector2(0.16, 1.95),
      new THREE.Vector2(0.18, 2.0),
      new THREE.Vector2(0.17, 2.02),
      new THREE.Vector2(0.14, 2.04),
      new THREE.Vector2(0.0, 2.04)
    ];
    var bodyGeo = new THREE.LatheGeometry(pts, 64);
    bodyGeo.computeVertexNormals();

    // dark glass shell
    var shell = new THREE.Mesh(
      bodyGeo,
      glassMat({
        color: 0x14100e,
        transmission: 0.42,
        roughness: 0.22,
        thickness: 0.55,
        opacity: 0.95,
        depthWrite: true
      })
    );
    shell.castShadow = true;
    shell.receiveShadow = true;
    rootGroup.add(shell);

    // inner liquid (slightly smaller lathe, lower fill)
    var liquidPts = [
      new THREE.Vector2(0.0, 0.06),
      new THREE.Vector2(0.34, 0.06),
      new THREE.Vector2(0.38, 0.1),
      new THREE.Vector2(0.4, 0.18),
      new THREE.Vector2(0.41, 0.55),
      new THREE.Vector2(0.4, 1.0),
      new THREE.Vector2(0.36, 1.18),
      new THREE.Vector2(0.22, 1.32),
      new THREE.Vector2(0.0, 1.32)
    ];
    var liquidGeo = new THREE.LatheGeometry(liquidPts, 48);
    var liquidCol = new THREE.Color(LIQUID.r / 255, LIQUID.g / 255, LIQUID.b / 255);
    var liquid = new THREE.Mesh(
      liquidGeo,
      new THREE.MeshPhysicalMaterial({
        color: liquidCol,
        metalness: 0.05,
        roughness: 0.35,
        transmission: 0.15,
        thickness: 0.8,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      })
    );
    liquid.position.y = 0.02;
    rootGroup.add(liquid);

    // front + back labels as curved cylinder bands on the body
    var labelH = 0.78;
    var labelY = 0.62;
    var labelR = 0.452;
    var labelArc = Math.PI * 0.92; // wrap most of front/back faces

    function makeLabel(tex, yRot) {
      var segs = 48;
      var geo = new THREE.CylinderGeometry(
        labelR,
        labelR,
        labelH,
        segs,
        1,
        true,
        -labelArc * 0.5,
        labelArc
      );
      var mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.55,
        metalness: 0.02,
        transparent: true,
        alphaTest: 0.02,
        side: THREE.FrontSide
      });
      var m = new THREE.Mesh(geo, mat);
      m.position.y = labelY;
      m.rotation.y = yRot;
      m.castShadow = true;
      return m;
    }

    if (textures.front) rootGroup.add(makeLabel(textures.front, 0));
    if (textures.back) rootGroup.add(makeLabel(textures.back, Math.PI));

    // foil/cap
    var cap = new THREE.Group();
    cap.position.y = 2.0;
    var foil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.17, 0.14, 32),
      new THREE.MeshStandardMaterial({
        color: 0x2a1810,
        metalness: 0.65,
        roughness: 0.28
      })
    );
    foil.position.y = 0.05;
    cap.add(foil);
    var top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.155, 0.155, 0.04, 32),
      new THREE.MeshStandardMaterial({ color: 0x1a100c, metalness: 0.5, roughness: 0.35 })
    );
    top.position.y = 0.13;
    cap.add(top);
    // thin gold ring
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.168, 0.008, 8, 40),
      new THREE.MeshStandardMaterial({ color: 0xc4a35a, metalness: 0.85, roughness: 0.25 })
    );
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = 0.0;
    cap.add(ring);
    rootGroup.add(cap);

    // center bottle on origin (lathe sits on y=0)
    rootGroup.position.y = -1.05;
    rootGroup.rotation.order = 'YXZ';
    rootGroup.rotation.y = rotY;
    rootGroup.rotation.x = rotX;
  }

  function resize() {
    if (!renderer || !camera || !canvasHost) return;
    var w = canvasHost.clientWidth || 1;
    var h = canvasHost.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function onPointerDown(e) {
    if (!open || !ready) return;
    if (e.button != null && e.button !== 0) return;
    dragging = true;
    autoOrbit = false;
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    targetRotY = rotY;
    targetRotX = rotX;
    try {
      renderer.domElement.setPointerCapture(e.pointerId);
    } catch (err) {}
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging || !open) return;
    if (pointerId != null && e.pointerId !== pointerId) return;
    var dx = e.clientX - lastX;
    var dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    targetRotY += dx * 0.01;
    targetRotX += dy * 0.006;
    targetRotX = Math.max(-0.35, Math.min(0.45, targetRotX));
    rotY = targetRotY;
    rotX = targetRotX;
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (pointerId != null && e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    autoOrbit = true;
    try {
      renderer.domElement.releasePointerCapture(e.pointerId);
    } catch (err) {}
  }

  function onWheel(e) {
    if (!open || !ready) return;
    e.preventDefault();
    var z = camera.position.z + e.deltaY * 0.0025;
    camera.position.z = Math.max(2.4, Math.min(5.2, z));
  }

  function animate() {
    if (!open || !ready) return;
    raf = requestAnimationFrame(animate);
    var dt = Math.min(0.05, clock.getDelta());
    autoT += dt;

    if (autoOrbit && !dragging) {
      targetRotY += autoOrbitSpeed * dt;
      targetRotX = 0.12 + Math.sin(autoT * autoTiltSpeed) * autoTiltAmp;
      rotY = targetRotY;
      rotX += (targetRotX - rotX) * Math.min(1, dt * 4);
    } else {
      rotY += (targetRotY - rotY) * Math.min(1, dt * 10);
      rotX += (targetRotX - rotX) * Math.min(1, dt * 10);
    }
    if (rootGroup) {
      rootGroup.rotation.y = rotY;
      rootGroup.rotation.x = rotX;
    }
    renderer.render(scene, camera);
  }

  function bindInput(on) {
    var el = renderer && renderer.domElement;
    if (!el) return;
    if (on) {
      el.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      el.addEventListener('wheel', onWheel, { passive: false });
    } else {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel);
    }
  }

  async function ensureScene() {
    if (ready) {
      resize();
      return;
    }
    if (loading) return;
    loading = true;
    setStatus('Cargando botella…');
    try {
      THREE = await loadScript(THREE_CDN);
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      canvasHost.innerHTML = '';
      canvasHost.appendChild(renderer.domElement);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.touchAction = 'none';
      renderer.domElement.setAttribute('aria-label', 'Mockup 3D de botella');

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
      camera.position.set(0, 0.05, 3.4);
      camera.lookAt(0, 0, 0);
      clock = new THREE.Clock();

      scene.add(new THREE.AmbientLight(0xfff2e6, 0.55));
      var key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(2.4, 3.5, 3.5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      var fill = new THREE.DirectionalLight(0xb8d0ff, 0.35);
      fill.position.set(-3, 1.5, 2);
      scene.add(fill);
      var rim = new THREE.DirectionalLight(0xffc8a0, 0.4);
      rim.position.set(-1.5, 1.2, -3);
      scene.add(rim);

      var ground = new THREE.Mesh(
        new THREE.CircleGeometry(1.4, 48),
        new THREE.ShadowMaterial({ opacity: 0.32 })
      );
      ground.rotation.x = -Math.PI * 0.5;
      ground.position.y = -1.08;
      ground.receiveShadow = true;
      scene.add(ground);

      // try load liquid color hint
      try {
        var colRes = await fetch(texDir.replace(/\/+$/, '') + '/liquid-color.txt');
        if (colRes.ok) {
          var txt = (await colRes.text()).trim().split(',');
          if (txt.length >= 3) {
            LIQUID.r = +txt[0] || LIQUID.r;
            LIQUID.g = +txt[1] || LIQUID.g;
            LIQUID.b = +txt[2] || LIQUID.b;
          }
        }
      } catch (e) {}

      var loader = new THREE.TextureLoader();
      var base = texDir.replace(/\/+$/, '') + '/';
      textures.front = await loadTexture(loader, base + 'label-front.webp');
      textures.back = await loadTexture(loader, base + 'label-back.webp');

      buildBottle();
      resize();
      ready = true;
      setStatus('Rotando');
      bindInput(true);
      window.addEventListener('resize', resize);
    } catch (err) {
      console.error('[bottle-3d]', err);
      setStatus('No se pudo cargar el mockup 3D');
      setHint('Reintentá en un momento o recargá la página.');
      throw err;
    } finally {
      loading = false;
    }
  }

  function setOpen(on) {
    open = !!on;
    root.classList.toggle('is-open', open);
    root.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('bottle-3d-open', open);
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      if (
        !document.body.classList.contains('pg-viewer-open') &&
        !document.body.classList.contains('carta-revista-open') &&
        !document.body.classList.contains('brand-manual-open') &&
        !document.body.classList.contains('figma-proto-open') &&
        !document.body.classList.contains('cd-case-open')
      ) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    }
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  async function openBottle3d(opts) {
    opts = opts || {};
    if (opts.dir) texDir = String(opts.dir);
    if (titleEl) titleEl.textContent = opts.title || 'Fernet Cordobita';
    rotY = 0.45;
    rotX = 0.12;
    targetRotY = rotY;
    targetRotX = rotX;
    autoOrbit = true;
    autoT = 0;
    dragging = false;
    setHint('Gira sola · mantené el mouse para frenar y rotar');
    setOpen(true);
    try {
      await ensureScene();
      if (rootGroup) {
        rootGroup.rotation.y = rotY;
        rootGroup.rotation.x = rotX;
      }
      stopLoop();
      clock.getDelta();
      animate();
      setStatus('Rotando');
    } catch (e) {}
  }

  function closeBottle3d() {
    stopLoop();
    setOpen(false);
    dragging = false;
  }

  if (closeBtn)
    closeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeBottle3d();
    });
  if (backdrop)
    backdrop.addEventListener('click', function () {
      closeBottle3d();
    });
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeBottle3d();
    }
  });

  window.openBottle3d = openBottle3d;
  window.closeBottle3d = closeBottle3d;
})();
