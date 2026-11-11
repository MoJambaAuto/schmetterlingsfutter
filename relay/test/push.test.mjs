// Prüft die Push-Mitteilungen des Vermittlungsdienstes gegen einen lokal laufenden Worker.
//
// Vorbereitung (einmalig, im Ordner der App):
//   node relay/test/push.test.mjs --setup      schreibt relay/.dev.vars mit einem Test-Schlüsselpaar (nur lokal, nicht im Repo)
//   npx wrangler d1 migrations apply schmetterlingsfutter --local --config relay/wrangler.jsonc
// Dienst starten:
//   npx wrangler dev --config relay/wrangler.jsonc --port 8787 --ip 127.0.0.1
// Test:
//   node relay/test/push.test.mjs
//
// Der Test startet selbst einen kleinen Ersatz-Push-Dienst auf Port 8791 und braucht keine Zusatzpakete.
import http from 'node:http';
import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RELAY = process.env.RELAY || 'http://127.0.0.1:8787';
const MOCK_PORT = 8791;
const GAP = 1500; // muss zu PUSH_GAP_MS in .dev.vars passen
const here = path.dirname(fileURLToPath(import.meta.url));

if (process.argv.includes('--setup')) {
  const file = path.join(here, '..', '.dev.vars');
  if (existsSync(file) && !process.argv.includes('--force')) { console.log('relay/.dev.vars gibt es schon (mit --force neu schreiben).'); process.exit(0); }
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const pub = Buffer.from(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))).toString('base64url');
  writeFileSync(file, "VAPID_PRIVATE='" + JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }) + "'\nVAPID_PUBLIC=" + pub + "\nPUSH_ALLOW_LOCAL=1\nPUSH_GAP_MS=" + GAP + "\n");
  console.log('relay/.dev.vars geschrieben (Test-Schlüssel, nur für den lokalen Dienst).'); process.exit(0);
}

