/* Schmetterlingsfutter-Relay
   Verbindet zwei Geräte eines Paares. Der Dienst sieht nie Klartext:
   - Antworten der Match-Spiele kommen als HMAC-Hashes (Schlüssel kennt nur das Paar) und werden nur verglichen.
   - Nachrichten kommen Ende-zu-Ende verschlüsselt (AES-GCM) und werden nur zwischengelagert.
   - Der Paar-Code besteht aus einer Paar-ID (kennt der Dienst) und einem Geheimnis (kennt nur das Paar).
   Speicher: Cloudflare D1 (SQLite). Alles Unbenutzte wird nach 180 Tagen gelöscht, Nachrichten nach 30 Tagen. */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_BODY = 96 * 1024;        // Bytes je Anfrage (Kritzel-Grüße als kleine PNGs)
const MAX_HASHES = 400;            // Hashes je Deck
const MAX_MSG_BODY = 80 * 1024;    // Zeichen je verschlüsselter Nachricht (Text, Jingle-Verweis oder Kritzel-Bild)
const MAX_MSGS_PER_PAIR = 200;
const PAIR_IDLE_DAYS = 180;
const UNJOINED_HOURS = 48;
const MSG_DAYS = 30;

function randomCode(len) {
  const b = new Uint8Array(len); crypto.getRandomValues(b);
  let s = ''; for (let i = 0; i < len; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}
function randomHex(bytes) {
  const b = new Uint8Array(bytes); crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
function corsHeaders(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin) || allowed.includes('*');
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || 'null',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
}
function json(obj, status, req, env) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, corsHeaders(req, env)) });
}
const err = (msg, status, req, env) => json({ error: msg }, status, req, env);
const isDev = (s) => typeof s === 'string' && /^[a-f0-9]{16,64}$/.test(s);
const isTok = (s) => typeof s === 'string' && /^[a-f0-9]{32,64}$/.test(s);
const isPair = (s) => typeof s === 'string' && /^[A-Z2-9]{6}$/.test(s);
const isDeck = (s) => typeof s === 'string' && /^[a-z0-9_-]{1,32}$/.test(s);
const now = () => Date.now();

/* Idee spenden: anonyme Vorschläge für neue Inhalte. Keine Paar- oder Geräte-Kennung, nur Datum, Art und Text. */
const IDEA_KINDS = ['frage', 'date', 'botschaft', 'piek', 'thema', 'sonstiges'];
const IDEA_MIN = 8, IDEA_MAX = 240;
const IDEA_PER_DAY = 5;       // je Absender-Prüfsumme und Tag
const IDEA_TOTAL_DAY = 300;   // insgesamt je Tag
async function shortHash(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d).slice(0, 3), (x) => x.toString(16).padStart(2, '0')).join(''); // 24 Bit: reicht zum Bremsen, nicht zum Wiedererkennen
}

async function auth(env, body) {
  if (!isPair(body.pair) || !isDev(body.dev) || !isTok(body.token)) return null;
  const p = await env.DB.prepare('SELECT * FROM pairs WHERE id = ?').bind(body.pair).first();
  if (!p) return null;
  let role = null;
  if (p.a_dev === body.dev && p.a_tok === body.token) role = 'a';
  else if (p.b_dev === body.dev && p.b_tok === body.token) role = 'b';
  if (!role) return null;
  const other = role === 'a' ? p.b_dev : p.a_dev;
  return { pair: p, role, dev: body.dev, other };
}

