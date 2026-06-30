(function () {
  'use strict';

  let container, scene, camera, renderer, raycaster, mouse;
  let masterWorldGroup;
  let roomNodes = [];
  let particleSystem;
  let structuralSkeleton;
  let skeletonEdges;
  let glowRing;
  let outerLabels = [];
  let connectionBeams = [];
  let starField = null;
  let nebulaField = null;
  let structureGroup = null;
  const _starPhases = [];
  const _starBaseSizes = [];

  let hIndex = 3;
  let vIndex = 0;

  let targetCamPos = new THREE.Vector3();
  let targetCamTarget = new THREE.Vector3();
  let targetCamUp = new THREE.Vector3(0, 1, 0);
  let currentUp = new THREE.Vector3(0, 1, 0);
  let isCameraAnimating = false;
  let isSlerping = false;

  let currentStylePreset = 0;
  let inputCooldownActive = false;
  let isInsideRoom = false;
  let activeRoomIndex = -1;

  let enterAnimation = null;
  let exitAnimation = null;

  let landingCanvas = null;
  let landingCtx = null;
  let landingParticles = [];
  let landingAnimId = null;
  let worldRevealed = false;
  let worldInitialized = false;

  const RADIUS = 52;
  const BOX_HALF = 12;
  const BOX_H = 24;
  const CAM_DIST = 58;

  const ROOM_CONFIGS = [
    { id: 0, name: 'Services', label: 'SERVICES', color: 0xff6644, emissiveColor: 0x661100, pos: [0, RADIUS, 0], type: 'top', contentType: 'home', icon: '<i class=\"fa-solid fa-cubes\"></i>' },
    { id: 1, name: 'Projects', label: 'PROJECTS', color: 0x00ffcc, emissiveColor: 0x003322, pos: [0, 0, RADIUS], type: 'front', contentType: 'projects', icon: '<i class=\"fa-solid fa-cube\"></i>' },
    { id: 2, name: 'Skills', label: 'SKILLS', color: 0x3388ff, emissiveColor: 0x001433, pos: [RADIUS, 0, 0], type: 'right', contentType: 'skills', icon: '<i class=\"fa-solid fa-bolt\"></i>' },
    { id: 3, name: 'Experience', label: 'EXPERIENCE', color: 0x6644ff, emissiveColor: 0x110044, pos: [0, 0, -RADIUS], type: 'back', contentType: 'experience', icon: '<i class=\"fa-solid fa-briefcase\"></i>' },
    { id: 4, name: 'Contact', label: 'CONTACT', color: 0xaa33ff, emissiveColor: 0x220044, pos: [0, -RADIUS, 0], type: 'bottom', contentType: 'contact', icon: '<i class=\"fa-solid fa-envelope\"></i>' },
    { id: 5, name: 'About', label: 'ABOUT', color: 0x7c8fff, emissiveColor: 0x101340, pos: [-RADIUS, 0, 0], type: 'left', contentType: 'about', icon: '<i class=\"fa-solid fa-user\"></i>' }
  ];

  function initLandingParticles() {
    landingCanvas = document.getElementById('landingCanvas');
    if (!landingCanvas) return;
    landingCtx = landingCanvas.getContext('2d');
    resizeLandingCanvas();
    landingParticles = [];
    for (let i = 0; i < 120; i++) {
      landingParticles.push({
        x: Math.random() * landingCanvas.width,
        y: Math.random() * landingCanvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        pulse: Math.random() * Math.PI * 2
      });
    }
    animateLandingParticles();
    window.addEventListener('resize', resizeLandingCanvas);
  }

  function resizeLandingCanvas() {
    if (!landingCanvas) return;
    landingCanvas.width = landingCanvas.parentElement.offsetWidth;
    landingCanvas.height = landingCanvas.parentElement.offsetHeight;
  }

  function animateLandingParticles() {
    if (!landingCtx || !landingCanvas) return;
    const w = landingCanvas.width;
    const h = landingCanvas.height;
    landingCtx.clearRect(0, 0, w, h);
    const t = Date.now() * 0.001;
    landingParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      const pulse = Math.sin(t + p.pulse) * 0.3 + 0.7;
      landingCtx.beginPath();
      landingCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      landingCtx.fillStyle = `rgba(0, 204, 255, ${p.opacity * pulse})`;
      landingCtx.fill();
    });
    for (let i = 0; i < landingParticles.length; i++) {
      for (let j = i + 1; j < landingParticles.length; j++) {
        const dx = landingParticles[i].x - landingParticles[j].x;
        const dy = landingParticles[i].y - landingParticles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          landingCtx.beginPath();
          landingCtx.moveTo(landingParticles[i].x, landingParticles[i].y);
          landingCtx.lineTo(landingParticles[j].x, landingParticles[j].y);
          landingCtx.strokeStyle = `rgba(68, 136, 255, ${0.08 * (1 - dist / 120)})`;
          landingCtx.stroke();
        }
      }
    }
    landingAnimId = requestAnimationFrame(animateLandingParticles);
  }

  function runLandingAnimation() {
    const data = typeof getData === 'function' ? getData() : {};
    const p = data.personal || {};

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.landing-photo-wrap', { opacity: 1, scale: 1, duration: 0.9, from: { scale: 0.85 } })
      .to('.landing-greeting', { opacity: 1, y: 0, duration: 0.8, from: { y: 20 } }, '-=0.6')
      .to('.landing-name', { opacity: 1, y: 0, duration: 0.8, from: { y: 20 } }, '-=0.4')
      .to('.landing-title', { opacity: 1, y: 0, duration: 0.8, from: { y: 20 } }, '-=0.4')
      .to('.landing-stats', { opacity: 1, y: 0, duration: 0.6, from: { y: 20 } }, '-=0.3')
      .to('.landing-prompt', { opacity: 1, y: 0, duration: 0.6, from: { y: 20 } }, '-=0.2');

    const nameEl = document.getElementById('landingName');
    if (nameEl && p.firstName && p.lastName) {
      nameEl.innerHTML = `${p.firstName} <span>${p.lastName}</span>`;
    }
    const greetingEl = document.getElementById('landingGreeting');
    if (greetingEl && p.greeting) greetingEl.textContent = p.greeting;
    const titleEl = document.getElementById('landingTitle');
    if (titleEl && p.heroSubtitle) titleEl.textContent = p.heroSubtitle;
    const statsEl = document.getElementById('landingStats');
    if (statsEl && p.stats && p.stats.length) {
      statsEl.innerHTML = p.stats.map(s => `
        <div class="landing-stat">
          <div class="landing-stat-num">${s.number}</div>
          <div class="landing-stat-lbl">${s.label}</div>
        </div>
      `).join('');
    }

    if (window.innerWidth <= 768) {
      tl.add(function () { setTimeout(dismissLanding, 4000); });
    }
    armLandingDismissKey();
    document.querySelector('.landing-prompt')?.addEventListener('click', dismissLanding);
  }

  function armLandingDismissKey() {
    window.addEventListener('keydown', function onFirstKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopImmediatePropagation();
        window.removeEventListener('keydown', onFirstKey, true);
        dismissLanding();
      }
    }, true);
  }

  function requestSiteFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (req) {
      try {
        const result = req.call(el);
        if (result && result.catch) result.catch(() => {});
      } catch (e) { /* fullscreen unavailable (e.g. embedded iframe) — ignore */ }
    }
    // Make sure the document actually has keyboard focus after this user gesture —
    // otherwise window-level keydown listeners (Space to enter/exit rooms) can
    // silently never fire if focus landed on browser chrome or nothing at all.
    window.focus();
    if (document.body && document.body.focus) document.body.focus();
  }

  function returnToLanding() {
    if (!worldRevealed || isInsideRoom || isCameraAnimating || isSlerping) return;

    const overlay = document.getElementById('landingOverlay');
    const content = document.getElementById('landingContent');
    if (!overlay) return;

    worldRevealed = false;

    const tl = gsap.timeline();

    // Mirror of dismissLanding: structure shrinks back into the center point,
    // stars/nebula fade out, then the landing overlay fades/scales back in.
    tl.to(structureGroup.scale, { x: 0.0001, y: 0.0001, z: 0.0001, duration: 1.1, ease: 'power3.in' }, 0);
    tl.to(starField.material, { opacity: 0, duration: 0.9, ease: 'power2.in' }, 0);
    tl.to(nebulaField.material, { opacity: 0, duration: 0.9, ease: 'power2.in' }, 0);
    if (camera) {
      tl.to(camera, { fov: 32, duration: 1.1, ease: 'power3.in', onUpdate: () => camera.updateProjectionMatrix() }, 0);
    }
    tl.add(() => {
      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');
      overlay.style.opacity = '0';
      content.style.opacity = '0';
      content.style.transform = 'scale(0.2)';
    });
    tl.to(overlay, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    tl.to(content, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.3');
    tl.add(() => {
      if (camera) { camera.fov = 45; camera.updateProjectionMatrix(); }
      armLandingDismissKey();
    });
  }

  function dismissLanding() {
    if (worldRevealed) return;
    worldRevealed = true;
    if (landingAnimId) { cancelAnimationFrame(landingAnimId); landingAnimId = null; }

    // Must be called synchronously within the user-gesture handler (Enter/click)
    // that triggered dismissLanding, or browsers will silently reject it.
    requestSiteFullscreen();

    const overlay = document.getElementById('landingOverlay');
    const content = document.getElementById('landingContent');
    if (!overlay) return;

    const tl = gsap.timeline();

    // Stage 1: the landing content (text/UI) recedes into the empty center point —
    // nothing grows yet, this just clears the foreground. A subtle camera dolly-in
    // reinforces the feeling of pushing toward a single vanishing point.
    if (camera) {
      tl.to(camera, { fov: 32, duration: 0.9, ease: 'power3.in', onUpdate: () => camera.updateProjectionMatrix() }, 0);
    }
    tl.to(content, {
      opacity: 0, scale: 0.2, duration: 0.7, ease: 'power3.in'
    }, 0);
    tl.to(overlay, {
      opacity: 0, duration: 0.6, ease: 'power2.in'
    }, '-=0.2');
    tl.add(() => {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    });

    // Stage 2: stars/nebula fade in around camera first — like emerging from
    // deep space — then the planetary structure grows outward from the center point.
    tl.to(starField.material, { opacity: 1, duration: 1.4, ease: 'power2.out' }, '-=0.5');
    tl.to(nebulaField.material, { opacity: 0.35, duration: 1.4, ease: 'power2.out' }, '-=1.4');
    tl.to(structureGroup.scale, {
      x: 1, y: 1, z: 1, duration: 1.6, ease: 'expo.out'
    }, '-=1.1');
    if (camera) {
      tl.to(camera, { fov: 45, duration: 1.6, ease: 'power2.out', onUpdate: () => camera.updateProjectionMatrix() }, '-=1.6');
    }
  }

  function init() {
    initLandingParticles();
    runLandingAnimation();
    container = document.getElementById('webgl-viewport-container');
    if (!container) return;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05030c);
    scene.fog = new THREE.FogExp2(0x05030c, 0.003);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1200);
    camera.up.set(0, 1, 0);
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    masterWorldGroup = new THREE.Group();
    scene.add(masterWorldGroup);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    container.appendChild(renderer.domElement);

    buildLighting();
    buildAtmosphericDust();
    buildStars();
    buildOctahedralRooms();
    buildOctahedralWireframe();
    buildGlowRing();
    buildConnectionBeams();
    syncPersonalIdentity();
    initInputEngine();
    initClickToEnter();
    initHUDDots();

    computeTargetCamera();
    camera.position.copy(targetCamPos);
    camera.up.copy(targetCamUp);
    currentUp.copy(targetCamUp);
    camera.lookAt(targetCamTarget);

    // Stars/nebula live in their own group so they can be visible immediately,
    // independent of the planet-structure reveal scale animation.
    structureGroup = new THREE.Group();
    masterWorldGroup.children.slice().forEach(child => {
      if (child !== starField && child !== nebulaField) {
        masterWorldGroup.remove(child);
        structureGroup.add(child);
      }
    });
    masterWorldGroup.add(structureGroup);
    structureGroup.scale.set(0.0001, 0.0001, 0.0001);
    if (starField) starField.material.opacity = 0;
    if (nebulaField) nebulaField.material.opacity = 0;

    window.addEventListener('resize', onResize, false);
    animationLoop();
  }

  function buildLighting() {
    scene.add(new THREE.AmbientLight(0x222233, 4));
    const core = new THREE.PointLight(0xffeedd, 18, 450);
    core.position.set(0, 5, 0);
    core.castShadow = true;
    scene.add(core);
    const warm = new THREE.PointLight(0xffeedd, 6, 220);
    warm.position.set(20, 30, 20);
    scene.add(warm);
    const cool = new THREE.PointLight(0xccddff, 6, 220);
    cool.position.set(-20, -30, -20);
    scene.add(cool);
  }

  function buildAtmosphericDust() {
    const count = 1500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    // Spawn dust in a shell (120-600 units out), leaving the inner area where the
    // camera actually orbits (~110 units) completely clear. Particles spawned too
    // close to the camera blow up to fill the screen as flat-looking squares.
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 120 + Math.random() * 480;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const c = new THREE.Color().setHSL(0.60 + Math.random() * 0.12, 0.5, 0.15 + Math.random() * 0.15);
      colors[i] = c.r;
      colors[i + 1] = c.g;
      colors[i + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const dustCanvas = document.createElement('canvas');
    dustCanvas.width = 32;
    dustCanvas.height = 32;
    const dCtx = dustCanvas.getContext('2d');
    const dGrad = dCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    dGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    dGrad.addColorStop(0.4, 'rgba(255,255,255,0.3)');
    dGrad.addColorStop(1, 'rgba(255,255,255,0)');
    dCtx.fillStyle = dGrad;
    dCtx.fillRect(0, 0, 32, 32);
    const dustTex = new THREE.CanvasTexture(dustCanvas);
    const mat = new THREE.PointsMaterial({
      size: 0.6, map: dustTex, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true,
      sizeAttenuation: true
    });
    particleSystem = new THREE.Points(geo, mat);
    masterWorldGroup.add(particleSystem);
  }

  const _swooshParticles = [];
  let _swooshTex = null;
  function _getSwooshTexture() {
    if (_swooshTex) return _swooshTex;
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    _swooshTex = new THREE.CanvasTexture(c);
    return _swooshTex;
  }
  function spawnSwooshTrail(from, to) {
    const tex = _getSwooshTexture();
    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      const pos = new THREE.Vector3().lerpVectors(from, to, t);
      const size = 0.3 + Math.random() * 0.4;
      const geo = new THREE.BufferGeometry();
      const verts = new Float32Array([0, 0, 0]);
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      const mat = new THREE.PointsMaterial({
        color: 0x00ccff, size: size, map: tex, transparent: true, opacity: 0.6 * (1 - t),
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
      });
      const mesh = new THREE.Points(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      _swooshParticles.push({ mesh, life: 1.0, maxLife: 0.8 + Math.random() * 0.4, decay: 0.02 + Math.random() * 0.02 });
    }
  }

  function updateSwooshParticles() {
    for (let i = _swooshParticles.length - 1; i >= 0; i--) {
      const sp = _swooshParticles[i];
      sp.life -= sp.decay;
      if (sp.life <= 0) {
        scene.remove(sp.mesh);
        sp.mesh.geometry.dispose();
        sp.mesh.material.dispose();
        _swooshParticles.splice(i, 1);
      } else {
        sp.mesh.material.opacity = sp.life * 0.6;
      }
    }
  }

  function buildConnectionBeams() {
    const pairs = [
      [0, 1], [0, 2], [0, 3], [0, 5],
      [4, 1], [4, 2], [4, 3], [4, 5],
      [1, 2], [2, 3], [3, 5], [5, 1]
    ];
    pairs.forEach(([a, b]) => {
      const pA = new THREE.Vector3(...ROOM_CONFIGS[a].pos);
      const pB = new THREE.Vector3(...ROOM_CONFIGS[b].pos);
      const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(pB, pA);
      const len = dir.length();
      dir.normalize();
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, len, 4);
      const colorA = new THREE.Color(ROOM_CONFIGS[a].color);
      const colorB = new THREE.Color(ROOM_CONFIGS[b].color);
      const beamMat = new THREE.MeshBasicMaterial({
        color: colorA.lerp(colorB, 0.5),
        transparent: true, opacity: 0.2,
        blending: THREE.AdditiveBlending
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.copy(mid);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      beam.userData.beamColor = colorA.lerp(colorB, 0.5);
      masterWorldGroup.add(beam);
      connectionBeams.push(beam);
    });
  }

  function buildStars() {
    const mainCount = 60000;
    const totalCount = mainCount;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);
    const colors = new Float32Array(totalCount * 3);
    _starPhases.length = 0;
    _starBaseSizes.length = 0;
    const tempColor = new THREE.Color();
    for (let i = 0; i < mainCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 150 + Math.random() * 550;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const baseSize = 2 + Math.random() * 4;
      sizes[i] = baseSize;
      _starBaseSizes.push(baseSize);
      _starPhases.push(Math.random() * Math.PI * 2);
      const blueShift = Math.random();
      tempColor.setHSL(0.70 - blueShift * 0.12, 0.4 + Math.random() * 0.35, 0.6 + Math.random() * 0.4);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starCanvas = document.createElement('canvas');
    starCanvas.width = 64;
    starCanvas.height = 64;
    const sCtx = starCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.1, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 64);
    const starTex = new THREE.CanvasTexture(starCanvas);

    const mat = new THREE.PointsMaterial({
      size: 8,
      map: starTex,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      vertexColors: true
    });
    starField = new THREE.Points(geo, mat);
    starField.position.set(0, 0, 0);
    starField.fog = false;
    starField.frustumCulled = false;
    masterWorldGroup.add(starField);

    const nbCount = 1000;
    const nbGeo = new THREE.BufferGeometry();
    const nbPos = new Float32Array(nbCount * 3);
    const nbCol = new Float32Array(nbCount * 3);
    for (let i = 0; i < nbCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 100 + Math.random() * 400;
      nbPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      nbPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      nbPos[i * 3 + 2] = r * Math.cos(phi);
      const hue = 0.64 + Math.random() * 0.1;
      tempColor.setHSL(hue, 0.3 + Math.random() * 0.2, 0.15 + Math.random() * 0.15);
      nbCol[i * 3] = tempColor.r;
      nbCol[i * 3 + 1] = tempColor.g;
      nbCol[i * 3 + 2] = tempColor.b;
    }
    nbGeo.setAttribute('position', new THREE.BufferAttribute(nbPos, 3));
    nbGeo.setAttribute('color', new THREE.BufferAttribute(nbCol, 3));

    const nbCanvas = document.createElement('canvas');
    nbCanvas.width = 64; nbCanvas.height = 64;
    const nbCtx = nbCanvas.getContext('2d');
    const nbGrad = nbCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    nbGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
    nbGrad.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    nbGrad.addColorStop(1, 'rgba(255,255,255,0)');
    nbCtx.fillStyle = nbGrad;
    nbCtx.fillRect(0, 0, 64, 64);
    const nbTex = new THREE.CanvasTexture(nbCanvas);

    const nbMat = new THREE.PointsMaterial({
      size: 20,
      map: nbTex,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
      vertexColors: true
    });
    nebulaField = new THREE.Points(nbGeo, nbMat);
    nebulaField.position.set(0, 0, 0);
    nebulaField.fog = false;
    nebulaField.frustumCulled = false;
    masterWorldGroup.add(nebulaField);
  }

  const _helperVec3 = new THREE.Vector3();

  function _hash(x, y) {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) & 0x7fffffff;
  }

  function _smoothNoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = _hash(ix, iy) / 0x7fffffff;
    const n10 = _hash(ix + 1, iy) / 0x7fffffff;
    const n01 = _hash(ix, iy + 1) / 0x7fffffff;
    const n11 = _hash(ix + 1, iy + 1) / 0x7fffffff;
    const nx0 = n00 + (n10 - n00) * sx;
    const nx1 = n01 + (n11 - n01) * sx;
    return nx0 + (nx1 - nx0) * sy;
  }

  function _fbm(x, y, octaves) {
    let val = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < octaves; i++) {
      val += amp * _smoothNoise(x * freq, y * freq);
      freq *= 2;
      amp *= 0.5;
    }
    return val;
  }

  function _turbulence(x, y, octaves) {
    let val = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < octaves; i++) {
      val += amp * Math.abs(_smoothNoise(x * freq, y * freq) * 2 - 1);
      freq *= 2;
      amp *= 0.5;
    }
    return val;
  }

  function _proceduralPlanetTexture(cfg) {
    const w = 512, h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const base = new THREE.Color(cfg.color);
    const dark = base.clone().multiplyScalar(0.35);
    const light = base.clone().lerp(new THREE.Color(0xffffff), 0.55);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x / w, ny = y / h;
        const i = (y * w + x) * 4;
        let r, g, b;
        switch (cfg.contentType) {
          case 'home': {
            // Earth-like: blue oceans, green/brown continents
            const n = _fbm(nx * 4, ny * 4, 5);
            const ocean = n < 0.52;
            const oceanC = new THREE.Color(0x0c3f6e).lerp(new THREE.Color(0x1f6fa8), n * 2);
            const landC = new THREE.Color(0x2f6b3a).lerp(new THREE.Color(0x6b5a35), Math.max(0, n - 0.6) * 3);
            const c = ocean ? oceanC : landC;
            r = c.r; g = c.g; b = c.b;
            break;
          }
          case 'projects': {
            // Gas giant: orange/tan/cream horizontal bands
            const band = Math.sin(ny * Math.PI * 9 + _fbm(nx * 2, ny * 8, 3) * 1.5) * 0.5 + 0.5;
            const c = new THREE.Color(0xd9883b).lerp(new THREE.Color(0xf3dba8), band);
            r = c.r; g = c.g; b = c.b;
            break;
          }
          case 'skills': {
            // Ice planet: blue/white frost cracks
            const n = _turbulence(nx * 6, ny * 6, 4);
            const c = new THREE.Color(0x7fb8d9).lerp(new THREE.Color(0xffffff), n);
            r = c.r; g = c.g; b = c.b;
            break;
          }
          case 'experience': {
            // Lava planet: dark red/orange glowing cracks
            const n = _turbulence(nx * 5, ny * 5, 5);
            const crack = n > 0.62;
            const c = crack ? new THREE.Color(0xff7a1f).lerp(new THREE.Color(0xffe07a), (n - 0.62) * 2) : new THREE.Color(0x1a0805).lerp(new THREE.Color(0x3a1208), n * 1.5);
            r = c.r; g = c.g; b = c.b;
            break;
          }
          case 'contact': {
            // Water world: deep blue swirls
            const n = _fbm(nx * 5 + Math.sin(ny * 6) * 0.6, ny * 5, 5);
            const c = new THREE.Color(0x062a4d).lerp(new THREE.Color(0x2f8fc4), n);
            r = c.r; g = c.g; b = c.b;
            break;
          }
          case 'about': {
            // Desert planet: tan/brown craters
            const n = _fbm(nx * 6, ny * 6, 5);
            const crater = _turbulence(nx * 10, ny * 10, 2) > 0.7;
            const c = crater ? new THREE.Color(0x5a4429) : new THREE.Color(0xc9a467).lerp(new THREE.Color(0x8a6a3f), n);
            r = c.r; g = c.g; b = c.b;
            break;
          }
          default: {
            const n = _fbm(nx * 5, ny * 5, 4);
            const c = dark.clone().lerp(light, n);
            r = c.r; g = c.g; b = c.b;
          }
        }
        img.data[i] = Math.min(255, r * 255);
        img.data[i + 1] = Math.min(255, g * 255);
        img.data[i + 2] = Math.min(255, b * 255);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    cfg.textureDataUrl = canvas.toDataURL('image/png');
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, 1);
    tex.anisotropy = 4;
    return tex;
  }

  // Loads the real planet texture from assets/planet_<contentType>.jpg (per
  // planet_textures.txt). If the file is missing/fails to load, silently falls
  // back to the procedural texture instead of showing a broken-image placeholder.
  function generatePlanetTexture(cfg) {
    const path = 'assets/planet_' + cfg.contentType + '.jpg';
    const fallbackTex = _proceduralPlanetTexture(cfg);

    const loader = new THREE.TextureLoader();
    const tex = loader.load(
      path,
      () => {
        // Loaded successfully — capture a thumbnail data URL for the room-overlay
        // background theming (point 10), since we can't easily toDataURL a JPEG
        // THREE.Texture directly without redrawing it onto a canvas first.
        try {
          const img = tex.image;
          if (img && img.width) {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 128;
            const cctx = c.getContext('2d');
            cctx.drawImage(img, 0, 0, c.width, c.height);
            cfg.textureDataUrl = c.toDataURL('image/jpeg', 0.7);
          }
        } catch (e) {
          // Tainted canvas or similar — keep whatever fallback data URL we already have.
        }
      },
      undefined,
      () => {
        // Load failed (file missing/404) — swap to the procedural fallback so we
        // never show Three.js's default error checkerboard.
        tex.image = fallbackTex.image;
        tex.needsUpdate = true;
        cfg.textureDataUrl = cfg.textureDataUrl || fallbackTex.image?.toDataURL?.('image/png');
      }
    );
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, 1);
    tex.anisotropy = 4;
    cfg.textureDataUrl = cfg.textureDataUrl || (fallbackTex.image && fallbackTex.image.toDataURL ? fallbackTex.image.toDataURL('image/png') : '');
    return tex;
  }

  function buildPlanetRoom(cfg) {
    const group = new THREE.Group();
    group.userData.config = cfg;
    group.userData.roomIndex = cfg.id;
    group.userData.isPlanet = true;

    const planetRadius = BOX_HALF * 1.0;
    const tex = generatePlanetTexture(cfg);

    const planetMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.5,
      metalness: 0.1,
    });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(planetRadius, 64, 64), planetMat);
    planet.castShadow = true;
    planet.userData.isPlanetMesh = true;
    planet.userData.rotationSpeed = 0.006 + cfg.id * 0.0015;
    group.add(planet);

    const enterHotspot = new THREE.Mesh(
      new THREE.PlaneGeometry(planetRadius * 2.5, planetRadius * 2.5),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    enterHotspot.position.set(0, 0, planetRadius * 1.2);
    enterHotspot.userData.isEnterHotspot = true;
    enterHotspot.userData.roomIndex = cfg.id;
    group.add(enterHotspot);

    addOuterLabel(group, cfg);

    applyRoomOrientation(group, cfg.type);
    group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

    return group;
  }

  function addOuterLabel(group, cfg) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const hex = '#' + cfg.color.toString(16).padStart(6, '0');

    ctx.clearRect(0, 0, 256, 128);

    // Thin corner brackets (targeting-reticle style) instead of a full box —
    // matches the restrained compass-ring/HUD aesthetic used elsewhere.
    const m = 10, bl = 18;
    ctx.strokeStyle = hex;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.55;
    [[m, m, 1, 1], [256 - m, m, -1, 1], [m, 128 - m, 1, -1], [256 - m, 128 - m, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + bl * dy);
      ctx.lineTo(x, y);
      ctx.lineTo(x + bl * dx, y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    ctx.shadowColor = hex;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f3f3f6';
    ctx.font = '600 24px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.name, 128, 50);
    ctx.shadowBlur = 0;

    ctx.fillStyle = hex;
    ctx.font = '600 11px Inter, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(cfg.label, 128, 80);
    ctx.letterSpacing = '0px';

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, opacity: 0.92,
      side: THREE.DoubleSide, blending: THREE.NormalBlending
    });
    const pR = BOX_HALF * 1.0;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(pR * 0.75, pR * 0.38), mat);
    label.userData.baseOpacity = 0.92;

    const roomPos = new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    const localOffset = new THREE.Vector3(0, pR - 1, pR + 2);
    const q = new THREE.Quaternion();
    switch (cfg.type) {
      case 'front': q.setFromEuler(new THREE.Euler(0, 0, 0)); break;
      case 'back': q.setFromEuler(new THREE.Euler(0, Math.PI, 0)); break;
      case 'right': q.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)); break;
      case 'left': q.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)); break;
      case 'top': q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); break;
      case 'bottom': q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)); break;
    }
    localOffset.applyQuaternion(q);
    label.position.copy(roomPos).add(localOffset);

    label.userData.cfg = cfg;
    label.userData.isOuterLabel = true;

    if (cfg.type === 'bottom') {
      const g = new THREE.Group();
      g.position.copy(label.position);
      g.userData.cfg = cfg;
      g.userData.isOuterLabel = true;
      label.position.set(0, 0, 0);
      label.rotation.z = Math.PI;
      g.add(label);
      masterWorldGroup.add(g);
      outerLabels.push(g);
    } else {
      masterWorldGroup.add(label);
      outerLabels.push(label);
    }
  }

  function applyRoomOrientation(group, type) {
    switch (type) {
      case 'front': group.rotation.set(0, 0, 0); break;
      case 'back': group.rotation.set(0, Math.PI, 0); break;
      case 'right': group.rotation.set(0, Math.PI / 2, 0); break;
      case 'left': group.rotation.set(0, -Math.PI / 2, 0); break;
      case 'top': group.rotation.set(-Math.PI / 2, 0, 0); break;
      case 'bottom': group.rotation.set(Math.PI / 2, 0, 0); break;
    }
  }

  function buildOctahedralRooms() {
    ROOM_CONFIGS.forEach(cfg => {
      const room = buildPlanetRoom(cfg);
      masterWorldGroup.add(room);
      roomNodes.push(room);
    });
  }

  function buildOctahedralWireframe() {
    const octGeo = new THREE.OctahedronGeometry(RADIUS, 0);
    const octMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff, wireframe: true, transparent: true, opacity: 0.2
    });
    structuralSkeleton = new THREE.Mesh(octGeo, octMat);
    masterWorldGroup.add(structuralSkeleton);

    const edgesMat = new THREE.LineBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.45 });
    skeletonEdges = new THREE.LineSegments(new THREE.EdgesGeometry(octGeo), edgesMat);
    masterWorldGroup.add(skeletonEdges);
  }

  function buildGlowRing() {
    const ringGeo = new THREE.TorusGeometry(RADIUS + 6, 0.6, 16, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending
    });
    glowRing = new THREE.Mesh(ringGeo, ringMat);
    glowRing.rotation.x = Math.PI / 3;
    masterWorldGroup.add(glowRing);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(RADIUS + 10, 0.3, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending })
    );
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 6;
    ring2.userData.isSecondRing = true;
    masterWorldGroup.add(ring2);
  }

  function computeTargetCamera() {
    const idx = getCurrentRoomIndex();
    const cfg = ROOM_CONFIGS[idx];
    const roomPos = new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    targetCamTarget.copy(roomPos);
    const outward = roomPos.clone().normalize();
    targetCamPos.copy(roomPos).add(outward.multiplyScalar(CAM_DIST));
    if (vIndex === 1) targetCamUp.set(0, 0, -1);
    else if (vIndex === -1) targetCamUp.set(0, 0, 1);
    else targetCamUp.set(0, 1, 0);
  }

  function executeStep(dh, dv) {
    if (inputCooldownActive || isInsideRoom || isCameraAnimating || isSlerping) return;
    inputCooldownActive = true;

    const oldIdx = getCurrentRoomIndex();
    const oldCfg = ROOM_CONFIGS[oldIdx];
    const oldPos = new THREE.Vector3(oldCfg.pos[0], oldCfg.pos[1], oldCfg.pos[2]);
    const oldCamPos = new THREE.Vector3().copy(targetCamPos);

    if (dv !== 0) {
      const nextV = vIndex + dv;
      if (nextV > 1) { vIndex = 0; hIndex = ((hIndex + 2) + 4) % 4; }
      else if (nextV < -1) { vIndex = 0; hIndex = ((hIndex + 2) + 4) % 4; }
      else { vIndex = nextV; }
    }
    if (dh !== 0) {
      hIndex = ((hIndex + dh) + 4) % 4;
      if (vIndex !== 0) vIndex = 0;
    }

    computeTargetCamera();
    updateHUDDots();

    spawnSwooshTrail(oldCamPos, targetCamPos);
  }

  function getCurrentRoomIndex() {
    if (vIndex === 1) return 0;
    if (vIndex === -1) return 4;
    const map = [1, 2, 3, 5];
    return map[((hIndex % 4) + 4) % 4];
  }

  function initInputEngine() {
    window.addEventListener('keydown', e => {
      if (!worldRevealed) return;
      if (isInsideRoom) {
        if (e.key === ' ') { e.preventDefault(); exitRoom(); }
        return;
      }
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': executeStep(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': executeStep(1, 0); break;
        case 'ArrowUp': case 'w': case 'W': executeStep(0, 1); break;
        case 'ArrowDown': case 's': case 'S': executeStep(0, -1); break;
        case ' ':
          e.preventDefault();
          if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
          enterCurrentRoom();
          break;
      }
    });

    let scrollAccumX = 0, scrollAccumY = 0;
    window.addEventListener('wheel', e => {
      if (!worldRevealed || isInsideRoom) return;
      scrollAccumX += e.deltaX;
      scrollAccumY += e.deltaY;
      let stepX = 0, stepY = 0;
      if (Math.abs(scrollAccumX) >= 40) { stepX = scrollAccumX > 0 ? 1 : -1; scrollAccumX = 0; }
      if (Math.abs(scrollAccumY) >= 40) { stepY = scrollAccumY > 0 ? -1 : 1; scrollAccumY = 0; }
      if (stepX !== 0 || stepY !== 0) executeStep(stepX, stepY);
    }, { passive: true });

    let tx = 0, ty = 0;
    window.addEventListener('mousedown', e => { tx = e.clientX; ty = e.clientY; });
    window.addEventListener('mouseup', e => {
      if (!worldRevealed || isInsideRoom) return;
      const dx = e.clientX - tx, dy = e.clientY - ty;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) > Math.abs(dy)) { dx > 0 ? executeStep(-1, 0) : executeStep(1, 0); }
      else { dy > 0 ? executeStep(0, 1) : executeStep(0, -1); }
    });

    let tsx = 0, tsy = 0;
    window.addEventListener('touchstart', e => { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', e => {
      if (!worldRevealed || isInsideRoom) return;
      const dx = e.changedTouches[0].clientX - tsx, dy = e.changedTouches[0].clientY - tsy;
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
      if (Math.abs(dx) > Math.abs(dy)) { dx > 0 ? executeStep(-1, 0) : executeStep(1, 0); }
      else { dy > 0 ? executeStep(0, 1) : executeStep(0, -1); }
    }, { passive: true });
  }

  function initClickToEnter() {
    renderer.domElement.addEventListener('click', e => {
      if (!worldRevealed || isInsideRoom) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const currentIdx = getCurrentRoomIndex();
      const currentRoom = roomNodes[currentIdx];
      if (!currentRoom) return;
      const hotspots = [];
      currentRoom.traverse(obj => { if (obj.userData.isEnterHotspot) hotspots.push(obj); });
      const intersects = raycaster.intersectObjects(hotspots, false);
      if (intersects.length > 0) { enterCurrentRoom(); return; }
      const allMeshes = [];
      currentRoom.traverse(obj => { if (obj.isMesh && !obj.userData.isLabel && !obj.userData.isOuterLabel) allMeshes.push(obj); });
      if (raycaster.intersectObjects(allMeshes, false).length > 0) enterCurrentRoom();
    });
  }

  function enterCurrentRoom() {
    if (isInsideRoom || inputCooldownActive || isCameraAnimating) return;
    if (enterAnimation) { cancelAnimationFrame(enterAnimation); enterAnimation = null; }
    if (exitAnimation) { cancelAnimationFrame(exitAnimation); exitAnimation = null; }

    const idx = getCurrentRoomIndex();
    const cfg = ROOM_CONFIGS[idx];
    const pR = BOX_HALF * 1.0;

    const roomPos = new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    const outward = roomPos.clone().normalize();
    const surfacePos = roomPos.clone().add(outward.clone().multiplyScalar(-pR * 0.15));
    const fadeStart = roomPos.clone().add(outward.clone().multiplyScalar(-pR * 0.6));

    const targetRoom = roomNodes[idx];
    if (targetRoom) {
      targetRoom.traverse(child => {
        if (child.userData && child.userData.isPlanetMesh) {
          child.material.transparent = false;
          child.material.opacity = 1;
        }
      });
    }

    camera.position.copy(targetCamPos);
    camera.up.copy(targetCamUp);
    camera.lookAt(targetCamTarget);

    const startPos = camera.position.clone();
    const upSnapshot = camera.up.clone();

    isInsideRoom = true;
    isCameraAnimating = true;
    activeRoomIndex = idx;
    inputCooldownActive = true;

    let progress = 0;
    const duration = 1000;
    const startTime = performance.now();

    function animIn(now) {
      progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentPos = new THREE.Vector3().lerpVectors(startPos, surfacePos, ease);
      camera.position.copy(currentPos);
      camera.up.copy(upSnapshot);
      camera.lookAt(roomPos);

      scene.fog.density = 0.003 + ease * 0.02;
      if (progress < 1) {
        enterAnimation = requestAnimationFrame(animIn);
      } else {
        camera.position.copy(surfacePos);
        camera.up.copy(upSnapshot);
        camera.lookAt(roomPos);
        enterAnimation = null;
        isCameraAnimating = false;
        inputCooldownActive = false;
        showRoomContentOverlay(cfg);
      }
    }
    enterAnimation = requestAnimationFrame(animIn);
  }

  function exitRoom() {
    if (!isInsideRoom) return;
    if (exitAnimation) { cancelAnimationFrame(exitAnimation); exitAnimation = null; }
    if (enterAnimation) { cancelAnimationFrame(enterAnimation); enterAnimation = null; }

    hideRoomContentOverlay();

    const exitRoomIndex = activeRoomIndex;
    const exitCfg = ROOM_CONFIGS[exitRoomIndex];
    const exitRoomCenter = new THREE.Vector3(exitCfg.pos[0], exitCfg.pos[1], exitCfg.pos[2]);

    computeTargetCamera();
    const upSnapshot = camera.up.clone();

    isInsideRoom = false;
    isCameraAnimating = true;
    activeRoomIndex = -1;
    inputCooldownActive = true;

    const startPos = camera.position.clone();

    let progress = 0;
    const duration = 700;
    const startTime = performance.now();

    function animOut(now) {
      progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(startPos, targetCamPos, ease);
      const target = new THREE.Vector3().lerpVectors(exitRoomCenter, targetCamTarget, ease);
      camera.up.copy(upSnapshot);
      camera.lookAt(target);
      scene.fog.density = 0.003 + (1 - ease) * 0.02;
      if (progress < 1) {
        exitAnimation = requestAnimationFrame(animOut);
      } else {
        camera.position.copy(targetCamPos);
        camera.up.copy(targetCamUp);
        currentUp.copy(targetCamUp);
        camera.lookAt(targetCamTarget);
        scene.fog.density = 0.003;
        exitAnimation = null;
        isCameraAnimating = false;
        inputCooldownActive = false;
      }
    }
    exitAnimation = requestAnimationFrame(animOut);
  }

  function showRoomContentOverlay(cfg) {
    const existing = document.getElementById('room-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'room-overlay';
    const bgUrl = cfg.textureDataUrl || '';
    overlay.style.cssText = `position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;pointer-events:auto;background:#05030c;opacity:0;transform:scale(1.3);transform-origin:center center;`;
    if (bgUrl) {
      const bgLayer = document.createElement('div');
      bgLayer.style.cssText = `position:fixed;inset:-8%;z-index:0;background-image:url(${bgUrl});background-size:130% 130%;background-position:center;filter:blur(28px) saturate(1.35) brightness(0.78);transform:scale(1.06);animation:bgDrift 44s linear infinite alternate;`;
      overlay.appendChild(bgLayer);
      const veil = document.createElement('div');
      veil.style.cssText = `position:fixed;inset:0;z-index:0;background:radial-gradient(ellipse at center, rgba(5,3,12,0.32) 0%, rgba(5,3,12,0.74) 100%);`;
      overlay.appendChild(veil);
    }

    const hexColor = '#' + cfg.color.toString(16).padStart(6, '0');
    const rgb = hexToRgb(hexColor);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes bgDrift { from { transform:scale(1.06) translate(0,0); } to { transform:scale(1.13) translate(-2%,-2%); } }
      @keyframes cardSlideUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
      @keyframes navDropIn { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
      @media(max-width:768px){.room-overlay-body{padding:24px 16px!important;min-height:calc(100dvh - 68px);}.room-overlay-nav{padding:14px 16px!important;}.exit-btn span{display:none!important;}}
      .room-card { position:relative;z-index:2;background:rgba(8,6,18,0.6); border:1px solid rgba(${rgb},0.16); border-radius:8px; padding:24px 28px; animation:cardSlideUp 0.45s cubic-bezier(0.25,0.8,0.25,1) both; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); box-shadow:0 12px 30px rgba(0,0,0,0.35); }
      .room-card:nth-child(2) { animation-delay:0.08s; }
      .room-card:nth-child(3) { animation-delay:0.16s; }
      .room-card:nth-child(4) { animation-delay:0.24s; }
      .room-card:nth-child(5) { animation-delay:0.32s; }
      .room-card:nth-child(6) { animation-delay:0.40s; }
      .room-card:hover { border-color:rgba(${rgb},0.4); transform:translateY(-2px); transition:all 0.2s ease; }
      .tag-pill { display:inline-block; padding:3px 10px; border-radius:4px; font-size:0.62rem; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; border:1px solid; margin-right:6px; margin-bottom:4px; font-family:'Inter',sans-serif; }
      .skill-bar-track { height:3px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; margin-top:6px; }
      .skill-bar-fill { height:100%; border-radius:2px; transition:width 1s cubic-bezier(0.25,0.8,0.25,1); box-shadow:0 0 8px currentColor; }
      .room-overlay-nav { position:relative;z-index:2;display:flex; align-items:center; justify-content:space-between; padding:16px 28px; background:rgba(6,5,12,0.6); border-bottom:1px solid rgba(${rgb},0.2); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); animation:navDropIn 0.5s cubic-bezier(0.25,0.8,0.25,1) both; }
      .room-overlay-body { position:relative;z-index:2;flex:1; overflow-y:auto; padding:32px 36px; display:grid; gap:18px; align-content:start; }
      .room-overlay-body::-webkit-scrollbar { width:4px; }
      .room-overlay-body::-webkit-scrollbar-track { background:transparent; }
      .room-overlay-body::-webkit-scrollbar-thumb { background:rgba(${rgb},0.25); border-radius:2px; }
      .exit-btn { display:inline-flex; align-items:center; gap:10px; background:rgba(${rgb},0.22); border:1.5px solid rgba(${rgb},0.65); color:#fafaff; padding:12px 22px; border-radius:6px; font-size:0.78rem; font-family:'Inter',sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:1.4px; cursor:pointer; transition:all 0.25s ease; backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px); box-shadow:0 0 0 0 rgba(${rgb},0.5); animation:exitPulse 2.6s ease-in-out infinite; }
      .exit-btn:hover { background:rgba(${rgb},0.4); border-color:rgba(${rgb},0.9); transform:translateY(-1px); animation:none; box-shadow:0 4px 16px rgba(${rgb},0.4); }
      @keyframes exitPulse { 0%, 100% { box-shadow:0 0 0 0 rgba(${rgb},0.35); } 50% { box-shadow:0 0 0 6px rgba(${rgb},0); } }
    `;
    overlay.appendChild(style);
    const nav = document.createElement('div');
    nav.className = 'room-overlay-nav';
    nav.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;">
        <span style="font-size:1.5rem;color:${hexColor};filter:drop-shadow(0 0 6px ${hexColor}88);">${cfg.icon}</span>
        <div>
          <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:#f3f3f6;letter-spacing:1px;">${cfg.name}</div>
          <div style="font-size:0.65rem;color:${hexColor};text-transform:uppercase;letter-spacing:2px;margin-top:2px;">${cfg.label}</div>
        </div>
      </div>
      <button class="exit-btn" id="exitRoomBtn"><i class="fa-solid fa-xmark"></i> Exit Room <span style="opacity:0.6;font-weight:500;">· Space</span></button>`;
    overlay.appendChild(nav);

    const body = document.createElement('div');
    body.className = 'room-overlay-body';
    body.style.cssText = 'max-width:900px;margin:0 auto;width:100%;box-sizing:border-box;';

    ['top', 'bottom', 'left', 'right'].forEach(side => {
      const div = document.createElement('div');
      div.className = 'seal-panel seal-' + side;
      div.style.cssText = `
        position:fixed;z-index:5;pointer-events:none;
        background:linear-gradient(${side === 'left' || side === 'right' ? '90deg' : '180deg'}, rgba(6,5,10,0.97) 0%, ${hexColor}22 60%, transparent 100%);
        transition:transform 0.55s cubic-bezier(0.65,0,0.35,1);
        ${side === 'top' ? 'top:0;left:0;right:0;height:160px;transform:translateY(-100%);' : ''}
        ${side === 'bottom' ? 'bottom:0;left:0;right:0;height:160px;transform:translateY(100%) scaleY(-1);' : ''}
        ${side === 'left' ? 'top:0;left:0;bottom:0;width:110px;transform:translateX(-100%);' : ''}
        ${side === 'right' ? 'top:0;right:0;bottom:0;width:110px;transform:translateX(100%) scaleX(-1);' : ''}
      `;
      overlay.appendChild(div);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (side === 'top' || side === 'bottom') div.style.transform = div.style.transform.replace(/translateY\([^)]*\)/, 'translateY(0%)');
          if (side === 'left' || side === 'right') div.style.transform = div.style.transform.replace(/translateX\([^)]*\)/, 'translateX(0%)');
        });
      });
    });

    injectContentForRoom(cfg, body, hexColor);
    overlay.appendChild(body);
    document.body.appendChild(overlay);
    document.getElementById('exitRoomBtn').addEventListener('click', exitRoom);
    overlay.addEventListener('click', e => { if (e.target === overlay) exitRoom(); });

    // Emerging-from-the-planet reveal: starts zoomed in (as if surfacing through
    // the planet's atmosphere) and settles to normal scale, continuing the camera
    // dolly that was already happening in 3D.
    overlay.style.transition = 'opacity 0.6s cubic-bezier(0.25,0.8,0.25,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.transform = 'scale(1)';
    });
  }

  function hideRoomContentOverlay() {
    const overlay = document.getElementById('room-overlay');
    if (!overlay) return;
    document.querySelectorAll('.seal-panel').forEach(div => {
      if (div.classList.contains('seal-top')) div.style.transform = 'translateY(-100%)';
      if (div.classList.contains('seal-bottom')) div.style.transform = 'translateY(100%) scaleY(-1)';
      if (div.classList.contains('seal-left')) div.style.transform = 'translateX(-100%)';
      if (div.classList.contains('seal-right')) div.style.transform = 'translateX(100%) scaleX(-1)';
    });
    overlay.style.transition = 'opacity 0.4s ease, transform 0.45s cubic-bezier(0.65,0,0.35,1)';
    overlay.style.opacity = '0';
    overlay.style.transform = 'scale(1.25)';
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 420);
  }

  function injectContentForRoom(cfg, body, hexColor) {
    const data = typeof getData === 'function' ? getData() : {};
    const headerCard = document.createElement('div');
    headerCard.style.cssText = `background:rgba(7,6,14,0.78);border:1px solid ${hexColor}55;border-radius:8px;padding:28px 32px;display:flex;align-items:center;gap:20px;animation:cardSlideUp 0.4s cubic-bezier(0.25,0.8,0.25,1) both;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 12px 30px rgba(0,0,0,0.4);`;
    headerCard.innerHTML = `<div style="font-size:2.8rem;line-height:1;">${cfg.icon}</div><div><div style="font-family:'Cinzel',serif;font-size:1.4rem;color:#f3f3f6;letter-spacing:1px;">${cfg.name}</div><div style="font-size:0.75rem;color:${hexColor};text-transform:uppercase;letter-spacing:2px;margin-top:4px;">${cfg.label}</div></div>`;
    body.appendChild(headerCard);

    switch (cfg.contentType) {
      case 'home': renderHomeContent(body, data, hexColor); break;
      case 'projects': renderProjectsContent(body, data, hexColor); break;
      case 'skills': renderSkillsContent(body, data, hexColor); break;
      case 'experience': renderExperienceContent(body, data, hexColor); break;
      case 'contact': renderContactContent(body, data, hexColor); break;
      case 'about': renderAboutContent(body, data, hexColor); break;
      default: renderHomeContent(body, data, hexColor);
    }
  }

  function renderHomeContent(body, data, hex) {
    const services = data.services || [];
    if (!services.length) { addCard(body, '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:20px;">No services listed yet.</div>', hex, '0s'); return; }

    const grid = document.createElement('div');
    grid.style.cssText = window.innerWidth <= 768 ? 'display:grid;grid-template-columns:1fr;gap:14px;' : 'display:grid;grid-template-columns:repeat(3,1fr);gap:16px;';
    services.forEach((s, i) => {
      const gradient = serviceGradient(s.name);
      const icon = getServiceIcon(s.name);
      const keywords = serviceKeywords(s.name);
      const tagsHtml = keywords.map(function(t) { return '<span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:0.58rem;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;border:1px solid ' + hex + '44;color:' + hex + ';margin-right:4px;margin-bottom:4px;font-family:\'Inter\',sans-serif;">' + t + '</span>'; }).join('');
      const card = document.createElement('div');
      card.className = 'room-card';
      card.style.cssText = 'padding:0;overflow:hidden;background:rgba(7,6,14,0.82);border:1px solid ' + hex + '2a;border-radius:8px;animation:cardSlideUp 0.4s cubic-bezier(0.25,0.8,0.25,1) ' + (i*0.06) + 's both;';
      card.innerHTML =
        '<div style="position:relative;aspect-ratio:16/10;background:' + gradient + ';display:flex;align-items:center;justify-content:center;font-size:2.6rem;overflow:hidden;">' +
          '<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(8,6,18,0.92) 100%);"></div>' +
          '<span style="position:absolute;top:10px;left:10px;background:rgba(8,6,18,0.85);color:rgba(255,255,255,0.8);font-size:0.55rem;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:4px 9px;border-radius:4px;z-index:2;">' + esc(s.name) + '</span>' +
          '<div style="position:relative;z-index:1;width:56px;height:56px;border-radius:14px;background:rgba(8,6,18,0.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;">' + icon + '</div>' +
        '</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:0.6rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"><span>per hour</span><span style="color:' + hex + ';font-weight:600;">$' + esc(String(s.hourlyRate)) + '</span></div>' +
          '<div style="font-family:\'Cinzel\',serif;font-size:1rem;color:#f3f3f6;margin-bottom:4px;">' + esc(s.name) + '</div>' +
          '<div style="font-size:0.8rem;color:rgba(243,243,246,0.55);line-height:1.6;margin-bottom:10px;">' + esc(s.description) + '</div>' +
          '<div>' + tagsHtml + '</div>' +
        '</div>';
      grid.appendChild(card);
    });
    body.appendChild(grid);

    const hireCard = document.createElement('div');
    hireCard.className = 'room-card';
    hireCard.style.cssText = 'background:rgba(6,5,12,0.65);border:1px solid ' + hex + '2a;border-radius:8px;padding:28px;animation:cardSlideUp 0.4s cubic-bezier(0.25,0.8,0.25,1) ' + (services.length*0.06+0.12) + 's both;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
    hireCard.innerHTML =
      '<div style="font-size:0.65rem;color:' + hex + ';text-transform:uppercase;letter-spacing:2px;margin-bottom:20px;">Hire Me</div>' +
      '<div style="display:grid;gap:16px;" id="hireFormFields">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
          '<div><label style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Name</label><input type="text" id="hireName" placeholder="Your name" style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:10px 14px;color:#f3f3f6;font-family:\'Inter\',sans-serif;font-size:0.85rem;outline:none;"></div>' +
          '<div><label style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Email</label><input type="email" id="hireEmail" placeholder="your@domain.com" style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:10px 14px;color:#f3f3f6;font-family:\'Inter\',sans-serif;font-size:0.85rem;outline:none;"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
          '<div><label style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Phone</label><input type="tel" id="hirePhone" placeholder="(optional)" style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:10px 14px;color:#f3f3f6;font-family:\'Inter\',sans-serif;font-size:0.85rem;outline:none;"></div>' +
          '<div><label style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Service</label><select id="hireService" style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:10px 14px;color:#f3f3f6;font-family:\'Inter\',sans-serif;font-size:0.85rem;outline:none;"><option value="">Any service</option></select></div>' +
        '</div>' +
        '<div><label style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Project Description</label><textarea rows="3" id="hireDescription" placeholder="Tell me about your project..." style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:10px 14px;color:#f3f3f6;font-family:\'Inter\',sans-serif;font-size:0.85rem;outline:none;resize:vertical;"></textarea></div>' +
        '<button id="hireSendBtn" style="align-self:start;background:' + hex + ';color:#0d0d11;border:none;border-radius:4px;padding:11px 24px;font-family:\'Inter\',sans-serif;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;">Send Inquiry</button>' +
        '<div id="hireStatus" style="font-size:0.75rem;color:rgba(255,255,255,0.35);min-height:1em;"></div>' +
      '</div>';

    body.appendChild(hireCard);

    var svcSelect = hireCard.querySelector('#hireService');
    if (svcSelect) {
      services.forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        svcSelect.appendChild(opt);
      });
    }

    var sendBtn = hireCard.querySelector('#hireSendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var name = document.getElementById('hireName').value.trim();
        var email = document.getElementById('hireEmail').value.trim();
        var phone = document.getElementById('hirePhone').value.trim();
        var service = document.getElementById('hireService').value;
        var description = document.getElementById('hireDescription').value.trim();
        var status = document.getElementById('hireStatus');
        if (!name || !email || !description) {
          status.textContent = 'Name, email, and description required.';
          status.style.color = '#ef4444';
          return;
        }
        sendBtn.textContent = 'Sending...';
        sendBtn.disabled = true;
        fetch('/api/hire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, phone: phone, service: service, description: description })
        }).then(function (res) { return res.json(); }).then(function (json) {
          if (json.success) {
            status.textContent = 'Sent! I\'ll get back to you soon.';
            status.style.color = '#4ade80';
            document.getElementById('hireName').value = '';
            document.getElementById('hireEmail').value = '';
            document.getElementById('hirePhone').value = '';
            document.getElementById('hireService').value = '';
            document.getElementById('hireDescription').value = '';
          } else {
            status.textContent = json.error || 'Error - try again';
            status.style.color = '#ef4444';
          }
          setTimeout(function () { sendBtn.textContent = 'Send Inquiry'; sendBtn.disabled = false; }, 3000);
        }).catch(function () {
          status.textContent = 'Error - try again';
          status.style.color = '#ef4444';
          setTimeout(function () { sendBtn.textContent = 'Send Inquiry'; sendBtn.disabled = false; }, 3000);
        });
      });
    }
  }

  function serviceGradient(name) {
    var gradients = [
      'linear-gradient(135deg, #1a0a2e, #16213e)',
      'linear-gradient(135deg, #0f2027, #203a43)',
      'linear-gradient(135deg, #0d0a2a, #1a1040)',
      'linear-gradient(135deg, #0a1628, #0f2840)',
      'linear-gradient(135deg, #1a0a20, #2a1040)',
      'linear-gradient(135deg, #081828, #0c2840)'
    ];
    var hash = 0;
    for (var i = 0; i < (name || '').length; i++) { hash = ((hash << 5) - hash) + name.charCodeAt(i); hash |= 0; }
    return gradients[Math.abs(hash) % gradients.length];
  }

  function getServiceIcon(name) {
    var icons = { 'web': '<i class=\"fa-solid fa-globe\"></i>', '3d': '<i class=\"fa-solid fa-cubes\"></i>', 'backend': '<i class=\"fa-solid fa-gear\"></i>', 'design': '<i class=\"fa-solid fa-palette\"></i>', 'fullstack': '<i class=\"fa-solid fa-layer-group\"></i>', 'consulting': '<i class=\"fa-solid fa-handshake\"></i>' };
    var lower = (name || '').toLowerCase();
    for (var key in icons) { if (lower.includes(key)) return icons[key]; }
    return '<i class=\"fa-solid fa-arrow-right\"></i>';
  }

  function serviceKeywords(name) {
    var map = { 'web': ['react', 'node', 'responsive'], '3d': ['three.js', 'webgl', 'blender'], 'backend': ['api', 'database', 'server'], 'design': ['ui/ux', 'figma', 'creative'], 'fullstack': ['frontend', 'backend', 'devops'], 'consulting': ['strategy', 'review', 'advice'] };
    var lower = (name || '').toLowerCase();
    for (var key in map) { if (lower.includes(key)) return map[key]; }
    return ['custom', 'development'];
  }

  function renderProjectsContent(body, data, hex) {
    const projects = data.projects || [];
    if (!projects.length) { addCard(body, '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:20px;">No projects yet.</div>', hex, '0s'); return; }
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:18px;';
    projects.forEach((p, i) => {
      const tagsHtml = (p.tags||[]).map(t => `<span class="tag-pill" style="color:${hex};border-color:${hex}44;">${esc(t)}</span>`).join('');
      const card = document.createElement('div');
      card.className = 'room-card';
      card.style.cssText = `padding:0;overflow:hidden;background:rgba(7,6,14,0.82);border:1px solid ${hex}2a;border-radius:8px;animation:cardSlideUp 0.4s cubic-bezier(0.25,0.8,0.25,1) ${(i*0.06)}s both;cursor:${p.liveUrl&&p.liveUrl!=='#'?'pointer':'default'};`;
      card.innerHTML = `
        <div style="position:relative;aspect-ratio:16/10;background:#0a0814 url('${esc(p.image||'')}') center/cover;border-bottom:1px solid ${hex}22;">
          <span style="position:absolute;top:10px;left:10px;background:rgba(8,6,18,0.85);color:rgba(255,255,255,0.8);font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:4px 9px;border-radius:4px;">${esc(p.type||'')}</span>
          ${p.featured?`<span style="position:absolute;top:10px;right:10px;background:${hex};color:#0d0d11;font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:4px 9px;border-radius:4px;"><i class="fa-solid fa-star"></i> Featured</span>`:''}
        </div>
        <div style="padding:18px 20px;">
          <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"><span>${esc(p.year||'')}</span><span style="color:${hex};">${esc(p.stack||'')}</span></div>
          <div style="font-family:'Cinzel',serif;font-size:1.05rem;color:#f3f3f6;margin-bottom:2px;">${esc(p.title)}</div>
          <div style="font-size:0.78rem;color:${hex};margin-bottom:10px;">${esc(p.subtitle||'')}</div>
          <div style="font-size:0.82rem;color:rgba(243,243,246,0.55);line-height:1.6;margin-bottom:12px;">${esc(p.description)}</div>
          <div style="margin-bottom:14px;">${tagsHtml}</div>
          <div style="display:flex;gap:10px;">${p.liveUrl&&p.liveUrl!=='#'?`<a href="${p.liveUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation();" style="font-size:0.7rem;font-weight:700;color:#0d0d11;background:${hex};text-decoration:none;text-transform:uppercase;letter-spacing:1px;padding:7px 16px;border-radius:4px;">Live <i class="fa-solid fa-arrow-right"></i></a>`:''}${p.sourceUrl&&p.sourceUrl!=='#'?`<a href="${p.sourceUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation();" style="font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.6);text-decoration:none;border:1px solid rgba(255,255,255,0.12);padding:7px 16px;border-radius:4px;"><i class="fa-solid fa-code-branch"></i> Source</a>`:''}</div>
        </div>`;
      if (p.liveUrl && p.liveUrl !== '#') {
        card.addEventListener('click', () => window.open(p.liveUrl, '_blank', 'noopener'));
      }
      grid.appendChild(card);
    });
    body.appendChild(grid);
  }

  function renderSkillsContent(body, data, hex) {
    const cats = (data.skills&&data.skills.categories)||[];
    if (!cats.length) { addCard(body, '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:20px;">No skills defined.</div>', hex, '0s'); return; }
    cats.forEach((cat, ci) => {
      const itemsHtml = (cat.items||[]).map(s => {
        const stars = Math.max(1, Math.min(5, s.stars || 1));
        const starsHtml = [1,2,3,4,5].map(n => `<i class="fa-solid fa-star" style="color:${n<=stars?hex:'rgba(255,255,255,0.15)'};font-size:0.9rem;"></i>`).join('');
        return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:0.82rem;color:rgba(243,243,246,0.8);">${esc(s.name)}</span><span style="letter-spacing:1px;">${starsHtml}</span></div>`;
      }).join('');
      addCard(body, `<div style="font-size:0.65rem;color:${hex};text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">${cat.icon} ${esc(cat.name)}</div>${itemsHtml}`, hex, (ci*0.08)+'s');
    });
  }

  function renderExperienceContent(body, data, hex) {
    const exp = data.experience||[];
    if (!exp.length) { addCard(body, '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:20px;">No experience entries.</div>', hex, '0s'); return; }
    exp.forEach((e, i) => {
      addCard(body, `<div style="display:flex;gap:16px;align-items:flex-start;"><div style="width:3px;background:${hex};border-radius:2px;align-self:stretch;flex-shrink:0;"></div><div style="flex:1;"><div style="font-family:'Cinzel',serif;font-size:1rem;color:#f3f3f6;margin-bottom:4px;">${esc(e.title)}</div><div style="font-size:0.8rem;color:${hex};margin-bottom:4px;font-weight:600;">${esc(e.company)}</div><div style="font-size:0.68rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">${esc(e.date)}</div><div style="font-size:0.84rem;color:rgba(243,243,246,0.55);line-height:1.65;">${esc(e.description)}</div></div></div>`, hex, (i*0.07)+'s');
    });
  }

  function renderContactContent(body, data, hex) {
    const c = data.contact||{};
    addCard(body, `<div style="display:grid;gap:20px;"><div style="display:flex;align-items:center;gap:16px;"><i class="fa-solid fa-envelope" style="font-size:1.4rem;"></i><div><div style="font-size:0.62rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px;">Email</div><div style="font-size:0.9rem;color:#f3f3f6;">${esc(c.email||'')}</div></div></div><div style="display:flex;align-items:center;gap:16px;"><i class="fa-solid fa-location-dot" style="font-size:1.4rem;"></i><div><div style="font-size:0.62rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px;">Location</div><div style="font-size:0.9rem;color:#f3f3f6;">${esc(c.location||'')}</div></div></div><div style="display:flex;align-items:center;gap:16px;"><i class="fa-solid fa-shield-halved" style="font-size:1.4rem;"></i><div><div style="font-size:0.62rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px;">Availability</div><div style="font-size:0.9rem;color:${hex};">${esc(c.availability||'')}</div></div></div></div>`, hex, '0s');
    const formCard = document.createElement('div');
    formCard.className = 'room-card';
    formCard.style.cssText = `background:rgba(6,5,12,0.65);border:1px solid rgba(0,204,255,0.1);border-radius:8px;padding:28px;animation:cardSlideUp 0.4s cubic-bezier(0.25,0.8,0.25,1) 0.08s both;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);`;
    formCard.innerHTML = `<div style="font-size:0.65rem;color:${hex};text-transform:uppercase;letter-spacing:2px;margin-bottom:20px;">Send a Message</div><div style="display:grid;gap:16px;" id="contactFormFields"><div><label style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Name</label><input type="text" id="contactName" placeholder="Your name" style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:10px 14px;color:#f3f3f6;font-family:'Inter',sans-serif;font-size:0.85rem;outline:none;"></div><div><label style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Email</label><input type="email" id="contactEmail" placeholder="your@domain.com" style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:10px 14px;color:#f3f3f6;font-family:'Inter',sans-serif;font-size:0.85rem;outline:none;"></div><div><label style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Message</label><textarea rows="4" id="contactMessage" placeholder="Your message..." style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:10px 14px;color:#f3f3f6;font-family:'Inter',sans-serif;font-size:0.85rem;outline:none;resize:vertical;"></textarea></div><button id="contactSendBtn" style="align-self:start;background:${hex};color:#0d0d11;border:none;border-radius:4px;padding:11px 24px;font-family:'Inter',sans-serif;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;">Send Message</button></div>`;
    body.appendChild(formCard);

    var sendBtn = document.getElementById('contactSendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var name = document.getElementById('contactName').value.trim();
        var email = document.getElementById('contactEmail').value.trim();
        var message = document.getElementById('contactMessage').value.trim();
        if (!name || !email || !message) {
          sendBtn.textContent = 'Fill all fields';
          sendBtn.style.opacity = '0.7';
          setTimeout(function () { sendBtn.textContent = 'Send Message'; sendBtn.style.opacity = '1'; }, 2000);
          return;
        }
        sendBtn.textContent = 'Sending...';
        sendBtn.disabled = true;
        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, message: message })
        }).then(function (res) { return res.json(); }).then(function (json) {
          if (json.success) {
            sendBtn.innerHTML = 'Sent <i class="fa-solid fa-check"></i>';
            sendBtn.style.color = hex;
            sendBtn.style.borderColor = hex + '44';
            document.getElementById('contactName').value = '';
            document.getElementById('contactEmail').value = '';
            document.getElementById('contactMessage').value = '';
          } else {
            sendBtn.textContent = 'Error - try again';
          }
          setTimeout(function () { sendBtn.textContent = 'Send Message'; sendBtn.disabled = false; }, 3000);
        }).catch(function () {
          sendBtn.textContent = 'Error - try again';
          setTimeout(function () { sendBtn.textContent = 'Send Message'; sendBtn.disabled = false; }, 3000);
        });
      });
    }
  }

  function renderAboutContent(body, data, hex) {
    const p = data.personal||{};
    const paras = p.aboutParagraphs||[];
    addCard(body, `<div style="font-family:'Cinzel',serif;font-size:1.1rem;color:${hex};margin-bottom:16px;">${esc(p.aboutTitle||'')}</div><div style="display:grid;gap:12px;">${paras.map(par => `<p style="font-size:0.88rem;color:rgba(243,243,246,0.6);line-height:1.75;">${esc(par)}</p>`).join('')}</div>`, hex, '0s');
    const stats = p.stats||[];
    if (stats.length) {
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;animation:cardSlideUp 0.4s cubic-bezier(0.25,0.8,0.25,1) 0.06s both;';
      stats.forEach(s => {
        const c = document.createElement('div');
        c.style.cssText = `background:rgba(6,5,12,0.65);border:1px solid ${hex}33;border-radius:8px;padding:20px;text-align:center;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);`;
        c.innerHTML = `<div style="font-family:'Cinzel',serif;font-size:1.8rem;color:${hex};">${esc(s.number)}</div><div style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px;">${esc(s.label)}</div>`;
        grid.appendChild(c);
      });
      body.appendChild(grid);
    }
  }

  function addCard(parent, html, hex, delay) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.style.cssText = `background:rgba(7,6,14,0.82);border:1px solid ${hex}2a;border-radius:8px;padding:24px 28px;animation:cardSlideUp 0.4s cubic-bezier(0.25,0.8,0.25,1) ${delay} both;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);`;
    card.innerHTML = html;
    parent.appendChild(card);
  }

  function hexToRgb(hex) { const r=parseInt(hex.slice(1,3),16);const g=parseInt(hex.slice(3,5),16);const b=parseInt(hex.slice(5,7),16);return `${r},${g},${b}`; }
  function esc(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function syncPersonalIdentity() {
    if(typeof getData!=='function')return;
    const p=getData().personal;
    const title=document.getElementById('page-title');
    if(title&&p)title.innerHTML=`<span>${p.firstName.charAt(0)}</span>${p.firstName.slice(1)} ${p.lastName}`;
  }

  function initHUDDots() {
    document.querySelectorAll('.section-dot').forEach((dot,i)=>{dot.style.cursor='pointer';dot.addEventListener('click',()=>navigateToRoomByDot(i));});
    updateHUDDots();
  }

  function travelToRoomIndex(idx, onArrive) {
    if (isInsideRoom || inputCooldownActive || isCameraAnimating || isSlerping) return false;
    inputCooldownActive = true;
    const cfg = ROOM_CONFIGS[idx];
    const oldCamPos = new THREE.Vector3().copy(targetCamPos);
    if (cfg.type === 'top') vIndex = 1;
    else if (cfg.type === 'bottom') vIndex = -1;
    else { vIndex = 0; const h = { front: 0, right: 1, back: 2, left: 3 }; hIndex = h[cfg.type] || 0; }
    computeTargetCamera();
    updateHUDDots();
    spawnSwooshTrail(oldCamPos, targetCamPos);
    if (onArrive) {
      const checkArrived = () => {
        if (!isSlerping && !inputCooldownActive) onArrive();
        else requestAnimationFrame(checkArrived);
      };
      requestAnimationFrame(checkArrived);
    }
    return true;
  }

  function navigateToSection(contentType) {
    const cfg = ROOM_CONFIGS.find(c => c.contentType === contentType);
    if (!cfg) return;
    if (isInsideRoom) exitRoom();
    const tryTravel = () => {
      if (isInsideRoom || isCameraAnimating) { requestAnimationFrame(tryTravel); return; }
      const idx = getCurrentRoomIndex();
      if (idx === cfg.id) { enterCurrentRoom(); return; }
      const started = travelToRoomIndex(cfg.id, () => enterCurrentRoom());
      if (!started) requestAnimationFrame(tryTravel);
    };
    requestAnimationFrame(tryTravel);
  }

  function navigateToRoomByDot(dotIndex) {
    const idx=[0,1,2,3,4,5][dotIndex]||0;
    travelToRoomIndex(idx);
  }

  function updateHUDDots() {
    const dots=document.querySelectorAll('.section-dot');
    const fill=document.querySelector('.scroll-progress-fill');
    const cur=getCurrentRoomIndex();
    dots.forEach((dot,i)=>dot.classList.toggle('active',i===cur));
    if(fill)fill.style.width=((cur/(ROOM_CONFIGS.length-1))*100)+'%';
  }

  function animationLoop() {
    requestAnimationFrame(animationLoop);

    const lerpSpeed = 0.08;

    if (!isInsideRoom && !isCameraAnimating) {
      const currPos = camera.position;
      const currDir = currPos.clone().normalize();
      const tgtDir = targetCamPos.clone().normalize();
      const posDot = Math.max(-1, Math.min(1, currDir.dot(tgtDir)));

      const upAligned = currentUp.angleTo(targetCamUp) < 0.01;
      isSlerping = posDot < 0.999 || !upAligned;

      if (!isSlerping && inputCooldownActive) {
        inputCooldownActive = false;
      }

      const angle = Math.acos(posDot);
      const maxAnglePerFrame = 0.068;
      const speed = Math.min(lerpSpeed, maxAnglePerFrame / Math.max(0.001, angle));

      const q = new THREE.Quaternion().setFromUnitVectors(currDir, tgtDir);
      const identity = new THREE.Quaternion();
      identity.slerp(q, speed);
      const newDir = currDir.clone().applyQuaternion(identity);
      const SPHERE_R = RADIUS + CAM_DIST;
      camera.position.copy(newDir).multiplyScalar(SPHERE_R);

      // Carry the up vector through the SAME rotation applied to position (parallel transport),
      // then continuously correct toward the discrete targetCamUp. This keeps the up vector
      // geometrically continuous across ANY transition (no per-frame pole heuristics/snapping).
      currentUp.applyQuaternion(identity);
      currentUp.projectOnPlane(newDir).normalize();
      const upSpeed = Math.min(0.12, speed * 2);
      const correctedUp = targetCamUp.clone().projectOnPlane(newDir).normalize();
      if (correctedUp.lengthSq() > 0.0001) {
        const upQ = new THREE.Quaternion().setFromUnitVectors(currentUp, correctedUp);
        const upBlend = new THREE.Quaternion().identity().slerp(upQ, upSpeed);
        currentUp.applyQuaternion(upBlend);
      }
      currentUp.normalize();
      camera.up.copy(currentUp);

      const currTarget = new THREE.Vector3();
      const lookDir = camera.position.clone().normalize();
      currTarget.copy(lookDir.multiplyScalar(RADIUS));
      camera.lookAt(currTarget);
    }

    updateSwooshParticles();

    const st = performance.now() * 0.001;

    if (particleSystem) {
      particleSystem.rotation.y += 0.00015;
      particleSystem.material.opacity = 0.35 + Math.sin(st * 0.3) * 0.12;
    }

    if (starField) {
      starField.rotation.y += 0.000035;
      starField.rotation.x += 0.000012;
      const sz = starField.geometry.attributes.size;
      const arr = sz.array;
      for (let i = 0; i < arr.length; i++) {
        const flicker = Math.sin(st * (0.4 + (i % 5) * 0.15) + _starPhases[i]);
        const sparkle = Math.pow(Math.max(0, Math.sin(st * 1.7 + _starPhases[i] * 3)), 14) * 1.8;
        arr[i] = _starBaseSizes[i] * (0.3 + 0.7 * (0.5 + 0.5 * flicker) + sparkle);
      }
      sz.needsUpdate = true;
    }

    if (structuralSkeleton) {
      structuralSkeleton.rotation.y += 0.00025;
      structuralSkeleton.rotation.x += 0.0001;
      structuralSkeleton.material.opacity = 0.2 + Math.sin(st * 0.5) * 0.08;
    }
    if (skeletonEdges) {
      skeletonEdges.material.opacity = 0.45 + Math.sin(st * 0.4) * 0.12;
    }
    if (glowRing) {
      glowRing.rotation.z += 0.0004;
      glowRing.rotation.x += 0.00015;
      glowRing.material.opacity = 0.18 + Math.sin(st * 0.5) * 0.1;
      masterWorldGroup.children.forEach(child => {
        if (child.userData && child.userData.isSecondRing) {
          child.rotation.x += 0.00025;
          child.rotation.z += 0.0002;
          child.material.opacity = 0.12 + Math.sin(st * 0.45 + 1) * 0.08;
        }
      });
    }

    connectionBeams.forEach((beam, i) => {
      beam.material.opacity = 0.18 + Math.sin(st * 0.7 + i * 0.5) * 0.1;
    });

    outerLabels.forEach(label => {
      label.lookAt(camera.position);
      const target = label.userData.isOuterLabel && label.children.length ? label.children[0] : label;
      const mat = target.material;
      if (mat && target.userData.baseOpacity !== undefined) {
        mat.opacity = target.userData.baseOpacity * (0.85 + 0.15 * Math.sin(st * 1.1 + (target.userData.cfg?.id || 0)));
      } else if (mat && label.userData.baseOpacity !== undefined) {
        mat.opacity = label.userData.baseOpacity * (0.85 + 0.15 * Math.sin(st * 1.1 + (label.userData.cfg?.id || 0)));
      }
    });

    roomNodes.forEach((room) => {
      room.children.forEach(child => {
        if (!child.userData) return;
        if (child.userData.rotationSpeed) {
          child.rotation.y += child.userData.rotationSpeed;
        }
        if (child.userData.isPlanetMesh) {
          child.rotation.y += child.userData.rotationSpeed;
        }
      });
    });

    const bgHue = 0.75 + Math.sin(st * 0.07) * 0.05;
    if (!currentStylePreset) {
      const bgColor = new THREE.Color().setHSL(bgHue, 0.5, 0.04);
      scene.background.lerp(bgColor, 0.005);
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.viewportEngine = {};

  window.viewportEngine.applyStylePreset = function (presetIndex) {
    currentStylePreset = presetIndex;
    const presets = [
      { bg: 0x06060a, fog: 0.008, wallColor: 0x12121e, wire: false, emissiveMult: 0.04 },
      { bg: 0x000511, fog: 0.010, wallColor: 0x001133, wire: true,  emissiveMult: 0.7  },
      { bg: 0x111114, fog: 0.009, wallColor: 0x2a2a2e, wire: false, emissiveMult: 0.0  },
      { bg: 0x01010a, fog: 0.011, wallColor: 0x05050f, wire: true,  emissiveMult: 0.8  }
    ];
    const p = presets[presetIndex];
    scene.background.setHex(p.bg);
    scene.fog.color.setHex(p.bg);
    scene.fog.density = p.fog;
    roomNodes.forEach(room => {
      room.traverse(child => {
        if (child.isMesh && child.material && !child.userData.isLabel && !child.userData.isOuterLabel) {
          if (child.userData.isPlanetMesh) {
            child.material.wireframe = p.wire;
            child.material.needsUpdate = true;
          }
        }
      });
    });
    document.querySelectorAll('.hud-btn-stack .hud-btn').forEach((btn, i) => btn.classList.toggle('active', i === presetIndex));
    const firstBtn = document.getElementById('btn-style-reset');
    if (firstBtn) firstBtn.classList.toggle('active', presetIndex === 0);
  };

  window.viewportEngine.triggerGravityAnomaly = function () {
    window.viewportEngine.gravityAnomalyActive = !window.viewportEngine.gravityAnomalyActive;
    const btn = document.getElementById('gravityToggle');
    if (btn) btn.classList.toggle('active', window.viewportEngine.gravityAnomalyActive);
    if (!window.viewportEngine.gravityAnomalyActive) {
      roomNodes.forEach(room => {
        room.children.forEach(child => {
          if (child.userData && child.userData.floatOffset !== undefined) child.position.y = 0;
        });
      });
    }
  };

  window.viewportEngine.enterRoom = enterCurrentRoom;
  window.viewportEngine.exitRoom = exitRoom;
  window.viewportEngine.navigateToSection = navigateToSection;
  window.viewportEngine.returnToLanding = returnToLanding;

  document.addEventListener('DOMContentLoaded', init);
}());
