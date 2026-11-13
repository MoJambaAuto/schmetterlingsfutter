# Schmetterlingsfutter – Beziehungspflege für Paare

Kostenlose Web-App (PWA) von MoJamba: Futter für die Schmetterlinge im Bauch – jeden Tag.
Live: https://app.schmetterlingsfutter.de/ (alte Adresse https://mojambaauto.github.io/schmetterlingsfutter/ bleibt für die Play-App und zieht Browser-Nutzer per `js/umzug.js` + `umzug.html` um) · Datenschutz & Impressum: `privacy.html`

Dieses Repository ist die veröffentlichte Fassung (GitHub Pages, Branch `main`, Ordner `/`).
Konzept, Store-Texte, Veröffentlichungsplan und Store-Grafiken liegen im privaten Vault-Repo
`MoJambaAuto/mojamba-vault` unter `Apps/schmetterlingsfutter/`.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html`, `css/`, `js/data.js`, `js/app.js`, `js/features.js` | App-Oberfläche, Inhalte, Grundfunktionen, Zusatzmodule |
| `js/partner.js` | Partner-Verbindung (verschlüsselt), Gleichklang-Spiele, „Passend dazu“-Produkttipps |
| `js/data2.js`, `js/naehe.js` | Version 3.1: Klartext (Wetterbericht, Unausgesprochen, Sag’s sanft, Zwiegespräch, Weiße Fahne, Gesprächskarten), Jingle-Box, Kritzel-Gruß, Nah dran (QR, Liebes-Link, NFC-Sticker) |
| `js/vendor/qrcode.js` | QR-Code-Erzeugung (Kazuhiko Arase, MIT-Lizenz) |
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

## Jingle-Box

`js/data2.js` → `jingleCats` (16 Anlässe) und `jingles`. Ein Jingle ist entweder eine Notenfolge, die die App selbst erzeugt
(`notes`, `bpm`, `timbre`), oder später eine fertige Aufnahme (`file: 'audio/jingles/<kategorie>/<id>.mp3'`). Verschickt wird nur die
Kennung; die Partner-App spielt den Jingle aus dem eigenen Bestand. Melodien: Eigenkompositionen oder gemeinfreie Werke (Feld `pd`).
