// Shared Dreamz interactions and visualizations.
// The expensive work is gated by visibility so off-screen sections do not keep
// rendering while the user is elsewhere on the page.

const dreamzMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const DREAMZ_REDUCED_MOTION = dreamzMotionQuery ? dreamzMotionQuery.matches : false;
const DREAMZ_SAVE_DATA = Boolean(navigator.connection && navigator.connection.saveData);
const DREAMZ_LOW_POWER = DREAMZ_REDUCED_MOTION || DREAMZ_SAVE_DATA;
const DREAMZ_DPR = Math.min(window.devicePixelRatio || 1, DREAMZ_LOW_POWER ? 1 : 1.5);

function scheduleIdle(callback, timeout = 800) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    window.setTimeout(callback, Math.min(timeout, 300));
  }
}

function resizeCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const pixelWidth = Math.max(1, Math.round(width * DREAMZ_DPR));
  const pixelHeight = Math.max(1, Math.round(height * DREAMZ_DPR));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  ctx.setTransform(DREAMZ_DPR, 0, 0, DREAMZ_DPR, 0, 0);
  return { width, height };
}

function createVisibilityGate(element, options = {}) {
  let visible = true;
  let pageVisible = !document.hidden;
  const listeners = new Set();

  const notify = () => {
    const active = visible && pageVisible && !DREAMZ_REDUCED_MOTION;
    listeners.forEach(listener => listener(active));
  };

  if ('IntersectionObserver' in window && element) {
    visible = false;
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      notify();
    }, {
      rootMargin: options.rootMargin || '160px 0px',
      threshold: options.threshold || 0
    });
    observer.observe(element);
  }

  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    notify();
  });

  return {
    isActive: () => visible && pageVisible && !DREAMZ_REDUCED_MOTION,
    onChange(listener) {
      listeners.add(listener);
      listener(visible && pageVisible && !DREAMZ_REDUCED_MOTION);
    }
  };
}

function runVisibleLoop(element, draw, options = {}) {
  const gate = createVisibilityGate(element, options);
  const frameInterval = options.maxFps ? 1000 / options.maxFps : 0;
  let raf = 0;
  let lastFrame = 0;

  const tick = timestamp => {
    raf = 0;
    if (!gate.isActive()) return;

    if (!frameInterval || timestamp - lastFrame >= frameInterval) {
      draw(timestamp);
      lastFrame = timestamp;
    }

    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (!raf && gate.isActive()) raf = requestAnimationFrame(tick);
  };

  gate.onChange(active => {
    if (active) {
      if (options.onActive) options.onActive();
      start();
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });

  if (DREAMZ_REDUCED_MOTION && options.drawOnce) {
    draw(performance.now());
  }

  return gate;
}

function disposeObject3D(object) {
  if (!object) return;
  object.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        Object.keys(material).forEach(key => {
          const value = material[key];
          if (value && value.isTexture) value.dispose();
        });
        material.dispose();
      });
    }
  });
}

// ================================================
// PLATFORM-AWARE CURSOR TOGGLE (PC/Mac only)
// ================================================
(() => {
  const platformRaw = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const ua = navigator.userAgent || '';
  const isDesktopOS = /Win|Mac/i.test(platformRaw);
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const hasFinePointer = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)').matches : true;
  const useCustomCursor = isDesktopOS && !isMobileUA && hasFinePointer && !DREAMZ_REDUCED_MOTION;

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
(() => {
  const cursor = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  if (!window.__dreamzUseCustomCursor || !cursor || !cursorRing) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let raf = 0;

  document.addEventListener('mousemove', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  }, { passive: true });

  const animate = () => {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    raf = requestAnimationFrame(animate);
  };

  const sync = () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!document.hidden && !raf) {
      raf = requestAnimationFrame(animate);
    }
  };

  document.addEventListener('visibilitychange', sync);
  sync();
})();

// ================================================
// NAV SCROLL
// ================================================
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
})();

// ================================================
// REVEAL ON SCROLL
// ================================================
(() => {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  reveals.forEach(reveal => revealObs.observe(reveal));
})();

