-- Anonyme Nutzungs-Zähler (nur mit Zustimmung in der App). Keine Paar-, Geräte- oder Personen-Kennung, keine Uhrzeit:
-- je Tag und App-Version nur „wie oft ist X passiert“. Wird nach 400 Tagen gelöscht.
CREATE TABLE IF NOT EXISTS stats (
  day TEXT NOT NULL,
  ver TEXT NOT NULL,
  k TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, ver, k)
);
-- Suchbegriffe (eigene Amazon-Suche, „Frag Papillon“ ohne Treffer), bereinigt, nur gezählt
CREATE TABLE IF NOT EXISTS stats_q (
  day TEXT NOT NULL,
  src TEXT NOT NULL,
  term TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, src, term)
);
-- Missbrauchsschutz: gekürzte Prüfsumme aus Tag und IP-Adresse, wird am Folgetag gelöscht
CREATE TABLE IF NOT EXISTS stats_rate (
  day TEXT NOT NULL,
  who TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, who)
);