let failed = 0, passed = 0;
const ok = (cond, name) => { if (cond) { passed++; console.log('  ok   ' + name); } else { failed++; console.log('  FEHLER ' + name); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const hex = (n) => Buffer.from(crypto.getRandomValues(new Uint8Array(n))).toString('hex');
async function post(p, body) { const r = await fetch(RELAY + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, data: await r.json().catch(() => ({})) }; }

// Ersatz-Push-Dienst
const hits = []; let answer = 201, mockUp = true;
const mock = http.createServer((req, res) => {
  let len = 0; req.on('data', (c) => { len += c.length; });
  req.on('end', () => { hits.push({ url: req.url, method: req.method, headers: req.headers, len }); res.statusCode = answer; res.end(); });
});
await new Promise((r) => mock.listen(MOCK_PORT, '127.0.0.1', r));
const EP = 'http://127.0.0.1:' + MOCK_PORT + '/push/geraet-b';

try {
  const health = await fetch(RELAY + '/health').then((r) => r.json()).catch(() => null);
  if (!health || !health.ok) { console.log('Der lokale Dienst antwortet nicht unter ' + RELAY + '. Startbefehle stehen im Kopf dieser Datei.'); process.exit(2); }

  console.log('1 Paar bilden');
  const A = { dev: hex(16) }, B = { dev: hex(16) };
  const n = await post('/pair/new', { dev: A.dev }); A.pair = n.data.pair; A.token = n.data.token;
  const j = await post('/pair/join', { pair: A.pair, dev: B.dev }); B.pair = A.pair; B.token = j.data.token;
  ok(n.status === 200 && j.status === 200 && !!A.token && !!B.token, 'zwei Geräte sind ein Paar');
  const as = (X, extra) => Object.assign({ pair: X.pair, dev: X.dev, token: X.token }, extra || {});

  console.log('2 Abo und Push');
  const key = await fetch(RELAY + '/push/key').then((r) => r.json());
  ok(typeof key.key === 'string' && key.key.length > 80, '/push/key liefert den öffentlichen Schlüssel');
  ok((await post('/push/sub', as(B, { endpoint: EP }))).status === 200, 'Gerät B meldet sein Abo an');
  const s1 = await post('/msg/send', as(A, { body: 'aaa.bbb' })); await wait(700);
  ok(s1.status === 200, 'Senden antwortet normal');
  ok(hits.length === 1 && hits[0].method === 'POST' && hits[0].url === '/push/geraet-b', 'genau ein Push kommt beim Push-Dienst an');
  const h = hits[0] || { headers: {}, len: -1 };
  ok(h.len === 0, 'der Push hat keinen Inhalt');
  ok(h.headers.ttl === '86400', 'Kopfzeile TTL gesetzt');
  const m = /^vapid t=([^,]+), k=(.+)$/.exec(h.headers.authorization || '');
  ok(!!m && m[2] === key.key, 'Authorization: vapid mit dem öffentlichen Schlüssel');
  if (m) {
    const [hd, cl, sg] = m[1].split('.');
    const pub = await crypto.subtle.importKey('raw', Buffer.from(key.key, 'base64url'), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, Buffer.from(sg, 'base64url'), Buffer.from(hd + '.' + cl));
    const head = JSON.parse(Buffer.from(hd, 'base64url').toString()), claims = JSON.parse(Buffer.from(cl, 'base64url').toString());
    const nowS = Date.now() / 1000;
    ok(valid && head.alg === 'ES256', 'JWT-Signatur ist gültig (ES256)');
    ok(claims.aud === 'http://127.0.0.1:' + MOCK_PORT, 'aud passt zum Push-Dienst');
    ok(claims.exp > nowS && claims.exp <= nowS + 24 * 3600, 'exp liegt in der Zukunft und höchstens 24 Stunden');
    ok(/^(https:|mailto:)/.test(claims.sub || ''), 'sub ist gesetzt');
  }

  console.log('3 Stille Nachricht');
  await wait(GAP + 300); hits.length = 0;
  await post('/msg/send', as(A, { body: 'aaa.bbb', quiet: true })); await wait(700);
  ok(hits.length === 0, 'quiet: true löst keinen Push aus');

  console.log('4 Bremse');
  await post('/msg/send', as(A, { body: 'aaa.bbb' })); await post('/msg/send', as(A, { body: 'aaa.bbb' })); await wait(700);
  ok(hits.length === 1, 'zwei Nachrichten kurz nacheinander ergeben einen Push');

  console.log('5 Push-Dienst nicht erreichbar');
  await wait(GAP + 300); hits.length = 0;
  await new Promise((r) => mock.close(r)); mockUp = false;
  const t0 = Date.now(); const s5 = await post('/msg/send', as(A, { body: 'aaa.bbb' }));
  ok(s5.status === 200 && Date.now() - t0 < 3000, 'Senden antwortet trotzdem normal und zügig');
  await new Promise((r) => mock.listen(MOCK_PORT, '127.0.0.1', r)); mockUp = true;

  console.log('6 Abo abgelaufen (410)');
  await wait(GAP + 300); hits.length = 0; answer = 410;
  await post('/msg/send', as(A, { body: 'aaa.bbb' })); await wait(700);
  ok(hits.length === 1, 'Push wird versucht');
  answer = 201; await wait(GAP + 300); hits.length = 0;
  await post('/msg/send', as(A, { body: 'aaa.bbb' })); await wait(700);
  ok(hits.length === 0, 'nach 410 ist das Abo gelöscht');

  console.log('7 Abmelden und fremde Adressen');
  await post('/push/sub', as(B, { endpoint: EP })); await post('/push/unsub', as(B)); await wait(GAP + 300); hits.length = 0;
  await post('/msg/send', as(A, { body: 'aaa.bbb' })); await wait(700);
  ok(hits.length === 0, '/push/unsub wirkt');
  ok((await post('/push/sub', as(B, { endpoint: 'https://example.com/push/abc' }))).status === 400, 'fremder Host wird abgelehnt');
  ok((await post('/push/sub', as(B, { endpoint: 'https://fcm.googleapis.com/fcm/send/abc' }))).status === 200, 'Adresse des Google-Push-Dienstes wird angenommen');
  ok((await post('/push/sub', { pair: B.pair, dev: B.dev, token: hex(16), endpoint: EP })).status === 401, 'ohne gültige Anmeldung kein Abo');

  console.log('8 Trennen räumt auf, alte App-Versionen laufen weiter');
  const pulled = await post('/msg/pull', as(B));
  ok(pulled.status === 200 && pulled.data.messages.length >= 5, 'Nachrichten liegen wie bisher zum Abholen bereit');
  ok((await post('/pair/leave', as(A))).status === 200, 'Verbindung trennen funktioniert');
} finally {
  if (mockUp) await new Promise((r) => mock.close(r));
}
console.log('\n' + passed + ' bestanden, ' + failed + ' fehlgeschlagen');
process.exit(failed ? 1 : 0);
