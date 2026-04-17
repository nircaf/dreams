// ================================================
// PLATFORM-AWARE CURSOR TOGGLE (PC/Mac only)
// ================================================
(() => {
  const platformRaw = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const ua = navigator.userAgent || '';
  const isDesktopOS = /Win|Mac/i.test(platformRaw);
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const hasFinePointer = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true;
  const useCustomCursor = isDesktopOS && !isMobileUA && hasFinePointer;

  const platformLabel = /Win/i.test(platformRaw)
    ? 'windows'
    : /Mac/i.test(platformRaw)
      ? 'macos'
      : 'other';

  document.documentElement.dataset.clientPlatform = platformLabel;
  document.documentElement.classList.toggle('no-custom-cursor', !useCustomCursor);
  document.documentElement.classList.toggle('use-custom-cursor', useCustomCursor);
  window.__dreamzUseCustomCursor = useCustomCursor;
})();

// ================================================
// CURSOR
// ================================================
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
});
function animateCursor() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

// ================================================
// NAV SCROLL
// ================================================
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
});

// ================================================
// REVEAL ON SCROLL
// ================================================
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
reveals.forEach(r => revealObs.observe(r));

// ================================================
// BACKGROUND PARTICLE CANVAS
// ================================================
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], time = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Stars
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      a: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.00008 + 0.00002,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Brainwave lines
  const waves = [
    { freq: 0.8, amp: 60, y: 0.25, color: 'rgba(74,91,204,0.06)', speed: 0.3 },
    { freq: 1.2, amp: 40, y: 0.5, color: 'rgba(129,140,248,0.04)', speed: 0.2 },
    { freq: 0.6, amp: 80, y: 0.75, color: 'rgba(139,157,232,0.05)', speed: 0.15 },
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    time += 0.005;

    // Radial gradient overlay
    const grad = ctx.createRadialGradient(W * 0.35, H * 0.3, 0, W * 0.35, H * 0.3, W * 0.6);
    grad.addColorStop(0, 'rgba(42,53,128,0.08)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Wave lines
    waves.forEach(w => {
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H * w.y + Math.sin((x / W) * Math.PI * 2 * w.freq + time * w.speed * 10) * w.amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = w.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Stars
    particles.forEach(p => {
      const flicker = Math.sin(time * p.speed * 1000 + p.phase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(184,196,248,${p.a * flicker})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ================================================
// 3D SCENE HELPERS
// ================================================
function createScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.01, 100);
  camera.position.set(0, 0, 3);

  // Lights
  const ambient = new THREE.AmbientLight(0x8b9de8, 0.4);
  scene.add(ambient);
  const main = new THREE.DirectionalLight(0xb8c4f8, 1.2);
  main.position.set(2, 3, 2);
  scene.add(main);
  const fill = new THREE.DirectionalLight(0x818CF8, 0.4);
  fill.position.set(-3, -1, 1);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x4a5bcc, 0.5);
  rim.position.set(0, -2, -3);
  scene.add(rim);

  // Placeholder geometry
  const geom = new THREE.TorusKnotGeometry(0.6, 0.15, 128, 16);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x2a3580, metalness: 0.6, roughness: 0.3,
    emissive: 0x1a2040, emissiveIntensity: 0.3
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.visible = false;
  scene.add(mesh);

  // Mouse drag
  let isDragging = false, prevX = 0, prevY = 0, rotVelX = 0, rotVelY = 0;
  canvas.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevX, dy = e.clientY - prevY;
    rotVelX = dy * 0.005; rotVelY = dx * 0.005;
    mesh.rotation.x += rotVelX; mesh.rotation.y += rotVelY;
    const glb = glbModels && glbModels['full'];
    if (glb) { glb.rotation.x += rotVelX; glb.rotation.y += rotVelY; }
    prevX = e.clientX; prevY = e.clientY;
  });
  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mouseleave', () => isDragging = false);

  // Scroll to zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    camera.position.z = Math.max(1.0, Math.min(8.0, camera.position.z + e.deltaY * 0.005));
  }, { passive: false });

  // Pinch to zoom (touch)
  let lastPinchDist = null;
  canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) lastPinchDist = null; });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (lastPinchDist !== null) {
      camera.position.z = Math.max(1.0, Math.min(8.0, camera.position.z - (dist - lastPinchDist) * 0.01));
    }
    lastPinchDist = dist;
  }, { passive: false });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.005;
    if (!isDragging) {
      rotVelX *= 0.95; rotVelY *= 0.95;
      // Rotate placeholder mesh
      mesh.rotation.y += rotVelY + 0.003;
      mesh.rotation.x += rotVelX + Math.sin(t * 0.5) * 0.0008;
      mesh.position.y = Math.sin(t) * 0.05;
      // Rotate loaded GLB model with same motion
      const glb = glbModels && glbModels['full'];
      if (glb) {
        glb.rotation.y += rotVelY + 0.003;
        glb.rotation.x += rotVelX + Math.sin(t * 0.5) * 0.0008;
        glb.position.y = Math.sin(t) * 0.05;
      }
    } else {
      mesh.position.y = Math.sin(t) * 0.05;
      const glb = glbModels && glbModels['full'];
      if (glb) glb.position.y = Math.sin(t) * 0.05;
    }
    renderer.render(scene, camera);
  }
  animate();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  return { scene, camera, renderer, mesh, mat };
}

