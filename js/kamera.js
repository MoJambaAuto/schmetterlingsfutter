/* Schmetterlingsfutter – Schmetterlings-Kamera (3.20.0)
   Live-Kamera mit Effekten (Schwarm, Verwandlung mit Flügeln, Krone, Herzen), Foto und kurzes Video.
   Alles wird im Gerät gezeichnet. Ein Foto geht nur auf Knopfdruck an den Schatz (als Kritzel-Gruß, Ende-zu-Ende
   verschlüsselt, klein gerechnet); Videos lassen sich teilen oder speichern, aber nicht über den Dienst schicken.
   Keine Gesichtserkennung: Krone und Flügel sitzen dort, wo man hintippt. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const S = () => L.S, P = () => window.LZP;
  const esc = L.esc;
  const APP_URL = 'https://schmetterlingsfutter.de/';
  const PIC_MAX = 46000, PIC_RE = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;
  const FX = [['schwarm', '🦋 Schwarm'], ['verwandlung', '✨ Verwandlung'], ['krone', '👑 Krone'], ['herzen', '💕 Herzen'], ['ohne', 'Ohne']];
  const HUES = [0, 35, 80, 140, 190, 230, 280, 320];
  const REC_MAX = 10000;

  let root = null, cv = null, ctx = null, video = null, still = null, stream = null, facing = 'user', fx = 'schwarm';
  let tapped = false, raf = 0, t0 = 0, fxStart = 0, anchor = { x: 0.5, y: 0.42 }, sprites = null, parts = [], hearts = [];
  let rec = null, recChunks = [], recTimer = 0, recStart = 0, audioStream = null;
  const partnerOn = () => { const p = P(); return !!(p && p.paired() && p.joined()); };
  const partnerName = () => { const p = P(); return p ? p.partnerName() : S().receiver; };
  const mirror = () => !still && facing === 'user';

  /* ---------- Bausteine: bunte Schmetterlinge als vorgezeichnete Bilder ---------- */
  function makeSprites() {
    if (sprites) return sprites; sprites = [];
    HUES.forEach((h) => {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      try { x.filter = 'hue-rotate(' + h + 'deg) saturate(1.5)'; } catch (e) {}
      x.font = '104px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🦋', 64, 70);
      sprites.push(c);
    });
    return sprites;
  }
  function flutter(spr, x, y, size, t, speed, alpha, rot) {
    const k = 0.35 + 0.65 * Math.abs(Math.cos(t * speed));
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(k, 1);
    ctx.drawImage(spr, -size / 2, -size / 2, size, size); ctx.restore();
  }
  function resetParts(W, H) {
    const sp = makeSprites(); parts = [];
    for (let i = 0; i < 11; i++) parts.push({ spr: sp[i % sp.length], bx: Math.random(), by: 0.15 + Math.random() * 0.75, ax: 0.08 + Math.random() * 0.18, ay: 0.05 + Math.random() * 0.12, fx: 0.25 + Math.random() * 0.45, fy: 0.3 + Math.random() * 0.5, ph: Math.random() * 6.28, size: (0.07 + Math.random() * 0.07) * Math.min(W, H), fl: 9 + Math.random() * 7 });
    hearts = [];
    for (let i = 0; i < 16; i++) hearts.push({ x: Math.random(), y: 1 + Math.random(), v: 0.05 + Math.random() * 0.08, s: 0.04 + Math.random() * 0.05, d: Math.random() * 6.28, e: ['❤️', '💕', '💖', '💗', '🦋'][i % 5] });
  }

  /* ---------- Effekte ---------- */
  function drawFx(W, H, t) {
    const m = Math.min(W, H), ax = anchor.x * W, ay = anchor.y * H, sp = makeSprites();
    if (fx === 'schwarm') {
      parts.forEach((p) => {
        const x = (p.bx + Math.sin(t * p.fx + p.ph) * p.ax) * W, y = (p.by + Math.cos(t * p.fy + p.ph) * p.ay) * H;
        flutter(p.spr, x, y, p.size, t, p.fl, 0.95, Math.sin(t * p.fx + p.ph) * 0.35);
      });
    } else if (fx === 'herzen') {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      hearts.forEach((h) => {
        h.y -= h.v / 60; if (h.y < -0.1) { h.y = 1.1; h.x = Math.random(); }
        ctx.globalAlpha = Math.min(1, Math.max(0, (1.1 - Math.abs(h.y - 0.5) * 1.6)));
        ctx.font = Math.round(h.s * m) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
        ctx.fillText(h.e, (h.x + Math.sin(t + h.d) * 0.03) * W, h.y * H);
      });
      ctx.restore();
    } else if (fx === 'krone') {
      const w = 0.42 * m, cy = ay - 0.2 * m;
      for (let i = 0; i < 5; i++) {
        const u = (i - 2) / 2, x = ax + u * w / 2, y = cy + u * u * 0.05 * m - (i === 2 ? 0.035 * m : 0);
        flutter(sp[(i * 2) % sp.length], x, y, (i === 2 ? 0.13 : 0.1) * m, t + i * 0.4, 3.2, 1, u * 0.35);
      }
      sparkle(ax, cy, 0.28 * m, t, 10);
    } else if (fx === 'verwandlung') {
      const e = (performance.now() - fxStart) / 1000;
      if (e < 1.8) { // Schwarm zieht sich spiralförmig zusammen
        const k = e / 1.8;
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * 6.28 + k * 7, r = (1 - k) * 0.55 * m + 0.04 * m;
          flutter(sp[i % sp.length], ax + Math.cos(a) * r, ay + Math.sin(a) * r * 1.2, (0.09 - k * 0.04) * m, t, 14, 1, a);
        }
      }
      if (e > 1.5 && e < 2.4) { // Lichtblitz
        const a = 1 - Math.abs(e - 1.95) / 0.45; const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, 0.8 * m);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * a) + ')'); g.addColorStop(1, 'rgba(255,180,220,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      if (e > 1.9) wings(ax, ay, m, t, e - 1.9);
    }
  }
  /* Flügel, selbst gezeichnet: setzen hinter den Schultern an, falten sich auf und schlagen sanft.
     Durchscheinender Farbverlauf, Adern, Augenflecken, Leuchten. Das Gesicht bleibt frei. */
  const PALETTES = [[285, 325], [205, 255], [330, 15], [28, 48], [165, 195]];
  const easeBack = (x) => { const c = 1.6; x = Math.min(1, Math.max(0, x)); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  function wingSide(side, h1, h2) {
    const fore = new Path2D(); fore.moveTo(0.04, -0.02);
    fore.bezierCurveTo(0.18, -0.30, 0.46, -0.66, 0.66, -0.52); fore.bezierCurveTo(0.76, -0.42, 0.64, -0.16, 0.46, -0.06); fore.bezierCurveTo(0.30, 0.0, 0.14, 0.02, 0.04, -0.02);
    const hind = new Path2D(); hind.moveTo(0.04, 0.0);
    hind.bezierCurveTo(0.22, 0.02, 0.46, 0.05, 0.51, 0.22); hind.bezierCurveTo(0.55, 0.37, 0.36, 0.48, 0.23, 0.41); hind.bezierCurveTo(0.11, 0.34, 0.05, 0.16, 0.04, 0.0);
    const g = ctx.createRadialGradient(0.04, 0, 0.02, 0.04, 0, 0.78);
    g.addColorStop(0, 'hsla(' + h1 + ',100%,88%,0.08)'); g.addColorStop(0.32, 'hsla(' + h1 + ',95%,68%,0.42)');
    g.addColorStop(0.7, 'hsla(' + h2 + ',95%,58%,0.78)'); g.addColorStop(1, 'hsla(' + h2 + ',90%,32%,0.92)');
    ctx.save(); ctx.shadowColor = 'hsla(' + h1 + ',100%,72%,0.75)'; ctx.shadowBlur = 28;
    ctx.fillStyle = g; ctx.fill(hind); ctx.fill(fore); ctx.restore();
    /* Adern */
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 0.006; ctx.beginPath();
    [[0.62, -0.5], [0.66, -0.34], [0.5, -0.12], [0.46, 0.2], [0.3, 0.38]].forEach(([x, y]) => { ctx.moveTo(0.05, -0.005); ctx.quadraticCurveTo(x * 0.45, y * 0.3, x, y); });
    ctx.stroke();
    /* Rand: dunkle Kante mit feinem Lichtsaum */
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'hsla(' + h2 + ',70%,18%,0.85)'; ctx.lineWidth = 0.018; ctx.stroke(fore); ctx.stroke(hind);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.004; ctx.stroke(fore); ctx.stroke(hind);
    /* Augenfleck und Punkte */
    const eye = ctx.createRadialGradient(0.35, 0.26, 0, 0.35, 0.26, 0.075);
    eye.addColorStop(0, 'rgba(255,255,255,0.95)'); eye.addColorStop(0.35, 'hsla(' + h1 + ',100%,70%,0.9)'); eye.addColorStop(0.7, 'hsla(' + h2 + ',80%,20%,0.85)'); eye.addColorStop(1, 'hsla(' + h2 + ',80%,20%,0)');
    ctx.fillStyle = eye; ctx.beginPath(); ctx.arc(0.35, 0.26, 0.075, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    [[0.6, -0.47, 0.016], [0.66, -0.4, 0.013], [0.53, -0.52, 0.012], [0.68, -0.32, 0.01]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); });
  }
  function wings(ax, ay, m, t, e) {
    const [h1, h2] = PALETTES[Math.floor(fxStart / 1000) % PALETTES.length];
    const grow = easeBack(e / 0.9), s = 0.78 * m * grow, k = 0.8 + 0.2 * Math.sin(t * 2.6), bx = ax, by = ay + 0.27 * m;
    if (s <= 1) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, e / 0.4);
    [-1, 1].forEach((side) => { ctx.save(); ctx.translate(bx + side * 0.02 * m, by); ctx.rotate(side * -0.06 * Math.sin(t * 2.6)); ctx.scale(side * k * s, s); wingSide(side, h1, h2); ctx.restore(); });
    ctx.restore();
    /* ein paar kleine Begleiter und Glitzer */
    const sp = makeSprites();
    for (let i = 0; i < 4; i++) { const ang = t * 0.5 + i * 1.57; flutter(sp[(i * 3) % sp.length], bx + Math.cos(ang) * 0.5 * m, by - 0.2 * m + Math.sin(ang) * 0.36 * m, 0.07 * m, t + i, 10, Math.min(1, e), Math.cos(ang) * 0.4); }
    sparkle(bx, by - 0.15 * m, 0.48 * m, t, 18, Math.min(1, e));
  }
  function sparkle(cx, cy, r, t, n, a) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const ang = i * 2.399 + t * 0.6, rr = r * (0.4 + 0.6 * ((i * 37) % 10) / 10), tw = 0.5 + 0.5 * Math.sin(t * 4 + i);
      ctx.globalAlpha = (a == null ? 1 : a) * tw; ctx.fillStyle = i % 2 ? '#fff6c2' : '#ffd1e8';
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.8, 2 + tw * 3, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  }
  function watermark(W, H) {
    const fs = Math.max(14, Math.round(Math.min(W, H) * 0.035));
    ctx.save(); ctx.font = '700 ' + fs + 'px Lato, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = fs / 3; ctx.fillStyle = 'rgba(255,255,255,.88)';
    ctx.fillText('🦋 Schmetterlingsfutter', W - fs * 0.7, H - fs * 0.6); ctx.restore();
  }

  /* ---------- Bildschleife ---------- */
  function frame() {
    raf = requestAnimationFrame(frame);
    const src = still || video; if (!src) return;
    const sw = still ? still.naturalWidth : video.videoWidth, sh = still ? still.naturalHeight : video.videoHeight; if (!sw || !sh) return;
    const scale = Math.min(1, 1080 / Math.max(sw, sh)), W = Math.round(sw * scale), H = Math.round(sh * scale);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; resetParts(W, H); }
    const t = (performance.now() - t0) / 1000;
    ctx.save(); if (mirror()) { ctx.translate(W, 0); ctx.scale(-1, 1); } ctx.drawImage(src, 0, 0, W, H); ctx.restore();
    drawFx(W, H, t); watermark(W, H);
    if (rec) { const left = Math.max(0, REC_MAX - (performance.now() - recStart)); const b = root.querySelector('[data-rec]'); if (b) b.style.setProperty('--p', (1 - left / REC_MAX) * 100 + '%'); }
  }

  /* ---------- Kamera an/aus ---------- */
  async function startCam() {
    stopCam(); still = null;
    const msg = root.querySelector('.cam-msg'); msg.classList.add('hidden');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { showMsg('Diese App-Ansicht kann die Kamera nicht direkt öffnen. Nimm stattdessen ein Foto auf oder wähle eins aus.'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      video.srcObject = stream; await video.play().catch(() => {});
    } catch (e) {
      showMsg(e && e.name === 'NotAllowedError' ? 'Die Kamera ist nicht erlaubt. Erlaube sie in den Einstellungen des Browsers für diese App, oder nimm ein Foto auf.' : 'Keine Kamera gefunden. Du kannst ein Foto aufnehmen oder auswählen.');
    }
  }
  function stopCam() { if (stream) { stream.getTracks().forEach((tr) => tr.stop()); stream = null; } if (video) video.srcObject = null; }
  function showMsg(text) {
    const msg = root.querySelector('.cam-msg'); msg.classList.remove('hidden');
    window.LZS && window.LZS.count('cam_nocam'); msg.innerHTML = '<p>' + esc(text) + '</p><button type="button" class="pill-btn primary" data-pick2>📷 Foto aufnehmen oder auswählen</button>';
    msg.querySelector('[data-pick2]').onclick = () => root.querySelector('#camFile').click();
  }
  function useFile(f) {
    if (!f) return; const url = URL.createObjectURL(f); const img = new Image();
    img.onload = () => { stopCam(); still = img; root.querySelector('.cam-msg').classList.add('hidden'); };
    img.onerror = () => { URL.revokeObjectURL(url); L.toast('Bild nicht lesbar'); };
    img.src = url;
  }

  /* ---------- Foto ---------- */
  function shoot() {
    if (!cv.width) { L.toast('Kamera startet noch …'); return; }
    window.LZS && window.LZS.count('cam_photo:' + fx); L.haptic(15); const fl = root.querySelector('.cam-flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    cv.toBlob((blob) => { if (blob) preview({ kind: 'photo', blob, url: URL.createObjectURL(blob) }); }, 'image/jpeg', 0.9);
  }
  function smallDataUrl() {
    for (const side of [760, 600, 480, 360]) {
      const k = Math.min(1, side / Math.max(cv.width, cv.height)); const c = document.createElement('canvas'); c.width = Math.round(cv.width * k); c.height = Math.round(cv.height * k);
      c.getContext('2d').drawImage(lastShot || cv, 0, 0, c.width, c.height);
      for (const [type, q] of [['image/webp', 0.82], ['image/jpeg', 0.75], ['image/webp', 0.6], ['image/jpeg', 0.5]]) { const u = c.toDataURL(type, q); if (u.length <= PIC_MAX && PIC_RE.test(u)) return u; }
    }
    return null;
  }
  let lastShot = null;

  /* ---------- Video ---------- */
  function pickMime() {
    if (!window.MediaRecorder) return null;
    for (const m of ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {} }
    return '';
  }
  async function toggleRec() {
    const btn = root.querySelector('[data-rec]');
    if (rec) { rec.stop(); return; }
    const mime = pickMime(); if (mime === null || !cv.captureStream) { L.toast('Video geht auf diesem Gerät nicht – mach ein Foto 📸'); return; }
    if (!cv.width) { L.toast('Kamera startet noch …'); return; }
    const out = cv.captureStream(30);
    try { audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }); audioStream.getAudioTracks().forEach((tr) => out.addTrack(tr)); } catch (e) { audioStream = null; }
    recChunks = [];
    try { rec = mime ? new MediaRecorder(out, { mimeType: mime, videoBitsPerSecond: 2500000 }) : new MediaRecorder(out); } catch (e) { rec = null; L.toast('Video geht auf diesem Gerät nicht'); return; }
    rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) recChunks.push(ev.data); };
    rec.onstop = () => {
      clearTimeout(recTimer); btn.classList.remove('on'); btn.style.removeProperty('--p'); btn.setAttribute('aria-label', 'Video aufnehmen');
      if (audioStream) { audioStream.getTracks().forEach((tr) => tr.stop()); audioStream = null; }
      const type = (rec && rec.mimeType) || mime || 'video/webm'; rec = null;
      const blob = new Blob(recChunks, { type: type.split(';')[0] }); if (blob.size) preview({ kind: 'video', blob, url: URL.createObjectURL(blob) });
    };
    window.LZS && window.LZS.count('cam_video:' + fx); rec.start(250); recStart = performance.now(); btn.classList.add('on'); btn.setAttribute('aria-label', 'Aufnahme beenden'); L.haptic(10);
    recTimer = setTimeout(() => { if (rec) rec.stop(); }, REC_MAX);
  }

  /* ---------- Vorschau: schicken, teilen, speichern ---------- */
  function preview(item) {
    if (item.kind === 'photo') { lastShot = document.createElement('canvas'); lastShot.width = cv.width; lastShot.height = cv.height; lastShot.getContext('2d').drawImage(cv, 0, 0); }
    const pv = root.querySelector('.cam-prev'); pv.classList.remove('hidden');
    const name = esc(partnerName()); const send = item.kind === 'photo' && partnerOn();
    pv.innerHTML = (item.kind === 'photo' ? '<img src="' + item.url + '" alt="Dein Schmetterlings-Foto">' : '<video src="' + item.url + '" controls autoplay loop playsinline></video>') +
      '<div class="field" style="margin:12px 0 10px"><input id="camText" maxlength="80" placeholder="Ein Satz dazu (optional)" autocomplete="off" aria-label="Ein Satz dazu"></div>' +
      '<div class="row wrap">' + (send ? '<button class="pill-btn primary" data-send>💌 An ' + name + '</button>' : '') + '<button class="pill-btn' + (send ? '' : ' primary') + '" data-share>↗ Teilen</button><button class="pill-btn" data-save>💾 Speichern</button><button class="pill-btn ghost" data-again>Nochmal</button></div>' +
      (item.kind === 'video' ? '<p class="cam-note">Videos gehen über „Teilen“ an ' + name + ' oder an alle, nicht über die App-Verbindung.</p>' : (partnerOn() ? '' : '<p class="cam-note">Mit verbundenen Apps landet das Foto direkt bei ' + name + '.</p>'));
    const text = () => pv.querySelector('#camText').value.trim();
    const ext = item.kind === 'photo' ? 'jpg' : (item.blob.type.includes('mp4') ? 'mp4' : 'webm');
    const fname = 'schmetterlingsfutter-' + (item.kind === 'photo' ? 'foto' : 'video') + '.' + ext;
    pv.querySelector('[data-again]').onclick = () => closePreview(item);
    pv.querySelector('[data-save]').onclick = () => { window.LZS && window.LZS.count('cam_save:' + item.kind); download(item.blob, fname); L.toast(item.kind === 'photo' ? 'Foto gespeichert 💾' : 'Video gespeichert 💾'); };
    pv.querySelector('[data-share]').onclick = async () => { window.LZS && window.LZS.count('cam_share:' + item.kind);
      const caption = (text() ? text() + ' — ' : '') + S().sender + ' 🦋\nGemacht mit Schmetterlingsfutter: ' + APP_URL;
      let file = null; try { file = new File([item.blob], fname, { type: item.blob.type }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text: caption }); } catch (e) {} return; }
      download(item.blob, fname); L.toast('Gespeichert – jetzt im Messenger anhängen');
    };
    const sb = pv.querySelector('[data-send]'); if (sb) sb.onclick = async () => {
      const u = smallDataUrl(); if (!u) { L.toast('Foto zu groß zum Schicken – nutze „Teilen“'); return; }
      sb.disabled = true; sb.textContent = '…';
      window.LZS && window.LZS.count('cam_send'); try { await P().send({ t: 'pic', img: u, text: text() || '📸 Schmetterlings-Foto' }); L.toast('📸 Unterwegs zu ' + partnerName()); L.spawnHearts(10); close(); }
      catch (e) { sb.disabled = false; sb.textContent = '💌 An ' + partnerName(); L.toast('Senden fehlgeschlagen – später nochmal'); }
    };
  }
  function closePreview(item) { const pv = root.querySelector('.cam-prev'); pv.classList.add('hidden'); pv.innerHTML = ''; if (item && item.url) setTimeout(() => URL.revokeObjectURL(item.url), 1000); }
  function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }

  /* ---------- Öffnen / Schließen ---------- */
  function setFx(id, user) {
    if (user && fx !== id) window.LZS && window.LZS.count('cam_fx:' + id);
    fx = id; fxStart = performance.now(); if (cv.width) resetParts(cv.width, cv.height);
    root.querySelectorAll('[data-fx]').forEach((b) => { const on = b.dataset.fx === id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const hint = root.querySelector('.cam-hint'); hint.classList.toggle('hidden', tapped || !(id === 'krone' || id === 'verwandlung'));
  }
  function open() {
    if (root) return; window.LZS && window.LZS.count('cam_open');
    root = document.createElement('div'); root.className = 'cam'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Schmetterlings-Kamera');
    root.innerHTML = '<div class="cam-top"><button type="button" class="icon-btn" data-x aria-label="Kamera schließen">✕</button><span class="cam-title">🦋 Schmetterlings-Kamera</span><button type="button" class="icon-btn" data-flip aria-label="Kamera wechseln">🔄</button></div>' +
      '<div class="cam-stage"><canvas aria-label="Kamerabild mit Schmetterlingen"></canvas><div class="cam-hint hidden">Tippe auf dein Gesicht, dann sitzen Krone und Flügel richtig</div><div class="cam-msg hidden"></div><div class="cam-flash"></div></div>' +
      '<div class="cam-fx" role="group" aria-label="Effekte">' + FX.map((f) => '<button type="button" data-fx="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>' +
      '<div class="cam-bar"><button type="button" class="cam-side" data-pick aria-label="Foto aufnehmen oder auswählen">🖼️</button><button type="button" class="cam-shot" data-shot aria-label="Foto machen"></button><button type="button" class="cam-side cam-rec" data-rec aria-label="Video aufnehmen">🎬</button></div>' +
      '<input type="file" accept="image/*" class="hidden" id="camFile"><div class="cam-prev hidden"></div>';
    document.body.appendChild(root); document.documentElement.classList.add('cam-open');
    cv = root.querySelector('canvas'); ctx = cv.getContext('2d');
    video = document.createElement('video'); video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
    root.querySelector('[data-x]').onclick = close;
    root.querySelector('[data-flip]').onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; startCam(); };
    root.querySelector('[data-shot]').onclick = shoot;
    root.querySelector('[data-rec]').onclick = toggleRec;
    root.querySelector('[data-pick]').onclick = () => root.querySelector('#camFile').click();
    root.querySelector('#camFile').addEventListener('change', (e) => { useFile(e.target.files[0]); e.target.value = ''; });
    root.querySelectorAll('[data-fx]').forEach((b) => { b.onclick = () => setFx(b.dataset.fx, true); });
    cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(); anchor = { x: Math.min(.95, Math.max(.05, (e.clientX - r.left) / r.width)), y: Math.min(.95, Math.max(.05, (e.clientY - r.top) / r.height)) }; if (fx === 'verwandlung') fxStart = performance.now(); tapped = true; root.querySelector('.cam-hint').classList.add('hidden'); });
    t0 = performance.now(); setFx(S().camFx || 'schwarm'); frame(); startCam();
  }
  function close() {
    if (!root) return; if (rec) { try { rec.onstop = null; rec.stop(); } catch (e) {} rec = null; }
    if (audioStream) { audioStream.getTracks().forEach((tr) => tr.stop()); audioStream = null; }
    cancelAnimationFrame(raf); stopCam(); S().camFx = fx; L.save();
    root.remove(); root = null; still = null; lastShot = null; document.documentElement.classList.remove('cam-open');
  }
  document.addEventListener('visibilitychange', () => { if (!root) return; if (document.hidden) { if (rec) rec.stop(); stopCam(); } else if (!still) startCam(); });

  /* Einstieg auf der Startseite */
  const tile = document.getElementById('btnKamera'); if (tile) tile.onclick = open;
  window.LZK = { open, close };
})();
