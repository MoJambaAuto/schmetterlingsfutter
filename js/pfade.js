/* Schmetterlingsfutter – Liebespfade (LZPF, 3.52.0)
   Reise-Erweiterung: ein Reiseziel, Routen für Paare, je Station Fotos, Geschichte, „Gut zu wissen“,
   Ankunft per Antippen, geheime Aufgaben für beide, eine gemeinsame Aufgabe und ein Plan B.
   Inhalte kommen als Paket (JSON, Schema 1.0.0) aus pfade/<edition>/ – die App selbst kennt keine Orte.

   Zwei Handys: läuft über die BESTEHENDE Verbindung. Der Stand reist als Zusatzfeld `pfad` in der stillen
   Begrüßung (`hello`) – ältere App-Versionen übergehen das Feld, es entsteht kein Postfach-Hinweis.
   Rollen: wer startet, hat an Station 1, 3, 5 … Aufgabe A, sonst B (wechselt, damit beide beides bekommen).
   Der Stand wird als Ganzes geschickt und zusammengeführt (früheste Zeit gewinnt) – Reihenfolge und verlorene
   Nachrichten spielen keine Rolle. Ohne Netz blockiert nichts: jede Seite kann allein weitermachen.

   Ohne Netz: Paket und Skript liegen im App-Speicher (sw.js), die Fotos in einem eigenen Speicher
   „sf-pfade-<edition>“, der App-Updates übersteht und beim ersten Öffnen des Reiseziels gefüllt wird.

   Lotsenfalter: feste Punkte aus dem Paket (candidates, kind „lotsenpunkt“) – getrennt von den zufälligen
   Faltern des Falterspaziergangs (eigene Sammlung S.pfade.lotsen, zählt nicht ins Schmetterlingsbuch).
   Nur virtuell. Standort ist nur ein Bonus: klappt er nicht, geht es per Antippen weiter; ohne Kamera
   erscheint der Falter über einer Wiese.
   SCHALTER: Ein Lotsenfalter erscheint erst, wenn JEDE Vorbedingung aus arButterfly.beforeLaunch in
   EDITIONS[..].lotsen[..].frei bestätigt ist (wer, wann, Beleg). Nicht umgehen – nur zum Testen am PC
   (localhost) lässt er sich mit localStorage sf.pfadeArTest = 1 einschalten.

   Sichtbarkeit: Ein Reiseziel mit released:false sehen nur Testende (localhost oder einmal ?pfade=vorschau). */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const S = () => L.S, P = () => window.LZP, J = () => window.LZJ;
  const esc = L.esc, C = (k) => window.LZS && window.LZS.count(k);
  const you = () => (P() ? P().partnerName() : S().receiver) || 'dein Schatz';
  const me = () => S().sender || 'Du';
  const on = () => !!(P() && P().paired() && P().joined());

  /* ---------- Reiseziele ---------- */
  const EDITIONS = [{
    id: 'fuerteventura-sued', dir: 'pfade/fuerteventura-sued/', file: 'fuerteventura-sued.json',
    name: 'Fuerteventura · Süden', flag: '🇪🇸', flug: 'Papillons erster Fernflug',
    released: false, /* erst nach Mos Ja und übernommenen Textkorrekturen auf true */
    /* Lotsenpunkt → Station, Art (species im Paket), Platzhalter-Bild (Feld in img/falter.webp, bis es eigene Bilder gibt),
       Umkreis in Metern, und je Vorbedingung aus dem Paket (gleiche Reihenfolge) die Bestätigung oder null. */
    lotsen: {
      'lotsenpunkt-lagune': { stop: 'lagune-risco-del-paso', species: 'distelfalter', bild: 3, radius: 300,
        frei: [null, { by: 'Claude', at: '2026-11-25', note: 'Nur Bildschirm-Anzeige, kein Gegenstand vor Ort (Code + Test)' }, { by: 'Claude', at: '2026-11-25', note: 'Per Antippen ohne Standort und ohne Kamera getestet' }, null] },
      'lotsenpunkt-betancuria': { stop: 'betancuria-dorf', species: 'kanarischer-admiral', bild: 5, radius: 300,
        frei: [null, { by: 'Claude', at: '2026-11-25', note: 'Nur Bildschirm-Anzeige, kein Gegenstand vor Ort (Code + Test)' }, { by: 'Claude', at: '2026-11-25', note: 'Per Antippen ohne Standort und ohne Kamera getestet' }, null] },
      'lotsenpunkt-ajuy': { stop: 'cuevas-de-ajuy', species: 'afrikanischer-monarch', bild: 4, radius: 300,
        frei: [null, { by: 'Claude', at: '2026-11-25', note: 'Nur Bildschirm-Anzeige, kein Gegenstand vor Ort (Code + Test)' }, { by: 'Claude', at: '2026-11-25', note: 'Per Antippen ohne Standort und ohne Kamera getestet' }, null] }
    }
  }];
  const MOOD = { romantic: '💗 Romantisch', explore: '🧭 Entdecken', surprise: '✨ Überraschung' };
  const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

  const ls = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  try { const q = new URLSearchParams(location.search).get('pfade'); if (q === 'vorschau') localStorage.setItem('sf.pfadeVorschau', '1'); if (q === 'aus') localStorage.removeItem('sf.pfadeVorschau'); } catch (e) {}
  const preview = () => LOCAL || ls('sf.pfadeVorschau') === '1';
  const visible = () => EDITIONS.filter((e) => e.released || preview());
  const available = () => visible().length > 0;
  const edOf = (id) => EDITIONS.find((e) => e.id === id);

  /* ---------- Schalter für die Lotsenfalter ---------- */
  function arOpen(cand, cfg) {
    const ar = cand && cand.arButterfly; if (!ar || !cfg) return ['Angaben zum Lotsenfalter fehlen']; /* fehlt etwas, bleibt der Schalter zu */
    if (ar.decision !== 'ja') return ['Keine Entscheidung für einen Falter an diesem Punkt'];
    const need = Array.isArray(ar.beforeLaunch) ? ar.beforeLaunch : [];
    if (!need.length) return ['Vorbedingungen fehlen im Paket'];
    return need.filter((x, i) => !(cfg.frei && cfg.frei[i] && cfg.frei[i].by && cfg.frei[i].at && cfg.frei[i].note));
  }
  const arTest = () => LOCAL && ls('sf.pfadeArTest') === '1';
  const arLive = (cand, cfg) => !!(cand && cfg) && (arOpen(cand, cfg).length === 0 || arTest());

  /* ---------- Speicher ---------- */
  function st() { const s = S(); if (!s.pfade) s.pfade = { runs: {}, lotsen: {} }; if (!s.pfade.runs) s.pfade.runs = {}; if (!s.pfade.lotsen) s.pfade.lotsen = {}; return s.pfade; }
  const key = (ed, r) => ed + '/' + r;
  const runOf = (ed, r) => st().runs[key(ed, r)] || null;
  const ss = (run, id) => run.st[id] || (run.st[id] = { arr: 0, a: 0, b: 0, joint: 0, planB: 0 });
  const stopDone = (run, id) => !!(run && run.st[id] && run.st[id].joint);
  const doneN = (run, route) => route.stops.filter((x) => stopDone(run, x.id)).length;
  const curIdx = (run, route) => { const i = route.stops.findIndex((x) => !stopDone(run, x.id)); return i < 0 ? route.stops.length - 1 : i; };
  const myRole = (run, k) => ((!!run.host) === (k % 2 === 0) ? 'a' : 'b');
  const active = () => Object.values(st().runs).filter((r) => r && !r.end).sort((x, y) => y.t - x.t)[0] || null;

  /* ---------- Paket laden ---------- */
  const packs = {};
  function load(ed) {
    if (packs[ed.id]) return Promise.resolve(packs[ed.id]);
    return fetch(ed.dir + ed.file).then((r) => { if (!r.ok) throw new Error('paket'); return r.json(); }).then((p) => {
      if (!p || p.schemaVersion !== '1.0.0' || !Array.isArray(p.routes) || !p.routes.length) throw new Error('format');
      p._media = {}; (p.media || []).forEach((m) => { if (m && ID.test(m.id) && /^bilder\/[a-z0-9-]+\.jpg$/.test(m.file || '')) p._media[m.id] = m; });
      p._src = {}; (p.sources || []).forEach((q) => { if (q && /^https:\/\//.test(q.url || '')) p._src[q.id] = q; });
      p._sp = {}; (p.species || []).forEach((q) => { p._sp[q.id] = q; });
      p._lotse = {}; /* Station → { cand, cfg } */
      (p.candidates || []).forEach((c) => { const cfg = ed.lotsen[c.id]; if (c.kind === 'lotsenpunkt' && cfg) p._lotse[cfg.stop] = { cand: c, cfg }; });
      packs[ed.id] = p; return p;
    });
  }
  const pics = (ed, p, stop) => (stop.mediaIds || []).map((id) => p._media[id]).filter(Boolean).map((m) => ({ src: ed.dir + m.file, alt: m.alt || '' }));

  /* ---------- Fotos für unterwegs (eigener Speicher, übersteht App-Updates) ---------- */
  const off = {}; /* edId → { n, total, done, fail } */
  const cacheName = (ed) => 'sf-pfade-' + ed.id;
  async function offline(ed, p) {
    if (!('caches' in window) || (off[ed.id] && (off[ed.id].busy || off[ed.id].done))) return;
    const o = off[ed.id] = { n: 0, total: 0, done: false, fail: false, busy: true };
    try {
      const used = new Set(); p.routes.forEach((r) => r.stops.forEach((x) => (x.mediaIds || []).forEach((id) => used.add(id))));
      const urls = Array.from(used).map((id) => p._media[id]).filter(Boolean).map((m) => new URL(ed.dir + m.file, location.href).href);
      o.total = urls.length;
      const mark = 'sf.pfade.cache.' + ed.id, want = String(p.editionVersion) + '|' + urls.length;
      if (ls(mark) && ls(mark) !== want && navigator.onLine !== false) await caches.delete(cacheName(ed)); /* 3.53.3: ohne Netz die alten Fotos behalten */ /* neue Fassung des Pakets: Fotos neu holen */
      const c = await caches.open(cacheName(ed));
      const have = new Set((await c.keys()).map((r) => r.url));
      const todo = urls.filter((u) => !have.has(u)); o.n = urls.length - todo.length; paintOff(ed);
      let i = 0;
      const worker = async () => { while (i < todo.length) { const u = todo[i++]; try { const r = await fetch(u, { cache: 'reload' }); if (!r.ok || (r.headers.get('content-type') || '').indexOf('image/') !== 0) throw new Error('x'); await c.put(u, r); o.n++; } catch (e) { o.fail = true; } paintOff(ed); } };
      await Promise.all([worker(), worker(), worker()]);
      o.done = o.n >= o.total && o.total > 0;
      if (o.done) { try { localStorage.setItem(mark, want); } catch (e) {} if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); }
    } catch (e) { o.fail = true; }
    o.busy = false; paintOff(ed);
  }
  function offHtml(ed) {
    const o = off[ed.id]; if (!o || !o.total) return '';
    if (o.done) return '<span class="pf-chip ok">✓ Geht ohne Netz</span>';
    if (o.busy) return '<span class="pf-chip">⬇ Fotos ' + o.n + ' / ' + o.total + '</span>';
    return '<button type="button" class="pf-chip warn" data-offretry>⚠ Fotos fehlen – nochmal laden</button>';
  }
  function paintOff(ed) { if (!root) return; const el = root.querySelector('[data-off="' + ed.id + '"]'); if (!el) return; el.innerHTML = offHtml(ed); const b = el.querySelector('[data-offretry]'); if (b) b.onclick = () => { off[ed.id] = null; offline(ed, packs[ed.id]); }; }

  /* ---------- Anzeige-Helfer ---------- */
  const dur = (m) => { if (!(m > 0)) return ''; if (m < 90) return 'ca. ' + Math.max(5, Math.round(m / 5) * 5) + ' Min.'; const h = Math.round(m / 30) / 2; return 'ca. ' + String(h).replace('.', ',') + ' Std.'; };
  const euro = (n) => (typeof n !== 'number' ? '' : n <= 0 ? 'kostenlos' : 'ca. ' + Math.round(n) + ' €');
  const stars = (n) => (n > 0 ? '<span class="pf-stars" role="img" aria-label="' + n + ' von 5">' + '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i></span>' : '');
  const dateDe = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; };
  const fimg = (i, cls) => '<span class="fx-img fx-t0' + (cls ? ' ' + cls : '') + '" style="--c:' + (i % 3) + ';--r:' + Math.floor(i / 3) + '"></span>';

  /* ---------- Fenster ---------- */
  let root = null, stack = [], tick = null, gen = 0;
  function open(target) {
    if (!available()) { L.toast('Liebespfade kommen bald'); return; }
    css(); C('pfad_open');
    if (!root) {
      root = document.createElement('div'); root.className = 'pfade'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Liebespfade');
      root.innerHTML = '<header class="pf-top"><button type="button" class="pf-back" aria-label="Zurück">‹</button><b class="pf-h"></b><span class="pf-topr"></span></header><div class="pf-body" tabindex="-1"></div>';
      document.body.appendChild(root); document.documentElement.classList.add('pfade-open');
      root.querySelector('.pf-back').onclick = back;
      tick = setInterval(beat, 6000);
    }
    stack = []; const g = ++gen; /* verspätete Rückrufe eines früheren Öffnens gelten nicht mehr */
    const a = target === 'weiter' ? active() : null;
    const ed = a ? edOf(a.ed) : visible()[0];
    go({ v: 'ed', ed: ed.id });
    if (a) { go({ v: 'route', ed: a.ed, route: a.route }); load(ed).then((p) => { const r = p.routes.find((x) => x.id === a.route); if (r && root && g === gen && cur() && cur().v === 'route' && cur().route === a.route) go({ v: 'stop', ed: a.ed, route: a.route, k: curIdx(a, r) }); }).catch(() => {}); }
  }
  function close() {
    clearInterval(tick); tick = null; closeLb();
    if (root) { root.remove(); root = null; } stack = []; gen++;
    document.documentElement.classList.remove('pfade-open');
    if (window.LZG && window.LZG.renderHub) { try { window.LZG.renderHub(); } catch (e) {} }
    homeTile();
  }
  function back() { if (closeLb()) return; stack.pop(); if (!stack.length) return close(); render(); }
  function go(view) { stack.push(view); render(); }
  const cur = () => stack[stack.length - 1];
  function head(title, right) { root.querySelector('.pf-h').textContent = title; root.querySelector('.pf-topr').innerHTML = right || ''; }
  function render() {
    if (!root) return; const v = cur(); if (!v) return;
    const body = root.querySelector('.pf-body'); body.innerHTML = '<p class="pf-wait">Lädt …</p>';
    const ed = edOf(v.ed);
    load(ed).then((p) => {
      if (!root || cur() !== v) return;
      if (v.v === 'ed') viewEd(body, ed, p); else if (v.v === 'route') viewRoute(body, ed, p, v); else viewStop(body, ed, p, v);
      body.scrollTop = 0;
    }).catch(() => {
      if (!root || cur() !== v) return;
      head('Liebespfade');
      body.innerHTML = '<div class="pf-card"><p>Die Reise lässt sich gerade nicht laden.</p><button type="button" class="pf-btn" data-again>Nochmal versuchen</button></div>';
      body.querySelector('[data-again]').onclick = render;
    });
  }
  const draftChip = (ed, p) => (!ed.released && p.status === 'draft' ? '<span class="pf-chip draft">Entwurf</span>' : '');

  /* ---------- 1. Reiseziel: Routen ---------- */
  function viewEd(body, ed, p) {
    head('Liebespfade', draftChip(ed, p));
    const a = active();
    const hero = pics(ed, p, p.routes[0].stops[1] || p.routes[0].stops[0])[0]; /* anderes Bild als auf der ersten Routenkarte */
    /* 3.55.0: Warum ist das hier? Papillon ist ein Wanderfalter – jedes Reiseziel ist einer seiner Flüge (Text und Beleg in js/reisen.js) */
    const ws = window.LZRE && window.LZRE.STORY;
    const story = ws ? '<div class="pf-story"><h2>' + esc(ed.flug || 'Papillons Flug') + '</h2><p>' + esc(ws.text) + '</p><a class="pf-src" href="' + esc(ws.source.url) + '" target="_blank" rel="noopener">Quelle: ' + esc(ws.source.title) + ' ↗</a></div>' : '';
    let h = '<div class="pf-hero">' + (hero ? '<img src="' + esc(hero.src) + '" alt="' + esc(hero.alt) + '">' : '') + '<div class="pf-hero-t"><h1>' + esc(ed.name) + '</h1><span data-off="' + ed.id + '">' + offHtml(ed) + '</span></div></div>';
    if (a && a.ed === ed.id) { const r = p.routes.find((x) => x.id === a.route); if (r) h += '<button type="button" class="pf-btn big" data-weiter>▶ Weiter: ' + esc(r.title) + '</button>'; }
    h += story;
    h += '<div class="pf-list">' + p.routes.map((r, i) => {
      const run = runOf(ed.id, r.id), n = run ? doneN(run, r) : 0, pic = pics(ed, p, r.stops[0])[0];
      return '<button type="button" class="pf-route" data-r="' + i + '">' + (pic ? '<img src="' + esc(pic.src) + '" alt="" loading="lazy">' : '') +
        '<span class="pf-route-b"><b>' + esc(r.title) + '</b>' +
        '<span class="pf-facts"><span><i>⏱</i>' + esc(dur(r.estimatedMinutes)) + '</span><span><i>💶</i>' + esc(euro(r.budgetEuro)) + '<small> zu zweit</small></span></span>' +
        '<span class="pf-moods">' + (r.mood || []).filter((m) => MOOD[m]).map((m) => '<span class="pf-chip">' + MOOD[m] + '</span>').join('') +
        (run && run.end ? '<span class="pf-chip ok">✓ Geschafft</span>' : n ? '<span class="pf-chip ok">' + n + ' von ' + r.stops.length + '</span>' : '') + '</span></span></button>';
    }).join('') + '</div>';
    /* Lotsenfalter-Sammlung – nur wenn mindestens einer freigeschaltet ist */
    const ls3 = Object.keys(p._lotse).map((sid) => p._lotse[sid]).filter((x) => arLive(x.cand, x.cfg));
    if (ls3.length) h += '<div class="pf-card"><h2>🦋 Lotsenfalter</h2><div class="pf-lotsen">' + ls3.map((x) => { const got = st().lotsen[x.cand.id]; return '<span class="' + (got ? 'got' : '') + '">' + (got ? fimg(x.cfg.bild) : '<i></i>') + '<small>' + esc(x.cand.title) + '</small></span>'; }).join('') + '</div></div>';
    body.innerHTML = h;
    body.querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => go({ v: 'route', ed: ed.id, route: p.routes[Number(b.dataset.r)].id }); });
    const w = body.querySelector('[data-weiter]'); if (w) w.onclick = () => { const r = p.routes.find((x) => x.id === a.route); go({ v: 'route', ed: ed.id, route: a.route }); go({ v: 'stop', ed: ed.id, route: a.route, k: curIdx(a, r) }); };
    paintOff(ed); offline(ed, p);
  }

  /* ---------- 2. Route: Stationen und Start ---------- */
  function viewRoute(body, ed, p, v) {
    const r = p.routes.find((x) => x.id === v.route); if (!r) return back();
    const run = runOf(ed.id, r.id);
    head(r.title, draftChip(ed, p));
    const k = run ? curIdx(run, r) : 0;
    let h = '<p class="pf-lead">' + esc(r.summary || '') + '</p>' +
      '<div class="pf-facts wide"><span><i>⏱</i>' + esc(dur(r.estimatedMinutes)) + '</span><span><i>💶</i>' + esc(euro(r.budgetEuro)) + '<small> zu zweit</small></span></div>' +
      '<ol class="pf-stops">' + r.stops.map((x, i) => { const pic = pics(ed, p, x)[0], d = stopDone(run, x.id); return '<li><button type="button" data-k="' + i + '" class="' + (d ? 'done' : run && !run.end && i === k ? 'now' : '') + '"><span class="pf-num">' + (d ? '✓' : i + 1) + '</span>' + (pic ? '<img src="' + esc(pic.src) + '" alt="" loading="lazy">' : '') + '<b>' + esc(x.title) + '</b></button></li>'; }).join('') + '</ol>';
    if (!run) h += on() ? '<div class="pf-row"><button type="button" class="pf-btn big" data-start="relay">📱📱 Zwei Handys</button><button type="button" class="pf-btn big ghost" data-start="pass">📱 Ein Handy</button></div>'
      : '<button type="button" class="pf-btn big" data-start="pass">Los geht’s</button>' + (P() ? '<button type="button" class="pf-link" data-pair>📱📱 Mit zwei Handys spielen</button>' : '');
    else h += (run.end ? '' : '<button type="button" class="pf-btn big" data-go>▶ Weiter mit Station ' + (k + 1) + '</button>') + '<button type="button" class="pf-link" data-reset>Route neu starten</button>';
    body.innerHTML = h;
    body.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => go({ v: 'stop', ed: ed.id, route: r.id, k: Number(b.dataset.k) }); });
    body.querySelectorAll('[data-start]').forEach((b) => { b.onclick = () => { startRun(ed, r, b.dataset.start); go({ v: 'stop', ed: ed.id, route: r.id, k: 0 }); }; });
    const g = body.querySelector('[data-go]'); if (g) g.onclick = () => go({ v: 'stop', ed: ed.id, route: r.id, k });
    const pr = body.querySelector('[data-pair]'); if (pr) pr.onclick = () => { if (window.LZC && window.LZC.chooser) window.LZC.chooser(); else if (P().pairSheet) P().pairSheet(); };
    const rs = body.querySelector('[data-reset]'); if (rs) rs.onclick = () => L.openSheet('<h3>Route neu starten?</h3><p class="about" style="font-size:19px">Eure Haken an dieser Route werden gelöscht.</p><div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-no>Behalten</button><button class="pill-btn primary" data-yes>Neu starten</button></div>', (sh) => {
      sh.querySelector('[data-no]').onclick = L.closeSheet;
      sh.querySelector('[data-yes]').onclick = () => { delete st().runs[key(ed.id, r.id)]; L.save(); L.closeSheet(); render(); };
    });
  }
  function startRun(ed, r, mode) {
    const relay = mode === 'relay' && on();
    const run = { rid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ed: ed.id, route: r.id, mode: relay ? 'relay' : 'pass', host: true, t: Date.now(), st: {}, end: 0, dirty: false };
    st().runs[key(ed.id, r.id)] = run; L.save(); C('pfad_start:' + (relay ? 'zwei' : 'eins'));
    if (relay) {
      sync(run);
      /* sichtbare Einladung als normale Botschaft – kommt auch bei älteren App-Versionen an */
      P().send({ t: 'msg', text: '🧭 Liebespfade: Ich habe „' + r.title + '“ gestartet. Du findest die Route unter Spielen → Liebespfade.', label: '🧭 Liebespfade' }).catch(() => {});
    }
    return run;
  }

  /* ---------- 3. Station ---------- */
  let ui = {}; /* nur für „ein Handy“: welche geheime Aufgabe gerade aufgedeckt ist */
  function viewStop(body, ed, p, v) {
    const r = p.routes.find((x) => x.id === v.route); const x = r && r.stops[v.k]; if (!x) return back();
    head('Station ' + (v.k + 1) + ' von ' + r.stops.length, draftChip(ed, p));
    ui = { key: x.id, rev: null };
    const ph = pics(ed, p, x), fc = x.fieldCheck || {}, tips = Array.isArray(fc.tips) ? fc.tips : [], src = (x.sourceIds || []).map((id) => p._src[id]).filter(Boolean);
    const facts = [
      typeof fc.costTwoEuro === 'number' ? '<div><small>Kosten zu zweit</small><b>' + esc(euro(fc.costTwoEuro)) + '</b></div>' : '',
      fc.minutesOnSite > 0 ? '<div><small>Zeit vor Ort</small><b>' + esc(dur(fc.minutesOnSite)) + '</b></div>' : '',
      fc.romance > 0 ? '<div><small>Romantik</small><b>' + stars(fc.romance) + '</b></div>' : '',
      fc.practical > 0 ? '<div><small>Gut erreichbar</small><b>' + stars(fc.practical) + '</b></div>' : ''
    ].join('');
    body.innerHTML =
      (ph.length ? '<div class="pf-gal"><div class="pf-gal-in">' + ph.map((q, i) => '<button type="button" data-ph="' + i + '"><img src="' + esc(q.src) + '" alt="' + esc(q.alt) + '"' + (i ? ' loading="lazy"' : '') + '></button>').join('') + '</div>' + (ph.length > 1 ? '<span class="pf-gal-n" aria-hidden="true">1 / ' + ph.length + '</span>' : '') + '</div>' : '') +
      '<h1 class="pf-title">' + esc(x.title) + '</h1>' +
      /* 3.53.2: Warnhinweis direkt unter dem Titel – man soll ihn lesen, bevor man aussteigt (Mo 25.11.2026, Autoaufbrüche Sicasumbre) */
      (x.arrivalRules && x.arrivalRules.safetyNote ? '<div class="pf-warn"><span aria-hidden="true">⚠️</span><p>' + esc(x.arrivalRules.safetyNote) + '</p></div>' : '') +
      '<div id="pfAct"></div>' +
      '<p class="pf-text">' + esc(x.description || '') + '</p>' +
      (x.story && x.story.text ? '<div class="pf-story"><h2>So war es bei uns</h2><p>' + esc(x.story.text) + '</p></div>' : '') +
      (facts || tips.length || src.length ? '<details class="pf-more"><summary>Gut zu wissen</summary>' + (facts ? '<div class="pf-grid">' + facts + '</div>' : '') +
        (tips.length ? '<ul>' + tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') +
        (fc.date ? '<p class="pf-small">Vor Ort geprüft am ' + esc(dateDe(fc.date)) + '</p>' : '') +
        src.map((q) => '<a class="pf-src" href="' + esc(q.url) + '" target="_blank" rel="noopener">Quelle: ' + esc(q.title) + ' ↗</a>').join('') + '</details>' : '');
    const gi = body.querySelector('.pf-gal-in'), gn = body.querySelector('.pf-gal-n');
    if (gi && gn) gi.addEventListener('scroll', () => { gn.textContent = Math.min(ph.length, Math.round(gi.scrollLeft / Math.max(1, gi.clientWidth)) + 1) + ' / ' + ph.length; }, { passive: true });
    body.querySelectorAll('[data-ph]').forEach((b) => { b.onclick = () => lightbox(ph, Number(b.dataset.ph)); });
    act(ed, p, r, v.k);
  }

  /* Der bewegliche Teil der Station: Ankommen → geheime Aufgaben → gemeinsam → fertig */
  function act(ed, p, r, k) {
    const box = root && root.querySelector('#pfAct'); if (!box) return;
    const x = r.stops[k], run = runOf(ed.id, r.id);
    if (ui.key !== x.id) ui = { key: x.id, rev: null };
    const rerun = () => act(ed, p, r, k);
    if (!run) { box.innerHTML = '<button type="button" class="pf-btn big" data-route>Route starten</button>'; box.querySelector('[data-route]').onclick = back; return; }
    const s = ss(run, x.id), relay = run.mode === 'relay';
    const set = (f, ev) => { if (!s[f]) { s[f] = Date.now(); L.save(); if (ev) C(ev); sync(run); } rerun(); };
    const planB = () => L.openSheet('<h3>Plan B</h3><p class="about" style="font-size:19px;line-height:1.5">' + esc(x.challenge.fallback) + '</p><div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-no>Zurück</button><button class="pill-btn primary" data-yes>✓ Gemacht</button></div>', (sh) => {
      sh.querySelector('[data-no]').onclick = L.closeSheet;
      sh.querySelector('[data-yes]').onclick = () => { L.closeSheet(); s.planB = 1; if (!s.arr) s.arr = Date.now(); set('joint', 'pfad_planb'); stopFinished(run, r, k); };
    });
    let h = '';
    if (!s.arr) {
      h = '<div class="pf-row"><button type="button" class="pf-btn big" data-arr>📍 Wir sind da</button><button type="button" class="pf-btn big ghost" data-planb>Plan B</button></div>';
    } else if (!s.joint) {
      const task = { a: x.roles.partnerA.task, b: x.roles.partnerB.task };
      if (relay) {
        const mine = myRole(run, k), other = mine === 'a' ? 'b' : 'a';
        h += '<div class="pf-card secret"><h2>🤫 Nur für dich</h2><p>' + esc(task[mine]) + '</p>' + (s[mine] ? '<span class="pf-chip ok">✓ Geschafft</span>' : '<button type="button" class="pf-btn" data-done="' + mine + '">✓ Geschafft</button>') +
          '<span class="pf-chip' + (s[other] ? ' ok' : '') + '">' + esc(you()) + (s[other] ? ': fertig ✓' : ': noch dabei') + '</span></div>';
        if (s[mine]) h += joint(x);
      } else {
        const names = run.host === (k % 2 === 0) ? { a: me(), b: you() } : { a: you(), b: me() };
        const turn = !s.a ? 'a' : !s.b ? 'b' : null;
        if (turn) h += '<div class="pf-card secret"><h2>🤫 Nur für ' + esc(names[turn]) + '</h2>' + (ui.rev === turn
          ? '<p>' + esc(task[turn]) + '</p><button type="button" class="pf-btn" data-done="' + turn + '">✓ Geschafft' + (turn === 'a' ? ' – weitergeben' : '') + '</button>'
          : '<button type="button" class="pf-btn cover" data-rev="' + turn + '">Aufgabe zeigen</button>') + '</div>';
        else h += joint(x);
      }
    } else {
      const lo = p._lotse[x.id], live = lo && arLive(lo.cand, lo.cfg), got = lo && st().lotsen[lo.cand.id];
      h = '<div class="pf-card ok"><h2>✓ Station geschafft</h2>' +
        (live ? (got ? '<div class="pf-lotse got">' + fimg(lo.cfg.bild) + '<b>Lotsenfalter gefangen</b></div>' : '<button type="button" class="pf-btn" data-lotse>🦋 Lotsenfalter suchen</button>') : '') +
        (k + 1 < r.stops.length ? '<button type="button" class="pf-btn big" data-next>Weiter zu Station ' + (k + 2) + ' ›</button>' : '<button type="button" class="pf-btn big" data-fin>🎉 Zum Abschluss</button>') + '</div>';
    }
    box.innerHTML = h;
    const q = (sel) => box.querySelector(sel);
    if (q('[data-arr]')) q('[data-arr]').onclick = () => { L.haptic && L.haptic(20); set('arr', 'pfad_da'); const el = root.querySelector('#pfAct'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
    box.querySelectorAll('[data-planb]').forEach((b) => { b.onclick = planB; });
    if (q('[data-rev]')) q('[data-rev]').onclick = () => { ui.rev = q('[data-rev]').dataset.rev; rerun(); };
    if (q('[data-done]')) q('[data-done]').onclick = () => { ui.rev = null; set(q('[data-done]').dataset.done, 'pfad_geheim'); };
    if (q('[data-joint]')) q('[data-joint]').onclick = () => { set('joint', 'pfad_station'); stopFinished(run, r, k); };
    if (q('[data-next]')) q('[data-next]').onclick = () => { stack.pop(); go({ v: 'stop', ed: ed.id, route: r.id, k: k + 1 }); };
    if (q('[data-fin]')) q('[data-fin]').onclick = () => finish(ed, p, r, run);
    if (q('[data-lotse]')) q('[data-lotse]').onclick = () => lotse(ed, p, p._lotse[x.id], rerun);
  }
  const joint = (x) => '<div class="pf-card joint"><h2>💞 Zusammen</h2><p>' + esc(x.challenge.instructions) + '</p><div class="pf-row"><button type="button" class="pf-btn" data-joint>✓ Geschafft</button><button type="button" class="pf-btn ghost" data-planb>Plan B</button></div></div>';
  function stopFinished(run, r, k) { L.spawnHearts && L.spawnHearts(10); L.haptic && L.haptic(30); if (window.LZX && window.LZX.feed) { try { window.LZX.feed('pfad', 1); } catch (e) {} } void run; void r; void k; }
  function finish(ed, p, r, run) {
    if (!run.end) { run.end = Date.now(); L.save(); C('pfad_ende'); sync(run); }
    L.spawnHearts && L.spawnHearts(18);
    const th = r.stops.map((x) => pics(ed, p, x)[0]).filter(Boolean);
    L.openSheet('<div class="bfly-party"><h3>🎉 Geschafft!</h3><p class="about" style="font-size:22px;font-weight:700;margin:4px 0 12px">' + esc(r.title) + '</p>' +
      '<div class="pf-fin">' + th.map((q) => '<img src="' + esc(q.src) + '" alt="">').join('') + '</div>' +
      '<div class="row" style="justify-content:center;margin-top:14px"><button class="pill-btn primary" data-ok>Fertig</button></div></div>', (sh) => {
      sh.querySelector('[data-ok]').onclick = () => { L.closeSheet(); stack = [{ v: 'ed', ed: ed.id }]; render(); };
    });
  }

  /* ---------- Fotos groß ---------- */
  let lb = null;
  function lightbox(ph, i) {
    closeLb(); lb = document.createElement('div'); lb.className = 'pf-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Foto');
    const show = () => { lb.innerHTML = '<img src="' + esc(ph[i].src) + '" alt="' + esc(ph[i].alt) + '"><p>' + esc(ph[i].alt) + '</p><button type="button" class="pf-lb-x" aria-label="Schließen">✕</button>' + (ph.length > 1 ? '<button type="button" class="pf-lb-p" aria-label="Vorheriges Foto">‹</button><button type="button" class="pf-lb-n" aria-label="Nächstes Foto">›</button>' : '');
      lb.querySelector('.pf-lb-x').onclick = closeLb; const a = lb.querySelector('.pf-lb-p'), b = lb.querySelector('.pf-lb-n');
      if (a) a.onclick = () => { i = (i + ph.length - 1) % ph.length; show(); }; if (b) b.onclick = () => { i = (i + 1) % ph.length; show(); }; };
    show(); root.appendChild(lb);
  }
  function closeLb() { if (!lb) return false; lb.remove(); lb = null; return true; }

  /* ---------- Lotsenfalter ---------- */
  let simPos = null;
  const dist = (a, b) => { const R = 6371000, t = Math.PI / 180, dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  function locate() {
    if (simPos) return Promise.resolve(simPos);
    return new Promise((res) => {
      if (!('geolocation' in navigator)) return res(null);
      let fin = false; const end = (v) => { if (!fin) { fin = true; res(v); } };
      setTimeout(() => end(null), 12000);
      try { navigator.geolocation.getCurrentPosition((q) => end({ lat: q.coords.latitude, lon: q.coords.longitude, acc: q.coords.accuracy || 999 }), () => end(null), { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }); } catch (e) { end(null); }
    });
  }
  function lotse(ed, p, lo, after) {
    if (!lo || !arLive(lo.cand, lo.cfg)) return; /* Schalter: ohne bestätigte Vorbedingungen kein Falter */
    const sp = p._sp[lo.cfg.species] || { commonNameDe: 'Lotsenfalter' };
    const name = sp.commonNameDe || 'Lotsenfalter';
    const won = (gps) => {
      st().lotsen[lo.cand.id] = { at: Date.now(), sp: lo.cfg.species, gps: gps ? 1 : 0, n: name, ort: lo.cand.title, bild: lo.cfg.bild }; /* 3.58.0: Name, Ort, Bild fürs Schmetterlingsbuch */ L.save(); C('pfad_lotse:' + (gps ? 'ort' : 'hand'));
      L.spawnHearts && L.spawnHearts(14);
      L.openSheet('<div class="bfly-party"><div class="fx-hero">' + fimg(lo.cfg.bild, 'big') + '</div><h3>Gefangen!</h3><p class="fx-name">' + esc(name) + '</p>' +
        (sp.scientificName ? '<p class="about" style="font-size:17px;font-style:italic;margin:2px 0 8px">' + esc(sp.scientificName) + '</p>' : '') +
        '<p class="about" style="font-size:17px;margin:0 0 14px">Lotsenfalter von ' + esc(lo.cand.title) + '</p>' +
        '<div class="row" style="justify-content:center"><button class="pill-btn primary" data-ok>Weiter</button></div></div>', (sh) => { sh.querySelector('[data-ok]').onclick = () => { L.closeSheet(); after(); }; });
    };
    const fangen = (gps) => {
      if (!J() || !J().fangen) return won(gps); /* ohne Fangbildschirm: direkt einsammeln */
      J().fangen(lo.cfg.bild, (yes) => { if (yes) won(gps); else L.toast('🦋 Weggeflattert – tippt nochmal auf „Lotsenfalter suchen“'); }, 'Lotsenfalter', { name, rar: 'Lotsenfalter' });
    };
    L.openSheet('<h3>🦋 Lotsenfalter</h3><div class="pf-warn" style="margin:8px 0 14px"><span aria-hidden="true">⚠️</span><p>Bleibt stehen, wo ihr sicher steht.</p></div>' +
      '<div class="row" style="margin-top:6px"><button class="pill-btn ghost" data-no>Später</button><button class="pill-btn primary" data-go>📍 Suchen</button></div>', (sh) => {
      sh.querySelector('[data-no]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = async () => {
        const b = sh.querySelector('[data-go]'); b.disabled = true; b.textContent = 'Sucht …';
        const pos = await locate();
        const d = pos && typeof lo.cand.lat === 'number' ? dist(pos, lo.cand) : null;
        if (d != null && d <= lo.cfg.radius + Math.min(pos.acc || 0, 150)) { L.closeSheet(); L.toast('📍 Ihr seid am Lotsenpunkt'); setTimeout(() => fangen(true), 250); return; }
        /* Ausweg ohne Standort: Ankunft gilt per Antippen */
        const why = d == null ? 'Das Handy findet gerade keinen Standort.' : 'Laut Handy seid ihr noch ' + (d >= 1000 ? 'ca. ' + String(Math.round(d / 100) / 10).replace('.', ',') + ' km' : 'ca. ' + Math.round(d / 10) * 10 + ' m') + ' entfernt.';
        L.openSheet('<h3>🦋 Lotsenfalter</h3><p class="about" style="font-size:19px">' + esc(why) + '</p><div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-no>Später</button><button class="pill-btn primary" data-hand>Wir sind da</button></div>', (s2) => {
          s2.querySelector('[data-no]').onclick = L.closeSheet;
          s2.querySelector('[data-hand]').onclick = () => { L.closeSheet(); setTimeout(() => fangen(false), 150); };
        });
      };
    });
  }

  /* ---------- Zwei Handys: Stand schicken und zusammenführen ---------- */
  function payload(run) { const o = {}; Object.keys(run.st).forEach((id) => { const s = run.st[id]; o[id] = [s.arr || 0, s.a || 0, s.b || 0, s.joint || 0, s.planB ? 1 : 0]; }); return { v: 1, rid: run.rid, ed: run.ed, route: run.route, t: run.t, st: o, end: run.end || 0 }; }
  async function sync(run) {
    if (!run || run.mode !== 'relay' || !on()) return;
    run.dirty = true; L.save();
    try { await P().send({ t: 'hello', name: S().sender, pron: S().pron || '', pfad: payload(run) }); run.dirty = false; L.save(); } catch (e) { /* ohne Netz: beim nächsten Takt nochmal */ }
  }
  const num = (v) => (typeof v === 'number' && isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const early = (x, y) => (x && y ? Math.min(x, y) : x || y || 0);
  function got(o) {
    if (!o || o.v !== 1 || typeof o.rid !== 'string' || o.rid.length > 24 || !ID.test(o.ed || '') || !ID.test(o.route || '') || !edOf(o.ed)) return;
    const k = key(o.ed, o.route), t = num(o.t); let run = st().runs[k], fresh = false;
    if (!run || (run.rid !== o.rid && t > (run.t || 0))) { run = st().runs[k] = { rid: o.rid, ed: o.ed, route: o.route, mode: 'relay', host: false, t, st: {}, end: 0, dirty: false }; fresh = true; }
    else if (run.rid !== o.rid) return; /* meine Runde ist neuer – mein nächster Stand stellt die andere Seite um */
    if (run.mode !== 'relay') run.mode = 'relay';
    let ch = fresh;
    Object.keys(o.st && typeof o.st === 'object' ? o.st : {}).slice(0, 24).forEach((id) => {
      const a = o.st[id]; if (!ID.test(id) || !Array.isArray(a)) return;
      const s = ss(run, id), n = { arr: early(s.arr, num(a[0])), a: early(s.a, num(a[1])), b: early(s.b, num(a[2])), joint: early(s.joint, num(a[3])), planB: s.planB || a[4] ? 1 : 0 };
      if (n.arr !== s.arr || n.a !== s.a || n.b !== s.b || n.joint !== s.joint || n.planB !== s.planB) { Object.assign(s, n); ch = true; }
    });
    if (num(o.end) && !run.end) { run.end = num(o.end); ch = true; }
    /* weiß ich mehr als die andere Seite (eine Nachricht ging verloren), bekommt sie meinen ganzen Stand zurück – gleiche Stände lösen nichts aus */
    const mine = payload(run), theirs = o.st && typeof o.st === 'object' ? o.st : {};
    if ((mine.end && !num(o.end)) || Object.keys(mine.st).some((id) => { const a = Array.isArray(theirs[id]) ? theirs[id] : []; return mine.st[id].some((v, i) => v && !num(a[i])); })) setTimeout(() => sync(run), 0);
    if (!ch) return;
    L.save();
    if (fresh) { L.toast('🧭 ' + you() + ' hat eine Liebespfade-Route gestartet'); homeTile(); }
    /* offenes Fenster: nur den beweglichen Teil neu zeichnen, nie die ganze Seite */
    const v = cur(); if (root && v && v.ed === o.ed && v.route === o.route) { if (v.v === 'stop') { const p = packs[o.ed]; const r = p && p.routes.find((x) => x.id === o.route); if (r) act(edOf(o.ed), p, r, v.k); } else if (v.v === 'route' && fresh) render(); }
  }
  function beat() {
    if (!root || document.hidden || !on() || (navigator.onLine === false)) return;
    const runs = Object.values(st().runs).filter((r) => r && r.mode === 'relay');
    if (!runs.length) return;
    runs.filter((r) => r.dirty).forEach(sync);
    if (runs.some((r) => !r.end) && P().pull) P().pull(true, true);
  }
  window.addEventListener('online', () => { Object.values(st().runs).filter((r) => r && r.dirty).forEach(sync); });

  /* ---------- Einstieg auf „Heute“: nur wenn eine Route läuft ---------- */
  function homeTile() {
    const host = document.getElementById('view-home'); if (!host) return;
    let el = document.getElementById('pfadeHome'); const a = available() ? active() : null;
    if (!a) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'pfadeHome'; el.className = 'tiles one'; const ref = host.querySelector('#giftRadar'); if (ref) host.insertBefore(el, ref); else host.appendChild(el); }
    el.innerHTML = '<button type="button" class="tile" data-go="pfade"><span class="tile-i">🧭</span><span class="tile-t">Liebespfade – weiter</span></button>';
  }

  /* ---------- Stil ---------- */
  function css() {
    if (document.getElementById('pfade-css')) return;
    const s = document.createElement('style'); s.id = 'pfade-css';
    s.textContent = '.pfade{position:fixed;inset:0;z-index:8700;background:linear-gradient(180deg,var(--bg1,#2d1133) 0%,var(--bg0,#1a0a1e) 60%);color:var(--text,#fff1f5);display:flex;flex-direction:column;font:500 19px/1.5 var(--sans,Lato,sans-serif)}' +
      '.pfade *{box-sizing:border-box}.pfade button{font-family:inherit;color:inherit;cursor:pointer}.pfade h1,.pfade h2,.pfade p{margin:0}' +
      '.pf-top{display:flex;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;flex:none}' +
      '.pf-back{width:50px;height:50px;border-radius:25px;border:0;background:rgba(255,255,255,.14);font-size:30px;line-height:1;flex:none;padding:0 0 4px}' +
      '.pf-h{flex:1;font-size:22px;font-weight:700;line-height:1.2;min-width:0}.pf-topr{flex:none}' +
      '.pf-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 16px calc(28px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:16px;outline:0}' +
      '.pf-body>*{flex:none;width:100%;max-width:640px;margin-left:auto;margin-right:auto}.pf-wait{text-align:center;padding:40px 0}' +
      '.pf-chip{display:inline-flex;align-items:center;min-height:32px;padding:3px 12px;border-radius:16px;background:rgba(255,255,255,.14);font-size:16px;font-weight:700;line-height:1.2;border:0}' +
      '.pf-chip.ok{background:#1f6b4a;color:#fff}.pf-chip.warn{background:#7a4b00;color:#fff;min-height:44px}.pf-chip.draft{background:#ffd166;color:#2a1004}' +
      '.pf-hero{position:relative;border-radius:20px;overflow:hidden;aspect-ratio:16/10;background:rgba(255,255,255,.08)}.pf-hero img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.pf-hero-t{position:absolute;left:0;right:0;bottom:0;padding:40px 16px 14px;background:linear-gradient(180deg,transparent,rgba(10,4,14,.88));display:flex;flex-direction:column;align-items:flex-start;gap:8px}' +
      '.pf-hero h1{font-size:26px;font-weight:700;line-height:1.2;color:#fff}' +
      '.pf-btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:10px 20px;border-radius:26px;border:2px solid var(--text,#fff1f5);background:var(--text,#fff1f5);color:var(--bg0,#1a0a1e)!important;font-size:19px;font-weight:700;line-height:1.25;text-align:center;flex:1 1 auto}' +
      '.pf-btn.big{min-height:60px;font-size:20px;border-radius:30px}.pf-btn.ghost{background:transparent;color:var(--text,#fff1f5)!important;border-color:rgba(255,255,255,.7);flex:0 1 auto}' +
      '.pf-btn.cover{min-height:96px;background:transparent;color:var(--text,#fff1f5)!important;border:2px dashed rgba(255,255,255,.7)}' +
      '.pf-btn:active{transform:scale(.98)}.pf-btn:disabled{opacity:.6}' +
      '.pf-row{display:flex;gap:12px;flex-wrap:wrap}.pf-link{background:none;border:0;min-height:48px;font-size:17px;font-weight:700;text-decoration:underline;text-underline-offset:4px;align-self:center}' +
      '.pf-list{display:flex;flex-direction:column;gap:16px}' +
      '.pf-route{display:flex;flex-direction:column;padding:0;border:1px solid var(--line-soft,rgba(255,150,180,.18));border-radius:20px;overflow:hidden;background:rgba(255,255,255,.06);text-align:left}' +
      '.pf-route img{width:100%;aspect-ratio:16/8;object-fit:cover;display:block}.pf-route-b{display:flex;flex-direction:column;gap:10px;padding:14px 16px 16px}.pf-route-b>b{font-size:22px;font-weight:700;line-height:1.25}' +
      '.pf-facts{display:flex;gap:12px;flex-wrap:wrap}.pf-facts>span{display:flex;align-items:baseline;gap:6px;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.1);font-size:19px;font-weight:700;font-variant-numeric:tabular-nums}' +
      '.pf-facts i{font-style:normal}.pf-facts small{font-size:16px;font-weight:500}.pf-moods{display:flex;gap:8px;flex-wrap:wrap}' +
      '.pf-lead,.pf-text{font-size:19px;line-height:1.5}' +
      '.pf-stops{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}' +
      '.pf-stops button{width:100%;display:flex;align-items:center;gap:12px;padding:10px 12px;min-height:76px;border-radius:18px;border:1px solid var(--line-soft,rgba(255,150,180,.18));background:rgba(255,255,255,.06);text-align:left}' +
      '.pf-stops button.now{border:2px solid var(--text,#fff1f5)}.pf-stops img{width:64px;height:56px;border-radius:10px;object-fit:cover;flex:none}.pf-stops b{font-size:19px;font-weight:700;line-height:1.25}' +
      '.pf-num{width:36px;height:36px;border-radius:18px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-weight:700;flex:none;font-variant-numeric:tabular-nums}.pf-stops .done .pf-num{background:#1f6b4a;color:#fff}' +
      '.pf-gal{position:relative;margin:0 -16px;width:auto!important;max-width:none!important}.pf-gal-in{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}.pf-gal-in::-webkit-scrollbar{display:none}' +
      '.pf-gal-in button{flex:0 0 100%;scroll-snap-align:center;padding:0;border:0;background:#120716;aspect-ratio:4/3;max-height:56vh}.pf-gal-in img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.pf-gal-n{position:absolute;right:12px;bottom:12px;padding:4px 12px;border-radius:14px;background:rgba(10,4,14,.82);color:#fff;font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}' +
      '.pf-title{font-size:26px;font-weight:700;line-height:1.25}' +
      '.pf-card{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:20px;background:rgba(255,255,255,.08);border:1px solid var(--line-soft,rgba(255,150,180,.18))}.pf-card h2{font-size:22px;font-weight:700;line-height:1.25}' +
      '.pf-card p{font-size:20px;line-height:1.5}.pf-card.secret{border:2px solid #b388ff}.pf-card.joint{border:2px solid #ff85a1}.pf-card.ok{border:2px solid #4fc08d}.pf-card .pf-chip{align-self:flex-start}' +
      '#pfAct{display:flex;flex-direction:column;gap:16px}#pfAct:empty{display:none}' +
      '.pf-story{padding:4px 0 4px 16px;border-left:4px solid #ff85a1}.pf-story h2{font-size:19px;font-weight:700;margin-bottom:6px}.pf-story p{font-size:19px;line-height:1.55}' +
      '.pf-warn{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;background:rgba(242,193,78,.16);border:1px solid rgba(242,193,78,.7);text-align:left}.pf-warn p{font-size:18px;font-weight:700;line-height:1.45;margin:0}' +
      '.pf-more{border-radius:18px;background:rgba(255,255,255,.06);border:1px solid var(--line-soft,rgba(255,150,180,.18));padding:0 16px}.pf-more summary{min-height:56px;display:flex;align-items:center;justify-content:space-between;font-size:20px;font-weight:700;cursor:pointer;list-style:none}' +
      '.pf-more summary::-webkit-details-marker{display:none}.pf-more summary::after{content:"▾";font-size:22px}.pf-more[open] summary::after{content:"▴"}.pf-more>*:last-child{margin-bottom:16px}' +
      '.pf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pf-grid div{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.1)}.pf-grid small{font-size:16px;font-weight:500}.pf-grid b{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums}' +
      '.pf-stars{letter-spacing:2px;color:#ffd166}.pf-stars i{font-style:normal;color:rgba(255,255,255,.35)}' +
      '.pf-more ul{margin:14px 0 0;padding-left:22px;display:flex;flex-direction:column;gap:8px}.pf-more li{font-size:18px;line-height:1.45}.pf-small{font-size:16px!important;margin-top:12px!important}' +
      '.pf-src{display:flex;align-items:center;min-height:48px;margin-top:6px;font-size:16px;font-weight:700;color:var(--text,#fff1f5);text-decoration:underline;text-underline-offset:4px}' +
      '.pf-lotsen{display:flex;gap:12px}.pf-lotsen>span{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}.pf-lotsen i{width:64px;height:64px;border-radius:50%;border:3px dashed rgba(255,255,255,.55)}.pf-lotsen .fx-img{width:64px;height:64px}.pf-lotsen small{font-size:16px;font-weight:700;line-height:1.2}' +
      '.pf-lotse.got{display:flex;align-items:center;gap:12px}.pf-lotse .fx-img{width:56px;height:56px;flex:none}' +
      '.pf-fin{display:flex;gap:8px;justify-content:center}.pf-fin img{width:30%;aspect-ratio:1;object-fit:cover;border-radius:14px}' +
      '.pf-lb{position:absolute;inset:0;z-index:5;background:#0a040e;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:calc(64px + env(safe-area-inset-top)) 0 calc(24px + env(safe-area-inset-bottom))}' +
      '.pf-lb img{max-width:100%;max-height:100%;min-height:0;flex:1;object-fit:contain}.pf-lb p{padding:0 64px;font-size:17px;text-align:center;color:#fff}' +
      '.pf-lb button{position:absolute;width:52px;height:52px;border-radius:26px;border:0;background:rgba(255,255,255,.2);color:#fff;font-size:26px;line-height:1}.pf-lb-x{right:12px;top:calc(10px + env(safe-area-inset-top))}.pf-lb-p{left:8px;bottom:calc(14px + env(safe-area-inset-bottom))}.pf-lb-n{right:8px;bottom:calc(14px + env(safe-area-inset-bottom))}' +
      'html.pfade-open #modal{z-index:9500}html.pfade-open .toast,html.pfade-open #toast{z-index:9600}html.pfade-open .floating-hearts{z-index:9550}';
    document.head.appendChild(s);
  }

  homeTile();
  window.LZPF = { open, close, available, got, active, EDITIONS,
    /* Prüfhilfen */ arOpen, arLive, _st: st, _pack: (id) => packs[id], _load: (id) => load(edOf(id)), _off: () => off,
    /* nur am PC: Standort vortäuschen, z. B. LZPF.sim(28.11741, -14.2598); LZPF.sim() hebt es auf */
    sim: (lat, lon, acc) => { simPos = LOCAL && typeof lat === 'number' ? { lat, lon, acc: acc || 10 } : null; return simPos; } };
})();