// ================================================
// GLB LOADER (loads GLTFLoader dynamically)
// ================================================
let gltfLoaderReady = false;
async function ensureGLTFLoader() {
  if (gltfLoaderReady || (window.THREE && THREE.GLTFLoader)) { gltfLoaderReady = true; return; }
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
    s.onload = () => { gltfLoaderReady = true; res(); };
    s.onerror = rej;
    document.head.appendChild(s);
  }).catch(() => { });
}
async function loadGLBIntoScene(url, sceneObj) {
  await ensureGLTFLoader();
  if (!THREE.GLTFLoader) return;
  const loader = new THREE.GLTFLoader();
  loader.load(url, gltf => {
    sceneObj.scene.remove(sceneObj.mesh);
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.0 / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    sceneObj.scene.add(model);
    sceneObj.loadedModel = model;
  }, undefined, err => console.error('GLB error:', err));
}

// ================================================
// CAROUSEL SYSTEM
// ================================================
const CAROUSEL_INTERVAL = 6000; // ms per slide

const carouselSlides = [
  {
    key: 'full',
    badge: 'Dreamz Sleep Mask',
    title: 'The Dreamz Mask',
    desc: '',
    color: 0x2a2060, emissive: 0x0d0830
  }
];

// One THREE scene shared
var glbModels = {};
const carouselScene = createScene('carousel-canvas');
let carouselIndex = 0;
let carouselTimer = null;
let carouselProgress = 0;
let carouselProgressInterval = null;

function renderCarouselInfo(idx) {
  const s = carouselSlides[idx];
  document.getElementById('carousel-info').innerHTML = `
    <span class="carousel-info-badge">${s.badge}</span>
    <h3>${s.title}</h3>
    <p>${s.desc}</p>
  `;
  document.getElementById('tab-0').classList.add('active');
  if (carouselScene) {
    carouselScene.mat.color.setHex(s.color);
    carouselScene.mat.emissive.setHex(s.emissive);
    if (carouselScene.mesh) {
      carouselScene.mesh.visible = !glbModels[s.key];
    }
  }
}

function resetTimer() {
  clearInterval(carouselProgressInterval);
  clearTimeout(carouselTimer);
  carouselProgress = 0;
  const bar = document.getElementById('carousel-progress');
  if (bar) bar.style.width = '0%';
}

window.carouselGoto = function (idx) {
  carouselIndex = 0;
  renderCarouselInfo(0);
  resetTimer();
};
window.carouselNext = function () { carouselGoto(0); };
window.carouselPrev = function () { carouselGoto(0); };

// Init
renderCarouselInfo(0);
resetTimer();

// Auto-load the GLB model from relative path
function loadMaskGLB() {
  ensureGLTFLoader().then(() => {
    if (!THREE.GLTFLoader) return;
    const loader = new THREE.GLTFLoader();
    loader.load('dreamz_mask.glb', gltf => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.0 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      if (glbModels['full']) carouselScene.scene.remove(glbModels['full']);
      glbModels['full'] = model;
      carouselScene.scene.add(model);
      if (carouselScene.mesh) carouselScene.mesh.visible = false;
      renderCarouselInfo(0);
      const spinner = document.getElementById('carousel-spinner');
      if (spinner) {
        spinner.style.opacity = '0';
        setTimeout(() => spinner.style.display = 'none', 500);
      }
    }, undefined, (err) => {
      console.warn('GLB load failed, placeholder shown:', err);
      const spinner = document.getElementById('carousel-spinner');
      if (spinner) spinner.style.display = 'none';
    });
  });
}
loadMaskGLB();

