// Auswertung „Anonym mithelfen“: liest die Tagessummen aus D1 und schreibt einen Bericht mit Hinweisen.
// Aufruf (im Ordner schmetterlingsfutter):
//   node relay/scripts/auswertung.mjs                 echter Dienst, letzte 28 Tage
//   node relay/scripts/auswertung.mjs --tage 7        anderer Zeitraum
//   node relay/scripts/auswertung.mjs --lokal         lokaler Testdienst
//   node relay/scripts/auswertung.mjs --out bericht.md
// Nur lesende Abfragen (SELECT). Ändert nichts.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const relay = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const local = process.argv.includes('--lokal');
const days = Math.max(1, Math.min(400, Number(arg('--tage')) || 28));
const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);

function q(sql) {
  if (!/^\s*SELECT\b/i.test(sql) || /"/.test(sql)) throw new Error('Nur einfache SELECT-Abfragen');
  const r = spawnSync('npx wrangler d1 execute schmetterlingsfutter ' + (local ? '--local' : '--remote') + ' --json --config wrangler.jsonc --command "' + sql + '"', { cwd: relay, encoding: 'utf8', shell: true, env: Object.assign({}, process.env, { CI: 'true' }) });
  const out = (r.stdout || '').trim(); const start = out.indexOf('[');
  if (r.status !== 0 || start < 0) throw new Error('Abfrage fehlgeschlagen: ' + ((r.stderr || out).split(/\r?\n/).slice(-3).join(' ')));
  const j = JSON.parse(out.slice(start)); return (j[0] && j[0].results) || [];
}

const rows = q("SELECT k, SUM(n) AS n FROM stats WHERE day >= '" + since + "' GROUP BY k");
const perDay = q("SELECT day, SUM(CASE WHEN k = 'app_day' THEN n ELSE 0 END) AS aktiv, SUM(CASE WHEN k = 'paired_day' THEN n ELSE 0 END) AS verbunden FROM stats WHERE day >= '" + since + "' GROUP BY day ORDER BY day");
const vers = q("SELECT ver, SUM(n) AS n FROM stats WHERE k = 'app_day' AND day >= '" + since + "' GROUP BY ver ORDER BY ver DESC");
const terms = q("SELECT src, term, SUM(n) AS n FROM stats_q WHERE day >= '" + since + "' GROUP BY src, term ORDER BY n DESC LIMIT 80");

const C = {}; rows.forEach((r) => { C[r.k] = r.n; });
const get = (k) => C[k] || 0;
const pre = (p) => Object.keys(C).filter((k) => k.startsWith(p)).map((k) => [k.slice(p.length), C[k]]).sort((a, b) => b[1] - a[1]);
const pct = (a, b) => (b ? Math.round(a / b * 100) + ' %' : '–');
const table = (head, list) => list.length ? '| ' + head.join(' | ') + ' |\n|' + head.map(() => '---').join('|') + '|\n' + list.map((r) => '| ' + r.join(' | ') + ' |').join('\n') + '\n' : '_keine Daten_\n';

const activeDays = perDay.reduce((s, r) => s + r.aktiv, 0), pairedDays = perDay.reduce((s, r) => s + r.verbunden, 0);
const hints = [];
let md = '# Schmetterlingsfutter – Auswertung „Anonym mithelfen“\n\nZeitraum: ab ' + since + ' (' + days + ' Tage), Quelle: ' + (local ? 'lokaler Testdienst' : 'echter Dienst') + '. Nur Summen, keine Personen.\n\n';

md += '## Nutzung\n\nAktive Geräte-Tage: **' + activeDays + '**, davon mit Partner-Verbindung: ' + pct(pairedDays, activeDays) + '.\n\n';
md += table(['Tag', 'aktive Geräte', 'verbunden'], perDay.map((r) => [r.day, r.aktiv, r.verbunden]));
md += '\nVersionen: ' + (vers.map((v) => v.ver + ' (' + v.n + ')').join(', ') || '–') + '\n\n';
if (activeDays && pairedDays / activeDays < 0.4) hints.push('Nur ' + pct(pairedDays, activeDays) + ' der Nutzungstage sind verbunden. Das Verbinden der Handys stärker bewerben (es schaltet die meisten Funktionen frei).');

md += '## Bereiche und Reiter\n\n' + table(['Bereich', 'Aufrufe'], pre('view:').concat(pre('sub:').map(([k, n]) => ['↳ ' + k, n])));

/* Kacheln: welche auf der Startseite fast nie angetippt werden */
const taps = pre('tap:'); md += '\n## Knöpfe und Kacheln\n\n' + table(['Knopf', 'Antipper'], taps.slice(0, 40));
try {
  const html = readFileSync(path.join(relay, '..', 'index.html'), 'utf8');
  const ids = Array.from(new Set((html.match(/id="btn[A-Z][A-Za-z0-9]*"/g) || []).map((x) => x.slice(7, -1).toLowerCase())));
  const totalTaps = taps.reduce((s, x) => s + x[1], 0);
  const never = ids.filter((id) => !get('tap:' + id));
  if (totalTaps >= 200 && never.length) hints.push('Nie angetippt (bei ' + totalTaps + ' Antippern insgesamt): ' + never.join(', ') + '. Schlecht zu finden oder uninteressant? Prüfen, ob umstellen, umbenennen oder streichen.');
} catch (e) {}

/* Spiele: geöffnet, fertig, abgebrochen */
const decks = new Set(pre('deck_open:').map((x) => x[0]).concat(pre('deck_done:').map((x) => x[0].split(':')[0])));
const deckRows = Array.from(decks).map((d) => {
  const open = get('deck_open:' + d), done = get('deck_done:' + d + ':relay') + get('deck_done:' + d + ':pass');
  const abort = pre('deck_abort:' + d + ':').reduce((s, x) => s + x[1], 0), short = get('deck_short:' + d), res = get('deck_result:' + d);
  if (open >= 10 && abort / open > 0.3) {
    const steps = pre('deck_abort:' + d + ':').map(([st, n]) => 'nach Frage ' + st + ': ' + n).join(', ');
    hints.push('„' + d + '“ wird oft abgebrochen (' + pct(abort, open) + ' von ' + open + ' Starts; ' + steps + '). Fragen kürzer oder spannender machen, Runde verkürzen?');
  }
  return [d, open, done, abort, short, res, pct(abort, open)];
}).sort((a, b) => b[1] - a[1]);
md += '\n## Spiele\n\n' + table(['Spiel', 'geöffnet', 'fertig', 'abgebrochen', '„reicht für heute“', 'Ergebnis gesehen', 'Abbruch'], deckRows);

/* Papillon fliegt vorbei */
const fly = pre('fly_show:').map(([k, n]) => [k, n, get('fly_go:' + k), get('fly_no:' + k), pct(get('fly_go:' + k), n)]);
md += '\n## Papillon fliegt vorbei\n\n' + table(['Vorschlag', 'gezeigt', 'angenommen', '„Später“', 'Quote'], fly) + '\nAusgeschaltet: ' + get('fly_off') + ', wieder an: ' + get('fly_on') + '\n';
const flyShown = fly.reduce((s, x) => s + x[1], 0), flyGo = fly.reduce((s, x) => s + x[2], 0);
if (flyShown >= 30 && flyGo / flyShown < 0.1) hints.push('Papillon wird selten angenommen (' + pct(flyGo, flyShown) + '). Bessere Vorschläge oder seltener zeigen.');
if (get('fly_off') >= 5 && get('fly_off') > flyGo / 4) hints.push('Viele schalten Papillon aus (' + get('fly_off') + '×). Seltener fliegen lassen?');

/* Kamera */
md += '\n## Schmetterlings-Kamera\n\n' + table(['Schritt', 'Anzahl'], [['geöffnet', get('cam_open')], ['ohne Kamera', get('cam_nocam')]].concat(pre('cam_photo:').map(([k, n]) => ['Foto ' + k, n]), pre('cam_video:').map(([k, n]) => ['Video ' + k, n]), [['an Partner', get('cam_send')]], pre('cam_share:').map(([k, n]) => ['geteilt ' + k, n]), pre('cam_save:').map(([k, n]) => ['gespeichert ' + k, n])));
if (get('cam_open') >= 10 && get('cam_nocam') / get('cam_open') > 0.25) hints.push('Bei ' + pct(get('cam_nocam'), get('cam_open')) + ' der Kamera-Starts gab es keine Kamera (verweigert oder nicht verfügbar). Erklärung/Erlaubnis-Hinweis verbessern.');

/* Gesendet */
md += '\n## Gesendet an den Schatz (nur die Art)\n\n' + table(['Art', 'Anzahl'], pre('send:'));

/* Werbelinks und Suche */
md += '\n## Werbelinks und eigene Suche\n\n' + table(['Bereich', 'Klicks auf Werbelinks'], pre('ad:')) + '\n' + table(['Suchfeld', 'Suchen'], pre('shop_search:').concat([['Frag Papillon → Amazon', get('frag_shop')]]));
const shop = terms.filter((t) => t.src === 'shop'), frag = terms.filter((t) => t.src === 'frag');
md += '\n### Häufigste eigene Suchbegriffe\n\n' + table(['Begriff', 'Anzahl'], shop.slice(0, 30).map((t) => [t.term, t.n]));
if (shop.length) hints.push('Eigene Suchen zeigen Bedarf: ' + shop.slice(0, 5).map((t) => '„' + t.term + '“').join(', ') + '. Als feste Ideen/Werbelinks oder als neue Funktion aufnehmen.');

/* Frag Papillon */
md += '\n## Frag Papillon\n\nGeöffnet: ' + get('frag_open') + ', ohne Treffer: ' + get('frag_miss') + ' (' + pct(get('frag_miss'), get('frag_open')) + ')\n\n' + table(['Sprungziel', 'Anzahl'], pre('frag_go:').slice(0, 20)) + '\n### Fragen ohne Treffer\n\n' + table(['Frage', 'Anzahl'], frag.slice(0, 30).map((t) => [t.term, t.n]));
if (frag.length) hints.push('„Frag Papillon“ fand nichts zu: ' + frag.slice(0, 6).map((t) => '„' + t.term + '“').join(', ') + '. Suchwörter ergänzen oder fehlende Funktion bauen.');

/* Gemeinsamkeiten (Interessen) */
md += '\n## Gemeinsam: was Paare verbindet\n\n' + table(['Karte', 'beide mögen'], pre('like:').slice(0, 25)) + '\n' + table(['Karte', 'beide offen'], pre('open:').slice(0, 15));
const likes = pre('like:'); if (likes.length >= 5) hints.push('Top-Gemeinsamkeiten: ' + likes.slice(0, 5).map((x) => x[0]).join(', ') + '. Dazu passende Werbelinks/Angebote (z. B. Events, Awin) bevorzugt pflegen.');

/* Fehler */
const errs = pre('err:'); md += '\n## Fehler der App\n\n' + table(['Stelle', 'Anzahl'], errs);
if (errs.length) hints.unshift('FEHLER in der App: ' + errs.slice(0, 5).map(([k, n]) => k + ' (' + n + '×)').join(', ') + '. Zuerst beheben.');

md += '\n## Hinweise für die nächste Runde\n\n' + (hints.length ? hints.map((h, i) => (i + 1) + '. ' + h).join('\n') : '_Noch zu wenig Daten für Hinweise._') + '\n';
md += '\n_Zustimmungen seit Start im Zeitraum: ' + get('stats_on') + '. Die Zahlen zeigen nur Geräte, die „Anonym mithelfen“ eingeschaltet haben._\n';

const out = arg('--out'); if (out) { writeFileSync(out, md); console.log('Bericht geschrieben: ' + out); } else console.log(md);
