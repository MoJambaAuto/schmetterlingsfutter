/* Schmetterlingsfutter – Falter-Wissen (3.41.0)
   Echtes Wissen über Schmetterlinge, nebenbei und ohne zu nerven:
   1. Steckbriefe je Art (Schmetterlingsbuch, 3D-Heide, Falterjagd, Falter zu Besuch) – zum Antippen, nie aufgedrängt
   2. „Falter-Wissen“ auf der Startseite: jeden Tag eine Tatsache, passend zum Monat
   3. „Echten Faltern helfen“: mitzählen, spenden, Brennnesseln stehen lassen (Links direkt zu den Vereinen, wir verdienen nichts)
   4. Fragen für das Quiz „Wahr oder Falter?“ (spiele2.js)
   Regel: nur fachlich gesicherte Aussagen. Lieber weglassen als raten.
   QUIZ nur hinten ergänzen, nie umsortieren: Bei „zwei Handys“ wandern nur die Nummern der Fragen. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const $ = (id) => document.getElementById(id), esc = L.esc, S = () => L.S;
  const C = (k) => window.LZS && window.LZS.count(k);

  /* ---------- 1. Steckbriefe (Index wie LADDER in extra.js / Feld in img/falter.webp) ---------- */
  const ART = [
    { n: 'Kohlweißling', fly: 'April – Oktober', food: 'Kohl und andere Kreuzblütler', plus: 'Es gibt den Großen und den Kleinen Kohlweißling. Beide fliegen in mehreren Generationen pro Jahr.', love: 'Häufig heißt nicht gewöhnlich – wie die kleinen Gesten im Alltag.' },
    { n: 'Zitronenfalter', fly: 'Februar – Oktober, überwintert als Falter', food: 'Faulbaum und Kreuzdorn', plus: 'Nur die Männchen sind zitronengelb, die Weibchen blass grünlich-weiß.', love: 'Hält durch, auch wenn es mal frostig wird.' },
    { n: 'Hauhechel-Bläuling', fly: 'Mai – September', food: 'Hornklee, Hauhechel und andere Schmetterlingsblütler', plus: 'Ameisen umsorgen die Raupen – dafür bekommen sie süße Tröpfchen.', love: 'Wer genau hinsieht, entdeckt mehr Farbe.' },
    { n: 'Kleiner Fuchs', fly: 'März – Oktober, überwintert als Falter', food: 'Brennnessel', plus: 'Die jungen Raupen leben gesellig in einem gemeinsamen Gespinst.', love: 'Liebt, was andere links liegen lassen.' },
    { n: 'Tagpfauenauge', fly: 'März – Oktober, überwintert als Falter', food: 'Brennnessel', plus: 'Gestört reibt er die Flügel aneinander – das zischt leise.', love: 'Zeigt seine schönste Seite, wenn es darauf ankommt.' },
    { n: 'Admiral', fly: 'Mai – Oktober', food: 'Brennnessel', plus: 'Immer mehr Admirale überwintern inzwischen auch bei uns, statt in den Süden zu ziehen.', love: 'Fliegt weit – und findet doch zurück.' },
    { n: 'Schwalbenschwanz', fly: 'April – August', food: 'Wilde Möhre, Fenchel und Dill', plus: 'Zur Partnersuche treffen sich die Falter gern auf Hügelkuppen.', love: 'Man findet sich da, wo man sich gern sieht.' }
  ];
  /* 3D-Heide nutzt eigene Kennungen */
  const HEIDE = { kohl: 0, zitrone: 1, blau: 2, fuchs: 3, pfau: 4, admiral: 5, schwalbe: 6 };
  function steck(i) {
    const a = ART[i]; if (!a) return '';
    return '<div class="wi-steck">' +
      '<div><span aria-hidden="true">🗓️</span><span><b>Fliegt</b> ' + esc(a.fly) + '</span></div>' +
      '<div><span aria-hidden="true">🌿</span><span><b>Raupe frisst</b> ' + esc(a.food) + '</span></div>' +
      '<div><span aria-hidden="true">✨</span><span>' + esc(a.plus) + '</span></div>' +
      '<div class="wi-love"><span aria-hidden="true">💞</span><span>' + esc(a.love) + '</span></div></div>';
  }
  /* Kleiner Knopf unter einem Fang – öffnet den Steckbrief an Ort und Stelle */
  const moreRow = (i) => ART[i] ? '<div class="wi-more"><button type="button" class="wi-link" data-wiart="' + i + '">ℹ️ Steckbrief ' + esc(ART[i].n) + '</button></div>' : '';
  /* Mehrere Arten (Falter zu Besuch): je ein kleiner Knopf */
  const moreRows = (list) => { const u = Array.from(new Set(list)).filter((i) => ART[i]); return u.length ? '<div class="wi-more wrap">' + u.map((i) => '<button type="button" class="wi-link" data-wiart="' + i + '">ℹ️ ' + esc(ART[i].n) + '</button>').join('') + '</div>' : ''; };

  /* ---------- 2. Falter-Wissen des Tages ---------- */
  const MONAT = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const SAISON = [
    ['Der Zitronenfalter überwintert ungeschützt im Gebüsch. Ein körpereigener Frostschutz bewahrt ihn vor dem Erfrieren.', 'Tagpfauenaugen schlafen jetzt in Kellern und Schuppen. Findet ihr eines: in Ruhe lassen, nicht ins Warme holen.'],
    ['Schon an den ersten warmen Sonnentagen kann ein Zitronenfalter fliegen – er hat als fertiger Falter überwintert.', 'Viele Falter überwintern als Ei, Raupe oder Puppe. Nur wenige Arten überstehen den Winter als fertiger Falter.'],
    ['Die Kätzchen der Salweide blühen früh. Für die ersten Falter des Jahres sind sie oft die erste Mahlzeit.', 'Kleiner Fuchs und Tagpfauenauge wachen aus der Winterruhe auf und sonnen sich, bis ihre Flugmuskeln warm sind.'],
    ['Jetzt fliegt der Aurorafalter. Nur die Männchen tragen die leuchtend orangen Flügelspitzen.', 'Löwenzahn stehen lassen: Seine Blüten sind im Frühling ein reich gedeckter Tisch für Falter.'],
    ['Die ersten Distelfalter kommen aus dem Süden – manche haben dafür sogar das Mittelmeer überquert.', 'Der Hauhechel-Bläuling fliegt wieder. Nur die Männchen leuchten so blau, die Weibchen sind meist braun.'],
    ['Der Distelfalter wandert zwischen Afrika und Europa, hin und zurück rund 12.000 Kilometer. Keiner schafft das allein – erst mehrere Generationen nacheinander.', 'Schwalbenschwänze treffen sich zur Partnersuche gern auf Hügelkuppen.'],
    ['Jetzt fliegt der Schmetterling des Jahres 2026: der Dunkle Wiesenknopf-Ameisenbläuling – nur im Juli und August.', 'Das Taubenschwänzchen steht im Schwirrflug vor Blüten wie ein Kolibri. Dabei ist es ein Nachtfalter, der am Tag fliegt.'],
    ['Die Raupe des Ameisenbläulings lässt sich von Ameisen ins Nest tragen – und frisst dort rund 600 Ameisenlarven.', 'Sommerflieder heißt auch Schmetterlingsflieder: Kaum ein Strauch lockt im August mehr Falter an.'],
    ['Viele Admirale ziehen jetzt nach Süden, manche über die Alpen. Im Frühling kommen ihre Nachkommen zurück.', 'Fallobst liegen lassen: Admirale naschen gern an gärendem Obst.'],
    ['Der Efeu blüht – für viele Falter eine der letzten Mahlzeiten vor dem Winter.', 'Tagpfauenauge und Kleiner Fuchs suchen sich jetzt ein frostgeschütztes Winterquartier.'],
    ['Der Frostspanner fliegt erst jetzt, wenn es kalt wird. Sein Weibchen hat nur Stummelflügel und klettert die Baumstämme hinauf.', 'Laub liegen lassen: Darin überwintern viele Insekten, auch Raupen und Puppen mancher Falter.'],
    ['An milden Abenden fliegen sogar im Dezember noch Frostspanner-Männchen.', 'Ein Zitronenfalter kann fast ein Jahr alt werden. Die meisten anderen Falter leben nur wenige Wochen.']
  ];
  const ALLG = [
    'Schmetterlinge schmecken mit den Füßen. Landen sie auf einer Blüte, wissen sie sofort, ob sich Naschen lohnt.',
    'Schmetterlinge sehen UV-Licht. Viele Blüten tragen Muster, die nur so sichtbar sind – Wegweiser zum Nektar.',
    'Die Flügel sind mit winzigen Schuppen bedeckt, angeordnet wie Dachziegel. Daher kommt der „Staub“ an den Fingern.',
    'In Deutschland leben rund 3.700 Schmetterlingsarten. Nur etwa 190 davon sind Tagfalter – die meisten fliegen nachts.',
    'Der Rüssel eines Falters ist eingerollt wie eine Uhrfeder. Nur zum Trinken rollt er ihn aus.',
    'In der Puppe wird die Raupe fast vollständig umgebaut. Heraus kommt ein ganz neues Tier mit Flügeln.',
    'Das Männchen des Kleinen Nachtpfauenauges riecht ein Weibchen über Kilometer – mit seinen gefiederten Fühlern.',
    '„Schmetterlinge im Bauch“: Das Kribbeln kommt von Stresshormonen wie Adrenalin. Der Körper ist aufgeregt – vor Freude.',
    'Das Wort Schmetterling kommt von „Schmetten“, einem alten Wort für Rahm. Falter sollen gern daran genascht haben.',
    'Raupen häuten sich mehrmals, weil ihre Haut nicht mitwächst.',
    'Die Augenflecken des Tagpfauenauges sind ein Bluff: Klappt er die Flügel plötzlich auf, erschrecken Vögel.',
    'Brennnesseln sind eine Kinderstube: Tagpfauenauge, Kleiner Fuchs und Admiral legen ihre Eier darauf.',
    'Manche Falter trinken an Pfützen. Dort holen sie sich Salze, die im Nektar fehlen.',
    'Tagfalter sind wechselwarm. Morgens sonnen sie sich mit offenen Flügeln, bis sie warm genug zum Fliegen sind.',
    'Ein Falter wächst nach dem Schlüpfen nicht mehr. Gewachsen wird nur als Raupe.'
  ];
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  /* Liste des Monats: zuerst die Saison-Tatsachen, dann das Allgemeine – jeden zweiten Tag etwas zur Jahreszeit */
  function pool(m) { return SAISON[m].concat(ALLG); }
  function todayIdx() {
    const d = new Date(), m = d.getMonth(), key = L.todayKey();
    const n = SAISON[m].length;
    return d.getDate() % 2 === 0 ? hash(key + '|s') % n : n + hash(key + '|a') % ALLG.length;
  }
  let cur = null; // gerade gezeigte Tatsache (für „Noch eins“)
  function cardHtml() {
    const m = new Date().getMonth(), i = todayIdx(), t = pool(m)[i];
    return '<span class="eyebrow wi-eb">🦋 Falter-Wissen · ' + MONAT[m] + '</span><span class="wi-t">' + esc(t) + '</span>';
  }
  function renderCard() {
    /* direkt unter „Euer Schmetterling“ (ordnung.js verschiebt die Karte nach unten – daher jedes Mal prüfen) */
    const at = $('bflyCard') || $('piekCard'); if (!at) return;
    let c = $('wiCard');
    if (!c) { c = document.createElement('button'); c.type = 'button'; c.id = 'wiCard'; c.className = 'card soft wi-card'; c.setAttribute('aria-label', 'Falter-Wissen öffnen'); c.onclick = () => { C('wi_card'); sheet(); }; }
    if (at.nextElementSibling !== c) at.after(c);
    const sig = L.todayKey(); if (c.dataset.sig === sig) return; c.dataset.sig = sig; c.innerHTML = cardHtml();
  }
  function sheet(startAt) {
    const m = new Date().getMonth(), list = pool(m);
    cur = typeof startAt === 'number' ? startAt : todayIdx();
    L.openSheet('<h3>🦋 Falter-Wissen</h3><p class="wi-big" id="wiBig"></p><p class="wi-sub" id="wiSub"></p>' +
      '<div class="row wrap" style="justify-content:center"><button class="pill-btn primary" data-next>Noch eins</button><button class="pill-btn" data-hilfe>🌱 Echten Faltern helfen</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      const draw = () => { sh.querySelector('#wiBig').textContent = list[cur]; sh.querySelector('#wiSub').textContent = cur < SAISON[m].length ? 'Passt gerade zum ' + MONAT[m] : 'Wusstest du schon?'; };
      draw();
      sh.querySelector('[data-next]').onclick = () => { cur = (cur + 1) % list.length; L.haptic(5); draw(); C('wi_next'); };
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
    });
  }

  /* ---------- 3. Echten Faltern helfen ---------- */
  const HILFE = [
    { id: 'tmd', ic: '👀', t: 'Mitzählen: Tagfalter-Monitoring', d: 'Ehrenamtlich Falter zählen – für die Forschung (Helmholtz-Zentrum UFZ und Gesellschaft für Schmetterlingsschutz).', u: 'https://www.ufz.de/tagfalter-monitoring/index.php?de=41745' },
    { id: 'nabu', ic: '📋', t: 'Mitzählen: NABU-Insektensommer', d: 'Zweimal im Sommer eine Stunde Insekten beobachten und melden – auch Schmetterlinge.', u: 'https://nabu-naturgucker.de/meldeportal/naturbeobachtungen-melden/nabu-insektensommer/' },
    { id: 'gfs', ic: '💚', t: 'Spenden: Gesellschaft für Schmetterlingsschutz', d: 'Gemeinnütziger Verein für den Schutz der Schmetterlinge in Europa.', u: 'https://www.ufz.de/european-butterflies/index.php?de=42568' },
    { id: 'bund', ic: '💚', t: 'Spenden: BUND NRW Naturschutzstiftung', d: 'Wählt jedes Jahr den Schmetterling des Jahres – 2026 den Dunklen Wiesenknopf-Ameisenbläuling.', u: 'https://www.bund-nrw-naturschutzstiftung.de/spenden-und-stiften/' }
  ];
  /* Aus einem Vollbild (Spiele-Fenster) heraus geöffnet: Fenster darüberlegen, solange es offen ist */
  function onTop() {
    const m = $('modal'); if (!m || !document.querySelector('#g2Screen, .jagd')) return;
    document.documentElement.classList.add('wi-top');
    const ob = new MutationObserver(() => { if (!m.classList.contains('open')) { document.documentElement.classList.remove('wi-top'); ob.disconnect(); } });
    ob.observe(m, { attributes: true, attributeFilter: ['class'] });
  }
  function hilfe() {
    C('wi_hilfe'); onTop();
    L.openSheet('<h3>🌱 Echten Faltern helfen</h3><p class="about" style="font-size:16px;margin-bottom:10px">Eure Falter in der App sind gezeichnet. Die echten draußen brauchen Blüten, wilde Ecken – und Menschen, die hinschauen.</p>' +
      '<div class="wi-list">' + HILFE.map((h) => '<button type="button" class="wi-org" data-u="' + h.id + '"><span class="wi-ic" aria-hidden="true">' + h.ic + '</span><span><b>' + esc(h.t) + '</b><small>' + esc(h.d) + '</small></span><span class="d-go" aria-hidden="true">↗</span></button>').join('') +
      '<div class="wi-org wi-free"><span class="wi-ic" aria-hidden="true">🌿</span><span><b>Ohne Geld: eine wilde Ecke</b><small>Brennnesseln und Wildblumen stehen lassen – Kinderstube für Tagpfauenauge, Kleiner Fuchs und Admiral.</small></span></div></div>' +
      '<p class="wi-note">Wir verdienen daran nichts. Die Links führen direkt zu den Vereinen.</p>' +
      '<div class="row" style="margin-top:8px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('[data-u]').forEach((b) => b.onclick = () => { const h = HILFE.find((x) => x.id === b.dataset.u); if (!h) return; C('wi_link:' + h.id); window.open(h.u, '_blank', 'noopener'); });
    });
  }
  /* Dezenter Hinweis bei einem Erfolg (neuer Falter, Heide-Runde, Fang, Quiz) – höchstens alle 4 Tage einmal */
  function hint() {
    const s = S(), now = Date.now(); if (now - (s.wiHint || 0) < 4 * 864e5) return '';
    s.wiHint = now; L.save(); C('wi_hint');
    return '<p class="wi-hintp"><button type="button" class="wi-link" data-hilfe>🌱 Echten Faltern helfen</button></p>';
  }

  /* ---------- 4. Quiz „Wahr oder Falter?“: w = wahr (1) oder erfunden (0), x = Auflösung ---------- */
  const QUIZ = [
    { w: 1, s: 'Schmetterlinge schmecken mit den Füßen.', x: 'An den Füßen sitzen Geschmackssinneszellen. So prüft ein Falter beim Landen, ob sich die Blüte lohnt.' },
    { w: 0, s: 'Die meisten Schmetterlinge leben nur einen einzigen Tag.', x: 'Viele Falter leben einige Wochen, der Zitronenfalter sogar fast ein Jahr.' },
    { w: 1, s: 'Schmetterlinge können UV-Licht sehen.', x: 'Viele Blüten tragen UV-Muster, die wir nicht sehen – für Falter sind sie Wegweiser zum Nektar.' },
    { w: 0, s: 'Der „Staub“ auf Schmetterlingsflügeln ist Blütenpollen.', x: 'Es sind winzige Schuppen, angeordnet wie Dachziegel.' },
    { w: 1, s: 'Der Zitronenfalter überwintert im Freien und übersteht starken Frost.', x: 'Ein körpereigener Frostschutz bewahrt ihn. Deshalb fliegt er oft als Erster im Jahr.' },
    { w: 1, s: 'Distelfalter wandern von Afrika bis nach Europa.', x: 'Hin und zurück rund 12.000 Kilometer – verteilt auf mehrere Generationen.' },
    { w: 0, s: 'Raupen und Falter fressen dasselbe.', x: 'Raupen kauen Blätter, Falter trinken mit ihrem Rüssel Nektar.' },
    { w: 1, s: 'In Deutschland gibt es viel mehr Nachtfalter als Tagfalter.', x: 'Von rund 3.700 Arten sind nur etwa 190 Tagfalter.' },
    { w: 0, s: 'Schmetterlinge haben zwei Flügel.', x: 'Es sind vier: zwei Vorder- und zwei Hinterflügel.' },
    { w: 1, s: 'Das Weibchen des Frostspanners kann nicht fliegen.', x: 'Es hat nur Stummelflügel und klettert die Bäume hinauf. Die Männchen fliegen im Spätherbst.' },
    { w: 1, s: 'Manche Raupen lassen sich von Ameisen ins Nest tragen.', x: 'Die Raupe des Ameisenbläulings riecht wie Ameisenbrut – und lebt im Nest von den Ameisenlarven.' },
    { w: 0, s: 'Nachtfalter sind immer grau und unscheinbar.', x: 'Viele sind bunt, etwa der Russische Bär mit seinen roten Hinterflügeln. Manche fliegen sogar am Tag.' },
    { w: 1, s: 'Das Taubenschwänzchen ist ein Nachtfalter, der tagsüber wie ein Kolibri vor Blüten schwirrt.', x: 'Es gehört zu den Schwärmern und steht beim Trinken in der Luft.' },
    { w: 1, s: 'Die Augenflecken des Tagpfauenauges schrecken Vögel ab.', x: 'Klappt er die Flügel plötzlich auf, sieht es aus wie ein großes Augenpaar.' },
    { w: 0, s: 'Kohlweißlinge heißen so, weil sie weiß wie Kohl sind.', x: 'Ihre Raupen fressen gern Kohl – daher der Name.' },
    { w: 1, s: 'Das Wort „Schmetterling“ hat mit Sahne zu tun.', x: 'Es kommt von „Schmetten“, einem alten Wort für Rahm.' },
    { w: 0, s: 'Alle Schmetterlinge überwintern als Raupe.', x: 'Je nach Art überwintern sie als Ei, Raupe, Puppe oder als fertiger Falter.' },
    { w: 1, s: 'Tagpfauenauge, Kleiner Fuchs und Admiral brauchen Brennnesseln.', x: 'Ihre Raupen fressen Brennnesselblätter. Eine wilde Ecke im Garten hilft ihnen.' },
    { w: 0, s: '„Schmetterlinge im Bauch“ sind ein Zeichen von Hunger.', x: 'Das Kribbeln kommt von Aufregung: Der Körper schüttet Stresshormone wie Adrenalin aus.' },
    { w: 1, s: 'Beim Zitronenfalter sind nur die Männchen zitronengelb.', x: 'Die Weibchen sind blass grünlich-weiß.' },
    { w: 1, s: 'Manche Falter trinken an Pfützen.', x: 'Dort holen sie sich Salze, die im Nektar fehlen.' },
    { w: 0, s: 'Ein Admiral würde nie über die Alpen fliegen.', x: 'Admirale sind Wanderfalter – viele überqueren jedes Jahr die Alpen.' },
    { w: 1, s: 'Raupen häuten sich mehrmals, während sie wachsen.', x: 'Ihre Haut wächst nicht mit, also schlüpfen sie immer wieder aus der alten heraus.' },
    { w: 1, s: 'Der Schwalbenschwanz ist in Deutschland besonders geschützt.', x: 'Fangen und Sammeln sind verboten. Seine Raupen leben auf Möhre, Fenchel und Dill.' },
    { w: 0, s: 'Tagfalter fliegen am liebsten bei Kälte und Regen.', x: 'Sie sind wechselwarm und brauchen Sonnenwärme, bevor sie losfliegen.' },
    { w: 1, s: 'Efeu ist im Herbst eine wichtige Futterquelle für Falter.', x: 'Er blüht spät im Jahr, wenn kaum noch etwas anderes blüht.' },
    { w: 0, s: 'Ein Schmetterling, den man berührt, kann danach nie wieder fliegen.', x: 'Meist fliegt er weiter. Trotzdem lieber nicht anfassen – die Flügel sind empfindlich.' },
    { w: 1, s: 'Das Männchen des Kleinen Nachtpfauenauges riecht Weibchen über Kilometer.', x: 'Seine gefiederten Fühler fangen schon winzige Mengen ihres Duftes auf.' },
    { w: 1, s: 'Die meisten Schmetterlingsarten sind nachts unterwegs.', x: 'Tagfalter sind nur ein kleiner Teil – die große Mehrheit sind Nachtfalter.' },
    { w: 0, s: 'Ein Falter wächst nach dem Schlüpfen noch weiter.', x: 'Aus der Puppe kommt er in voller Größe. Gewachsen wird nur als Raupe.' },
    { w: 1, s: 'Der Rüssel eines Falters ist meist eingerollt wie eine Uhrfeder.', x: 'Zum Trinken rollt er ihn aus, danach wieder ein.' },
    { w: 0, s: 'Der Schmetterling des Jahres 2026 ist das Tagpfauenauge.', x: 'Es ist der Dunkle Wiesenknopf-Ameisenbläuling – ein kleiner, zimtbrauner Spezialist feuchter Wiesen.' }
  ];

  /* ---------- Steckbrief an Ort und Stelle aufklappen (Knöpfe mit data-wiart) ---------- */
  document.addEventListener('click', (e) => {
    const h = e.target.closest && e.target.closest('[data-hilfe]'); if (h) { e.preventDefault(); hilfe(); return; }
    const a = e.target.closest && e.target.closest('[data-wiart]'); if (!a) return;
    const i = Number(a.dataset.wiart); if (!ART[i]) return;
    const row = a.parentElement; let pop = row.nextElementSibling;
    if (!pop || !pop.classList.contains('wi-pop')) { pop = document.createElement('div'); pop.className = 'wi-pop'; row.after(pop); }
    if (pop.dataset.i === String(i) && !pop.hidden) { pop.hidden = true; a.setAttribute('aria-expanded', 'false'); return; }
    pop.dataset.i = String(i); pop.hidden = false; pop.innerHTML = '<b class="wi-pn">' + esc(ART[i].n) + '</b>' + steck(i);
    row.querySelectorAll('[data-wiart]').forEach((x) => x.setAttribute('aria-expanded', x === a ? 'true' : 'false'));
    C('wi_art'); L.haptic(5);
  });

  (function css() {
    const st = document.createElement('style');
    st.textContent = 'html.wi-top #modal{z-index:9700}.wi-card{display:block;width:100%;text-align:left;font:inherit;color:var(--text);cursor:pointer;padding:12px 16px}' +
      '.wi-eb{display:block;margin:0 0 4px;font-size:13px;letter-spacing:2px}.wi-t{display:block;font-size:16px;line-height:1.4;color:var(--text-soft)}' +
      '.wi-big{font-family:var(--serif);font-size:21px;line-height:1.4;text-align:center;margin:6px 0 6px}.wi-sub{text-align:center;color:var(--text-muted);font-size:14px;margin:0 0 14px}' +
      '.wi-steck{display:flex;flex-direction:column;gap:6px;text-align:left;margin:4px auto 12px;max-width:420px;font-size:15px;line-height:1.35}' +
      '.wi-steck>div{display:flex;gap:8px;align-items:flex-start}.wi-steck b{color:var(--accent-2)}.wi-love{color:var(--text-soft);font-style:italic}' +
      '.wi-more{display:flex;justify-content:center;flex-wrap:wrap;gap:0 10px;margin:0 0 10px}.wi-link{background:none;border:0;color:var(--accent-2);font:inherit;font-size:15px;text-decoration:underline;text-underline-offset:3px;padding:6px 4px;cursor:pointer}' +
      '.wi-pop{border:1px solid var(--line);background:var(--glass);border-radius:14px;padding:10px 12px;margin:0 0 12px;text-align:left}.wi-pop .wi-steck{margin:6px 0 0}.wi-pn{font-family:var(--serif);font-size:17px}' +
      '.wi-hintp{text-align:center;margin:4px 0 8px}' +
      '.wi-list{display:flex;flex-direction:column;gap:8px}.wi-org{display:flex;align-items:center;gap:10px;text-align:left;width:100%;font:inherit;color:var(--text);background:var(--glass);border:1px solid var(--line);border-radius:14px;padding:10px 12px;cursor:pointer}' +
      '.wi-org b{font-size:16px;line-height:1.25}.wi-org small{display:block;color:var(--text-muted);font-size:14px;line-height:1.3;margin-top:2px}.wi-org>span:nth-child(2){flex:1}.wi-ic{font-size:22px}.wi-free{cursor:default;border-style:dashed}' +
      '.wi-note{font-size:13px;color:var(--text-muted);text-align:center;margin:10px 0 0}' +
      '.hd-arten button{background:var(--glass,#eee);border:1px solid var(--line,#ddd);border-radius:12px;padding:4px 10px;font:inherit;font-size:15px;color:inherit;cursor:pointer}' +
      '.hd-arten button[aria-expanded="true"]{border-color:var(--accent-2)}' +
      /* Quiz „Wahr oder Falter?“ im Spiele-Fenster */
      '.qz-n{text-align:center;color:var(--text-muted);font-size:15px;margin:8px 0 4px}' +
      '.qz-card{max-width:420px;margin:8px auto 14px;padding:16px 16px 14px;text-align:center;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16)}' +
      '.qz-card.ok{border-color:rgba(142,224,95,.55)}.qz-card.no{border-color:rgba(255,143,171,.55)}' +
      '.qz-big{font-size:38px;line-height:1}.qz-st{font-family:var(--serif);font-size:22px;line-height:1.35;margin:8px 0}' +
      '.qz-res{font-weight:700;font-size:21px}.qz-card.ok .qz-res{color:#8ee05f}.qz-card.no .qz-res{color:#ff8fab}' +
      '.qz-who{font-size:14px;color:var(--text-muted);margin:2px 0 4px}.qz-ans{font-size:16px;line-height:1.45;color:var(--text-soft);margin:6px 0 0}' +
      '.qz-btns{display:flex;gap:10px;justify-content:center}.qz-btns .pill-btn{min-width:130px}';
    document.head.appendChild(st);
  })();

  window.LZWI = { ART, HEIDE, QUIZ, steck, moreRow, moreRows, hint, hilfe, sheet, renderCard, todayFact: () => pool(new Date().getMonth())[todayIdx()] };
  renderCard();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') renderCard(); });
  setInterval(renderCard, 60000);
})();
