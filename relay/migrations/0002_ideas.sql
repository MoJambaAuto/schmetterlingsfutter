-- Idee spenden: freiwillig eingesandte Vorschläge, ohne Paar- oder Geräte-Kennung
CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,            -- nur das Datum, keine Uhrzeit
  kind TEXT NOT NULL,           -- frage | date | botschaft | piek | thema | sonstiges
  text TEXT NOT NULL,
  adult INTEGER NOT NULL DEFAULT 0,
  app TEXT,                     -- App-Version
  status TEXT NOT NULL DEFAULT 'neu'
);
-- Missbrauchsschutz: gekürzte Prüfsumme aus Tag und IP-Adresse, wird am Folgetag gelöscht
CREATE TABLE IF NOT EXISTS idea_rate (
  day TEXT NOT NULL,
  who TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, who)
);
