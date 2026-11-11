/* Schmetterlingsfutter – Handys koppeln komplett in der App (3.23.0)
   - Einrichtung: eigener Schritt „Verbindet eure Handys“ mit zwei großen Wegen (Code scannen / Code zeigen)
   - Scanner mit der Handykamera direkt in der App (eingebaute Erkennung, sonst jsQR), auch aus einem Bild
   - Feier mit fliegenden Schmetterlingen, sobald die Verbindung steht (auf beiden Handys) */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const S = () => L.S, P = () => window.LZP;
  const $ = (id) => document.getElementById(id), esc = L.esc;
  const HUES = [0, 40, 95, 150, 200, 260, 310];
  const calm = () => S().motion === false || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const C = (k) => window.LZS && window.LZS.count(k);

  /* ---------- Feier: Schmetterlinge fliegen auseinander ---------- */
  function celebrate(name) {
    if ($('pairParty')) return;
    const el = document.createElement('div'); el.id = 'pairParty'; el.className = 'party'; el.setAttribute('role', 'status');
    const who = name || (P() && P().partnerName()) || S().receiver;
    el.innerHTML = '<div class="party-card"><div class="party-big">💞</div><h2>Verbunden!</h2><p>Du und ' + esc(who) + ' – ab jetzt landet alles direkt beim anderen.</p><button type="button" class="pill-btn primary" data-ok>Wie schön ✨</button></div>';
    document.body.appendChild(el); L.haptic(30);
    const close = () => { el.classList.add('gone'); setTimeout(() => el.remove(), 400); };
    el.querySelector('[data-ok]').onclick = close; el.onclick = (e) => { if (e.target === el) close(); };
    if (!calm()) {
      for (let i = 0; i < 26; i++) {
        const b = document.createElement('span'); b.className = 'party-b'; b.textContent = i % 5 === 4 ? '💗' : '🦋';
        b.style.filter = 'hue-rotate(' + HUES[i % HUES.length] + 'deg) saturate(1.4)'; el.appendChild(b);
        const ang = Math.random() * 6.283, dist = 160 + Math.random() * 260, dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 80;
        b.animate([{ transform: 'translate(-50%,-50%) scale(.3) rotate(0)', opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(' + (0.8 + Math.random() * 0.8) + ') rotate(' + ((Math.random() - 0.5) * 70) + 'deg)', opacity: 0 }],
          { duration: 1800 + Math.random() * 1400, delay: Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      }
    }
    if (L.spawnHearts) L.spawnHearts(16);
    setTimeout(() => { if (document.body.contains(el)) close(); }, 6500);
    C('pair_done');
  }

  /* ---------- Auswahl: scannen oder zeigen ---------- */
  function chooser() {
    const name = esc(S().receiver);
    L.openSheet('<h3>💞 Handys verbinden</h3><p class="about" style="font-size:17px;margin-bottom:12px">Einer zeigt den Code, der andere scannt ihn – fertig. Ohne Konto, verschlüsselt.</p>' +
      '<button type="button" class="pair-choice" data-scan><span class="pc-i">📷</span><span class="pc-b"><b>Code scannen</b><small>' + name + ' zeigt den Code in der App</small></span></button>' +
      '<button type="button" class="pair-choice" data-show><span class="pc-i">✨</span><span class="pc-b"><b>Meinen Code zeigen</b><small>' + name + ' scannt ihn mit der App</small></span></button>' +
      '<details class="pair-manual"><summary>Code lieber eintippen</summary><div class="field" style="margin-top:10px"><input id="pf-code" maxlength="24" placeholder="ABCDEF-GHJKLM-NPQRST" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Code"></div><button class="pill-btn" data-join>Beitreten</button></details>' +
      '<div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Später</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-scan]').onclick = () => { L.closeSheet(); scan(); };
      sh.querySelector('[data-show]').onclick = (e) => show(e.currentTarget);
      sh.querySelector('[data-join]').onclick = (e) => { const v = sh.querySelector('#pf-code').value; P().doJoin(v, e.currentTarget); };
    });
  }
  async function show(btn) {
    if (btn) { btn.disabled = true; }
    try { await P().createPair(); L.closeSheet(); P().renderAll(); P().pairSheet(); C('pair_show'); }
    catch (e) { if (btn) btn.disabled = false; L.toast('Keine Verbindung zum Dienst – ' + (navigator.onLine ? 'später nochmal' : 'du bist offline')); }
  }

  /* ---------- Scanner ---------- */
  let root = null, stream = null, raf = 0, detector = null, busy = false, last = 0, done = false;
  async function getDetector() {
    if (detector) return detector;
    try {
      if ('BarcodeDetector' in window) {
        const f = window.BarcodeDetector.getSupportedFormats ? await window.BarcodeDetector.getSupportedFormats() : ['qr_code'];
        if (f.includes('qr_code')) { const bd = new window.BarcodeDetector({ formats: ['qr_code'] }); detector = async (src) => { const r = await bd.detect(src); return r && r[0] ? r[0].rawValue : ''; }; return detector; }
      }
    } catch (e) { /* weiter mit jsQR */ }
    if (!window.jsQR) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/vendor/jsqr.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    const cv = document.createElement('canvas'), x = cv.getContext('2d', { willReadFrequently: true });
    detector = async (src) => {
      const w0 = src.videoWidth || src.naturalWidth || src.width, h0 = src.videoHeight || src.naturalHeight || src.height; if (!w0 || !h0) return '';
      const k = Math.min(1, 720 / Math.max(w0, h0)); cv.width = Math.round(w0 * k); cv.height = Math.round(h0 * k); x.drawImage(src, 0, 0, cv.width, cv.height);
      const img = x.getImageData(0, 0, cv.width, cv.height); const r = window.jsQR(img.data, cv.width, cv.height, { inversionAttempts: 'attemptBoth' });
      return r ? r.data : '';
    };
    return detector;
  }
  function codeFrom(text) {
    const t = String(text || '').trim(); const m = /[?&]pair=([^&#\s]+)/.exec(t); const raw = m ? decodeURIComponent(m[1]) : t;
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean.length === 18 ? raw : '';
  }
  async function found(text) {
    const code = codeFrom(text);
    if (!code) { const now = Date.now(); if (now - last > 3000) { last = now; L.toast('Das ist kein Schmetterlingsfutter-Code 🦋'); } return false; }
    done = true; L.haptic(25);
    const fr = root && root.querySelector('.scan-frame'); if (fr) fr.classList.add('hit');
    await new Promise((r) => setTimeout(r, 450)); close(); C('pair_scan_ok');
    const ok = await P().doJoin(code); return ok;
  }
  async function loop() {
    if (!root || done) return; raf = requestAnimationFrame(loop);
    const v = root.querySelector('video'); if (busy || !v || v.readyState < 2) return;
    busy = true;
    try { const det = await getDetector(); const txt = await det(v); if (txt && !done) await found(txt); } catch (e) { /* nächster Versuch */ }
    finally { setTimeout(() => { busy = false; }, 160); }
  }
  async function scan() {
    if (root) return; done = false; C('pair_scan');
    if (P() && P().paired && P().paired() && !P().joined()) await P().leavePair(true); // eigener, noch unbenutzter Code wird ersetzt
    root = document.createElement('div'); root.className = 'cam scan'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Code scannen');
    root.innerHTML = '<div class="cam-top"><button type="button" class="icon-btn" data-x aria-label="Scanner schließen">✕</button><span class="cam-title">📷 Code scannen</span><span style="width:44px"></span></div>' +
      '<div class="cam-stage"><video playsinline muted autoplay></video><div class="scan-frame"><i></i><i></i><i></i><i></i>' +
      ['', '', '', '', '', ''].map((_, i) => '<span class="scan-b" style="--d:' + (i * -1.1) + 's;filter:hue-rotate(' + HUES[i] + 'deg) saturate(1.4)">🦋</span>').join('') + '</div>' +
      '<div class="scan-hint">Halte die Kamera auf den Code im Handy von ' + esc(S().receiver) + '</div><div class="cam-msg hidden"></div></div>' +
      '<div class="scan-bar"><button type="button" class="pill-btn small" data-pick>🖼️ Bild vom Code</button><button type="button" class="pill-btn small" data-type>⌨️ Code eintippen</button></div>' +
      '<input type="file" accept="image/*" class="hidden" id="scanFile">';
    document.body.appendChild(root); document.documentElement.classList.add('cam-open');
    root.querySelector('[data-x]').onclick = close;
    root.querySelector('[data-type]').onclick = () => { close(); typeSheet(); };
    root.querySelector('[data-pick]').onclick = () => root.querySelector('#scanFile').click();
    root.querySelector('#scanFile').addEventListener('change', async (e) => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const url = URL.createObjectURL(f); const img = new Image();
      img.onload = async () => { try { const det = await getDetector(); const txt = await det(img); URL.revokeObjectURL(url); if (!txt) { L.toast('Im Bild ist kein Code zu erkennen'); return; } await found(txt); } catch (err) { L.toast('Bild nicht lesbar'); } };
      img.src = url;
    });
    getDetector().catch(() => {});
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { noCam('Die Kamera lässt sich hier nicht öffnen.'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
      if (!root) { stream.getTracks().forEach((t) => t.stop()); return; }
      const v = root.querySelector('video'); v.srcObject = stream; await v.play().catch(() => {}); loop();
    } catch (e) { noCam(e && e.name === 'NotAllowedError' ? 'Die Kamera ist nicht erlaubt. Erlaube sie in den Browser-Einstellungen für diese App.' : 'Keine Kamera gefunden.'); }
  }
  function noCam(text) {
    C('pair_scan_nocam'); const m = root && root.querySelector('.cam-msg'); if (!m) return; m.classList.remove('hidden');
    m.innerHTML = '<p>' + esc(text) + ' Du kannst ein Bild vom Code wählen (z. B. ein Bildschirmfoto) oder den Code eintippen.</p><div class="row wrap"><button class="pill-btn primary" data-pick2>🖼️ Bild vom Code</button><button class="pill-btn" data-type2>⌨️ Eintippen</button></div>';
    m.querySelector('[data-pick2]').onclick = () => root.querySelector('#scanFile').click();
    m.querySelector('[data-type2]').onclick = () => { close(); typeSheet(); };
  }
  function close() {
    cancelAnimationFrame(raf); if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (root) { root.remove(); root = null; } document.documentElement.classList.remove('cam-open');
  }
  function typeSheet() {
    L.openSheet('<h3>⌨️ Code eintippen</h3><div class="field"><label for="pf-code2">Code von ' + esc(S().receiver) + '</label><input id="pf-code2" maxlength="24" placeholder="ABCDEF-GHJKLM-NPQRST" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-join>Beitreten</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-join]').onclick = (e) => P().doJoin(sh.querySelector('#pf-code2').value, e.currentTarget);
    });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && root) close(); });

  /* ---------- Einrichtung: Schritt „Verbindet eure Handys“ ---------- */
  function obStep() {
    const step = document.querySelector('.ob-step[data-step="4"]'); if (!step) return;
    const pending = S().pendingPair;
    const body = step.querySelector('.ob-pair-body');
    if (pending) body.innerHTML = '<p class="about" style="font-size:18px">✅ Einladung von ' + esc(S().receiver || 'deinem Schatz') + ' erkannt. Nach „Los geht’s“ seid ihr verbunden.</p>';
    const fin = $('obFinish'); if (fin) fin.textContent = pending ? 'Los geht’s ❤' : 'Später verbinden';
  }
  const ps = $('obPairScan'), pw = $('obPairShow');
  if (ps) ps.onclick = () => { S().obPairChoice = 'scan'; $('obFinish').click(); setTimeout(scan, 450); };
  if (pw) pw.onclick = () => { S().obPairChoice = 'show'; $('obFinish').click(); setTimeout(() => show(), 450); };
  document.querySelectorAll('#onboarding [data-next]').forEach((b) => b.addEventListener('click', () => setTimeout(obStep, 30)));

  window.LZC = { celebrate, chooser, scan, show, codeFrom, closeScan: close };
})();
