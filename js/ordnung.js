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

  /* ---------- Startseite: eine Reihe „Schicken“ statt vier Kachelgruppen ---------- */
  const TOP = ['btnNext', 'btnKiss', 'btnKritzel', 'btnKamera'];
  const MORE = [
    ['Schnell gesagt', ['btnHug', 'btnMorning', 'btnNight', 'btnGen']],
    ['Von Herzen', ['btnReasons', 'btnPoem', 'btnWrite', 'btnGift']],
    ['Mit Bild und Ton', ['btnJingle', 'btnNah']]
  ];
  const stash = document.createElement('div'); stash.id = 'oStash'; stash.hidden = true; home.appendChild(stash);
  const heads = Array.from(home.querySelectorAll(':scope > .eyebrow.tile-head'));
  const rows = Array.from(home.querySelectorAll(':scope > .btn-row'));
  if (heads.length && rows.length) {
    const sendHead = document.createElement('div'); sendHead.className = 'eyebrow tile-head'; sendHead.textContent = 'Etwas schicken';
    const sendRow = document.createElement('div'); sendRow.className = 'btn-row o-send';
    TOP.forEach((id) => { const b = $(id); if (b) sendRow.appendChild(b); });
    const more = document.createElement('button'); more.type = 'button'; more.className = 'pill-btn ghost o-more'; more.id = 'btnMoreSend'; more.textContent = 'Mehr zum Schicken …';
    heads[0].before(sendHead); sendHead.after(sendRow); sendRow.after(more);
    /* übrige Knöpfe sicher verwahren (ihre Funktionen hängen an den Elementen) */
    rows.forEach((r) => { Array.from(r.children).forEach((b) => stash.appendChild(b)); r.remove(); });
    heads.forEach((h) => h.remove());
    more.onclick = moreSheet;
  }
  function moreSheet() {
    let html = '<h3>Mehr zum Schicken</h3>';
    MORE.forEach(([title, ids]) => {
      const items = ids.map((id) => $(id)).filter(Boolean);
      if (!items.length) return;
      html += '<div class="eyebrow" style="margin-top:6px">' + esc(title) + '</div><div class="o-grid">' + items.map((b) => '<button type="button" class="btn" data-proxy="' + b.id + '">' + b.innerHTML + '</button>').join('') + '</div>';
    });
    html += '<div class="eyebrow" style="margin-top:6px">Für euch</div><div class="o-grid"><button type="button" class="btn" data-go="thanks"><span class="btn-icon">🙏</span><span>Danke<br>sagen</span></button><button type="button" class="btn" data-go="fav"><span class="btn-icon">❤️</span><span>Meine<br>Favoriten</span></button></div>';
    html += '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>';
    L.openSheet(html, (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('[data-proxy]').forEach((b) => b.onclick = () => { L.closeSheet(); const t = $(b.dataset.proxy); if (t) setTimeout(() => t.click(), 60); });
      sh.querySelector('[data-go="thanks"]').onclick = () => { L.closeSheet(); L.showView('wishes'); L.showSub('wishes', 'thanks'); };
      sh.querySelector('[data-go="fav"]').onclick = () => { L.closeSheet(); L.showView('wishes'); setTimeout(() => { const f = $('favPanel'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); };
    });
  }

  /* ---------- Zweitrangiges von der Startseite an seinen Ort ---------- */
  const wishes = $('view-wishes');
  const fav = $('favPanel'); if (fav && wishes) wishes.appendChild(fav);
  const thanks = $('thanksCard'); const tsub = $('sub-thanks');
  if (thanks && tsub) tsub.prepend(thanks); else if (thanks) thanks.classList.add('o-off');
  /* Reihenfolge: Neues vom Schatz, Botschaft, Du & …, Flügelschlag, Schicken, (Geschenk-Radar wenn bald), Schmetterling */
  const msgCard = home.querySelector(':scope > .msg-card');
  const anchor = $('fromPartner');
  if (anchor && msgCard) {
    let last = anchor;
    [msgCard, $('partnerCard'), $('piekCard')].forEach((el) => { if (el) { last.after(el); last = el; } });
    const sh = home.querySelector(':scope > .eyebrow.tile-head'); const row = home.querySelector(':scope > .o-send'); const mb = $('btnMoreSend');
    [sh, row, mb, $('giftRadar'), $('reasonPanel'), $('bflyCard')].forEach((el) => { if (el) { last.after(el); last = el; } });
  }
  /* Geschenk-Radar auf der Startseite nur, wenn ein Anlass in höchstens 21 Tagen kommt */
  function radarGate() {
    const g = $('giftRadar'); if (!g) return;
    const o = window.LZF && window.LZF.occasionsAll ? window.LZF.occasionsAll()[0] : null;
    g.classList.toggle('o-off', !(o && o.days <= 21));
  }
  if (window.LZP && window.LZP.renderGiftRadar) { const orig = window.LZP.renderGiftRadar; window.LZP.renderGiftRadar = function () { const r = orig.apply(this, arguments); radarGate(); return r; }; }
  radarGate();

  /* ---------- Botschaftskarte: drei Knöpfe sichtbar, Rest unter „⋯“ ---------- */
  const acts = msgCard ? msgCard.querySelector('.msg-actions') : null;
  if (acts) {
    const dots = document.createElement('button'); dots.type = 'button'; dots.className = 'icon-btn'; dots.id = 'btnMsgMore'; dots.setAttribute('aria-label', 'Weitere Aktionen'); dots.textContent = '⋯';
    acts.appendChild(dots);
    const LESS = ['btnPersonal', 'btnCopy', 'btnReport'];
    const tidy = () => {
      const send = $('btnSendPartner'); const sendOn = send && !send.classList.contains('hidden');
      ['btnShare'].forEach((id) => { const b = $(id); if (b) b.classList.toggle('o-off', !!sendOn); });
      LESS.forEach((id) => { const b = $(id); if (b) b.classList.add('o-off'); });
    };
    tidy(); new MutationObserver(tidy).observe(acts, { subtree: true, attributes: true, attributeFilter: ['class'] });
    const LABEL = { btnShare: '↗ Teilen', btnPersonal: '✎ Persönlich machen', btnCopy: '⧉ Kopieren', btnReport: '🚩 Melden' };
    dots.onclick = () => {
      const ids = ['btnShare', 'btnPersonal', 'btnCopy', 'btnReport'].filter((id) => { const b = $(id); return b && (b.classList.contains('o-off')) && !b.classList.contains('hidden'); });
      L.openSheet('<h3>Botschaft</h3><div class="o-list">' + ids.map((id) => '<button type="button" class="pill-btn" data-proxy="' + id + '">' + LABEL[id] + '</button>').join('') + '</div><div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
        sh.querySelector('[data-cancel]').onclick = L.closeSheet;
        sh.querySelectorAll('[data-proxy]').forEach((b) => b.onclick = () => { L.closeSheet(); const t = $(b.dataset.proxy); if (t) setTimeout(() => t.click(), 60); });
      });
    };
  }

  /* ---------- Spielen: 4 Reiter statt 7 – Musik und Orakel als Kacheln in „Spiele“ ---------- */
  const seg = document.querySelector('.seg[data-seg="play"]');
  ['music', 'oracle'].forEach((k) => { const b = seg && seg.querySelector('[data-sub="' + k + '"]'); if (b) b.classList.add('o-off'); });
  function extraTiles() {
    const box = $('spieleList'); if (!box || box.querySelector('[data-oextra]')) return;
    const h = document.createElement('div'); h.className = 'eyebrow hub-h'; h.textContent = '🎵 Für zwischendurch'; h.setAttribute('data-oextra', '1');
    const mk = (icon, title, sub, go) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'deck'; b.setAttribute('data-oextra', '1'); b.innerHTML = '<span class="d-ico">' + icon + '</span><div class="d-body"><div class="d-title">' + esc(title) + '</div><div class="d-sub">' + esc(sub) + '</div></div><span class="d-go">›</span>'; b.onclick = () => L.showSub('play', go); return b; };
    const anchorEl = Array.from(box.children).find((c) => /^s*(✨ Bald|📜 Zuletzt)/.test(c.textContent));
    const frag = document.createDocumentFragment(); frag.appendChild(h); frag.appendChild(mk('🎵', 'Liebeslied-Pad', 'Eine kleine Melodie spielen und schicken', 'music')); frag.appendChild(mk('🌼', 'Gänseblümchen-Orakel', 'Er/sie liebt mich, liebt mich nicht …', 'oracle'));
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
  window.LZO = { moreSheet, radarGate };
})();
