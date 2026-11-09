# Schmetterlingsfutter-Relay (Partner-Verbindung)

Kleiner Dienst auf Cloudflare Workers + D1 (kostenloser Tarif reicht: 100 000 Anfragen/Tag).
Er verbindet die Apps zweier Partner. Er sieht **keine Inhalte**:

- Match-Spiele („Gleichklang“): Jede App schickt nur HMAC-Hashes ihrer Ja-Antworten. Den Schlüssel kennen nur die beiden Apps (er steckt im Paar-Code, den der Dienst nie erhält). Der Dienst gibt nur die Hashes zurück, die **beide** geschickt haben. Was nur einer angekreuzt hat, bleibt geheim – auch vor dem Partner.
- Nachrichten (Botschaften, Gutscheine, Einladungen): Ende-zu-Ende verschlüsselt (AES-GCM), der Dienst lagert sie nur zwischen, bis die Partner-App sie abgeholt hat (spätestens 30 Tage).
- Paare ohne zweites Gerät werden nach 48 Stunden gelöscht, unbenutzte Paare nach 180 Tagen. „Verbindung trennen“ in der App löscht sofort alles.

## Einmalig veröffentlichen (Mo oder Claude mit Mos Cloudflare-Konto)

1. Kostenloses Konto auf https://dash.cloudflare.com anlegen (E-Mail reicht, keine Zahlungsdaten).
2. Im Ordner `relay/` einmal anmelden (öffnet den Browser, kein Passwort im Terminal):
   ```bash
   npx wrangler login
   ```
3. Datenbank anlegen (Standort Westeuropa) und die ausgegebene `database_id` in `wrangler.jsonc` eintragen:
   ```bash
   npx wrangler d1 create schmetterlingsfutter --location weur
   ```
4. Tabellen anlegen und veröffentlichen:
   ```bash
   npx wrangler d1 migrations apply schmetterlingsfutter --remote
   npx wrangler deploy
   ```
5. Die ausgegebene Adresse (z. B. `https://schmetterlingsfutter-relay.<konto>.workers.dev`) in `js/data.js` bei `relayUrl` eintragen, App neu veröffentlichen.

## Lokal testen

```bash
cd relay
npx wrangler d1 migrations apply schmetterlingsfutter --local
npx wrangler dev --port 8787
```
Die App nutzt automatisch `http://localhost:8787`, wenn sie selbst von `localhost`/`127.0.0.1` geladen wird.

## Schnittstelle (alles POST mit JSON)

| Pfad | Zweck |
|---|---|
| `/pair/new` `{dev}` | Paar anlegen → `{pair, token}` |
| `/pair/join` `{pair, dev}` | Zweites Gerät → `{token}` |
| `/status` | `{joined, inbox, decks}` |
| `/match/put` `{deck, hashes[]}` | eigene Hashes ablegen (ersetzt) |
| `/match/get` `{deck}` | `{mine, partner, matches[]}` – nur Schnittmenge |
| `/match/clear` `{deck}` | eigene Antworten löschen |
| `/msg/send` `{body}` | verschlüsselte Nachricht an den Partner |
| `/msg/pull` / `/msg/ack {ids[]}` | abholen / als gelesen löschen |
| `/pair/leave` | Paar samt Daten löschen |

Alle Aufrufe außer `/pair/*` brauchen `pair`, `dev`, `token`.
