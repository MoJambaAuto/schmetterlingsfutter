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
    await send({ t: 'hello', name: S().sender });
    return P().partner;
  }
  async function leavePair(silent) {
    if (paired() && online()) { try { await post('/pair/leave', {}); } catch (e) { /* schon weg */ } }
    P().partner = null; P().matches = {}; P().inbox = P().inbox.filter((m) => m.t !== 'match'); L.save(); keys = null;
    if (!silent) { L.toast('Verbindung getrennt'); renderAll(); }
  }
  function pairLink() { const p = P().partner; return location.origin + location.pathname + '?pair=' + fmtCode(p.pair, p.secret); }

  /* ---------- Nachrichten ---------- */
  async function send(obj) {
    if (!paired()) throw new Error('Nicht verbunden');
    const body = await encrypt(Object.assign({ at: Date.now() }, obj));
    return post('/msg/send', { body });
  }
  let pulling = false, lastPull = 0;
  async function pull(force) {
    if (!paired() || !online() || pulling) return; if (!force && Date.now() - lastPull < 8000) return;
    pulling = true;
    try {
      const r = await post('/msg/pull', {});
      lastPull = Date.now();
      const p = P().partner;
      if (r.joined && !p.joined) { p.joined = true; L.save(); }
      const ids = []; let news = 0;
      for (const m of r.messages || []) {
        ids.push(m.id);
        const obj = await decrypt(m.body); if (!obj) continue;
        if (await handleIncoming(obj, m.created)) news++;
      }
      if (ids.length) await post('/msg/ack', { ids });
      if (news) { L.save(); renderAll(); }
      else if (r.joined !== undefined) renderAll();
    } catch (e) {
      if (e.status === 401) { /* Paar wurde vom Partner getrennt */ P().partner = null; L.save(); renderAll(); L.toast(partnerName() + ' hat die Verbindung getrennt'); }
    } finally { pulling = false; }
  }
  async function handleIncoming(obj, created) {
    const s = P(); const p = s.partner; const name = (obj.name || '').toString().slice(0, 18);
    if (obj.t === 'hello') {
      const first = !p.name;
      if (name) p.name = name;
      if (name && first && (S().receiver === 'Darling' || !S().receiver)) { S().receiver = name; L.renderHeader(); }
      if (first) { try { await send({ t: 'hello', name: S().sender, reply: true }); } catch (e) {} L.toast('💞 Verbunden mit ' + (name || 'deinem Schatz')); L.spawnHearts(14); }
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

  /* ---------- Senden oder Teilen ---------- */
  function sendOrShare(text, label) {
    if (!paired() || !joined()) return L.shareText(text + '\n— ' + S().sender + ' ❤');
    L.openSheet('<h3>Wohin damit?</h3><p class="about" style="margin-bottom:14px;font-size:13px">' + L.esc(text.length > 160 ? text.slice(0, 160) + '…' : text) + '</p>' +
      '<div class="row wrap"><button class="pill-btn primary" data-app>💌 In die App von ' + L.esc(partnerName()) + '</button><button class="pill-btn" data-share>↗ WhatsApp &amp; Co.</button><button class="pill-btn ghost" data-cancel>Abbrechen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-share]').onclick = () => { L.closeSheet(); L.shareText(text + '\n— ' + S().sender + ' ❤'); };
      sh.querySelector('[data-app]').onclick = async () => {
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
  function amazonUrl(q) {
    const tag = (D.affiliateTag || '').trim();
    return 'https://www.amazon.de/s?k=' + encodeURIComponent(q) + (tag ? '&tag=' + encodeURIComponent(tag) : '');
  }
  function tips(key, n) {
    const arr = (D.tips[key] || []).filter((t) => t.q); const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out.slice(0, n || 2);
  }
  function tipsHtml(items, title) {
    if (!items.length) return '';
    return '<div class="tips"><span class="tips-label">' + L.esc(title || 'Passend dazu') + ' <i class="ad-note">Werbelinks</i></span>' +
      items.map((t) => '<button type="button" class="tip" data-q="' + L.esc(t.q) + '">' + (t.icon || '🛒') + ' ' + L.esc(t.title) + ' <span>↗</span></button>').join('') + '</div>';
  }
  function bindTips(root) {
    root.querySelectorAll('.tip[data-q]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); window.open(amazonUrl(b.dataset.q), '_blank', 'noopener'); }; });
  }
  function mountTips(container, key, title, n) {
    if (!container) return; const items = typeof key === 'string' ? tips(key, n) : key;
    container.innerHTML = tipsHtml(items, title); bindTips(container);
  }

  /* ---------- Gleichklang (Match-Spiele) ---------- */
  const deckById = (id) => D.decks.find((d) => d.id === id);
  const serverDeck = (deck) => deck.daily ? deck.id + '_' + L.todayKey().replace(/-/g, '') : deck.id;
  let game = null;
  function openMatch(html, onMount) { const sc = $('matchScreen'); sc.querySelector('.inner').innerHTML = html; sc.classList.remove('hidden'); if (onMount) onMount(sc); }
  function closeMatch() { $('matchScreen').classList.add('hidden'); game = null; }
  const optLabels = { ja: '👍 Ja', vielleicht: '🤷 Vielleicht', nein: '👎 Nein' };

  function playDeck(deckId, forcePass) {
    const deck = deckById(deckId); if (!deck) return;
    if (deck.adult && !S().intim) { L.toast('Erst den Bereich „Zweisamkeit“ unter Mehr einschalten (18+)'); return; }
    const mode = (!forcePass && paired() && joined() && RELAY) ? 'relay' : 'pass';
    const prev = P().matches[deck.id];
    game = { deck, mode, step: 0, who: 'me', mine: {}, theirs: {}, prev };
    let html = '<div class="match-head"><button class="icon-btn" data-close aria-label="Schließen">✕</button><div class="eyebrow" style="margin:0">Gleichklang</div><span></span></div>' +
      '<div class="match-intro"><div class="match-emoji">' + deck.icon + '</div><h2>' + L.esc(deck.title) + '</h2><p class="about">' + L.esc(deck.sub) + '</p>';
    if (mode === 'relay') html += '<p class="about" style="font-size:13px;color:var(--text-muted)">Du antwortest hier, ' + L.esc(partnerName()) + ' in der eigenen App. Es werden nur verschlüsselte Prüfsummen übertragen – Treffer sieht man erst, wenn beide fertig sind.</p>';
    else html += '<p class="about" style="font-size:13px;color:var(--text-muted)">Ohne Verbindung: Erst antwortest du, dann gibst du das Handy an ' + L.esc(partnerName()) + '. Die Antworten des anderen bleiben unsichtbar – angezeigt wird nur, was beide wollen.</p>';
    html += '<div class="row wrap" style="margin-top:18px"><button class="pill-btn primary" data-start>' + (deck.daily ? 'Heute antworten' : 'Los geht’s') + '</button>' +
      (prev && prev.matches ? '<button class="pill-btn" data-prev>Letztes Ergebnis</button>' : '') +
      (mode === 'relay' ? '<button class="pill-btn ghost small" data-pass>Lieber Handy weitergeben</button>' : (paired() ? '' : '<button class="pill-btn ghost small" data-connect>Apps verbinden</button>')) + '</div></div>';
    openMatch(html, (sc) => {
      sc.querySelector('[data-close]').onclick = closeMatch;
      sc.querySelector('[data-start]').onclick = () => askNext();
      const pv = sc.querySelector('[data-prev]'); if (pv) pv.onclick = () => showResults(deck, prev);
      const ps = sc.querySelector('[data-pass]'); if (ps) ps.onclick = () => playDeck(deckId, true);
      const cn = sc.querySelector('[data-connect]'); if (cn) cn.onclick = () => { closeMatch(); pairSheet(); };
    });
  }
  function askNext() {
    const g = game; const items = g.deck.items; const i = g.step;
    if (i >= items.length) return finishAnswers();
    const it = items[i]; const who = g.who === 'me' ? S().sender : partnerName();
    const answers = g.who === 'me' ? g.mine : g.theirs;
    const opts = g.deck.opts === 3 ? ['nein', 'vielleicht', 'ja'] : ['nein', 'ja'];
    openMatch('<div class="match-head"><button class="icon-btn" data-close aria-label="Abbrechen">✕</button><div class="eyebrow" style="margin:0">' + L.esc(who) + ' antwortet</div><span class="tag">' + (i + 1) + ' / ' + items.length + '</span></div>' +
      '<div class="progress" style="margin:0 0 20px"><i style="width:' + Math.round(i / items.length * 100) + '%"></i></div>' +
      '<div class="match-card"><div class="match-emoji">' + it.e + '</div><div class="match-q">' + L.esc(it.t) + '</div></div>' +
      '<div class="match-opts' + (g.deck.labels ? ' stack' : '') + '">' + opts.map((o) => '<button class="pill-btn ' + (o === 'ja' ? 'primary' : '') + '" data-a="' + o + '">' + (g.deck.labels || optLabels)[o] + '</button>').join('') + '</div>' +
      '<div class="row" style="margin-top:14px">' + (i > 0 ? '<button class="pill-btn ghost small" data-back>Zurück</button>' : '') + '</div>', (sc) => {
      sc.querySelector('[data-close]').onclick = () => L.confirmSheet('Abbrechen?', 'Die bisherigen Antworten gehen verloren.', 'Abbrechen', closeMatch, true);
      sc.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { answers[it.id] = b.dataset.a; L.haptic(6); g.step++; askNext(); });
      const bk = sc.querySelector('[data-back]'); if (bk) bk.onclick = () => { g.step--; askNext(); };
    });
  }
  async function finishAnswers() {
    const g = game; const deck = g.deck;
    if (g.mode === 'pass') {
      if (g.who === 'me') {
        g.who = 'them'; g.step = 0;
        openMatch('<div class="match-head"><button class="icon-btn" data-close aria-label="Abbrechen">✕</button><div class="eyebrow" style="margin:0">Handy weitergeben</div><span></span></div>' +
          '<div class="match-intro"><div class="match-emoji">📲</div><h2>Jetzt ' + L.esc(partnerName()) + '</h2><p class="about">' + L.esc(S().sender) + ', gib das Handy weiter und schau nicht hin. ' + L.esc(partnerName()) + ' antwortet für sich – sichtbar wird nachher nur, was ihr beide wollt.</p>' +
          '<div class="row" style="margin-top:18px"><button class="pill-btn primary" data-start>Ich bin ' + L.esc(partnerName()) + ' – los</button></div></div>', (sc) => {
          sc.querySelector('[data-close]').onclick = () => L.confirmSheet('Abbrechen?', 'Die bisherigen Antworten gehen verloren.', 'Abbrechen', closeMatch, true);
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
      const sd = serverDeck(deck);
      const hashes = await hashesFor(deck, sd, g.mine);
      await post('/match/put', { deck: sd, hashes });
      const rec = { date: new Date().toISOString(), mode: 'relay', mine: yesList(g.mine), open: [], matches: null, partnerDone: false, sd };
      P().matches[deck.id] = rec; L.save();
      try { await send({ t: 'match', deck: deck.id }); } catch (e) {}
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
      html += '<div class="match-intro"><div class="match-emoji">⏳</div><h2>Warte auf ' + name + '</h2><p class="about">Deine Antworten sind da. Sobald ' + name + ' in der eigenen App geantwortet hat, erscheinen hier eure Treffer. ' + name + ' hat eine Einladung bekommen.</p>' +
        '<div class="row wrap" style="margin-top:18px"><button class="pill-btn primary" data-refresh>Aktualisieren</button><button class="pill-btn" data-share-inv>Erinnerung schicken ↗</button><button class="pill-btn ghost small" data-again>Meine Antworten ändern</button></div></div>';
    } else {
      const yes = rec.matches.map((id) => deck.items.find((it) => it.id === id)).filter(Boolean);
      const open = (rec.open || []).map((id) => deck.items.find((it) => it.id === id)).filter(Boolean);
      html += '<div class="match-intro" style="padding-bottom:8px"><div class="match-emoji">' + (yes.length ? '💞' : '🫤') + '</div><h2>' + (yes.length ? yes.length + (yes.length === 1 ? ' Treffer' : ' Treffer') : 'Kein gemeinsames Ja') + '</h2>' +
        '<p class="about" style="font-size:13px">' + (yes.length ? (deck.hitText || 'Das wollt ihr beide. Alles andere bleibt geheim.') : (open.length ? 'Aber ihr seid beide bei ein paar Dingen offen – siehe unten.' : (deck.noneText || (deck.daily ? 'Heute nicht. Morgen gibt es neue Chancen – oder einer gibt nach. 😈' : 'Vielleicht beim nächsten Mal. Das Teufelchen empfiehlt: Vielleicht großzügiger antippen.')))) + '</p></div>';
      if (yes.length) html += '<div class="match-list">' + yes.map((it) => matchItem(it, deck.yesLabel || 'Beide Ja')).join('') + '</div>';
      if (open.length) html += '<div class="eyebrow" style="margin-top:14px">' + L.esc(deck.openTitle || 'Beide offen dafür') + '</div><div class="match-list">' + open.map((it) => matchItem(it, deck.openLabel || 'Vielleicht')).join('') + '</div>';
      /* Mut-Karte: Themen, die nur mir wichtig sind, bleiben geheim – aber ich bekomme Hilfe, sie selbst anzusprechen */
      if (deck.talk && rec.mode === 'relay') {
        const hidden = (rec.mine || []).filter((id) => !rec.matches.includes(id) && !(rec.open || []).includes(id)).map((id) => deck.items.find((it) => it.id === id)).filter(Boolean);
        if (hidden.length) html += '<div class="card soft" style="margin-top:14px;padding:14px 16px"><div class="eyebrow" style="margin:0 0 6px">🔒 Nur für dich</div><p class="about" style="font-size:13px">' + (hidden.length === 1 ? 'Ein Thema ist dir wichtig, das noch kein Treffer ist.' : hidden.length + ' Themen sind dir wichtig, die noch kein Treffer sind.') + ' ' + name + ' sieht das nicht. Unausgesprochenes wächst – das Teufelchen hilft dir, eines davon sanft selbst anzusprechen.</p><div class="row" style="justify-content:flex-start;margin-top:10px"><button class="pill-btn small" data-hidden>Anzeigen</button></div><div class="match-list hidden" data-hidden-list style="margin-top:10px">' + hidden.map((it) => matchItem(it, 'Nur dir wichtig')).join('') + '</div></div>';
      }
      if (!yes.length || deck.talk) html += tipsHtml(tips('match_' + deck.id, 2), deck.talk ? 'Hilft beim Reden' : 'Für den nächsten Versuch');
      html += '<div class="row wrap" style="margin-top:18px">' + (yes.length ? '<button class="pill-btn primary" data-share-res>Plan teilen ↗</button>' : '') + '<button class="pill-btn" data-again>Nochmal spielen</button>' + (rec.mode === 'relay' ? '<button class="pill-btn ghost small" data-refresh>Aktualisieren</button>' : '') + '</div>' +
        '<p class="about" style="font-size:11px;color:var(--text-muted);margin-top:12px">Stand ' + L.fmtDate(new Date(rec.date)) + (rec.mode === 'relay' ? ' · über die Partner-Verbindung, nur Prüfsummen verglichen' : ' · Handy-weitergeben-Modus') + '. Produktvorschläge sind Werbelinks zur Amazon-Suche.</p>';
    }
    openMatch(html, (sc) => {
      sc.querySelector('[data-close]').onclick = closeMatch; bindTips(sc);
      const hb = sc.querySelector('[data-hidden]'); if (hb) hb.onclick = () => { sc.querySelector('[data-hidden-list]').classList.toggle('hidden'); hb.textContent = hb.textContent === 'Anzeigen' ? 'Verbergen' : 'Anzeigen'; };
      sc.querySelectorAll('[data-soft]').forEach((b) => b.onclick = () => { if (window.LZN) window.LZN.softStart(b.dataset.soft); });
      const ag = sc.querySelector('[data-again]'); if (ag) ag.onclick = () => playDeck(deck.id, rec.mode === 'pass');
      const rf = sc.querySelector('[data-refresh]'); if (rf) rf.onclick = async () => { rf.disabled = true; rf.textContent = '…'; try { await refreshMatches(deck, rec, true); } catch (e) { L.toast('Keine Verbindung'); rf.disabled = false; rf.textContent = 'Aktualisieren'; } };
      const si = sc.querySelector('[data-share-inv]'); if (si) si.onclick = () => L.shareText('🎯 Ich habe in Schmetterlingsfutter „' + deck.title + '“ beantwortet. Spiel mit – ich bin gespannt, wo wir übereinstimmen! 😈 — ' + S().sender);
      const sr = sc.querySelector('[data-share-res]'); if (sr) sr.onclick = () => {
        const yes = rec.matches.map((id) => deck.items.find((it) => it.id === id)).filter(Boolean);
        L.shareText('💞 Gleichklang: ' + deck.title + '\n' + yes.map((it) => it.e + ' ' + it.t).join('\n') + '\n— ' + S().sender + ' & ' + partnerName() + ' (Schmetterlingsfutter)');
      };
    });
    renderDecks(); renderInboxBadge();
  }
  function matchItem(it, badge) {
    if (it.q) return '<div class="match-item"><span class="mi-e">' + it.e + '</span><div class="mi-b"><div class="mi-t">' + L.esc(it.t) + '</div><div class="mi-s">' + L.esc(badge) + '</div><div class="mi-q">💬 ' + L.esc(it.q) + '</div><button type="button" class="tip inline" data-soft="' + L.esc(it.t) + '">🕊️ Sanft ansprechen</button></div></div>';
    return'<div class="match-item"><span class="mi-e">' + it.e + '</span><div class="mi-b"><div class="mi-t">' + L.esc(it.t) + '</div><div class="mi-s">' + badge + (it.tip ? ' · <button type="button" class="tip inline" data-q="' + L.esc(it.tip) + '">🛒 ' + L.esc(it.tip) + ' ↗</button>' : '') + '</div></div></div>';
  }
  function renderDecks() {
    const l = $('deckList'); if (!l) return; l.innerHTML = '';
    D.decks.forEach((deck) => {
      if (deck.talk) return; // läuft unter „Klartext“
      if (deck.adult && !S().intim) return;
      const rec = P().matches[deck.id]; let state = '';
      if (rec) {
        if (deck.daily && rec.date.slice(0, 10) !== L.todayKey()) state = 'Gestern gespielt – heute neu';
        else if (rec.matches === null) state = (rec.stale ? '✨ ' + partnerName() + ' hat geantwortet – antippen' : 'Wartet auf ' + partnerName());
        else state = rec.matches.length + (rec.matches.length === 1 ? ' Treffer' : ' Treffer') + (rec.stale ? ' · neu laden' : '');
      }
      const d = document.createElement('button'); d.type = 'button'; d.className = 'deck' + (deck.adult ? ' adult' : '');
      d.innerHTML = '<span class="d-ico">' + deck.icon + '</span><div class="d-body"><div class="d-title">' + L.esc(deck.title) + '</div><div class="d-sub">' + L.esc(state || deck.sub) + '</div></div><span class="d-go">›</span>';
      d.onclick = () => {
        if (rec && rec.matches === null && rec.mode === 'relay' && !(deck.daily && rec.date.slice(0, 10) !== L.todayKey())) { showResults(deck, rec); refreshMatches(deck, rec, true).catch(() => {}); }
        else if (rec && rec.stale && rec.mode === 'relay') { showResults(deck, rec); refreshMatches(deck, rec, true).catch(() => {}); }
        else playDeck(deck.id);
      };
      l.appendChild(d);
    });
    const hint = $('deckHint'); if (hint) hint.textContent = paired() && joined() ? 'Verbunden mit ' + partnerName() + ' – jeder antwortet in seiner App.' : 'Ohne Verbindung spielt ihr an einem Handy („Handy weitergeben“). Verbunden geht es getrennt und geheim.';
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
          : '<p class="about" style="margin-bottom:10px">Noch wartet die Verbindung auf ' + L.esc(S().receiver) + '. Sitzt ihr nebeneinander? Dann einfach diesen Code mit der Handy-Kamera scannen. Sonst Link oder Code schicken:</p><div class="qr" data-qr="' + L.esc(pairLink()) + '"></div><div class="paircode">' + code + '</div>') +
        '<div class="row wrap">' + (p.joined ? '' : '<button class="pill-btn primary" data-link>Link schicken ↗</button><button class="pill-btn" data-copy>Code kopieren</button><button class="pill-btn ghost small" data-check>Schon beigetreten?</button>') +
        '<button class="pill-btn ghost danger small" data-leave>Verbindung trennen</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>' +
        '<p class="about" style="font-size:11px;color:var(--text-muted);margin-top:12px">Der Code enthält ein Geheimnis, das nur eure beiden Apps kennen. Der Vermittlungsdienst sieht nur verschlüsselte Daten. „Trennen“ löscht dort alles sofort.</p>', (sh) => {
        sh.querySelector('[data-cancel]').onclick = L.closeSheet;
        if (window.LZN) window.LZN.fillQr(sh);
        const lk = sh.querySelector('[data-link]'); if (lk) lk.onclick = () => L.shareText('💞 Lass uns Schmetterlingsfutter verbinden! Öffne diesen Link auf deinem Handy (App vorher installieren: ' + location.origin + location.pathname + '):\n' + pairLink() + '\nOder gib in der App unter Mehr → Partner verbinden diesen Code ein: ' + code);
        const cp = sh.querySelector('[data-copy]'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(code); L.toast('Code kopiert 📋'); } catch (e) { L.toast(code); } };
        const ck = sh.querySelector('[data-check]'); if (ck) ck.onclick = async () => { ck.textContent = '…'; await pull(true); L.closeSheet(); if (joined()) L.toast('💞 Verbunden!'); else L.toast('Noch nicht – ' + S().receiver + ' muss den Link öffnen.'); };
        sh.querySelector('[data-leave]').onclick = () => { L.closeSheet(); L.confirmSheet('Verbindung trennen?', 'Beide Apps werden getrennt, alle Vermittlungsdaten werden gelöscht. Eure lokalen Daten bleiben.', 'Trennen', () => leavePair(), true); };
      });
      return;
    }
    L.openSheet('<h3>💞 Apps verbinden</h3><p class="about" style="margin-bottom:14px">Dann landen Botschaften und Gutscheine direkt in der App von ' + L.esc(S().receiver) + ', und bei den Gleichklang-Spielen antwortet jeder heimlich auf dem eigenen Handy. Ohne Konto, verschlüsselt.</p>' +
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
    try { await joinPair(code); L.closeSheet(); L.toast('💞 Verbunden! ' + S().receiver + ' bekommt gleich Bescheid.'); L.spawnHearts(14); renderAll(); setTimeout(() => pull(true), 1500); }
    catch (e) {
      const msg = e.code === 'full' ? 'Dieser Code ist schon mit einem anderen Gerät verbunden.' : e.code === 'unknown' ? 'Code unbekannt oder abgelaufen (48 h).' : e.code === 'same device' ? 'Das ist dein eigener Code.' : (e.message || 'Fehler');
      L.toast(msg); if (btn) { btn.disabled = false; btn.textContent = 'Beitreten'; }
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
  function offerPendingPair() {
    const code = P().pendingPair; if (!code || paired()) return;
    L.confirmSheet('💞 Apps verbinden?', S().receiver + ' hat dir einen Verbindungs-Code geschickt. Jetzt verbinden?', 'Verbinden', () => { P().pendingPair = null; L.save(); doJoin(code); });
  }

  /* ---------- Postfach ---------- */
  function inboxSheet() {
    const s = P(); const items = s.inbox.slice().reverse();
    let html = '<h3>📬 Postfach</h3>';
    if (!items.length) html += '<div class="empty">Noch nichts angekommen. Was ' + L.esc(partnerName()) + ' dir aus der App schickt, landet hier.</div>';
    items.forEach((m) => {
      const when = new Date(m.at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const def = inboxTypes[m.t];
      html += '<div class="inbox-item' + (m.read ? '' : ' new') + '" data-id="' + m.id + '"><span class="ii-e">' + (def ? def.icon : m.t === 'coupon' ? '🎟️' : m.t === 'match' ? '🎯' : m.t === 'unknown' ? '❔' : '💌') + '</span><div class="ii-b">' + (def && def.html ? def.html(m) : '') + '<div class="ii-t">' + L.esc(m.text || '') + '</div><div class="ii-m">' + (def ? L.esc(def.meta || '') + ' · ' : m.t === 'match' ? 'Einladung zum Mitspielen · ' : m.t === 'coupon' ? 'Gutschein, liegt bei Wünsche → Gutscheine · ' : (m.label ? L.esc(m.label) + ' · ' : '')) + when + '</div></div><button class="reason-del" aria-label="Löschen" data-del="' + m.id + '">✕</button></div>';
    });
    html += '<div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>';
    L.openSheet(html, (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('.inbox-item').forEach((el) => el.onclick = (e) => {
        if (e.target.dataset.del) return;
        const m = s.inbox.find((x) => x.id === el.dataset.id); if (!m) return; m.read = true; L.save(); L.closeSheet();
        if (m.t === 'msg') { L.showView('home'); L.showMessage({ text: m.text, own: true, incoming: true }, 'Von ' + partnerName() + ' für dich'); L.spawnHearts(10); }
        else if (m.t === 'coupon') { L.showView('wishes'); L.showSub('wishes', 'coupons'); }
        else if (m.t === 'match') { const deck = deckById(m.deck); if (deck) { const rec = s.matches[deck.id]; if (rec && rec.mode === 'relay' && (!deck.daily || rec.date.slice(0, 10) === L.todayKey())) { showResults(deck, rec); refreshMatches(deck, rec, true).catch(() => {}); } else playDeck(deck.id); } }
        else if (inboxTypes[m.t] && inboxTypes[m.t].open) inboxTypes[m.t].open(m);
        renderAll();
      });
      sh.querySelectorAll('[data-del]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); s.inbox = s.inbox.filter((x) => x.id !== b.dataset.del); L.save(); L.closeSheet(); inboxSheet(); renderAll(); });
    });
    s.inbox.forEach((m) => { if (m.t === 'match' || m.t === 'unknown') m.read = true; }); L.save();
  }
  function renderInboxBadge() {
    const n = unread(); const b = $('inboxBadge'); if (b) { b.textContent = n > 9 ? '9+' : n; b.classList.toggle('hidden', !n); }
    const nb = $('navBadge'); if (nb) nb.classList.toggle('hidden', !n);
  }

  /* ---------- Startseite: Verbindung, Bock-auf, Geschenk-Radar ---------- */
  function renderHomeCards() {
    const c = $('partnerCard'); if (!c) return;
    const s = P(); const p = s.partner; const n = unread();
    if (!RELAY) { c.classList.add('hidden'); }
    else {
      c.classList.remove('hidden');
      if (!p) c.innerHTML = '<div class="row between"><div><div class="eyebrow" style="margin:0 0 4px">💞 Zu zweit noch besser</div><div style="font-size:14px">Verbinde deine App mit der von ' + L.esc(S().receiver) + ': Botschaften landen direkt dort, Gleichklang-Spiele laufen geheim auf zwei Handys.</div></div></div><div class="row wrap" style="margin-top:12px;justify-content:flex-start"><button class="pill-btn small primary" data-pair>Jetzt verbinden</button><button class="pill-btn small ghost" data-bock>🎯 Worauf Bock heute?</button></div>';
      else if (!p.joined) c.innerHTML = '<div class="eyebrow" style="margin:0 0 4px">⏳ Wartet auf ' + L.esc(S().receiver) + '</div><div style="font-size:14px">Dein Code ist bereit. ' + L.esc(S().receiver) + ' muss den Link öffnen oder den Code eingeben.</div><div class="row wrap" style="margin-top:12px;justify-content:flex-start"><button class="pill-btn small primary" data-pair>Link schicken</button><button class="pill-btn small ghost" data-check>Prüfen</button></div>';
      else c.innerHTML = '<div class="eyebrow" style="margin:0 0 4px">💞 Verbunden mit ' + L.esc(partnerName()) + '</div><div style="font-size:13px;color:var(--text-soft)">' + (n ? (n === 1 ? 'Eine neue Nachricht wartet im Postfach.' : n + ' neue Nachrichten warten im Postfach.') : 'Botschaften und Gutscheine landen direkt bei ' + L.esc(partnerName()) + '.') + '</div><div class="row wrap" style="margin-top:12px;justify-content:flex-start"><button class="pill-btn small ' + (n ? 'primary' : '') + '" data-inbox>📬 Postfach <span class="badge' + (n ? '' : ' hidden') + '" id="inboxBadge">' + n + '</span></button><button class="pill-btn small" data-bock>🎯 Worauf Bock heute?</button><button class="pill-btn small ghost" data-pair>Verbindung</button></div>';
      const pr = c.querySelector('[data-pair]'); if (pr) pr.onclick = pairSheet;
      const ib = c.querySelector('[data-inbox]'); if (ib) ib.onclick = inboxSheet;
      const bk = c.querySelector('[data-bock]'); if (bk) bk.onclick = () => playDeck('bock');
      const ck = c.querySelector('[data-check]'); if (ck) ck.onclick = async () => { ck.textContent = '…'; await pull(true); renderAll(); if (!joined()) L.toast('Noch nicht beigetreten'); };
    }
    renderGiftRadar();
  }
  function renderGiftRadar() {
    const g = $('giftRadar'); if (!g || !window.LZF || !window.LZF.occasionsAll) return;
    const list = window.LZF.occasionsAll(); const o = list[0]; const s = S();
    const wishes = s.wishes.filter((w) => !w.done && (w.cat || 'wunsch') === 'wunsch');
    if (!o) { g.classList.add('hidden'); return; }
    g.classList.remove('hidden');
    const key = o.id === 'jahrestag' ? 'jahrestag' : o.id === 'geburtstag' ? 'geburtstag' : (D.gifts[o.id] ? o.id : null);
    const ideas = ((key ? D.gifts[key] : []).concat(D.gifts.default)).filter((x) => x.q).slice(0, 2);
    let html = '<div class="row between"><div class="eyebrow" style="margin:0">🎁 Geschenk-Radar</div><span class="tag">' + (o.days === 0 ? 'heute' : 'in ' + o.days + (o.days === 1 ? ' Tag' : ' Tagen')) + '</span></div>' +
      '<div style="font-size:14px;margin:6px 0 2px">' + o.icon + ' ' + L.esc(o.title) + (o.days <= 14 ? ' – jetzt wird es Zeit.' : ' – entspannt vorplanen.') + '</div>';
    const items = wishes.slice(0, 1).map((w) => ({ icon: '⭐', title: w.text, q: w.text })).concat(ideas.map((x) => ({ icon: x.icon, title: x.title, q: x.q })));
    html += tipsHtml(items, wishes.length ? 'Aus der Love Map und passende Ideen' : 'Ideen');
    html += '<div class="row wrap" style="margin-top:8px;justify-content:flex-start"><button class="pill-btn small ghost" data-all>Alle Ideen für ' + L.esc(o.title) + '</button><button class="pill-btn small ghost" data-wish>+ Wunsch notieren</button></div>';
    g.innerHTML = html; bindTips(g);
    g.querySelector('[data-all]').onclick = () => window.LZF.giftSheet(o);
    g.querySelector('[data-wish]').onclick = () => $('btnAddWish').click();
  }
  function renderSettingsCard() {
    const c = $('partnerSettings'); if (!c) return; const p = P().partner;
    if (!RELAY) { c.innerHTML = '<div class="eyebrow">Partner-Verbindung</div><p class="about" style="font-size:13px">In dieser Version noch nicht freigeschaltet.</p>'; return; }
    c.innerHTML = '<div class="eyebrow">Partner-Verbindung</div><p class="about" style="font-size:13px;margin-bottom:10px">' + (!p ? 'Nicht verbunden. Mit Verbindung landen Botschaften und Gutscheine direkt in der App von ' + L.esc(S().receiver) + ', und Gleichklang-Spiele laufen getrennt auf zwei Handys.' : p.joined ? 'Verbunden mit ' + L.esc(partnerName()) + '. Der Vermittlungsdienst sieht nur verschlüsselte Daten.' : 'Code erzeugt, wartet auf ' + L.esc(S().receiver) + '.') + '</p><div class="row wrap" style="justify-content:flex-start"><button class="pill-btn small ' + (p ? '' : 'primary') + '" data-pair>' + (!p ? 'Jetzt verbinden' : 'Verbindung verwalten') + '</button>' + (p && p.joined ? '<button class="pill-btn small ghost" data-inbox>📬 Postfach</button>' : '') + '</div>';
    c.querySelector('[data-pair]').onclick = pairSheet; const ib = c.querySelector('[data-inbox]'); if (ib) ib.onclick = inboxSheet;
  }
  function renderSendButtons() {
    const on = paired() && joined();
    const b = $('btnSendPartner'); if (b) { b.classList.toggle('hidden', !on); b.setAttribute('aria-label', 'In die App von ' + partnerName() + ' schicken'); }
  }
  function renderAll() { renderHomeCards(); renderSettingsCard(); renderSendButtons(); renderInboxBadge(); renderDecks(); if (window.LZN) window.LZN.render(); }

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

  window.LZP = { P, paired, joined, partnerName, sendOrShare, sendCoupon, send, pull, pairSheet, inboxSheet, playDeck, renderDecks, renderAll, renderGiftRadar, amazonUrl, tips, tipsHtml, bindTips, mountTips, leavePair, unread, RELAY, on, inboxType, openMatch, closeMatch, online, pairLink };
  renderAll(); handlePairParam();
  if (window.LZF) { window.LZF.renderPiek(); window.LZF.renderGiftRadar && window.LZF.renderGiftRadar(); }
  /* Erst abholen, wenn alle Skripte geladen sind (naehe.js meldet eigene Nachrichtenarten an) */
  const firstPull = () => { if (S().onboarded) { pull(true); setTimeout(offerPendingPair, 400); } };
  if (document.readyState === 'complete') setTimeout(firstPull, 0); else window.addEventListener('load', firstPull);
})();
