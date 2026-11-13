/* ========== Schmetterlingsfutter – Partner-Verbindung, Gleichklang-Spiele, Passend-dazu-Tipps ==========
   Partner-Verbindung: zwei Apps koppeln sich über einen Paar-Code. Der Code enthält eine Paar-ID (kennt der
   Relay-Dienst) und ein Geheimnis (kennt nur das Paar). Aus dem Geheimnis entstehen die Schlüssel für
   Ende-zu-Ende-Verschlüsselung (Nachrichten) und HMAC-Hashes (Match-Spiele). Der Dienst sieht nie Klartext.
   Ohne Verbindung laufen die Spiele im „Handy weitergeben“-Modus komplett offline. */
(function () {
  'use strict';
  const L = window.LZ, D = window.LUZIFER_DATA;
  const $ = (id) => document.getElementById(id);
  const S = () => L.S;
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); };
  const subtle = (window.crypto && window.crypto.subtle) ? window.crypto.subtle : null;
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  let useProd = false; try { useProd = localStorage.getItem('sf.relay') === 'prod'; } catch (e) {}
  const RELAY = (isLocal && !useProd) ? 'http://localhost:8787' : (D.relayUrl || '').replace(/\/$/, ''); // lokal gegen den lokalen Dienst testen

  /* ---------- Zustand ---------- */
  function P() { const s = S(); if (!s.partner) s.partner = null; if (!s.inbox) s.inbox = []; if (!s.matches) s.matches = {}; return s; }
  const paired = () => !!(P().partner && P().partner.pair && P().partner.token);
  const joined = () => paired() && !!P().partner.joined;
  const partnerName = () => (P().partner && P().partner.name) || S().receiver;
  function randomCode(len) { const b = new Uint8Array(len); crypto.getRandomValues(b); let s = ''; for (let i = 0; i < len; i++) s += ALPHABET[b[i] % ALPHABET.length]; return s; }
  function randomHex(n) { const b = new Uint8Array(n); crypto.getRandomValues(b); return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(''); }
  function devId() { const s = P(); if (!s.deviceId) { s.deviceId = randomHex(16); L.save(); } return s.deviceId; }
  const fmtCode = (pair, secret) => pair + '-' + secret.slice(0, 6) + '-' + secret.slice(6);
  function parseCode(raw) {
    const clean = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/0/g, 'O').replace(/1/g, 'I');
    if (clean.length !== 18 || !/^[A-Z2-9]+$/.test(clean)) return null;
    return { pair: clean.slice(0, 6), secret: clean.slice(6) };
  }

  /* ---------- Krypto ---------- */
  let keys = null, keysFor = '';
  async function getKeys() {
    const p = P().partner; if (!p || !subtle) return null;
    const id = p.pair + '|' + p.secret; if (keys && keysFor === id) return keys;
    const base = await subtle.importKey('raw', enc.encode(p.secret), 'HKDF', false, ['deriveKey']);
    const salt = enc.encode('schmetterlingsfutter|' + p.pair);
    const aes = await subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('aes') }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const mac = await subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('mac') }, base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
    keys = { aes, mac }; keysFor = id; return keys;
  }
  async function hmac(text) { const k = await getKeys(); const sig = await subtle.sign('HMAC', k.mac, enc.encode(text)); return b64u(sig.slice(0, 16)); }
  async function encrypt(obj) {
    const k = await getKeys(); const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, k.aes, enc.encode(JSON.stringify(obj)));
    return b64u(iv) + '.' + b64u(ct);
  }
  async function decrypt(body) {
    try { const k = await getKeys(); const [iv, ct] = body.split('.'); const pt = await subtle.decrypt({ name: 'AES-GCM', iv: unb64u(iv) }, k.aes, unb64u(ct)); return JSON.parse(dec.decode(pt)); }
    catch (e) { return null; }
  }

  /* ---------- Relay-Client ---------- */
  async function post(path, body, noAuth) {
    if (!RELAY) throw new Error('Kein Relay konfiguriert');
    const p = P().partner || {};
    const payload = Object.assign(noAuth ? {} : { pair: p.pair, dev: devId(), token: p.token }, body || {});
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 12000);
    let res;
    try { res = await fetch(RELAY + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal }); }
    finally { clearTimeout(to); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || ('HTTP ' + res.status)); e.code = data.error; e.status = res.status; throw e; }
    return data;
  }
  const online = () => navigator.onLine !== false;

  /* ---------- Koppeln ---------- */
  async function createPair() {
    const r = await post('/pair/new', { dev: devId() }, true);
    P().partner = { pair: r.pair, token: r.token, secret: randomCode(12), role: 'a', joined: false, name: '', since: new Date().toISOString() };
    L.save(); keys = null; return P().partner;
  }
  async function joinPair(code) {
    const c = parseCode(code); if (!c) throw new Error('Code unvollständig – 18 Zeichen, z. B. ABCDEF-GHJKLM-NPQRST');
    const r = await post('/pair/join', { pair: c.pair, dev: devId() }, true);
    P().partner = { pair: c.pair, token: r.token, secret: c.secret, role: 'b', joined: true, name: '', since: new Date().toISOString() };
    L.save(); keys = null;
    await send(Object.assign({ t: 'hello', name: S().sender, pron: S().pron || '' }, window.LZD ? { dates: window.LZD.payload() } : {}));
    return P().partner;
  }
  async function leavePair(silent) {
    if (paired() && online()) { try { await post('/pair/leave', {}); } catch (e) { /* schon weg */ } }
    pushLocalOff();
    P().partner = null; P().matches = {}; P().inbox = P().inbox.filter((m) => m.t !== 'match'); L.save(); keys = null;
    if (!silent) { L.toast('Verbindung getrennt'); renderAll(); }
  }
  function pairLink() { const p = P().partner; return (location.hostname === 'mojambaauto.github.io' ? 'https://app.schmetterlingsfutter.de/' : location.origin + location.pathname) + '?pair=' + fmtCode(p.pair, p.secret); }

  /* ---------- Nachrichten ---------- */
  const QUIET = { hello: 1, seen: 1, matchdone: 1 }; // kein Anstupsen: Begrüßung, Lesebestätigung, Abgleich
  async function send(obj) {
    if (!paired()) throw new Error('Nicht verbunden');
    if (window.LZR) obj = window.LZR.attach(obj);
    if (obj.t === 'hello' && window.LZW) obj = Object.assign({ likes: window.LZW.payload() }, obj);
    const at = Date.now();
    const body = await encrypt(Object.assign({ at }, obj));
    const res = await post('/msg/send', QUIET[obj.t] ? { body, quiet: true } : { body });
    if (!QUIET[obj.t]) { noteSent(obj, at); window.LZS && window.LZS.count('send:' + obj.t); }
    // jede Geste an den Schatz ist Futter für den gemeinsamen Schmetterling
    if (window.LZX && obj.t !== 'hello' && obj.t !== 'matchdone') { try { window.LZX.feed(obj.t); } catch (e) {} }
    return res;
  }
  let pulling = false, lastPull = 0;
  async function pull(force) {
    if (!paired() || !online() || pulling) return; if (!force && Date.now() - lastPull < 8000) return;
    pulling = true;
    try {
      const r = await post('/msg/pull', {});
      lastPull = Date.now();
      const p = P().partner;
      if (r.joined && !p.joined) { p.joined = true; L.save(); if (window.LZC) setTimeout(() => { if (document.querySelector('#sheet [data-qr]')) L.closeSheet(); window.LZC.celebrate(); }, 700); }
      const ids = []; let news = 0;
      for (const m of r.messages || []) {
        ids.push(m.id);
        const obj = await decrypt(m.body); if (!obj) continue;
        const before = new Set(P().inbox.map((e) => e.id));
        if (await handleIncoming(obj, m.created)) news++;
        /* Sendezeit merken: damit bestätigt die App später „gesehen“, ohne Inhalte zu wiederholen */
        if (typeof obj.at === 'number') P().inbox.forEach((e) => { if (!before.has(e.id) && !e.sat) e.sat = obj.at; });
        /* Bezug „↩ Antwort auf …“ (3.26.0) */
        if (obj.re && window.LZR) { const re = window.LZR.clean(obj.re); if (re) P().inbox.forEach((e) => { if (!before.has(e.id) && !e.re) e.re = re; }); }
      }
      if (ids.length) await post('/msg/ack', { ids });
      if (news) { L.save(); renderAll(); }
      else if (r.joined !== undefined) renderAll();
    } catch (e) {
      if (e.status === 401) { /* Paar wurde vom Partner getrennt */ pushLocalOff(); P().partner = null; L.save(); renderAll(); L.toast(partnerName() + ' hat die Verbindung getrennt'); }
    } finally { pulling = false; }
  }
  async function handleIncoming(obj, created) {
    const s = P(); const p = s.partner; const name = (obj.name || '').toString().slice(0, 18);
    if (obj.t === 'hello') {
      const first = !p.name;
      if (name) p.name = name;
      if (typeof obj.pron === 'string') p.pron = obj.pron.slice(0, 20);
      if (typeof obj.food === 'number' && window.LZX) { try { window.LZX.theirFood(obj.food); } catch (e) {} }
      if (name && S().receiver !== name) { S().receiver = name; L.renderHeader(); }
      if (obj.dates && window.LZD) { try { window.LZD.got(obj.dates); } catch (e) {} }
      if (Array.isArray(obj.likes) && window.LZW) { try { window.LZW.got(obj.likes); } catch (e) {} }
      if (first) { try { await send(Object.assign({ t: 'hello', name: S().sender, pron: S().pron || '', reply: true }, window.LZD ? { dates: window.LZD.payload() } : {})); } catch (e) {} L.toast('💞 Verbunden mit ' + (name || 'deinem Schatz')); L.spawnHearts(14); }
      if (Array.isArray(obj.seen)) gotSeen(obj.seen, created);
      return true;
    }
    if (obj.t === 'msg') {
      s.inbox.push({ id: uid('m'), t: 'msg', text: String(obj.text || '').slice(0, 600), label: String(obj.label || '').slice(0, 40), at: created || Date.now(), read: false });
      L.toast('💌 Neue Botschaft von ' + partnerName()); L.haptic(20); return true;
    }
    if (obj.t === 'coupon') {
      const c = { id: uid('p'), icon: String(obj.icon || '🎁').slice(0, 4), title: String(obj.title || 'Gutschein').slice(0, 50), desc: String(obj.desc || '').slice(0, 120), used: null, from: partnerName() };
      S().coupons.push(c);
      s.inbox.push({ id: uid('m'), t: 'coupon', text: c.icon + ' ' + c.title, at: created || Date.now(), read: false });
      L.toast('🎟️ Neuer Gutschein von ' + partnerName()); return true;
    }
    if (obj.t === 'match') {
      const deck = D.decks.find((d) => d.id === obj.deck); if (!deck) return false;
      /* Habe ich diese Runde schon gespielt, ist das keine Einladung, sondern: Ergebnis da */
      const own = s.matches[deck.id];
      if (own && own.mode === 'relay' && own.sd && own.sd === obj.sd && !own.expired) {
        own.stale = true; own.partnerDone = true;
        s.inbox = s.inbox.filter((m) => !(m.t === 'match' && m.deck === deck.id));
        s.inbox.push({ id: uid('m'), t: 'match', deck: deck.id, ready: true, text: deck.icon + ' ' + deck.title, at: created || Date.now(), read: false });
        L.toast('✨ ' + partnerName() + ' hat auch geantwortet: „' + deck.title + '“ – Ergebnis ansehen'); L.haptic(20); return true;
      }
      if (typeof obj.sd === 'string' && /^[a-z]+_\d{8}$/.test(obj.sd) && obj.sd.indexOf(deck.id + '_') === 0) { s.invites = s.invites || {}; s.invites[deck.id] = { sd: obj.sd, at: created || Date.now() }; }
      s.inbox = s.inbox.filter((m) => !(m.t === 'match' && m.deck === deck.id));
      s.inbox.push({ id: uid('m'), t: 'match', deck: deck.id, text: deck.icon + ' ' + deck.title, at: created || Date.now(), read: false });
      L.toast('🎯 ' + partnerName() + ' hat „' + deck.title + '“ gespielt – spiel mit!'); return true;
    }
    if (obj.t === 'matchdone') { const m = s.matches[obj.deck]; if (m) m.stale = true; return true; }
    if (ext[obj.t]) { try { return !!(await ext[obj.t](obj, created)); } catch (e) { return false; } }
    /* Unbekannte Art (neuere App-Version beim Partner): nicht verschlucken, sondern anzeigen */
    s.inbox.push({ id: uid('m'), t: 'unknown', text: 'Neue Art von Nachricht – bitte die App aktualisieren (einmal schließen und neu öffnen).', at: created || Date.now(), read: false });
    return true;
  }
  /* Erweiterungen (naehe.js): eigene Nachrichtenarten und Postfach-Einträge */
  const ext = {}, inboxTypes = {};
  const on = (type, fn) => { ext[type] = fn; };
  const inboxType = (type, def) => { inboxTypes[type] = def; };
  const unread = () => P().inbox.filter((m) => !m.read).length;

  /* ---------- Gesehen? (3.19.0) ----------
     Gesendetes merkt sich die App knapp (Art, Zeit, kurzer Text). Liest der Schatz es, schickt seine App die Sendezeit zurück,
     angehängt an die stille Begrüßung (ältere App-Versionen ignorieren das Feld). Bewusst ohne Uhrzeit des Lesens: kein Druck. */
  function noteSent(obj, at) {
    const s = P(); if (!s.outbox) s.outbox = [];
    const o = { at, t: obj.t, deck: obj.deck || '', sd: obj.sd || '', text: String(obj.text || obj.title || '').slice(0, 60), seen: false };
    /* 3.43.0, nur lokal für den Verlauf „Post“: Bezug, Spiel und Spielart */
    if (obj.re && obj.re.text) o.re = { text: String(obj.re.text).slice(0, 60), t: String(obj.re.t || 'msg').slice(0, 10) };
    const gid = obj.gid || ((obj.t === 'game' || obj.t === 'spiel') && obj.id) || ''; if (gid) o.gid = String(gid).slice(0, 40);
    if (obj.k || obj.g) o.k = String(obj.k || obj.g).slice(0, 20);
    s.outbox.push(o);
    if (s.outbox.length > 40) s.outbox = s.outbox.slice(-40);
    L.save();
  }
  function gotSeen(list, created) {
    const s = P(); if (!s.outbox) return; let msg = false;
    list.forEach((at) => { const o = s.outbox.find((x) => x.at === at); if (o && !o.seen) { o.seen = true; o.seenAt = created || Date.now(); if (o.t !== 'match') msg = true; } });
    if (msg) L.toast('❤ ' + partnerName() + ' hat deine Nachricht gesehen');
  }
  let seenTimer = null;
  function flushSeen() {
    clearTimeout(seenTimer);
    seenTimer = setTimeout(async () => {
      if (!paired() || !joined() || !online()) return;
      const s = P(); const todo = s.inbox.filter((m) => m.read && m.sat && !m.acked); if (!todo.length) return;
      try { await send({ t: 'hello', name: S().sender, pron: S().pron || '', seen: todo.map((m) => m.sat).slice(-20) }); todo.forEach((m) => { m.acked = true; }); L.save(); } catch (e) { /* nächstes Mal */ }
    }, 1500);
  }
  /* Was gerade zwischen euch läuft: wer ist dran, was wartet, was ist fertig */
  const sentFor = (deck, sd) => (P().outbox || []).slice().reverse().find((o) => o.t === 'match' && o.deck === deck.id && (!sd || o.sd === sd));
  function deckStatus(deck) {
    if (!paired() || !joined()) return null;
    const s = P(); const rec = s.matches[deck.id]; const iv = (s.invites || {})[deck.id];
    const today = deck.daily ? deck.id + '_' + L.todayKey().replace(/-/g, '') : null;
    if (rec && rec.mode === 'relay' && rec.stale && !rec.expired) return { kind: 'ready' };
    if (iv && iv.sd && Date.now() - iv.at < 12 * 864e5 && !(rec && rec.sd === iv.sd) && (!deck.daily || iv.sd === today)) return { kind: 'turn' };
    if (rec && rec.mode === 'relay' && rec.matches === null && !rec.expired && Date.now() - Date.parse(rec.date) < 12 * 864e5 && (!deck.daily || rec.date.slice(0, 10) === L.todayKey())) {
      const o = sentFor(deck, rec.sd); return { kind: 'wait', seen: !!(o && o.seen) };
    }
    return null;
  }
  function activity() {
    const out = [];
    D.decks.forEach((deck) => { if (deck.adult && !S().intim) return; const st = deckStatus(deck); if (st) out.push(Object.assign({ deck }, st)); });
    if (window.LZG) { try { window.LZG.activity().forEach((a) => out.push(a)); } catch (e) {} }
    const order = { turn: 0, ready: 1, wait: 2 }; out.sort((a, b) => order[a.kind] - order[b.kind]);
    return out;
  }
  function lastSent() {
    const o = (P().outbox || []).slice().reverse().find((x) => x.t !== 'match');
    return o && Date.now() - o.at < 7 * 864e5 ? o : null;
  }
  function openDeckFromStatus(deck) {
    const rec = P().matches[deck.id]; const st = deckStatus(deck);
    if (st && (st.kind === 'ready' || st.kind === 'wait')) { showResults(deck, rec); refreshMatches(deck, rec, true).catch(() => {}); }
    else playDeck(deck.id);
  }
  /* Erkunden: welche Karten eines Spiels schon dran waren */
  function noteExplored(deck, ids) {
    const s = P(); if (!s.explored) s.explored = {}; const set = new Set(s.explored[deck.id] || []);
    ids.forEach((id) => set.add(id)); s.explored[deck.id] = Array.from(set); L.save();
  }
  function explored(deck) {
    const s = P(); if (!s.explored) s.explored = {};
    if (!s.explored[deck.id]) { const rec = s.matches[deck.id]; if (rec && rec.sd) s.explored[deck.id] = roundItems(deck, rec.sd).map((it) => it.id); }
    const ids = new Set(deck.items.map((it) => it.id));
    return (s.explored[deck.id] || []).filter((id) => ids.has(id)).length;
  }

  /* ---------- Senden oder Teilen ---------- */
  function sendOrShare(text, label) {
    const on = paired() && joined();
    const ra = window.LZR && on ? window.LZR.active() : null;
    L.openSheet('<h3>Wohin damit?</h3>' + (ra ? window.LZR.quoteHtml(ra, '') : '') + '<p class="about" style="margin-bottom:14px;font-size:17px">' + L.esc(text.length > 160 ? text.slice(0, 160) + '…' : text) + '</p>' +
      '<div class="row wrap">' + (on ? '<button class="pill-btn primary" data-app>💌 In die App von ' + L.esc(partnerName()) + '</button>' : '') + '<button class="pill-btn' + (on ? '' : ' primary') + '" data-card>🖼️ Als Bild teilen</button><button class="pill-btn" data-share>↗ Als Text teilen</button><button class="pill-btn ghost" data-cancel>Abbrechen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-share]').onclick = () => { L.closeSheet(); L.shareText(text + '\n— ' + S().sender + ' ❤'); };
      sh.querySelector('[data-card]').onclick = () => { L.closeSheet(); if (window.LZX) window.LZX.shareCard({ text, label: label || '', sig: S().sender }); else L.shareText(text + '\n— ' + S().sender + ' ❤'); };
      const ab = sh.querySelector('[data-app]'); if (ab) ab.onclick = async () => {
        L.closeSheet();
        try { await send({ t: 'msg', text, label: label || '' }); L.toast('Zugestellt 💌 – liegt gleich bei ' + partnerName()); L.spawnHearts(8); }
        catch (e) { L.toast('Senden fehlgeschlagen – ' + (online() ? 'später nochmal' : 'offline')); }
      };
    });
  }
  async function sendCoupon(c) {
    try { await send({ t: 'coupon', icon: c.icon, title: c.title, desc: c.desc || '' }); L.toast('Gutschein verschickt 🎟️'); L.spawnHearts(8); }
    catch (e) { L.toast('Senden fehlgeschlagen'); }
  }

  /* ---------- Passend dazu (Amazon-Suchlinks, Werbelinks) ---------- */
  /* adult = Vorschlag steht im 18+-Bereich. Dort wird die Partnerkennung nur angehängt, wenn affiliateAdult eingeschaltet ist
     (Amazon-Programmrichtlinien: Seiten mit sexuellen Inhalten gelten als ungeeignet – Entscheidung liegt bei Mo). */
  const ADULT_KEYS = /^(intim_|match_vorlieben)/;
  function awinUrl(mid, url, ref) { return 'https://www.awin1.com/cread.php?awinmid=' + mid + '&awinaffid=' + encodeURIComponent(D.awinAffId || '') + (ref ? '&clickref=' + encodeURIComponent(ref) : '') + '&ued=' + encodeURIComponent(url); }
  function amazonUrl(q, adult, raw) {
    /* 3.38.0: Vorschläge im 18+-Bereich gehen zum Erotik-Partner (Awin), nicht zu Amazon – dort sind sexuelle Inhalte nicht erlaubt */
    if (adult && D.adultShop && D.awinAffId) return awinUrl(D.adultShop.mid, D.adultShop.search + encodeURIComponent(q), 'sf-zweisamkeit');
    const tag = (adult && !D.affiliateAdult) ? '' : (D.affiliateTag || '').trim();
    /* 3.26.0: Suchbegriff passend zur Person (nicht bei eigener Suche) und Budget als Preisfilter */
    const W = window.LZW; if (W && !raw && !adult) q = W.query(q);
    return 'https://www.amazon.de/s?k=' + encodeURIComponent(q) + (W ? W.priceParam() : '') + (tag ? '&tag=' + encodeURIComponent(tag) : '');
  }
  function tips(key, n) {
    const ad = ADULT_KEYS.test(key);
    const arr = (D.tips[key] || []).filter((t) => t.q); const all = arr.map((t) => (ad ? Object.assign({ adult: true }, t) : t));
    n = Math.min(n || 2, all.length); if (!n) return [];
    /* Reihum statt gewürfelt: jedes Gerät hat seine eigene feste Reihenfolge, ein Zeiger je Funktion rückt bei jedem Zeigen weiter.
       So wiederholt sich ein Vorschlag erst, wenn alle anderen dran waren. */
    const s = S(); if (!s.tipSeed) s.tipSeed = 1 + Math.floor(Math.random() * 1e9); if (!s.tipRot) s.tipRot = {};
    let seed = s.tipSeed; for (const ch of key) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
    const idx = all.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    const start = (s.tipRot[key] || 0) % all.length; const out = [];
    for (let k = 0; k < n; k++) out.push(all[idx[(start + k) % all.length]]);
    s.tipRot[key] = (start + n) % all.length; clearTimeout(tipSave); tipSave = setTimeout(() => L.save(), 800);
    return out;
  }
  let tipSave = null;
  /* Karten dürfen mehrere Suchbegriffe haben. Gewählt wird je Kalenderwoche, damit beide Handys dasselbe sehen. */
  function tipOf(it, week) {
    const t = it && it.tip; if (!t) return ''; if (!Array.isArray(t)) return t; if (!t.length) return '';
    let h = 0; for (const ch of String(it.id || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return t[((week === undefined ? weekNum() : week) + h) % t.length];
  }
  function tipsHtml(items, title) {
    if (!items.length) return '';
    return '<div class="tips"><span class="tips-label">' + L.esc(title || 'Passend dazu') + ' <i class="ad-note">Werbelinks</i></span>' +
      items.map((t) => '<button type="button" class="tip" data-q="' + L.esc(t.q) + '"' + (t.adult ? ' data-adult="1"' : '') + '>' + (t.icon || '🛒') + ' ' + L.esc(t.title) + ' <span>↗</span></button>').join('') + '</div>';
  }
  function bindTips(root) {
    root.querySelectorAll('.tip[data-q]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); window.open(amazonUrl(b.dataset.q, b.dataset.adult === '1'), '_blank', 'noopener'); }; });
  }
  /* Eigene Suche (3.19.0): für Anlässe und Ideen, die die App nicht kennt. Öffnet die Amazon-Suche im Browser (Werbelink). */
  function searchFormHtml(ph, val) {
    return '<form class="own-search" role="search"><input type="search" enterkeyhint="search" maxlength="80" placeholder="' + L.esc(ph || 'Eigene Idee suchen, z. B. Kochkurs') + '" aria-label="Eigene Suche bei Amazon" value="' + L.esc(val || '') + '"><button type="submit" class="pill-btn small" aria-label="Bei Amazon suchen">🔍</button></form>';
  }
  function bindSearch(root, adult) {
    root.querySelectorAll('form.own-search').forEach((f) => { f.onsubmit = (e) => { e.preventDefault(); const q = f.querySelector('input').value.trim(); if (!q) { f.querySelector('input').focus(); return; } if (window.LZS) { window.LZS.count('shop_search:' + ((f.closest('[id]') || {}).id || 'sonst')); window.LZS.term('shop', q); } window.open(amazonUrl(q, adult, true), '_blank', 'noopener'); }; });
  }
  function searchSheet(prefill) {
    L.openSheet('<h3>🔍 Selbst suchen</h3><p class="about" style="font-size:17px;margin-bottom:10px">Für alles, wofür die App noch keine Idee hat: Anlass, Hobby, Geschenk.</p>' + searchFormHtml('', prefill) +
      '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:10px"><span class="ad-note">Werbelink</span> – öffnet die Amazon-Suche im Browser. Bei einem Kauf erhält der Anbieter eine Provision.</p><div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet; bindSearch(sh); const i = sh.querySelector('input'); setTimeout(() => i.focus(), 120);
    });
  }
  function mountTips(container, key, title, n) {
    if (!container) return; const items = typeof key === 'string' ? tips(key, n) : key;
    container.innerHTML = tipsHtml(items, title); bindTips(container);
  }

  /* ---------- Gleichklang (Match-Spiele) ---------- */
  const deckById = (id) => D.decks.find((d) => d.id === id);
  /* Kurze Runden: jede Runde zeigt nur einen Teil der Karten. Der Rundenschlüssel (Tag bzw. Woche + eigener Vorlauf)
     bestimmt die Auswahl, damit beide Handys dieselben Fragen bekommen. Erst wenn alle Karten dran waren, wiederholt sich etwas. */
  const weekNum = () => Math.floor((Date.now() / 864e5 + 3) / 7);
  const serverDeck = (deck) => deck.daily ? deck.id + '_' + L.todayKey().replace(/-/g, '') : deck.id + '_9' + String(weekNum() + ((P().roundShift || {})[deck.id] || 0)).padStart(7, '0');
  function roundIdx(sd) { const m = /_(\d{8})$/.exec(sd || ''); if (!m) return 0; const d = m[1]; return d[0] === '9' ? parseInt(d.slice(1), 10) : Math.floor(Date.parse(d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6) + 'T00:00:00Z') / 864e5); }
  const roundSize = (deck) => deck.round || (deck.talk ? 7 : 8);
  function roundItems(deck, sd) {
    const n = roundSize(deck), all = deck.items; if (all.length <= n) return all.slice();
    let seed = 7; for (const ch of deck.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const idx = all.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    const start = (roundIdx(sd) * n) % all.length; const out = [];
    for (let k = 0; k < n; k++) out.push(all[idx[(start + k) % all.length]]);
    return out;
  }
  /* Hat der Schatz zu einer bestimmten Runde eingeladen, spielen wir genau diese Runde mit. */
  function gameSd(deck, mode) {
    if (mode === 'relay') {
      const iv = (P().invites || {})[deck.id], rec = P().matches[deck.id];
      if (iv && iv.sd && Date.now() - iv.at < 12 * 864e5 && !(rec && rec.sd === iv.sd) && (!deck.daily || iv.sd === serverDeck(deck))) {
        if (!deck.daily) { P().roundShift = P().roundShift || {}; P().roundShift[deck.id] = roundIdx(iv.sd) - weekNum(); L.save(); }
        return iv.sd;
      }
    }
    return serverDeck(deck);
  }
  let game = null;
  function openMatch(html, onMount) { const sc = $('matchScreen'); sc.querySelector('.inner').innerHTML = html; sc.classList.remove('hidden'); if (onMount) onMount(sc); }
  function closeMatch() { $('matchScreen').classList.add('hidden'); game = null; }
  const optLabels = { ja: '👍 Ja', vielleicht: '🤷 Vielleicht', nein: '👎 Nein' };

  function playDeck(deckId, forcePass) {
    const deck = deckById(deckId); if (!deck) return;
    if (deck.adult && !S().intim) { L.toast('Erst den Bereich „Zweisamkeit“ unter Mehr einschalten (18+)'); return; }
    const canRelay = !!(paired() && joined() && RELAY);
    const mode = (!forcePass && canRelay) ? 'relay' : 'pass';
    window.LZS && window.LZS.count('deck_open:' + deck.id);
    { let hit = false; P().inbox.forEach((m) => { if (m.t === 'match' && m.deck === deck.id && !m.read) { m.read = true; hit = true; } }); if (hit) { L.save(); renderInboxBadge(); flushSeen(); } }
    const prev = P().matches[deck.id];
    const sd = gameSd(deck, mode);
    game = { deck, mode, step: 0, who: 'me', mine: {}, theirs: {}, prev, sd, items: roundItems(deck, sd) };
    let html = '<div class="match-head"><button class="icon-btn" data-close aria-label="Schließen">✕</button><div class="eyebrow" style="margin:0">' + (deck.common ? 'Gemeinsam' : 'Gleichklang') + '</div><span></span></div>' +
      '<div class="match-intro"><div class="match-emoji">' + deck.icon + '</div><h2>' + L.esc(deck.title) + '</h2><p class="about">' + L.esc(deck.sub) + '</p>';
    if (canRelay) html += '<div class="seg-mode" role="group" aria-label="Spielweise"><button type="button" data-mode="relay"' + (mode === 'relay' ? ' class="on" aria-pressed="true"' : '') + '>📱📱 Zwei Handys</button><button type="button" data-mode="pass"' + (mode === 'pass' ? ' class="on" aria-pressed="true"' : '') + '>📱 Ein Handy</button></div>';
    html += '<p class="about mode-line">' + (mode === 'relay' ? 'Ihr antwortet beide in der eigenen App.' : 'Erst du, dann ' + L.esc(partnerName()) + '.') + ' ' + game.items.length + ' Fragen.</p>';
    html += '<div class="row wrap" style="margin-top:18px"><button class="pill-btn primary" data-start>' + (deck.daily ? 'Heute antworten' : 'Los geht’s') + '</button>' +
      (prev && prev.matches ? '<button class="pill-btn" data-prev>Letztes Ergebnis</button>' : '') +
      (paired() ? '' : '<button class="pill-btn ghost small" data-connect>Apps verbinden</button>') + '</div></div>';
    openMatch(html, (sc) => {
      sc.querySelector('[data-close]').onclick = closeMatch;
      sc.querySelector('[data-start]').onclick = () => askNext();
      const pv = sc.querySelector('[data-prev]'); if (pv) pv.onclick = () => showResults(deck, prev);
      sc.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { if (b.dataset.mode !== mode) playDeck(deckId, b.dataset.mode === 'pass'); });
      const cn = sc.querySelector('[data-connect]'); if (cn) cn.onclick = () => { closeMatch(); pairSheet(); };
    });
  }
  function askNext() {
    const g = game; const items = g.items || g.deck.items; const i = g.step;
    if (i >= items.length) return finishAnswers();
    const it = items[i]; const who = g.who === 'me' ? S().sender : partnerName();
    const answers = g.who === 'me' ? g.mine : g.theirs;
    const opts = g.deck.opts === 3 ? ['nein', 'vielleicht', 'ja'] : ['nein', 'ja'];
    openMatch('<div class="match-head"><button class="icon-btn" data-close aria-label="Abbrechen">✕</button><div class="eyebrow" style="margin:0">' + L.esc(who) + ' antwortet</div><span class="tag">' + (i + 1) + ' / ' + items.length + '</span></div>' +
      '<div class="progress" style="margin:0 0 20px"><i style="width:' + Math.round(i / items.length * 100) + '%"></i></div>' +
      (g.deck.prompt ? '<div class="match-prompt">' + L.esc(g.deck.prompt) + '</div>' : '') +
      '<div class="match-card"><div class="match-emoji">' + it.e + '</div><div class="match-q">' + L.esc(it.t) + '</div></div>' +
      '<div class="match-opts' + (g.deck.labels ? ' stack' : '') + '">' + opts.map((o) => '<button class="pill-btn ' + (o === 'ja' ? 'primary' : '') + '" data-a="' + o + '">' + (g.deck.labels || optLabels)[o] + '</button>').join('') + '</div>' +
      '<div class="row wrap" style="margin-top:14px">' + (i > 0 ? '<button class="pill-btn ghost small" data-back>Zurück</button><button class="pill-btn ghost small" data-done>Das reicht für heute</button>' : '') + '</div>', (sc) => {
      sc.querySelector('[data-close]').onclick = () => L.confirmSheet('Spiel beenden?', 'Deine Antworten gehen verloren.', 'Beenden', () => { window.LZS && window.LZS.count('deck_abort:' + g.deck.id + ':' + g.step); closeMatch(); }, true, 'Weiterspielen');
      const dn = sc.querySelector('[data-done]'); if (dn) dn.onclick = () => { window.LZS && window.LZS.count('deck_short:' + g.deck.id); g.step = items.length; finishAnswers(); };
      sc.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { answers[it.id] = b.dataset.a; L.haptic(6); g.step++; askNext(); });
      const bk = sc.querySelector('[data-back]'); if (bk) bk.onclick = () => { g.step--; askNext(); };
    });
  }
  async function finishAnswers() {
    const g = game; const deck = g.deck;
    if (g.who === 'me') { noteExplored(deck, Object.keys(g.mine)); window.LZS && window.LZS.count('deck_done:' + deck.id + ':' + g.mode); }
    if (g.mode === 'pass') {
      if (g.who === 'me') {
        g.who = 'them'; g.step = 0;
        const answered = (g.items || deck.items).filter((it) => g.mine[it.id]); if (answered.length) g.items = answered;
        openMatch('<div class="match-head"><button class="icon-btn" data-close aria-label="Abbrechen">✕</button><div class="eyebrow" style="margin:0">Handy weitergeben</div><span></span></div>' +
          '<div class="match-intro"><div class="match-emoji">📲</div><h2>Jetzt ' + L.esc(partnerName()) + '</h2><p class="about">' + L.esc(S().sender) + ', gib das Handy weiter und schau nicht hin. ' + L.esc(partnerName()) + ' antwortet für sich – sichtbar wird nachher nur, was ihr beide wollt.</p>' +
          '<div class="row" style="margin-top:18px"><button class="pill-btn primary" data-start>Ich bin ' + L.esc(partnerName()) + ' – los</button></div></div>', (sc) => {
          sc.querySelector('[data-close]').onclick = () => L.confirmSheet('Spiel beenden?', 'Die Antworten gehen verloren.', 'Beenden', closeMatch, true, 'Weiterspielen');
          sc.querySelector('[data-start]').onclick = () => askNext();
        });
        return;
      }
      const res = computeMatches(deck, g.mine, g.theirs);
      const rec = { date: new Date().toISOString(), mode: 'pass', mine: yesList(g.mine), matches: res.yes, open: res.open, partnerDone: true };
      P().matches[deck.id] = rec; L.save();
      openMatch('<div class="match-head"><span></span><div class="eyebrow" style="margin:0">Beide fertig</div><span></span></div><div class="match-intro"><div class="match-emoji">🤝</div><h2>Gemeinsam anschauen</h2><p class="about">Holt euch zusammen vors Handy. Angezeigt wird nur, was ihr beide angetippt habt.</p><div class="row" style="margin-top:18px"><button class="pill-btn primary" data-show>Ergebnis zeigen ✨</button></div></div>', (sc) => {
        sc.querySelector('[data-show]').onclick = () => showResults(deck, rec);
      });
      return;
    }
    /* Relay-Modus: Hashes hochladen, Schnittmenge holen */
    openMatch('<div class="match-head"><span></span><div class="eyebrow" style="margin:0">Übertrage …</div><span></span></div><div class="match-intro"><div class="match-emoji">🔒</div><p class="about">Deine Antworten werden verschlüsselt verglichen.</p></div>');
    try {
      const sd = g.sd || serverDeck(deck);
      const hashes = await hashesFor(deck, sd, g.mine);
      await post('/match/put', { deck: sd, hashes });
      const rec = { date: new Date().toISOString(), mode: 'relay', mine: yesList(g.mine), open: [], matches: null, partnerDone: false, sd };
      P().matches[deck.id] = rec; L.save();
      try { await send({ t: 'match', deck: deck.id, sd }); } catch (e) {}
      await refreshMatches(deck, rec, true);
    } catch (e) {
      openMatch('<div class="match-head"><button class="icon-btn" data-close aria-label="Schließen">✕</button><div class="eyebrow" style="margin:0">Fehler</div><span></span></div><div class="match-intro"><div class="match-emoji">📡</div><h2>Keine Verbindung</h2><p class="about">' + L.esc(e.message || 'Der Relay-Dienst antwortet nicht.') + ' Deine Antworten sind nicht verloren gegangen – versuch es gleich nochmal oder spielt mit „Handy weitergeben“.</p><div class="row wrap" style="margin-top:18px"><button class="pill-btn primary" data-retry>Nochmal senden</button><button class="pill-btn ghost" data-close2>Schließen</button></div></div>', (sc) => {
        sc.querySelector('[data-close]').onclick = closeMatch; sc.querySelector('[data-close2]').onclick = closeMatch;
        sc.querySelector('[data-retry]').onclick = () => finishAnswers();
      });
    }
  }
  const yesList = (ans) => Object.keys(ans).filter((k) => ans[k] === 'ja');
  async function hashesFor(deck, sd, ans) {
    const out = [];
    for (const it of deck.items) {
      if (ans[it.id] === 'ja') out.push(await hmac(sd + '|' + it.id + '|ja'));
      if (deck.opts === 3 && (ans[it.id] === 'ja' || ans[it.id] === 'vielleicht')) out.push(await hmac(sd + '|' + it.id + '|offen'));
    }
    return out;
  }
  function computeMatches(deck, a, b) {
    const yes = [], open = [];
    deck.items.forEach((it) => {
      const ay = a[it.id] === 'ja', by = b[it.id] === 'ja';
      const ao = ay || a[it.id] === 'vielleicht', bo = by || b[it.id] === 'vielleicht';
      if (ay && by) yes.push(it.id); else if (deck.opts === 3 && ao && bo) open.push(it.id);
    });
    return { yes, open };
  }
  async function refreshMatches(deck, rec, show) {
    const sd = rec.sd || serverDeck(deck);
    const r = await post('/match/get', { deck: sd });
    if (!r.mine) { rec.matches = null; rec.partnerDone = !!r.partner; rec.expired = true; L.save(); if (show) showResults(deck, rec); return rec; }
    rec.partnerDone = !!r.partner; rec.stale = false;
    if (r.partner) {
      const set = new Set(r.matches || []); const yes = [], open = [];
      for (const it of deck.items) {
        const hy = await hmac(sd + '|' + it.id + '|ja'); if (set.has(hy)) { yes.push(it.id); continue; }
        if (deck.opts === 3) { const ho = await hmac(sd + '|' + it.id + '|offen'); if (set.has(ho)) open.push(it.id); }
      }
      rec.matches = yes; rec.open = open;
    } else rec.matches = null;
    L.save(); if (show) showResults(deck, rec); return rec;
  }
  function showResults(deck, rec) {
    const name = L.esc(partnerName());
    let html = '<div class="match-head"><button class="icon-btn" data-close aria-label="Schließen">✕</button><div class="eyebrow" style="margin:0">' + L.esc(deck.title) + '</div><span></span></div>';
    if (rec.expired) {
      html += '<div class="match-intro"><div class="match-emoji">⏳</div><h2>Antworten abgelaufen</h2><p class="about">Für diese Runde liegen keine Antworten mehr vor. Spielt einfach neu.</p><div class="row" style="margin-top:18px"><button class="pill-btn primary" data-again>Neu spielen</button></div></div>';
    } else if (!rec.partnerDone || rec.matches === null) {
      const o = rec.mode === 'relay' ? sentFor(deck, rec.sd) : null;
      const seenLine = rec.mode === 'relay' ? '<div class="pstat ' + (o && o.seen ? 'seen' : 'sent') + '">' + (o && o.seen ? '👀 ' + name + ' hat die Einladung gesehen' : '📨 Einladung ist bei ' + name + ' unterwegs') + '</div>' : '';
      html += '<div class="match-intro"><div class="match-emoji">⏳</div><h2>Warte auf ' + name + '</h2>' + seenLine + '<p class="about">Deine Antworten sind da. Sobald ' + name + ' in der eigenen App geantwortet hat, erscheinen hier eure Treffer.</p>' +
        '<div class="row wrap" style="margin-top:18px"><button class="pill-btn primary" data-refresh>Aktualisieren</button><button class="pill-btn" data-share-inv>Erinnerung schicken ↗</button><button class="pill-btn ghost small" data-again>Meine Antworten ändern</button></div></div>';
      /* Beim Warten nicht leer ausgehen: Links zu dem, was ich selbst mag */
      const mineTips = (rec.mine || []).map((id) => deck.items.find((it) => it.id === id)).filter((it) => it && tipOf(it)).slice(0, 3).map((it) => ({ icon: it.e, title: tipOf(it), q: tipOf(it) }));
      if (mineTips.length) html += tipsHtml(mineTips, deck.common ? 'Was du magst' : 'Passend dazu');
      if (!deck.daily && deck.items.length > roundSize(deck)) html += '<p class="about round-note">' + roundNote(deck) + '</p>';
    } else {
      const yes = rec.matches.map((id) => deck.items.find((it) => it.id === id)).filter(Boolean);
      const open = (rec.open || []).map((id) => deck.items.find((it) => it.id === id)).filter(Boolean);
      if (deck.common) noteCommon(deck, rec);
      html += '<div class="match-intro" style="padding-bottom:8px"><div class="match-emoji">' + (yes.length ? '💞' : '🫤') + '</div><h2>' + (yes.length ? yes.length + (deck.common ? (yes.length === 1 ? ' Gemeinsamkeit' : ' Gemeinsamkeiten') : ' Treffer') : (deck.common ? 'Noch nichts Gemeinsames' : 'Kein gemeinsames Ja')) + '</h2>' +
        '<p class="about" style="font-size:17px">' + (yes.length ? (deck.hitText || 'Das wollt ihr beide. Alles andere bleibt geheim.') : (open.length ? 'Aber ihr seid beide bei ein paar Dingen offen – siehe unten.' : (deck.noneText || (deck.daily ? 'Heute nicht. Morgen gibt es neue Chancen – oder jemand gibt nach. 😉' : 'Vielleicht beim nächsten Mal. Papillon empfiehlt: Vielleicht großzügiger antippen.')))) + '</p></div>';
      if (yes.length) html += '<div class="match-list">' + yes.map((it) => matchItem(it, deck.yesLabel || 'Beide Ja', deck.adult)).join('') + '</div>';
      if (open.length) html += '<div class="eyebrow" style="margin-top:14px">' + L.esc(deck.openTitle || 'Beide offen dafür') + '</div><div class="match-list">' + open.map((it) => matchItem(it, deck.common && (rec.mine || []).indexOf(it.id) >= 0 ? 'Dein Ding, ' + name + ' ist neugierig' : (deck.openLabel || 'Vielleicht'), deck.adult)).join('') + '</div>';
      /* Mut-Karte: Themen, die nur mir wichtig sind, bleiben geheim – aber ich bekomme Hilfe, sie selbst anzusprechen */
      if (deck.talk && rec.mode === 'relay') {
        const hidden = (rec.mine || []).filter((id) => !rec.matches.includes(id) && !(rec.open || []).includes(id)).map((id) => deck.items.find((it) => it.id === id)).filter(Boolean);
        if (hidden.length) html += '<div class="card soft" style="margin-top:14px;padding:14px 16px"><div class="eyebrow" style="margin:0 0 6px">🔒 Nur für dich</div><p class="about" style="font-size:17px">' + (hidden.length === 1 ? 'Ein Thema ist dir wichtig, das noch kein Treffer ist.' : hidden.length + ' Themen sind dir wichtig, die noch kein Treffer sind.') + ' ' + name + ' sieht das nicht. Unausgesprochenes wächst. Papillon hilft dir, eines davon sanft selbst anzusprechen.</p><div class="row" style="justify-content:flex-start;margin-top:10px"><button class="pill-btn small" data-hidden>Anzeigen</button></div><div class="match-list hidden" data-hidden-list style="margin-top:10px">' + hidden.map((it) => matchItem(it, 'Nur dir wichtig')).join('') + '</div></div>';
      }
      if (!yes.length || deck.talk) html += tipsHtml(tips('match_' + deck.id, 2), deck.talk ? 'Hilft beim Reden' : deck.common ? 'Passend dazu' : 'Für den nächsten Versuch');
      html += '<div class="row wrap" style="margin-top:18px">' + (yes.length ? '<button class="pill-btn primary" data-share-res>' + (deck.common ? 'Teilen ↗' : 'Plan teilen ↗') + '</button>' : '') + (deck.common && commonAll().length ? '<button class="pill-btn" data-common>Alle Gemeinsamkeiten</button>' : '') + (!deck.daily && deck.items.length > roundSize(deck) ? '<button class="pill-btn" data-next>Neue Fragen</button>' : '<button class="pill-btn" data-again>Nochmal spielen</button>') + (rec.mode === 'relay' ? '<button class="pill-btn ghost small" data-refresh>Aktualisieren</button>' : '') + '</div>' +
        (!deck.daily && deck.items.length > roundSize(deck) ? '<p class="about round-note">' + roundNote(deck) + '</p>' : '') +
        '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:12px">Stand ' + L.fmtDate(new Date(rec.date)) + (rec.mode === 'relay' ? ' · über die Partner-Verbindung, nur Prüfsummen verglichen' : ' · Handy-weitergeben-Modus') + '. Produktvorschläge sind Werbelinks zur Amazon-Suche.</p>';
    }
    openMatch(html, (sc) => {
      sc.querySelector('[data-close]').onclick = closeMatch; bindTips(sc);
      const hb = sc.querySelector('[data-hidden]'); if (hb) hb.onclick = () => { sc.querySelector('[data-hidden-list]').classList.toggle('hidden'); hb.textContent = hb.textContent === 'Anzeigen' ? 'Verbergen' : 'Anzeigen'; };
      sc.querySelectorAll('[data-soft]').forEach((b) => b.onclick = () => { if (window.LZN) window.LZN.softStart(b.dataset.soft); });
      const ca = sc.querySelector('[data-common]'); if (ca) ca.onclick = () => { closeMatch(); if (L.showView) { L.showView('play'); L.showSub('play', 'gemeinsam'); } commonSheet(); };
      const ag = sc.querySelector('[data-again]'); if (ag) ag.onclick = () => playDeck(deck.id, rec.mode === 'pass');
      const nx = sc.querySelector('[data-next]'); if (nx) nx.onclick = () => { P().roundShift = P().roundShift || {}; P().roundShift[deck.id] = (P().roundShift[deck.id] || 0) + 1; if (P().invites) delete P().invites[deck.id]; L.save(); playDeck(deck.id, rec.mode === 'pass'); };
      const rf = sc.querySelector('[data-refresh]'); if (rf) rf.onclick = async () => { rf.disabled = true; rf.textContent = '…'; try { await refreshMatches(deck, rec, true); } catch (e) { L.toast('Keine Verbindung'); rf.disabled = false; rf.textContent = 'Aktualisieren'; } };
      const si = sc.querySelector('[data-share-inv]'); if (si) si.onclick = () => L.shareText('🎯 Ich habe in Schmetterlingsfutter „' + deck.title + '“ beantwortet. Spiel mit – ich bin gespannt, wo wir übereinstimmen! 😉 — ' + S().sender);
      const sr = sc.querySelector('[data-share-res]'); if (sr) sr.onclick = () => {
        const yes = rec.matches.map((id) => deck.items.find((it) => it.id === id)).filter(Boolean);
        L.shareText((deck.common ? '🤝 Das verbindet uns: ' : '💞 Gleichklang: ') + deck.title + '\n' + yes.map((it) => it.e + ' ' + it.t).join('\n') + '\n— ' + S().sender + ' & ' + partnerName() + ' (Schmetterlingsfutter)');
      };
    });
    renderDecks(); renderInboxBadge();
  }
  function roundNote(deck) {
    const tot = deck.items.length, ex = explored(deck), left = Math.max(0, tot - ex);
    return left ? '🦋 Noch ' + left + ' ungespielte Fragen in „' + L.esc(deck.title) + '“. Nach jeder Runde geht es mit neuen weiter, jeden Montag startet auch von selbst eine neue Runde.' : '🦋 Ihr habt alle ' + tot + ' Fragen gesehen. Die Runden mischen neu, Papillon sammelt schon neue Fragen.';
  }
  function matchItem(it, badge, adult) {
    if (it.q) return '<div class="match-item"><span class="mi-e">' + it.e + '</span><div class="mi-b"><div class="mi-t">' + L.esc(it.t) + '</div><div class="mi-s">' + L.esc(badge) + '</div><div class="mi-q">💬 ' + L.esc(it.q) + '</div><button type="button" class="tip inline" data-soft="' + L.esc(it.t) + '">🕊️ Sanft ansprechen</button></div></div>';
    return'<div class="match-item"><span class="mi-e">' + it.e + '</span><div class="mi-b"><div class="mi-t">' + L.esc(it.t) + '</div><div class="mi-s">' + badge + (tipOf(it) ? ' · <button type="button" class="tip inline" data-q="' + L.esc(tipOf(it)) + '"' + (adult ? ' data-adult="1"' : '') + '>🛒 ' + L.esc(tipOf(it)) + ' ↗</button>' : '') + '</div></div></div>';
  }
  /* ---------- Gemeinsam: was beide mögen oder beide ausprobieren würden, wächst zu einer Sammlung ---------- */
  function noteCommon(deck, rec) {
    if (!rec || rec.expired || !Array.isArray(rec.matches)) return;
    const sig = rec.matches.join(',') + '|' + (rec.open || []).join(','); if (rec.noted === sig) return;
    const s = S(); if (!s.common) s.common = {}; const c = s.common[deck.id] || (s.common[deck.id] = {});
    rec.matches.forEach((id) => { c[id] = 'yes'; }); (rec.open || []).forEach((id) => { if (c[id] !== 'yes') c[id] = 'open'; });
    if (window.LZS && !deck.adult) { rec.matches.forEach((id) => window.LZS.count('like:' + deck.id + ':' + id)); (rec.open || []).forEach((id) => window.LZS.count('open:' + deck.id + ':' + id)); window.LZS.count('deck_result:' + deck.id); }
    rec.noted = sig; L.save();
  }
  function commonAll() {
    const out = [], c = S().common || {};
    D.decks.forEach((deck) => { if (!deck.common || !c[deck.id]) return; deck.items.forEach((it) => { const st = c[deck.id][it.id]; if (st) out.push({ deck, it, st }); }); });
    return out;
  }
  function suggestCommon(x) {
    sendOrShare(x.st === 'yes' ? 'Das mögen wir beide: ' + x.it.e + ' ' + x.it.t + '. Wann nehmen wir uns Zeit dafür?' : 'Wollen wir das zusammen entdecken: ' + x.it.e + ' ' + x.it.t + '?', 'Gemeinsam');
  }
  function renderCommon() {
    const box = $('commonBox'); if (!box) return; const all = commonAll();
    box.classList.toggle('hidden', !all.length); if (!all.length) { box.innerHTML = ''; return; }
    const yes = all.filter((x) => x.st === 'yes'); const pool = yes.length ? yes : all; const x = pool[weekNum() % pool.length];
    box.innerHTML = '<div class="row between"><div class="eyebrow" style="margin:0">Das verbindet euch</div><span class="tag">' + all.length + '</span></div>' +
      '<div class="match-item" style="margin-top:12px"><span class="mi-e">' + x.it.e + '</span><div class="mi-b"><div class="mi-t">' + L.esc(x.it.t) + '</div><div class="mi-s">Impuls der Woche</div></div></div>' +
      '<div class="row wrap" style="justify-content:flex-start;gap:10px"><button class="pill-btn small primary" data-sug>Vorschlagen ↗</button><button class="pill-btn small" data-all>Alle ansehen</button></div>' +
      (tipOf(x.it) ? tipsHtml([{ icon: '🛒', title: tipOf(x.it), q: tipOf(x.it) }], 'Passend dazu') : '');
    box.querySelector('[data-sug]').onclick = () => suggestCommon(x); box.querySelector('[data-all]').onclick = commonSheet; bindTips(box);
  }
  function commonSheet() {
    const all = commonAll(); let html = '<h3>🤝 Eure Gemeinsamkeiten</h3>', last = null, ads = false;
    all.forEach((x, i) => {
      if (x.deck !== last) { html += '<div class="eyebrow" style="margin:14px 0 8px">' + x.deck.icon + ' ' + L.esc(x.deck.title) + '</div>'; last = x.deck; }
      if (x.it.tip) ads = true;
      html += '<div class="match-item" data-i="' + i + '"><span class="mi-e">' + x.it.e + '</span><div class="mi-b"><div class="mi-t">' + L.esc(x.it.t) + '</div><div class="mi-s">' + (x.st === 'yes' ? 'Mögt ihr beide' : 'Zum Entdecken') + '</div>' +
        '<div class="row wrap" style="justify-content:flex-start;gap:8px;margin-top:8px"><button class="pill-btn small" data-sug>Vorschlagen ↗</button>' + (tipOf(x.it) ? '<button type="button" class="tip inline" data-q="' + L.esc(tipOf(x.it)) + '">🛒 ' + L.esc(tipOf(x.it)) + ' ↗</button>' : '') + '<button class="pill-btn small ghost" data-rm aria-label="Entfernen">✕</button></div></div></div>';
    });
    if (!all.length) html += '<p class="about">Spielt eine Runde, dann füllt sich diese Liste.</p>';
    html += (ads ? '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:10px">🛒 Werbelink zur Amazon-Suche.</p>' : '') + '<div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>';
    L.openSheet(html, (sh) => {
      sh.querySelector('[data-cancel]').onclick = () => { L.closeSheet(); renderCommon(); }; bindTips(sh);
      sh.querySelectorAll('.match-item[data-i]').forEach((row) => {
        const x = all[+row.dataset.i], c = S().common[x.deck.id];
        row.querySelector('[data-sug]').onclick = () => suggestCommon(x);
        const rm = row.querySelector('[data-rm]'); rm.onclick = () => {
          const off = row.classList.toggle('off'); if (off) delete c[x.it.id]; else c[x.it.id] = x.st;
          rm.textContent = off ? '↩ Zurückholen' : '✕'; rm.setAttribute('aria-label', off ? 'Zurückholen' : 'Entfernen'); L.save(); renderCommon();
        };
      });
    });
  }

  function renderDecks() {
    const l = $('deckList'); if (!l) return; l.innerHTML = ''; const cl = $('commonList'); if (cl) cl.innerHTML = '';
    D.decks.forEach((deck) => {
      if (deck.talk) return; // läuft unter „Klartext“
      if (deck.adult && !S().intim) return;
      const rec = P().matches[deck.id]; let state = ''; const st = deckStatus(deck); let chip = '';
      if (st) chip = st.kind === 'turn' ? '<span class="chip-st turn">Du bist dran</span>' : st.kind === 'ready' ? '<span class="chip-st ready">Ergebnis da</span>' : '<span class="chip-st wait">' + L.esc(partnerName()) + ' ist dran</span>'; /* 3.43.0: überall dieselben drei Zustände */
      if (rec) {
        if (deck.daily && rec.date.slice(0, 10) !== L.todayKey()) state = 'Gestern gespielt – heute neu';
        else if (rec.matches === null) state = (rec.stale ? '✨ ' + partnerName() + ' hat geantwortet – antippen' : 'Wartet auf ' + partnerName());
        else state = rec.matches.length + (rec.matches.length === 1 ? ' Treffer' : ' Treffer') + (rec.stale ? ' · neu laden' : '');
      }
      if (deck.common && !(rec && (rec.matches === null || rec.stale))) { const n = Object.keys((S().common || {})[deck.id] || {}).length; state = n ? n + (n === 1 ? ' Gemeinsamkeit' : ' Gemeinsamkeiten') : ''; }
      if (st) state = '';
      const ex = explored(deck), tot = deck.items.length;
      const prog = (!deck.daily && !deck.talk && tot > roundSize(deck) && ex) ? '<div class="d-prog" aria-label="' + ex + ' von ' + tot + ' Fragen entdeckt"><i style="width:' + Math.round(Math.min(ex, tot) / tot * 100) + '%"></i></div><div class="d-meta">' + (ex >= tot ? 'Alle ' + tot + ' Fragen entdeckt – Runden mischen neu' : ex + ' von ' + tot + ' Fragen entdeckt' + (rec && Array.isArray(rec.matches) && !st ? ' · neue Fragen bereit ✨' : '')) + '</div>' : '';
      const d = document.createElement('button'); d.type = 'button'; d.className = 'deck' + (deck.adult ? ' adult' : '') + (st ? ' st-' + st.kind : '');
      d.innerHTML = '<span class="d-ico">' + deck.icon + '</span><div class="d-body"><div class="d-title">' + L.esc(deck.title) + '</div>' + (chip || '<div class="d-sub">' + L.esc(state || deck.teaser || deck.sub) + '</div>') + prog + '</div><span class="d-go">›</span>';
      d.onclick = () => {
        if (rec && rec.matches === null && rec.mode === 'relay' && !(deck.daily && rec.date.slice(0, 10) !== L.todayKey())) { showResults(deck, rec); refreshMatches(deck, rec, true).catch(() => {}); }
        else if (rec && rec.stale && rec.mode === 'relay') { showResults(deck, rec); refreshMatches(deck, rec, true).catch(() => {}); }
        else {
          /* Interessen: nach einer fertigen Runde kommen beim nächsten Mal neue Karten */
          const iv = (P().invites || {})[deck.id];
          if (deck.common && rec && Array.isArray(rec.matches) && (!iv || iv.sd === rec.sd)) { P().roundShift = P().roundShift || {}; P().roundShift[deck.id] = (P().roundShift[deck.id] || 0) + 1; L.save(); }
          playDeck(deck.id);
        }
      };
      (deck.common && cl ? cl : l).appendChild(d);
    });
    renderCommon();
    /* Der Ideen-Briefkasten erscheint erst, wenn der Vermittlungsdienst ihn annimmt (Schalter D.ideaBox) */
    ['ideaRow', 'ideaRow2'].forEach((id) => { const el = $(id); if (el) el.classList.toggle('hidden', !D.ideaBox); });
    const rb = $('btnReport'); if (rb) rb.classList.toggle('hidden', !D.ideaBox);
    const rb2 = $('btnReport2'); if (rb2) rb2.onclick = () => reportSheet('');
    const ib = $('btnIdea'); if (ib) ib.onclick = () => ideaSheet('frage');
    const ib2 = $('btnIdea2'); if (ib2) ib2.onclick = () => ideaSheet('sonstiges');
    const hint = $('deckHint'); if (hint) hint.textContent = paired() && joined() ? '' : 'Ohne Verbindung spielt ihr an einem Handy.';
  }

  /* ---------- Idee spenden: freiwillig, ohne Namen, landet zur Prüfung bei der Redaktion ---------- */
  const IDEA_KINDS = [['frage', 'Spielfrage'], ['date', 'Date-Idee'], ['botschaft', 'Botschaft'], ['piek', 'Flügelschlag des Tages'], ['thema', 'Gesprächsthema'], ['sonstiges', 'Etwas anderes']];
  function ideaSheet(kind) {
    let k = kind || 'frage';
    L.openSheet('<h3>💡 Idee spenden</h3>' +
      '<div class="field"><label>Wofür?</label><div class="chips big" id="idKind"></div></div>' +
      '<div class="field"><label for="idText">Deine Idee</label><textarea id="idText" maxlength="240" rows="3" placeholder="z. B. Sternschnuppen zählen auf dem Balkon"></textarea></div>' +
      (S().intim ? '<label class="check"><input type="checkbox" id="idAdult"> Nur für Zweisamkeit (18+)</label>' : '') +
      '<p class="about" style="margin:6px 0 14px">Wird ohne Namen gesendet. Gute Ideen kommen für alle Paare in die App.</p>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Spenden</button></div>', (sh) => {
      const box = sh.querySelector('#idKind');
      const draw = () => { box.innerHTML = IDEA_KINDS.map((x) => '<button type="button" data-k="' + x[0] + '"' + (x[0] === k ? ' class="on"' : '') + '>' + x[1] + '</button>').join(''); box.querySelectorAll('button').forEach((b) => b.onclick = () => { k = b.dataset.k; draw(); }); };
      draw();
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const ok = sh.querySelector('[data-ok]');
      ok.onclick = async () => {
        let text = sh.querySelector('#idText').value.replace(/\s+/g, ' ').trim();
        if (text.length < 8) { L.toast('Ein paar Worte mehr, bitte'); return; }
        /* Eure Namen gehen nicht mit: sie werden vor dem Senden durch Platzhalter ersetzt */
        [[S().sender, '{s}'], [S().receiver, '{r}']].forEach((p) => {
          if (!p[0] || p[0].length < 2) return;
          const name = p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          text = text.replace(new RegExp('(^|[^A-Za-zÄÖÜäöüß])' + name + '(?![A-Za-zÄÖÜäöüß])', 'gi'), '$1' + p[1]);
        });
        const ad = sh.querySelector('#idAdult');
        ok.disabled = true; ok.textContent = '…';
        try { await post('/idea', { kind: k, text, adult: !!(ad && ad.checked), app: D.version }, true); L.closeSheet(); L.toast('Danke! Deine Idee ist angekommen 🦋'); L.spawnHearts(8); }
        catch (e) { ok.disabled = false; ok.textContent = 'Spenden'; L.toast(e.status === 429 ? 'Für heute reicht es. Morgen gern wieder.' : 'Keine Verbindung. Versuch es später nochmal.'); }
      };
    });
  }

  /* ---------- Melden: unpassende Inhalte oder Fehler, ohne Namen, über denselben Briefkasten wie die Ideen ---------- */
  const REPORT_KINDS = [['seltsam', 'Klingt seltsam'], ['unpassend', 'Unpassend'], ['fehler', 'Funktioniert nicht'], ['sonst', 'Etwas anderes']];
  const noNames = (text) => { [[S().sender, '{s}'], [S().receiver, '{r}']].forEach((p) => { if (!p[0] || p[0].length < 2) return; const name = p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); text = text.replace(new RegExp('(^|[^A-Za-zÄÖÜäöüß])' + name + '(?![A-Za-zÄÖÜäöüß])', 'gi'), '$1' + p[1]); }); return text; };
  function reportSheet(quote) {
    let k = quote ? 'seltsam' : 'fehler';
    L.openSheet('<h3>🚩 Melden</h3>' + (quote ? '<p class="about" style="margin-bottom:14px">„' + L.esc(L.fmt(quote)) + '“</p>' : '') +
      '<div class="field"><label>Was stört?</label><div class="chips big" id="rpKind"></div></div>' +
      '<div class="field"><label for="rpText">' + (quote ? 'Magst du mehr dazu sagen?' : 'Was ist passiert?') + '</label><textarea id="rpText" maxlength="140" rows="2"></textarea></div>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Melden</button></div>', (sh) => {
      const box = sh.querySelector('#rpKind');
      const draw = () => { box.innerHTML = REPORT_KINDS.map((x) => '<button type="button" data-k="' + x[0] + '"' + (x[0] === k ? ' class="on"' : '') + '>' + x[1] + '</button>').join(''); box.querySelectorAll('button').forEach((b) => b.onclick = () => { k = b.dataset.k; draw(); }); };
      draw();
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const ok = sh.querySelector('[data-ok]');
      ok.onclick = async () => {
        const note = sh.querySelector('#rpText').value.replace(/\s+/g, ' ').trim();
        if (!quote && note.length < 5) { L.toast('Beschreib kurz, was nicht passt'); return; }
        const text = noNames('MELDUNG ' + k + (quote ? ' | „' + quote.slice(0, 110) + '“' : '') + (note ? ' | ' + note : '')).slice(0, 240);
        ok.disabled = true; ok.textContent = '…';
        try { await post('/idea', { kind: 'sonstiges', text, app: D.version }, true); L.closeSheet(); L.toast('Danke! Wir schauen es uns an.'); }
        catch (e) { ok.disabled = false; ok.textContent = 'Melden'; L.toast(e.status === 429 ? 'Für heute reicht es. Morgen gern wieder.' : 'Keine Verbindung. Versuch es später nochmal.'); }
      };
    });
  }

  /* ---------- Koppel-Oberfläche ---------- */
  function pairSheet() {
    if (!subtle) return L.toast('Dieser Browser kann nicht sicher verschlüsseln (kein HTTPS).');
    if (!RELAY) return L.toast('Partner-Verbindung ist in dieser Version noch nicht freigeschaltet.');
    const p = P().partner;
    if (p && p.pair) {
      const code = fmtCode(p.pair, p.secret);
      L.openSheet('<h3>💞 Partner-Verbindung</h3>' +
        (p.joined ? '<p class="about" style="margin-bottom:12px">Verbunden mit <b>' + L.esc(partnerName()) + '</b>' + (p.since ? ' seit ' + L.fmtDate(new Date(p.since)) : '') + '. Botschaften, Gutscheine und Gleichklang-Spiele laufen jetzt direkt zwischen euren Apps – verschlüsselt, ohne Konto.</p>'
          : '<p class="about" style="margin-bottom:10px;font-size:17px"><b>' + L.esc(S().receiver) + '</b> öffnet Schmetterlingsfutter, tippt auf <b>„📷 Code scannen“</b> und hält die Kamera auf diesen Code:</p><div class="qr-wrap"><div class="qr" data-qr="' + L.esc(pairLink()) + '"></div>' + ['', '', '', '', ''].map((_, i) => '<span class="qr-b" style="--d:' + (i * -1.4) + 's;filter:hue-rotate(' + (i * 70) + 'deg) saturate(1.4)">🦋</span>').join('') + '</div><div class="paircode">' + code + '</div><div class="pair-wait">🦋 Warte auf ' + L.esc(S().receiver) + ' …</div><p class="about" style="font-size:16px;color:var(--text-muted);margin:6px 0 10px">Nicht nebeneinander? Dann schick den Link.</p>') +
        '<div class="row wrap">' + (p.joined ? '' : '<button class="pill-btn primary" data-link>Link schicken ↗</button><button class="pill-btn" data-copy>Code kopieren</button><button class="pill-btn ghost small" data-rescan>📷 Lieber den Code von ' + L.esc(S().receiver) + ' scannen</button>') +
        '<button class="pill-btn ghost danger small" data-leave>Verbindung trennen</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>' +
        '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:12px">Der Code enthält ein Geheimnis, das nur eure beiden Apps kennen. Der Vermittlungsdienst sieht nur verschlüsselte Daten. „Trennen“ löscht dort alles sofort.</p>', (sh) => {
        sh.querySelector('[data-cancel]').onclick = L.closeSheet;
        if (window.LZN) window.LZN.fillQr(sh);
        const lk = sh.querySelector('[data-link]'); if (lk) lk.onclick = () => L.shareText('💞 Lass uns Schmetterlingsfutter verbinden! Tipp auf den Link:\n' + pairLink() + '\nCode: ' + code + '\niPhone: erst ' + location.origin + location.pathname + ' in Safari öffnen, über Teilen „Zum Home-Bildschirm“ legen und den Code dort unter Mehr → Partner verbinden eingeben.');
        const cp = sh.querySelector('[data-copy]'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(code); L.toast('Code kopiert 📋'); } catch (e) { L.toast(code); } };
        const rs = sh.querySelector('[data-rescan]'); if (rs) rs.onclick = () => { L.closeSheet(); if (window.LZC) window.LZC.scan(); };
        /* Solange der Code offen ist: alle 3 Sekunden nachsehen, ob der Schatz beigetreten ist */
        if (!p.joined) { const iv = setInterval(async () => { if (!document.querySelector('#sheet [data-qr]') || joined()) { clearInterval(iv); return; } try { await pull(true); } catch (e) {} }, 3000); }
        sh.querySelector('[data-leave]').onclick = () => { L.closeSheet(); L.confirmSheet('Verbindung trennen?', 'Beide Apps werden getrennt, alle Vermittlungsdaten werden gelöscht. Eure lokalen Daten bleiben.', 'Trennen', () => leavePair(), true); };
      });
      return;
    }
    if (window.LZC) return window.LZC.chooser();
    L.openSheet('<h3>💞 Apps verbinden</h3><p class="about" style="margin-bottom:14px">Dann landen Botschaften und Gutscheine direkt in der App von ' + L.esc(S().receiver) + ', und bei den Gleichklang-Spielen antwortet ihr beide heimlich auf dem eigenen Handy. Ohne Konto, verschlüsselt.</p>' +
      '<div class="row wrap" style="margin-bottom:14px"><button class="pill-btn primary" data-new>Ich erzeuge den Code</button></div>' +
      '<div class="field"><label for="pf-code">… oder ich habe einen Code von ' + L.esc(S().receiver) + '</label><input id="pf-code" maxlength="24" placeholder="ABCDEF-GHJKLM-NPQRST" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn" data-join>Beitreten</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-new]').onclick = async (e) => {
        e.target.disabled = true; e.target.textContent = '…';
        try { await createPair(); L.closeSheet(); renderAll(); pairSheet(); }
        catch (err) { e.target.disabled = false; e.target.textContent = 'Ich erzeuge den Code'; L.toast('Keine Verbindung zum Dienst – ' + (online() ? 'später nochmal' : 'du bist offline')); }
      };
      sh.querySelector('[data-join]').onclick = () => doJoin(sh.querySelector('#pf-code').value, sh.querySelector('[data-join]'));
    });
  }
  async function doJoin(code, btn) {
    const c = parseCode(code); if (!c) { L.toast('Code prüfen – 18 Zeichen wie ABCDEF-GHJKLM-NPQRST'); return; }
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    try { await joinPair(code); L.closeSheet(); renderAll(); if (window.LZC) window.LZC.celebrate(S().receiver); else { L.toast('💞 Verbunden! ' + S().receiver + ' bekommt gleich Bescheid.'); L.spawnHearts(14); } setTimeout(() => pull(true), 1500); return true; }
    catch (e) {
      const msg = e.code === 'full' ? 'Dieser Code ist schon mit einem anderen Gerät verbunden.' : e.code === 'unknown' ? 'Code unbekannt oder abgelaufen (48 h).' : e.code === 'same device' ? 'Das ist dein eigener Code.' : (e.message || 'Fehler');
      L.toast(msg); if (btn) { btn.disabled = false; btn.textContent = 'Beitreten'; }
      return false;
    }
  }
  function handlePairParam() {
    const m = /[?&]pair=([^&]+)/.exec(location.search); if (!m) return;
    const code = decodeURIComponent(m[1]);
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    if (paired()) { L.toast('Du bist schon verbunden. Erst trennen, um neu zu koppeln.'); return; }
    P().pendingPair = code; L.save();
    if (S().onboarded) offerPendingPair();
  }
  /* iPhone, Seite im Browser statt als Symbol auf dem Home-Bildschirm: dort hat die App einen eigenen Speicher */
  function iosBrowser() { let test = false; try { test = sessionStorage.getItem('sfIos') === '1'; } catch (e) {} /* nur zum Testen am PC */ return test || (/iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone && !(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)); }
  /* Was das Verbinden bringt, in drei Zeilen */
  function pairBenefits() {
    return '<ul class="promo-list"><li><span>💌</span>Botschaften, Jingles und Überraschungen landen direkt bei ' + L.esc(S().receiver) + '</li><li><span>🎯</span>Spiele laufen geheim auf zwei Handys</li><li><span>🦋</span>Euer Schmetterling wächst gemeinsam</li></ul>';
  }
  /* Direkt nach der Einrichtung einmal anbieten */
  function pairWelcome() {
    if (!RELAY || paired() || P().pendingPair) return;
    L.openSheet('<h3>💞 Verbindet eure Handys</h3>' + pairBenefits() + '<div class="row wrap" style="margin-top:16px"><button class="pill-btn primary" data-go>Jetzt verbinden</button><button class="pill-btn ghost" data-cancel>Später</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = () => { L.closeSheet(); setTimeout(pairSheet, 80); };
    });
  }
  function offerPendingPair() {
    const code = P().pendingPair; if (!code || paired()) return;
    if (iosBrowser()) {
      L.openSheet('<h3>📱 Erst auf den Home-Bildschirm</h3><p class="about" style="margin-bottom:10px">Tippe in Safari auf Teilen, dann „Zum Home-Bildschirm“. Starte die App dort und gib diesen Code ein:</p><div class="paircode">' + L.esc(code) + '</div>' +
        '<div class="row wrap"><button class="pill-btn primary" data-copy>Code kopieren</button><button class="pill-btn ghost" data-here>Hier verbinden</button></div>', (sh) => {
        sh.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(code); L.toast('Code kopiert 📋'); } catch (e) { L.toast(code); } };
        sh.querySelector('[data-here]').onclick = () => { P().pendingPair = null; L.save(); L.closeSheet(); doJoin(code); };
      });
      return;
    }
    L.confirmSheet('💞 Apps verbinden?', S().receiver + ' hat dir einen Verbindungs-Code geschickt. Jetzt verbinden?', 'Verbinden', () => { P().pendingPair = null; L.save(); doJoin(code); });
  }

  /* ---------- Post (3.43.0): alles zwischen euch in einem Verlauf ----------
     Links der Schatz (Empfangenes aus S.inbox), rechts du (Gesendetes aus S.outbox). Je Zeile: Art, Titel, Uhrzeit,
     bei dir „✓ zugestellt“ oder „✓✓ gesehen“ – bewusst ohne Lese-Uhrzeit, kein „zuletzt online“ (Mos Grundsatz: kein Druck). */
  const KIND = {
    msg: ['💌', 'Botschaft'], pic: ['🎨', 'Bild'], jingle: ['🎶', 'Jingle'], coupon: ['🎟️', 'Gutschein'],
    match: ['🎯', 'Spiel'], game: ['🎲', 'Spiel'], spiel: ['🎲', 'Spiel'], falter: ['🦋', 'Falter'],
    checkin: ['🌦️', 'Wetterbericht'], gift: ['🎁', 'Überraschung'], unknown: ['❔', 'Neue Art von Nachricht']
  };
  const CAN_REPLY = { msg: 1, pic: 1, jingle: 1, coupon: 1 };
  const dayKey = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
  /* Spiele zu zweit: Titel und Symbol aus spiele.js (luege, story, jagd, fang) bzw. spiele2.js (Wanderzug …) */
  function gameInfo(t, gid, k) {
    const G = window.LZG, G2 = window.LZG2;
    if (t === 'spiel' && G2) { const g = gid && G2.games ? G2.games()[gid] : null; const K = G2.KINDS && G2.KINDS[(g && g.kind) || k]; if (K) return { icon: K.icon, title: K.title, g, two: true }; }
    if (t === 'game' && G) { const g = gid && G.games ? G.games()[gid] : null; const M = G.META && G.META[(g && g.kind) || k]; if (M) return { icon: M.icon, title: M.title, g, two: false }; }
    return null;
  }
  function timeline() {
    const s = P(); const raw = [];
    (s.inbox || []).forEach((m) => raw.push({ who: 'them', at: m.at || 0, t: m.t, text: m.text || '', m, id: m.id, gid: m.gid || '', deck: m.deck || '', re: m.re || null, read: !!m.read }));
    (s.outbox || []).forEach((o) => raw.push({ who: 'me', at: o.at || 0, t: o.t, text: o.text || '', o, id: 'o' + o.at, gid: o.gid || '', deck: o.deck || '', k: o.k || '', re: o.re || null, seen: !!o.seen }));
    raw.sort((a, b) => b.at - a.at);
    /* Bündeln: aufeinanderfolgende Züge desselben Spiels am selben Tag = eine Zeile mit der Zeit des letzten */
    const out = [];
    raw.forEach((e) => {
      const last = out[out.length - 1];
      if (last && e.gid && last.gid === e.gid && dayKey(last.at) === dayKey(e.at)) { last.n++; if (e.who === 'them' && !e.read) last.read = false; return; }
      e.n = 1; out.push(e);
    });
    return out;
  }
  function chipFor(e, acts, shown) {
    const key = e.gid || (e.t === 'match' ? 'deck:' + e.deck : ''); if (!key || shown[key]) return ''; shown[key] = 1;
    const a = acts.find((x) => (e.gid && x.id === e.gid) || (!e.gid && x.deck && x.deck.id === e.deck));
    const name = L.esc(partnerName());
    if (a && a.kind === 'turn') return '<span class="chip-st turn">Du bist dran</span>';
    if (a && a.kind === 'ready') return '<span class="chip-st ready">Ergebnis da</span>';
    if (a && a.kind === 'wait') return '<span class="chip-st wait">' + name + ' ist dran</span>';
    const gi = (e.t === 'game' || e.t === 'spiel') ? gameInfo(e.t, e.gid, e.k) : null; const g = gi && gi.g;
    if (g && g.turn !== 'done' && !g.ab && !(g.mode === 'pass')) { const mine = gi.two ? g.turn === g.me : g.turn === 'me'; return mine ? '<span class="chip-st turn">Du bist dran</span>' : '<span class="chip-st wait">' + name + ' ist dran</span>'; }
    return '';
  }
  function rowTitle(e) {
    const K = KIND[e.t] || KIND.unknown, def = inboxTypes[e.t];
    let icon = (e.who === 'them' && def && def.icon) || K[0], title = '';
    if (e.t === 'match') { const d = deckById(e.deck); if (d) { icon = d.icon; title = d.title; } else title = e.text; }
    else if (e.t === 'game' || e.t === 'spiel') { const gi = gameInfo(e.t, e.gid, e.k); if (gi) icon = gi.icon; title = (e.who === 'them' && e.text) ? e.text.replace(/^\S+\s/, '') : gi ? gi.title : K[1]; if (e.n > 1) title = (gi ? gi.title : title) + ' · ' + e.n + ' Züge'; }
    else if (e.t === 'msg') title = e.text ? '„' + e.text + '“' : K[1];
    else if (e.t === 'unknown') title = K[1];
    else title = K[1] + (e.text ? ': ' + e.text.replace(/^🏆\s*/, '') : '');
    return { icon, title };
  }
  const tlTime = (at) => (Date.now() - at < 3600e3 ? L.ago(at) : new Date(at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
  function dayLabel(at) {
    const d = L.atMidnight(new Date(at)), t = L.atMidnight(new Date()); const diff = Math.round((t - d) / 864e5);
    return diff <= 0 ? 'Heute' : diff === 1 ? 'Gestern' : new Date(at).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  /* Eine Zeile – derselbe Baustein in Post und (kompakt) auf Heute */
  function rowHtml(e, acts, shown, compact) {
    const { icon, title } = rowTitle(e); const def = inboxTypes[e.t];
    const st = e.who === 'me' ? '<span class="tl-st" data-st="' + (e.seen ? 'seen' : 'sent') + '">' + (e.seen ? '✓✓ gesehen' : '✓ zugestellt') + '</span>' : '';
    const unread = e.who === 'them' && !e.read;
    const quote = e.re && window.LZR ? window.LZR.quoteHtml(e.re, e.who === 'them' ? 'deine Nachricht' : '') : '';
    const media = !compact && e.who === 'them' && def && def.html && e.m ? def.html(e.m) : '';
    const reply = !compact && e.who === 'them' && CAN_REPLY[e.t] && window.LZR ? '<button type="button" class="pill-btn small ghost tl-reply" data-reply="' + e.id + '">↩ Antworten</button>' : '';
    const av = e.who === 'them' ? '<span class="tl-av" aria-hidden="true">' + L.esc(S().emojiR) + '</span>' : '';
    const more = !compact && e.who === 'them' ? '<button type="button" class="tl-x" data-more="' + e.id + '" aria-label="Weitere Aktionen">⋯</button>' : '';
    return '<div class="tl-row ' + e.who + (unread ? ' new' : '') + (compact ? ' compact' : '') + '" data-id="' + L.esc(e.id) + '" role="button" tabindex="0">' + av +
      '<div class="tl-b">' + (compact ? '' : quote) + '<div class="tl-t"><span class="tl-k">' + icon + '</span> ' + (compact && e.who === 'me' ? 'Du: ' : '') + L.esc(title) + '</div>' + media +
      '<div class="tl-m"><span class="tl-time">' + (compact ? L.ago(e.at) : tlTime(e.at)) + '</span>' + st + (unread ? '<i class="tl-dot" aria-label="neu"></i>' : '') + (compact ? '' : chipFor(e, acts, shown)) + '</div>' + reply + '</div>' + more + '</div>';
  }
  /* Öffnen – gleiche Wege wie früher im Postfach-Fenster */
  function openItem(m) {
    const s = P(); if (!m) return; m.read = true; L.save(); L.closeSheet();
    if (m.t === 'msg') { L.showView('home'); L.showMessage({ text: m.text, own: true, incoming: true, re: m.re, mid: m.id }, 'Von ' + partnerName() + ' für dich'); L.spawnHearts(10); }
    else if (m.t === 'coupon') { L.showView('wishes'); L.showSub('wishes', 'coupons'); }
    else if (m.t === 'match') { const deck = deckById(m.deck); if (deck) { const rec = s.matches[deck.id]; const iv = (s.invites || {})[deck.id]; if (rec && rec.mode === 'relay' && (m.ready || !iv || !iv.sd || iv.sd === rec.sd) && (!deck.daily || rec.date.slice(0, 10) === L.todayKey())) { showResults(deck, rec); refreshMatches(deck, rec, true).catch(() => {}); } else playDeck(deck.id); } }
    else if (inboxTypes[m.t] && inboxTypes[m.t].open) inboxTypes[m.t].open(m);
    renderAll();
  }
  function replyItem(m) {
    if (!m || !window.LZR) return; m.read = true; L.save(); L.closeSheet(); window.LZR.start(m);
    if (window.LZN && window.LZN.replySheet) setTimeout(() => window.LZN.replySheet(m), 60);
    renderAll();
  }
  function openOwn(e) {
    if (e.t === 'match') { const deck = deckById(e.deck); if (deck) openDeckFromStatus(deck); return; }
    if (e.t === 'spiel' && e.gid && window.LZG2 && window.LZG2.games()[e.gid]) { window.LZG2.open(e.gid); return; }
    if (e.t === 'game' && e.gid && window.LZG && window.LZG.games()[e.gid]) window.LZG.openGame(e.gid);
  }
  function bindRows(box, list) {
    const s = P(); const byId = {}; list.forEach((e) => { byId[e.id] = e; });
    box.querySelectorAll('.tl-row').forEach((el) => {
      const go = (ev) => {
        if (ev.target.closest('[data-reply],[data-more]')) return;
        const e = byId[el.dataset.id]; if (!e) return;
        if (e.who === 'them') openItem(s.inbox.find((x) => x.id === e.id)); else openOwn(e);
      };
      el.onclick = go; el.onkeydown = (ev) => { if (ev.key === 'Enter') go(ev); };
    });
    box.querySelectorAll('[data-reply]').forEach((b) => b.onclick = () => replyItem(s.inbox.find((x) => x.id === b.dataset.reply)));
    box.querySelectorAll('[data-more]').forEach((b) => b.onclick = () => {
      const m = s.inbox.find((x) => x.id === b.dataset.more); if (!m) return;
      L.openSheet('<h3>' + L.esc(rowTitle(byId[m.id] || { t: m.t, text: m.text, who: 'them' }).title.slice(0, 60)) + '</h3><div class="o-list">' +
        (CAN_REPLY[m.t] && window.LZR ? '<button type="button" class="pill-btn" data-r>↩ Antworten</button>' : '') +
        '<button type="button" class="pill-btn" data-o>Öffnen</button><button type="button" class="pill-btn ghost danger" data-d>Löschen</button></div><div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
        sh.querySelector('[data-cancel]').onclick = L.closeSheet;
        const r = sh.querySelector('[data-r]'); if (r) r.onclick = () => replyItem(m);
        sh.querySelector('[data-o]').onclick = () => openItem(m);
        sh.querySelector('[data-d]').onclick = () => { s.inbox = s.inbox.filter((x) => x.id !== m.id); L.save(); L.closeSheet(); renderAll(); renderPost(); L.toast('Gelöscht'); };
      });
    });
  }
  function renderPost() {
    const box = $('postList'); if (!box) return;
    const s = P(); const list = timeline().slice(0, 80);
    if (!list.length) {
      box.innerHTML = '<div class="tl-empty"><p>' + (paired() && joined() ? 'Noch nichts zwischen euch.' : 'Noch nicht verbunden.') + '</p>' +
        (paired() && joined() ? '<button type="button" class="pill-btn primary" data-go="send">Etwas schicken</button>' : '<button type="button" class="pill-btn primary" data-pair>Jetzt verbinden</button>') + '</div>';
      const pb = box.querySelector('[data-pair]'); if (pb) pb.onclick = pairSheet;
      return;
    }
    const acts = activity(); const shown = {}; let day = '', html = '';
    list.forEach((e) => { const d = dayLabel(e.at); if (d !== day) { day = d; html += '<div class="tl-day">' + L.esc(d) + '</div>'; } html += rowHtml(e, acts, shown, false); });
    box.innerHTML = html; bindRows(box, list);
    /* wie früher beim Öffnen des Postfachs: Einladungen und Hinweise gelten als gelesen, sobald man sie gesehen hat */
    let ch = false; (s.inbox || []).forEach((m) => { if ((m.t === 'match' || m.t === 'unknown') && !m.read) { m.read = true; ch = true; } });
    if (ch) { L.save(); renderInboxBadge(); flushSeen(); }
  }
  /* Alte Aufrufer (Suche, Karten, Mitteilung) – das Postfach ist jetzt der Reiter „Post“ */
  function inboxSheet() { L.closeSheet(); L.showView('post'); }
  function renderInboxBadge() {
    const n = unread(); const b = $('inboxBadge'); if (b) { b.textContent = n > 9 ? '9+' : n; b.classList.toggle('hidden', !n); }
    const nb = $('navBadge'); if (nb) { nb.textContent = n > 9 ? '9+' : (n || ''); nb.classList.toggle('hidden', !n); nb.setAttribute('aria-label', n + ' neu'); }
  }

  /* ---------- Startseite: „Zwischen euch“ ganz oben (3.43.0) ----------
     Wer ist dran, was ist neu, ist meins angekommen – höchstens vier Zeilen im selben Baustein wie in „Post“. */
  function renderHomeCards() {
    const c = $('partnerCard'); if (!c) return;
    const s = P(); const p = s.partner; const n = unread();
    if (!RELAY) { c.classList.add('hidden'); }
    else {
      c.classList.remove('hidden');
      const head = '<div class="eyebrow zw-head">Zwischen euch</div>';
      if (!p) c.innerHTML = head + '<p class="zw-one">Verbinde deine App mit der von ' + L.esc(S().receiver) + '.</p><div class="row wrap zw-foot"><button class="pill-btn small primary" data-pair>Jetzt verbinden</button><button class="pill-btn small ghost" data-bock>🔥 Bock heute?</button></div>';
      else if (!p.joined) c.innerHTML = head + '<p class="zw-one">⏳ Dein Code ist bereit – ' + L.esc(S().receiver) + ' muss ihn noch öffnen.</p><div class="row wrap zw-foot"><button class="pill-btn small primary" data-pair>Link schicken</button><button class="pill-btn small ghost" data-check>Prüfen</button></div>';
      else {
        const a = activityHtml(n);
        c.innerHTML = head + a.html + '<div class="row wrap zw-foot"><button type="button" class="pill-btn small' + (n ? ' primary' : '') + '" data-go="post">📬 Alles ansehen <span class="badge' + (n ? '' : ' hidden') + '" id="inboxBadge">' + (n > 9 ? '9+' : n) + '</span></button><button type="button" class="pill-btn small ghost" data-bock>🔥 Bock heute?</button></div>';
        bindRows(c, a.list);
      }
      const pr = c.querySelector('[data-pair]'); if (pr) pr.onclick = pairSheet;
      const bk = c.querySelector('[data-bock]'); if (bk) bk.onclick = () => playDeck('bock');
      c.querySelectorAll('[data-gact]').forEach((b) => { b.onclick = () => { const x = activity()[Number(b.dataset.gact)]; if (x && x.open) x.open(); }; });
      c.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => { const deck = deckById(b.dataset.act); if (deck) openDeckFromStatus(deck); }; });
      const ck = c.querySelector('[data-check]'); if (ck) ck.onclick = async () => { ck.textContent = '…'; await pull(true); renderAll(); if (!joined()) L.toast('Noch nicht beigetreten'); };
    }
    // Solange die Apps nicht verbunden sind: oben auf der Startseite zeigen, was das Verbinden bringt. „Später“ blendet es für drei Tage aus.
    const pp = $('pairPromo');
    if (pp) {
      const snoozed = (S().pairSnooze || 0) > Date.now();
      if (!RELAY || !S().onboarded || (p && p.joined) || snoozed) { pp.classList.add('hidden'); pp.innerHTML = ''; }
      else {
        pp.classList.remove('hidden'); c.classList.add('hidden');
        pp.innerHTML = '<div class="promo-title">💞 ' + (p ? 'Fast verbunden' : 'Verbindet eure Handys') + '</div>' + pairBenefits() +
          '<div class="row wrap" style="margin-top:14px;justify-content:flex-start"><button class="pill-btn primary" data-pair>' + (p ? 'Link nochmal schicken' : 'Jetzt verbinden') + '</button><button class="pill-btn ghost" data-later>Später</button></div>';
        pp.querySelector('[data-pair]').onclick = pairSheet;
        pp.querySelector('[data-later]').onclick = () => { S().pairSnooze = Date.now() + 3 * 864e5; L.save(); renderHomeCards(); };
      }
    }
    renderGiftRadar();
  }
  function actRow(a, i) {
    const icon = a.game ? a.icon : a.deck.icon, title = a.game ? a.title : a.deck.title;
    const chip = a.kind === 'turn' ? '<span class="chip-st turn">Du bist dran</span>' : a.kind === 'ready' ? '<span class="chip-st ready">Ergebnis da</span>' : '<span class="chip-st wait">' + L.esc(partnerName()) + ' ist dran</span>';
    return '<div class="tl-row compact act st-' + a.kind + '" ' + (a.game ? 'data-gact="' + i + '"' : 'data-act="' + L.esc(a.deck.id) + '"') + ' role="button" tabindex="0"><div class="tl-b"><div class="tl-t"><span class="tl-k">' + icon + '</span> ' + L.esc(title) + '</div><div class="tl-m">' + chip + '</div></div></div>';
  }
  /* zuerst wartende Spiele (Du bist dran vor Ergebnis da vor wartet), dann das Neueste vom Schatz, dann deine letzte Sendung */
  function activityHtml() {
    const acts = activity(); const tl = timeline();
    const shown = new Set(acts.map((x) => x.id).filter(Boolean));
    const fresh = tl.find((e) => e.who === 'them' && !e.read && !(e.gid && shown.has(e.gid)));
    const mine = tl.find((e) => e.who === 'me' && !{ match: 1, game: 1, spiel: 1 }[e.t] && Date.now() - e.at < 7 * 864e5);
    const extra = [fresh, mine].filter(Boolean);
    const k = Math.min(3, 4 - extra.length);
    let html = acts.slice(0, k).map(actRow).join('');
    extra.forEach((e) => { html += rowHtml(e, [], {}, true); });
    if (!html) html = '<p class="zw-one">Gerade ist nichts offen.</p>';
    return { html: '<div class="tl zw">' + html + '</div>', list: extra };
  }
  /* Punkte an „Spielen“ und an den Reitern, wenn dort jemand wartet oder ein Ergebnis da ist */
  function renderTabDots() {
    const hot = { spiele: 0, match: 0, gemeinsam: 0, klartext: 0, intim: 0 };
    activity().forEach((a) => { if (a.kind === 'wait') return; if (a.game) { hot.spiele++; return; } const k = a.deck.adult ? 'intim' : a.deck.talk ? 'klartext' : a.deck.common ? 'gemeinsam' : 'match'; hot[k]++; });
    const any = Object.keys(hot).some((k) => hot[k]);
    const nb = $('navBadgePlay'); if (nb) nb.classList.toggle('hidden', !any);
    document.querySelectorAll('#view-play .seg [data-sub]').forEach((b) => {
      let dot = b.querySelector('.sub-dot'); const on = !!hot[b.dataset.sub];
      if (on && !dot) { dot = document.createElement('i'); dot.className = 'sub-dot'; dot.setAttribute('aria-hidden', 'true'); b.appendChild(dot); }
      if (dot) dot.classList.toggle('hidden', !on);
    });
  }
  function renderGiftRadar() {
    const g = $('giftRadar'); if (!g || !window.LZF || !window.LZF.occasionsAll) return;
    const list = window.LZF.occasionsAll(); const o = list[0]; const s = S();
    const wishes = s.wishes.filter((w) => !w.done && (w.cat || 'wunsch') === 'wunsch');
    if (!o || o.days > 21) { g.classList.add('hidden'); return; } /* 3.43.0 (vorher ordnung.js): nur, wenn ein Anlass in höchstens 21 Tagen kommt */
    g.classList.remove('hidden');
    const key = /^(jahrestag|hochzeit|kuss|kennenlernen)$/.test(o.id) ? 'jahrestag' : o.id === 'geburtstag' ? 'geburtstag' : (D.gifts[o.id] ? o.id : null);
    const W = window.LZW; const mine = W ? W.ideas(1) : [];
    const ideas = mine.concat(((key ? D.gifts[key] : []).concat(D.gifts.default)).filter((x) => x.q)).slice(0, 2);
    let html = '<div class="row between"><div class="eyebrow" style="margin:0">🎁 Geschenk-Radar</div><span class="tag">' + (o.days === 0 ? 'heute' : 'in ' + o.days + (o.days === 1 ? ' Tag' : ' Tagen')) + '</span></div>' +
      '<div style="font-size:18px;margin:6px 0 2px">' + o.icon + ' ' + L.esc(o.title) + (o.days <= 14 ? ' – jetzt wird es Zeit.' : ' – entspannt vorplanen.') + '</div>' + (W ? W.profileHtml() : '');
    const items = wishes.slice(0, 1).map((w) => ({ icon: '⭐', title: w.text, q: w.text })).concat(ideas.map((x) => ({ icon: x.icon, title: x.title, q: x.q })));
    html += tipsHtml(items, wishes.length ? 'Aus der Love Map und passende Ideen' : 'Ideen');
    html += '<div class="row wrap" style="margin-top:8px;justify-content:flex-start"><button class="pill-btn small ghost" data-all>Alle Ideen für ' + L.esc(o.title) + '</button><button class="pill-btn small ghost" data-wish>+ Wunsch notieren</button></div>';
    html += searchFormHtml('Etwas anderes suchen …');
    g.innerHTML = html; bindTips(g); bindSearch(g); if (W) W.bindProfile(g);
    g.querySelector('[data-all]').onclick = () => window.LZF.giftSheet(o);
    g.querySelector('[data-wish]').onclick = () => $('btnAddWish').click();
  }
  function renderSettingsCard() {
    const c = $('partnerSettings'); if (!c) return; const p = P().partner;
    if (!RELAY) { c.innerHTML = '<div class="eyebrow">Verbindung</div><p class="about" style="font-size:19px">Noch nicht freigeschaltet</p>'; return; }
    /* 3.43.0: nur der Zustand und ein Knopf – das Postfach ist jetzt der Reiter „Post“ */
    c.innerHTML = '<div class="eyebrow">Verbindung</div><div class="set-state' + (p && p.joined ? ' on' : '') + '">' + (!p ? 'Nicht verbunden' : p.joined ? '💞 Verbunden mit ' + L.esc(partnerName()) : '⏳ Wartet auf ' + L.esc(S().receiver)) + '</div><div class="row wrap set-btns"><button class="pill-btn small ' + (p ? '' : 'primary') + '" data-pair>' + (!p ? 'Jetzt verbinden' : 'Verbindung verwalten') + '</button></div>';
    c.querySelector('[data-pair]').onclick = pairSheet;
  }
  function renderSendButtons() {
    const on = paired() && joined();
    const b = $('btnSendPartner'); if (b) { b.classList.toggle('hidden', !on); b.setAttribute('aria-label', 'In die App von ' + partnerName() + ' schicken'); b.dataset.label = '💌 An ' + partnerName() + ' schicken'; }
    if (L.tidyMsg) L.tidyMsg();
  }
  function renderAll() { flushSeen(); renderTabDots(); renderHomeCards(); renderSettingsCard(); renderSendButtons(); renderInboxBadge(); renderDecks(); renderPush(); if (window.LZN) window.LZN.render(); const pv = $('view-post'); if (pv && pv.classList.contains('active')) renderPost(); }

  /* ---------- Mitteilungen aufs Handy (Web Push ohne Inhalt) ----------
     Der Dienst stupst das Gerät nur an; was angekommen ist, holt die App wie immer selbst ab und entschlüsselt es. */
  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && (location.protocol === 'https:' || isLocal);
  let pushKey = null;
  async function pushServerKey() {
    if (pushKey) return pushKey; if (!RELAY) return '';
    try { const r = await fetch(RELAY + '/push/key'); const j = await r.json(); pushKey = (j && j.key) || ''; } catch (e) { return ''; }
    if (!!pushKey !== !!S().pushAvail) { S().pushAvail = !!pushKey; L.save(); }
    return pushKey;
  }
  async function pushSub(key) {
    const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      try { sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(key) }); }
      catch (e) { const old = await reg.pushManager.getSubscription(); if (old) await old.unsubscribe(); sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(key) }); }
    }
    return sub;
  }
  async function pushOn() {
    if (!pushSupported() || !(paired() && joined())) return false;
    const key = await pushServerKey(); if (!key) { L.toast('Mitteilungen sind gerade nicht erreichbar'); return false; }
    const perm = await Notification.requestPermission(); if (perm !== 'granted') { renderPush(); return false; }
    try {
      const sub = await pushSub(key); await post('/push/sub', { endpoint: sub.endpoint });
      S().push = true; S().pushEp = sub.endpoint; L.save(); renderPush(); L.toast('🔔 Mitteilungen sind an'); return true;
    } catch (e) { L.toast('Mitteilungen ließen sich nicht einschalten'); renderPush(); return false; }
  }
  function pushLocalOff() {
    if (S().push || S().pushEp) { S().push = false; delete S().pushEp; }
    if (pushSupported()) navigator.serviceWorker.getRegistration().then((reg) => reg && reg.pushManager.getSubscription()).then((sub) => sub && sub.unsubscribe()).catch(() => {});
  }
  async function pushOff() {
    pushLocalOff(); L.save(); renderPush();
    if (paired() && online()) { try { await post('/push/unsub', {}); } catch (e) {} }
    L.toast('Mitteilungen sind aus');
  }
  /* Beim Start: Abo still prüfen. Browser tauschen die Push-Adresse gelegentlich aus. */
  async function pushCheck() {
    const key = await pushServerKey(); renderPush();
    if (!key || !S().push || !pushSupported() || !(paired() && joined()) || Notification.permission !== 'granted') return;
    try { const sub = await pushSub(key); if (sub.endpoint !== S().pushEp) { await post('/push/sub', { endpoint: sub.endpoint }); S().pushEp = sub.endpoint; L.save(); } } catch (e) {}
  }
  /* Name des Schatzes für den Service Worker hinterlegen (er kann den App-Speicher nicht lesen) */
  let metaLast = null;
  function metaSync() {
    if (!('caches' in window)) return; const name = (paired() && joined()) ? partnerName() : '';
    if (name === metaLast) return; metaLast = name;
    caches.open('sf-meta').then((c) => name ? c.put('./__meta', new Response(JSON.stringify({ partner: name }), { headers: { 'Content-Type': 'application/json' } })) : c.delete('./__meta')).catch(() => {});
  }
  function renderPush() {
    metaSync();
    const can = pushSupported() && !!S().pushAvail && paired() && joined();
    const perm = can ? Notification.permission : 'default';
    const row = $('pushRow');
    if (row) {
      row.classList.toggle('hidden', !can);
      if (can) { L.setToggle('togPush', !!S().push && perm === 'granted'); $('pushHint').textContent = perm === 'denied' ? 'In den Handy-Einstellungen für diese App erlauben.' : ''; }
    }
    const card = $('pushPromo'); if (!card) return;
    const show = can && perm === 'default' && !S().push && !iosBrowser() && (S().pushSnooze || 0) < Date.now();
    card.classList.toggle('hidden', !show); if (!show) { card.innerHTML = ''; return; }
    if (card.firstChild) return;
    card.innerHTML = '<div class="promo-title">🔔 Sofort sehen, wenn ' + L.esc(partnerName()) + ' dir etwas schickt</div>' +
      '<div class="row wrap" style="margin-top:14px;justify-content:flex-start"><button class="pill-btn primary" data-on>Mitteilungen einschalten</button><button class="pill-btn ghost" data-later>Später</button></div>';
    card.querySelector('[data-on]').onclick = () => pushOn();
    card.querySelector('[data-later]').onclick = () => { S().pushSnooze = Date.now() + 7 * 864e5; L.save(); renderPush(); };
  }
  const tp = $('togPush'); if (tp) tp.onclick = () => { if (tp.getAttribute('aria-checked') === 'true') pushOff(); else if ('Notification' in window && Notification.permission === 'denied') L.toast('Erst in den Handy-Einstellungen für diese App erlauben'); else pushOn(); };
  /* Tipp auf die Mitteilung: Postfach öffnen */
  async function openFromPush() { try { await pull(true); } catch (e) {} if (unread() || (P().inbox || []).length) inboxSheet(); }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => { const d = e.data || {}; if (d.t === 'postfach') openFromPush(); else if (d.t === 'push') pull(true); });

  /* ---------- Verdrahtung ---------- */
  const sb = $('btnSendPartner'); if (sb) sb.onclick = async () => {
    const text = $('msgText').textContent; if (!text || text === '…') return;
    try { await send({ t: 'msg', text, label: $('msgLabel').textContent || '' }); L.toast('Zugestellt 💌'); L.spawnHearts(8); } catch (e) { L.toast('Senden fehlgeschlagen'); }
  };
  const vb = $('btnVorlieben'); if (vb) vb.onclick = () => playDeck('vorlieben');
  $('matchScreen').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMatch(); });
  document.querySelector('.seg[data-seg="play"] [data-sub="match"]').addEventListener('click', renderDecks);
  $('nav-play').addEventListener('click', renderDecks);
  $('nav-home').addEventListener('click', () => { renderHomeCards(); pull(); });
  $('nav-settings').addEventListener('click', renderSettingsCard);
  $('nav-time').addEventListener('click', renderGiftRadar);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(true); });
  window.addEventListener('focus', () => pull());
  setInterval(() => { if (document.visibilityState === 'visible') pull(); }, 45000);
  $('obFinish').addEventListener('click', () => setTimeout(() => { renderAll(); offerPendingPair(); }, 80));

  window.LZP = { createPair, doJoin, searchSheet, searchFormHtml, bindSearch, activity, deckStatus, openDeckFromStatus, explored, lastSent, P, paired, joined, partnerName, sendOrShare, sendCoupon, send, pull, pairSheet, inboxSheet, renderPost, timeline, openItem, playDeck, renderDecks, renderAll, renderGiftRadar, amazonUrl, tips, tipOf, tipsHtml, bindTips, mountTips, leavePair, unread, RELAY, on, inboxType, openMatch, closeMatch, online, pairLink, ideaSheet, reportSheet, iosBrowser, commonSheet, renderCommon, pushOn, pushOff, pushSupported, renderPush, partnerPron: () => (P().partner && P().partner.pron) || '', announce: () => { if (paired() && joined()) send({ t: 'hello', name: S().sender, pron: S().pron || '' }).catch(() => {}); } };
  renderAll(); handlePairParam();
  if (window.LZF) { window.LZF.renderPiek(); window.LZF.renderGiftRadar && window.LZF.renderGiftRadar(); }
  /* Erst abholen, wenn alle Skripte geladen sind (naehe.js meldet eigene Nachrichtenarten an) */
  const firstPull = () => {
    if (!S().onboarded) return;
    if (/[?&]postfach=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname); } catch (e) {} openFromPush(); } else pull(true);
    setTimeout(offerPendingPair, 400); setTimeout(pushCheck, 1200);
  };
  if (document.readyState === 'complete') setTimeout(firstPull, 0); else window.addEventListener('load', firstPull);
})();
