/* ========== Schmetterlingsfutter – App-Logik ==========
   Keine Abhängigkeiten, kein Netzwerk, alle Daten in localStorage. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA;
  const STORE_KEY = 'luzifer.v2';
  const $ = (id) => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';

  /* ---------- State ---------- */
  const defaults = () => ({
    v: 2,
    onboarded: false,
    sender: 'Hase', receiver: 'Darling', emojiS: '🐰', emojiR: '🌸',
    anniversary: null,
    theme: 'nacht',
    alwaysYes: true, motion: true, haptic: true, pron: '', rpron: '',
    favorites: [],
    ownMessages: [],
    reasons: D.reasons.slice(),
    coupons: D.coupons.map((c, i) => ({ id: 'c' + i, icon: c.icon, title: c.title, desc: c.desc, used: null })),
    oracle: { asked: 0, yes: 0 },
    taps: 0,
    giftSealed: false,
    partnerBirthday: null,
    occasions: [],
    amazonTag: '',
    wishes: [],
    showDoneWishes: false,
    songs: [],
    intim: false,
    intimWishes: [],
    piekDone: {}, piekCount: 0, piekOverride: null,
    thanks: [],
    hiddenOccasions: [],
    wishFilter: 'alle',
    partner: null, inbox: [], matches: {}, deviceId: null, pendingPair: null,
    checkins: {}, pauseUntil: null, jingleCat: 'einfachso'
  });
  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      return Object.assign(defaults(), parsed);
    } catch (e) { return defaults(); }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* privater Modus o. ä. */ }
  }

  /* ---------- Helpers ---------- */
  const fmt = (t) => t.replace(/\{s\}/g, S.sender).replace(/\{r\}/g, S.receiver);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h >>> 0); }
  function haptic(ms) { if (S.haptic && navigator.vibrate) { try { const v = Array.isArray(ms) ? ms : Math.min(70, Math.max(28, Math.round((ms || 12) * 2.5))); navigator.vibrate(v); } catch (e) {} } } /* 3.36.1: Impulse unter ca. 20 ms spürt man auf vielen Handys (z. B. Galaxy S23) nicht */
  const fmtDate = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const atMidnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const parseISODate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  /* Zeitangabe für Verläufe (3.43.0): gerade eben · vor N Min. · HH:MM · gestern HH:MM · Mo. HH:MM · TT.MM. */
  function ago(ts) {
    const d = new Date(ts), now = new Date(), diff = now - d;
    if (!isFinite(diff)) return '';
    if (diff < 60000) return 'gerade eben';
    if (diff < 3600000) return 'vor ' + Math.floor(diff / 60000) + ' Min.';
    const hm = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const days = Math.round((atMidnight(now) - atMidnight(d)) / 864e5);
    if (days <= 0) return hm;
    if (days === 1) return 'gestern ' + hm;
    if (days < 7) return d.toLocaleDateString('de-DE', { weekday: 'short' }).replace(/\.?$/, '.') + ' ' + hm;
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }

  let toastTimer;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    /* Lesezeit nach Textlänge: mindestens 4 Sekunden, höchstens 9. Antippen schließt sofort. */
    const ms = Math.min(9000, Math.max(4000, 2000 + String(msg).length * 75));
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
    t.onclick = () => { clearTimeout(toastTimer); t.classList.remove('show'); };
  }

  /* ---------- Sheet (Bottom-Modal) ---------- */
  function openSheet(html, onMount) {
    const m = $('modal'), sh = $('sheet');
    sh.innerHTML = html; m.classList.add('open');
    if (onMount) onMount(sh);
    const first = sh.querySelector('input,textarea,button'); if (first) setTimeout(() => first.focus(), 50);
  }
  function closeSheet() { $('modal').classList.remove('open'); $('sheet').innerHTML = ''; }
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  function confirmSheet(title, text, okLabel, onOk, danger, cancelLabel) {
    openSheet(
      '<h3>' + esc(title) + '</h3><p class="about" style="margin-bottom:18px">' + esc(text) + '</p>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>' + esc(cancelLabel || 'Abbrechen') + '</button>' +
      '<button class="pill-btn primary' + (danger ? ' danger' : '') + '" data-ok>' + esc(okLabel) + '</button></div>',
      (sh) => {
        sh.querySelector('[data-cancel]').onclick = closeSheet;
        sh.querySelector('[data-ok]').onclick = () => { closeSheet(); onOk(); };
      });
  }
  function promptSheet(title, fields, okLabel, onOk) {
    let html = '<h3>' + esc(title) + '</h3>';
    fields.forEach((f) => {
      html += '<div class="field"><label for="pf-' + f.key + '">' + esc(f.label) + '</label>';
      html += f.options
        ? '<select id="pf-' + f.key + '">' + f.options.map((o) => '<option value="' + esc(o.value) + '"' + (o.value === f.value ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') + '</select>'
        : f.multiline
        ? '<textarea id="pf-' + f.key + '" maxlength="' + (f.max || 240) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(f.value || '') + '</textarea>'
        : '<input id="pf-' + f.key + '" maxlength="' + (f.max || 60) + '" placeholder="' + esc(f.placeholder || '') + '" value="' + esc(f.value || '') + '">';
      html += '</div>';
    });
    html += '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>' + esc(okLabel) + '</button></div>';
    openSheet(html, (sh) => {
      sh.querySelector('[data-cancel]').onclick = closeSheet;
      sh.querySelector('[data-ok]').onclick = () => {
        const out = {}; fields.forEach((f) => { out[f.key] = sh.querySelector('#pf-' + f.key).value.trim(); });
        if (onOk(out) !== false) closeSheet();
      };
    });
  }

  /* ---------- Sterne & Herzen ---------- */
  (function stars() {
    const sc = $('stars');
    for (let i = 0; i < 50; i++) {
      const s = document.createElement('div'); s.className = 'star';
      const size = 1 + Math.random() * 2.5;
      s.style.cssText = 'left:' + Math.random() * 100 + '%;top:' + Math.random() * 100 + '%;width:' + size + 'px;height:' + size + 'px;--d:' + (2 + Math.random() * 4) + 's;--delay:' + (Math.random() * 5) + 's';
      sc.appendChild(s);
    }
  })();
  function spawnHearts(n, refEl) {
    if (!S.motion) return;
    const c = $('fh'); const r = (refEl || $('heartWrap')).getBoundingClientRect();
    const ar = $('app').getBoundingClientRect();
    const cx = r.left - ar.left + r.width / 2, cy = r.top - ar.top + r.height / 2;
    const em = ['❤️', '💕', '💖', '💗', S.emojiS, '✨', S.emojiR, '💝', '🌼'];
    for (let i = 0; i < n; i++) {
      const h = document.createElement('div'); h.className = 'float-heart'; h.textContent = pick(em);
      h.style.cssText = 'left:' + (cx + (Math.random() - .5) * 90) + 'px;top:' + (cy + (Math.random() - .5) * 40) + 'px;font-size:' + (12 + Math.random() * 16) + 'px;animation-delay:' + (Math.random() * .45) + 's';
      c.appendChild(h); setTimeout(() => h.remove(), 3000);
    }
  }

  /* ---------- Theme / Header ---------- */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', S.theme);
    document.documentElement.setAttribute('data-motion', S.motion ? 'on' : 'off');
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg0').trim() || '#1a0a1e');
  }
  function renderHeader() {
    $('pillSender').textContent = S.emojiS + ' ' + S.sender;
    $('pillReceiver').textContent = S.emojiR + ' ' + S.receiver;
    $('heartEmoji').textContent = S.emojiS;
    $('msgSig').textContent = '— ' + S.sender;
    document.title = 'Schmetterlingsfutter ❤ ' + S.receiver;
  }

  /* ---------- Navigation ---------- */
  /* 3.43.0: fünf Reiter (Heute · Post · Schicken · Spielen · Wir), Einstellungen über das Zahnrad.
     Zeit und Wünsche sind Unterseiten von „Wir“; ihre alten Reiter-Knöpfe liegen verborgen in #navStash,
     damit Skripte, die sich an deren Klick hängen, weiter mitzeichnen. */
  const TAB_OF = { home: 'home', post: 'post', send: 'send', play: 'play', us: 'us', time: 'us', wishes: 'us', settings: '' };
  function showView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
    const tab = TAB_OF[name] !== undefined ? TAB_OF[name] : name;
    document.querySelectorAll('.nav button').forEach((b) => {
      const on = b.dataset.view === tab; b.classList.toggle('active', on); b.setAttribute('aria-selected', on);
    });
    document.documentElement.setAttribute('data-view', name);
    const gear = $('btnSettings'); if (gear) { gear.classList.toggle('active', name === 'settings'); gear.setAttribute('aria-pressed', name === 'settings'); }
    if (name === 'play' && !daisyReady) initDaisy();
    if (name === 'time') { renderTime(); if (window.LZF) window.LZF.renderOccasions(); }
    if (name === 'wishes') { renderCoupons(); if (window.LZF) window.LZF.renderWishes(); }
    if (name === 'settings') { renderSettings(); if (window.LZF) window.LZF.renderIntim(); }
    if (name === 'play' && window.LZF) window.LZF.renderSongs();
    if (name === 'post' && window.LZP && window.LZP.renderPost) window.LZP.renderPost();
    if (name === 'send' && typeof renderOwnMsgs === 'function') renderOwnMsgs();
    if (name === 'us' && typeof renderUs === 'function') renderUs();
    const legacy = $('nav-' + name); if (legacy && !legacy.closest('.nav')) legacy.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('.nav button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
  $('btnSettings').addEventListener('click', () => showView('settings'));
  /* Zurück-Bausteine: „‹ Wir“, „‹ Zurück“, „‹ Spielen“ */
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-back],[data-back-sub]'); if (!b) return;
    if (b.dataset.back) { showView(b.dataset.back); return; }
    showSub('play', b.dataset.backSub); if (window.LZG) window.LZG.renderHub(); window.scrollTo(0, 0);
  });
  function showSub(seg, sub) {
    const s = document.querySelector('.seg[data-seg="' + seg + '"]'); if (!s) return;
    s.querySelectorAll('button').forEach((b) => { const on = b.dataset.sub === sub; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    s.parentElement.querySelectorAll(':scope > .sub').forEach((p) => p.classList.toggle('active', p.id === 'sub-' + sub));
  }
  document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => showSub(b.closest('.seg').dataset.seg, b.dataset.sub)));

  /* ---------- Botschaften ---------- */
  let current = { text: '', own: false };
  let queue = [];
  function pool() {
    const base = D.messages.map((t) => ({ text: t, own: false }));
    const own = S.ownMessages.map((t) => ({ text: t, own: true }));
    return base.concat(own);
  }
  function refillQueue() {
    queue = pool();
    for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; }
  }
  function dailyMessage() {
    /* Jeden Tag eine andere Botschaft: feste, je Paar gemischte Reihenfolge – Wiederholung erst, wenn alle dran waren */
    const p = pool(); const order = p.map((_, i) => i); let seed = hash(S.sender + '|' + S.receiver + '|' + p.length) || 1;
    for (let i = order.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); const t = order[i]; order[i] = order[j]; order[j] = t; }
    const day = Math.floor(Date.parse(todayKey() + 'T00:00:00Z') / 864e5);
    return p[order[((day % p.length) + p.length) % p.length]];
  }
  function fade(fn) {
    const el = $('msgText'); el.style.opacity = 0;
    setTimeout(() => { fn(); el.style.opacity = 1; }, 300);
  }
  const tipKeyFor = (label) => ({ 'Ein Kuss': 'kiss', 'Eine Umarmung': 'hug', 'Guten Morgen': 'morning', 'Gute Nacht': 'night', 'Frisch gezaubert ✨': 'gen', 'Dein Danke': 'thanks' })[label] || 'message';
  /* Wer unten eine Kachel antippt, sieht die Botschaftskarte oft nicht: dann holt die App sie ins Bild */
  let lastTap = 0; document.addEventListener('click', () => { lastTap = Date.now(); }, true);
  function revealMsg() {
    if (Date.now() - lastTap > 1500 || !$('view-home').classList.contains('active')) return;
    const card = $('msgText').closest('.card'); if (!card) return; const r = card.getBoundingClientRect();
    if (r.top < 60 || r.bottom > window.innerHeight - 90) card.scrollIntoView({ behavior: S.motion === false ? 'auto' : 'smooth', block: 'center' });
  }
  function showMessage(item, label) {
    current = item; revealMsg();
    fade(() => {
      $('msgText').textContent = fmt(item.text);
      $('msgLabel').textContent = label || (item.own ? 'Persönlich für dich' : '');
      $('msgSig').textContent = '— ' + (item.incoming ? S.receiver : S.sender);
      const re = $('msgRe'); if (re) re.innerHTML = item.re && window.LZR ? window.LZR.quoteHtml(item.re, 'deine Nachricht') : '';
      const rb = $('btnReplyMsg'); if (rb) { rb.classList.toggle('hidden', !(item.incoming && item.mid)); rb.dataset.mid = item.mid || ''; }
      $('reasonPanel').classList.add('hidden');
      updateFavBtn();
      if (window.LZP) window.LZP.mountTips($('msgTips'), tipKeyFor(label), 'Passend dazu');
    });
  }
  function nextMessage() {
    if (!queue.length) refillQueue();
    let item = queue.pop();
    if (item && item.text === current.text && queue.length) { queue.unshift(item); item = queue.pop(); }
    S.taps++; save();
    $('tapCounter').textContent = S.taps >= 10 ? S.taps + ' × Liebe abgeholt' : '';
    showMessage(item, '');
  }
  function isFav() { return S.favorites.includes(current.text); }
  function updateFavBtn() {
    const b = $('btnFav'); const on = isFav();
    b.textContent = on ? '❤️' : '🤍'; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  }
  function toggleFav() {
    if (!current.text) return;
    if (isFav()) { S.favorites = S.favorites.filter((t) => t !== current.text); toast('Aus Favoriten entfernt'); }
    else { S.favorites.push(current.text); toast('Als Favorit gespeichert ❤'); spawnHearts(4); }
    save(); updateFavBtn(); renderFavs();
  }
  function renderFavs() {
    const l = $('favList'); $('favCount').textContent = S.favorites.length;
    if (!S.favorites.length) { l.innerHTML = '<div class="empty">Noch keine Favoriten. Tippe auf 🤍 bei einer Botschaft, die du behalten willst.</div>'; return; }
    l.innerHTML = '';
    S.favorites.slice().reverse().forEach((t) => {
      const d = document.createElement('div'); d.className = 'fav-item';
      d.innerHTML = '<span>' + esc(fmt(t)) + '</span><button class="reason-del" aria-label="Favorit entfernen">✕</button>';
      d.querySelector('span').onclick = () => { if (!$('view-home').classList.contains('active')) showView('home'); showMessage({ text: t, own: S.ownMessages.includes(t) }, 'Dein Favorit'); };
      d.querySelector('button').onclick = () => { S.favorites = S.favorites.filter((x) => x !== t); save(); renderFavs(); updateFavBtn(); };
      l.appendChild(d);
    });
  }
  async function shareCurrent() {
    if (!current.text) return;
    if (window.LZP) return window.LZP.sendOrShare(fmt(current.text), $('msgLabel').textContent);
    const text = fmt(current.text) + '\n— ' + S.sender + ' ❤';
    if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    copyCurrent();
  }
  async function copyCurrent() {
    const text = fmt(current.text) + '\n— ' + S.sender + ' ❤';
    try { await navigator.clipboard.writeText(text); toast('Kopiert 📋'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Kopiert 📋'); } catch (e2) { toast('Kopieren nicht möglich'); }
      ta.remove();
    }
  }
  const REASON_LABEL = 'Warum ich dich liebe';
  function showReason(r) { if (!$('view-home').classList.contains('active')) showView('home'); spawnHearts(6); showMessage({ text: r, own: true }, REASON_LABEL); }
  /* Gründe, die der Schatz geschickt hat, sammeln sich darunter */
  function renderReasonsFrom() {
    const box = $('reasonFrom'); if (!box) return;
    const got = (S.inbox || []).filter((m) => m.t === 'msg' && m.label === REASON_LABEL); const seen = {};
    const list = got.filter((m) => !seen[m.text] && (seen[m.text] = 1)).reverse();
    if (!list.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="eyebrow" style="margin:18px 0 10px">Von ' + esc(S.receiver) + ' für dich</div>' + list.map((m) => '<div class="reason-item"><div class="reason-dot"></div><div class="reason-text">' + esc(m.text) + '</div></div>').join('');
  }
  function renderReasons() {
    const l = $('reasonList'); l.innerHTML = ''; renderReasonsFrom();
    const joined = !!(window.LZP && window.LZP.joined && window.LZP.joined());
    if (!S.reasons.length) { l.innerHTML = '<div class="empty">Noch keine Gründe. Füge den ersten hinzu.</div>'; return; }
    S.reasons.forEach((r, i) => {
      const d = document.createElement('div'); d.className = 'reason-item'; d.style.animationDelay = (i * .06) + 's';
      d.innerHTML = '<div class="reason-dot"></div><button type="button" class="reason-text" data-show>' + esc(fmt(r)) + '</button><button class="icon-btn" data-send aria-label="' + (joined ? 'An ' + esc(S.receiver) + ' schicken' : 'Teilen') + '">' + (joined ? '💌' : '↗') + '</button><button class="reason-del" aria-label="Grund löschen">✕</button>';
      d.querySelector('[data-show]').onclick = () => showReason(r);
      d.querySelector('[data-send]').onclick = () => { if (window.LZP) window.LZP.sendOrShare(fmt(r), REASON_LABEL); else shareText('🌹 ' + fmt(r)); };
      d.querySelector('.reason-del').onclick = () => confirmSheet('Grund löschen?', '„' + fmt(r) + '“', 'Löschen', () => { S.reasons.splice(i, 1); save(); renderReasons(); }, true);
      l.appendChild(d);
    });
  }
  function writeOwn(afterSave) {
    promptSheet('Eigene Botschaft', [{ key: 't', label: 'Dein Text (Platzhalter {r} = ' + S.receiver + ')', multiline: true, max: 280, placeholder: 'z. B. Weißt du noch, unser erster Abend am See …' }], 'Speichern', (v) => {
      if (!v.t) { toast('Bitte Text eingeben'); return false; }
      S.ownMessages.push(v.t); save(); refillQueue(); toast('Gespeichert – erscheint jetzt in der Rotation ❤');
      if (afterSave) afterSave(v.t);
    });
  }

  $('heartWrap').addEventListener('click', () => { spawnHearts(9); haptic(8); nextMessage(); });
  $('heartWrap').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spawnHearts(9); nextMessage(); } });
  $('btnNext').onclick = () => { spawnHearts(5); nextMessage(); };
  $('btnKiss').onclick = () => { spawnHearts(6); showMessage({ text: pick(D.kisses), own: false }, 'Ein Kuss'); };
  $('btnHug').onclick = () => { spawnHearts(5); showMessage({ text: pick(D.hugs), own: false }, 'Eine Umarmung'); };
  $('btnMorning').onclick = () => { spawnHearts(5); showMessage({ text: pick(D.goodmorning), own: false }, 'Guten Morgen'); };
  $('btnNight').onclick = () => { spawnHearts(5); showMessage({ text: pick(D.goodnight), own: false }, 'Gute Nacht'); };
  $('btnWrite').onclick = () => writeOwn((t) => { if (!$('view-home').classList.contains('active')) showView('home'); showMessage({ text: t, own: true }, 'Persönlich für dich'); });
  $('btnReasons').onclick = () => { const p = $('reasonPanel'); const open = p.classList.toggle('hidden'); if (!open) { renderReasons(); if (window.LZP) window.LZP.mountTips($('reasonTips'), 'reasons', 'Gründe schenken'); p.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } };
  $('btnPlayTile').onclick = () => { showView('play'); showSub('play', 'spiele'); if (window.LZG) window.LZG.renderHub(); window.scrollTo(0, 0); };
  $('btnCommonTile').onclick = () => { showView('play'); showSub('play', 'gemeinsam'); window.scrollTo(0, 0); };
  $('btnIntimTile').onclick = () => { showView('play'); showSub('play', 'intim'); window.scrollTo(0, 0); };
  $('btnDrawReason').onclick = () => { if (!S.reasons.length) { toast('Füge erst einen Grund hinzu'); return; } showReason(pick(S.reasons)); };
  $('btnAddReason').onclick = () => promptSheet('Neuer Grund', [{ key: 'r', label: 'Warum ich dich liebe …', placeholder: 'z. B. Wie du morgens singst', max: 120 }], 'Hinzufügen', (v) => {
    if (!v.r) return false; S.reasons.push(v.r); save(); renderReasons();
  });
  $('btnFav').onclick = toggleFav;
  $('btnShare').onclick = shareCurrent;
  $('btnCopy').onclick = copyCurrent;

  /* ---------- Gänseblümchen-Orakel ---------- */
  let TOTAL = 11, petalsLeft = TOTAL, daisyReady = false, busy = false;
  function petalPath(cx, cy, angleDeg) {
    const rad = angleDeg * Math.PI / 180, dist = 62, base = 20, w = 13, perp = rad + Math.PI / 2;
    const tipX = cx + Math.cos(rad) * dist, tipY = cy + Math.sin(rad) * dist;
    const baseX = cx + Math.cos(rad) * base, baseY = cy + Math.sin(rad) * base;
    const ctrl = (dist - base) * .35;
    const c1x = baseX + Math.cos(perp) * w + Math.cos(rad) * ctrl, c1y = baseY + Math.sin(perp) * w + Math.sin(rad) * ctrl;
    const c2x = tipX + Math.cos(perp) * w * .35, c2y = tipY + Math.sin(perp) * w * .35;
    const c3x = tipX - Math.cos(perp) * w * .35, c3y = tipY - Math.sin(perp) * w * .35;
    const c4x = baseX - Math.cos(perp) * w + Math.cos(rad) * ctrl, c4y = baseY - Math.sin(perp) * w + Math.sin(rad) * ctrl;
    return 'M' + baseX + ',' + baseY + ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + tipX + ',' + tipY + ' C' + c3x + ',' + c3y + ' ' + c4x + ',' + c4y + ' ' + baseX + ',' + baseY + 'Z';
  }
  function el(tag, attrs) { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function buildDaisy(count) {
    const svg = $('daisySvg'); svg.innerHTML = '';
    const cx = 110, cy = 105;
    const defs = el('defs', {});
    const cg = el('radialGradient', { id: 'cg', cx: '38%', cy: '35%', r: '65%' });
    cg.appendChild(el('stop', { offset: '0%', 'stop-color': '#fff9c4' })); cg.appendChild(el('stop', { offset: '100%', 'stop-color': '#f9a825' }));
    defs.appendChild(cg); svg.appendChild(defs);
    svg.appendChild(el('path', { d: 'M' + cx + ',' + (cy + 18) + ' C' + (cx + 7) + ',' + (cy + 48) + ' ' + (cx - 5) + ',' + (cy + 75) + ' ' + (cx + 2) + ',' + (cy + 105), fill: 'none', stroke: '#43a047', 'stroke-width': '3.5', 'stroke-linecap': 'round' }));
    svg.appendChild(el('path', { d: 'M' + (cx + 2) + ',' + (cy + 68) + ' C' + (cx + 24) + ',' + (cy + 52) + ' ' + (cx + 40) + ',' + (cy + 66) + ' ' + (cx + 18) + ',' + (cy + 80) + 'Z', fill: '#66bb6a' }));
    for (let i = 0; i < count; i++) {
      const angle = (360 / TOTAL) * i - 90;
      const p = el('path', { d: petalPath(cx, cy, angle), fill: 'var(--petal)', stroke: 'var(--petal-stroke)', 'stroke-width': '0.7', class: 'petal', tabindex: '0', role: 'button', 'aria-label': 'Blütenblatt abzupfen' });
      const handler = (e) => { e.preventDefault(); pluckPetal(angle, p); };
      p.addEventListener('click', handler);
      p.addEventListener('touchstart', handler, { passive: false });
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') handler(e); });
      p.addEventListener('mouseenter', () => p.setAttribute('fill', 'var(--petal-hover)'));
      p.addEventListener('mouseleave', () => p.setAttribute('fill', 'var(--petal)'));
      svg.appendChild(p);
    }
    const cr = count > 0 ? 19 : 25;
    svg.appendChild(el('circle', { cx, cy, r: cr, fill: 'url(#cg)', stroke: '#ef6c00', 'stroke-width': '1' }));
    for (let d = 0; d < 12; d++) {
      const da = (360 / 12) * d * Math.PI / 180;
      svg.appendChild(el('circle', { cx: cx + Math.cos(da) * (cr - 6), cy: cy + Math.sin(da) * (cr - 6), r: '1.8', fill: 'rgba(180,100,0,0.45)' }));
    }
    if (count === 0) { const t = el('text', { x: cx, y: cy + 9, 'text-anchor': 'middle', 'font-size': '24' }); t.textContent = petalsOutcomeYes() ? '🥰' : '🙃'; svg.appendChild(t); }
  }
  function petalsOutcomeYes() { return TOTAL % 2 === 1; }
  function pluckPetal(angleDeg, pathEl) {
    if (busy || petalsLeft === 0) return;
    busy = true; haptic(10);
    const rad = angleDeg * Math.PI / 180;
    pathEl.style.transition = 'opacity .3s, transform .3s'; pathEl.style.transformOrigin = '110px 105px';
    pathEl.style.opacity = '0'; pathEl.style.transform = 'translate(' + (Math.cos(rad) * 40) + 'px,' + (Math.sin(rad) * 40) + 'px) rotate(' + (Math.random() * 40 - 20) + 'deg)';
    setTimeout(() => {
      petalsLeft--;
      const pluckNumber = TOTAL - petalsLeft; const saidLoves = pluckNumber % 2 === 1;
      buildDaisy(petalsLeft); busy = false;
      if (petalsLeft === 0) {
        S.oracle.asked++; if (saidLoves) S.oracle.yes++; save();
        setTimeout(() => {
          $('oracleStatus').style.display = 'none'; $('daisyHint').style.display = 'none';
          $('oracleEmoji').textContent = saidLoves ? '🌼💕' : '🌼🙈';
          $('oracleResultText').textContent = saidLoves ? 'Ja! ' + S.receiver + ' liebt dich!' : 'Hm … das Orakel zögert.';
          $('oracleResultSub').textContent = saidLoves ? 'Das Orakel hat gesprochen, ' + S.sender + ' ✨' : 'Diese Blume hat sich verzählt. Frag nochmal, ' + S.sender + '.';
          $('oracleResult').classList.add('visible');
          if (window.LZP) window.LZP.mountTips($('oracleTips'), 'oracle', saidLoves ? 'Zur Feier des Tages' : 'Nachhelfen');
          if (saidLoves) spawnHearts(14, $('daisyWrap'));
          renderOracleStats();
        }, 350);
      } else updatePhrase(saidLoves, petalsLeft);
    }, 320);
  }
  function updatePhrase(loves, remaining) {
    const ph = $('oraclePhrase'); ph.style.opacity = 0;
    setTimeout(() => {
      ph.textContent = loves ? '❤ ' + oracleSubj() + ' liebt mich …' : oracleSubj() + ' liebt mich nicht …';
      ph.className = 'oracle-phrase ' + (loves ? 'loves' : 'loves-not');
      $('oracleCount').textContent = 'Noch ' + remaining + ' Blütenblatt' + (remaining === 1 ? '' : 'blätter');
      ph.style.opacity = 1;
    }, 160);
  }
  /* Wer wird befragt? Der Schatz – in der Anrede, die er oder sie selbst gewählt hat. */
  function partnerPronId() { return (window.LZP && window.LZP.partnerPron && window.LZP.partnerPron()) || S.rpron || ''; }
  function oracleSubj() { return S.receiver; }
  function pronChips(box, sel, onPick) {
    if (!box) return;
    box.innerHTML = (D.prons || []).map((p) => '<button type="button" data-p="' + p.id + '"' + (p.id === sel ? ' class="on"' : '') + (onPick ? '' : ' disabled') + '>' + esc(p.label) + '</button>').join('');
    if (onPick) box.querySelectorAll('button').forEach((b) => b.onclick = () => { onPick(b.dataset.p); pronChips(box, b.dataset.p, onPick); });
  }
  function renderOracleStats() {
    const o = S.oracle; $('oracleStats').textContent = o.asked ? o.asked + '× gefragt · ' + o.yes + '× Ja' : '';
  }
  function initDaisy() {
    daisyReady = true; busy = false;
    /* Zufällig, mit starker Neigung zum Ja (ungerade Blütenzahl endet auf „liebt mich“) */
    TOTAL = Math.random() < .86 ? [9, 11, 13][Math.floor(Math.random() * 3)] : [10, 12][Math.floor(Math.random() * 2)];
    petalsLeft = TOTAL;
    $('oraclePhrase').textContent = oracleSubj() + ' liebt mich …'; $('oraclePhrase').className = 'oracle-phrase';
    $('oracleCount').textContent = TOTAL + ' Blütenblätter';
    $('oracleStatus').style.display = 'flex'; $('oracleResult').classList.remove('visible'); $('daisyHint').style.display = 'block';
    buildDaisy(TOTAL); renderOracleStats();
  }
  $('btnDaisyReset').onclick = initDaisy;

  /* ---------- Unsere Zeit ---------- */
  function renderTime() {
    const has = !!S.anniversary;
    $('timeEmpty').classList.toggle('hidden', has); $('timeContent').classList.toggle('hidden', !has);
    if (!has) return;
    const start = atMidnight(parseISODate(S.anniversary)), today = atMidnight(new Date());
    const days = Math.max(0, Math.round((today - start) / 86400000));
    $('timeSub').textContent = 'Seit dem ' + fmtDate(start);
    $('daysTogether').innerHTML = days.toLocaleString('de-DE') + '<small>' + (days === 1 ? 'Tag zusammen' : 'Tage zusammen') + '</small>';
    const years = Math.floor(days / 365.25), months = Math.floor(days / 30.4375), weeks = Math.floor(days / 7);
    $('timeGrid').innerHTML =
      '<div class="time-cell"><b>' + years + '</b><span>' + (years === 1 ? 'Jahr' : 'Jahre') + '</span></div>' +
      '<div class="time-cell"><b>' + months.toLocaleString('de-DE') + '</b><span>Monate</span></div>' +
      '<div class="time-cell"><b>' + weeks.toLocaleString('de-DE') + '</b><span>Wochen</span></div>';
    // nächster Jahrestag
    let next = new Date(today.getFullYear(), start.getMonth(), start.getDate());
    if (next < today) next = new Date(today.getFullYear() + 1, start.getMonth(), start.getDate());
    const until = Math.round((next - today) / 86400000);
    const nth = next.getFullYear() - start.getFullYear();
    $('nextAnnivText').textContent = until === 0 ? '🎉 Heute ist euer ' + nth + '. Jahrestag!' : nth + '. Jahrestag';
    $('nextAnnivDays').textContent = until === 0 ? '❤' : until + (until === 1 ? ' Tag' : ' Tage');
    $('annivProgress').style.width = Math.round(((365 - until) / 365) * 100) + '%';
    $('annivDate').textContent = 'am ' + fmtDate(next);
    if (until === 0) spawnHearts(12, $('daysTogether'));
    if (window.LZP) window.LZP.mountTips($('timeTips'), until <= 30 ? 'milestone' : 'time', until <= 30 ? 'Zum Jahrestag in ' + until + ' Tagen' : 'Eure Zeit festhalten');
    // Meilensteine
    const l = $('milestoneList'); l.innerHTML = ''; let nextMarked = false;
    const items = D.milestones.map((m) => {
      const date = new Date(start);
      if (m.years) date.setFullYear(date.getFullYear() + m.years); else date.setDate(date.getDate() + m.days);
      return { label: m.label, date };
    }).sort((a, b) => a.date - b.date);
    items.forEach((m) => {
      const date = m.date;
      const done = date <= today; const isNext = !done && !nextMarked; if (isNext) nextMarked = true;
      const d = document.createElement('div'); d.className = 'milestone' + (done ? ' done' : '') + (isNext ? ' next' : '');
      const rel = done ? '' : ' · in ' + Math.round((date - today) / 86400000) + ' Tagen';
      d.innerHTML = '<span class="ms-label">' + m.label + '</span><span class="ms-date">' + fmtDate(date) + rel + '</span>';
      l.appendChild(d);
    });
  }
  function askDate() {
    openSheet('<h3>Euer Jahrestag</h3><div class="field"><label for="pf-date">Datum</label><input type="date" id="pf-date" value="' + (S.anniversary || '') + '"></div>' +
      '<p class="about" style="margin-bottom:16px">Erster Kuss, erstes Date, Hochzeit – ihr entscheidet, was zählt.</p>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Speichern</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = closeSheet;
      sh.querySelector('[data-ok]').onclick = () => {
        const v = sh.querySelector('#pf-date').value;
        if (!v) { toast('Bitte Datum wählen'); return; }
        if (parseISODate(v) > new Date()) { toast('Das Datum liegt in der Zukunft'); return; }
        S.anniversary = v; save(); closeSheet(); renderTime(); renderUs(); toast('Gespeichert ❤');
      };
    });
  }
  $('btnSetDate').onclick = askDate; $('btnChangeDate').onclick = askDate;

  /* ---------- Gutscheine ---------- */
  function renderCoupons() {
    const l = $('couponList'); l.innerHTML = '';
    const open = S.coupons.filter((c) => !c.used).length;
    $('couponSub').textContent = open ? open + ' von ' + S.coupons.length + ' noch offen' : 'Alle eingelöst – Zeit für neue!';
    if (!S.coupons.length) l.innerHTML = '<div class="empty">Keine Gutscheine. Lege eigene an.</div>';
    S.coupons.forEach((c) => {
      const b = document.createElement('button'); b.className = 'coupon' + (c.used ? ' used' : ''); b.type = 'button';
      b.innerHTML = '<span class="c-ico">' + esc(c.icon) + '</span><span class="c-body"><span class="c-title">' + esc(c.title) + '</span>' +
        (c.desc ? '<span class="c-desc" style="display:block">' + esc(c.desc) + '</span>' : '') +
        '<span class="c-state" style="display:block">' + (c.from ? '💌 von ' + esc(c.from) + ' · ' : '') + (c.used ? 'Eingelöst am ' + fmtDate(new Date(c.used)) : 'Einlösbar') + '</span></span>';
      b.onclick = () => couponSheet(c);
      l.appendChild(b);
    });
    if (window.LZP) window.LZP.mountTips($('couponTips'), 'coupon', 'Gutscheine einlösen leicht gemacht');
  }
  const couponTipKey = (c) => { const t = (c.title || '').toLowerCase(); return t.includes('massage') ? 'coupon_massage' : t.includes('frühstück') ? 'coupon_fruehstueck' : t.includes('film') ? 'coupon_film' : t.includes('essen') ? 'coupon_essen' : t.includes('wellness') ? 'coupon_wellness' : t.includes('spaziergang') ? 'coupon_spaziergang' : t.includes('tag') ? 'coupon_tag' : t.includes('ausschlafen') ? 'coupon_ausschlafen' : 'coupon'; };
  function couponSheet(c) {
    const used = !!c.used; const canSend = window.LZP && window.LZP.joined();
    openSheet('<h3>' + esc(c.icon) + ' ' + esc(c.title) + '</h3><p class="about" style="margin-bottom:14px">' + esc(c.desc || '') + (c.from ? '<br><br>💌 Geschenkt von ' + esc(c.from) + '.' : '') + (used ? '<br><br>Eingelöst am ' + fmtDate(new Date(c.used)) + '.' : '') + '</p>' +
      (window.LZP ? window.LZP.tipsHtml(window.LZP.tips(couponTipKey(c), 2), 'Dazu passt') : '') +
      '<div class="row wrap" style="margin-top:14px">' +
      (used ? '<button class="pill-btn" data-reopen>Wieder aktivieren</button>' : '<button class="pill-btn primary" data-use>Jetzt einlösen 🎉</button>') +
      (canSend && !c.from ? '<button class="pill-btn" data-send>💌 An ' + esc(window.LZP.partnerName()) + ' schicken</button>' : '') +
      '<button class="pill-btn ghost danger" data-del>Löschen</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = closeSheet;
      if (window.LZP) window.LZP.bindTips(sh);
      const sd = sh.querySelector('[data-send]'); if (sd) sd.onclick = () => { closeSheet(); window.LZP.sendCoupon(c); };
      const u = sh.querySelector('[data-use]'); if (u) u.onclick = () => { c.used = new Date().toISOString(); save(); closeSheet(); renderCoupons(); spawnHearts(12, $('couponList')); toast('Eingelöst! Viel Freude 🎉'); haptic(20); };
      const r = sh.querySelector('[data-reopen]'); if (r) r.onclick = () => { c.used = null; save(); closeSheet(); renderCoupons(); };
      sh.querySelector('[data-del]').onclick = () => { closeSheet(); confirmSheet('Gutschein löschen?', c.title, 'Löschen', () => { S.coupons = S.coupons.filter((x) => x.id !== c.id); save(); renderCoupons(); }, true); };
    });
  }
  $('btnAddCoupon').onclick = () => promptSheet('Eigener Gutschein', [
    { key: 'icon', label: 'Symbol (Emoji)', placeholder: '🎁', max: 4 },
    { key: 'title', label: 'Titel', placeholder: 'z. B. Ein Tag am Meer', max: 50 },
    { key: 'desc', label: 'Beschreibung (optional)', placeholder: 'Was genau ist drin?', max: 120 }
  ], 'Anlegen', (v) => {
    if (!v.title) { toast('Bitte Titel eingeben'); return false; }
    S.coupons.push({ id: 'u' + Date.now(), icon: v.icon || '🎁', title: v.title, desc: v.desc, used: null }); save(); renderCoupons();
  });
  $('btnResetCoupons').onclick = () => confirmSheet('Alle Gutscheine zurücksetzen?', 'Eingelöste werden wieder einlösbar. Eigene Gutscheine bleiben erhalten.', 'Zurücksetzen', () => { S.coupons.forEach((c) => c.used = null); save(); renderCoupons(); });

  /* ---------- Einstellungen ---------- */
  function emojiGrid(container, selected, onPick) {
    container.innerHTML = '';
    D.emojis.forEach((e) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = e; b.className = e === selected ? 'sel' : ''; b.setAttribute('aria-label', 'Symbol ' + e);
      b.onclick = () => { onPick(e); emojiGrid(container, e, onPick); };
      container.appendChild(b);
    });
  }
  function themeGrid(container, selected, onPick) {
    container.innerHTML = '';
    D.themes.forEach((t) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'theme-sw' + (t.id === selected ? ' sel' : ''); b.dataset.t = t.id;
      b.innerHTML = '<span>' + t.name + '</span>'; b.setAttribute('aria-label', 'Farbwelt ' + t.name);
      b.onclick = () => { onPick(t.id); themeGrid(container, t.id, onPick); };
      container.appendChild(b);
    });
  }
  function setToggle(id, val) { $(id).setAttribute('aria-checked', val ? 'true' : 'false'); }
  function renderSettings() {
    const jn = !!(window.LZP && window.LZP.joined && window.LZP.joined());
    $('setSender').value = S.sender; $('setReceiver').value = S.receiver; $('setReceiver').disabled = jn;
    $('lblReceiver').textContent = jn ? 'Dein Schatz · aus der verbundenen App' : 'Dein Schatz';
    pronChips($('setPron'), S.pron, (id) => { S.pron = id; save(); if (window.LZP && window.LZP.announce) window.LZP.announce(); });
    /* Selbst setzen nur, solange der Schatz in der eigenen App nichts angegeben hat */
    const theirs = jn && window.LZP.partnerPron && window.LZP.partnerPron();
    pronChips($('setRPron'), partnerPronId(), theirs ? null : (id) => { S.rpron = id; save(); daisyReady = false; });
    emojiGrid($('emojiSender'), S.emojiS, (e) => { S.emojiS = e; save(); renderHeader(); });
    emojiGrid($('emojiReceiver'), S.emojiR, (e) => { S.emojiR = e; save(); renderHeader(); });
    themeGrid($('themeGrid'), S.theme, (t) => { S.theme = t; save(); applyTheme(); });
    setToggle('togMotion', S.motion); setToggle('togHaptic', S.haptic);
    $('aboutVersion').textContent = D.version;
    renderOwnMsgs();
  }
  /* Eigene Botschaften – seit 3.43.0 unter „Schicken“ */
  function renderOwnMsgs() {
    const l = $('ownMsgList'); if (!l) return; l.innerHTML = '';
    if (!S.ownMessages.length) l.innerHTML = '<div class="empty">Noch keine eigenen Botschaften.</div>';
    S.ownMessages.forEach((t, i) => {
      const d = document.createElement('div'); d.className = 'fav-item';
      d.innerHTML = '<span>' + esc(fmt(t)) + '</span><button class="reason-del" aria-label="Botschaft löschen">✕</button>';
      d.querySelector('button').onclick = () => confirmSheet('Botschaft löschen?', fmt(t), 'Löschen', () => { S.ownMessages.splice(i, 1); S.favorites = S.favorites.filter((x) => x !== t); save(); refillQueue(); renderOwnMsgs(); renderFavs(); }, true);
      l.appendChild(d);
    });
  }

  /* ---------- Wir (3.43.0): Tage zusammen oben, darunter Kacheln ---------- */
  function renderUs() {
    const h = $('usHero'); if (!h) return;
    const names = '<span class="us-names">' + esc(S.emojiS + ' ' + S.sender) + ' <i aria-hidden="true">❤</i> ' + esc(S.emojiR + ' ' + S.receiver) + '</span>';
    if (S.anniversary) {
      const days = Math.max(0, Math.round((atMidnight(new Date()) - atMidnight(parseISODate(S.anniversary))) / 86400000));
      h.innerHTML = '<button type="button" class="us-hero" data-go="time.days">' + names + '<span class="us-n">' + days.toLocaleString('de-DE') + '</span><span class="us-l">' + (days === 1 ? 'Tag zusammen' : 'Tage zusammen') + '</span></button>';
    } else h.innerHTML = '<button type="button" class="us-hero" data-go="setdate">' + names + '<span class="us-l">📅 Datum eintragen</span></button>';
  }
  /* Ein Weg für alle Kacheln: data-go = Ziel, data-proxy = verborgener Knopf, der geklickt wird */
  const GO = {
    'time.days': () => { showView('time'); showSub('time', 'days'); },
    'time.occasions': () => { showView('time'); showSub('time', 'occasions'); },
    'wishes.wishlist': () => { showView('wishes'); showSub('wishes', 'wishlist'); },
    'wishes.coupons': () => { showView('wishes'); showSub('wishes', 'coupons'); },
    'wishes.thanks': () => { showView('wishes'); showSub('wishes', 'thanks'); },
    'wishes.fav': () => { showView('wishes'); showSub('wishes', 'fav'); },
    dates: () => { if (window.LZD) window.LZD.sheet('anniversary'); },
    gift: () => { if (window.LZP) window.LZP.searchSheet(); },
    book: () => { if (window.LZX && window.LZX.book) window.LZX.book(); },
    news: () => { if (window.LZU && window.LZU.newsSheet) window.LZU.newsSheet(); },
    hilfe: () => { if (window.LZWI && window.LZWI.hilfe) window.LZWI.hilfe(); },
    setdate: () => { $('btnSetDate').click(); },
    send: () => showView('send'),
    post: () => showView('post'),
    share: () => { showView('home'); setTimeout(() => { if (!current.text) return; const sig = current.incoming ? S.receiver : S.sender; if (window.LZX && window.LZX.shareCard) window.LZX.shareCard({ text: fmt(current.text), label: $('msgLabel').textContent || '', sig }); else shareCurrent(); }, 120); }
  };
  /* Stellvertreter-Kacheln klicken den geparkten Knopf in #sendStash. Arten, deren Ergebnis in der
     Botschaftskarte erscheint, holen dafür erst „Heute“ ins Bild. */
  const TO_HOME = { btnNext: 1, btnKiss: 1, btnHug: 1, btnMorning: 1, btnNight: 1, btnGen: 1 };
  function msgIntoView() { const c = document.querySelector('#view-home .msg-card'); if (c) c.scrollIntoView({ behavior: S.motion === false ? 'auto' : 'smooth', block: 'center' }); }
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-proxy]'); if (!t || !t.closest('#app')) return;
    const b = $(t.dataset.proxy); if (!b) return;
    const area = t.closest('[data-area]'); if (window.LZS) window.LZS.count('open:' + (area ? area.dataset.area : 'home') + ':' + b.id);
    const home = !!TO_HOME[b.id];
    if (home && !$('view-home').classList.contains('active')) showView('home');
    b.click();
    if (home) setTimeout(msgIntoView, 60);
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-go]'); if (!t || !t.closest('#app') || !GO[t.dataset.go]) return;
    const area = (t.closest('[data-area]') || t.closest('.view') || {}).dataset; const where = area && area.area ? area.area : 'home';
    if (window.LZS) window.LZS.count('open:' + where + ':' + t.dataset.go);
    GO[t.dataset.go]();
  });
  function nameInput(id, key) {
    $(id).addEventListener('change', () => { const v = $(id).value.trim(); if (v) { S[key] = v; save(); renderHeader(); refillQueue(); daisyReady = false; if (current.text) $('msgText').textContent = fmt(current.text); if (key === 'sender' && window.LZP && window.LZP.announce) window.LZP.announce(); } else $(id).value = S[key]; });
  }
  nameInput('setSender', 'sender'); nameInput('setReceiver', 'receiver');
  $('togMotion').onclick = () => { S.motion = !S.motion; save(); setToggle('togMotion', S.motion); applyTheme(); };
  $('togHaptic').onclick = () => { S.haptic = !S.haptic; save(); setToggle('togHaptic', S.haptic); haptic([40, 60, 40]); };
  $('btnWrite2').onclick = () => writeOwn(() => renderOwnMsgs());
  $('btnExport').onclick = () => {
    const copy = Object.assign({}, S); delete copy.partner; delete copy.deviceId; delete copy.pendingPair; // Verbindung ist gerätegebunden
    const blob = new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'schmetterlingsfutter-sicherung-' + todayKey() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Sicherung erstellt');
  };
  $('btnImport').onclick = () => $('fileImport').click();
  $('fileImport').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        if (!data || typeof data !== 'object' || !data.sender || !Array.isArray(data.coupons)) throw new Error('format');
        delete data.partner; delete data.deviceId; delete data.pendingPair;
        confirmSheet('Sicherung einspielen?', 'Die aktuellen Daten auf diesem Gerät werden ersetzt. Eine bestehende Partner-Verbindung bleibt.', 'Einspielen', () => { const keep = { partner: S.partner, deviceId: S.deviceId }; S = Object.assign(defaults(), data, keep); S.onboarded = true; save(); location.reload(); });
      } catch (err) { toast('Datei nicht lesbar – ist es eine Schmetterlingsfutter-Sicherung?'); }
    };
    rd.readAsText(f); e.target.value = '';
  });
  $('btnReset').onclick = () => confirmSheet('Wirklich alles löschen?', 'Namen, Favoriten, eigene Botschaften, Gutscheine, Jahrestag und eine Partner-Verbindung werden entfernt. Das lässt sich nicht rückgängig machen.', 'Alles löschen', async () => { if (window.LZP) { try { await window.LZP.leavePair(true); } catch (e) {} } try { localStorage.removeItem(STORE_KEY); } catch (e) {} location.reload(); }, true);
  $('btnOnboardingAgain').onclick = (e) => { e.preventDefault(); startOnboarding(); };

  /* ---------- Onboarding ---------- */
  let obStep = 0; const ob = { sender: S.sender, receiver: S.receiver, emojiS: S.emojiS, emojiR: S.emojiR, theme: S.theme, anniversary: S.anniversary };
  function obShow(n) {
    obStep = Math.max(0, Math.min(4, n));
    document.querySelectorAll('.ob-step').forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === obStep));
    document.querySelectorAll('#obDots i').forEach((d, i) => d.classList.toggle('on', i === obStep));
    const inp = document.querySelector('.ob-step.active input'); if (inp && obStep < 2) setTimeout(() => inp.focus(), 100);
  }
  function startOnboarding() {
    Object.assign(ob, { sender: S.sender, receiver: S.receiver, pron: S.pron || '', emojiS: S.emojiS, emojiR: S.emojiR, theme: S.theme, anniversary: S.anniversary });
    $('obSender').value = S.onboarded ? S.sender : ''; $('obReceiver').value = S.onboarded ? S.receiver : ''; $('obDate').value = S.anniversary || '';
    emojiGrid($('obEmojiSender'), ob.emojiS, (e) => ob.emojiS = e);
    pronChips($('obPron'), ob.pron, (id) => ob.pron = id);
    emojiGrid($('obEmojiReceiver'), ob.emojiR, (e) => ob.emojiR = e);
    themeGrid($('obThemeGrid'), ob.theme, (t) => { ob.theme = t; document.documentElement.setAttribute('data-theme', t); });
    $('onboarding').classList.remove('hidden'); obShow(0);
  }
  document.querySelectorAll('#onboarding [data-next]').forEach((b) => b.onclick = () => {
    if (obStep === 0) { const v = $('obSender').value.trim(); if (!v) { toast('Wie soll ich dich nennen?'); return; } ob.sender = v; }
    if (obStep === 1) { const v = $('obReceiver').value.trim(); if (!v) { toast('Wie heißt dein Schatz?'); return; } ob.receiver = v; }
    if (obStep === 2) { const v = $('obDate').value; if (v && parseISODate(v) > new Date()) { toast('Das Datum liegt in der Zukunft'); return; } ob.anniversary = v || null; }
    obShow(obStep + 1);
  });
  document.querySelectorAll('#onboarding [data-prev]').forEach((b) => b.onclick = () => obShow(obStep - 1));
  document.querySelectorAll('#onboarding input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const n = document.querySelector('.ob-step.active [data-next]'); if (n) n.click(); } }));
  $('obFinish').onclick = () => {
    Object.assign(S, ob, { onboarded: true }); save();
    $('onboarding').classList.add('hidden');
    applyTheme(); renderHeader(); refillQueue(); daisyReady = false;
    showMessage(dailyMessage(), 'Heute für dich'); renderFavs();
    spawnHearts(14); toast('Willkommen bei Schmetterlingsfutter ❤');
  };

  /* ---------- Geschenk-Umschlag ---------- */
  /* Briefumschlag: zeigt eine Überraschung aus der App des Schatzes (siehe naehe.js, „Überraschung senden“) */
  let envOpts = {};
  function showEnvelope(o) {
    envOpts = o || {};
    $('giftName').textContent = envOpts.name || S.sender; $('envLetter').textContent = envOpts.letter || '';
    $('envelope').classList.remove('open'); $('btnGiftEnter').classList.add('hidden'); $('btnGiftEnter').textContent = envOpts.button || 'Auspacken ❤';
    $('envHint').textContent = 'Tippe auf den Umschlag';
    $('giftScreen').classList.remove('hidden'); showView('home');
  }
  function openEnvelope() {
    const env = $('envelope'); if (env.classList.contains('open')) return;
    env.classList.add('open'); haptic(20); spawnHearts(16, env);
    $('envHint').textContent = envOpts.hint || 'Jemand hat an dich gedacht ❤';
    setTimeout(() => $('btnGiftEnter').classList.remove('hidden'), 1100);
  }
  $('envelope').addEventListener('click', openEnvelope);
  $('envelope').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); } });
  $('btnGiftEnter').onclick = () => {
    $('giftScreen').classList.add('hidden'); spawnHearts(14);
    const f = envOpts.onEnter; envOpts = {}; if (f) f();
  };

  /* ---------- API für features.js ---------- */
  async function shareText(text) {
    if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Kopiert 📋'); } catch (e) { toast('Teilen nicht möglich'); }
  }
  window.LZ = {
    get S() { return S; }, save, fmt, esc, pick, toast, openSheet, closeSheet, confirmSheet, promptSheet,
    spawnHearts, showMessage, showView, showSub, haptic, fmtDate, parseISODate, atMidnight, todayKey, shareText, renderHeader,
    setToggle, showEnvelope, renderTime, ago
  };

  /* Melden: schickt den Wortlaut der Vorlage (ohne eure Namen) an die Redaktion */
  $('btnReport').onclick = () => { if (window.LZP && window.LZP.reportSheet) window.LZP.reportSheet(current.text); };

  /* ---------- Start ---------- */
  document.documentElement.setAttribute('data-view', 'home');
  applyTheme(); renderHeader(); refillQueue(); renderFavs();
  $('tapCounter').textContent = S.taps >= 10 ? S.taps + ' × Liebe abgeholt' : '';
  if (!S.onboarded) startOnboarding();
  else if (S.giftSealed) { S.giftSealed = false; save(); } // altes „Versiegeln“ gibt es nicht mehr
  showMessage(dailyMessage(), 'Heute für dich');

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
