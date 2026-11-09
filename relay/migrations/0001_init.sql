-- Schmetterlingsfutter-Relay: Tabellen
CREATE TABLE IF NOT EXISTS pairs (
  id TEXT PRIMARY KEY,
  created INTEGER NOT NULL,
  a_dev TEXT NOT NULL,
  a_tok TEXT NOT NULL,
  b_dev TEXT,
  b_tok TEXT,
  last_seen INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS answers (
  pair_id TEXT NOT NULL,
  dev TEXT NOT NULL,
  deck TEXT NOT NULL,
  hashes TEXT NOT NULL,
  updated INTEGER NOT NULL,
  PRIMARY KEY (pair_id, dev, deck)
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair_id TEXT NOT NULL,
  to_dev TEXT NOT NULL,
  body TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages (pair_id, to_dev, id);
CREATE INDEX IF NOT EXISTS idx_pairs_seen ON pairs (last_seen);
