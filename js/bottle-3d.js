/* ============================================================
   BOTTLE 3D — packaging interactivo (Fernet Cordobita)
   API: window.openBottle3d(opts) / window.closeBottle3d()
   Forma: silueta tipo fernet (lisa, sin relieve de marca).
   Vidrio: negro opaco (packaging; el líquido no se ve).
   Pico: rosca / tapa negra.
   Cuello corto.
   Etiquetas: label-front / label-back (Cordobita) en opts.dir
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

  // Proporciones tipo botella fernet (cuerpo alto, cuello corto)
  var BODY_R = 0.285; // radio cuerpo
  var NECK_R = 0.098;
  var FINISH_R = 0.112;
  var BODY_TOP = 1.58; // fin del cilindro del cuerpo
  var SHOULDER_TOP = 1.88; // hombro mas bajo
  var NECK_TOP = 2.12; // cuello menos alto
  var LIP_TOP = 2.24;

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
  var rotY = 0.55;
  var rotX = 0.08;
  var targetRotY = rotY;
  var targetRotX = rotX;
  var autoOrbit = true;
  var autoOrbitSpeed = 0.4;
  var autoTiltAmp = 0.03;
  var autoTiltSpeed = 0.45;
  var autoT = 0;
  var pointerId = null;

  // líquido fernet marrón bien oscuro (no el gris del sample anterior)
  var LIQUID = { r: 26, g: 12, b: 6 };

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

  /** Vidrio negro opaco (packaging). Brillo de botella de vidrio oscuro. */
  function blackGlassMat(opts) {
    opts = opts || {};
    return new THREE.MeshPhysicalMaterial({
      color: opts.color != null ? opts.color : 0x050506,
      metalness: 0.35,
      roughness: opts.roughness != null ? opts.roughness : 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.55,
      envMapIntensity: 1.35,
      side: THREE.FrontSide
    });
  }

  /** Capa interior oscura para volumen (sin transmision rara en iGPU). */
  function glassInnerMat() {
    return new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      metalness: 0.15,
      roughness: 0.45,
      side: THREE.BackSide
    });
  }

  function profilePoints() {
      // Lathe: x = radio, y = altura.
      // Más puntos de control en hombro/base = silueta más redonda (look SDS sin Modifier).
      return [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(BODY_R * 0.78, 0.0),
        new THREE.Vector2(BODY_R * 0.92, 0.018),
        new THREE.Vector2(BODY_R * 0.98, 0.05),
        new THREE.Vector2(BODY_R, 0.12),
        // cuerpo cilíndrico alto (leve belly suave)
        new THREE.Vector2(BODY_R * 1.005, BODY_TOP * 0.35),
        new THREE.Vector2(BODY_R, BODY_TOP * 0.55),
        new THREE.Vector2(BODY_R * 0.998, BODY_TOP * 0.82),
        new THREE.Vector2(BODY_R * 0.99, BODY_TOP),
        // hombro muy suave (curva larga tipo subdivision)
        new THREE.Vector2(BODY_R * 0.94, BODY_TOP + 0.06),
        new THREE.Vector2(BODY_R * 0.82, BODY_TOP + 0.14),
        new THREE.Vector2(BODY_R * 0.66, BODY_TOP + 0.22),
        new THREE.Vector2(BODY_R * 0.5, SHOULDER_TOP - 0.1),
        new THREE.Vector2(BODY_R * 0.36, SHOULDER_TOP - 0.04),
        new THREE.Vector2(NECK_R * 1.28, SHOULDER_TOP),
        new THREE.Vector2(NECK_R * 1.1, SHOULDER_TOP + 0.05),
        // cuello
        new THREE.Vector2(NECK_R * 1.02, SHOULDER_TOP + 0.1),
        new THREE.Vector2(NECK_R, NECK_TOP - 0.14),
        new THREE.Vector2(NECK_R * 1.02, NECK_TOP - 0.1),
        // finish / zona de rosca (filetes más redondos)
        new THREE.Vector2(FINISH_R * 0.9, NECK_TOP - 0.07),
        new THREE.Vector2(FINISH_R * 0.98, NECK_TOP - 0.03),
        new THREE.Vector2(FINISH_R, NECK_TOP),
        new THREE.Vector2(FINISH_R * 0.99, LIP_TOP - 0.05),
        new THREE.Vector2(FINISH_R * 0.92, LIP_TOP - 0.02),
        new THREE.Vector2(FINISH_R * 0.82, LIP_TOP),
        new THREE.Vector2(0.0, LIP_TOP)
      ];
    }

    /** Suaviza la polyline del perfil (Chaikin) → look Subdivision Surface. */
    function smoothProfile(pts, iterations) {
      iterations = iterations == null ? 2 : iterations;
      var out = pts.slice();
      for (var n = 0; n < iterations; n++) {
        var next = [];
        next.push(out[0].clone());
        for (var i = 0; i < out.length - 1; i++) {
          var a = out[i];
          var b = out[i + 1];
          next.push(new THREE.Vector2(a.x * 0.75 + b.x * 0.25, a.y * 0.75 + b.y * 0.25));
          next.push(new THREE.Vector2(a.x * 0.25 + b.x * 0.75, a.y * 0.25 + b.y * 0.75));
        }
        next.push(out[out.length - 1].clone());
        out = next;
      }
      return out;
    }

  function liquidPoints() {
    var inset = 0.03;
    var fillTop = BODY_TOP + 0.16; // nivel típico bajo el hombro
    return [
      new THREE.Vector2(0.0, 0.06),
      new THREE.Vector2(BODY_R - inset - 0.015, 0.06),
      new THREE.Vector2(BODY_R - inset, 0.12),
      new THREE.Vector2(BODY_R - inset, BODY_TOP * 0.55),
      new THREE.Vector2(BODY_R - inset - 0.002, BODY_TOP),
      new THREE.Vector2(BODY_R * 0.8 - inset, BODY_TOP + 0.07),
      new THREE.Vector2(BODY_R * 0.45, fillTop - 0.04),
      new THREE.Vector2(0.0, fillTop)
    ];
  }

  function buildScrewCap() {
    var g = new THREE.Group();
    var black = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      metalness: 0.18,
      roughness: 0.42
    });
    var blackSoft = new THREE.MeshStandardMaterial({
      color: 0x141416,
      metalness: 0.12,
      roughness: 0.5
    });

    // cuerpo de la tapa
    var bodyH = 0.2;
    var capR = FINISH_R + 0.012;
    var body = new THREE.Mesh(
          new THREE.CylinderGeometry(capR, capR * 1.02, bodyH, 64),
          black
        );
    body.position.y = bodyH * 0.5;
    body.castShadow = true;
    g.add(body);

    // roscas visibles (anillos)
    for (var i = 0; i < 5; i++) {
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(capR + 0.004, 0.0065, 10, 40),
        blackSoft
      );
      ring.rotation.x = Math.PI * 0.5;
      ring.position.y = 0.03 + i * 0.032;
      g.add(ring);
    }

    // tapa superior
    var top = new THREE.Mesh(
      new THREE.CylinderGeometry(capR * 0.96, capR * 0.96, 0.03, 48),
      black
    );
    top.position.y = bodyH + 0.01;
    g.add(top);

    // knurl sutil en el borde superior
    var rim = new THREE.Mesh(
      new THREE.TorusGeometry(capR * 0.92, 0.008, 8, 48),
      blackSoft
    );
    rim.rotation.x = Math.PI * 0.5;
    rim.position.y = bodyH + 0.02;
    g.add(rim);

    g.position.y = LIP_TOP - 0.02;
    return g;
  }

  function makeLabel(tex, yRot, labelH, labelY, labelR, labelArc) {
    var segs = 72;
    // fit arc to image aspect so wider/taller labels are not cropped badly
    var arc = labelArc;
    if (tex && tex.image) {
      var img = tex.image;
      var iw = img.width || 1;
      var ih = img.height || 1;
      var imgAspect = iw / ih;
      var desiredArc = (imgAspect * labelH) / Math.max(0.001, labelR);
      var minA = Math.PI * 0.72;
      var maxA = Math.PI * 1.08;
      arc = Math.max(minA, Math.min(maxA, desiredArc));
      // full image UV — no crop
      tex.repeat.set(1, 1);
      tex.offset.set(0, 0);
      tex.needsUpdate = true;
    }
    var geo = new THREE.CylinderGeometry(
      labelR,
      labelR,
      labelH,
      segs,
      1,
      true,
      -arc * 0.5,
      arc
    );
    var mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.42,
      metalness: 0.0,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.FrontSide,
      depthTest: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    var m = new THREE.Mesh(geo, mat);
    m.position.y = labelY;
    m.rotation.y = yRot;
    m.renderOrder = 3;
    m.castShadow = true;
    return m;
  }

  function disposeObject(obj) {
    if (!obj) return;
    obj.traverse(function (c) {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        var mats = Array.isArray(c.material) ? c.material : [c.material];
        mats.forEach(function (m) {
          if (m.map) {
            /* keep shared textures */
          }
          m.dispose();
        });
      }
    });
  }

  function buildBottle() {
    if (rootGroup) {
      scene.remove(rootGroup);
      disposeObject(rootGroup);
      rootGroup = null;
    }
    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Perfil suavizado (Chaikin) + más segmentos = look SDS sin modifier C4D
        var pts = smoothProfile(profilePoints(), 2);
        var bodyGeo = new THREE.LatheGeometry(pts, 160);
        bodyGeo.computeVertexNormals();

        // shell vidrio negro opaco
        var shell = new THREE.Mesh(
          bodyGeo,
          blackGlassMat({ roughness: 0.14 })
        );
        shell.castShadow = true;
        shell.receiveShadow = true;
        shell.renderOrder = 1;
        rootGroup.add(shell);

        // capa interior oscura (volumen) — misma curva suavizada
        var innerPts = pts.map(function (v) {
          return new THREE.Vector2(Math.max(0, v.x * 0.94), v.y);
        });
        var innerGeo = new THREE.LatheGeometry(innerPts, 96);
        innerGeo.computeVertexNormals();
        var inner = new THREE.Mesh(innerGeo, glassInnerMat());
        inner.renderOrder = 0;
        rootGroup.add(inner);

    // etiquetas Cordobita en el cuerpo (arco se ajusta al aspect de cada arte)
    var labelH = 1.05;
    var labelY = 0.2 + labelH * 0.5;
    var labelR = BODY_R + 0.014;
    var labelArc = Math.PI * 0.9; // base; makeLabel reajusta por imagen

    function texForLabel(src) {
      // clonar textura para UV independientes front/back
      if (!src) return null;
      var t = src.clone();
      t.needsUpdate = true;
      return t;
    }

    if (textures.front) {
      rootGroup.add(makeLabel(texForLabel(textures.front), 0, labelH, labelY, labelR, labelArc));
    }
    if (textures.back) {
      rootGroup.add(makeLabel(texForLabel(textures.back), Math.PI, labelH, labelY, labelR, labelArc));
    }

    // tapa rosca negra (sin foil dorado)
    var cap = buildScrewCap();
    cap.renderOrder = 4;
    rootGroup.add(cap);

    // centrar visualmente
    rootGroup.position.y = -LIP_TOP * 0.48;
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
    targetRotX = Math.max(-0.28, Math.min(0.38, targetRotX));
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
    camera.position.z = Math.max(2.6, Math.min(5.6, z));
  }

  function animate() {
    if (!open || !ready) return;
    raf = requestAnimationFrame(animate);
    var dt = Math.min(0.05, clock.getDelta());
    autoT += dt;

    if (autoOrbit && !dragging) {
      targetRotY += autoOrbitSpeed * dt;
      targetRotX = 0.08 + Math.sin(autoT * autoTiltSpeed) * autoTiltAmp;
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
      // rebuild geometry if labels dir changed or to apply latest profile after hot reload
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
      renderer.toneMappingExposure = 1.2;
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
      camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
      camera.position.set(0, 0.05, 3.85);
      camera.lookAt(0, 0.02, 0);
      clock = new THREE.Clock();

      // iluminación para vidrio negro + etiquetas legibles
      scene.add(new THREE.AmbientLight(0xffffff, 0.62));
      var key = new THREE.DirectionalLight(0xffffff, 1.45);
      key.position.set(2.6, 4.0, 3.2);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      var fill = new THREE.DirectionalLight(0xe8f0ff, 0.7);
      fill.position.set(-3.2, 1.8, 2.2);
      scene.add(fill);
      var rim = new THREE.DirectionalLight(0xffe8d2, 0.65);
      rim.position.set(-1.2, 2.0, -3.2);
      scene.add(rim);
      var front = new THREE.DirectionalLight(0xffffff, 0.55);
      front.position.set(0.2, 1.2, 4.5);
      scene.add(front);
      var hemi = new THREE.HemisphereLight(0xf0f4ff, 0x2a2218, 0.4);
      scene.add(hemi);

      var ground = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 48),
        new THREE.ShadowMaterial({ opacity: 0.28 })
      );
      ground.rotation.x = -Math.PI * 0.5;
      ground.position.y = -LIP_TOP * 0.48 - 0.01;
      ground.receiveShadow = true;
      scene.add(ground);

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
    rotY = 0.55;
    rotX = 0.08;
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
