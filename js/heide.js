/* Papillon in der Heide – kleines 3D-Spiel (Three.js r160, lazy geladen). 3.28.0: Falter aus echter Bildtafel (img/falter.webp, KI-erzeugt), weichere Landschaft.
   Fliegen mit virtuellem Stick, Schmetterlinge antippen zum Fangen. Runde 150 s.
   Ergebnis in S.heide = { best, runden, summe, arten:{id:anzahl}, letzte:{pts,datum,arten} }.
   Schnittstelle für andere Bausteine: window.LZH = { open, ARTEN, stand } */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const C = (k) => window.LZS && window.LZS.count(k);
  const ROUND = 150, WORLD = 95, N_BF = 26;
  const ARTEN = [
    { id: 'kohl', name: 'Kohlweißling', col: 0xf4f1e8, pts: 1, w: 30, sz: 0.8 },
    { id: 'zitrone', name: 'Zitronenfalter', col: 0xe8e05a, pts: 1, w: 30, sz: 0.85 },
    { id: 'blau', name: 'Bläuling', col: 0x6fa8ff, pts: 2, w: 18, sz: 0.65 },
    { id: 'fuchs', name: 'Kleiner Fuchs', col: 0xff7a2e, pts: 2, w: 16, sz: 0.9 },
    { id: 'pfau', name: 'Tagpfauenauge', col: 0xc2283b, pts: 3, w: 10, sz: 1.0 },
    { id: 'admiral', name: 'Admiral', col: 0x4a2f55, pts: 3, w: 8, sz: 1.0 },
    { id: 'schwalbe', name: 'Schwalbenschwanz', col: 0xf2c94c, pts: 5, w: 4, sz: 1.2 },
    { id: 'gold', name: 'Goldener Falter', col: 0xffd700, pts: 10, w: 0, sz: 1.25, gold: true }
  ];
  const AW = ARTEN.reduce((a, s) => a + s.w, 0);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stand = () => { const S = L.S; if (!S.heide) S.heide = { best: 0, runden: 0, summe: 0, arten: {} }; if (!S.heide.arten) S.heide.arten = {}; return S.heide; };

  /* ---------- einmalig: Stil ---------- */
  function css() {
    if (document.getElementById('heide-css')) return;
    const s = document.createElement('style'); s.id = 'heide-css';
    s.textContent = '.heide{position:fixed;inset:0;z-index:9000;background:#bfe3f2;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}' +
      '.heide canvas{display:block;width:100%;height:100%}' +
      '.hd-hud{position:absolute;top:calc(10px + env(safe-area-inset-top));left:0;right:0;display:flex;justify-content:center;gap:10px;pointer-events:none}' +
      '.hd-hud span{font-family:var(--serif,serif);font-size:24px;color:#fff;background:rgba(40,20,60,.42);border-radius:14px;padding:3px 12px;min-width:56px;text-align:center}' +
      '.hd-snd{position:absolute;top:calc(10px + env(safe-area-inset-top));left:10px;width:44px;height:44px;border-radius:22px;border:0;background:rgba(40,20,60,.42);color:#fff;font-size:19px}' +
      '.hd-x{position:absolute;top:calc(10px + env(safe-area-inset-top));right:10px;width:44px;height:44px;border-radius:22px;border:0;background:rgba(40,20,60,.42);color:#fff;font-size:20px}' +
      '.hd-toast{position:absolute;top:calc(64px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);color:#fff;background:rgba(40,20,60,.55);border-radius:14px;padding:6px 14px;font:700 17px Lato,sans-serif;opacity:0;transition:opacity .25s;pointer-events:none;white-space:nowrap}' +
      '.hd-toast.on{opacity:1}.hd-toast.gold{background:rgba(160,110,0,.75)}' +
      '.hd-stick{position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:60px;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.5);pointer-events:none;display:none}' +
      '.hd-stick i{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:25px;background:rgba(255,255,255,.75)}' +
      '.hd-hint{position:absolute;bottom:calc(18px + env(safe-area-inset-bottom));left:0;right:0;text-align:center;color:#fff;font:700 16px Lato,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,.5);pointer-events:none;transition:opacity 1s}' +
      '.hd-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#5a3d6e;font:700 18px Lato,sans-serif}' +
      '.hd-arten{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0}.hd-arten span{background:var(--glass,#eee);border:1px solid var(--line,#ddd);border-radius:12px;padding:4px 10px;font-size:15px}' +
      '.hd-arten span.no{opacity:.4}';
    document.head.appendChild(s);
  }

  /* ---------- Three.js nur bei Bedarf laden ---------- */
  let threeP = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (threeP) return threeP;
    threeP = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'js/vendor/three.min.js'; sc.onload = ok; sc.onerror = () => { threeP = null; no(new Error('three')); }; document.head.appendChild(sc); });
    return threeP;
  }
  /* Falter-Tafel (3×3, Draufsicht, freigestellt): Reihenfolge wie ARTEN, Feld 9 = Papillon */
  let texP = null;
  function loadAtlas() {
    if (texP) return texP;
    texP = new Promise((ok) => {
      const T = window.THREE; if (!T) return ok(null);
      new T.TextureLoader().load('img/falter.webp', (t) => { t.colorSpace = T.SRGBColorSpace || t.colorSpace; t.generateMipmaps = true; t.minFilter = T.LinearMipmapLinearFilter; ok(t); }, undefined, () => { texP = null; ok(null); });
    });
    return texP;
  }

  /* ---------- Spielmusik ----------
     Liegt audio/heide.mp3 vor (Suno, „Papillon in der Heide“), läuft sie in Schleife.
     Sonst entsteht eine ruhige Klangfläche direkt im Handy: Harfentöne (Pentatonik), warme Flächen, Hall, ferne Vögel. */
  const musicOn = () => L.S.heideMusic !== false;
  function music() {
    let audio = null, ctx = null, master = null, timers = [], stopped = false;
    const later = (fn, ms) => { const t = setTimeout(() => { if (!stopped) fn(); }, ms); timers.push(t); };
    function fade(el, to, ms) { const from = el.volume, t0 = performance.now(); (function step() { if (!el) return; const k = Math.min(1, (performance.now() - t0) / ms); el.volume = from + (to - from) * k; if (k < 1) requestAnimationFrame(step); })(); }
    function synth() {
      if (ctx || stopped) return; /* nur einmal (Fehler-Ereignis und abgelehntes play() kommen beide hierher) */
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime); master.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 4);
      /* Hall aus abklingendem Rauschen */
      const rv = ctx.createConvolver(), len = ctx.sampleRate * 4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      rv.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.55; rv.connect(wet); wet.connect(master);
      const dry = ctx.createGain(); dry.gain.value = 0.6; dry.connect(master); dry.connect(rv);
      const dl = ctx.createDelay(1); dl.delayTime.value = 0.42; const fb = ctx.createGain(); fb.gain.value = 0.32; dl.connect(fb); fb.connect(dl); dl.connect(rv);
      const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
      /* Flächen: Cmaj9 – Am7 – Fmaj7 – G6, je 9 s, weich ein- und ausblenden */
      const CH = [[48, 55, 64, 71, 74], [45, 52, 60, 67, 72], [41, 48, 57, 64, 69], [43, 50, 59, 64, 71]];
      let ci = 0;
      function pad() {
        const t = ctx.currentTime, notes = CH[ci++ % CH.length];
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.3; lp.connect(dry);
        notes.forEach((m, k) => [0, 1].forEach((v) => {
          const o = ctx.createOscillator(), g = ctx.createGain(); o.type = v ? 'triangle' : 'sine'; o.frequency.value = hz(m) * (v ? 1.003 : 0.997);
          const peak = (k === 0 ? 0.05 : 0.028) * (v ? 0.6 : 1);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 3.5); g.gain.setValueAtTime(peak, t + 7.5); g.gain.linearRampToValueAtTime(0, t + 12.5);
          o.connect(g); g.connect(lp); o.start(t); o.stop(t + 13);
        }));
        later(pad, 9000);
      }
      /* Harfe: einzelne Töne aus der Pentatonik, mal dichter, mal Pause */
      const PENT = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
      let last = 4;
      function harp() {
        if (Math.random() < 0.82) {
          last = Math.max(0, Math.min(PENT.length - 1, last + Math.round((Math.random() - 0.5) * 4)));
          const t = ctx.currentTime, f = hz(PENT[last]);
          [1, 2, 3].forEach((h) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * h; const a = 0.07 / (h * h);
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2 / h);
            o.connect(g); g.connect(dry); g.connect(dl); o.start(t); o.stop(t + 3.4); });
        }
        later(harp, 650 + Math.random() * (Math.random() < 0.2 ? 2600 : 900));
      }
      /* ferne Vögel */
      function bird() {
        const t = ctx.currentTime, n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) { const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; const s0 = t + i * 0.16, f0 = 2600 + Math.random() * 900;
          o.type = 'sine'; o.frequency.setValueAtTime(f0, s0); o.frequency.exponentialRampToValueAtTime(f0 * 1.45, s0 + 0.08); o.frequency.exponentialRampToValueAtTime(f0 * 0.9, s0 + 0.13);
          g.gain.setValueAtTime(0, s0); g.gain.linearRampToValueAtTime(0.012, s0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s0 + 0.14);
          o.connect(g); if (p) { p.pan.value = (Math.random() - 0.5) * 1.6; g.connect(p); p.connect(rv); } else g.connect(rv); o.start(s0); o.stop(s0 + 0.16); }
        later(bird, 5000 + Math.random() * 9000);
      }
      pad(); later(harp, 1800); later(bird, 4000);
    }
    function start() {
      stopped = false;
      audio = new Audio('audio/heide.mp3'); audio.loop = true; audio.volume = 0; audio.preload = 'auto';
      audio.addEventListener('error', () => { audio = null; if (!stopped) synth(); }, { once: true });
      const p = audio.play(); if (p && p.then) p.then(() => fade(audio, 0.55, 3000)).catch(() => { if (audio && audio.error) return; audio = null; if (!stopped) synth(); });
    }
    function stop() {
      stopped = true; timers.forEach(clearTimeout); timers = [];
      if (audio) { const a = audio; audio = null; fade(a, 0, 600); setTimeout(() => { try { a.pause(); a.src = ''; } catch (e) {} }, 650); }
      if (ctx) { const c = ctx, m = master; ctx = null; try { m.gain.cancelScheduledValues(c.currentTime); m.gain.setValueAtTime(m.gain.value, c.currentTime); m.gain.linearRampToValueAtTime(0, c.currentTime + 0.6); } catch (e) {} setTimeout(() => { try { c.close(); } catch (e) {} }, 800); }
    }
    function pause(on) { if (audio) { if (on) audio.pause(); else audio.play().catch(() => {}); } if (ctx) { if (on) ctx.suspend(); else ctx.resume(); } }
    return { start, stop, pause, get running() { return !stopped && (!!audio || !!ctx); } };
  }

  /* ---------- Startbildschirm ---------- */
  function open() {
    css(); const h = stand(); const n = Object.keys(h.arten).length;
    const chips = ARTEN.map((a) => '<span class="' + (h.arten[a.id] ? '' : 'no') + '">' + (a.gold ? '🌟 ' : '🦋 ') + esc(a.name) + '</span>').join('');
    L.openSheet('<h3>🦋 Papillon in der Heide</h3><p class="about" style="font-size:17px;margin-bottom:8px">Fliegt mit Papillon durch die Heide und fangt Schmetterlinge: Links ziehen zum Fliegen, Schmetterling antippen zum Fangen. Seltene Arten zählen mehr, 🌟 goldene 10 Punkte. Eine Runde dauert 2½ Minuten.</p>' +
      '<p class="about" style="font-size:16px;margin:0 0 6px">💞 Zu zweit: Einer fliegt, der andere hält Ausschau und sagt an. Danach tauschen!</p>' +
      '<div class="fg-week">Bestwert: ' + (h.best || 0) + ' · Arten entdeckt: ' + n + '/' + ARTEN.length + '</div><div class="hd-arten">' + chips + '</div>' +
      '<div class="row" style="margin-top:10px"><button class="pill-btn ghost" data-cancel>Schließen</button><button class="pill-btn primary" data-go>Los fliegen!</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = () => { L.closeSheet(); setTimeout(play, 100); };
    });
  }

  /* ---------- Landschaft ---------- */
  const hgt = (x, z) => 2.2 * Math.sin(x * 0.045) * Math.cos(z * 0.05) + 1.3 * Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.09 + 0.4) + 0.5 * Math.sin((x + z) * 0.21);
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function play() {
    css();
    const root = document.createElement('div'); root.className = 'heide';
    root.innerHTML = '<div class="hd-load">Die Heide blüht auf … 🌸</div>';
    document.body.appendChild(root); document.documentElement.classList.add('cam-open');
    loadThree().then(loadAtlas).then((tex) => build(root, tex)).catch(() => { root.remove(); document.documentElement.classList.remove('cam-open'); L.openSheet('<h3>Hoppla</h3><p class="about">Das Spiel konnte nicht geladen werden. Bitte einmal mit Internet öffnen, danach geht es auch offline.</p><div class="row"><button class="pill-btn primary" data-cancel>OK</button></div>', (sh) => { sh.querySelector('[data-cancel]').onclick = L.closeSheet; }); });
  }

  function build(root, atlas) {
    const T = window.THREE; root.innerHTML = '';
    C('game_play:heide');
    let pr = Math.min(1.5, window.devicePixelRatio || 1);
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }); } catch (e) { root.remove(); document.documentElement.classList.remove('cam-open'); L.openSheet('<h3>Hoppla</h3><p class="about">Dieses Handy kann leider keine 3D-Grafik anzeigen.</p><div class="row"><button class="pill-btn primary" data-cancel>OK</button></div>', (sh) => { sh.querySelector('[data-cancel]').onclick = L.closeSheet; }); return; }
    renderer.setPixelRatio(pr); renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);
    root.insertAdjacentHTML('beforeend', '<div class="hd-hud"><span class="hd-pts">🦋 0</span><span class="hd-time">⏱ 2:30</span></div><button type="button" class="hd-x" aria-label="Runde beenden">✕</button><button type="button" class="hd-snd" aria-label="Musik an oder aus">' + (musicOn() ? '🔊' : '🔇') + '</button><div class="hd-toast"></div><div class="hd-stick"><i></i></div><div class="hd-hint">👈 Links ziehen zum Fliegen · Schmetterling antippen zum Fangen</div>');
    const $ = (s) => root.querySelector(s);

    const scene = new T.Scene();
    const SKY = 0xdcecf2; scene.background = new T.Color(SKY); scene.fog = new T.Fog(SKY, 40, 120);
    const cam = new T.PerspectiveCamera(62, root.clientWidth / root.clientHeight, 0.5, 140);
    scene.add(new T.HemisphereLight(0xdff1ff, 0x5c6b3a, 1.15));
    const sun = new T.DirectionalLight(0xfff1d6, 1.55); sun.position.set(30, 50, 20); scene.add(sun);
    const R = rng(4711);
    const disposables = [];
    const keep = (o) => { disposables.push(o); return o; };
    /* Himmelskuppel: oben Blau, am Horizont warmes Licht */
    {
      const g = new T.SphereGeometry(135, 24, 14); const p = g.attributes.position, col = new Float32Array(p.count * 3), top = new T.Color(0x5fa9e0), hor = new T.Color(0xf4e6d4), c = new T.Color();
      for (let i = 0; i < p.count; i++) { const k = Math.max(0, Math.min(1, p.getY(i) / 70)); c.copy(hor).lerp(top, Math.pow(k, 0.7)); col.set([c.r, c.g, c.b], i * 3); }
      g.setAttribute('color', new T.BufferAttribute(col, 3));
      const sky = new T.Mesh(keep(g), keep(new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
      sky.renderOrder = -1; scene.add(sky); var skyDome = sky;
    }

    /* Boden: flach schattiert, Farben je Dreieck (Heidekraut lila / Gras grün / Sandweg) */
    {
      const g = new T.PlaneGeometry(230, 230, 110, 110); g.rotateX(-Math.PI / 2);
      const p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) p.setY(i, hgt(p.getX(i), p.getZ(i)));
      const cA = new T.Color(0x8e5f9c), cB = new T.Color(0x6f9145), cC = new T.Color(0xcdb68a), c = new T.Color(), c2 = new T.Color();
      const sm = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        const m = Math.sin(x * 0.07) * Math.cos(z * 0.06) + 0.35 * Math.sin(x * 0.3 + z * 0.2);
        c.copy(cB).lerp(cA, sm(-0.35, 0.15, m));
        const pathD = Math.abs(z - 18 * Math.sin(x * 0.04)); c.lerp(cC, 1 - sm(1.6, 3.4, pathD));
        c2.setHSL(0, 0, 0); c.offsetHSL(0, 0, (Math.sin(x * 1.7) * Math.cos(z * 1.3)) * 0.025 + (R() - 0.5) * 0.03);
        col.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
      scene.add(new T.Mesh(keep(g), keep(new T.MeshLambertMaterial({ vertexColors: true }))));
    }
    /* Deko als InstancedMesh: wenige Draw-Calls */
    const dummy = new T.Object3D();
    function scatter(geo, color, n, place, jitter) {
      const m = new T.InstancedMesh(keep(geo), keep(new T.MeshLambertMaterial({})), n);
      const c = new T.Color();
      for (let i = 0; i < n; i++) { place(dummy, i); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); c.set(color).offsetHSL((R() - 0.5) * jitter, 0, (R() - 0.5) * 0.12); m.setColorAt(i, c); }
      scene.add(m); return m;
    }
    const spot = (o, min) => { let x, z; do { x = (R() - 0.5) * 210; z = (R() - 0.5) * 210; } while (Math.hypot(x, z) < (min || 0)); o.position.set(x, hgt(x, z), z); return o; };
    scatter(new T.SphereGeometry(1, 9, 6), 0xa45aae, 520, (o) => { spot(o, 4); const s = 0.6 + R() * 0.9; o.scale.set(s * 1.3, s * 0.7, s * 1.3); o.rotation.set(0, R() * 6, 0); o.position.y += 0.2; }, 0.08);
    scatter(new T.ConeGeometry(0.9, 3.4, 6), 0x3f6b3a, 70, (o) => { spot(o, 8); const s = 0.7 + R() * 0.8; o.scale.set(s, s, s); o.position.y += 1.6 * s; o.rotation.set(0, R() * 6, 0); }, 0.03);
    const trees = []; for (let i = 0; i < 38; i++) { const o = spot(new T.Object3D(), 10); trees.push({ x: o.position.x, y: o.position.y, z: o.position.z, s: 0.8 + R() * 0.6 }); }
    scatter(new T.CylinderGeometry(0.22, 0.3, 6, 5), 0xf0ece2, trees.length, (o, i) => { const t = trees[i]; o.position.set(t.x, t.y + 3 * t.s, t.z); o.scale.setScalar(t.s); }, 0);
    scatter(new T.IcosahedronGeometry(2.2, 2), 0x7fb24a, trees.length, (o, i) => { const t = trees[i]; o.position.set(t.x, t.y + 6.6 * t.s, t.z); o.scale.set(t.s, t.s * 1.35, t.s); o.rotation.set(R(), R(), 0); }, 0.06);
    scatter(new T.DodecahedronGeometry(0.8, 1), 0x9a958c, 30, (o) => { spot(o, 6); const s = 0.6 + R() * 1.2; o.scale.set(s, s * 0.6, s); o.rotation.set(R(), R(), R()); }, 0.02);
    /* Grashalme (dünne Kegel, 1 Draw-Call) */
    scatter(new T.ConeGeometry(0.07, 0.9, 3), 0x5f8f3a, 1800, (o) => { spot(o, 2); const s = 0.6 + R() * 0.9; o.scale.set(s, s, s); o.position.y += 0.4 * s; o.rotation.set((R() - 0.5) * 0.5, R() * 6, (R() - 0.5) * 0.5); }, 0.06);
    /* Blumen-Tupfer (Punkte, 1 Draw-Call) */
    {
      const n = 900, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new T.Color(), pal = [0xffffff, 0xffe066, 0xff9ecb, 0xd08bff];
      for (let i = 0; i < n; i++) { const x = (R() - 0.5) * 210, z = (R() - 0.5) * 210; pos.set([x, hgt(x, z) + 0.35, z], i * 3); c.set(pal[i % 4]); col.set([c.r, c.g, c.b], i * 3); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
      /* runde Blüten statt Quadrate */
      const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cx2 = cv.getContext('2d');
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; cx2.beginPath(); cx2.arc(16 + Math.cos(a) * 7, 16 + Math.sin(a) * 7, 6.5, 0, 7); cx2.fillStyle = '#fff'; cx2.fill(); }
      cx2.beginPath(); cx2.arc(16, 16, 4, 0, 7); cx2.fillStyle = '#ffd34d'; cx2.fill();
      const ft = keep(new T.CanvasTexture(cv));
      scene.add(new T.Points(keep(g), keep(new T.PointsMaterial({ size: 0.55, vertexColors: true, map: ft, alphaTest: 0.5 }))));
    }

    /* Flügel-Geometrie (rechter Flügel, zeigt nach +x); innen dunkler = Muster */
    const wingGeo = keep(new T.BufferGeometry());
    {
      const rim = [[0, 0.25], [0.55, 0.85], [1.1, 0.75], [1.05, 0.15], [0.75, -0.25], [0.85, -0.7], [0.4, -0.85], [0, -0.3]];
      const pos = [], col = [];
      for (let i = 0; i < rim.length - 1; i++) {
        pos.push(0, 0, 0, rim[i][0], 0, -rim[i][1], rim[i + 1][0], 0, -rim[i + 1][1]);
        col.push(0.55, 0.55, 0.55, 1, 1, 1, 1, 1, 1);
      }
      wingGeo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); wingGeo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); wingGeo.computeVertexNormals();
    }
    const wingMat = keep(new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }));
    /* Mit Falter-Tafel: rechter Flügel = rechte Bildhälfte, linker gespiegelt (Draufsicht ist symmetrisch). Oben im Bild = vorn. */
    const plane = keep(new T.PlaneGeometry(1, 2).translate(0.5, 0, 0).rotateX(-Math.PI / 2));
    const WGEO = atlas ? plane : wingGeo, WS = atlas ? 1.12 : 1;
    const mats = ARTEN.concat([{ id: 'papillon', col: 0xff7eb6 }]).map((a, k) => {
      if (!atlas) return k === ARTEN.length ? null : keep(new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide, color: a.col }));
      const t = keep(atlas.clone()); t.needsUpdate = true; const c = k % 3, r = Math.floor(k / 3);
      t.offset.set((c + 0.5) / 3, (2 - r) / 3); t.repeat.set(0.5 / 3, 1 / 3);
      return keep(new T.MeshLambertMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: a.gold ? 0.45 : 0.28, alphaTest: 0.5, side: T.DoubleSide }));
    });

    /* Papillon (Spielfigur) */
    const pap = new T.Group();
    const papMat = mats[ARTEN.length] || keep(new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide, color: 0xff7eb6, emissive: 0x3a0a20 }));
    const wR = new T.Mesh(WGEO, papMat), wL = new T.Mesh(WGEO, papMat); wR.scale.setScalar(WS); wL.scale.set(-WS, WS, WS);
    const bodyMat = keep(new T.MeshLambertMaterial({ color: 0x3b2546 }));
    const body = new T.Mesh(keep(new T.CylinderGeometry(atlas ? 0.07 : 0.13, atlas ? 0.045 : 0.09, atlas ? 1.05 : 1.3, 8)), bodyMat); body.rotation.x = Math.PI / 2;
    const head = new T.Mesh(keep(new T.SphereGeometry(atlas ? 0.1 : 0.2, 10, 8)), bodyMat); head.position.z = atlas ? -0.58 : -0.75;
    pap.add(wR, wL, body, head); pap.scale.setScalar(1.6); scene.add(pap);
    const shadow = new T.Mesh(keep(new T.CircleGeometry(1.3, 12)), keep(new T.MeshBasicMaterial({ color: 0x2a1a33, transparent: true, opacity: 0.25, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

    /* Schmetterlinge: je eine Gruppe aus zwei Flügeln und Körper (26 × 3 Meshes, für Handys unkritisch) */
    void wingMat;
    const bodyGeo = keep(new T.CylinderGeometry(0.06, 0.04, 0.85, 6).rotateX(Math.PI / 2)), bodyMatB = keep(new T.MeshLambertMaterial({ color: 0x2b2030 }));
    const bfM = [];
    for (let i = 0; i < N_BF; i++) { const g = new T.Group(); const r = new T.Mesh(WGEO, mats[0]), l = new T.Mesh(WGEO, mats[0]); const bd = new T.Mesh(bodyGeo, bodyMatB); g.add(r, l, bd); scene.add(g); bfM.push({ g, r, l }); }
    const spark = new T.Points(keep(new T.BufferGeometry()), keep(new T.PointsMaterial({ color: 0xfff2a0, size: 0.45, transparent: true, opacity: 0.9, depthWrite: false })));
    const SP = 24; spark.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(SP * 3), 3)); spark.frustumCulled = false; scene.add(spark);

    const player = { x: 0, z: 0, yaw: 0, vx: 0, vz: 0 };
    let camYaw = 0;
    const bfs = [];
    const pickArt = (goldChance) => { if (Math.random() < goldChance) return ARTEN[ARTEN.length - 1]; let r = Math.random() * AW; for (const a of ARTEN) { if ((r -= a.w) < 0) return a; } return ARTEN[0]; };
    const colTmp = new T.Color();
    function spawn(i, art, near) {
      let x, z; do { const a = Math.random() * Math.PI * 2, d = near ? 14 + Math.random() * 30 : 8 + Math.random() * 80; x = player.x + Math.cos(a) * d; z = player.z + Math.sin(a) * d; } while (Math.hypot(x, z) > WORLD);
      const b = { art, hx: x, hz: z, x, z, y: hgt(x, z) + 1.5, ph: Math.random() * 10, f: 9 + Math.random() * 5, yaw: 0, caught: -1, flee: 0 };
      bfs[i] = b; const mm = mats[ARTEN.indexOf(art)] || mats[0]; bfM[i].r.material = mm; bfM[i].l.material = mm; void colTmp;
    }
    for (let i = 0; i < N_BF; i++) spawn(i, i === 0 ? ARTEN[ARTEN.length - 1] : pickArt(0.03), false);

    /* Steuerung */
    const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0, t0: 0, moved: false }, keys = {};
    const stickEl = $('.hd-stick'), knob = stickEl.firstChild;
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', (e) => {
      if (over) return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (stick.id === null && x < r.width * 0.45 && y > r.height * 0.3) {
        stick.id = e.pointerId; stick.ox = x; stick.oy = y; stick.x = stick.y = 0; stick.t0 = performance.now(); stick.moved = false;
        stickEl.style.display = 'block'; stickEl.style.left = x + 'px'; stickEl.style.top = y + 'px'; knob.style.transform = '';
        try { cv.setPointerCapture(e.pointerId); } catch (er) {}
        hideHint(); return;
      }
      tryCatch(x, y);
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerId !== stick.id) return;
      const r = cv.getBoundingClientRect(); let dx = e.clientX - r.left - stick.ox, dy = e.clientY - r.top - stick.oy;
      const d = Math.hypot(dx, dy), m = 50; if (d > 8) stick.moved = true; if (d > m) { dx *= m / d; dy *= m / d; }
      stick.x = dx / m; stick.y = dy / m; knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    });
    const stickUp = (e) => {
      if (e.pointerId !== stick.id) return;
      if (!stick.moved && performance.now() - stick.t0 < 250) tryCatch(stick.ox, stick.oy); // kurzer Tipp links = auch Fangen
      stick.id = null; stick.x = stick.y = 0; stickEl.style.display = 'none';
    };
    cv.addEventListener('pointerup', stickUp); cv.addEventListener('pointercancel', stickUp);
    const kd = (e) => { keys[e.key.toLowerCase()] = e.type === 'keydown'; }; window.addEventListener('keydown', kd); window.addEventListener('keyup', kd);
    let hinted = false; function hideHint() { if (hinted) return; hinted = true; const h = $('.hd-hint'); h.style.opacity = '0'; }

    /* Fangen per Antippen: nächster Schmetterling am Tippunkt, nicht zu weit weg */
    const v3 = new T.Vector3();
    let pts = 0, caughtN = 0; const caughtArten = {};
    function tryCatch(sx, sy) {
      const w = cv.clientWidth, h = cv.clientHeight; let best = -1, bd = 1e9;
      for (let i = 0; i < N_BF; i++) {
        const b = bfs[i]; if (b.caught >= 0) continue; const dist = Math.hypot(b.x - player.x, b.z - player.z); if (dist > 16) continue;
        v3.set(b.x, b.y, b.z).project(cam); if (v3.z > 1) continue;
        const px = (v3.x + 1) / 2 * w, py = (1 - v3.y) / 2 * h; const d = Math.hypot(px - sx, py - sy);
        const lim = 46 + 260 / Math.max(3, dist); if (d < lim && d < bd) { bd = d; best = i; }
      }
      if (best < 0) { L.haptic && L.haptic(4); return; }
      const b = bfs[best]; b.caught = 0; pts += b.art.pts; caughtN++; caughtArten[b.art.id] = (caughtArten[b.art.id] || 0) + 1;
      $('.hd-pts').textContent = '🦋 ' + pts; L.haptic && L.haptic(b.art.gold ? 40 : 10); flap = 1;
      const isNew = !stand().arten[b.art.id] && caughtArten[b.art.id] === 1;
      toast((b.art.gold ? '🌟 ' : '🦋 ') + b.art.name + ' +' + b.art.pts + (isNew ? ' · neue Art!' : ''), b.art.gold);
    }
    let toastT = 0; function toast(t, gold) { const el = $('.hd-toast'); el.textContent = t; el.className = 'hd-toast on' + (gold ? ' gold' : ''); clearTimeout(toastT); toastT = setTimeout(() => { el.className = 'hd-toast'; }, 1400); }

    /* Schleife */
    let over = false, paused = false, raf = 0, last = performance.now(), left = ROUND, flap = 0, clock = 0, slow = 0, fpsT = 0, fpsN = 0;
    const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const lerpAng = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      left -= dt; if (left <= 0) return finish();
      /* Leistung: wenn das Handy ruckelt, Auflösung senken */
      fpsT += dt; fpsN++; if (fpsT > 2) { const avg = fpsT / fpsN; if (avg > 0.024 && pr > 0.75) { pr = Math.max(0.75, pr - 0.25); renderer.setPixelRatio(pr); renderer.setSize(root.clientWidth, root.clientHeight); } fpsT = fpsN = 0; }
      /* Bewegung relativ zur Kamera */
      let ix = stick.x, iy = stick.y;
      if (keys.a || keys.arrowleft) ix -= 1; if (keys.d || keys.arrowright) ix += 1; if (keys.w || keys.arrowup) iy -= 1; if (keys.s || keys.arrowdown) iy += 1;
      const mag = Math.min(1, Math.hypot(ix, iy)); const sp = 11;
      if (mag > 0.05) {
        const fx = Math.sin(camYaw), fz = Math.cos(camYaw); // Kamera schaut Richtung -f
        const mx = (-fx * -iy + fz * ix), mz = (-fz * -iy - fx * ix);
        const ml = Math.hypot(mx, mz) || 1; player.vx += ((mx / ml) * sp * mag - player.vx) * Math.min(1, dt * 5); player.vz += ((mz / ml) * sp * mag - player.vz) * Math.min(1, dt * 5);
        player.yaw = lerpAng(player.yaw, Math.atan2(-player.vx, -player.vz), Math.min(1, dt * 8));
      } else { player.vx *= Math.max(0, 1 - dt * 4); player.vz *= Math.max(0, 1 - dt * 4); }
      player.x += player.vx * dt; player.z += player.vz * dt;
      const pd = Math.hypot(player.x, player.z); if (pd > WORLD) { player.x *= WORLD / pd; player.z *= WORLD / pd; }
      const gy = hgt(player.x, player.z), py = gy + 2.4 + Math.sin(clock * 2.2) * 0.25;
      pap.position.set(player.x, py, player.z); pap.rotation.set(0, player.yaw, 0);
      flap = Math.max(0, flap - dt * 2); const fa = Math.sin(clock * (7 + flap * 14)) * (0.42 + flap * 0.3) + 0.12;
      wR.rotation.z = fa; wL.rotation.z = -fa;
      shadow.position.set(player.x, gy + 0.08, player.z);
      /* Kamera folgt sanft von hinten */
      const moving = Math.hypot(player.vx, player.vz) > 2;
      if (moving) camYaw = lerpAng(camYaw, player.yaw, Math.min(1, dt * 1.6));
      const cx = player.x + Math.sin(camYaw) * 8, cz = player.z + Math.cos(camYaw) * 8;
      const cy = Math.max(hgt(cx, cz) + 1.5, py + 5.2);
      cam.position.set(cx, cy, cz); cam.lookAt(player.x, py + 0.8, player.z);
      /* Schmetterlinge */
      const sArr = spark.geometry.attributes.position.array; let sk = 0;
      for (let i = 0; i < N_BF; i++) {
        const b = bfs[i]; const t = clock + b.ph; let s = b.art.sz, wa;
        if (b.caught >= 0) {
          b.caught += dt; const k = Math.min(1, b.caught / 0.45);
          b.x += (player.x - b.x) * k * 0.3; b.z += (player.z - b.z) * k * 0.3; b.y += (py - b.y) * k * 0.3; s *= 1 - k; wa = Math.sin(t * 30);
          if (k >= 1) { spawn(i, pickArt(0.06), true); continue; }
        } else {
          const dx = b.x - player.x, dz = b.z - player.z, d = Math.hypot(dx, dz) || 1;
          const scare = b.art.gold ? 9 : 6; if (d < scare) b.flee = Math.min(1, b.flee + dt * 3); else b.flee = Math.max(0, b.flee - dt);
          const tx = b.hx + Math.sin(t * 0.37) * 6 + (dx / d) * b.flee * 10, tz = b.hz + Math.cos(t * 0.29) * 6 + (dz / d) * b.flee * 10;
          const spd = b.art.gold ? 2.4 : 1.6; const ox = b.x, oz = b.z;
          b.x += (tx - b.x) * Math.min(1, dt * spd * 0.5); b.z += (tz - b.z) * Math.min(1, dt * spd * 0.5);
          if (b.flee > 0.5) { b.hx += (dx / d) * dt * 3; b.hz += (dz / d) * dt * 3; }
          const hd = Math.hypot(b.hx, b.hz); if (hd > WORLD) { b.hx *= WORLD / hd; b.hz *= WORLD / hd; }
          b.y = hgt(b.x, b.z) + 1.3 + Math.sin(t * 1.3) * 0.6 + b.flee * 0.8;
          if (Math.abs(b.x - ox) + Math.abs(b.z - oz) > 1e-4) b.yaw = lerpAng(b.yaw, Math.atan2(-(b.x - ox), -(b.z - oz)), Math.min(1, dt * 6));
          wa = Math.sin(t * b.f) * 0.7 + 0.2;
          if (b.art.gold && sk < SP) { for (let q = 0; q < 6 && sk < SP; q++, sk++) { const a = t * 2 + q; sArr[sk * 3] = b.x + Math.cos(a) * 0.9; sArr[sk * 3 + 1] = b.y + Math.sin(a * 1.7) * 0.5; sArr[sk * 3 + 2] = b.z + Math.sin(a) * 0.9; } }
        }
        const M = bfM[i]; M.g.position.set(b.x, b.y, b.z); M.g.rotation.set(0, b.yaw, 0); M.g.scale.setScalar(Math.max(0.001, s * WS)); M.r.rotation.z = wa; M.l.rotation.z = -wa; M.l.scale.x = -1;
      }
      for (; sk < SP; sk++) sArr[sk * 3 + 1] = -999;
      spark.geometry.attributes.position.needsUpdate = true;
      skyDome.position.set(cam.position.x, 0, cam.position.z);
      $('.hd-time').textContent = '⏱ ' + fmt(left);
      renderer.render(scene, cam);
    }
    /* Pause bei Tab-/App-Wechsel (Akku) */
    function vis() {
      if (over) return;
      if (document.hidden) { paused = true; cancelAnimationFrame(raf); mus.pause(true); }
      else if (paused) { paused = false; last = performance.now(); raf = requestAnimationFrame(frame); mus.pause(false); }
    }
    document.addEventListener('visibilitychange', vis);
    const resize = () => { renderer.setSize(root.clientWidth, root.clientHeight); cam.aspect = root.clientWidth / root.clientHeight; cam.updateProjectionMatrix(); };
    window.addEventListener('resize', resize);
    $('.hd-x').onclick = () => finish();

    function cleanup() {
      over = true; cancelAnimationFrame(raf); clearTimeout(toastT); mus.stop();
      document.removeEventListener('visibilitychange', vis); window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', kd);
      disposables.forEach((d) => { try { d.dispose(); } catch (e) {} });
      scene.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
      root.remove(); document.documentElement.classList.remove('cam-open');
    }
    function finish() {
      if (over) return; cleanup();
      const h = stand(), neu = Object.keys(caughtArten).filter((k) => !h.arten[k]);
      Object.keys(caughtArten).forEach((k) => { h.arten[k] = (h.arten[k] || 0) + caughtArten[k]; });
      const rekord = pts > (h.best || 0); if (rekord) h.best = pts;
      h.runden = (h.runden || 0) + 1; h.summe = (h.summe || 0) + pts;
      h.letzte = { pts, datum: new Date().toISOString().slice(0, 10), arten: caughtArten };
      L.save(); C('game_done:heide');
      if (window.LZG && window.LZG.renderHub) { try { window.LZG.renderHub(); } catch (e) {} }
      const list = ARTEN.filter((a) => caughtArten[a.id]).map((a) => '<span>' + (a.gold ? '🌟 ' : '🦋 ') + esc(a.name) + ' ×' + caughtArten[a.id] + '</span>').join('') || '<span class="no">Diesmal keiner – nächstes Mal!</span>';
      L.openSheet('<h3>🦋 ' + pts + ' Punkte</h3>' + (rekord && h.runden > 1 ? '<p class="about">🏆 Neuer Bestwert!</p>' : '') +
        '<p class="about" style="margin:4px 0">' + caughtN + ' Schmetterlinge gefangen' + (neu.length ? ' · ' + neu.length + ' neue Art' + (neu.length > 1 ? 'en' : '') + ' entdeckt!' : '') + '</p><div class="hd-arten">' + list + '</div>' +
        '<div class="fg-week">Bestwert: ' + h.best + ' · Arten: ' + Object.keys(h.arten).length + '/' + ARTEN.length + '</div>' +
        '<p class="about" style="text-align:center;margin:8px 0 0">💞 Jetzt das Handy weitergeben – wer fängt mehr?</p>' +
        '<div class="row" style="margin-top:10px"><button class="pill-btn ghost" data-cancel>Fertig</button><button class="pill-btn primary" data-again>Nochmal</button></div>', (sh) => {
        sh.querySelector('[data-cancel]').onclick = L.closeSheet;
        sh.querySelector('[data-again]').onclick = () => { L.closeSheet(); setTimeout(play, 100); };
      });
    }
    const mus = music(); if (musicOn()) mus.start();
    $('.hd-snd').onclick = (e) => { e.stopPropagation(); const on = !musicOn(); L.S.heideMusic = on; L.save(); $('.hd-snd').textContent = on ? '🔊' : '🔇'; if (on) mus.start(); else mus.stop(); C('heide_music:' + (on ? 'an' : 'aus')); };
    resize(); raf = requestAnimationFrame(frame);
    window.LZH._dbg = { bfs, player, cam, catchAt: tryCatch, cv };
  }

  window.LZH = { open, play, ARTEN, stand };
})();
