/* Schmetterlingsfutter – Tagesfutter (3.53.0)
   Jeden Tag frische Inhalte aus der Futter-Engine (Repo amazon-engine, werkzeug/inhalte.mjs):
   Gesprächsfrage, Flügelschlag, Falter-Wissen, Quiz „Wahr oder Falter?“ – passend zu Anlässen (Advent, Valentinstag …).
   - Lädt höchstens einmal am Tag die nächsten 14 Tage und merkt sie sich auf dem Gerät → läuft auch offline weiter.
   - Fehlt etwas (kein Netz, Dienst weg), zeigt die App wie bisher ihre eingebauten Inhalte. Nichts bricht.
   - Beide Handys eines Paares sehen am selben Tag dieselben Inhalte (die Engine plant jeden Tag fest).
   - Es wird nichts gesendet außer dem üblichen Abruf einer Datei (keine Kennung, keine Einträge).
   Schnittstelle: window.LZT.heute('frage'|'piek'|'wissen'|'quiz') → Eintrag oder null; Ereignis 'lzt-neu' nach dem Laden. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const $ = (id) => document.getElementById(id), esc = L.esc, S = () => L.S;
  const C = (k) => window.LZS && window.LZS.count(k);
  const URL_FEED = 'https://mojambaauto.github.io/amazon-engine/feed/inhalte/naechste-tage.json';
  const KEY = 'sf_tagesfutter', KEY_QUIZ = 'sf_tagesfutter_quiz';
  const ARTEN = ['frage', 'piek', 'wissen', 'quiz'];

  const lies = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* Speicher voll: dann eben ohne */ } };

  /* nur saubere Einträge übernehmen – falsche Daten dürfen die App nicht stören */
  function gueltig(art, e) {
    if (!e || typeof e !== 'object' || typeof e.id !== 'string') return false;
    if (art === 'quiz') return typeof e.s === 'string' && typeof e.x === 'string' && (e.w === 0 || e.w === 1);
    if (art === 'piek') return typeof e.t === 'string' && !!D.piekCats && Object.prototype.hasOwnProperty.call(D.piekCats, e.c);
    return typeof e.t === 'string' && e.t.length > 0 && e.t.length < 400;
  }
  function tag(d) {
    const c = lies(KEY); if (!c || !Array.isArray(c.tage)) return null;
    return c.tage.find((t) => t && t.datum === d) || null;
  }
  function heute(art) {
    const t = tag(L.todayKey()); if (!t) return null;
    return gueltig(art, t[art]) ? t[art] : null;
  }

  let laeuft = false;
  function laden(erzwingen) {
    if (laeuft || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    const c = lies(KEY), d = L.todayKey();
    if (!erzwingen && c && c.geholt === d) return; // heute schon geholt
    laeuft = true;
    fetch(URL_FEED, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then((j) => {
      if (!j || !Array.isArray(j.tage) || !j.tage.length) throw new Error('leer');
      const tage = j.tage.filter((t) => t && /^\d{4}-\d{2}-\d{2}$/.test(t.datum)).slice(0, 21).map((t) => {
        const o = { datum: t.datum };
        ARTEN.forEach((a) => { if (gueltig(a, t[a])) o[a] = t[a]; });
        return o;
      });
      /* Tage, die schon auf dem Gerät liegen und heute oder später sind, bleiben unverändert (Erledigt-Haken passen weiter) */
      const alt = (c && Array.isArray(c.tage) ? c.tage : []).filter((t) => t && t.datum >= d);
      const nachDatum = {}; tage.forEach((t) => { nachDatum[t.datum] = t; }); alt.forEach((t) => { nachDatum[t.datum] = t; });
      schreib(KEY, { geholt: d, tage: Object.keys(nachDatum).sort().filter((x) => x >= d).map((x) => nachDatum[x]) });
      document.dispatchEvent(new Event('lzt-neu'));
    }).catch(() => { /* still: eingebaute Inhalte bleiben */ }).then(() => { laeuft = false; });
  }

  /* ---------- Karte „Frage des Tages“ (mit Quiz im Fenster) ---------- */
  function quizStand() { const q = lies(KEY_QUIZ); return q && q.datum === L.todayKey() ? q : null; }
  function renderCard() {
    const f = heute('frage'), c0 = $('tfCard');
    if (!f) { if (c0) c0.remove(); return; }
    const at = $('wiCard') || $('bflyCard') || $('piekCard'); if (!at) return;
    let c = c0;
    if (!c) { c = document.createElement('button'); c.type = 'button'; c.id = 'tfCard'; c.className = 'card soft wi-card'; c.setAttribute('aria-label', 'Frage des Tages öffnen'); c.onclick = () => { C('tf_card'); sheet(); }; }
    if (at.nextElementSibling !== c) at.after(c);
    const sig = L.todayKey() + '|' + f.id; if (c.dataset.sig === sig) return; c.dataset.sig = sig;
    c.innerHTML = '<span class="eyebrow wi-eb">💬 Frage des Tages</span><span class="wi-t">' + esc(L.fmt(f.t)) + '</span>';
  }
  function sheet() {
    const f = heute('frage'), q = heute('quiz'); if (!f) return;
    const r = (S() && S().receiver) || 'deinem Schatz';
    L.openSheet('<h3>💬 Frage des Tages</h3><p class="wi-big">' + esc(L.fmt(f.t)) + '</p>' +
      '<div class="row wrap" style="justify-content:center;margin-bottom:18px"><button class="pill-btn primary" data-send>An ' + esc(r) + ' schicken</button></div>' +
      (q ? '<h3 style="margin-top:6px">🦋 Wahr oder Falter?</h3><p class="wi-big" style="font-size:19px">' + esc(q.s) + '</p><div id="tfQ"></div>' : '') +
      '<div class="row wrap" style="justify-content:center;margin-top:10px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-send]').onclick = () => {
        C('tf_send'); const t = L.fmt(f.t);
        if (window.LZP) window.LZP.sendOrShare(t, 'Frage des Tages'); else L.shareText('💬 ' + t + '\n— ' + ((S() && S().sender) || ''));
      };
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      if (!q) return;
      const box = sh.querySelector('#tfQ');
      const zeigen = (wahl) => {
        const richtig = wahl === q.w;
        box.innerHTML = '<p style="text-align:center;font-size:19px;font-weight:700;color:var(--text);margin:0 0 6px">' + (richtig ? '✓ Richtig!' : '✗ Leider nicht.') + ' Es ist ' + (q.w ? 'wahr' : 'ein Falter – also falsch') + '.</p><p style="text-align:center;font-size:18px;line-height:1.45;color:var(--text);margin:0 0 6px">' + esc(q.x) + '</p>';
      };
      const st = quizStand();
      if (st && st.id === q.id) { zeigen(st.wahl); return; }
      box.innerHTML = '<div class="row wrap" style="justify-content:center"><button class="pill-btn primary" data-w="1">Wahr</button><button class="pill-btn primary" data-w="0">Falter</button></div>';
      box.querySelectorAll('[data-w]').forEach((b) => { b.onclick = () => { const wahl = +b.dataset.w; schreib(KEY_QUIZ, { datum: L.todayKey(), id: q.id, wahl }); C('tf_quiz'); L.haptic(8); zeigen(wahl); }; });
    });
  }

  window.LZT = { heute, laden, renderCard, sheet, _feed: URL_FEED };
  document.addEventListener('lzt-neu', renderCard);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { laden(); renderCard(); } });
  window.addEventListener('online', () => laden());
  /* nach dem Aufbau der Startseite (wissen.js legt die Wissenskarte an) */
  setTimeout(() => { renderCard(); laden(); }, 0);
})();
