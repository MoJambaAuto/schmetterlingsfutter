/* Schmetterlingsfutter – Amazon-Start (LZA, 3.61.0)
   Mo 28.11.2026: Die App soll Startplattform für ALLE Amazon-Einkäufe sein, nicht nur für Geschenke – dezent, nicht aufdringlich.
   Regeln (Amazon-Partnerprogramm, partnernet.amazon.de/help/operating/policies, 28.11.2026):
   - Pflichthinweis „Als Amazon-Partner verdiene ich an qualifizierten Verkäufen“ steht sichtbar bei den Links.
   - Keine Belohnung (Punkte, Rabatte, Abzeichen) fürs Kaufen über die App. Kein Aufruf, Links als Lesezeichen zu speichern.
   - Keine Produkte, keine Preise, keine Nachbildung der Amazon-App: nur Startknöpfe und eine Suche.
   Google Play (Ads-Richtlinie): Hinweis ist als Werbung erkennbar, leicht wegzuschicken, nur über den Knopf klickbar.
   Zähler: amz_start_open:<ort>, amz_start_go:<kategorie|suche>, amz_hide, fly_*:amz_fly (über Papillon). */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const S = () => L.S, esc = L.esc, $ = (id) => document.getElementById(id);
  const C = (k) => window.LZS && window.LZS.count(k);
  const DAY = 864e5;
  /* Eigene Kennung für den Start (im PartnerNet anlegen, dann hier eintragen). Leer = Standardkennung. */
  if (D.affiliateTagStart == null) D.affiliateTagStart = '';
  const CATS = [
    ['haushalt', '🏠', 'Haushalt', 'Haushalt'], ['drogerie', '🧴', 'Drogerie', 'Drogerie'], ['technik', '🔌', 'Technik', 'Elektronik'], ['buecher', '📚', 'Bücher', 'Bücher'],
    ['tier', '🐾', 'Tierbedarf', 'Tierbedarf'], ['spielzeug', '🧸', 'Spielzeug', 'Spielzeug'], ['essen', '🍫', 'Lebensmittel', 'Lebensmittel'], ['garten', '🌿', 'Garten', 'Garten']
  ];
  const NOTE = 'Werbung · Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.';
  const hidden = () => S().amzHide === true;

  function url(q) {
    const P = window.LZP, tag = (D.affiliateTagStart || '').trim();
    if (P && P.amazonUrl) return P.amazonUrl(q, false, true, { plain: true, tag: tag || undefined });
    return 'https://www.amazon.de/s?k=' + encodeURIComponent(q) + '&tag=' + encodeURIComponent(tag || D.affiliateTag || '');
  }
  function go(q, what) { C('amz_start_go:' + what); window.open(url(q), '_blank', 'noopener'); }

  function sheet(where) {
    C('amz_start_open:' + (where || 'sonst'));
    const html = '<h3>🛒 Amazon-Start</h3>' +
      '<p class="about" style="font-size:18px;margin-bottom:10px">Nicht nur Geschenke: Fang hier an, wenn du bei Amazon etwas brauchst. Alles, auch den Alltag.</p>' +
      '<form class="own-search amz-search" role="search"><input type="search" enterkeyhint="search" maxlength="80" placeholder="Was brauchst du? z. B. Batterien" aria-label="Bei Amazon suchen"><button type="submit" class="pill-btn small" aria-label="Bei Amazon suchen">🔍</button></form>' +
      '<div class="amz-grid">' + CATS.map((c) => '<button type="button" class="amz-cat" data-c="' + c[0] + '"><span>' + c[1] + '</span> ' + esc(c[2]) + '</button>').join('') + '</div>' +
      '<p class="about amz-note" style="font-size:16px;margin:12px 0 0"><span class="ad-note">Werbung</span> Als Amazon-Partner verdiene ich an qualifizierten Verkäufen. Für dich ändert sich der Preis nicht. Die Links öffnen Amazon im Browser oder in der Amazon-App.</p>' +
      '<div class="row wrap" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button>' + (hidden() ? '<button class="pill-btn ghost" data-show>Auf „Heute“ zeigen</button>' : '<button class="pill-btn ghost" data-hide>Nicht mehr auf „Heute“ zeigen</button>') + '</div>';
    L.openSheet(html, (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('.amz-cat').forEach((b) => b.onclick = () => { const c = CATS.find((x) => x[0] === b.dataset.c); if (c) go(c[3], c[0]); });
      sh.querySelector('form').onsubmit = (e) => { e.preventDefault(); const i = sh.querySelector('input'), q = i.value.trim(); if (!q) { i.focus(); return; } window.LZS && window.LZS.term && window.LZS.term('shop', q); go(q, 'suche'); };
      const h = sh.querySelector('[data-hide]'), s = sh.querySelector('[data-show]');
      if (h) h.onclick = () => { S().amzHide = true; L.save(); C('amz_hide'); L.closeSheet(); render(); L.toast('Karte ausgeblendet – den Amazon-Start findest du unter „Wir“'); };
      if (s) s.onclick = () => { S().amzHide = false; L.save(); L.closeSheet(); render(); };
    });
  }

  /* Karte auf „Heute“ (klein) und Kachel unter „Wir“ */
  function render() {
    const c = $('amazonStart');
    if (c) {
      c.classList.toggle('hidden', hidden() || !S().onboarded);
      if (!c.dataset.on) { c.dataset.on = '1'; c.innerHTML = '<div class="row between" style="gap:10px"><div><div class="eyebrow" style="margin:0">🛒 Amazon-Start <span class="ad-note">Werbung</span></div><div style="font-size:18px;margin-top:4px">Nicht nur Geschenke – auch der Alltag.</div></div><button type="button" class="pill-btn small primary" data-amz>Los ›</button></div><p class="about" style="font-size:16px;color:var(--text-muted);margin:8px 0 0">Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.</p>'; c.querySelector('[data-amz]').onclick = () => sheet('heute'); }
    }
    if (!$('amzTile')) { const g = document.querySelector('.tile[data-go="gift"]'); if (g) { const t = document.createElement('button'); t.type = 'button'; t.className = 'tile'; t.id = 'amzTile'; t.innerHTML = '<span class="tile-i">🛒</span><span class="tile-t">Amazon-Start</span>'; t.onclick = () => sheet('wir'); g.after(t); } }
  }

  /* Papillon-Hinweis (Papillon, 3.61.0): höchstens alle 7 Tage, nach „Später“ 14 Tage Ruhe, nie wenn die Karte ausgeblendet ist */
  const LINES = [
    'Nicht nur Geschenke: Fang bei Amazon-Einkäufen ruhig bei mir an · Werbung',
    'Vergessen kostet mehr als Versand. Bestellt rechtzeitig – Start bei mir · Werbung',
    'Batterien, Tintenpatronen, Katzenfutter: alles geht auch von hier aus · Werbung'
  ];
  function flySuggestion() {
    if (hidden()) return null;
    const a = S().amzFly || (S().amzFly = { last: 0, snooze: 0, n: 0 }), now = Date.now();
    if (now - a.last < 7 * DAY || a.snooze > now) return null;
    const text = LINES[(a.n || 0) % LINES.length];
    return { key: 'amz_fly', ad: true, text, go: 'Amazon-Start', run: () => sheet('papillon'),
      shown: () => { const s = S().amzFly; s.last = Date.now(); s.n = (s.n || 0) + 1; L.save(); },
      later: () => { S().amzFly.snooze = Date.now() + 14 * DAY; L.save(); } };
  }

  const css = document.createElement('style');
  css.textContent = '.amz-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}' +
    '.amz-cat{min-height:56px;font:inherit;font-size:18px;font-weight:700;text-align:left;padding:8px 12px;border-radius:16px;border:1px solid var(--line);background:var(--glass-2);color:var(--text);cursor:pointer}' +
    '.amz-cat span{font-size:24px;margin-right:4px}';
  document.head.appendChild(css);
  render();
  window.LZA = { sheet, render, flySuggestion, url };
})();