// ================================================
// BACKGROUND PARTICLE CANVAS
// ================================================
(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let size = resizeCanvas(canvas, ctx);
  let particles = [];
  let time = 0;

  const waves = [
    { freq: 0.75, amp: 48, y: 0.28, color: 'rgba(74,91,204,0.06)', speed: 0.28 },
    { freq: 1.15, amp: 34, y: 0.62, color: 'rgba(129,140,248,0.045)', speed: 0.18 }
  ];

  function seedParticles() {
    const count = Math.min(DREAMZ_LOW_POWER ? 56 : 130, Math.max(48, Math.round((size.width * size.height) / 13000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.1 + 0.25,
      a: Math.random() * 0.45 + 0.12,
      speed: Math.random() * 0.00008 + 0.00002,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function resize() {
    size = resizeCanvas(canvas, ctx);
    seedParticles();
  }

  window.addEventListener('resize', () => requestAnimationFrame(resize), { passive: true });
  resize();

  function draw() {
    const { width: W, height: H } = size;
    ctx.clearRect(0, 0, W, H);
    time += DREAMZ_REDUCED_MOTION ? 0 : 0.005;

    const grad = ctx.createRadialGradient(W * 0.34, H * 0.3, 0, W * 0.34, H * 0.3, W * 0.68);
    grad.addColorStop(0, 'rgba(42,53,128,0.08)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    waves.forEach(wave => {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = H * wave.y + Math.sin((x / W) * Math.PI * 2 * wave.freq + time * wave.speed * 10) * wave.amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    particles.forEach(particle => {
      const flicker = Math.sin(time * particle.speed * 1000 + particle.phase) * 0.25 + 0.75;
      ctx.beginPath();
      ctx.arc(particle.x * W, particle.y * H, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(184,196,248,${particle.a * flicker})`;
      ctx.fill();
    });
  }

  draw();
  runVisibleLoop(canvas, draw, { maxFps: DREAMZ_LOW_POWER ? 18 : 30 });
})();

// ================================================
// 3D SCENE HELPERS
// ================================================
const glbModels = {};

function createScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.THREE) return null;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !DREAMZ_LOW_POWER,
    powerPreference: DREAMZ_LOW_POWER ? 'low-power' : 'high-performance'
  });
  renderer.setPixelRatio(DREAMZ_DPR);
  renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, (canvas.clientWidth || 1) / (canvas.clientHeight || 1), 0.01, 100);
  camera.position.set(0, 0, 3);

  scene.add(new THREE.AmbientLight(0x8b9de8, 0.44));

  const main = new THREE.DirectionalLight(0xb8c4f8, 1.15);
  main.position.set(2, 3, 2);
  scene.add(main);

  const fill = new THREE.DirectionalLight(0x818CF8, 0.36);
  fill.position.set(-3, -1, 1);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x4a5bcc, 0.46);
  rim.position.set(0, -2, -3);
  scene.add(rim);

  const geom = new THREE.TorusKnotGeometry(0.6, 0.15, 96, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x2a3580,
    metalness: 0.55,
    roughness: 0.35,
    emissive: 0x1a2040,
    emissiveIntensity: 0.28
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.visible = true;
  scene.add(mesh);

  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let rotVelX = 0;
  let rotVelY = 0;

  const activeModel = () => glbModels.full || mesh;

  canvas.addEventListener('pointerdown', event => {
    isDragging = true;
    prevX = event.clientX;
    prevY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', event => {
    if (!isDragging) return;
    const dx = event.clientX - prevX;
    const dy = event.clientY - prevY;
    rotVelX = dy * 0.005;
    rotVelY = dx * 0.005;
    const model = activeModel();
    model.rotation.x += rotVelX;
    model.rotation.y += rotVelY;
    prevX = event.clientX;
    prevY = event.clientY;
  });

  const stopDragging = () => {
    isDragging = false;
  };

  canvas.addEventListener('pointerup', stopDragging);
  canvas.addEventListener('pointercancel', stopDragging);
  canvas.addEventListener('pointerleave', stopDragging);

  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    camera.position.z = Math.max(1.1, Math.min(6.5, camera.position.z + event.deltaY * 0.004));
  }, { passive: false });

  let t = 0;
  const render = () => {
    t += 0.006;
    const model = activeModel();

    if (!isDragging) {
      rotVelX *= 0.94;
      rotVelY *= 0.94;
      model.rotation.y += rotVelY + 0.0026;
      model.rotation.x += rotVelX + Math.sin(t * 0.55) * 0.0007;
    }

    model.position.y = Math.sin(t) * 0.045;
    renderer.render(scene, camera);
  };

  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(DREAMZ_DPR);
    renderer.setSize(width, height, false);
    render();
  }

  window.addEventListener('resize', () => requestAnimationFrame(resize), { passive: true });
  resize();
  runVisibleLoop(canvas, render, { maxFps: DREAMZ_LOW_POWER ? 18 : 36, rootMargin: '220px 0px' });

  return { scene, camera, renderer, mesh, mat, render };
}

// ================================================
// GLB LOADER (loads GLTFLoader dynamically)
// ================================================
let gltfLoaderReady = false;
let gltfLoaderPromise = null;

async function ensureGLTFLoader() {
  if (gltfLoaderReady || (window.THREE && THREE.GLTFLoader)) {
    gltfLoaderReady = true;
    return;
  }

  if (!gltfLoaderPromise) {
    gltfLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
      script.async = true;
      script.onload = () => {
        gltfLoaderReady = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    }).catch(() => {});
  }

  await gltfLoaderPromise;
}

function normalizeModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 2.0 / maxDim;
  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
}

function setCarouselModel(model, sceneObj) {
  if (!sceneObj || !model) return;

  if (glbModels.full) {
    sceneObj.scene.remove(glbModels.full);
    disposeObject3D(glbModels.full);
  }

  normalizeModel(model);
  glbModels.full = model;
  sceneObj.scene.add(model);
  if (sceneObj.mesh) sceneObj.mesh.visible = false;
  if (sceneObj.render) sceneObj.render();
}

// ================================================
// CAROUSEL SYSTEM
// ================================================
const carouselSlides = [
  {
    key: 'full',
    badge: 'Dreamz Sleep Mask',
    title: 'The Dreamz Mask',
    desc: '',
    color: 0x2a2060,
    emissive: 0x0d0830
  }
];

const carouselScene = createScene('carousel-canvas');

function renderCarouselInfo(idx) {
  const slide = carouselSlides[idx];
  const info = document.getElementById('carousel-info');
  const tab = document.getElementById('tab-0');

  if (info) {
    info.innerHTML = `
      <span class="carousel-info-badge">${slide.badge}</span>
      <h3>${slide.title}</h3>
      <p>${slide.desc}</p>
    `;
  }

  if (tab) tab.classList.add('active');

  if (carouselScene) {
    carouselScene.mat.color.setHex(slide.color);
    carouselScene.mat.emissive.setHex(slide.emissive);
    if (carouselScene.mesh) carouselScene.mesh.visible = !glbModels[slide.key];
    if (carouselScene.render) carouselScene.render();
  }
}

window.carouselGoto = function () {
  renderCarouselInfo(0);
};
window.carouselNext = window.carouselGoto;
window.carouselPrev = window.carouselGoto;

renderCarouselInfo(0);

function loadMaskGLB() {
  if (!carouselScene || !window.THREE) return;

  ensureGLTFLoader().then(() => {
    if (!THREE.GLTFLoader) return;

    const loader = new THREE.GLTFLoader();
    loader.load('dreamz_mask.glb', gltf => {
      setCarouselModel(gltf.scene, carouselScene);
      renderCarouselInfo(0);
      const spinner = document.getElementById('carousel-spinner');
      if (spinner) {
        spinner.style.opacity = '0';
        setTimeout(() => {
          spinner.style.display = 'none';
        }, 500);
      }
    }, undefined, error => {
      console.warn('GLB load failed, placeholder shown:', error);
      const spinner = document.getElementById('carousel-spinner');
      if (spinner) spinner.style.display = 'none';
    });
  });
}

(() => {
  const carouselCanvas = document.getElementById('carousel-canvas');
  let requested = false;
  const requestModel = () => {
    if (requested) return;
    requested = true;
    scheduleIdle(loadMaskGLB, 1200);
  };

  if (!carouselCanvas || DREAMZ_SAVE_DATA) {
    const spinner = document.getElementById('carousel-spinner');
    if (spinner && DREAMZ_SAVE_DATA) spinner.style.display = 'none';
    return;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      requestModel();
    }, { rootMargin: '260px 0px' });
    observer.observe(carouselCanvas);
  } else {
    requestModel();
  }
})();

// ================================================
// GLB UPLOAD BUTTON SUPPORT
// ================================================
window.handleGLBUpload = function (event) {
  const file = event.target.files[0];
  if (!file || !carouselScene) return;

  const url = URL.createObjectURL(file);
  ensureGLTFLoader().then(() => {
    if (!THREE.GLTFLoader) return;
    const loader = new THREE.GLTFLoader();
    loader.load(url, gltf => {
      setCarouselModel(gltf.scene, carouselScene);
      renderCarouselInfo(0);
      URL.revokeObjectURL(url);
    }, undefined, () => URL.revokeObjectURL(url));
  });
};

// ================================================
// BRAINWAVE VISUALIZATION CANVAS
// ================================================
(() => {
  const canvas = document.getElementById('brainwave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let size = resizeCanvas(canvas, ctx);
  let t = 0;

  function resize() {
    size = resizeCanvas(canvas, ctx);
    draw();
  }

  window.addEventListener('resize', () => requestAnimationFrame(resize), { passive: true });
  resize();

  const waveTypes = [
    { label: 'Delta (0.5-4 Hz)', color: '#4a5bcc', freq: 1.8, amp: 0.14, y: 0.15, thick: 2 },
    { label: 'Theta (4-8 Hz)', color: '#6a7edc', freq: 3.5, amp: 0.095, y: 0.3, thick: 1.5 },
    { label: 'Alpha (8-13 Hz)', color: '#8b9de8', freq: 6.0, amp: 0.075, y: 0.45, thick: 1.5 },
    { label: 'Sigma (12-16 Hz)', color: '#818CF8', freq: 9.0, amp: 0.055, y: 0.6, thick: 1.5, spindleRate: 1.4 },
    { label: 'Beta (13-30 Hz)', color: '#6ec8c4', freq: 18.0, amp: 0.032, y: 0.75, thick: 1 },
    { label: 'Gamma (30+ Hz)', color: '#9edbd8', freq: 36.0, amp: 0.016, y: 0.88, thick: 1 }
  ];

  function draw() {
    const { width: W, height: H } = size;
    ctx.clearRect(0, 0, W, H);
    t += DREAMZ_REDUCED_MOTION ? 0 : 0.012;

    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, H * (i / 8));
      ctx.lineTo(W, H * (i / 8));
      ctx.strokeStyle = 'rgba(138,157,232,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const stage = Math.floor(t / 8) % 3;
    const stageName = ['Sleep Onset', 'Deep Sleep', 'REM'][stage];
    const stageColor = ['rgba(74,91,204,0.08)', 'rgba(26,32,64,0.1)', 'rgba(129,140,248,0.06)'][stage];
    ctx.fillStyle = stageColor;
    ctx.fillRect(0, 0, W, H);

    ctx.font = '10px Space Mono, monospace';
    ctx.fillStyle = 'rgba(184,196,248,0.25)';
    ctx.fillText('STAGE: ' + stageName.toUpperCase(), 16, 20);

    waveTypes.forEach((wave, index) => {
      const baseY = H * wave.y;
      const ampPx = H * wave.amp;

      const getY = x => {
        if (index === 0) {
          return baseY + (Math.sin((x / W) * Math.PI * 2 * wave.freq + t * 0.6) + 0.2 * Math.sin((x / W) * Math.PI * 2 * wave.freq * 2 + t * 1.2)) * ampPx;
        }
        if (index === 1) {
          const drift = 0.85 + 0.15 * Math.sin(t * 0.4 + x * 0.002);
          return baseY + Math.sin((x / W) * Math.PI * 2 * wave.freq + t * 0.9) * ampPx * drift;
        }
        if (index === 2) {
          return baseY + Math.sin((x / W) * Math.PI * 2 * wave.freq + t * 1.1) * ampPx;
        }
        if (index === 3) {
          const envelope = Math.abs(Math.sin(t * wave.spindleRate + x * 0.003));
          return baseY + Math.sin((x / W) * Math.PI * 2 * wave.freq + t * 1.4) * ampPx * envelope;
        }
        if (index === 4) {
          const noise = 0.7 + 0.3 * Math.sin(x * 0.18 + t * 3.5);
          return baseY + Math.sin((x / W) * Math.PI * 2 * wave.freq + t * 2.0) * ampPx * noise;
        }
        const chaos = 0.5 + 0.5 * Math.sin(x * 0.35 + t * 6.0) * Math.cos(x * 0.12 + t * 4.2);
        return baseY + Math.sin((x / W) * Math.PI * 2 * wave.freq + t * 3.5) * ampPx * (0.6 + 0.4 * chaos);
      };

      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = getY(x);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.shadowColor = wave.color;
      ctx.shadowBlur = 7;
      ctx.lineWidth = wave.thick + 2;
      ctx.strokeStyle = wave.color + '20';
      ctx.stroke();

      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = getY(x);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = wave.thick;
      ctx.stroke();

      ctx.font = '9px Space Mono, monospace';
      ctx.fillStyle = wave.color + 'aa';
      ctx.fillText(wave.label, 16, baseY - ampPx - 4);
    });

    const scanX = (t * 30) % W;
    const scanGrad = ctx.createLinearGradient(scanX - 20, 0, scanX + 2, 0);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(1, 'rgba(129,140,248,0.3)');
    ctx.strokeStyle = scanGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(scanX, 0);
    ctx.lineTo(scanX, H);
    ctx.stroke();
  }

  runVisibleLoop(canvas, draw, {
    maxFps: DREAMZ_LOW_POWER ? 18 : 30,
    rootMargin: '220px 0px',
    drawOnce: true,
    onActive: resize
  });
})();

// ================================================
// NEUROMODULATION WAVE (science section)
// ================================================
(() => {
  const canvas = document.getElementById('eeg-vis-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let size = resizeCanvas(canvas, ctx);
  let t = 0;

  function resize() {
    size = resizeCanvas(canvas, ctx);
    draw();
  }

  window.addEventListener('resize', () => requestAnimationFrame(resize), { passive: true });
  resize();

  function draw() {
    const { width: W, height: H } = size;
    ctx.clearRect(0, 0, W, H);
    t += DREAMZ_REDUCED_MOTION ? 0 : 0.012;

    const cx = W / 2;
    const cy = H * 0.46;
    const r = Math.min(W, H) * 0.36;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,12,26,0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(138,157,232,0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - r * 0.07, cy - r * 0.97);
    ctx.lineTo(cx, cy - r * 1.09);
    ctx.lineTo(cx + r * 0.07, cy - r * 0.97);
    ctx.strokeStyle = 'rgba(138,157,232,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const speed = 0.1;
    const bandCount = DREAMZ_LOW_POWER ? 4 : 6;
    const waveFreq = 4;

    for (let band = 0; band < bandCount; band += 1) {
      const p = (t * speed + band / bandCount) % 1;
      const decay = Math.exp(-3.5 * p);
      const theta = -Math.PI / 2 + Math.PI * p;
      const bandY = cy + r * Math.sin(theta);
      const halfW = r * Math.cos(theta);

      if (halfW < 2) continue;

      const amplitude = decay * r * 0.08;
      const alpha = decay * 0.85;
      const steps = Math.ceil(halfW);

      ctx.beginPath();
      for (let i = 0; i <= steps; i += 1) {
        const frac = i / steps;
        const x = (cx - halfW) + frac * halfW * 2;
        const wave = Math.sin(frac * Math.PI * 2 * waveFreq - t * 2.5) * amplitude;
        const y = bandY + wave;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(129,140,248,${alpha * 0.22})`;
      ctx.lineWidth = 6 * decay + 1;
      ctx.shadowColor = '#818CF8';
      ctx.shadowBlur = 10 * decay;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= steps; i += 1) {
        const frac = i / steps;
        const x = (cx - halfW) + frac * halfW * 2;
        const wave = Math.sin(frac * Math.PI * 2 * waveFreq - t * 2.5) * amplitude;
        const y = bandY + wave;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(129,140,248,${alpha * 0.9})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.font = '10px Space Mono, monospace';
    ctx.fillStyle = 'rgba(129,140,248,0.38)';
    ctx.fillText('NEUROMODULATION - PROPAGATION', 14, H - 14);
  }

  runVisibleLoop(canvas, draw, {
    maxFps: DREAMZ_LOW_POWER ? 18 : 30,
    rootMargin: '220px 0px',
    drawOnce: true,
    onActive: resize
  });
})();

// ================================================
// GLB UPLOAD BUTTON STYLES
// ================================================
document.querySelectorAll('.glb-upload-btn').forEach(button => {
  button.addEventListener('mouseenter', () => {
    button.style.borderColor = 'rgba(129,140,248,0.4)';
    button.style.color = 'rgba(129,140,248,0.8)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.borderColor = 'rgba(138,157,232,0.15)';
    button.style.color = 'rgba(184,196,248,0.45)';
  });
});
