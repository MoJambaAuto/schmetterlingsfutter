/* Schmetterlingsfutter – Inhalte Teil 2 (Version 3.1): Klartext, Jingle-Box, Kritzel-Gruß, Nah dran.
   Erweitert window.LUZIFER_DATA aus data.js. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA;
  D.version = '3.13.0';

  /* Ideen-Briefkasten: eingeschaltet seit 10.11.2026 (Vermittlungsdienst kennt die Adresse /idea) */
  D.ideaBox = true;

  /* Geschlecht: wählt jede Person selbst, die verbundene App übernimmt es. Angesprochen wird immer mit dem Namen;
     die Angabe sorgt nur dafür, dass Fürwörter stimmen (pro = Fürwort, leer = Name wird wiederholt). */
  D.prons = [
    { id: 'er', label: 'Er', subj: 'Er', pro: 'er' },
    { id: 'sie', label: 'Sie', subj: 'Sie', pro: 'sie' },
    { id: 'es', label: 'Es', subj: 'Es', pro: 'es' },
    { id: 'einhorn', label: '🦄 Geflügeltes Einhorn', subj: 'Mein geflügeltes Einhorn' },
    { id: 'schmetterling', label: '🦋 Bunter Schmetterling', subj: 'Mein bunter Schmetterling' }
  ];

  /* ---- Klartext: Themen-Abgleich „Unausgesprochen“ (läuft über die Gleichklang-Technik) ---- */
  D.decks.push({
    id: 'reden', icon: '🗝️', title: 'Unausgesprochen', talk: true, opts: 3, round: 7,
    prompt: 'Möchtest du mit deinem Schatz darüber reden?',
    sub: 'Worüber möchtet ihr reden? Sichtbar wird nur, was ihr beide ansprechen wollt.',
    labels: { nein: '👌 Nein, alles gut', vielleicht: '🤔 Wäre schön', ja: '💬 Ja, gern bald' },
    yesLabel: 'Ihr wollt beide reden', openLabel: 'Fändet ihr beide schön', openTitle: 'Darüber würdet ihr beide gern mal reden',
    hitText: 'Darüber wollt ihr beide reden. Der schwerste Schritt ist damit getan.',
    noneText: 'Kein gemeinsames Thema markiert. Entweder läuft es rund – oder es traut sich noch keiner.',
    items: [
      { id: 'geld', t: 'Geld: Ausgaben, Sparen, wer zahlt was', e: '💶', q: 'Was wäre für dich beim Geld fair – und was macht dir Sorgen?' },
      { id: 'haushalt', t: 'Haushalt: wer macht wie viel', e: '🧺', q: 'Welche Aufgabe würdest du am liebsten abgeben, und welche übernehme ich?' },
      { id: 'mental', t: 'An alles denken müssen (Termine, Einkauf, Planung)', e: '🧠', q: 'Woran musst nur du denken, ohne dass ich es merke?' },
      { id: 'zeit', t: 'Unsere Zeit zu zweit', e: '⏰', q: 'Wann hattest du zuletzt das Gefühl, dass wir richtig Zeit füreinander hatten?' },
      { id: 'handy', t: 'Handy und Bildschirm, wenn wir zusammen sind', e: '📱', q: 'In welchen Momenten wünschst du dir, dass das Handy weg ist?' },
      { id: 'familie', t: 'Eltern, Schwiegereltern, Familie', e: '👪', q: 'Wo wünschst du dir, dass ich mich klarer an deine Seite stelle?' },
      { id: 'freunde', t: 'Freunde und eigene Unternehmungen', e: '👯', q: 'Was fehlt dir gerade mit deinen Leuten – und was mit mir?' },
      { id: 'freiraum', t: 'Zeit für jeden allein', e: '🌿', q: 'Wie viel Zeit für dich allein würde dir guttun, ohne schlechtes Gewissen?' },
      { id: 'arbeit', t: 'Arbeit und Stress, der mit nach Hause kommt', e: '💼', q: 'Was brauchst du von mir, wenn du gestresst heimkommst – Ruhe, Zuhören oder Ablenkung?' },
      { id: 'zukunft', t: 'Unsere Zukunft in fünf Jahren', e: '🧭', q: 'Welches Bild von uns in fünf Jahren macht dich froh?' },
      { id: 'wohnen', t: 'Wohnen: Ort, Umzug, Einrichtung', e: '🏡', q: 'Was müsste sich an unserem Zuhause ändern, damit du dich wohler fühlst?' },
      { id: 'kinder', t: 'Kinder: Wunsch, Erziehung, Aufteilung', e: '🧸', q: 'Was ist dir bei diesem Thema am wichtigsten, das ich wissen sollte?' },
      { id: 'zaertlich', t: 'Zärtlichkeit im Alltag', e: '🤗', q: 'Welche kleine Berührung fehlt dir im Alltag am meisten?' },
      { id: 'sex', t: 'Sex: Häufigkeit und Wünsche', e: '🔥', q: 'Was würde es dir leichter machen, über deine Wünsche zu sprechen?' },
      { id: 'streiten', t: 'Wie wir streiten', e: '🌩️', q: 'Was mache ich im Streit, das dich am meisten trifft – und was hilft dir?' },
      { id: 'alt', t: 'Etwas Altes, das noch wehtut', e: '🩹', q: 'Gibt es etwas von früher, für das du dir noch ein ehrliches Wort von mir wünschst?' },
      { id: 'gesehen', t: 'Anerkennung und gesehen werden', e: '👀', q: 'Wofür wünschst du dir mehr Anerkennung von mir?' },
      { id: 'eifersucht', t: 'Eifersucht und Vertrauen', e: '🫣', q: 'Was gibt dir Sicherheit bei uns – und was kratzt daran?' },
      { id: 'gesundheit', t: 'Gesundheit und Gewohnheiten', e: '🍏', q: 'Worüber machst du dir bei mir oder dir Gedanken?' },
      { id: 'ordnung', t: 'Ordnung und Pünktlichkeit', e: '🗂️', q: 'Welche eine Sache würde dir den Alltag sofort leichter machen?' },
      { id: 'urlaub', t: 'Urlaub und Freizeit', e: '🏖️', q: 'Wie sieht für dich Erholung aus – und passt das zu meiner?' },
      { id: 'marotte', t: 'Kleine Angewohnheiten im Alltag', e: '🙄', q: 'Darf ich dir etwas sagen, das mich stört – und du mir auch eins?' },
      { id: 'schoenes', t: 'Etwas Schönes, das noch ungesagt ist', e: '💝', q: 'Was wolltest du mir schon lange sagen und hast es nie getan?' }
    ]
  });

  D.klartext = {
    /* Wetterbericht der Woche: jeder schätzt für sich ein, verglichen wird erst, wenn beide fertig sind */
    areas: [
      { id: 'naehe', t: 'Nähe und Zärtlichkeit', e: '🤗', q: 'Was hat dir diese Woche an Nähe gutgetan – und was hat gefehlt?' },
      { id: 'reden', t: 'Unsere Gespräche', e: '💬', q: 'Wann hast du dich diese Woche von mir wirklich gehört gefühlt?' },
      { id: 'alltag', t: 'Alltag und Aufgabenteilung', e: '🧺', q: 'Was war diese Woche unfair verteilt?' },
      { id: 'zeit', t: 'Zeit zu zweit', e: '⏰', q: 'Welche Stunde nur für uns planen wir für nächste Woche fest ein?' },
      { id: 'wert', t: 'Anerkennung und Wertschätzung', e: '🌟', q: 'Wofür hättest du dir diese Woche ein Danke gewünscht?' },
      { id: 'freiraum', t: 'Freiraum für mich', e: '🌿', q: 'Was brauchst du nächste Woche nur für dich?' },
      { id: 'leicht', t: 'Spaß und Leichtigkeit', e: '🎈', q: 'Wann haben wir zuletzt zusammen richtig gelacht – und wie kriegen wir das wieder hin?' },
      { id: 'intim', t: 'Lust und Sex', e: '🔥', adult: true, q: 'Was würde dir helfen, dich fallen zu lassen?' }
    ],
    weather: ['⛈️', '🌧️', '⛅', '🌤️', '☀️'],
    weatherText: ['Gewitter', 'Regen', 'bewölkt', 'heiter', 'Sonne'],
    feelings: ['traurig', 'allein', 'überfordert', 'unsicher', 'verletzt', 'genervt', 'enttäuscht', 'ängstlich', 'erschöpft', 'übergangen', 'hilflos', 'unwichtig'],
    /* Friedensangebote (Gottman: „Reparaturversuche“) */
    peace: [
      'Ich will nicht gegen dich gewinnen. Ich will mit dir klarkommen.',
      'Das kam härter raus, als ich es meinte. Es tut mir leid.',
      'Können wir nochmal von vorn anfangen?',
      'Du bist mir wichtiger, als recht zu haben.',
      'Ich habe dir nicht richtig zugehört. Sag es mir nochmal – ich höre zu.',
      'Ich brauche eine Umarmung. Du auch?',
      'Waffenstillstand? Ich mache uns einen Tee.',
      'Ich bin noch sauer. Und ich liebe dich trotzdem.',
      'Lass uns morgen in Ruhe weiterreden. Heute nur noch gut zueinander sein.',
      'Mein Anteil daran ist größer, als ich vorhin zugegeben habe. Entschuldige.'
    ],
    pauseText: '⏸️ Ich brauche 20 Minuten Pause, damit ich wieder klar denken kann. Ich laufe nicht weg – ich komme zurück und dann reden wir weiter.',
    /* Gesprächskarten: tiefer als Smalltalk, ohne Vorwurf */
    cards: [
      'Was habe ich diese Woche getan, das dir gutgetan hat?',
      'Wobei fühlst du dich von mir manchmal allein gelassen?',
      'Was ist gerade deine größte Sorge – auch wenn sie nichts mit uns zu tun hat?',
      'Was vermisst du aus unserer Anfangszeit?',
      'Welche Kleinigkeit von mir macht deinen Tag besser?',
      'Wann warst du zuletzt stolz auf uns?',
      'Was traust du dich mir schwer zu sagen?',
      'Was würdest du gern öfter von mir hören?',
      'Worüber haben wir aufgehört zu reden, obwohl es wichtig ist?',
      'Was brauchst du von mir, wenn es dir schlecht geht?',
      'Welche Entscheidung sollten wir endlich treffen?',
      'Was war das Mutigste, das du je für uns getan hast?',
      'Wofür habe ich mich nie richtig bei dir bedankt?',
      'Was würdest du an unserem Alltag sofort ändern, wenn du könntest?',
      'Wann fühlst du dich mir am nächsten?',
      'Welchen Streit haben wir immer wieder – und worum geht es darin eigentlich?',
      'Was habe ich über dich noch nicht verstanden?',
      'Was wünschst du dir für uns in einem Jahr?',
      'Wobei könnte ich dich mehr unterstützen?',
      'Was ist ein Traum von dir, bei dem ich mitmachen soll?',
      'Wann hast du zuletzt gedacht: Genau deshalb bin ich mit dir zusammen?',
      'Was sollte ich über deinen Tag wissen, das ich nie frage?',
      'Wofür möchtest du, dass ich dir verzeihe?',
      'Was macht dir bei uns gerade am meisten Freude?'
    ],
    warnWords: ['immer', 'nie', 'niemals', 'ständig', 'jedes mal', 'jedesmal', 'typisch', 'schon wieder', 'du bist'],
    /* Wortstämme, bei denen der Satz nicht wörtlich übernommen wird (Beleidigung, Abwertung, Drohung) */
    /* harshWords gelten am Wortanfang (damit „getrennt“ nicht als „trenn…“ zählt), harshAny überall im Wort */
    harshWords: ['nervig', 'nervensäge', 'auf den sack', 'auf den keks', 'auf den geist', 'auf den zeiger', 'auf die nerven', 'auf die eier', 'kacke', 'verdammt', 'arsch', 'depp', 'blöd', 'bloed', 'dumm', 'dämlich', 'bescheuert', 'bekloppt', 'behindert', 'spinnst', 'spinner', 'hasse', 'verachte', 'widerlich', 'ekelhaft', 'ekelst', 'lächerlich', 'erbärmlich', 'armselig', 'versager', 'unfähig', 'nichtsnutz', 'faul', 'schlamp', 'egoist', 'halt die klappe', 'halts maul', 'halt’s maul', 'halt dein', 'fresse', 'schnauze', 'hau ab', 'geh mir aus', 'lass mich in ruhe', 'kann dich nicht', 'reicht mir mit dir', 'trenn', 'schluss mach', 'zicke', 'heulsuse', 'weichei', 'memme', 'psycho', 'krank im kopf', 'übertreib', 'stell dich nicht so an', 'selber schuld', 'selbst schuld', 'bist schuld', 'deine schuld', 'wie deine mutter', 'wie dein vater'],
    harshAny: ['idiot', 'arschloch', 'scheiß', 'scheiss', 'kotz', 'verpiss', 'trottel', 'nervst', 'nervt'],
    /* Entschärfte Fassungen, wenn die Eingabe zu scharf ist. {f} = gewähltes Gefühl */
    softLines: [
      { id: 'ruhig', label: 'Ruhig', t: 'Ich merke, dass ich gerade {f} bin, und ich will das nicht an dir auslassen. Können wir kurz durchatmen und dann in Ruhe darüber reden?' },
      { id: 'verspielt', label: 'Verspielt', t: 'Mein Akku ist im roten Bereich und meine Geduld im Urlaub. Lass uns kurz Pause machen, einmal fest umarmen und dann klären, was los ist.' },
      { id: 'herzlich', label: 'Herzlich', t: 'Mich beschäftigt gerade etwas, und ich möchte es dir sagen, ohne dass es wie ein Angriff klingt. Hast du gleich zehn Minuten für mich?' },
      { id: 'wir', label: 'Für uns', t: 'Du bist mir zu wichtig, um mich wegen meiner Gereiztheit mit dir zu streiten. Lass uns kurz runterfahren und es gemeinsam lösen.' }
    ],
    /* Rahmen für sachliche Eingaben – dieselben drei Bausteine, unterschiedlich eingeleitet */
    softFrames: [
      { id: 'klar', label: 'Klar', t: 'Mir ist aufgefallen, dass {s}. Ich fühle mich dabei {f}. Ich wünsche mir, dass {w}. Können wir darüber reden?' },
      { id: 'weich', label: 'Weich', t: 'Darf ich dir etwas sagen, das mich beschäftigt? Mir ist aufgefallen, dass {s}. Ich fühle mich dabei {f}. Schön wäre, wenn {w}.' },
      { id: 'wir', label: 'Für uns', t: 'Weil du mir wichtig bist, sage ich es lieber gleich: Mir ist aufgefallen, dass {s}. Ich fühle mich dabei {f} und wünsche mir, dass {w}. Wie siehst du das?' }
    ]
  };

  /* ---- Jingle-Box: kleine musikalische Liebeserklärungen (3–5 Sekunden).
     src: 'synth' = wird in der App erzeugt (Noten unten); später kommen fertige Aufnahmen dazu (file: 'audio/…').
     Melodien: Eigenkompositionen oder gemeinfreie Werke (Urheber seit über 70 Jahren tot), in `pd` vermerkt. ---- */
  D.jingleCats = [
    { id: 'einfachso', t: 'Einfach so', e: '❤️' },
    { id: 'morgen', t: 'Guten Morgen', e: '☀️' },
    { id: 'nacht', t: 'Gute Nacht', e: '🌙' },
    { id: 'vermissen', t: 'Vermissen', e: '💭' },
    { id: 'danke', t: 'Danke', e: '🙏' },
    { id: 'stolz', t: 'Mut machen', e: '💪' },
    { id: 'streit', t: 'Nach dem Streit', e: '🏳️' },
    { id: 'vergessen_jahrestag', t: 'Jahrestag vergessen', e: '🙈' },
    { id: 'vergessen_geburtstag', t: 'Geburtstag vergessen', e: '😬' },
    { id: 'vergessen_feiertag', t: 'Feiertag vergessen', e: '🫠' },
    { id: 'jahrestag', t: 'Jahrestag', e: '💍' },
    { id: 'geburtstag', t: 'Geburtstag', e: '🎂' },
    { id: 'valentin', t: 'Valentinstag', e: '💘' },
    { id: 'weihnachten', t: 'Weihnachten', e: '🎄' },
    { id: 'silvester', t: 'Silvester', e: '🎆' },
    { id: 'lust', t: 'Lust auf dich', e: '🔥', adult: true }
  ];
  const J = (id, cat, title, text, bpm, timbre, notes, pd) => ({ id, cat, title, text, bpm, timbre, notes, pd: pd || '' });
  D.jingles = [
    J('es1', 'einfachso', 'Herzklopfen', 'Einfach so: Ich liebe dich, {r}.', 132, 'bell', 'E5 .5,G5 .5,C6 1,B5 .5,G5 .5,C6 2'),
    J('es2', 'einfachso', 'Klopf, klopf', 'Klopf, klopf. Wer da? Jemand, der dich liebt.', 150, 'pluck', 'C5 1,G4 .5,G4 .5,A4 1,G4 1,- 1,B4 1,C5 1.5', 'Shave and a Haircut (trad.)'),
    J('es3', 'einfachso', 'Schmetterlinge', 'Du machst mir immer noch Schmetterlinge.', 168, 'bell', 'C5 .5,E5 .5,G5 .5,C6 .5,E6 .5,C6 .5,G5 .5,E6 2'),
    J('mo1', 'morgen', 'Morgenstimmung', 'Guten Morgen, {r}. Der Tag ist schön, weil es dich gibt.', 132, 'soft', 'G5 .5,E5 .5,D5 .5,C5 .5,D5 .5,E5 .5,G5 .5,E5 .5,D5 .5,C5 .5,D5 .5,E5 1.5', 'E. Grieg, Morgenstimmung (1875)'),
    J('mo2', 'morgen', 'Aufstehen, Schatz', 'Schläfst du noch? Aufwachen, Lieblingsmensch!', 150, 'pluck', 'C5 1,D5 1,E5 1,C5 1,E5 1,F5 1,G5 2', 'Bruder Jakob (trad.)'),
    J('mo3', 'morgen', 'Kaffee ist fertig', 'Kaffee, Sonne und ein Kuss – alles für dich.', 144, 'bell', 'G4 .5,C5 .5,E5 .5,G5 1,E5 .5,G5 2'),
    J('na1', 'nacht', 'Guten Abend, gut’ Nacht', 'Schlaf gut, {r}. Ich träume von dir.', 104, 'soft', 'E5 .5,E5 .5,G5 2,E5 .5,E5 .5,G5 2', 'J. Brahms, Wiegenlied (1868)'),
    J('na2', 'nacht', 'Der Mond ist aufgegangen', 'Gute Nacht. Die Sterne sind heute nur für dich da.', 96, 'soft', 'C5 .5,D5 1,C5 1,F5 1,E5 1,D5 1,C5 2', 'J. A. P. Schulz (1790)'),
    J('na3', 'nacht', 'Sternschnuppe', 'Augen zu, Herz auf: Ich liebe dich.', 120, 'bell', 'C6 .5,G5 .5,E5 .5,C5 1,E5 .5,G5 2'),
    J('ve1', 'vermissen', 'Du fehlst', 'Du fehlst mir. Komm bald heim.', 100, 'soft', 'A4 .5,C5 1,D5 .5,E5 .75,F5 .25,E5 .5,D5 2', 'Greensleeves (trad.)'),
    J('ve2', 'vermissen', 'Denk an dich', 'Ich denke gerade an dich. Wie eigentlich immer.', 110, 'bell', 'E5 1,D5 .5,C5 .5,E5 1,G5 2.5'),
    J('ve3', 'vermissen', 'Für dich', 'Zwischen all dem Kram heute: ein Gedanke nur für dich.', 132, 'pluck', 'E5 .5,D#5 .5,E5 .5,D#5 .5,E5 .5,B4 .5,D5 .5,C5 .5,A4 2', 'L. v. Beethoven, Für Elise (1810)'),
    J('da1', 'danke', 'Tausend Dank', 'Danke. Ich hab’s gesehen – und es war nicht selbstverständlich.', 138, 'bell', 'C5 .5,E5 .5,G5 1,A5 .5,G5 .5,C6 2'),
    J('da2', 'danke', 'Du bist die Beste / der Beste', 'Danke, dass es dich gibt.', 120, 'soft', 'G4 1,C5 1,E5 1,D5 .5,C5 .5,C5 2'),
    J('st1', 'stolz', 'Tusch', 'Ich bin stolz auf dich. Richtig stolz.', 150, 'brass', 'C4 .5,E4 .5,G4 .5,C5 1.5,G4 .5,C5 3'),
    J('st2', 'stolz', 'Du schaffst das', 'Du schaffst das. Ich glaube an dich.', 190, 'bell', 'E4 1,E4 1,F4 1,G4 1,G4 1,F4 1,E4 1,D4 1,C4 2', 'L. v. Beethoven, Ode an die Freude (1824)'),
    J('st3', 'stolz', 'Rückenwind', 'Kopf hoch. Ich stehe hinter dir.', 144, 'pluck', 'G4 .5,A4 .5,C5 .5,D5 .5,E5 1,G5 2'),
    J('sr1', 'streit', 'Weiße Fahne', 'Frieden? Du bist mir wichtiger, als recht zu haben.', 96, 'soft', 'G5 1,E5 1,C5 1,D5 1,E5 .5,C5 2.5'),
    J('sr2', 'streit', 'Es tut mir leid', 'Es tut mir leid. Ehrlich.', 88, 'soft', 'A4 1,C5 1,E5 1.5,D5 .5,C5 1,A4 2'),
    J('sr3', 'streit', 'Nochmal von vorn', 'Können wir nochmal von vorn anfangen?', 120, 'bell', 'C5 .5,D5 .5,E5 .5,G5 1,- .5,C5 .5,E5 .5,G5 .5,C6 2'),
    J('vj1', 'vergessen_jahrestag', 'Oh nein', 'Ich habe unseren Jahrestag verpennt. Schande über mich – ich mach’s wieder gut.', 108, 'brass', 'G4 .5,G4 .5,G4 .5,Eb4 3', 'L. v. Beethoven, 5. Sinfonie (1808)'),
    J('vj2', 'vergessen_jahrestag', 'Besser spät', 'Zu spät, aber von Herzen: Alles Liebe zu unserem Tag.', 120, 'bell', 'G4 1,C5 .75,C5 .25,C5 2,G4 1,D5 .75,B4 .25,C5 2', 'R. Wagner, Brautchor (1850)'),
    J('vg1', 'vergessen_geburtstag', 'Nachträglich', 'Nachträglich alles Liebe! Mein Kalender ist schuld. Na gut: ich.', 132, 'pluck', 'G4 .75,G4 .25,A4 1,G4 1,C5 1,B4 1.5,- .5,B4 .5,Bb4 .5,A4 2', 'Happy Birthday (Hill, 1893) mit Absturz'),
    J('vg2', 'vergessen_geburtstag', 'Asche auf mein Haupt', 'Geburtstag vergessen. Ich schäme mich und backe Kuchen.', 150, 'brass', 'A3 1,A3 .75,A3 .25,A3 1,C4 .75,B3 .25,B3 .75,A3 .25,A3 .75,G#3 .25,A3 2', 'F. Chopin, Trauermarsch (1839)'),
    J('vf1', 'vergessen_feiertag', 'Ups', 'Ups. Der Tag ist an mir vorbeigerauscht. Hol ich nach – versprochen.', 100, 'brass', 'D4 1,C#4 1,C4 1,B3 3'),
    J('vf2', 'vergessen_feiertag', 'Verspätete Post', 'Verspätet, aber mit Liebe verpackt.', 150, 'bell', 'C5 .5,C5 .5,G5 1,- .5,E5 .5,C5 .5,G4 2'),
    J('ja1', 'jahrestag', 'Unser Tag', 'Alles Liebe zu unserem Jahrestag. Ich würde dich wieder wählen.', 168, 'bell', 'F#5 1,E5 1,D5 1,C#5 1,B4 1,A4 1,B4 1,C#5 2', 'J. Pachelbel, Kanon in D (um 1680)'),
    J('ja2', 'jahrestag', 'Ja, ich will', 'Noch ein Jahr mit dir. Bitte gern noch viele.', 120, 'brass', 'G4 1,C5 .75,C5 .25,C5 2,G4 1,D5 .75,B4 .25,C5 2', 'R. Wagner, Brautchor (1850)'),
    J('ge1', 'geburtstag', 'Zum Geburtstag viel Glück', 'Alles Liebe zum Geburtstag, {r}!', 132, 'bell', 'G4 .75,G4 .25,A4 1,G4 1,C5 1,B4 2', 'Happy Birthday (Hill, 1893)'),
    J('ge2', 'geburtstag', 'Hoch sollst du leben', 'Heute dreht sich alles um dich. Zu Recht.', 160, 'brass', 'C5 .5,C5 .5,C5 .5,E5 1,D5 .5,C5 .5,D5 .5,E5 .5,C5 2'),
    J('va1', 'valentin', 'Herz an Herz', 'Sei mein Valentinsschatz. Heute und überhaupt.', 112, 'soft', 'E5 1,G5 .5,C6 1.5,B5 .5,A5 .5,G5 2'),
    J('va2', 'valentin', 'Amors Pfeil', 'Getroffen. Schon lange. Von dir.', 176, 'pluck', 'C5 .25,D5 .25,E5 .25,F5 .25,G5 .25,A5 .25,B5 .25,C6 1,- .5,G5 .5,C6 2'),
    J('we1', 'weihnachten', 'Jingle Bells', 'Frohe Weihnachten, mein Herz.', 152, 'bell', 'E5 .5,E5 .5,E5 1,E5 .5,E5 .5,E5 1,E5 .5,G5 .5,C5 .75,D5 .25,E5 2', 'J. L. Pierpont (1857)'),
    J('we2', 'weihnachten', 'Stille Nacht', 'Mein schönstes Geschenk bist du.', 96, 'soft', 'G4 1.5,A4 .5,G4 1,E4 3', 'F. X. Gruber (1818)'),
    J('we3', 'weihnachten', 'O Tannenbaum', 'Advent, Advent – ich denk an dich.', 112, 'pluck', 'C4 .5,F4 .75,F4 .25,F4 1,G4 .5,A4 .75,A4 .25,A4 1.5', 'O Tannenbaum (trad., 1824)'),
    J('si1', 'silvester', 'Auf uns', 'Frohes Neues! Auf ein weiteres Jahr mit dir.', 126, 'soft', 'C4 1,F4 1.5,F4 .5,F4 1,A4 1,G4 1.5,F4 .5,G4 1', 'Auld Lang Syne (trad.)'),
    J('si2', 'silvester', 'Feuerwerk', 'Drei, zwei, eins – Kuss!', 200, 'bell', 'C5 .5,E5 .5,G5 .5,C6 .5,- .5,C6 .25,E6 .25,G6 .5,C6 .5,E6 2'),
    J('lu1', 'lust', 'Habanera', 'Heute Abend: du, ich, kein Handy.', 116, 'pluck', 'D5 1,C#5 .5,C5 .5,C5 .5,B4 .5,Bb4 .5,A4 1.5', 'G. Bizet, Carmen (1875)'),
    J('lu2', 'lust', 'Komm her', 'Ich. Will. Dich.', 92, 'soft', 'E4 1,G4 1,Bb4 1.5,A4 .5,G4 2')
  ];

  /* ---- Passend dazu (Werbelinks) für die neuen Bereiche ---- */
  Object.assign(D.tips, {
    klartext: [ { icon: '🃏', title: 'Gesprächskarten für Paare', q: 'Gesprächskarten Paare' }, { icon: '📖', title: 'Buch: Gewaltfreie Kommunikation', q: 'Gewaltfreie Kommunikation Buch' }, { icon: '📔', title: 'Paar-Tagebuch', q: 'Paar Tagebuch Fragen' } ],
    match_reden: [ { icon: '🃏', title: 'Gesprächskarten für Paare', q: 'Gesprächskarten Paare' }, { icon: '📖', title: 'Buch über Paar-Kommunikation', q: 'Buch Kommunikation Beziehung Paare' } ],
    checkin: [ { icon: '📔', title: 'Paar-Tagebuch für den Wochen-Rückblick', q: 'Paar Tagebuch Fragen' }, { icon: '⏳', title: 'Sanduhr für Redezeiten', q: 'Sanduhr 10 Minuten' } ],
    peace: [ { icon: '💐', title: 'Blumen sagen es auch', q: 'Blumenstrauß Entschuldigung' }, { icon: '🍫', title: 'Versöhnungs-Schokolade', q: 'Schokolade Entschuldigung Geschenk' }, { icon: '🫖', title: 'Tee für zwei', q: 'Tee Geschenkset für zwei' } ],
    zwiegespraech: [ { icon: '⏳', title: 'Sanduhr für Redezeiten', q: 'Sanduhr 10 Minuten' }, { icon: '🕯️', title: 'Kerze für ruhige Gespräche', q: 'Duftkerze Geschenk' } ],
    vergessen: [ { icon: '🎁', title: 'Gutschein zum Sofort-Ausdrucken', q: 'Amazon Gutschein zum Drucken' }, { icon: '💐', title: 'Blumen als Wiedergutmachung', q: 'Blumenstrauß Geschenk' }, { icon: '🗓️', title: 'Familienkalender, damit es nicht wieder passiert', q: 'Familienplaner Kalender Paar' } ],
    jingle: [ { icon: '🔊', title: 'Kleine Box für eure Küche', q: 'Bluetooth Lautsprecher klein' }, { icon: '🎵', title: 'Spieluhr mit eurem Lied', q: 'Spieluhr personalisiert' } ],
    kritzel: [ { icon: '🖨️', title: 'Mini-Fotodrucker fürs Handy', q: 'Mini Fotodrucker Smartphone' }, { icon: '🖼️', title: 'Herz-Bilderrahmen', q: 'Bilderrahmen Herz Collage' } ],
    nfc: [ { icon: '🏷️', title: 'NFC-Sticker (NTAG215)', q: 'NFC Sticker NTAG215' }, { icon: '🔑', title: 'NFC-Schlüsselanhänger', q: 'NFC Schlüsselanhänger NTAG215' } ]
  });

  /* ---- Gesungene Jingles (Suno, Runde 1, von Mo freigegeben am 10.11.2026). Aufnahmen liegen in audio/jingles/. ---- */
  [
    ["s-einfachso-1","einfachso","Nur mal so","Nur mal so zwischendurch: Ich lieb dich!",4.8],
    ["s-einfachso-2","einfachso","Mittendrin","Mittendrin am Tag ein Gruß von mir.",3.8],
    ["s-einfachso-3","einfachso","Kleiner Gruß","Kleiner Gruß, großes Herz, für dich!",6],
    ["s-morgen-1","morgen","Sonnenschein","Guten Morgen, mein Sonnenschein!",4.4],
    ["s-morgen-2","morgen","Aufgewacht","Aufgewacht, mein Lieblingsmensch!",4],
    ["s-morgen-3","morgen","Kaffee und Kuss","Kaffee, Kuss und los. Ich lieb dich!",4.5],
    ["s-nacht-1","nacht","Schlaf gut","Schlaf gut, mein Herz.",4.5],
    ["s-nacht-2","nacht","Träum schön","Träum was Schönes, ich bin da.",4.8],
    ["s-nacht-3","nacht","Gute Nacht","Gute Nacht, ich lieb dich sehr.",7.3],
    ["s-danke-1","danke","Tausend Dank","Tausend Dank, mein Schatz, für heut!",4.3],
    ["s-danke-2","danke","Gesehen","Ich hab’s gesehen und sag: Dankeschön!",4.8],
    ["s-danke-3","danke","Gold wert","Du bist Gold wert. Danke dir!",5],
    ["s-vergessen-1","vergessen_jahrestag","Ups","Ups, vergessen! Doch ich lieb dich jeden Tag.",5.5],
    ["s-vergessen-2","vergessen_jahrestag","Der Kalender lügt","Der Kalender lügt, mein Herz vergisst dich nie.",4.6],
    ["s-vergessen-3","vergessen_jahrestag","Zu spät","Zu spät, ich weiß. Ich mach es wieder gut!",6.3],
    ["s-streit-1","streit","Es tut mir leid","Es tut mir leid, ich hab dich lieb.",5.3],
    ["s-streit-2","streit","Weiße Fahne","Weiße Fahne, Schatz! Vertragen wir uns?",5.3],
    ["s-streit-3","streit","In den Arm","Streit vorbei? Ich nehm dich in den Arm.",7.5]
  ].reverse().forEach((x) => D.jingles.unshift({ id: x[0], cat: x[1], title: x[2], text: x[3], sec: x[4], file: 'audio/jingles/' + x[0] + '.mp3', sung: true, pd: 'Aufnahme: Suno' }));

  /* ---- Gesungene Jingles (Suno, Runde 2, Downloads von Mo freigegeben am 11.11.2026). Stehen je Anlass vor den Aufnahmen aus Runde 1. ---- */
  [
    ["s-vermissen-1","vermissen","Du fehlst mir","Du fehlst mir heute, mehr als sonst.",3.8],
    ["s-vermissen-2","vermissen","Komm bald heim","Komm bald heim, mein Platz ist leer.",3.2],
    ["s-vermissen-3","vermissen","Stunden zählen","Ich zähl die Stunden bis zu dir.",4.3],
    ["s-stolz-1","stolz","Du schaffst das","Du schaffst das, ich glaub an dich!",4.3],
    ["s-stolz-2","stolz","Kopf hoch","Kopf hoch, ich steh hinter dir.",4.7],
    ["s-stolz-3","stolz","So stolz","Ich bin so stolz auf dich, na klar!",5.9],
    ["s-streit2-1","streit","Nicht fair von mir","Es tut mir leid. Das war nicht fair von mir.",4.7],
    ["s-streit2-2","streit","Du bist mir wichtig","Ich will nicht streiten. Du bist mir wichtig.",3.9],
    ["s-streit2-3","streit","Ich hör dir zu","Lass uns reden. Ich hör dir zu.",5],
    ["s-vgeburtstag-1","vergessen_geburtstag","Nachträglich","Nachträglich alles Liebe, ich war zu spät!",5],
    ["s-vgeburtstag-2","vergessen_geburtstag","Durchgerutscht","Dein Geburtstag ging mir durch, verzeih!",4.5],
    ["s-vgeburtstag-3","vergessen_geburtstag","Mit Kuchen","Zu spät gratuliert, dafür mit Kuchen!",6.8],
    ["s-vfeiertag-1","vergessen_feiertag","Ich hol ihn nach","Der Tag flog vorbei, ich hol ihn nach!",3.4],
    ["s-vfeiertag-2","vergessen_feiertag","Mit Liebe eingepackt","Verspätet, doch mit Liebe eingepackt.",3.6],
    ["s-vfeiertag-3","vergessen_feiertag","Nicht vergessen","Verpasst, verpennt, doch nicht vergessen: dich!",6.8],
    ["s-jahrestag-1","jahrestag","Noch ein Jahr","Noch ein Jahr mit dir, bitte noch viele.",4.9],
    ["s-jahrestag-2","jahrestag","Jedes Mal","Ich würd dich wieder wählen, jedes Mal.",4.9],
    ["s-jahrestag-3","jahrestag","Auf uns zwei","Unser Tag, mein Herz, auf uns zwei!",5.5],
    ["s-geburtstag-1","geburtstag","Nur um dich","Heute dreht sich alles nur um dich!",4.1],
    ["s-geburtstag-2","geburtstag","Kerzen an","Kerzen an, mein Schatz, es ist dein Tag!",3.9],
    ["s-geburtstag-3","geburtstag","Immer schöner","Ein Jahr mehr, und du wirst immer schöner.",6.3],
    ["s-valentin-1","valentin","Valentinsschatz","Sei mein Valentinsschatz, heute und überhaupt.",7.1],
    ["s-valentin-2","valentin","Amor hat getroffen","Amor hat getroffen, mitten ins Herz.",4],
    ["s-valentin-3","valentin","Ein Strauß, ein Kuss","Ein Strauß, ein Kuss, mein Herz gehört dir.",6.7],
    ["s-weihnachten-1","weihnachten","Unterm Baum","Unterm Baum ist Platz für uns zwei, mein Schatz. Mein liebstes Päckchen, das bist du.",8],
    ["s-weihnachten-2","weihnachten","Plätzchenduft","Plätzchenduft und du daneben, so mag ich den Advent.",8.1],
    ["s-lust-1","lust","Handy aus","Heute Abend nur wir zwei, Handy aus.",5],
    ["s-lust-2","lust","Komm näher","Komm näher, ich hab Lust auf dich.",4.5],
    ["s-lust-3","lust","Du und ich","Kerzen an, Tür zu, du und ich.",5.8]
  ].reverse().forEach((x) => D.jingles.unshift({ id: x[0], cat: x[1], title: x[2], text: x[3], sec: x[4], file: 'audio/jingles/' + x[0] + '.mp3', sung: true, pd: 'Aufnahme: Suno' }));
  /* ---- Ende Runde 2 ---- */

  /* ---- Stimmen der Aufnahmen: w = Frauenstimme, m = Männerstimme, x = Duett (gilt für beide). Schlüssel = Kennung ohne „s-“ und Nummer.
     D.jingleAlt: zusätzliche Aufnahme mit der anderen Stimme, [Kennung, Stimme, Sekunden] → audio/jingles/<Kennung>-<Stimme>.mp3 ---- */
  D.jingleVoiceOf = { einfachso: 'm', morgen: 'w', nacht: 'w', danke: 'm', vergessen: 'm', streit: 'w', vermissen: 'w', stolz: 'w', streit2: 'm', vgeburtstag: 'm', vfeiertag: 'w', jahrestag: 'x', geburtstag: 'w', valentin: 'x', weihnachten: 'w', silvester: 'x', lust: 'w' };
  D.jingleAlt = [
  ];
  D.jingles.forEach((j) => { if (!j.sung) return; const base = j.id.replace(/^s-/, '').replace(/-\d+$/, ''); j.voices = {}; j.voices[D.jingleVoiceOf[base] || 'x'] = j.file; j.secs = {}; });
  D.jingleAlt.forEach((a) => { const j = D.jingles.find((x) => x.id === a[0]); if (!j || !j.voices) return; j.voices[a[1]] = 'audio/jingles/' + a[0] + '-' + a[1] + '.mp3'; if (a[2]) j.secs[a[1]] = a[2]; });

  /* ---- Inhalte-Paket 2026-11 (Inhalte-Werkstatt): 40 neue Botschaften für „Heute für dich“ ---- */
  D.messages.push(
    "Ich mag, wie du lachst, wenn du eigentlich ernst bleiben willst.",
    "{r}, mit dir wird sogar ein Dienstag zu etwas Besonderem.",
    "Du bist mein Lieblingsgedanke zwischen zwei Terminen.",
    "Wenn es heute anstrengend wird: Ich bin in deinem Team.",
    "Ich habe dich heute schon dreimal vermisst. Es ist noch nicht mal Mittag.",
    "Danke, dass du meine Macken kennst und trotzdem bleibst.",
    "Dein Platz neben mir ist der schönste Ort, den ich kenne.",
    "Ich freue mich jetzt schon auf den Moment, in dem die Tür aufgeht.",
    "{r}, du machst aus meinem Chaos ein Zuhause.",
    "Mit dir schweigen ist schöner als mit anderen reden.",
    "Ich würde dich jeden Tag wieder ansprechen.",
    "Du bist der Grund, warum ich heute grundlos grinse.",
    "Egal, was heute schiefgeht: Wir zwei gehen nicht schief.",
    "Ich mag dich auch dann, wenn du Hunger hast. Das will was heißen.",
    "Du bist mein Lieblingsmensch. Mit Abstand. Ohne Abstand noch lieber.",
    "{r}, ich bin stolz auf dich. Einfach so, ohne Anlass.",
    "Wenn ich an Glück denke, hat es dein Gesicht.",
    "Dein Kopf auf meiner Schulter löst mehr Probleme als jeder Plan.",
    "Ich liebe die Art, wie du dich über Kleinigkeiten freust.",
    "Heute Abend gehört dir meine ganze Aufmerksamkeit.",
    "Du fehlst mir schon, wenn du nur im Nebenzimmer bist.",
    "Mit dir alt werden klingt nach dem besten Plan, den ich habe.",
    "{r}, du bist mein Lieblingsgeräusch am Morgen.",
    "Ich hätte Lust, dich heute einfach mal lange zu umarmen.",
    "Du bringst mich zum Lachen, selbst wenn ich es gar nicht will.",
    "Danke für die tausend kleinen Dinge, die du nebenbei machst.",
    "Bei dir darf ich so sein, wie ich bin. Das ist das größte Geschenk.",
    "Ich denke an dich. Mehr wollte ich gar nicht sagen.",
    "{r}, mein Herz macht immer noch einen Hüpfer, wenn dein Name aufleuchtet.",
    "Wir zwei gegen den Rest der Woche.",
    "Du bist die beste Entscheidung, die mir je passiert ist.",
    "Ich mag unser Wir.",
    "Wenn du heute zweifelst: Ich glaube an dich, für uns beide.",
    "Mit dir schmeckt sogar Tiefkühlpizza nach Festessen.",
    "Du hast heute einen Kuss gut. Mindestens.",
    "{r}, du bist mein sicherer Hafen und mein liebstes Abenteuer.",
    "Ich höre dir gern zu. Auch beim dritten Mal derselben Geschichte.",
    "Heute schon gesagt? Du siehst gut aus. Wirklich.",
    "Was immer der Tag bringt: Am Ende lande ich am liebsten bei dir.",
    "Ich hab dich lieb. Von hier bis zum Kühlschrank und zurück, und das mehrmals."
  );
})();
