/* Schmetterlingsfutter – Spiele zu zweit (3.24.0, Welle 1)
   Sammlung „🎲 Spiele“ mit Gruppen Gegeneinander / Miteinander / Täglich und vier neuen Spielen:
   - Zwei Wahrheiten, eine Lüge   - Satz für Satz (gemeinsame Geschichte)
   - Schmetterlinge fangen (Tagesduell, gleiche Runde für beide)   - Schnitzeljagd (Hinweise öffnen sich nach und nach)
   Nachrichtenart „game“ (Ende-zu-Ende verschlüsselt wie alles andere). Duelle zeigen Kronen, nie Verlierer-Sprüche. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const S = () => L.S, P = () => window.LZP;
  const $ = (id) => document.getElementById(id), esc = L.esc;
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const C = (k) => window.LZS && window.LZS.count(k);
  const on = () => !!(P() && P().paired() && P().joined());
  const you = () => (P() ? P().partnerName() : S().receiver);
  const day = () => L.todayKey();
  const weekOf = (d) => { const t = Date.parse(d + 'T12:00:00'); return Math.floor((t / 864e5 + 3) / 7); };

  function games() { const s = S(); if (!s.games) s.games = {}; return s.games; }
  function score(kind) { const s = S(); if (!s.gscore) s.gscore = {}; return s.gscore[kind] || (s.gscore[kind] = { me: 0, them: 0 }); }
  async function send(obj) { return P().send(Object.assign({ t: 'game' }, obj)); }
  function needPair() {
    if (on()) return false;
    L.openSheet('<h3>💞 Erst verbinden</h3><p class="about" style="font-size:17px;margin-bottom:14px">Dieses Spiel läuft über eure beiden Handys. Verbindet eure Apps, dann geht es los.</p><div class="row"><button class="pill-btn ghost" data-cancel>Später</button><button class="pill-btn primary" data-go>Jetzt verbinden</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet; sh.querySelector('[data-go]').onclick = () => { L.closeSheet(); P().pairSheet(); };
    });
    return true;
  }
  function inboxNote(g, text) {
    const s = S(); if (!s.inbox) s.inbox = [];
    s.inbox = s.inbox.filter((m) => !(m.t === 'game' && m.gid === g.id));
    s.inbox.push({ id: uid('m'), t: 'game', gid: g.id, text, at: Date.now(), read: false });
  }
  function markRead(gid) { const s = S(); let hit = false; (s.inbox || []).forEach((m) => { if (m.t === 'game' && m.gid === gid && !m.read) { m.read = true; hit = true; } }); if (hit) { L.save(); P().renderAll(); } }
  const META = {
    luege: { icon: '🕵️', title: 'Zwei Wahrheiten, eine Lüge' },
    story: { icon: '📖', title: 'Satz für Satz' },
    jagd: { icon: '🗺️', title: 'Schnitzeljagd' },
    fang: { icon: '🦋', title: 'Schmetterlinge fangen' }
  };

  /* ======================= Zwei Wahrheiten, eine Lüge ======================= */
  function luegeNew() {
    if (needPair()) return;
    L.openSheet('<h3>🕵️ Zwei Wahrheiten, eine Lüge</h3><p class="about" style="font-size:17px;margin-bottom:10px">Schreib drei Sätze über dich. Zwei stimmen, einer ist geflunkert. ' + esc(you()) + ' muss die Lüge finden.</p>' +
      [1, 2, 3].map((i) => '<div class="field lg-row"><label for="lg' + i + '">Satz ' + i + '</label><input id="lg' + i + '" maxlength="110" autocomplete="off" placeholder="' + ['z. B. Ich war schon mal auf einem Kamel.', 'z. B. Ich kann pfeifen wie ein Vogel.', 'z. B. Ich habe als Kind Schnecken gesammelt.'][i - 1] + '"><label class="lg-lie"><input type="radio" name="lgLie" value="' + (i - 1) + '"' + (i === 3 ? ' checked' : '') + '> Das ist die Lüge</label></div>').join('') +
      '<div class="row" style="margin-top:8px"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-go>Rätsel schicken 🕵️</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = async (e) => {
        const items = [1, 2, 3].map((i) => sh.querySelector('#lg' + i).value.trim());
        if (items.some((x) => x.length < 3)) { L.toast('Bitte alle drei Sätze ausfüllen'); return; }
        const lie = Number(sh.querySelector('input[name="lgLie"]:checked').value);
        /* Reihenfolge mischen, damit die Position nichts verrät */
        const order = [0, 1, 2].sort(() => Math.random() - 0.5); const shuffled = order.map((i) => items[i]); const lieAt = order.indexOf(lie);
        const g = { id: uid('g'), kind: 'luege', mine: true, turn: 'them', created: Date.now(), updated: Date.now(), data: { items: shuffled, lie: lieAt } };
        e.currentTarget.disabled = true;
        try { await send({ g: 'luege', id: g.id, op: 'new', items: shuffled, lie: lieAt }); games()[g.id] = g; L.save(); L.closeSheet(); L.toast('🕵️ Rätsel ist bei ' + you()); C('game_new:luege'); renderHub(); P().renderAll(); }
        catch (err) { e.currentTarget.disabled = false; L.toast('Senden fehlgeschlagen – später nochmal'); }
      };
    });
  }
  function luegePlay(g) {
    markRead(g.id);
    if (g.turn === 'done' || g.mine) return luegeView(g);
    L.openSheet('<h3>🕵️ Welche ist die Lüge?</h3><p class="about" style="font-size:17px;margin-bottom:12px">' + esc(you()) + ' hat dir drei Sätze geschickt. Zwei stimmen. Tipp auf die Lüge:</p>' +
      g.data.items.map((t, i) => '<button type="button" class="lg-pick" data-i="' + i + '">' + esc(t) + '</button>').join('') +
      '<div class="row" style="margin-top:10px"><button class="pill-btn ghost" data-cancel>Später</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('.lg-pick').forEach((b) => b.onclick = async () => {
        const pick = Number(b.dataset.i), ok = pick === g.data.lie;
        sh.querySelectorAll('.lg-pick').forEach((x) => { x.disabled = true; const i = Number(x.dataset.i); x.classList.add(i === g.data.lie ? 'lie' : 'true'); if (i === pick) x.classList.add('picked'); });
        const res = document.createElement('div'); res.className = 'lg-res';
        res.innerHTML = ok ? '<b>🕵️ Erwischt!</b> Du hast ' + esc(you()) + ' durchschaut.' : '<b>😄 Reingelegt!</b> ' + esc(you()) + ' hat dich an der Nase herumgeführt.';
        sh.querySelector('.row').before(res); L.haptic(ok ? 25 : 10); if (ok) L.spawnHearts(8);
        g.turn = 'done'; g.updated = Date.now(); g.data.pick = pick; const sc = score('luege'); if (ok) sc.me++; else sc.them++; L.save();
        try { await send({ g: 'luege', id: g.id, op: 'guess', pick }); } catch (e) {}
        C('game_done:luege'); renderHub(); P().renderAll();
        const row = sh.querySelector('.row'); row.innerHTML = '<button class="pill-btn ghost" data-cancel>Schließen</button><button class="pill-btn primary" data-again>Jetzt du – drei Sätze schicken</button>';
        row.querySelector('[data-cancel]').onclick = L.closeSheet; row.querySelector('[data-again]').onclick = () => { L.closeSheet(); setTimeout(luegeNew, 80); };
      });
    });
  }
  function luegeView(g) {
    const done = g.turn === 'done', sc = score('luege');
    L.openSheet('<h3>🕵️ Zwei Wahrheiten, eine Lüge</h3>' +
      g.data.items.map((t, i) => '<div class="lg-pick ' + (done || g.mine ? (i === g.data.lie ? 'lie' : 'true') : '') + (done && i === g.data.pick ? ' picked' : '') + '">' + esc(t) + '</div>').join('') +
      '<p class="about" style="font-size:17px;margin:10px 0">' + (done ? (g.data.pick === g.data.lie ? (g.mine ? '🕵️ ' + esc(you()) + ' hat dich durchschaut.' : '🕵️ Du hast es erkannt.') : (g.mine ? '😄 ' + esc(you()) + ' ist darauf reingefallen.' : '😄 Da hat ' + esc(you()) + ' dich reingelegt.')) : '⏳ ' + esc(you()) + ' rätselt noch.') + '</p>' +
      '<div class="lg-score">Durchschaut: Du ' + sc.me + ' · ' + esc(you()) + ' ' + sc.them + '</div>' +
      '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button><button class="pill-btn primary" data-again>Neues Rätsel</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet; sh.querySelector('[data-again]').onclick = () => { L.closeSheet(); setTimeout(luegeNew, 80); };
    });
  }

  /* ======================= Satz für Satz ======================= */
  const STARTS = ['Es war einmal ein Schmetterling, der sich in eine Gießkanne verliebt hatte.', 'Als wir an diesem Morgen aufwachten, stand ein Kamel im Garten.', 'Papillon hatte einen Plan, und der war ziemlich verrückt.', 'Auf dem Dachboden fanden wir eine Karte mit einem roten Kreuz.', 'Der Kühlschrank fing plötzlich an zu singen.', 'Im Urlaub verwechselten wir unseren Koffer mit dem eines Zauberers.', 'An einem verregneten Sonntag klingelte es dreimal an der Tür.', 'Niemand wusste, warum die Katze eine Sonnenbrille trug.'];
  const STORY_MAX = 10;
  function storyNew() {
    if (needPair()) return;
    L.openSheet('<h3>📖 Satz für Satz</h3><p class="about" style="font-size:17px;margin-bottom:10px">Ihr schreibt abwechselnd eine Geschichte, jeder einen Satz, 10 Sätze lang. Am Ende wird sie zur Bildkarte.</p>' +
      '<div class="field"><label for="stFirst">Der erste Satz</label><textarea id="stFirst" maxlength="160" rows="3"></textarea></div><button type="button" class="pill-btn small ghost" data-dice>🎲 Anfang würfeln</button>' +
      '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-go>Losschreiben ✍️</button></div>', (sh) => {
      const ta = sh.querySelector('#stFirst'); ta.value = STARTS[Math.floor(Math.random() * STARTS.length)];
      sh.querySelector('[data-dice]').onclick = () => { ta.value = STARTS[Math.floor(Math.random() * STARTS.length)]; };
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = async (e) => {
        const t = ta.value.trim(); if (t.length < 3) { L.toast('Erst einen Satz schreiben'); return; }
        const g = { id: uid('g'), kind: 'story', mine: true, turn: 'them', created: Date.now(), updated: Date.now(), data: { lines: [{ by: 'me', t }] } };
        e.currentTarget.disabled = true;
        try { await send({ g: 'story', id: g.id, op: 'add', n: 0, text: t }); games()[g.id] = g; L.save(); L.closeSheet(); L.toast('📖 ' + you() + ' schreibt weiter'); C('game_new:story'); renderHub(); P().renderAll(); }
        catch (err) { e.currentTarget.disabled = false; L.toast('Senden fehlgeschlagen – später nochmal'); }
      };
    });
  }
  function storyText(g) { return g.data.lines.map((l) => l.t).join(' '); }
  function storyOpen(g) {
    markRead(g.id); const lines = g.data.lines, done = g.turn === 'done' || lines.length >= STORY_MAX;
    L.openSheet('<h3>📖 Satz für Satz</h3><div class="story">' + lines.map((l) => '<span class="st-' + l.by + '">' + esc(l.t) + ' </span>').join('') + '</div>' +
      '<div class="st-count">' + lines.length + ' von ' + STORY_MAX + ' Sätzen · <span class="st-me">du</span> · <span class="st-them">' + esc(you()) + '</span></div>' +
      (done ? '<div class="row wrap" style="margin-top:12px"><button class="pill-btn primary" data-card>🖼️ Als Bildkarte teilen</button><button class="pill-btn" data-new>Neue Geschichte</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>'
        : g.turn === 'me' ? '<div class="field" style="margin-top:12px"><label for="stNext">Dein Satz</label><textarea id="stNext" maxlength="160" rows="3" placeholder="Wie geht es weiter?"></textarea></div><div class="row"><button class="pill-btn ghost" data-cancel>Später</button><button class="pill-btn primary" data-go>Satz schicken ✍️</button></div>'
          : '<p class="about" style="font-size:17px;margin-top:12px">⏳ ' + esc(you()) + ' ist mit dem nächsten Satz dran.</p><div class="row"><button class="pill-btn ghost" data-cancel>Schließen</button></div>'), (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const nw = sh.querySelector('[data-new]'); if (nw) nw.onclick = () => { L.closeSheet(); setTimeout(storyNew, 80); };
      const cd = sh.querySelector('[data-card]'); if (cd) cd.onclick = () => { C('game_share:story'); if (window.LZX) window.LZX.shareCard({ text: storyText(g), label: 'Unsere Geschichte', sig: S().sender + ' & ' + you() }); else L.shareText(storyText(g)); };
      const go = sh.querySelector('[data-go]'); if (go) go.onclick = async () => {
        const t = sh.querySelector('#stNext').value.trim(); if (t.length < 2) { L.toast('Erst einen Satz schreiben'); return; }
        go.disabled = true;
        try {
          await send({ g: 'story', id: g.id, op: 'add', n: lines.length, text: t });
          lines.push({ by: 'me', t }); g.updated = Date.now(); g.turn = lines.length >= STORY_MAX ? 'done' : 'them'; L.save(); C('game_turn:story');
          if (g.turn === 'done') { L.spawnHearts(12); L.toast('📖 Eure Geschichte ist fertig!'); }
          L.closeSheet(); renderHub(); P().renderAll(); if (g.turn === 'done') setTimeout(() => storyOpen(g), 200);
        } catch (e) { go.disabled = false; L.toast('Senden fehlgeschlagen – später nochmal'); }
      };
    });
  }

  /* ======================= Schnitzeljagd ======================= */
  const GAPS = [[0, 'sofort alle'], [10, 'alle 10 Minuten einer'], [60, 'jede Stunde einer']];
  function jagdNew() {
    if (needPair()) return;
    L.openSheet('<h3>🗺️ Schnitzeljagd</h3><p class="about" style="font-size:17px;margin-bottom:10px">Versteck eine kleine Überraschung, zum Beispiel einen Zettel, Schokolade oder einen Gutschein, und schreib bis zu drei Hinweise. ' + esc(you()) + ' bekommt sie nach und nach.</p>' +
      [1, 2, 3].map((i) => '<div class="field"><label for="jg' + i + '">Hinweis ' + i + (i === 1 ? '' : ' (optional)') + '</label><input id="jg' + i + '" maxlength="140" autocomplete="off" placeholder="' + ['Es ist warm und weich …', 'Dort, wo morgens Kaffee duftet.', 'Schau mal unter der zweiten Tasse.'][i - 1] + '"></div>').join('') +
      '<div class="field"><label>Hinweise öffnen sich</label><div class="chips" id="jgGap">' + GAPS.map((g, i) => '<button type="button" class="chip' + (i === 1 ? ' on' : '') + '" data-g="' + g[0] + '">' + g[1] + '</button>').join('') + '</div></div>' +
      '<div class="row" style="margin-top:8px"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-go>Jagd starten 🗺️</button></div>', (sh) => {
      let gap = 10;
      sh.querySelectorAll('#jgGap .chip').forEach((b) => b.onclick = () => { gap = Number(b.dataset.g); sh.querySelectorAll('#jgGap .chip').forEach((x) => x.classList.toggle('on', x === b)); });
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = async (e) => {
        const hints = [1, 2, 3].map((i) => sh.querySelector('#jg' + i).value.trim()).filter(Boolean);
        if (!hints.length) { L.toast('Mindestens ein Hinweis'); return; }
        const g = { id: uid('g'), kind: 'jagd', mine: true, turn: 'them', created: Date.now(), updated: Date.now(), data: { hints, gap } };
        e.currentTarget.disabled = true;
        try { await send({ g: 'jagd', id: g.id, op: 'new', hints, gap }); games()[g.id] = g; L.save(); L.closeSheet(); L.toast('🗺️ Die Jagd beginnt für ' + you()); C('game_new:jagd'); renderHub(); P().renderAll(); }
        catch (err) { e.currentTarget.disabled = false; L.toast('Senden fehlgeschlagen – später nochmal'); }
      };
    });
  }
  function jagdOpen(g) {
    markRead(g.id); const d = g.data, n = d.hints.length;
    const open = g.mine || g.turn === 'done' ? n : Math.min(n, 1 + (d.gap ? Math.floor((Date.now() - g.created) / (d.gap * 60000)) : n));
    const nextIn = (!g.mine && open < n) ? Math.ceil((g.created + open * d.gap * 60000 - Date.now()) / 60000) : 0;
    L.openSheet('<h3>🗺️ Schnitzeljagd' + (g.mine ? ' für ' + esc(you()) : '') + '</h3>' +
      d.hints.map((h, i) => '<div class="jg-hint' + (i < open ? '' : ' locked') + '"><span>' + (i + 1) + '</span>' + (i < open ? esc(h) : '🔒 öffnet sich ' + (i === open ? 'in ' + nextIn + ' Min.' : 'später')) + '</div>').join('') +
      (g.turn === 'done' ? '<p class="about" style="font-size:17px;margin:10px 0">🎉 Gefunden!</p><div class="row"><button class="pill-btn ghost" data-cancel>Schließen</button><button class="pill-btn primary" data-new>Selbst etwas verstecken</button></div>'
        : g.mine ? '<p class="about" style="font-size:17px;margin:10px 0">⏳ ' + esc(you()) + ' sucht noch …</p><div class="row"><button class="pill-btn ghost" data-cancel>Schließen</button></div>'
          : '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Weitersuchen</button><button class="pill-btn primary" data-found>Gefunden! 🎉</button></div>'), (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const nw = sh.querySelector('[data-new]'); if (nw) nw.onclick = () => { L.closeSheet(); setTimeout(jagdNew, 80); };
      const fd = sh.querySelector('[data-found]'); if (fd) fd.onclick = async () => {
        fd.disabled = true; g.turn = 'done'; g.updated = Date.now(); L.save();
        try { await send({ g: 'jagd', id: g.id, op: 'found' }); } catch (e) {}
        C('game_done:jagd'); L.closeSheet(); L.spawnHearts(16); L.toast('🎉 Gefunden! ' + you() + ' bekommt Bescheid'); renderHub(); P().renderAll();
      };
    });
  }

  /* ======================= Schmetterlinge fangen ======================= */
  const FANG_SECS = 30, FANG_TRIES = 3;
  function fangState() {
    const s = S(); if (!s.fang) s.fang = { days: {} };
    const k = day(); if (!s.fang.days[k]) s.fang.days[k] = { me: null, them: null, tries: 0 };
    Object.keys(s.fang.days).sort().slice(0, -21).forEach((x) => delete s.fang.days[x]);
    return s.fang;
  }
  function fangWeek() {
    const f = fangState(), wk = weekOf(day()); let me = 0, them = 0;
    Object.keys(f.days).forEach((k) => { if (weekOf(k) !== wk || k === day()) return; const d = f.days[k]; if (d.me == null || d.them == null) return; if (d.me > d.them) me++; else if (d.them > d.me) them++; });
    return { me, them };
  }
  /* gleiche Runde für beide: Zufall aus dem Datum */
  function rng(seedStr) { let h = 2166136261; for (const c of seedStr) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  function fangSpawns() {
    const r = rng('fang|' + day()); const out = []; let t = 0.4;
    while (t < FANG_SECS - 0.6) {
      const x = r(); const kind = x < 0.08 ? 'gold' : x < 0.22 ? 'bee' : 'b';
      out.push({ t, kind, y: 0.12 + r() * 0.7, dir: r() < 0.5 ? 1 : -1, speed: 0.16 + r() * 0.16 + t / FANG_SECS * 0.14, amp: 0.03 + r() * 0.07, f: 1.5 + r() * 2.5, hue: [0, 40, 95, 150, 200, 260, 310][Math.floor(r() * 7)] });
      t += 0.45 + r() * 0.5 - t / FANG_SECS * 0.2;
    }
    return out;
  }
  function fangOpen() {
    const f = fangState(), d = f.days[day()], wk = fangWeek(), name = esc(you());
    const left = FANG_TRIES - d.tries;
    L.openSheet('<h3>🦋 Schmetterlinge fangen</h3><p class="about" style="font-size:17px;margin-bottom:10px">30 Sekunden: Tipp die Schmetterlinge an. 🌟 Goldene zählen 5, 🐝 Bienen kosten 3 Punkte. Heute bekommt ihr beide dieselbe Runde, dein bester von 3 Versuchen zählt.</p>' +
      '<div class="fg-duel"><div><span>Du</span><b>' + (d.me == null ? '–' : d.me) + '</b></div><div class="vs">heute</div><div><span>' + name + '</span><b>' + (d.them == null ? '–' : (d.me == null ? '🙈' : d.them)) + '</b></div></div>' +
      (d.them != null && d.me == null ? '<p class="about" style="text-align:center;margin:6px 0">' + name + ' hat schon vorgelegt. Die Punktzahl siehst du nach deinem Versuch.</p>' : '') +
      '<div class="fg-week">👑 Diese Woche: Du ' + wk.me + ' · ' + name + ' ' + wk.them + '</div>' +
      '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button>' + (left > 0 ? '<button class="pill-btn primary" data-go>Los! (' + left + ' ' + (left === 1 ? 'Versuch' : 'Versuche') + ')</button>' : '<button class="pill-btn" disabled>Morgen gibt es neue Versuche</button>') + '</div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const go = sh.querySelector('[data-go]'); if (go) go.onclick = () => { L.closeSheet(); setTimeout(fangPlay, 120); };
    });
  }
  function fangPlay() {
    const f = fangState(), d = f.days[day()]; if (d.tries >= FANG_TRIES) return fangOpen();
    d.tries++; L.save(); C('game_play:fang');
    const root = document.createElement('div'); root.className = 'fang'; root.innerHTML = '<canvas></canvas><div class="fg-hud"><span class="fg-pts">0</span><span class="fg-time">30</span></div><button type="button" class="icon-btn fg-x" aria-label="Abbrechen">✕</button>';
    document.body.appendChild(root); document.documentElement.classList.add('cam-open');
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = () => root.clientWidth, H = () => root.clientHeight;
    const fit = () => { cv.width = W() * dpr; cv.height = H() * dpr; cv.style.width = W() + 'px'; cv.style.height = H() + 'px'; }; fit();
    const spr = {};
    const sprite = (ch, hue) => { const k = ch + hue; if (spr[k]) return spr[k]; const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); try { if (hue) x.filter = 'hue-rotate(' + hue + 'deg) saturate(1.5)'; } catch (e) {} x.font = '78px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 48, 52); return (spr[k] = c); };
    const list = fangSpawns().map((s) => Object.assign({ hit: false }, s)); const pops = [];
    let pts = 0, t0 = performance.now(), raf = 0, over = false;
    const posOf = (s, t) => { const e = t - s.t; const x = s.dir > 0 ? -0.1 + e * s.speed : 1.1 - e * s.speed; return { x: x * W(), y: (s.y + Math.sin(e * s.f) * s.amp) * H(), e }; };
    const size = () => Math.max(46, Math.min(W(), H()) * 0.12);
    function draw() {
      const t = (performance.now() - t0) / 1000; if (t >= FANG_SECS) return end();
      raf = requestAnimationFrame(draw);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W(), H());
      const sz = size();
      list.forEach((s) => {
        if (s.hit || t < s.t) return; const p = posOf(s, t); if (p.x < -sz * 2 || p.x > W() + sz * 2) return;
        const flap = 0.35 + 0.65 * Math.abs(Math.cos(t * (s.kind === 'bee' ? 18 : 10) + s.t));
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s.kind === 'bee' ? 1 : flap * (s.dir > 0 ? 1 : -1), 1);
        const im = s.kind === 'bee' ? sprite('🐝', 0) : sprite('🦋', s.kind === 'gold' ? 0 : s.hue);
        if (s.kind === 'gold') { ctx.shadowColor = '#ffd84d'; ctx.shadowBlur = 24; }
        ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      });
      for (let i = pops.length - 1; i >= 0; i--) { const q = pops[i]; const a = 1 - (t - q.t) / 0.8; if (a <= 0) { pops.splice(i, 1); continue; } ctx.globalAlpha = a; ctx.fillStyle = q.v > 0 ? '#fff6c2' : '#ff8a8a'; ctx.font = '700 ' + Math.round(sz * 0.5) + 'px Lato, sans-serif'; ctx.textAlign = 'center'; ctx.fillText((q.v > 0 ? '+' : '') + q.v, q.x, q.y - (1 - a) * 40); ctx.globalAlpha = 1; }
      root.querySelector('.fg-time').textContent = Math.ceil(FANG_SECS - t);
    }
    cv.addEventListener('pointerdown', (e) => {
      if (over) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, t = (performance.now() - t0) / 1000, sz = size();
      let best = null, bd = 1e9;
      list.forEach((s) => { if (s.hit || t < s.t) return; const p = posOf(s, t); const dd = Math.hypot(p.x - x, p.y - y); if (dd < sz * 0.7 && dd < bd) { bd = dd; best = { s, p }; } });
      if (!best) return; best.s.hit = true; const v = best.s.kind === 'gold' ? 5 : best.s.kind === 'bee' ? -3 : 1; pts = Math.max(0, pts + v);
      pops.push({ x: best.p.x, y: best.p.y, v, t }); root.querySelector('.fg-pts').textContent = pts; L.haptic(v > 0 ? 8 : 30);
    });
    const quit = () => { cancelAnimationFrame(raf); over = true; root.remove(); document.documentElement.classList.remove('cam-open'); window.removeEventListener('resize', fit); };
    root.querySelector('.fg-x').onclick = () => { quit(); fangOpen(); };
    window.addEventListener('resize', fit);
    async function end() {
      over = true; cancelAnimationFrame(raf); const prev = d.me; const better = prev == null || pts > prev; if (better) d.me = pts; L.save();
      if (better && on()) { try { await send({ g: 'fang', op: 'score', day: day(), score: d.me }); } catch (e) {} }
      quit(); renderHub(); P().renderAll(); C('game_done:fang');
      const them = d.them, name = esc(you());
      const verdict = them == null ? 'Vorgelegt! Jetzt ist ' + name + ' dran.' : d.me > them ? '👑 Heute vorn!' : d.me === them ? '🤝 Gleichstand!' : '🦋 ' + name + ' liegt heute vorn – noch ' + (FANG_TRIES - d.tries) + ' Versuch(e).';
      L.openSheet('<h3>🦋 ' + pts + ' Punkte</h3>' + (better && prev != null ? '<p class="about">Neuer Tagesbestwert!</p>' : '') + '<div class="fg-duel"><div><span>Du</span><b>' + d.me + '</b></div><div class="vs">heute</div><div><span>' + name + '</span><b>' + (them == null ? '–' : them) + '</b></div></div><p class="about" style="text-align:center;font-size:18px;margin:8px 0">' + verdict + '</p>' +
        '<div class="row" style="margin-top:10px"><button class="pill-btn ghost" data-cancel>Fertig</button>' + (d.tries < FANG_TRIES ? '<button class="pill-btn primary" data-again>Nochmal</button>' : '') + '</div>', (sh) => {
        sh.querySelector('[data-cancel]').onclick = L.closeSheet; const ag = sh.querySelector('[data-again]'); if (ag) ag.onclick = () => { L.closeSheet(); setTimeout(fangPlay, 120); };
      });
    }
    draw();
  }

  /* ======================= Nachrichten vom Schatz ======================= */
  function received(obj, created) {
    const kind = obj.g, gs = games(), name = you();
    if (kind === 'fang') {
      if (obj.op !== 'score' || typeof obj.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj.day) || !Number.isInteger(obj.score)) return false;
      const f = fangState(); if (!f.days[obj.day]) f.days[obj.day] = { me: null, them: null, tries: 0 };
      f.days[obj.day].them = Math.max(0, Math.min(999, obj.score)); L.save();
      if (obj.day === day()) L.toast('🦋 ' + name + ' hat beim Schmetterlingsfangen ' + (f.days[obj.day].me == null ? 'vorgelegt – du bist dran!' : obj.score + ' Punkte geschafft'));
      renderHub(); return true;
    }
    if (typeof obj.id !== 'string' || obj.id.length > 40) return false;
    let g = gs[obj.id];
    if (kind === 'luege') {
      if (obj.op === 'new' && Array.isArray(obj.items) && obj.items.length === 3 && Number.isInteger(obj.lie) && !g) {
        g = gs[obj.id] = { id: obj.id, kind, mine: false, turn: 'me', created: created || Date.now(), updated: Date.now(), data: { items: obj.items.map((x) => String(x).slice(0, 120)), lie: Math.max(0, Math.min(2, obj.lie)) } };
        inboxNote(g, '🕵️ ' + name + ' hat dir ein Lügen-Rätsel geschickt'); L.toast('🕵️ ' + name + ': Zwei Wahrheiten, eine Lüge – rätsel mit!'); L.save(); renderHub(); return true;
      }
      if (obj.op === 'guess' && g && g.mine && Number.isInteger(obj.pick)) {
        g.turn = 'done'; g.updated = Date.now(); g.data.pick = obj.pick; const ok = obj.pick === g.data.lie; const sc = score('luege'); if (ok) sc.them++; else sc.me++;
        inboxNote(g, ok ? '🕵️ ' + name + ' hat deine Lüge entlarvt' : '😄 ' + name + ' ist auf deine Lüge reingefallen');
        L.toast(ok ? '🕵️ ' + name + ' hat dich durchschaut!' : '😄 Reingelegt! ' + name + ' hat dir geglaubt.'); L.save(); renderHub(); return true;
      }
      return false;
    }
    if (kind === 'story') {
      if (obj.op !== 'add' || !Number.isInteger(obj.n) || typeof obj.text !== 'string') return false;
      if (!g) { if (obj.n !== 0) return false; g = gs[obj.id] = { id: obj.id, kind, mine: false, turn: 'me', created: created || Date.now(), updated: Date.now(), data: { lines: [] } }; }
      if (obj.n !== g.data.lines.length) return false; // doppelt oder außer der Reihe
      g.data.lines.push({ by: 'them', t: obj.text.slice(0, 160) }); g.updated = Date.now(); g.turn = g.data.lines.length >= STORY_MAX ? 'done' : 'me';
      inboxNote(g, g.turn === 'done' ? '📖 Eure Geschichte ist fertig' : '📖 ' + name + ' hat weitergeschrieben – du bist dran');
      L.toast(g.turn === 'done' ? '📖 Eure Geschichte ist fertig!' : '📖 ' + name + ' hat einen Satz geschrieben – du bist dran'); L.save(); renderHub(); return true;
    }
    if (kind === 'jagd') {
      if (obj.op === 'new' && Array.isArray(obj.hints) && obj.hints.length && !g) {
        g = gs[obj.id] = { id: obj.id, kind, mine: false, turn: 'me', created: created || Date.now(), updated: Date.now(), data: { hints: obj.hints.slice(0, 3).map((x) => String(x).slice(0, 140)), gap: [0, 10, 60].includes(obj.gap) ? obj.gap : 10 } };
        inboxNote(g, '🗺️ ' + name + ' hat etwas für dich versteckt'); L.toast('🗺️ ' + name + ' hat etwas für dich versteckt – such!'); L.save(); renderHub(); return true;
      }
      if (obj.op === 'found' && g && g.mine) {
        g.turn = 'done'; g.updated = Date.now(); inboxNote(g, '🎉 ' + name + ' hat deine Überraschung gefunden'); L.toast('🎉 ' + name + ' hat es gefunden!'); L.spawnHearts(14); L.save(); renderHub(); return true;
      }
      return false;
    }
    return false;
  }
  function openGame(id) {
    const g = games()[id]; if (!g) { L.showView('play'); L.showSub('play', 'spiele'); return; }
    if (g.kind === 'luege') return luegePlay(g);
    if (g.kind === 'story') return storyOpen(g);
    if (g.kind === 'jagd') return jagdOpen(g);
  }

  /* ======================= Status für Startseite und Punkte ======================= */
  function activity() {
    const out = []; if (!on()) return out;
    Object.values(games()).forEach((g) => {
      if (g.turn !== 'me' || Date.now() - g.updated > 21 * 864e5) return;
      out.push({ kind: 'turn', game: true, id: g.id, icon: META[g.kind].icon, title: META[g.kind].title, open: () => openGame(g.id) });
    });
    const d = fangState().days[day()]; if (d.them != null && d.me == null && d.tries < FANG_TRIES) out.push({ kind: 'turn', game: true, id: 'fang', icon: '🦋', title: 'Schmetterlinge fangen', open: fangOpen });
    return out;
  }

  /* ======================= Sammlung „🎲 Spiele“ ======================= */
  const openRounds = (kind) => Object.values(games()).filter((g) => g.kind === kind && g.turn !== 'done').sort((a, b) => b.updated - a.updated);
  function tileState(kind) {
    const name = esc(you()); const r = openRounds(kind); const mine = r.find((g) => g.turn === 'me'); const wait = r.find((g) => g.turn === 'them');
    if (mine) return { chip: '<span class="chip-st turn">🎯 Du bist dran</span>', open: () => openGame(mine.id), st: 'turn' };
    if (wait) return { chip: '<span class="chip-st wait">⏳ ' + name + ' ist dran</span>', open: () => openGame(wait.id), st: 'wait' };
    return null;
  }
  function tile(icon, title, sub, onclick, extra) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'deck' + (extra && extra.st ? ' st-' + extra.st : '');
    b.innerHTML = '<span class="d-ico">' + icon + '</span><div class="d-body"><div class="d-title">' + esc(title) + '</div>' + (extra && extra.chip ? extra.chip : '<div class="d-sub">' + esc(sub) + '</div>') + '</div><span class="d-go">›</span>';
    b.onclick = onclick; return b;
  }
  function renderHub() {
    const box = $('spieleList'); if (!box) return; box.innerHTML = '';
    const name = you(), sec = (t) => { const h = document.createElement('div'); h.className = 'eyebrow hub-h'; h.textContent = t; box.appendChild(h); };
    sec('⚔️ Gegeneinander');
    const lg = tileState('luege'), sc = score('luege');
    box.appendChild(tile('🕵️', 'Zwei Wahrheiten, eine Lüge', 'Wer durchschaut wen? Du ' + sc.me + ' · ' + name + ' ' + sc.them, lg ? lg.open : luegeNew, lg));
    const fd = fangState().days[day()]; const fturn = fd.them != null && fd.me == null;
    box.appendChild(tile('🦋', 'Schmetterlinge fangen', fd.me == null ? 'Tagesduell: 30 Sekunden, gleiche Runde für beide' : 'Heute: Du ' + fd.me + ' · ' + name + ' ' + (fd.them == null ? '–' : fd.them), fangOpen, fturn ? { chip: '<span class="chip-st turn">🎯 ' + esc(name) + ' hat vorgelegt</span>', st: 'turn' } : null));
    sec('🤝 Miteinander');
    const st = tileState('story'); box.appendChild(tile('📖', 'Satz für Satz', 'Abwechselnd eine Geschichte schreiben', st ? st.open : storyNew, st));
    const jg = tileState('jagd'); box.appendChild(tile('🗺️', 'Schnitzeljagd', 'Etwas verstecken, Hinweise schicken', jg ? jg.open : jagdNew, jg));
    box.appendChild(tile('🎯', 'Gleichklang', 'Heimlich antworten, nur Treffer zählen', () => L.showSub('play', 'match')));
    box.appendChild(tile('🤝', 'Gemeinsam', 'Was euch verbindet', () => L.showSub('play', 'gemeinsam')));
    sec('☀️ Täglich');
    box.appendChild(tile('🔥', 'Worauf habt ihr heute Bock?', 'Jeden Tag neu', () => P().playDeck('bock')));
    box.appendChild(tile('🌼', 'Gänseblümchen-Orakel', 'Zupfen, bis die Antwort kommt', () => L.showSub('play', 'oracle')));
    box.appendChild(tile('🎵', 'Musik', 'Lieder füreinander', () => L.showSub('play', 'music')));
    box.appendChild(tile('🌸', 'Papillon in der Heide', '3D-Ausflug: Schmetterlinge fangen' + (L.S.heide && L.S.heide.best ? ' · Bestwert ' + L.S.heide.best : ''), () => { if (window.LZH) return window.LZH.open(); const sc = document.createElement('script'); sc.src = 'js/heide.js'; sc.onload = () => window.LZH && window.LZH.open(); document.head.appendChild(sc); }));
    const soon = document.createElement('div'); soon.className = 'hub-soon';
    soon.innerHTML = '<div class="eyebrow hub-h">✨ Bald</div><div class="chips">' + ['🙋 Wer würde eher …?', '🧠 Wie gut kennst du mich?', '🎨 Malen & Raten', '🎟️ Wochen-Bingo', '🌸 Euer Schmetterlingsgarten'].map((x) => '<span class="chip soon">' + x + '</span>').join('') + '</div>';
    box.appendChild(soon);
    /* Abgeschlossene Runden zum Nachlesen */
    const done = Object.values(games()).filter((g) => g.turn === 'done').sort((a, b) => b.updated - a.updated).slice(0, 5);
    if (done.length) {
      const h = document.createElement('div'); h.className = 'eyebrow hub-h'; h.textContent = '📜 Zuletzt gespielt'; box.appendChild(h);
      done.forEach((g) => box.appendChild(tile(META[g.kind].icon, META[g.kind].title, g.kind === 'story' ? storyText(g).slice(0, 60) + '…' : L.fmtDate(new Date(g.updated)), () => openGame(g.id))));
    }
  }

  /* ======================= Einbindung ======================= */
  if (P()) {
    P().on('game', received);
    P().inboxType('game', { icon: '🎲', meta: 'Spiel – antippen', open: (m) => openGame(m.gid) });
  }
  document.querySelectorAll('#view-play .seg [data-sub="spiele"]').forEach((b) => b.addEventListener('click', renderHub));
  renderHub();
  window.LZG = { activity, renderHub, openGame, luegeNew, storyNew, jagdNew, fangOpen, fangPlay, games, received };
})();