// ================================================
// GLB DRAG & DROP - reload mask model
// ================================================
window.handleGLBUpload = function (event) {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  ensureGLTFLoader().then(() => {
    if (!THREE.GLTFLoader) return;
    const loader = new THREE.GLTFLoader();
    loader.load(url, gltf => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.0 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      if (glbModels['full']) carouselScene.scene.remove(glbModels['full']);
      glbModels['full'] = model;
      carouselScene.scene.add(model);
      if (carouselScene.mesh) carouselScene.mesh.visible = false;
      renderCarouselInfo(0);
    });
  });
};

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf'))) return;
  const url = URL.createObjectURL(file);
  ensureGLTFLoader().then(() => {
    if (!THREE.GLTFLoader) return;
    const loader = new THREE.GLTFLoader();
    loader.load(url, gltf => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      model.scale.setScalar(2.0 / maxDim);
      model.position.sub(center.multiplyScalar(2.0 / maxDim));
      if (glbModels['full']) carouselScene.scene.remove(glbModels['full']);
      glbModels['full'] = model;
      carouselScene.scene.add(model);
      if (carouselScene.mesh) carouselScene.mesh.visible = false;
      renderCarouselInfo(0);
    });
  });
});

// ================================================
// BRAINWAVE VISUALIZATION CANVAS
// ================================================
(function () {
  const canvas = document.getElementById('brainwave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() {
    W = canvas.width = canvas.clientWidth;
    H = canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const waveTypes = [
    { label: 'Delta (0.5–4 Hz)',  color: '#4a5bcc', freq: 1.8,  amp: 0.14,  y: 0.15, thick: 2   },
    { label: 'Theta (4–8 Hz)',   color: '#6a7edc', freq: 3.5,  amp: 0.095, y: 0.3,  thick: 1.5 },
    { label: 'Alpha (8–13 Hz)',  color: '#8b9de8', freq: 6.0,  amp: 0.075, y: 0.45, thick: 1.5 },
    { label: 'Sigma (12–16 Hz)', color: '#818CF8', freq: 9.0,  amp: 0.055, y: 0.6,  thick: 1.5, spindleRate: 1.4 },
    { label: 'Beta (13–30 Hz)',  color: '#6ec8c4', freq: 18.0, amp: 0.032, y: 0.75, thick: 1   },
    { label: 'Gamma (30+ Hz)',   color: '#9edbd8', freq: 36.0, amp: 0.016, y: 0.88, thick: 1   },
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.012;

    // Grid lines
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, H * (i / 8));
      ctx.lineTo(W, H * (i / 8));
      ctx.strokeStyle = 'rgba(138,157,232,0.06)';
      ctx.lineWidth = 1; ctx.stroke();
    }

    // Active stage indicator
    const stage = Math.floor(t / 8) % 3;
    const stageName = ['Sleep Onset', 'Deep Sleep', 'REM'][stage];
    const stageColor = ['rgba(74,91,204,0.08)', 'rgba(26,32,64,0.1)', 'rgba(129,140,248,0.06)'][stage];
    ctx.fillStyle = stageColor;
    ctx.fillRect(0, 0, W, H);

    ctx.font = '10px Space Mono, monospace';
    ctx.fillStyle = 'rgba(184,196,248,0.25)';
    ctx.fillText('STAGE: ' + stageName.toUpperCase(), 16, 20);

    // Draw waves
    waveTypes.forEach((w, i) => {
      const baseY = H * w.y;
      const ampPx = H * w.amp;

      function getY(x) {
        if (i === 0) {
          // Delta: smooth slow roll + slight harmonic
          return baseY + (Math.sin((x/W)*Math.PI*2*w.freq + t*0.6) + 0.2*Math.sin((x/W)*Math.PI*2*w.freq*2 + t*1.2)) * ampPx;
        } else if (i === 1) {
          // Theta: slightly irregular via low-freq amplitude drift
          const drift = 0.85 + 0.15*Math.sin(t*0.4 + x*0.002);
          return baseY + Math.sin((x/W)*Math.PI*2*w.freq + t*0.9) * ampPx * drift;
        } else if (i === 2) {
          // Alpha: purest regular sine — no noise
          return baseY + Math.sin((x/W)*Math.PI*2*w.freq + t*1.1) * ampPx;
        } else if (i === 3) {
          // Sigma: spindle bursts — amplitude waxes/wanes
          const envelope = Math.abs(Math.sin(t * w.spindleRate + x * 0.003));
          return baseY + Math.sin((x/W)*Math.PI*2*w.freq + t*1.4) * ampPx * envelope;
        } else if (i === 4) {
          // Beta: fast with high-freq noise overlay
          const noise = 0.7 + 0.3*Math.sin(x*0.18 + t*3.5);
          return baseY + Math.sin((x/W)*Math.PI*2*w.freq + t*2.0) * ampPx * noise;
        } else {
          // Gamma: very fast, very small, chaotic
          const chaos = 0.5 + 0.5*Math.sin(x*0.35 + t*6.0) * Math.cos(x*0.12 + t*4.2);
          return baseY + Math.sin((x/W)*Math.PI*2*w.freq + t*3.5) * ampPx * (0.6 + 0.4*chaos);
        }
      }

      // Glow pass
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = getY(x);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 8;
      ctx.lineWidth = w.thick + 2;
      ctx.strokeStyle = w.color + '20';
      ctx.stroke();

      // Sharp line
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = getY(x);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = w.color;
      ctx.lineWidth = w.thick;
      ctx.stroke();

      // Label
      ctx.font = '9px Space Mono, monospace';
      ctx.fillStyle = w.color + 'aa';
      ctx.fillText(w.label, 16, baseY - ampPx - 4);
    });

    // Scanning line
    const scanX = ((t * 30) % W);
    const scanGrad = ctx.createLinearGradient(scanX - 20, 0, scanX + 2, 0);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(1, 'rgba(129,140,248,0.3)');
    ctx.strokeStyle = scanGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(scanX, 0); ctx.lineTo(scanX, H); ctx.stroke();

    requestAnimationFrame(draw);
  }
  draw();
})();

