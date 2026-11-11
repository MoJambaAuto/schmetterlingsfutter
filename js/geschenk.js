/* Schmetterlingsfutter – Geschenkideen passend zur Person (LZW, 3.26.0)
   Jede Person sagt einmal, was sie mag („Das mag ich“). Das geht verschlüsselt mit der stillen Begrüßung an die andere App.
   Dazu kommen Pronomen und Alter (aus dem abgeglichenen Geburtstag) und ein eigenes Budget.
   Daraus entstehen die Vorschläge im Geschenk-Radar, in den Geschenkideen und in den Werbelinks:
   - Ideen aus den Interessen der Person (reihum, nach Pronomen/Alter gefiltert)
   - allgemeine Suchbegriffe werden angepasst („… für Frauen ab 50“ statt „… Partner“)
   - Budget als Preisfilter der Amazon-Suche
   Nichts davon verlässt die beiden Handys unverschlüsselt. */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const S = () => L.S;
  const P = () => window.LZP;
  const esc = L.esc;

  /* i: Symbol, t: Titel, q: Suchbegriff; g: nur für f/m; a: [ab Alter, bis Alter] */
  const LIKES = [
    ['kochen', '🍳', 'Kochen & Backen', [['🧂', 'Gewürz-Set aus aller Welt', 'Gewürze Geschenkset Welt'], ['🍝', 'Pasta-Maschine', 'Pastamaschine'], ['📗', 'Kochbuch mit Pfiff', 'Kochbuch Bestseller'], ['🔪', 'Gutes Kochmesser', 'Kochmesser Damast Geschenk']]],
    ['genuss', '🍷', 'Wein & Genuss', [['🍷', 'Weinprobe für zu Hause', 'Weinprobe Set zu Hause'], ['🍸', 'Gin-Tasting-Set', 'Gin Tasting Set'], ['🥃', 'Whisky-Tasting', 'Whisky Tasting Set', 'm'], ['🧺', 'Feinkost-Korb', 'Feinkost Präsentkorb']]],
    ['kaffee', '☕', 'Kaffee & Tee', [['☕', 'Barista-Zubehör', 'Barista Zubehör Set'], ['🫖', 'Tee-Probierset', 'Tee Probierset Geschenk'], ['🫘', 'Kaffee-Entdeckerset', 'Kaffee Probierset Bohnen']]],
    ['wellness', '🧖', 'Wellness & Pflege', [['💆', 'Nackenmassagegerät', 'Nackenmassagegerät Shiatsu'], ['🛁', 'Spa-Set', 'Wellness Set Frauen Geschenk', 'f'], ['🧔', 'Bartpflege-Set', 'Bartpflege Set Geschenk', 'm'], ['🥼', 'Kuscheliger Bademantel', 'Bademantel Waffelpiqué']]],
    ['sport', '🏃', 'Sport & Fitness', [['⌚', 'Fitness-Uhr', 'Fitnessuhr Smartwatch'], ['🧘', 'Yogamatte', 'Yogamatte rutschfest'], ['🎒', 'Sporttasche', 'Sporttasche Damen', 'f'], ['🎒', 'Sporttasche', 'Sporttasche Herren', 'm'], ['🌀', 'Faszienrolle', 'Faszienrolle Set']]],
    ['outdoor', '🥾', 'Natur & Wandern', [['🎒', 'Wanderrucksack', 'Wanderrucksack 30l'], ['🫗', 'Thermoskanne', 'Thermoskanne Edelstahl'], ['🌲', 'Hängematte', 'Hängematte Outdoor leicht'], ['🔦', 'Stirnlampe', 'Stirnlampe LED wiederaufladbar']]],
    ['reisen', '✈️', 'Reisen', [['🗺️', 'Rubbel-Weltkarte', 'Rubbel Weltkarte'], ['🧳', 'Reise-Organizer', 'Packwürfel Set'], ['📷', 'Sofortbildkamera', 'Sofortbildkamera']]],
    ['technik', '🎧', 'Technik & Gadgets', [['🎧', 'Kabellose Kopfhörer', 'Bluetooth Kopfhörer Noise Cancelling'], ['🔋', 'Powerbank', 'Powerbank kompakt'], ['💡', 'Smarte Lampe', 'Smart Lampe WLAN']]],
    ['gaming', '🎮', 'Gaming & Spiele', [['🎮', 'Retro-Konsole', 'Retro Konsole Spiele'], ['🎧', 'Gaming-Headset', 'Gaming Headset'], ['🎲', 'Brettspiel des Jahres', 'Spiel des Jahres Brettspiel']]],
    ['lesen', '📚', 'Bücher & Lesen', [['📱', 'E-Reader', 'E-Reader'], ['💡', 'Leselampe', 'Leselampe Buch Klemme'], ['📚', 'Bestseller-Roman', 'Bestseller Roman', 'f'], ['📚', 'Spannender Thriller', 'Thriller Bestseller']]],
    ['musik', '🎵', 'Musik', [['💿', 'Plattenspieler', 'Plattenspieler Bluetooth'], ['🔊', 'Gute Bluetooth-Box', 'Bluetooth Lautsprecher wasserdicht'], ['🎫', 'Konzertkarten', 'Konzertkarten Geschenk']]],
    ['kreativ', '🎨', 'Kreativ & Basteln', [['🎨', 'Aquarell-Set', 'Aquarell Set Erwachsene'], ['🖌️', 'Malen nach Zahlen', 'Malen nach Zahlen Erwachsene'], ['🧶', 'Makramee-Set', 'Makramee Set Anfänger']]],
    ['garten', '🌿', 'Pflanzen & Garten', [['🌿', 'Kräutergarten-Set', 'Kräutergarten Set Küche'], ['🌳', 'Bonsai-Starterset', 'Bonsai Starter Set'], ['🪴', 'Besondere Zimmerpflanze', 'Zimmerpflanze selten']]],
    ['zuhause', '🛋️', 'Zuhause & Deko', [['🕯️', 'Duftkerze', 'Duftkerze Geschenk'], ['🧣', 'Kuscheldecke', 'Kuscheldecke flauschig'], ['🖼️', 'Bilderrahmen-Set', 'Bilderrahmen Collage']]],
    ['mode', '💍', 'Mode & Schmuck', [['📿', 'Kette mit Gravur', 'Kette Gravur Damen', 'f'], ['🧣', 'Seidenschal', 'Seidenschal Damen', 'f'], ['⌚', 'Armbanduhr', 'Armbanduhr Herren', 'm'], ['🔗', 'Lederarmband', 'Lederarmband Herren Gravur', 'm'], ['👛', 'Lederbörse', 'Geldbörse Leder']]],
    ['tiere', '🐾', 'Tiere', [['🖼️', 'Haustier-Porträt', 'Haustier Portrait personalisiert'], ['🐶', 'Spielzeug fürs Tier', 'Hundespielzeug Intelligenz']]],
    ['film', '🎬', 'Filme & Serien', [['🍿', 'Popcorn-Maschine', 'Popcornmaschine'], ['📽️', 'Mini-Beamer', 'Mini Beamer'], ['🛋️', 'Filmabend-Box', 'Filmabend Geschenkbox']]],
  ].map(([id, icon, label, ideas]) => ({ id, icon, label, ideas: ideas.map(([i, t, q, g]) => ({ icon: i, title: t, q, g: g || '' })) }));
  const BUDGETS = [['', 'Egal'], ['25', 'bis 25 €'], ['50', 'bis 50 €'], ['100', 'bis 100 €'], ['250', 'bis 250 €']];

  const ids = (a) => (Array.isArray(a) ? a.filter((x) => LIKES.some((l) => l.id === x)) : []);
  const pn = () => (P() && P().partnerName ? P().partnerName() : S().receiver) || 'deinem Schatz';
  function gender() {
    if (S().giftFor === 'f' || S().giftFor === 'm') return S().giftFor;
    if (S().giftFor === 'n') return '';
    const p = (P() && P().partnerPron && P().partnerPron()) || S().rpron || '';
    return p === 'sie' ? 'f' : p === 'er' ? 'm' : '';
  }
  function age() {
    const b = S().partnerBirthday; if (!b) return null;
    const d = new Date(b + 'T12:00:00'), n = new Date(); if (isNaN(d)) return null;
    let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
    return a >= 14 && a < 110 ? a : null;
  }
  function likes() { const set = new Set(ids(S().partnerLikes).concat(ids(S().forLikes))); return LIKES.filter((l) => set.has(l.id)); }
  function profile() { return { g: gender(), age: age(), likes: likes(), budget: S().giftBudget || '', fromPartner: ids(S().partnerLikes).length > 0 }; }
  const ageWord = (a) => (a == null ? '' : a < 25 ? '' : a < 35 ? 'ab 30' : a < 45 ? 'ab 40' : a < 55 ? 'ab 50' : a < 65 ? 'ab 60' : 'ab 70');

  /* Allgemeine Suchbegriffe an die Person anpassen (nicht bei Paar-Sachen und nicht bei eigener Suche) */
  function query(q) {
    q = String(q || ''); const g = gender(); if (!g || /paar|zu zweit|für zwei|paare/i.test(q)) return q;
    if (/\bPartnerin\b|\bPartner\b/.test(q)) return q.replace(/\bPartnerin\b|\bPartner\b/, g === 'f' ? 'Frau' : 'Mann');
    if (/Geschenk/i.test(q) && !/Frauen|Männer|Damen|Herren|für sie|für ihn/i.test(q)) return q + (g === 'f' ? ' für Frauen' : ' für Männer');
    return q;
  }
  /* Budget als Preisfilter der Amazon-Suche (Cent) */
  function priceParam() { const b = S().giftBudget; return b ? '&rh=' + encodeURIComponent('p_36:-' + (+b * 100)) : ''; }

  /* n Ideen aus den Interessen, reihum, passend zu Pronomen */
  function ideas(n) {
    const pr = profile(); const out = [];
    /* reihum über alle Interessen verteilt: erst je eine Idee pro Interesse, dann die zweite … */
    const lists = pr.likes.map((l) => l.ideas.filter((it) => !it.g || it.g === pr.g).map((it) => Object.assign({ like: l.label }, it)));
    const pool = []; for (let r = 0; lists.some((x) => x[r]); r++) lists.forEach((x) => { if (x[r]) pool.push(x[r]); });
    if (pool.length) {
      const rot = Math.floor(Date.now() / 864e5); // jeden Tag andere Ideen, innerhalb eines Tages stabil
      for (let k = 0; k < Math.min(n, pool.length); k++) out.push(pool[(rot * n + k) % pool.length]);
    }
    if (out.length < n && pr.g) {
      const who = pr.g === 'f' ? 'Frauen' : 'Männer'; const aw = ageWord(pr.age);
      out.push({ icon: '🎁', title: 'Beliebt bei ' + who + (aw ? ' ' + aw : ''), q: 'Geschenk für ' + who + (aw ? ' ' + aw : ''), like: '' });
    }
    return out.slice(0, n);
  }
  /* Kurzbeschreibung fürs Geschenk-Fenster */
  function summary() {
    const pr = profile(); const parts = [];
    if (pr.g) parts.push(pr.g === 'f' ? 'sie' : 'er'); if (pr.age) parts.push(pr.age + ' Jahre');
    if (pr.likes.length) parts.push(pr.likes.slice(0, 3).map((l) => l.label).join(', ') + (pr.likes.length > 3 ? ' …' : ''));
    if (pr.budget) parts.push('bis ' + pr.budget + ' €');
    return parts.join(' · ');
  }
  function profileHtml() {
    const pr = profile(); const sm = summary();
    if (!pr.likes.length) return '<div class="gp-card"><div class="gp-t">🎯 Passender machen</div><p class="gp-s">Sag kurz, was ' + esc(pn()) + ' mag – dann passen die Vorschläge zur Person.</p><button type="button" class="pill-btn small primary" data-gprof>Was mag ' + esc(pn()) + '?</button></div>';
    return '<div class="gp-card"><div class="gp-t">🎯 Für ' + esc(pn()) + '</div><p class="gp-s">' + esc(sm) + (pr.fromPartner ? ' · ✓ von ' + esc(pn()) + ' selbst' : '') + '</p><button type="button" class="pill-btn small ghost" data-gprof>Ändern</button></div>';
  }
  function bindProfile(root, after) { root.querySelectorAll('[data-gprof]').forEach((b) => b.onclick = () => sheet('them', after)); }

  /* Auswahl: „Das mag ich“ (me) oder „Was mag …?“ (them) */
  function sheet(mode, after) {
    const me = mode === 'me'; const sel = new Set(me ? ids(S().myLikes) : ids(S().forLikes)); const fromP = ids(S().partnerLikes);
    let budget = S().giftBudget || ''; let gfor = S().giftFor || '';
    const chips = LIKES.map((l) => '<button type="button" data-l="' + l.id + '" class="' + (sel.has(l.id) ? 'on' : '') + '">' + l.icon + ' ' + esc(l.label) + '</button>').join('');
    const g = gender(), a = age();
    const html = '<h3>' + (me ? '💝 Das mag ich' : '🎯 Was mag ' + esc(pn()) + '?') + '</h3>' +
      '<p class="about" style="font-size:16px;margin-bottom:10px">' + (me ? 'Damit ' + esc(pn()) + ' passende Geschenkideen bekommt. Geht verschlüsselt nur an ' + esc(pn()) + '.' : 'Bleibt auf deinem Handy. ' + (fromP.length ? esc(pn()) + ' hat selbst angegeben: ' + esc(LIKES.filter((l) => fromP.indexOf(l.id) >= 0).map((l) => l.label).join(', ')) + '.' : 'Tipp: Fragt ' + esc(pn()) + ' unter Mehr → „Das mag ich“, dann kommt es von selbst.')) + '</p>' +
      '<div class="chips big gp-chips" id="gpChips">' + chips + '</div>' +
      (me ? '' : '<div class="field" style="margin-top:12px"><label>Geschenke eher für</label><div class="chips" id="gpFor">' + [['', 'wie Pronomen'], ['f', 'Frau'], ['m', 'Mann'], ['n', 'egal']].map(([v, t]) => '<button type="button" data-f="' + v + '" class="' + (v === gfor ? 'on' : '') + '">' + t + '</button>').join('') + '</div></div>' +
        '<div class="field" style="margin-top:12px"><label>Budget</label><div class="chips" id="gpBudget">' + BUDGETS.map(([v, t]) => '<button type="button" data-b="' + v + '" class="' + (v === budget ? 'on' : '') + '">' + t + '</button>').join('') + '</div></div>' +
        '<p class="about" style="font-size:15px;color:var(--text-muted)">' + (a ? 'Alter: ' + a + ' Jahre (aus dem Geburtstag)' : 'Alter: unbekannt – kommt automatisch, sobald ' + esc(pn()) + ' den Geburtstag einträgt') + '.</p>') +
      '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Speichern</button></div>';
    L.openSheet(html, (sh) => {
      sh.querySelectorAll('#gpChips button').forEach((b) => b.onclick = () => { const id = b.dataset.l; if (sel.has(id)) sel.delete(id); else sel.add(id); b.classList.toggle('on', sel.has(id)); });
      sh.querySelectorAll('#gpBudget button').forEach((b) => b.onclick = () => { budget = b.dataset.b; sh.querySelectorAll('#gpBudget button').forEach((x) => x.classList.toggle('on', x === b)); });
      sh.querySelectorAll('#gpFor button').forEach((b) => b.onclick = () => { gfor = b.dataset.f; sh.querySelectorAll('#gpFor button').forEach((x) => x.classList.toggle('on', x === b)); });
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-ok]').onclick = () => {
        if (me) { S().myLikes = Array.from(sel); L.save(); if (P() && P().announce) P().announce(); L.toast(P() && P().paired() ? '💝 Gespeichert – ' + pn() + ' bekommt passendere Ideen' : '💝 Gespeichert'); }
        else { S().forLikes = Array.from(sel); S().giftBudget = budget; S().giftFor = gfor; L.save(); L.toast('🎯 Vorschläge angepasst'); }
        window.LZS && window.LZS.count('gift_profile:' + mode);
        L.closeSheet(); if (P() && P().renderGiftRadar) P().renderGiftRadar(); render(); if (after) setTimeout(after, 80);
      };
    });
  }
  /* Über die stille Begrüßung */
  const payload = () => ids(S().myLikes);
  function got(list) {
    const next = ids(list); const prev = ids(S().partnerLikes);
    if (next.join() === prev.join()) return;
    S().partnerLikes = next; L.save(); if (P() && P().renderGiftRadar) P().renderGiftRadar();
  }
  /* Eintrag unter Mehr */
  function render() {
    const c = document.getElementById('likesSettings'); if (!c) return;
    const mine = LIKES.filter((l) => ids(S().myLikes).indexOf(l.id) >= 0);
    c.innerHTML = '<div class="eyebrow">💝 Das mag ich</div><p class="about" style="font-size:17px;margin-bottom:10px">' + (mine.length ? esc(mine.map((l) => l.label).join(', ')) : 'Noch nichts angegeben. ' + esc(pn()) + ' bekommt dann allgemeine Geschenkideen.') + '</p>' +
      '<div class="row wrap" style="justify-content:flex-start"><button class="pill-btn small" data-me>' + (mine.length ? 'Ändern' : 'Angeben') + '</button><button class="pill-btn small ghost" data-them>Was mag ' + esc(pn()) + '?</button></div>';
    c.querySelector('[data-me]').onclick = () => sheet('me');
    c.querySelector('[data-them]').onclick = () => sheet('them');
  }

  const css = document.createElement('style');
  css.textContent = '.gp-card{border:.5px solid var(--line);background:var(--glass-2);border-radius:14px;padding:10px 14px;margin:8px 0 10px;display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center}' +
    '.gp-card .gp-t{font-weight:700;font-size:16px}.gp-card .gp-s{grid-column:1;margin:0;font-size:15px;color:var(--text-soft)}.gp-card button{grid-column:2;grid-row:1/span 2}' +
    '.gp-chips{max-height:44vh;overflow:auto}';
  document.head.appendChild(css);

  window.LZW = { LIKES, profile, query, priceParam, ideas, summary, profileHtml, bindProfile, sheet, payload, got, render };
  render();
})();
