/* ---------- Activity Haven: phone-friendly menu ----------
   On screens 900px wide or less, the row of menu links is replaced by one
   large "Menu" bar. Tapping it opens the full list as big buttons.
   Desktop and tablet-landscape views are unchanged.
   Also adds a small Facebook icon (linking to Activity Haven's Facebook
   page) at the right-hand end of the menu bar on every page, and
   registers sw.js so phones can install the site as an app.
   Added to every page with:
     <script src="mobile-nav.js" defer></script>                      */
(function () {
  var css = [
    '.mnav-btn{display:none}',
    '.main-nav-row .header-inner{position:relative}',
    '@media (min-width:901px) and (max-width:1350px){.main-nav-row .header-inner{padding-right:64px !important}}',
    '.fb-link{position:absolute;right:16px;top:50%;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;',
    '  width:34px;height:34px;border-radius:50%;background:#1877F2;color:#fff;text-decoration:none;box-shadow:0 2px 6px rgba(0,0,0,.18)}',
    '.fb-link:hover{background:#0f63d6}',
    '.fb-link:focus-visible{outline:3px solid var(--coral,#d6604a);outline-offset:2px}',
    '.fb-link svg{width:20px;height:20px;fill:currentColor}',
    '@media (max-width:900px){',
    '  .site-header{display:contents}',
    '  .main-nav-row{position:sticky;top:0;z-index:60;background:var(--paper,#fffdf7);border-bottom:3px solid var(--teal-deep,#1e5a55)}',
    '  .main-nav-row .header-inner{padding:8px 64px 8px 16px !important}',
    '  .fb-link{width:42px;height:42px;right:12px;top:34px}',
    '  .fb-link svg{width:24px;height:24px}',
    '  .mnav-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;',
    '    border:0;border-radius:12px;background:var(--teal-deep,#1e5a55);color:#fff;',
    '    font-family:inherit;font-size:1.25rem;font-weight:700;line-height:1;letter-spacing:.02em;cursor:pointer}',
    '  .mnav-btn:focus-visible{outline:3px solid var(--coral,#d6604a);outline-offset:2px}',
    '  .mnav-icon{font-size:1.5rem;line-height:1}',
    '  .main-nav-row .main-nav{display:none !important}',
    '  .main-nav-row.nav-open .main-nav{display:grid !important;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 4px;width:100%}',
    '  .main-nav-row.nav-open .main-nav a{display:flex;align-items:center;justify-content:center;min-height:50px;',
    '    padding:8px;border:2px solid var(--teal-deep,#1e5a55);border-radius:10px;font-size:1.1rem;',
    '    text-align:center;background:#fff;color:var(--charcoal,#2b2b2b)}',
    '  .main-nav-row.nav-open .main-nav a.is-current{background:var(--teal-deep,#1e5a55);color:#fff}',
    '}'
  ].join('\n');

  function init() {
    var row = document.querySelector('.main-nav-row');
    var nav = row && row.querySelector('.main-nav');
    if (!row || !nav || row.querySelector('.mnav-btn')) return;

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var inner = nav.parentNode;
    if (!inner.querySelector('.fb-link')) {
      var fb = document.createElement('a');
      fb.className = 'fb-link';
      fb.href = 'https://www.facebook.com/ActivityHaven/';
      fb.target = '_blank';
      fb.rel = 'noopener';
      fb.title = 'Activity Haven on Facebook';
      fb.setAttribute('aria-label', 'Activity Haven on Facebook (opens in a new tab)');
      fb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z"/></svg>';
      inner.appendChild(fb);
    }

    if (!nav.id) nav.id = 'main-nav-links';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mnav-btn';
    btn.setAttribute('aria-controls', nav.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="mnav-icon" aria-hidden="true">&#9776;</span><span class="mnav-label">Menu</span>';
    nav.parentNode.insertBefore(btn, nav);

    btn.addEventListener('click', function () {
      var open = row.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('.mnav-icon').innerHTML = open ? '&#10005;' : '&#9776;';
      btn.querySelector('.mnav-label').textContent = open ? 'Close menu' : 'Menu';
    });
    // Close after choosing a link (matters for "#home" on the same page)
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && row.classList.contains('nav-open')) btn.click();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Lets phones install the site as an "Activity Haven" app (see sw.js).
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
})();
