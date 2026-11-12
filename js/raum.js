/* Schmetterlingsfutter – Falter im Raum (LZA, 3.35.0)
   Echte 3D-Falter im Raum über WebXR („immersive-ar“, Android mit Google Play-Dienste für AR, z. B. Galaxy S23).
   Die Falter fliegen frei um dich herum; Antippen = Netz schwingen. Seltene brauchen 2–3 Treffer.
   Kamerabild und Raumdaten bleiben im Handy (WebXR liefert sie nur an diese Seite, nichts wird gespeichert oder gesendet).
   Geht kein Raum-AR, flattern die Falter über dem Kamerabild (Fangbildschirm der Falterjagd).
   Dazu „Falter zu Besuch“: einmal am Tag kommen drei Falter ins Zimmer – ohne Standort, ohne Rausgehen. */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const S = () => L.S, X = () => window.LZX, J = () => window.LZJ;
  const esc = L.esc, C = (k) => window.LZS && window.LZS.count(k);
  const HITS = [1, 1, 1, 1, 2, 2, 2, 3, 3];
  const falter = (i) => (X() && X().falter ? X().falter(i + 1) : { name: 'Falter', rar: '', fact: '' });
  const img = (i, cls) => '<span class="fx-img fx-t0' + (cls ? ' ' + cls : '') + '" style="--c:' + (i % 3) + ';--r:' + Math.floor(i / 3) + '"></span>';

  /* ---------- Kann dieses Handy Raum-AR? (einmal fragen, Ergebnis merken) ---------- */
  let ok = null;
  function supported() {
    if (ok !== null) return Promise.resolve(ok);
    if (!window.isSecureContext || !navigator.xr || !navigator.xr.isSessionSupported) { ok = false; return Promise.resolve(false); }
    return navigator.xr.isSessionSupported('immersive-ar').then((v) => (ok = !!v)).catch(() => (ok = false));
  }
  supported();

  let threeP = null, texP = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (threeP) return threeP;
    threeP = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'js/vendor/three.min.js'; sc.onload = res; sc.onerror = () => { threeP = null; rej(new Error('three')); }; document.head.appendChild(sc); });
    return threeP;
  }
  function loadAtlas() {
    if (texP) return texP;
    texP = new Promise((res) => { const T = window.THREE; new T.TextureLoader().load('img/falter.webp', (t) => { t.colorSpace = T.SRGBColorSpace || t.colorSpace; res(t); }, undefined, () => { texP = null; res(null); }); });
    return texP;
  }

  /* vorab laden, damit der Start direkt auf das Antippen folgt (Raum-AR braucht eine frische Nutzeraktion) */
  function preload() { return loadThree().then(loadAtlas).catch(() => null); }

  /* ---------- Kompass: Blickrichtung der Rückkamera in Grad (0 = Norden), aus „deviceorientationabsolute“ ---------- */
  function camHeading(a, b, g) {
    const d = Math.PI / 180, x = b * d, y = g * d, z = a * d, cX = Math.cos(x), cY = Math.cos(y), cZ = Math.cos(z), sX = Math.sin(x), sY = Math.sin(y), sZ = Math.sin(z);
    const Vx = -cZ * sY - sZ * sX * cY, Vy = -sZ * sY + cZ * sX * cY; let h = Math.atan(Vx / Vy); if (Vy < 0) h += Math.PI; else if (Vx < 0) h += 2 * Math.PI;
    return h / d;
  }
  const compass = { h: null, on: false, t: 0 };
  function compassOn() {
    if (compass.on) return; compass.on = true;
    const fn = (e) => { if (e.alpha == null) return; if (e.type === 'deviceorientation' && !e.absolute) return; const h = camHeading(e.alpha, e.beta || 0, e.gamma || 0); if (!isFinite(h)) return;
      compass.h = compass.h == null ? h : compass.h + ((((h - compass.h) % 360) + 540) % 360 - 180) * 0.25; compass.h = (compass.h + 360) % 360; compass.t = Date.now(); };
    window.addEventListener('deviceorientationabsolute', fn); window.addEventListener('deviceorientation', fn);
  }
  const heading = () => (compass.h != null && Date.now() - compass.t < 3000 ? compass.h : null);

  /* ---------- Raum-AR-Sitzung ----------
     Feste Falter:  opts.list = [Artindex …]                → fliegen in 1,3–2,1 m um dich herum
     Jagd draußen:  opts.targets() = [{ key, i, bearing, dist, near }] (jede Sekunde neu)
                    → nahe Falter (near) kommen in ihrer Himmelsrichtung auf ca. 2 m heran und lassen sich fangen,
                      ferne leuchten klein in ihrer Richtung; ein Radar unten zeigt alle.
     opts: { title, sub, onCatch(i, key), onEnd(gefangen), heading0, extraHtml, onOverlay(ov, api) } */
  let cur = null;
  async function start(opts) {
    if (cur) return false;
    css(); C('raum_start'); compassOn();
    await loadThree(); const atlas = await loadAtlas(); const T = window.THREE;
    const hunt = typeof opts.targets === 'function';
    const ov = document.createElement('div'); ov.className = 'raum-ov' + (hunt ? ' hunt' : '');
    ov.innerHTML = '<div class="ra-top"><button type="button" class="ra-x" aria-label="Beenden">✕</button><span class="ra-t">' + esc(opts.title || 'Falter im Raum') + '</span><span class="ra-n"></span></div>' +
      (hunt ? '<canvas class="ra-radar" width="240" height="240" aria-hidden="true"></canvas>' : '') + (opts.extraHtml || '') +
      '<div class="ra-tip">' + esc(opts.sub || 'Schau dich langsam um. Tippe auf einen Falter, wenn er nah ist.') + '</div><div class="ra-flash"></div>';
    document.body.appendChild(ov);
    const H0 = opts.heading0 != null ? opts.heading0 : heading(); /* Himmelsrichtung, in die das Handy beim Start zeigt */
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local');
    renderer.domElement.className = 'raum-gl'; document.body.appendChild(renderer.domElement);
    let session;
    try { session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local'], optionalFeatures: ['dom-overlay'], domOverlay: { root: ov } }); }
    catch (e) { renderer.dispose(); renderer.domElement.remove(); ov.remove(); C('raum_fail'); return false; }
    ov.classList.toggle('dom', !!session.domOverlayState);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.02, 60);
    scene.add(new T.HemisphereLight(0xffffff, 0x886677, 1.6)); const dl = new T.DirectionalLight(0xffffff, 0.8); dl.position.set(0.5, 1, 0.3); scene.add(dl);
    /* Flügel wie in der Heide: rechte Bildhälfte des Atlas-Feldes, linker Flügel gespiegelt */
    const plane = new T.PlaneGeometry(1, 2).translate(0.5, 0, 0).rotateX(-Math.PI / 2);
    const mats = {};
    const mat = (k) => { if (mats[k]) return mats[k]; if (!atlas) return (mats[k] = new T.MeshLambertMaterial({ color: [0xffffff, 0xf7e15a, 0x7aa8ff, 0xf08a3c, 0xc0392b, 0x333333, 0xf2d06b, 0xffc83d, 0xff7eb6][k], side: T.DoubleSide }));
      const t = atlas.clone(); t.needsUpdate = true; const c = k % 3, r = Math.floor(k / 3); t.offset.set((c + 0.5) / 3, (2 - r) / 3); t.repeat.set(0.5 / 3, 1 / 3);
      return (mats[k] = new T.MeshLambertMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: k >= 7 ? 0.5 : 0.3, alphaTest: 0.5, side: T.DoubleSide })); };
    const bodyGeo = new T.CylinderGeometry(0.06, 0.04, 0.9, 6).rotateX(Math.PI / 2), bodyMat = new T.MeshLambertMaterial({ color: 0x2b2030 });
    const glowGeo = new T.SphereGeometry(0.9, 12, 8), glowMat = new T.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0, depthWrite: false });
    const camPos = new T.Vector3(), camDir = new T.Vector3(), tmp = new T.Vector3(), dir = new T.Vector3(), prev = new T.Vector3();
    /* lokale Richtung aus Himmelsrichtung: −Z war beim Start die Blickrichtung (H0) */
    const dirOf = (bearing) => { const a = ((bearing - (H0 || 0)) * Math.PI) / 180; return new T.Vector3(Math.sin(a), 0, -Math.cos(a)); };
    function make(i, key) {
      const g = new T.Group(), m = mat(i), r = new T.Mesh(plane, m), l = new T.Mesh(plane, m); l.scale.x = -1;
      const glow = new T.Mesh(glowGeo, glowMat.clone()); g.add(r, l, new T.Mesh(bodyGeo, bodyMat), glow); scene.add(g);
      return { key, i, g, r, l, glow, need: HITS[i] || 1, hits: 0, home: new T.Vector3(), ph: Math.random() * 9, sp: 0.6 + i * 0.07, caught: 0, flee: 0, near: true, size: i >= 7 ? 0.11 : 0.09 };
    }
    const bfs = new Map();
    if (!hunt) opts.list.forEach((i, n) => { const b = make(i, 'k' + n); const a = (n / opts.list.length) * Math.PI * 2 + Math.random(), d = 1.3 + Math.random() * 0.8; b.home.set(Math.sin(a) * d, -0.1 + Math.random() * 0.5, -Math.cos(a) * d); b.g.position.copy(b.home); b.g.scale.setScalar(b.size); bfs.set(b.key, b); });
    const total = hunt ? 0 : opts.list.length;
    const nEl = ov.querySelector('.ra-n'); let got = 0; const showN = () => { nEl.textContent = total > 1 ? '🦋 ' + got + '/' + total : got ? '🦋 ' + got : ''; }; showN();
    const tipEl = ov.querySelector('.ra-tip');
    function flash(t) { const f = ov.querySelector('.ra-flash'); f.textContent = t; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
    /* Jagd: Ziele abgleichen */
    let targets = [];
    function sync() {
      if (!hunt) return; try { targets = opts.targets() || []; } catch (e) { targets = []; }
      const seen = new Set();
      targets.forEach((t) => {
        seen.add(t.key); let b = bfs.get(t.key);
        if (!b) { b = make(t.i, t.key); b.near = !t.near; bfs.set(t.key, b); b.fresh = true; }
        if (b.caught) return;
        if (t.near !== b.near || b.fresh) { /* neu oder Wechsel nah/fern: Ort in Himmelsrichtung neu setzen */
          b.near = t.near; const d = dirOf(t.bearing);
          if (t.near) { b.home.copy(camPos).addScaledVector(d, 1.7 + Math.random() * 0.5); b.home.y = camPos.y - 0.15 + Math.random() * 0.4; }
          else { b.home.copy(camPos).addScaledVector(d, 9); b.home.y = camPos.y + 0.9; }
          if (b.fresh) { b.g.position.copy(b.home); b.fresh = false; }
          b.g.scale.setScalar(t.near ? b.size : 0.32);
        }
        b.dist = t.dist; b.bearing = t.bearing;
      });
      bfs.forEach((b, k) => { if (!seen.has(k) && !b.caught) { scene.remove(b.g); b.glow.material.dispose(); bfs.delete(k); } });
    }
    const ctrl = renderer.xr.getController(0); scene.add(ctrl);
    const ray = new T.Raycaster();
    let ctrlPose = false; ctrl.addEventListener('connected', () => { ctrlPose = true; });
    ctrl.addEventListener('select', () => {
      /* zwei Strahlen: vom Finger (Bildschirm-Eingabe) und aus der Bildmitte – was näher am Falter liegt, zählt */
      const rays = [];
      const xc = renderer.xr.getCamera(); tmp.setFromMatrixPosition(xc.matrixWorld); dir.set(0, 0, -1).applyQuaternion(xc.getWorldQuaternion(new T.Quaternion())); rays.push([tmp.clone(), dir.clone()]);
      if (ctrlPose) { const p = new T.Vector3().setFromMatrixPosition(ctrl.matrixWorld); if (p.lengthSq() > 1e-8) rays.push([p, new T.Vector3(0, 0, -1).applyQuaternion(ctrl.getWorldQuaternion(new T.Quaternion()))]); }
      let best = null, bd = 1e9, farHit = null;
      rays.forEach(([o, d]) => { ray.set(o, d); bfs.forEach((b) => { if (b.caught) return; const dist = b.g.position.distanceTo(o); const off = ray.ray.distanceToPoint(b.g.position);
        if (!b.near) { if (off < 1.2) farHit = b; return; }
        if (dist > 4.5) return; const tol = 0.16 + dist * 0.07; if (off < tol && off < bd) { bd = off; best = b; } }); });
      if (!best) { flash(farHit ? (falter(farHit.i).name + ': noch ' + Math.round(farHit.dist || 0) + ' m') : 'Daneben – näher ran!'); return; }
      best.hits++; L.haptic && L.haptic(25);
      if (best.hits < best.need) { best.flee = 1.2; best.sp *= 1.3; const a = Math.random() * Math.PI * 2; best.home.set(camPos.x + Math.sin(a) * 1.6, camPos.y - 0.2 + Math.random() * 0.5, camPos.z - Math.cos(a) * 1.6); flash('Treffer! ' + best.hits + '/' + best.need); return; }
      best.caught = performance.now(); got++; showN(); flash('Gefangen: ' + falter(best.i).name); C('raum_catch:' + best.i);
      try { opts.onCatch && opts.onCatch(best.i, best.key); } catch (e) {}
      if (!hunt && got >= total) setTimeout(() => end(), 1600);
    });
    /* Radar unten: Punkte relativ zur Blickrichtung, Ring = 150 m */
    const rc = ov.querySelector('.ra-radar'), rx = rc && rc.getContext('2d');
    function radar(viewH) {
      if (!rx) return; const W = 240, R = 104; rx.clearRect(0, 0, W, W);
      rx.fillStyle = 'rgba(20,8,26,.55)'; rx.beginPath(); rx.arc(W / 2, W / 2, R + 12, 0, 7); rx.fill();
      rx.strokeStyle = 'rgba(255,255,255,.35)'; rx.lineWidth = 2; [R, R * 0.3].forEach((r) => { rx.beginPath(); rx.arc(W / 2, W / 2, r, 0, 7); rx.stroke(); });
      rx.fillStyle = 'rgba(255,255,255,.18)'; rx.beginPath(); rx.moveTo(W / 2, W / 2); rx.arc(W / 2, W / 2, R, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); rx.fill();
      targets.forEach((t) => { const b = bfs.get(t.key); if (b && b.caught) return; const a = ((t.bearing - viewH) * Math.PI) / 180, r = Math.min(1, t.dist / 150) * R;
        rx.fillStyle = t.near ? '#ff7eb6' : t.i >= 7 ? '#ffd76a' : '#ffffff'; rx.beginPath(); rx.arc(W / 2 + Math.sin(a) * r, W / 2 - Math.cos(a) * r, t.near ? 11 : 8, 0, 7); rx.fill(); });
      rx.fillStyle = '#fff'; rx.beginPath(); rx.arc(W / 2, W / 2, 6, 0, 7); rx.fill();
    }
    let last = performance.now(), ended = false, nextSync = 0, nextUi = 0;
    renderer.setAnimationLoop((now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const xc = renderer.xr.getCamera(); camPos.setFromMatrixPosition(xc.matrixWorld); camDir.set(0, 0, -1).applyQuaternion(xc.getWorldQuaternion(new T.Quaternion()));
      if (hunt && now > nextSync) { nextSync = now + 1000; sync(); }
      if (hunt && now > nextUi) { nextUi = now + 200;
        const viewH = ((H0 || 0) + (Math.atan2(camDir.x, -camDir.z) * 180) / Math.PI + 360) % 360; radar(viewH);
        const near = targets.filter((t) => t.near && !(bfs.get(t.key) || {}).caught), far = targets.filter((t) => !t.near).sort((a, b) => a.dist - b.dist)[0];
        tipEl.textContent = near.length ? (near.length === 1 ? 'Ein Falter ist bei dir – such ihn und tippe ihn an!' : near.length + ' Falter sind bei dir – such sie und tippe sie an!') : far ? 'Nächster Falter: ' + falter(far.i).name + ', ' + Math.round(far.dist) + ' m ' + side(far.bearing - viewH) : (opts.sub || 'Geh ein Stück weiter – hier fliegt gerade keiner.');
      }
      bfs.forEach((b) => {
        if (b.caught) { const k = (now - b.caught) / 1200; b.g.position.y += dt * 0.6; b.g.scale.multiplyScalar(1 - dt * 1.4); b.glow.material.opacity = Math.max(0, 0.6 - k * 0.6); if (k > 1) b.g.visible = false; return; }
        b.ph += dt * b.sp; const t = b.ph, amp = b.near ? 0.45 : 1.2;
        prev.copy(b.g.position);
        const tx = b.home.x + Math.sin(t * 0.9) * amp + Math.sin(t * 2.3) * 0.08, ty = b.home.y + Math.sin(t * 1.7) * 0.18, tz = b.home.z + Math.cos(t * 0.7) * amp;
        const f = Math.min(1, dt * (b.flee > 0 ? 4 : 1.6)); b.g.position.x += (tx - b.g.position.x) * f; b.g.position.y += (ty - b.g.position.y) * f; b.g.position.z += (tz - b.g.position.z) * f;
        if (b.flee > 0) b.flee -= dt;
        /* nicht durch die Person fliegen */
        const dc = b.g.position.distanceTo(camPos); if (dc < 0.45) { tmp.subVectors(b.g.position, camPos).normalize().multiplyScalar(0.45 - dc); b.g.position.add(tmp); }
        const vx = b.g.position.x - prev.x, vz = b.g.position.z - prev.z; if (Math.abs(vx) + Math.abs(vz) > 1e-5) b.g.rotation.y = Math.atan2(-vx, -vz);
        const flap = Math.sin(now / (b.flee > 0 ? 45 : 70)) * 0.9 + 0.25; b.r.rotation.z = flap; b.l.rotation.z = -flap;
        b.glow.material.opacity = !b.near ? 0.35 + Math.sin(now / 250) * 0.15 : b.i >= 7 ? 0.12 + Math.sin(now / 300) * 0.06 : 0;
      });
      renderer.render(scene, cam);
    });
    function end() { if (ended) return; ended = true; try { session.end(); } catch (e) { cleanup(); } }
    function cleanup() {
      renderer.setAnimationLoop(null); scene.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } if (o.geometry) o.geometry.dispose(); });
      renderer.dispose(); renderer.domElement.remove(); ov.remove(); cur = null;
      try { opts.onEnd && opts.onEnd(got); } catch (e) {}
    }
    session.addEventListener('end', () => { ended = true; cleanup(); });
    ov.querySelector('.ra-x').onclick = end;
    await renderer.xr.setSession(session);
    cur = { end, flash };
    if (H0 == null && hunt) flash('Kompass fehlt – Richtungen sind ungefähr');
    try { opts.onOverlay && opts.onOverlay(ov, cur); } catch (e) {}
    return true;
  }
  const side = (d) => { d = ((d % 360) + 540) % 360 - 180; return Math.abs(d) < 25 ? 'vor dir' : Math.abs(d) > 150 ? 'hinter dir' : d < 0 ? 'links' : 'rechts'; };

  /* ---------- Falter zu Besuch: einmal am Tag drei Falter im Zimmer ---------- */
  const W = [30, 24, 18, 14, 9, 6, 4, 1.4, 0.6];
  function pickArt() { let r = Math.random() * W.reduce((a, b) => a + b, 0); for (let i = 0; i < W.length; i++) { if ((r -= W[i]) < 0) return i; } return 0; }
  function bst() { const s = S(); if (!s.besuch || s.besuch.d !== L.todayKey()) s.besuch = { d: L.todayKey(), list: [pickArt(), pickArt(), pickArt()], got: [] }; return s.besuch; }
  function left() { const b = bst(); return b.list.filter((i, k) => !b.got.includes(k)); }
  async function visit() {
    css(); const b = bst(), rest = left(), can = await supported(); void b;
    if (can && rest.length) preload();
    if (!rest.length) { L.openSheet('<h3>✨ Falter zu Besuch</h3><p class="about" style="font-size:17px">Heute waren schon alle drei da. Morgen kommen neue – oder geht zusammen raus zur <b>Falterjagd</b>.</p><div class="row wrap" style="margin-top:12px">' + (J() ? '<button class="pill-btn primary" data-jagd>🕸️ Zur Falterjagd</button>' : '') + '<button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => { sh.querySelector('[data-cancel]').onclick = L.closeSheet; const j = sh.querySelector('[data-jagd]'); if (j) j.onclick = () => { L.closeSheet(); setTimeout(() => J().open(), 60); }; }); return; }
    L.openSheet('<h3>✨ Falter zu Besuch</h3><p class="about" style="font-size:17px;margin-bottom:8px">Heute flattern ' + (rest.length === 3 ? 'drei Falter' : rest.length === 1 ? 'noch ein Falter' : 'noch ' + rest.length + ' Falter') + ' bei euch im Zimmer herum. Fangt sie zusammen – reicht das Handy hin und her.</p>' +
      '<div class="ra-pre">' + rest.map((i) => img(i, 'shadow')) .join('') + '</div>' +
      (can ? '<p class="about" style="font-size:15px;color:var(--text-muted)">Die Falter erscheinen echt im Raum (Raum-AR). Das Kamerabild bleibt auf dem Handy.</p>' : '<p class="about" style="font-size:15px;color:var(--text-muted)">Dieses Handy kann kein Raum-AR – die Falter flattern über dem Kamerabild.</p>') +
      '<div class="row" style="margin-top:10px"><button class="pill-btn ghost" data-cancel>Später</button><button class="pill-btn primary" data-go>Los geht’s</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = () => { L.closeSheet(); C('besuch_go:' + (can ? 'ar' : 'cam')); setTimeout(() => go(can), 80); };
    });
  }
  function caught(i) {
    const b = bst(); const k = b.list.findIndex((x, n) => x === i && !b.got.includes(n)); if (k >= 0) b.got.push(k);
    if (!S().besuchBook) S().besuchBook = {}; S().besuchBook[i] = (S().besuchBook[i] || 0) + 1; L.save();
    if (X() && X().feed) X().feed('besuch', 1);
  }
  async function go(ar) {
    const rest = left(); const mine = [];
    if (ar) {
      const started = await start({ list: rest, title: 'Falter zu Besuch', sub: 'Schau dich langsam im Zimmer um. Tippe auf einen Falter, wenn er nah ist.', onCatch: (i) => { caught(i); mine.push(i); }, onEnd: () => done(mine) });
      if (started) return; ok = false; L.toast('Raum-AR ließ sich nicht starten – die Falter kommen übers Kamerabild');
    }
    const next = () => { const r = left(); if (!r.length || !J() || !J().fangen) return done(mine); J().fangen(r[0], (yes) => { if (yes) { caught(r[0]); mine.push(r[0]); setTimeout(next, 250); } else done(mine); }, 'Falter zu Besuch'); };
    next();
  }
  function done(mine) {
    if (!mine.length) { L.toast('🦋 Die Falter warten noch – heute kannst du es nochmal versuchen'); return; }
    L.spawnHearts(14);
    const restN = left().length;
    L.openSheet('<div class="bfly-party"><h3>' + (mine.length === 1 ? 'Ein Falter gefangen!' : mine.length + ' Falter gefangen!') + '</h3><div class="ra-pre">' + mine.map((i) => img(i)).join('') + '</div>' +
      '<p class="about" style="margin:6px 0 4px">' + esc(mine.map((i) => falter(i).name).join(', ')) + '</p><p class="about" style="font-size:16px;color:var(--text-soft);margin-bottom:12px">' + esc(falter(mine[mine.length - 1]).fact || '') + '</p>' +
      (restN ? '<p class="about" style="font-size:15px">' + (restN === 1 ? 'Ein Falter ist' : restN + ' Falter sind') + ' heute noch da.</p>' : '<p class="about" style="font-size:15px">Morgen kommen neue Falter zu Besuch.</p>') +
      '<div class="row wrap" style="justify-content:center"><button class="pill-btn" data-book>📖 Schmetterlingsbuch</button><button class="pill-btn ghost" data-ok>Schließen</button></div></div>', (sh) => {
      sh.querySelector('[data-ok]').onclick = L.closeSheet;
      sh.querySelector('[data-book]').onclick = () => { L.closeSheet(); setTimeout(() => X() && X().book(), 60); };
    });
  }

  function css() {
    if (document.getElementById('raumCss')) return;
    const s = document.createElement('style'); s.id = 'raumCss';
    s.textContent = '.raum-gl{position:fixed;inset:0;z-index:8950;pointer-events:none}' +
      '.raum-ov{position:fixed;inset:0;z-index:8960;pointer-events:none;color:#fff;font-family:var(--sans,sans-serif)}' +
      '.raum-ov .ra-top{pointer-events:auto;position:absolute;top:calc(10px + env(safe-area-inset-top));left:10px;right:10px;display:flex;align-items:center;gap:10px}' +
      '.ra-x{width:46px;height:46px;border-radius:50%;border:0;background:rgba(20,8,26,.62);color:#fff;font-size:20px;backdrop-filter:blur(6px)}' +
      '.ra-t{flex:1;font-family:var(--serif);font-size:21px;text-shadow:0 1px 6px rgba(0,0,0,.6)}' +
      '.ra-n{font-weight:800;font-size:16px;background:rgba(20,8,26,.62);border-radius:14px;padding:6px 10px}.ra-n:empty{display:none}' +
      '.ra-tip{position:absolute;left:16px;right:16px;bottom:calc(22px + env(safe-area-inset-bottom));text-align:center;font-size:16px;background:rgba(20,8,26,.55);border-radius:16px;padding:10px 12px;backdrop-filter:blur(6px)}' +
      '.ra-flash{position:absolute;left:0;right:0;top:42%;text-align:center;font:700 24px var(--serif,serif);text-shadow:0 2px 10px rgba(0,0,0,.7);opacity:0}.ra-flash.on{animation:raFl 1.4s ease-out}' +
      '@keyframes raFl{0%{opacity:0;transform:translateY(8px)}15%{opacity:1;transform:none}70%{opacity:1}100%{opacity:0;transform:translateY(-12px)}}' +
      '.raum-ov.hunt .ra-radar{position:absolute;right:14px;bottom:calc(96px + env(safe-area-inset-bottom));width:140px;height:140px}.raum-ov.hunt .ra-tip{right:170px;text-align:left}' +
      '.ra-pre{display:flex;justify-content:center;gap:10px;margin:8px 0 10px}.ra-pre .fx-img{width:78px;height:78px}.ra-pre .fx-img.shadow{filter:brightness(0) invert(1);opacity:.4}';
    document.head.appendChild(s);
  }

  window.LZA = { supported, start, visit, left, preload, ready: () => ok === true, heading, compassOn, camHeading, side, _state: bst, _compass: compass };
})();
