/* Schmetterlingsfutter – Teilen als Bildkarte, Liebesgedicht, gemeinsamer Schmetterling.
   Grundsatz für den Schmetterling: er gehört beiden, zeigt nie, wer wie viel beigetragen hat, und er stirbt nie. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const P = () => window.LZP;
  const $ = (id) => document.getElementById(id), esc = L.esc, S = () => L.S;
  const APP_URL = 'https://schmetterlingsfutter.de/'; // Teilen an Dritte: die Website (mit Knopf zur App)
  const SHARE_LINE = 'Guckt mal: Futter für meine Schmetterlinge im Bauch 🦋';
  const joined = () => !!(P() && P().joined && P().joined());
  const you = () => (P() && P().partnerName ? P().partnerName() : S().receiver);

  /* =====================================================================
     1. Teilen als Bildkarte (für Instagram, Facebook, WhatsApp-Status …)
     ===================================================================== */
  function wrap(ctx, text, maxW) {
    const out = [];
    String(text).split('\n').forEach((para) => {
      let line = '';
      para.split(/\s+/).forEach((w) => { const t = line ? line + ' ' + w : w; if (line && ctx.measureText(t).width > maxW) { out.push(line); line = w; } else line = t; });
      out.push(line);
    });
    return out;
  }
  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const hex = (c, d) => /^#[0-9a-f]{6}$/i.test(c) ? c : d;
  async function cardBlob(o) {
    try { await Promise.all([document.fonts.load('italic 60px "Playfair Display"'), document.fonts.load('700 30px Lato')]); } catch (e) {}
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const cs = getComputedStyle(document.documentElement), v = (n, d) => hex((cs.getPropertyValue(n) || '').trim(), d);
    const bg0 = v('--bg0', '#1a0a1e'), bg1 = v('--bg1', '#2d1133'), acc = v('--accent', '#ff6496'), acc2 = v('--accent-2', '#ff85a1');
    const g = x.createRadialGradient(W / 2, H * 0.36, 40, W / 2, H * 0.45, H * 0.85); g.addColorStop(0, bg1); g.addColorStop(1, bg0); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const g2 = x.createRadialGradient(W / 2, 330, 10, W / 2, 330, 520); g2.addColorStop(0, acc + '40'); g2.addColorStop(1, acc + '00'); x.fillStyle = g2; x.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 46; i++) { x.globalAlpha = 0.25 + rnd() * 0.55; x.fillStyle = '#fff'; x.beginPath(); x.arc(rnd() * W, rnd() * H, 1 + rnd() * 2.4, 0, 7); x.fill(); }
    x.globalAlpha = 1; x.strokeStyle = acc2 + '66'; x.lineWidth = 3; const r = 44, m = 36;
    x.beginPath(); x.moveTo(m + r, m); x.arcTo(W - m, m, W - m, H - m, r); x.arcTo(W - m, H - m, m, H - m, r); x.arcTo(m, H - m, m, m, r); x.arcTo(m, m, W - m, m, r); x.closePath(); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    // Überschrift
    if (o.label) { x.fillStyle = acc2; x.font = '700 30px Lato, sans-serif'; try { x.letterSpacing = '5px'; } catch (e) {} x.fillText(String(o.label).toUpperCase().slice(0, 40), W / 2, 150); try { x.letterSpacing = '0px'; } catch (e) {} }
    // Text: Größe so wählen, dass er in den Rahmen passt
    const maxW = 860, maxH = 640; let fs = 80, lines = [];
    for (; fs >= 36; fs -= 4) { x.font = 'italic ' + fs + 'px "Playfair Display", Georgia, serif'; lines = wrap(x, o.text, maxW); if (lines.length * fs * 1.34 <= maxH) break; }
    const lh = fs * 1.34, top = 230 + (maxH - lines.length * lh) / 2 + fs;
    x.fillStyle = '#ffffff'; lines.forEach((l, i) => x.fillText(l, W / 2, top + i * lh));
    if (o.sig) { x.fillStyle = acc2; x.font = '700 36px Lato, sans-serif'; x.fillText('— ' + o.sig, W / 2, Math.min(top + lines.length * lh + 34, 960)); }
    // Fußzeile mit App-Namen
    const icon = await loadImg('icons/icon-192.png');
    if (icon) { const s = 104, ix = W / 2 - s / 2, iy = 1010; x.save(); x.beginPath(); x.arc(W / 2, iy + s / 2, s / 2, 0, 7); x.clip(); x.drawImage(icon, ix, iy, s, s); x.restore(); }
    x.fillStyle = '#ffffff'; x.font = '46px "Playfair Display", Georgia, serif'; x.fillText('Schmetterlingsfutter', W / 2, 1182);
    x.fillStyle = '#f6dbe6'; x.font = '400 30px Lato, sans-serif'; x.fillText('Futter für die Schmetterlinge im Bauch', W / 2, 1230);
    x.fillStyle = acc2; x.font = '700 28px Lato, sans-serif'; x.fillText(APP_URL.replace('https://', '').replace(/\/$/, ''), W / 2, 1278);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }
  async function shareFile(blob, name, fallbackTitle) {
    const caption = SHARE_LINE + '\n' + APP_URL;
    let file = null; try { file = new File([blob], name, { type: blob.type || 'image/png' }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: caption }); return true; } catch (e) { if (e && e.name === 'AbortError') return false; }
    }
    // Kein Teilen-Menü für Bilder (z. B. am PC): Bild zeigen, speichern und Text kopieren lassen
    const url = URL.createObjectURL(blob);
    L.openSheet('<h3>' + esc(fallbackTitle || '🖼️ Bild zum Teilen') + '</h3><img src="' + url + '" alt="Bild zum Teilen" style="width:100%;border-radius:16px;margin-bottom:14px">' +
      '<div class="row wrap"><a class="pill-btn primary" download="' + esc(name) + '" href="' + url + '">Bild speichern</a><button class="pill-btn" data-copy>Text kopieren</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = () => { L.closeSheet(); setTimeout(() => URL.revokeObjectURL(url), 500); };
      sh.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(caption); L.toast('Kopiert 📋'); } catch (e) { L.toast(caption); } };
    });
    return true;
  }
  async function shareCard(o) {
    try { const blob = await cardBlob(o); if (!blob) throw new Error('kein Bild'); return await shareFile(blob, 'schmetterlingsfutter.png'); }
    catch (e) { L.shareText(o.text + (o.sig ? '\n— ' + o.sig : '') + '\n\n' + SHARE_LINE + '\n' + APP_URL); return false; }
  }
  async function sharePic(dataUrl) {
    try { const blob = await (await fetch(dataUrl)).blob(); return await shareFile(blob, 'schmetterlingsfutter-gruss.' + (blob.type === 'image/jpeg' ? 'jpg' : 'png')); }
    catch (e) { L.toast('Teilen nicht möglich'); return false; }
  }

  /* =====================================================================
     2. Liebesgedicht: zwei Reimpaare, eines zu dem, was du liebst, eines zur Stimmung
     ===================================================================== */
  const POEM = {
    moods: [['romantisch', '💗 Romantisch'], ['frech', '😜 Frech'], ['verspielt', '🦋 Verspielt'], ['schmelz', '✨ Schmelzend']],
    traits: [['lachen', '😄 Lachen'], ['augen', '👀 Augen'], ['naehe', '🤗 Nähe'], ['humor', '🤪 Humor'], ['kuesse', '💋 Küsse'], ['mut', '💪 Stärke'], ['herz', '❤️ Herz'], ['stimme', '🎙️ Stimme']],
    t: {
      lachen: [['Dein Lachen macht den Morgen hell,', 'mit dir vergeht die Zeit so schnell.'], ['Wenn du lachst, dann lacht mein Herz,', 'vergessen sind dann Stress und Schmerz.'], ['Dein Lachen ist mein Lieblingsklang,', 'ich hör es gern ein Leben lang.']],
      augen: [['In deinen Augen wohnt ein Licht,', 'ein schöneres, das kenn ich nicht.'], ['Ein Blick von dir, und ich bin still,', 'weil ich nur dich ansehen will.'], ['Deine Augen, tief wie die See,', 'ich tauch hinein, sooft ich dich seh.']],
      naehe: [['In deinem Arm ist mein Zuhaus,', 'da halt ich jeden Sturm gut aus.'], ['Liegt deine Hand in meiner drin,', 'dann weiß ich wieder, wo ich bin.'], ['Bei dir zu sein ist mein Lieblingsort,', 'von dort will ich nie wieder fort.']],
      humor: [['Du bringst mich zum Lachen, Tag für Tag,', 'das ist ein Grund, warum ich dich mag.'], ['Mit dir wird selbst der Abwasch schön,', 'ich könnt dir stundenlang zusehn.'], ['Dein Quatsch am Morgen, dein Quatsch bei Nacht', 'hat mich schon tausendmal glücklich gemacht.']],
      kuesse: [['Ein Kuss von dir, und ich bin hin,', 'weil ich so gern in deiner Nähe bin.'], ['Dein Kuss schmeckt mir wie Sommerwind,', 'wie Tage, die die schönsten sind.'], ['Küss mich jetzt und küss mich dann,', 'damit ich nie genug kriegen kann.']],
      mut: [['Du stehst zu mir bei Wind und Regen,', 'was Bessres kann es gar nicht geben.'], ['Du gibst mir Mut, wenn meiner fehlt,', 'du bist der Mensch, der für mich zählt.'], ['Mit dir trau ich mir alles zu,', 'mein Lieblingsmensch, das bist halt du.']],
      herz: [['Dein Herz ist groß, dein Herz ist warm,', 'ich fühl mich reich in deinem Arm.'], ['Du siehst mich so, wie ich wirklich bin,', 'und genau da will ich immer hin.'], ['Du hörst mir zu, du hältst mich aus,', 'mit dir wird jedes Haus zum Zuhaus.']],
      stimme: [['Deine Stimme, sanft und klar,', 'macht jeden grauen Tag wunderbar.'], ['Ruf mich an, erzähl mir was,', 'mit dir macht selbst das Schweigen Spaß.'], ['Flüsterst du mir leis ins Ohr,', 'kommt mir die Welt wie Zauber vor.']]
    },
    m: {
      romantisch: [['Drum sag ich’s dir in diesem Reim:', 'Bei dir, {r}, bin ich daheim.'], ['Ich lieb dich heute, lieb dich morgen,', 'bei dir sind meine Träume geborgen.'], ['Du bist mein Glück, mein Lieblingsstück,', 'ich geb dich niemals mehr zurück.'], ['Was immer kommt, was immer war:', 'Ich lieb dich, {r}, Jahr für Jahr.']],
      frech: [['Du nervst mich manchmal, das ist wahr,', 'doch ohne dich wär’s sonderbar.'], ['Du klaust die Decke, Nacht für Nacht,', 'und bist doch das, was mich glücklich macht.'], ['Kurz gesagt und ohne Mist:', 'Schön, dass du meine Nervensäge bist.'], ['Ich teil mit dir, und zwar nur mit dir,', 'mein letztes Stück Schokolade hier.']],
      verspielt: [['Die Schmetterlinge in meinem Bauch', 'sagen, du magst mich. Ich dich auch.'], ['Rosen sind rot, Veilchen sind blau,', 'dass ich dich liebe, weiß ich genau.'], ['Eins und eins macht bei uns zwei,', 'und ich bin gern für immer dabei.'], ['Hätt ich drei Wünsche, glaub es mir:', 'Alle drei gehörten dir.']],
      schmelz: [['Du bist der Stern in meiner Nacht,', 'der über meinen Träumen wacht.'], ['Seit du mein Herz hast eingepackt,', 'schlägt es allein in deinem Takt.'], ['Wo du bist, da ist mein Licht,', 'ein schönres Zuhaus, das gibt es nicht.'], ['Du bist mein Anfang und mein Ziel,', 'von dir bekomm ich nie zu viel.']]
    }
  };
  function poemSheet() {
    const st = { mood: 'romantisch', trait: 'lachen', a: 0, b: 0 };
    const roll = () => { st.a = Math.floor(Math.random() * POEM.t[st.trait].length); st.b = Math.floor(Math.random() * POEM.m[st.mood].length); };
    const text = () => L.fmt(POEM.t[st.trait][st.a].concat(POEM.m[st.mood][st.b]).join('\n'));
    roll();
    L.openSheet('<h3>🪶 Liebesgedicht</h3>' +
      '<div class="poem" id="pmOut" aria-live="polite"></div>' +
      '<div class="field"><label>Das liebe ich an dir</label><div class="chips" id="pmTrait"></div></div>' +
      '<div class="field"><label>Stimmung</label><div class="chips" id="pmMood"></div></div>' +
      '<div class="row wrap"><button class="pill-btn primary" data-go>' + (joined() ? '💌 Verschicken' : '↗ Teilen') + '</button><button class="pill-btn" data-new>🎲 Neu würfeln</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      const chips = (id, list, key) => { const b = sh.querySelector(id); b.innerHTML = list.map((x) => '<button type="button" data-k="' + x[0] + '"' + (x[0] === st[key] ? ' class="on"' : '') + '>' + x[1] + '</button>').join(''); b.querySelectorAll('button').forEach((el) => el.onclick = () => { st[key] = el.dataset.k; roll(); draw(); }); };
      const part = (n, lines) => '<button type="button" class="poem-part" data-part="' + n + '" aria-label="Diese zwei Zeilen tauschen"><span>' + lines.map((l) => esc(L.fmt(l))).join('<br>') + '</span><i aria-hidden="true">↻</i></button>';
      function draw() {
        chips('#pmTrait', POEM.traits, 'trait'); chips('#pmMood', POEM.moods, 'mood');
        const out = sh.querySelector('#pmOut'); out.innerHTML = part(0, POEM.t[st.trait][st.a]) + part(1, POEM.m[st.mood][st.b]);
        out.querySelectorAll('[data-part]').forEach((el) => el.onclick = () => { if (el.dataset.part === '0') st.a = (st.a + 1) % POEM.t[st.trait].length; else st.b = (st.b + 1) % POEM.m[st.mood].length; L.haptic(6); draw(); });
      }
      draw();
      sh.querySelector('[data-new]').onclick = () => { roll(); L.haptic(6); draw(); };
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-go]').onclick = () => { const t = text(); L.closeSheet(); L.showMessage({ text: t, own: true }, 'Liebesgedicht'); if (P()) P().sendOrShare(t, 'Liebesgedicht'); else shareCard({ text: t, label: 'Liebesgedicht', sig: S().sender }); };
    });
  }

  /* =====================================================================
     3. Euer Schmetterling: jede liebe Geste ist Futter. Er wächst für euch beide gemeinsam.
     ===================================================================== */
  /* 3.32.0 (Idee von Mos Tochter): Es geht nach dem ersten Falter weiter. Jede Generation läuft wieder von Ei über Raupe
     und Kokon zum Falter – und jeder neue Falter ist eine Stufe seltener und schöner. Alle landen im Schmetterlingsbuch.
     Reihenfolge: 9 Arten (Bilder aus img/falter.webp, gleiche Tafel wie die 3D-Heide), danach Prachtformen ohne Ende. */
  const STAGE_UI = [['🥚', 'Ein Ei'], ['🐛', 'Eine Raupe'], ['kokon', 'Ein Kokon']];
  const DAY_CAP = 6;
  const LADDER = [
    { n: 'Kohlweißling', r: 'Häufig', f: 'Der häufigste Tagfalter in unseren Gärten. Seine Raupen lieben Kohl – daher der Name.' },
    { n: 'Zitronenfalter', r: 'Häufig', f: 'Einer der langlebigsten Falter Europas: Er überwintert als Falter und kann fast ein Jahr alt werden.' },
    { n: 'Hauhechel-Bläuling', pn: 'Bläuling', r: 'Verbreitet', f: 'Nur die Männchen sind so leuchtend blau, die Weibchen tragen Braun mit orangen Tupfen.' },
    { n: 'Kleiner Fuchs', pn: 'Fuchs', r: 'Verbreitet', f: 'Seine Raupen fressen Brennnesseln. Im Frühling gehört er zu den ersten Faltern im Garten.' },
    { n: 'Tagpfauenauge', g: 'n', r: 'Besonders', f: 'Die großen Augenflecken erschrecken Vögel. Er überwintert gern in Kellern und Schuppen.' },
    { n: 'Admiral', r: 'Besonders', f: 'Ein Wanderfalter: Viele fliegen jedes Jahr aus dem Süden über die Alpen zu uns.' },
    { n: 'Schwalbenschwanz', r: 'Selten', f: 'Einer der größten Tagfalter Deutschlands und besonders geschützt. Erkennbar an den „Schwänzchen“.' },
    { n: 'Goldener Falter', pn: 'Goldfalter', r: 'Sehr selten', f: 'Ihn gibt es nur bei euch: Er erscheint, wenn sich zwei lange genug gegenseitig füttern.' },
    { n: 'Papillon', r: 'Einzigartig', f: 'Der Begleiter aus eurer App. Wer ihn hat, hat die ganze Wiese entdeckt.' }
  ];
  const TIERS = [['', ''], ['Schillernder ', 'Prachtform: schillert in allen Farben.'], ['Sternen-', 'Prachtform: trägt Sternenglanz.'], ['Regenbogen-', 'Prachtform: leuchtet in Regenbogenfarben.']];
  const KOKON = '<svg viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true"><path d="M6 8h36" stroke="#c9a27a" stroke-width="3" stroke-linecap="round"/><path d="M24 8v6" stroke="#c9a27a" stroke-width="2"/><ellipse cx="24" cy="28" rx="9" ry="15" fill="#e6c9a0"/><path d="M16 22q8 4 16 0M15.5 29q8.5 4 17 0M17 36q7 3 14 0" stroke="#b98f5f" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  function bst() {
    const s = S(); if (!s.bfly) s.bfly = { own: 0, their: 0, days: {}, seen: {}, level: 0, last: 0, synced: 0 };
    const b = s.bfly; if (!b.days) b.days = {}; if (!b.seen) b.seen = {}; return b;
  }
  const total = () => { const b = bst(); return (b.own || 0) + (b.their || 0); };
  /* Generation k braucht etwas mehr Futter als die vorige: 20, 24, 28 … höchstens 60 */
  const genLen = (k) => Math.min(60, 20 + 4 * (k - 1));
  function pos(t) {
    let k = 1, start = 0; while (t >= start + genLen(k)) { start += genLen(k); k++; }
    const len = genLen(k), p = t - start, cut = [0, Math.ceil(len * 0.15), Math.ceil(len * 0.5)];
    const stage = p >= cut[2] ? 2 : p >= cut[1] ? 1 : 0;
    return { done: k - 1, gen: k, p, len, stage, next: stage < 2 ? cut[stage + 1] : len };
  }
  const level = (t) => { const q = pos(t); return q.done * 3 + q.stage; };
  /* n-ter Falter (1 = erster): Art aus der Leiter, ab Runde 2 als Prachtform */
  function falter(n) {
    const i = (n - 1) % LADDER.length, tier = Math.floor((n - 1) / LADDER.length), t = TIERS[Math.min(tier, TIERS.length - 1)];
    const base = LADDER[i];
    return { n, i, tier, name: (tier ? (tier === 1 && base.g === 'n' ? 'Schillerndes ' : t[0]) + (base.pn || base.n) : base.n) + (tier >= TIERS.length ? ' ' + (tier - TIERS.length + 2) : ''), rar: tier ? 'Prachtform' + (tier > 1 ? ' ' + tier : '') : base.r, fact: base.f + (t[1] ? ' ' + t[1] : '') };
  }
  /* Bild aus der Falter-Tafel (3×3) */
  const falterImg = (f, cls) => '<span class="fx-img fx-t' + Math.min(f.tier, 3) + (cls ? ' ' + cls : '') + '" style="--c:' + (f.i % 3) + ';--r:' + Math.floor(f.i / 3) + '" role="img" aria-label="' + esc(f.name) + '"></span>';
  function picHtml(t) { const q = pos(t); const s = STAGE_UI[q.stage]; return s[0] === 'kokon' ? KOKON : s[0]; }
  function mood() { const b = bst(); const h = (Date.now() - (b.last || 0)) / 36e5; return !b.last ? 'neu' : h < 24 ? 'froh' : h < 72 ? 'hunger' : 'schlaf'; }
  function pop(n) {
    const el = document.createElement('div'); el.className = 'futter-pop'; el.textContent = '🦋 +' + n; el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el); setTimeout(() => el.remove(), 1700);
  }
  let syncTimer = null;
  function syncSoon() {
    if (!joined()) return; clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => { const b = bst(); if (b.synced === b.own) return; try { await P().send({ t: 'hello', name: S().sender, pron: S().pron || '', reply: true, food: b.own }); b.synced = b.own; L.save(); } catch (e) {} }, 15000);
  }
  function celebrate() {
    const b = bst(), t = total(), lv = level(t); if (lv <= (b.lv2 || 0)) { b.lv2 = Math.max(b.lv2 || 0, lv); return; }
    const was = b.lv2 || 0; b.lv2 = lv; L.save();
    const q = pos(t), newFalter = Math.floor(lv / 3) > Math.floor(was / 3);
    if (!newFalter && q.gen > 1) return; // ab der zweiten Generation nur noch neue Falter feiern, nicht jede Raupe
    const f = newFalter ? falter(q.done) : null; const nx = falter(q.done + 1);
    const title = f ? (q.done === 1 ? 'Geschlüpft!' : 'Ein neuer Falter!') : q.stage === 2 ? 'Die Raupe spinnt sich ein' : 'Aus dem Ei geschlüpft';
    const shareText = f ? 'Neu in unserem Schmetterlingsbuch: ' + f.name + ' 🦋' : 'Bei uns wächst etwas heran 🐛';
    setTimeout(() => {
      L.openSheet('<div class="bfly-party">' + (f ? '<div class="fx-hero">' + falterImg(f, 'big') + '</div><h3>' + esc(title) + '</h3><p class="fx-name">' + esc(f.name) + ' <span class="fx-rar">' + esc(f.rar) + '</span></p><p class="about" style="margin-bottom:10px">' + esc(f.fact) + '</p>' + (window.LZWI ? window.LZWI.moreRow(f.i) + window.LZWI.hint() : '') +
        '<p class="about" style="font-size:16px;color:var(--text-soft);margin-bottom:16px">🥚 Er hat schon ein Ei gelegt. Als Nächstes wartet ein Falter der Stufe <b>„' + esc(nx.rar) + '“</b>.</p>'
        : '<div class="bfly-big">' + picHtml(t) + '</div><h3>' + esc(title) + '</h3><p class="about" style="margin-bottom:16px">' + esc(STAGE_UI[q.stage][1]) + '</p>') +
        '<div class="row wrap" style="justify-content:center"><button class="pill-btn primary" data-ok>Weiter</button>' + (f ? '<button class="pill-btn" data-book>📖 Zum Buch</button>' : '') + '<button class="pill-btn" data-share>🖼️ Teilen</button></div></div>', (sh) => {
        sh.querySelector('[data-ok]').onclick = L.closeSheet;
        const bk = sh.querySelector('[data-book]'); if (bk) bk.onclick = () => { L.closeSheet(); setTimeout(book, 60); };
        sh.querySelector('[data-share]').onclick = () => { L.closeSheet(); shareCard({ text: shareText, label: 'Schmetterlingsfutter', sig: S().sender + ' & ' + you() }); };
      });
      L.spawnHearts(18); L.haptic(30);
    }, 900);
  }
  function feed(kind, n) {
    const b = bst(), day = L.todayKey(); const had = b.days[day] || 0; if (had >= DAY_CAP) return;
    const add = Math.min((n || 1) + (had === 0 ? 1 : 0), DAY_CAP - had); // erste Geste des Tages zählt doppelt
    b.days[day] = had + add; b.own = (b.own || 0) + add; b.last = Date.now();
    Object.keys(b.days).sort().slice(0, -5).forEach((k) => delete b.days[k]);
    L.save(); pop(add); render(); celebrate(); syncSoon();
  }
  function theirFood(n) {
    const b = bst(); n = Math.max(0, Math.min(100000, Math.floor(Number(n) || 0))); if (n <= (b.their || 0)) return;
    b.their = n; b.last = Date.now(); L.save(); render(); celebrate();
  }
  /* Gesten ohne Versand (Dankbarkeit, Piek des Tages) über die Zähler im Speicher erkennen */
  function watch() {
    const s = S(), b = bst(); const now = { thanks: (s.thanks || []).length, piek: s.piekCount || 0 };
    Object.keys(now).forEach((k) => { if (b.seen[k] === undefined) { b.seen[k] = now[k]; return; } if (now[k] > b.seen[k]) { b.seen[k] = now[k]; feed(k); } else if (now[k] < b.seen[k]) b.seen[k] = now[k]; });
  }
  function render() {
    const c = $('bflyCard'); if (!c) return; const b = bst(), t = total(), q = pos(t), md = mood();
    const name = 'Generation ' + q.gen + ': ' + STAGE_UI[q.stage][1].replace('Ein ', '').replace('Eine ', '');
    const state = md === 'froh' ? 'ist satt und zufrieden' : md === 'hunger' ? 'hat Hunger' : md === 'schlaf' ? 'schläft' : 'wartet auf Futter';
    const pct = Math.max(4, Math.min(100, Math.round(q.p / q.len * 100)));
    const what = q.stage === 0 ? 'zur Raupe' : q.stage === 1 ? 'zum Kokon' : 'zum ' + (q.done ? 'nächsten ' : '') + 'Falter';
    const sig = [t, md, b.days[L.todayKey()] || 0].join('|'); if (c.dataset.sig === sig) return; c.dataset.sig = sig;
    c.innerHTML = '<button type="button" class="bfly ' + md + '" data-open aria-label="Euer Schmetterling öffnen"><span class="bfly-pic">' + picHtml(t) + '</span>' +
      '<span class="bfly-b"><span class="bfly-t">' + esc(name) + '</span><span class="bfly-s">' + esc(state) + (q.done ? ' · 📖 ' + q.done + ' im Buch' : '') + '</span><span class="progress"><i style="width:' + pct + '%"></i></span><span class="bfly-n">Noch ' + (q.next - q.p) + ' Futter ' + esc(what) + '</span></span></button>';
    c.querySelector('[data-open]').onclick = sheet;
  }
  function sheet() {
    const b = bst(), t = total(), q = pos(t), today = b.days[L.todayKey()] || 0;
    const dots = Array.from({ length: DAY_CAP }, (_, i) => '<i class="' + (i < today ? 'on' : '') + '"></i>').join('');
    const last = q.done ? falter(q.done) : null;
    L.openSheet('<h3>🦋 Euer Schmetterling</h3><div class="bfly-big">' + picHtml(t) + '</div>' +
      '<p class="about" style="text-align:center;margin-bottom:14px">Generation ' + q.gen + ' · Jede liebe Geste ist Futter. Wird er ein Falter, legt er ein Ei – und der nächste wird noch seltener.</p>' +
      '<div class="field"><label>Dein Futter heute</label><div class="futter-dots" role="img" aria-label="' + today + ' von ' + DAY_CAP + '">' + dots + '</div></div>' +
      (last ? '<div class="field"><label>Zuletzt geschlüpft</label><div class="fx-last">' + falterImg(last) + '<span><b>' + esc(last.name) + '</b><small>' + esc(last.rar) + '</small></span></div></div>' : '') +
      '<div class="row wrap"><button class="pill-btn primary" data-book>📖 Schmetterlingsbuch</button><button class="pill-btn" data-feed>Jetzt füttern</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-book]').onclick = () => { L.closeSheet(); setTimeout(book, 60); };
      sh.querySelector('[data-feed]').onclick = () => { L.closeSheet(); const m = $('btnMoreSend') || $('btnReasons'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    });
  }
  /* Schmetterlingsbuch: entdeckte Falter mit Bild und Steckbrief, die nächsten als Schatten */
  function book() {
    const q = pos(total()), have = q.done, show = Math.max(LADDER.length, Math.ceil((have + 1) / LADDER.length) * LADDER.length);
    const jc = window.LZJ && window.LZJ.counts ? window.LZJ.counts() : {}, wild = Object.values(jc).reduce((a, b) => a + b, 0);
    let grid = '';
    for (let n = 1; n <= show; n++) {
      const bb = window.LZ.S.besuchBook || {}, f = falter(n), caught = n <= LADDER.length ? (jc[n - 1] || 0) : 0, vis = n <= LADDER.length ? (bb[n - 1] || 0) : 0, got = n <= have || caught > 0 || vis > 0;
      grid += '<button type="button" class="fx-cell' + (got ? '' : ' locked') + (n === have + 1 && !caught && !vis ? ' next' : '') + '" data-n="' + n + '"' + (got ? '' : ' aria-label="Noch nicht entdeckt"') + '>' + falterImg(f, got ? '' : 'shadow') + '<span>' + (got ? esc(f.name) : n === have + 1 ? 'Als Nächstes' : '?') + '</span>' + (caught ? '<em class="fx-wild">🕸️ ' + caught + '×</em>' : vis ? '<em class="fx-wild">✨ ' + vis + '×</em>' : '') + '</button>';
    }
    L.openSheet('<h3>📖 Euer Schmetterlingsbuch</h3><p class="about" style="font-size:16px;margin-bottom:10px">' + have + ' geschlüpft' + (wild ? ' · 🕸️ ' + wild + ' draußen gefangen' : '') + ' · Generation ' + q.gen + ' wächst gerade heran. Jeder neue Falter ist seltener als der vorige.</p>' +
      '<div class="fx-grid">' + grid + '</div>' +
      (have >= LADDER.length ? '' : '<p class="about" style="font-size:15px;color:var(--text-muted);margin-top:8px">Nach allen neun Arten kommen Prachtformen – schillernd, mit Sternenglanz und in Regenbogenfarben.</p>') +
      '<p class="wi-hintp"><button type="button" class="wi-link" data-hilfe>🌱 Echten Faltern helfen</button></p>' +
      '<div class="row wrap" style="margin-top:12px">' + (window.LZJ ? '<button class="pill-btn primary" data-jagd>🕸️ Draußen fangen</button>' : '') + '<button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const jb = sh.querySelector('[data-jagd]'); if (jb) jb.onclick = () => { L.closeSheet(); if (document.querySelector('.jagd')) return; setTimeout(() => window.LZJ.open(), 60); };
      sh.querySelectorAll('.fx-cell').forEach((c) => c.onclick = () => {
        const n = Number(c.dataset.n); if (n > have && !(n <= LADDER.length && (jc[n - 1] || (window.LZ.S.besuchBook || {})[n - 1]))) { L.toast(n === have + 1 ? '🥚 Wächst gerade heran – weiter füttern!' : 'Noch nicht entdeckt'); return; }
        const f = falter(n);
        L.openSheet('<div class="bfly-party"><div class="fx-hero">' + falterImg(f, 'big') + '</div><h3>' + esc(f.name) + '</h3><p class="fx-name"><span class="fx-rar">' + esc(f.rar) + '</span> · Falter Nr. ' + n + '</p><p class="about" style="margin:8px 0 16px">' + esc(f.fact) + '</p>' + (window.LZWI ? window.LZWI.steck(f.i) : '') +
          '<div class="row wrap" style="justify-content:center"><button class="pill-btn" data-back>← Zum Buch</button><button class="pill-btn" data-share>🖼️ Teilen</button></div></div>', (s2) => {
          s2.querySelector('[data-back]').onclick = () => { L.closeSheet(); setTimeout(book, 60); };
          s2.querySelector('[data-share]').onclick = () => { L.closeSheet(); shareCard({ text: 'In unserem Schmetterlingsbuch: ' + f.name + ' 🦋', label: 'Schmetterlingsfutter', sig: S().sender + ' & ' + you() }); };
        });
      });
    });
  }
  (function fxCss() {
    const st = document.createElement('style');
    st.textContent = '.fx-img{display:inline-block;width:64px;aspect-ratio:1;background:url(img/falter.webp) calc(var(--c) * 50%) calc(var(--r) * 50%)/300% 300% no-repeat;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));vertical-align:middle}' +
      '.fx-img.big{width:min(68vw,260px)}.fx-img.shadow{filter:brightness(0) opacity(.28)}' +
      '.fx-t1{animation:fxShimmer 6s ease-in-out infinite}.fx-t2{filter:drop-shadow(0 0 6px #ffe38a) drop-shadow(0 0 14px rgba(255,227,138,.6))}.fx-t3{animation:fxRainbow 8s linear infinite}' +
      '@keyframes fxShimmer{0%,100%{filter:drop-shadow(0 0 6px #b9f) hue-rotate(0deg) saturate(1.3)}50%{filter:drop-shadow(0 0 10px #7ef) hue-rotate(40deg) saturate(1.6)}}' +
      '@keyframes fxRainbow{from{filter:hue-rotate(0deg) saturate(1.4) drop-shadow(0 0 8px #fff)}to{filter:hue-rotate(360deg) saturate(1.4) drop-shadow(0 0 8px #fff)}}' +
      '.fx-img.shadow.fx-t1,.fx-img.shadow.fx-t2,.fx-img.shadow.fx-t3{animation:none;filter:brightness(0) opacity(.28)}' +
      '.fx-hero{display:flex;justify-content:center;margin:4px 0 6px;animation:bflyFloat 3s ease-in-out infinite}' +
      '.fx-name{font-family:var(--serif);font-size:22px;margin:0}.fx-rar{display:inline-block;font:700 13px var(--sans,sans-serif);letter-spacing:.4px;text-transform:uppercase;color:var(--accent-2);border:1px solid var(--accent-2);border-radius:10px;padding:1px 8px;vertical-align:middle}' +
      '.fx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
      '.fx-cell{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;border-radius:16px;border:1px solid var(--line);background:var(--glass);color:var(--text);font:inherit;min-height:110px}' +
      '.fx-cell{position:relative}.fx-wild{position:absolute;top:6px;right:6px;font:700 11px var(--sans,sans-serif);font-style:normal;background:var(--accent-dark);color:#fff;border-radius:8px;padding:1px 5px}' +
      '.fx-cell span{font-size:14px;line-height:1.2;text-align:center;overflow-wrap:anywhere}.fx-cell.locked span{color:var(--text-muted)}.fx-cell.next{border-style:dashed;border-color:var(--accent-2)}' +
      '.fx-last{display:flex;align-items:center;gap:12px}.fx-last span{display:flex;flex-direction:column}.fx-last small{color:var(--text-muted)}' +
      '[data-motion="off"] .fx-t1,[data-motion="off"] .fx-t3,[data-motion="off"] .fx-hero{animation:none}';
    document.head.appendChild(st);
  })();

  /* ---------- Verdrahtung ---------- */
  const pt = $('btnPoem'); if (pt) pt.onclick = poemSheet;
  window.LZX = { shareCard, sharePic, poemSheet, feed, theirFood, render, book, falter, pos, SHARE_LINE, APP_URL };
  if (bst().lv2 === undefined) { bst().lv2 = level(total()); L.save(); } // beim Umstieg auf Generationen nichts nachfeiern
  render(); watch(); syncSoon();
  setInterval(() => { if (document.visibilityState === 'visible') { watch(); render(); } }, 3000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { watch(); render(); } });
})();
