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
        width: clamp(120px, 18vw, 220px) !important;
      }

      @media (max-width: 768px) {
        #nav .nav-logo {
          width: clamp(130px, 38vw, 220px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const marketingNavHtml = () => `
    <nav id="nav" role="navigation">
      <a href="${url('index.html#hero')}" class="nav-logo" aria-label="Dreamz home">
        <img src="${url('Logo/Logo_dark_website.png')}" alt="Dreamz logo" class="dreamz-logo">
      </a>
      <ul class="nav-links" role="list">
        <li><a href="${url('index.html#technology')}">Technology</a></li>
        <li><a href="${url('index.html#how')}">How It Works</a></li>
        <li><a href="${url('index.html#science')}">Science</a></li>
        <li><a href="${url('index.html#faq')}">FAQ</a></li>
        <li><a href="${url('dreamz-blog.html')}"${isActive('blog')}>Blog</a></li>
        <li><a href="${url('dreamz-research.html')}"${isActive('research')}>Research</a></li>
      </ul>
      <button class="nav-cta" type="button" onclick="window.location.href='${url('index.html#cta')}'">Join Waitlist</button>
    </nav>`;

  const legalNavHtml = () => `
    <nav id="nav" role="navigation">
      <a href="${url('index.html')}" class="nav-logo" aria-label="Dreamz home">
        <img src="${url('Logo/Logo_dark_website.png')}" alt="Dreamz logo" class="dreamz-logo">
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
      <a href="${url('index.html')}" class="footer-logo">
        <img src="${url('Logo/Logo_dark_website.png')}" alt="Dreamz">
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
          <a href="${url('index.html')}" class="footer-logo">
            <img src="${url('Logo/Logo_dark_website.png')}" alt="Dreamz">
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
})();
