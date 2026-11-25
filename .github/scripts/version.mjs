// Schmetterlingsfutter – Versionsnummer an einer Stelle setzen und prüfen (3.51.0)
// Setzen:  node .github/scripts/version.mjs 3.52.0   → js/data2.js (D.version) und sw.js (CACHE)
// Prüfen:  node .github/scripts/version.mjs --check → bricht ab, wenn die Stellen nicht übereinstimmen
// Die Zeile „Neu in dieser Version“ (js/neu.js, D.news) bleibt Handarbeit, weil nicht jede Version eine braucht.
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = {
  data2: { path: 'js/data2.js', re: /D\.version = '(\d+\.\d+\.\d+)';/, put: (v) => `D.version = '${v}';` },
  sw: { path: 'sw.js', re: /const CACHE = 'schmetterlingsfutter-v(\d+\.\d+\.\d+)';/, put: (v) => `const CACHE = 'schmetterlingsfutter-v${v}';` }
};
const num = (v) => v.split('.').reduce((a, x) => a * 1000 + Number(x), 0);
const read = (f) => readFileSync(f.path, 'utf8');
const found = (f) => { const m = read(f).match(f.re); if (!m) throw new Error(`Versionsnummer nicht gefunden in ${f.path}`); return m[1]; };

const arg = process.argv[2];
if (arg === '--check') {
  const v = found(FILES.data2), c = found(FILES.sw);
  const news = (readFileSync('js/neu.js', 'utf8').match(/D\.news = \[\s*\{ v: '(\d+\.\d+\.\d+)'/) || [])[1];
  const errs = [];
  if (v !== c) errs.push(`js/data2.js hat ${v}, sw.js hat ${c} – Nutzer würden alte Dateien behalten`);
  if (news && num(news) > num(v)) errs.push(`js/neu.js nennt ${news}, die App ist aber erst ${v}`);
  if (errs.length) { console.error('Versionsprüfung fehlgeschlagen:\n- ' + errs.join('\n- ')); process.exit(1); }
  console.log(`Version ${v} stimmt in js/data2.js und sw.js überein.`);
} else if (/^\d+\.\d+\.\d+$/.test(arg || '')) {
  const old = found(FILES.data2);
  if (num(arg) <= num(old)) { console.error(`Neue Version ${arg} muss größer sein als ${old}.`); process.exit(1); }
  for (const f of Object.values(FILES)) writeFileSync(f.path, read(f).replace(f.re, f.put(arg)));
  console.log(`Version ${old} → ${arg} in js/data2.js und sw.js gesetzt. Für sichtbare Änderungen noch eine Zeile oben in js/neu.js (D.news).`);
} else {
  console.error('Aufruf: node .github/scripts/version.mjs 3.52.0   oder   node .github/scripts/version.mjs --check');
  process.exit(1);
}