// ================================================
// NEUROMODULATION WAVE (science section)
// ================================================
(function () {
  const canvas = document.getElementById('eeg-vis-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() {
    W = canvas.width = canvas.clientWidth;
    H = canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.012;

    const cx = W / 2;
    const cy = H * 0.46;
    const r = Math.min(W, H) * 0.36;

    // ── Head silhouette ──────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,12,26,0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(138,157,232,0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nose indicator (top = forehead)
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.07, cy - r * 0.97);
    ctx.lineTo(cx, cy - r * 1.09);
    ctx.lineTo(cx + r * 0.07, cy - r * 0.97);
    ctx.strokeStyle = 'rgba(138,157,232,0.18)';
    ctx.lineWidth = 1; ctx.stroke();

    // ── Wave bands travelling front→back ─────────
    // "front" = top of circle (cy - r), "back" = bottom (cy + r)
    // We parameterise each band by a normalised position p ∈ [0,1]
    // p=0 → forehead, p=1 → back of head
    // At position p the amplitude envelope decays as e^(-3p)

    const SPEED = 0.10;   // how fast bands travel (units of t)
    const NUM_BANDS = 6;      // bands visible at once
    const WAVE_FREQ = 4;      // oscillations across the chord width

    for (let b = 0; b < NUM_BANDS; b++) {
      // Each band has a phase offset so they spread evenly
      const phase = (t * SPEED + b / NUM_BANDS) % 1; // 0..1 position along arc
      const p = phase;                             // 0 = forehead, 1 = back

      // Decay: strong at forehead, fades to almost nothing at back
      const decay = Math.exp(-3.5 * p);

      // The band travels along the vertical midline of the head.
      // At normalised position p the band sits at angle θ measured
      // from the top (−π/2) toward the bottom (+π/2 on both sides).
      // θ goes from −π/2 (forehead) to +π/2 (back).
      const theta = -Math.PI / 2 + Math.PI * p;

      // The chord at angle θ spans horizontally inside the circle
      const bandY = cy + r * Math.sin(theta);           // y-centre of chord
      const halfW = r * Math.cos(theta);                // half-width of chord at this y

      if (halfW < 2) continue; // skip degenerate slivers at extremes

      // Draw the wavy line along the chord
      const amplitude = decay * r * 0.08;
      const alpha = decay * 0.85;

      // Glow pass (thick, soft)
      ctx.beginPath();
      const steps = Math.ceil(halfW * 2);
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;               // 0..1 across chord
        const x = (cx - halfW) + frac * halfW * 2;
        const wave = Math.sin(frac * Math.PI * 2 * WAVE_FREQ - t * 2.5) * amplitude;
        const y = bandY + wave;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(129,140,248,${alpha * 0.25})`;
      ctx.lineWidth = 6 * decay + 1;
      ctx.shadowColor = '#818CF8';
      ctx.shadowBlur = 12 * decay;
      ctx.stroke();

      // Sharp core line
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const x = (cx - halfW) + frac * halfW * 2;
        const wave = Math.sin(frac * Math.PI * 2 * WAVE_FREQ - t * 2.5) * amplitude;
        const y = bandY + wave;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(129,140,248,${alpha * 0.9})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // ── Label ────────────────────────────────────
    ctx.textAlign = 'left';
    ctx.font = '10px Space Mono, monospace';
    ctx.fillStyle = 'rgba(129,140,248,0.38)';
    ctx.fillText('NEUROMODULATION - PROPAGATION', 14, H - 14);

    requestAnimationFrame(draw);
  }
  draw();
})();

// ================================================
// GLB UPLOAD BUTTON STYLES
// ================================================
document.querySelectorAll('.glb-upload-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    btn.style.borderColor = 'rgba(129,140,248,0.4)';
    btn.style.color = 'rgba(129,140,248,0.8)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.borderColor = 'rgba(138,157,232,0.15)';
    btn.style.color = 'rgba(184,196,248,0.45)';
  });
});
