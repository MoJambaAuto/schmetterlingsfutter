// Bühne prüfen (Moderation) – im Ordner schmetterlingsfutter:
//   node relay/scripts/buehne.mjs                  Überblick: Zahlen, Prüf-Warteschlange, Meldungen
//   node relay/scripts/buehne.mjs frei <id>        Gedicht nach Prüfung freigeben (Meldungen zurücksetzen)
//   node relay/scripts/buehne.mjs weg <id>         Gedicht entfernen (bleibt als „removed“ ohne Text gespeichert)
//   node relay/scripts/buehne.mjs shop             Kandidaten für Produkte: Autor offen für Shop, beste zuerst
//   node relay/scripts/buehne.mjs anfrage <id> Text   Nachricht an den Autor (erscheint unter „Meine Werke“), leer = löschen
//   --lokal                                        gegen den lokalen Testdienst
// Meldungen nach DSA zeitnah bearbeiten (Ziel: innerhalb von 48 Stunden).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const relay = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const local = process.argv.includes('--lokal');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
function q(sql) {
  if (/"/.test(sql)) throw new Error('Keine doppelten Anführungszeichen in SQL');
  const r = spawnSync('npx wrangler d1 execute schmetterlingsfutter ' + (local ? '--local' : '--remote') + ' --json --config wrangler.jsonc --command "' + sql + '"', { cwd: relay, encoding: 'utf8', shell: true, env: Object.assign({}, process.env, { CI: 'true' }) });
  const out = (r.stdout || '').trim(); const start = out.indexOf('[');
  if (r.status !== 0 || start < 0) throw new Error('Abfrage fehlgeschlagen: ' + ((r.stderr || out).split(/\r?\n/).slice(-3).join(' ')));
  const j = JSON.parse(out.slice(start)); return (j[0] && j[0].results) || [];
}
const id = Number(args[1]);
const short = (s, n) => String(s || '').replace(/\s+/g, ' ').slice(0, n);

if (args[0] === 'frei' && Number.isInteger(id)) {
  q("UPDATE poems SET status = 'live', flag = NULL, reports = 0 WHERE id = " + id + " AND status = 'review'");
  q("DELETE FROM poem_votes WHERE poem_id = " + id + " AND kind = 'report'");
  console.log('Freigegeben: ' + id);
} else if (args[0] === 'weg' && Number.isInteger(id)) {
  q("UPDATE poems SET status = 'removed', body = '', title = '(entfernt)', yt = NULL WHERE id = " + id);
  console.log('Entfernt: ' + id);
} else if (args[0] === 'anfrage' && Number.isInteger(id)) {
  const text = args.slice(2).join(' ').replace(/'/g, "''").slice(0, 400);
  q("UPDATE poems SET offer = " + (text ? "'" + text + "'" : 'NULL') + " WHERE id = " + id);
  console.log('Anfrage gesetzt: ' + id);
} else if (args[0] === 'shop') {
  const rows = q("SELECT id, title, author, claps, wings, week FROM poems WHERE status = 'live' AND shop = 1 ORDER BY (claps + 3 * wings) DESC LIMIT 30");
  console.log('Produkt-Kandidaten (Autor offen für Shop, mit Anteil – vor jedem Produkt Zustimmung je Werk einholen):');
  rows.forEach((r) => console.log('#' + r.id + '  ' + (r.claps + 3 * r.wings) + ' Pkt  „' + r.title + '“ – ' + r.author + '  (' + r.week + ')'));
} else {
  const n = q("SELECT status, COUNT(*) AS n FROM poems GROUP BY status");
  console.log('Bühne: ' + n.map((r) => r.status + ' ' + r.n).join(' · '));
  const rv = q("SELECT id, created, title, author, flag, reports, body FROM poems WHERE status = 'review' ORDER BY id ASC LIMIT 50");
  console.log('\nIn Prüfung (' + rv.length + '):');
  rv.forEach((r) => {
    const why = q("SELECT reason FROM poem_votes WHERE poem_id = " + r.id + " AND kind = 'report' LIMIT 10").map((x) => x.reason);
    console.log('#' + r.id + '  ' + new Date(r.created).toLocaleString('de-DE') + '  „' + r.title + '“ – ' + r.author + '  [' + (r.flag || '') + (why.length ? '; ' + why.join(' | ') : '') + ']\n    ' + short(r.body, 300));
  });
  const live = q("SELECT id, title, author, reports FROM poems WHERE status = 'live' AND reports > 0 ORDER BY reports DESC LIMIT 20");
  if (live.length) { console.log('\nSichtbar, aber gemeldet:'); live.forEach((r) => console.log('#' + r.id + '  ' + r.reports + '×  „' + r.title + '“ – ' + r.author)); }
  console.log('\nFreigeben: node relay/scripts/buehne.mjs frei <id>   Entfernen: node relay/scripts/buehne.mjs weg <id>');
}
