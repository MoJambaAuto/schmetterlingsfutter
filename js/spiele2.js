/* Schmetterlingsfutter – Spiele zu zweit, Welle 1b (3.25.0)
   Raupe rät (Wortraten) · Wiese durchsuchen (Verstecken & Suchen auf 8×8) · Würfelwiese (5 Würfel, 13 Kombinationen)
   Blumenbeete (Zäune ziehen, Beete schließen) · Wanderzug (Backgammon mit Raupen und Schmetterlingen)
   Jedes Spiel: „an einem Handy“ (zusammen, Handy wandert hin und her) oder „zwei Handys“ (Zug um Zug über die Verbindung),
   dazu ein Liebesdienst als Einsatz: Wer verliert, schickt ihn als Gutschein. Nachrichtenart „spiel“ (eigene, damit
   die Spiele aus spiele.js unberührt bleiben). */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const S = () => L.S, P = () => window.LZP, G = () => window.LZG;
  const $ = (id) => document.getElementById(id), esc = L.esc;
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const C = (k) => window.LZS && window.LZS.count(k);
  const on = () => !!(P() && P().paired() && P().joined());
  const you = () => (P() ? P().partnerName() : S().receiver);
  const rnd = (n) => Math.floor(Math.random() * n);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const KINDS = {
    raupe: { icon: '🐛', title: 'Raupe rät', sub: 'Wort erraten, bevor die Raupe einschläft', modes: ['relay', 'pass'], def: 'relay' },
    wiese: { icon: '🌼', title: 'Wiese durchsuchen', sub: 'Schmetterlinge verstecken und finden', modes: ['relay', 'pass'], def: 'relay' },
    wuerfel: { icon: '🎲', title: 'Würfelwiese', sub: '5 Würfel, 13 Kombinationen', modes: ['pass', 'relay'], def: 'pass' },
    beete: { icon: '🌸', title: 'Blumenbeete', sub: 'Zäune ziehen, Beete schließen', modes: ['pass', 'relay'], def: 'pass' },
    wanderzug: { icon: '🦋', title: 'Wanderzug', sub: 'Backgammon mit Raupen und Schmetterlingen', modes: ['pass', 'relay'], def: 'pass' }
  };
  const PRIZES = ['10 Minuten Nackenmassage', 'Frühstück ans Bett', 'Lieblingsessen kochen', 'Heute den Abwasch übernehmen', 'Füße massieren', 'Den Film für heute Abend aussuchen', 'Einen kleinen Liebesbrief schreiben', 'Ein Lied vorsingen', 'Ein Bad mit Kerzen vorbereiten', '15 Minuten kuscheln, Handys weg', 'Haare kraulen', 'Morgen Kaffee oder Tee ans Bett', 'Gewinner wählt den Spaziergang', 'Ein Tänzchen in der Küche', 'Eis holen gehen', 'Gewinner bestimmt das Abendprogramm'];
  const NUDGES = ['Jetzt mal 10 Minuten Handys weg: Erzählt euch den schönsten Moment eurer Woche.', 'Handys umdrehen und eine Runde Umarmung – mindestens 20 Sekunden.', 'Kurze Pause vom Bildschirm: Macht euch zusammen einen Tee.', 'Legt die Handys weg und plant euer nächstes Date – nur mit Stift und Zettel.', 'Handys aus der Hand: Wer schafft es, den anderen zuerst zum Lachen zu bringen?'];

  function store() { const s = S(); if (!s.games2) s.games2 = {}; return s.games2; }
  const nameOf = (g, p) => g.mode === 'pass' ? (p === 'a' ? (g.mine ? S().sender : you()) : (g.mine ? you() : S().sender)) : (p === g.me ? 'Du' : you());
  const myTurn = (g) => g.turn !== 'done' && (g.mode === 'pass' || g.turn === g.me);
  const other = (p) => (p === 'a' ? 'b' : 'a');

  /* ---------- Start: Spielweise und Einsatz wählen ---------- */
  function newGame(kind) {
    const K = KINDS[kind]; let mode = on() ? K.def : 'pass'; let prize = '';
    L.openSheet('<h3>' + K.icon + ' ' + esc(K.title) + '</h3><p class="about" style="font-size:17px;margin-bottom:10px">' + esc(K.sub) + '.</p>' +
      '<div class="field"><label>Wie spielt ihr?</label><div class="chips" id="g2Mode">' +
      '<button type="button" data-m="pass">📱 An einem Handy</button>' + (on() ? '<button type="button" data-m="relay">📱📱 Zwei Handys</button>' : '') + '</div><small class="g2-hint" id="g2ModeHint"></small></div>' +
      '<div class="field"><label>Einsatz: Wer verliert, schenkt …</label><div class="chips" id="g2Prize"><button type="button" data-p="" class="on">Ohne Einsatz</button>' + shuffle(PRIZES).slice(0, 5).map((p) => '<button type="button" data-p="' + esc(p) + '">' + esc(p) + '</button>').join('') + '<button type="button" data-own>✏️ Eigener</button></div><input id="g2Own" class="hidden" maxlength="60" placeholder="z. B. Pizza ausgeben" autocomplete="off"></div>' +
      '<div class="row" style="margin-top:6px"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-go>Los geht’s</button></div>', (sh) => {
      const setMode = (m) => { mode = m; sh.querySelectorAll('#g2Mode button').forEach((b) => b.classList.toggle('on', b.dataset.m === m)); sh.querySelector('#g2ModeHint').textContent = m === 'pass' ? 'Setzt euch zusammen und reicht das Handy hin und her.' : 'Jeder spielt auf dem eigenen Handy, Zug um Zug.'; };
      setMode(mode);
      sh.querySelectorAll('#g2Mode button').forEach((b) => b.onclick = () => setMode(b.dataset.m));
      const own = sh.querySelector('#g2Own');
      sh.querySelectorAll('#g2Prize button').forEach((b) => b.onclick = () => {
        sh.querySelectorAll('#g2Prize button').forEach((x) => x.classList.toggle('on', x === b));
        if (b.hasAttribute('data-own')) { own.classList.remove('hidden'); own.focus(); prize = null; } else { own.classList.add('hidden'); prize = b.dataset.p; }
      });
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = () => {
        const pz = prize === null ? own.value.trim() : prize;
        const g = { id: uid('s'), kind, mode, mine: true, me: 'a', turn: 'a', n: 0, prize: pz || '', created: Date.now(), updated: Date.now(), st: null };
        INIT[kind](g); store()[g.id] = g; L.save(); L.closeSheet(); C('g2_new:' + kind + ':' + mode + (pz ? ':prize' : ''));
        open(g.id);
        /* Beginnt der Schatz (Wanderzug-Los), muss das Spiel sofort rüber */
        if (g.mode === 'relay' && g.turn !== g.me) commit(g, { toast: KINDS[kind].icon + ' ' + you() + ' beginnt' });
      };
    });
  }
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; }

  /* ---------- Zug abschließen ---------- */
  async function commit(g, opts) {
    g.n++; g.updated = Date.now(); L.save();
    if (g.mode === 'relay') {
      try { await P().send({ t: 'spiel', k: g.kind, id: g.id, n: g.n, st: g.st, turn: g.turn, prize: g.prize, winner: g.winner || null, op: g.n === 1 ? 'new' : 'move' }); }
      catch (e) { L.toast('Senden fehlgeschlagen – der Zug ist gespeichert, nochmal öffnen und erneut senden'); g.unsent = true; L.save(); }
    }
    if (g.turn === 'done') finish(g);
    render(); refreshOutside();
    if (opts && opts.toast && g.mode === 'relay' && g.turn !== 'done') L.toast(opts.toast);
  }
  function refreshOutside() { if (G()) G().renderHub(); if (P()) P().renderAll(); }

  /* ---------- Ende: Sieger, Einsatz, Anstoß ohne Handy ---------- */
  function finish(g) {
    C('g2_done:' + g.kind); if (g.finished) return; g.finished = true; L.save();
    setTimeout(() => {
      if (!$('g2Screen')) return;
      const w = g.winner; const draw = !w || w === 'draw';
      const wn = draw ? '' : nameOf(g, w); const iWon = !draw && g.mode === 'relay' && w === g.me; const iLost = !draw && g.mode === 'relay' && w !== g.me;
      const box = document.createElement('div'); box.className = 'g2-end';
      box.innerHTML = '<div class="g2-end-card"><div class="g2-big">' + (draw ? '🤝' : '🏆') + '</div><h2>' + (draw ? 'Unentschieden!' : (g.mode === 'relay' ? (iWon ? 'Du gewinnst!' : esc(you()) + ' gewinnt!') : esc(wn) + ' gewinnt!')) + '</h2>' +
        (g.prize && !draw ? '<p class="g2-prize">🎁 Einsatz: <b>' + esc(g.prize) + '</b></p>' + (iLost || g.mode === 'pass' ? '<button type="button" class="pill-btn primary" data-coupon>🎟️ Als Gutschein ' + (g.mode === 'pass' ? 'festhalten' : 'an ' + esc(you()) + ' schicken') + '</button>' : (iWon ? '<p class="about">Den schuldet dir ' + esc(you()) + ' jetzt. 😉</p>' : '')) : '') +
        (Math.random() < 0.4 ? '<p class="g2-nudge">📵 ' + esc(NUDGES[rnd(NUDGES.length)]) + '</p>' : '') +
        '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-close>Fertig</button><button class="pill-btn" data-again>Revanche</button></div></div>';
      $('g2Screen').appendChild(box); if (!draw) L.spawnHearts(14);
      const cp = box.querySelector('[data-coupon]'); if (cp) cp.onclick = async () => {
        const c = { icon: '🏆', title: g.prize, desc: 'Gewonnen bei ' + KINDS[g.kind].title };
        if (g.mode === 'relay') { await P().sendCoupon(c); }
        else { /* an einem Handy: Wer gewonnen hat, bekommt den Gutschein. War das der Schatz, geht er rüber; sonst liegt er hier. */
          const winnerIsPartner = w === 'b'; // an einem Handy ist „a“ immer die Person, der das Handy gehört
          if (winnerIsPartner && on()) await P().sendCoupon(c);
          else if (winnerIsPartner) L.toast('🎁 ' + you() + ' hat ' + g.prize + ' gut 😉');
          else { S().coupons.push(Object.assign({ id: uid('c'), used: null, from: you() }, c)); L.save(); L.toast('🎟️ Gutschein liegt unter Wünsche → Gutscheine'); }
        }
        cp.disabled = true; cp.textContent = '✓ Erledigt';
      };
      box.querySelector('[data-close]').onclick = close;
      box.querySelector('[data-again]').onclick = () => { close(); newGame(g.kind); };
    }, 700);
  }

  /* ======================= Raupe rät ======================= */
  const WORDS = ['SCHMETTERLING', 'SONNENBLUME', 'KUSCHELDECKE', 'PICKNICK', 'LIEBESBRIEF', 'REGENBOGEN', 'ERDBEERE', 'KERZENSCHEIN', 'STERNSCHNUPPE', 'HÄNGEMATTE', 'GÄNSEBLÜMCHEN', 'SANDBURG', 'TANZSCHUHE', 'POPCORN', 'WALDSPAZIERGANG', 'MONDSCHEIN', 'HEISSLUFTBALLON', 'SCHOKOLADE', 'LAGERFEUER', 'KÜCHENTANZ', 'SEIFENBLASE', 'NACHTISCH', 'KOFFER', 'FERNWEH', 'BLUMENWIESE', 'MARMELADE', 'KISSENSCHLACHT', 'FAHRRADTOUR', 'SCHNEEMANN', 'HONIGBIENE'];
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.split('');
  const RAUPE_MAX = 8;
  const INIT = {
    raupe: (g) => { g.st = { word: '', guessed: [], wrong: 0, phase: 'set' }; g.turn = 'a'; },
    wiese: (g) => { g.st = { fleet: { a: null, b: null }, shots: { a: [], b: [] }, phase: 'place' }; g.turn = 'a'; },
    wuerfel: (g) => { g.st = { card: { a: {}, b: {} }, dice: [1, 1, 1, 1, 1], held: [false, false, false, false, false], rolls: 0 }; g.turn = 'a'; },
    beete: (g) => { g.st = { h: Array(20).fill(0), v: Array(20).fill(0), box: Array(16).fill(0) }; g.turn = 'a'; },
    wanderzug: (g) => { g.st = bgStart(); g.turn = Math.random() < 0.5 ? 'a' : 'b'; }
  };
  function raupeRender(g, el) {
    const st = g.st;
    if (st.phase === 'set') {
      const setter = 'a';
      if (!myTurn(g)) { el.innerHTML = waitHtml(g); return; }
      el.innerHTML = '<p class="g2-p">' + (g.mode === 'pass' ? '<b>' + esc(nameOf(g, setter)) + '</b>: Denk dir ein Wort aus – ' + esc(nameOf(g, 'b')) + ' schaut weg!' : 'Denk dir ein Wort aus, ' + esc(you()) + ' muss es erraten.') + '</p>' +
        '<div class="field"><input id="rpWord" type="password" maxlength="18" autocomplete="off" autocapitalize="characters" placeholder="Dein Wort (nur Buchstaben)"></div>' +
        '<div class="row wrap"><button class="pill-btn small ghost" data-rand>🎲 Wort aus der App nehmen</button><button class="pill-btn primary" data-ok>' + (g.mode === 'pass' ? 'Handy weitergeben' : 'Wort schicken') + '</button></div>';
      el.querySelector('[data-rand]').onclick = () => { el.querySelector('#rpWord').value = WORDS[rnd(WORDS.length)]; };
      el.querySelector('[data-ok]').onclick = () => {
        const w = el.querySelector('#rpWord').value.toUpperCase().replace(/ß/g, 'SS').replace(/[^A-ZÄÖÜ]/g, '');
        if (w.length < 3) { L.toast('Mindestens 3 Buchstaben'); return; }
        st.word = w; st.phase = 'guess'; g.turn = 'b'; commit(g, { toast: '🐛 Wort ist bei ' + you() });
        if (g.mode === 'pass') handover(g, 'b');
      };
      return;
    }
    const word = st.word, done = g.turn === 'done';
    const shown = word.split('').map((c) => (st.guessed.includes(c) || done) ? c : '_');
    const sleepy = st.wrong;
    el.innerHTML = '<div class="rp-raupe" aria-label="Raupe">' + Array.from({ length: RAUPE_MAX }, (_, i) => '<i class="' + (i < sleepy ? 'zz' : '') + '"></i>').join('') + '<span class="rp-head">' + (done && g.winner === 'b' ? '🦋' : sleepy >= RAUPE_MAX - 2 ? '😪' : '🐛') + '</span></div>' +
      '<div class="rp-word">' + shown.map((c) => '<span>' + c + '</span>').join('') + '</div>' +
      '<p class="g2-p" style="text-align:center">' + (done ? (g.winner === 'b' ? 'Geschlüpft! Das Wort war <b>' + esc(word) + '</b>.' : 'Eingeschlafen … das Wort war <b>' + esc(word) + '</b>.') : (myTurn(g) ? 'Noch ' + (RAUPE_MAX - sleepy) + ' Fehler, bevor die Raupe einschläft.' : '')) + '</p>' +
      (done ? '' : myTurn(g) ? '<div class="rp-keys">' + ABC.map((c) => '<button type="button" data-k="' + c + '"' + (st.guessed.includes(c) ? ' disabled class="' + (word.includes(c) ? 'hit' : 'miss') + '"' : '') + '>' + c + '</button>').join('') + '</div>' : waitHtml(g));
    el.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => {
      const c = b.dataset.k; if (st.guessed.includes(c)) return; st.guessed.push(c);
      if (!word.includes(c)) { st.wrong++; L.haptic(25); } else L.haptic(8);
      const solved = word.split('').every((x) => st.guessed.includes(x));
      if (solved || st.wrong >= RAUPE_MAX) { g.turn = 'done'; g.winner = solved ? 'b' : 'a'; commit(g); }
      else { g.updated = Date.now(); L.save(); render(); } // Raten läuft lokal, gesendet wird das Ergebnis
    });
  }

  /* ======================= Wiese durchsuchen ======================= */
  const N8 = 8, FLEET = [4, 3, 3, 2, 2, 2];
  function placeFleet() {
    for (let tries = 0; tries < 500; tries++) {
      const taken = new Set(), ships = []; let ok = true;
      for (const len of FLEET) {
        let placed = false;
        for (let k = 0; k < 200 && !placed; k++) {
          const hor = Math.random() < 0.5, r = rnd(hor ? N8 : N8 - len + 1), c = rnd(hor ? N8 - len + 1 : N8);
          const cells = Array.from({ length: len }, (_, i) => (hor ? r * N8 + c + i : (r + i) * N8 + c));
          /* nicht berühren lassen, auch nicht diagonal */
          const near = cells.some((x) => { const xr = Math.floor(x / N8), xc = x % N8; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = xr + dr, cc = xc + dc; if (rr >= 0 && rr < N8 && cc >= 0 && cc < N8 && taken.has(rr * N8 + cc)) return true; } return false; });
          if (!near) { cells.forEach((x) => taken.add(x)); ships.push(cells); placed = true; }
        }
        if (!placed) { ok = false; break; }
      }
      if (ok) return ships;
    }
    return null;
  }
  function wieseRender(g, el) {
    const st = g.st;
    if (st.phase === 'place') {
      const who = !st.fleet.a ? 'a' : 'b';
      if (!myTurn(g) || (g.mode === 'relay' && who !== g.me)) { el.innerHTML = waitHtml(g); return; }
      if (!g.draft) g.draft = placeFleet();
      el.innerHTML = '<p class="g2-p">' + (g.mode === 'pass' ? '<b>' + esc(nameOf(g, who)) + '</b>, versteck deine Schmetterlinge – der andere schaut weg!' : 'Versteck deine Schmetterlinge auf der Wiese.') + '</p>' + gridHtml(g.draft.flat(), [], true, false) +
        '<div class="row wrap"><button class="pill-btn ghost" data-mix>🔀 Neu verteilen</button><button class="pill-btn primary" data-ok>Versteckt ✓</button></div>';
      el.querySelector('[data-mix]').onclick = () => { g.draft = placeFleet(); render(); };
      el.querySelector('[data-ok]').onclick = () => {
        st.fleet[who] = g.draft; g.draft = null;
        if (st.fleet.a && st.fleet.b) { st.phase = 'play'; g.turn = 'a'; } else g.turn = other(who);
        commit(g, { toast: '🌼 ' + you() + ' ist dran' }); if (g.mode === 'pass') handover(g, g.turn);
      };
      return;
    }
    const shooter = g.mode === 'pass' ? g.turn === 'done' ? 'a' : g.turn : g.me; const target = other(shooter);
    const tCells = st.fleet[target].flat(), myShots = st.shots[shooter], theirShots = st.shots[target];
    const sunkCount = (fleet, shots) => fleet.filter((sh) => sh.every((c) => shots.includes(c))).length;
    el.innerHTML = '<div class="ws-head"><span>' + (g.mode === 'pass' ? esc(nameOf(g, shooter)) + ' sucht' : 'Wiese von ' + esc(you())) + '</span><span>🦋 ' + sunkCount(st.fleet[target], myShots) + '/' + FLEET.length + ' gefunden</span></div>' +
      gridHtml(tCells, myShots, g.turn === 'done', myTurn(g)) +
      (g.mode === 'relay' || g.turn === 'done' ? '<div class="ws-head small"><span>Deine Wiese</span><span>' + esc(you()) + ' fand ' + sunkCount(st.fleet[shooter], theirShots) + '/' + FLEET.length + '</span></div>' + gridHtml(st.fleet[shooter].flat(), theirShots, true, false, true) : '') +
      (!myTurn(g) && g.turn !== 'done' ? waitHtml(g) : '');
    el.querySelectorAll('.ws-grid.live button').forEach((b) => b.onclick = () => {
      const i = Number(b.dataset.i); if (myShots.includes(i)) return; myShots.push(i);
      const hit = tCells.includes(i); L.haptic(hit ? 25 : 6);
      if (tCells.every((c) => myShots.includes(c))) { g.turn = 'done'; g.winner = shooter; }
      else if (!hit) g.turn = target; // Treffer: nochmal
      commit(g, { toast: hit ? '🦋 Aufgeflattert! Du darfst nochmal' : '🌿 Nur Gras – ' + you() + ' ist dran' });
      if (g.mode === 'pass' && !hit && g.turn !== 'done') handover(g, g.turn);
    });
  }
  function gridHtml(ships, shots, reveal, live, small) {
    let h = '<div class="ws-grid' + (live ? ' live' : '') + (small ? ' small' : '') + '">';
    for (let i = 0; i < N8 * N8; i++) {
      const s = ships.includes(i), sh = shots.includes(i);
      h += '<button type="button" data-i="' + i + '" class="' + (sh ? (s ? 'hit' : 'miss') : (reveal && s ? 'own' : '')) + '"' + (live && !sh ? '' : ' tabindex="-1"') + '>' + (sh ? (s ? '🦋' : '·') : (reveal && s ? '🦋' : '')) + '</button>';
    }
    return h + '</div>';
  }

  /* ======================= Würfelwiese ======================= */
  const CATS = [['1', 'Einser 🌼', 'up'], ['2', 'Zweier 🌼', 'up'], ['3', 'Dreier 🌼', 'up'], ['4', 'Vierer 🌼', 'up'], ['5', 'Fünfer 🌼', 'up'], ['6', 'Sechser 🌼', 'up'],
    ['3k', 'Dreierpasch'], ['4k', 'Viererpasch'], ['fh', 'Blumenstrauß (3+2)'], ['ss', 'Kleiner Blütenkranz (4 in Folge)'], ['ls', 'Großer Blütenkranz (5 in Folge)'], ['sw', 'Schwarm (5 Gleiche)'], ['ch', 'Wiesenglück (Summe)']];
  function catScore(cat, d) {
    const cnt = [0, 0, 0, 0, 0, 0, 0]; d.forEach((x) => cnt[x]++); const sum = d.reduce((a, b) => a + b, 0); const mx = Math.max(...cnt);
    const has = (arr) => arr.every((x) => cnt[x] > 0);
    if (/^[1-6]$/.test(cat)) return cnt[+cat] * +cat;
    if (cat === '3k') return mx >= 3 ? sum : 0; if (cat === '4k') return mx >= 4 ? sum : 0;
    if (cat === 'fh') return (cnt.includes(3) && cnt.includes(2)) || mx === 5 ? 25 : 0;
    if (cat === 'ss') return has([1, 2, 3, 4]) || has([2, 3, 4, 5]) || has([3, 4, 5, 6]) ? 30 : 0;
    if (cat === 'ls') return has([1, 2, 3, 4, 5]) || has([2, 3, 4, 5, 6]) ? 40 : 0;
    if (cat === 'sw') return mx === 5 ? 50 : 0; if (cat === 'ch') return sum; return 0;
  }
  function total(card) { const up = CATS.slice(0, 6).reduce((a, c) => a + (card[c[0]] || 0), 0); const bonus = up >= 63 ? 35 : 0; return { up, bonus, all: up + bonus + CATS.slice(6).reduce((a, c) => a + (card[c[0]] || 0), 0) }; }
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const dieHtml = (v, held, i, live) => '<button type="button" class="wf-die' + (held ? ' held' : '') + '" data-d="' + i + '"' + (live ? '' : ' disabled') + ' aria-label="Würfel ' + v + (held ? ', gehalten' : '') + '">' + Array.from({ length: 9 }, (_, k) => '<i' + (PIPS[v].includes(k) ? ' class="on"' : '') + '></i>').join('') + '</button>';
  function wuerfelRender(g, el) {
    const st = g.st, cur = g.turn === 'done' ? null : g.turn, live = myTurn(g);
    const ta = total(st.card.a), tb = total(st.card.b);
    el.innerHTML = (cur ? '<p class="g2-p" style="text-align:center"><b>' + esc(nameOf(g, cur)) + '</b> würfelt · Wurf ' + st.rolls + ' von 3' + (st.rolls ? ' · Würfel antippen zum Halten' : '') + '</p>' : '') +
      '<div class="wf-dice">' + st.dice.map((v, i) => dieHtml(v, st.held[i], i, live && st.rolls > 0 && st.rolls < 3)).join('') + '</div>' +
      (live ? '<div class="row" style="margin:8px 0 10px"><button class="pill-btn primary" data-roll' + (st.rolls >= 3 ? ' disabled' : '') + '>🎲 ' + (st.rolls ? 'Nochmal würfeln' : 'Würfeln') + '</button></div>' : (cur ? waitHtml(g) : '')) +
      '<table class="wf-card"><thead><tr><th></th><th>' + esc(nameOf(g, 'a')) + '</th><th>' + esc(nameOf(g, 'b')) + '</th></tr></thead><tbody>' +
      CATS.map(([k, lab], i) => {
        const cell = (p) => { const v = st.card[p][k]; if (v != null) return '<td>' + v + '</td>'; if (live && p === cur && st.rolls > 0) return '<td><button type="button" data-c="' + k + '">' + catScore(k, st.dice) + '</button></td>'; return '<td class="empty"></td>'; };
        return (i === 6 ? '<tr class="sum"><td>Bonus (ab 63 oben)</td><td>' + ta.bonus + '</td><td>' + tb.bonus + '</td></tr>' : '') + '<tr><td>' + lab + '</td>' + cell('a') + cell('b') + '</tr>';
      }).join('') + '<tr class="sum"><td>Gesamt</td><td>' + ta.all + '</td><td>' + tb.all + '</td></tr></tbody></table>';
    const rb = el.querySelector('[data-roll]'); if (rb) rb.onclick = () => {
      st.dice = st.dice.map((v, i) => (st.held[i] && st.rolls > 0 ? v : 1 + rnd(6))); st.rolls++; L.haptic(12);
      el.querySelectorAll('.wf-die').forEach((d) => d.classList.add('roll')); setTimeout(() => { g.updated = Date.now(); L.save(); render(); }, 260);
    };
    el.querySelectorAll('.wf-die:not([disabled])').forEach((b) => b.onclick = () => { const i = Number(b.dataset.d); st.held[i] = !st.held[i]; L.save(); render(); });
    el.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => {
      st.card[cur][b.dataset.c] = catScore(b.dataset.c, st.dice); st.rolls = 0; st.held = [false, false, false, false, false];
      const full = (p) => CATS.every(([k]) => st.card[p][k] != null);
      if (full('a') && full('b')) { g.turn = 'done'; const A = total(st.card.a).all, B = total(st.card.b).all; g.winner = A === B ? 'draw' : A > B ? 'a' : 'b'; }
      else g.turn = other(cur);
      commit(g, { toast: '🎲 ' + you() + ' ist dran' }); if (g.mode === 'pass' && g.turn !== 'done') handover(g, g.turn, true);
    });
  }

  /* ======================= Blumenbeete ======================= */
  /* 5×5 Punkte → 4×4 Beete. h[r*4+c] (r 0..4, c 0..3), v[r*5+c] (r 0..3, c 0..4); box[r*4+c] = 0 | 1 (a) | 2 (b) */
  function beeteRender(g, el) {
    const st = g.st, live = myTurn(g), cur = g.turn === 'done' ? null : g.turn, cnt = (p) => st.box.filter((x) => x === p).length;
    const S0 = 64, O = 20, W = O * 2 + S0 * 4;
    let svg = '<svg class="bt-svg" viewBox="0 0 ' + W + ' ' + W + '" role="img" aria-label="Spielfeld Blumenbeete">';
    st.box.forEach((o, i) => { if (!o) return; const r = Math.floor(i / 4), c = i % 4; svg += '<rect x="' + (O + c * S0 + 4) + '" y="' + (O + r * S0 + 4) + '" width="' + (S0 - 8) + '" height="' + (S0 - 8) + '" rx="10" class="bt-box p' + o + '"/><text x="' + (O + c * S0 + S0 / 2) + '" y="' + (O + r * S0 + S0 / 2 + 12) + '" text-anchor="middle" font-size="32">' + (o === 1 ? '🌷' : '🌻') + '</text>'; });
    for (let r = 0; r <= 4; r++) for (let c = 0; c < 4; c++) { const i = r * 4 + c, x1 = O + c * S0, y = O + r * S0; svg += '<line x1="' + x1 + '" y1="' + y + '" x2="' + (x1 + S0) + '" y2="' + y + '" class="bt-l' + (st.h[i] ? ' set p' + st.h[i] : '') + '"/>' + (!st.h[i] && live ? '<rect data-h="' + i + '" x="' + (x1 + 8) + '" y="' + (y - 14) + '" width="' + (S0 - 16) + '" height="28" class="bt-hit"/>' : ''); }
    for (let r = 0; r < 4; r++) for (let c = 0; c <= 4; c++) { const i = r * 5 + c, x = O + c * S0, y1 = O + r * S0; svg += '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + (y1 + S0) + '" class="bt-l' + (st.v[i] ? ' set p' + st.v[i] : '') + '"/>' + (!st.v[i] && live ? '<rect data-v="' + i + '" x="' + (x - 14) + '" y="' + (y1 + 8) + '" width="28" height="' + (S0 - 16) + '" class="bt-hit"/>' : ''); }
    for (let r = 0; r <= 4; r++) for (let c = 0; c <= 4; c++) svg += '<circle cx="' + (O + c * S0) + '" cy="' + (O + r * S0) + '" r="6" class="bt-dot"/>';
    svg += '</svg>';
    el.innerHTML = '<div class="bt-score"><span class="p1">🌷 ' + esc(nameOf(g, 'a')) + ' ' + cnt(1) + '</span><span class="p2">🌻 ' + esc(nameOf(g, 'b')) + ' ' + cnt(2) + '</span></div>' +
      (cur ? '<p class="g2-p" style="text-align:center">' + (live ? '<b>' + esc(nameOf(g, cur)) + '</b> setzt ein Zaunstück' : '') + '</p>' : '') + svg + (!live && cur ? waitHtml(g) : '');
    const pl = cur === 'a' ? 1 : 2;
    const boxDone = (b) => { const r = Math.floor(b / 4), c = b % 4; return st.h[r * 4 + c] && st.h[(r + 1) * 4 + c] && st.v[r * 5 + c] && st.v[r * 5 + c + 1]; };
    const play = (type, i) => {
      if (type === 'h') st.h[i] = pl; else st.v[i] = pl; L.haptic(8);
      let closed = 0; for (let b = 0; b < 16; b++) if (!st.box[b] && boxDone(b)) { st.box[b] = pl; closed++; }
      if (st.box.every((x) => x)) { g.turn = 'done'; const A = cnt(1), B = cnt(2); g.winner = A === B ? 'draw' : A > B ? 'a' : 'b'; }
      else if (!closed) g.turn = other(cur);
      if (closed) L.haptic(25);
      commit(g, { toast: closed ? '🌸 Beet geschlossen – du bist nochmal dran' : '🌸 ' + you() + ' ist dran' });
    };
    el.querySelectorAll('[data-h]').forEach((r) => r.addEventListener('click', () => play('h', Number(r.dataset.h))));
    el.querySelectorAll('[data-v]').forEach((r) => r.addEventListener('click', () => play('v', Number(r.dataset.v))));
  }

  /* ======================= Wanderzug (Backgammon) ======================= */
  /* pts[1..24]: >0 Steine von a (Raupen, ziehen 24 → 1, Heimat 1–6), <0 Steine von b (Schmetterlinge, ziehen 1 → 24, Heimat 19–24) */
  function bgStart() { const p = Array(25).fill(0); p[24] = 2; p[13] = 5; p[8] = 3; p[6] = 5; p[1] = -2; p[12] = -5; p[17] = -3; p[19] = -5; return { pts: p, bar: { a: 0, b: 0 }, off: { a: 0, b: 0 }, dice: [], left: [] }; }
  const sgn = (pl) => (pl === 'a' ? 1 : -1);
  const ownAt = (st, pl, i) => st.pts[i] * sgn(pl) > 0;
  const oppAt = (st, pl, i) => -st.pts[i] * sgn(pl);
  function allHome(st, pl) {
    if (st.bar[pl]) return false;
    for (let i = 1; i <= 24; i++) if (ownAt(st, pl, i) && (pl === 'a' ? i > 6 : i < 19)) return false;
    return true;
  }
  function movesFor(st, pl, d) {
    const out = [];
    if (st.bar[pl]) { const t = pl === 'a' ? 25 - d : d; if (oppAt(st, pl, t) < 2) out.push({ from: 'bar', to: t, d }); return out; }
    const home = allHome(st, pl);
    for (let i = 1; i <= 24; i++) {
      if (!ownAt(st, pl, i)) continue;
      const t = pl === 'a' ? i - d : i + d;
      if (t >= 1 && t <= 24) { if (oppAt(st, pl, t) < 2) out.push({ from: i, to: t, d }); continue; }
      if (!home) continue;
      if (t === 0 || t === 25) { out.push({ from: i, to: 'off', d }); continue; }
      /* höherer Würfel: nur wenn auf weiter entfernten Heimatfeldern nichts mehr steht */
      let further = false; if (pl === 'a') { for (let k = i + 1; k <= 6; k++) if (ownAt(st, pl, k)) further = true; } else { for (let k = 19; k < i; k++) if (ownAt(st, pl, k)) further = true; }
      if (!further) out.push({ from: i, to: 'off', d });
    }
    return out;
  }
  function apply(st, pl, m) {
    const s = { pts: st.pts.slice(), bar: Object.assign({}, st.bar), off: Object.assign({}, st.off), dice: st.dice, left: st.left.slice() };
    if (m.from === 'bar') s.bar[pl]--; else s.pts[m.from] -= sgn(pl);
    if (m.to === 'off') s.off[pl]++;
    else { if (oppAt(s, pl, m.to) === 1) { s.pts[m.to] = 0; s.bar[other(pl)]++; } s.pts[m.to] += sgn(pl); }
    s.left.splice(s.left.indexOf(m.d), 1); return s;
  }
  /* Regel: so viele Würfel wie möglich nutzen; geht nur einer von zwei verschiedenen, dann wenn möglich den höheren */
  function legal(st, pl) {
    let best = 0; const firsts = new Map();
    function rec(s, depth, first) {
      let any = false; const tried = new Set();
      for (const d of s.left) {
        if (tried.has(d)) continue; tried.add(d);
        for (const m of movesFor(s, pl, d)) { any = true; rec(apply(s, pl, m), depth + 1, first || m); }
      }
      if (!any && first) { if (depth > best) { best = depth; firsts.clear(); } if (depth === best) firsts.set(first.from + '>' + first.to + ':' + first.d, first); }
    }
    rec(st, 0, null);
    let list = Array.from(firsts.values());
    if (best === 1 && st.left.length === 2 && st.left[0] !== st.left[1]) { const hi = Math.max(...st.left); const hiList = list.filter((m) => m.d === hi); if (hiList.length) list = hiList; }
    return list;
  }
  function wanderRender(g, el) {
    const st = g.st, cur = g.turn === 'done' ? null : g.turn, live = myTurn(g);
    const opts = live && st.left.length ? legal(st, cur) : [];
    const sel = g.sel;
    const targets = sel != null ? opts.filter((m) => String(m.from) === String(sel)) : [];
    const srcSet = new Set(opts.map((m) => String(m.from)));
    const tgtSet = new Set(targets.map((m) => String(m.to)));
    const piece = (pl) => '<i class="wz-p ' + pl + '">' + (pl === 'a' ? '🐛' : '🦋') + '</i>';
    const pointHtml = (i, top) => {
      const v = st.pts[i], n = Math.abs(v), pl = v > 0 ? 'a' : 'b';
      const stack = n ? Array.from({ length: Math.min(n, 5) }, () => piece(pl)).join('') + (n > 5 ? '<b>' + n + '</b>' : '') : '';
      return '<button type="button" class="wz-pt ' + (top ? 'top' : 'bot') + (i % 2 ? ' odd' : '') + (srcSet.has(String(i)) ? ' src' : '') + (String(sel) === String(i) ? ' sel' : '') + (tgtSet.has(String(i)) ? ' tgt' : '') + '" data-pt="' + i + '"><span class="wz-n">' + i + '</span><span class="wz-stack">' + stack + '</span></button>';
    };
    const row = (arr, top) => '<div class="wz-row">' + arr.slice(0, 6).map((i) => pointHtml(i, top)).join('') + '<div class="wz-bar">' + (top ? (st.bar.b ? '<button type="button" class="wz-barbtn' + (srcSet.has('bar') && cur === 'b' ? ' src' : '') + '" data-bar="b">' + piece('b') + '×' + st.bar.b + '</button>' : '') : (st.bar.a ? '<button type="button" class="wz-barbtn' + (srcSet.has('bar') && cur === 'a' ? ' src' : '') + '" data-bar="a">' + piece('a') + '×' + st.bar.a + '</button>' : '')) + '</div>' + arr.slice(6).map((i) => pointHtml(i, top)).join('') + '</div>';
    const pv = (p) => esc(nameOf(g, p));
    el.innerHTML = '<div class="wz-info"><span>🐛 ' + pv('a') + ' · heim ' + st.off.a + '/15</span><span>🦋 ' + pv('b') + ' · heim ' + st.off.b + '/15</span></div>' +
      '<div class="wz-board">' + row([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], true) + row([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], false) + '</div>' +
      '<div class="wz-ctl">' + (cur ? '<span class="wz-turn">' + (cur === 'a' ? '🐛 ' : '🦋 ') + '<b>' + pv(cur) + '</b> ist dran</span>' : '') +
      (st.dice.length ? '<span class="wz-dice">' + st.dice.map((d) => '<i class="' + (st.left.includes(d) ? '' : 'used') + '">' + d + '</i>').join('') + '</span>' : '') +
      (live && !st.left.length ? '<button class="pill-btn primary" data-roll>🎲 Würfeln</button>' : '') +
      (live && st.left.length && targets.some((m) => m.to === 'off') ? '<button class="pill-btn primary" data-off>Heimfliegen 🏡</button>' : '') + '</div>' +
      (live && st.left.length && !opts.length ? '<p class="g2-p" style="text-align:center">Kein Zug möglich.</p><div class="row"><button class="pill-btn" data-pass>Weiter</button></div>' : '') +
      (live && st.left.length && opts.length ? '<p class="wz-help">' + (sel == null ? 'Tipp einen leuchtenden Stein an.' : 'Jetzt das Ziel antippen.') + '</p>' : '') +
      (!live && cur ? waitHtml(g) : '');
    const endTurn = () => { st.dice = []; st.left = []; g.sel = null; g.turn = other(cur); commit(g, { toast: '🦋 ' + you() + ' ist dran' }); if (g.mode === 'pass') handover(g, g.turn, true); };
    const doMove = (m) => {
      const hit = m.to !== 'off' && oppAt(st, cur, m.to) === 1;
      const ns = apply(st, cur, m); Object.assign(st, ns); g.sel = null; L.haptic(hit ? 30 : 8);
      if (st.off[cur] >= 15) { g.turn = 'done'; g.winner = cur; st.left = []; commit(g); return; }
      if (!st.left.length || !legal(st, cur).length) { if (!st.left.length) return endTurn(); }
      g.updated = Date.now(); L.save(); render(); if (hit) L.toast('💥 Geschlagen – ab in den Kokon!');
    };
    const rb = el.querySelector('[data-roll]'); if (rb) rb.onclick = () => { const a = 1 + rnd(6), b = 1 + rnd(6); st.dice = a === b ? [a, a, a, a] : [a, b]; st.left = st.dice.slice(); L.haptic(12); g.updated = Date.now(); L.save(); render(); };
    const ps = el.querySelector('[data-pass]'); if (ps) ps.onclick = endTurn;
    const of = el.querySelector('[data-off]'); if (of) of.onclick = () => { const m = targets.filter((x) => x.to === 'off').sort((a, b) => a.d - b.d)[0]; if (m) doMove(m); };
    el.querySelectorAll('[data-pt]').forEach((b) => b.onclick = () => {
      const i = b.dataset.pt;
      if (tgtSet.has(i)) { const m = targets.filter((x) => String(x.to) === i).sort((a, b2) => a.d - b2.d)[0]; return doMove(m); }
      if (srcSet.has(i)) { g.sel = i; render(); }
    });
    el.querySelectorAll('[data-bar]').forEach((b) => b.onclick = () => { if (srcSet.has('bar')) { g.sel = 'bar'; render(); } });
  }

  /* ---------- Bildschirm ---------- */
  const RENDER = { raupe: raupeRender, wiese: wieseRender, wuerfel: wuerfelRender, beete: beeteRender, wanderzug: wanderRender };
  let curId = null;
  function waitHtml(g) { return '<div class="g2-wait">⏳ ' + esc(you()) + ' ist dran. Du bekommst Bescheid.</div>'; }
  function open(id) {
    const g = store()[id]; if (!g) return; curId = id;
    (S().inbox || []).forEach((m) => { if (m.t === 'spiel' && m.gid === id) m.read = true; }); L.save();
    let el = $('g2Screen');
    if (!el) { el = document.createElement('div'); el.id = 'g2Screen'; el.className = 'g2'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); document.documentElement.classList.add('cam-open'); }
    if (g.unsent && g.mode === 'relay') { g.n--; g.unsent = false; commit(g); }
    render(); if (P()) P().renderAll();
  }
  function render() {
    const el = $('g2Screen'); if (!el) return; const g = store()[curId]; if (!g) return close();
    const K = KINDS[g.kind];
    el.innerHTML = '<div class="g2-top"><button type="button" class="icon-btn" data-x aria-label="Schließen">✕</button><span class="g2-title">' + K.icon + ' ' + esc(K.title) + '</span><span class="g2-mode">' + (g.mode === 'pass' ? '📱' : '📱📱') + '</span></div>' +
      (g.prize ? '<div class="g2-prizebar">🎁 Einsatz: ' + esc(g.prize) + '</div>' : '') + '<div class="g2-body"></div>';
    el.querySelector('[data-x]').onclick = close;
    RENDER[g.kind](g, el.querySelector('.g2-body'));
  }
  function close() { const el = $('g2Screen'); if (el) el.remove(); document.documentElement.classList.remove('cam-open'); curId = null; refreshOutside(); }
  /* An einem Handy: Übergabe-Hinweis, damit der andere nicht ins Versteck schaut */
  function handover(g, p, soft) {
    const el = $('g2Screen'); if (!el) return;
    const ov = document.createElement('div'); ov.className = 'g2-hand';
    ov.innerHTML = '<div><div class="g2-big">📲</div><h2>' + esc(nameOf(g, p)) + ' ist dran</h2><p>' + (soft ? 'Handy rüberreichen.' : 'Handy rüberreichen – und nicht spicken!') + '</p><button type="button" class="pill-btn primary">Bin bereit</button></div>';
    el.appendChild(ov); ov.querySelector('button').onclick = () => ov.remove();
  }

  /* ---------- Nachrichten vom Schatz ---------- */
  function received(obj, created) {
    if (!KINDS[obj.k] || typeof obj.id !== 'string' || obj.id.length > 40 || !Number.isInteger(obj.n) || !obj.st || typeof obj.st !== 'object') return false;
    const gs = store(); let g = gs[obj.id];
    if (!g) { if (obj.op !== 'new') return false; g = gs[obj.id] = { id: obj.id, kind: obj.k, mode: 'relay', mine: false, me: 'b', turn: 'a', n: 0, prize: String(obj.prize || '').slice(0, 60), created: created || Date.now(), updated: Date.now(), st: null }; }
    if (obj.n <= g.n) return false; // schon bekannt
    g.st = obj.st; g.n = obj.n; g.turn = ['a', 'b', 'done'].includes(obj.turn) ? obj.turn : g.turn; g.winner = obj.winner || null; g.updated = Date.now();
    const K = KINDS[g.kind], name = you();
    const text = g.turn === 'done' ? K.icon + ' ' + K.title + ': Spiel vorbei' : g.turn === g.me ? K.icon + ' ' + name + ': ' + K.title + ' – du bist dran' : K.icon + ' ' + K.title + ': ' + name + ' hat gezogen';
    const s = S(); if (!s.inbox) s.inbox = []; s.inbox = s.inbox.filter((m) => !(m.t === 'spiel' && m.gid === g.id));
    s.inbox.push({ id: uid('m'), t: 'spiel', gid: g.id, text, at: created || Date.now(), read: false });
    L.toast(text); L.save();
    if (curId === g.id) { render(); if (g.turn === 'done') finish(g); }
    if (G()) G().renderHub();
    return true;
  }

  /* ---------- Einbindung in die Sammlung und den Status ---------- */
  function activity() {
    if (!on()) return [];
    return Object.values(store()).filter((g) => g.mode === 'relay' && g.turn === g.me && Date.now() - g.updated < 21 * 864e5).map((g) => ({ kind: 'turn', game: true, id: g.id, icon: KINDS[g.kind].icon, title: KINDS[g.kind].title, open: () => open(g.id) }));
  }
  function tileFor(kind) {
    const K = KINDS[kind]; const gs = Object.values(store()).filter((g) => g.kind === kind && g.turn !== 'done').sort((a, b) => b.updated - a.updated);
    const turn = gs.find((g) => g.mode === 'relay' && g.turn === g.me), wait = gs.find((g) => g.mode === 'relay' && g.turn !== g.me), pass = gs.find((g) => g.mode === 'pass');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'deck' + (turn ? ' st-turn' : '');
    const chip = turn ? '<span class="chip-st turn">🎯 Du bist dran</span>' : wait ? '<span class="chip-st wait">⏳ ' + esc(you()) + ' ist dran</span>' : pass ? '<span class="chip-st wait">▶️ Angefangenes Spiel</span>' : '';
    b.innerHTML = '<span class="d-ico">' + K.icon + '</span><div class="d-body"><div class="d-title">' + esc(K.title) + '</div>' + (chip || '<div class="d-sub">' + esc(K.sub) + '</div>') + '</div><span class="d-go">›</span>';
    b.onclick = () => { const g = turn || pass || wait; if (g) open(g.id); else newGame(kind); };
    return b;
  }
  function addTiles() {
    const box = $('spieleList'); if (!box || box.querySelector('[data-g2]')) return;
    const heads = Array.from(box.querySelectorAll('.hub-h')); const h = heads.find((x) => /Gegeneinander/.test(x.textContent)); if (!h) return;
    const next = heads[heads.indexOf(h) + 1] || null;
    const frag = document.createDocumentFragment(); ['wanderzug', 'wiese', 'raupe', 'wuerfel', 'beete'].forEach((k) => { const t = tileFor(k); t.setAttribute('data-g2', k); frag.appendChild(t); });
    box.insertBefore(frag, next);
  }
  function hook() {
    const g = G(); if (!g || g.__g2) return; g.__g2 = true;
    const act = g.activity, hub = g.renderHub;
    g.activity = () => act().concat(activity());
    g.renderHub = () => { hub(); addTiles(); };
    /* spiele.js zeichnet die Sammlung auch intern neu – danach die neuen Kacheln wieder einsetzen */
    const box = $('spieleList'); if (box && window.MutationObserver) new MutationObserver(() => { if (!box.querySelector('[data-g2]')) addTiles(); }).observe(box, { childList: true });
    g.renderHub();
  }
  if (P()) {
    P().on('spiel', received);
    P().inboxType('spiel', { icon: '🎲', meta: 'Spiel – antippen', open: (m) => open(m.gid) });
  }
  const style = document.createElement('style'); style.textContent = CSS(); document.head.appendChild(style);
  hook();
  window.LZG2 = { newGame, open, games: store, received, legal, movesFor, apply, bgStart, catScore, KINDS, PRIZES };

  function CSS() { return `
.g2 { position:fixed; inset:0; z-index:84; background:var(--bg0, #1a0a1e); color:var(--text); overflow-y:auto; padding:calc(8px + env(safe-area-inset-top)) 12px calc(20px + env(safe-area-inset-bottom)); }
.g2-top { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
.g2-title { font-family:var(--serif); font-size:21px; }
.g2-mode { font-size:18px; width:44px; text-align:center; }
.g2-prizebar { text-align:center; font-size:15px; font-weight:700; color:var(--accent-2); border:1px dashed var(--accent-2); border-radius:14px; padding:5px 10px; margin:0 auto 10px; max-width:420px; }
.g2-body { max-width:520px; margin:0 auto; }
.g2-p { font-size:17px; line-height:1.45; margin:6px 0 10px; color:var(--text-soft); }
.g2-wait { text-align:center; font-size:17px; font-weight:700; color:var(--accent-2); margin:14px 0; }
.g2-hint { display:block; font-size:15px; color:var(--text-muted); margin-top:4px; }
.g2-hand, .g2-end { position:fixed; inset:0; z-index:86; display:flex; align-items:center; justify-content:center; background:rgba(11,4,16,.92); text-align:center; padding:20px; }
.g2-hand h2, .g2-end h2 { font-family:var(--serif); font-size:28px; font-weight:400; margin:6px 0; }
.g2-hand p { font-size:17px; color:var(--text-soft); margin-bottom:16px; }
.g2-end-card { background:var(--bg1); border:1.5px solid var(--accent-2); border-radius:24px; padding:22px; max-width:340px; box-shadow:0 0 40px var(--glow); }
.g2-big { font-size:54px; }
.g2-prize { font-size:17px; margin:8px 0 12px; }
.g2-nudge { font-size:16px; color:var(--text-soft); background:var(--glass); border-radius:14px; padding:10px; margin-top:12px; }
.rp-raupe { display:flex; justify-content:center; align-items:center; gap:4px; margin:10px 0; }
.rp-raupe i { width:24px; height:24px; border-radius:50%; background:#7ed957; box-shadow:inset -3px -3px 0 rgba(0,0,0,.15); transition:all .3s; }
.rp-raupe i.zz { background:#6b6b80; transform:scale(.85); }
.rp-head { font-size:34px; margin-left:4px; }
.rp-word { display:flex; flex-wrap:wrap; justify-content:center; gap:5px; margin:12px 0; }
.rp-word span { min-width:22px; font-family:var(--serif); font-size:26px; text-align:center; border-bottom:2px solid var(--accent-2); }
.rp-keys { display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; }
.rp-keys button { font-size:18px; font-weight:700; padding:10px 0; border-radius:10px; border:1px solid var(--line); background:var(--glass); color:var(--text); }
.rp-keys button.hit { background:rgba(126,240,168,.25); }
.rp-keys button.miss { opacity:.35; }
.ws-head { display:flex; justify-content:space-between; font-size:16px; font-weight:700; margin:8px 2px; color:var(--text-soft); }
.ws-grid { display:grid; grid-template-columns:repeat(8, 1fr); gap:3px; background:#3b6b2f; padding:5px; border-radius:12px; }
.ws-grid button { aspect-ratio:1; border:0; border-radius:6px; background:#5d9a46; font-size:20px; color:#fff; padding:0; }
.ws-grid.live button:not(.hit):not(.miss):active { background:#79b85e; }
.ws-grid button.miss { background:#41712f; color:#c8e6b5; }
.ws-grid button.hit { background:#f7c6dd; }
.ws-grid button.own { background:#9fd185; }
.ws-grid.small { width:70%; margin:0 auto; }
.ws-grid.small button { font-size:13px; }
.wf-dice { display:flex; justify-content:center; gap:8px; margin:8px 0; }
.wf-die { width:54px; height:54px; display:grid; grid-template-columns:repeat(3,1fr); padding:7px; border-radius:12px; background:#fff; border:3px solid transparent; }
.wf-die i { width:9px; height:9px; margin:auto; border-radius:50%; }
.wf-die i.on { background:#e8305a; box-shadow:0 0 0 2px #ffd1e8; }
.wf-die.held { border-color:var(--accent-2); transform:translateY(-6px); box-shadow:0 0 14px var(--glow); }
.wf-die.roll { animation:wfRoll .26s linear; }
@keyframes wfRoll { 50% { transform:rotate(25deg) scale(.9); } }
.wf-card { width:100%; border-collapse:collapse; font-size:15px; }
.wf-card th, .wf-card td { padding:5px 6px; border-bottom:1px solid var(--line-soft); text-align:center; }
.wf-card td:first-child, .wf-card th:first-child { text-align:left; }
.wf-card td button { min-width:44px; font-weight:700; border-radius:10px; border:1px solid var(--accent-2); background:var(--glass); color:var(--accent-2); padding:4px 8px; }
.wf-card tr.sum td { font-weight:700; color:var(--accent-2); }
.bt-score { display:flex; justify-content:space-around; font-size:18px; font-weight:700; margin:6px 0; }
.bt-score .p1 { color:#ff9ec4; } .bt-score .p2 { color:#ffd166; }
.bt-svg { width:100%; max-width:420px; display:block; margin:0 auto; touch-action:manipulation; }
.bt-l { stroke:rgba(255,255,255,.12); stroke-width:4; stroke-dasharray:6 6; }
.bt-l.set { stroke-dasharray:none; stroke-width:7; stroke-linecap:round; }
.bt-l.p1 { stroke:#ff9ec4; } .bt-l.p2 { stroke:#ffd166; }
.bt-hit { fill:transparent; cursor:pointer; }
.bt-hit:hover { fill:rgba(255,255,255,.08); }
.bt-dot { fill:#fff; }
.bt-box.p1 { fill:rgba(255,158,196,.22); } .bt-box.p2 { fill:rgba(255,209,102,.22); }
.wz-info { display:flex; justify-content:space-between; font-size:15px; font-weight:700; color:var(--text-soft); margin:4px 2px 6px; }
.wz-board { background:#2f5a2a; border:4px solid #6b4a2b; border-radius:12px; padding:4px; }
.wz-row { display:flex; height:170px; }
.wz-row + .wz-row { border-top:2px solid rgba(0,0,0,.25); }
.wz-pt { flex:1; min-width:0; position:relative; border:0; padding:0; background:transparent; display:flex; flex-direction:column; align-items:center; }
.wz-pt.bot { flex-direction:column-reverse; }
.wz-pt::before { content:''; position:absolute; left:8%; right:8%; top:0; bottom:28%; background:#b9e08f; clip-path:polygon(0 0, 100% 0, 50% 100%); opacity:.75; }
.wz-pt.odd::before { background:#f3a6c8; }
.wz-pt.bot::before { top:28%; bottom:0; clip-path:polygon(50% 0, 100% 100%, 0 100%); }
.wz-n { position:relative; font-size:9px; color:rgba(255,255,255,.55); }
.wz-stack { position:relative; display:flex; flex-direction:column; align-items:center; }
.wz-pt.bot .wz-stack { flex-direction:column-reverse; }
.wz-stack b { font-size:11px; color:#fff; }
.wz-p { width:22px; height:22px; border-radius:50%; font-style:normal; font-size:13px; line-height:22px; text-align:center; margin:-2px 0; box-shadow:0 1px 2px rgba(0,0,0,.5); }
.wz-p.a { background:#d9f7b0; } .wz-p.b { background:#ffd1e8; }
.wz-pt.src::after, .wz-barbtn.src { outline:2px solid #ffd84d; outline-offset:-2px; }
.wz-pt.src::after { content:''; position:absolute; inset:0; border-radius:6px; }
.wz-pt.sel::after { content:''; position:absolute; inset:0; border-radius:6px; background:rgba(255,216,77,.25); }
.wz-pt.tgt::after { content:''; position:absolute; inset:0; border-radius:6px; background:rgba(126,240,168,.35); outline:2px solid #7ef0a8; outline-offset:-2px; }
.wz-bar { width:30px; background:#6b4a2b; display:flex; align-items:center; justify-content:center; }
.wz-barbtn { border:0; background:transparent; color:#fff; font-size:11px; display:flex; flex-direction:column; align-items:center; padding:2px; border-radius:8px; }
.wz-ctl { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:10px; margin:10px 0 4px; }
.wz-turn { font-size:16px; }
.wz-dice i { display:inline-block; width:34px; height:34px; line-height:34px; text-align:center; font-style:normal; font-weight:700; font-size:18px; border-radius:8px; background:#fff; color:#e8305a; margin:0 3px; }
.wz-dice i.used { opacity:.3; }
.wz-help { text-align:center; font-size:15px; color:var(--text-muted); }
`; }
})();
