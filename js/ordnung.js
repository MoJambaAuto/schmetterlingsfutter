/* Schmetterlingsfutter – Aufgeräumte Oberfläche (LZO, 3.27.0)
   Grundlage: Arbeitsgedächtnis fasst rund 4 Einheiten (Cowan), Auswahl-Überlastung (Chernev u. a.), Progressive Disclosure (NN/g),
   Material 3 (3–5 Hauptziele, Beschriftung immer sichtbar), WCAG 2.2 (Tippflächen ≥ 24 px, hier ≥ 44 px).
   Nichts wird entfernt: Selteneres rückt eine Ebene tiefer („Mehr zum Schicken“, „⋯“) und bleibt über „Frag Papillon“ auffindbar.
   Die Knöpfe bleiben dieselben Elemente – nur ihr Platz ändert sich. So funktionieren alle bisherigen Funktionen unverändert. */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const $ = (id) => document.getElementById(id), esc = L.esc;
  const home = $('view-home'); if (!home) return;

  /* 3.43.0: Startseite (feste Reihenfolge in index.html), Geschenk-Radar (partner.js) und Botschaftskarte (app.js) sind umgezogen. */

  /* ---------- Spielen: 4 Reiter statt 7 – Musik und Orakel als Kacheln in „Spiele“ ---------- */
  const seg = document.querySelector('.seg[data-seg="play"]');
  ['music', 'oracle'].forEach((k) => { const b = seg && seg.querySelector('[data-sub="' + k + '"]'); if (b) b.classList.add('o-off'); });
  function extraTiles() {
    const box = $('spieleList'); if (!box || box.querySelector('[data-oextra]')) return;
    const h = document.createElement('div'); h.className = 'eyebrow hub-h'; h.textContent = '🎵 Für zwischendurch'; h.setAttribute('data-oextra', '1');
    const mk = (icon, title, sub, go) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'deck'; b.setAttribute('data-oextra', '1'); b.innerHTML = '<span class="d-ico">' + icon + '</span><div class="d-body"><div class="d-title">' + esc(title) + '</div><div class="d-sub">' + esc(sub) + '</div></div><span class="d-go">›</span>'; b.onclick = () => L.showSub('play', go); return b; };
    const anchorEl = Array.from(box.children).find((c) => /^s*(✨ Bald|📜 Zuletzt)/.test(c.textContent));
    const frag = document.createDocumentFragment(); frag.appendChild(h); frag.appendChild(mk('🎵', 'Liebeslied-Pad', 'Eine kleine Melodie spielen und schicken', 'music')); frag.appendChild(mk('🌼', 'Gänseblümchen-Orakel', 'Er/sie liebt mich, liebt mich nicht …', 'oracle'));
    if (window.LZJ) { const jt = mk('🕸️', 'Falterjagd draußen', 'Allein oder als Spaziergang zu zweit: echte Falter finden', 'spiele'); jt.onclick = () => window.LZJ.open(); frag.insertBefore(jt, frag.children[1]); h.textContent = '🌿 Draußen & zwischendurch'; }
    if (window.LZA) { const bt = mk('✨', 'Falter zu Besuch', 'Jeden Tag drei Falter bei euch im Zimmer fangen', 'spiele'); bt.onclick = () => window.LZA.visit(); frag.insertBefore(bt, frag.children[window.LZJ ? 2 : 1]); }
    if (anchorEl) box.insertBefore(frag, anchorEl); else box.appendChild(frag);
  }
  const box = $('spieleList'); if (box && window.MutationObserver) new MutationObserver(() => { if (!box.querySelector('[data-oextra]')) extraTiles(); }).observe(box, { childList: true });
  extraTiles();

  const css = document.createElement('style');
  css.textContent = '.o-off{display:none !important}' +
    '.o-more{display:block;margin:10px auto 18px;min-height:44px}' +
    '.o-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:6px 0 10px}' +
    '.o-grid .btn{min-height:84px;width:100%;margin:0}' +
    '.o-list{display:flex;flex-direction:column;gap:10px;align-items:stretch}.o-list .pill-btn{min-height:48px;justify-content:flex-start}';
  document.head.appendChild(css);
  window.LZO = {};
})();
