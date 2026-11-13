/* Schmetterlingsfutter – Spiele zu zweit, Welle 1b (3.25.0, neue Gestaltung 3.27.0)
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
    wanderzug: { icon: '🦋', title: 'Wanderzug', sub: 'Backgammon mit Raupen und Schmetterlingen', modes: ['pass', 'relay'], def: 'pass' },
    quiz: { icon: '🧐', title: 'Wahr oder Falter?', sub: 'Echt oder erfunden? Schmetterlings-Wissen im Duell', modes: ['pass', 'relay'], def: 'pass' }
  };
  const PRIZES = ['10 Minuten Nackenmassage', 'Frühstück ans Bett', 'Lieblingsessen kochen', 'Heute den Abwasch übernehmen', 'Füße massieren', 'Den Film für heute Abend aussuchen', 'Einen kleinen Liebesbrief schreiben', 'Ein Lied vorsingen', 'Ein Bad mit Kerzen vorbereiten', '15 Minuten kuscheln, Handys weg', 'Haare kraulen', 'Morgen Kaffee oder Tee ans Bett', 'Gewinner wählt den Spaziergang', 'Ein Tänzchen in der Küche', 'Eis holen gehen', 'Gewinner bestimmt das Abendprogramm'];
  const NUDGES = ['Jetzt mal 10 Minuten Handys weg: Erzählt euch den schönsten Moment eurer Woche.', 'Handys umdrehen und eine Runde Umarmung – mindestens 20 Sekunden.', 'Kurze Pause vom Bildschirm: Macht euch zusammen einen Tee.', 'Legt die Handys weg und plant euer nächstes Date – nur mit Stift und Zettel.', 'Handys aus der Hand: Wer schafft es, den anderen zuerst zum Lachen zu bringen?'];

  function store() { const s = S(); if (!s.games2) s.games2 = {}; return s.games2; }
  const nameOf = (g, p) => g.mode === 'pass' ? (p === 'a' ? (g.mine ? S().sender : you()) : (g.mine ? you() : S().sender)) : (p === g.me ? 'Du' : you());
  const myTurn = (g) => g.turn !== 'done' && (g.mode === 'pass' || g.turn === g.me);
  const other = (p) => (p === 'a' ? 'b' : 'a');

  /* ---------- Gestaltung (3.27.0): ein gemeinsamer Satz Grafiken für alle Spiele ----------
     Spieler a = Rosé, Spieler b = Gold – in jedem Spiel gleich. Holz, Filz und Erde entstehen aus SVG-Rauschen (keine Bilddateien). */
  const PC = { a: { name: 'Rosé', main: '#e8467c', deep: '#8f0f3c', light: '#ffc2d6' }, b: { name: 'Gold', main: '#f2c14e', deep: '#a8700f', light: '#fff0bf' } };
  function ensureDefs() {
    if (document.getElementById('g2defs')) return;
    const d = document.createElement('div'); d.id = 'g2defs'; d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0"><defs>' +
      '<filter id="g2wood" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.32" numOctaves="3" seed="7"/><feColorMatrix type="matrix" values="0.55 0 0 0 0.30  0.34 0 0 0 0.16  0.18 0 0 0 0.07  0 0 0 0 1"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<filter id="g2felt" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0.07 0 0 0 0.03  0.12 0 0 0 0.19  0.10 0 0 0 0.15  0 0 0 0 1"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<filter id="g2soil" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="11"/><feColorMatrix type="matrix" values="0.30 0 0 0 0.20  0.20 0 0 0 0.12  0.12 0 0 0 0.07  0 0 0 0 1"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<filter id="g2glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="g2shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.3" flood-color="#000" flood-opacity=".55"/></filter>' +
      '<radialGradient id="g2chkA" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ff9fbf"/><stop offset=".45" stop-color="#e8467c"/><stop offset="1" stop-color="#7d0c34"/></radialGradient>' +
      '<radialGradient id="g2chkB" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6d6"/><stop offset=".45" stop-color="#f2c14e"/><stop offset="1" stop-color="#9a6409"/></radialGradient>' +
      '<radialGradient id="g2stone" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#f4f1ea"/><stop offset=".6" stop-color="#b9b2a6"/><stop offset="1" stop-color="#6e675d"/></radialGradient>' +
      '<linearGradient id="g2ptI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e9d4"/><stop offset="1" stop-color="#d9c7a3"/></linearGradient>' +
      '<linearGradient id="g2ptR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a83456"/><stop offset="1" stop-color="#6d1630"/></linearGradient>' +
      '<linearGradient id="g2wA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd3e2"/><stop offset=".35" stop-color="#ff6f9f"/><stop offset="1" stop-color="#8f0f3c"/></linearGradient>' +
      '<linearGradient id="g2wB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c9"/><stop offset=".35" stop-color="#f7b733"/><stop offset="1" stop-color="#9a5b05"/></linearGradient>' +
      '<linearGradient id="g2wC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7f0ff"/><stop offset=".4" stop-color="#4fa3e0"/><stop offset="1" stop-color="#173f73"/></linearGradient>' +
      '<linearGradient id="g2fence" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a066"/><stop offset=".5" stop-color="#9c6431"/><stop offset="1" stop-color="#6a3e18"/></linearGradient>' +
      '<radialGradient id="g2grass" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#7cc25a"/><stop offset="1" stop-color="#3f8a35"/></radialGradient>' +
      '<symbol id="g2bf" viewBox="-50 -42 100 84"><path d="M-2 -4 C-14 -34 -44 -40 -47 -18 C-49 -4 -30 4 -2 2Z" style="fill:var(--w,url(#g2wA))"/><path d="M2 -4 C14 -34 44 -40 47 -18 C49 -4 30 4 2 2Z" style="fill:var(--w,url(#g2wA))"/>' +
        '<path d="M-2 3 C-20 6 -38 14 -32 30 C-26 41 -9 30 -2 9Z" style="fill:var(--w,url(#g2wA))" opacity=".92"/><path d="M2 3 C20 6 38 14 32 30 C26 41 9 30 2 9Z" style="fill:var(--w,url(#g2wA))" opacity=".92"/>' +
        '<circle cx="-30" cy="-18" r="5.5" fill="#fff" opacity=".55"/><circle cx="30" cy="-18" r="5.5" fill="#fff" opacity=".55"/><circle cx="-30" cy="-18" r="2.6" fill="#2a0f1c" opacity=".7"/><circle cx="30" cy="-18" r="2.6" fill="#2a0f1c" opacity=".7"/>' +
        '<path d="M-2 -4 C-14 -34 -44 -40 -47 -18 C-49 -4 -30 4 -2 2Z M2 -4 C14 -34 44 -40 47 -18 C49 -4 30 4 2 2Z" fill="none" stroke="#2a0f1c" stroke-opacity=".45" stroke-width="1.6"/>' +
        '<ellipse cx="0" cy="2" rx="3.2" ry="17" fill="#2a1a22"/><path d="M-1 -14 C-6 -26 -10 -30 -14 -32 M1 -14 C6 -26 10 -30 14 -32" stroke="#2a1a22" stroke-width="1.6" fill="none" stroke-linecap="round"/></symbol>' +
      '<symbol id="g2sil" viewBox="-50 -42 100 84"><path d="M-2 -4 C-14 -34 -44 -40 -47 -18 C-49 -4 -30 4 -2 2Z M2 -4 C14 -34 44 -40 47 -18 C49 -4 30 4 2 2Z M-2 3 C-20 6 -38 14 -32 30 C-26 41 -9 30 -2 9Z M2 3 C20 6 38 14 32 30 C26 41 9 30 2 9Z"/><ellipse cx="0" cy="2" rx="3.4" ry="16"/></symbol>' +
      '</defs></svg>';
    document.body.appendChild(d);
  }
  const bfly = (who, size, extra) => '<svg class="g2-bf ' + (extra || '') + '" viewBox="-50 -42 100 84" width="' + size + '" height="' + Math.round(size * 0.84) + '" style="--w:url(#g2w' + (who === 'b' ? 'B' : who === 'c' ? 'C' : 'A') + ')" aria-hidden="true"><use href="#g2bf" x="-50" y="-42" width="100" height="84"/></svg>';
  /* Spieler-Kopf: beide Namen, Farbe, Punktestand, wer dran ist */
  function playersHtml(g, score, cur) {
    const one = (p) => '<div class="g2-pl p' + p + (cur === p ? ' cur' : '') + '"><span class="g2-dot" style="background:' + PC[p].main + '"></span><span class="g2-pn">' + esc(nameOf(g, p)) + '</span>' + (score ? '<b>' + score(p) + '</b>' : '') + (cur === p ? '<span class="g2-now">ist dran</span>' : '') + '</div>';
    return '<div class="g2-pls">' + one('a') + one('b') + '</div>';
  }
  /* 3D-Würfel (CSS): Wert v, rollt beim ersten Zeichnen nach einem Wurf */
  const FACE = { 1: [-14, 18], 2: [-104, 18], 3: [-14, -72], 4: [-14, 108], 5: [76, 18], 6: [-14, 198] };
  const PIPS9 = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const faceHtml = (v) => '<div class="d3-f f' + v + '">' + Array.from({ length: 9 }, (_, k) => '<i' + (PIPS9[v].includes(k) ? ' class="on"' : '') + '></i>').join('') + '</div>';
  function die3d(v, opt) {
    opt = opt || {}; const [x, y] = FACE[v] || FACE[1];
    const tr = 'rotateX(' + x + 'deg) rotateY(' + y + 'deg)';
    const from = opt.roll ? 'rotateX(' + (x - 720 - Math.round(Math.random() * 180)) + 'deg) rotateY(' + (y + 540 + Math.round(Math.random() * 180)) + 'deg)' : tr;
    return '<' + (opt.btn ? 'button type="button"' : 'div') + ' class="d3' + (opt.cls ? ' ' + opt.cls : '') + '"' + (opt.attr || '') + '><div class="d3-c" style="transform:' + from + '" data-to="' + tr + '">' + [1, 2, 3, 4, 5, 6].map(faceHtml).join('') + '</div>' + (opt.label ? '<span class="d3-l">' + opt.label + '</span>' : '') + '</' + (opt.btn ? 'button' : 'div') + '>';
  }
  function spinDice(root) { const cs = root.querySelectorAll('.d3-c'); requestAnimationFrame(() => requestAnimationFrame(() => cs.forEach((c) => { c.style.transform = c.dataset.to; }))); }
  let rolledAt = 0; const justRolled = () => Date.now() - rolledAt < 500;

  /* So geht's – erscheint beim ersten Spiel jeder Art von selbst, später über „?“ */
  const HELP = {
    raupe: ['🐛 Raupe rät', '<ol><li>Eine Person denkt sich ein Wort aus (oder nimmt eins aus der App).</li><li>Die andere tippt Buchstaben an. Richtige erscheinen im Wort.</li><li>Jeder falsche Buchstabe macht die Raupe müder. Nach 8 Fehlern schläft sie ein – dann gewinnt, wer das Wort ausgedacht hat.</li><li>Wird das Wort vorher erraten, schlüpft ein Schmetterling: gewonnen!</li></ol>'],
    wiese: ['🌼 Wiese durchsuchen', '<ol><li>Jede Person versteckt 6 Schmetterlings-Schwärme (Größen 4, 3, 3, 2, 2, 2) auf der eigenen Wiese. „Neu verteilen“ würfelt die Verstecke.</li><li>Abwechselnd tippt ihr ein Feld auf der Wiese der anderen Person an.</li><li>Flattert ein Schmetterling auf, darfst du gleich nochmal. Nur Gras: Die andere Person ist dran.</li><li>Wer zuerst alle Schmetterlinge gefunden hat, gewinnt.</li></ol>'],
    wuerfel: ['🎲 Würfelwiese', '<ol><li>Wer dran ist, würfelt bis zu dreimal. Würfel antippen, um sie zu behalten.</li><li>Danach eine freie Zeile im Block wählen – die Zahl zeigt, wie viele Punkte sie bringt.</li><li>Oben zählen gleiche Augen (63 Punkte oben bringen 35 Bonus). Unten: Pasch, Full House (3+2), Straßen, Schwarm (5 gleiche) und Chance (Summe).</li><li>Passt nichts, eine Zeile mit 0 streichen. Am Ende gewinnt die höhere Summe.</li></ol>'],
    beete: ['🌸 Blumenbeete', '<ol><li>Zwischen den Steinen liegen 16 Beete. Abwechselnd setzt ihr je <b>ein Zaunstück</b>.</li><li><b>Tippe zwischen zwei benachbarte Steine.</b> Das Zaunstück leuchtet auf – zum Setzen nochmal tippen oder „Zaun setzen“.</li><li>Setzt du das vierte Zaunstück um ein Beet, wächst dort deine Blume und <b>du bist gleich nochmal dran</b>.</li><li>Sind alle Beete eingezäunt, gewinnt, wer mehr Blumen hat.</li></ol><p class="g2-tip">Tipp: Setze nie das dritte Zaunstück um ein Beet – sonst schließt die andere Person es.</p>'],
    quiz: ['🧐 Wahr oder Falter?', '<ol><li>Abwechselnd bekommt ihr eine Behauptung über echte Schmetterlinge.</li><li>Tippt <b>Wahr</b> oder <b>Erfunden</b>. Danach zeigt Papillon, was stimmt – und warum.</li><li>Jede richtige Antwort bringt einen Punkt. Nach 10 Fragen gewinnt, wer mehr Punkte hat.</li></ol>'],
    wanderzug: ['🦋 Wanderzug (Backgammon)', '<ol><li>Rosé zieht gegen den Uhrzeigersinn nach unten rechts, Gold in die Gegenrichtung. Ziel: alle 15 Steine ins eigene Viertel bringen und dann vom Brett nehmen („Heimfliegen“).</li><li>„Würfeln“, dann einen leuchtenden Stein antippen und eines der markierten Ziele wählen. Jeder Würfel ist ein Zug; ein Pasch zählt doppelt.</li><li>Auf Felder mit 2 oder mehr fremden Steinen darf man nicht. Steht dort genau 1 fremder Stein, wird er geschlagen und muss von der Mitte neu einsteigen.</li><li>Die App zeigt nur erlaubte Züge an.</li></ol>']
  };
  function helpShow(kind) {
    const el = $('g2Screen'); if (!el || !HELP[kind]) return; const h = HELP[kind];
    const ov = document.createElement('div'); ov.className = 'g2-hand g2-help';
    ov.innerHTML = '<div class="g2-help-card"><h2>' + h[0] + '</h2><div class="g2-help-b">' + h[1] + '</div><button type="button" class="pill-btn primary">Verstanden</button></div>';
    el.appendChild(ov); ov.querySelector('button').onclick = () => ov.remove();
    const s = S(); if (!s.g2help) s.g2help = {}; if (!s.g2help[kind]) { s.g2help[kind] = 1; L.save(); }
  }

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
    if (g.kind === 'quiz' && !qzEnd[g.id]) return; // erst nach der letzten Auflösung
    C('g2_done:' + g.kind); if (g.finished) return; g.finished = true; L.save();
    setTimeout(() => {
      if (!$('g2Screen')) return;
      const w = g.winner; const draw = !w || w === 'draw';
      const wn = draw ? '' : nameOf(g, w); const iWon = !draw && g.mode === 'relay' && w === g.me; const iLost = !draw && g.mode === 'relay' && w !== g.me;
      const box = document.createElement('div'); box.className = 'g2-end';
      box.innerHTML = '<div class="g2-end-card"><div class="g2-big">' + (draw ? '🤝' : '🏆') + '</div><h2>' + (draw ? 'Unentschieden!' : (g.mode === 'relay' ? (iWon ? 'Du gewinnst!' : esc(you()) + ' gewinnt!') : esc(wn) + ' gewinnt!')) + '</h2>' +
        (g.prize && !draw ? '<p class="g2-prize">🎁 Einsatz: <b>' + esc(g.prize) + '</b></p>' + (iLost || g.mode === 'pass' ? '<button type="button" class="pill-btn primary" data-coupon>🎟️ Als Gutschein ' + (g.mode === 'pass' ? 'festhalten' : 'an ' + esc(you()) + ' schicken') + '</button>' : (iWon ? '<p class="about">Den schuldet dir ' + esc(you()) + ' jetzt. 😉</p>' : '')) : '') +
        (Math.random() < 0.4 ? '<p class="g2-nudge">📵 ' + esc(NUDGES[rnd(NUDGES.length)]) + '</p>' : '') +
        (g.kind === 'quiz' && window.LZWI ? window.LZWI.hint() : '') +
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
    wanderzug: (g) => { g.st = bgStart(); g.turn = Math.random() < 0.5 ? 'a' : 'b'; },
    quiz: (g) => { g.st = { qs: shuffle(Array.from({ length: QZ().length }, (_, k) => k)).slice(0, QZ_N), i: 0, pts: { a: 0, b: 0 }, last: null }; g.turn = 'a'; }
  };
  const KEYROWS = ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', 'YXCVBNM'];
  function raupeSvg(wrong, done, won) {
    const segs = RAUPE_MAX, w = 330, cy = 62; let s = '<svg class="rp-svg" viewBox="0 0 ' + w + ' 120" role="img" aria-label="Raupe">';
    s += '<path d="M6 104 Q 80 92 165 100 T 324 98" stroke="#5b8f3c" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M40 100 q 8 -16 18 -2 M250 98 q 9 -15 18 -1" stroke="#76b04e" stroke-width="4" fill="none"/>';
    if (done && won) { s += '<g transform="translate(165 58)">' + '<use href="#g2bf" x="-48" y="-40" width="96" height="80" style="--w:url(#g2wA)" class="rp-fly"/></g></svg>'; return s; }
    for (let i = 0; i < segs; i++) {
      const x = 30 + i * 30, y = cy + Math.sin(i * 0.9) * 6, asleep = i < wrong;
      s += '<g class="rp-seg' + (asleep ? ' zz' : '') + '"><line x1="' + (x - 6) + '" y1="' + (y + 16) + '" x2="' + (x - 8) + '" y2="' + (y + 26) + '" stroke="#2f5d22" stroke-width="3" stroke-linecap="round"/><line x1="' + (x + 6) + '" y1="' + (y + 16) + '" x2="' + (x + 8) + '" y2="' + (y + 26) + '" stroke="#2f5d22" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="19" fill="' + (asleep ? '#7d86a8' : '#7ccf55') + '"/><circle cx="' + (x - 5) + '" cy="' + (y - 6) + '" r="9" fill="#fff" opacity=".22"/><circle cx="' + x + '" cy="' + (y + 4) + '" r="4" fill="' + (asleep ? '#5a6385' : '#4e9a35') + '"/></g>';
      if (asleep && i === wrong - 1) s += '<text x="' + (x + 2) + '" y="' + (y - 26) + '" class="rp-z">z</text>';
    }
    const hx = 30 + segs * 30, hy = cy - 4, sleepy = wrong >= segs - 2, lid = Math.min(1, wrong / segs);
    s += '<g class="rp-head"><path d="M' + (hx - 6) + ' ' + (hy - 20) + ' q -6 -18 -16 -20 M' + (hx + 8) + ' ' + (hy - 20) + ' q 8 -18 18 -18" stroke="#2f5d22" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="' + (hx - 22) + '" cy="' + (hy - 40) + '" r="4" fill="#f2c14e"/><circle cx="' + (hx + 26) + '" cy="' + (hy - 38) + '" r="4" fill="#f2c14e"/>' +
      '<circle cx="' + hx + '" cy="' + hy + '" r="25" fill="#8ee05f"/><circle cx="' + (hx - 7) + '" cy="' + (hy - 9) + '" r="11" fill="#fff" opacity=".25"/>';
    [[-9, -4], [9, -4]].forEach(([dx, dy]) => { s += '<ellipse cx="' + (hx + dx) + '" cy="' + (hy + dy) + '" rx="5.5" ry="' + Math.max(0.8, 6.5 * (1 - lid)) + '" fill="#1d2a16"/>' + (lid < 0.7 ? '<circle cx="' + (hx + dx + 1.5) + '" cy="' + (hy + dy - 2) + '" r="1.6" fill="#fff"/>' : ''); });
    s += '<path d="M' + (hx - 7) + ' ' + (hy + 11) + ' q 7 ' + (sleepy ? 2 : 6) + ' 14 0" stroke="#1d2a16" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="' + (hx - 15) + '" cy="' + (hy + 6) + '" r="4" fill="#ff8fab" opacity=".55"/><circle cx="' + (hx + 15) + '" cy="' + (hy + 6) + '" r="4" fill="#ff8fab" opacity=".55"/></g>';
    return s + '</svg>';
  }
  function raupeRender(g, el) {
    const st = g.st;
    if (st.phase === 'set') {
      const setter = 'a';
      if (!myTurn(g)) { el.innerHTML = waitHtml(g); return; }
      el.innerHTML = playersHtml(g, null, 'a') + raupeSvg(0, false, false) + '<p class="g2-p">' + (g.mode === 'pass' ? '<b>' + esc(nameOf(g, setter)) + '</b>, denk dir ein Wort aus – ' + esc(nameOf(g, 'b')) + ' schaut weg!' : 'Denk dir ein Wort aus, ' + esc(you()) + ' muss es erraten.') + '</p>' +
        '<div class="field"><input id="rpWord" type="password" maxlength="18" autocomplete="off" autocapitalize="characters" placeholder="Dein Wort (nur Buchstaben)"></div>' +
        '<div class="row wrap"><button class="pill-btn ghost" data-rand>🎲 Wort aus der App</button><button class="pill-btn primary" data-ok>' + (g.mode === 'pass' ? 'Handy weitergeben' : 'Wort schicken') + '</button></div>';
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
    const shown = word.split('').map((c) => (st.guessed.includes(c) || done) ? c : '');
    el.innerHTML = playersHtml(g, null, done ? null : 'b') + raupeSvg(st.wrong, done, g.winner === 'b') +
      '<div class="rp-word">' + shown.map((c, i) => '<span class="' + (c ? 'got' : '') + (done && !st.guessed.includes(word[i]) ? ' miss' : '') + '">' + c + '</span>').join('') + '</div>' +
      '<p class="g2-p" style="text-align:center">' + (done ? (g.winner === 'b' ? 'Geschlüpft! Das Wort war <b>' + esc(word) + '</b>.' : 'Eingeschlafen … das Wort war <b>' + esc(word) + '</b>.') : (myTurn(g) ? 'Noch <b>' + (RAUPE_MAX - st.wrong) + '</b> Fehler, bevor die Raupe einschläft.' : '')) + '</p>' +
      (done ? '' : myTurn(g) ? '<div class="rp-keys">' + KEYROWS.map((r) => '<div>' + r.split('').map((c) => '<button type="button" data-k="' + c + '"' + (st.guessed.includes(c) ? ' disabled class="' + (word.includes(c) ? 'hit' : 'miss') + '"' : '') + '>' + c + '</button>').join('') + '</div>').join('') + '</div>' : waitHtml(g));
    el.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => {
      const c = b.dataset.k; if (st.guessed.includes(c)) return; st.guessed.push(c);
      if (!word.includes(c)) { st.wrong++; L.haptic(25); } else L.haptic(8);
      const solved = word.split('').every((x) => st.guessed.includes(x));
      if (solved || st.wrong >= RAUPE_MAX) { g.turn = 'done'; g.winner = solved ? 'b' : 'a'; commit(g); }
      else { g.updated = Date.now(); L.save(); render(); }
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
      el.innerHTML = playersHtml(g, null, who) + '<p class="g2-p">' + (g.mode === 'pass' ? '<b>' + esc(nameOf(g, who)) + '</b>, versteck deine Schmetterlinge – die andere Person schaut weg!' : 'Versteck deine Schmetterlinge auf der Wiese.') + '</p>' + gridHtml(g.draft, [], true, false, false, who) +
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
    const myShots = st.shots[shooter], theirShots = st.shots[target];
    const found = (fleet, shots) => fleet.filter((sh) => sh.every((c) => shots.includes(c))).length;
    el.innerHTML = playersHtml(g, (p) => found(st.fleet[other(p)], st.shots[p]) + '/' + FLEET.length, g.turn === 'done' ? null : g.turn) +
      '<div class="ws-head"><span>' + (g.mode === 'pass' ? esc(nameOf(g, shooter)) + ' sucht auf der Wiese von ' + esc(nameOf(g, target)) : 'Wiese von ' + esc(you())) + '</span></div>' +
      gridHtml(st.fleet[target], myShots, g.turn === 'done', myTurn(g), false, target) +
      (g.mode === 'relay' || g.turn === 'done' ? '<div class="ws-head small"><span>Deine Wiese</span></div>' + gridHtml(st.fleet[shooter], theirShots, true, false, true, shooter) : '') +
      (!myTurn(g) && g.turn !== 'done' ? waitHtml(g) : '');
    const tCells = st.fleet[target].flat();
    el.querySelectorAll('.ws-grid.live button').forEach((b) => b.onclick = () => {
      const i = Number(b.dataset.i); if (myShots.includes(i)) return; myShots.push(i);
      const hit = tCells.includes(i); L.haptic(hit ? 25 : 6);
      if (tCells.every((c) => myShots.includes(c))) { g.turn = 'done'; g.winner = shooter; }
      else if (!hit) g.turn = target;
      g.lastShot = i;
      commit(g, { toast: hit ? '🦋 Aufgeflattert! Du darfst nochmal' : '🌿 Nur Gras – ' + you() + ' ist dran' });
      if (g.mode === 'pass' && !hit && g.turn !== 'done') handover(g, g.turn);
    });
  }
  /* fleet: Liste von Schwärmen (Zellenlisten); owner bestimmt die Farbe der Schmetterlinge */
  function gridHtml(fleet, shots, reveal, live, small, owner) {
    const cells = fleet.flat(); const sunk = new Set(); fleet.forEach((sh) => { if (sh.every((c) => shots.includes(c))) sh.forEach((c) => sunk.add(c)); });
    let h = '<div class="ws-grid' + (live ? ' live' : '') + (small ? ' small' : '') + '">';
    for (let i = 0; i < N8 * N8; i++) {
      const s = cells.includes(i), sh = shots.includes(i);
      const cls = sh ? (s ? 'hit' + (sunk.has(i) ? ' sunk' : '') : 'miss') : (reveal && s ? 'own' : '');
      const inner = sh ? (s ? bfly(owner, small ? 22 : 30, 'ws-bf') : '<span class="ws-tuft"></span>') : (reveal && s ? bfly(owner, small ? 20 : 26, 'ws-bf ghost') : '');
      h += '<button type="button" data-i="' + i + '" class="' + cls + '"' + (live && !sh ? ' aria-label="Feld ' + (i + 1) + '"' : ' tabindex="-1"') + '>' + inner + '</button>';
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
  const CATN = { '1': 'Einser', '2': 'Zweier', '3': 'Dreier', '4': 'Vierer', '5': 'Fünfer', '6': 'Sechser', '3k': 'Dreierpasch', '4k': 'Viererpasch', fh: 'Full House', ss: 'Kleine Straße', ls: 'Große Straße', sw: 'Schwarm', ch: 'Chance' };
  const CATH = { '1': 'nur Einser zählen', '2': 'nur Zweier zählen', '3': 'nur Dreier zählen', '4': 'nur Vierer zählen', '5': 'nur Fünfer zählen', '6': 'nur Sechser zählen', '3k': '3 gleiche · Summe aller', '4k': '4 gleiche · Summe aller', fh: '3 + 2 gleiche · 25', ss: '4 in Folge · 30', ls: '5 in Folge · 40', sw: '5 gleiche · 50', ch: 'Summe aller' };
  function wuerfelRender(g, el) {
    const st = g.st, cur = g.turn === 'done' ? null : g.turn, live = myTurn(g);
    const ta = total(st.card.a), tb = total(st.card.b);
    const canHold = live && st.rolls > 0 && st.rolls < 3, roll = justRolled();
    const best = live && cur && st.rolls > 0 ? CATS.map(([k]) => k).filter((k) => st.card[cur][k] == null).reduce((bk, k) => (catScore(k, st.dice) > (bk ? catScore(bk, st.dice) : -1) ? k : bk), null) : null;
    el.innerHTML = playersHtml(g, (p) => total(st.card[p]).all, cur) +
      '<div class="wf-tray">' + (st.rolls ? '<div class="wf-dice">' + st.dice.map((v, i) => die3d(v, { btn: true, roll: roll && !st.held[i], cls: st.held[i] ? 'held' : '', attr: ' data-d="' + i + '"' + (canHold ? '' : ' disabled') + ' aria-label="Würfel ' + v + (st.held[i] ? ', gehalten' : '') + '"', label: st.held[i] ? 'behalten' : '' })).join('') + '</div>' : '<div class="wf-empty">' + (live ? 'Bereit? Bis zu dreimal würfeln.' : '') + '</div>') +
      (live ? '<div class="wf-act"><span class="wf-n">' + (st.rolls ? 'Wurf ' + st.rolls + ' von 3' : '') + '</span><button class="pill-btn primary" data-roll' + (st.rolls >= 3 ? ' disabled' : '') + '>🎲 ' + (st.rolls ? 'Nochmal' : 'Würfeln') + '</button></div>' + (canHold ? '<p class="wf-hint">Tippe Würfel an, die du behalten willst – oder wähle unten eine Zeile.</p>' : (st.rolls >= 3 ? '<p class="wf-hint">Jetzt unten eine Zeile wählen.</p>' : '')) : (cur ? waitHtml(g) : '')) + '</div>' +
      '<div class="wf-card"><div class="wf-row wf-th"><span></span><span class="pa">' + esc(nameOf(g, 'a')) + '</span><span class="pb">' + esc(nameOf(g, 'b')) + '</span></div>' +
      CATS.map(([k], i) => {
        const cell = (p) => { const v = st.card[p][k]; if (v != null) return '<span class="v' + (v === 0 ? ' z' : '') + '">' + (v === 0 ? '–' : v) + '</span>'; if (live && p === cur && st.rolls > 0) { const sc = catScore(k, st.dice); return '<span><button type="button" class="opt' + (k === best ? ' best' : '') + (sc ? '' : ' zero') + '" data-c="' + k + '">' + (sc || 'streichen') + '</button></span>'; } return '<span class="e"></span>'; };
        return (i === 6 ? '<div class="wf-row wf-sum"><span>Bonus <small>ab 63 oben: ' + ta.up + ' / ' + tb.up + '</small></span><span>' + ta.bonus + '</span><span>' + tb.bonus + '</span></div>' : '') + '<div class="wf-row"><span class="wf-cat"><b>' + CATN[k] + '</b><small>' + CATH[k] + '</small></span>' + cell('a') + cell('b') + '</div>';
      }).join('') + '<div class="wf-row wf-sum big"><span>Gesamt</span><span>' + ta.all + '</span><span>' + tb.all + '</span></div></div>';
    spinDice(el);
    const rb = el.querySelector('[data-roll]'); if (rb) rb.onclick = () => {
      st.dice = st.dice.map((v, i) => (st.held[i] && st.rolls > 0 ? v : 1 + rnd(6))); st.rolls++; L.haptic(12); rolledAt = Date.now();
      g.updated = Date.now(); L.save(); render();
    };
    el.querySelectorAll('.d3[data-d]:not([disabled])').forEach((b) => b.onclick = () => { const i = Number(b.dataset.d); st.held[i] = !st.held[i]; L.haptic(6); L.save(); render(); });
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
  function flowerSvg(p, cx, cy, sz) {
    if (p === 1) { /* Tulpe in Rosé */
      return '<g class="bt-fl" transform="translate(' + cx + ' ' + cy + ') scale(' + sz + ')"><path d="M0 22 C1 10 -1 2 0 -4" stroke="#3f8a35" stroke-width="3" fill="none"/><path d="M0 16 C-10 10 -14 4 -16 -2 C-8 0 -3 6 0 12Z" fill="#5fae45"/><path d="M0 14 C9 9 13 4 15 -1 C8 1 3 6 0 10Z" fill="#4e9a35"/>' +
        '<path d="M-11 -6 C-13 -20 -6 -28 0 -24 C6 -28 13 -20 11 -6 C8 2 -8 2 -11 -6Z" fill="url(#g2wA)"/><path d="M-4 -24 C-2 -14 2 -14 4 -24 C2 -20 -2 -20 -4 -24Z" fill="#ffd3e2" opacity=".7"/></g>';
    }
    let petals = ''; for (let k = 0; k < 12; k++) petals += '<ellipse cx="0" cy="-13" rx="4.2" ry="9" transform="rotate(' + (k * 30) + ')" fill="url(#g2wB)"/>';
    return '<g class="bt-fl" transform="translate(' + cx + ' ' + cy + ') scale(' + sz + ')"><path d="M0 26 L0 6" stroke="#3f8a35" stroke-width="3"/><path d="M0 20 C-9 16 -12 12 -13 8 C-6 9 -2 13 0 16Z" fill="#5fae45"/>' + petals + '<circle r="8.5" fill="#6b3a12"/><circle r="8.5" fill="none" stroke="#3d1f08" stroke-dasharray="1.5 2.5" stroke-width="3"/></g>';
  }
  function beeteRender(g, el) {
    const st = g.st, live = myTurn(g), cur = g.turn === 'done' ? null : g.turn, cnt = (p) => st.box.filter((x) => x === p).length;
    const S0 = 72, O = 24, W = O * 2 + S0 * 4; const pend = g.pend || null;
    let svg = '<svg class="bt-svg" viewBox="0 0 ' + W + ' ' + W + '" role="img" aria-label="Spielfeld Blumenbeete">' +
      '<rect x="2" y="2" width="' + (W - 4) + '" height="' + (W - 4) + '" rx="22" fill="#3f8a35"/><rect x="2" y="2" width="' + (W - 4) + '" height="' + (W - 4) + '" rx="22" filter="url(#g2felt)" opacity=".55"/>' +
      '<rect x="' + (O - 8) + '" y="' + (O - 8) + '" width="' + (S0 * 4 + 16) + '" height="' + (S0 * 4 + 16) + '" rx="14" fill="#5a3a1f"/><rect x="' + (O - 8) + '" y="' + (O - 8) + '" width="' + (S0 * 4 + 16) + '" height="' + (S0 * 4 + 16) + '" rx="14" filter="url(#g2soil)"/>';
    st.box.forEach((o, i) => { if (!o) return; const r = Math.floor(i / 4), c = i % 4; svg += '<rect x="' + (O + c * S0 + 5) + '" y="' + (O + r * S0 + 5) + '" width="' + (S0 - 10) + '" height="' + (S0 - 10) + '" rx="10" fill="' + (o === 1 ? 'rgba(232,70,124,.28)' : 'rgba(242,193,78,.28)') + '"/>' + flowerSvg(o, O + c * S0 + S0 / 2, O + r * S0 + S0 / 2 + 2, 1.15); });
    const fence = (x1, y1, x2, y2, key) => { const last = g.lastEdge === key; return '<g class="bt-fence' + (last ? ' last' : '') + '"><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#3b2210" stroke-width="12" stroke-linecap="round" opacity=".6"/><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="url(#g2fence)" stroke-width="8.5" stroke-linecap="round"/><line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#f0c48f" stroke-width="1.5" stroke-linecap="round" opacity=".7"/></g>'; };
    const ghost = (x1, y1, x2, y2, key) => { const p = pend === key; return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="bt-gap' + (p ? ' pend p' + (cur === 'a' ? 1 : 2) : '') + '"/>'; };
    let hits = '';
    for (let r = 0; r <= 4; r++) for (let c = 0; c < 4; c++) { const i = r * 4 + c, x1 = O + c * S0, y = O + r * S0, k = 'h' + i; svg += st.h[i] ? fence(x1 + 7, y, x1 + S0 - 7, y, k) : ghost(x1 + 10, y, x1 + S0 - 10, y, k); if (!st.h[i] && live) hits += '<path data-e="' + k + '" class="bt-hit" d="M' + (x1 + 6) + ' ' + y + ' L' + (x1 + S0 / 2) + ' ' + (y - S0 / 2 + 6) + ' L' + (x1 + S0 - 6) + ' ' + y + ' L' + (x1 + S0 / 2) + ' ' + (y + S0 / 2 - 6) + 'Z"/>'; }
    for (let r = 0; r < 4; r++) for (let c = 0; c <= 4; c++) { const i = r * 5 + c, x = O + c * S0, y1 = O + r * S0, k = 'v' + i; svg += st.v[i] ? fence(x, y1 + 7, x, y1 + S0 - 7, k) : ghost(x, y1 + 10, x, y1 + S0 - 10, k); if (!st.v[i] && live) hits += '<path data-e="' + k + '" class="bt-hit" d="M' + x + ' ' + (y1 + 6) + ' L' + (x + S0 / 2 - 6) + ' ' + (y1 + S0 / 2) + ' L' + x + ' ' + (y1 + S0 - 6) + ' L' + (x - S0 / 2 + 6) + ' ' + (y1 + S0 / 2) + 'Z"/>'; }
    for (let r = 0; r <= 4; r++) for (let c = 0; c <= 4; c++) svg += '<circle cx="' + (O + c * S0) + '" cy="' + (O + r * S0 + 1.5) + '" r="8" fill="#000" opacity=".35"/><circle cx="' + (O + c * S0) + '" cy="' + (O + r * S0) + '" r="7.5" fill="url(#g2stone)"/>';
    svg += hits + '</svg>';
    const first = st.h.every((x) => !x) && st.v.every((x) => !x);
    el.innerHTML = playersHtml(g, (p) => '🌸 ' + cnt(p === 'a' ? 1 : 2), cur) +
      '<p class="g2-p bt-say">' + (cur ? (live ? (pend ? 'Nochmal tippen oder „Zaun setzen“ – oder ein anderes Stück wählen.' : (first ? '👉 Tippe <b>zwischen zwei Steine</b>, um ein Zaunstück zu setzen.' : '<b>' + esc(nameOf(g, cur)) + '</b>: ein Zaunstück setzen.')) : '') : '') + '</p>' +
      '<div class="bt-wrap' + (live && first && !pend ? ' intro' : '') + '">' + svg + '</div>' +
      (live && pend ? '<div class="row" style="margin-top:8px"><button class="pill-btn ghost" data-undo>Abbrechen</button><button class="pill-btn primary" data-set>Zaun setzen ✓</button></div>' : '') +
      (!live && cur ? waitHtml(g) : '');
    const pl = cur === 'a' ? 1 : 2;
    const boxDone = (b) => { const r = Math.floor(b / 4), c = b % 4; return st.h[r * 4 + c] && st.h[(r + 1) * 4 + c] && st.v[r * 5 + c] && st.v[r * 5 + c + 1]; };
    const play = (key) => {
      const type = key[0], i = Number(key.slice(1));
      if (type === 'h') st.h[i] = pl; else st.v[i] = pl; L.haptic(8); g.pend = null; g.lastEdge = key;
      let closed = 0; for (let b = 0; b < 16; b++) if (!st.box[b] && boxDone(b)) { st.box[b] = pl; closed++; }
      if (st.box.every((x) => x)) { g.turn = 'done'; const A = cnt(1), B = cnt(2); g.winner = A === B ? 'draw' : A > B ? 'a' : 'b'; }
      else if (!closed) g.turn = other(cur);
      if (closed) L.haptic(25);
      commit(g, { toast: closed ? '🌸 Beet geschlossen – du bist nochmal dran' : '🌸 ' + you() + ' ist dran' });
    };
    el.querySelectorAll('[data-e]').forEach((r) => r.addEventListener('click', () => { const k = r.dataset.e; if (g.pend === k) return play(k); g.pend = k; L.haptic(4); render(); }));
    const sb = el.querySelector('[data-set]'); if (sb) sb.onclick = () => play(g.pend);
    const ub = el.querySelector('[data-undo]'); if (ub) ub.onclick = () => { g.pend = null; render(); };
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
    /* Brett 350×330: Rahmen 12, Mitte (Leiste) 22 breit, je Hälfte 6 Spitzen */
    const W = 350, H = 330, F = 12, BAR = 22, half = (W - 2 * F - BAR) / 2, pw = half / 6, r = 11.4, ph = 128;
    const colX = (i) => { const top = i >= 13; let k = top ? i - 13 : 12 - i; return F + k * pw + (k >= 6 ? BAR : 0) + pw / 2; };
    const isTop = (i) => i >= 13;
    let s = '<svg class="wz-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Wanderzug-Brett">' +
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="16" fill="#6a3d1c"/><rect x="0" y="0" width="' + W + '" height="' + H + '" rx="16" filter="url(#g2wood)"/>' +
      '<rect x="' + (F - 2) + '" y="' + (F - 2) + '" width="' + (W - 2 * F + 4) + '" height="' + (H - 2 * F + 4) + '" rx="6" fill="#2a1608" opacity=".55"/>' +
      '<rect x="' + F + '" y="' + F + '" width="' + (W - 2 * F) + '" height="' + (H - 2 * F) + '" rx="4" fill="#0f3a33"/><rect x="' + F + '" y="' + F + '" width="' + (W - 2 * F) + '" height="' + (H - 2 * F) + '" rx="4" filter="url(#g2felt)"/>' +
      '<rect x="' + (F + half) + '" y="' + (F - 2) + '" width="' + BAR + '" height="' + (H - 2 * F + 4) + '" fill="#6a3d1c"/><rect x="' + (F + half) + '" y="' + (F - 2) + '" width="' + BAR + '" height="' + (H - 2 * F + 4) + '" filter="url(#g2wood)"/>';
    for (let i = 1; i <= 24; i++) {
      const cx = colX(i), top = isTop(i), y0 = top ? F : H - F, y1 = top ? F + ph : H - F - ph;
      const fill = (i % 2) ? 'url(#g2ptR)' : 'url(#g2ptI)';
      s += '<path d="M' + (cx - pw / 2 + 1.5) + ' ' + y0 + ' L' + (cx + pw / 2 - 1.5) + ' ' + y0 + ' L' + cx + ' ' + y1 + 'Z" fill="' + fill + '"' + (tgtSet.has(String(i)) ? ' class="wz-tg"' : '') + '/>';
    }
    const disc = (cx, cy, pl, ring, label) => '<g filter="url(#g2shadow)"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#g2chk' + (pl === 'a' ? 'A' : 'B') + ')"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 3) + '" fill="none" stroke="' + (pl === 'a' ? '#ffc2d6' : '#fff6d6') + '" stroke-opacity=".55" stroke-width="1"/>' +
      '<use href="#g2sil" x="' + (cx - 6.5) + '" y="' + (cy - 5.5) + '" width="13" height="11" fill="' + (pl === 'a' ? '#5d0726' : '#7a4a05') + '" opacity=".55"/>' + (label ? '<text x="' + cx + '" y="' + (cy + 4) + '" class="wz-cnt">' + label + '</text>' : '') + '</g>' + (ring ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 2.5) + '" class="wz-ring' + (ring === 'sel' ? ' sel' : '') + '"/>' : '');
    for (let i = 1; i <= 24; i++) {
      const v = st.pts[i], n = Math.abs(v), pl = v > 0 ? 'a' : 'b', cx = colX(i), top = isTop(i);
      const shown = Math.min(n, 5);
      for (let k = 0; k < shown; k++) {
        const cy = top ? F + r + 1 + k * (2 * r - 1) : H - F - r - 1 - k * (2 * r - 1);
        const last = k === shown - 1;
        s += disc(cx, cy, pl, last ? (String(sel) === String(i) ? 'sel' : srcSet.has(String(i)) ? 'src' : '') : '', last && n > 5 ? n : '');
      }
      if (tgtSet.has(String(i))) { const k = (v * (cur === 'a' ? 1 : -1) > 0) ? Math.min(n, 4) : (n === 1 ? 0 : 0); const cy = top ? F + r + 1 + k * (2 * r - 1) : H - F - r - 1 - k * (2 * r - 1); s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" class="wz-ghost"/>'; }
    }
    /* Leiste: geschlagene Steine */
    const bx = F + half + BAR / 2;
    ['b', 'a'].forEach((pl) => { const n = st.bar[pl]; if (!n) return; const cy = pl === 'b' ? H / 2 - 30 : H / 2 + 30; s += disc(bx, cy, pl, srcSet.has('bar') && cur === pl ? (sel === 'bar' ? 'sel' : 'src') : '', n > 1 ? n : ''); });
    /* Trefferflächen */
    for (let i = 1; i <= 24; i++) { const cx = colX(i), top = isTop(i); s += '<rect data-pt="' + i + '" class="wz-hit" x="' + (cx - pw / 2) + '" y="' + (top ? F : H / 2) + '" width="' + pw + '" height="' + (H / 2 - F) + '"/>'; }
    if (st.bar.a || st.bar.b) s += '<rect data-bar="1" class="wz-hit" x="' + (F + half) + '" y="' + F + '" width="' + BAR + '" height="' + (H - 2 * F) + '"/>';
    s += '</svg>';
    const pv = (p) => esc(nameOf(g, p));
    const roll = justRolled();
    const dice = st.dice.length ? '<div class="wz-dice">' + st.dice.map((d, k) => { const usedN = st.dice.slice(0, k + 1).filter((x) => x === d).length; const leftN = st.left.filter((x) => x === d).length; const used = usedN <= (st.dice.filter((x) => x === d).length - leftN); return die3d(d, { roll, cls: used ? 'used' : '' }); }).join('') + '</div>' : '';
    const offT = live && st.left.length && targets.some((m) => m.to === 'off');
    el.innerHTML = playersHtml(g, (p) => '🏡 ' + st.off[p] + '/15', cur) +
      '<div class="wz-wrap">' + s + '<div class="wz-mid">' + dice + (live && !st.left.length ? '<button class="pill-btn primary wz-roll" data-roll>🎲 Würfeln</button>' : '') + '</div></div>' +
      '<div class="wz-ctl">' + (offT ? '<button class="pill-btn primary" data-off>🦋 Heimfliegen</button>' : '') + '</div>' +
      (live && st.left.length && !opts.length ? '<p class="g2-p" style="text-align:center">Kein Zug möglich.</p><div class="row"><button class="pill-btn" data-pass>Weiter</button></div>' : '') +
      (live && st.left.length && opts.length ? '<p class="wz-help">' + (sel == null ? 'Tippe einen leuchtenden Stein an.' : 'Jetzt ein markiertes Ziel antippen.') + '</p>' : '') +
      (!live && cur ? waitHtml(g) : '');
    spinDice(el);
    const endTurn = () => { st.dice = []; st.left = []; g.sel = null; g.turn = other(cur); commit(g, { toast: '🦋 ' + you() + ' ist dran' }); if (g.mode === 'pass') handover(g, g.turn, true); };
    const doMove = (m) => {
      const hit = m.to !== 'off' && oppAt(st, cur, m.to) === 1;
      const ns = apply(st, cur, m); Object.assign(st, ns); g.sel = null; L.haptic(hit ? 30 : 8);
      if (st.off[cur] >= 15) { g.turn = 'done'; g.winner = cur; st.left = []; commit(g); return; }
      if (!st.left.length || !legal(st, cur).length) { if (!st.left.length) return endTurn(); }
      g.updated = Date.now(); L.save(); render(); if (hit) L.toast('💥 Geschlagen – zurück in die Mitte!');
    };
    const rb = el.querySelector('[data-roll]'); if (rb) rb.onclick = () => { const a = 1 + rnd(6), b = 1 + rnd(6); st.dice = a === b ? [a, a, a, a] : [a, b]; st.left = st.dice.slice(); L.haptic(12); rolledAt = Date.now(); g.updated = Date.now(); L.save(); render(); };
    const ps = el.querySelector('[data-pass]'); if (ps) ps.onclick = endTurn;
    const of = el.querySelector('[data-off]'); if (of) of.onclick = () => { const m = targets.filter((x) => x.to === 'off').sort((a, b) => a.d - b.d)[0]; if (m) doMove(m); };
    el.querySelectorAll('[data-pt]').forEach((b) => b.addEventListener('click', () => {
      const i = b.dataset.pt;
      if (tgtSet.has(i)) { const m = targets.filter((x) => String(x.to) === i).sort((a, b2) => a.d - b2.d)[0]; return doMove(m); }
      if (srcSet.has(i)) { g.sel = i; L.haptic(4); render(); }
    }));
    el.querySelectorAll('[data-bar]').forEach((b) => b.addEventListener('click', () => { if (srcSet.has('bar')) { g.sel = 'bar'; render(); } }));
  }

  /* ======================= Wahr oder Falter? (3.41.0) =======================
     Fragen in wissen.js (LZWI.QUIZ, nur hinten ergänzen). Über zwei Handys wandern nur die Nummern der Fragen. */
  const QZ = () => (window.LZWI && window.LZWI.QUIZ) || [];
  const QZ_N = 10, qzSeen = {}, qzEnd = {};
  function quizRender(g, el) {
    const st = g.st, Q = QZ(), score = (p) => st.pts[p];
    if (st.last && qzSeen[g.id] !== st.i && Q[st.last.q]) {
      const q = Q[st.last.q], me = g.mode === 'relay' && st.last.p === g.me, done = g.turn === 'done';
      el.innerHTML = playersHtml(g, score, null) + '<div class="qz-card ' + (st.last.ok ? 'ok' : 'no') + '"><div class="qz-res">' + (st.last.ok ? '✓ Richtig' : '✗ Daneben') + '</div>' +
        '<p class="qz-who">' + esc(nameOf(g, st.last.p)) + (me ? ' hast' : ' hat') + ' „' + (st.last.pick ? 'Wahr' : 'Erfunden') + '“ getippt</p><p class="qz-st">„' + esc(q.s) + '“</p>' +
        '<p class="qz-ans">Das ist <b>' + (q.w ? 'wahr' : 'erfunden') + '</b>. ' + esc(q.x) + '</p></div>' +
        '<div class="row" style="justify-content:center"><button class="pill-btn primary" data-next>' + (done ? '🏁 Zum Ergebnis' : 'Weiter') + '</button></div>';
      el.querySelector('[data-next]').onclick = () => {
        qzSeen[g.id] = st.i;
        if (done) { qzEnd[g.id] = 1; render(); finish(g); return; }
        render(); if (g.mode === 'pass') handover(g, g.turn, true);
      };
      return;
    }
    if (g.turn === 'done') { el.innerHTML = playersHtml(g, score, null) + '<div class="g2-wait">🏁 Alle ' + QZ_N + ' Fragen gespielt.</div>'; return; }
    if (!myTurn(g)) { el.innerHTML = playersHtml(g, score, g.turn) + waitHtml(g); return; }
    const q = Q[st.qs[st.i]];
    if (!q) { el.innerHTML = '<div class="g2-wait">Diese Frage kennt deine App noch nicht – bitte die App einmal schließen und neu öffnen.</div>'; return; }
    el.innerHTML = playersHtml(g, score, g.turn) + '<p class="qz-n">Frage ' + (st.i + 1) + ' von ' + QZ_N + (g.mode === 'pass' ? ' · <b>' + esc(nameOf(g, g.turn)) + '</b> ist dran' : '') + '</p>' +
      '<div class="qz-card"><div class="qz-big" aria-hidden="true">🧐</div><p class="qz-st">„' + esc(q.s) + '“</p></div>' +
      '<div class="qz-btns"><button type="button" class="pill-btn primary" data-a="1">✓ Wahr</button><button type="button" class="pill-btn" data-a="0">✗ Erfunden</button></div>';
    el.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => {
      if (g.turn === 'done' || !myTurn(g)) return;
      const pick = b.dataset.a === '1' ? 1 : 0, ok = pick === q.w, p = g.turn;
      if (ok) st.pts[p]++;
      st.last = { q: st.qs[st.i], p, pick, ok }; st.i++;
      if (st.i >= QZ_N) { g.turn = 'done'; g.winner = st.pts.a > st.pts.b ? 'a' : st.pts.b > st.pts.a ? 'b' : 'draw'; } else g.turn = other(p);
      L.haptic(ok ? 15 : 30);
      commit(g, { toast: '🧐 ' + you() + ' ist dran' });
    });
  }

  /* ---------- Bildschirm ---------- */
  const RENDER = { raupe: raupeRender, wiese: wieseRender, wuerfel: wuerfelRender, beete: beeteRender, wanderzug: wanderRender, quiz: quizRender };
  let curId = null;
  function waitHtml(g) { return '<div class="g2-wait">⏳ ' + esc(you()) + ' ist dran. Du bekommst Bescheid.</div>'; }
  function open(id) {
    const g = store()[id]; if (!g) return; if (g.ab) { L.toast(KINDS[g.kind].icon + ' Dieses Spiel wurde beendet'); return; } curId = id;
    (S().inbox || []).forEach((m) => { if (m.t === 'spiel' && m.gid === id) m.read = true; }); L.save();
    let el = $('g2Screen');
    if (!el) { el = document.createElement('div'); el.id = 'g2Screen'; el.className = 'g2'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); document.documentElement.classList.add('cam-open'); }
    if (g.unsent && g.mode === 'relay') { g.n--; g.unsent = false; commit(g); }
    render(); if (P()) P().renderAll();
  }
  function render() {
    const el = $('g2Screen'); if (!el) return; const g = store()[curId]; if (!g) return close();
    const K = KINDS[g.kind]; ensureDefs();
    el.innerHTML = '<div class="g2-top"><button type="button" class="icon-btn" data-x aria-label="Schließen – später weiterspielen" title="Schließen – später weiterspielen">✕</button><span class="g2-title">' + esc(K.title) + '</span><button type="button" class="icon-btn" data-menu aria-label="Spiel-Menü: So geht’s, neu starten, beenden" title="Spiel-Menü">⋯</button></div>' +
      (g.prize ? '<div class="g2-prizebar">🎁 Einsatz: ' + esc(g.prize) + '</div>' : '') + '<div class="g2-body g2-' + g.kind + '"></div>';
    el.querySelector('[data-x]').onclick = close;
    el.querySelector('[data-menu]').onclick = () => menu(g);
    RENDER[g.kind](g, el.querySelector('.g2-body'));
    if (!(S().g2help || {})[g.kind] && !el.querySelector('.g2-hand')) helpShow(g.kind);
  }
  function close() { const el = $('g2Screen'); if (el) el.remove(); document.documentElement.classList.remove('cam-open'); curId = null; refreshOutside(); }
  /* Spiel-Menü: So geht’s · Neu starten · Spiel beenden (3.34.0) */
  function menu(g) {
    const el = $('g2Screen'); if (!el) return; const K = KINDS[g.kind], done = g.turn === 'done';
    const ov = document.createElement('div'); ov.className = 'g2-hand g2-menu';
    const relay = g.mode === 'relay' && g.n > 0 && !done;
    const main = () => {
      ov.innerHTML = '<div class="g2-help-card"><h2>' + K.icon + ' ' + esc(K.title) + '</h2><div class="g2-mlist">' +
        '<button type="button" class="pill-btn" data-m="help">❓ So geht’s</button>' +
        '<button type="button" class="pill-btn" data-m="new">🔄 ' + (done ? 'Neues Spiel' : 'Neu starten') + '</button>' +
        (done ? '' : '<button type="button" class="pill-btn" data-m="end">🏳️ Spiel beenden</button>') +
        '<button type="button" class="pill-btn ghost" data-m="back">Weiterspielen</button></div>' +
        '<p class="g2-mhint">✕ oben links schließt nur – das Spiel wartet dann auf euch.</p></div>';
      ov.querySelector('[data-m="help"]').onclick = () => { ov.remove(); helpShow(g.kind); };
      ov.querySelector('[data-m="back"]').onclick = () => ov.remove();
      ov.querySelector('[data-m="new"]').onclick = () => done ? (ov.remove(), restart(g)) : ask('new');
      const e = ov.querySelector('[data-m="end"]'); if (e) e.onclick = () => ask('end');
    };
    const ask = (what) => {
      const isNew = what === 'new';
      ov.innerHTML = '<div class="g2-help-card"><div class="g2-big">' + (isNew ? '🔄' : '🏳️') + '</div><h2>' + (isNew ? 'Neu starten?' : 'Spiel beenden?') + '</h2>' +
        '<p>Der jetzige Spielstand geht verloren' + (g.prize ? ', der Einsatz verfällt' : '') + '.' + (relay ? ' ' + esc(you()) + ' bekommt Bescheid.' : '') + '</p>' +
        '<div class="g2-mlist"><button type="button" class="pill-btn primary" data-yes>' + (isNew ? 'Ja, neu starten' : 'Ja, beenden') + '</button><button type="button" class="pill-btn ghost" data-no>Zurück</button></div></div>';
      ov.querySelector('[data-no]').onclick = main;
      ov.querySelector('[data-yes]').onclick = () => { ov.remove(); abort(g, isNew ? () => restart(g) : null); };
    };
    main(); el.appendChild(ov);
  }
  /* Beenden: an einem Handy einfach weg; über zwei Handys bekommt der Schatz ein „beendet“ (Zugnummer weit vorn, damit es sicher ankommt) */
  async function abort(g, then) {
    const sendIt = g.mode === 'relay' && g.n > 0 && g.turn !== 'done';
    C('g2_abort:' + g.kind + ':' + g.mode);
    if (sendIt) {
      g.ab = true; g.finished = true; g.turn = 'done'; g.winner = null; g.n += 100; g.updated = Date.now(); L.save();
      try { await P().send({ t: 'spiel', k: g.kind, id: g.id, n: g.n, st: g.st, turn: 'done', prize: g.prize, winner: null, op: 'move', ab: 1 }); }
      catch (e) { L.toast('Konnte ' + you() + ' nicht Bescheid geben – bei dir ist das Spiel beendet'); }
    } else delete store()[g.id];
    (S().inbox || []).forEach((m) => { if (m.t === 'spiel' && m.gid === g.id) m.read = true; });
    L.save(); close();
    if (then) then(); else L.toast(KINDS[g.kind].icon + ' Spiel beendet');
  }
  /* Neu starten: gleiche Spielweise und gleicher Einsatz, ohne erneutes Auswählen */
  function restart(g) {
    const mode = g.mode === 'relay' && !on() ? 'pass' : g.mode;
    const n = { id: uid('s'), kind: g.kind, mode, mine: true, me: 'a', turn: 'a', n: 0, prize: g.prize || '', created: Date.now(), updated: Date.now(), st: null };
    INIT[g.kind](n); store()[n.id] = n; L.save(); C('g2_new:' + g.kind + ':' + mode + ':restart');
    if (g.turn === 'done' && g.mode === 'pass') delete store()[g.id];
    open(n.id);
    if (n.mode === 'relay' && n.turn !== n.me) commit(n, { toast: KINDS[g.kind].icon + ' ' + you() + ' beginnt' });
  }
  /* An einem Handy: Übergabe-Hinweis, damit die andere Person nicht ins Versteck schaut */
  function handover(g, p, soft) {
    const el = $('g2Screen'); if (!el) return;
    const ov = document.createElement('div'); ov.className = 'g2-hand';
    ov.innerHTML = '<div class="g2-help-card"><div class="g2-hand-who"><span class="g2-dot big" style="background:' + PC[p].main + '"></span></div><h2>' + esc(nameOf(g, p)) + ' ist dran</h2><p>' + (soft ? 'Handy rüberreichen.' : 'Handy rüberreichen – und nicht spicken!') + '</p><button type="button" class="pill-btn primary">Bin bereit</button></div>';
    el.appendChild(ov); ov.querySelector('button').onclick = () => ov.remove();
  }

  /* ---------- Nachrichten vom Schatz ---------- */
  function received(obj, created) {
    if (!KINDS[obj.k] || typeof obj.id !== 'string' || obj.id.length > 40 || !Number.isInteger(obj.n) || !obj.st || typeof obj.st !== 'object') return false;
    const gs = store(); let g = gs[obj.id];
    if (!g) { if (obj.op !== 'new') return false; g = gs[obj.id] = { id: obj.id, kind: obj.k, mode: 'relay', mine: false, me: 'b', turn: 'a', n: 0, prize: String(obj.prize || '').slice(0, 60), created: created || Date.now(), updated: Date.now(), st: null }; }
    if (obj.n <= g.n) return false; // schon bekannt
    g.st = obj.st; g.n = obj.n; g.turn = ['a', 'b', 'done'].includes(obj.turn) ? obj.turn : g.turn; g.winner = obj.winner || null; g.updated = Date.now();
    if (obj.ab) { g.ab = true; g.finished = true; g.turn = 'done'; g.winner = null; }
    const K = KINDS[g.kind], name = you();
    const text = g.ab ? K.icon + ' ' + name + ' hat ' + K.title + ' beendet' : g.turn === 'done' ? K.icon + ' ' + K.title + ': Spiel vorbei' : g.turn === g.me ? K.icon + ' ' + name + ': ' + K.title + ' – du bist dran' : K.icon + ' ' + K.title + ': ' + name + ' hat gezogen';
    const s = S(); if (!s.inbox) s.inbox = []; s.inbox = s.inbox.filter((m) => !(m.t === 'spiel' && m.gid === g.id));
    s.inbox.push({ id: uid('m'), t: 'spiel', gid: g.id, text, at: created || Date.now(), read: false });
    L.toast(text); L.save();
    if (curId === g.id) { if (g.ab) close(); else { render(); if (g.turn === 'done') finish(g); } }
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
    const frag = document.createDocumentFragment(); ['wanderzug', 'quiz', 'wiese', 'raupe', 'wuerfel', 'beete'].forEach((k) => { const t = tileFor(k); t.setAttribute('data-g2', k); frag.appendChild(t); });
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
  window.LZG2 = { helpShow, die3d, bfly, PC, newGame, open, games: store, received, legal, movesFor, apply, bgStart, catScore, KINDS, PRIZES };

  function CSS() { return `
.g2 { position:fixed; inset:0; z-index:84; background:radial-gradient(120% 80% at 50% 0%, #2a1230 0%, var(--bg0, #1a0a1e) 60%); color:var(--text); overflow-y:auto; padding:calc(8px + env(safe-area-inset-top)) 12px calc(24px + env(safe-area-inset-bottom)); }
.g2-top { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:0 auto 8px; max-width:520px; }
.g2-top .icon-btn { width:44px; height:44px; font-size:18px; }
.g2-title { font-family:var(--serif); font-size:22px; letter-spacing:.2px; }
.g2-prizebar { text-align:center; font-size:15px; font-weight:700; color:#ffe2a8; background:linear-gradient(90deg, rgba(242,193,78,.12), rgba(232,70,124,.12)); border:1px solid rgba(242,193,78,.35); border-radius:14px; padding:6px 10px; margin:0 auto 10px; max-width:420px; }
.g2-body { max-width:520px; margin:0 auto; }
.g2-p { font-size:17px; line-height:1.45; margin:6px 0 10px; color:var(--text-soft); }
.g2-wait { text-align:center; font-size:17px; font-weight:700; color:var(--accent-2); margin:14px 0; }
.g2-hint { display:block; font-size:15px; color:var(--text-muted); margin-top:4px; }
.g2-pls { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:2px 0 12px; }
.g2-pl { display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:16px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); min-width:0; position:relative; transition:all .25s; }
.g2-pl.cur { background:rgba(255,255,255,.1); }
.g2-pl.pa.cur, .g2-pl.cur.pa { border-color:#e8467c; box-shadow:0 0 0 1px #e8467c inset, 0 6px 18px rgba(232,70,124,.25); }
.g2-pl.pb.cur, .g2-pl.cur.pb { border-color:#f2c14e; box-shadow:0 0 0 1px #f2c14e inset, 0 6px 18px rgba(242,193,78,.2); }
.g2-pl.pa, .g2-pl.pb { }
.g2-pls .g2-pl:first-child.cur { border-color:#e8467c; box-shadow:0 0 0 1px #e8467c inset, 0 6px 18px rgba(232,70,124,.25); }
.g2-pls .g2-pl:last-child.cur { border-color:#f2c14e; box-shadow:0 0 0 1px #f2c14e inset, 0 6px 18px rgba(242,193,78,.2); }
.g2-dot { flex:none; width:14px; height:14px; border-radius:50%; box-shadow:0 0 0 3px rgba(255,255,255,.08), inset -2px -2px 3px rgba(0,0,0,.25); }
.g2-dot.big { width:40px; height:40px; display:inline-block; }
.g2-pn { flex:1; min-width:0; font-size:16px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.g2-pl b { margin-left:auto; font-size:16px; white-space:nowrap; flex:none; }
.g2-now { position:absolute; right:10px; top:-9px; font-size:11px; font-weight:800; letter-spacing:.4px; text-transform:uppercase; background:var(--bg0,#1a0a1e); padding:1px 6px; border-radius:8px; color:#fff; }
.g2-hand, .g2-end { position:fixed; inset:0; z-index:86; display:flex; align-items:center; justify-content:center; background:rgba(11,4,16,.88); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); text-align:center; padding:20px; }
.g2-hand h2, .g2-end h2 { font-family:var(--serif); font-size:28px; font-weight:400; margin:8px 0; }
.g2-hand p { font-size:17px; color:var(--text-soft); margin-bottom:16px; }
.g2-help-card, .g2-end-card { background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03)), var(--bg1); border:1px solid rgba(255,255,255,.14); border-radius:24px; padding:22px 20px; max-width:380px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,.5); }
.g2-help-b { text-align:left; font-size:16px; line-height:1.5; color:var(--text-soft); margin:6px 0 16px; }
.g2-help-b ol { padding-left:20px; margin:0; } .g2-help-b li { margin:0 0 8px; }
.g2-tip { font-size:15px; background:rgba(242,193,78,.12); border-radius:12px; padding:8px 10px; margin:6px 0 0; }
.g2-big { font-size:54px; }
.g2-mlist { display:flex; flex-direction:column; gap:10px; margin:12px 0 4px; }
.g2-mlist .pill-btn { min-height:50px; font-size:17px; justify-content:center; width:100%; }
.g2-mhint { font-size:14px !important; color:var(--text-muted) !important; margin:10px 0 0 !important; }
.g2-prize { font-size:17px; margin:8px 0 12px; }
.g2-nudge { font-size:16px; color:var(--text-soft); background:var(--glass); border-radius:14px; padding:10px; margin-top:12px; }
/* Raupe */
.rp-svg { width:100%; max-width:420px; display:block; margin:0 auto; }
.rp-seg circle { transition:fill .5s; }
.rp-z { font:700 18px var(--serif, serif); fill:#c9d2f2; animation:rpZ 2.4s ease-in-out infinite; }
@keyframes rpZ { 0% { opacity:0; transform:translateY(6px); } 50% { opacity:1; } 100% { opacity:0; transform:translateY(-10px); } }
.rp-fly { animation:rpFly 2.2s ease-in-out infinite; transform-origin:center; }
@keyframes rpFly { 50% { transform:translateY(-6px) scaleX(.86); } }
.rp-word { display:flex; flex-wrap:wrap; justify-content:center; gap:6px; margin:10px 0 6px; }
.rp-word span { width:28px; height:38px; display:flex; align-items:center; justify-content:center; font-family:var(--serif); font-size:24px; border-radius:8px; background:rgba(255,255,255,.06); border-bottom:3px solid rgba(255,255,255,.25); }
.rp-word span.got { background:rgba(126,207,85,.18); border-bottom-color:#7ccf55; animation:rpPop .3s ease; }
.rp-word span.miss { color:#ff9ec4; }
@keyframes rpPop { 50% { transform:scale(1.15); } }
.rp-keys { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.rp-keys > div { display:flex; justify-content:center; gap:4px; }
.rp-keys button { flex:1; max-width:34px; height:46px; font-size:17px; font-weight:700; border-radius:9px; border:0; background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.07)); color:var(--text); box-shadow:0 2px 0 rgba(0,0,0,.35); padding:0; }
.rp-keys button:active { transform:translateY(2px); box-shadow:none; }
.rp-keys button.hit { background:#4e9a35; color:#fff; }
.rp-keys button.miss { opacity:.25; }
/* Wiese */
.ws-head { display:flex; justify-content:space-between; font-size:15px; font-weight:700; margin:8px 2px; color:var(--text-soft); }
.ws-grid { display:grid; grid-template-columns:repeat(8, 1fr); gap:3px; padding:6px; border-radius:16px; background:linear-gradient(160deg, #2f6b27, #1f4a1b); box-shadow:inset 0 2px 8px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3); }
.ws-grid button { aspect-ratio:1; border:0; border-radius:7px; padding:0; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center;
  background:radial-gradient(circle at 30% 20%, rgba(255,255,255,.18), transparent 45%), repeating-linear-gradient(100deg, #5fae45 0 3px, #56a33f 3px 6px); box-shadow:inset 0 -3px 0 rgba(0,0,0,.18); }
.ws-grid.live button:not(.hit):not(.miss):active { filter:brightness(1.2); }
.ws-grid button.miss { background:repeating-linear-gradient(100deg, #3c7a2e 0 3px, #367029 3px 6px); box-shadow:inset 0 2px 5px rgba(0,0,0,.35); }
.ws-tuft { width:42%; height:42%; border-radius:50%; border:2px solid rgba(220,255,200,.35); }
.ws-grid button.hit { background:radial-gradient(circle, #fff6fb 0%, #ffd9ea 60%, #f5a9c9 100%); }
.ws-grid button.hit.sunk { background:radial-gradient(circle, #ffffff 0%, #eef9e6 70%, #cfeec0 100%); box-shadow:inset 0 0 0 2px #f2c14e, 0 0 10px rgba(242,193,78,.5); }
.ws-grid button.hit .ws-bf { animation:wsUp .6s ease; filter:drop-shadow(0 2px 2px rgba(0,0,0,.35)); }
@keyframes wsUp { 0% { transform:translateY(10px) scale(.4); opacity:0; } 70% { transform:translateY(-3px) scale(1.1); } }
.ws-bf.ghost { opacity:.55; }
.ws-grid.small { width:72%; margin:0 auto; border-radius:12px; padding:4px; gap:2px; }
/* Würfel */
.d3 { --s:52px; width:var(--s); height:var(--s); perspective:420px; border:0; background:transparent; padding:0; position:relative; flex:none; }
.d3-c { position:absolute; inset:0; transform-style:preserve-3d; transition:transform 1.05s cubic-bezier(.17,.84,.32,1.08); }
.d3-f { position:absolute; inset:0; border-radius:20%; display:grid; grid-template:repeat(3,1fr)/repeat(3,1fr); padding:15%;
  background:radial-gradient(circle at 30% 25%, #ffffff, #f4ede3 55%, #ddd1c0); box-shadow:inset 0 0 0 1px rgba(0,0,0,.06), inset -3px -5px 9px rgba(0,0,0,.14), inset 2px 2px 4px rgba(255,255,255,.9); backface-visibility:hidden; }
.d3-f i { width:68%; height:68%; margin:auto; border-radius:50%; }
.d3-f i.on { background:radial-gradient(circle at 35% 30%, #5a2333, #1d0710 70%); box-shadow:inset 0 1px 1px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.7); }
.d3-f.f1 i.on { background:radial-gradient(circle at 35% 30%, #ff6f9f, #9b0f45 75%); width:84%; height:84%; }
.d3-f.f1 { transform:translateZ(calc(var(--s) / 2)); } .d3-f.f6 { transform:rotateY(180deg) translateZ(calc(var(--s) / 2)); }
.d3-f.f3 { transform:rotateY(90deg) translateZ(calc(var(--s) / 2)); } .d3-f.f4 { transform:rotateY(-90deg) translateZ(calc(var(--s) / 2)); }
.d3-f.f2 { transform:rotateX(90deg) translateZ(calc(var(--s) / 2)); } .d3-f.f5 { transform:rotateX(-90deg) translateZ(calc(var(--s) / 2)); }
.d3::after { content:''; position:absolute; left:8%; right:8%; bottom:-8px; height:8px; border-radius:50%; background:rgba(0,0,0,.35); filter:blur(3px); z-index:-1; }
.d3.held .d3-c { transform-origin:center; }
.d3.held { transform:translateY(-8px); }
.d3.held::before { content:''; position:absolute; inset:-5px; border-radius:16px; box-shadow:0 0 0 2.5px #f2c14e, 0 0 18px rgba(242,193,78,.6); }
.d3-l { position:absolute; left:50%; bottom:-24px; transform:translateX(-50%); font-size:11px; font-weight:800; letter-spacing:.3px; color:#f2c14e; text-transform:uppercase; white-space:nowrap; }
.d3.used { opacity:.35; filter:grayscale(.6); }
.wf-tray { border-radius:22px; padding:18px 10px 12px; margin-bottom:12px; background:radial-gradient(120% 90% at 50% 0%, #1f5a4c, #0d332b 70%); box-shadow:inset 0 3px 12px rgba(0,0,0,.55), inset 0 0 0 6px #5a3417, inset 0 0 0 8px #2b170a, 0 10px 28px rgba(0,0,0,.35); }
.wf-dice { display:flex; justify-content:center; gap:12px; min-height:80px; align-items:center; padding:4px 0 18px; }
.wf-dice .d3 { --s:46px; }
.wf-empty { min-height:70px; display:flex; align-items:center; justify-content:center; color:#cfe9df; font-size:16px; }
.wf-act { display:flex; align-items:center; justify-content:center; gap:12px; }
.wf-n { font-size:14px; font-weight:700; color:#cfe9df; }
.wf-hint { text-align:center; font-size:14px; color:#cfe9df; margin:8px 0 0; }
.wf-card { border-radius:18px; background:#fbf6ec; color:#3a2a22; padding:6px 10px 8px; box-shadow:0 10px 30px rgba(0,0,0,.35); }
.wf-row { display:grid; grid-template-columns:1fr 74px 74px; align-items:center; min-height:44px; border-bottom:1px solid #eadfcd; }
.wf-row > span:not(:first-child) { text-align:center; font-weight:700; font-size:17px; }
.wf-th { min-height:36px; font-size:14px; } .wf-th .pa { color:#c2185b; } .wf-th .pb { color:#a8700f; }
.wf-cat b { display:block; font-size:16px; } .wf-cat small { display:block; font-size:12px; color:#8a7666; }
.wf-row .v.z { color:#b8a898; }
.wf-row .e { opacity:.2; }
.wf-row .opt { min-width:62px; height:36px; border-radius:12px; border:1.5px solid #d8c7ad; background:#fff; color:#3a2a22; font-weight:800; font-size:16px; }
.wf-row .opt.best { border-color:#e8467c; background:#ffe3ee; color:#9b0f45; box-shadow:0 0 0 3px rgba(232,70,124,.18); }
.wf-row .opt.zero { font-size:12px; font-weight:700; color:#8a7666; }
.wf-sum { background:#f3ead9; margin:0 -10px; padding:0 10px; } .wf-sum small { display:block; font-size:12px; color:#8a7666; font-weight:400; }
.wf-sum.big { border-bottom:0; border-radius:0 0 14px 14px; font-size:18px; } .wf-sum.big span { font-weight:800; }
/* Blumenbeete */
.bt-wrap { position:relative; }
.bt-svg { width:100%; max-width:440px; display:block; margin:0 auto; touch-action:manipulation; filter:drop-shadow(0 10px 24px rgba(0,0,0,.35)); }
.bt-gap { stroke:rgba(255,236,200,.5); stroke-width:3.5; stroke-dasharray:2 7; stroke-linecap:round; }
.bt-wrap.intro .bt-gap { animation:btHint 1.6s ease-in-out 3; }
@keyframes btHint { 50% { stroke:rgba(255,236,200,.95); stroke-width:5; } }
.bt-gap.pend { stroke-dasharray:none; stroke-width:9; animation:btPend 1s ease-in-out infinite; }
.bt-gap.pend.p1 { stroke:#e8467c; } .bt-gap.pend.p2 { stroke:#f2c14e; }
@keyframes btPend { 50% { opacity:.45; } }
.bt-fence.last line:nth-child(2) { filter:url(#g2glow); }
.bt-hit { fill:transparent; cursor:pointer; }
.bt-hit:hover { fill:rgba(255,255,255,.06); }
.bt-fl { animation:btGrow .55s cubic-bezier(.2,1.4,.4,1); transform-box:fill-box; transform-origin:center bottom; }
@keyframes btGrow { from { opacity:0; } }
.bt-say { text-align:center; min-height:24px; }
/* Wanderzug */
.wz-wrap { position:relative; }
.wz-svg { width:100%; display:block; filter:drop-shadow(0 12px 26px rgba(0,0,0,.45)); touch-action:manipulation; }
.wz-hit { fill:transparent; cursor:pointer; }
.wz-cnt { font:800 11px system-ui, sans-serif; text-anchor:middle; fill:#fff; paint-order:stroke; stroke:rgba(0,0,0,.6); stroke-width:2.5px; }
.wz-ring { fill:none; stroke:#ffe27a; stroke-width:2.5; filter:url(#g2glow); animation:btPend 1.2s ease-in-out infinite; }
.wz-ring.sel { stroke:#fff; stroke-width:3.2; animation:none; }
.wz-ghost { fill:rgba(255,255,255,.22); stroke:#fff; stroke-width:2; stroke-dasharray:4 3; animation:btPend 1s ease-in-out infinite; }
.wz-tg { filter:brightness(1.35) saturate(1.2); }
.wz-mid { position:absolute; left:52%; right:3.5%; top:50%; transform:translateY(-50%); display:flex; align-items:center; justify-content:center; gap:10px; pointer-events:none; }
.wz-mid .pill-btn { pointer-events:auto; }
.wz-dice { display:flex; gap:7px; } .wz-dice .d3 { --s:34px; } .wz-dice .d3::after { bottom:-6px; }
.wz-ctl { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:10px; margin:12px 0 2px; min-height:4px; }
.wz-help { text-align:center; font-size:15px; color:var(--text-muted); margin:4px 0; }
@media (prefers-reduced-motion: reduce) { .d3-c { transition:none; } .bt-gap, .wz-ring, .wz-ghost, .rp-z, .rp-fly { animation:none !important; } }
`; }
})();
