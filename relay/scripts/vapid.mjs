// Erzeugt das Schlüsselpaar für Push-Mitteilungen (VAPID, P-256).
// Aufruf: node relay/scripts/vapid.mjs <Datei für den privaten Schlüssel>
// Der private Schlüssel landet NUR in der Datei, auf der Konsole steht nur der öffentliche.
import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const out = process.argv[2];
if (!out) { console.error('Bitte eine Zieldatei für den privaten Schlüssel angeben.'); process.exit(1); }
const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
const pub = Buffer.from(raw).toString('base64url');
writeFileSync(out, JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }), { mode: 0o600 });
console.log(pub);
