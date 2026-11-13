-- Bühne (Open Mic, 3.40.0): öffentlich vorgetragene Gedichte der Nutzerinnen und Nutzer.
-- Keine Paar-, Geräte- oder Personen-Kennung. Wer schreibt, hat nur einen Künstlernamen und einen Schlüssel,
-- der im Gerät bleibt; der Dienst kennt davon nur eine Prüfsumme (zum eigenen Löschen und für „Autor ausblenden“).
CREATE TABLE IF NOT EXISTS poems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created INTEGER NOT NULL,          -- Millisekunden
  week TEXT NOT NULL,                -- ISO-Woche, z. B. 2026-W46 (für „Gedicht der Woche“)
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author TEXT NOT NULL,              -- Künstlername
  cat TEXT NOT NULL,                 -- liebe | sehnsucht | humor | anlass | trost | frei
  akey TEXT NOT NULL,                -- SHA-256 (gekürzt) des Autor-Schlüssels
  yt TEXT,                           -- optional: YouTube-Video-ID des eigenen Vortrags
  gift INTEGER NOT NULL DEFAULT 1,   -- andere dürfen es für private Geschenke nutzen (mit Namensnennung)
  shop INTEGER NOT NULL DEFAULT 0,   -- Autor ist offen für Produkte im Schmetterlingsfutter-Shop (mit Anteil, Anfrage je Werk)
  claps INTEGER NOT NULL DEFAULT 0,
  wings INTEGER NOT NULL DEFAULT 0,
  reports INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live', -- live | review (ausgeblendet bis zur Prüfung) | removed
  flag TEXT,                         -- Grund, warum es in die Prüfung ging
  offer TEXT                         -- Nachricht von uns an den Autor (z. B. Produkt-Anfrage), sichtbar unter „Meine Werke“
);
CREATE INDEX IF NOT EXISTS poems_status_created ON poems (status, created);
CREATE INDEX IF NOT EXISTS poems_week ON poems (week, status);
CREATE INDEX IF NOT EXISTS poems_akey ON poems (akey);

-- Applaus, Flügel und Meldungen: je Gedicht und Hörer-Prüfsumme höchstens einmal je Art
CREATE TABLE IF NOT EXISTS poem_votes (
  poem_id INTEGER NOT NULL,
  voter TEXT NOT NULL,               -- SHA-256 (gekürzt) des Hörer-Schlüssels
  kind TEXT NOT NULL,                -- clap | wing | report
  day TEXT NOT NULL,
  reason TEXT,
  PRIMARY KEY (poem_id, voter, kind)
);
CREATE INDEX IF NOT EXISTS poem_votes_day ON poem_votes (voter, kind, day);

-- Missbrauchsschutz: gekürzte Prüfsumme aus Tag und IP-Adresse, wird am Folgetag gelöscht
CREATE TABLE IF NOT EXISTS buehne_rate (
  day TEXT NOT NULL,
  who TEXT NOT NULL,
  kind TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, who, kind)
);
