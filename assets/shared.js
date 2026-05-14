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
  requestAnimationFrame(resize);
  if ('IntersectionObserver' in window) {
    const initObs = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        initObs.disconnect();
        requestAnimationFrame(resize);
      }
    }, { rootMargin: '220px 0px' });
    initObs.observe(canvas);
  }

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
