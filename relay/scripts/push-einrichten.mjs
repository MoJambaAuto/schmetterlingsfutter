// Richtet die Mitteilungen aufs Handy am ECHTEN Dienst ein. Einmal ausführen:
//   node relay/scripts/push-einrichten.mjs
// Was passiert:
//   1. Tabelle für Push-Adressen anlegen (falls noch nicht da).
//   2. Schlüsselpaar erzeugen. Der private Schlüssel geht direkt an Cloudflare (Geheimnis VAPID_PRIVATE).
//      Er wird nicht auf die Festplatte geschrieben und nicht angezeigt.
//   3. Öffentlichen Schlüssel in relay/wrangler.jsonc eintragen.
//   4. Dienst veröffentlichen und prüfen, ob er den Schlüssel ausliefert.
// Ist schon ein Schlüssel eingetragen, bricht das Skript ab: ein neuer Schlüssel würde alle eingeschalteten
// Mitteilungen ungültig machen. Bewusst neu erzeugen: mit dem Zusatz --neu aufrufen.
import { webcrypto as crypto } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const relay = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfgFile = path.join(relay, 'wrangler.jsonc');
const LIVE = 'https://schmetterlingsfutter-relay.mojamba-automation.workers.dev';
const stop = (msg) => { console.log('\nABGEBROCHEN: ' + msg); process.exit(1); };
function wrangler(args, input) {
  const r = spawnSync('npx wrangler ' + args, { cwd: relay, input, encoding: 'utf8', shell: true, env: Object.assign({}, process.env, { CI: 'true' }) });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  return { ok: r.status === 0, tail: out.split(/\r?\n/).slice(-4).join('\n') };
}

let cfg = readFileSync(cfgFile, 'utf8');
if (cfg.includes('"VAPID_PUBLIC"') && !process.argv.includes('--neu')) stop('In wrangler.jsonc steht schon ein Schlüssel. Nichts geändert.');

// Die Tabelle push_subs (Migration 0003) ist seit 11.11.2026 in der echten Datenbank. Bei einer neuen Datenbank vorher:
//   npx wrangler d1 migrations apply schmetterlingsfutter --remote
console.log('1/4 Anmeldung bei Cloudflare prüfen …');
const loggedIn = () => { const r = spawnSync('npx wrangler whoami', { cwd: relay, encoding: 'utf8', shell: true, env: Object.assign({}, process.env, { CI: 'true' }) }); return /logged in/i.test((r.stdout || '') + (r.stderr || '')); };
if (!loggedIn()) {
  console.log('    Dieses Terminal ist nicht angemeldet. Gleich öffnet sich der Browser: dort bitte auf „Allow“ klicken.');
  spawnSync('npx wrangler login', { cwd: relay, stdio: 'inherit', shell: true });
  if (!loggedIn()) stop('Die Anmeldung bei Cloudflare hat nicht geklappt.');
}
console.log('    angemeldet.');

console.log('2/4 Schlüsselpaar erzeugen und privaten Schlüssel bei Cloudflare ablegen …');
const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
const pub = Buffer.from(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))).toString('base64url');
const s = wrangler('secret put VAPID_PRIVATE --config wrangler.jsonc', JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }));
if (!s.ok) stop('Cloudflare hat den Schlüssel nicht angenommen.\n' + s.tail);

console.log('3/4 Öffentlichen Schlüssel eintragen …');
const lines = '"VAPID_PUBLIC": "' + pub + '",\n    "VAPID_SUBJECT": "https://app.schmetterlingsfutter.de/"';
if (cfg.includes('"VAPID_PUBLIC"')) cfg = cfg.replace(/"VAPID_PUBLIC": "[^"]*"/, '"VAPID_PUBLIC": "' + pub + '"');
else {
  const at = /("ALLOWED_ORIGINS": "[^"]*")/; if (!at.test(cfg)) stop('Stelle in wrangler.jsonc nicht gefunden.');
  cfg = cfg.replace(at, (x) => x + ',\n    // Push-Mitteilungen: öffentlicher Schlüssel. Der private liegt als Geheimnis VAPID_PRIVATE bei Cloudflare, nie im Repo.\n    ' + lines);
}
writeFileSync(cfgFile, cfg);

console.log('4/4 Dienst veröffentlichen …');
const d = wrangler('deploy --config wrangler.jsonc');
if (!d.ok) stop('Veröffentlichen fehlgeschlagen.\n' + d.tail);

let live = '';
for (let i = 0; i < 6 && live !== pub; i++) { await new Promise((r) => setTimeout(r, 2500)); try { live = (await (await fetch(LIVE + '/push/key')).json()).key || ''; } catch (e) {} }
console.log(live === pub ? '\nFERTIG: Die Mitteilungen sind eingerichtet. Der Dienst liefert den neuen Schlüssel aus.' : '\nVeröffentlicht, aber der Dienst liefert den Schlüssel noch nicht aus. Bitte Claude Bescheid geben.');
