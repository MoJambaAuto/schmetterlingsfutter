/* Schmetterlingsfutter – Unsere Daten (3.22.0)
   Gemeinsame Daten (Zusammengekommen = Jahrestag, Kennengelernt, Erster Kuss, Hochzeitstag) stimmen bei verbundenen Apps
   automatisch überein. Den eigenen Geburtstag trägt jede/r selbst ein, er landet beim Schatz als „Geburtstag von …“.
   Abgleich über die stille Begrüßung (hello.dates), Ende-zu-Ende verschlüsselt; ältere App-Versionen ignorieren das Feld.
   Regeln: Fehlt mir ein Datum, übernehme ich es. Waren wir uns schon einmal einig, gewinnt die neueste Änderung.
   Stehen zum ersten Mal zwei verschiedene Daten gegenüber, fragt die App neutral, welches stimmt – ohne zu zeigen, wer was
   eingetragen hat (kein Streit-Anlass). */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const S = () => L.S, P = () => window.LZP;
  const $ = (id) => document.getElementById(id), esc = L.esc;
  const SHARED = [
    ['anniversary', '❤️', 'Zusammengekommen (euer Jahrestag)', 'Euer Jahrestag'],
    ['met', '🤝', 'Kennengelernt', 'Euer Kennenlerntag'],
    ['kiss', '💋', 'Erster Kuss', 'Euer erster Kuss'],
    ['wed', '💍', 'Hochzeitstag', 'Euer Hochzeitstag']
  ];
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const valid = (v) => typeof v === 'string' && ISO.test(v) && !isNaN(Date.parse(v + 'T00:00:00')) && v <= L.todayKey();
  const label = (f) => (SHARED.find((x) => x[0] === f) || [f, '', f, f])[3];
  const pn = () => (P() && P().partnerName ? P().partnerName() : S().receiver);
  const on = () => !!(P() && P().paired() && P().joined());

  function store() {
    const s = S(); if (!s.dates) s.dates = {}; if (!s.dateMeta) s.dateMeta = {}; if (!s.dateSnap) s.dateSnap = {}; if (!s.dateConflicts) s.dateConflicts = {}; return s;
  }
  const get = (f) => (f === 'anniversary' ? S().anniversary : f === 'myBirthday' ? S().myBirthday : store().dates[f]) || null;
  function set(f, v) { if (f === 'anniversary') S().anniversary = v; else if (f === 'myBirthday') S().myBirthday = v; else store().dates[f] = v; store().dateSnap[f] = v; }
  const meta = (f) => store().dateMeta[f] || (store().dateMeta[f] = { at: 0, sync: 0, res: 0 });
  const fmt = (v) => L.fmtDate(L.parseISODate(v));

  /* Lokale Änderungen erkennen (auch aus der Einrichtung und älteren Eingabestellen) */
  function check(send) {
    const s = store(); let changed = false;
    SHARED.map((x) => x[0]).concat(['myBirthday']).forEach((f) => {
      const v = get(f); if ((s.dateSnap[f] || null) !== v) { s.dateSnap[f] = v; const m = meta(f); m.at = Date.now(); if (s.dateConflicts[f]) { delete s.dateConflicts[f]; m.res = Date.now(); } changed = true; }
    });
    if (changed) { L.save(); renderCard(); }
    if (changed || send) sendDates(changed);
    return changed;
  }
  function payload() {
    const out = {}; const t = Date.now();
    SHARED.forEach(([f]) => { const v = get(f); if (v) { const m = meta(f); out[f] = [v, m.at || 0, m.res && t - m.res < 7 * 864e5 ? 1 : 0]; } });
    if (S().myBirthday) out.bd = [S().myBirthday, meta('myBirthday').at || 0];
    return out;
  }
  let sendT = null;
  function sendDates(now) {
    if (!on()) return; clearTimeout(sendT);
    sendT = setTimeout(async () => {
      try { await P().send({ t: 'hello', name: S().sender, pron: S().pron || '', dates: payload() }); S().dateSentAt = Date.now(); S().dateSentSig = JSON.stringify(payload()); L.save(); } catch (e) { /* beim nächsten Öffnen */ }
    }, now ? 300 : 2000);
  }

  /* Ankommende Daten vom Schatz */
  function got(d) {
    if (!d || typeof d !== 'object') return; const s = store(), t = Date.now(); const news = []; let replyNeeded = false;
    SHARED.forEach(([f]) => {
      const x = d[f]; if (!Array.isArray(x) || !valid(x[0])) return;
      const tv = x[0], tat = Number(x[1]) || 0, tres = !!x[2], mine = get(f), m = meta(f);
      if (!mine) { set(f, tv); m.at = tat; m.sync = t; news.push(label(f) + ': ' + fmt(tv)); return; }
      if (mine === tv) { m.sync = t; if (tat > m.at) m.at = tat; delete s.dateConflicts[f]; return; }
      if (m.sync || tres) {
        if (tat > m.at) { set(f, tv); m.at = tat; m.sync = t; delete s.dateConflicts[f]; news.push(label(f) + ': ' + fmt(tv)); }
        else replyNeeded = true; // meins ist neuer: der Schatz übernimmt es, sobald meine Begrüßung ankommt
        return;
      }
      s.dateConflicts[f] = [mine, tv].sort();
    });
    /* Geburtstag: was der Schatz selbst einträgt, stimmt immer */
    if (Array.isArray(d.bd) && valid(d.bd[0]) && S().partnerBirthday !== d.bd[0]) { S().partnerBirthday = d.bd[0]; news.push('Geburtstag von ' + pn() + ': ' + fmt(d.bd[0])); }
    L.save();
    if (news.length) L.toast('📅 Mit ' + pn() + ' abgeglichen – ' + news[0] + (news.length > 1 ? ' (+' + (news.length - 1) + ')' : ''));
    /* Übernommenes bestätigen: so weiß die andere App, dass wir uns einig sind, und spätere Änderungen gehen ohne Rückfrage durch */
    if (replyNeeded || news.length) sendDates(true);
    rerender();
  }
  function rerender() {
    renderCard();
    if (L.renderTime) try { L.renderTime(); } catch (e) {}
    if (window.LZF && window.LZF.renderOccasions) try { window.LZF.renderOccasions(); window.LZF.renderOccasionChip && window.LZF.renderOccasionChip(); } catch (e) {}
  }

  /* Startseite: neutrale Frage, wenn zwei verschiedene Daten vorliegen; sanfter Hinweis zum eigenen Geburtstag */
  function renderCard() {
    let el = $('datePromo'); const s = store(); const f = Object.keys(s.dateConflicts)[0];
    const askBd = on() && !S().myBirthday && !(S().bdSnooze > Date.now());
    if (!f && !askBd) { if (el) el.remove(); return; }
    if (!el) { const anchor = $('partnerCard'); if (!anchor) return; el = document.createElement('div'); el.id = 'datePromo'; el.className = 'card promo'; anchor.parentNode.insertBefore(el, anchor.nextSibling); }
    if (f) {
      const [a, b] = s.dateConflicts[f];
      el.innerHTML = '<div class="promo-title">📅 ' + esc(label(f)) + ': welches Datum stimmt?</div><p class="about" style="font-size:17px;margin:6px 0 0">In euren beiden Apps stehen zwei verschiedene Daten. Tippt das richtige an, dann gilt es bei euch beiden.</p>' +
        '<div class="row wrap" style="margin-top:12px;justify-content:flex-start"><button class="pill-btn" data-pick="' + a + '">' + esc(fmt(a)) + '</button><button class="pill-btn" data-pick="' + b + '">' + esc(fmt(b)) + '</button><button class="pill-btn ghost" data-own>Anderes Datum</button></div>';
      el.querySelectorAll('[data-pick]').forEach((btn) => { btn.onclick = () => resolve(f, btn.dataset.pick); });
      el.querySelector('[data-own]').onclick = () => sheet(f);
    } else {
      el.innerHTML = '<div class="promo-title">🎂 Wann hast du Geburtstag?</div><p class="about" style="font-size:17px;margin:6px 0 0">Trag ihn einmal ein – dann hat ' + esc(pn()) + ' ihn in der App immer richtig.</p>' +
        '<div class="row wrap" style="margin-top:12px;justify-content:flex-start"><button class="pill-btn primary" data-bd>Eintragen</button><button class="pill-btn ghost" data-later>Später</button></div>';
      el.querySelector('[data-bd]').onclick = () => sheet('myBirthday');
      el.querySelector('[data-later]').onclick = () => { S().bdSnooze = Date.now() + 14 * 864e5; L.save(); renderCard(); };
    }
  }
  function resolve(f, v) {
    set(f, v); const m = meta(f); m.at = Date.now(); m.sync = Date.now(); m.res = Date.now(); delete store().dateConflicts[f];
    L.save(); sendDates(true); rerender(); L.toast('✓ ' + label(f) + ': ' + fmt(v) + ' gilt jetzt bei euch beiden'); window.LZS && window.LZS.count('date_resolved:' + f);
  }

  /* Eingabe aller Daten an einer Stelle */
  function sheet(focus) {
    const rows = SHARED.map(([f, ic, lab]) => '<div class="field"><label for="dt-' + f + '">' + ic + ' ' + esc(lab) + '</label><input type="date" id="dt-' + f + '" max="' + L.todayKey() + '" value="' + (get(f) || '') + '"></div>').join('') +
      '<div class="field"><label for="dt-myBirthday">🎂 Mein Geburtstag</label><input type="date" id="dt-myBirthday" max="' + L.todayKey() + '" value="' + (S().myBirthday || '') + '"></div>' +
      '<div class="field"><label for="dt-pbd">🎂 Geburtstag von ' + esc(pn()) + '</label><input type="date" id="dt-pbd" max="' + L.todayKey() + '" value="' + (S().partnerBirthday || '') + '"></div>';
    L.openSheet('<h3>📅 Unsere Daten</h3>' + rows +
      '<p class="about" style="font-size:16px;margin:4px 0 14px;color:var(--text-soft)">' + (on() ? '🔄 Gemeinsame Daten und dein Geburtstag werden automatisch mit ' + esc(pn()) + ' abgeglichen.' : 'Verbindet eure Apps, dann stehen diese Daten bei euch beiden automatisch gleich drin.') + '</p>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Speichern</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const fe = focus === 'pbd' ? sh.querySelector('#dt-pbd') : sh.querySelector('#dt-' + focus); if (fe) setTimeout(() => fe.focus(), 120);
      sh.querySelector('[data-ok]').onclick = () => {
        const vals = {}; let bad = false;
        SHARED.map((x) => x[0]).concat(['myBirthday']).forEach((f) => { const v = sh.querySelector('#dt-' + f).value || null; if (v && !valid(v)) bad = true; vals[f] = v; });
        const pbd = sh.querySelector('#dt-pbd').value || null; if (pbd && !valid(pbd)) bad = true;
        if (bad) { L.toast('Ein Datum liegt in der Zukunft'); return; }
        /* Ein bekanntes Datum nicht versehentlich leeren, solange die Apps verbunden sind */
        SHARED.forEach(([f]) => { if (vals[f]) { if (f === 'anniversary') S().anniversary = vals[f]; else store().dates[f] = vals[f]; } else if (!on()) { if (f === 'anniversary') S().anniversary = null; else delete store().dates[f]; } });
        S().myBirthday = vals.myBirthday || null; if (pbd) S().partnerBirthday = pbd;
        L.save(); L.closeSheet(); check(); rerender(); L.toast('Gespeichert ❤');
      };
    });
  }

  /* Eingabestellen übernehmen */
  ['btnSetDate', 'btnChangeDate'].forEach((id) => { const b = $(id); if (b) b.onclick = () => sheet('anniversary'); });
  const cd = $('btnChangeDate'); if (cd) cd.textContent = '📅 Unsere Daten';
  const bb = $('btnBirthday'); if (bb) { bb.onclick = () => sheet('pbd'); bb.textContent = '📅 Unsere Daten & Geburtstage'; }

  /* Start: Änderungen erkennen; einmal am Tag (oder nach Änderung) den Stand an den Schatz schicken */
  setTimeout(() => {
    const changed = check(false);
    const stale = Date.now() - (S().dateSentAt || 0) > 20 * 3600e3 || S().dateSentSig !== JSON.stringify(payload());
    if (!changed && stale && Object.keys(payload()).length) sendDates(false);
    renderCard();
  }, 2500);
  window.LZD = { payload, got, check, sheet, resolve, renderCard, SHARED };
})();
