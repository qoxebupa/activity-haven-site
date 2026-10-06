/* ---------- Activity Haven: phone-friendly menu ----------
   On screens 900px wide or less, the row of menu links is replaced by one
   large "Menu" bar. Tapping it opens the full list as big buttons.
   Desktop and tablet-landscape views are unchanged.
   Also registers sw.js so phones can install the site as an app.
   Added to every page with:
     <script src="mobile-nav.js" defer></script>                      */
(function () {
  var css = [
    '.mnav-btn{display:none}',
    '@media (max-width:900px){',
    '  .site-header{display:contents}',
    '  .main-nav-row{position:sticky;top:0;z-index:60;background:var(--paper,#fffdf7);border-bottom:3px solid var(--teal-deep,#1e5a55)}',
    '  .main-nav-row .header-inner{padding:8px 16px !important}',
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
