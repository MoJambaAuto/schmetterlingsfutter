// Test der Bühne (Open Mic) gegen den lokalen Dienst: node relay/test/buehne.test.mjs [http://localhost:8787]
const BASE = process.argv[2] || 'http://localhost:8787';
const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, '0')).join('');
const post = async (p, b) => { const r = await fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8000' }, body: JSON.stringify(b) }); return [r.status, await r.json()]; };
let fail = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fail++; };
const A = rnd(), B = rnd(), C = rnd(), D = rnd();
const body = 'Du bist der Morgen, der mich weckt,\nder Tau, der meine Wiese deckt.\n\nUnd wenn es dunkel wird um mich,\ndann leuchtet nur ein Licht: das bist du. ' + rnd().slice(0, 6);

let [s, r] = await post('/buehne/post', { key: A, title: 'Morgentau', body, author: 'Testpoetin', cat: 'liebe', rules: true });
ok(s === 200 && r.status === 'live' && r.id, 'Gedicht wird veröffentlicht (' + s + ' ' + JSON.stringify(r) + ')');
const id = r.id;
[s, r] = await post('/buehne/post', { key: A, title: 'Morgentau', body, author: 'Testpoetin', cat: 'liebe', rules: true });
ok(s === 409 && r.error === 'dup', 'gleicher Text doppelt wird abgelehnt');
[s, r] = await post('/buehne/post', { key: A, title: 'Ohne Regeln', body: body + 'x', author: 'Testpoetin', cat: 'liebe' });
ok(s === 400 && r.error === 'rules', 'ohne Regel-Zustimmung abgelehnt');
[s, r] = await post('/buehne/post', { key: A, title: 'Werbung', body: 'Schreib mir auf instagram oder unter www.beispiel.de, mein Herz', author: 'Spam', cat: 'liebe', rules: true });
ok(s === 400 && r.error === 'contact', 'Links/Kontaktdaten abgelehnt');
[s, r] = await post('/buehne/post', { key: A, title: 'Kurz', body: 'zu kurz', author: 'Testpoetin', cat: 'liebe', rules: true });
ok(s === 400 && r.error === 'length', 'zu kurzer Text abgelehnt');
[s, r] = await post('/buehne/post', { key: D, title: 'Prüfung', body: 'Ein Text mit dem Wort Porno darin, das erst geprüft wird ' + rnd().slice(0, 4), author: 'Jemand', cat: 'frei', rules: true });
ok(s === 200 && r.status === 'review', 'auffälliges Wort → erst Prüfung');
const reviewId = r.id;
[s, r] = await post('/buehne/post', { key: D, title: 'Mit Video', body: 'Hier trage ich mein Gedicht selbst vor, hört gern rein ' + rnd().slice(0, 4), author: 'Jemand', cat: 'frei', yt: 'dQw4w9WgXcQ', rules: true });
ok(s === 200 && r.status === 'live', 'YouTube-ID erlaubt');
[s, r] = await post('/buehne/post', { key: D, title: 'Falsches Video', body: 'Noch ein Gedicht mit kaputtem Video-Verweis ' + rnd().slice(0, 4), author: 'Jemand', cat: 'frei', yt: 'javascript:1', rules: true });
ok(s === 400 && r.error === 'yt', 'kaputte YouTube-ID abgelehnt');

[s, r] = await post('/buehne/vote', { key: A, id, kind: 'clap' });
ok(s === 409 && r.error === 'own', 'eigenes Gedicht beklatschen geht nicht');
[s, r] = await post('/buehne/vote', { key: B, id, kind: 'clap' });
ok(s === 200 && r.claps === 1, 'Applaus zählt');
[s, r] = await post('/buehne/vote', { key: B, id, kind: 'clap' });
ok(s === 200 && r.claps === 1, 'Applaus nur einmal je Hörer');
[s, r] = await post('/buehne/vote', { key: B, id, kind: 'wing' });
ok(s === 200 && r.wings === 1 && r.wingsLeft === 2, 'Flügel zählt, 2 übrig');

[s, r] = await post('/buehne/list', { sort: 'trend', key: B });
const mineInList = (r.poems || []).find((p) => p.id === id);
ok(s === 200 && mineInList && r.voted && r.voted[id] && r.voted[id].includes('clap') && r.wingsLeft === 2, 'Liste „Im Aufwind“ mit eigenen Stimmen');
ok(!(r.poems || []).some((p) => p.id === reviewId), 'Gedicht in Prüfung ist nicht sichtbar');
ok(mineInList && !('akey' in mineInList) && mineInList.aid.length === 10, 'kein Autor-Schlüssel in der Ausgabe');
for (const sort of ['neu', 'woche', 'beste']) { [s, r] = await post('/buehne/list', { sort, cat: 'liebe' }); ok(s === 200 && (r.poems || []).some((p) => p.id === id), 'Liste ' + sort); }

const g = await fetch(BASE + '/buehne/poem?id=' + id, { headers: { Origin: 'http://localhost:8000' } }); const gj = await g.json();
ok(g.status === 200 && gj.poem && gj.poem.title === 'Morgentau', 'Einzelabruf für Teilen-Link');

[s, r] = await post('/buehne/mine', { key: A });
ok(s === 200 && r.poems.some((p) => p.id === id && p.mine && p.status === 'live'), 'Meine Werke');

for (const k of [B, C, rnd()]) await post('/buehne/report', { key: k, id, reason: 'beleidigend' });
[s, r] = await post('/buehne/list', { sort: 'neu' });
ok(!(r.poems || []).some((p) => p.id === id), 'nach 3 Meldungen ausgeblendet');
[s, r] = await post('/buehne/mine', { key: A });
ok(r.poems.some((p) => p.id === id && p.status === 'review'), 'Autorin sieht „in Prüfung“');

[s, r] = await post('/buehne/delete', { key: B, id });
ok(s === 404, 'fremdes Gedicht löschen geht nicht');
[s, r] = await post('/buehne/delete', { key: A, id });
ok(s === 200, 'eigenes Gedicht löschen');
[s, r] = await post('/buehne/mine', { key: A });
ok(!r.poems.some((p) => p.id === id), 'gelöscht ist weg');

console.log(fail ? fail + ' Fehler' : 'Alles grün');
process.exit(fail ? 1 : 0);
