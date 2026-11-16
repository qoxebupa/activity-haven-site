/* ---------- Activity Haven: image links from the Google Sheet ----------
   One place that decides how an image link pasted into the Sheet is turned
   into something the browser can show. Used by every page that shows
   Sheet images (home, gallery, lunches, about, listings, membership,
   volunteer, newsletter, program).

   Shown as a picture:
     Google Drive, Dropbox, OneDrive (personal), ordinary image web
     addresses, file names stored in this site, and (new)
     - Google Drawings: the "Publish to web" image link, or the normal
       editing link if the drawing is shared "Anyone with the link"
     - Google Slides: the normal editing link of one slide, shared
       "Anyone with the link" (it shows the slide the link points to)

   Shown as a live, embedded design (new):
     - Canva: the "Smart embed link" (Share > Embed), or the "view" link
     - Adobe Express: the embed link, or its whole <iframe> embed code
     Edits made in Canva / Adobe Express appear on the site automatically.
     These are not real pictures, so they don't suit the homepage carousel.

   Won't work: Google Photos, Facebook. These show nothing on the public
   site, and a note naming the link is written to the browser console.
   Any picture that fails to load for any reason is quietly hidden, so the
   public never sees a broken-picture icon. */
(function () {
  var UNSUPPORTED = /(photos\.app\.goo\.gl|photos\.google\.com|facebook\.com|fb\.com|fbcdn\.net)/i;

  function driveId(url) {
    var m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]+)/);
    return m ? m[1] : null;
  }

  function dropbox(url) {
    if (!/(^|\.)dropbox\.com\//i.test(url.replace(/^https?:\/\//i, ''))) return null;
    var u = url.replace(/^http:/i, 'https:')
               .replace(/([?&])(dl|raw)=\d/gi, '$1')
               .replace(/[?&]+$/, '')
               .replace(/\?&+/, '?');
    return u + (u.indexOf('?') === -1 ? '?' : '&') + 'raw=1';
  }

  function oneDrive(url) {
    // "Embed" code or link: onedrive.live.com/embed?resid=...&authkey=...
    if (/onedrive\.live\.com\/embed\?/i.test(url)) {
      var src = url.match(/src="([^"]+)"/i);           // whole <iframe> pasted
      var link = (src ? src[1] : url).replace(/&amp;/g, '&');
      return link.replace(/\/embed\?/i, '/download?');
    }
    // Share links: 1drv.ms/... or onedrive.live.com/?... (personal accounts)
    if (/(^https?:\/\/)?(1drv\.ms|onedrive\.live\.com)\//i.test(url)) {
      var b64 = btoa(unescape(encodeURIComponent(url)))
        .replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
      return 'https://api.onedrive.com/v1.0/shares/u!' + b64 + '/root/content';
    }
    return null;
  }

  // A value that changes every 5 minutes, so browsers fetch a fresh copy
  // of a Google drawing/slide at least that often after it is edited.
  function freshness() { return Math.floor(Date.now() / 300000); }

  function googleDrawing(url) {
    // Published: docs.google.com/drawings/d/e/2PACX-.../pub?w=960&h=720
    if (/docs\.google\.com\/drawings\/d\/e\/[\w-]+\/pub/i.test(url)) {
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 'ahv=' + freshness();
    }
    // Editing link: docs.google.com/drawings/d/<id>/edit
    var m = url.match(/docs\.google\.com\/drawings\/d\/([\w-]{20,})/i);
    if (m) return 'https://docs.google.com/drawings/d/' + m[1] + '/export/png?ahv=' + freshness();
    return null;
  }

  function googleSlide(url) {
    // Editing link: docs.google.com/presentation/d/<id>/edit#slide=id.<page>
    var m = url.match(/docs\.google\.com\/presentation\/d\/([\w-]{20,})/i);
    if (!m || /\/d\/e\//i.test(url)) return null;     // published decks can't give an image
    var p = url.match(/[#&?]slide=id\.([\w-]+)/i);
    return 'https://docs.google.com/presentation/d/' + m[1] + '/export/png?' +
      (p ? 'pageid=' + p[1] + '&' : '') + 'ahv=' + freshness();
  }

  // ---- Live designs (Canva, Adobe Express): shown in a frame, not as a picture
  function ahEmbedLink(raw) {
    var url = String(raw || '').trim();
    if (!url) return null;
    var src = url.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);   // whole embed code pasted
    if (src) url = src[1].replace(/&amp;/g, '&');
    url = url.replace(/^http:/i, 'https:');

    // Canva: canva.com/design/<id>/<key>/view?...  ->  .../view?embed
    var c = url.match(/^(https:\/\/(?:www\.)?canva\.com\/design\/[\w-]+(?:\/[\w-]+)?)(?:\/(?:view|edit|watch))?/i);
    if (c) return c[1] + '/view?embed';
    // Canva short links and published Canva sites: show as they are
    if (/^https:\/\/([\w-]+\.)?(canva\.link|canva\.site|my\.canva\.site)\//i.test(url)) return url;
    // Adobe Express
    if (/^https:\/\/([\w-]+\.)*(express\.adobe\.com|adobe\.ly)\//i.test(url)) return url;
    return null;
  }

  // Turn a Sheet link into a usable image address.
  // Drive links come back unchanged so each page keeps its own Drive handling.
  // Canva / Adobe Express links also come back unchanged: the page builds a
  // picture for them, and the code at the bottom swaps it for a live frame.
  function ahImageLink(raw) {
    var url = String(raw || '').trim();
    if (!url) return '';
    if (UNSUPPORTED.test(url)) {
      console.warn('[Activity Haven] This image link type won\'t work on the site. ' +
        'Download the picture and use a Google Drive or Dropbox link instead: ' + url);
      return url;   // the page tries it; if it fails it is hidden (below)
    }
    if (driveId(url)) return url;
    if (ahEmbedLink(url)) return url;
    return googleDrawing(url) || googleSlide(url) || dropbox(url) || oneDrive(url) || url;
  }

  window.ahImageLink = ahImageLink;
  window.ahEmbedLink = ahEmbedLink;

  // ---- Swap any picture whose link is a Canva / Adobe Express design for a live frame.
  // Letter-size portrait by default (posters, menus). A link ending in
  // "#landscape" or "#square" changes the shape.
  function shapeOf(link) {
    if (/#landscape\b/i.test(link)) return '16 / 9';
    if (/#square\b/i.test(link)) return '1 / 1';
    return '8.5 / 11';
  }

  function swap(img) {
    if (!img || img.tagName !== 'IMG' || img.dataset.ahEmbed) return;
    var link = img.getAttribute('src') || '';
    var embed = ahEmbedLink(link);
    if (!embed) return;
    img.dataset.ahEmbed = '1';
    img.onerror = null;                     // the page's own "hide if broken" step
    img.removeAttribute('onerror');

    var box = document.createElement('div');
    box.className = 'ah-embed';
    box.style.cssText = 'position:relative;width:100%;aspect-ratio:' + shapeOf(link) +
      ';overflow:hidden;border-radius:8px;background:#f6f1e7;line-height:normal;';
    var frame = document.createElement('iframe');
    frame.src = embed;
    frame.title = img.getAttribute('alt') || 'Design';
    frame.loading = 'lazy';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('allow', 'fullscreen');
    frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
    box.appendChild(frame);

    // If the picture sat inside a "click to open full size" link, replace that too.
    var target = img;
    var a = img.parentElement;
    if (a && a.tagName === 'A' && a.children.length === 1) target = a;
    var wrap = target.parentElement;
    target.replaceWith(box);

    // Program page: remove its grey "loading" placeholder and backdrop.
    var detail = box.closest && box.closest('.detail-image-wrap');
    if (detail) {
      var sk = detail.querySelector('.detail-image-skeleton');
      if (sk) sk.style.display = 'none';
      detail.style.removeProperty('--poster');
      detail.classList.add('has-embed');
      detail.style.display = '';
    }
    if (wrap && wrap.style && wrap.style.display === 'none') wrap.style.display = '';
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.tagName === 'IMG') swap(root);
    var imgs = root.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) swap(imgs[i]);
  }

  function watch() {
    scan(document.body);
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === 'attributes') swap(m.target);
        else m.addedNodes.forEach(scan);
      });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }
  if (document.body) watch();
  else document.addEventListener('DOMContentLoaded', watch);

  // Hide any picture that fails to load, and say which one in the console.
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (!el || el.tagName !== 'IMG' || el.dataset.ahEmbed) return;
    if (ahEmbedLink(el.getAttribute('src'))) return;   // being swapped for a frame
    el.style.display = 'none';
    var row = el.closest && el.closest('[data-row],[data-sheet-row]');
    console.warn('[Activity Haven] Image could not be shown' +
      (row ? ' (Sheet row ' + (row.getAttribute('data-row') || row.getAttribute('data-sheet-row')) + ')' : '') +
      ': ' + el.getAttribute('src'));
  }, true);
})();
