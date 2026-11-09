# Schmetterlingsfutter – Beziehungspflege für Paare

Kostenlose Web-App (PWA) von MoJamba: Futter für die Schmetterlinge im Bauch – jeden Tag.
Live: https://mojambaauto.github.io/schmetterlingsfutter/ · Datenschutz & Impressum: `privacy.html`

Dieses Repository ist die veröffentlichte Fassung (GitHub Pages, Branch `main`, Ordner `/`).
Konzept, Store-Texte, Veröffentlichungsplan und Store-Grafiken liegen im privaten Vault-Repo
`MoJambaAuto/mojamba-vault` unter `Apps/schmetterlingsfutter/`.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html`, `css/`, `js/data.js`, `js/app.js`, `js/features.js` | App-Oberfläche, Inhalte, Grundfunktionen, Zusatzmodule |
| `js/partner.js` | Partner-Verbindung (verschlüsselt), Gleichklang-Spiele, „Passend dazu“-Produkttipps |
| `sw.js`, `manifest.webmanifest`, `icons/`, `fonts/` | Offline-Betrieb, Installierbarkeit |
| `relay/` | Vermittlungsdienst für die Partner-Verbindung (Cloudflare Worker + D1), siehe `relay/README.md` |

## Einstellungen für den Betreiber (`js/data.js`)

- `relayUrl`: Adresse des veröffentlichten Relay-Workers. Leer = Partner-Verbindung aus (Spiele laufen dann im Modus „Handy weitergeben“).
- `affiliateTag`: Amazon-PartnerNet-Tracking-ID von MoJamba. Leer = Suchlinks ohne Kennung.

## Lokal testen

```bash
python -m http.server 8000           # App unter http://localhost:8000
cd relay && npx wrangler d1 migrations apply schmetterlingsfutter --local && npx wrangler dev --port 8787
```
Zwei „Handys“ simulieren: `http://localhost:8000` und `http://127.0.0.1:8000` haben getrennte Speicher.
