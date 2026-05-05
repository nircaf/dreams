// Shared Dreamz navigation and footer chrome.
// Pages opt into a footer layout with: <body data-footer-type="landing|legal|editorial">
(() => {
  const script = document.currentScript;
  const src = script ? script.getAttribute('src') || '' : '';
  const root = script && script.dataset.root
    ? script.dataset.root
    : src.startsWith('../') ? '../' : '';
  const footerType = document.body.dataset.footerType || 'landing';
  const navType = document.body.dataset.navType || (footerType === 'legal' ? 'legal' : 'marketing');
  const active = document.body.dataset.activePage || '';
  const year = document.body.dataset.footerYear || '2026';

  const url = path => `${root}${path}`;
  const isActive = page => active === page ? ' class="active"' : '';

  const ensureSharedStyles = () => {
    if (document.getElementById('dreamz-shared-chrome-style')) return;

    const style = document.createElement('style');
    style.id = 'dreamz-shared-chrome-style';
    style.textContent = `
      #nav .nav-logo {
        width: auto !important;
        display: flex;
        align-items: center;
      }

      .dreamz-animated-logo {
        width: clamp(80px, 10vw, 120px);
        height: auto;
        aspect-ratio: 300 / 172;
        display: block;
      }
      
      .footer-logo .dreamz-animated-logo {
        width: clamp(65px, 8vw, 90px);
        height: auto;
        aspect-ratio: 300 / 172;
      }

      #nav .nav-links a.active {
        color: var(--white, #f4f6ff);
      }

      section:not(#hero):not(#how):not(#science):not(.preorder-hero),
      .details,
      #featured,
      #posts,
      .legal-section {
        content-visibility: auto;
        contain-intrinsic-size: 820px;
      }

      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto !important;
        }

        *,
        *::before,
        *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      }

      @media (max-width: 768px) {
        #nav .nav-logo {
          width: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const marketingNavHtml = () => `
    <nav id="nav" role="navigation">
      <a href="${url('index.html#hero')}" class="nav-logo" aria-label="Dreamz home">
        <canvas class="dreamz-animated-logo" width="300" height="300" aria-label="Dreamz logo"></canvas>
      </a>
      <ul class="nav-links" role="list">
        <li><a href="${url('index.html#technology')}">Technology</a></li>
        <li><a href="${url('index.html#how')}">How It Works</a></li>
        <li><a href="${url('index.html#science')}">Science</a></li>
        <li><a href="${url('index.html#faq')}">FAQ</a></li>
        <li><a href="${url('dreamz-blog.html')}"${isActive('blog')}>Blog</a></li>
        <li><a href="${url('dreamz-research.html')}"${isActive('research')}>Research</a></li>
        <li><a href="${url('index.html#cta')}">Waitlist</a></li>
      </ul>
      <button class="nav-cta" type="button" onclick="window.location.href='${url('preorder.html')}'">Pre-order</button>
    </nav>`;

  const legalNavHtml = () => `
    <nav id="nav" role="navigation">
      <a href="${url('index.html')}" class="nav-logo" aria-label="Dreamz home">
        <canvas class="dreamz-animated-logo" width="300" height="300" aria-label="Dreamz logo"></canvas>
      </a>
      <ul class="nav-links" role="list">
        <li><a href="${url('index.html')}"${isActive('home')}>Home</a></li>
        <li><a href="${url('index.html#technology')}">Technology</a></li>
        <li><a href="${url('dreamz-blog.html')}"${isActive('blog')}>Blog</a></li>
        <li><a href="${url('index.html#cta')}">Waitlist</a></li>
      </ul>
    </nav>`;

  const legalFooterHtml = () => `
    <footer class="legal-footer" role="contentinfo">
      <a href="${url('index.html')}" class="footer-logo" aria-label="Dreamz home">
        <canvas class="dreamz-animated-logo" width="300" height="300" aria-label="Dreamz logo"></canvas>
      </a>
      <nav class="footer-links">
        <a href="${url('index.html')}">Home</a>
        <a href="${url('dreamz-blog.html')}"${isActive('blog')}>Blog</a>
        <a href="${url('privacy.html')}"${isActive('privacy')}>Privacy Policy</a>
        <a href="${url('term/index.html')}"${isActive('terms')}>Terms</a>
        <a href="${url('contact.html')}"${isActive('contact')}>Contact</a>
      </nav>
      <p class="footer-copy">&copy; ${year} Dreamz. Sleep Neurotechnology. All rights reserved.</p>
    </footer>`;

  const editorialFooterHtml = () => `
    <footer role="contentinfo">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="${url('index.html')}" class="footer-logo" aria-label="Dreamz home">
            <canvas class="dreamz-animated-logo" width="300" height="300" aria-label="Dreamz logo"></canvas>
          </a>
          <p class="footer-tagline">Sleep well. Live well.</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">&copy; ${year} Dreamz. Sleep Neurotechnology. All rights reserved.</p>
        <div class="footer-links">
          <a href="${url('index.html')}">Home</a>
          <a href="${url('dreamz-blog.html')}"${isActive('blog')}>Blog</a>
          <a href="${url('dreamz-research.html')}"${isActive('research')}>Research</a>
          <a href="${url('privacy.html')}">Privacy</a>
          <a href="${url('term/index.html')}">Terms</a>
          <a href="${url('contact.html')}">Contact</a>
        </div>
      </div>
    </footer>`;

  const landingFooterHtml = () => `
    <footer role="contentinfo" itemscope itemtype="https://schema.org/WPFooter">
      <div class="footer-bottom">
        <div class="footer-bottom-row">
          <p class="footer-copy">&copy; 2025 Dreamz. Sleep Neurotechnology. All rights reserved.</p>
          <div class="footer-legal-links">
            <a href="#">About</a>
            <a href="#">Care &amp; Washing</a>
            <a href="#">Safety Guide</a>
            <a href="${url('contact.html')}">Contact</a>
            <a href="${url('privacy.html')}">Privacy Policy</a>
            <a href="${url('term/index.html')}">Terms &amp; Conditions</a>
          </div>
        </div>
        <div class="footer-policy-links"></div>
      </div>
    </footer>`;

  const footerHtml = {
    legal: legalFooterHtml,
    editorial: editorialFooterHtml,
    landing: landingFooterHtml
  };

  ensureSharedStyles();

  const navTarget = document.querySelector('[data-dreamz-nav]') || document.querySelector('body > nav');
  if (navTarget) navTarget.outerHTML = navType === 'legal' ? legalNavHtml() : marketingNavHtml();

  const footerTarget = document.querySelector('[data-dreamz-footer]') || document.querySelector('body > footer');
  if (footerTarget) footerTarget.outerHTML = (footerHtml[footerType] || landingFooterHtml)();

  const initLogos = () => {
    const canvases = document.querySelectorAll('.dreamz-animated-logo');
    if (!canvases.length) return;

    const XMIN = -Math.PI, XMAX = Math.PI;
    const YMIN = -1.8, YMAX = 1.8;
    const NS = 800;
    const DX = (XMAX - XMIN) / NS;
    const HUE = 245, SAT = 25, LIT = 66;
    const WS = 0.4, BD = 0.71, BS = 8.0, ED = 0.17, ES = 2.6;
    const wmax = 5.5, a = 3.14, b = 2.14; 

    const env = (x, spd) => Math.pow(Math.abs(Math.cos(x / 2)), spd);
    const lineWidth = (x) => wmax * env(x, WS);
    const lineAlpha = (x) => {
      const m = Math.max(0.03, 1 - BD);
      return m + (1 - m) * env(x, BS);
    };
    const lineLit = (x) => Math.min(100, LIT + (100 - LIT) * ED * env(x, ES));
    const strokeColor = (x) => {
      const al = lineAlpha(x);
      const lt = lineLit(x);
      return `hsla(${HUE},${SAT}%,${lt.toFixed(1)}%,${al.toFixed(3)})`;
    };
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const easeOut = t => 1 - (1 - t) * (1 - t);

    const ANIM_DUR = 2600;
    const PAUSE_DUR = 4000;
    const CYCLE = ANIM_DUR + PAUSE_DUR;
    
    canvases.forEach(cv => {
      const ctx = cv.getContext('2d');
      const DPR = window.devicePixelRatio || 1;
      const S_W = 300;
      const S_H = 172;
      cv.width = S_W * DPR;
      cv.height = S_H * DPR;
      ctx.scale(DPR, DPR);

      const tcx = x => (x - XMIN) / (XMAX - XMIN) * S_W;
      const tcy = y => (YMAX - y) / (YMAX - YMIN) * S_H;

      const fns = [
        x =>  Math.PI * Math.sin(x) / b,
        x => -Math.PI * Math.sin(x) / b,
        x =>  Math.PI * Math.sin(x) / (a * b),
      ];

      const drawLine = (fn, xStart, xEnd) => {
        for (let i = 0; i < NS; i++) {
          const x0 = XMIN + i * DX, x1 = x0 + DX, xm = (x0 + x1) / 2;
          if (xm < xStart || xm > xEnd) continue;
          const y0 = clamp(fn(x0), YMIN, YMAX);
          const y1 = clamp(fn(x1), YMIN, YMAX);
          ctx.beginPath();
          ctx.moveTo(tcx(x0), tcy(y0));
          ctx.lineTo(tcx(x1), tcy(y1));
          ctx.lineWidth = lineWidth(xm);
          ctx.lineCap = 'round';
          ctx.strokeStyle = strokeColor(xm);
          ctx.stroke();
        }
      };

      let animStart = performance.now();
      let drawnSolid = false;

      const frame = (ts) => {
        const timeInCycle = (ts - animStart) % CYCLE;
        
        if (timeInCycle < ANIM_DUR) {
          drawnSolid = false;
          const raw = timeInCycle / ANIM_DUR;
          ctx.clearRect(0, 0, S_W, S_H);
          
          const offsets = [0, 0.22, 0.44];
          const span = 0.56;

          offsets.forEach((off, li) => {
            const lt = easeOut(clamp((raw - off) / span, 0, 1));
            const xEnd = XMIN + lt * (XMAX - XMIN);
            drawLine(fns[li], XMIN, xEnd);
          });
        } else {
          if (!drawnSolid) {
            ctx.clearRect(0, 0, S_W, S_H);
            fns.forEach(fn => drawLine(fn, XMIN, XMAX));
            drawnSolid = true;
          }
        }
        requestAnimationFrame(frame);
      };

      requestAnimationFrame((ts) => { animStart = ts; requestAnimationFrame(frame); });
    });
  };

  initLogos();
})();
