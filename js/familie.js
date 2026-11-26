/* Schmetterlingsfutter – Raupenzeit (LZFA, 3.54.0), Paket 1: die Frage und erste Inhalte
   Eine einzige freiwillige Frage klärt, ob Kinder bei einem Paar ein Thema sind. Daraus ergibt sich eine von sieben
   Phasen, und vorhandene Funktionen stellen sich darauf ein: Flügelschlag (jeden zweiten Tag eine Aufgabe für
   Eltern-Paare), ein Gleichklang-Deck je Phase und Eltern-Gutscheine. Leitsatz: Es geht um euch zwei, nie um Erziehung.

   Was gespeichert wird (S.family): die Antwort und bei Kindern nur die Geburtsjahre. Keine Namen, keine Fotos,
   kein Geburtsdatum, kein Entbindungstermin. Nichts davon verlässt in dieser Fassung das Gerät:
   - Die Phasen-Decks laufen nur an einem Handy (deck.local), weil ein Spiel über zwei Handys dem Vermittlungsdienst
     den Namen des Decks nennt – und der verriete die Phase.
   - „Anonym mithelfen“ zählt nichts, woraus die Phase hervorginge (silent(), gefragt von stats.js).
   Der Abgleich mit dem Schatz (hello.fam) kommt erst mit Paket 2; das Feld family.partner ist dafür schon da.

   Regeln der Frage: einmal, frühestens am dritten Nutzungstag, nie in der Einrichtung, nie über offenen Fenstern,
   nicht in dem Besuch, in dem „Anonym mithelfen“ fragt. „Thema ausblenden“ ist ein Tipp ohne Rückfrage: Die Angabe
   wird gelöscht, alles zum Thema verschwindet, die App fragt nicht wieder. Kein automatischer Wechsel von
   „Baby unterwegs“ zu „Baby“ und keine automatischen Glückwünsche – eine Schwangerschaft kann anders enden. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L || !D.fam) return;
  const S = () => L.S, $ = (id) => document.getElementById(id), esc = L.esc;
  const TOPICS = ['none', 'wish', 'expect', 'kids', 'skip'];
  const PARENT = ['baby', 'klein', 'schule', 'teen']; /* Phasen mit Kind im Haus: nur hier gibt es Eltern-Gutscheine */
  const MAX_KIDS = 12, OLDER = 0; /* OLDER steht für „älter“: vor mehr als 25 Jahren geboren, ohne genaues Jahr */
  const year = () => new Date().getFullYear();
  const fresh = () => ({ v: 1, topic: null, kids: [], share: false, hidden: false, askedAt: null, updatedAt: null, partner: null });

  /* ---------- Zustand ---------- */
  const okYear = (y) => y === OLDER || (Number.isInteger(y) && y >= 1900 && y <= year());
  /* nur echte Zahlen oder Ziffernfolgen: Number(null), Number('') und Number(false) wären 0 und damit „älter“ */
  const isYearish = (v) => typeof v === 'number' || (typeof v === 'string' && /^\d{1,4}$/.test(v));
  const cleanKids = (k) => (Array.isArray(k) ? k : []).filter(isYearish).map(Number).filter(okYear).slice(0, MAX_KIDS).sort((a, b) => a - b);
  /* Liest S.family und bringt es in Form – auch nach dem Einspielen einer Sicherung oder mit Daten einer älteren Fassung */
  function fam() {
    const s = S(); let f = s.family;
    if (!f || typeof f !== 'object' || Array.isArray(f)) f = s.family = fresh();
    if (TOPICS.indexOf(f.topic) < 0) f.topic = null;
    f.kids = f.topic === 'kids' ? cleanKids(f.kids) : [];
    if (f.topic === 'kids' && !f.kids.length) f.topic = null; /* „Kinder“ ohne Geburtsjahr gibt es nicht */
    f.share = f.share === true; f.hidden = f.hidden === true;
    if (f.partner !== null && (typeof f.partner !== 'object' || Array.isArray(f.partner))) f.partner = null;
    if (!Array.isArray(f.cp)) f.cp = []; /* Eltern-Gutscheine, die schon ins Gutscheinbuch gelegt wurden */
    return f;
  }
  function phaseOf(topic, kids) {
    if (topic === 'wish') return 'wunsch';
    if (topic === 'expect') return 'unterwegs';
    if (topic !== 'kids') return '';
    const k = cleanKids(kids); if (!k.length) return '';
    const youngest = Math.max.apply(null, k); if (youngest === OLDER) return 'fluegge';
    const age = year() - youngest;
    return age <= 1 ? 'baby' : age <= 5 ? 'klein' : age <= 12 ? 'schule' : age <= 17 ? 'teen' : 'fluegge';
  }
  /* '' = keine Phase, die App verhält sich wie ohne Raupenzeit. Ohne eigene Angabe zählt, was der Schatz geteilt hat (Paket 2). */
  function phase() {
    const f = fam(); if (f.hidden) return '';
    if (f.topic === null) return f.partner ? phaseOf(f.partner.topic, f.partner.kids) : '';
    return phaseOf(f.topic, f.kids);
  }
  const yearLabel = (y) => (y === OLDER ? 'älter' : String(y));
  function status() {
    const f = fam();
    if (f.hidden) return 'Ausgeblendet';
    if (f.topic === 'wish') return 'Kinderwunsch';
    if (f.topic === 'expect') return 'Baby unterwegs';
    if (f.topic === 'kids') return (f.kids.length === 1 ? '1 Kind' : f.kids.length + ' Kinder') + ' · ' + f.kids.map(yearLabel).join(', ');
    if (f.topic === 'none') return 'Gerade kein Thema';
    if (f.topic === 'skip') return 'Keine Angabe';
    return 'Noch nicht beantwortet';
  }

  /* ---------- Flügelschlag: jeden zweiten Tag eine Familien-Aufgabe, fest nach Datum (beide Handys sehen dieselbe) ---------- */
  const dayNo = (key) => { const p = String(key).split('-').map(Number); return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5); };
  function piek(key) {
    const ph = phase(); const list = ph && D.fam.pieks[ph]; if (!list || !list.length) return null;
    const n = dayNo(key || L.todayKey()); if (!isFinite(n) || n % 2) return null;
    const i = (n / 2) % list.length;
    return { id: 'fam:' + ph + ':' + i, c: list[i].c, t: list[i].t, fam: true };
  }

  /* ---------- Decks: das Deck der Phase und „Kinder: ja, nein, wann?“ stehen nur in der Liste, wenn sie passen ---------- */
  const PHASE_DECKS = Object.keys(D.fam.decks).map((k) => D.fam.decks[k].id);
  const ALL_DECKS = PHASE_DECKS.concat([D.fam.deckAll.id]);
  function syncDecks() {
    const f = fam(), ph = phase(), want = [];
    if (ph && D.fam.decks[ph]) want.push(D.fam.decks[ph]);
    if (!f.hidden) want.push(D.fam.deckAll);
    const have = D.decks.filter((d) => d.fam);
    if (have.length === want.length && have.every((d, i) => d === want[i])) return false;
    for (let i = D.decks.length - 1; i >= 0; i--) if (D.decks[i].fam) D.decks.splice(i, 1);
    let at = D.decks.findIndex((d) => d.id === 'dates'); at = at < 0 ? D.decks.length : at + 1;
    D.decks.splice.apply(D.decks, [at, 0].concat(want));
    return true;
  }
  /* Spielstände und Post-Einträge von Decks entfernen, die nicht mehr gelten – sonst verriete eine Sicherung die frühere Angabe */
  function purge(ids) {
    const s = S(); let hit = false;
    ['matches', 'invites', 'explored', 'roundShift'].forEach((k) => { if (s[k] && typeof s[k] === 'object') ids.forEach((id) => { if (id in s[k]) { delete s[k][id]; hit = true; } }); });
    ['inbox', 'outbox'].forEach((k) => { if (!Array.isArray(s[k])) return; const n = s[k].length; s[k] = s[k].filter((m) => !(m && m.t === 'match' && ids.indexOf(m.deck) >= 0)); if (s[k].length !== n) hit = true; });
    return hit;
  }

  /* ---------- Eltern-Gutscheine: liegen oben im Gutscheinbuch, solange die Phase passt ---------- */
  const isFamCoupon = (c) => c && typeof c.id === 'string' && c.id.indexOf('fam_') === 0;
  function syncCoupons() {
    const s = S(), f = fam(); if (!Array.isArray(s.coupons)) return false;
    const ph = phase();
    const want = PARENT.indexOf(ph) >= 0 ? D.fam.coupons.filter((c) => c.ph.indexOf(ph) >= 0) : [];
    const ids = want.map((c) => 'fam_' + c.id);
    let changed = false;
    const rest = s.coupons.filter((c) => !isFamCoupon(c) || ids.indexOf(c.id) >= 0);
    if (rest.length !== s.coupons.length) { s.coupons = rest; changed = true; }
    const cp = f.cp.filter((id) => ids.indexOf(id) >= 0); if (cp.length !== f.cp.length) { f.cp = cp; changed = true; }
    /* nur neu dazulegen, was noch nie im Buch lag: ein selbst gelöschter Gutschein kommt nicht von allein zurück */
    const add = want.filter((c) => f.cp.indexOf('fam_' + c.id) < 0);
    if (add.length) {
      s.coupons = add.map((c) => ({ id: 'fam_' + c.id, icon: c.icon, title: c.title, desc: c.desc, used: null })).concat(s.coupons);
      add.forEach((c) => f.cp.push('fam_' + c.id)); changed = true;
    }
    return changed;
  }

  /* ---------- Alles auf den Stand der Angabe bringen ---------- */
  function apply() {
    const f = fam(), ph = phase();
    const keep = []; if (ph && D.fam.decks[ph]) keep.push(D.fam.decks[ph].id); if (!f.hidden) keep.push(D.fam.deckAll.id);
    purge(ALL_DECKS.filter((id) => keep.indexOf(id) < 0));
    const d = syncDecks(); syncCoupons(); L.save(); render();
    if (window.LZF && window.LZF.renderPiek) window.LZF.renderPiek();
    if (window.LZP) { if (d && window.LZP.renderDecks) window.LZP.renderDecks(); if (window.LZP.renderPost && document.documentElement.getAttribute('data-view') === 'post') window.LZP.renderPost(); }
  }
  function setTopic(topic, kids) {
    const f = fam(); f.topic = topic; f.kids = topic === 'kids' ? cleanKids(kids) : [];
    if (topic !== 'wish' && topic !== 'expect') f.share = false;
    f.hidden = false; f.updatedAt = Date.now(); if (!f.askedAt) f.askedAt = f.updatedAt;
    apply();
  }
  /* „Thema ausblenden“: ein Tipp, keine Rückfrage. Die Angabe wird gelöscht, nichts zum Thema bleibt sichtbar. */
  function hide() {
    const f = fam(); f.topic = null; f.kids = []; f.share = false; f.hidden = true;
    f.updatedAt = Date.now(); if (!f.askedAt) f.askedAt = f.updatedAt;
    apply(); L.closeSheet(); L.toast('Ausgeblendet. Die App zeigt nichts mehr zum Thema.');
  }
  function unhide() { const f = fam(); f.hidden = false; f.updatedAt = Date.now(); apply(); }

  /* ---------- Fenster: die Frage ---------- */
  const OPTS = [['none', 'Gerade nicht'], ['wish', 'Wir wünschen uns eins'], ['expect', 'Baby unterwegs'], ['kids', 'Ja, wir haben Kinder'], ['skip', 'Lieber nicht sagen']];
  /* auto = Papillon fragt von selbst: nur die fünf Tasten. Sonst (Einstellungen, „Unsere Daten“) auch „Thema ausblenden“. */
  function sheet(auto) {
    const f = fam();
    if (f.hidden && !auto) {
      L.openSheet('<h3>🐛 Kinder</h3><p class="fa-note">Das Thema ist ausgeblendet. Die App zeigt nichts dazu und fragt nicht.</p>' +
        '<div class="row wrap fa-foot"><button type="button" class="pill-btn" data-show>Wieder einblenden</button><button type="button" class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
        sh.querySelector('[data-cancel]').onclick = L.closeSheet;
        sh.querySelector('[data-show]').onclick = () => { unhide(); sheet(); };
      });
      return;
    }
    L.openSheet('<h3>🐛 Sind Kinder bei euch ein Thema?</h3><div class="fa-opts">' +
      OPTS.map((o) => '<button type="button" class="fa-opt' + (f.topic === o[0] ? ' on' : '') + '" data-t="' + o[0] + '"' + (f.topic === o[0] ? ' aria-pressed="true"' : '') + '><span>' + esc(o[1]) + '</span>' + (f.topic === o[0] ? '<i aria-hidden="true">✓</i>' : '') + '</button>').join('') +
      '</div><p class="fa-note">🔒 Bleibt auf deinem Handy.</p>' +
      (auto ? '' : '<div class="row wrap fa-foot"><button type="button" class="pill-btn small ghost" data-hide>Thema ausblenden</button><button type="button" class="pill-btn small ghost" data-cancel>Schließen</button></div>'), (sh) => {
      const c = sh.querySelector('[data-cancel]'); if (c) c.onclick = L.closeSheet;
      const h = sh.querySelector('[data-hide]'); if (h) h.onclick = hide;
      sh.querySelectorAll('[data-t]').forEach((b) => {
        b.onclick = () => {
          const t = b.dataset.t; L.haptic(8);
          if (t === 'kids') { kidsSheet(f.topic === 'kids' ? f.kids : [], auto); return; }
          setTopic(t); L.closeSheet();
          L.toast(t === 'none' ? 'Alles klar. Ändern kannst du das unter ⚙️ → Kinder.' : t === 'skip' ? 'Alles klar. Papillon fragt nicht noch einmal.' : '🐛 Raupenzeit ist an. Flügelschläge passen jetzt zu euch.');
        };
      });
    });
  }
  /* Geburtsjahre antippen: je Kind ein Tipp (Zwillinge = zweimal dasselbe Jahr), das Schildchen oben entfernt wieder */
  function kidsSheet(start, auto) {
    let kids = cleanKids(start);
    const y0 = year(); let grid = '';
    for (let y = y0; y >= y0 - 25; y--) grid += '<button type="button" class="fa-year" data-y="' + y + '">' + y + '</button>';
    grid += '<button type="button" class="fa-year" data-y="' + OLDER + '">älter</button>';
    L.openSheet('<h3>🐛 Wann sind eure Kinder geboren?</h3><p class="fa-note">Für jedes Kind einmal das Jahr antippen.</p>' +
      '<div class="fa-kids" id="faKids" aria-live="polite"></div><div class="fa-years">' + grid + '</div>' +
      '<div class="row"><button type="button" class="pill-btn ghost" data-back>Zurück</button><button type="button" class="pill-btn primary" data-ok>Fertig</button></div>', (sh) => {
      const box = sh.querySelector('#faKids'), ok = sh.querySelector('[data-ok]');
      const draw = () => {
        box.innerHTML = kids.length ? kids.map((y, i) => '<button type="button" class="fa-kid" data-i="' + i + '" aria-label="Kind, geboren ' + yearLabel(y) + ' – entfernen">🐛 ' + yearLabel(y) + ' <span aria-hidden="true">✕</span></button>').join('') : '<span class="fa-none">Noch kein Jahr angetippt</span>';
        ok.disabled = !kids.length;
        box.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { kids.splice(+b.dataset.i, 1); draw(); }; });
      };
      sh.querySelectorAll('[data-y]').forEach((b) => {
        b.onclick = () => {
          if (kids.length >= MAX_KIDS) { L.toast('Mehr als ' + MAX_KIDS + ' Kinder passen hier nicht hinein'); return; }
          kids = cleanKids(kids.concat([+b.dataset.y])); L.haptic(8); draw();
        };
      });
      sh.querySelector('[data-back]').onclick = () => sheet(auto);
      ok.onclick = () => { if (!kids.length) return; setTopic('kids', kids); L.closeSheet(); L.toast('🐛 Raupenzeit ist an. Flügelschläge passen jetzt zu euch.'); };
      draw();
    });
  }

  /* ---------- Papillon fragt einmal von selbst ---------- */
  /* Nutzungstage zählen (erst nach der Einrichtung). Wer die App schon länger hat, startet mit dem Update bei Tag 1. */
  function useDay() {
    const s = S(); if (!s.onboarded) return 0; const k = L.todayKey(); let u = s.useDays;
    if (!u || typeof u !== 'object' || typeof u.n !== 'number') u = s.useDays = { d: '', n: 0 };
    if (u.d !== k) { u.d = k; u.n++; L.save(); }
    return u.n;
  }
  const due = () => { const f = fam(); return !!S().onboarded && !f.hidden && f.topic === null && !f.askedAt && !f.partner && useDay() >= 3; };
  const busy = () => document.hidden || document.documentElement.getAttribute('data-view') !== 'home' ||
    !!document.querySelector('#modal.open, .overlay:not(.hidden), .fly, #nwBar') || !!(window.LZU && window.LZU.busy && window.LZU.busy());
  let askedNow = false, tries = 0, timer = null, statsVisit = null;
  const statsOpenAtLoad = S().statsOk === undefined; /* beim Laden gemerkt: wer die Mithelfen-Karte sofort beantwortet, bekommt die Kinder-Frage trotzdem nicht im selben Besuch */
  function tryAsk() {
    clearTimeout(timer); if (askedNow || !due()) return;
    /* „Anonym mithelfen“ fragt ab dem dritten Öffnen mit einer Karte auf „Heute“. In den ersten beiden Besuchen mit dieser Karte (drittes und viertes Öffnen) wartet die Kinder-Frage. */
    if (statsVisit === null) { const la = S().launches || 0; statsVisit = statsOpenAtLoad && la >= 3 && la < 5; }
    if (statsVisit) return;
    if (busy()) { if (++tries < 30) timer = setTimeout(tryAsk, 6000); return; }
    askedNow = true; fam().askedAt = Date.now(); L.save(); sheet(true);
  }

  /* ---------- Einstellungen und „Unsere Daten“ ---------- */
  function mount() {
    const tog = $('togIntim'); if (!tog || $('famRow')) return;
    const row = document.createElement('div'); row.className = 'switch'; row.id = 'famRow';
    row.innerHTML = '<div>Kinder<small id="famState"></small></div><button type="button" class="pill-btn small" id="btnFamily">Ändern</button>';
    tog.closest('.switch').after(row);
    $('btnFamily').onclick = () => sheet();
  }
  function render() { const st = $('famState'); if (st) st.textContent = (phase() ? '🐛 Raupenzeit: ' : '') + status(); }
  /* Zeile für das Fenster „Unsere Daten“ (daten.js). Ist das Thema ausgeblendet, steht dort nichts. */
  const dataRow = () => (fam().hidden ? '' : '<div class="field"><label>🐛 Kinder</label><button type="button" class="pill-btn small fa-data" data-fam>' + esc(status()) + ' ›</button></div>');

  /* „Anonym mithelfen“: Zähler, aus denen die Phase hervorginge, bleiben aus (stats.js fragt hier nach) */
  const silent = (k) => { const x = String(k); return PHASE_DECKS.some((id) => x.indexOf(id) >= 0); };

  const css = document.createElement('style');
  css.textContent = '.fa-opts{display:flex;flex-direction:column;gap:10px;margin:2px 0 12px}' +
    '.fa-opt{width:100%;min-height:56px;display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left;border:1.5px solid var(--line);background:var(--glass);color:var(--text);border-radius:16px;padding:12px 16px;font:inherit;font-size:19px;font-weight:600;line-height:1.3}' +
    '.fa-opt.on{background:var(--accent-dark);border-color:var(--accent-dark);color:#fff}.fa-opt i{font-style:normal;font-weight:700}' +
    '.fa-note{font-size:17px;line-height:1.4;color:var(--text-soft);margin:0 0 12px;text-align:center}.fa-foot{justify-content:center}' +
    '.fa-kids{display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:46px;margin:0 0 12px}.fa-none{font-size:17px;color:var(--text-soft)}' +
    '.fa-kid{border:0;border-radius:16px;min-height:46px;padding:8px 14px;font:inherit;font-size:18px;font-weight:700;background:var(--accent-dark);color:#fff}.fa-kid span{margin-left:6px;opacity:.85}' +
    '.fa-years{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 14px}' +
    '.fa-year{min-height:48px;border:1.5px solid var(--line);background:transparent;color:var(--text);border-radius:14px;font:inherit;font-size:18px;font-weight:600;padding:0}.fa-year:active{background:var(--glass)}' +
    '.fa-data{max-width:100%;text-align:left;white-space:normal}';
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  window.LZFA = { phase, phaseOf, piek, sheet, ask: () => sheet(true), hide, status, dataRow, render, silent, coupons: syncCoupons, decks: syncDecks, days: useDay };
  mount(); fam(); useDay();
  function refresh() {
    const d = syncDecks(), c = syncCoupons(); if (c) L.save(); render();
    if (window.LZF && window.LZF.renderPiek) window.LZF.renderPiek();
    if (d && window.LZP && window.LZP.renderDecks) window.LZP.renderDecks();
  }
  refresh();
  /* Jahreswechsel und Tageswechsel: Phase, Decks und Gutscheine nachziehen – beim Zurückkehren und, bleibt die App offen, einmal je Minute geprüft */
  let dayKey = L.todayKey();
  setInterval(() => { if (L.todayKey() === dayKey) return; dayKey = L.todayKey(); refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    dayKey = L.todayKey(); refresh();
    tries = 0; clearTimeout(timer); timer = setTimeout(tryAsk, 5000);
  });
  timer = setTimeout(tryAsk, 9000);
})();
