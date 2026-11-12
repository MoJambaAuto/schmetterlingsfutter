/* Schmetterlingsfutter – Inhalte Teil 2 (Version 3.1): Klartext, Jingle-Box, Kritzel-Gruß, Nah dran.
   Erweitert window.LUZIFER_DATA aus data.js. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA;
  D.version = '3.29.0';

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
    ["s-einfachso-1","einfachso","Nur mal so","Nur mal so zwischendurch: Ich lieb dich!",6.2],
    ["s-einfachso-2","einfachso","Mittendrin","Mittendrin am Tag ein Gruß von mir.",3.8],
    ["s-einfachso-3","einfachso","Kleiner Gruß","Kleiner Gruß, großes Herz, für dich!",6.9],
    ["s-morgen-1","morgen","Sonnenschein","Guten Morgen, mein Sonnenschein!",5],
    ["s-morgen-2","morgen","Aufgewacht","Aufgewacht, mein Lieblingsmensch!",5.1],
    ["s-morgen-3","morgen","Kaffee und Kuss","Kaffee, Kuss und los. Ich lieb dich!",5.4],
    ["s-nacht-1","nacht","Schlaf gut","Schlaf gut, mein Herz.",5.2],
    ["s-nacht-2","nacht","Träum schön","Träum was Schönes, ich bin da.",5],
    ["s-nacht-3","nacht","Gute Nacht","Gute Nacht, ich lieb dich sehr.",7.8],
    ["s-danke-1","danke","Tausend Dank","Tausend Dank, mein Schatz, für heut!",4.8],
    ["s-danke-2","danke","Gesehen","Ich hab’s gesehen und sag: Dankeschön!",5],
    ["s-danke-3","danke","Gold wert","Du bist Gold wert. Danke dir!",5.9],
    ["s-vergessen-1","vergessen_jahrestag","Ups","Ups, vergessen! Doch ich lieb dich jeden Tag.",5.4],
    ["s-vergessen-2","vergessen_jahrestag","Der Kalender lügt","Der Kalender lügt, mein Herz vergisst dich nie.",4.6],
    ["s-vergessen-3","vergessen_jahrestag","Zu spät","Zu spät, ich weiß. Ich mach es wieder gut!",7.2],
    ["s-streit-1","streit","Es tut mir leid","Es tut mir leid, ich hab dich lieb.",5.4],
    ["s-streit-2","streit","Weiße Fahne","Weiße Fahne, Schatz! Vertragen wir uns?",5.3],
    ["s-streit-3","streit","In den Arm","Streit vorbei? Ich nehm dich in den Arm.",8.4]
  ].reverse().forEach((x) => D.jingles.unshift({ id: x[0], cat: x[1], title: x[2], text: x[3], sec: x[4], file: 'audio/jingles/' + x[0] + '.mp3', sung: true, pd: 'Aufnahme: Suno' }));

  /* ---- Gesungene Jingles (Suno, Runde 2, Downloads von Mo freigegeben am 11.11.2026). Stehen je Anlass vor den Aufnahmen aus Runde 1. ---- */
  [
    ["s-vermissen-1","vermissen","Du fehlst mir","Du fehlst mir heute, mehr als sonst.",4.6],
    ["s-vermissen-2","vermissen","Komm bald heim","Komm bald heim, mein Platz ist leer.",4.6],
    ["s-vermissen-3","vermissen","Stunden zählen","Ich zähl die Stunden bis zu dir.",5.2],
    ["s-stolz-1","stolz","Du schaffst das","Du schaffst das, ich glaub an dich!",4.9],
    ["s-stolz-2","stolz","Kopf hoch","Kopf hoch, ich steh hinter dir.",5.1],
    ["s-stolz-3","stolz","So stolz","Ich bin so stolz auf dich, na klar!",6.8],
    ["s-streit2-1","streit","Nicht fair von mir","Es tut mir leid. Das war nicht fair von mir.",5.3],
    ["s-streit2-2","streit","Du bist mir wichtig","Ich will nicht streiten. Du bist mir wichtig.",3.9],
    ["s-streit2-3","streit","Ich hör dir zu","Lass uns reden. Ich hör dir zu.",5.9],
    ["s-vgeburtstag-1","vergessen_geburtstag","Nachträglich","Nachträglich alles Liebe, ich war zu spät!",6],
    ["s-vgeburtstag-2","vergessen_geburtstag","Durchgerutscht","Dein Geburtstag ging mir durch, verzeih!",5.9],
    ["s-vgeburtstag-3","vergessen_geburtstag","Mit Kuchen","Zu spät gratuliert, dafür mit Kuchen!",7.7],
    ["s-vfeiertag-1","vergessen_feiertag","Ich hol ihn nach","Der Tag flog vorbei, ich hol ihn nach!",5],
    ["s-vfeiertag-2","vergessen_feiertag","Mit Liebe eingepackt","Verspätet, doch mit Liebe eingepackt.",5],
    ["s-vfeiertag-3","vergessen_feiertag","Nicht vergessen","Verpasst, verpennt, doch nicht vergessen: dich!",7.4],
    ["s-jahrestag-1","jahrestag","Noch ein Jahr","Noch ein Jahr mit dir, bitte noch viele.",6],
    ["s-jahrestag-2","jahrestag","Jedes Mal","Ich würd dich wieder wählen, jedes Mal.",5.8],
    ["s-jahrestag-3","jahrestag","Auf uns zwei","Unser Tag, mein Herz, auf uns zwei!",5.5],
    ["s-geburtstag-1","geburtstag","Nur um dich","Heute dreht sich alles nur um dich!",4],
    ["s-geburtstag-2","geburtstag","Kerzen an","Kerzen an, mein Schatz, es ist dein Tag!",3.9],
    ["s-geburtstag-3","geburtstag","Immer schöner","Ein Jahr mehr, und du wirst immer schöner.",7.2],
    ["s-valentin-1","valentin","Valentinsschatz","Sei mein Valentinsschatz, heute und überhaupt.",7.2],
    ["s-valentin-2","valentin","Amor hat getroffen","Amor hat getroffen, mitten ins Herz.",4],
    ["s-valentin-3","valentin","Ein Strauß, ein Kuss","Ein Strauß, ein Kuss, mein Herz gehört dir.",7.6],
    ["s-weihnachten-1","weihnachten","Unterm Baum","Unterm Baum ist Platz für uns zwei, mein Schatz. Mein liebstes Päckchen, das bist du.",8.9],
    ["s-weihnachten-2","weihnachten","Plätzchenduft","Plätzchenduft und du daneben, so mag ich den Advent.",8.2],
    ["s-lust-1","lust","Handy aus","Heute Abend nur wir zwei, Handy aus.",5.9],
    ["s-lust-2","lust","Komm näher","Komm näher, ich hab Lust auf dich.",4.5],
    ["s-lust-3","lust","Du und ich","Kerzen an, Tür zu, du und ich.",5.8]
  ].reverse().forEach((x) => D.jingles.unshift({ id: x[0], cat: x[1], title: x[2], text: x[3], sec: x[4], file: 'audio/jingles/' + x[0] + '.mp3', sung: true, pd: 'Aufnahme: Suno' }));
  /* ---- Ende Runde 2 ---- */

  /* ---- Gesungene Jingles (Suno, Runde 3): Silvester, Frauenstimme als Grundaufnahme. Downloads von Mo freigegeben am 11.11.2026. ---- */
  [
    ["s-silvester-1","silvester","Auf uns zwei","Auf uns zwei und alles, was jetzt kommt!",6],
    ["s-silvester-2","silvester","Mitternachtskuss","Um Mitternacht gehört mein Kuss nur dir.",3.1],
    ["s-silvester-3","silvester","Funken","Raketen am Himmel, Funken bei uns zwei.",6.4]
  ].reverse().forEach((x) => D.jingles.unshift({ id: x[0], cat: x[1], title: x[2], text: x[3], sec: x[4], file: 'audio/jingles/' + x[0] + '.mp3', sung: true, pd: 'Aufnahme: Suno' }));
  /* ---- Ende Runde 3 ---- */

  /* ---- Stimmen der Aufnahmen: w = Frauenstimme, m = Männerstimme, x = Duett (gilt für beide). Schlüssel = Kennung ohne „s-“ und Nummer.
     D.jingleAlt: zusätzliche Aufnahme mit der anderen Stimme, [Kennung, Stimme, Sekunden] → audio/jingles/<Kennung>-<Stimme>.mp3 ---- */
  D.jingleVoiceOf = { einfachso: 'm', morgen: 'w', nacht: 'w', danke: 'm', vergessen: 'm', streit: 'w', vermissen: 'w', stolz: 'w', streit2: 'm', vgeburtstag: 'm', vfeiertag: 'w', jahrestag: 'x', geburtstag: 'w', valentin: 'x', weihnachten: 'w', silvester: 'w', lust: 'w' };
  D.jingleAlt = [
    ["s-morgen-1","m",4.8],
    ["s-morgen-2","m",4.4],
    ["s-morgen-3","m",7.6],
    ["s-nacht-1","m",6.6],
    ["s-nacht-2","m",4.3],
    ["s-nacht-3","m",5.8],
    ["s-streit-1","m",5.6],
    ["s-streit-2","m",3.8],
    ["s-streit-3","m",6.4],
    ["s-vermissen-1","m",6.9],
    ["s-vermissen-2","m",4.6],
    ["s-vermissen-3","m",4.8],
    ["s-stolz-1","m",5.2],
    ["s-stolz-2","m",5.3],
    ["s-stolz-3","m",5.2],
    ["s-vfeiertag-1","m",5.6],
    ["s-vfeiertag-2","m",5.9],
    ["s-vfeiertag-3","m",6],
    ["s-geburtstag-1","m",5.4],
    ["s-geburtstag-2","m",5],
    ["s-geburtstag-3","m",5],
    ["s-weihnachten-1","m",9.1],
    ["s-weihnachten-2","m",7.4],
    ["s-lust-1","m",5.5],
    ["s-lust-2","m",4.2],
    ["s-lust-3","m",7.4],
    ["s-einfachso-1","w",7.2],
    ["s-einfachso-2","w",5.5],
    ["s-einfachso-3","w",6.8],
    ["s-danke-1","w",4.1],
    ["s-danke-2","w",6.5],
    ["s-danke-3","w",5],
    ["s-vergessen-1","w",5.3],
    ["s-vergessen-2","w",4.5],
    ["s-vergessen-3","w",5.7],
    ["s-streit2-1","w",7.2],
    ["s-streit2-2","w",4],
    ["s-streit2-3","w",5.8],
    ["s-vgeburtstag-1","w",6.3],
    ["s-vgeburtstag-2","w",6.1],
    ["s-vgeburtstag-3","w",6],
    ["s-jahrestag-1","m",5.4],
    ["s-jahrestag-2","m",4.7],
    ["s-jahrestag-1","w",6.5],
    ["s-jahrestag-2","w",5.6],
    ["s-valentin-1","m",5.4],
    ["s-valentin-2","m",4.9],
    ["s-valentin-3","m",7.4],
    ["s-valentin-1","w",6.7],
    ["s-valentin-2","w",6.7],
    ["s-valentin-3","w",6.9],
    ["s-silvester-1","m",5.5],
    ["s-silvester-2","m",5.8],
    ["s-silvester-3","m",7]
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

  /* ---- Gemeinsame Interessen (3.16.0): laufen über die Gleichklang-Technik. Sichtbar wird nur, was beide mögen
     oder beide ausprobieren würden. Zeilen: [Kennung, Symbol, Text, Suchbegriff für einen Werbelink zur Amazon-Suche]. ---- */
  const CL = { ja: '❤️ Mag ich', vielleicht: '✨ Würde ich ausprobieren', nein: 'Nicht meins' };
  const cdeck = (id, icon, title, rows) => D.decks.push({ id, icon, title, sub: 'Was mögt ihr beide? Was wollt ihr ausprobieren?', common: true, teaser: rows.slice(0, 3).map((r) => r[2]).join(', ') + ' …', opts: 3, labels: CL,
    yesLabel: 'Mögt ihr beide', openTitle: 'Zum gemeinsamen Entdecken', openLabel: 'Beide offen dafür', hitText: 'Das verbindet euch. Alles andere bleibt für sich.',
    noneText: 'In der nächsten Runde warten neue Themen.', items: rows.map((r) => ({ id: r[0], e: r[1], t: r[2], tip: r[3] || '' })) });
  cdeck("hobby", "🧩", "Hobbys und Freizeit", [
    ["wandern","🥾","Wandern","Wanderrucksack 20 Liter"],
    ["rad","🚴","Radtouren","Fahrradtasche Gepäckträger"],
    ["kochen","🍳","Kochen","Kochbuch für zwei"],
    ["backen","🧁","Backen","Backbuch"],
    ["garten","🌱","Gärtnern, auch auf dem Balkon","Kräutergarten Set Balkon"],
    ["brettspiele","🎲","Brett- und Kartenspiele","Spiel für 2 Personen"],
    ["puzzle","🧩","Puzzeln","Puzzle 1000 Teile Erwachsene"],
    ["gaming","🎮","Videospiele","Koop Spiel für zwei"],
    ["foto","📷","Fotografieren","Kamera Stativ Reise"],
    ["malen","🎨","Malen und Zeichnen","Aquarell Set Anfänger"],
    ["handarbeit","🧶","Stricken, Nähen, Handarbeit","Strickset Anfänger"],
    ["heimwerken","🔨","Heimwerken und Bauen","Werkzeugkoffer"],
    ["tanzen","💃","Tanzen","Paartanz lernen Buch"],
    ["yoga","🧘","Yoga","Yogamatte"],
    ["fitness","🏋️","Fitness und Kraftsport","Kurzhanteln Set"],
    ["laufen","🏃","Laufen","Laufgürtel Handy"],
    ["schwimmen","🏊","Schwimmen","Schwimmbrille"],
    ["klettern","🧗","Klettern und Bouldern","Chalkbag"],
    ["camping","⛺","Camping","Campingkocher"],
    ["angeln","🎣","Angeln","Angelset Einsteiger"],
    ["lesen","📚","Lesen","Leselampe Buch"],
    ["sterne","🔭","Sterne beobachten","Teleskop Einsteiger"],
    ["modellbau","🧱","Modellbau und Klemmbausteine","Klemmbausteine Erwachsene Set"],
    ["tiere","🐕","Zeit mit Tieren",["Tierpark Jahreskarte Gutschein","Hundespielzeug Set"]],
    ["ehrenamt","🤝","Ehrenamt","Buch Ehrenamt Ideen"],
    ["sprache","🗣️","Eine Sprache lernen","Sprachkurs Buch Anfänger"],
    ["geocaching","🧭","Schatzsuche mit dem Handy",["Geocaching Set Einsteiger","Geocaching Buch"]],
    ["troedel","🧺","Flohmärkte und Trödel",["Flohmarkt Klapptisch","Trödel Einkaufstasche faltbar"]]
  ]);
  cdeck("musik", "🎵", "Musik", [
    ["pop","🎤","Pop",["Pop Schallplatte Vinyl","Bluetooth Lautsprecher"]],
    ["rock","🎸","Rock",["Rock Vinyl Klassiker","Gitarre Einsteiger Set"]],
    ["hiphop","🎧","Hip-Hop und Rap",["Hip-Hop Vinyl","Over-Ear Kopfhörer"]],
    ["elektro","🎛️","Elektro und Techno",["DJ Controller Einsteiger","Techno Vinyl"]],
    ["schlager","🪩","Schlager",["Schlager CD Box","Karaoke Mikrofon Bluetooth"]],
    ["klassik","🎻","Klassik",["Klassik CD Box","Klassik Vinyl"]],
    ["jazz","🎷","Jazz und Soul",["Jazz Vinyl","Soul Klassiker CD"]],
    ["metal","🤘","Metal",["Metal Vinyl","Ohrstöpsel Konzert"]],
    ["indie","🌿","Indie und Alternative",["Indie Vinyl","Plattenspieler Bluetooth"]],
    ["oldies","📻","Oldies und Musik der 80er und 90er",["80er Hits CD Box","90er Hits Vinyl"]],
    ["latin","🪇","Latin und Salsa",["Salsa Tanzkurs DVD","Latin Hits CD"]],
    ["soundtrack","🎬","Filmmusik",["Filmmusik Vinyl","Soundtrack CD Box"]],
    ["konzert","🎟️","Konzerte besuchen","Ohrstöpsel Konzert"],
    ["festival","🎪","Festivals","Festival Ausrüstung Set"],
    ["vinyl","💿","Schallplatten hören","Plattenspieler"],
    ["selbst","🎹","Selbst Musik machen","Ukulele Set Anfänger"],
    ["karaoke","🎙️","Singen und Karaoke","Karaoke Mikrofon Bluetooth"],
    ["playlist","📝","Eine gemeinsame Playlist pflegen",["Bluetooth Lautsprecher wasserdicht","Kopfhörer Splitter"]],
    ["kueche","🕺","Musik zum Tanzen in der Küche","Bluetooth Lautsprecher klein"],
    ["musical","🎭","Musicals","Musical Gutschein"],
    ["oper","🏛️","Oper und Operette",["Oper CD Box","Opernglas"]],
    ["chor","👥","Im Chor singen",["Notenständer klappbar","Chorbuch Pop"]],
    ["auto","🚗","Laut mitsingen im Auto",["Karaoke Mikrofon Auto","Liederbuch Autofahrt"]],
    ["kneipe","🍻","Live-Musik in der Kneipe",["Ohrstöpsel Konzert","Konzert Gutschein"]],
    ["hoerbuch","🎧","Hörbücher und Podcasts","Kopfhörer Bluetooth"],
    ["neues","🔍","Neue Musik füreinander aussuchen",["Plattenspieler Bluetooth","Musik Streaming Gutschein"]]
  ]);
  cdeck("film", "🎬", "Film, Serien und Fernsehen", [
    ["komoedie","😂","Komödien",["Komödie DVD Klassiker","Popcorn Maschine"]],
    ["romantik","💕","Liebesfilme",["Liebesfilm DVD Box","Kuscheldecke XXL"]],
    ["krimi","🕵️","Krimis und Thriller",["Krimi Dinner Spiel","Thriller Bluray"]],
    ["scifi","🚀","Science-Fiction",["Science Fiction Bluray Box","Sternenprojektor"]],
    ["fantasy","🐉","Fantasy",["Fantasy Bluray Box","Fantasy Brettspiel"]],
    ["horror","👻","Horror",["Horrorfilm Bluray","Popcorn Schalen Set"]],
    ["action","💥","Action",["Action Bluray Box","Soundbar"]],
    ["doku","🌍","Dokus",["Doku Bluray Natur","Bildband"]],
    ["truecrime","🔎","True Crime",["True Crime Buch","True Crime Spiel"]],
    ["anime","🌸","Anime",["Anime Bluray","Manga Starter Set"]],
    ["trick","🧸","Animationsfilme",["Animationsfilm Bluray","Kuscheldecke XXL"]],
    ["klassiker","🎞️","Filmklassiker","Filmklassiker Sammlung"],
    ["historie","🏰","Historienfilme und Kostümserien",["Historienserie DVD Box","Historischer Roman"]],
    ["helden","🦸","Superhelden-Filme",["Superhelden Bluray Box","Superhelden Tasse"]],
    ["marathon","🍿","Serien-Marathon am Wochenende","Popcornmaschine"],
    ["kino","🎟️","Kino","Kinogutschein"],
    ["heimkino","📽️","Heimkino mit Beamer","Mini Beamer"],
    ["quiz","🧠","Quizshows mitraten","Quiz Spiel Erwachsene"],
    ["kochshow","👩‍🍳","Koch- und Backshows",["Backbuch Fernsehen","Kochbuch für zwei"]],
    ["reality","🌴","Reality-TV",["Snackbox","Kuschelsocken"]],
    ["sport","⚽","Sport schauen",["Sport Fanartikel","Bierglas Set"]],
    ["sonntag","🚔","Der Sonntagskrimi",["Tatort Spiel","Kuscheldecke XXL"]],
    ["comedy","🎤","Stand-up und Comedy",["Comedy DVD","Gesellschaftsspiel lustig"]],
    ["weihnacht","🎄","Weihnachtsfilme, auch im Juli","Kuscheldecke XXL"],
    ["original","🗣️","Filme im Originalton",["Englisch lernen Buch","Untertitel Lernkarten"]],
    ["arthouse","🎨","Programmkino",["Arthouse Film DVD","Kino Gutschein"]],
    ["natur","🦁","Tier- und Naturfilme",["Natur Doku Bluray","Fernglas"]]
  ]);
  cdeck("kultur", "🎭", "Kultur und Ausgehen", [
    ["museum","🖼️","Museen und Ausstellungen",["Museumsführer Deutschland","Kunst Bildband"]],
    ["theater","🎭","Theater",["Theater Gutschein","Opernglas"]],
    ["kabarett","🎤","Kabarett und Comedy live",["Kabarett DVD","Comedy Gutschein"]],
    ["lesung","📖","Lesungen",["Hörbuch Box","Buchclub Buch"]],
    ["klassik","🎻","Klassische Konzerte",["Klassik Konzert Gutschein","Klassik Vinyl"]],
    ["ballett","🩰","Ballett und Tanztheater",["Ballett DVD","Tanzschuhe"]],
    ["galerie","🎨","Galerien und Kunst",["Kunst Bildband","Leinwand Malset für zwei"]],
    ["fuehrung","🏛️","Stadtführungen und Architektur","Reiseführer Deutschland Städte"],
    ["burgen","🏰","Burgen, Schlösser, Geschichte",["Burgen Reiseführer Deutschland","Schlösser Bildband"]],
    ["stadtfest","🎪","Stadtfeste und Märkte",["Einkaufskorb faltbar","Picknick Rucksack"]],
    ["weihnachtsmarkt","🎄","Weihnachtsmärkte","Thermobecher"],
    ["restaurant","🍽️","Neue Restaurants testen",["Restaurant Gutschein","Restaurant Rubbelposter"]],
    ["bar","🍸","Cocktailbars","Cocktail Set Zuhause"],
    ["cafe","☕","Cafés entdecken",["Kaffeebohnen Probierset","Siebträger Kaffeemaschine"]],
    ["kneipenquiz","🧠","Kneipenquiz","Quiz Spiel Erwachsene"],
    ["tanzengehen","🪩","Tanzen gehen",["Tanzschuhe","Tanzkurs DVD"]],
    ["bowling","🎳","Bowling und Billard",["Bowling Set für Zuhause","Billard Queue"]],
    ["escape","🔐","Escape Rooms","Escape Room Spiel Zuhause"],
    ["freizeitpark","🎢","Freizeitparks",["Freizeitpark Gutschein","Regenponcho"]],
    ["zoo","🦒","Zoo und Aquarium",["Zoo Gutschein","Fernglas Kinder"]],
    ["kirmes","🎡","Kirmes",["Bauchtasche","Zuckerwatte Maschine"]],
    ["stadion","🏟️","Stadion und Live-Sport",["Fanschal","Sitzkissen Stadion"]],
    ["planetarium","🌌","Planetarium","Sternenkarte drehbar"],
    ["therme","♨️","Therme und Sauna","Saunatuch Set"],
    ["minigolf","⛳","Minigolf",["Minigolf Set Garten","Golf Putting Matte"]],
    ["spieleabend","🃏","Spieleabende mit Freunden","Partyspiel Erwachsene"]
  ]);
  cdeck("reisen", "🧳", "Reisen und Draußen", [
    ["stadt","🏙️","Städtereisen","Reiseführer Städtetrip Europa"],
    ["strand","🏖️","Strandurlaub","Strandtuch XXL"],
    ["berge","🏔️","Urlaub in den Bergen","Wanderstöcke"],
    ["roadtrip","🚗","Roadtrip","Roadtrip Europa Buch"],
    ["camper","🚐","Wohnmobil und Camper",["Camping Zubehör Wohnmobil","Campingstuhl Set"]],
    ["zelten","⛺","Zelten","Zelt 2 Personen"],
    ["wellness","🧖","Wellness-Urlaub","Bademantel Paar Set"],
    ["aktiv","🚵","Aktivurlaub",["Wanderrucksack 30 Liter","Trinkblase"]],
    ["fern","✈️","Fernreisen","Rubbel Weltkarte"],
    ["meer","🌊","Nord- und Ostsee",["Strandmuschel","Strandtuch XXL"]],
    ["ski","⛷️","Ski und Snowboard",["Skibrille","Skihandschuhe"]],
    ["schiff","🚢","Kreuzfahrt",["Reisetasche Kreuzfahrt","Reiseapotheke"]],
    ["zug","🚆","Reisen mit dem Zug","Zugreisen Europa Buch"],
    ["region","🗺️","Die eigene Region entdecken","Rubbel Landkarte Deutschland Ausflüge"],
    ["picknick","🧺","Picknick","Picknickkorb für 2"],
    ["paddeln","🛶","Paddeln","Dry Bag wasserdicht"],
    ["wald","🌲","Waldspaziergänge",["Picknickdecke wasserdicht","Wanderstöcke"]],
    ["sonnenaufgang","🌅","Sonnenaufgänge ansehen","Thermoskanne"],
    ["see","🏞️","Baden im See",["Luftmatratze","Wasserdichte Handyhülle"]],
    ["huette","🛖","Urlaub in einer Hütte",["Kuscheldecke XXL","Gesellschaftsspiel Klassiker"]],
    ["spontan","🎒","Spontane Kurztrips","Weekender Tasche"],
    ["hotel","🏨","Schöne Hotels","Hotelgutschein"],
    ["hausboot","🚤","Hausboot",["Hausboot Reiseführer","Schwimmweste"]],
    ["weitwandern","🚶","Mehrere Tage wandern","Wanderführer Fernwanderweg"],
    ["garten","🌷","Parks und Gärten",["Picknickkorb für zwei","Gartenführer Deutschland"]],
    ["traum","🌍","Von einer Weltreise träumen","Reise Tagebuch Paar"]
  ]);
  cdeck("genuss", "🍝", "Essen und Genuss", [
    ["italien","🍝","Italienisch","Nudelmaschine"],
    ["asien","🍜","Asiatisch","Wok Set"],
    ["sushi","🍣","Sushi","Sushi Set selber machen"],
    ["grillen","🔥","Grillen","Tischgrill Balkon"],
    ["veggie","🥗","Vegetarisch und vegan","Kochbuch vegetarisch"],
    ["scharf","🌶️","Scharfes Essen","Chili Saucen Set"],
    ["streetfood","🌮","Streetfood",["Streetfood Kochbuch","Burgerpresse"]],
    ["burger","🍔","Burger","Burgerpresse Set"],
    ["fruehstueck","🥐","Lange frühstücken","Frühstückstablett Bett"],
    ["kaffee","☕","Guter Kaffee","Kaffeemühle Hand"],
    ["tee","🍵","Tee","Tee Geschenkset"],
    ["schoko","🍫","Schokolade","Schokolade Probierset"],
    ["kaese","🧀","Käse","Käsebrett Set"],
    ["kuchen","🍰","Kuchen und Torten","Backbuch"],
    ["eis","🍦","Eis","Eismaschine"],
    ["rezepte","📖","Neue Rezepte ausprobieren","Kochbuch für zwei"],
    ["fondue","🫕","Fondue und Raclette","Raclette Grill"],
    ["pizza","🍕","Pizza selber machen","Pizzastein Backofen"],
    ["markt","🧺","Über den Wochenmarkt gehen","Einkaufskorb"],
    ["schick","🍽️","Schick essen gehen",["Restaurant Gutschein","Weinglas Set"]],
    ["imbiss","🍟","Currywurst und Pommes",["Pommes Schneider","Currysoße Set"]],
    ["tapas","🫒","Tapas und kleine Teller","Tapas Schalen Set"],
    ["brot","🥖","Brot backen","Gärkorb Set"],
    ["weltkueche","🌍","Ein Land kochen, in dem ihr noch nie wart","Kochbuch Weltküche"],
    ["dessert","🍮","Nachtisch zuerst",["Dessert Kochbuch","Dessertgläser Set"]],
    ["kochkurs","👩‍🍳","Kochkurse","Kochkurs Gutschein"]
  ]);
  D.tips.match_hobby = [{"icon":"🎲","title":"Spiel für zwei","q":"Spiel für 2 Personen"},{"icon":"🎟️","title":"Erlebnisbox für zwei","q":"Erlebnisbox für zwei"}];
  D.tips.match_musik = [{"icon":"🔊","title":"Kleine Box für die Küche","q":"Bluetooth Lautsprecher klein"},{"icon":"🎙️","title":"Karaoke-Mikrofon","q":"Karaoke Mikrofon Bluetooth"}];
  D.tips.match_film = [{"icon":"🍿","title":"Popcornmaschine","q":"Popcornmaschine"},{"icon":"🧣","title":"Kuscheldecke","q":"Kuscheldecke XXL Paar"}];
  D.tips.match_kultur = [{"icon":"🔐","title":"Escape-Spiel für zu Hause","q":"Escape Room Spiel Zuhause"},{"icon":"🎟️","title":"Erlebnisgutschein","q":"Erlebnisgutschein für zwei"}];
  D.tips.match_reisen = [{"icon":"🗺️","title":"Rubbelkarte für Ausflüge","q":"Rubbel Landkarte Deutschland Ausflüge"},{"icon":"🧳","title":"Kurztrip-Gutschein","q":"Kurzurlaub Gutschein Paar"}];
  D.tips.match_genuss = [{"icon":"📖","title":"Kochbuch für zwei","q":"Kochbuch für zwei"},{"icon":"🍫","title":"Schokolade zum Probieren","q":"Schokolade Probierset"}];

  /* ---- Mehr Auswahl bei den Werbelinks (3.17.0): zusätzliche Vorschläge je Funktion, Zeilen [Symbol, Titel, Suchbegriff].
     Die App zeigt sie reihum, damit nicht immer dasselbe verlinkt ist. ---- */
  const moreTips = {
    kiss: [["🍓","Früchte in Schokolade","Schokofrüchte Geschenk"],["💋","Kussmund-Tasse","Tasse Kussmund"],["🌹","Rose, die bleibt","Infinity Rose Geschenk"],["🍬","Herz-Pralinen","Pralinen Herz Geschenk"]],
    hug: [["🧦","Kuschelsocken für zwei","Kuschelsocken Paar Set"],["🔥","Wärmflasche mit Bezug","Wärmflasche Plüsch"],["☕","Heiße Schokolade","Trinkschokolade Geschenkset"],["🛋️","Kuschelkissen","Kuschelkissen groß"]],
    morning: [["🍯","Frühstücks-Set","Frühstück Geschenkset Marmelade Honig"],["🥞","Herz-Pfannkuchen","Pancake Form Herz"],["🫖","Teekanne für zwei","Teekanne mit Stövchen"],["⏰","Lichtwecker","Lichtwecker Sonnenaufgang"]],
    night: [["🕯️","Kerzen fürs Schlafzimmer","LED Kerzen Timer"],["🧴","Kissenspray","Kissenspray Lavendel"],["📖","Gute-Nacht-Geschichten","Gute Nacht Geschichten Erwachsene"],["🛏️","Kuschelbettwäsche","Bettwäsche Flanell 200x200"]],
    message: [["🖋️","Schönes Briefpapier","Briefpapier Set mit Umschlägen"],["📮","Postkarten-Set","Postkarten Liebe Set"],["🪧","Leuchtkasten für Botschaften","Lightbox Buchstaben"],["🧲","Wörter für den Kühlschrank","Kühlschrankmagnete Wörter deutsch"]],
    reasons: [["🃏","Karten „Ich liebe dich, weil“","Ich liebe dich weil Karten"],["📸","Box für Erinnerungen","Erinnerungsbox Fotos"],["💌","Briefe für später","Briefe öffnen wenn Buch"],["🖼️","Bilderrahmen für euch zwei","Bilderrahmen Collage Paar"]],
    gen: [["🎲","Würfel für Date-Ideen","Date Würfel Paare"],["😂","Witziges für euch zwei","lustiges Geschenk Paar"],["☕","Freche Tasse","Tasse Spruch lustig Liebe"],["📦","Überraschungsbox","Date Box Paare"]],
    oracle: [["🌻","Samen für eine Blumenwiese","Blumenwiese Samen Geschenk"],["🌸","Trockenblumen-Strauß","Trockenblumen Strauß"],["🪴","Herzblatt-Pflanze","Herzblatt Pflanze"],["🔮","Orakelkarten","Orakelkarten Liebe"]],
    song: [["🎧","Kopfhörer-Splitter für zwei","Kopfhörer Splitter Klinke"],["🎤","Karaoke-Mikrofon","Karaoke Mikrofon Bluetooth"],["🪕","Kalimba","Kalimba Anfänger"],["💿","Plattenspieler","Plattenspieler"]],
    time: [["🗓️","Kalender mit euren Fotos","Fotokalender Gutschein"],["⏳","Zeitkapsel","Zeitkapsel Paar"],["📍","Karte eurer Orte","Weltkarte Pinnwand Kork"],["📷","Sofortbildkamera","Sofortbildkamera"]],
    milestone: [["🍾","Etwas zum Anstoßen","Sekt Geschenkset"],["🕯️","Kerze mit Datum","Kerze personalisiert Jahrestag"],["🖼️","Poster „Wo alles begann“","Poster wo alles begann Karte personalisiert"],["🔑","Schlüsselanhänger für zwei","Schlüsselanhänger Paar Gravur"]],
    thanks: [["🫖","Tee-Auswahl","Tee Geschenkset"],["🧼","Kleine Auszeit","Wellness Geschenkset klein"],["🍪","Kekse zum Verschenken","Kekse Geschenkdose"],["💐","Trockenblumen","Trockenblumen Strauß klein"]],
    piek_aufmerksamkeit: [["🍫","Lieblingsschokolade","Schokolade Geschenk"],["🔋","Powerbank für unterwegs","Powerbank klein"],["🧣","Etwas Warmes","Schal weich"],["📓","Kleines Notizbuch","Notizbuch A6 schön"]],
    piek_unaufgefordert: [["🧽","Putz-Set","Putzset Geschenk"],["🥡","Vorratsdosen","Vorratsdosen Set Glas"],["🛒","Einkaufstasche zum Falten","Einkaufstasche faltbar"],["🥘","Schmortopf","Bräter Gusseisen"]],
    piek_dankbar: [["📝","Dankeskarten","Dankeskarten Set"],["🫙","Glas für schöne Momente","Glücksmomente Glas"],["📔","Tagebuch „Ein Satz am Tag“","Tagebuch ein Satz pro Tag"],["🌷","Blumen ohne Anlass","Blumenstrauß Geschenk"]],
    piek_frage: [["🎲","Erzählwürfel","Erzählwürfel Erwachsene"],["📖","Buch mit Fragen für zwei","Fragen für Paare Buch"],["🍷","Tischkarten mit Fragen","Tischgespräche Karten"],["🧠","Quiz über euch","Paar Quiz Spiel"]],
    piek_neu: [["🧗","Gutschein für etwas Neues","Erlebnisgutschein für zwei"],["🍳","Kochbuch Weltküche","Kochbuch Weltküche"],["🎨","Malset für zwei","Malen nach Zahlen Paar"],["🧩","Rätselspiel","Exit Spiel"]],
    lovemap: [["🧠","Quiz „Wie gut kennst du mich?“","Paar Quiz wie gut kennst du mich"],["📓","Notizbuch für Geschenkideen","Notizbuch klein"],["💬","Gesprächskarten","Gesprächskarten Paare"],["🗺️","Buch mit Zielen für zwei","Bucket List Buch Paare"]],
    coupon: [["✂️","Gutscheine zum Selbstgestalten","Gutschein Karten blanko"],["🎁","Geschenkbox","Geschenkbox klein mit Deckel"],["🧖","Wellness-Set","Wellness Geschenkset"],["🍽️","Dinner zu Hause","Candle Light Dinner Set"]],
    coupon_massage: [["🪨","Massagesteine","Hot Stone Massage Set"],["🧴","Massagebalsam","Massagebalsam"],["🎵","Musik dazu","Bluetooth Lautsprecher klein"],["💆","Wärmekissen für den Nacken","Nackenkissen Wärme"]],
    coupon_fruehstueck: [["🥚","Eierbecher für zwei","Eierbecher Set 2"],["🧇","Waffeleisen","Waffeleisen Herz"],["🍊","Saftpresse","Zitruspresse"],["🍯","Frühstücks-Set","Frühstück Geschenkset Marmelade Honig"]],
    coupon_film: [["🥤","Kino-Becher","Popcorn Becher Set"],["📽️","Mini-Beamer","Mini Beamer"],["🍫","Naschbox","Süßigkeiten Box Filmabend"],["🛋️","Sofa-Tablett","Sofatablett"]],
    coupon_essen: [["🍷","Weingläser","Weingläser Set 2"],["🍝","Nudelmaschine","Nudelmaschine"],["🧂","Gewürz-Set","Gewürze Geschenkset"],["👩‍🍳","Schürzen für zwei","Schürze Paar Set"]],
    coupon_wellness: [["🕯️","Duftkerzen","Duftkerzen Set"],["🧼","Badekugeln","Badekugeln Set"],["💆","Gesichtsmasken","Gesichtsmasken Set"],["🎵","Lautsprecher fürs Bad","Bluetooth Lautsprecher wasserdicht"]],
    coupon_spaziergang: [["🧤","Handschuhe für zwei","Partnerhandschuhe"],["☂️","Großer Schirm","Regenschirm groß Paar"],["🥾","Warme Socken","Wandersocken Merino"],["🧺","Picknickdecke","Picknickdecke wasserdicht"],["🔦","Lampe für Abendrunden","Taschenlampe klein hell"]],
    coupon_tag: [["🗺️","Ausflugsführer","Ausflugsziele Deutschland Buch"],["🎒","Tagesrucksack","Rucksack klein Tagesausflug"],["📷","Sofortbildkamera","Sofortbildkamera"],["🧩","Stadtrallye","Stadtrallye Box"],["🧺","Picknickkorb","Picknickkorb für 2"]],
    coupon_ausschlafen: [["🛏️","Kuschelbettwäsche","Bettwäsche Flanell 200x200"],["🥐","Frühstückstablett","Frühstückstablett Bett"],["🌙","Verdunklungsvorhang","Verdunklungsvorhang"],["🎧","Ohrstöpsel","Ohrstöpsel Schlafen"],["☕","Thermoskanne fürs Bett","Thermoskanne 1 Liter"]],
    intim_flirt: [["🌹","Rosenblätter","Rosenblätter Deko"],["🕯️","Kerzenlicht","LED Kerzen Timer"],["🧴","Massageöl","Massageöl Paar"],["🥂","Sektgläser","Sektgläser Set 2"]],
    intim_question: [["📔","Paar-Tagebuch","Paar Tagebuch Fragen"],["🎲","Gesprächsspiel für Paare","Spiel für Paare Fragen"],["📖","Buch über Nähe","Buch Nähe Beziehung Paare"],["💬","Karten für tiefe Gespräche","Gesprächskarten Paare"]],
    intim_date: [["🕯️","Massagekerze","Massagekerze"],["🛁","Badezusatz für zwei","Badezusatz Rosen Kerzen Set"],["🎭","Augenbinde","Augenbinde Satin"],["🥂","Etwas zum Anstoßen","Sekt Geschenkset"]],
    intim_wish: [["🎟️","Gutscheine für Paare","Gutscheinbuch für Paare"],["🪶","Federkitzler","Federkitzler Massage"],["📖","Buch mit Ideen für zwei","Kamasutra Buch Paare"],["🕯️","Massagekerze","Massagekerze"]],
    match_bock: [["🍿","Popcornmaschine","Popcornmaschine"],["🎨","Malset für zwei","Malen nach Zahlen Paar"],["☕","Thermosbecher","Thermosbecher to go"],["🧩","Puzzle","Puzzle 1000 Teile Erwachsene"]],
    match_dates: [["🔐","Escape-Spiel für zu Hause","Escape Room Spiel Zuhause"],["🗺️","Rubbelkarte für Ausflüge","Rubbel Landkarte Deutschland Ausflüge"],["🧺","Picknickkorb","Picknickkorb für 2"],["📸","Sofortbildkamera","Sofortbildkamera"]],
    match_vorlieben: [["🕯️","Massagekerze","Massagekerze"],["🎲","Erotik-Würfel","Erotik Würfel Paare"],["🎭","Augenbinde","Augenbinde Satin"],["📖","Buch mit Ideen","Kamasutra Buch Paare"]],
    partner: [["🔋","Powerbank","Powerbank klein"],["📲","Handyhalter fürs Bett","Handyhalterung Bett"],["🎧","Kopfhörer","Kopfhörer Bluetooth"],["🖼️","Digitaler Bilderrahmen","Digitaler Bilderrahmen WLAN"]],
    match_hobby: [["🧩","Puzzle","Puzzle 1000 Teile Erwachsene"],["🎨","Malset für zwei","Malen nach Zahlen Paar"],["🥾","Wanderführer","Wanderführer Deutschland"],["🧶","Bastelset","Bastelset Erwachsene"]],
    match_musik: [["💿","Plattenspieler","Plattenspieler"],["🎧","Kopfhörer-Splitter","Kopfhörer Splitter Klinke"],["🪕","Ukulele","Ukulele Set Anfänger"],["🎟️","Ohrstöpsel fürs Konzert","Ohrstöpsel Konzert"]],
    match_film: [["📽️","Mini-Beamer","Mini Beamer"],["🥤","Kino-Becher","Popcorn Becher Set"],["🧠","Film-Quiz","Film Quiz Spiel"],["🛋️","Sofa-Tablett","Sofatablett"]],
    match_kultur: [["🧠","Quiz für zwei","Quiz Spiel Erwachsene"],["🗺️","Stadtführer","Reiseführer Deutschland Städte"],["🍸","Cocktail-Set","Cocktail Set Zuhause"],["🃏","Partyspiel","Partyspiel Erwachsene"]],
    match_reisen: [["🎒","Tagesrucksack","Rucksack klein Tagesausflug"],["📔","Reisetagebuch","Reise Tagebuch Paar"],["🧺","Picknickdecke","Picknickdecke wasserdicht"],["🌍","Rubbel-Weltkarte","Rubbel Weltkarte"]],
    match_genuss: [["🍝","Nudelmaschine","Nudelmaschine"],["🧀","Käsebrett","Käsebrett Set"],["🍕","Pizzastein","Pizzastein Backofen"],["🧂","Gewürz-Set","Gewürze Geschenkset"]]
  };
  Object.keys(moreTips).forEach((k) => { const have = D.tips[k] || (D.tips[k] = []); moreTips[k].forEach((t) => { if (!have.some((h) => h.q === t[2])) have.push({ icon: t[0], title: t[1], q: t[2] }); }); });
  const moreTips2 = {
    klartext: [["🎲","Erzählwürfel","Erzählwürfel Erwachsene"],["📖","Buch mit Fragen für zwei","Fragen für Paare Buch"],["⏳","Sanduhr für Redezeiten","Sanduhr 10 Minuten"]],
    match_reden: [["📔","Paar-Tagebuch","Paar Tagebuch Fragen"],["⏳","Sanduhr für Redezeiten","Sanduhr 10 Minuten"],["🫖","Tee für ein ruhiges Gespräch","Tee Geschenkset für zwei"],["🕯️","Kerze für den Tisch","Duftkerze Geschenk"]],
    checkin: [["🗓️","Wochenplaner für zwei","Wochenplaner Paar"],["🫙","Glas für schöne Momente","Glücksmomente Glas"],["💬","Gesprächskarten","Gesprächskarten Paare"],["🫖","Tee für zwei","Tee Geschenkset für zwei"]],
    peace: [["💌","Karte „Es tut mir leid“","Karte Entschuldigung"],["🧸","Etwas zum Drücken","Kuscheltier Herz"],["🕯️","Kerze für den Abend","Duftkerze Geschenk"]],
    zwiegespraech: [["🫖","Tee für zwei","Tee Geschenkset für zwei"],["🧣","Decke für die Couch","Kuscheldecke XXL Paar"],["💬","Gesprächskarten","Gesprächskarten Paare"],["📔","Paar-Tagebuch","Paar Tagebuch Fragen"]],
    vergessen: [["🍫","Pralinen zur Rettung","Pralinen Geschenk"],["🎟️","Erlebnis zum Nachholen","Erlebnisgutschein für zwei"],["💌","Schöne Karte","Glückwunschkarte Set"]],
    jingle: [["🎤","Karaoke-Mikrofon","Karaoke Mikrofon Bluetooth"],["🎧","Kopfhörer-Splitter für zwei","Kopfhörer Splitter Klinke"],["🪕","Kalimba","Kalimba Anfänger"],["💿","Plattenspieler","Plattenspieler"]],
    kritzel: [["🖍️","Stifte, die Spaß machen","Fineliner Set bunt"],["🧲","Magnetleiste für Bilder","Fotoseil Magnete"],["📒","Skizzenbuch","Skizzenbuch A5"],["🖼️","Rahmen zum Wechseln","Bilderrahmen zum Aufklappen"]],
    nfc: [["🏷️","NFC-Karten","NFC Karten NTAG215"],["🧲","NFC-Magnete für den Kühlschrank","NFC Tag Magnet"],["🪙","NFC-Münzen","NFC Münze NTAG215"],["📿","NFC-Armband","NFC Armband NTAG215"]]
  };
  Object.keys(moreTips2).forEach((k) => { const have = D.tips[k] || (D.tips[k] = []); moreTips2[k].forEach((t) => { if (!have.some((h) => h.q === t[2])) have.push({ icon: t[0], title: t[1], q: t[2] }); }); });
  /* Karten: weitere Suchbegriffe je Karte, die App wechselt wöchentlich */
  const moreCardTips = {"bock":{"spazieren":["Regenschirm groß Paar","Partnerhandschuhe"],"kochen":["Schürze Paar Set","Gewürze Geschenkset"],"serie":["Popcornmaschine","Sofatablett"],"spiele":["Kartenspiel für 2","Kooperatives Spiel 2 Personen"],"sport":["Trinkflasche Sport","Fitnessbänder Set"],"freunde":["Kartenspiel Party","Snackschalen Set"],"kuscheln":["Kuscheldecke XXL Paar","Wärmflasche Plüsch"],"natur":["Picknickkorb für 2","Fernglas kompakt"],"kino":["Popcorn Becher Set","Mini Beamer"],"wellness":["Badekugeln Set","Duftkerzen Set"],"musik":["Ohrstöpsel Konzert","Bluetooth Lautsprecher klein"],"bar":["Weingläser Set 2","Cocktailbuch"],"kreativ":["Aquarell Set Anfänger","Bastelset Erwachsene"],"fruehstueck":["Waffeleisen Herz","Eierbecher Set 2"],"lesen":["Lesezeichen Set","Lesekissen"],"massage":["Massagekerze","Hot Stone Massage Set"],"tanzen":["Paartanz lernen Buch","Discokugel LED klein"],"puzzle":["Puzzlematte","Rätselbuch Erwachsene"],"sauna":["Sauna Aufguss Set","Bademantel Paar Set"],"grillen":["Grillbesteck Set","Feuerschale klein"],"backen":["Ausstechformen Set","Backmatte Silikon"],"fotos":["Sofortbildkamera","Bilderrahmen Collage Paar"],"ausschlafen":["Verdunklungsvorhang","Frühstückstablett Bett"],"fruehsex":["Massageöl Paar","LED Kerzen Timer"]}};
  D.decks.forEach((deck) => { const m = moreCardTips[deck.id]; if (!m) return; deck.items.forEach((it) => { if (it.tip && m[it.id]) it.tip = [].concat(it.tip, m[it.id]); }); });
})();
