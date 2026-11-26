/* Schmetterlingsfutter – Raupenzeit (LZFA). Paket 1 (3.54.0): die Frage und erste Inhalte. Paket 2 (3.56.0): Abgleich mit
   dem Schatz, Schonmodus, Wochen-Check, Paar-Insel.
   Eine einzige freiwillige Frage klärt, ob Kinder bei einem Paar ein Thema sind. Daraus ergibt sich eine von sieben
   Phasen, und vorhandene Funktionen stellen sich darauf ein: Flügelschlag (jeden zweiten Tag eine Aufgabe für
   Eltern-Paare), ein Gleichklang-Deck je Phase, Eltern-Gutscheine, ein Eltern-Punkt im Wetterbericht der Woche.
   Leitsatz: Es geht um euch zwei, nie um Erziehung.

   Was gespeichert wird (S.family): die Antwort und bei Kindern nur die Geburtsjahre. Keine Namen, keine Fotos,
   kein Geburtsdatum, kein Entbindungstermin.

   Was das Gerät verlässt (seit 3.56.0, nur bei verbundenen Apps, Ende-zu-Ende verschlüsselt in der Begrüßung hello.fam):
   - k: Geburtsjahre der Kinder. Sie sind gemeinsame Daten wie der Jahrestag: fehlt etwas, wird es übernommen; steht zum
     ersten Mal Verschiedenes gegenüber, fragt die App neutral, was stimmt (ohne zu zeigen, wer was eingetragen hat);
     waren sich beide schon einmal einig, gilt die neueste Änderung. Eine leere Liste löscht beim Schatz nie etwas.
   - t: 'wish' oder 'expect' NUR, wenn „Mit meinem Schatz teilen“ eingeschaltet ist. Ausschalten sendet t: ''.
   - i: die Paar-Insel (Wochentag, Rhythmus). Die neueste Änderung gilt.
   - n: laufende Nummer der Begrüßung (Ältere werden verworfen), q: 1 = „schick mir bitte deinen Stand“.
   Eine Angabe, die nicht geteilt wird, löst keine Begrüßung aus und trägt keinen Zeitstempel.
   Ältere App-Versionen ignorieren das Feld. An den Vermittlungsdienst geht weiterhin nichts, woraus die Phase ablesbar
   wäre: Die Phasen-Decks laufen nur an einem Handy (deck.local), weil ein Spiel über zwei Handys dem Dienst den Namen
   des Decks nennt. „Anonym mithelfen“ zählt nichts mit Phasen-Deck-Namen (silent(), gefragt von stats.js).

   Regeln der Frage: einmal, frühestens am dritten Nutzungstag, nie in der Einrichtung, nie über offenen Fenstern,
   nicht in dem Besuch, in dem „Anonym mithelfen“ fragt, und nicht mehr, sobald der Schatz etwas geteilt hat.
   „Thema ausblenden“ ist ein Tipp ohne Rückfrage: Die Angabe wird gelöscht, alles zum Thema verschwindet, die App
   fragt nicht wieder, nimmt vom Schatz nichts mehr dazu an und zieht eine frühere Freigabe zurück. Kein automatischer
   Wechsel von „Baby unterwegs“ zu „Baby“ und keine automatischen Glückwünsche – eine Schwangerschaft kann anders enden. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L || !D.fam) return;
  const S = () => L.S, P = () => window.LZP, $ = (id) => document.getElementById(id), esc = L.esc;
  const TOPICS = ['none', 'wish', 'expect', 'kids', 'skip'];
  const PARENT = ['baby', 'klein', 'schule', 'teen']; /* Phasen mit Kind im Haus: Eltern-Gutscheine und Eltern-Punkt im Wetterbericht */
  const MAX_KIDS = 12, OLDER = 0; /* OLDER steht für „älter“: vor mehr als 25 Jahren geboren, ohne genaues Jahr */
  const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const year = () => new Date().getFullYear();
  const fresh = () => ({ v: 1, topic: null, kids: [], share: false, hidden: false, askedAt: null, updatedAt: null, partner: null });
  const on = () => !!(P() && P().paired() && P().joined());
  const pn = () => (P() && P().partnerName ? P().partnerName() : S().receiver);
  const num = (v) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : 0);

  /* ---------- Zustand ---------- */
  const okYear = (y) => y === OLDER || (Number.isInteger(y) && y >= 1900 && y <= year());
  /* nur echte Zahlen oder Ziffernfolgen: Number(null), Number('') und Number(false) wären 0 und damit „älter“ */
  const isYearish = (v) => typeof v === 'number' || (typeof v === 'string' && /^\d{1,4}$/.test(v));
  const cleanKids = (k) => (Array.isArray(k) ? k : []).filter(isYearish).map(Number).filter(okYear).slice(0, MAX_KIDS).sort((a, b) => a - b);
  const sameKids = (a, b) => a.length === b.length && a.every((y, i) => y === b[i]);
  const cleanIsland = (i) => (i && typeof i === 'object' && Number.isInteger(i.wd) && i.wd >= 0 && i.wd <= 6 && (i.every === 'week' || i.every === 'month') ? { wd: i.wd, every: i.every, at: num(i.at) } : null);
  /* Liest S.family und bringt es in Form – auch nach dem Einspielen einer Sicherung oder mit Daten einer älteren Fassung */
  function fam() {
    const s = S(); let f = s.family;
    if (!f || typeof f !== 'object' || Array.isArray(f)) f = s.family = fresh();
    if (TOPICS.indexOf(f.topic) < 0) f.topic = null;
    f.kids = f.topic === 'kids' ? cleanKids(f.kids) : [];
    if (f.topic === 'kids' && !f.kids.length) f.topic = null; /* „Kinder“ ohne Geburtsjahr gibt es nicht */
    f.share = f.share === true; f.hidden = f.hidden === true;
    if (!Array.isArray(f.cp)) f.cp = []; /* Eltern-Gutscheine, die schon ins Gutscheinbuch gelegt wurden */
    /* vom Schatz geteilt: { topic: 'kids' | 'wish' | 'expect', kids, at } */
    const p = f.partner;
    if (!p || typeof p !== 'object' || Array.isArray(p)) f.partner = null;
    else {
      const pk = cleanKids(p.kids);
      const pt = p.topic === 'kids' ? (pk.length ? 'kids' : null) : (p.topic === 'wish' || p.topic === 'expect') ? p.topic : null;
      f.partner = pt ? { topic: pt, kids: pt === 'kids' ? pk : [], at: num(p.at) } : null;
    }
    f.island = cleanIsland(f.island);
    const c = f.conflict; /* zwei verschiedene Listen von Geburtsjahren, die noch niemand entschieden hat */
    f.conflict = Array.isArray(c) && c.length === 2 && f.topic === 'kids' && cleanKids(c[0]).length && cleanKids(c[1]).length ? [cleanKids(c[0]), cleanKids(c[1])] : null;
    f.ka = num(f.ka); f.sync = num(f.sync); f.res = num(f.res); f.islandGone = num(f.islandGone);
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
  /* '' = keine Phase, die App verhält sich wie ohne Raupenzeit. Ohne eigene Angabe zählt, was der Schatz geteilt hat. */
  function phase() {
    const f = fam(); if (f.hidden) return '';
    if (f.topic === null) return f.partner ? phaseOf(f.partner.topic, f.partner.kids) : '';
    return phaseOf(f.topic, f.kids);
  }
  const yearLabel = (y) => (y === OLDER ? 'älter' : String(y));
  const kidsText = (k) => (k.length === 1 ? '1 Kind' : k.length + ' Kinder') + ' · ' + k.map(yearLabel).join(', ');
  const topicText = (t) => (t === 'wish' ? 'Kinderwunsch' : t === 'expect' ? 'Baby unterwegs' : '');
  function status() {
    const f = fam();
    if (f.hidden) return 'Ausgeblendet';
    if (f.topic === 'wish' || f.topic === 'expect') return topicText(f.topic) + (f.share && on() ? ' · geteilt' : '');
    if (f.topic === 'kids') return kidsText(f.kids);
    if (f.topic === 'none') return 'Gerade kein Thema';
    if (f.topic === 'skip') return 'Keine Angabe';
    if (f.partner) return 'Von ' + pn() + ': ' + (f.partner.topic === 'kids' ? kidsText(f.partner.kids) : topicText(f.partner.topic));
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
  /* Schonmodus (3.56.0): mit Baby meldet sich Papillon höchstens einmal am Tag (anreiz.js fragt hier nach) */
  const calm = () => phase() === 'baby';
  /* Wetterbericht der Woche (3.56.0, naehe.js): mit Kind im Haus kommt der Punkt „Schlaf“ dazu, und die Gesprächs-Einstiege
     zu Nähe, Aufgabenteilung und Zeit zu zweit passen zum Familienalltag */
  function areas(list) {
    if (PARENT.indexOf(phase()) < 0) return list;
    const q = D.fam.areaQ || {};
    return (D.fam.areas || []).concat(list.map((a) => (q[a.id] ? Object.assign({}, a, { q: q[a.id] }) : a)));
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
    const d = syncDecks(); syncCoupons(); L.save(); render(); renderCard();
    if (window.LZF && window.LZF.renderPiek) window.LZF.renderPiek();
    if (window.LZP) { if (d && window.LZP.renderDecks) window.LZP.renderDecks(); if (window.LZP.renderPost && document.documentElement.getAttribute('data-view') === 'post') window.LZP.renderPost(); }
  }
  function setTopic(topic, kids) {
    const f = fam(), now = Date.now(), list = topic === 'kids' ? cleanKids(kids) : [];
    if (topic === 'kids') {
      if (f.topic !== 'kids' || !sameKids(f.kids, list) || !f.ka) f.ka = now;
      if (f.conflict) { f.conflict = null; f.res = now; } /* selbst entschieden: der Schatz übernimmt es ohne neue Rückfrage */
    } else { f.ka = 0; f.sync = 0; f.res = 0; f.conflict = null; }
    /* Die Freigabe gilt nur für die Angabe, für die sie eingeschaltet wurde: Wer von „Kinderwunsch“ auf „Baby unterwegs“ wechselt, teilt das nicht von selbst */
    if (topic !== f.topic) f.share = false;
    f.topic = topic; f.kids = list;
    if (topic !== 'wish' && topic !== 'expect') f.share = false;
    f.hidden = false; f.updatedAt = now; if (!f.askedAt) f.askedAt = now;
    apply(); sendFam(true);
  }
  /* „Thema ausblenden“: ein Tipp, keine Rückfrage. Die Angabe wird gelöscht, nichts zum Thema bleibt sichtbar,
     eine frühere Freigabe an den Schatz wird zurückgezogen (payload() ist dann leer). Die Paar-Insel beim Schatz bleibt. */
  function hide() {
    const f = fam(), now = Date.now();
    f.topic = null; f.kids = []; f.share = false; f.hidden = true; f.partner = null; f.partnerSeen = ''; f.conflict = null;
    f.ka = 0; f.sync = 0; f.res = 0; f.island = null; f.islandGone = 0; f.islandDone = '';
    f.updatedAt = now; if (!f.askedAt) f.askedAt = now;
    apply(); sendFam(true); L.closeSheet(); L.toast('Ausgeblendet. Die App zeigt nichts mehr zum Thema.');
  }
  function unhide() { const f = fam(); f.hidden = false; f.updatedAt = Date.now(); apply(); sendFam(true, true); }
  function setShare(v) {
    const f = fam(); f.share = !!v && (f.topic === 'wish' || f.topic === 'expect'); f.updatedAt = Date.now();
    L.save(); render(); sendFam(true);
  }

  /* ---------- Abgleich mit dem Schatz (3.56.0) ---------- */
  const pairId = () => (on() ? String(((P().P() || {}).partner || {}).pair || '') : '');
  /* Neue oder getrennte Verbindung: was der frühere Schatz geteilt hat, gilt nicht mehr */
  function pairCheck() {
    const f = fam(), pid = pairId(), linked = !!(P() && P().paired());
    if (linked && !pid) return false; /* Verbindung besteht, der Schatz ist nur noch nicht beigetreten */
    if ((f.pid || '') === pid) return false;
    let cleared = false;
    /* auch die eigene Freigabe endet: sie galt dem früheren Schatz und geht nicht von selbst an eine neue Verbindung */
    if (f.pid) { cleared = !!(f.partner || f.conflict || f.share); f.partner = null; f.partnerSeen = ''; f.sync = 0; f.conflict = null; f.sentSig = ''; f.pseq = 0; f.share = false; }
    f.pid = pid; L.save();
    return cleared; /* true = es stand etwas vom früheren Schatz da: Ansicht neu aufbauen */
  }
  /* partner.js ruft das, sobald die Verbindung getrennt wird: Geteiltes vom früheren Schatz verschwindet sofort */
  function pairChanged() { if (pairCheck()) apply(); else { render(); renderCard(); } }
  function payload() {
    const f = fam(), out = { k: [], t: '' }; /* kein Zeitstempel für Angaben, die nicht geteilt werden */
    if (f.hidden) return out;
    if (f.topic === 'kids') { out.k = f.kids.slice(); out.ka = f.ka || f.updatedAt || 0; if (f.res && Date.now() - f.res < 7 * 864e5) out.r = 1; }
    if (f.share && (f.topic === 'wish' || f.topic === 'expect')) { out.t = f.topic; out.at = f.updatedAt || 0; }
    if (f.island) out.i = [f.island.wd, f.island.every, f.island.at];
    else if (f.islandGone) out.i = [-1, '', f.islandGone];
    return out;
  }
  /* Kennung des Gesendeten ohne die Zeitangabe `at`: nur wenn sich daran etwas ändert, geht eine neue Begrüßung raus */
  const sigOf = (pl) => pairId() + '|' + JSON.stringify([pl.k, pl.ka || 0, pl.t, pl.i || 0, pl.r || 0]);
  const emptySig = () => sigOf({ k: [], t: '' });
  let sendT = null, wantT = false, forceT = false; const sentLog = [];
  /* want  = die andere App bitten, ihren Stand zu schicken (q: 1) – nach „Wieder einblenden“, sonst käme er erst mit der täglichen Begrüßung
     force = auch senden, wenn sich am eigenen Stand nichts geändert hat (Antwort an den Schatz, tägliche Auffrischung).
     Ohne beides geht nur dann eine Begrüßung raus, wenn es etwas Neues mitzuteilen gibt: Eine Änderung, die nicht geteilt wird,
     löst also gar keine Nachricht aus. Jede Begrüßung trägt eine laufende Nummer n, damit der Empfänger Älteres verwirft
     (Nachrichten können sich unterwegs überholen: eine alte Freigabe darf eine Rücknahme nicht wieder aufheben). */
  function sendFam(now, want, force) {
    if (!on()) return; clearTimeout(sendT); if (want) wantT = true; if (force) forceT = true;
    sendT = setTimeout(async () => {
      if (!on()) return; const pl = payload(), sig = sigOf(pl), f = fam();
      /* Notbremse: höchstens sechs gesendete Begrüßungen je Minute. Was dann liegen bleibt (auch want und force), holt sendIfStale() im Minutentakt nach. */
      const t0 = Date.now(); while (sentLog.length && t0 - sentLog[0] > 60000) sentLog.shift(); if (sentLog.length >= 6) return;
      const ask = wantT, must = forceT; wantT = false; forceT = false;
      if (!ask) {
        if (sig === emptySig() && !f.sentSig) return; /* nie etwas mitgeteilt und nichts mitzuteilen */
        if (!must && sig === (f.sentSig || emptySig())) return; /* nichts Neues */
      } else pl.q = 1;
      f.seq = Math.max(t0, num(f.seq) + 1); pl.n = f.seq; L.save();
      try { await P().send({ t: 'hello', name: S().sender, pron: S().pron || '', fam: pl }); sentLog.push(t0); const g = fam(); g.sentAt = Date.now(); g.sentSig = sig; L.save(); }
      catch (e) { if (ask) wantT = true; if (must) forceT = true; /* beim nächsten Takt oder Öffnen */ }
    }, now ? 300 : 2000);
  }
  /* Einmal am Tag und nach jeder Änderung: so kommt der Stand auch nach einer verlorenen Nachricht oder neuen Verbindung an */
  function sendIfStale() {
    if (!on()) return; pairCheck();
    const f = fam(), sig = sigOf(payload());
    if (wantT || forceT || sig !== (f.sentSig || emptySig())) sendFam(false);
    else if (sig !== emptySig() && Date.now() - (f.sentAt || 0) > 20 * 3600e3) sendFam(false, false, true);
  }
  /* Ankommende Angaben vom Schatz (partner.js ruft das bei jeder Begrüßung mit hello.fam auf) */
  function got(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return;
    const f = fam(); if (f.hidden) return; /* ausgeblendet: nichts annehmen, nichts zeigen */
    const now = Date.now(), news = []; let changed = pairCheck(), reply = d.q === 1; /* q: der Schatz bittet um meinen Stand */
    /* laufende Nummer des Absenders: eine ältere oder doppelte Begrüßung zählt nicht mehr (Nachrichten können sich überholen) */
    const sn = num(Number(d.n)); if (sn) { if (sn <= num(f.pseq)) return; f.pseq = sn; }
    const pk = cleanKids(d.k), pt = d.t === 'wish' || d.t === 'expect' ? d.t : '';
    /* Zeitangaben aus der Zukunft (falsch gehende Uhr) zählen höchstens als „jetzt“ */
    const pat = Math.min(num(Number(d.at)), now), pka = Math.min(num(Number(d.ka)) || pat, now);
    /* 1) Was der Schatz von sich aus teilt. Nimmt er es zurück (t: ''), verschwindet es hier wieder. */
    const before = f.partner ? f.partner.topic : null;
    f.partner = pk.length ? { topic: 'kids', kids: pk, at: pka } : pt ? { topic: pt, kids: [], at: pat } : null;
    const after = f.partner ? f.partner.topic : null;
    if (after !== before) { changed = true; if (after !== 'wish' && after !== 'expect') f.partnerSeen = ''; }
    /* 2) Geburtsjahre sind gemeinsame Daten */
    if (pk.length) {
      if (f.topic === 'kids') {
        if (sameKids(f.kids, pk)) { f.sync = now; if (pka > f.ka) f.ka = pka; if (f.conflict) { f.conflict = null; changed = true; } }
        else if (f.sync || d.r === 1) {
          if (pka > f.ka) { f.kids = pk; f.ka = pka; f.sync = now; f.conflict = null; f.updatedAt = now; changed = true; reply = true; news.push('Kinder: ' + pk.map(yearLabel).join(', ')); }
          else if (pka < f.ka) reply = true; /* meins ist neuer: der Schatz übernimmt es, sobald meine Begrüßung ankommt */
          else { f.conflict = [f.kids.slice(), pk]; changed = true; } /* gleich alt und verschieden: nachfragen statt hin und her schicken */
        } else { f.conflict = [f.kids.slice(), pk]; changed = true; }
      } else if (f.topic !== 'skip' && (f.topic === null || pka > (f.updatedAt || 0))) {
        /* fehlt bei mir, oder meine Antwort ist älter als die Angabe des Schatzes: übernehmen. „Lieber nicht sagen“ bleibt. */
        f.topic = 'kids'; f.kids = pk; f.ka = pka; f.sync = now; f.share = false; f.updatedAt = now; if (!f.askedAt) f.askedAt = now;
        changed = true; reply = true; news.push('Kinder: ' + pk.map(yearLabel).join(', '));
      }
    }
    /* 3) Paar-Insel: die neueste Änderung gilt, auch das Entfernen */
    if (Array.isArray(d.i) && d.i.length >= 3) {
      const iat = Math.min(num(Number(d.i[2])), now), mine = Math.max(f.island ? f.island.at : 0, f.islandGone);
      if (iat > mine) {
        const isl = cleanIsland({ wd: Number(d.i[0]), every: d.i[1], at: iat });
        if (isl) { f.island = isl; f.islandGone = 0; changed = true; news.push('Paar-Insel: ' + islandText(isl)); }
        else if (Number(d.i[0]) === -1) { if (f.island) changed = true; f.island = null; f.islandGone = iat; }
      } else if (iat < mine) reply = true;
    }
    if (changed) apply(); else L.save();
    if (news.length) L.toast('🐛 Mit ' + pn() + ' abgeglichen – ' + news[0] + (news.length > 1 ? ' (+' + (news.length - 1) + ')' : ''));
    /* Übernommenes bestätigen, Neueres zurückmelden: so wissen beide Apps, dass sie sich einig sind */
    if (reply) sendFam(true, false, true);
  }
  function resolve(kids) {
    const f = fam(), now = Date.now(); f.kids = cleanKids(kids); f.ka = now; f.sync = now; f.res = now; f.conflict = null; f.updatedAt = now;
    apply(); sendFam(true); L.toast('✓ ' + kidsText(f.kids) + ' gilt jetzt bei euch beiden');
  }

  /* ---------- Paar-Insel (3.56.0): eine feste, wiederkehrende Verabredung zu zweit ---------- */
  const islandText = (i) => (i.every === 'month' ? 'jeden ersten ' + WD[i.wd] + ' im Monat' : 'jeden ' + WD[i.wd]);
  function islandToday() {
    const f = fam(), i = f.island; if (!i || f.hidden) return false;
    const d = new Date(); return d.getDay() === i.wd && (i.every === 'week' || d.getDate() <= 7);
  }
  function setIsland(wd, every) {
    const f = fam(), now = Date.now();
    if (wd === null) { f.island = null; f.islandGone = now; } else { f.island = { wd, every, at: now }; f.islandGone = 0; }
    f.islandDone = ''; L.save(); render(); renderCard(); sendFam(true);
  }
  function islandSheet() {
    const f = fam(); if (f.hidden) { L.toast('Die Raupenzeit ist ausgeblendet (⚙️ → Kinder).'); return; }
    let wd = f.island ? f.island.wd : -1, every = f.island ? f.island.every : 'week';
    L.openSheet('<h3>🏝️ Eure Paar-Insel</h3><p class="fa-note">Eine feste Verabredung nur für euch zwei. Am Tag erinnert die App daran.</p>' +
      '<div class="fa-days" role="group" aria-label="Wochentag">' + [1, 2, 3, 4, 5, 6, 0].map((n) => '<button type="button" class="fa-year" data-wd="' + n + '" aria-label="' + WD[n] + '">' + WD[n].slice(0, 2) + '</button>').join('') + '</div>' +
      '<div class="fa-two" role="group" aria-label="Wie oft"><button type="button" class="fa-opt" data-ev="week"><span>Jede Woche</span></button><button type="button" class="fa-opt" data-ev="month"><span>Einmal im Monat</span></button></div>' +
      '<p class="fa-note" id="faIslandLine"></p>' +
      '<div class="row"><button type="button" class="pill-btn ghost" data-cancel>Abbrechen</button><button type="button" class="pill-btn primary" data-ok>Speichern</button></div>' +
      (f.island ? '<div class="row fa-foot" style="margin-top:10px"><button type="button" class="pill-btn small ghost" data-del>Insel entfernen</button></div>' : ''), (sh) => {
      const ok = sh.querySelector('[data-ok]'), line = sh.querySelector('#faIslandLine');
      const draw = () => {
        sh.querySelectorAll('[data-wd]').forEach((b) => { const o = +b.dataset.wd === wd; b.classList.toggle('on', o); b.setAttribute('aria-pressed', o); });
        sh.querySelectorAll('[data-ev]').forEach((b) => { const o = b.dataset.ev === every; b.classList.toggle('on', o); b.setAttribute('aria-pressed', o); });
        ok.disabled = wd < 0;
        line.textContent = wd < 0 ? 'Tippt einen Wochentag an.' : 'Eure Insel: ' + islandText({ wd, every }) + (on() ? '. Steht dann auch bei ' + pn() + '.' : '.');
      };
      sh.querySelectorAll('[data-wd]').forEach((b) => { b.onclick = () => { wd = +b.dataset.wd; L.haptic(8); draw(); }; });
      sh.querySelectorAll('[data-ev]').forEach((b) => { b.onclick = () => { every = b.dataset.ev; L.haptic(8); draw(); }; });
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      ok.onclick = () => { if (wd < 0) return; setIsland(wd, every); L.closeSheet(); L.toast('🏝️ Eure Paar-Insel: ' + islandText({ wd, every })); };
      const del = sh.querySelector('[data-del]'); if (del) del.onclick = () => { setIsland(null); L.closeSheet(); L.toast('Paar-Insel entfernt.'); };
      draw();
    });
  }

  /* ---------- Karte auf „Heute“: nur wenn etwas zu klären oder heute dran ist ---------- */
  function renderCard() {
    let el = $('famPromo'); const f = fam();
    const shared = f.partner && (f.partner.topic === 'wish' || f.partner.topic === 'expect') ? f.partner.topic : '';
    const mode = f.hidden ? '' : f.conflict ? 'conflict' : shared && f.partnerSeen !== shared ? 'shared' : islandToday() && f.islandDone !== L.todayKey() ? 'island' : '';
    if (!mode) { if (el) el.remove(); return; }
    if (!el) { const anchor = $('partnerCard'); if (!anchor) return; el = document.createElement('div'); el.id = 'famPromo'; el.className = 'card promo'; anchor.parentNode.insertBefore(el, anchor.nextSibling); }
    const sig = mode + '|' + JSON.stringify(mode === 'conflict' ? f.conflict : mode === 'shared' ? shared : [f.island, L.todayKey()]);
    if (el.dataset.sig === sig) return; el.dataset.sig = sig;
    const text = (t) => '<p class="about" style="font-size:17px;margin:6px 0 0">' + t + '</p>';
    const row = (b) => '<div class="row wrap" style="margin-top:12px;justify-content:flex-start">' + b + '</div>';
    if (mode === 'conflict') {
      /* neutral: sortiert, damit nicht erkennbar ist, wer was eingetragen hat */
      const opts = f.conflict.slice().sort((a, b) => a.join().localeCompare(b.join()));
      el.innerHTML = '<div class="promo-title">🐛 Kinder: welche Geburtsjahre stimmen?</div>' + text('In euren beiden Apps stehen zwei verschiedene Angaben. Tippt die richtige an, dann gilt sie bei euch beiden.') +
        row(opts.map((k, i) => '<button type="button" class="pill-btn" data-pick="' + i + '">' + esc(k.map(yearLabel).join(', ')) + '</button>').join('') + '<button type="button" class="pill-btn ghost" data-own>Anders eintragen</button>');
      el.querySelectorAll('[data-pick]').forEach((b) => { b.onclick = () => resolve(opts[+b.dataset.pick]); });
      el.querySelector('[data-own]').onclick = () => kidsSheet(f.kids, false);
    } else if (mode === 'shared') {
      el.innerHTML = '<div class="promo-title">💞 ' + esc(pn()) + ' teilt mit dir: ' + topicText(shared) + '</div>' + text('Nur ihr zwei seht das. Die App hat dazu jetzt Flügelschläge und Fragen für euch.') +
        row('<button type="button" class="pill-btn primary" data-seen>Verstanden</button><button type="button" class="pill-btn ghost" data-open>Ansehen</button>');
      const seen = () => { fam().partnerSeen = shared; L.save(); renderCard(); };
      el.querySelector('[data-seen]').onclick = seen;
      el.querySelector('[data-open]').onclick = () => { seen(); sheet(); };
    } else {
      el.innerHTML = '<div class="promo-title">🏝️ Heute ist eure Paar-Insel</div>' + text('Nehmt euch heute Zeit nur für euch zwei. Zwanzig Minuten reichen.') +
        row('<button type="button" class="pill-btn primary" data-done>Machen wir ✓</button><button type="button" class="pill-btn ghost" data-edit>Ändern</button>');
      el.querySelector('[data-done]').onclick = () => { fam().islandDone = L.todayKey(); L.save(); L.spawnHearts(8, el); renderCard(); L.toast('Schön. Viel Freude euch zwei 🏝️'); };
      el.querySelector('[data-edit]').onclick = islandSheet;
    }
  }

  /* ---------- Fenster: die Frage ---------- */
  const OPTS = [['none', 'Gerade nicht'], ['wish', 'Wir wünschen uns eins'], ['expect', 'Baby unterwegs'], ['kids', 'Ja, wir haben Kinder'], ['skip', 'Lieber nicht sagen']];
  const SET_TOAST = '🐛 Raupenzeit ist an. Flügelschläge passen jetzt zu euch.';
  /* Die eine Erklärzeile: was mit der Angabe passiert – je nachdem, ob die Apps verbunden sind und was gewählt ist */
  function noteLine(f) {
    if (!on()) return '🔒 Bleibt auf deinem Handy.';
    if (f.topic === 'kids') return '🔄 Die Geburtsjahre stehen auch bei ' + esc(pn()) + '.';
    if (f.topic === 'wish' || f.topic === 'expect') return f.share ? '💞 Geteilt mit ' + esc(pn()) + '.' : '🔒 Bleibt auf deinem Handy, bis du es teilst.';
    return '🔒 Bleibt auf deinem Handy. Nur Geburtsjahre von Kindern stehen auch bei ' + esc(pn()) + '.';
  }
  /* auto = Papillon fragt von selbst: nur die fünf Tasten. Sonst (Einstellungen, „Unsere Daten“) auch Teilen, Paar-Insel und „Thema ausblenden“. */
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
    const own = f.topic === 'wish' || f.topic === 'expect';
    const shared = f.partner && (f.partner.topic === 'wish' || f.partner.topic === 'expect') ? f.partner.topic : '';
    L.openSheet('<h3>🐛 Sind Kinder bei euch ein Thema?</h3><div class="fa-opts">' +
      OPTS.map((o) => '<button type="button" class="fa-opt' + (f.topic === o[0] ? ' on' : '') + '" data-t="' + o[0] + '"' + (f.topic === o[0] ? ' aria-pressed="true"' : '') + '><span>' + esc(o[1]) + '</span>' + (f.topic === o[0] ? '<i aria-hidden="true">✓</i>' : '') + '</button>').join('') +
      '</div>' +
      (!auto && own && on() ? '<div class="switch fa-share"><div>Mit ' + esc(pn()) + ' teilen<small>Dein Schatz sieht dann: ' + topicText(f.topic) + '</small></div><button type="button" class="toggle" id="togFamShare" role="switch" aria-checked="' + (f.share ? 'true' : 'false') + '" aria-label="Mit meinem Schatz teilen"></button></div>' : '') +
      '<p class="fa-note" id="faNote">' + noteLine(f) + '</p>' +
      (!auto && shared ? '<p class="fa-note">💞 ' + esc(pn()) + ' teilt mit dir: ' + topicText(shared) + '</p>' : '') +
      (auto ? '' : '<div class="fa-opts"><button type="button" class="fa-opt fa-isl" data-island><span>🏝️ Paar-Insel' + (f.island ? ': ' + esc(islandText(f.island)) : ' festlegen') + '</span><i aria-hidden="true">›</i></button></div>' +
        '<div class="row wrap fa-foot"><button type="button" class="pill-btn small ghost" data-hide>Thema ausblenden</button><button type="button" class="pill-btn small ghost" data-cancel>Schließen</button></div>'), (sh) => {
      const c = sh.querySelector('[data-cancel]'); if (c) c.onclick = L.closeSheet;
      const h = sh.querySelector('[data-hide]'); if (h) h.onclick = hide;
      const isl = sh.querySelector('[data-island]'); if (isl) isl.onclick = islandSheet;
      const tg = sh.querySelector('#togFamShare');
      if (tg) tg.onclick = () => {
        const v = !fam().share; setShare(v); tg.setAttribute('aria-checked', v ? 'true' : 'false'); L.haptic(8);
        sh.querySelector('#faNote').innerHTML = noteLine(fam());
        L.toast(v ? '💞 Geteilt mit ' + pn() + '.' : 'Nicht mehr geteilt.');
      };
      sh.querySelectorAll('[data-t]').forEach((b) => {
        b.onclick = () => {
          const t = b.dataset.t; L.haptic(8);
          if (t === 'kids') { kidsSheet(f.topic === 'kids' ? f.kids : [], auto); return; }
          setTopic(t);
          /* Kinderwunsch oder Baby unterwegs bei verbundenen Apps: Fenster bleibt offen, damit der Teilen-Schalter zu sehen ist */
          if ((t === 'wish' || t === 'expect') && on()) sheet(); else L.closeSheet();
          L.toast(t === 'none' ? 'Alles klar. Ändern kannst du das unter ⚙️ → Kinder.' : t === 'skip' ? 'Alles klar. Papillon fragt nicht noch einmal.' : SET_TOAST);
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
    L.openSheet('<h3>🐛 Wann sind eure Kinder geboren?</h3><p class="fa-note">Für jedes Kind einmal das Jahr antippen.' + (on() ? ' Die Jahre stehen dann auch bei ' + esc(pn()) + '.' : '') + '</p>' +
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
      ok.onclick = () => { if (!kids.length) return; setTopic('kids', kids); L.closeSheet(); L.toast(SET_TOAST); };
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
  /* Zeilen für das Fenster „Unsere Daten“ (daten.js). Ist das Thema ausgeblendet, steht dort nichts. */
  const dataRow = () => {
    const f = fam(); if (f.hidden) return '';
    return '<div class="field"><label>🐛 Kinder</label><button type="button" class="pill-btn small fa-data" data-fam>' + esc(status()) + ' ›</button></div>' +
      '<div class="field"><label>🏝️ Paar-Insel</label><button type="button" class="pill-btn small fa-data" data-island>' + (f.island ? esc(islandText(f.island)) : 'Festlegen') + ' ›</button></div>';
  };

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
    '.fa-year.on{background:var(--accent-dark);border-color:var(--accent-dark);color:#fff}' +
    '.fa-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:0 0 12px}' +
    '.fa-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 12px}.fa-two .fa-opt{justify-content:center;text-align:center;padding:10px 8px;font-size:18px}' +
    '.fa-share{margin:0 0 10px;border-bottom:0}.fa-isl{min-height:50px;font-size:18px}' +
    '.fa-data{max-width:100%;text-align:left;white-space:normal}';
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  window.LZFA = { phase, phaseOf, piek, sheet, ask: () => sheet(true), hide, status, dataRow, render, renderCard, silent, calm, areas, payload, got, pairChanged, islandSheet, coupons: syncCoupons, decks: syncDecks, days: useDay };
  mount(); fam(); useDay(); pairCheck();
  function refresh() {
    const d = syncDecks(), c = syncCoupons(); if (c) L.save(); render(); renderCard();
    if (window.LZF && window.LZF.renderPiek) window.LZF.renderPiek();
    if (d && window.LZP && window.LZP.renderDecks) window.LZP.renderDecks();
  }
  refresh();
  /* Jahreswechsel und Tageswechsel: Phase, Decks, Gutscheine und die Karte der Paar-Insel nachziehen – beim Zurückkehren und,
     bleibt die App offen, einmal je Minute geprüft. Im selben Takt geht der Stand an den Schatz, falls er noch aussteht
     (zum Beispiel kurz nach dem Verbinden der Apps). */
  let dayKey = L.todayKey();
  setInterval(() => { if (pairCheck()) apply(); if (L.todayKey() !== dayKey) { dayKey = L.todayKey(); refresh(); } sendIfStale(); }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (pairCheck()) apply(); dayKey = L.todayKey(); refresh(); sendIfStale();
    tries = 0; clearTimeout(timer); timer = setTimeout(tryAsk, 5000);
  });
  setTimeout(sendIfStale, 3000);
  timer = setTimeout(tryAsk, 9000);
})();
