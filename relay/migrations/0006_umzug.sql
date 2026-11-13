-- Umzug auf die neue Adresse (app.schmetterlingsfutter.de): Die App legt ihren Speicher VERSCHLÜSSELT ab
-- (Schlüssel bleibt im Link-Anker, den der Dienst nie sieht), die neue Adresse holt ihn ab und meldet „fertig“.
-- Teile werden nach dem Abholen sofort, spätestens nach 48 Stunden gelöscht; die Kennung allein bleibt 60 Tage.
CREATE TABLE IF NOT EXISTS umzug (
  id TEXT NOT NULL,
  part INTEGER NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (id, part)
);
CREATE TABLE IF NOT EXISTS umzug_meta (
  id TEXT PRIMARY KEY,
  parts INTEGER NOT NULL,
  created INTEGER NOT NULL,
  day TEXT NOT NULL,
  taken INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS umzug_meta_day ON umzug_meta (day);
