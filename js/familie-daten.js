/* Schmetterlingsfutter – Raupenzeit: Texte für Paare, bei denen Kinder ein Thema sind (3.54.0)
   Leitsatz für jeden Text hier: Es geht um euch zwei, nie um Erziehung.
   - Aufgaben (pieks): 2 bis 5 Minuten, ohne Babysitter, ohne Geld. Kategorie c wie in D.piekCats.
   - Decks: Gleichklang-Spiele je Phase (laufen nur an einem Handy, siehe familie.js) und eins für alle Paare.
   - Gutscheine: Entlastung als Geschenk, für die Phasen mit Kind im Haus.
   Nicht hierher gehören: Erziehungstipps, Medizinisches, Fruchtbarkeit, Geburt, Stillen, Babyprodukte bei Kinderwunsch.
   {r} wird wie überall durch den Namen des Schatzes ersetzt. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA; if (!D) return;
  const P = (c, t) => ({ c, t });
  const A = 'aufmerksamkeit', U = 'unaufgefordert', K = 'dankbar', F = 'frage', N = 'neu';
  const SUB = 'Jeder antwortet für sich. Sichtbar wird nur, was ihr beide wollt.';
  /* Deck-Kennungen: nur Kleinbuchstaben (der Rundenschlüssel verlangt das), ohne „bock“, „date“ oder „reden“ im Namen
     (danach sucht „Frag Papillon“ andere Spiele). */
  const deck = (id, icon, title, sub, rows, more) => Object.assign({
    id, icon, title, sub, fam: true, opts: 3, prompt: 'Hättest du das gern?',
    hitText: 'Das wollt ihr beide. Alles andere bleibt geheim.',
    noneText: 'Noch kein gemeinsames Ja. Probiert es in ein paar Tagen noch einmal.',
    items: rows.map((r) => ({ id: r[0], e: r[1], t: r[2], tip: '' }))
  }, more || {});

  D.fam = {
    /* Namen der Phasen, wie sie in den Einstellungen stehen */
    phases: { wunsch: 'Kinderwunsch', unterwegs: 'Baby unterwegs', baby: 'Baby', klein: 'Kleinkind', schule: 'Schulkind', teen: 'Teenager', fluegge: 'Flügge' },

    pieks: {
      wunsch: [
        P(F, 'Erzähl {r}, was du an euch zu zweit nie verlieren willst.'),
        P(A, 'Heute hat das große Thema Pause. Frag {r} nach etwas ganz anderem, das {r} gerade beschäftigt.'),
        P(K, 'Sag {r} mit eigenen Worten: „Egal wie es kommt – ich bin froh, dass ich das mit dir erlebe.“'),
        P(N, 'Plant in fünf Minuten etwas nur für euch zwei, das noch diese Woche stattfindet. Klein reicht.'),
        P(F, 'Frag {r}: „Wovon träumst du gerade – außer von dem einen großen Thema?“'),
        P(A, 'Umarm {r} heute einmal lang. Ohne etwas zu sagen, ohne etwas zu wollen.'),
        P(U, 'Nimm {r} heute eine Kleinigkeit ab, bevor {r} danach fragen muss.'),
        P(F, 'Frag {r}: „Was brauchst du gerade von mir – mehr Reden oder mehr Ablenkung?“'),
        P(K, 'Schreib {r} drei Dinge, die euch zwei schon heute zu einer Familie machen.'),
        P(N, 'Sucht euch zusammen ein Lied aus, das ab heute euer Durchhalte-Lied ist.'),
        P(A, 'Schick {r} ein Foto von einem Ort, an dem ihr zu zweit glücklich wart. Ein Satz dazu reicht.'),
        P(F, 'Erzählt euch je eine Sache, die ihr aneinander bewundert. Ganz ohne Zukunft, nur heute.'),
        P(U, 'Mach {r} den Lieblingstee oder Lieblingskaffee und setz dich fünf Minuten dazu.'),
        P(N, 'Zehn Minuten Quatsch zu zweit: in der Küche tanzen, Grimassen schneiden, schlechte Witze erzählen.'),
        P(K, 'Sag {r}, wofür du heute dankbar bist – eine Sache, die schon da ist.'),
        P(F, 'Frag {r}: „Wann warst du zuletzt richtig unbeschwert mit mir?“ Und dann: Wie holen wir das zurück?')
      ],
      unterwegs: [
        P(N, 'Schreibt je drei Dinge auf, die ihr nach der Geburt weiter zu zweit machen wollt.'),
        P(F, 'Frag {r}: „Worauf freust du dich – und wovor hast du Respekt?“ Nur zuhören, nichts lösen.'),
        P(A, 'Fünf Minuten Schultern oder Füße massieren. Wer es heute nötiger hat, klärt ihr mit Schere, Stein, Papier.'),
        P(K, 'Sag {r}, was du in den letzten Wochen an {r} neu entdeckt hast.'),
        P(F, 'Erzählt euch: Was haben eure Eltern als Paar gut gemacht – und was wollt ihr zwei anders machen?'),
        P(N, 'Legt heute einen festen Abend zu zweit fest, der auch später bleibt. Ein Wochentag reicht.'),
        P(U, 'Erledige heute eine Sache von eurer Liste, ohne dass {r} davon weiß. Dann beiläufig erwähnen.'),
        P(A, 'Macht heute ein Foto nur von euch beiden. So wie ihr gerade seid.'),
        P(F, 'Frag {r}: „Was soll zwischen uns auf jeden Fall so bleiben, wie es ist?“'),
        P(K, 'Schreib {r} einen Zettel: „Ich bin froh, dass ich das mit dir mache, weil …“'),
        P(N, 'Zehn Minuten Sofa: Jeder nennt einen Wunsch für eure Zweisamkeit im nächsten Jahr. Nicht bewerten, nur sammeln.'),
        P(A, 'Frag heute nicht nach dem Baby, sondern nach {r}: „Und wie geht es dir?“'),
        P(U, 'Übernimm heute etwas, das sonst immer {r} macht. Kommentarlos.'),
        P(F, 'Erzählt euch je eine Erinnerung an euer erstes Jahr als Paar. Die schönste oder die peinlichste.'),
        P(N, 'Denkt euch ein Zeichen aus, das heißt: „Ich brauche kurz dich.“ Ein Wort, ein Handgriff, ein Emoji.'),
        P(K, 'Sag {r} heute Danke für etwas ganz Alltägliches. Die großen Dinge kommen von allein dran.')
      ],
      baby: [
        P(K, 'Sag heute einmal Danke für etwas, das {r} nachts gemacht hat.'),
        P(A, 'Heute reicht ein Kuss. Ein richtiger, drei Sekunden.'),
        P(U, 'Bring {r} ein Glas Wasser oder einen Kaffee, ohne dass {r} fragt. Hinstellen, anlächeln, fertig.'),
        P(F, 'Frag {r}: „Was würde dir heute zehn Minuten Ruhe verschaffen?“ Und dann genau das möglich machen.'),
        P(A, 'Zwanzig Sekunden Umarmung, sobald ihr beide die Hände frei habt.'),
        P(K, 'Schick {r} eine Nachricht: „Du machst das gut.“ Mehr braucht es heute nicht.'),
        P(N, 'Wenn das Baby schläft: fünf Minuten nebeneinander sitzen. Nicht aufräumen, kein Handy. Nur sitzen.'),
        P(U, 'Übernimm heute eine Aufgabe, die sonst an {r} hängen bleibt. Ohne Ansage.'),
        P(F, 'Frag {r}: „Was war heute dein schönster Moment?“ Auch wenn die Antwort „die Dusche“ ist.'),
        P(A, 'Sag {r} einen Satz, der nichts mit dem Baby zu tun hat und mit „Ich mag an dir …“ anfängt.'),
        P(K, 'Sag {r}, wobei du {r} in den letzten Tagen bewundert hast.'),
        P(N, 'Esst heute eine Mahlzeit gleichzeitig. Kalt zählt auch.'),
        P(A, 'Nimm im Vorbeigehen kurz die Hand von {r}. Zwei Sekunden reichen.'),
        P(U, 'Schick {r} für zwanzig Minuten ins Bad, aufs Sofa oder an die Luft. Du hältst die Stellung.'),
        P(F, 'Frag {r} heute Abend nur eins: „Was brauchst du morgen von mir?“'),
        P(K, 'Flüster {r} heute Abend ins Ohr: „Wir sind ein gutes Team.“')
      ],
      klein: [
        P(N, 'Zehn Minuten Sofa, Handys im Flur. Wer zuerst über Kita redet, holt die Schokolade.'),
        P(F, 'Frag {r} etwas, das du nicht weißt: „Was hat dich diese Woche zum Lachen gebracht?“'),
        P(A, 'Begrüß {r} heute mit einem richtigen Kuss. Nicht im Vorbeigehen.'),
        P(K, 'Sag {r} Danke für eine Sache, die diese Woche einfach lief, weil {r} dran gedacht hat.'),
        P(U, 'Übernimm heute Abend das, worauf {r} am wenigsten Lust hat. Ohne zu fragen, was das ist: Du weißt es.'),
        P(N, 'Wenn Ruhe ist: ein Lied, ein Tanz in der Küche. Drei Minuten, dann darf jeder aufs Sofa fallen.'),
        P(F, 'Frag {r}: „Wann warst du zuletzt nicht Mama oder Papa, sondern einfach du?“'),
        P(A, 'Schreib {r} tagsüber eine Nachricht, in der kein Termin, kein Einkauf und kein Kind vorkommt.'),
        P(K, 'Lob {r} heute so, dass es alle am Tisch hören.'),
        P(N, 'Verabredet für diese Woche einen Abend ab 20 Uhr nur für euch. Zu Hause zählt. Jogginghose auch.'),
        P(U, 'Mach morgen das Frühstück allein und schick {r} zehn Minuten länger ins Bett.'),
        P(F, 'Erzählt euch beim Aufräumen je eine Sache, auf die ihr euch gerade freut. Nur für euch selbst.'),
        P(A, 'Zwanzig Sekunden Umarmung in der Küche. Zuschauer unter einem Meter sind erlaubt.'),
        P(K, 'Sag {r}: „Ich sehe, wie viel du gerade trägst.“ Und nenn ein Beispiel.'),
        P(N, 'Fünf Minuten lang nur Komplimente tauschen. Wer zuerst „aber“ sagt, verliert.'),
        P(F, 'Frag {r}: „Was fehlt dir gerade von uns beiden am meisten?“ Eine Sache davon holt ihr diese Woche zurück.')
      ],
      schule: [
        P(F, 'Stell {r} eine Frage, die nichts mit Schule, Haushalt oder Terminen zu tun hat.'),
        P(N, 'Tragt heute einen Abend nur für euch in den Kalender ein. Mit Herz davor, damit ihn keiner überschreibt.'),
        P(A, 'Schick {r} zwischen zwei Terminen eine Nachricht: nur ein Satz, warum du {r} magst.'),
        P(K, 'Sag {r} Danke für eine unsichtbare Aufgabe: Zettel unterschrieben, Geschenk besorgt, an alles gedacht.'),
        P(U, 'Übernimm heute eine Fahrt oder einen Termin, der eigentlich bei {r} liegt.'),
        P(F, 'Frag {r} heute Abend: „Was war dein Moment des Tages?“'),
        P(N, 'Fünf Minuten auf den Balkon oder vor die Haustür, nur ihr zwei. Tür zu, Tee mit.'),
        P(A, 'Hör {r} heute fünf Minuten zu, ohne nebenbei etwas zu tun. Kein Abwasch, kein Handy.'),
        P(K, 'Sag {r}, was {r} diese Woche für euch als Paar gut gemacht hat. Nicht für die Familie – für euch.'),
        P(N, 'Denkt euch ein Codewort aus, das bedeutet: „Heute Abend Sofa, nur wir.“ Ab sofort gültig.'),
        P(F, 'Frag {r}: „Wenn wir ein Wochenende nur zu zweit hätten – was würdest du machen?“ Aufschreiben.'),
        P(U, 'Erledige heute eine Sache von der Familien-Liste, bevor {r} sie erwähnt.'),
        P(A, 'Küss {r} heute länger, als es praktisch ist.'),
        P(K, 'Steck {r} einen Zettel in die Jackentasche: „Schön, dass du mein Team bist.“'),
        P(N, 'Heute Abend, wenn Ruhe ist: Jeder erzählt etwas, das der andere noch nicht weiß. Ja, das gibt es noch.'),
        P(F, 'Frag {r}: „Worüber haben wir früher stundenlang geredet?“ Fünf Minuten davon heute.')
      ],
      teen: [
        P(N, 'Geht heute zusammen eine Runde um den Block. Ohne Ziel.'),
        P(F, 'Frag {r}: „Was machen wir, wenn wir abends wieder das Wohnzimmer für uns haben?“ Spinnt ein bisschen.'),
        P(A, 'Nimm {r} heute in den Arm, auch wenn jemand „Boah, peinlich“ sagt. Gerade dann.'),
        P(K, 'Sag {r} Danke fürs Ruhigbleiben in einem Moment, in dem du es nicht warst.'),
        P(U, 'Übernimm heute den späten Abholdienst. {r} darf schon im Schlafanzug sein.'),
        P(F, 'Frag {r}: „Wobei waren wir uns diese Woche einig?“ Auch Kleinigkeiten zählen.'),
        P(N, 'Frühstückt am Wochenende zu zweit, bevor der Rest aufsteht. Vor zwölf habt ihr gute Chancen.'),
        P(A, 'Schreib {r} eine Nachricht wie früher: verliebt, ein bisschen albern, ohne Termine.'),
        P(K, 'Sag {r}, was du an {r} heute anziehend findest. Nicht praktisch, nicht fleißig – anziehend.'),
        P(N, 'Fahrt zu zweit einkaufen oder tanken und hängt fünf Minuten dran. Zählt als Verabredung.'),
        P(F, 'Erzählt euch, wie ihr selbst mit sechzehn wart. Mit Beweisfoto, wenn vorhanden.'),
        P(U, 'Mach {r} heute Abend ungefragt das Lieblingsgetränk und setz dich dazu.'),
        P(A, 'Tür zu, zehn Minuten nur ihr zwei. Wer klopft, muss warten.'),
        P(K, 'Sag {r}: „Mit dir stehe ich das gern durch.“ Gemeint ist ruhig die ganze Pubertät.'),
        P(N, 'Plant in fünf Minuten einen Ausflug nur für euch zwei. Tag eintragen, der Rest kommt später.'),
        P(F, 'Frag {r}: „Was wolltest du mit mir schon lange mal wieder machen?“')
      ],
      fluegge: [
        P(F, 'Nenn {r} eine Sache, die ihr früher gemacht habt und wieder anfangen könntet.'),
        P(N, 'Deckt heute den Tisch nur für zwei – mit Kerze. Es ist euer Haus.'),
        P(A, 'Frag {r} heute etwas, das du nach all den Jahren nicht sicher weißt.'),
        P(K, 'Sag {r} Danke für die Jahre im Familienbetrieb. Mit einem Beispiel, das dir im Kopf geblieben ist.'),
        P(N, 'Schreibt jeder drei Dinge auf, die ihr noch zusammen erleben wollt. Tauschen, staunen.'),
        P(F, 'Frag {r}: „Was machst du gern, seit es ruhiger ist?“ Und was davon macht ihr zusammen?'),
        P(U, 'Überrasch {r} heute mit etwas, das früher nie ging, weil immer jemand dazwischenkam.'),
        P(A, 'Küsst euch heute im Flur. Es platzt keiner mehr rein.'),
        P(K, 'Sag {r}, was du an {r} heute mehr magst als vor zwanzig Jahren.'),
        P(N, 'Sucht euch zusammen etwas aus, das ihr beide noch nie gemacht habt. Heute nur aussuchen.'),
        P(F, 'Erzählt euch, wie ihr euch den anderen in zehn Jahren vorstellt. Nett bleiben.'),
        P(A, 'Geht heute Abend eine Runde spazieren, Hand in Hand, und sprecht nur über euch zwei.'),
        P(U, 'Leg eure Musik von damals auf, bevor {r} nach Hause kommt.'),
        P(K, 'Schreib {r} einen Zettel: „Schön, dass wir zwei übrig geblieben sind.“'),
        P(N, 'Räumt in Gedanken ein Zimmer um: Was wird daraus – nur für euch zwei?'),
        P(F, 'Frag {r}: „Wer wollen wir zu zweit jetzt sein?“ Die erste Antwort zählt, die zweite auch.')
      ]
    },

    /* Für alle Paare, unabhängig von der Phase: der sichere Weg, das Thema überhaupt anzusprechen */
    deckAll: deck('kinderfrage', '🌱', 'Kinder: ja, nein, wann?', 'Jeder antwortet für sich. Sichtbar wird nur, worin ihr euch einig seid.', [
      ['irgendwann', '🌱', 'Ich möchte irgendwann Kinder'],
      ['bald', '⏳', 'Am liebsten in den nächsten ein, zwei Jahren'],
      ['spaeter', '🕰️', 'Ich möchte damit noch ein paar Jahre warten'],
      ['ohne', '🌍', 'Ich kann mir ein Leben ohne Kinder gut vorstellen'],
      ['unsicher', '🤷', 'Ich bin mir noch nicht sicher'],
      ['mehrere', '👣', 'Ich wünsche mir mehr als ein Kind'],
      ['vorher', '✈️', 'Vorher will ich mit dir noch einiges erleben'],
      ['annehmen', '🤝', 'Adoption oder Pflegekind kann ich mir vorstellen'],
      ['sprechen', '💬', 'Ich möchte in Ruhe mit dir darüber sprechen'],
      ['druck', '🌧️', 'Das Thema macht mir gerade Druck'],
      ['wirzwei', '❤️', 'Egal wie es kommt: Wir zwei bleiben das Wichtigste'],
      ['ruhen', '🌙', 'Ich möchte das Thema eine Weile ruhen lassen']
    ], { quiet: true, prompt: 'Stimmt das für dich?', labels: { nein: '👎 Nein', vielleicht: '🤷 Teils', ja: '👍 Ja' }, yesLabel: 'Seht ihr beide so', openLabel: 'Seht ihr beide teilweise so', openTitle: 'Hier seid ihr euch halb einig',
      hitText: 'Darin seid ihr euch einig. Alles andere bleibt geheim.', noneText: 'Kein gemeinsames Ja. Das sagt wenig: Vielleicht ist es einfach noch nicht dran.' }),

    /* Je Phase ein Deck. Läuft nur an einem Handy (local), damit die Phase das Gerät nicht verlässt.
       quiet = Papillon schlägt das Deck nicht von sich aus vor (Kinderwunsch, Baby unterwegs: die Sprechblase könnte jemand mitlesen). */
    decks: {
      wunsch: deck('famwunsch', '🎈', 'Bevor wir zu dritt sind', 'Was wollt ihr zu zweit noch erleben? ' + SUB, [
        ['reise', '✈️', 'Eine Reise nur zu zweit'],
        ['wecker', '🛌', 'Ein Wochenende ohne Wecker und ohne Plan'],
        ['essen', '🍝', 'Spontan essen gehen, wann immer uns danach ist'],
        ['konzert', '🎶', 'Ein Konzert oder Festival'],
        ['tour', '🥾', 'Eine lange Wanderung oder Radtour'],
        ['tanzen', '💃', 'Eine Nacht durchtanzen'],
        ['lernen', '🎓', 'Zusammen etwas Neues lernen'],
        ['zuhause', '🛋️', 'Unser Zuhause so einrichten, wie wir zwei es mögen'],
        ['mut', '🪂', 'Ein Abenteuer, das wir uns bisher nicht getraut haben'],
        ['abend', '🕯️', 'Jede Woche ein fester Abend nur für uns'],
        ['album', '📷', 'Ein Fotoalbum von uns zweien anfangen'],
        ['sonntag', '☕', 'Einen Sonntag komplett im Bett verbringen']
      ], { local: true, quiet: true }),
      unterwegs: deck('famunterwegs', '💞', 'So bleiben wir ein Paar', 'Was soll bei euch bleiben, auch wenn sich alles ändert? ' + SUB, [
        ['abend', '🕯️', 'Ein fester Abend in der Woche gehört uns'],
        ['kosename', '🐻', 'Wir nennen uns weiter beim Kosenamen'],
        ['kuss', '💋', 'Jeden Tag ein richtiger Kuss'],
        ['hobby', '🎸', 'Jeder behält ein eigenes Hobby'],
        ['ehrlich', '🗣️', 'Wir sagen ehrlich, wenn es uns zu viel wird'],
        ['ausgehen', '🍷', 'Einmal im Monat gehen wir zu zweit aus'],
        ['besuch', '🚪', 'Besuch nur, wenn wir beide Lust haben'],
        ['fair', '⚖️', 'Wir teilen die Arbeit fair auf'],
        ['anderes', '💬', 'Zehn Minuten am Tag sprechen wir über etwas anderes'],
        ['danke', '🙏', 'Wir bedanken uns weiter für Kleinigkeiten'],
        ['wegfahren', '🧳', 'Wir fahren weiter zu zweit weg, auch wenn es nur eine Nacht ist'],
        ['naehe', '🫂', 'Zärtlichkeit bleibt wichtig, auch wenn wir müde sind']
      ], { local: true, quiet: true }),
      baby: deck('fambaby', '🏝️', 'Kleine Inseln im Babyalltag', 'Was würde euch gerade guttun? ' + SUB, [
        ['ausschlafen', '🛌', 'Abwechselnd ausschlafen am Wochenende'],
        ['sofa', '🛋️', 'Zehn Minuten Sofa, wenn das Baby schläft'],
        ['spazieren', '🚶', 'Ein Spaziergang, Hand in Hand am Kinderwagen'],
        ['allein', '⏳', 'Jede Woche eine Stunde allein für jeden'],
        ['bestellen', '🍕', 'Essen bestellen statt kochen'],
        ['einschlafen', '😴', 'Zusammen einschlafen, auch wenn es um acht ist'],
        ['serie', '📺', 'Eine Serie, die wir nur gemeinsam weiterschauen'],
        ['hilfe', '🤝', 'Jemanden um Hilfe bitten, damit wir zwei Stunden haben'],
        ['kuss', '💋', 'Jeden Tag ein Kuss, der länger dauert als ein Wimpernschlag'],
        ['fragen', '💬', 'Einmal am Tag fragen: Wie geht es dir?'],
        ['kuscheln', '🫂', 'Kuscheln ohne Erwartung'],
        ['fruehstueck', '🥐', 'Ein Frühstück zu zweit, wenn das Baby noch schläft']
      ], { local: true }),
      klein: deck('famklein', '🌙', 'Wenn die Kleinen schlafen', 'Was macht ihr mit dem Abend? ' + SUB, [
        ['sofa', '🛋️', 'Sofa-Abend ohne Handy'],
        ['kochen', '🍳', 'Zusammen kochen, wenn Ruhe ist'],
        ['spiel', '🎲', 'Ein Brettspiel oder Kartenspiel zu zweit'],
        ['bett', '🛌', 'Früh ins Bett – zu zweit'],
        ['balkon', '🍷', 'Ein Glas Wein oder Tee auf dem Balkon'],
        ['film', '🎬', 'Ein Film, den wir beide wach zu Ende sehen'],
        ['ausgehen', '🕯️', 'Einmal im Monat ausgehen, jemand passt auf'],
        ['chaos', '🧸', 'Ein Abend, an dem nicht aufgeräumt wird'],
        ['baden', '🛁', 'Zusammen baden oder duschen'],
        ['urlaub', '🗺️', 'Pläne schmieden für einen Urlaub'],
        ['massage', '💆', 'Massage im Tausch: zehn Minuten du, zehn Minuten ich'],
        ['tanzen', '💃', 'Musik an und in der Küche tanzen']
      ], { local: true }),
      schule: deck('famschule', '💬', 'Mal nicht über die Kinder', 'Was wollt ihr wieder öfter zu zweit? ' + SUB, [
        ['abend', '🕯️', 'Ein fester Abend im Monat nur für uns'],
        ['mittag', '🍽️', 'Mittags zu zweit essen, wenn alle aus dem Haus sind'],
        ['wochenende', '🧳', 'Ein Wochenende ohne Kinder'],
        ['sport', '🏃', 'Zusammen Sport machen'],
        ['runde', '🚶', 'Abends eine Runde spazieren'],
        ['hobby', '🎨', 'Ein gemeinsames Hobby anfangen'],
        ['kaffee', '☕', 'Ein Kaffee zu zweit am Samstagmorgen'],
        ['fahrten', '🚗', 'Die Fahrdienste fairer aufteilen'],
        ['bildschirm', '📵', 'Ein Abend pro Woche ohne Bildschirm'],
        ['kino', '🎬', 'Wieder zusammen ins Kino oder Konzert'],
        ['reise', '✈️', 'Einmal im Jahr verreisen wir zu zweit'],
        ['lachen', '😂', 'Öfter zusammen lachen: Spieleabend, Kabarett, Quatsch']
      ], { local: true }),
      teen: deck('famteen', '🤝', 'Wir als Team', 'Was tut euch beiden gut? ' + SUB, [
        ['zuzweit', '🤝', 'Wichtiges besprechen wir erst zu zweit'],
        ['abend', '🕯️', 'Ein Abend pro Woche gehört uns, egal wer zu Hause ist'],
        ['wochenende', '🧳', 'Ein Wochenende nur zu zweit'],
        ['raus', '🚶', 'Abends öfter raus: Spaziergang, Kneipe, Kino'],
        ['publikum', '🚪', 'Wir streiten nicht vor Publikum'],
        ['fuersich', '🌿', 'Jeder bekommt Zeit für sich, ohne schlechtes Gewissen'],
        ['lachen', '😂', 'Wir lachen zusammen über das, was uns nervt'],
        ['neues', '🎓', 'Zusammen etwas Neues anfangen: Sport, Tanzen, Sprache'],
        ['fruehstueck', '🥐', 'Ein Frühstück zu zweit am Wochenende'],
        ['gutes', '🙏', 'Wir sagen uns öfter, was gut läuft'],
        ['naehe', '🫂', 'Mehr Zärtlichkeit im Alltag'],
        ['plaene', '🗺️', 'Pläne machen für die Zeit, wenn es im Haus ruhiger wird']
      ], { local: true }),
      fluegge: deck('famfluegge', '🕊️', 'Wer sind wir zu zweit?', 'Was fangt ihr mit der neuen Ruhe an? ' + SUB, [
        ['reise', '✈️', 'Eine lange Reise'],
        ['hobby', '🎨', 'Zusammen ein neues Hobby'],
        ['tanzen', '💃', 'Tanzen lernen'],
        ['umbau', '🛋️', 'Das Zuhause für uns zwei umgestalten'],
        ['freunde', '🍷', 'Öfter Freunde einladen'],
        ['fuersich', '🌿', 'Mehr Zeit für jeden allein'],
        ['wandern', '🥾', 'Zusammen Sport oder Wandern'],
        ['frueher', '🎞️', 'Etwas zurückholen, das wir früher geliebt haben'],
        ['spontan', '🚗', 'Spontan wegfahren, einfach so'],
        ['abend', '🕯️', 'Jede Woche ein Abend wie eine Verabredung'],
        ['projekt', '🌱', 'Ein gemeinsames Projekt: Garten, Ehrenamt, Bauen'],
        ['naehe', '🫂', 'Mehr Zärtlichkeit, jetzt wo keiner mehr reinplatzt']
      ], { local: true })
    },

    /* Eltern-Gutscheine: je Phase mit Kind im Haus genau sechs (ph = Phasen, in denen der Gutschein passt) */
    coupons: [
      { id: 'nacht', icon: '🌙', title: 'Ich übernehme die Nacht', desc: 'Du schläfst durch. Ich stehe auf, egal wie oft.', ph: ['baby', 'klein'] },
      { id: 'ausschlafen', icon: '🛌', title: 'Ausschlafen bis 9', desc: 'Ich mache den Morgen. Du drehst dich noch mal um.', ph: ['baby', 'klein', 'schule', 'teen'] },
      { id: 'zweistunden', icon: '⏳', title: 'Zwei Stunden nur für dich', desc: 'Ich halte dir den Rücken frei. Was du damit machst, geht mich nichts an.', ph: ['baby', 'klein', 'schule', 'teen'] },
      { id: 'bett', icon: '🧸', title: 'Ich bringe heute ins Bett', desc: 'Zähneputzen, Vorlesen, Licht aus: alles meins. Du hast frei.', ph: ['baby', 'klein'] },
      { id: 'kueche', icon: '🍽️', title: 'Abendessen und Küche: alles meins', desc: 'Kochen, Tisch, Abwasch. Du setzt dich nur hin.', ph: ['baby', 'klein', 'schule', 'teen'] },
      { id: 'wirzwei', icon: '💑', title: 'Ein Abend nur wir zwei', desc: 'Ich organisiere, wer aufpasst. Du musst nur mitkommen.', ph: ['baby', 'klein', 'schule', 'teen'] },
      { id: 'fahrten', icon: '🚗', title: 'Ich fahre heute alle Touren', desc: 'Training, Freunde, Abholen: mein Job. Du bleibst sitzen.', ph: ['schule', 'teen'] },
      { id: 'elternabend', icon: '📋', title: 'Ich übernehme den Elternabend', desc: 'Ich gehe hin, schreibe mit und erzähle dir nur das Wichtige.', ph: ['schule', 'teen'] }
    ]
  };
})();
