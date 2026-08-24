/* ============================================================
   CD CASE 3D — jewel case interactivo (Desembarco)
   API: window.openCdCase(opts) / window.closeCdCase()
   Texturas: cover / tray / disc / front / back (webp)
   Three.js se carga on-demand desde CDN (UMD).
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('cdCase');
  if (!root) return;

  var backdrop = document.getElementById('cdCaseBackdrop');
  var closeBtn = document.getElementById('cdCaseClose');
  var canvasHost = document.getElementById('cdCaseCanvas');
  var titleEl = document.getElementById('cdCaseTitle');
  var hintEl = document.getElementById('cdCaseHint');
  var toggleBtn = document.getElementById('cdCaseToggle');
  var statusEl = document.getElementById('cdCaseStatus');

  var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
  var DEFAULT_DIR = 'assets/desembarco-cd';

  var open = false;
  var ready = false;
  var loading = false;
  var disposed = false;

  var THREE = null;
  var renderer = null;
  var scene = null;
  var camera = null;
  var clock = null;
  var raf = 0;

  var rootGroup = null;
  var lidPivot = null;
  var discMesh = null;
  var discPivot = null;

  var caseOpen = false; // lid state
  var lidAngle = 0; // 0 closed, target OPEN_ANGLE
  var lidTarget = 0;

  var texDir = DEFAULT_DIR;
  var textures = {};

  // jewel case ~142×125 mm → aspect 1.136
  var CW = 1.42;
  var CH = 1.245;
  var CD = 0.105; // outer depth closed
  var LID_T = 0.014;
  var BACK_T = 0.012;
  var TRAY_T = 0.028;
  var SPINE_W = 0.07;
  var OPEN_ANGLE = -2.55; // rad ~ -146°
  var DISC_D = CW * 0.86;
  var DISC_R = DISC_D * 0.5;
  var DISC_T = 0.004;

  // interaction
  var dragging = false;
  var dragMode = null; // 'case' | 'disc'
  var lastX = 0;
  var lastY = 0;
  var rotY = -0.35;
  var rotX = 0.18;
  var targetRotY = rotY;
  var targetRotX = rotX;
  var discSpin = 0;
  var discSpinVel = 0.55; // auto rad/s (open)
  var discUserSpin = 0;
  var discIdleT = 0;
  var pointerId = null;
  // auto showcase motion — pauses while user holds pointer
  var autoOrbit = true;
  var autoOrbitSpeed = 0.28; // rad/s around Y
  var autoTiltAmp = 0.06;
  var autoTiltSpeed = 0.55;
  var autoT = 0;
  var CASE_DISC_SPIN = 0.12; // subtle when closed
  var OPEN_DISC_SPIN = 0.55;

  var raycaster = null;
  var pointerNdc = null;

  function setHint(t) {
    if (hintEl) hintEl.textContent = t || '';
  }
  function setStatus(t) {
    if (statusEl) statusEl.textContent = t || '';
  }
  function setToggleLabel() {
    if (!toggleBtn) return;
    toggleBtn.textContent = caseOpen ? 'Cerrar caja' : 'Abrir caja';
    toggleBtn.setAttribute('aria-pressed', caseOpen ? 'true' : 'false');
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
          resolve(tex);
        },
        undefined,
        function (err) {
          reject(err || new Error('tex ' + url));
        }
      );
    });
  }

  function makeMat(map, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      map: map || null,
      color: map ? 0xffffff : opts.color || 0x222222,
      roughness: opts.roughness != null ? opts.roughness : 0.42,
      metalness: opts.metalness != null ? opts.metalness : 0.05,
      transparent: !!opts.transparent,
      alphaTest: opts.alphaTest != null ? opts.alphaTest : 0,
      side: opts.side != null ? opts.side : THREE.FrontSide,
      depthWrite: opts.depthWrite != null ? opts.depthWrite : true
    });
  }

  function roundedPlane(w, h, r, segs) {
    // simple plane is fine for jewel art; slight bevel via box
    return new THREE.PlaneGeometry(w, h, segs || 1, segs || 1);
  }

  function buildCase() {
    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // --- back shell (contratapa visible from behind when closed) ---
    var backGeo = new THREE.BoxGeometry(CW, CH, BACK_T);
    // multi-material: 0right 1left 2top 3bottom 4front 5back
    var plasticDark = makeMat(null, { color: 0x1a1210, roughness: 0.55 });
    var backFace = makeMat(textures.back, { roughness: 0.48 });
    var backInner = makeMat(null, { color: 0x2a1c18, roughness: 0.6 });
    var backMats = [
      plasticDark,
      plasticDark,
      plasticDark,
      plasticDark,
      backInner, // front of back shell (inside)
      backFace // outer back (world -Z when looking from front? box: +Z is front)
    ];
    // Three BoxGeometry face order: +x -x +y -y +z -z
    // We want outer back art on the -Z face when case faces camera (+Z toward cam).
    // Camera looks at -Z, so front of case is +Z. Outer back = -Z face index 5.
    backMats = [plasticDark, plasticDark, plasticDark, plasticDark, backInner, backFace];
    var backMesh = new THREE.Mesh(backGeo, backMats);
    backMesh.position.z = -CD * 0.5 + BACK_T * 0.5;
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    rootGroup.add(backMesh);

    // spine (left edge strip)
    var spineGeo = new THREE.BoxGeometry(SPINE_W, CH * 0.98, CD * 0.92);
    var spineMat = makeMat(null, { color: 0x2b1814, roughness: 0.5 });
    var spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(-CW * 0.5 + SPINE_W * 0.5, 0, 0);
    rootGroup.add(spine);

    // tray (orange plastic + art)
    var trayGeo = new THREE.BoxGeometry(CW * 0.96, CH * 0.96, TRAY_T);
    var trayMatOuter = makeMat(textures.tray, {
      roughness: 0.55,
      transparent: true,
      alphaTest: 0.08
    });
    var trayPlastic = makeMat(null, { color: 0xc45a28, roughness: 0.4 });
    var trayMats = [
      trayPlastic,
      trayPlastic,
      trayPlastic,
      trayPlastic,
      trayMatOuter, // +Z face toward camera when open
      trayPlastic
    ];
    var tray = new THREE.Mesh(trayGeo, trayMats);
    tray.position.z = -CD * 0.5 + BACK_T + TRAY_T * 0.5 + 0.002;
    tray.castShadow = true;
    tray.receiveShadow = true;
    rootGroup.add(tray);

    // hub ring under disc
    var hub = new THREE.Mesh(
      new THREE.CylinderGeometry(DISC_R * 0.14, DISC_R * 0.16, 0.006, 32),
      makeMat(null, { color: 0x1a1a1a, roughness: 0.7, metalness: 0.2 })
    );
    hub.rotation.x = Math.PI * 0.5;
    hub.position.z = tray.position.z + TRAY_T * 0.5 + 0.004;
    rootGroup.add(hub);

    // disc
    discPivot = new THREE.Group();
    discPivot.position.z = tray.position.z + TRAY_T * 0.5 + 0.01;
    rootGroup.add(discPivot);

    var discGeo = new THREE.CylinderGeometry(DISC_R, DISC_R, DISC_T, 64);
    // Cylinder: top + bottom + side — map disc art on top (+Y before rot)
    var discTop = makeMat(textures.disc, {
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      alphaTest: 0.2
    });
    var discBottom = makeMat(null, { color: 0xc8c8c8, roughness: 0.25, metalness: 0.45 });
    var discSide = makeMat(null, { color: 0xdddddd, roughness: 0.3, metalness: 0.35 });
    discMesh = new THREE.Mesh(discGeo, [discSide, discTop, discBottom]);
    discMesh.rotation.x = Math.PI * 0.5; // disc faces camera
    discMesh.castShadow = true;
    discMesh.userData.pick = 'disc';
    discPivot.add(discMesh);

    // thin clear rim for plastic feel
    var rim = new THREE.Mesh(
      new THREE.TorusGeometry(DISC_R * 0.995, 0.0035, 8, 64),
      makeMat(null, { color: 0xffffff, roughness: 0.2, metalness: 0.6 })
    );
    rim.position.z = 0.001;
    discPivot.add(rim);

    // --- lid pivot at left spine hinge ---
    lidPivot = new THREE.Group();
    lidPivot.position.set(-CW * 0.5, 0, CD * 0.5 - LID_T * 0.5);
    rootGroup.add(lidPivot);

    var lid = new THREE.Group();
    lid.position.set(CW * 0.5, 0, 0);
    lidPivot.add(lid);

    var lidGeo = new THREE.BoxGeometry(CW, CH, LID_T);
    var lidFront = makeMat(textures.front, { roughness: 0.4 }); // outer front when closed
    var lidInside = makeMat(textures.cover, {
      roughness: 0.45,
      transparent: true,
      alphaTest: 0.05
    }); // inside of lid
    var lidEdge = makeMat(null, { color: 0x1c1412, roughness: 0.55 });
    // +Z = outer front when closed (faces camera), -Z = inside cover art
    var lidMats = [lidEdge, lidEdge, lidEdge, lidEdge, lidFront, lidInside];
    var lidMesh = new THREE.Mesh(lidGeo, lidMats);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidMesh.userData.pick = 'lid';
    lid.add(lidMesh);

    // subtle clear plastic edge highlight on lid
    var lidFrame = new THREE.Mesh(
      new THREE.BoxGeometry(CW * 1.002, CH * 1.002, LID_T * 1.05),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.15,
        metalness: 0.05,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide
      })
    );
    lid.add(lidFrame);

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

  function pick(clientX, clientY) {
    if (!raycaster || !camera || !rootGroup) return null;
    var rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    var hits = raycaster.intersectObjects(rootGroup.children, true);
    if (!hits.length) return null;
    var o = hits[0].object;
    while (o) {
      if (o.userData && o.userData.pick) return o.userData.pick;
      o = o.parent;
    }
    return 'case';
  }

  function onPointerDown(e) {
    if (!open || !ready) return;
    if (e.button != null && e.button !== 0) return;
    dragging = true;
    autoOrbit = false; // user takes control
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    try {
      renderer.domElement.setPointerCapture(e.pointerId);
    } catch (err) {}

    var hit = pick(e.clientX, e.clientY);
    if (caseOpen && hit === 'disc') {
      dragMode = 'disc';
      discIdleT = 0;
      discSpinVel = 0;
    } else {
      dragMode = 'case';
      // lock targets to current pose so drag feels direct
      targetRotY = rotY;
      targetRotX = rotX;
    }
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging || !open) return;
    if (pointerId != null && e.pointerId !== pointerId) return;
    var dx = e.clientX - lastX;
    var dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    if (dragMode === 'disc') {
      // horizontal drag spins disc; vertical adds a bit
      discUserSpin += dx * 0.02 + dy * 0.005;
      discSpinVel = dx * 0.05;
      discIdleT = 0;
    } else {
      targetRotY += dx * 0.008;
      targetRotX += dy * 0.005;
      targetRotX = Math.max(-0.55, Math.min(0.65, targetRotX));
      rotY = targetRotY;
      rotX = targetRotX;
    }
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (pointerId != null && e.pointerId !== pointerId) return;
    dragging = false;
    dragMode = null;
    pointerId = null;
    // resume continuous showcase after a short beat
    autoOrbit = true;
    try {
      renderer.domElement.releasePointerCapture(e.pointerId);
    } catch (err) {}
  }

  function onWheel(e) {
    if (!open || !ready) return;
    e.preventDefault();
    var z = camera.position.z + e.deltaY * 0.0025;
    camera.position.z = Math.max(2.2, Math.min(4.6, z));
  }

  function toggleLid() {
    caseOpen = !caseOpen;
    lidTarget = caseOpen ? OPEN_ANGLE : 0;
    setToggleLabel();
    setStatus(caseOpen ? 'Caja abierta' : 'Caja cerrada');
    setHint(
      caseOpen
        ? 'Gira sola · tocá el disco o la caja para frenar y controlar · Cerrar caja'
        : 'Gira sola · mantené el mouse para frenar y rotar · Abrir caja'
    );
    // keep auto showcase; nudge pose slightly when opening
    if (caseOpen) {
      if (!dragging) {
        targetRotY = rotY;
        targetRotX = 0.22;
      }
      discSpinVel = OPEN_DISC_SPIN;
    } else {
      if (!dragging) {
        targetRotX = 0.18;
      }
      discSpinVel = CASE_DISC_SPIN;
    }
    autoOrbit = !dragging;
  }

  function animate() {
    if (!open || !ready) return;
    raf = requestAnimationFrame(animate);
    var dt = Math.min(0.05, clock.getDelta());
    autoT += dt;

    // smooth lid
    lidAngle += (lidTarget - lidAngle) * Math.min(1, dt * 5.5);
    if (lidPivot) lidPivot.rotation.y = lidAngle;

    // continuous case orbit unless user is holding the pointer
    if (autoOrbit && !dragging) {
      targetRotY += autoOrbitSpeed * dt;
      // gentle breathing tilt so it feels alive, not a turntable
      var baseTilt = caseOpen ? 0.22 : 0.18;
      targetRotX = baseTilt + Math.sin(autoT * autoTiltSpeed) * autoTiltAmp;
      rotY = targetRotY;
      rotX += (targetRotX - rotX) * Math.min(1, dt * 4);
    } else {
      // smooth toward manual targets while / after drag
      rotY += (targetRotY - rotY) * Math.min(1, dt * 10);
      rotX += (targetRotX - rotX) * Math.min(1, dt * 10);
    }
    if (rootGroup) {
      rootGroup.rotation.y = rotY;
      rootGroup.rotation.x = rotX;
    }

    // disc spin: continuous unless user is dragging the disc
    if (discPivot) {
      if (dragMode === 'disc') {
        discPivot.rotation.z = discUserSpin;
      } else {
        discIdleT += dt;
        var want = caseOpen ? OPEN_DISC_SPIN : CASE_DISC_SPIN;
        if (discIdleT > 0.2) {
          discSpinVel += (want - discSpinVel) * Math.min(1, dt * 2.2);
        } else {
          // residual flick then ease back to idle
          discSpinVel += (want - discSpinVel) * Math.min(1, dt * 0.9);
        }
        discUserSpin += discSpinVel * dt;
        discPivot.rotation.z = discUserSpin;
      }
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
    setStatus('Cargando modelo…');
    try {
      THREE = await loadScript(THREE_CDN);
      if (!canvasHost) throw new Error('no canvas host');

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      canvasHost.innerHTML = '';
      canvasHost.appendChild(renderer.domElement);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.touchAction = 'none';
      renderer.domElement.setAttribute('aria-label', 'Mockup 3D de caja de CD');

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
      camera.position.set(0, 0.05, 3.15);
      camera.lookAt(0, 0, 0);
      clock = new THREE.Clock();
      raycaster = new THREE.Raycaster();
      pointerNdc = new THREE.Vector2();

      // lights
      var amb = new THREE.AmbientLight(0xfff0e8, 0.55);
      scene.add(amb);
      var key = new THREE.DirectionalLight(0xffffff, 1.15);
      key.position.set(2.2, 3.2, 4.0);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 20;
      scene.add(key);
      var fill = new THREE.DirectionalLight(0xb8d0ff, 0.35);
      fill.position.set(-3, 1.2, 2);
      scene.add(fill);
      var rim = new THREE.DirectionalLight(0xffc8a0, 0.28);
      rim.position.set(0.5, -2, -3);
      scene.add(rim);

      // soft ground shadow catcher
      var ground = new THREE.Mesh(
        new THREE.CircleGeometry(1.6, 48),
        new THREE.ShadowMaterial({ opacity: 0.28 })
      );
      ground.rotation.x = -Math.PI * 0.5;
      ground.position.y = -CH * 0.55;
      ground.receiveShadow = true;
      scene.add(ground);

      var loader = new THREE.TextureLoader();
      var base = texDir.replace(/\/+$/, '') + '/';
      var pairs = [
        ['front', base + 'front.webp'],
        ['back', base + 'back.webp'],
        ['cover', base + 'cover.webp'],
        ['tray', base + 'tray.webp'],
        ['disc', base + 'disc.webp']
      ];
      for (var i = 0; i < pairs.length; i++) {
        textures[pairs[i][0]] = await loadTexture(loader, pairs[i][1]);
      }

      buildCase();
      resize();
      ready = true;
      setStatus(caseOpen ? 'Caja abierta' : 'Caja cerrada');
      bindInput(true);
      window.addEventListener('resize', resize);
    } catch (err) {
      console.error('[cd-case]', err);
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
    document.body.classList.toggle('cd-case-open', open);
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // don't fight other overlays if still open
      if (
        !document.body.classList.contains('pg-viewer-open') &&
        !document.body.classList.contains('carta-revista-open') &&
        !document.body.classList.contains('brand-manual-open') &&
        !document.body.classList.contains('figma-proto-open')
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

  async function openCdCase(opts) {
    opts = opts || {};
    if (opts.dir) texDir = String(opts.dir);
    if (titleEl) titleEl.textContent = opts.title || 'Desembarco — CD';
    caseOpen = false;
    lidAngle = 0;
    lidTarget = 0;
    rotY = -0.35;
    rotX = 0.18;
    targetRotY = rotY;
    targetRotX = rotX;
    discUserSpin = 0;
    discSpinVel = CASE_DISC_SPIN;
    discIdleT = 0;
    autoOrbit = true;
    autoT = 0;
    dragging = false;
    dragMode = null;
    setToggleLabel();
    setHint('Gira sola · mantené el mouse para frenar y rotar · Abrir caja');
    setOpen(true);
    try {
      await ensureScene();
      // if dir changed after first load, would need rebuild — first version single pack
      if (rootGroup) {
        rootGroup.rotation.y = rotY;
        rootGroup.rotation.x = rotX;
      }
      if (lidPivot) lidPivot.rotation.y = 0;
      stopLoop();
      clock.getDelta();
      animate();
      setStatus('Caja cerrada');
    } catch (e) {
      /* status already set */
    }
  }

  function closeCdCase() {
    stopLoop();
    setOpen(false);
    dragging = false;
    dragMode = null;
  }

  if (closeBtn) closeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    closeCdCase();
  });
  if (backdrop) backdrop.addEventListener('click', function () {
    closeCdCase();
  });
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!ready) return;
      toggleLid();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCdCase();
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A')) return;
      e.preventDefault();
      if (ready) toggleLid();
    }
  });

  window.openCdCase = openCdCase;
  window.closeCdCase = closeCdCase;
})();
