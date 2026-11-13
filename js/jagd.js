/* Schmetterlingsfutter – Falterjagd draußen (LZJ, 3.33.0; 3.35.0: Raum-AR „Im Raum fangen“ über js/raum.js, Falterspaziergang zu zweit)
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
    const j = st(); if (j.walk && Date.now() - j.walk.t > 4 * 3600e3) { j.walk = null; L.save(); }
    if (j.walk && j.walk.n < j.walk.goal) { setTimeout(start, 30); return; } /* laufender Spaziergang: direkt weiter */
    L.openSheet('<h3>🕸️ Falterjagd draußen</h3><p class="about" style="font-size:17px;margin-bottom:8px">Geh raus und finde echte Falterarten: im Wald andere als auf der Wiese, am Wasser andere als in den Gärten. Seltene tauchen nur selten auf. Fang sie mit der Kamera und schick sie ' + (on() ? esc(you()) : 'deinem Schatz') + '.</p>' +
      '<div class="jg-safe"><b>Bitte achte unterwegs auf dich:</b><ul><li>Schau auf den Weg und den Verkehr, nicht nur aufs Handy.</li><li>Betritt keine Privatgrundstücke oder gesperrten Flächen.</li><li>Beim Auto- oder Radfahren erscheinen keine Falter.</li></ul></div>' +
      '<p class="about" style="font-size:15px;color:var(--text-muted)">Dein Standort bleibt auf deinem Handy und wird nicht gesendet. Die Karte kommt von OpenFreeMap, Kartendaten © OpenStreetMap.</p>' +
      '<div class="jg-walkcard"><b>💞 Zu zweit unterwegs?</b><span>Macht einen Falterspaziergang: drei Falter zusammen finden – danach ein kleiner Moment nur für euch.</span><button class="pill-btn primary" data-walk>Zusammen losgehen</button></div>' +
      '<div class="row" style="margin-top:10px"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn" data-go>Allein los</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = () => { j.ok = true; j.walk = null; L.save(); L.closeSheet(); setTimeout(start, 80); };
      sh.querySelector('[data-walk]').onclick = () => { j.ok = true; j.walk = { n: 0, goal: 3, t: Date.now(), list: [] }; L.save(); C('jagd_walk'); L.closeSheet(); setTimeout(start, 80); };
    });
  }

  /* ---------- Karte ---------- */
  let fastN = 0, root = null, map = null, watchId = null, me = null, meMarker = null, markers = {}, spawns = {}, lastFix = null, fast = false, timer = null, follow = true;
  async function start() {
    css(); C('jagd_open');
    root = document.createElement('div'); root.className = 'jagd'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Falterjagd');
    root.innerHTML = '<div class="jg-map"></div><div class="jg-top"><button type="button" class="jg-x" aria-label="Schließen">✕</button><span class="jg-info">📍 Suche deinen Standort …</span><button type="button" class="jg-book" aria-label="Fangliste">📖</button></div>' +
      '<button type="button" class="jg-me" aria-label="Zu mir">◎</button><div class="jg-hint"></div>' +
      '<div class="jg-ar"><video playsinline muted autoplay></video><div class="jg-arbg"></div><div class="jg-sprites"></div><canvas class="jg-radar" width="240" height="240" aria-hidden="true"></canvas>' +
      '<div class="jg-artip">📍 Suche deinen Standort …</div><div class="jg-arbar"><button type="button" class="jg-xrbtn" hidden>✨ Falter in 3D</button><button type="button" class="jg-mapbtn">🗺️ Karte</button></div></div>' +
      '<button type="button" class="jg-camback">📷 Zurück zur Kamera</button><button type="button" class="jg-walk" hidden></button>';
    document.body.appendChild(root); document.documentElement.classList.add('cam-open', 'jagd-open');
    root.querySelector('.jg-x').onclick = stop;
    root.querySelector('.jg-book').onclick = () => { if (X() && X().book) X().book(); };
    walkChip(); root.querySelector('.jg-walk').onclick = walkMenu;
    root.querySelector('.jg-me').onclick = () => { follow = true; if (me && map) map.easeTo({ center: [me.lon, me.lat], zoom: 17, duration: 600 }); };
    root.querySelector('.jg-mapbtn').onclick = () => showMap(true);
    root.querySelector('.jg-camback').onclick = () => showMap(false);
    root.querySelector('.jg-xrbtn').onclick = xrStart;
    arInit();
    try { await loadML(); } catch (e) { info('Die Karte konnte nicht geladen werden. Bitte mit Internet erneut öffnen.'); return; }
    if (!root) return;
    const ml = window.maplibregl;
    map = new ml.Map({ container: root.querySelector('.jg-map'), style: STYLE, center: [7.1, 50.7], zoom: 16, minZoom: 14, pitch: 30, attributionControl: { compact: true } });
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
      map.jumpTo({ center: [f.lon, f.lat], zoom: 16 }); root && root.classList.add('fix');
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
    arStop();
    if (watchId != null) { try { navigator.geolocation.clearWatch(watchId); } catch (e) {} watchId = null; }
    clearInterval(timer); timer = null;
    if (map) { try { map.remove(); } catch (e) {} map = null; }
    markers = {}; spawns = {}; meMarker = null; me = null; lastFix = null; fast = false; fastN = 0; follow = true;
    if (root) { root.remove(); root = null; }
    if (A() && A().compassOff) A().compassOff(); /* 3.39.1: Kompass-Sensor aus */
    document.documentElement.classList.remove('jagd-open');
    if (!document.querySelector('.jagd-fang')) document.documentElement.classList.remove('cam-open');
  }

  /* ---------- Fangen ---------- */
  let fang = null;
  function recordCatch(s) {
    st().got[s.id] = 1; const rec = { i: s.i, hab: s.hab || 'open', at: Date.now() }; st().caught.push(rec); L.save(); C('jagd_catch:' + s.i);
    if (markers[s.id]) { markers[s.id].remove(); delete markers[s.id]; } delete spawns[s.id]; refresh();
    if (X() && X().feed) X().feed('jagd', 1);
    const w = st().walk; if (w && w.n < w.goal) { w.n++; w.list.push(s.i); L.save(); walkChip(); }
    return { rec, walkDone: !!(w && w.n >= w.goal) };
  }
  async function catchScreen(s, opts) {
    if (!opts) arPause();
    const f = falter(s.i), need = HITS[s.i] || 1, A = window.LZA, canAR = !!(A && A.ready());
    if (canAR) A.preload();
    const el = document.createElement('div'); el.className = 'jagd-fang';
    el.innerHTML = '<video playsinline muted autoplay></video><div class="jf-bg"></div><canvas class="jf-net"></canvas><div class="jf-bf">' + img(s.i, 'fly') + '</div>' +
      '<div class="jf-top"><button type="button" class="jf-x" aria-label="Aufgeben">✕</button><span class="jf-name">' + esc(f.name) + ' <small>' + esc(f.rar) + '</small></span><span class="jf-hits"></span></div>' +
      '<div class="jf-tip">Schwing das Netz: mit dem Finger über den Falter wischen</div>' + (canAR ? '<button type="button" class="jf-ar">✨ Im Raum fangen</button>' : '');
    document.body.appendChild(el);
    const v = el.querySelector('video'), cv = el.querySelector('.jf-net'), bf = el.querySelector('.jf-bf'), ctx = cv.getContext('2d');
    /* 3.39.1 (Codex-Prüfung): ✕ und Zurück-Taste wirken schon während der Kamerafreigabe */
    let stream = null, gone = false; el.querySelector('.jf-x').onclick = () => { gone = true; el.style.display = 'none'; };
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); if (!gone) { v.srcObject = stream; el.classList.add('cam'); } } catch (e) { /* ohne Kamera: Wiese als Hintergrund */ }
    if (gone) { if (stream) stream.getTracks().forEach((t) => t.stop()); el.remove(); if (!root) document.documentElement.classList.remove('cam-open'); else setTimeout(arResume, 120); if (opts && opts.done) opts.done(false); return; }
    const W = () => el.clientWidth, H = () => el.clientHeight; cv.width = W(); cv.height = H();
    let x = W() / 2, y = H() * 0.42, tx = x, ty = y, hits = 0, speed = 0.9 + s.i * 0.12, dead = false, trail = [], raf = 0, t0 = performance.now();
    const hitsEl = el.querySelector('.jf-hits'); const drawHits = () => { hitsEl.textContent = need > 1 ? '🕸️ ' + hits + '/' + need : ''; }; drawHits();
    let arOn = false;
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
      if (!arOn && now - t0 > 30000) end(false);
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
    function close() { dead = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((t) => t.stop()); el.remove(); fang = null; if (!root) document.documentElement.classList.remove('cam-open'); else setTimeout(arResume, 120); }
    function end(ok) {
      if (dead) return; close();
      if (opts && opts.done) { C((ok ? 'besuch_catch:' : 'besuch_miss:') + s.i); opts.done(ok); return; }
      if (!ok) { L.toast('🦋 Weggeflattert … vielleicht beim nächsten Mal'); C('jagd_miss:' + s.i); return; }
      const r = recordCatch(s); caughtSheet(r.rec, r.walkDone);
    }
    el.querySelector('.jf-x').onclick = () => end(false);
    const arB = el.querySelector('.jf-ar'); if (arB) arB.onclick = async () => {
      /* Raum-AR: Kamera hier freigeben, 3D-Falter im Raum; danach zurück in denselben Ablauf */
      arOn = true; cancelAnimationFrame(raf); if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; el.classList.remove('cam'); }
      el.style.visibility = 'hidden'; C('jagd_ar');
      let started = false; try { started = await A.start({ list: [s.i], title: f.name, sub: 'Der Falter flattert jetzt um dich herum. Dreh dich langsam und tippe auf ihn, wenn er nah ist.', onEnd: (n) => { el.style.visibility = ''; end(n > 0); } }); } catch (e) { started = false; }
      if (!started) { el.style.visibility = ''; arB.remove(); arOn = false; t0 = performance.now(); raf = requestAnimationFrame(frame); L.toast('Raum-AR ließ sich nicht starten – fang ihn hier mit dem Netz'); }
    };
    fang = { close, end };
  }
  function caughtSheet(rec, walkDone) {
    const f = falter(rec.i), where = (HAB[rec.hab] || HAB.open).t;
    L.spawnHearts(14);
    L.openSheet('<div class="bfly-party"><div class="fx-hero">' + img(rec.i, 'big') + '</div><h3>Gefangen!</h3><p class="fx-name">' + esc(f.name) + ' <span class="fx-rar">' + esc(f.rar) + '</span></p><p class="about" style="margin:6px 0 4px">Gefunden ' + esc(where) + '.</p><p class="about" style="font-size:16px;color:var(--text-soft);margin-bottom:14px">' + esc(f.fact) + '</p>' + (window.LZWI ? window.LZWI.moreRow(rec.i) + window.LZWI.hint() : '') +
      (walkDone ? '<div class="row" style="justify-content:center;margin-bottom:8px"><button class="pill-btn primary" data-walkend>💞 Spaziergang abschließen</button></div>' : '') +
      '<div class="row wrap" style="justify-content:center">' + (on() && !walkDone ? '<button class="pill-btn primary" data-gift>💌 Für ' + esc(you()) + ' gefangen</button>' : on() ? '<button class="pill-btn" data-gift>💌 Für ' + esc(you()) + ' gefangen</button>' : '') + '<button class="pill-btn" data-share>🖼️ Teilen</button><button class="pill-btn ghost" data-ok>Weiter jagen</button></div></div>', (sh) => {
      sh.querySelector('[data-ok]').onclick = L.closeSheet;
      const we = sh.querySelector('[data-walkend]'); if (we) we.onclick = () => { L.closeSheet(); setTimeout(walkEnd, 80); };
      sh.querySelector('[data-share]').onclick = () => { L.closeSheet(); if (X()) X().shareCard({ text: 'Gerade gefangen: ' + f.name + ' ' + where + ' 🦋', label: 'Falterjagd', sig: S().sender }); };
      const g = sh.querySelector('[data-gift]'); if (g) g.onclick = async () => {
        g.disabled = true; try { await P().send({ t: 'falter', i: rec.i, hab: rec.hab, text: f.name }); rec.gift = 1; L.save(); g.textContent = '✓ Unterwegs zu ' + you(); L.toast('💌 ' + f.name + ' fliegt zu ' + you()); C('jagd_gift'); } catch (e) { g.disabled = false; L.toast('Senden fehlgeschlagen'); }
      };
    });
  }

  /* ---------- AR zuerst: Kamera + Kompass + Radar ----------
     Die Falter der Umgebung erscheinen im Kamerabild in ihrer Himmelsrichtung (Kompass des Handys).
     Bis 45 m flattern sie groß im Bild und lassen sich fangen, weiter weg leuchten sie klein. Die Karte ist nur Nebenansicht.
     Auf Handys mit Raum-AR (z. B. Galaxy S23) gibt es „Falter in 3D“: dieselben Falter als echte 3D-Falter um dich herum. */
  const AR_MAX = 150, HFOV = 62;
  const A = () => window.LZA;
  let ar = null;
  const bearingTo = (a, b) => { const d = Math.PI / 180, y = Math.sin((b.lon - a.lon) * d) * Math.cos(b.lat * d), x = Math.cos(a.lat * d) * Math.sin(b.lat * d) - Math.sin(a.lat * d) * Math.cos(b.lat * d) * Math.cos((b.lon - a.lon) * d); return (Math.atan2(y, x) / d + 360) % 360; };
  const rel = (d) => ((d % 360) + 540) % 360 - 180;
  const sideOf = (d) => { d = rel(d); return Math.abs(d) < 25 ? 'vor dir' : Math.abs(d) > 150 ? 'hinter dir' : d < 0 ? 'links von dir' : 'rechts von dir'; };
  function arTargets(guess) {
    if (!me || fast) return [];
    return Object.values(spawns).filter((s) => !s.skip && !st().got[s.id]).map((s) => {
      if (s.i == null) { if (!guess) return null; s.hab = s.hab || 'open'; s.i = pick('open', s); s.guess = 1; }
      const d = dist(me, s); return d > AR_MAX ? null : { s, key: s.id, i: s.i, dist: d, bearing: bearingTo(me, s), near: d <= RANGE };
    }).filter(Boolean).sort((a, b) => a.dist - b.dist);
  }
  function arInit() {
    if (!root) return; const lay = root.querySelector('.jg-ar'); if (!lay) return;
    ar = { lay, v: lay.querySelector('video'), spr: lay.querySelector('.jg-sprites'), rc: lay.querySelector('.jg-radar'), tip: lay.querySelector('.jg-artip'), stream: null, raf: 0, els: {}, paused: false };
    if (A()) { A().compassOn(); A().supported().then((v) => { const b = root && root.querySelector('.jg-xrbtn'); if (b) b.hidden = !v; if (v) A().preload(); }); }
    arCam(); ar.raf = requestAnimationFrame(arTick);
  }
  async function arCam() {
    if (!ar || ar.stream || ar.paused) return;
    const me0 = ar; let st0 = null;
    try { st0 = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); } catch (e) { if (ar) ar.lay.classList.remove('cam'); return; }
    if (!ar || ar !== me0 || ar.paused || ar.stream) { st0.getTracks().forEach((t) => t.stop()); return; } /* 3.38.2: inzwischen geschlossen → Kamera sofort aus (Codex-Prüfung) */
    ar.stream = st0; ar.v.srcObject = st0; ar.lay.classList.add('cam');
  }
  function arPause() { if (!ar) return; ar.paused = true; if (ar.stream) { ar.stream.getTracks().forEach((t) => t.stop()); ar.stream = null; } ar.lay.classList.remove('cam'); }
  function arResume() { if (!ar || !root || document.querySelector('.jagd-fang') || document.querySelector('.raum-ov')) return; ar.paused = false; if (!root.classList.contains('show-map')) arCam(); }
  /* 3.39.0 (Codex-Prüfung): App im Hintergrund → Kamera aus, beim Zurückkommen wieder an */
  document.addEventListener('visibilitychange', () => { if (!ar) return; if (document.hidden) { const p = ar.paused; arPause(); ar.paused = p; } else if (!ar.paused) { ar.paused = true; arResume(); } });
  function arStop() { if (!ar) return; cancelAnimationFrame(ar.raf); arPause(); ar = null; }
  function showMap(on) {
    if (!root) return; root.classList.toggle('show-map', on);
    if (on) { arPause(); if (map) { map.resize(); if (me) map.jumpTo({ center: [me.lon, me.lat], zoom: 17 }); } C('jagd_map'); }
    else { if (ar) ar.paused = false; arCam(); }
  }
  let arLast = 0;
  function arTick(now) {
    if (!ar) return; ar.raf = requestAnimationFrame(arTick);
    if (now - arLast < 33) return; arLast = now;
    if (!root || root.classList.contains('show-map')) return;
    const W = ar.lay.clientWidth, H = ar.lay.clientHeight, hd = A() ? A().heading() : null, list = arTargets(false), seen = {};
    list.forEach((t, k) => {
      seen[t.key] = 1; let el = ar.els[t.key];
      if (!el) { el = document.createElement('button'); el.type = 'button'; el.className = 'jg-sp' + (t.i >= 7 ? ' rare' : ''); el.innerHTML = img(t.i, 'fly'); el.setAttribute('aria-label', falter(t.i).name); el.onclick = () => { const s = spawns[t.key]; if (!s || !me) return; const d = dist(me, s); if (d > RANGE) { L.toast(falter(s.i).name + ': noch ' + Math.round(d) + ' m – geh in diese Richtung'); return; } catchScreen(s); }; ar.spr.appendChild(el); ar.els[t.key] = el; }
      /* Richtung im Bild: mit Kompass echt, ohne Kompass nahe Falter in der Mitte, ferne verteilt */
      const r = hd != null ? rel(t.bearing - hd) : t.near ? (k % 3 - 1) * 12 : (k % 5 - 2) * 18;
      const vis = Math.abs(r) < HFOV / 2 + 8; el.style.display = vis ? '' : 'none'; if (!vis) return;
      const size = t.near ? 120 : Math.max(34, 120 * Math.min(1, 30 / t.dist)), bob = Math.sin(now / 380 + k) * (t.near ? 14 : 5);
      const x = W / 2 + (r / HFOV) * W - size / 2, y = (t.near ? H * 0.46 : H * 0.34 - Math.min(60, t.dist / 3)) + bob - size / 2;
      el.style.width = el.style.height = size + 'px'; el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; el.classList.toggle('near', t.near);
    });
    Object.keys(ar.els).forEach((k) => { if (!seen[k]) { ar.els[k].remove(); delete ar.els[k]; } });
    /* Radar und Hinweis */
    const rx = ar.rc.getContext('2d'), RW = 240, RR = 104; rx.clearRect(0, 0, RW, RW);
    rx.fillStyle = 'rgba(20,8,26,.55)'; rx.beginPath(); rx.arc(RW / 2, RW / 2, RR + 12, 0, 7); rx.fill();
    rx.strokeStyle = 'rgba(255,255,255,.35)'; rx.lineWidth = 2; [RR, RR * 0.3].forEach((q) => { rx.beginPath(); rx.arc(RW / 2, RW / 2, q, 0, 7); rx.stroke(); });
    if (hd != null) { rx.fillStyle = 'rgba(255,255,255,.18)'; rx.beginPath(); rx.moveTo(RW / 2, RW / 2); rx.arc(RW / 2, RW / 2, RR, -Math.PI / 2 - 0.54, -Math.PI / 2 + 0.54); rx.fill(); }
    list.forEach((t) => { const a = ((hd != null ? t.bearing - hd : t.bearing) * Math.PI) / 180, q = Math.min(1, t.dist / AR_MAX) * RR; rx.fillStyle = t.near ? '#ff7eb6' : t.i >= 7 ? '#ffd76a' : '#fff'; rx.beginPath(); rx.arc(RW / 2 + Math.sin(a) * q, RW / 2 - Math.cos(a) * q, t.near ? 11 : 8, 0, 7); rx.fill(); });
    rx.fillStyle = '#fff'; rx.beginPath(); rx.arc(RW / 2, RW / 2, 6, 0, 7); rx.fill();
    const near = list.filter((t) => t.near), far = list.find((t) => !t.near);
    ar.tip.textContent = !me ? '📍 Suche deinen Standort …' : fast ? '🚗 Zu schnell – Falter zeigen sich nur zu Fuß' :
      near.length ? (near.length === 1 ? '🦋 ' + falter(near[0].i).name + ' ist ganz nah' + (hd != null && Math.abs(rel(near[0].bearing - hd)) > HFOV / 2 ? ' – ' + sideOf(near[0].bearing - hd) : ' – antippen!') : '🦋 ' + near.length + ' Falter ganz nah – antippen!') :
      far ? 'Nächster Falter: ' + falter(far.i).name + ', ' + Math.round(far.dist) + ' m' + (hd != null ? ' ' + sideOf(far.bearing - hd) : '') :
      Object.keys(spawns).length && !Object.values(spawns).some((s) => s.i != null) ? '🔎 Schaue nach Faltern in der Umgebung …' : '🌿 Hier fliegt gerade keiner – geh ein Stück weiter';
    if (hd == null && me && !ar.noCompass) { ar.noCompass = 1; L.toast('Kein Kompass gefunden – Richtungen sind ungefähr'); }
  }
  /* Raum-AR: dieselben Falter als echte 3D-Falter um dich herum */
  async function xrStart() {
    if (!A() || document.querySelector('.raum-ov')) return; const caught = [];
    arPause(); C('jagd_xr');
    let ok3d = false; try { ok3d = await A().start({ title: 'Falterjagd', sub: 'Schau dich um – das Radar zeigt, wo Falter sind.', heading0: A().heading(),
      targets: () => arTargets(true).map((t) => ({ key: t.key, i: t.i, dist: t.dist, bearing: t.bearing, near: t.near })),
      onCatch: (i, key) => { const s = spawns[key]; if (!s) return; caught.push(recordCatch(s)); },
      onEnd: () => { arResume(); if (!caught.length) return; const last = caught[caught.length - 1]; if (last.walkDone) setTimeout(walkEnd, 200); else setTimeout(() => caughtSheet(last.rec, false), 200); } }); } catch (e) { ok3d = false; }
    if (!ok3d) { arResume(); L.toast('3D ließ sich nicht starten – die Falter bleiben im Kamerabild'); } /* 3.39.1: Knopf bleibt, ein neuer Versuch ist erlaubt */
  }

  /* ---------- Falterspaziergang zu zweit ---------- */
  const WALK_Q = ['Was hat dir an unserem Spaziergang gefallen?', 'Welcher Moment draußen bleibt dir heute im Kopf?', 'Wohin gehen wir beim nächsten Mal?', 'Was hast du heute an mir bemerkt?', 'Worüber hast du dich unterwegs gefreut?'];
  function walkChip() {
    const b = root && root.querySelector('.jg-walk'); if (!b) return; const w = st().walk;
    b.hidden = !w; if (!w) return;
    b.textContent = w.n >= w.goal ? '💞 Spaziergang geschafft – antippen' : '💞 Spaziergang · ' + w.n + ' von ' + w.goal + ' Faltern';
  }
  function walkMenu() {
    const w = st().walk; if (!w) return;
    if (w.n >= w.goal) return walkEnd();
    L.openSheet('<h3>💞 Falterspaziergang</h3><p class="about" style="font-size:17px">' + w.n + ' von ' + w.goal + ' Faltern gefunden. Lasst euch Zeit – schaut auch mal hoch und nicht nur aufs Handy.</p><div class="row wrap" style="margin-top:12px"><button class="pill-btn ghost" data-stop>Spaziergang beenden</button><button class="pill-btn primary" data-ok>Weiter</button></div>', (sh) => {
      sh.querySelector('[data-ok]').onclick = L.closeSheet;
      sh.querySelector('[data-stop]').onclick = () => { L.closeSheet(); if (w.n) setTimeout(walkEnd, 80); else { st().walk = null; L.save(); walkChip(); } };
    });
  }
  function walkEnd() {
    const w = st().walk; if (!w) return; C('jagd_walk_done:' + w.n);
    const min = Math.max(1, Math.round((Date.now() - w.t) / 60000)), q = WALK_Q[Math.floor(Math.random() * WALK_Q.length)];
    st().walk = null; L.save(); walkChip(); L.spawnHearts(16);
    L.openSheet('<div class="bfly-party"><h3>Schöner Spaziergang!</h3><div class="jg-walkimgs">' + w.list.map((i) => img(i)).join('') + '</div>' +
      '<p class="about" style="margin:4px 0 10px">' + w.list.length + (w.list.length === 1 ? ' Falter' : ' Falter') + ' in ' + min + (min === 1 ? ' Minute – ' : ' Minuten – ') + esc(w.list.map((i) => falter(i).name).join(', ')) + '.</p>' +
      '<div class="jg-walkq"><b>' + esc(q) + '</b><span>Erzählt es euch – oder schreib es auf.</span>' + (on() ? '<textarea id="jgWalkA" maxlength="300" rows="3" placeholder="Deine Antwort (freiwillig)"></textarea>' : '') + '</div>' +
      '<div class="row wrap" style="justify-content:center;margin-top:10px">' + (on() ? '<button class="pill-btn primary" data-send>💌 An ' + esc(you()) + ' schicken</button>' : '') + '<button class="pill-btn ghost" data-ok>Fertig</button></div></div>', (sh) => {
      sh.querySelector('[data-ok]').onclick = () => { L.closeSheet(); stop(); };
      const sb = sh.querySelector('[data-send]'); if (sb) sb.onclick = async () => {
        const a = (sh.querySelector('#jgWalkA').value || '').trim(); if (!a) { L.toast('Schreib erst ein paar Worte'); return; }
        sb.disabled = true;
        try { await P().send({ t: 'msg', text: '💞 Unser Falterspaziergang – ' + q + '\n' + a, label: '💞 Falterspaziergang' }); C('jagd_walk_send'); L.toast('💌 Unterwegs zu ' + you()); L.closeSheet(); stop(); }
        catch (e) { sb.disabled = false; L.toast('Senden fehlgeschlagen'); }
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
      L.openSheet('<div class="bfly-party"><div class="fx-hero">' + img(m.fi || 0, 'big') + '</div><h3>Für dich gefangen</h3><p class="fx-name">' + esc(f.name) + ' <span class="fx-rar">' + esc(f.rar) + '</span></p><p class="about" style="margin:6px 0 14px">' + esc(you()) + ' hat ihn ' + esc((HAB[m.hab] || HAB.open).t) + ' gefunden und dir geschickt. Er ist jetzt in deinem Schmetterlingsbuch.</p>' + (window.LZWI ? window.LZWI.moreRow(m.fi || 0) : '') +
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
    s.textContent = '.jagd{position:fixed;inset:0;z-index:8800;background:#dfe9d8}.jagd .jg-map{position:absolute !important;inset:0;width:100%;height:100%;z-index:0}.jagd:not(.show-map) .jg-map .maplibregl-control-container{display:none}' +
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
      '.jg-ar{position:absolute;inset:0;z-index:1;background:#1d3a24;overflow:hidden}.jagd.show-map .jg-ar{display:none}.jg-ar video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}.jg-ar.cam video{display:block}' +
      '.jg-arbg{position:absolute;inset:0;background:linear-gradient(180deg,#9fd3f0 0%,#cfe9c8 52%,#6fae4e 53%,#3f7d34 100%)}.jg-ar.cam .jg-arbg{display:none}' +
      '.jg-sprites{position:absolute;inset:0}.jg-sp{position:absolute;left:0;top:0;border:0;background:none;padding:0;opacity:.85;transition:opacity .3s}.jg-sp .fx-img{width:100%;height:100%;animation:jgFlap .24s ease-in-out infinite alternate}.jg-sp.near{opacity:1;filter:drop-shadow(0 0 12px rgba(255,255,255,.85))}.jg-sp.rare .fx-img{filter:drop-shadow(0 0 10px #ffe38a)}' +
      '.jg-radar{position:absolute;right:12px;bottom:calc(92px + env(safe-area-inset-bottom));width:132px;height:132px;pointer-events:none}' +
      '.jg-artip{position:absolute;left:12px;right:156px;bottom:calc(98px + env(safe-area-inset-bottom));color:#fff;font:700 16px Lato,sans-serif;background:rgba(40,20,60,.72);border-radius:16px;padding:10px 12px;text-shadow:none}' +
      '.jg-arbar{position:absolute;left:12px;right:12px;bottom:calc(22px + env(safe-area-inset-bottom));display:flex;gap:10px;justify-content:center}.jg-arbar button{min-height:52px;border:0;border-radius:26px;padding:0 20px;font:700 17px Lato,sans-serif;color:#fff;background:rgba(40,20,60,.78);box-shadow:0 4px 14px rgba(0,0,0,.3)}' +
      '.jg-arbar .jg-xrbtn{background:linear-gradient(135deg,#e8467c,#b04fd0);flex:1;max-width:260px}' +
      '.jg-camback{display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:calc(22px + env(safe-area-inset-bottom));z-index:2;min-height:52px;border:0;border-radius:26px;padding:0 22px;font:700 17px Lato,sans-serif;color:#fff;background:linear-gradient(135deg,#e8467c,#b04fd0);box-shadow:0 4px 14px rgba(0,0,0,.3)}.jagd.show-map .jg-camback{display:block}' +
      '.jagd:not(.show-map) .jg-me,.jagd:not(.show-map) .jg-hint{display:none}.jagd.show-map .jg-hint{bottom:calc(86px + env(safe-area-inset-bottom))}' +
      '.jf-ar{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(70px + env(safe-area-inset-bottom));z-index:5;border:0;border-radius:24px;padding:12px 20px;min-height:48px;font:700 17px Lato,sans-serif;color:#fff;background:linear-gradient(135deg,#e8467c,#b04fd0);box-shadow:0 6px 20px rgba(0,0,0,.35)}' +
      '.jg-walk{position:absolute;left:50%;transform:translateX(-50%);top:calc(64px + env(safe-area-inset-top));z-index:2;border:0;border-radius:18px;padding:8px 14px;min-height:40px;font:700 15px Lato,sans-serif;color:#fff;background:linear-gradient(135deg,rgba(232,70,124,.92),rgba(176,79,208,.92));box-shadow:0 4px 14px rgba(0,0,0,.3);white-space:nowrap}' +
      '.jg-walkcard{display:flex;flex-direction:column;gap:6px;background:linear-gradient(135deg,rgba(232,70,124,.14),rgba(176,79,208,.14));border:1px solid rgba(232,70,124,.4);border-radius:16px;padding:12px;margin:4px 0 6px;font-size:16px}.jg-walkcard .pill-btn{align-self:flex-start;min-height:46px}' +
      '.jg-walkimgs{display:flex;justify-content:center;gap:8px;margin:6px 0}.jg-walkimgs .fx-img{width:72px;height:72px}' +
      '.jg-walkq{display:flex;flex-direction:column;gap:6px;text-align:left;background:var(--glass,rgba(255,255,255,.06));border-radius:16px;padding:12px;font-size:16px}.jg-walkq b{font-family:var(--serif);font-weight:400;font-size:20px}.jg-walkq span{color:var(--text-muted);font-size:15px}.jg-walkq textarea{width:100%;font-size:16px;border-radius:12px;padding:10px;box-sizing:border-box}' +
      '.jg-safe{background:rgba(242,193,78,.12);border:1px solid rgba(242,193,78,.4);border-radius:14px;padding:10px 12px;margin:6px 0 10px;font-size:16px}.jg-safe ul{margin:6px 0 0 18px;padding:0}.jg-safe li{margin:2px 0}' +
      '.fx-img.inbox{width:44px;float:right;margin-left:8px}.fx-img.tiny{width:52px}' +
      /* Fenster, Hinweise und Herzen über der Karte zeigen */
      'html.jagd-open #modal{z-index:9500}html.jagd-open .toast,html.jagd-open #toast{z-index:9600}html.jagd-open .floating-hearts{z-index:9550}';
    document.head.appendChild(s);
  }

  /* Test ohne Spaziergang: LZJ.sim(lat, lon) setzt einen festen Standort */
  let sim = null;
  window.LZJ = { open, start, stop, counts, sim: (lat, lon) => { sim = { lat, lon, acc: 10, t: Date.now() }; if (map) gotFix(sim); }, move: (lat, lon) => { if (map) gotFix({ lat, lon, acc: 10, t: Date.now() }); }, teleport: (lat, lon) => { lastFix = null; fastN = 0; fast = false; if (map) gotFix({ lat, lon, acc: 10, t: Date.now() }); }, _spawns: () => spawns, catchAt: (id) => spawns[id] && catchScreen(spawns[id]), fang: () => fang, HAB,
    _ar: () => ar, xrStart, showMap, arTargets,
    fangen: (i, done, title) => catchScreen({ i, id: 'b' + Date.now(), hab: 'open' }, { done, title }), walkEnd };
})();
