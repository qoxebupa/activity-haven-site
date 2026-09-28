/* ---------- Activity Haven: sheet-driven page content ----------
   Used by gallery.html, membership.html and volunteer.html.
   Reads two tabs of the Program Hub Google Sheet. Columns are found by their
   heading in row 1, so column order doesn't matter.

   "Gallery" tab  — one row per poster / photo / video:
     Section | Order | Show | Caption | Image | Video
     Section: Registration Rules, Menu, Announcements, Around the Centre, Volunteer
     Image:   a Google Drive link (shared "Anyone with the link") or a file name in this site
     Video:   used when Image is blank (file name in this site, or a Drive video link)

   "Page Text" tab — one row per heading / paragraph / bullet:
     Page | Order | Show | Style | Text
     Page:  Membership, Volunteer, Menu
     Style: Heading, Intro (the line in the dark banner at the top), Text, Bullet, Note
     Put **double stars** around words to make them bold.

   Show: blank or "yes" = shown; anything else ("no", "hide"...) = hidden.
   Order: lowest first; blank rows keep their sheet position, after numbered ones.
   If a tab can't be reached, the page keeps the built-in content already in its HTML. */
(function () {
  const SHEET_ID = '1tvGtCqroniAThEteWph0f4Bg1f_aiV0JqQU3M4ZTcOk';
  const cache = {};

  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmt(str) { return esc(str).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function norm(s) { return String(s || '').trim().toLowerCase(); }
  function driveId(url) {
    const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
    return m ? m[1] : null;
  }
  function imageSrc(url) { const id = driveId(url); return id ? 'https://lh3.googleusercontent.com/d/' + id : url; }
  function isVideoFile(url) { return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url); }

  // Fetch a tab and return its rows as objects keyed by lower-case heading.
  function loadTab(name, requiredHeadings) {
    if (cache[name]) return cache[name];
    const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
      '/gviz/tq?tqx=out:json&headers=1&sheet=' + encodeURIComponent(name);
    cache[name] = fetch(url).then(res => {
      if (!res.ok) throw new Error('bad response');
      return res.text();
    }).then(text => {
      const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
      const labels = (json.table.cols || []).map(c => norm(c.label));
      // If the tab is missing, Google quietly returns the first tab instead — so check the headings.
      requiredHeadings.forEach(h => { if (!labels.includes(h)) throw new Error('"' + name + '" tab not found'); });
      const hidden = r => r.show !== '' && r.show !== 'yes' && r.show !== 'y';
      return (json.table.rows || []).map((row, idx) => {
        const obj = { idx: idx };
        labels.forEach((label, i) => {
          const c = row.c && row.c[i];
          obj[label] = c && c.v != null ? String(c.v).trim() : '';
        });
        obj.show = norm(obj.show);
        obj.orderNum = parseFloat(obj.order);
        return obj;
      }).filter(r => !hidden(r)).sort((a, b) => {
        const ao = isNaN(a.orderNum) ? Infinity : a.orderNum;
        const bo = isNaN(b.orderNum) ? Infinity : b.orderNum;
        return ao - bo || a.idx - b.idx;
      });
    });
    return cache[name];
  }

  // ---- Posters / photos / videos ----
  function posterCard(item) {
    const caption = item.caption || '';
    if (item.image) {
      const src = imageSrc(item.image);
      return '<div class="poster-card"><img src="' + esc(src) + '" alt="' + esc(caption || 'Poster') + '" loading="lazy">' +
        '<div class="poster-card-foot"><span>' + esc(caption) + '</span>' +
        '<button class="btn-print" data-print="' + esc(src) + '">Print</button></div></div>';
    }
    const id = driveId(item.video);
    let player;
    if (id) {
      player = '<div class="video-frame"><iframe src="https://drive.google.com/file/d/' + id +
        '/preview" allow="autoplay; fullscreen" allowfullscreen title="' + esc(caption || 'Video') + '"></iframe></div>';
    } else if (isVideoFile(item.video)) {
      player = '<video src="' + esc(item.video) + '" controls playsinline preload="metadata"></video>';
    } else {
      return '';
    }
    return '<div class="poster-card">' + player +
      (caption ? '<div class="poster-card-foot"><span>' + esc(caption) + '</span></div>' : '') + '</div>';
  }

  function fillPosters(sectionName, gridEl, emptyText) {
    if (!gridEl) return;
    loadTab('Gallery', ['section', 'caption', 'image']).then(rows => {
      const items = rows.filter(r => norm(r.section) === norm(sectionName) && (r.image || r.video));
      const html = items.map(posterCard).join('');
      if (html) {
        gridEl.innerHTML = html;
        gridEl.style.display = '';
      } else if (emptyText) {
        gridEl.innerHTML = '<p class="empty-msg">' + esc(emptyText) + '</p>';
      } else {
        gridEl.innerHTML = '';
        gridEl.style.display = 'none';
      }
    }).catch(err => console.warn('Gallery tab not available — keeping built-in posters.', err));
  }

  // ---- Headings / paragraphs / bullets ----
  function fillText(pageName, bodyEl, introEl) {
    if (!bodyEl) return;
    loadTab('Page Text', ['page', 'style', 'text']).then(rows => {
      const items = rows.filter(r => norm(r.page) === norm(pageName) && r.text);
      if (!items.length) return; // nothing in the sheet yet: keep built-in text
      let html = '', inList = false, intro = '';
      items.forEach(r => {
        const style = norm(r.style) || 'text';
        if (style === 'intro') { intro += (intro ? ' ' : '') + fmt(r.text); return; }
        if (style === 'bullet') {
          if (!inList) { html += '<ul>'; inList = true; }
          html += '<li>' + fmt(r.text) + '</li>';
          return;
        }
        if (inList) { html += '</ul>'; inList = false; }
        if (style === 'heading') html += '<h2>' + fmt(r.text) + '</h2>';
        else if (style === 'note') html += '<p class="note">' + fmt(r.text) + '</p>';
        else html += '<p>' + fmt(r.text) + '</p>';
      });
      if (inList) html += '</ul>';
      bodyEl.innerHTML = html;
      if (introEl && intro) introEl.innerHTML = intro;
    }).catch(err => console.warn('Page Text tab not available — keeping built-in text.', err));
  }

  // Print buttons (works for posters added later too)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-print]');
    if (!btn) return;
    const url = btn.getAttribute('data-print').replace(/"/g, '%22').replace(/</g, '%3C');
    const win = window.open('', '_blank');
    win.document.write('<html><head><title>Print</title></head><body style="margin:0;text-align:center;">' +
      '<img src="' + url + '" style="max-width:100%;" onload="window.print();"></body></html>');
    win.document.close();
  });

  window.AHContent = { fillPosters: fillPosters, fillText: fillText };
})();
