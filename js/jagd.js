/* Schmetterlingsfutter – Falterspaziergang (LZJ; 3.33.0 Falterjagd, 3.49.0 umgebaut zum Falterspaziergang)
   3.49.0: Die Falterjagd mit Karte, Radar, Kompass, Lebensraum-Erkennung und 3D hing an zu vielen Dingen gleichzeitig
   (GPS-Genauigkeit, Kompass, Kartendienst, Kamera, Raum-AR) und lief draußen nicht zuverlässig (Mos Tests 21./22.11.2026).
   Neu und bewusst einfach, passend zur Paar-App:
   - „Losgehen“ tippen, Handy darf in die Tasche. Alle paar Minuten Gehzeit kommt ein Falter (Zeit zählt immer;
     wenn das Handy einen Standort hat, kommt er nach ca. 250 m Weg auch früher). Ab Auto-Tempo pausiert die Zeit.
   - Kommt ein Falter: Handy vibriert (wenn der Bildschirm an ist), sonst wartet er, bis ihr wieder draufschaut.
   - Fangen mit dem Netz (wie bisher, Kamera als Hintergrund, ohne Kamera eine Wiese). Entwischt er, kommt er gleich wieder.
   - Nach drei Faltern: eine Frage nur für euch zwei.
   Der Standort bleibt auf dem Handy, nur Wegstrecke wird gezählt, nichts wird gespeichert oder gesendet.
   Schnittstelle für andere Teile bleibt: LZJ.open(), LZJ.counts(), LZJ.fangen() (Falter zu Besuch). */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const S = () => L.S, P = () => window.LZP, X = () => window.LZX;
  const esc = L.esc;
  const C = (k) => window.LZS && window.LZS.count(k);
  const you = () => (P() ? P().partnerName() : S().receiver);
  const on = () => !!(P() && P().paired() && P().joined());
  const GOAL = 3, MIN_S = 150, MAX_S = 270, STEP_M = 250, FAST = 7, RETRY_S = 25; // s, s, m, m/s, s

  /* Texte für den Fundort – ältere Versionen schicken noch Lebensräume mit, darum bleiben sie lesbar */
  const HAB = {
    walk: { t: 'beim Spaziergang' }, wood: { t: 'im Wald' }, grass: { t: 'auf der Wiese' }, park: { t: 'im Park' }, wetland: { t: 'am Feuchtgebiet' },
    water: { t: 'am Wasser' }, garden: { t: 'in den Gärten' }, quiet: { t: 'zwischen alten Bäumen' }, sand: { t: 'auf sandigem Boden' }, open: { t: 'am Feldrand' }
  };
  const HITS = [1, 1, 1, 1, 2, 2, 2, 3, 3]; // Treffer je Art
  const WEIGHT = [30, 24, 18, 14, 9, 6, 4, 1.4, 0.6]; // Häufigkeit je Art (wie „Falter zu Besuch“)

  function st() { const s = S(); if (!s.jagd) s.jagd = { caught: [], got: {}, ok: false }; if (!s.jagd.got) s.jagd.got = {}; if (!s.jagd.caught) s.jagd.caught = []; return s.jagd; }
  function counts() { const c = {}; st().caught.forEach((x) => { c[x.i] = (c[x.i] || 0) + 1; }); return c; }
  const falter = (i) => { const f = X() && X().falter ? X().falter(i + 1) : { i, tier: 0, name: 'Falter', rar: '', fact: '' }; return Object.assign({}, f, { i, tier: 0 }); };
  const img = (i, cls) => '<span class="fx-img fx-t0' + (cls ? ' ' + cls : '') + '" style="--c:' + (i % 3) + ';--r:' + Math.floor(i / 3) + '"></span>';
  function pickArt() { let r = Math.random() * WEIGHT.reduce((a, b) => a + b, 0); for (let i = 0; i < WEIGHT.length; i++) { if ((r -= WEIGHT[i]) < 0) return i; } return 0; }
  const gap = () => (MIN_S + Math.random() * (MAX_S - MIN_S)) * 1000;
  const dist = (a, b) => { const R = 6371000, toR = Math.PI / 180, dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR; const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

  /* ---------- Start ---------- */
  function open() {
    css();
    const j = st(); if (j.walk && (!j.walk.v2 || Date.now() - j.walk.t > 4 * 3600e3)) { j.walk = null; L.save(); } /* alte Jagd-Spaziergänge (vor 3.49.0) verwerfen */
    if (j.walk) { setTimeout(start, 30); return; } /* laufender Spaziergang: direkt weiter (auch wenn nur noch die Frage fehlt) */
    L.openSheet('<h3>💞 Falterspaziergang</h3>' +
      '<div class="jg-steps"><span>🚶</span><span>🦋</span><span>🕸️</span><span>💬</span></div>' +
      '<p class="about jg-lead">Geht zusammen raus. Alle paar Minuten kommt ein Falter – fangt ihn mit dem Netz. Nach drei Faltern wartet eine Frage nur für euch.</p>' +
      '<div class="jg-safe">Achtet auf den Weg, nicht aufs Handy.</div>' +
      '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-go>🚶 Losgehen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = () => { j.ok = true; j.walk = { v2: 1, n: 0, goal: GOAL, t: Date.now(), list: [], next: Date.now() + gap() * 0.6, m: 0, waiting: null }; L.save(); C('jagd_walk'); L.closeSheet(); setTimeout(start, 80); };
    });
  }

  /* ---------- Spaziergang-Bildschirm ---------- */
  let root = null, tick = null, watchId = null, lastFix = null, fastN = 0, lastT = 0, buzzed = false;
  function start() {
    css(); if (root) return; C('jagd_open');
    const w = st().walk; if (!w) return;
    root = document.createElement('div'); root.className = 'jagd'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Falterspaziergang');
    root.innerHTML = '<div class="jg-top"><button type="button" class="jg-x" aria-label="Pause">✕</button><b>💞 Falterspaziergang</b><button type="button" class="jg-book" aria-label="Schmetterlingsbuch">📖</button></div>' +
      '<div class="jg-slots"></div>' +
      '<div class="jg-stage"><div class="jg-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="jg-rbg"/><circle cx="60" cy="60" r="52" class="jg-rfg"/></svg><div class="jg-rin"></div></div>' +
      '<div class="jg-msg" aria-live="polite"></div><button type="button" class="jg-catch" hidden>🕸️ Fangen!</button></div>' +
      '<button type="button" class="jg-end">Spaziergang beenden</button>';
    document.body.appendChild(root); document.documentElement.classList.add('jagd-open');
    root.querySelector('.jg-x').onclick = () => { stop(); L.toast('⏸️ Pausiert – tippt wieder auf den Falterspaziergang, um weiterzugehen'); };
    root.querySelector('.jg-book').onclick = () => { if (X() && X().book) X().book(); };
    root.querySelector('.jg-end').onclick = endMenu;
    lastT = Date.now(); buzzed = false;
    if ('geolocation' in navigator) {
      try { watchId = navigator.geolocation.watchPosition(gotFix, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }); } catch (e) { watchId = null; }
    }
    tick = setInterval(update, 1000); update();
  }
  function catchNow() { const w2 = st().walk; if (w2 && w2.waiting != null && !document.querySelector('.jagd-fang')) catchScreen({ i: w2.waiting, id: 'w' + w2.t + '_' + w2.n, hab: 'walk' }); }
  /* Wegstrecke grob zählen: nur genaue Messungen, kleine Sprünge (GPS-Zittern) zählen nicht */
  function gotFix(p) {
    const f = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy || 99, t: Date.now() };
    if (f.acc > 35) return;
    if (!lastFix) { lastFix = f; return; }
    const d = dist(lastFix, f), sec = Math.max(1, (f.t - lastFix.t) / 1000), sp = typeof p.coords.speed === 'number' && p.coords.speed >= 0 ? p.coords.speed : d / sec;
    fastN = sp > FAST ? fastN + 1 : 0;
    if (d < 12) return; /* zu klein – vermutlich Zittern */
    lastFix = f;
    const w = st().walk; if (w && fastN < 2 && w.waiting == null) { w.m = (w.m || 0) + d; L.save(); }
  }
  function update() {
    if (!root) return; const w = st().walk; if (!w) return stop();
    const now = Date.now(), fast = fastN >= 2;
    /* Auto-Tempo: Zeit bis zum nächsten Falter läuft nicht weiter */
    if (fast && w.waiting == null) { w.next += now - lastT; }
    lastT = now;
    if (w.waiting == null && w.n < w.goal && (now >= w.next || (w.m || 0) >= STEP_M)) { w.waiting = w.again != null ? w.again : pickArt(); w.again = null; w.m = 0; L.save(); buzzed = false; C('jagd_spawn:' + w.waiting); }
    const slots = root.querySelector('.jg-slots');
    slots.innerHTML = Array.from({ length: w.goal }, (x, k) => k < w.list.length ? img(w.list[k], 'slot') : '<span class="jg-empty"></span>').join('');
    const msg = root.querySelector('.jg-msg'), btn = root.querySelector('.jg-catch'), rin = root.querySelector('.jg-rin'), ring = root.querySelector('.jg-ring');
    if (w.n >= w.goal) { /* alle gefangen, Frage noch offen */
      ring.classList.add('come'); ring.style.setProperty('--p', 1); rin.innerHTML = '<span class="jg-walker">💞</span>'; rin.dataset.i = '';
      msg.textContent = 'Alle ' + w.goal + ' gefangen!'; btn.hidden = false; btn.textContent = '💬 Eure Frage'; btn.onclick = walkEnd;
    } else if (w.waiting != null) {
      btn.textContent = '🕸️ Fangen!'; btn.onclick = catchNow;
      ring.classList.add('come'); ring.style.setProperty('--p', 1);
      if (!rin.dataset.i || rin.dataset.i !== String(w.waiting)) { rin.innerHTML = img(w.waiting, 'fly'); rin.dataset.i = String(w.waiting); }
      msg.textContent = falter(w.waiting).name + ' ist da!'; btn.hidden = false;
      if (!buzzed && !document.hidden) { buzzed = true; try { navigator.vibrate && navigator.vibrate([180, 90, 180]); } catch (e) {} }
    } else {
      ring.classList.remove('come'); btn.hidden = true; rin.innerHTML = '<span class="jg-walker">🚶</span>'; rin.dataset.i = '';
      const span = Math.max(1, w.next - (w.prev || w.t)), pT = Math.min(1, Math.max(0, 1 - (w.next - now) / span)), pM = Math.min(1, (w.m || 0) / STEP_M);
      ring.style.setProperty('--p', Math.max(pT, pM).toFixed(3));
      const min = Math.max(1, Math.ceil((w.next - now) / 60000));
      msg.textContent = fast ? '🚗 Zu schnell – Falter kommen nur zu Fuß' : 'Nächster Falter in ca. ' + min + ' Min.';
    }
  }
  function stop() {
    clearInterval(tick); tick = null;
    if (watchId != null) { try { navigator.geolocation.clearWatch(watchId); } catch (e) {} watchId = null; }
    lastFix = null; fastN = 0;
    if (root) { root.remove(); root = null; }
    document.documentElement.classList.remove('jagd-open');
    if (!document.querySelector('.jagd-fang')) document.documentElement.classList.remove('cam-open');
  }
  /* Beim Zurückkommen in die App sofort neu rechnen (im Hintergrund laufen keine Zeitgeber) */
  document.addEventListener('visibilitychange', () => { if (!document.hidden && root) { lastT = Date.now(); update(); } });

  /* ---------- Fangen ---------- */
  let fang = null;
  function recordCatch(s) {
    const rec = { i: s.i, hab: s.hab || 'walk', at: Date.now() }; st().caught.push(rec); L.save(); C('jagd_catch:' + s.i);
    if (X() && X().feed) X().feed('jagd', 1);
    if (s.i >= 6 && window.LZRE) window.LZRE.los({ who: 'Du', why: 'Seltener Falter beim Spaziergang' }); /* 3.58.0: Reiselos */
    const w = st().walk; if (w && w.n < w.goal) { w.n++; w.list.push(s.i); w.waiting = null; w.prev = Date.now(); w.next = Date.now() + gap(); w.m = 0; L.save(); }
    return { rec, walkDone: !!(w && w.n >= w.goal) };
  }
  async function catchScreen(s, opts) {
    css(); /* 3.52.0: Stil auch, wenn der Fangbildschirm ohne Spaziergang geöffnet wird */
    const f = Object.assign(falter(s.i), opts && opts.name ? { name: opts.name, rar: opts.rar || '' } : null), need = HITS[s.i] || 1; /* 3.52.0: eigener Name (Lotsenfalter der Liebespfade) */
    const el = document.createElement('div'); el.className = 'jagd-fang';
    el.innerHTML = '<video playsinline muted autoplay></video><div class="jf-bg"></div><canvas class="jf-net"></canvas><div class="jf-bf">' + img(s.i, 'fly') + '</div>' +
      '<div class="jf-top"><button type="button" class="jf-x" aria-label="Aufgeben">✕</button><span class="jf-name">' + esc(f.name) + ' <small>' + esc(f.rar) + '</small></span><span class="jf-hits"></span></div>' +
      '<div class="jf-tip">👆 Über den Falter wischen</div>';
    document.body.appendChild(el); document.documentElement.classList.add('cam-open');
    const v = el.querySelector('video'), cv = el.querySelector('.jf-net'), bf = el.querySelector('.jf-bf'), ctx = cv.getContext('2d');
    /* ✕ und Zurück-Taste wirken schon während der Kamerafreigabe */
    let stream = null, gone = false; el.querySelector('.jf-x').onclick = () => { gone = true; el.style.display = 'none'; };
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); if (!gone) { v.srcObject = stream; el.classList.add('cam'); } } catch (e) { /* ohne Kamera: Wiese als Hintergrund */ }
    if (gone) { if (stream) stream.getTracks().forEach((t) => t.stop()); el.remove(); if (!root) document.documentElement.classList.remove('cam-open'); missed(s, opts); return; }
    const W = () => el.clientWidth, H = () => el.clientHeight; cv.width = W(); cv.height = H();
    let x = W() / 2, y = H() * 0.42, tx = x, ty = y, hits = 0, speed = 0.9 + s.i * 0.12, dead = false, trail = [], raf = 0, t0 = performance.now();
    const hitsEl = el.querySelector('.jf-hits'); const drawHits = () => { hitsEl.textContent = need > 1 ? '🕸️ ' + hits + '/' + need : ''; }; drawHits();
    function newTarget() { tx = W() * (0.15 + Math.random() * 0.7); ty = H() * (0.18 + Math.random() * 0.5); }
    newTarget();
    function frame(now) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
      if (d < 20) newTarget(); else { x += dx / d * Math.min(d, speed * 3.2); y += dy / d * Math.min(d, speed * 3.2) + Math.sin(now / 180) * 0.9; }
      bf.style.transform = 'translate(' + (x - 60) + 'px,' + (y - 60) + 'px) rotate(' + (dx > 0 ? 8 : -8) + 'deg)';
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (trail.length > 1) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; for (let i = 1; i < trail.length; i++) { const a = 1 - (now - trail[i].t) / 350; if (a <= 0) continue; ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.85).toFixed(2) + ')'; ctx.lineWidth = 26 * a + 4; ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke(); } }
      trail = trail.filter((p) => now - p.t < 350);
      if (now - t0 > 30000) end(false);
    }
    raf = requestAnimationFrame(frame);
    let lastHit = 0;
    const move = (e) => {
      if (dead) return; const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, now = performance.now();
      const prev = trail[trail.length - 1]; trail.push({ x: px, y: py, t: now });
      if (prev && Math.hypot(px - prev.x, py - prev.y) > 14 && Math.hypot(px - x, py - y) < 62 && now - lastHit > 450) {
        lastHit = now; hits++; drawHits(); L.haptic && L.haptic(25);
        if (hits >= need) return end(true);
        speed *= 1.35; newTarget(); bf.classList.add('hit'); setTimeout(() => bf.classList.remove('hit'), 300);
      }
    };
    cv.addEventListener('pointerdown', (e) => { trail = [{ x: e.clientX, y: e.clientY, t: performance.now() }]; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') move(e); });
    function close() { dead = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((t) => t.stop()); el.remove(); fang = null; if (!root) document.documentElement.classList.remove('cam-open'); }
    function end(ok) {
      if (dead) return; close();
      if (!ok) return missed(s, opts);
      if (opts && opts.done) { if (!opts.name) C('besuch_catch:' + s.i); opts.done(true); return; }
      const r = recordCatch(s); if (root) update(); caughtSheet(r.rec, r.walkDone);
    }
    el.querySelector('.jf-x').onclick = () => end(false);
    fang = { close, end };
  }
  /* Entwischt: beim Besuch zurück an den Aufrufer, beim Spaziergang kommt derselbe Falter gleich wieder */
  function missed(s, opts) {
    if (opts && opts.done) { if (!opts.name) C('besuch_miss:' + s.i); opts.done(false); return; }
    C('jagd_miss:' + s.i);
    const w = st().walk; if (w && w.waiting != null) { w.waiting = null; w.prev = Date.now(); w.next = Date.now() + RETRY_S * 1000; w.again = s.i; L.save(); }
    L.toast('🦋 Weggeflattert – gleich kommt er wieder');
  }
  function caughtSheet(rec, walkDone) {
    const f = falter(rec.i);
    L.spawnHearts(14);
    L.openSheet('<div class="bfly-party"><div class="fx-hero">' + img(rec.i, 'big') + '</div><h3>Gefangen!</h3><p class="fx-name">' + esc(f.name) + ' <span class="fx-rar">' + esc(f.rar) + '</span></p><p class="about" style="font-size:17px;margin:6px 0 14px">' + esc(f.fact) + '</p>' + (window.LZWI ? window.LZWI.moreRow(rec.i) : '') +
      '<div class="row wrap" style="justify-content:center">' + (walkDone ? '<button class="pill-btn primary" data-walkend>💬 Eure Frage</button>' : '<button class="pill-btn primary" data-ok>🚶 Weitergehen</button>') +
      (on() ? '<button class="pill-btn" data-gift>💌 Für ' + esc(you()) + '</button>' : '') + '</div></div>', (sh) => {
      const ok = sh.querySelector('[data-ok]'); if (ok) ok.onclick = L.closeSheet;
      const we = sh.querySelector('[data-walkend]'); if (we) we.onclick = () => { L.closeSheet(); setTimeout(walkEnd, 80); };
      const g = sh.querySelector('[data-gift]'); if (g) g.onclick = async () => {
        g.disabled = true; try { await P().send({ t: 'falter', i: rec.i, hab: rec.hab, text: f.name }); rec.gift = 1; L.save(); g.textContent = '✓ Unterwegs'; L.toast('💌 ' + f.name + ' fliegt zu ' + you()); C('jagd_gift'); } catch (e) { g.disabled = false; L.toast('Senden fehlgeschlagen'); }
      };
    });
  }

  /* ---------- Ende ---------- */
  const WALK_Q = ['Was hat dir an unserem Spaziergang gefallen?', 'Welcher Moment draußen bleibt dir heute im Kopf?', 'Wohin gehen wir beim nächsten Mal?', 'Was hast du heute an mir bemerkt?', 'Worüber hast du dich unterwegs gefreut?'];
  function endMenu() {
    const w = st().walk; if (!w) return stop();
    if (!w.n) { L.openSheet('<h3>Spaziergang beenden?</h3><div class="row wrap" style="margin-top:12px"><button class="pill-btn ghost" data-ok>Weitergehen</button><button class="pill-btn primary" data-stop>Beenden</button></div>', (sh) => {
      sh.querySelector('[data-ok]').onclick = L.closeSheet;
      sh.querySelector('[data-stop]').onclick = () => { L.closeSheet(); st().walk = null; L.save(); C('jagd_walk_stop:0'); stop(); };
    }); return; }
    walkEnd();
  }
  function walkEnd() {
    const w = st().walk; if (!w) return; C('jagd_walk_done:' + w.n);
    const min = Math.max(1, Math.round((Date.now() - w.t) / 60000)), q = WALK_Q[Math.floor(Math.random() * WALK_Q.length)];
    st().walk = null; L.save(); stop(); L.spawnHearts(16);
    L.openSheet('<div class="bfly-party"><h3>Schöner Spaziergang!</h3><div class="jg-walkimgs">' + w.list.map((i) => img(i)).join('') + '</div>' +
      '<p class="about" style="margin:4px 0 10px;font-size:17px">' + w.list.length + ' Falter in ' + min + (min === 1 ? ' Minute' : ' Minuten') + '</p>' +
      '<div class="jg-walkq"><b>' + esc(q) + '</b>' + (on() ? '<textarea id="jgWalkA" maxlength="300" rows="3" placeholder="Deine Antwort (freiwillig)"></textarea>' : '') + '</div>' +
      '<div class="row wrap" style="justify-content:center;margin-top:10px">' + (on() ? '<button class="pill-btn primary" data-send>💌 An ' + esc(you()) + '</button>' : '') + '<button class="pill-btn ghost" data-ok>Fertig</button></div></div>', (sh) => {
      sh.querySelector('[data-ok]').onclick = L.closeSheet;
      const sb = sh.querySelector('[data-send]'); if (sb) sb.onclick = async () => {
        const a = (sh.querySelector('#jgWalkA').value || '').trim(); if (!a) { L.toast('Schreib erst ein paar Worte'); return; }
        sb.disabled = true;
        try { await P().send({ t: 'msg', text: '💞 Unser Falterspaziergang – ' + q + '\n' + a, label: '💞 Falterspaziergang' }); C('jagd_walk_send'); L.toast('💌 Unterwegs zu ' + you()); L.closeSheet(); }
        catch (e) { sb.disabled = false; L.toast('Senden fehlgeschlagen'); }
      };
    });
  }

  /* ---------- Vom Schatz gefangen (auch von älteren App-Versionen) ---------- */
  if (P()) {
    P().on('falter', (obj, created) => {
      const i = Math.max(0, Math.min(8, Number(obj.i) | 0)), hab = HAB[obj.hab] ? obj.hab : 'walk';
      st().caught.push({ i, hab, at: created || Date.now(), from: you() });
      const s = S(); if (!s.inbox) s.inbox = []; s.inbox.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: 'falter', fi: i, hab, text: falter(i).name, at: created || Date.now(), read: false });
      L.toast('🦋 ' + you() + ' hat einen Falter für dich gefangen'); L.haptic && L.haptic(20); return true;
    });
    P().inboxType('falter', { icon: '🦋', meta: 'Für dich gefangen – antippen', html: (m) => img(m.fi || 0, 'inbox'), open: (m) => {
      const f = falter(m.fi || 0); css();
      L.openSheet('<div class="bfly-party"><div class="fx-hero">' + img(m.fi || 0, 'big') + '</div><h3>Für dich gefangen</h3><p class="fx-name">' + esc(f.name) + ' <span class="fx-rar">' + esc(f.rar) + '</span></p><p class="about" style="margin:6px 0 14px">' + esc(you()) + ' hat ihn ' + esc((HAB[m.hab] || HAB.walk).t) + ' gefangen. Er ist jetzt in deinem Schmetterlingsbuch.</p>' + (window.LZWI ? window.LZWI.moreRow(m.fi || 0) : '') +
        '<div class="row wrap" style="justify-content:center">' + (window.LZN && window.LZN.replySheet ? '<button class="pill-btn primary" data-reply>Danke sagen</button>' : '') + '<button class="pill-btn" data-book>📖 Zum Buch</button><button class="pill-btn ghost" data-ok>Schließen</button></div></div>', (sh) => {
        sh.querySelector('[data-ok]').onclick = L.closeSheet;
        sh.querySelector('[data-book]').onclick = () => { L.closeSheet(); setTimeout(() => X() && X().book(), 60); };
        const r = sh.querySelector('[data-reply]'); if (r) r.onclick = () => { L.closeSheet(); if (window.LZR) window.LZR.start(m); setTimeout(() => window.LZN.replySheet(m), 60); };
      });
    } });
  }

  /* ---------- Stil ---------- */
  function css() {
    if (document.getElementById('jagd-css')) return;
    const s = document.createElement('style'); s.id = 'jagd-css';
    s.textContent = '.jagd{position:fixed;inset:0;z-index:8800;background:linear-gradient(180deg,#2a1438 0%,#1c0f27 100%);color:#fff;display:flex;flex-direction:column;align-items:center;padding:calc(12px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));font-family:Lato,sans-serif}' +
      '.jg-top{width:100%;display:flex;align-items:center;gap:10px}.jg-top b{flex:1;text-align:center;font:400 24px var(--serif,serif)}' +
      '.jg-top button{width:50px;height:50px;border-radius:25px;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:21px;flex:none}' +
      '.jg-slots{display:flex;gap:14px;margin:22px 0 6px}.jg-slots .fx-img.slot{width:64px;height:64px}.jg-empty{width:64px;height:64px;border-radius:50%;border:3px dashed rgba(255,255,255,.55);box-sizing:border-box}' +
      '.jg-stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;width:100%}' +
      '.jg-ring{position:relative;width:min(64vw,260px);aspect-ratio:1}.jg-ring svg{width:100%;height:100%;transform:rotate(-90deg)}' +
      '.jg-rbg{fill:none;stroke:rgba(255,255,255,.18);stroke-width:9}.jg-rfg{fill:none;stroke:#ff7eb6;stroke-width:9;stroke-linecap:round;stroke-dasharray:326.7;stroke-dashoffset:calc(326.7 * (1 - var(--p,0)));transition:stroke-dashoffset .9s linear}' +
      '.jg-rin{position:absolute;inset:16%;display:flex;align-items:center;justify-content:center}.jg-walker{font-size:84px;line-height:1}.jg-rin .fx-img{width:100%;animation:jgFlap .24s ease-in-out infinite alternate}' +
      '.jg-ring.come{animation:jgPop .6s ease-out}.jg-ring.come .jg-rfg{stroke:#ffd76a}@keyframes jgPop{0%{transform:scale(.85)}60%{transform:scale(1.06)}100%{transform:none}}' +
      '.jg-msg{font:700 23px Lato,sans-serif;text-align:center;min-height:30px;font-variant-numeric:tabular-nums}' +
      '.jg-catch{min-height:64px;min-width:240px;border:0;border-radius:32px;padding:0 28px;font:800 22px Lato,sans-serif;color:#fff;background:linear-gradient(135deg,#e8467c,#b04fd0);box-shadow:0 8px 24px rgba(0,0,0,.4);animation:jgPulseB 1.4s ease-in-out infinite}' +
      '@keyframes jgPulseB{50%{transform:scale(1.05)}}' +
      '.jg-end{min-height:54px;border:2px solid rgba(255,255,255,.6);border-radius:27px;padding:0 24px;font:700 18px Lato,sans-serif;color:#fff;background:transparent}' +
      '@keyframes jgFlap{from{transform:scaleX(1)}to{transform:scaleX(.55)}}' +
      '.jg-steps{display:flex;justify-content:center;gap:18px;font-size:34px;margin:4px 0 8px}.jg-lead{font-size:18px;margin-bottom:10px}' +
      '.jg-safe{background:rgba(242,193,78,.14);border:1px solid rgba(242,193,78,.5);border-radius:14px;padding:10px 12px;font-size:17px;font-weight:600}' +
      '.jagd-fang{position:fixed;inset:0;z-index:8900;background:#1d3a24;overflow:hidden;touch-action:none}.jagd-fang video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}.jagd-fang.cam video{display:block}' +
      '.jf-bg{position:absolute;inset:0;background:linear-gradient(180deg,#9fd3f0 0%,#cfe9c8 45%,#6fae4e 46%,#3f7d34 100%)}.jagd-fang.cam .jf-bg{display:none}' +
      '.jf-net{position:absolute;inset:0;z-index:3}.jf-bf{position:absolute;left:0;top:0;width:120px;height:120px;z-index:2;pointer-events:none}.jf-bf .fx-img{width:120px;animation:jgFlap .22s ease-in-out infinite alternate}' +
      '.jf-bf.hit .fx-img{filter:brightness(1.8) drop-shadow(0 0 12px #fff)}' +
      '.jf-top{position:absolute;left:10px;right:10px;top:calc(10px + env(safe-area-inset-top));display:flex;align-items:center;gap:8px;z-index:4}' +
      '.jf-x{width:50px;height:50px;border-radius:25px;border:0;background:rgba(40,20,60,.75);color:#fff;font-size:20px}.jf-name{flex:1;text-align:center;color:#fff;font:400 24px var(--serif,serif);text-shadow:0 2px 6px rgba(0,0,0,.7)}.jf-name small{display:block;font:700 13px Lato,sans-serif;letter-spacing:.5px;text-transform:uppercase}' +
      '.jf-hits{min-width:50px;color:#fff;font:800 18px Lato,sans-serif;text-shadow:0 2px 6px rgba(0,0,0,.7)}' +
      '.jf-tip{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(30px + env(safe-area-inset-bottom));color:#fff;font:700 19px Lato,sans-serif;background:rgba(40,20,60,.78);border-radius:18px;padding:10px 18px;z-index:4;pointer-events:none;white-space:nowrap}' +
      '.jg-walkimgs{display:flex;justify-content:center;gap:8px;margin:6px 0}.jg-walkimgs .fx-img{width:72px;height:72px}' +
      '.jg-walkq{display:flex;flex-direction:column;gap:8px;text-align:left;background:var(--glass,rgba(255,255,255,.06));border-radius:16px;padding:12px;font-size:17px}.jg-walkq b{font-family:var(--serif);font-weight:400;font-size:22px}.jg-walkq textarea{width:100%;font-size:17px;border-radius:12px;padding:10px;box-sizing:border-box}' +
      '.fx-img.inbox{width:44px;float:right;margin-left:8px}' +
      'html.jagd-open #modal{z-index:9500}html.jagd-open .toast,html.jagd-open #toast{z-index:9600}html.jagd-open .floating-hearts{z-index:9550}';
    document.head.appendChild(s);
  }

  /* Test: LZJ.fastForward() lässt den nächsten Falter sofort kommen, LZJ.walked(m) zählt Meter dazu */
  window.LZJ = { open, start, stop, counts, HAB, fang: () => fang,
    fangen: (i, done, title, extra) => catchScreen({ i, id: 'b' + Date.now(), hab: 'walk' }, Object.assign({ done, title }, extra || null)), walkEnd,
    fastForward: () => { const w = st().walk; if (w) { w.next = Date.now() - 1; update(); } }, walked: (m) => { const w = st().walk; if (w) { w.m = (w.m || 0) + m; update(); } }, _walk: () => st().walk };
})();
