-- Mitteilungen aufs Handy: je Gerät die Push-Adresse des Browsers. Wird beim Ausschalten und beim Trennen gelöscht.
CREATE TABLE IF NOT EXISTS push_subs (
  pair_id TEXT NOT NULL,
  dev TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  updated INTEGER NOT NULL,
  last_push INTEGER NOT NULL DEFAULT 0,   -- Bremse: höchstens ein Push alle paar Sekunden
  PRIMARY KEY (pair_id, dev)
);