async function handle(req, env) {
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) });
  if (req.method === 'GET') {
    if (url.pathname === '/' || url.pathname === '/health') return json({ ok: true, service: 'schmetterlingsfutter-relay', time: now() }, 200, req, env);
    return err('not found', 404, req, env);
  }
  if (req.method !== 'POST') return err('method', 405, req, env);
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) return err('too large', 413, req, env);
  let body;
  try { const text = await req.text(); if (text.length > MAX_BODY) return err('too large', 413, req, env); body = JSON.parse(text || '{}'); } catch (e) { return err('bad json', 400, req, env); }
  if (!body || typeof body !== 'object') return err('bad json', 400, req, env);
  const t = now();

  /* ---- Paar anlegen ---- */
  if (url.pathname === '/pair/new') {
    if (!isDev(body.dev)) return err('dev', 400, req, env);
    for (let i = 0; i < 5; i++) {
      const id = randomCode(6), tok = randomHex(16);
      try {
        await env.DB.prepare('INSERT INTO pairs (id, created, a_dev, a_tok, last_seen) VALUES (?, ?, ?, ?, ?)').bind(id, t, body.dev, tok, t).run();
        return json({ pair: id, token: tok }, 200, req, env);
      } catch (e) { /* ID-Kollision: nochmal */ }
    }
    return err('retry', 503, req, env);
  }
  /* ---- Paar beitreten ---- */
  if (url.pathname === '/pair/join') {
    if (!isPair(body.pair) || !isDev(body.dev)) return err('input', 400, req, env);
    const p = await env.DB.prepare('SELECT * FROM pairs WHERE id = ?').bind(body.pair).first();
    if (!p) return err('unknown', 404, req, env);
    if (p.a_dev === body.dev) return err('same device', 409, req, env);
    if (p.b_dev && p.b_dev !== body.dev) return err('full', 409, req, env);
    const tok = randomHex(16);
    await env.DB.prepare('UPDATE pairs SET b_dev = ?, b_tok = ?, last_seen = ? WHERE id = ? AND (b_dev IS NULL OR b_dev = ?)').bind(body.dev, tok, t, body.pair, body.dev).run();
    return json({ token: tok }, 200, req, env);
  }

  /* ---- Idee spenden (ohne Anmeldung) ---- */
  if (url.pathname === '/idea') {
    const kind = typeof body.kind === 'string' ? body.kind : '';
    const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
    if (!IDEA_KINDS.includes(kind) || text.length < IDEA_MIN || text.length > IDEA_MAX) return err('input', 400, req, env);
    const day = new Date(t).toISOString().slice(0, 10);
    const who = await shortHash(day + '|' + (req.headers.get('CF-Connecting-IP') || 'local') + '|idee');
    const total = await env.DB.prepare('SELECT COALESCE(SUM(n), 0) AS n FROM idea_rate WHERE day = ?').bind(day).first();
    if (total && total.n >= IDEA_TOTAL_DAY) return err('later', 429, req, env);
    const mine = await env.DB.prepare('SELECT n FROM idea_rate WHERE day = ? AND who = ?').bind(day, who).first();
    if (mine && mine.n >= IDEA_PER_DAY) return err('limit', 429, req, env);
    await env.DB.batch([
      env.DB.prepare('INSERT INTO ideas (day, kind, text, adult, app) VALUES (?, ?, ?, ?, ?)').bind(day, kind, text, body.adult ? 1 : 0, typeof body.app === 'string' ? body.app.slice(0, 12) : null),
      env.DB.prepare('INSERT INTO idea_rate (day, who, n) VALUES (?, ?, 1) ON CONFLICT(day, who) DO UPDATE SET n = n + 1').bind(day, who)
    ]);
    return json({ ok: true }, 200, req, env);
  }

  const a = await auth(env, body);
  if (!a) return err('auth', 401, req, env);
  await env.DB.prepare('UPDATE pairs SET last_seen = ? WHERE id = ?').bind(t, a.pair.id).run();

  /* ---- Status ---- */
  if (url.pathname === '/status') {
    const inbox = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE pair_id = ? AND to_dev = ?').bind(a.pair.id, a.dev).first();
    const decks = await env.DB.prepare('SELECT dev, deck, updated FROM answers WHERE pair_id = ?').bind(a.pair.id).all();
    const d = {};
    (decks.results || []).forEach((r) => { d[r.deck] = d[r.deck] || {}; d[r.deck][r.dev === a.dev ? 'mine' : 'partner'] = r.updated; });
    return json({ joined: !!a.other, inbox: inbox ? inbox.n : 0, decks: d }, 200, req, env);
  }
  /* ---- Verbindung trennen: alles löschen ---- */
  if (url.pathname === '/pair/leave') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM messages WHERE pair_id = ?').bind(a.pair.id),
      env.DB.prepare('DELETE FROM answers WHERE pair_id = ?').bind(a.pair.id),
      env.DB.prepare('DELETE FROM pairs WHERE id = ?').bind(a.pair.id)
    ]);
    return json({ ok: true }, 200, req, env);
  }
  /* ---- Match: eigene Hashes ablegen ---- */
  if (url.pathname === '/match/put') {
    if (!isDeck(body.deck) || !Array.isArray(body.hashes) || body.hashes.length > MAX_HASHES) return err('input', 400, req, env);
    if (!body.hashes.every((h) => typeof h === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(h))) return err('hash', 400, req, env);
    const uniq = Array.from(new Set(body.hashes));
    await env.DB.prepare('INSERT INTO answers (pair_id, dev, deck, hashes, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(pair_id, dev, deck) DO UPDATE SET hashes = excluded.hashes, updated = excluded.updated')
      .bind(a.pair.id, a.dev, body.deck, JSON.stringify(uniq), t).run();
    // Tages-Decks (z. B. bock_20261109): ältere Tage desselben Geräts aufräumen
    const m = /^([a-z]+)_\d{8}$/.exec(body.deck);
    if (m) await env.DB.prepare("DELETE FROM answers WHERE pair_id = ? AND dev = ? AND deck LIKE ? AND deck != ?").bind(a.pair.id, a.dev, m[1] + '\\_%', body.deck).run().catch(() => {});
    return json({ ok: true, updated: t }, 200, req, env);
  }
  /* ---- Match: Schnittmenge holen (nur Hashes, die beide haben) ---- */
  if (url.pathname === '/match/get') {
    if (!isDeck(body.deck)) return err('input', 400, req, env);
    const rows = await env.DB.prepare('SELECT dev, hashes, updated FROM answers WHERE pair_id = ? AND deck = ?').bind(a.pair.id, body.deck).all();
    let mine = null, partner = null;
    (rows.results || []).forEach((r) => { if (r.dev === a.dev) mine = r; else partner = r; });
    if (!mine) return json({ mine: false, partner: !!partner, matches: [] }, 200, req, env);
    if (!partner) return json({ mine: true, partner: false, matches: [], updated: mine.updated }, 200, req, env);
    const set = new Set(JSON.parse(partner.hashes));
    const matches = JSON.parse(mine.hashes).filter((h) => set.has(h));
    return json({ mine: true, partner: true, matches, updated: mine.updated, partnerUpdated: partner.updated }, 200, req, env);
  }
  /* ---- Match: eigene Antworten löschen ---- */
  if (url.pathname === '/match/clear') {
    if (!isDeck(body.deck)) return err('input', 400, req, env);
    await env.DB.prepare('DELETE FROM answers WHERE pair_id = ? AND dev = ? AND deck = ?').bind(a.pair.id, a.dev, body.deck).run();
    return json({ ok: true }, 200, req, env);
  }
  /* ---- Nachricht an den Partner (verschlüsselt) ---- */
  if (url.pathname === '/msg/send') {
    if (!a.other) return err('no partner', 409, req, env);
    if (typeof body.body !== 'string' || !body.body || body.body.length > MAX_MSG_BODY) return err('input', 400, req, env);
    await env.DB.prepare('INSERT INTO messages (pair_id, to_dev, body, created) VALUES (?, ?, ?, ?)').bind(a.pair.id, a.other, body.body, t).run();
    await env.DB.prepare('DELETE FROM messages WHERE pair_id = ? AND id NOT IN (SELECT id FROM messages WHERE pair_id = ? ORDER BY id DESC LIMIT ?)').bind(a.pair.id, a.pair.id, MAX_MSGS_PER_PAIR).run();
    return json({ ok: true }, 200, req, env);
  }
  /* ---- Nachrichten abholen (werden erst mit /msg/ack gelöscht) ---- */
  if (url.pathname === '/msg/pull') {
    const rows = await env.DB.prepare('SELECT id, body, created FROM messages WHERE pair_id = ? AND to_dev = ? ORDER BY id ASC LIMIT 50').bind(a.pair.id, a.dev).all();
    return json({ joined: !!a.other, messages: rows.results || [] }, 200, req, env);
  }
  if (url.pathname === '/msg/ack') {
    if (!Array.isArray(body.ids) || body.ids.length > 100 || !body.ids.every((i) => Number.isInteger(i))) return err('input', 400, req, env);
    if (body.ids.length) {
      const marks = body.ids.map(() => '?').join(',');
      await env.DB.prepare('DELETE FROM messages WHERE pair_id = ? AND to_dev = ? AND id IN (' + marks + ')').bind(a.pair.id, a.dev, ...body.ids).run();
    }
    return json({ ok: true }, 200, req, env);
  }
  return err('not found', 404, req, env);
}

async function cleanup(env) {
  const t = now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM messages WHERE created < ?').bind(t - MSG_DAYS * 86400000),
    env.DB.prepare('DELETE FROM pairs WHERE b_dev IS NULL AND created < ?').bind(t - UNJOINED_HOURS * 3600000),
    env.DB.prepare('DELETE FROM pairs WHERE last_seen < ?').bind(t - PAIR_IDLE_DAYS * 86400000),
    env.DB.prepare('DELETE FROM answers WHERE pair_id NOT IN (SELECT id FROM pairs)'),
    env.DB.prepare('DELETE FROM messages WHERE pair_id NOT IN (SELECT id FROM pairs)'),
    env.DB.prepare('DELETE FROM idea_rate WHERE day < ?').bind(new Date(t).toISOString().slice(0, 10))
  ]);
}

export default {
  async fetch(req, env) {
    try { return await handle(req, env); }
    catch (e) { return json({ error: 'server', detail: String(e && e.message || e) }, 500, req, env); }
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(cleanup(env)); }
};
