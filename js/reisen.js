/* Schmetterlingsfutter – Gemeinsam erleben (LZRE, 3.55.0; Stufe 2 seit 3.58.0)
   Mo 26.11.2026: „Schmetterlingsfutter ist Reisen, Reisen ist Schmetterlingsfutter“ – Reisen soll kein Sonderbereich
   neben der App sein, sondern die dritte Sorte Futter neben den kleinen Gesten und dem gemeinsamen Spielen.
   Stufe 1 (der rote Faden):
   - Auf „Heute“ stehen die drei Sorten Futter gleichrangig: Gesten · Spielen · Erleben (index.html, #futterDrei).
   - „Traumziele“ ist ein Spiel in „Gemeinsam“ (js/data2.js, Deck traumziele). Jede Karte hat eine Flugweite (fw):
     1 vor der Haustür, 2 übers Wochenende, 3 großer Flug. Treffer landen wie bei allen Gemeinsam-Spielen in S.common.
   - Spieleinsatz (js/spiele2.js): „Wer gewinnt, bestimmt unseren nächsten Ausflug“ – bis zu drei Vorschläge aus den
     gemeinsamen Traumzielen (einer je Flugweite), die Wahl wird als Gutschein festgehalten.
   - Papillon ist ein Wanderfalter: die kurze Geschichte am Eingang der Liebespfade (js/pfade.js nutzt STORY).
   Stufe 2 (die Momente), Mo 27.11.2026 „Ja, Stufe 2 bauen“:
   - Das Fenster „Gemeinsam erleben“ ist nach den drei Flugweiten geordnet.
   - Reiselos: seltene Glücksmomente (Schwarm in der Würfelwiese, hoher Sieg im Wanderzug, seltener Falter beim
     Spaziergang) bringen ein Reiselos – wer es hat, bestimmt das nächste Ziel. Höchstens eines je Kalendermonat und Paar
     (der Monat reist als Zusatzfeld `reise` in der stillen Begrüßung zum Schatz; ältere Versionen übergehen es).
     Ein offenes Los wartet im Fenster „Gemeinsam erleben“, bis es eingelöst ist.
   - Geschenk-Radar: „Erlebnis statt Ding“ – eine Idee aus den gemeinsamen Traumzielen, zum Merken oder als Gutschein.
   - Schmetterlingsbuch: „Auf Reisen gefunden“ zeigt die Lotsenfalter der Liebespfade.
   Keine Angebote, keine Werbelinks, keine eigenen Zähler. */
