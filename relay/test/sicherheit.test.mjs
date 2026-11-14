// Sicherheitstest (3.48.0) gegen den lokalen Dienst: node relay/test/sicherheit.test.mjs [http://localhost:8787]
// Vorher: npx wrangler d1 migrations apply schmetterlingsfutter --local --config relay/wrangler.jsonc
//         npx wrangler dev --config relay/wrangler.jsonc --port 8787 --ip 127.0.0.1 --var DEV:1
// Prüft: Beitritt nur mit Nachweis, alte Paare weiter gültig, Bremsen bei Paar-Anlage, Beitritt und Umzug,
// keine internen Fehlertexte, CORS nur für erlaubte Adressen.
const BASE = process.argv[2] || 'http://localhost:8787';
const rnd = (n = 16) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => x.toString(16).padStart(2, '0')).join('');
let ipN = 0; const ip = () => '10.9.' + Math.floor(Math.random() * 250) + '.' + (++ipN % 250);
const post = async (p, b, from) => {
  const r = await fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': from || ip() }, body: JSON.stringify(b) });
  return [r.status, await r.json().catch(() => ({}))];
};
let fail = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fail++; };

// 1) Neues Paar mit Nachweis: Beitritt ohne / mit falschem / mit richtigem Nachweis
const jt = rnd(16);
let [s, r] = await post('/pair/new', { dev: rnd(), jt });
ok(s === 200 && r.pair, 'Paar mit Nachweis angelegt');
const pair = r.pair;
[s, r] = await post('/pair/join', { pair, dev: rnd() });
ok(s === 426 && r.error === 'update', 'Beitritt ohne Nachweis abgelehnt (alte App → Hinweis aktualisieren)');
[s, r] = await post('/pair/join', { pair, dev: rnd(), jt: rnd(16) });
ok(s === 404 && r.error === 'unknown', 'Beitritt mit falschem Nachweis abgelehnt (verrät nicht, dass es das Paar gibt)');
[s, r] = await post('/pair/join', { pair, dev: rnd(), jt });
ok(s === 200 && r.token, 'Beitritt mit richtigem Nachweis klappt');
[s, r] = await post('/pair/new', { dev: rnd(), jt: 'kaputt' });
ok(s === 400, 'kaputter Nachweis beim Anlegen abgelehnt');

// 2) Altes Paar (ohne Nachweis) bleibt nutzbar
[s, r] = await post('/pair/new', { dev: rnd() });
ok(s === 200, 'altes Paar ohne Nachweis anlegbar');
[s, r] = await post('/pair/join', { pair: r.pair, dev: rnd() });
ok(s === 200 && r.token, 'Beitritt zu altem Paar ohne Nachweis klappt weiter');

// 3) Bremsen je Absender
const me = ip();
let last = 0; for (let i = 0; i < 21; i++) { [last] = await post('/pair/new', { dev: rnd() }, me); }
ok(last === 429, 'Paar-Anlage: 21. Versuch am Tag von derselben Adresse gebremst');
const me2 = ip();
for (let i = 0; i < 31; i++) { [last] = await post('/pair/join', { pair: 'ZZZZZZ', dev: rnd() }, me2); }
ok(last === 429, 'Beitritt: 31. Versuch am Tag von derselben Adresse gebremst (Raten unmöglich)');

// 4) Umzug: Bremse je Absender
const me3 = ip(); const blob = new Uint8Array(1000);
const put = async () => (await fetch(BASE + '/umzug/put', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'CF-Connecting-IP': me3 }, body: blob })).status;
for (let i = 0; i < 11; i++) last = await put();
ok(last === 429, 'Umzug: 11. Ablage am Tag von derselben Adresse gebremst');

// 5) Keine internen Fehlertexte, CORS
[s, r] = await post('/status', { pair: 'ABCDEF', dev: rnd(), token: rnd() });
ok(s === 401 && !('detail' in r), 'Fehlerantwort ohne interne Details');
const h = await fetch(BASE + '/health', { headers: { Origin: 'https://boese.example' } });
ok(h.headers.get('access-control-allow-origin') !== 'https://boese.example', 'fremde Webseite bekommt keine CORS-Freigabe');
const h2 = await fetch(BASE + '/health', { headers: { Origin: 'https://app.schmetterlingsfutter.de' } });
ok(h2.headers.get('access-control-allow-origin') === 'https://app.schmetterlingsfutter.de', 'App-Adresse bekommt CORS-Freigabe');

console.log(fail ? '\n' + fail + ' Fehler' : '\nAlles gut');
process.exit(fail ? 1 : 0);
