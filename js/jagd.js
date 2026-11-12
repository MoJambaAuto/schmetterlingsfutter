/* Schmetterlingsfutter – Falterjagd draußen (LZJ, 3.33.0)
   Idee von Mo und seiner Tochter: unterwegs echte Falterarten in der freien Natur finden und fangen –
   besonders für Partner, die gerade allein unterwegs sind: „Für dich gefangen“ schickt den Falter in die App des Schatzes.
   Technik:
   - Karte: MapLibre GL (js/vendor, erst beim Öffnen geladen) mit Kartenstil von OpenFreeMap (kostenlos, ohne Schlüssel, Daten © OpenStreetMap).
   - Falter entstehen ohne Server: Die Welt ist in Felder von ca. 140 m geteilt, je Feld und Viertelstunde würfelt ein fester Zufall,
     ob und wo Falter sitzen. Wer zur selben Zeit am selben Ort ist, sieht dieselben Falter.
   - Lebensraum aus den Kartendaten (Wald, Wiese, Park, Wasser, Gärten …) bestimmt, welche Arten auftauchen. Auf Straßen sitzt keiner.
   - Der Standort bleibt auf dem Handy. Ab Auto-Tempo erscheinen keine Falter.
   - Fangen: Kamera (Rückseite) mit flatterndem Falter, mit dem Finger ein Netz schwingen. Seltene Falter brauchen mehrere Treffer. */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const S = () => L.S, P = () => window.LZP, X = () => window.LZX;
  const esc = L.esc;
  const C = (k) => window.LZS && window.LZS.count(k);
  const you = () => (P() ? P().partnerName() : S().receiver);
  const on = () => !!(P() && P().paired() && P().joined());
  const CELL = 140, WIN = 15 * 60 * 1000, RANGE = 45, FAST = 7; // m, ms, m, m/s (≈ 25 km/h)
  const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

  /* Lebensräume und welche Arten (Index der Falter-Tafel) dort häufig sind */
  const HAB = {
    wood: { t: 'im Wald', w: [[0, 2], [1, 5], [3, 3], [4, 6], [5, 6], [6, 1]] },
    grass: { t: 'auf der Wiese', w: [[0, 5], [1, 2], [2, 7], [3, 4], [4, 2], [6, 3]] },
    park: { t: 'im Park', w: [[0, 5], [1, 3], [2, 3], [3, 4], [4, 4], [5, 2], [6, 1]] },
    wetland: { t: 'am Feuchtgebiet', w: [[1, 4], [2, 3], [4, 3], [5, 3], [6, 2]] },
    water: { t: 'am Wasser', w: [[0, 2], [1, 4], [2, 2], [5, 4], [6, 2]] },
    garden: { t: 'in den Gärten', w: [[0, 8], [1, 2], [3, 4], [4, 4], [5, 2]] },
    quiet: { t: 'zwischen alten Bäumen', w: [[1, 3], [4, 5], [5, 4], [3, 2]] },
    sand: { t: 'auf sandigem Boden', w: [[0, 3], [2, 5], [3, 2], [6, 3]] },
    open: { t: 'am Feldrand', w: [[0, 7], [2, 4], [3, 3], [1, 2], [6, 1]] }
  };
  const LAYER_HAB = { landcover_wood: 'wood', landcover_grass: 'grass', park: 'park', landcover_wetland: 'wetland', water: 'water', landuse_residential: 'garden', landuse_cemetery: 'quiet', landcover_sand: 'sand', landuse_pitch: 'grass' };
  const PRIO = ['water', 'wetland', 'wood', 'park', 'quiet', 'grass', 'sand', 'garden'];
  const HITS = [1, 1, 1, 1, 2, 2, 2, 3, 3]; // Treffer je Art

  function st() { const s = S(); if (!s.jagd) s.jagd = { caught: [], got: {}, ok: false }; if (!s.jagd.got) s.jagd.got = {}; if (!s.jagd.caught) s.jagd.caught = []; return s.jagd; }
  function counts() { const c = {}; st().caught.forEach((x) => { c[x.i] = (c[x.i] || 0) + 1; }); return c; }
  const falter = (i) => { const f = X() && X().falter ? X().falter(i + 1) : { i, tier: 0, name: 'Falter', rar: '', fact: '' }; return Object.assign({}, f, { i, tier: 0 }); };
  const img = (i, cls) => '<span class="fx-img fx-t0' + (cls ? ' ' + cls : '') + '" style="--c:' + (i % 3) + ';--r:' + Math.floor(i / 3) + '"></span>';

  /* ---------- fester Zufall ---------- */
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const latStep = CELL / 111320;
  const lonStep = (lat) => CELL / (111320 * Math.cos(Math.round(lat) * Math.PI / 180));
  function cellsAround(lat, lon, r) {
    const ls = lonStep(lat), cy = Math.floor(lat / latStep), cx = Math.floor(lon / ls), out = [];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) out.push({ cx: cx + dx, cy: cy + dy, ls });
    return out;
  }
  function spawnsIn(c, win) {
    const R = rng(hash(c.cx + ':' + c.cy + ':' + win)); const u = R(); const n = u < 0.42 ? 0 : u < 0.82 ? 1 : 2; const out = [];
    for (let k = 0; k < n; k++) {
      const lat = (c.cy + 0.1 + R() * 0.8) * latStep, lon = (c.cx + 0.1 + R() * 0.8) * c.ls;
      out.push({ id: c.cx + '_' + c.cy + '_' + win + '_' + k, lat, lon, r1: R(), r2: R(), r3: R() });
    }
    return out;
  }
  function pick(hab, s) {
    if (s.r1 < 0.0025) return 8; // Papillon
    if (s.r1 < 0.0105) return 7; // Goldener Falter
    const w = (HAB[hab] || HAB.open).w, sum = w.reduce((a, x) => a + x[1], 0); let r = s.r2 * sum;
    for (const [i, g] of w) { if ((r -= g) < 0) return i; } return w[0][0];
  }
  function inRing(pt, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
  function inPoly(pt, g) { if (!g) return false; const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; return polys.some((p) => inRing(pt, p[0]) && !p.slice(1).some((h) => inRing(pt, h))); }
  const dist = (a, b) => { const R = 6371000, toR = Math.PI / 180, dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR; const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

  /* ---------- Laden ---------- */
  let mlP = null;
  function loadML() {
    if (window.maplibregl) return Promise.resolve();
    if (mlP) return mlP;
    mlP = new Promise((ok, no) => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'js/vendor/maplibre-gl.css'; document.head.appendChild(l);
      const s = document.createElement('script'); s.src = 'js/vendor/maplibre-gl.js'; s.onload = ok; s.onerror = () => { mlP = null; no(new Error('ml')); }; document.head.appendChild(s);
    });
    return mlP;
  }

  /* ---------- Start: Hinweise ---------- */
  function open() {
    css();
    const j = st();
    L.openSheet('<h3>🕸️ Falterjagd draußen</h3><p class="about" style="font-size:17px;margin-bottom:8px">Geh raus und finde echte Falterarten: im Wald andere als auf der Wiese, am Wasser andere als in den Gärten. Seltene tauchen nur selten auf. Fang sie mit der Kamera und schick sie ' + (on() ? esc(you()) : 'deinem Schatz') + '.</p>' +
      '<div class="jg-safe"><b>Bitte achte unterwegs auf dich:</b><ul><li>Schau auf den Weg und den Verkehr, nicht nur aufs Handy.</li><li>Betritt keine Privatgrundstücke oder gesperrten Flächen.</li><li>Beim Auto- oder Radfahren erscheinen keine Falter.</li></ul></div>' +
      '<p class="about" style="font-size:15px;color:var(--text-muted)">Dein Standort bleibt auf deinem Handy und wird nicht gesendet. Die Karte kommt von OpenFreeMap, Kartendaten © OpenStreetMap.</p>' +
      '<div class="row" style="margin-top:10px"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-go>Los geht’s</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = () => { j.ok = true; L.save(); L.closeSheet(); setTimeout(start, 80); };
    });
  }

  /* ---------- Karte ---------- */
  let fastN = 0, root = null, map = null, watchId = null, me = null, meMarker = null, markers = {}, spawns = {}, lastFix = null, fast = false, timer = null, follow = true;
  async function start() {
    css(); C('jagd_open');
    root = document.createElement('div'); root.className = 'jagd'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Falterjagd');
    root.innerHTML = '<div class="jg-map"></div><div class="jg-top"><button type="button" class="jg-x" aria-label="Schließen">✕</button><span class="jg-info">📍 Suche deinen Standort …</span><button type="button" class="jg-book" aria-label="Fangliste">📖</button></div>' +
      '<button type="button" class="jg-me" aria-label="Zu mir">◎</button><div class="jg-hint"></div>';
    document.body.appendChild(root); document.documentElement.classList.add('cam-open', 'jagd-open');
    root.querySelector('.jg-x').onclick = stop;
    root.querySelector('.jg-book').onclick = () => { if (X() && X().book) X().book(); };
    root.querySelector('.jg-me').onclick = () => { follow = true; if (me && map) map.easeTo({ center: [me.lon, me.lat], zoom: 17, duration: 600 }); };
    try { await loadML(); } catch (e) { info('Die Karte konnte nicht geladen werden. Bitte mit Internet erneut öffnen.'); return; }
    if (!root) return;
    const ml = window.maplibregl;
    map = new ml.Map({ container: root.querySelector('.jg-map'), style: STYLE, center: [7.1, 50.7], zoom: 15, pitch: 45, attributionControl: { compact: true } });
    map.on('dragstart', () => { follow = false; });
    map.on('idle', classify); map.on('moveend', classify);
    if (sim) { gotFix(sim); return; }
    if (!('geolocation' in navigator)) { info('Dieses Handy gibt keinen Standort heraus.'); return; }
    watchId = navigator.geolocation.watchPosition((p) => gotFix({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, speed: p.coords.speed, t: Date.now() }),
      (e) => info(e.code === 1 ? 'Ohne Standort geht die Falterjagd nicht. Bitte in den Einstellungen erlauben.' : 'Standort gerade nicht verfügbar …'), { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 });
    timer = setInterval(refresh, 20000);
  }
  function info(t) { const el = root && root.querySelector('.jg-info'); if (el) el.textContent = t; }
  function hint(t) { const el = root && root.querySelector('.jg-hint'); if (el) { el.textContent = t || ''; el.classList.toggle('on', !!t); } }
  function gotFix(f) {
    if (!map) return;
    /* Tempo: aus dem Gerät oder aus zwei Messungen */
    /* GPS springt manchmal: erst zwei schnelle Messungen hintereinander zählen, und nur bei genauem Standort */
    let sp = typeof f.speed === 'number' && f.speed >= 0 ? f.speed : null;
    if (sp == null && lastFix && f.t - lastFix.t > 2500 && (f.acc || 99) < 40 && (lastFix.acc || 99) < 40) sp = dist(lastFix, f) / ((f.t - lastFix.t) / 1000);
    if (sp != null) { fastN = sp > FAST ? fastN + 1 : 0; fast = fastN >= 2; }
    lastFix = f; me = f;
    if (!meMarker) {
      const el = document.createElement('div'); el.className = 'jg-meicon'; el.innerHTML = '<i></i>' + img(8, 'tiny');
      meMarker = new window.maplibregl.Marker({ element: el }).setLngLat([f.lon, f.lat]).addTo(map);
      map.jumpTo({ center: [f.lon, f.lat], zoom: 17 });
    } else meMarker.setLngLat([f.lon, f.lat]);
    if (follow) map.easeTo({ center: [f.lon, f.lat], duration: 800 });
    refresh();
  }
  function refresh() {
    if (!me || !map) return;
    const win = Math.floor(Date.now() / WIN), want = {};
    if (!fast) cellsAround(me.lat, me.lon, 2).forEach((c) => spawnsIn(c, win).forEach((s) => { if (!st().got[s.id]) want[s.id] = s; }));
    Object.keys(markers).forEach((id) => { if (!want[id]) { markers[id].remove(); delete markers[id]; delete spawns[id]; } });
    Object.keys(want).forEach((id) => { if (!spawns[id]) spawns[id] = want[id]; });
    classify();
    const near = Object.values(spawns).filter((s) => s.i != null && !s.skip);
    info(fast ? '🚗 Zu schnell unterwegs – Falter zeigen sich nur zu Fuß' : near.length ? '🦋 ' + near.length + ' Falter in der Nähe' + (me.acc > 60 ? ' · Standort ungenau' : '') : '🌿 Gerade keine Falter in der Nähe – geh ein Stück weiter');
    let closest = null; near.forEach((s) => { const d = dist(me, s); if (!closest || d < closest.d) closest = { s, d }; });
    hint(!fast && closest ? (closest.d <= RANGE ? 'Ein Falter ist ganz nah – antippen zum Fangen!' : 'Nächster Falter: ' + Math.round(closest.d) + ' m') : '');
    Object.values(markers).forEach((m) => { const s = m._sf; m.getElement().classList.toggle('near', dist(me, s) <= RANGE); });
  }
  /* Lebensraum am Ort des Falters aus den gezeichneten Kartenebenen lesen */
  function classify() {
    if (!map || !map.isStyleLoaded() || (map.areTilesLoaded && !map.areTilesLoaded())) return; // erst lesen, wenn die Karte ganz da ist
    Object.values(spawns).forEach((s) => {
      if (s.i != null || s.skip) return;
      const p = map.project([s.lon, s.lat]), cv = map.getCanvas();
      if (p.x < 0 || p.y < 0 || p.x > cv.clientWidth || p.y > cv.clientHeight) return;
      const feats = map.queryRenderedFeatures([p.x, p.y]);
      if (feats.some((f) => /^(road|bridge)_(motorway|trunk|primary|secondary|link|minor|service)/.test(f.layer.id))) { s.skip = true; return; } // nicht auf Straßen
      /* nicht in Gebäuden: Grundriss genau prüfen (in der Schrägansicht verdecken hohe Häuser sonst den Boden) */
      if (feats.some((f) => /^building/.test(f.layer.id) && inPoly([s.lon, s.lat], f.geometry))) { s.skip = true; return; }
      const habs = feats.map((f) => LAYER_HAB[f.layer.id]).filter(Boolean);
      if (habs.indexOf('water') >= 0) { s.skip = true; return; } // nicht mitten auf dem Wasser – da kommt niemand hin
      /* Wasser in der Nähe (ca. 30 m)? Dann ist es ein Uferfalter */
      const mpp = 40075016 * Math.cos(s.lat * Math.PI / 180) / (512 * Math.pow(2, map.getZoom())), off = Math.min(60, 30 / mpp);
      const shore = [[off, 0], [-off, 0], [0, off], [0, -off]].some(([dx, dy]) => map.queryRenderedFeatures([p.x + dx, p.y + dy]).some((f) => f.layer.id === 'water'));
      let hab = 'open'; for (const h of PRIO) if (habs.indexOf(h) >= 0) { hab = h; break; }
      if (shore && (hab === 'open' || hab === 'grass' || hab === 'park')) hab = 'water';
      s.hab = hab; s.i = pick(hab, s); addMarker(s);
    });
    refresh2();
  }
  let r2 = 0; function refresh2() { clearTimeout(r2); r2 = setTimeout(() => { if (me) { const near = Object.values(spawns).filter((s) => s.i != null && !s.skip); if (!fast) info(near.length ? '🦋 ' + near.length + ' Falter in der Nähe' : '🌿 Gerade keine Falter in der Nähe – geh ein Stück weiter'); } }, 200); }
  function addMarker(s) {
    if (markers[s.id] || fast) return;
    const el = document.createElement('button'); el.type = 'button'; el.className = 'jg-bf' + (s.i >= 6 ? ' rare' : ''); el.setAttribute('aria-label', 'Falter');
    el.innerHTML = img(s.i, 'mk') + '<i class="jg-sh"></i>';
    el.style.setProperty('--d', (s.r3 * 2).toFixed(2) + 's');
    el.onclick = (e) => { e.stopPropagation(); const d = me ? dist(me, s) : 1e9; if (d > RANGE) { L.toast('Noch ' + Math.round(d - RANGE + 5) + ' m näher ran – dann klappt’s'); return; } catchScreen(s); };
    const m = new window.maplibregl.Marker({ element: el }).setLngLat([s.lon, s.lat]).addTo(map); m._sf = s; markers[s.id] = m;
    if (me) el.classList.toggle('near', dist(me, s) <= RANGE);
  }
  function stop() {
    if (watchId != null) { try { navigator.geolocation.clearWatch(watchId); } catch (e) {} watchId = null; }
    clearInterval(timer); timer = null;
    if (map) { try { map.remove(); } catch (e) {} map = null; }
    markers = {}; spawns = {}; meMarker = null; me = null; lastFix = null; fast = false; fastN = 0; follow = true;
    if (root) { root.remove(); root = null; }
    document.documentElement.classList.remove('jagd-open');
    if (!document.querySelector('.jagd-fang')) document.documentElement.classList.remove('cam-open');
  }

  /* ---------- Fangen ---------- */
  let fang = null;
  async function catchScreen(s) {
    const f = falter(s.i), need = HITS[s.i] || 1;
    const el = document.createElement('div'); el.className = 'jagd-fang';
    el.innerHTML = '<video playsinline muted autoplay></video><div class="jf-bg"></div><canvas class="jf-net"></canvas><div class="jf-bf">' + img(s.i, 'fly') + '</div>' +
      '<div class="jf-top"><button type="button" class="jf-x" aria-label="Aufgeben">✕</button><span class="jf-name">' + esc(f.name) + ' <small>' + esc(f.rar) + '</small></span><span class="jf-hits"></span></div>' +
      '<div class="jf-tip">Schwing das Netz: mit dem Finger über den Falter wischen</div>';
    document.body.appendChild(el);
    const v = el.querySelector('video'), cv = el.querySelector('.jf-net'), bf = el.querySelector('.jf-bf'), ctx = cv.getContext('2d');
    let stream = null; try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); v.srcObject = stream; el.classList.add('cam'); } catch (e) { /* ohne Kamera: Wiese als Hintergrund */ }
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
      if (!ok) { L.toast('🦋 Weggeflattert … vielleicht beim nächsten Mal'); C('jagd_miss:' + s.i); return; }
      st().got[s.id] = 1; const rec = { i: s.i, hab: s.hab || 'open', at: Date.now() }; st().caught.push(rec); L.save(); C('jagd_catch:' + s.i);
      if (markers[s.id]) { markers[s.id].remove(); delete markers[s.id]; } delete spawns[s.id]; refresh();
      if (X() && X().feed) X().feed('jagd', 1);
      caughtSheet(rec);
    }
    el.querySelector('.jf-x').onclick = () => end(false);
    fang = { close, end };
  }
  function caughtSheet(rec) {
    const f = falter(rec.i), where = (HAB[rec.hab] || HAB.open).t;
    L.spawnHearts(14);
    L.openSheet('<div class="bfly-party"><div class="fx-hero">' + img(rec.i, 'big') + '</div><h3>Gefangen!</h3><p class="fx-name">' + esc(f.name) + ' <span class="fx-rar">' + esc(f.rar) + '</span></p><p class="about" style="margin:6px 0 4px">Gefunden ' + esc(where) + '.</p><p class="about" style="font-size:16px;color:var(--text-soft);margin-bottom:14px">' + esc(f.fact) + '</p>' +
      '<div class="row wrap" style="justify-content:center">' + (on() ? '<button class="pill-btn primary" data-gift>💌 Für ' + esc(you()) + ' gefangen</button>' : '') + '<button class="pill-btn" data-share>🖼️ Teilen</button><button class="pill-btn ghost" data-ok>Weiter jagen</button></div></div>', (sh) => {
      sh.querySelector('[data-ok]').onclick = L.closeSheet;
      sh.querySelector('[data-share]').onclick = () => { L.closeSheet(); if (X()) X().shareCard({ text: 'Gerade gefangen: ' + f.name + ' ' + where + ' 🦋', label: 'Falterjagd', sig: S().sender }); };
      const g = sh.querySelector('[data-gift]'); if (g) g.onclick = async () => {
        g.disabled = true; try { await P().send({ t: 'falter', i: rec.i, hab: rec.hab, text: f.name }); rec.gift = 1; L.save(); g.textContent = '✓ Unterwegs zu ' + you(); L.toast('💌 ' + f.name + ' fliegt zu ' + you()); C('jagd_gift'); } catch (e) { g.disabled = false; L.toast('Senden fehlgeschlagen'); }
      };
    });
  }

  /* ---------- Vom Schatz gefangen ---------- */
  if (P()) {
    P().on('falter', (obj, created) => {
      const i = Math.max(0, Math.min(8, Number(obj.i) | 0)), hab = HAB[obj.hab] ? obj.hab : 'open';
      st().caught.push({ i, hab, at: created || Date.now(), from: you() });
      const s = S(); if (!s.inbox) s.inbox = []; s.inbox.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: 'falter', fi: i, hab, text: falter(i).name, at: created || Date.now(), read: false });
      L.toast('🦋 ' + you() + ' hat einen Falter für dich gefangen'); L.haptic && L.haptic(20); return true;
    });
    P().inboxType('falter', { icon: '🦋', meta: 'Für dich gefangen – antippen', html: (m) => img(m.fi || 0, 'inbox'), open: (m) => {
      const f = falter(m.fi || 0); css();
      L.openSheet('<div class="bfly-party"><div class="fx-hero">' + img(m.fi || 0, 'big') + '</div><h3>Für dich gefangen</h3><p class="fx-name">' + esc(f.name) + ' <span class="fx-rar">' + esc(f.rar) + '</span></p><p class="about" style="margin:6px 0 14px">' + esc(you()) + ' hat ihn ' + esc((HAB[m.hab] || HAB.open).t) + ' gefunden und dir geschickt. Er ist jetzt in deinem Schmetterlingsbuch.</p>' +
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
    s.textContent = '.jagd{position:fixed;inset:0;z-index:8800;background:#dfe9d8}.jagd .jg-map{position:absolute !important;inset:0;width:100%;height:100%}' +
      '.jg-top{position:absolute;left:10px;right:10px;top:calc(10px + env(safe-area-inset-top));display:flex;align-items:center;gap:8px;z-index:2}' +
      '.jg-top button,.jg-me{width:46px;height:46px;border-radius:23px;border:0;background:rgba(40,20,60,.75);color:#fff;font-size:19px;flex:none;box-shadow:0 4px 14px rgba(0,0,0,.3)}' +
      '.jg-info{flex:1;min-width:0;text-align:center;background:rgba(40,20,60,.75);color:#fff;border-radius:16px;padding:9px 12px;font:700 15px Lato,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3)}' +
      '.jg-me{position:absolute;right:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:2}' +
      '.jg-hint{position:absolute;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);background:rgba(40,20,60,.82);color:#fff;font:700 16px Lato,sans-serif;padding:10px 16px;border-radius:18px;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap;z-index:2}.jg-hint.on{opacity:1}' +
      '.jg-meicon{position:relative;width:52px;height:52px}.jg-meicon i{position:absolute;inset:-14px;border-radius:50%;background:rgba(232,70,124,.25);border:2px solid rgba(232,70,124,.6);animation:jgPulse 2s ease-out infinite}' +
      '.jg-meicon .fx-img{position:absolute;left:0;top:0;width:52px}@keyframes jgPulse{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.4);opacity:0}}' +
      '.jg-bf{width:56px;height:56px;border:0;background:none;padding:0;position:relative;animation:jgBob 2.4s ease-in-out infinite;animation-delay:var(--d,0s);filter:saturate(.9)}' +
      '.jg-bf .fx-img{width:56px;animation:jgFlap .5s ease-in-out infinite alternate}.jg-bf .jg-sh{position:absolute;left:12px;right:12px;bottom:-6px;height:8px;border-radius:50%;background:rgba(0,0,0,.25);filter:blur(2px)}' +
      '.jg-bf.near{filter:drop-shadow(0 0 10px #fff) saturate(1.2)}.jg-bf.near::after{content:"";position:absolute;inset:-10px;border-radius:50%;border:2px dashed rgba(255,255,255,.9);animation:jgPulse 1.6s ease-out infinite}' +
      '.jg-bf.rare .fx-img{filter:drop-shadow(0 0 8px #ffe38a)}' +
      '@keyframes jgBob{50%{transform:translateY(-8px)}}@keyframes jgFlap{from{transform:scaleX(1)}to{transform:scaleX(.55)}}' +
      '.jagd-fang{position:fixed;inset:0;z-index:8900;background:#1d3a24;overflow:hidden;touch-action:none}.jagd-fang video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}.jagd-fang.cam video{display:block}' +
      '.jf-bg{position:absolute;inset:0;background:linear-gradient(180deg,#9fd3f0 0%,#cfe9c8 45%,#6fae4e 46%,#3f7d34 100%)}.jagd-fang.cam .jf-bg{display:none}' +
      '.jf-net{position:absolute;inset:0;z-index:3}.jf-bf{position:absolute;left:0;top:0;width:120px;height:120px;z-index:2;pointer-events:none}.jf-bf .fx-img{width:120px;animation:jgFlap .22s ease-in-out infinite alternate}' +
      '.jf-bf.hit .fx-img{filter:brightness(1.8) drop-shadow(0 0 12px #fff)}' +
      '.jf-top{position:absolute;left:10px;right:10px;top:calc(10px + env(safe-area-inset-top));display:flex;align-items:center;gap:8px;z-index:4}' +
      '.jf-x{width:46px;height:46px;border-radius:23px;border:0;background:rgba(40,20,60,.7);color:#fff;font-size:19px}.jf-name{flex:1;text-align:center;color:#fff;font:400 22px var(--serif,serif);text-shadow:0 2px 6px rgba(0,0,0,.6)}.jf-name small{display:block;font:700 12px Lato,sans-serif;letter-spacing:.5px;text-transform:uppercase;opacity:.9}' +
      '.jf-hits{min-width:46px;color:#fff;font:700 16px Lato,sans-serif;text-shadow:0 2px 6px rgba(0,0,0,.6)}' +
      '.jf-tip{position:absolute;left:0;right:0;bottom:calc(30px + env(safe-area-inset-bottom));text-align:center;color:#fff;font:700 16px Lato,sans-serif;text-shadow:0 2px 6px rgba(0,0,0,.7);z-index:4;pointer-events:none}' +
      '.jg-safe{background:rgba(242,193,78,.12);border:1px solid rgba(242,193,78,.4);border-radius:14px;padding:10px 12px;margin:6px 0 10px;font-size:16px}.jg-safe ul{margin:6px 0 0 18px;padding:0}.jg-safe li{margin:2px 0}' +
      '.fx-img.inbox{width:44px;float:right;margin-left:8px}.fx-img.tiny{width:52px}' +
      /* Fenster, Hinweise und Herzen über der Karte zeigen */
      'html.jagd-open #modal{z-index:9500}html.jagd-open .toast,html.jagd-open #toast{z-index:9600}html.jagd-open .floating-hearts{z-index:9550}';
    document.head.appendChild(s);
  }

  /* Test ohne Spaziergang: LZJ.sim(lat, lon) setzt einen festen Standort */
  let sim = null;
  window.LZJ = { open, start, stop, counts, sim: (lat, lon) => { sim = { lat, lon, acc: 10, t: Date.now() }; if (map) gotFix(sim); }, move: (lat, lon) => { if (map) gotFix({ lat, lon, acc: 10, t: Date.now() }); }, teleport: (lat, lon) => { lastFix = null; fastN = 0; fast = false; if (map) gotFix({ lat, lon, acc: 10, t: Date.now() }); }, _spawns: () => spawns, catchAt: (id) => spawns[id] && catchScreen(spawns[id]), fang: () => fang, HAB };
})();
