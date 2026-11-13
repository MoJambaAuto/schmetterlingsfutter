/* Schmetterlingsfutter – Empfehlungen (LZE, 3.37.0)
   Mos Wunsch (13.11.2026): eine Partnerseite in der App mit ausgewählten Partnerlinks für alles,
   was sich nicht natürlich in Funktionen oder Spiele einbauen lässt.
   Regeln:
   - Ein Eintrag erscheint erst, wenn ein echter, zugesagter Werbelink (url) eingetragen ist. Ohne Einträge bleibt die Seite unsichtbar.
   - Jeder Eintrag ist als Werbung gekennzeichnet (Links mit Provision).
   - Partnerbörsen (only: 'single') nur für Nutzer, die (noch) mit niemandem verbunden sind oder die Verbindung getrennt haben –
     nie beim verbundenen Paar (Mo 13.11.: „Das ist doch eine sehr kluge Lösung. Finde ich super.“). */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const esc = L.esc, P = () => window.LZP;
  const C = (k) => window.LZS && window.LZS.count(k);

  /* Kategorien in Anzeige-Reihenfolge */
  const CATS = [
    ['erlebnis', '🎈 Erlebnisse zu zweit'],
    ['blumen', '💐 Blumen & kleine Grüße'],
    ['tickets', '🎟️ Konzerte, Theater & Events'],
    ['buecher', '📚 Bücher & Lesestoff'],
    ['zuzweit', '🔥 Für Zwei (ab 18)'],
    ['neu', '💞 Neu verlieben']
  ];
  /* Partnerprogramme – url bleibt leer, bis das Programm zugesagt hat und der Werbelink vorliegt.
     Felder: id, cat, icon, name, text, url, only ('single' = nur ohne verbundenen Partner) */
  const LINKS = [
    { id: 'jochen-schweizer', cat: 'erlebnis', icon: '🎈', name: 'Jochen Schweizer', text: 'Erlebnisse und Gutscheine für zwei – vom Dinner bis zum Ballonflug', url: '' },
    { id: 'js-arena', cat: 'erlebnis', icon: '🪂', name: 'Jochen Schweizer Arena', text: 'Indoor-Fallschirmspringen, Surfen und Erlebnis-Gutscheine – in Taufkirchen bei München', url: 'https://t.adcell.com/p/click?promoId=612128&slotId=121138&param0=https%3A%2F%2Fwww.jochen-schweizer-arena.de%2F', addedAt: '2026-11-13' },
    { id: 'mydays', cat: 'erlebnis', icon: '✨', name: 'mydays', text: 'Erlebnisgeschenke und Kurzurlaube für Paare', url: '' },
    { id: 'fleurop', cat: 'blumen', icon: '💐', name: 'Fleurop', text: 'Blumen am selben Tag nach Hause liefern lassen', url: '' },
    { id: 'bloomy-days', cat: 'blumen', icon: '🌷', name: 'Bloomy Days', text: 'Frische Blumen im Abo oder als Überraschung', url: '' },
    { id: 'eventim', cat: 'tickets', icon: '🎤', name: 'Eventim', text: 'Tickets für Konzerte, Comedy und Shows', url: '' },
    { id: 'reservix', cat: 'tickets', icon: '🎭', name: 'Reservix', text: 'Tickets für Veranstaltungen in eurer Nähe', url: '' },
    { id: 'thalia', cat: 'buecher', icon: '📚', name: 'Thalia', text: 'Bücher zum Verschenken oder gemeinsam Lesen', url: '' },
    { id: 'amorelie', cat: 'zuzweit', icon: '🔥', name: 'Amorelie', text: 'Spielzeug und Ideen für mehr Nähe', url: '', adult: true },
    { id: 'orion', cat: 'zuzweit', icon: '💋', name: 'Orion', text: 'Dessous, Liebesspielzeug und Massageöle – diskret verpackt', url: 'https://www.awin1.com/cread.php?awinmid=11661&awinaffid=3152437&clickref=sf-empfehlung&ued=https%3A%2F%2Fwww.orion.de%2F', adult: true, addedAt: '2026-11-13' },
    { id: 'zweisamkeit', cat: 'neu', icon: '💞', name: 'Zweisamkeit', text: 'Partnersuche für Menschen, die es ernst meinen', url: '', only: 'single' },
    { id: 'spaete-liebe', cat: 'neu', icon: '🍂', name: 'Späte Liebe', text: 'Partnersuche ab 50', url: '', only: 'single' }
  ];
  const paired = () => !!(P() && P().paired && P().paired());
  const visible = () => LINKS.filter((e) => /^https:\/\//.test(e.url || '') && (e.only !== 'single' || !paired()) && (!e.adult || !!L.S.intim));

  /* ---------- Hinweis durch den vorbeifliegenden Falter (Codex-Konzept, Variante 1) ----------
     Neu = Link, der beim ersten Start dieser Fassung noch nicht bekannt war (Ausnahme: in den letzten 14 Tagen hinzugekommen → gilt auch für Bestandsnutzer als neu).
     Höchstens 1 Hinweis je 24 h, nach „Später“ 72 h Ruhe, ohne neuen Link nur selten (frühestens nach 7 Tagen, ca. 30 %). Text enthält immer „Werbung“. */
  const DAY = 864e5;
  function recoState() {
    const r = L.S.reco || (L.S.reco = {});
    ['catalogIds', 'seenIds', 'announcedIds'].forEach((k) => { if (!Array.isArray(r[k])) r[k] = []; });
    r.lastNoticeAt = Number(r.lastNoticeAt) || 0; r.snoozeUntil = Number(r.snoozeUntil) || 0; return r;
  }
  const recent = (e) => e.addedAt && Date.now() - Date.parse(e.addedAt + 'T00:00:00') < 14 * DAY;
  function syncCatalog() {
    const r = recoState(), cur = visible();
    if (!r.baselineDone) { r.catalogIds = cur.filter((e) => !recent(e)).map((e) => e.id); r.baselineDone = true; L.save(); }
    return cur.filter((e) => r.catalogIds.indexOf(e.id) < 0 && r.announcedIds.indexOf(e.id) < 0 && r.seenIds.indexOf(e.id) < 0);
  }
  function markSeen(items) { const r = recoState(); items.forEach((e) => { if (r.seenIds.indexOf(e.id) < 0) r.seenIds.push(e.id); if (r.catalogIds.indexOf(e.id) < 0) r.catalogIds.push(e.id); }); L.save(); }
  function recoSuggestion() {
    if (!visible().length) return null;
    const r = recoState(), now = Date.now(), fresh = syncCatalog();
    if (now - r.lastNoticeAt < DAY || r.snoozeUntil > now) return null;
    const busy = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName); if (busy) return null;
    const mark = (ids) => () => { const s = recoState(); s.lastNoticeAt = Date.now(); ids.forEach((id) => { if (s.announcedIds.indexOf(id) < 0) s.announcedIds.push(id); }); L.save(); };
    const later = () => { const s = recoState(); s.snoozeUntil = Date.now() + 3 * DAY; L.save(); C('reco_later'); };
    if (fresh.length) {
      return { kind: 'reco', key: 'reco_new', go: 'Ansehen', shown: mark(fresh.map((e) => e.id)), later, run: sheet,
        text: fresh.length === 1 ? 'Psst … ich hab euch was mitgebracht: ' + fresh[0].name + ' · Werbung' : 'Psst … ich hab ' + fresh.length + ' neue Fundstücke für euch · Werbung' };
    }
    if (now - r.lastNoticeAt < 7 * DAY || Math.random() > 0.3) return null;
    return { kind: 'reco', key: 'reco_regular', go: 'Ansehen', shown: mark([]), later, run: sheet, text: 'Ich kenne noch eine schöne Idee für euch · Werbung' };
  }

  function sheet() {
    const list = visible(); if (!list.length) return;
    C('reco_open'); markSeen(list);
    let html = '<h3>🎁 Empfehlungen</h3><p class="about" style="font-size:16px;margin-bottom:6px">Von uns ausgesucht für schöne Momente zu zweit. Kaufst du über diese Links, bekommt Schmetterlingsfutter eine kleine Provision – dich kostet es nichts extra. So bleibt die App kostenlos.</p>';
    CATS.forEach(([cat, title]) => {
      const items = list.filter((e) => e.cat === cat); if (!items.length) return;
      html += '<div class="eyebrow" style="margin-top:12px">' + esc(title) + '</div><div class="reco-list">' + items.map((e) =>
        '<button type="button" class="reco" data-id="' + esc(e.id) + '"><span class="reco-ico">' + e.icon + '</span><span class="reco-b"><b>' + esc(e.name) + '</b><span>' + esc(e.text) + '</span></span><span class="reco-ad">Werbung ↗</span></button>').join('') + '</div>';
    });
    html += '<div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>';
    L.openSheet(html, (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('.reco').forEach((b) => b.onclick = () => { const e = LINKS.find((x) => x.id === b.dataset.id); if (!e) return; C('reco_click:' + e.id); window.open(e.url, '_blank', 'noopener'); });
    });
  }

  /* Karte unter Mehr – nur sichtbar, wenn es Einträge gibt */
  function render() {
    let c = document.getElementById('recoSettings');
    if (!c) { const likes = document.getElementById('likesSettings'); if (!likes) return; c = document.createElement('div'); c.className = 'card'; c.id = 'recoSettings'; c.style.padding = '18px 20px'; likes.after(c); }
    const n = visible().length; c.classList.toggle('hidden', !n); if (!n) return;
    c.innerHTML = '<div class="eyebrow">🎁 Empfehlungen · Werbung</div><p class="about" style="font-size:17px;margin-bottom:10px">Ausgesuchte Partner für Erlebnisse, Blumen, Tickets und mehr.</p><div class="row wrap" style="justify-content:flex-start"><button class="pill-btn small" data-reco>Ansehen</button></div>';
    c.querySelector('[data-reco]').onclick = sheet;
  }

  const css = document.createElement('style');
  css.textContent = '.fly-reco .fly-b{position:relative}.fly-reco .fly-drop{position:absolute;left:14px;top:26px;font-size:22px;opacity:0;transform:translateY(-4px) rotate(-12deg);pointer-events:none}' +
    '.fly-reco.landed .fly-drop{animation:recoDrop .8s ease-out .15s forwards}@keyframes recoDrop{0%{opacity:0;transform:translateY(-8px) rotate(-12deg)}45%{opacity:1;transform:translateY(14px) rotate(8deg)}100%{opacity:1;transform:translateY(26px) rotate(0)}}' +
    '[data-motion="off"] .fly-reco .fly-drop{animation:none;opacity:1;transform:translateY(20px)}@media (prefers-reduced-motion: reduce){.fly-reco .fly-drop{animation:none;opacity:1;transform:translateY(20px)}}' +
    '.reco-list{display:flex;flex-direction:column;gap:8px;margin:6px 0}' +
    '.reco{display:flex;align-items:center;gap:12px;width:100%;text-align:left;min-height:64px;padding:10px 12px;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:var(--glass,rgba(255,255,255,.05));color:var(--text);font:inherit;cursor:pointer}' +
    '.reco-ico{font-size:26px;flex:none;width:34px;text-align:center}.reco-b{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.reco-b b{font-size:17px}.reco-b span{font-size:15px;color:var(--text-muted);line-height:1.35}' +
    '.reco-ad{flex:none;font-size:12px;font-weight:700;color:var(--text-muted);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:2px 6px}';
  document.head.appendChild(css);

  render();
  if (P() && P().renderAll) { const orig = P().renderAll; P().renderAll = function () { const r = orig.apply(this, arguments); render(); return r; }; }
  window.LZE = { sheet, render, visible, LINKS, recoSuggestion, _state: recoState };
})();
