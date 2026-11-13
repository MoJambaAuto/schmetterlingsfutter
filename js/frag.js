/* Schmetterlingsfutter – „Frag Papillon“: Suche, die Fragen versteht und direkt zur Funktion springt.
   Läuft ganz im Gerät, ohne Internet und ohne KI-Dienst. Findet sie nichts, kann man die Frage freiwillig als Idee spenden. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const $ = (id) => document.getElementById(id), esc = L.esc;
  const P = () => window.LZP, N = () => window.LZN, X = () => window.LZX;

  /* ---------- Sprünge ---------- */
  const tap = (id) => () => { L.showView('home'); const b = $(id); if (b) b.click(); };
  const view = (v, sub) => () => { L.showView(v); if (sub) L.showSub(v, sub); window.scrollTo(0, 0); };
  const spot = (v, id, sub) => () => { L.showView(v); if (sub) L.showSub(v, sub); setTimeout(() => { const e = $(id); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120); };
  const klartext = (word) => () => { L.showView('play'); L.showSub('play', 'klartext'); if (N()) N().render(); setTimeout(() => { const el = Array.from(document.querySelectorAll('#klartextList > *')).find((x) => x.textContent.indexOf(word) >= 0); if (el) (el.querySelector('button') || el).click(); }, 150); };
  const deck = (re) => () => { const d = (D.decks || []).find((x) => re.test(x.id) || re.test(x.title || '')); if (d && P()) P().playDeck(d.id); else view('play', 'match')(); };

  /* ---------- Was es alles gibt: [Gruppe, Symbol, Titel, Suchwörter, Antwort (nur wo nötig), Sprung] ---------- */
  const ITEMS = [
    ['Zu zweit', '🦋', 'Papillon in der Heide: 3D-Spiel, mit Papillon fliegen und Falter fangen', 'heide 3d spiel papillon fliegen open world abenteuer schmetterling fangen landschaft musik', '', () => { if (window.LZH) window.LZH.open(); }],
    ['Mehr', '✨', 'Was ist neu in der App?', 'neu neuigkeiten update version aktualisierung changelog was ist neu', '', () => { const D = window.LUZIFER_DATA; L.openSheet('<h3>✨ Neu in Version ' + L.esc(D.version) + '</h3><ul class="nw-list">' + (D.news || []).slice(0, 3).map((n) => n.items.map((t) => '<li>' + L.esc(t) + '</li>').join('')).join('') + '</ul><div class="row" style="margin-top:12px"><button class="pill-btn primary" data-ok>Schön!</button></div>', (sh) => { sh.querySelector('[data-ok]').onclick = L.closeSheet; }); }],
    ['Mehr', '🎁', 'Empfehlungen: ausgesuchte Partner für Erlebnisse, Blumen, Tickets', 'empfehlungen partner partnerangebote angebote erlebnis blumen tickets gutschein werbung shop', '', () => { if (window.LZE && window.LZE.visible().length) window.LZE.sheet(); else L.toast('Die Empfehlungen kommen bald'); }],
    ['Zu zweit', '✨', 'Falter zu Besuch: drei Falter im Zimmer fangen (Raum-AR)', 'falter zu besuch zimmer raum ar augmented reality 3d drinnen zuhause wohnzimmer kamera fangen', '', () => { if (window.LZA) window.LZA.visit(); }],
    ['Zu zweit', '💞', 'Falterspaziergang: zusammen rausgehen und drei Falter finden', 'falterspaziergang spaziergang zusammen rausgehen gemeinsam draußen walk date natur', '', () => { if (window.LZJ) window.LZJ.open(); }],
    ['Spielen', '🔄', 'Spiel neu starten oder beenden: im Spiel oben rechts auf ⋯', 'spiel neu starten neustart abbrechen beenden aufgeben aufhören reset würfelwiese wanderzug blumenbeete raupe wiese menü', '', () => { view('play', 'spiele')(); L.toast('Spiel öffnen, dann oben rechts auf ⋯ tippen'); }],
    ['Zu zweit', '🕸️', 'Falterjagd draußen: echte Falter in der Natur fangen', 'falterjagd draussen draußen natur fangen netz karte spazieren gehen ar pokemon go standort', '', () => { if (window.LZJ) window.LZJ.open(); }],
    ['Jeden Tag', '📖', 'Schmetterlingsbuch: eure entdeckten Falter', 'schmetterlingsbuch buch sammlung falter arten generation kokon raupe ei selten pracht', '', () => { if (window.LZX && window.LZX.book) window.LZX.book(); }],
    ['Jeden Tag', '💝', 'Das mag ich: Interessen für passende Geschenkideen', 'mag ich interessen hobbys vorlieben geschenk passend profil geschmack', '', () => { if (window.LZW) window.LZW.sheet('me'); }],
    ['Jeden Tag', '🎯', 'Was mag mein Schatz? Geschenke passend machen (Budget)', 'geschenk passend budget preis frau mann alter interessen schatz partner', '', () => { if (window.LZW) window.LZW.sheet('them'); }],
    ['Jeden Tag', '↩', 'Auf eine Nachricht antworten (mit Bezug)', 'antworten antwort bezug worauf zitat reagieren nachricht postfach', '', () => { if (P()) P().inboxSheet(); }],
    ['Zu zweit', '🦋', 'Wanderzug (Backgammon)', 'backgammon wanderzug brettspiel wuerfel würfel steine tric trac puff', '', () => { if (window.LZG2) window.LZG2.newGame('wanderzug'); }],
    ['Zu zweit', '🌼', 'Wiese durchsuchen (wie Schiffe versenken)', 'schiffe versenken verstecken suchen wiese raster treffer', '', () => { if (window.LZG2) window.LZG2.newGame('wiese'); }],
    ['Zu zweit', '🐛', 'Raupe rät (Wortraten)', 'galgenmaennchen galgenmännchen hangman wort raten buchstaben raupe', '', () => { if (window.LZG2) window.LZG2.newGame('raupe'); }],
    ['Zu zweit', '🎲', 'Würfelwiese (Würfelspiel)', 'kniffel yahtzee wuerfel würfel wuerfelspiel würfelspiel paschen', '', () => { if (window.LZG2) window.LZG2.newGame('wuerfel'); }],
    ['Zu zweit', '🌸', 'Blumenbeete (wie Käsekästchen)', 'kaesekaestchen käsekästchen kästchen linien zaun beete', '', () => { if (window.LZG2) window.LZG2.newGame('beete'); }],
    ['Zu zweit', '🎁', 'Liebesdienst als Einsatz', 'einsatz preis wette gewinnen verlieren liebesdienst gutschein', 'Vor jedem Duell wählbar: Wer verliert, schickt den Liebesdienst als Gutschein.', view('play', 'spiele')],
    ['Zu zweit', '🎲', 'Spiele zu zweit: alle Spiele auf einen Blick', 'spiele spiel spielen duell gegeneinander miteinander zocken langweilig', '', view('play', 'spiele')],
    ['Zu zweit', '🕵️', 'Zwei Wahrheiten, eine Lüge', 'luege lüge wahrheit wahrheiten raten durchschauen flunkern', '', () => { if (window.LZG) window.LZG.luegeNew(); }],
    ['Zu zweit', '📖', 'Satz für Satz: gemeinsame Geschichte', 'geschichte erzaehlen erzählen schreiben story satz märchen', '', () => { if (window.LZG) window.LZG.storyNew(); }],
    ['Zu zweit', '🦋', 'Schmetterlinge fangen: Tagesduell', 'fangen schmetterlinge jagen reaktion highscore punkte duell schnell', '', () => { if (window.LZG) window.LZG.fangOpen(); }],
    ['Zu zweit', '🗺️', 'Schnitzeljagd: Überraschung verstecken', 'schnitzeljagd verstecken suchen hinweise schatzsuche ueberraschung überraschung', '', () => { if (window.LZG) window.LZG.jagdNew(); }],
    ['Zu zweit', '📷', 'Handys verbinden: Code scannen oder zeigen', 'verbinden koppeln kopplung partner qr code scannen scanner kamera einladen einladung beitreten verbindung', '', () => { if (window.LZP) window.LZP.pairSheet(); }],
    ['Zu zweit', '📅', 'Unsere Daten: Jahrestag, Kennenlernen, erster Kuss, Hochzeitstag, Geburtstage', 'jahrestag datum kennengelernt kennenlernen kuss erster hochzeit hochzeitstag geburtstag geburtsdatum zusammen seit wann daten abgleichen', 'Gemeinsame Daten stehen bei verbundenen Apps automatisch bei euch beiden gleich drin.', () => { if (window.LZD) window.LZD.sheet('anniversary'); }],
    ['Schicken', '📸', 'Schmetterlings-Kamera: Selfie, Foto oder Video mit Schmetterlingen', 'kamera foto selfie video bild aufnehmen filter effekt schmetterling fluegel krone verwandlung ar', '', () => { if (window.LZK) window.LZK.open(); }],
    ['Botschaften', '💌', 'Neue Botschaft', 'botschaft nachricht liebesbotschaft text sagen herz tippen neu', '', tap('btnNext')],
    ['Botschaften', '💋', 'Ein Kuss', 'kuss kuessen bussi', '', tap('btnKiss')],
    ['Botschaften', '🤗', 'Kuscheln', 'kuscheln umarmung umarmen druecken', '', tap('btnHug')],
    ['Botschaften', '☀️', 'Guten Morgen', 'morgen morgens aufwachen frueh gruss', '', tap('btnMorning')],
    ['Botschaften', '🌙', 'Gute Nacht', 'nacht schlafen abend traeumen', '', tap('btnNight')],
    ['Botschaften', '✨', 'Spruch zaubern', 'spruch generator zaubern zufall frech witzig', '', tap('btnGen')],
    ['Botschaften', '✍️', 'Selbst schreiben', 'eigene botschaft schreiben selbst text verfassen eigener', '', tap('btnWrite')],
    ['Botschaften', '🪶', 'Liebesgedicht', 'gedicht reim reimen poesie dichten vers', '', tap('btnPoem')],
    ['Botschaften', '🌹', 'Warum ich dich liebe', 'gruende grund liebe warum liste sammlung', '', tap('btnReasons')],
    ['Schicken', '🎁', 'Überraschung senden', 'ueberraschung umschlag geschenk spaeter zeit planen versenden auspacken', '', tap('btnGift')],
    ['Schicken', '🎨', 'Kritzel-Gruß', 'malen zeichnen bild foto kritzeln stempel selfie kamera', '', tap('btnKritzel')],
    ['Schicken', '🎶', 'Jingle schicken', 'jingle lied musik singen song ton melodie stimme frauenstimme maennerstimme umschalten', 'In der Jingle-Box wählst du oben zwischen Frauenstimme und Männerstimme.', tap('btnJingle')],
    ['Schicken', '📡', 'Nah dran', 'qr code nfc sticker link naehe scannen', '', tap('btnNah')],
    ['Schicken', '🖼️', 'Als Bild teilen', 'teilen instagram facebook whatsapp status story social bild karte posten tiktok', 'Tippe an einer Botschaft auf ↗ und wähle „Als Bild teilen“.', spot('home', 'msgText')],
    ['Zu zweit', '💞', 'Handys verbinden', 'verbinden koppeln partner code paar link einladen zweites handy app verbindung', '', () => { if (P()) P().pairSheet(); }],
    ['Zu zweit', '📬', 'Postfach', 'postfach nachrichten eingang erhalten bekommen angekommen', '', () => { if (P()) P().inboxSheet(); }],
    ['Zu zweit', '🎯', 'Worauf habt ihr heute Bock?', 'spiel spielen bock lust heute abend gleichklang unternehmen', '', deck(/bock/i)],
    ['Zu zweit', '🤝', 'Gemeinsame Interessen', 'gemeinsam gemeinsamkeiten interessen hobby hobbys freizeit musik film filme serie serien fernsehen kultur reisen urlaub essen entdecken verbindet neues ausprobieren', '', view('play', 'gemeinsam')],
    ['Zu zweit', '🗓️', 'Date-Ideen', 'date dates ideen ausgehen verabredung ausflug', '', deck(/date/i)],
    ['Zu zweit', '🌦️', 'Wetterbericht der Woche', 'wetter wetterbericht woche stimmung beziehung rueckblick', '', () => { if (N()) N().checkinStart(); }],
    ['Zu zweit', '🗝️', 'Unausgesprochen', 'reden thema ansprechen unausgesprochen problem sorgen', '', deck(/reden/i)],
    ['Zu zweit', '🕊️', 'Sag’s sanft', 'vorwurf streit formulieren sanft kritik aerger wut sauer', '', () => { if (N()) N().softStart(''); }],
    ['Zu zweit', '⏳', 'Zwiegespräch', 'zwiegespraech timer reden zuhoeren gespraech aussprache', '', klartext('Zwiegespräch')],
    ['Zu zweit', '🏳️', 'Weiße Fahne', 'streit frieden versoehnen entschuldigen pause sorry vertragen', '', klartext('Weiße Fahne')],
    ['Zu zweit', '🃏', 'Gesprächskarte ziehen', 'frage fragen karte gespraech kennenlernen tiefer', '', klartext('Gesprächskarte')],
    ['Zu zweit', '🌼', 'Gänseblümchen-Orakel', 'orakel blume gaensebluemchen liebt zupfen', '', view('play', 'oracle')],
    ['Zu zweit', '🎹', 'Liebeslied-Pad', 'lied komponieren toene klavier aufnehmen melodie spielen', '', spot('play', 'songList', 'music')],
    ['Zu zweit', '🔥', 'Zweisamkeit (18+)', 'zweisamkeit erotik flirt sex intim vorlieben lust leidenschaft', '', view('play', 'intim')],
    ['Zu zweit', '💞', 'Wer ist dran? Spiele, die auf dich warten', 'dran warten wartet einladung ergebnis gesehen gelesen status partner mitspielen', 'Steht oben auf der Startseite unter „Du & …“.', spot('home', 'partnerCard')],
    ['Jeden Tag', '🦋', 'Flügelschlag des Tages', 'fluegelschlag aufgabe tagesaufgabe aktion heute tun piek', '', spot('home', 'piekCard')],
    ['Jeden Tag', '🙏', 'Dankbarkeits-Notiz', 'danke dankbar dankbarkeit notiz', '', spot('home', 'thanksCard')],
    ['Jeden Tag', '🦋', 'Euer Schmetterling', 'schmetterling futter fuettern raupe ei kokon schwarm punkte belohnung wachsen falter', 'Jede liebe Geste ist Futter. Er wächst für euch beide.', () => { L.showView('home'); const b = document.querySelector('#bflyCard [data-open]'); if (b) b.click(); }],
    ['Jeden Tag', '📅', 'Unsere Zeit', 'jahrestag tage zusammen meilenstein zaehler seit wann', '', view('time', 'days')],
    ['Jeden Tag', '💘', 'Anlässe und Erinnerungen', 'anlass anlaesse geburtstag valentinstag kalender erinnerung termin weihnachten geschenk', '', view('time', 'occasions')],
    ['Jeden Tag', '🗺️', 'Love Map', 'wunsch wuensche lieblingsdinge groesse traum notieren merken geschenkidee', '', view('wishes', 'wishlist')],
    ['Jeden Tag', '🎟️', 'Liebes-Gutscheine', 'gutschein gutscheine einloesen schenken', '', view('wishes', 'coupons')],
    ['Jeden Tag', '⭐', 'Favoriten', 'favorit favoriten merken gespeichert lieblingsbotschaft', '', spot('home', 'favPanel')],
    ['Jeden Tag', '🔍', 'Selbst suchen: Geschenk, Anlass, Idee', 'suchen suche amazon kaufen geschenk idee eigene shop produkt anlass bestellen', '', () => { if (P()) P().searchSheet(); }],
    ['Verwaltung', '✏️', 'Namen und Symbole ändern', 'name namen aendern symbol emoji anrede', '', spot('settings', 'setSender')],
    ['Verwaltung', '🎨', 'Farbwelt', 'farbe farben design aussehen dunkel hell', '', spot('settings', 'themeGrid')],
    ['Verwaltung', '💾', 'Daten sichern', 'sichern sicherung export import wiederherstellen neues handy uebertragen loeschen', '', spot('settings', 'btnExport')],
    ['Verwaltung', '🔔', 'Animationen und Vibration', 'animation animationen vibration ausschalten bewegung', '', spot('settings', 'togMotion')],
    ['Verwaltung', '🔔', 'Mitteilungen aufs Handy', 'push mitteilung mitteilungen benachrichtigung benachrichtigungen sperrbildschirm klingeln hinweis melden geschlossen ton', 'Der Schalter erscheint, sobald eure Apps verbunden sind.', spot('settings', 'pushRow')],
    ['Verwaltung', '📱', 'Auf dem iPhone nutzen', 'iphone apple ios installieren safari bildschirm', 'Öffne die Seite in Safari, tippe auf Teilen und dann „Zum Home-Bildschirm“.', null],
    ['Verwaltung', '💡', 'Idee spenden', 'idee vorschlag feedback verbessern mitmachen', '', () => { if (P()) P().ideaSheet('frage'); }],
    ['Verwaltung', '🚩', 'Etwas melden', 'melden fehler unpassend funktioniert nicht kaputt', '', () => { if (P()) P().reportSheet(''); }],
    ['Verwaltung', '🔒', 'Datenschutz', 'datenschutz daten privat sicher verschluesselt impressum', '', () => { location.href = 'privacy.html'; }],
    ['Verwaltung', '🦋', 'Papillon fliegt vorbei: ein- oder ausschalten', 'schmetterling fliegt fliegen anreiz einladung ausschalten abschalten nervt stoert papillon', '', spot('settings', 'togFly')],
  ];

  /* ---------- Verstehen: Umlaute glätten, Füllwörter weg, Tippfehler verzeihen ---------- */
  const norm = (s) => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
  const STOP = new Set('wie kann ich wo ist sind der die das ein eine einen mein meine meinen meinem meiner was und zu fuer mit man mache machen finde finden geht gibt es den dem im in an auf bitte moechte will soll kannst du mir uns wir ihr sich nicht oder aber auch noch mal etwas'.split(' '));
  function lev1(a, b) { // Abstand höchstens 1?
    if (Math.abs(a.length - b.length) > 1) return false; let i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++d > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
    return d + (a.length - i) + (b.length - j) <= 1;
  }
  const INDEX = ITEMS.map((it) => ({ it, t: norm(it[2]).split(' '), k: norm(it[3]).split(' ') }));
  function search(q) {
    const words = norm(q).split(' ').filter((w) => w.length > 1 && !STOP.has(w)); if (!words.length) return [];
    return INDEX.map((e) => {
      let score = 0;
      words.forEach((w) => {
        let best = 0;
        e.t.concat(e.k).forEach((x, i) => {
          const title = i < e.t.length ? 1 : 0; let s = 0;
          if (x === w) s = 3; else if (x.length >= 3 && w.length >= 3 && (x.indexOf(w) === 0 || w.indexOf(x) === 0)) s = 2; else if (w.length >= 5 && lev1(w, x)) s = 1.5; else if (w.length >= 4 && x.indexOf(w) > 0) s = 1;
          if (s) best = Math.max(best, s + title * 0.5);
        });
        score += best;
      });
      return { it: e.it, score };
    }).filter((r) => r.score >= 1.5).sort((a, b) => b.score - a.score).slice(0, 6).map((r) => r.it);
  }

  /* ---------- Oberfläche ---------- */
  const row = (it) => '<button type="button" class="frag-row" data-i="' + ITEMS.indexOf(it) + '"><span class="frag-e">' + it[1] + '</span><span class="frag-b"><span class="frag-t">' + esc(it[2]) + '</span>' + (it[4] ? '<span class="frag-a">' + esc(it[4]) + '</span>' : '') + '</span>' + (it[5] ? '<span class="frag-go" aria-hidden="true">›</span>' : '') + '</button>';
  let missT = null;
  function open() {
    if (window.LZS) window.LZS.count('frag_open');
    L.openSheet('<h3>🦋 Frag Papillon</h3><div class="field" style="margin-bottom:10px"><input id="fragQ" type="search" autocomplete="off" enterkeyhint="search" placeholder="Was möchtest du tun?" aria-label="Was möchtest du tun?"></div><div id="fragOut"></div><div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      const inp = sh.querySelector('#fragQ'), out = sh.querySelector('#fragOut');
      function draw() {
        const q = inp.value.trim(); let html = '';
        if (!q) { let g = ''; ITEMS.forEach((it) => { if (it[0] !== g) { g = it[0]; html += '<div class="eyebrow frag-g">' + esc(g) + '</div>'; } html += row(it); }); }
        else {
          const hits = search(q);
          clearTimeout(missT); if (!hits.length && window.LZS) missT = setTimeout(() => { window.LZS.count('frag_miss'); window.LZS.term('frag', q); }, 2500);
          html = hits.length ? hits.map(row).join('') : '<p class="about" style="margin:6px 0 12px">Dazu finde ich in der App noch nichts.</p><div class="row wrap" style="justify-content:flex-start">' + (P() ? '<button type="button" class="pill-btn" id="fragShop">🛒 Bei Amazon nach „' + esc(q.slice(0, 30)) + '“ suchen ↗</button>' : '') + (D.ideaBox && P() ? '<button type="button" class="pill-btn ghost" id="fragAsk">💡 Frage an uns schicken</button>' : '') + '</div>' + (P() ? '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:8px">Werbelink zur Amazon-Suche.</p>' : '');
        }
        out.innerHTML = html;
        out.querySelectorAll('.frag-row').forEach((b) => b.onclick = () => { const it = ITEMS[Number(b.dataset.i)]; if (window.LZS) window.LZS.count('frag_go:' + norm(it[2]).split(' ').slice(0, 3).join('_')); if (!it[5]) return; L.closeSheet(); setTimeout(it[5], 60); });
        const shop = out.querySelector('#fragShop'); if (shop) shop.onclick = () => { if (window.LZS) { window.LZS.count('frag_shop'); window.LZS.term('shop', q); } window.open(P().amazonUrl(q), '_blank', 'noopener'); };
        const ask = out.querySelector('#fragAsk'); if (ask) ask.onclick = async () => { ask.disabled = true; try { await fetch(P().RELAY + '/idea', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'sonstiges', text: ('FRAGE | ' + q).slice(0, 240), app: D.version }) }); L.toast('Danke! Wir schauen es uns an.'); L.closeSheet(); } catch (e) { ask.disabled = false; L.toast('Keine Verbindung. Versuch es später nochmal.'); } };
      }
      inp.oninput = draw; inp.onkeydown = (e) => { if (e.key === 'Enter') { const first = out.querySelector('.frag-row'); if (first && inp.value.trim()) first.click(); } };
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      draw();
    });
  }

  /* feste Suchleiste oben, auf jeder Seite erreichbar */
  const app = $('app');
  if (app && !$('fragBar')) {
    const bar = document.createElement('div'); bar.className = 'frag-bar'; bar.innerHTML = '<button type="button" id="fragBar"><span aria-hidden="true">🔍</span> Frag Papillon</button>';
    app.insertBefore(bar, app.querySelector('header'));
    $('fragBar').onclick = open;
  }
  window.LZQ = { open, search: (q) => search(q).map((it) => it[2]) };
})();
