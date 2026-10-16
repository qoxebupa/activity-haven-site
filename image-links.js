/* ---------- Activity Haven: image links from the Google Sheet ----------
   One place that decides how an image link pasted into the Sheet is turned
   into an address the browser can show. Used by every page that shows
   Sheet images (home, gallery, membership, volunteer, newsletter, program).

   Works:       Google Drive, Dropbox, OneDrive (personal), ordinary image
                web addresses, and file names stored in this site.
   Won't work:  Google Photos, Facebook, Canva. These show nothing on the
                public site, and a note naming the link is written to the
                browser console so it can be traced.
   Any image that fails to load for any reason is quietly hidden, so the
   public never sees a broken-picture icon. */
(function () {
  var UNSUPPORTED = /(photos\.app\.goo\.gl|photos\.google\.com|facebook\.com|fb\.com|fbcdn\.net|canva\.com|canva\.link)/i;

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

  // Turn a Sheet link into a usable image address.
  // Drive links come back unchanged so each page keeps its own Drive handling.
  function ahImageLink(raw) {
    var url = String(raw || '').trim();
    if (!url) return '';
    if (UNSUPPORTED.test(url)) {
      console.warn('[Activity Haven] This image link type won\'t work on the site. ' +
        'Download the picture and use a Google Drive or Dropbox link instead: ' + url);
      return url;   // the page tries it; if it fails it is hidden (below)
    }
    if (driveId(url)) return url;
    return dropbox(url) || oneDrive(url) || url;
  }

  window.ahImageLink = ahImageLink;

  // Hide any picture that fails to load, and say which one in the console.
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (!el || el.tagName !== 'IMG') return;
    el.style.display = 'none';
    var row = el.closest && el.closest('[data-row],[data-sheet-row]');
    console.warn('[Activity Haven] Image could not be shown' +
      (row ? ' (Sheet row ' + (row.getAttribute('data-row') || row.getAttribute('data-sheet-row')) + ')' : '') +
      ': ' + el.getAttribute('src'));
  }, true);
})();
