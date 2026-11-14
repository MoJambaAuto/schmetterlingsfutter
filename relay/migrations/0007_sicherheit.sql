-- Sicherheit (3.48.0): Beitritts-Nachweis je Paar. Neue Apps schicken beim Anlegen einen Wert, der aus dem geheimen Teil
-- des Paar-Codes abgeleitet ist (HKDF, eigener Zweck „join“); beim Beitritt muss derselbe Wert kommen.
-- So reicht die 6-stellige Paar-ID allein nicht mehr, um einem fremden Paar beizutreten. Alte Paare (ohne Wert) bleiben gültig.
ALTER TABLE pairs ADD COLUMN jt TEXT;
CREATE INDEX IF NOT EXISTS buehne_rate_kind ON buehne_rate (day, kind);