(function () {
  'use strict';
  const L = window.LZ, D = window.LUZIFER_DATA; if (!L || !D) return;
  const S = () => L.S, P = () => window.LZP, esc = L.esc;
  const you = () => (P() ? P().partnerName() : S().receiver) || 'dein Schatz';
  const on = () => !!(P() && P().paired() && P().joined());
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const R = () => { const s = S(); if (!s.reise) s.reise = {}; if (!s.reise.radar) s.reise.radar = {}; return s.reise; };

  const DECK = 'traumziele';
  const FW = { 1: { i: '🏡', t: 'Vor der Haustür' }, 2: { i: '🧳', t: 'Übers Wochenende' }, 3: { i: '✈️', t: 'Großer Flug' } };
  /* Genau dieser Text reist als Einsatz mit dem Spiel (ältere App-Versionen zeigen ihn als gewöhnlichen Einsatz) */
  const AUSFLUG = 'Wer gewinnt, bestimmt unseren nächsten Ausflug';
  const isAusflug = (p) => p === AUSFLUG;

  /* Papillon als Wanderfalter. Die Sachaussage zum Distelfalter ist belegt:
     Stefanescu u. a. 2013, „Multi-generational long-distance migration of insects: studying the painted lady butterfly
     in the Western Palaearctic“, Ecography 36: 474–486 – jährlicher Zug zwischen Afrika und Europa über mehrere Generationen. */
  const STORY = {
    text: 'Papillon ist ein Wanderfalter. Wie die echten Distelfalter, die jedes Jahr zwischen Afrika und Nordeuropa hin- und herziehen, fliegt er dorthin, wo es schön ist – und bringt euch mit, was er gefunden hat.',
    source: { title: 'Stefanescu u. a. 2013, Ecography 36', url: 'https://repository.rothamsted.ac.uk/id/eprint/18974/' }
  };

  const deck = () => D.decks.find((d) => d.id === DECK);
  /* Gemeinsame Traumziele: erst die, die beide wollen, dann die, für die beide offen sind */
  function ziele() {
    const d = deck(), c = (S().common || {})[DECK] || {}; if (!d) return [];
    return d.items.filter((it) => c[it.id]).map((it) => ({ it, st: c[it.id] })).sort((a, b) => (a.st === 'yes' ? 0 : 1) - (b.st === 'yes' ? 0 : 1));
  }
  /* Bis zu drei Vorschläge, einer je Flugweite – innerhalb der Flugweite zufällig, „beide wollen“ zuerst */
  function vorschlaege() {
    const all = ziele(), out = [];
    [1, 2, 3].forEach((fw) => {
      const pool = all.filter((x) => x.it.fw === fw); if (!pool.length) return;
      const yes = pool.filter((x) => x.st === 'yes'), from = yes.length ? yes : pool;
      out.push(from[Math.floor(Math.random() * from.length)]);
    });
    return out;
  }
  const top = () => { /* Fenster von unten über ein offenes Spiel heben, bis es wieder zu ist */
    css(); const m = document.getElementById('modal'); if (!m) return;
    document.documentElement.classList.add('re-top');
    const ob = new MutationObserver(() => { if (!m.classList.contains('open')) { document.documentElement.classList.remove('re-top'); ob.disconnect(); } });
    ob.observe(m, { attributes: true, attributeFilter: ['class'] });
  };
  const play = () => { L.closeSheet(); setTimeout(() => { if (P() && P().playDeck) P().playDeck(DECK); }, 60); };
  const zielRow = (x, attr) => '<button type="button" class="re-row" ' + attr + '><span class="re-i">' + x.it.e + '</span><span class="re-b"><b>' + esc(x.it.t) + '</b><small>' + FW[x.it.fw].i + ' ' + FW[x.it.fw].t + '</small></span></button>';

  /* ---------- Unsere Traumziele ---------- */
  function sheet() {
    css(); const all = ziele();
    let h = '<h3>🧭 Unsere Traumziele</h3>';
    if (!all.length) h += '<div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Schließen</button><button class="pill-btn primary" data-play>Traumziele spielen</button></div>';
    else {
      [1, 2, 3].forEach((fw) => {
        const rows = all.filter((x) => x.it.fw === fw); if (!rows.length) return;
        h += '<div class="eyebrow" style="margin:14px 0 8px">' + FW[fw].i + ' ' + FW[fw].t + '</div>' + rows.map((x) => '<div class="match-item"><span class="mi-e">' + x.it.e + '</span><div class="mi-b"><div class="mi-t">' + esc(x.it.t) + '</div><div class="mi-s">' + (x.st === 'yes' ? 'Da wollt ihr beide hin' : 'Beide offen dafür') + '</div></div></div>').join('');
      });
      h += '<div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Schließen</button><button class="pill-btn" data-play>Weiterspielen</button></div>';
    }
    L.openSheet(h, (sh) => { sh.querySelector('[data-cancel]').onclick = L.closeSheet; sh.querySelector('[data-play]').onclick = play; });
  }

  /* ---------- Erleben: geordnet nach den drei Flugweiten (3.58.0) ---------- */
  function erleben() {
    css(); const all = ziele(), pf = window.LZPF && window.LZPF.available(), ls = offen();
    const row = (k, i, t, sub) => '<button type="button" class="re-row" data-k="' + k + '"><span class="re-i">' + i + '</span><span class="re-b"><b>' + esc(t) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><span class="re-go" aria-hidden="true">›</span></button>';
    const chips = (fw) => { const z = all.filter((x) => x.it.fw === fw).slice(0, 3); return z.length ? '<div class="re-chips">' + z.map((x) => '<span>' + x.it.e + ' ' + esc(x.it.t) + '</span>').join('') + '</div>' : ''; };
    const head = (fw) => '<div class="eyebrow re-fw">' + FW[fw].i + ' ' + FW[fw].t + '</div>';
    L.openSheet('<h3>🧭 Gemeinsam erleben</h3><div class="re-list">' +
      (ls ? row('los', '🎫', 'Reiselos einlösen', ls.why) : '') +
      row('spiel', '🎴', 'Traumziele', all.length ? all.length + ' gemeinsame Ziele' : '') +
      head(1) + (window.LZJ ? row('walk', '💞', 'Falterspaziergang', '') : '') + chips(1) +
      head(2) + (chips(2) || '<p class="re-leer">Noch kein gemeinsames Ziel</p>') +
      head(3) + (pf ? row('pfade', '🗺️', 'Liebespfade', '') : '') + (chips(3) || (pf ? '' : '<p class="re-leer">Noch kein gemeinsames Ziel</p>')) +
      '</div><div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Schließen</button>' + (all.length ? '<button class="pill-btn" data-ziele>⭐ Unsere Traumziele</button>' : '') + '</div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const zb = sh.querySelector('[data-ziele]'); if (zb) zb.onclick = () => { L.closeSheet(); setTimeout(sheet, 60); };
      const go = { spiel: play, los: () => { L.closeSheet(); setTimeout(losPick, 60); }, walk: () => { L.closeSheet(); setTimeout(() => window.LZJ.open(), 60); }, pfade: () => { L.closeSheet(); setTimeout(() => window.LZPF.open(), 60); } };
      sh.querySelectorAll('[data-k]').forEach((b) => { b.onclick = go[b.dataset.k]; });
    });
  }

  /* ---------- Ziel aussuchen und als Gutschein festhalten (Einsatz und Reiselos) ----------
     o = { kopf, icon, vor (Titel-Anfang), frei (Titel ohne Ziel), desc, send } – done(titel) nach dem Festhalten */
  function choose(o, done) {
    const sug = vorschlaege();
    const keep = async (title) => {
      const c = { icon: o.icon, title: title.slice(0, 50), desc: o.desc.slice(0, 120) };
      L.closeSheet();
      if (o.send && on()) { try { await P().sendCoupon(c); } catch (e) {} }
      S().coupons.push(Object.assign({ id: uid('c'), used: null, from: '' }, c)); L.save();
      if (!(o.send && on())) L.toast(o.icon + ' Liegt unter Wir → Gutscheine');
      if (done) done(c.title);
    };
    let h = '<h3>' + esc(o.kopf) + '</h3>';
    if (sug.length) h += '<div class="re-list">' + sug.map((x, i) => zielRow(x, 'data-s="' + i + '"')).join('') + '</div>';
    h += '<div class="row wrap" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Später</button><button class="pill-btn' + (sug.length ? '' : ' primary') + '" data-frei>' + (sug.length ? 'Etwas anderes' : 'Ich überlege mir was') + '</button></div>';
    L.openSheet(h, (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => keep(o.vor + sug[Number(b.dataset.s)].it.t); });
      sh.querySelector('[data-frei]').onclick = () => keep(o.frei);
    });
    top();
  }
  /* Einsatz „bestimmt den nächsten Ausflug“: o = { winner: Name oder „Du“, game: Titel des Spiels, send } */
  function pick(o, done) {
    const wer = o.winner === 'Du' ? (S().sender || 'mir') : o.winner, sug = ziele().length;
    choose({ kopf: '🧭 Euer nächster Ausflug', icon: '🧭', vor: 'Ausflug: ', frei: 'Ausflug nach Wunsch', send: o.send,
      desc: (sug ? 'Ausgesucht von ' + wer : wer + ' sucht das Ziel aus') + ' – gewonnen bei ' + o.game }, done);
  }

  /* ---------- Reiselos (3.58.0) ---------- */
  const monat = () => L.todayKey().slice(0, 7);
  const offen = () => { const l = R().los; return l && !l.done ? l : null; };
  const ich = (who) => who === 'Du' || who === S().sender;
  /* o = { who: Name oder „Du“, why: kurzer Anlass }. Gibt true zurück, wenn es ein Los gab. */
  function los(o) {
    if (!o || R().losMonat === monat() || offen()) return false; /* höchstens eines je Monat und Paar */
    const r = R(); r.losMonat = monat(); r.los = { at: Date.now(), who: String(o.who || 'Du').slice(0, 18), why: String(o.why || '').slice(0, 60), done: 0 }; L.save();
    if (on()) P().send({ t: 'hello', name: S().sender, pron: S().pron || '', reise: { los: r.losMonat } }).catch(() => {});
    banner(); marke(); return true;
  }
  /* vom Schatz: in diesem Monat gab es schon ein Los */
  function got(o) { if (o && typeof o.los === 'string' && /^\d{4}-\d{2}$/.test(o.los) && o.los > (R().losMonat || '')) { R().losMonat = o.los; L.save(); } }
  function banner() {
    const l = offen(); if (!l) return; css();
    const old = document.getElementById('reLos'); if (old) old.remove();
    const el = document.createElement('div'); el.id = 'reLos'; el.className = 're-los'; el.setAttribute('role', 'status');
    el.innerHTML = '<span class="re-los-i" aria-hidden="true">🎫</span><span class="re-b"><b>' + (ich(l.who) ? 'Glückwunsch, du hast ein Reiselos!' : 'Glückwunsch, ' + esc(l.who) + ' hat ein Reiselos!') + '</b><small>' + esc(l.why) + '</small></span>' +
      '<button type="button" class="re-los-x" data-x aria-label="Später">✕</button><button type="button" class="pill-btn primary" data-go>Ziel aussuchen</button>';
    document.body.appendChild(el); L.haptic && L.haptic(30);
    el.querySelector('[data-x]').onclick = () => el.remove();
    el.querySelector('[data-go]').onclick = () => { el.remove(); losPick(); };
  }
  function losPick() {
    const l = offen(); if (!l) return;
    const wer = ich(l.who) ? (S().sender || 'Ich') : l.who;
    choose({ kopf: ich(l.who) ? '🎫 Dein Reiselos' : '🎫 Reiselos von ' + l.who, icon: '🎫', vor: 'Reiselos: ', frei: 'Reiselos: Ziel nach Wunsch', send: true,
      desc: wer + ' bestimmt das nächste Ziel – ' + l.why }, () => { l.done = Date.now(); L.save(); marke(); });
  }
  /* Punkt an der Kachel „Erleben“, solange ein Los wartet */
  function marke() { const t = document.querySelector('#futterDrei [data-go="erleben"]'); if (t) t.classList.toggle('st-ready', !!offen()); }

  /* ---------- Geschenk-Radar: Erlebnis statt Ding (3.58.0) ----------
     o = der nächste Anlass aus LZF.occasionsAll(). Eine Idee je Anlass und Jahr, bevorzugt Wochenende oder großer Flug. */
  const radarKey = (o) => String(o.id) + ':' + new Date().getFullYear();
  function radarIdee(o) {
    const all = ziele(); if (!all.length) return null;
    const st = R().radar[radarKey(o)], fix = st && all.find((x) => x.it.id === st.id); if (fix) return fix;
    const gross = all.filter((x) => x.it.fw > 1), pool0 = gross.length ? gross : all, yes = pool0.filter((x) => x.st === 'yes'), pool = yes.length ? yes : pool0;
    let hsh = 0; const k = radarKey(o); for (let i = 0; i < k.length; i++) hsh = (hsh * 31 + k.charCodeAt(i)) >>> 0;
    return pool[hsh % pool.length];
  }
  function radarHtml(o) {
    const x = o && radarIdee(o); if (!x) return ''; css();
    const st = R().radar[radarKey(o)] || {};
    return '<div class="re-radar"><span class="tips-label">🧭 Erlebnis statt Ding</span><div class="match-item"><span class="mi-e">' + x.it.e + '</span><div class="mi-b"><div class="mi-t">' + esc(x.it.t) + '</div><div class="mi-s">Aus euren Traumzielen</div>' +
      '<div class="row wrap" style="justify-content:flex-start;gap:8px;margin-top:8px"><button type="button" class="pill-btn small" data-re-merk>' + (st.merk ? '✓ Gemerkt' : '⭐ Merken') + '</button>' +
      (on() ? '<button type="button" class="pill-btn small" data-re-gut' + (st.sent ? ' disabled' : '') + '>' + (st.sent ? '✓ Verschenkt' : '🎟️ Als Gutschein schenken') + '</button>' : '') + '</div></div></div></div>';
  }
  function radarBind(root, o) {
    const x = o && radarIdee(o); if (!x || !root) return;
    const k = radarKey(o), again = () => { if (P() && P().renderGiftRadar) P().renderGiftRadar(); };
    const mb = root.querySelector('[data-re-merk]'); if (mb) mb.onclick = () => { const r = R().radar, st = r[k] || (r[k] = { id: x.it.id }); st.id = x.it.id; st.merk = st.merk ? 0 : 1; L.save(); again(); };
    const gb = root.querySelector('[data-re-gut]'); if (gb) gb.onclick = () => L.openSheet('<h3>🎟️ An ' + esc(you()) + ' schicken?</h3><div class="match-item" style="margin-top:10px"><span class="mi-e">' + x.it.e + '</span><div class="mi-b"><div class="mi-t">' + esc(x.it.t) + '</div><div class="mi-s">' + esc(o.title) + '</div></div></div>' +
      '<div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-no>Noch nicht</button><button class="pill-btn primary" data-yes>Jetzt schicken</button></div>', (sh) => {
      sh.querySelector('[data-no]').onclick = L.closeSheet;
      sh.querySelector('[data-yes]').onclick = async () => {
        L.closeSheet(); const r = R().radar, st = r[k] || (r[k] = { id: x.it.id }); st.id = x.it.id;
        try { await P().sendCoupon({ icon: '🧭', title: ('Ausflug: ' + x.it.t).slice(0, 50), desc: ('Zu: ' + o.title + ' – von ' + (S().sender || 'mir')).slice(0, 120) }); st.sent = Date.now(); L.save(); } catch (e) {}
        again();
      };
    });
  }

  /* ---------- Schmetterlingsbuch: Auf Reisen gefunden (3.58.0) ---------- */
  function buchHtml() {
    const lo = (S().pfade && S().pfade.lotsen) || {}, ids = Object.keys(lo); if (!ids.length) return ''; css();
    return '<div class="eyebrow" style="margin:16px 0 8px">🧭 Auf Reisen gefunden</div><div class="re-buch">' + ids.map((id) => { const x = lo[id], i = typeof x.bild === 'number' ? x.bild : 0;
      return '<div class="re-cell"><span class="fx-img fx-t0" style="--c:' + (i % 3) + ';--r:' + Math.floor(i / 3) + '"></span><b>' + esc(x.n || 'Lotsenfalter') + '</b>' + (x.ort ? '<small>' + esc(x.ort) + '</small>' : '') + '</div>'; }).join('') + '</div>';
  }

  function css() {
    if (document.getElementById('reisen-css')) return;
    const s = document.createElement('style'); s.id = 'reisen-css';
    s.textContent = 'html.re-top #modal{z-index:9700}' +
      '.re-list{display:flex;flex-direction:column;gap:10px;margin-top:12px}' +
      '.re-row{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:10px 14px;border-radius:18px;border:1px solid var(--line-soft);background:var(--tile-bg,rgba(255,255,255,.06));color:var(--text);font:inherit;text-align:left;cursor:pointer}' +
      '.re-row:active{transform:scale(.98);border-color:var(--accent-2)}.re-b{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.re-row b{font-size:19px;font-weight:700;line-height:1.25}.re-row small{font-size:16px;font-weight:500;color:var(--text-soft)}' +
      '.re-i{width:44px;height:44px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;background:rgba(255,255,255,.08)}' +
      '.re-go{flex:none;font-size:24px}' +
      '.re-fw{margin:8px 0 0!important;font-size:19px;font-weight:700;text-transform:none;letter-spacing:0;color:var(--text)}' +
      '.re-chips{display:flex;flex-wrap:wrap;gap:8px}.re-chips span{padding:8px 12px;border-radius:14px;background:rgba(255,255,255,.08);font-size:17px;font-weight:700;line-height:1.25}' +
      '.re-leer{margin:0;font-size:17px;color:var(--text-soft)}' +
      '.re-los{position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:9800;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px 12px;padding:14px;border-radius:20px;background:#2d1133;border:2px solid #ffd166;box-shadow:0 10px 30px rgba(0,0,0,.55);color:#fff1f5;font-family:var(--sans,Lato,sans-serif);animation:reLos .5s ease-out}' +
      '.re-los-i{font-size:34px;flex:none}.re-los b{font-size:19px;font-weight:700;line-height:1.25}.re-los small{font-size:16px;color:#f6dbe6}.re-los .pill-btn{grid-column:1 / -1;min-height:52px;width:100%;margin:0;justify-content:center}' +
      '.re-los-x{flex:none;width:48px;height:48px;border-radius:24px;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:20px}' +
      '@keyframes reLos{from{transform:translateY(-120%)}to{transform:none}}@media (prefers-reduced-motion:reduce){.re-los{animation:none}}' +
      '.re-radar{margin:10px 0 4px}.re-radar .match-item{margin-top:8px}' +
      '.re-buch{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.re-cell{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;padding:10px 6px;border-radius:16px;background:rgba(255,255,255,.06)}' +
      '.re-cell .fx-img{width:64px;height:64px}.re-cell b{font-size:16px;font-weight:700;line-height:1.2}.re-cell small{font-size:16px;color:var(--text-soft);line-height:1.2}';
    document.head.appendChild(s);
  }

  setTimeout(marke, 0);
  window.LZRE = { erleben, sheet, pick, ziele, vorschlaege, isAusflug, AUSFLUG, STORY, FW, DECK,
    los, losPick, got, offen, radarHtml, radarBind, buchHtml,
    /* Prüfhilfe: Monatssperre und offenes Los zurücksetzen */ _reset: () => { const r = R(); delete r.losMonat; delete r.los; L.save(); marke(); const b = document.getElementById('reLos'); if (b) b.remove(); } };
})();
