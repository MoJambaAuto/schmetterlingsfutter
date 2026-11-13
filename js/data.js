/* Schmetterlingsfutter – Inhalte
   Platzhalter: {s} = Absender-Kosename (z. B. Hase), {r} = Empfänger-Kosename (z. B. Darling)
   Alle Botschaften sind in der Ich-Form geschrieben, damit sie für jede Namens- und
   Geschlechterkombination passen. */
window.LUZIFER_DATA = {
  version: '3.0.0',

  /* ---- Partner-Verbindung: Adresse des Relay-Dienstes (relay/README.md). Leer = Funktion aus.
     Bei lokalem Start (localhost/127.0.0.1) nimmt die App http://localhost:8787 – außer localStorage 'sf.relay' steht auf 'prod'. ---- */
  relayUrl: 'https://schmetterlingsfutter-relay.mojamba-automation.workers.dev',

  /* ---- Amazon-Partnerkennung von MoJamba (PartnerNet → Tracking-ID). Leer = Suchlinks ohne Kennung. ---- */
  affiliateTag: 'schmetterlingsfutter-21',
  /* Kennung auch an Vorschlägen im 18+-Bereich anhängen? Aus = dort normale Suchlinks ohne Kennung. */
  affiliateAdult: false,
  /* ---- Awin (Publisher-ID von MoJamba) und Shop für Vorschläge im 18+-Bereich (3.38.0: Orion, Awin-Programm 11661, zugelassen 12.11.2026) ---- */
  awinAffId: '3152437',
  adultShop: { name: 'Orion', mid: 11661, search: 'https://www.orion.de/katalog?searchterm=' },

  messages: [
    "{r}, du bist das Schönste, das mir je passiert ist.",
    "Wenn ich dich ansehe, weiß ich: genau hier gehöre ich hin.",
    "Dein Lächeln macht meinen ganzen Tag besser, {r}.",
    "Mit dir fühlt sich jeder Augenblick wie Zuhause an.",
    "Ich liebe dich mehr, als Worte je sagen könnten.",
    "Jeder Tag an deiner Seite ist mein liebster Tag.",
    "Du bist mein größtes Abenteuer und mein sicherer Hafen.",
    "{r}, ich würde mich immer wieder in dich verlieben.",
    "Du machst mich jeden Tag zu einem besseren Menschen.",
    "Ich trage dich für immer in meinem Herzen, {r}. ❤",
    "Heute schon gesagt? Ich liebe dich. Jetzt ja.",
    "Du bist der Grund, warum ich morgens lächle.",
    "Egal wie der Tag war: Bei dir wird alles leicht.",
    "Ich denke gerade an dich. Wie eigentlich immer.",
    "Deine Hand in meiner – mehr brauche ich nicht.",
    "Du bist mein Lieblingsmensch. Punkt.",
    "Wenn ich einen Wunsch frei hätte, würde ich mir dich noch einmal wünschen.",
    "Mit dir ist selbst Nichtstun das Schönste auf der Welt.",
    "Ich liebe, wie du lachst, wenn du denkst, niemand hört zu.",
    "Du bist mein Glücksfall, {r}.",
    "Zwischen all den Menschen auf der Welt hat mein Herz dich gewählt.",
    "Ich bin so dankbar, dass es dich gibt.",
    "Du bist nicht perfekt. Du bist viel besser: Du bist du.",
    "Wenn du zweifelst, denk daran: Ich glaube an dich. Immer.",
    "Du bist mein Zuhause, egal wo wir gerade sind.",
    "Mein Herz schlägt ein bisschen schneller, wenn du den Raum betrittst.",
    "Ich liebe dich an guten Tagen. Und an schlechten noch mehr.",
    "Du bist der schönste Gedanke, den ich jeden Tag habe.",
    "Mit dir will ich alt werden und trotzdem albern bleiben.",
    "Danke, dass du mich so liebst, wie ich bin.",
    "Du bist das Beste an jedem einzelnen Tag.",
    "Wenn ich dich halte, ist die Welt für einen Moment still.",
    "Ich liebe deine Art, die Dinge zu sehen. Und deine Art, mich zu sehen.",
    "Du bist mein Sonnenschein, auch wenn es regnet.",
    "Ich würde tausend Umwege gehen, wenn sie alle zu dir führen.",
    "Ein Tag ohne dich ist nur ein halber Tag.",
    "Du bist meine liebste Gewohnheit.",
    "Ich mag dich. Sehr. Also richtig sehr. Also: Ich liebe dich.",
    "Mit dir ist jeder gewöhnliche Moment ein kleines Wunder.",
    "Du hast mein Herz. Pass gut darauf auf. Ich weiß, das tust du.",
    "Du bist mein Grund, nach Hause zu kommen.",
    "Ich liebe es, wie du mich ansiehst, wenn du denkst, ich merke es nicht.",
    "Es gibt nichts, was ich an dir ändern würde. Nur näher sein will ich.",
    "Mit dir kann ich alles sein. Vor allem glücklich.",
    "Du bist mein Lieblingsort auf dieser Welt.",
    "Egal was kommt: Wir zwei schaffen das.",
    "Du bist die Antwort auf Fragen, die ich mir nie zu stellen traute.",
    "Du bist schön. Und dein Herz ist noch schöner.",
    "Ich liebe dich heute mehr als gestern. Und morgen noch mehr.",
    "Für dich wäre ich gerne mutiger, geduldiger, besser. Und mit dir bin ich es.",
    "Ich habe mein Glück gefunden. Es heißt {r}.",
    "Du bist der Mensch, mit dem ich jedes Geheimnis teilen will.",
    "Wenn du traurig bist, bin ich da. Wenn du lachst, lache ich mit.",
    "Ich liebe deine Stimme, wenn du morgens noch halb schläfst.",
    "Du bist der beste Teil von mir.",
    "Meine Lieblingszeit? Jede Minute mit dir.",
    "Dich zu lieben ist das Leichteste, was ich je getan habe.",
    "Ich verspreche dir: Ich bleibe. Heute, morgen, immer.",
    "Du bist mein Zuhause, mein Abenteuer, mein ganzes Herz.",
    "Ich liebe dich, {r}. Einfach so. Für immer."
  ],

  reasons: [
    "Wie du mich anlachst – nur für mich",
    "Deine Wärme, die alles um dich herum erhellt",
    "Dass du mich siehst, wie ich wirklich bin",
    "Deine Stärke, auch in schwierigen Momenten",
    "Dein Humor, der mich jeden Tag zum Lachen bringt",
    "Wie du mir zuhörst, als wäre nichts anderes wichtig",
    "Deine Hände, die immer genau richtig sind",
    "Dass du nie aufgibst – nicht bei dir, nicht bei uns",
    "Dein Mut, Dinge anders zu machen",
    "Wie du Fremde zu Freunden machst",
    "Deine Stimme, wenn du leise mit mir sprichst",
    "Dass du an mich glaubst, wenn ich es nicht tue",
    "Einfach alles, was du bist – du bist perfekt für mich"
  ],

  kisses: [
    "💋 Dieser Kuss ist nur für dich, {r} – für immer.",
    "💋 1000 Küsse unterwegs zu dir, alle mit Liebe verpackt.",
    "💋 Ein Kuss auf die Stirn, einer auf die Nase, einer auf den Mund.",
    "💋 Halt kurz still … da! Hast du ihn gespürt?",
    "💋 Mein Lieblingsort für einen Kuss? Überall bei dir.",
    "💋 Ein Kuss für jeden Tag, den ich dich vermisse. Das sind viele."
  ],

  hugs: [
    "🤗 Ich drücke dich so fest, bis du lächelst, {r}.",
    "🤗 Stell dir vor, ich halte dich jetzt ganz fest – weil ich es so möchte.",
    "🤗 Komm her. Hier ist dein Platz. Direkt an meinem Herzen.",
    "🤗 Eine Umarmung, die genau so lange dauert, wie du sie brauchst.",
    "🤗 Augen zu. Tief atmen. Ich bin da.",
    "🤗 Kuscheln ist meine liebste Sprache. Und ich habe dir viel zu sagen."
  ],

  goodnight: [
    "🌙 Schlaf gut, {r}. Ich bin in deinen Träumen – und morgen wieder da.",
    "🌙 Die Sterne sind heute nur für dich da. Gute Nacht, mein Herz.",
    "🌙 Träum süß. Ich träume von dir.",
    "🌙 Augen zu, Herz auf: Ich liebe dich. Gute Nacht."
  ],

  goodmorning: [
    "☀️ Guten Morgen, {r}! Der Tag ist schön, weil es dich gibt.",
    "☀️ Aufwachen, Lieblingsmensch. Die Welt braucht dein Lächeln.",
    "☀️ Erster Gedanke heute: du. Wie jeden Morgen.",
    "☀️ Guten Morgen! Ich schicke dir Kaffee, Sonne und einen Kuss."
  ],

  coupons: [
    { icon: "💆", title: "Eine Massage", desc: "20 Minuten, mit Öl und ohne Ausreden." },
    { icon: "🍳", title: "Frühstück ans Bett", desc: "Alles, was du magst. Ich stehe früher auf." },
    { icon: "🎬", title: "Filmabend nach deiner Wahl", desc: "Du suchst aus. Ich sage kein Wort dazu." },
    { icon: "🍝", title: "Ein Abendessen, gekocht von mir", desc: "Drei Gänge, Kerzen inklusive." },
    { icon: "🧹", title: "Ein Hausputz-Tag", desc: "Du legst die Füße hoch. Ich mache den Rest." },
    { icon: "🚶", title: "Ein langer Spaziergang", desc: "Hand in Hand, Handy bleibt in der Tasche." },
    { icon: "🛁", title: "Ein Wellness-Abend zu Hause", desc: "Bad, Musik, Tee – und ich kümmere mich um alles." },
    { icon: "🎁", title: "Eine kleine Überraschung", desc: "Ich denke mir etwas aus. Du freust dich." },
    { icon: "🧡", title: "Ein ganzer Tag nur für uns", desc: "Keine Termine, keine Pflichten. Nur wir zwei." },
    { icon: "🎧", title: "Deine Playlist, mein Mitsingen", desc: "Ich singe mit. Egal wie schief." },
    { icon: "🛌", title: "Ausschlafen-Gutschein", desc: "Ich übernehme den Morgen. Du schläfst, so lange du willst." },
    { icon: "✨", title: "Ein Wunsch frei", desc: "Innerhalb des Möglichen. Und ein bisschen darüber hinaus." }
  ],


  /* ---- Spruch-Generator: Anfang + Mitte + Schluss werden zufällig kombiniert ---- */
  gen: {
    openers: [
      "{r}, mal ehrlich:", "Kleine Erinnerung von Papillon:", "Falls du es heute noch nicht gehört hast:", "Psst, {r} –", "Nur damit du es weißt:",
      "Ich hab nachgedacht, und:", "Ohne Umschweife:", "Zwischen Kaffee und Chaos:", "Papillon flüstert:", "Offizielle Mitteilung:"
    ],
    cores: [
      "du bist mein Lieblingsgrund zu lächeln", "mit dir ist sogar Montag ein Date", "ich würde dich jedes Mal wieder wählen", "du bist mein liebster Mensch auf diesem Planeten",
      "dein Lachen ist mein Lieblingssound", "ich bin verrückt nach dir – im besten Sinne", "neben dir ist mein Lieblingsplatz", "du machst mein Herz hibbelig",
      "ich liebe dich mehr als Schokolade, und das will was heißen", "du bist mein Zuhause mit Pulsschlag", "ich denke öfter an dich, als ich zugebe", "du bist der beste Teil meines Tages"
    ],
    closers: [
      "Punkt.", "Und jetzt küss mich.", "Heute, morgen, immer.", "Kein Widerspruch erlaubt.", "Das ist Fakt.", "Und zwar jeden Tag ein bisschen mehr.",
      "Ehrlich.", "Unterschrift: {s} ❤", "Bis gleich, Schatz.", "Flügel-Ehrenwort. 🦋"
    ]
  },

  /* ---- Anlässe (feste Termine; Jahrestag und Geburtstag kommen aus den Einstellungen) ---- */
  occasions: [
    { id: "valentin", title: "Valentinstag", month: 2, day: 14, icon: "💘" },
    { id: "muttertag", title: "Muttertag", special: "muttertag", icon: "🌷" },
    { id: "kuss", title: "Tag des Kusses", month: 7, day: 6, icon: "💋" },
    { id: "nikolaus", title: "Nikolaus", month: 12, day: 6, icon: "🎅" },
    { id: "weihnachten", title: "Weihnachten", month: 12, day: 24, icon: "🎄" },
    { id: "silvester", title: "Silvester", month: 12, day: 31, icon: "🎆" }
  ],

  /* ---- Geschenkideen je Anlass: Suchbegriffe für die Amazon-Suche ---- */
  gifts: {
    default: [
      { icon: "💐", title: "Blumen oder Pflanze", q: "Blumenstrauß Geschenk" },
      { icon: "💍", title: "Schmuck mit Gravur", q: "Schmuck Gravur personalisiert Partner" },
      { icon: "🎟️", title: "Erlebnis für zwei", q: "Erlebnisgutschein für zwei" },
      { icon: "📖", title: "Fotobuch eurer Zeit", q: "Fotobuch Gutschein" },
      { icon: "🕯️", title: "Wellness zu Hause", q: "Wellness Set Paar Massageöl Kerzen" },
      { icon: "🎁", title: "Persönliches Geschenk", q: "personalisiertes Geschenk Paar" }
    ],
    valentin: [
      { icon: "🍫", title: "Pralinen & Herzen", q: "Pralinen Valentinstag Geschenk" },
      { icon: "💌", title: "Liebesbrief-Set", q: "Liebesbriefe Set Geschenk Partner" },
      { icon: "🧩", title: "Paar-Spiel", q: "Spiel für Paare Fragen" }
    ],
    weihnachten: [
      { icon: "🧣", title: "Kuscheliges", q: "Kuscheldecke Paar Geschenk" },
      { icon: "🎄", title: "Adventskalender für zwei", q: "Adventskalender Paare" }
    ],
    geburtstag: [
      { icon: "🎂", title: "Lieblingsding aus dem Wunschsammler", q: "" },
      { icon: "🎫", title: "Konzert oder Show", q: "Konzertkarten Geschenk" }
    ],
    jahrestag: [
      { icon: "🗺️", title: "Kurztrip zu zweit", q: "Kurzurlaub Gutschein Paar" },
      { icon: "🖼️", title: "Sternenhimmel-Poster eures Datums", q: "Sternenhimmel Poster personalisiert Datum" }
    ]
  },

  /* ---- Liebeslied-Pad: 12 Töne, pentatonisch (es kann nichts schief klingen) ---- */
  pad: [
    { n: "C4", f: 261.63, e: "💗" }, { n: "D4", f: 293.66, e: "💓" }, { n: "E4", f: 329.63, e: "💞" },
    { n: "G4", f: 392.00, e: "💕" }, { n: "A4", f: 440.00, e: "💖" }, { n: "C5", f: 523.25, e: "❤️" },
    { n: "D5", f: 587.33, e: "🧡" }, { n: "E5", f: 659.25, e: "💛" }, { n: "G5", f: 783.99, e: "💚" },
    { n: "A5", f: 880.00, e: "💙" }, { n: "C6", f: 1046.50, e: "💜" }, { n: "D6", f: 1174.66, e: "✨" }
  ],

  /* ---- Zweisamkeit (Erwachsene; Platzhalter-Inhalte, werden mit dem Recherche-Konzept ausgebaut) ---- */
  intim: {
    flirt: [
      "😏 Ich habe heute den ganzen Tag an gestern Abend gedacht, {r}.",
      "😏 Heute Abend: du, ich, kein Handy. Ich habe Pläne.",
      "😏 Zieh dir was Bequemes an. Oder auch nicht.",
      "😏 Ich vermisse deine Hände. Komm bald heim.",
      "😏 Du siehst heute morgen verboten gut aus. Nur damit du es weißt.",
      "😏 Papillon sagt: Heute wird gekuschelt, bis jemand von uns einschläft. Oder nicht einschläft.",
      "😏 Ich habe Kerzen gekauft. Den Rest überlasse ich deiner Fantasie.",
      "😏 Drei Worte: Ich. Will. Dich."
    ],
    questions: [
      "Wann hast du dich zuletzt von mir richtig begehrt gefühlt?",
      "Was wünschst du dir von mir öfter – und traust dich nicht zu sagen?",
      "Welcher Moment zwischen uns geht dir nicht aus dem Kopf?",
      "Wie sieht für dich der perfekte Abend zu zweit aus, Minute für Minute?",
      "Was macht dich an mir am meisten an?",
      "Gibt es etwas, das wir früher gemacht haben und das du vermisst?",
      "Was brauchst du, um dich fallen lassen zu können?",
      "Wenn wir ein Wochenende nur für uns hätten – wohin, und was passiert dort?",
      "Was war der beste Kuss, den wir je hatten?",
      "Wie zeige ich dir am besten, dass ich dich will – mit Worten, Händen oder Taten?",
      "Was möchtest du einmal mit mir ausprobieren?",
      "Wann fühlst du dich mir am nächsten?"
    ],
    dates: [
      "🕯️ Kerzen-Abend ohne Handys: Bereitet beide eine Überraschung für den anderen vor.",
      "🛁 Gemeinsames Bad mit Musik, danach gegenseitige Massage.",
      "🍓 Picknick im Wohnzimmer – auf dem Boden, mit Decke, Erdbeeren und Blickkontakt.",
      "💃 Langsam tanzen in der Küche zu eurem Lied. Mindestens drei Songs.",
      "✍️ Jeder schreibt dem anderen einen Brief über den ersten Kuss und liest ihn vor.",
      "🌙 Nachtspaziergang Hand in Hand, danach Kuscheln bis zum Einschlafen.",
      "🎲 Wunschzettel-Abend: Zieht abwechselnd einen Wunsch vom Wunschzettel für zwei.",
      "🍳 Zusammen kochen – einer kocht, der andere darf nur füttern."
    ]
  },


  /* ---- Piek des Tages: eine kleine, konkrete Aktion pro Tag (Gottman: „small things often“) ---- */
  pieks: [
    { c: "aufmerksamkeit", t: "Schreib {r} jetzt eine Nachricht mit einem konkreten Detail von heute. Kein Standardspruch." },
    { c: "aufmerksamkeit", t: "Mach heute ein Foto von {r}, wenn {r} es nicht merkt – und schick es mit einem Satz, was du daran liebst." },
    { c: "aufmerksamkeit", t: "Frag heute Abend: „Was war das Beste an deinem Tag?“ – und hör zu, ohne aufs Handy zu schauen." },
    { c: "aufmerksamkeit", t: "Bring {r} heute das Lieblingsgetränk, genau so, wie {r} es mag. Ohne zu fragen." },
    { c: "aufmerksamkeit", t: "Lob {r} heute vor anderen. Laut und ernst gemeint." },
    { c: "aufmerksamkeit", t: "Umarmung, mindestens 20 Sekunden. Heute. Ohne Anlass." },
    { c: "aufmerksamkeit", t: "Plane das nächste Date komplett selbst: Tag, Ort, Babysitter, Tisch. {r} muss nur Ja sagen." },
    { c: "aufmerksamkeit", t: "Erinnerst du dich, was {r} diese Woche beschäftigt hat? Frag heute nach, wie es ausging." },
    { c: "aufmerksamkeit", t: "Leg einen Zettel mit drei Worten dorthin, wo {r} ihn heute findet." },
    { c: "aufmerksamkeit", t: "Heute Handy weg beim Essen. Beide. Du fängst an." },
    { c: "aufmerksamkeit", t: "Sag {r} heute etwas, das du an {r} bewunderst – nicht am Aussehen." },
    { c: "aufmerksamkeit", t: "Küss {r} heute zur Begrüßung so, als hättet ihr euch eine Woche nicht gesehen." },
    { c: "unaufgefordert", t: "Heute ohne Ansage: Spülmaschine ausräumen oder Wäsche falten. Und kein Wort darüber." },
    { c: "unaufgefordert", t: "Übernimm heute einen Termin, der sonst bei {r} landet: Arzt, Schule, Werkstatt, Behörde." },
    { c: "unaufgefordert", t: "Mach heute den Einkauf – mit allem, was fehlt, ohne nachzufragen. Zettel am Kühlschrank zählt." },
    { c: "unaufgefordert", t: "Räum heute die eine Ecke auf, die {r} seit Wochen stört. Du weißt welche." },
    { c: "unaufgefordert", t: "Koch heute Abend. Komplett: einkaufen, kochen, aufräumen." },
    { c: "unaufgefordert", t: "Was steht nächste Woche an, das geplant werden muss? Plane es heute, bevor {r} dran denken muss." },
    { c: "unaufgefordert", t: "Tank das Auto voll oder lad das Rad auf – das, was {r} morgen braucht." },
    { c: "unaufgefordert", t: "Mach heute den Part, den {r} am wenigsten mag. Ohne Kommentar, ohne Dank erwarten." },
    { c: "dankbar", t: "Sag {r} heute konkret Danke für eine Sache, die {r} für euch gemacht hat. Mit „weil“." },
    { c: "dankbar", t: "Denk an etwas, das {r} letzte Woche gut gemacht hat, und erwähne es heute. Verspätet zählt doppelt." },
    { c: "dankbar", t: "Schreib heute Abend einen Satz in die Dankbarkeits-Notiz. Nur einen. Aber ehrlich." },
    { c: "frage", t: "Frag {r} heute: „Wovor hast du gerade am meisten Respekt?“ Und merk dir die Antwort." },
    { c: "frage", t: "Weißt du, wer {r} gerade am meisten nervt oder guttut? Frag nach – und trag es in die Love Map ein." },
    { c: "frage", t: "Frag {r}: „Was würdest du machen, wenn wir morgen frei hätten?“ Und dann: mach es möglich." },
    { c: "frage", t: "Frag heute nach einem Traum von {r}, über den ihr lange nicht gesprochen habt." },
    { c: "neu", t: "Schlag heute etwas vor, das ihr noch nie zusammen gemacht habt. Klein reicht: neues Café, neuer Weg." },
    { c: "neu", t: "Tanzt heute Abend zu einem Lied in der Küche. Egal wie. Ein Lied." },
    { c: "neu", t: "Such ein Rezept aus einem Land, in dem ihr noch nie wart, und kocht es am Wochenende." }
  ],
  piekCats: { aufmerksamkeit: "Aufmerksamkeit", unaufgefordert: "Unaufgefordert", dankbar: "Dankbarkeit", frage: "Zuhören", neu: "Etwas Neues" },

  /* ---- Love Map: Kategorien für Notizen über den Partner (Gottman: Love Maps) ---- */
  loveMapCats: [
    { id: "wunsch", label: "Wunsch", icon: "⭐" },
    { id: "lieblings", label: "Lieblingsding", icon: "💛" },
    { id: "groesse", label: "Größe / Maß", icon: "📏" },
    { id: "sorge", label: "Sorge", icon: "🌧️" },
    { id: "traum", label: "Traum / Ziel", icon: "🌠" },
    { id: "mensch", label: "Wichtiger Mensch", icon: "👥" },
    { id: "sonst", label: "Sonstiges", icon: "📝" }
  ],

  /* ---- Danke-Sprüche: {d} = konkretes Detail aus der Dankbarkeits-Notiz ---- */
  thanks: [
    "Danke, dass du heute {d}. Das war nicht selbstverständlich – und ich hab's gesehen.",
    "{r}, ich hab heute gemerkt: du hast {d}. Danke. Ehrlich.",
    "Kleine Sache, große Wirkung: du hast {d}. Ich bin froh, dass es dich gibt.",
    "Ohne großes Tamtam: Danke, dass du {d}. Ich weiß das zu schätzen."
  ],

  /* ---- Erlebnis-Ideen ohne Kaufen (Chan & Mogilner: Erlebnisse binden stärker als Dinge) ---- */
  experiences: [
    { icon: "🌅", title: "Sonnenaufgang mit Thermoskanne an eurem Lieblingsort" },
    { icon: "🍳", title: "Ein Abend, an dem du komplett kochst und bedienst" },
    { icon: "🚆", title: "Tagesausflug in eine Stadt, in der ihr noch nie wart" },
    { icon: "📸", title: "Fotospaziergang: jeder macht 10 Bilder vom anderen" },
    { icon: "✉️", title: "Ein handgeschriebener Brief – drei Seiten, keine Abkürzung" },
    { icon: "🎶", title: "Konzert oder offene Bühne, Überraschung bis zur Tür" }
  ],

  milestones: [
    { days: 100, label: "100 Tage" },
    { years: 1, label: "1 Jahr" },
    { days: 500, label: "500 Tage" },
    { years: 2, label: "2 Jahre" },
    { days: 1000, label: "1000 Tage" },
    { years: 3, label: "3 Jahre" },
    { years: 4, label: "4 Jahre" },
    { years: 5, label: "5 Jahre" },
    { days: 2000, label: "2000 Tage" },
    { years: 10, label: "10 Jahre" },
    { days: 5000, label: "5000 Tage" },
    { years: 20, label: "20 Jahre" },
    { years: 25, label: "25 Jahre" },
    { days: 10000, label: "10 000 Tage" }
  ],

  themes: [
    { id: "nacht", name: "Nachtrosé" },
    { id: "rose", name: "Rosenrot" },
    { id: "ozean", name: "Ozean" },
    { id: "sonne", name: "Sonnenaufgang" }
  ],

  emojis: ["🐰","🌸","🦊","🐻","🐱","🐶","🦋","🌙","⭐","🌻","🍀","🐧","🦄","🐼","🌹","🔥"],

  /* ---- Gleichklang: Match-Spiele. Beide antworten getrennt, sichtbar wird nur, was BEIDE wollen.
     opts: 2 = Ja/Nein, 3 = Ja/Vielleicht/Nein. tip = Suchbegriff für einen passenden Amazon-Vorschlag (Werbelink). ---- */
  decks: [
    { id: "bock", icon: "🎯", title: "Worauf habt ihr heute Bock?", sub: "Für heute. Tippt beide an, was ihr mögt – angezeigt wird nur, was ihr beide wollt.", daily: true, opts: 2, items: [
      { id: "spazieren", t: "Spaziergang", e: "🚶", tip: "Thermosbecher to go" },
      { id: "kochen", t: "Zusammen kochen", e: "🍳", tip: "Kochbuch für zwei" },
      { id: "serie", t: "Serienabend auf dem Sofa", e: "📺", tip: "Kuscheldecke XXL" },
      { id: "spiele", t: "Spieleabend", e: "🎲", tip: "Spiel für 2 Personen" },
      { id: "sport", t: "Bewegung: Sport, Rad, Joggen", e: "🏃", tip: "Fahrradtasche Picknick" },
      { id: "essen", t: "Essen gehen", e: "🍽️", tip: "" },
      { id: "freunde", t: "Freunde treffen", e: "👯", tip: "Partyspiel Erwachsene" },
      { id: "kuscheln", t: "Nichts tun & kuscheln", e: "🛋️", tip: "Kuschelkissen groß" },
      { id: "bummeln", t: "Bummeln & Shoppen", e: "🛍️", tip: "" },
      { id: "natur", t: "Ausflug ins Grüne", e: "🌳", tip: "Picknickdecke wasserdicht" },
      { id: "kino", t: "Kino", e: "🎬", tip: "Kinogutschein" },
      { id: "wellness", t: "Wellness & Badewanne", e: "🛁", tip: "Badezusatz Set Entspannung" },
      { id: "musik", t: "Konzert oder Live-Musik", e: "🎶", tip: "Konzertkarten Geschenk" },
      { id: "bar", t: "Cocktail- oder Weinabend", e: "🍸", tip: "Cocktail Set Zuhause" },
      { id: "kreativ", t: "Etwas Kreatives: malen, basteln, bauen", e: "🎨", tip: "Malen nach Zahlen Paar" },
      { id: "fruehstueck", t: "Ausgiebig frühstücken", e: "🥐", tip: "Frühstückstablett Bett" },
      { id: "lesen", t: "Nebeneinander lesen", e: "📚", tip: "Leselampe Buch" },
      { id: "massage", t: "Massage", e: "💆", tip: "Massageöl Paar" },
      { id: "tanzen", t: "Tanzen (auch in der Küche)", e: "💃", tip: "Bluetooth Lautsprecher klein" },
      { id: "puzzle", t: "Puzzle oder Rätsel", e: "🧩", tip: "Puzzle 1000 Teile Erwachsene" },
      { id: "flohmarkt", t: "Flohmarkt oder Markt", e: "🧺", tip: "" },
      { id: "sauna", t: "Sauna oder Therme", e: "🧖", tip: "Saunatuch Set" },
      { id: "museum", t: "Museum oder Ausstellung", e: "🖼️", tip: "" },
      { id: "grillen", t: "Grillen oder Lagerfeuer", e: "🔥", tip: "Tischgrill Balkon" },
      { id: "backen", t: "Backen", e: "🧁", tip: "Backbuch Paare" },
      { id: "fotos", t: "Fotos anschauen & Erinnerungen", e: "📸", tip: "Fotoalbum zum Selbstgestalten" },
      { id: "ausschlafen", t: "Ausschlafen & gar nichts planen", e: "😴", tip: "Schlafmaske Seide" },
      { id: "fruehsex", t: "Zeit nur für uns zwei im Schlafzimmer", e: "🔥", tip: "Massagekerze" }
    ] },
    { id: "dates", icon: "🕯️", title: "Date-Ideen für die nächsten Wochen", sub: "Größere Dinge. Was bei beiden Ja bekommt, wird geplant.", opts: 3, items: [
      { id: "kurztrip", t: "Kurztrip übers Wochenende", e: "🧳", tip: "Kurzurlaub Gutschein Paar" },
      { id: "kochkurs", t: "Kochkurs zu zweit", e: "👩‍🍳", tip: "Kochkurs Gutschein" },
      { id: "escape", t: "Escape Room", e: "🔐", tip: "Escape Room Spiel Zuhause" },
      { id: "klettern", t: "Kletterhalle oder Hochseilgarten", e: "🧗", tip: "" },
      { id: "tanzkurs", t: "Tanzkurs", e: "🕺", tip: "" },
      { id: "sterne", t: "Sterne gucken, Decke, Thermoskanne", e: "🌌", tip: "Sternenkarte drehbar" },
      { id: "therme", t: "Thermentag", e: "♨️", tip: "Bademantel Paar Set" },
      { id: "wein", t: "Weinprobe oder Brauereiführung", e: "🍷", tip: "Weinprobe Set Zuhause" },
      { id: "shooting", t: "Fotoshooting zu zweit", e: "📷", tip: "Fotoshooting Gutschein Paar" },
      { id: "wandern", t: "Wandertag mit Einkehr", e: "🥾", tip: "Wanderrucksack 20 Liter" },
      { id: "zoo", t: "Zoo oder Tierpark", e: "🦒", tip: "" },
      { id: "theater", t: "Theater, Musical, Comedy", e: "🎭", tip: "Musical Gutschein" },
      { id: "camping", t: "Eine Nacht im Zelt", e: "⛺", tip: "Zelt 2 Personen" },
      { id: "rallye", t: "Stadt-Rallye in der eigenen Stadt", e: "🗺️", tip: "Stadtrallye Box" },
      { id: "kanu", t: "Kanu, SUP oder Tretboot", e: "🛶", tip: "Dry Bag wasserdicht" },
      { id: "toepfern", t: "Töpfer- oder Malkurs", e: "🏺", tip: "Töpferset Anfänger" },
      { id: "marathon", t: "Film-Marathon zu Hause mit allem Drum und Dran", e: "🍿", tip: "Popcornmaschine" },
      { id: "brunch", t: "Langer Sonntagsbrunch auswärts", e: "🥂", tip: "" },
      { id: "hotel", t: "Eine Nacht im Hotel in der eigenen Stadt", e: "🏨", tip: "Hotelgutschein" },
      { id: "picknick", t: "Picknick mit allem, was dazugehört", e: "🧺", tip: "Picknickkorb für 2" },
      { id: "konzert", t: "Konzert einer Band, die jemand von uns liebt", e: "🎤", tip: "Konzertkarten Geschenk" },
      { id: "kochen_land", t: "Ein Land kochen, in dem wir noch nie waren", e: "🌍", tip: "Kochbuch Weltküche" }
    ] },
    { id: "vorlieben", icon: "🔥", title: "Vorlieben – nur für euch", sub: "Ihr antwortet getrennt. Ihr seht nur, was ihr beide wollt. Alles andere bleibt geheim – auch voreinander.", adult: true, opts: 3, items: [
      { id: "massage", t: "Ausgiebige Massage mit Öl", e: "💆", tip: "Massageöl erotisch Paar" },
      { id: "bad", t: "Gemeinsam baden bei Kerzenlicht", e: "🛁", tip: "Badezusatz Rosen Kerzen Set" },
      { id: "augenbinde", t: "Augenbinde – wer sie trägt, sieht nichts", e: "🕶️", tip: "Augenbinde Satin" },
      { id: "nachrichten", t: "Tagsüber anzügliche Nachrichten schicken", e: "📱", tip: "" },
      { id: "waesche", t: "Neue Wäsche oder Dessous füreinander", e: "👙", tip: "Dessous Set" },
      { id: "rollenspiel", t: "Rollenspiel: Fremde in einer Bar", e: "🎭", tip: "" },
      { id: "spiel", t: "Erotisches Spiel mit Aufgaben", e: "🎲", tip: "Erotik Spiel für Paare" },
      { id: "gleitgel", t: "Mehr Gleitgel ausprobieren", e: "💧", tip: "Gleitgel wasserbasiert" },
      { id: "toy", t: "Ein Toy zu zweit benutzen", e: "✨", tip: "Paar Vibrator" },
      { id: "federn", t: "Langsam: Federn, Fingerspitzen, Zeit", e: "🪶", tip: "Federkitzler Massage" },
      { id: "kerze", t: "Massagekerze mit warmem Öl", e: "🕯️", tip: "Massagekerze" },
      { id: "fesseln", t: "Sanftes Fesseln mit Seidentuch", e: "🎀", tip: "Bondage Set Anfänger Seide" },
      { id: "ort", t: "Ein anderer Ort als das Schlafzimmer", e: "🏠", tip: "" },
      { id: "hotel", t: "Eine Hotelnacht nur dafür", e: "🏨", tip: "Hotelgutschein" },
      { id: "langsam", t: "Ganz langsam, ohne Ziel – Tantra-Abend", e: "🧘", tip: "Tantra Massage Buch Paare" },
      { id: "strip", t: "Strip oder Tanz füreinander", e: "💃", tip: "" },
      { id: "dusche", t: "Zusammen duschen", e: "🚿", tip: "" },
      { id: "morgens", t: "Morgens statt abends", e: "🌅", tip: "" },
      { id: "vorlesen", t: "Erotische Geschichte vorlesen", e: "📖", tip: "Erotische Geschichten Buch Paare" },
      { id: "spiegel", t: "Vor dem Spiegel", e: "🪞", tip: "" },
      { id: "wuerfel", t: "Erotik-Würfel entscheiden lassen", e: "🎲", tip: "Erotik Würfel Paare" },
      { id: "temperatur", t: "Heiß und kalt: Eiswürfel, warmes Öl", e: "🧊", tip: "Massageöl wärmend" },
      { id: "wuensche", t: "Wünsche aufschreiben und ziehen", e: "📝", tip: "Wunschgläschen Paar" },
      { id: "talk", t: "Sagen, was gefällt – während es passiert", e: "💬", tip: "" },
      { id: "anal", t: "Analspiel – vorsichtig, mit viel Gleitgel", e: "🍑", tip: "Anal Gleitgel Einsteiger" },
      { id: "kurs", t: "Zusammen etwas Neues lernen (Buch, Kurs)", e: "🎓", tip: "Kamasutra Buch Paare" },
      { id: "fotos", t: "Fotos nur für uns (sicher aufbewahrt)", e: "📸", tip: "" },
      { id: "quickie", t: "Spontan, wenn es passt – ohne Plan", e: "⚡", tip: "" }
    ] }
  ],

  /* ---- Passend dazu: Produkt-Vorschläge je Funktion (Suchbegriffe für die Amazon-Suche, Werbelinks). ---- */
  tips: {
    kiss: [ { icon: "💄", title: "Lippenpflege-Set", q: "Lippenpflege Set Geschenk" }, { icon: "🍫", title: "Schokoküsse", q: "Schokolade Herz Geschenk" } ],
    hug: [ { icon: "🧸", title: "Kuscheldecke für zwei", q: "Kuscheldecke XXL Paar" }, { icon: "🕯️", title: "Duftkerze", q: "Duftkerze Geschenk" } ],
    morning: [ { icon: "☕", title: "Partner-Tassen", q: "Tassen Set Paar" }, { icon: "🥐", title: "Frühstück ans Bett", q: "Frühstückstablett Bett" } ],
    night: [ { icon: "🌙", title: "Sternenprojektor", q: "Sternenhimmel Projektor Schlafzimmer" }, { icon: "😴", title: "Schlafmaske aus Seide", q: "Schlafmaske Seide" } ],
    message: [ { icon: "💌", title: "Liebesbriefe-Set", q: "Liebesbriefe Set Geschenk Partner" }, { icon: "📔", title: "Paar-Tagebuch", q: "Paar Tagebuch Fragen" } ],
    reasons: [ { icon: "🫙", title: "Glas voller Gründe", q: "Gründe warum ich dich liebe Glas" }, { icon: "🎁", title: "Liebesgründe-Buch", q: "Was ich an dir liebe Buch zum Ausfüllen" } ],
    gen: [ { icon: "🃏", title: "Freche Partnerkarten", q: "Gutscheinbuch für Paare" }, { icon: "🧩", title: "Paar-Spiel", q: "Spiel für Paare Fragen" } ],
    oracle: [ { icon: "💐", title: "Blumen, die länger halten", q: "Infinity Rose Geschenk" }, { icon: "🌼", title: "Gänseblümchen-Schmuck", q: "Gänseblümchen Kette" } ],
    song: [ { icon: "🔊", title: "Kleine Box für eure Küche", q: "Bluetooth Lautsprecher klein" }, { icon: "🎵", title: "Spieluhr mit eurem Lied", q: "Spieluhr personalisiert" } ],
    time: [ { icon: "🖼️", title: "Sternenhimmel eures ersten Tages", q: "Sternenhimmel Poster personalisiert Datum" }, { icon: "📖", title: "Fotobuch eurer Zeit", q: "Fotobuch Gutschein" } ],
    milestone: [ { icon: "🥂", title: "Anstoßen", q: "Sektgläser Gravur Paar" }, { icon: "💍", title: "Schmuck mit Datum", q: "Schmuck Gravur Datum Partner" } ],
    thanks: [ { icon: "🍫", title: "Kleines Danke", q: "Danke Geschenk klein Schokolade" }, { icon: "🌷", title: "Blumen ohne Anlass", q: "Blumenstrauß Geschenk" } ],
    piek_aufmerksamkeit: [ { icon: "📝", title: "Zettel für Liebesnotizen", q: "Haftnotizen Herz Liebesbotschaft" }, { icon: "☕", title: "Lieblingsgetränk-Thermo", q: "Thermobecher Gravur" } ],
    piek_unaufgefordert: [ { icon: "🧺", title: "Etwas, das Haushalt leichter macht", q: "Haushaltshelfer Geschenk" }, { icon: "🍝", title: "Kochbuch für den Abend", q: "Kochbuch schnelle Gerichte für zwei" } ],
    piek_dankbar: [ { icon: "🙏", title: "Dankbarkeits-Tagebuch für Paare", q: "Dankbarkeitstagebuch Paare" }, { icon: "🍫", title: "Kleines Danke", q: "Danke Geschenk klein Schokolade" } ],
    piek_frage: [ { icon: "🃏", title: "Fragekarten für Paare", q: "Fragekarten Paare Gespräch" }, { icon: "📔", title: "Paar-Tagebuch", q: "Paar Tagebuch Fragen" } ],
    piek_neu: [ { icon: "🎟️", title: "Erlebnisbox für zwei", q: "Erlebnisbox für zwei" }, { icon: "🗺️", title: "Rubbelkarte für Ausflüge", q: "Rubbel Landkarte Deutschland Ausflüge" } ],
    wish: [ { icon: "⭐", title: "Direkt suchen", q: "" } ],
    lovemap: [ { icon: "📔", title: "Fragen-Buch über den Partner", q: "Fragen an meinen Partner Buch" }, { icon: "🃏", title: "Love-Map-Karten", q: "Paar Spiel Kennenlernen Fragen" } ],
    coupon: [ { icon: "🎟️", title: "Gutscheinheft für Paare", q: "Gutscheinbuch für Paare" }, { icon: "💆", title: "Massageöl", q: "Massageöl Paar" } ],
    coupon_massage: [ { icon: "💆", title: "Massageöl", q: "Massageöl Paar" }, { icon: "🕯️", title: "Massagekerze", q: "Massagekerze" } ],
    coupon_fruehstueck: [ { icon: "🥐", title: "Frühstückstablett", q: "Frühstückstablett Bett" }, { icon: "☕", title: "Partner-Tassen", q: "Tassen Set Paar" } ],
    coupon_film: [ { icon: "🍿", title: "Popcornmaschine", q: "Popcornmaschine" }, { icon: "🧣", title: "Kuscheldecke", q: "Kuscheldecke XXL Paar" } ],
    coupon_essen: [ { icon: "🕯️", title: "Kerzen für den Tisch", q: "Stabkerzen Set Kerzenhalter" }, { icon: "📖", title: "Kochbuch für zwei", q: "Kochbuch für zwei" } ],
    coupon_wellness: [ { icon: "🛁", title: "Badezusatz-Set", q: "Badezusatz Set Entspannung" }, { icon: "🧖", title: "Bademantel-Paar", q: "Bademantel Paar Set" } ],
    coupon_spaziergang: [ { icon: "☕", title: "Thermosbecher", q: "Thermosbecher to go" } ],
    coupon_tag: [ { icon: "🎟️", title: "Erlebnisgutschein", q: "Erlebnisgutschein für zwei" } ],
    coupon_ausschlafen: [ { icon: "😴", title: "Schlafmaske", q: "Schlafmaske Seide" } ],
    intim_flirt: [ { icon: "👙", title: "Etwas Neues zum Anziehen", q: "Dessous Set" }, { icon: "🕯️", title: "Massagekerze", q: "Massagekerze" } ],
    intim_question: [ { icon: "🃏", title: "Fragekarten für intime Gespräche", q: "Fragekarten Paare Intimität" }, { icon: "📖", title: "Buch über Lust in Beziehungen", q: "Buch Sexualität Paare Langzeitbeziehung" } ],
    intim_date: [ { icon: "💆", title: "Massageöl", q: "Massageöl erotisch Paar" }, { icon: "🎲", title: "Erotik-Spiel", q: "Erotik Spiel für Paare" } ],
    intim_wish: [ { icon: "📝", title: "Wunschgläschen", q: "Wunschgläschen Paar" }, { icon: "🎲", title: "Erotik-Würfel", q: "Erotik Würfel Paare" } ],
    match_bock: [ { icon: "🧺", title: "Picknickdecke", q: "Picknickdecke wasserdicht" }, { icon: "🎲", title: "Spiel für zwei", q: "Spiel für 2 Personen" } ],
    match_dates: [ { icon: "🎟️", title: "Erlebnisgutschein", q: "Erlebnisgutschein für zwei" }, { icon: "🧳", title: "Kurztrip-Gutschein", q: "Kurzurlaub Gutschein Paar" } ],
    match_vorlieben: [ { icon: "💧", title: "Gleitgel", q: "Gleitgel wasserbasiert" }, { icon: "💆", title: "Massageöl", q: "Massageöl erotisch Paar" } ],
    partner: [ { icon: "📱", title: "Ladekabel-Set für zwei", q: "Ladekabel Set 2er" }, { icon: "📔", title: "Paar-Tagebuch", q: "Paar Tagebuch Fragen" } ]
  }
};
