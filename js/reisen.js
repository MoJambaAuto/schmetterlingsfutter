/* Schmetterlingsfutter – Gemeinsam erleben (LZRE, 3.55.0)
   Mo 26.11.2026: „Schmetterlingsfutter ist Reisen, Reisen ist Schmetterlingsfutter“ – Reisen soll kein Sonderbereich
   neben der App sein, sondern die dritte Sorte Futter neben den kleinen Gesten und dem gemeinsamen Spielen.
   Stufe 1 (der rote Faden), bewusst klein:
   - Auf „Heute“ stehen die drei Sorten Futter gleichrangig: Gesten · Spielen · Erleben (index.html, #futterDrei).
   - „Erleben“ öffnet ein kleines Fenster mit dem, was es dazu schon gibt (Traumziele, Falterspaziergang, Liebespfade).
   - „Traumziele“ ist ein Spiel in „Gemeinsam“ (js/data2.js, Deck traumziele). Jede Karte hat eine Flugweite (fw):
     1 vor der Haustür, 2 übers Wochenende, 3 großer Flug. Treffer landen wie bei allen Gemeinsam-Spielen in S.common.
   - Neuer Spieleinsatz (js/spiele2.js): „Wer gewinnt, bestimmt unseren nächsten Ausflug“. Wer gewinnt, bekommt bis zu
     drei Vorschläge aus den gemeinsamen Traumzielen (einer je Flugweite) und hält die Wahl als Gutschein fest.
   - Papillon ist ein Wanderfalter: die kurze Geschichte am Eingang der Liebespfade (js/pfade.js nutzt STORY).
   Keine Angebote, keine Werbelinks, keine eigenen Zähler. */
(function () {
  'use strict';
  const L = window.LZ, D = window.LUZIFER_DATA; if (!L || !D) return;
  const S = () => L.S, P = () => window.LZP, esc = L.esc;
  const you = () => (P() ? P().partnerName() : S().receiver) || 'dein Schatz';
  const on = () => !!(P() && P().paired() && P().joined());
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

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

  /* ---------- Erleben: was es dazu gibt ---------- */
  function erleben() {
    css(); const n = ziele().length, pf = window.LZPF && window.LZPF.available();
    const row = (k, i, t, chip) => '<button type="button" class="re-row" data-k="' + k + '"><span class="re-i">' + i + '</span><span class="re-b"><b>' + esc(t) + '</b>' + (chip ? '<small>' + esc(chip) + '</small>' : '') + '</span><span class="re-go" aria-hidden="true">›</span></button>';
    L.openSheet('<h3>🧭 Gemeinsam erleben</h3><div class="re-list">' +
      row('spiel', '🎴', 'Traumziele', '') +
      (n ? row('ziele', '⭐', 'Unsere Traumziele', String(n)) : '') +
      (window.LZJ ? row('walk', '💞', 'Falterspaziergang', FW[1].t) : '') +
      (pf ? row('pfade', '🗺️', 'Liebespfade', FW[3].t) : '') +
      '</div><div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const go = { spiel: play, ziele: () => { L.closeSheet(); setTimeout(sheet, 60); }, walk: () => { L.closeSheet(); setTimeout(() => window.LZJ.open(), 60); }, pfade: () => { L.closeSheet(); setTimeout(() => window.LZPF.open(), 60); } };
      sh.querySelectorAll('[data-k]').forEach((b) => { b.onclick = go[b.dataset.k]; });
    });
  }

  /* ---------- Einsatz „bestimmt den nächsten Ausflug“: Wahl nach dem Sieg ----------
     o = { winner: Name oder „Du“, game: Titel des Spiels, send: true = Gutschein geht auch an den Schatz }
     done(titel) wird gerufen, wenn die Wahl festgehalten ist. */
  function pick(o, done) {
    const sug = vorschlaege(), wer = o.winner === 'Du' ? (S().sender || 'mir') : o.winner;
    const keep = async (title, desc) => {
      const c = { icon: '🧭', title: title.slice(0, 50), desc: desc.slice(0, 120) };
      L.closeSheet();
      if (o.send && on()) { try { await P().sendCoupon(c); } catch (e) {} }
      S().coupons.push(Object.assign({ id: uid('c'), used: null, from: '' }, c)); L.save();
      if (!(o.send && on())) L.toast('🧭 Liegt unter Wir → Gutscheine');
      if (done) done(c.title);
    };
    let h = '<h3>🧭 Euer nächster Ausflug</h3>';
    if (sug.length) h += '<div class="re-list">' + sug.map((x, i) => '<button type="button" class="re-row" data-s="' + i + '"><span class="re-i">' + x.it.e + '</span><span class="re-b"><b>' + esc(x.it.t) + '</b><small>' + FW[x.it.fw].i + ' ' + FW[x.it.fw].t + '</small></span></button>').join('') + '</div>';
    h += '<div class="row wrap" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Später</button><button class="pill-btn' + (sug.length ? '' : ' primary') + '" data-frei>' + (sug.length ? 'Etwas anderes' : 'Ich überlege mir was') + '</button></div>';
    L.openSheet(h, (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => { const x = sug[Number(b.dataset.s)]; keep('Ausflug: ' + x.it.t, 'Ausgesucht von ' + wer + ' – gewonnen bei ' + o.game); }; });
      sh.querySelector('[data-frei]').onclick = () => keep('Ausflug nach Wunsch', wer + ' sucht das Ziel aus – gewonnen bei ' + o.game);
    });
    top();
  }

  function css() {
    if (document.getElementById('reisen-css')) return;
    const s = document.createElement('style'); s.id = 'reisen-css';
    s.textContent = 'html.re-top #modal{z-index:9700}' +
      '.re-list{display:flex;flex-direction:column;gap:10px;margin-top:12px}' +
      '.re-row{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:10px 14px;border-radius:18px;border:1px solid var(--line-soft);background:var(--tile-bg,rgba(255,255,255,.06));color:var(--text);font:inherit;text-align:left;cursor:pointer}' +
      '.re-row:active{transform:scale(.98);border-color:var(--accent-2)}.re-b{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.re-row b{font-size:19px;font-weight:700;line-height:1.25}.re-row small{font-size:16px;font-weight:500;color:var(--text-soft)}' +
      '.re-i{width:44px;height:44px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;background:rgba(255,255,255,.08)}' +
      '.re-go{flex:none;font-size:24px}';
    document.head.appendChild(s);
  }

  window.LZRE = { erleben, sheet, pick, ziele, vorschlaege, isAusflug, AUSFLUG, STORY, FW, DECK };
})();
