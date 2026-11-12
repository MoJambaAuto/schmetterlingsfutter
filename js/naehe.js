/* ========== Schmetterlingsfutter – Klartext, Jingle-Box, Kritzel-Gruß, Nah dran (Version 3.1) ==========
   Klartext: spielerische Wege, Unausgesprochenes anzusprechen (Wetterbericht, Themen-Abgleich, Sag's sanft,
             Zwiegespräch-Timer, Weiße Fahne, Gesprächskarten).
   Jingle-Box: kleine musikalische Liebeserklärungen (3–5 s), nach Anlass sortiert, direkt in die Partner-App.
   Kritzel-Gruß: kleines Bild malen oder Foto bekritzeln und verschicken.
   Nah dran: QR zum Verbinden, Liebes-QR, NFC-Sticker (nur Chrome auf Android), Teilen in der Nähe.
   Nutzt window.LZ (app.js) und window.LZP (partner.js). */
(function () {
  'use strict';
  const L = window.LZ, D = window.LUZIFER_DATA, P = window.LZP, K = D.klartext;
  const $ = (id) => document.getElementById(id);
  const S = () => L.S;
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const st = () => { const s = S(); if (!s.checkins) s.checkins = {}; if (!s.jingleCat) s.jingleCat = 'einfachso'; if (!s.inbox) s.inbox = []; return s; };
  const me = () => S().sender, you = () => P.partnerName();
  const esc = L.esc;

  /* =====================================================================
     1. Klang: kleine Jingles aus Noten erzeugen (Web Audio, kein Download)
     ===================================================================== */
  let ac = null;
  function audio() {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return 0;
    const semi = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (semi - 9 + (Number(m[3]) - 4) * 12) / 12);
  }
  function voice(c, f, t, d, timbre, scale) {
    if (!f) return;
    const g = c.createGain(); let out = g;
    const o = c.createOscillator(); o.frequency.value = f;
    let peak = 0.3 * scale, attack = 0.012, tail = 1.0, hold = false;
    if (timbre === 'soft') { o.type = 'sine'; attack = 0.06; tail = 0.6; hold = true; peak = 0.32 * scale; }
    else if (timbre === 'pluck') { o.type = 'triangle'; tail = 0.3; peak = 0.36 * scale; }
    else if (timbre === 'brass') { o.type = 'sawtooth'; attack = 0.03; tail = 0.22; hold = true; peak = 0.13 * scale; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900; g.connect(lp); out = lp; }
    else { o.type = 'sine'; }
    out.connect(c.destination);
    const end = t + d + tail;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack);
    if (hold) g.gain.setValueAtTime(peak, t + Math.max(attack + 0.01, d * 0.85));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(g); o.start(t); o.stop(end + 0.05);
    if (timbre === 'bell' || !timbre) { // Oberton für Glöckchen-Klang
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; const g2 = c.createGain();
      g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(peak * 0.35, t + attack); g2.gain.exponentialRampToValueAtTime(0.0001, t + d + tail * 0.5);
      o2.connect(g2); g2.connect(c.destination); o2.start(t); o2.stop(end);
    }
  }
  function parseNotes(j) {
    const beat = 60 / j.bpm; let t = 0; const out = [];
    j.notes.split(',').forEach((tok) => { const p = tok.trim().split(/\s+/); const d = (parseFloat(p[1]) || 1) * beat; if (p[0] !== '-') out.push({ n: p[0].split('+'), t, d }); t += d; });
    return { events: out, total: t };
  }
  /* Stimmen: jede Aufnahme hat j.voices = { w, m, x }; x = Duett, gilt für beide. Fehlt die gewählte Stimme, läuft die vorhandene. */
  const voiceOfPron = (p) => p === 'er' ? 'm' : p === 'sie' ? 'w' : '';
  const voicePref = () => st().jingleVoice || voiceOfPron(S().pron) || 'w';
  const theirVoice = () => voiceOfPron(P.partnerPron ? P.partnerPron() : '') || voicePref();
  const jingleFile = (j, v) => !j.voices ? j.file : (j.voices[v || voicePref()] || j.voices.x || j.voices.w || j.voices.m);
  const jingleSeconds = (j, v) => (j.voices && j.voices[v || voicePref()] && j.secs && j.secs[v || voicePref()]) || j.sec || Math.round((parseNotes(j).total + 0.6) * 10) / 10;
  let fileAudio = null;
  function playJingle(j, onEnd, v) {
    /* 3.30.0: keine selbst erzeugten Melodien mehr – fehlt die Aufnahme (z. B. alter Jingle vom Partner), läuft eine gesungene aus demselben Anlass */
    if (!j.file && j.cat) { const alt = D.jingles.filter((x) => x.sung && x.cat === j.cat); if (alt.length) return playJingle(alt[Math.floor(Math.random() * alt.length)], onEnd, v); }
    if (j.file) { // fertige Aufnahme
      try { if (fileAudio) fileAudio.pause(); fileAudio = new Audio(jingleFile(j, v)); fileAudio.onended = () => onEnd && onEnd(); fileAudio.play().catch(() => onEnd && onEnd()); } catch (e) { if (onEnd) onEnd(); }
      return;
    }
    const c = audio(); if (!c) { L.toast('Dieser Browser kann keinen Ton erzeugen'); if (onEnd) onEnd(); return; }
    const p = parseNotes(j), t0 = c.currentTime + 0.06;
    p.events.forEach((e) => e.n.forEach((n) => voice(c, freq(n), t0 + e.t, e.d, j.timbre || 'bell', 1 / Math.sqrt(e.n.length))));
    if (onEnd) setTimeout(onEnd, (p.total + 0.7) * 1000);
  }
  const jingleById = (id) => D.jingles.find((j) => j.id === id);
  /* Gong: echte Klangschale (Suno-Sound, audio/gong.wav); fehlt die Datei, bleibt es still (nur Vibration) */
  const gong = () => { try { const a = new Audio('audio/gong.wav'); a.volume = 0.8; a.play().catch(() => {}); } catch (e) {} };

  /* ---------- Jingle-Box ---------- */
  const TIPKEY = { morgen: 'morning', nacht: 'night', danke: 'thanks', streit: 'peace', vergessen_jahrestag: 'vergessen', vergessen_geburtstag: 'vergessen', vergessen_feiertag: 'vergessen', jahrestag: 'milestone', lust: 'intim_flirt', einfachso: 'message', vermissen: 'message' };
  function renderJingles() {
    const box = $('jingleBox'); if (!box) return; const s = st();
    const cats = D.jingleCats.filter((c) => !c.adult || s.intim);
    if (!cats.find((c) => c.id === s.jingleCat)) s.jingleCat = cats[0].id;
    // einfache Melodien nur noch dort, wo es keine Aufnahme gibt
    const shown = (cat) => { const all = D.jingles.filter((j) => j.cat === cat); return all.some((j) => j.sung) ? all.filter((j) => j.sung) : all; };
    const list = shown(s.jingleCat); const v = voicePref();
    const both = list.some((j) => j.voices && j.voices.w && j.voices.m);
    const joined = P.joined();
    box.innerHTML = '<div class="row between"><div class="eyebrow" style="margin:0">🎶 Jingle-Box</div><span class="tag">' + cats.reduce((n, c) => n + shown(c.id).length, 0) + ' Jingles</span></div>' +
      '<p class="about" style="font-size:17px;margin:8px 0 10px">Kleine gesungene Liebeserklärungen, nur ein paar Sekunden lang. ' + (joined ? 'Ein Tipp und sie klingen in der App von ' + esc(you()) + '.' : 'Mit verbundenen Apps klingen sie direkt beim anderen.') + '</p>' +
      '<div class="chips' + (window.__sfJingleOpen ? ' open' : '') + '" id="jingleChips">' + cats.map((c) => '<button type="button" class="' + (c.id === s.jingleCat ? 'on' : '') + '" data-cat="' + c.id + '">' + c.e + ' ' + esc(c.t) + '</button>').join('') + '</div><button type="button" class="pill-btn ghost small" id="jingleMore" style="margin-bottom:12px">' + (window.__sfJingleOpen ? 'Weniger Anlässe' : 'Alle Anlässe') + '</button>' +
      (both ? '<div class="seg" id="jingleVoice" role="group" aria-label="Stimme"><button type="button" data-v="w"' + (v === 'w' ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + '>Frauenstimme</button><button type="button" data-v="m"' + (v === 'm' ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"') + '>Männerstimme</button></div>' : '') +
      '<div id="jingleList">' + list.map((j) => '<div class="jingle" data-id="' + j.id + '"><button class="icon-btn" data-play aria-label="Abspielen">▶</button><div class="j-b"><div class="j-t">' + esc(j.title) + (j.sung ? ' <span class="j-sung" aria-label="gesungen">🎤</span>' : '') + ' <small>' + String(jingleSeconds(j, v)).replace('.', ',') + ' s</small></div><div class="j-x">' + esc(L.fmt(j.text)) + '</div></div><button class="icon-btn" data-send aria-label="' + (joined ? 'An ' + esc(you()) + ' schicken' : 'Teilen') + '">' + (joined ? '💌' : '↗') + '</button></div>').join('') + '</div>' +
      '<div class="tips-slot" id="jingleTips"></div>';
    box.querySelectorAll('[data-cat]').forEach((b) => b.onclick = () => { s.jingleCat = b.dataset.cat; L.save(); renderJingles(); });
    box.querySelectorAll('#jingleVoice [data-v]').forEach((b) => b.onclick = () => { s.jingleVoice = b.dataset.v; L.save(); if (fileAudio) fileAudio.pause(); renderJingles(); });
    box.querySelectorAll('.jingle').forEach((row) => {
      const j = jingleById(row.dataset.id);
      row.querySelector('[data-play]').onclick = (e) => { const b = e.currentTarget; b.textContent = '♪'; b.classList.add('on'); L.haptic(6); playJingle(j, () => { b.textContent = '▶'; b.classList.remove('on'); }); };
      row.querySelector('[data-send]').onclick = () => sendJingle(j);
    });
    P.mountTips($('jingleTips'), TIPKEY[s.jingleCat] || 'jingle', 'Passend dazu');
    const more = $('jingleMore'); if (more) more.onclick = () => { window.__sfJingleOpen = !window.__sfJingleOpen; renderJingles(); };
  }
  async function sendJingle(j) {
    const text = L.fmt(j.text);
    if (P.joined()) {
      try { await P.send({ t: 'jingle', jid: j.id, text, v: voicePref() }); playJingle(j); L.toast('🎶 Jingle unterwegs zu ' + you()); L.spawnHearts(8); }
      catch (e) { L.toast('Senden fehlgeschlagen – ' + (P.online() ? 'später nochmal' : 'offline')); }
    } else { playJingle(j); L.shareText('🎶 ' + text + '\n— ' + me() + ' ❤'); }
  }
  P.on('jingle', (obj, created) => {
    const j = jingleById(String(obj.jid || '')); const s = st();
    s.inbox.push({ id: uid('m'), t: 'jingle', jid: j ? j.id : '', text: String(obj.text || (j ? j.title : 'Jingle')).slice(0, 200), v: obj.v === 'm' || obj.v === 'w' ? obj.v : '', at: created || Date.now(), read: false });
    L.toast('🎶 Neuer Jingle von ' + you()); L.haptic(20); return true;
  });
  P.inboxType('jingle', { icon: '🎶', meta: 'Jingle – antippen zum Abspielen', open: (m) => { const j = jingleById(m.jid); if (j) playJingle(j, null, m.v || theirVoice()); L.showView('home'); L.showMessage({ text: m.text, own: true, incoming: true, re: m.re, mid: m.id }, '🎶 Von ' + you() + ' für dich'); L.spawnHearts(10); } });

  /* =====================================================================
     2. Kritzel-Gruß: kleines Bild malen / Foto bekritzeln und verschicken
     ===================================================================== */
  const PIC_RE = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;
  const PIC_MAX = 46000; // Zeichen der Data-URL; passt verschlüsselt in eine Relay-Nachricht
  function encodeCanvas(cv) {
    const tries = [['image/webp', 0.75], ['image/jpeg', 0.7], ['image/jpeg', 0.5], ['image/jpeg', 0.35]];
    for (const [type, q] of tries) { const u = cv.toDataURL(type, q); if (u.length <= PIC_MAX && PIC_RE.test(u)) return u; }
    const small = document.createElement('canvas'); small.width = small.height = 200; small.getContext('2d').drawImage(cv, 0, 0, 200, 200);
    const u = small.toDataURL('image/jpeg', 0.5); return u.length <= PIC_MAX ? u : null;
  }
  async function shareImage(dataUrl, text) {
    try {
      const blob = await (await fetch(dataUrl)).blob(); const ext = blob.type.includes('webp') ? 'webp' : blob.type.includes('png') ? 'png' : 'jpg';
      const file = new File([blob], 'schmetterlingsgruss.' + ext, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: text || '' }); return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); L.toast('Bild gespeichert – jetzt verschicken');
    } catch (e) { if (!e || e.name !== 'AbortError') L.toast('Teilen nicht möglich'); }
  }
  function kritzelSheet() {
    const joined = P.joined();
    const colors = ['#ffffff', '#ff85a1', '#ffd166', '#7ee8dc', '#b39dff'];
    const stamps = ['❤️', '😘', '🦋', '💋', '⭐', '🌹'];
    L.openSheet('<h3>🎨 Kritzel-Gruß</h3>' +
      '<canvas class="kritzel" id="kzCanvas" width="320" height="320" aria-label="Malfläche"></canvas>' +
      '<div class="kz-tools">' + colors.map((c, i) => '<button type="button" class="kz-c' + (i === 1 ? ' on' : '') + '" data-c="' + c + '" style="background:' + c + '" aria-label="Farbe"></button>').join('') +
      '<span class="kz-sep"></span>' + stamps.map((e) => '<button type="button" class="kz-s" data-s="' + e + '" aria-label="Stempel ' + e + '">' + e + '</button>').join('') + '</div>' +
      '<div class="row wrap" style="margin:10px 0"><button class="pill-btn small ghost" data-clear>🧽 Leeren</button><button class="pill-btn small ghost" data-photo>📷 Foto dahinter</button><button class="pill-btn small ghost" data-cam>🦋 Kamera mit Effekten</button><input type="file" accept="image/*" class="hidden" id="kzFile"></div>' +
      '<div class="field"><label for="kzText">Ein Satz dazu (optional)</label><input id="kzText" maxlength="80" placeholder="z. B. Denk an dich!" autocomplete="off"></div>' +
      '<div class="row wrap">' + (joined ? '<button class="pill-btn primary" data-send>💌 An ' + esc(you()) + '</button><button class="pill-btn" data-gift>🎁 Als Überraschung</button>' : '') + '<button class="pill-btn' + (joined ? '' : ' primary') + '" data-share>↗ Teilen</button><button class="pill-btn ghost" data-cancel>Abbrechen</button></div>' +
      (joined ? '' : '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:10px">Mit verbundenen Apps landet das Bild direkt auf der Startseite deines Schatzes. „Teilen“ öffnet das Teilen-Menü deines Handys – dort gibt es auch Quick Share und AirDrop für Geräte in der Nähe.</p>') +
      P.tipsHtml(P.tips('kritzel', 2), 'Zum Aufhängen'), (sh) => {
      const cv = sh.querySelector('#kzCanvas'), ctx = cv.getContext('2d');
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg1').trim() || '#2d1133';
      const clear = () => { ctx.fillStyle = bg; ctx.fillRect(0, 0, 320, 320); };
      clear();
      let color = colors[1], stamp = null, drawing = false, last = null, dirty = false;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * 320 / r.width, y: (e.clientY - r.top) * 320 / r.height }; };
      cv.addEventListener('pointerdown', (e) => {
        e.preventDefault(); const p = pos(e); dirty = true;
        if (stamp) { ctx.font = '46px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(stamp, p.x, p.y); L.haptic(6); return; }
        drawing = true; last = p; try { cv.setPointerCapture(e.pointerId); } catch (err) {}
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      });
      cv.addEventListener('pointermove', (e) => {
        if (!drawing) return; e.preventDefault(); const p = pos(e);
        ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
      });
      const stop = () => { drawing = false; };
      cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop); cv.addEventListener('pointerleave', stop);
      sh.querySelectorAll('.kz-c').forEach((b) => b.onclick = () => { color = b.dataset.c; stamp = null; sh.querySelectorAll('.kz-c,.kz-s').forEach((x) => x.classList.remove('on')); b.classList.add('on'); });
      sh.querySelectorAll('.kz-s').forEach((b) => b.onclick = () => { stamp = b.dataset.s; sh.querySelectorAll('.kz-c,.kz-s').forEach((x) => x.classList.remove('on')); b.classList.add('on'); });
      sh.querySelector('[data-clear]').onclick = () => { clear(); dirty = false; };
      const file = sh.querySelector('#kzFile');
      sh.querySelector('[data-photo]').onclick = () => file.click();
      sh.querySelector('[data-cam]').onclick = () => { if (window.LZK) { L.closeSheet(); window.LZK.open(); } };
      file.addEventListener('change', () => {
        const f = file.files[0]; if (!f) return; const img = new Image(); const url = URL.createObjectURL(f);
        img.onload = () => { const sc = Math.max(320 / img.width, 320 / img.height); const w = img.width * sc, h = img.height * sc; ctx.drawImage(img, (320 - w) / 2, (320 - h) / 2, w, h); URL.revokeObjectURL(url); dirty = true; };
        img.onerror = () => { URL.revokeObjectURL(url); L.toast('Bild nicht lesbar'); };
        img.src = url; file.value = '';
      });
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      P.bindTips(sh);
      const grab = () => { if (!dirty) { L.toast('Erst etwas malen oder stempeln 🎨'); return null; } const u = encodeCanvas(cv); if (!u) L.toast('Bild zu groß – bitte weniger Details'); return u; };
      const text = () => sh.querySelector('#kzText').value.trim();
      sh.querySelector('[data-share]').onclick = () => { const u = grab(); if (u) shareImage(u, (text() ? text() + ' — ' : '') + me() + ' ❤'); };
      const gb = sh.querySelector('[data-gift]'); if (gb) gb.onclick = async () => {
        const u = grab(); if (!u) return; gb.disabled = true;
        try { await P.send({ t: 'gift', kind: 'pic', img: u, text: text(), open: 0 }); L.closeSheet(); L.toast('🎁 Überraschung unterwegs zu ' + you()); L.spawnHearts(10); }
        catch (e) { gb.disabled = false; L.toast('Senden fehlgeschlagen – ' + (P.online() ? 'später nochmal' : 'offline')); }
      };
      const sb = sh.querySelector('[data-send]'); if (sb) sb.onclick = async () => {
        const u = grab(); if (!u) return; const t = text(); sb.disabled = true; sb.textContent = '…';
        try { await P.send({ t: 'pic', img: u, text: t }); L.closeSheet(); L.toast('🎨 Kritzel-Gruß unterwegs zu ' + you()); L.spawnHearts(10); }
        catch (e) { sb.disabled = false; sb.textContent = '💌 An ' + you(); L.toast('Senden fehlgeschlagen – ' + (P.online() ? 'später nochmal' : 'offline')); }
      };
    });
  }
  P.on('pic', (obj, created) => {
    const img = String(obj.img || ''); if (img.length > 70000 || !PIC_RE.test(img)) return false;
    const s = st();
    s.inbox.push({ id: uid('m'), t: 'pic', img, text: String(obj.text || '').slice(0, 120), at: created || Date.now(), read: false });
    const pics = s.inbox.filter((m) => m.t === 'pic' && m.img); // Speicher schonen: nur die letzten 8 Bilder behalten
    pics.slice(0, Math.max(0, pics.length - 8)).forEach((m) => { m.img = ''; if (!m.text) m.text = 'Kritzel-Gruß (Bild nicht mehr gespeichert)'; });
    L.toast('🎨 Kritzel-Gruß von ' + you()); L.haptic(20); return true;
  });
  function picSheet(m) {
    L.openSheet('<h3>🎨 Von ' + esc(you()) + '</h3>' + (m.re && window.LZR ? window.LZR.quoteHtml(m.re, 'deine Nachricht') : '') + (m.img ? '<img class="pic-big" src="' + m.img + '" alt="Kritzel-Gruß">' : '') + (m.text ? '<p class="about" style="text-align:center;margin:10px 0">' + esc(m.text) + '</p>' : '') +
      '<div class="row wrap" style="margin-top:12px"><button class="pill-btn primary" data-reply>Zurückkritzeln 🎨</button>' + (m.img ? '<button class="pill-btn" data-save>Speichern ↗</button>' : '') + '<button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-reply]').onclick = () => { L.closeSheet(); if (window.LZR) window.LZR.start(m); kritzelSheet(); };
      const sv = sh.querySelector('[data-save]'); if (sv) sv.onclick = () => shareImage(m.img, m.text || '');
    });
  }
  P.inboxType('pic', { icon: '🎨', meta: 'Kritzel-Gruß', html: (m) => (m.img ? '<img class="ii-img" src="' + m.img + '" alt="">' : ''), open: picSheet });
  P.on('seen', () => { L.toast('❤ ' + you() + ' hat deinen Gruß gesehen'); return true; });

  /* ---------- Startseite: „Neu von …“ – das Neueste groß anzeigen ---------- */
  function renderFromPartner() {
    const c = $('fromPartner'); if (!c) return; const s = st();
    const m = s.inbox.slice().reverse().find((x) => !x.read && (x.t === 'msg' || x.t === 'pic' || x.t === 'jingle'));
    if (!m || !P.paired()) { c.classList.add('hidden'); c.innerHTML = ''; return; }
    c.classList.remove('hidden');
    c.innerHTML = '<div class="eyebrow" style="margin:0 0 8px">' + (m.t === 'pic' ? '🎨' : m.t === 'jingle' ? '🎶' : '💌') + ' Neu von ' + esc(you()) + '</div>' +
      (m.re && window.LZR ? window.LZR.quoteHtml(m.re, 'deine Nachricht') : '') +
      (m.t === 'pic' && m.img ? '<img class="pic-big" src="' + m.img + '" alt="Kritzel-Gruß">' : '') +
      (m.text ? '<div class="fp-text">' + esc(m.text) + '</div>' : '') +
      '<div class="row wrap" style="margin-top:12px">' + (m.t === 'jingle' && jingleById(m.jid) ? '<button class="pill-btn small primary" data-play>▶ Abspielen</button>' : '') +
      '<button class="pill-btn small' + (m.t === 'jingle' ? '' : ' primary') + '" data-seen>❤ Gesehen</button><button class="pill-btn small ghost" data-reply>Antworten</button>' + (m.t !== 'jingle' && window.LZX ? '<button class="pill-btn small ghost" data-fpshare>🖼️ Teilen</button>' : '') + '</div>';
    const pl = c.querySelector('[data-play]'); if (pl) pl.onclick = () => { pl.textContent = '♪ …'; playJingle(jingleById(m.jid), () => { pl.textContent = '▶ Nochmal'; }, m.v || theirVoice()); L.spawnHearts(8, c); };
    const fs = c.querySelector('[data-fpshare]'); if (fs) fs.onclick = () => { if (m.t === 'pic' && m.img) window.LZX.sharePic(m.img); else window.LZX.shareCard({ text: m.text, label: m.label || 'Für mich', sig: you() }); };
    c.querySelector('[data-seen]').onclick = () => { m.read = true; L.save(); L.spawnHearts(8, c); P.renderAll(); P.send({ t: 'seen' }).catch(() => {}); };
    c.querySelector('[data-reply]').onclick = () => { m.read = true; L.save(); P.renderAll(); if (window.LZR) window.LZR.start(m); replySheet(m); };
  }
  function replySheet(m) {
    const q = m && window.LZR ? '<div class="re-quote"><span class="re-k">Du antwortest auf</span><span class="re-t">„' + esc(window.LZR.snippet(m)) + '“</span></div><p class="about" style="font-size:15px;margin:0 0 12px">' + esc(you()) + ' sieht bei deiner Antwort, worauf sie sich bezieht.</p>' : '';
    L.openSheet('<h3>Antworten</h3>' + q + '<div class="row wrap"><button class="pill-btn primary" data-k>🎨 Kritzel-Gruß</button><button class="pill-btn" data-j>🎶 Jingle</button><button class="pill-btn" data-t>✍️ Ein Satz</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-k]').onclick = () => { L.closeSheet(); kritzelSheet(); };
      sh.querySelector('[data-j]').onclick = () => { L.closeSheet(); openJingles(); };
      sh.querySelector('[data-t]').onclick = () => { L.closeSheet(); L.promptSheet('Ein Satz für ' + you(), [{ key: 't', label: 'Deine Nachricht', multiline: true, max: 280, placeholder: 'Schreib, was dir gerade einfällt …' }], 'Senden', (v) => { if (!v.t) return false; setTimeout(() => P.sendOrShare(v.t, 'Persönlich für dich'), 50); }); };
    });
  }
  function openJingles(cat) { if (cat) { st().jingleCat = cat; L.save(); } L.showView('play'); L.showSub('play', 'music'); renderJingles(); setTimeout(() => { const b = $('jingleBox'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); }

  /* =====================================================================
     3. Nah dran: QR, Liebes-Link, NFC-Sticker
     ===================================================================== */
  function qrSvg(text) {
    if (typeof qrcode !== 'function') return '';
    try {
      const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(), m = 2; let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
      const size = n + m * 2;
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img" aria-label="QR-Code"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
    } catch (e) { return ''; }
  }
  function fillQr(root) { root.querySelectorAll('[data-qr]').forEach((el) => { const svg = qrSvg(el.dataset.qr); if (svg) el.innerHTML = svg; else el.remove(); }); }
  const b64u = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))); };
  const greetLink = (text) => location.origin + location.pathname + '#gruss=' + b64u(JSON.stringify({ t: text, s: me() }));
  function handleGreet() {
    const m = /#gruss=([A-Za-z0-9_-]+)/.exec(location.hash); if (!m) return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    let g; try { g = JSON.parse(unb64u(m[1])); } catch (e) { return; }
    const text = String(g.t || '').slice(0, 300), from = String(g.s || '').slice(0, 18); if (!text) return;
    setTimeout(() => {
      L.openSheet('<h3>💌 Botschaft gefunden</h3><div class="card msg-card" style="min-height:110px"><div class="msg-text">' + esc(text) + '</div>' + (from ? '<div class="msg-sig">— ' + esc(from) + '</div>' : '') + '</div><div class="row"><button class="pill-btn primary" data-cancel>Wie schön ❤</button></div>', (sh) => { sh.querySelector('[data-cancel]').onclick = L.closeSheet; });
      L.spawnHearts(14); L.haptic(20);
    }, 400);
  }
  function greetSheet() {
    const hasNfc = 'NDEFReader' in window;
    const start = L.fmt(L.pick(D.messages));
    L.openSheet('<h3>💌 Liebes-QR &amp; NFC-Sticker</h3><p class="about" style="font-size:17px;margin-bottom:10px">Versteck eine Botschaft: als QR-Code zum Scannen (am Spiegel, im Pausenbrot, auf dem Bildschirm) oder auf einem NFC-Sticker, den dein Schatz mit dem Handy antippt.</p>' +
      '<div class="field"><label for="grText">Deine Botschaft</label><textarea id="grText" maxlength="140">' + esc(start) + '</textarea></div>' +
      '<div class="qr hidden" id="grQr"></div>' +
      '<div class="row wrap"><button class="pill-btn primary" data-qrbtn>QR-Code zeigen</button>' + (hasNfc ? '<button class="pill-btn" data-nfc>🏷️ Auf NFC-Sticker schreiben</button>' : '') + '<button class="pill-btn" data-link>Link teilen ↗</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>' +
      '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:10px">' + (hasNfc ? 'NFC: Sticker (NTAG) an die Rückseite deines Handys halten, wenn du auf „schreiben“ getippt hast.' : 'NFC-Sticker lassen sich nur mit Chrome auf einem Android-Handy beschreiben. Lesen kann sie jedes aktuelle Handy.') + ' Die Botschaft steckt im Code selbst, sie wird nirgends hochgeladen.</p>' +
      P.tipsHtml(P.tips('nfc', 2), 'Sticker besorgen'), (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet; P.bindTips(sh);
      const text = () => sh.querySelector('#grText').value.trim();
      sh.querySelector('[data-qrbtn]').onclick = () => { if (!text()) return L.toast('Erst etwas schreiben'); const q = sh.querySelector('#grQr'); q.innerHTML = qrSvg(greetLink(text())); q.classList.remove('hidden'); q.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
      sh.querySelector('[data-link]').onclick = () => { if (!text()) return L.toast('Erst etwas schreiben'); L.shareText('💌 Ich hab dir etwas versteckt: ' + greetLink(text())); };
      const nb = sh.querySelector('[data-nfc]'); if (nb) nb.onclick = async () => {
        if (!text()) return L.toast('Erst etwas schreiben');
        try { const r = new window.NDEFReader(); L.toast('Jetzt den Sticker ans Handy halten …'); await r.write({ records: [{ recordType: 'url', data: greetLink(text()) }] }); L.toast('🏷️ Sticker beschrieben!'); L.spawnHearts(10); L.haptic(30); }
        catch (e) { L.toast(e && e.name === 'NotAllowedError' ? 'NFC nicht erlaubt – bitte in Chrome freigeben' : 'Schreiben fehlgeschlagen – NFC eingeschaltet?'); }
      };
    });
  }
  function nahSheet() {
    L.openSheet('<h3>📡 Nah dran</h3><p class="about" style="font-size:17px;margin-bottom:12px">Für die Momente, in denen ihr nebeneinander sitzt – oder euch etwas zum Finden hinterlasst.</p>' +
      (P.RELAY && !P.joined() ? '<button type="button" class="deck" data-pair><span class="d-ico">💞</span><div class="d-body"><div class="d-title">Apps per QR-Code verbinden</div><div class="d-sub">Code zeigen, mit der Handy-Kamera scannen, fertig.</div></div><span class="d-go">›</span></button>' : '') +
      '<button type="button" class="deck" data-kritzel><span class="d-ico">🎨</span><div class="d-body"><div class="d-title">Bild in der Nähe teilen</div><div class="d-sub">Kritzel-Gruß über das Teilen-Menü deines Handys.</div></div><span class="d-go">›</span></button>' +
      '<button type="button" class="deck" data-greet><span class="d-ico">🏷️</span><div class="d-body"><div class="d-title">Liebes-QR &amp; NFC-Sticker</div><div class="d-sub">Botschaft verstecken – zum Scannen oder Antippen.</div></div><span class="d-go">›</span></button>' +
      '<div class="row" style="margin-top:8px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const pb = sh.querySelector('[data-pair]'); if (pb) pb.onclick = () => { L.closeSheet(); P.pairSheet(); };
      sh.querySelector('[data-kritzel]').onclick = () => { L.closeSheet(); kritzelSheet(); };
      sh.querySelector('[data-greet]').onclick = () => { L.closeSheet(); greetSheet(); };
    });
  }

  /* =====================================================================
     4. Klartext: Unausgesprochenes ansprechen
     ===================================================================== */
  function weekKey(d) {
    d = d || new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + String(Math.ceil(((t - y0) / 86400000 + 1) / 7)).padStart(2, '0');
  }
  const areas = () => K.areas.filter((a) => !a.adult || S().intim);
  const head = (title, right) => '<div class="match-head"><button class="icon-btn" data-close aria-label="Schließen">✕</button><div class="eyebrow" style="margin:0">' + esc(title) + '</div>' + (right || '<span></span>') + '</div>';
  let timer = null, wake = null;
  function closeOverlay() { if (timer) { clearInterval(timer); timer = null; } if (wake) { try { wake.release(); } catch (e) {} wake = null; } P.closeMatch(); renderKlartext(); }

  /* ---- 4a. Wetterbericht der Woche ---- */
  function checkinStart() {
    const s = st(), wk = weekKey(), rec = s.checkins[wk] || {};
    if (rec.mine && rec.theirs) return checkinShow(wk);
    if (rec.mine && P.joined()) return checkinWait(wk);
    P.openMatch(head('Wetterbericht') + '<div class="match-intro"><div class="match-emoji">🌦️</div><h2>Wie war eure Woche?</h2><p class="about">Ihr schätzt beide für euch ein, wie es in ' + areas().length + ' Bereichen lief – von Gewitter bis Sonne. Verglichen wird erst, wenn beide fertig sind. So seht ihr, wo ihr es gleich erlebt und wo nicht.</p>' +
      '<p class="about" style="font-size:17px;color:var(--text-muted)">' + (P.joined() ? 'Du antwortest hier, ' + esc(you()) + ' in der eigenen App.' : 'Ohne Verbindung: erst du, dann gibst du das Handy an ' + esc(you()) + ' weiter.') + '</p>' +
      '<div class="row" style="margin-top:18px"><button class="pill-btn primary" data-start>Los geht’s</button></div></div>', (sc) => {
      sc.querySelector('[data-close]').onclick = closeOverlay;
      sc.querySelector('[data-start]').onclick = () => checkinAsk('me', 0, {}, (mine) => {
        if (P.joined()) {
          const r = s.checkins[wk] = Object.assign(s.checkins[wk] || {}, { mine, at: Date.now() }); L.save();
          P.send({ t: 'checkin', wk, a: mine }).catch(() => L.toast('Übertragen fehlgeschlagen – später im Wetterbericht nochmal öffnen'));
          return r.theirs ? checkinShow(wk) : checkinWait(wk);
        }
        P.openMatch(head('Handy weitergeben') + '<div class="match-intro"><div class="match-emoji">📲</div><h2>Jetzt ' + esc(you()) + '</h2><p class="about">' + esc(me()) + ', gib das Handy weiter. ' + esc(you()) + ' schätzt die Woche für sich ein.</p><div class="row" style="margin-top:18px"><button class="pill-btn primary" data-start>Ich bin ' + esc(you()) + ' – los</button></div></div>', (sc2) => {
          sc2.querySelector('[data-close]').onclick = closeOverlay;
          sc2.querySelector('[data-start]').onclick = () => checkinAsk('you', 0, {}, (theirs) => { s.checkins[wk] = { mine, theirs, at: Date.now(), pass: true }; L.save(); checkinShow(wk); });
        });
      });
    });
  }
  function checkinAsk(who, i, ans, done) {
    const list = areas(); if (i >= list.length) return done(ans);
    const a = list[i];
    P.openMatch(head((who === 'me' ? me() : you()) + ' schätzt ein', '<span class="tag">' + (i + 1) + ' / ' + list.length + '</span>') +
      '<div class="progress" style="margin:0 0 20px"><i style="width:' + Math.round(i / list.length * 100) + '%"></i></div>' +
      '<div class="match-card"><div class="match-emoji">' + a.e + '</div><div class="match-q">' + esc(a.t) + '</div><div class="about" style="font-size:17px">Wie war das diese Woche für dich?</div></div>' +
      '<div class="weather">' + K.weather.map((w, n) => '<button type="button" data-v="' + (n + 1) + '"><b>' + w + '</b><small>' + K.weatherText[n] + '</small></button>').join('') + '</div>' +
      (i > 0 ? '<div class="row" style="margin-top:14px"><button class="pill-btn ghost small" data-back>Zurück</button></div>' : ''), (sc) => {
      sc.querySelector('[data-close]').onclick = closeOverlay;
      sc.querySelectorAll('[data-v]').forEach((b) => b.onclick = () => { ans[a.id] = Number(b.dataset.v); L.haptic(6); checkinAsk(who, i + 1, ans, done); });
      const bk = sc.querySelector('[data-back]'); if (bk) bk.onclick = () => checkinAsk(who, i - 1, ans, done);
    });
  }
  function checkinWait(wk) {
    P.openMatch(head('Wetterbericht') + '<div class="match-intro"><div class="match-emoji">⏳</div><h2>Warte auf ' + esc(you()) + '</h2><p class="about">Deine Einschätzung ist da. Sobald ' + esc(you()) + ' in der eigenen App fertig ist, seht ihr den Vergleich.</p><div class="row wrap" style="margin-top:18px"><button class="pill-btn primary" data-refresh>Aktualisieren</button><button class="pill-btn ghost small" data-redo>Meine Antworten ändern</button></div></div>', (sc) => {
      sc.querySelector('[data-close]').onclick = closeOverlay;
      sc.querySelector('[data-refresh]').onclick = async (e) => { e.currentTarget.textContent = '…'; await P.pull(true); const r = st().checkins[wk]; if (r && r.theirs) checkinShow(wk); else { L.toast('Noch nichts da'); checkinWait(wk); } };
      sc.querySelector('[data-redo]').onclick = () => { delete st().checkins[wk].mine; L.save(); checkinStart(); };
    });
  }
  function checkinShow(wk) {
    const rec = st().checkins[wk]; if (!rec || !rec.mine || !rec.theirs) return checkinStart();
    const rows = areas().filter((a) => rec.mine[a.id] && rec.theirs[a.id]).map((a) => ({ a, m: rec.mine[a.id], t: rec.theirs[a.id], gap: Math.abs(rec.mine[a.id] - rec.theirs[a.id]) }));
    rows.sort((x, y) => (y.gap - x.gap) || ((x.m + x.t) - (y.m + y.t)));
    const top = rows[0]; const low = rows.filter((r) => r.m <= 2 && r.t <= 2);
    const title = top && top.gap >= 2 ? 'Hier erlebt ihr es verschieden' : low.length ? 'Hier hakt es für euch beide' : 'Ziemlich im Gleichklang';
    const note = (r) => r.gap >= 2 ? 'Unterschiedlich erlebt – darüber reden lohnt sich' : (r.m <= 2 && r.t <= 2) ? 'Für beide gerade schwierig' : (r.m >= 4 && r.t >= 4) ? 'Läuft für euch beide' : 'Ähnlich erlebt';
    const focus = top && top.gap >= 2 ? top : (low[0] || null);
    let html = head('Wetterbericht ' + wk.replace('-W', ' · Woche ')) + '<div class="match-intro" style="padding-bottom:8px"><div class="match-emoji">' + (top && top.gap >= 2 ? '🌦️' : low.length ? '🌧️' : '☀️') + '</div><h2>' + title + '</h2><p class="about" style="font-size:17px">Links ' + esc(me()) + ', rechts ' + esc(you()) + '. Kein Zeugnis – nur ein Anlass zum Reden.</p></div><div class="match-list">' +
      rows.map((r) => '<div class="match-item' + (r.gap >= 2 ? ' gap' : '') + '"><span class="mi-e">' + r.a.e + '</span><div class="mi-b"><div class="mi-t">' + esc(r.a.t) + '</div><div class="mi-s">' + note(r) + '</div></div><span class="wx">' + K.weather[r.m - 1] + ' ' + K.weather[r.t - 1] + '</span></div>').join('') + '</div>';
    if (focus) html += '<div class="card soft" style="margin-top:14px;padding:14px 16px"><div class="eyebrow" style="margin:0 0 6px">💬 Einstieg ins Gespräch</div><div style="font-family:var(--serif);font-style:italic;font-size:19px">' + esc(focus.a.q) + '</div></div>';
    html += P.tipsHtml(P.tips('checkin', 2), 'Hilft beim Wochen-Rückblick') + '<div class="row wrap" style="margin-top:18px"><button class="pill-btn primary" data-zwie>⏳ Zwiegespräch starten</button>' + (focus ? '<button class="pill-btn" data-soft>🕊️ Sanft ansprechen</button>' : '') + '<button class="pill-btn ghost small" data-redo>Neu einschätzen</button></div>';
    P.openMatch(html, (sc) => {
      sc.querySelector('[data-close]').onclick = closeOverlay; P.bindTips(sc);
      sc.querySelector('[data-zwie]').onclick = zwieIntro;
      const sf = sc.querySelector('[data-soft]'); if (sf) sf.onclick = () => softStart(focus.a.t);
      sc.querySelector('[data-redo]').onclick = () => { delete st().checkins[wk]; L.save(); checkinStart(); };
    });
    const keys = Object.keys(st().checkins).sort(); while (keys.length > 12) delete st().checkins[keys.shift()]; L.save();
  }
  P.on('checkin', (obj, created) => {
    const wk = String(obj.wk || ''); if (!/^\d{4}-W\d{2}$/.test(wk) || !obj.a || typeof obj.a !== 'object') return false;
    const a = {}; K.areas.forEach((x) => { const v = Number(obj.a[x.id]); if (v >= 1 && v <= 5) a[x.id] = Math.round(v); });
    const s = st(); s.checkins[wk] = Object.assign(s.checkins[wk] || {}, { theirs: a });
    s.inbox = s.inbox.filter((m) => !(m.t === 'checkin' && m.wk === wk));
    s.inbox.push({ id: uid('m'), t: 'checkin', wk, text: '🌦️ Wetterbericht der Woche – ' + you() + ' ist fertig', at: created || Date.now(), read: false });
    L.toast('🌦️ ' + you() + ' hat den Wetterbericht ausgefüllt'); return true;
  });
  P.inboxType('checkin', { icon: '🌦️', meta: 'Wochen-Check-in', open: () => checkinStart() });

  /* ---- 4b. Sag's sanft: Ich-Botschaft bauen ---- */
  function softStart(topic) {
    P.closeMatch();
    L.openSheet('<h3>🕊️ Sag’s sanft</h3><p class="about" style="font-size:17px;margin-bottom:10px">' + (topic ? 'Thema: <b>' + esc(topic) + '</b>. ' : '') + 'Was ist passiert, wie geht es dir, was wünschst du dir?</p>' +
      '<div class="field"><label for="ssSit">Mir ist aufgefallen, dass …</label><input id="ssSit" maxlength="140" placeholder="z. B. wir diese Woche jeden Abend getrennt am Handy saßen" autocomplete="off"></div>' +
      '<div class="field"><label>Ich fühle mich dabei …</label><div class="chips" id="ssFeel">' + K.feelings.map((f) => '<button type="button" data-f="' + f + '">' + f + '</button>').join('') + '</div></div>' +
      '<div class="field"><label for="ssWish">Ich wünsche mir, dass …</label><input id="ssWish" maxlength="140" placeholder="z. B. wir zwei Abende ohne Bildschirm einplanen" autocomplete="off"></div>' +
      '<div class="card soft" style="padding:12px 14px;margin-bottom:10px"><div class="eyebrow" style="margin:0 0 4px">So klingt es</div><div class="chips big" id="ssStyle" style="margin:6px 0 8px"></div><div id="ssOut" class="soft-out"></div><div id="ssWarn" class="hint" style="text-align:left;margin-top:8px"></div></div>' +
      '<div class="row wrap"><button class="pill-btn primary" data-ok>' + (P.joined() ? 'Senden' : 'Teilen ↗') + '</button><button class="pill-btn" data-copy>Kopieren</button><button class="pill-btn ghost" data-cancel>Abbrechen</button></div>' +
      '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:10px">Oder: laut vorlesen statt schicken. Schwierige Themen kommen von Angesicht zu Angesicht meist besser an.</p>', (sh) => {
      let feel = '';
      const val = (id) => sh.querySelector(id).value.trim().replace(/[.!]+$/, '');
      /* Zu scharf? Dann wird der Satz nicht wörtlich übernommen, sondern durch eine entschärfte Fassung ersetzt. */
      const isHarsh = (t) => { const low = ' ' + t.toLowerCase().replace(/\s+/g, ' ') + ' '; return K.harshAny.some((w) => low.indexOf(w) >= 0) || K.harshWords.some((w) => { const i = low.indexOf(w); return i > 0 && !/[a-zäöüß]/.test(low.charAt(i - 1)); }) || /[!?]{2,}/.test(t) || (t.length > 8 && t === t.toUpperCase() && /[A-ZÄÖÜ]/.test(t)); };
      let style = '';
      const lowerFirst = (t) => t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
      const build = () => {
        const s1 = val('#ssSit'), w = val('#ssWish'); if (!s1 && !feel && !w) return { text: '', harsh: false, opts: [] };
        const harsh = isHarsh(s1) || isHarsh(w);
        const opts = harsh ? K.softLines : K.softFrames; const o = opts.find((x) => x.id === style) || opts[0];
        /* In den entschärften Fassungen passt nur ein Gefühl, das man „gerade ist“ und an jemandem auslassen könnte */
        const hot = ['genervt', 'überfordert', 'erschöpft', 'verletzt', 'enttäuscht'].indexOf(feel) >= 0 ? feel : 'gereizt';
        let text = o.t.replace('{f}', harsh ? hot : (feel || '…')).replace('{s}', s1 ? lowerFirst(s1) : '…').replace('{w}', w ? lowerFirst(w) : '…');
        if (harsh && w && !isHarsh(w)) text += ' Ich wünsche mir, dass ' + lowerFirst(w) + '.';
        return { text, harsh, opts, id: o.id };
      };
      const upd = () => {
        const b = build(); sh.querySelector('#ssOut').textContent = b.text || 'Füll die drei Bausteine aus.';
        const box = sh.querySelector('#ssStyle');
        box.innerHTML = b.opts.map((o) => '<button type="button" data-st="' + o.id + '"' + (o.id === b.id ? ' class="on"' : '') + '>' + esc(o.label) + '</button>').join('');
        box.querySelectorAll('button').forEach((x) => x.onclick = () => { style = x.dataset.st; upd(); });
        const low = (val('#ssSit') + ' ' + val('#ssWish')).toLowerCase(); const hit = !b.harsh && K.warnWords.find((w) => new RegExp('(^|[^a-zäöüß])' + w + '([^a-zäöüß]|$)').test(low));
        sh.querySelector('#ssWarn').textContent = b.harsh ? '🦋 Das war zu scharf zum Verschicken. Papillon hat entschärft.' : hit ? '🦋 „' + hit + '“ klingt nach Angriff. Nimm lieber den einen konkreten Moment.' : '';
      };
      sh.querySelectorAll('#ssFeel button').forEach((b) => b.onclick = () => { feel = b.dataset.f; sh.querySelectorAll('#ssFeel button').forEach((x) => x.classList.toggle('on', x === b)); upd(); });
      sh.querySelector('#ssSit').addEventListener('input', upd); sh.querySelector('#ssWish').addEventListener('input', upd); upd();
      const ready = () => { if (!val('#ssSit') || !feel || !val('#ssWish')) { L.toast('Alle drei Bausteine ausfüllen'); return null; } return build().text; };
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-copy]').onclick = async () => { const t = ready(); if (!t) return; try { await navigator.clipboard.writeText(t); L.toast('Kopiert 📋'); } catch (e) { L.toast('Kopieren nicht möglich'); } };
      sh.querySelector('[data-ok]').onclick = () => { const t = ready(); if (!t) return; L.closeSheet(); setTimeout(() => P.sendOrShare(t, 'Klartext 🕊️'), 50); };
    });
  }

  /* ---- 4c. Zwiegespräch: einer spricht, einer hört zu, dann Wechsel ---- */
  function zwieIntro() {
    P.openMatch(head('Zwiegespräch') + '<div class="match-intro"><div class="match-emoji">⏳</div><h2>Eine Person spricht. Die andere hört zu.</h2>' +
      '<p class="about" style="text-align:left">1. Wer dran ist, spricht über sich: was mich bewegt, was mir fehlt, was mich freut – nicht, was dein Schatz falsch macht.<br>2. Wer zuhört, hört nur zu. Kein Unterbrechen, kein Augenrollen, kein Verteidigen.<br>3. Nach der Zeit wird getauscht.<br>4. Danach keine Diskussion. Wirken lassen, in den Arm nehmen.</p>' +
      '<div class="eyebrow" style="margin-top:16px">Redezeit pro Person</div><div class="row wrap"><button class="pill-btn" data-min="5">5 Min</button><button class="pill-btn primary" data-min="10">10 Min</button><button class="pill-btn" data-min="15">15 Min</button></div>' +
      P.tipsHtml(P.tips('zwiegespraech', 2), 'Für die Stimmung') + '</div>', (sc) => {
      sc.querySelector('[data-close]').onclick = closeOverlay; P.bindTips(sc);
      sc.querySelectorAll('[data-min]').forEach((b) => b.onclick = () => zwieRun(Number(b.dataset.min)));
    });
  }
  function zwieRun(mins) {
    const stt = { turn: 0, left: mins * 60, paused: false };
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { wake = w; }).catch(() => {}); } catch (e) {}
    audio();
    const names = [me(), you()];
    const draw = () => {
      const mm = String(Math.floor(stt.left / 60)).padStart(2, '0'), ss = String(stt.left % 60).padStart(2, '0');
      P.openMatch(head('Zwiegespräch', '<span class="tag">' + (stt.turn + 1) + ' / 2</span>') + '<div class="match-intro"><div class="match-emoji">' + (stt.turn === 0 ? '🗣️' : '🗣️') + '</div><h2>' + esc(names[stt.turn]) + ' spricht</h2><p class="about">' + esc(names[1 - stt.turn]) + ' hört nur zu.</p>' +
        '<div class="zw-time" id="zwTime">' + mm + ':' + ss + '</div><div class="progress"><i id="zwBar" style="width:' + Math.round((1 - stt.left / (mins * 60)) * 100) + '%"></i></div>' +
        '<div class="row wrap" style="margin-top:18px"><button class="pill-btn" data-pause>' + (stt.paused ? '▶ Weiter' : '⏸ Pause') + '</button><button class="pill-btn ghost" data-next>' + (stt.turn === 0 ? 'Jetzt wechseln' : 'Beenden') + '</button></div></div>', (sc) => {
        sc.querySelector('[data-close]').onclick = () => L.confirmSheet('Zwiegespräch beenden?', 'Die Zeit wird nicht gespeichert.', 'Beenden', closeOverlay, true, 'Weiterreden');
        sc.querySelector('[data-pause]').onclick = () => { stt.paused = !stt.paused; draw(); };
        sc.querySelector('[data-next]').onclick = next;
      });
    };
    const tickDom = () => { const t = $('zwTime'); if (!t) return; t.textContent = String(Math.floor(stt.left / 60)).padStart(2, '0') + ':' + String(stt.left % 60).padStart(2, '0'); const b = $('zwBar'); if (b) b.style.width = Math.round((1 - stt.left / (mins * 60)) * 100) + '%'; };
    function next() {
      gong(); L.haptic(40);
      if (stt.turn === 0) { stt.turn = 1; stt.left = mins * 60; stt.paused = false; draw(); return; }
      if (timer) { clearInterval(timer); timer = null; }
      P.openMatch(head('Zwiegespräch') + '<div class="match-intro"><div class="match-emoji">🤝</div><h2>Geschafft</h2><p class="about">Bedankt euch beieinander fürs Zuhören. Keine Diskussion jetzt – lasst es wirken. Morgen sieht manches schon anders aus.</p><div class="row wrap" style="margin-top:18px"><button class="pill-btn primary" data-close2>Fertig</button></div>' + P.tipsHtml(P.tips('klartext', 2), 'Weiter im Gespräch bleiben') + '</div>', (sc) => { sc.querySelector('[data-close]').onclick = closeOverlay; sc.querySelector('[data-close2]').onclick = closeOverlay; P.bindTips(sc); });
    }
    if (timer) clearInterval(timer);
    timer = setInterval(() => { if (stt.paused) return; stt.left--; if (stt.left <= 0) next(); else tickDom(); }, 1000);
    draw();
  }

  /* ---- 4d. Weiße Fahne und Pause-Knopf ---- */
  function peaceSheet() {
    const s = st(); const pausing = s.pauseUntil && s.pauseUntil > Date.now();
    L.openSheet('<h3>🏳️ Weiße Fahne</h3><p class="about" style="font-size:17px;margin-bottom:8px">Ein Friedensangebot mitten im Streit ist kein Verlieren. Tipp einen Satz an – er geht an ' + esc(you()) + '.</p>' +
      K.peace.map((t, i) => '<button class="gift-item" data-p="' + i + '"><span class="g-ico">🕊️</span><span class="g-t">' + esc(t) + '</span><span>↗</span></button>').join('') +
      '<div class="row wrap" style="margin-top:14px"><button class="pill-btn" data-jingle>🎶 Versöhnungs-Jingle</button><button class="pill-btn" data-pause>' + (pausing ? '⏸️ Pause läuft noch ' + Math.ceil((s.pauseUntil - Date.now()) / 60000) + ' Min' : '⏸️ 20 Minuten Pause') + '</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>' +
      '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:10px">Pause: Wenn der Puls rast, kann niemand gut zuhören. Zwanzig Minuten getrennt durchatmen, dann weiterreden.</p>' +
      P.tipsHtml(P.tips('peace', 2), 'Sagt es auch ohne Worte'), (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet; P.bindTips(sh);
      sh.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { const t = K.peace[Number(b.dataset.p)]; L.closeSheet(); setTimeout(() => P.sendOrShare(t, 'Friedensangebot 🏳️'), 50); });
      sh.querySelector('[data-jingle]').onclick = () => { L.closeSheet(); sendJingle(L.pick(D.jingles.filter((j) => j.cat === 'streit' && j.sung))); };
      sh.querySelector('[data-pause]').onclick = () => { if (pausing) return; s.pauseUntil = Date.now() + 20 * 60000; L.save(); L.closeSheet(); renderKlartext(); setTimeout(() => P.sendOrShare(K.pauseText, 'Pause ⏸️'), 50); setTimeout(() => { L.toast('⏸️ Pause vorbei. Geh den ersten Schritt.'); gong(); renderKlartext(); }, 20 * 60000); };
    });
  }

  /* ---- 4e. Gesprächskarten ---- */
  function cardSheet() {
    let cur = L.pick(K.cards);
    const draw = () => L.openSheet('<h3>🃏 Gesprächskarte</h3><div class="card msg-card" style="min-height:130px"><div class="msg-text">' + esc(cur) + '</div></div><p class="about" style="font-size:16px;color:var(--text-muted);margin-bottom:12px">Beide antworten. Wer fragt, hört zuerst zu.</p><div class="row wrap"><button class="pill-btn primary" data-next>Nächste Karte</button><button class="pill-btn" data-send>' + (P.joined() ? 'An ' + esc(you()) : 'Teilen ↗') + '</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>' + P.tipsHtml(P.tips('klartext', 2), 'Mehr Fragen'), (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet; P.bindTips(sh);
      sh.querySelector('[data-next]').onclick = () => { let n; do { n = L.pick(K.cards); } while (n === cur && K.cards.length > 1); cur = n; draw(); };
      sh.querySelector('[data-send]').onclick = () => { const t = cur; L.closeSheet(); setTimeout(() => P.sendOrShare('Frage für uns zwei: ' + t, 'Gesprächskarte 🃏'), 50); };
    });
    draw();
  }

  /* ---- Klartext-Übersicht ---- */
  function renderKlartext() {
    const l = $('klartextList'); if (!l) return; const s = st(); const wk = weekKey(), rec = s.checkins[wk] || {};
    const pausing = s.pauseUntil && s.pauseUntil > Date.now();
    const redenRec = (s.matches || {}).reden;
    const tools = [
      { e: '🌦️', t: 'Wetterbericht der Woche', sub: rec.mine && rec.theirs ? 'Vergleich ansehen' : rec.mine ? 'Wartet auf ' + you() : rec.theirs ? '✨ ' + you() + ' ist fertig – jetzt du' : 'Wie lief die Woche für euch beide? Zwei Minuten.', go: checkinStart },
      { e: '🗝️', t: 'Unausgesprochen', sub: redenRec ? (redenRec.matches === null ? 'Wartet auf ' + you() : (redenRec.matches.length === 1 ? '1 gemeinsames Thema' : redenRec.matches.length + ' gemeinsame Themen')) : 'Worüber sollten wir mal reden? Sichtbar wird nur, was beide wollen.', go: () => P.playDeck('reden') },
      { e: '🕊️', t: 'Sag’s sanft', sub: 'Aus einem Vorwurf eine Einladung machen – in drei Bausteinen.', go: () => softStart('') },
      { e: '⏳', t: 'Zwiegespräch', sub: 'Erst spricht die eine Person, dann die andere. Mit Timer und Gong.', go: zwieIntro },
      { e: '🏳️', t: 'Weiße Fahne', sub: pausing ? '⏸️ Pause läuft noch ' + Math.ceil((s.pauseUntil - Date.now()) / 60000) + ' Minuten' : 'Friedensangebot oder 20 Minuten Pause – mit einem Tipp.', go: peaceSheet },
      { e: '🃏', t: 'Gesprächskarte ziehen', sub: 'Eine Frage, die tiefer geht als „Wie war dein Tag?“', go: cardSheet }
    ];
    l.innerHTML = '';
    tools.forEach((t) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'deck'; b.innerHTML = '<span class="d-ico">' + t.e + '</span><div class="d-body"><div class="d-title">' + esc(t.t) + '</div><div class="d-sub">' + esc(t.sub) + '</div></div><span class="d-go">›</span>'; b.onclick = t.go; l.appendChild(b); });
    P.mountTips($('klartextTips'), 'klartext', 'Hilft beim Reden');
  }

  /* =====================================================================
     Verdrahtung
     ===================================================================== */
  const bind = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
  bind('btnKritzel', kritzelSheet);
  bind('btnGift', giftSheet);
  bind('btnJingle', () => openJingles());
  bind('btnKlartext', () => { L.showView('play'); L.showSub('play', 'klartext'); renderKlartext(); });
  bind('btnNah', nahSheet);
  const segK = document.querySelector('.seg[data-seg="play"] [data-sub="klartext"]'); if (segK) segK.addEventListener('click', renderKlartext);
  const segM = document.querySelector('.seg[data-seg="play"] [data-sub="music"]'); if (segM) segM.addEventListener('click', renderJingles);
  $('nav-play').addEventListener('click', () => { renderKlartext(); renderJingles(); });
  $('nav-home').addEventListener('click', renderFromPartner);


  /* =====================================================================
     5. Überraschung senden: Botschaft, Gutschein, Jingle oder Kritzel-Bild kommen als versiegelter
        Umschlag in der App des Schatzes an – sofort oder ab einem gewählten Zeitpunkt.
     ===================================================================== */
  const GIFT_KINDS = [['msg', '💌 Botschaft'], ['coupon', '🎟️ Gutschein'], ['jingle', '🎶 Jingle'], ['pic', '🎨 Kritzel-Bild']];
  function giftTimes() {
    const out = [['now', 'Sofort', 0]];
    const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(7, 0, 0, 0); out.push(['morning', 'Morgen früh', t.getTime()]);
    const a = S().anniversary && L.parseISODate(S().anniversary);
    if (a) { const n = new Date(); const d = new Date(n.getFullYear(), a.getMonth(), a.getDate(), 0, 0, 0, 0); if (d.getTime() <= n.getTime()) d.setFullYear(d.getFullYear() + 1); out.push(['anniv', 'Am Jahrestag', d.getTime()]); }
    return out;
  }
  function giftSheet() {
    if (!P.joined()) { L.toast('Dafür müssen eure Apps verbunden sein'); P.pairSheet(); return; }
    let kind = 'msg', when = 'now';
    const times = giftTimes();
    const coupons = (S().coupons || []).filter((c) => !c.used && !c.from);
    const jingles = D.jingles.filter((j) => !D.jingleCats.find((c) => c.id === j.cat && c.adult) || S().intim).filter((j) => j.sung || !D.jingles.some((x) => x.cat === j.cat && x.sung));
    L.openSheet('<h3>🎁 Überraschung senden</h3>' +
      '<div class="field"><label>Im Umschlag</label><div class="chips big" id="gfKind"></div></div>' +
      '<div class="field" id="gfBody"></div>' +
      '<div class="field"><label>Öffnen</label><div class="chips big" id="gfWhen"></div></div>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Senden</button></div>', (sh) => {
      const body = sh.querySelector('#gfBody');
      const drawBody = () => {
        if (kind === 'msg') body.innerHTML = '<textarea id="gfText" maxlength="400" rows="3" placeholder="Deine Botschaft"></textarea>';
        else if (kind === 'coupon') body.innerHTML = coupons.length ? '<select id="gfCoupon">' + coupons.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.icon + ' ' + c.title) + '</option>').join('') + '</select>' : '<p class="about">Du hast gerade keinen freien Gutschein.</p>';
        else if (kind === 'jingle') body.innerHTML = '<select id="gfJingle">' + jingles.map((j) => '<option value="' + esc(j.id) + '">' + (j.sung ? '🎤 ' : '') + esc(j.title) + '</option>').join('') + '</select>';
        else body.innerHTML = '';
      };
      const drawKind = () => { const b = sh.querySelector('#gfKind'); b.innerHTML = GIFT_KINDS.map((x) => '<button type="button" data-k="' + x[0] + '"' + (x[0] === kind ? ' class="on"' : '') + '>' + x[1] + '</button>').join(''); b.querySelectorAll('button').forEach((x) => x.onclick = () => { if (x.dataset.k === 'pic') { L.closeSheet(); setTimeout(kritzelSheet, 60); return; } kind = x.dataset.k; drawKind(); drawBody(); }); };
      const drawWhen = () => { const b = sh.querySelector('#gfWhen'); b.innerHTML = times.map((x) => '<button type="button" data-w="' + x[0] + '"' + (x[0] === when ? ' class="on"' : '') + '>' + x[1] + '</button>').join(''); b.querySelectorAll('button').forEach((x) => x.onclick = () => { when = x.dataset.w; drawWhen(); }); };
      drawKind(); drawBody(); drawWhen();
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const ok = sh.querySelector('[data-ok]');
      ok.onclick = async () => {
        const open = (times.find((x) => x[0] === when) || times[0])[2];
        let msg = null;
        if (kind === 'msg') { const t = sh.querySelector('#gfText').value.trim(); if (t.length < 2) { L.toast('Schreib ein paar Worte'); return; } msg = { t: 'gift', kind, text: t, open }; }
        else if (kind === 'coupon') { const el = sh.querySelector('#gfCoupon'); const c = el && coupons.find((x) => x.id === el.value); if (!c) { L.toast('Kein Gutschein gewählt'); return; } msg = { t: 'gift', kind, icon: c.icon, title: c.title, desc: c.desc || '', open }; }
        else if (kind === 'jingle') { const j = jingleById(sh.querySelector('#gfJingle').value); if (!j) return; msg = { t: 'gift', kind, jid: j.id, text: L.fmt(j.text || j.title), v: voicePref(), open }; }
        if (!msg) return;
        ok.disabled = true; ok.textContent = '…';
        try { await P.send(msg); L.closeSheet(); L.toast('🎁 Überraschung unterwegs zu ' + you()); L.spawnHearts(12); }
        catch (e) { ok.disabled = false; ok.textContent = 'Senden'; L.toast('Senden fehlgeschlagen – ' + (P.online() ? 'später nochmal' : 'offline')); }
      };
    });
  }
  /* Empfang: Umschlag liegt bereit, bis er geöffnet werden darf */
  P.on('gift', (obj, created) => {
    const s = st(); if (!s.gifts) s.gifts = [];
    const kind = ['msg', 'coupon', 'jingle', 'pic'].indexOf(obj.kind) >= 0 ? obj.kind : '';
    if (!kind) return false;
    const g = { id: uid('g'), kind, at: created || Date.now(), open: Math.max(0, Number(obj.open) || 0), opened: false };
    if (kind === 'msg') g.text = String(obj.text || '').slice(0, 600);
    if (kind === 'coupon') { g.icon = String(obj.icon || '🎁').slice(0, 4); g.title = String(obj.title || 'Gutschein').slice(0, 50); g.desc = String(obj.desc || '').slice(0, 120); }
    if (kind === 'jingle') { g.jid = String(obj.jid || '').slice(0, 40); g.text = String(obj.text || '').slice(0, 200); g.v = obj.v === 'm' || obj.v === 'w' ? obj.v : ''; }
    if (kind === 'pic') { const img = String(obj.img || ''); if (img.length > 70000 || !PIC_RE.test(img)) return false; g.img = img; g.text = String(obj.text || '').slice(0, 120); }
    s.gifts.push(g); if (s.gifts.length > 12) s.gifts = s.gifts.slice(-12);
    L.toast('🎁 ' + you() + ' hat eine Überraschung für dich'); L.haptic(20); return true;
  });
  function unwrapGift(g) {
    const s = st(); g.opened = true; L.showView('home'); window.scrollTo(0, 0);
    if (g.kind === 'msg') { s.inbox.push({ id: uid('m'), t: 'msg', text: g.text, label: 'Überraschung', at: Date.now(), read: true }); L.showMessage({ text: g.text, own: true }, '🎁 Von ' + you() + ' für dich'); }
    if (g.kind === 'coupon') { S().coupons.push({ id: uid('p'), icon: g.icon, title: g.title, desc: g.desc, used: null, from: you() }); L.showMessage({ text: g.icon + ' ' + g.title + (g.desc ? ' – ' + g.desc : ''), own: true }, '🎟️ Gutschein von ' + you()); }
    if (g.kind === 'jingle') { const j = jingleById(g.jid); if (j) playJingle(j, null, g.v || theirVoice()); L.showMessage({ text: g.text || (j ? j.title : 'Ein Jingle für dich'), own: true }, '🎶 Von ' + you() + ' für dich'); }
    if (g.kind === 'pic') { const m = { id: uid('m'), t: 'pic', img: g.img, text: g.text, at: Date.now(), read: true }; s.inbox.push(m); g.img = ''; picSheet(m); }
    s.gifts = s.gifts.filter((x) => !x.opened); L.save();
    P.send({ t: 'seen' }).catch(() => {});
    P.renderAll();
  }
  function giftCheck() {
    const s = st(); const gifts = (s.gifts || []).filter((g) => !g.opened); const tz = $('giftTeaser');
    const now = Date.now(); const ready = gifts.find((g) => g.open <= now); const later = gifts.filter((g) => g.open > now).sort((a, b) => a.open - b.open)[0];
    if (tz) {
      if (later) { tz.classList.remove('hidden'); tz.innerHTML = '<div class="eyebrow" style="margin:0 0 4px">🎁 Überraschung von ' + esc(you()) + '</div><div>Öffnet sich am ' + esc(new Date(later.open).toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) + ' Uhr.</div>'; }
      else { tz.classList.add('hidden'); tz.innerHTML = ''; }
    }
    const busy = !$('giftScreen').classList.contains('hidden') || !$('onboarding').classList.contains('hidden') || !$('matchScreen').classList.contains('hidden');
    if (ready && !busy && S().onboarded) L.showEnvelope({ name: me(), letter: 'Von ' + you() + ' …', hint: you() + ' hat an dich gedacht ❤', button: 'Auspacken ❤', onEnter: () => unwrapGift(ready) });
  }

  /* iPhone im Browser: ohne Symbol auf dem Home-Bildschirm räumt Safari die Daten nach einigen Tagen ohne Nutzung weg */
  function iosHint() {
    const c = $('iosHint'); if (!c) return; const s = st();
    if (!P.iosBrowser || !P.iosBrowser() || s.iosHintOff) { c.classList.add('hidden'); c.innerHTML = ''; return; }
    c.classList.remove('hidden');
    c.innerHTML = '<div class="row between" style="gap:10px;align-items:center"><div style="font-size:17px">📱 Tippe auf Teilen, dann „Zum Home-Bildschirm“. So bleibt alles gespeichert.</div><button class="icon-btn" data-off aria-label="Hinweis schließen">✕</button></div>';
    c.querySelector('[data-off]').onclick = () => { s.iosHintOff = true; L.save(); iosHint(); };
  }
  function render() { renderFromPartner(); renderKlartext(); renderJingles(); giftCheck(); iosHint(); }
  /* Antworten-Knopf an der Botschaftskarte (eingehende Nachricht) */
  const rbm = $('btnReplyMsg'); if (rbm) rbm.onclick = () => { const cur = (st().inbox || []).find((x) => x.id === rbm.dataset.mid) || null; if (cur && window.LZR) window.LZR.start(cur); replySheet(cur); };
  window.LZN = { replySheet, render, softStart, fillQr, qrSvg, kritzelSheet, giftSheet, giftCheck, openJingles, playJingle, jingleById, checkinStart, weekKey, greetLink };
  window.addEventListener('hashchange', handleGreet); // App ist schon offen und bekommt einen Liebes-Link
  render(); handleGreet();
})();
