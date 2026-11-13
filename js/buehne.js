/* Schmetterlingsfutter – Bühne (LZBU, 3.40.0): Open Mic für Liebesgedichte
   Mos Idee (13.11.2026): Hobby-Poeten tragen eigene Gedichte vor, die Community ist Publikum und Jury
   (Applaus, Flügel geben = pushen, teilen), und aus jedem Gedicht kann man ein Geschenk machen (Tasse, Shirt, Poster …).
   Regeln:
   - Ohne Konto. Ein zufälliger Schlüssel bleibt im Gerät (S.buehne.key); der Dienst kennt nur seine Prüfsumme.
   - Keine Links, Kontaktdaten oder fremden Werke. Melden blendet nach drei Meldungen aus, bis wir geprüft haben.
   - Geschenk-Links sind Werbelinks und als solche gekennzeichnet. Partner-Shops erscheinen erst mit zugesagtem Link (wie LZE).
   - Klassiker (gemeinfrei) stehen immer zur Verfügung – auch offline und solange die Bühne noch leer ist. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const $ = (id) => document.getElementById(id), esc = L.esc, P = () => window.LZP;
  const C = (k) => window.LZS && window.LZS.count(k);
  const APP_URL = 'https://app.schmetterlingsfutter.de/';
  const MAIL = 'info@mojamba.de';
  /* Eigener Spreadshop (seit 13.11.2026): fertige Produkte mit den Klassikern, später mit Gedichten der Woche (Autorenanteil) */
  const SHOP_URL = 'https://schmetterlingsfutter-poesie.myspreadshop.de/all';

  /* ---------- Zustand im Gerät ---------- */
  function st() {
    const S = L.S; if (!S.buehne) S.buehne = {};
    const b = S.buehne;
    if (!b.key) { const a = new Uint8Array(16); crypto.getRandomValues(a); b.key = Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(''); L.save(); }
    if (!Array.isArray(b.hide)) b.hide = [];
    if (!b.sort) b.sort = 'trend';
    return b;
  }
  const relay = () => (P() && P().RELAY) || (D.relayUrl || '').replace(/\/$/, '');
  async function api(path, body) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(relay() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ key: st().key }, body || {})), signal: ctrl.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(j.error || 'Fehler'); e.code = j.error; e.status = r.status; throw e; }
      return j;
    } finally { clearTimeout(to); }
  }

  /* ---------- Inhalte ---------- */
  const CATS = [['liebe', '💗 Liebe'], ['sehnsucht', '🌙 Sehnsucht'], ['humor', '😄 Mit Humor'], ['anlass', '💍 Anlässe'], ['trost', '🤍 Trost'], ['frei', '🦋 Frei']];
  const catName = (c) => (CATS.find((x) => x[0] === c) || ['', '🦋 Frei'])[1];
  /* Thema des Monats: gibt der Bühne jeden Monat einen Anlass – und passt zu den großen Geschenk-Zeiten */
  const THEMES = ['Neuanfang zu zweit', 'Liebeserklärung', 'Frühlingsgefühle', 'Unser Lachen', 'Das Ja-Wort', 'Sommernächte', 'Fernweh und Nähe', 'Erinnerungen', 'Danke, dass es dich gibt', 'Herbstzauber', 'Wärme an kalten Tagen', 'Lichter in der Winternacht'];
  const theme = () => THEMES[new Date().getMonth()];
  /* Gemeinfreie Klassiker (Autoren seit über 70 Jahren verstorben) */
  const CLASSICS = [
    { id: 'k1', title: 'Nähe des Geliebten', author: 'Johann Wolfgang von Goethe (1795)', cat: 'sehnsucht', gift: true, shop: SHOP_URL, body: 'Ich denke dein, wenn mir der Sonne Schimmer\nVom Meere strahlt;\nIch denke dein, wenn sich des Mondes Flimmer\nIn Quellen malt.\n\nIch sehe dich, wenn auf dem fernen Wege\nDer Staub sich hebt;\nIn tiefer Nacht, wenn auf dem schmalen Stege\nDer Wandrer bebt.\n\nIch höre dich, wenn dort mit dumpfem Rauschen\nDie Welle steigt.\nIm stillen Haine geh ich oft zu lauschen,\nWenn alles schweigt.\n\nIch bin bei dir, du seist auch noch so ferne,\nDu bist mir nah!\nDie Sonne sinkt, bald leuchten mir die Sterne.\nO wärst du da!' },
    { id: 'k2', title: 'Du bist wie eine Blume', author: 'Heinrich Heine (1827)', cat: 'liebe', gift: true, shop: SHOP_URL, body: 'Du bist wie eine Blume,\nSo hold und schön und rein;\nIch schau dich an, und Wehmut\nSchleicht mir ins Herz hinein.\n\nMir ist, als ob ich die Hände\nAufs Haupt dir legen sollt,\nBetend, dass Gott dich erhalte\nSo rein und schön und hold.' },
    { id: 'k3', title: 'Liebes-Lied', author: 'Rainer Maria Rilke (1907)', cat: 'liebe', gift: true, shop: SHOP_URL, body: 'Wie soll ich meine Seele halten, dass\nsie nicht an deine rührt? Wie soll ich sie\nhinheben über dich zu andern Dingen?\nAch gerne möcht ich sie bei irgendwas\nVerlorenem im Dunkel unterbringen\nan einer fremden stillen Stelle, die\nnicht weiterschwingt, wenn deine Tiefen schwingen.\nDoch alles, was uns anrührt, dich und mich,\nnimmt uns zusammen wie ein Bogenstrich,\nder aus zwei Saiten eine Stimme zieht.\nAuf welches Instrument sind wir gespannt?\nUnd welcher Geiger hat uns in der Hand?\nO süßes Lied.' }
  ];

  /* ---------- Geschenk-Werkstatt: Produkte, Vorschau, Werbelinks ----------
     q = Amazon-Suche (Partnerkennung aus D.affiliateTag). partners: zugesagte Druck-Partner mit Deeplink (url leer = unsichtbar). */
  const PRODUCTS = [
    { id: 'tasse', icon: '☕', name: 'Tasse', max: 4, q: 'tasse mit eigenem text bedrucken personalisiert' },
    { id: 'karte', icon: '💌', name: 'Karte', max: 8, q: 'grußkarte personalisiert eigener text' },
    { id: 'poster', icon: '🖼️', name: 'Poster', max: 16, q: 'poster personalisiert eigener text gedicht' },
    { id: 'shirt', icon: '👕', name: 'T-Shirt', max: 4, q: 't-shirt selbst gestalten eigener text' },
    { id: 'kissen', icon: '🛋️', name: 'Kissen', max: 4, q: 'kissen personalisiert eigener text' },
    { id: 'wand', icon: '🏠', name: 'Wandtattoo', max: 4, q: 'wandtattoo wunschtext eigener spruch' },
    { id: 'leinwand', icon: '🎨', name: 'Leinwand', max: 12, q: 'leinwand personalisiert eigener text' },
    { id: 'schmuck', icon: '💍', name: 'Gravur', max: 1, q: 'armband gravur wunschtext' }
  ];
  /* Druck-Partner (Awin/AdCell). Erst eintragen, wenn das Programm zugesagt hat. Felder: id, name, products (ids), url */
  const PARTNERS = [];
  const partnerFor = (pid) => PARTNERS.filter((p) => p.url && p.products.indexOf(pid) >= 0);

  function lines(body) { return String(body || '').split('\n'); }
  /* Vorschau: Text wird in die Druckfläche des Produkts umbrochen und so groß wie möglich gesetzt */
  const BOX = {
    tasse: { x: 150, y: 58, w: 132, h: 118, fill: '#9b1a38', bg: '<rect x="70" y="40" width="160" height="150" rx="14" fill="#fff"/><path d="M230 75 q45 0 45 45 q0 45 -45 45" fill="none" stroke="#fff" stroke-width="16"/><ellipse cx="150" cy="42" rx="80" ry="10" fill="#f1e6ea"/>' },
    karte: { x: 150, y: 70, w: 150, h: 120, fill: '#7a2440', bg: '<g transform="rotate(-3 150 120)"><rect x="60" y="30" width="180" height="180" rx="6" fill="#fffaf5"/><text x="150" y="58" font-size="18" text-anchor="middle">🦋</text></g>' },
    poster: { x: 150, y: 30, w: 106, h: 160, fill: '#3a2a2a', bg: '<rect x="80" y="10" width="140" height="200" fill="#5a3b2a"/><rect x="88" y="18" width="124" height="184" fill="#fdf8f2"/>' },
    shirt: { x: 150, y: 62, w: 84, h: 92, fill: '#9b1a38', bg: '<path d="M95 30 l30 -10 q25 18 50 0 l30 10 l35 35 l-25 22 l-15 -12 v120 h-100 v-120 l-15 12 l-25 -22 z" fill="#fff"/>' },
    kissen: { x: 150, y: 55, w: 140, h: 120, fill: '#7a2440', bg: '<rect x="60" y="35" width="180" height="160" rx="30" fill="#f6dbe6"/>' },
    wand: { x: 150, y: 30, w: 230, h: 120, fill: '#3a2a2a', bg: '<rect x="20" y="10" width="260" height="200" fill="#efe9e4"/><rect x="40" y="170" width="220" height="30" rx="4" fill="#c9b9a9"/>' },
    leinwand: { x: 150, y: 36, w: 146, h: 160, fill: '#3a2a2a', bg: '<rect x="65" y="20" width="170" height="190" fill="#fff" stroke="#ddd"/><rect x="65" y="20" width="170" height="190" fill="url(#buG)" opacity=".35"/>' },
    schmuck: { x: 150, y: 104, w: 180, h: 22, fill: '#7a5a20', one: true, bg: '<ellipse cx="150" cy="115" rx="110" ry="40" fill="none" stroke="#e8c27a" stroke-width="14"/>' }
  };
  function wrap(ls, max) {
    const out = [];
    ls.forEach((l) => { let cur = ''; l.split(' ').forEach((w) => { if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); out.push(cur); });
    return out;
  }
  function mockup(pid, sel, author) {
    const b = BOX[pid] || BOX.tasse;
    let ls = sel.length ? sel : ['Dein Lieblingsvers'];
    if (b.one) ls = [ls[0].length > 34 ? ls[0].slice(0, 33) + '…' : ls[0]];
    /* Zeilenlänge so wählen, dass Breite und Höhe der Druckfläche gut gefüllt sind */
    let best = null;
    for (let max = 12; max <= 46; max += 2) {
      const w = b.one ? ls : wrap(ls, max), long = Math.max(...w.map((x) => x.length), 1);
      const f = Math.min(20, b.w / (long * 0.5), b.h / ((w.length + 1.2) * 1.3));
      if (!best || f > best.f) best = { w, f };
    }
    const f = Math.max(6, best.f), lh = f * 1.3, ws = best.w;
    const y0 = b.y + (b.h - (ws.length + 1) * lh) / 2 + f;
    const text = ws.map((l, i) => '<text x="' + b.x + '" y="' + (y0 + i * lh).toFixed(1) + '" font-size="' + f.toFixed(1) + '" fill="' + b.fill + '" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-style="italic">' + esc(l) + '</text>').join('') +
      (b.one ? '' : '<text x="' + b.x + '" y="' + (y0 + ws.length * lh + 2).toFixed(1) + '" font-size="' + Math.max(6, f * 0.62).toFixed(1) + '" fill="' + b.fill + '" opacity=".75" text-anchor="middle" font-family="system-ui,sans-serif">— ' + esc(author) + '</text>');
    return '<svg viewBox="0 0 300 220" class="bu-mock" role="img" aria-label="Vorschau ' + esc(pid) + '"><defs><linearGradient id="buG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff85a1"/><stop offset="1" stop-color="#ffd1a1"/></linearGradient></defs>' + b.bg + text + '</svg>';
  }
  function giftSheet(p) {
    if (!p.gift) { L.toast('Dieses Gedicht ist nur zum Lesen und Teilen freigegeben'); return; }
    C('bu_gift_open');
    const all = lines(p.body).filter((l) => l.trim());
    let pid = 'tasse', sel = [];
    const prod = () => PRODUCTS.find((x) => x.id === pid);
    const fill = () => { sel = all.slice(0, prod().max); };
    fill();
    const draw = (sh) => {
      sh.querySelector('[data-mock]').innerHTML = mockup(pid, sel, p.author);
      sh.querySelectorAll('[data-l]').forEach((b) => b.classList.toggle('on', sel.indexOf(all[+b.dataset.l]) >= 0));
      sh.querySelectorAll('[data-p]').forEach((b) => b.classList.toggle('on', b.dataset.p === pid));
      sh.querySelector('[data-hint]').textContent = 'Bis zu ' + prod().max + (prod().max === 1 ? ' Zeile' : ' Zeilen') + ' – tippe Zeilen an, um sie zu wählen';
      const ps = partnerFor(pid);
      sh.querySelector('[data-partners]').innerHTML = ps.map((x) => '<button type="button" class="pill-btn small" data-partner="' + esc(x.id) + '">' + esc(x.name) + ' ↗</button>').join('');
      sh.querySelectorAll('[data-partner]').forEach((b) => b.onclick = () => { const x = PARTNERS.find((y) => y.id === b.dataset.partner); copyText().then(() => { C('bu_gift_click:' + pid + ':' + x.id); window.open(x.url, '_blank', 'noopener'); }); });
    };
    const copyText = async () => { const t = sel.join('\n') + '\n— ' + p.author; try { await navigator.clipboard.writeText(t); L.toast('Text kopiert 📋 – beim Gestalten einfach einfügen'); } catch (e) { L.toast(t); } };
    const html = '<h3>🎁 Ein Geschenk daraus machen</h3>' +
      '<div class="chips bu-prods">' + PRODUCTS.map((x) => '<button type="button" data-p="' + x.id + '">' + x.icon + ' ' + esc(x.name) + '</button>').join('') + '</div>' +
      '<div data-mock class="bu-mockbox"></div>' +
      '<div class="bu-hint" data-hint></div>' +
      '<div class="bu-pick">' + all.map((l, i) => '<button type="button" data-l="' + i + '">' + esc(l) + '</button>').join('') + '</div>' +
      '<p class="about" style="font-size:15px;color:var(--text-muted);margin:8px 0">Mit Namensnennung „' + esc(p.author) + '“ für private Geschenke freigegeben. Die Links sind Werbelinks: Kaufst du dort, bekommt Schmetterlingsfutter eine kleine Provision – dich kostet es nichts extra.</p>' +
      (p.shop ? '<div class="row wrap" style="margin-bottom:8px"><button class="pill-btn primary" data-shop>🛍️ Fertig im Poesie-Shop ↗</button></div><p class="about" style="font-size:14px;color:var(--text-muted);margin:0 0 8px">Tassen, Shirts, Hoodies und mehr – gedruckt und verschickt von Spreadshirt. Oder selbst gestalten:</p>' : '') +
      '<div class="row wrap"><button class="pill-btn' + (p.shop ? '' : ' primary') + '" data-amz>Text kopieren &amp; gestalten ↗ <span class="bu-ad">Werbung</span></button><span data-partners></span><button class="pill-btn" data-card>🖼️ Als Bild teilen</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>';
    L.openSheet(html, (sh) => {
      draw(sh);
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { pid = b.dataset.p; fill(); draw(sh); C('bu_gift_prod:' + pid); });
      sh.querySelectorAll('[data-l]').forEach((b) => b.onclick = () => {
        const l = all[+b.dataset.l], i = sel.indexOf(l);
        if (i >= 0) sel.splice(i, 1); else { if (sel.length >= prod().max) sel.shift(); sel.push(l); }
        sel.sort((a, c) => all.indexOf(a) - all.indexOf(c)); draw(sh);
      });
      sh.querySelector('[data-amz]').onclick = async () => { await copyText(); C('bu_gift_click:' + pid + ':amazon'); window.open(P() ? P().amazonUrl(prod().q, false, true) : 'https://www.amazon.de/s?k=' + encodeURIComponent(prod().q), '_blank', 'noopener'); };
      sh.querySelector('[data-card]').onclick = () => { L.closeSheet(); shareImage(p, sel); };
      const sb = sh.querySelector('[data-shop]'); if (sb) sb.onclick = () => { C('bu_shop_click:' + p.id); window.open(p.shop, '_blank', 'noopener'); };
    });
  }

  /* ---------- Teilen, an den Schatz, melden ---------- */
  const link = (p) => APP_URL + (p.id && !String(p.id).startsWith('k') ? '?gedicht=' + p.id : '');
  function shareImage(p, sel) {
    C('bu_share_img');
    const text = (sel && sel.length ? sel : lines(p.body).filter((l) => l.trim()).slice(0, 8)).join('\n');
    if (window.LZX) window.LZX.shareCard({ text, label: '🎤 ' + p.title, sig: p.author }); else L.shareText(text + '\n— ' + p.author + '\n' + link(p));
  }
  function shareLink(p) {
    C('bu_share_link');
    const t = '„' + p.title + '“ von ' + p.author + ' – auf der Schmetterlingsfutter-Bühne 🎤🦋';
    if (navigator.share) navigator.share({ title: p.title, text: t, url: link(p) }).catch(() => {}); else L.shareText(t + '\n' + link(p));
  }
  function toPartner(p) {
    C('bu_to_partner');
    const t = p.body + '\n— ' + p.author;
    if (P()) P().sendOrShare(t, '🎤 Gedicht von der Bühne'); else L.shareText(t);
  }
  const REASONS = [['fremd', 'Nicht vom Autor (fremdes Werk)'], ['beleidigend', 'Beleidigend oder Hass'], ['sexuell', 'Sexuell oder anstößig'], ['gewalt', 'Gewalt oder Gefahr'], ['persoenlich', 'Persönliche Daten anderer'], ['spam', 'Werbung oder Spam'], ['sonst', 'Etwas anderes']];
  function reportSheet(p) {
    L.openSheet('<h3>Gedicht melden</h3><p class="about" style="font-size:16px;margin-bottom:10px">„' + esc(p.title) + '“ – Was stimmt nicht? Nach mehreren Meldungen blenden wir es aus und prüfen es.</p>' +
      '<div class="bu-reasons">' + REASONS.map((r) => '<button type="button" class="pill-btn small ghost" data-r="' + r[0] + '">' + esc(r[1]) + '</button>').join('') + '</div>' +
      '<div class="field"><label for="buNote">Hinweis (freiwillig)</label><input id="buNote" maxlength="200" placeholder="z. B. Quelle des Originals"></div>' +
      '<p class="about" style="font-size:14px;color:var(--text-muted)">Bei Rechtsverstößen auch per Mail an ' + MAIL + '.</p>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('[data-r]').forEach((b) => b.onclick = async () => {
        try { await api('/buehne/report', { id: p.id, reason: b.dataset.r, note: sh.querySelector('#buNote').value }); C('bu_report'); L.closeSheet(); L.toast('Danke – wir schauen es uns an'); }
        catch (e) { L.toast('Melden gerade nicht möglich – bitte per Mail an ' + MAIL); }
      });
    });
  }
  function moreSheet(p) {
    const own = p.mine, classic = String(p.id).startsWith('k');
    L.openSheet('<h3>' + esc(p.title) + '</h3><div class="o-grid">' +
      '<button type="button" class="btn" data-a="link"><span class="btn-icon">🔗</span><span>Link<br>teilen</span></button>' +
      '<button type="button" class="btn" data-a="img"><span class="btn-icon">🖼️</span><span>Als Bild<br>teilen</span></button>' +
      (p.yt ? '<button type="button" class="btn" data-a="yt"><span class="btn-icon">▶️</span><span>Vortrag<br>ansehen</span></button>' : '') +
      (!classic && !own ? '<button type="button" class="btn" data-a="report"><span class="btn-icon">🚩</span><span>Melden</span></button><button type="button" class="btn" data-a="hide"><span class="btn-icon">🙈</span><span>Autor<br>ausblenden</span></button>' : '') +
      (own ? '<button type="button" class="btn" data-a="del"><span class="btn-icon">🗑️</span><span>Löschen</span></button>' : '') +
      '</div><div class="row" style="margin-top:12px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const on = (a, f) => { const b = sh.querySelector('[data-a="' + a + '"]'); if (b) b.onclick = f; };
      on('link', () => { L.closeSheet(); shareLink(p); });
      on('img', () => { L.closeSheet(); shareImage(p); });
      on('yt', () => { C('bu_yt'); window.open('https://www.youtube.com/watch?v=' + encodeURIComponent(p.yt), '_blank', 'noopener'); });
      on('report', () => reportSheet(p));
      on('hide', () => { L.closeSheet(); st().hide.push(p.aid); L.save(); render(); L.toast('Gedichte von ' + p.author + ' werden dir nicht mehr gezeigt'); });
      on('del', () => L.confirmSheet('Gedicht löschen?', 'Es verschwindet sofort von der Bühne, mit Applaus und Flügeln.', 'Löschen', async () => {
        try { await api('/buehne/delete', { id: p.id }); L.toast('Gelöscht'); load(true); } catch (e) { L.toast('Löschen gerade nicht möglich'); }
      }, true));
    });
  }

  /* ---------- Applaus und Flügel ---------- */
  let data = { poems: [], voted: {}, wingsLeft: 3 }, loading = false, failed = false;
  async function vote(p, kind, btn) {
    if (String(p.id).startsWith('k')) { L.toast('Klassiker brauchen keinen Applaus mehr – aber danke 😉'); return; }
    if (p.mine) { L.toast('Für eigene Gedichte sammelst du Applaus von anderen 🙂'); return; }
    const v = data.voted[p.id] || []; if (v.indexOf(kind) >= 0) { L.toast(kind === 'clap' ? 'Du hast schon applaudiert 👏' : 'Du hast diesem Gedicht schon Flügel gegeben 🦋'); return; }
    if (kind === 'wing' && data.wingsLeft <= 0) { L.toast('Heute sind deine Flügel verteilt – morgen gibt es drei neue 🦋'); return; }
    try {
      const r = await api('/buehne/vote', { id: p.id, kind });
      p.claps = r.claps; p.wings = r.wings; data.wingsLeft = r.wingsLeft; (data.voted[p.id] = v).push(kind);
      C(kind === 'clap' ? 'bu_clap' : 'bu_wing'); L.haptic && L.haptic(14);
      if (kind === 'wing') { L.spawnHearts && L.spawnHearts(6); L.toast('🦋 Flügel verliehen – noch ' + r.wingsLeft + ' für heute'); }
      render();
    } catch (e) { L.toast(e.code === 'wings' ? 'Heute sind deine Flügel verteilt 🦋' : 'Gerade nicht möglich – ' + (navigator.onLine ? 'später nochmal' : 'offline')); }
  }

  /* ---------- Gedicht-Karte ---------- */
  function cardHtml(p, star) {
    const v = data.voted[p.id] || [], classic = String(p.id).startsWith('k');
    const body = esc(p.body).replace(/\n/g, '<br>'), long = lines(p.body).length > 10 || p.body.length > 420;
    return '<article class="card bu-poem' + (star ? ' bu-star' : '') + '" data-id="' + esc(p.id) + '">' +
      (star ? '<div class="bu-badge">🏆 Gedicht der Woche</div>' : '') +
      '<div class="bu-head"><h4>' + esc(p.title) + '</h4><button type="button" class="icon-btn" data-more aria-label="Weitere Aktionen">⋯</button></div>' +
      '<div class="bu-meta">' + esc(p.author) + ' · ' + catName(p.cat) + (p.yt ? ' · ▶️ mit Vortrag' : '') + (classic ? ' · Klassiker' : '') + '</div>' +
      '<div class="bu-body' + (long ? ' bu-long' : '') + '">' + body + '</div>' + (long ? '<button type="button" class="bu-more" data-open>Weiterlesen</button>' : '') +
      '<div class="bu-acts">' +
      (classic ? '' : '<button type="button" class="bu-act' + (v.indexOf('clap') >= 0 ? ' on' : '') + '" data-clap aria-label="Applaus">👏 <b>' + (p.claps || 0) + '</b></button><button type="button" class="bu-act' + (v.indexOf('wing') >= 0 ? ' on' : '') + '" data-wing aria-label="Flügel geben">🦋 <b>' + (p.wings || 0) + '</b></button>') +
      '<button type="button" class="bu-act" data-love aria-label="An meinen Schatz">💌</button>' +
      (p.gift ? '<button type="button" class="bu-act bu-gift" data-gift>🎁 Geschenk</button>' : '') +
      '</div></article>';
  }
  function bindCards(box, list) {
    box.querySelectorAll('.bu-poem').forEach((el) => {
      const p = list.find((x) => String(x.id) === el.dataset.id); if (!p) return;
      const on = (sel, f) => { const b = el.querySelector(sel); if (b) b.onclick = f; };
      on('[data-more]', () => moreSheet(p));
      on('[data-open]', () => { el.querySelector('.bu-body').classList.remove('bu-long'); el.querySelector('[data-open]').remove(); C('bu_read_more'); });
      on('[data-clap]', (e) => vote(p, 'clap', e.currentTarget));
      on('[data-wing]', (e) => vote(p, 'wing', e.currentTarget));
      on('[data-love]', () => toPartner(p));
      on('[data-gift]', () => giftSheet(p));
    });
  }

  /* ---------- Vortragen (eigenes Gedicht einreichen) ---------- */
  function ytId(s) {
    s = String(s || '').trim(); if (!s) return '';
    const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{11})/.exec(s);
    return m ? m[1] : /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null;
  }
  function rulesHtml() {
    return '<ul class="promo-list bu-rules"><li><span>✍️</span>Nur eigene Gedichte – keine fremden Texte oder Liedzeilen</li><li><span>🤝</span>Freundlich bleiben: kein Hass, keine Beleidigung, nichts Sexuelles</li><li><span>🔒</span>Keine Namen, Fotos, Links oder Kontaktdaten von dir oder anderen</li><li><span>🚩</span>Gemeldetes blenden wir aus und prüfen es; wer gegen die Regeln verstößt, fliegt von der Bühne</li></ul>';
  }
  function writeSheet(prefill) {
    const b = st(); prefill = prefill || {};
    L.openSheet('<h3>🎤 Dein Auftritt</h3>' +
      '<p class="about" style="font-size:16px;margin-bottom:8px">Thema im ' + new Date().toLocaleDateString('de-DE', { month: 'long' }) + ': <b>' + esc(theme()) + '</b> – oder ganz frei.</p>' +
      '<div class="field"><label for="buT">Titel</label><input id="buT" maxlength="60" placeholder="z. B. Morgentau" value="' + esc(prefill.title || '') + '"></div>' +
      '<div class="field"><label for="buB">Dein Gedicht <span class="bu-count" data-count></span></label><textarea id="buB" maxlength="1500" rows="9" placeholder="Zeile für Zeile …">' + esc(prefill.body || b.draft || '') + '</textarea></div>' +
      '<div class="field"><label for="buA">Künstlername</label><input id="buA" maxlength="30" placeholder="So stehst du auf der Bühne" value="' + esc(b.author || '') + '"></div>' +
      '<div class="field"><label for="buC">Art</label><select id="buC">' + CATS.map((c) => '<option value="' + c[0] + '">' + esc(c[1]) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="buY">Dein Vortrag auf YouTube (freiwillig)</label><input id="buY" inputmode="url" placeholder="Link zu deinem eigenen Video" value=""></div>' +
      rulesHtml() +
      '<label class="bu-check"><input type="checkbox" id="buR"> Das Gedicht ist von mir, und ich halte mich an die Bühnenregeln.</label>' +
      '<label class="bu-check"><input type="checkbox" id="buG" checked> Andere dürfen es mit meinem Künstlernamen für private Geschenke nutzen (Tasse, Karte …).</label>' +
      '<label class="bu-check"><input type="checkbox" id="buS"> Ich bin offen dafür, dass Schmetterlingsfutter daraus Produkte anbietet – mit Anteil für mich. Ihr fragt vorher je Gedicht unter „Meine Werke“.</label>' +
      '<p class="about" style="font-size:14px;color:var(--text-muted)">Dein Gedicht ist öffentlich lesbar. Du kannst es jederzeit unter „Meine Werke“ löschen. <a href="privacy.html#buehne">Datenschutz</a></p>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Auf die Bühne 🎤</button></div>', (sh) => {
      const t = sh.querySelector('#buT'), bd = sh.querySelector('#buB'), a = sh.querySelector('#buA'), cnt = sh.querySelector('[data-count]');
      const upd = () => { const n = bd.value.split('\n').length; cnt.textContent = '(' + bd.value.length + '/1500 · ' + n + ' Zeilen)'; b.draft = bd.value; };
      bd.oninput = upd; upd();
      sh.querySelector('[data-cancel]').onclick = () => { L.save(); L.closeSheet(); };
      sh.querySelector('[data-ok]').onclick = async (e) => {
        const btn = e.currentTarget;
        const yt = ytId(sh.querySelector('#buY').value);
        if (t.value.trim().length < 2) return L.toast('Bitte einen Titel eingeben');
        if (bd.value.trim().length < 20) return L.toast('Dein Gedicht ist noch etwas kurz');
        if (bd.value.split('\n').length > 40) return L.toast('Höchstens 40 Zeilen');
        if (a.value.trim().length < 2) return L.toast('Bitte einen Künstlernamen wählen');
        if (yt === null) return L.toast('Der YouTube-Link sieht nicht richtig aus');
        if (!sh.querySelector('#buR').checked) return L.toast('Bitte die Bühnenregeln bestätigen');
        btn.disabled = true; btn.textContent = '…';
        try {
          const r = await api('/buehne/post', { title: t.value, body: bd.value, author: a.value, cat: sh.querySelector('#buC').value, yt: yt || undefined, gift: sh.querySelector('#buG').checked, shop: sh.querySelector('#buS').checked, rules: true });
          b.author = a.value.trim(); b.draft = ''; b.posted = (b.posted || 0) + 1; L.save(); C('bu_post');
          L.closeSheet(); L.spawnHearts && L.spawnHearts(14);
          L.toast(r.status === 'live' ? '🎤 Du stehst auf der Bühne! Teile dein Gedicht, damit es Applaus bekommt.' : 'Danke! Wir schauen kurz drüber, dann steht es auf der Bühne.');
          b.sort = 'neu'; load(true);
          if (r.status === 'live' && r.id) setTimeout(() => shareOffer({ id: r.id, title: t.value.trim(), author: b.author, body: bd.value }), 900);
        } catch (err) {
          btn.disabled = false; btn.textContent = 'Auf die Bühne 🎤';
          const m = { contact: 'Bitte keine Links, Mail-Adressen oder Telefonnummern', dup: 'Dieses Gedicht steht schon auf der Bühne', limit: 'Heute hast du schon genug vorgetragen – morgen wieder 🙂', later: 'Die Bühne ist heute voll – bitte morgen nochmal', length: 'Höchstens 1500 Zeichen und 40 Zeilen', input: 'Bitte Titel und Künstlernamen prüfen', yt: 'Der YouTube-Link sieht nicht richtig aus' };
          L.toast(m[err.code] || ('Gerade nicht möglich – ' + (navigator.onLine ? 'später nochmal' : 'offline')));
        }
      };
    });
  }
  function shareOffer(p) {
    L.openSheet('<h3>🎉 Dein Auftritt läuft</h3><p class="about" style="font-size:17px;margin-bottom:12px">Je mehr Menschen es lesen, desto mehr Applaus und Flügel – und vielleicht wird es das Gedicht der Woche.</p>' +
      '<div class="row wrap"><button class="pill-btn primary" data-l>🔗 Link teilen</button><button class="pill-btn" data-i>🖼️ Als Bild teilen</button><button class="pill-btn ghost" data-cancel>Später</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-l]').onclick = () => { L.closeSheet(); shareLink(p); };
      sh.querySelector('[data-i]').onclick = () => { L.closeSheet(); shareImage(p); };
    });
  }
  async function mineSheet() {
    let r; try { r = await api('/buehne/mine', {}); } catch (e) { L.toast('Gerade nicht erreichbar'); return; }
    const list = r.poems || []; C('bu_mine');
    const stLabel = (s) => s === 'live' ? '🟢 auf der Bühne' : '🟡 in Prüfung';
    const total = list.reduce((s, p) => s + p.claps + 3 * p.wings, 0);
    L.openSheet('<h3>✍️ Meine Werke</h3>' + (list.length ? '<p class="about" style="font-size:16px;margin-bottom:8px">' + list.length + (list.length === 1 ? ' Gedicht' : ' Gedichte') + ' · ' + total + ' Punkte (👏 = 1, 🦋 = 3)</p>' : '<p class="about">Noch nichts vorgetragen. Trau dich – die Bühne gehört dir!</p>') +
      list.map((p) => '<div class="bu-mine" data-id="' + p.id + '"><div><b>' + esc(p.title) + '</b><span>' + stLabel(p.status) + ' · 👏 ' + p.claps + ' · 🦋 ' + p.wings + '</span>' + (p.offer ? '<div class="bu-offer">💬 ' + esc(p.offer) + ' <a href="mailto:' + MAIL + '?subject=' + encodeURIComponent('Bühne – Gedicht #' + p.id) + '">Antworten</a></div>' : '') + '</div><button type="button" class="reason-del" data-del aria-label="Löschen">✕</button></div>').join('') +
      '<p class="about" style="font-size:14px;color:var(--text-muted);margin-top:8px">Deine Werke sind an dieses Gerät gebunden (ohne Konto). Löschst du die App-Daten, kannst du sie nicht mehr selbst löschen – schreib uns dann an ' + MAIL + '.</p>' +
      '<div class="row wrap"><button class="pill-btn primary" data-w>🎤 Neues Gedicht</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-w]').onclick = () => writeSheet();
      sh.querySelectorAll('.bu-mine [data-del]').forEach((b) => b.onclick = () => { const id = +b.closest('.bu-mine').dataset.id; L.confirmSheet('Gedicht löschen?', 'Es verschwindet sofort von der Bühne.', 'Löschen', async () => { try { await api('/buehne/delete', { id }); L.toast('Gelöscht'); load(true); } catch (e) { L.toast('Löschen gerade nicht möglich'); } }, true); });
    });
  }

  /* ---------- Bühne (Reiter unter Spielen) ---------- */
  const SORTS = [['trend', '🔥 Im Aufwind'], ['neu', '✨ Neu'], ['woche', '📅 Diese Woche'], ['beste', '🏆 Beste'], ['klassiker', '📜 Klassiker']];
  async function load(force) {
    const b = st(); if (loading) return;
    if (b.sort === 'klassiker') { render(); return; }
    loading = true; failed = false; render();
    try { const r = await api('/buehne/list', { sort: b.sort }); data = { poems: r.poems || [], voted: r.voted || {}, wingsLeft: r.wingsLeft != null ? r.wingsLeft : 3, star: r.star, week: r.week }; }
    catch (e) { failed = true; }
    loading = false; render();
  }
  function render() {
    const box = $('buehneBox'); if (!box) return;
    const b = st(), hide = new Set(b.hide);
    const classic = b.sort === 'klassiker';
    let list = classic ? CLASSICS : (data.poems || []).filter((p) => !hide.has(p.aid));
    let html = '<div class="card soft bu-top"><div class="bu-theme">Thema im ' + new Date().toLocaleDateString('de-DE', { month: 'long' }) + ': <b>' + esc(theme()) + '</b></div>' +
      '<div class="row wrap" style="margin-top:8px"><button class="pill-btn primary" data-write>🎤 Selbst vortragen</button><button class="pill-btn ghost small" data-mine>✍️ Meine Werke</button></div>' +
      (!classic && !failed ? '<div class="bu-wings">Heute noch ' + data.wingsLeft + ' × 🦋 zu vergeben – Flügel bringen Gedichte nach oben</div>' : '') + '</div>';
    html += '<div class="chips bu-sorts" role="tablist">' + SORTS.map((s) => '<button type="button" role="tab" data-sort="' + s[0] + '" class="' + (b.sort === s[0] ? 'on' : '') + '" aria-selected="' + (b.sort === s[0]) + '">' + s[1] + '</button>').join('') + '</div>';
    if (!classic && data.star && !hide.has(data.star.aid) && b.sort !== 'woche') html += cardHtml(data.star, true);
    if (loading && !list.length) html += '<p class="about bu-empty">Der Vorhang geht auf …</p>';
    else if (failed && !classic) html += '<p class="about bu-empty">Die Bühne braucht Internet. Solange gibt es die <button type="button" class="linkish" data-sort="klassiker">Klassiker</button>.</p>';
    else if (!list.length) html += '<div class="card bu-empty"><p class="about">' + (b.sort === 'woche' ? 'Diese Woche ist die Bühne noch frei.' : 'Die Bühne ist noch frei.') + ' Sei die oder der Erste – und hol dir den ersten Applaus! 🎤</p></div>';
    list.forEach((p) => { if (!(data.star && p.id === data.star.id && b.sort !== 'woche')) html += cardHtml(p); });
    html += '<p class="about" style="font-size:14px;color:var(--text-muted);text-align:center;margin-top:6px">👏 Applaus = 1 Punkt · 🦋 Flügel = 3 Punkte · Das beste Gedicht der Woche wird „Gedicht der Woche“.</p>';
    box.innerHTML = html;
    const all = list.concat(data.star ? [data.star] : []);
    bindCards(box, all);
    box.querySelector('[data-write]').onclick = () => { C('bu_write_open'); writeSheet(); };
    box.querySelector('[data-mine]').onclick = mineSheet;
    box.querySelectorAll('[data-sort]').forEach((x) => x.onclick = () => { b.sort = x.dataset.sort; L.save(); C('bu_sort:' + b.sort); load(); });
  }
  function open(sort) {
    L.showView('play'); L.showSub('play', 'buehne'); if (sort) st().sort = sort;
    C('bu_open'); load(); window.scrollTo(0, 0);
  }

  /* ---------- Geteilter Link ?gedicht=<id> ---------- */
  async function handleParam() {
    const m = /[?&]gedicht=(\d{1,9})/.exec(location.search); if (!m) return;
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    C('bu_link_in');
    try {
      const r = await fetch(relay() + '/buehne/poem?id=' + m[1]).then((x) => x.json());
      if (!r.poem) throw new Error('weg');
      const p = r.poem;
      const show = () => L.openSheet('<div class="bu-badge">🎤 Von der Schmetterlingsfutter-Bühne</div>' + cardHtml(p) + '<div class="row wrap"><button class="pill-btn primary" data-stage>Zur Bühne</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
        bindCards(sh, [p]);
        sh.querySelector('[data-cancel]').onclick = L.closeSheet;
        sh.querySelector('[data-stage]').onclick = () => { L.closeSheet(); open('trend'); };
      });
      if (L.S.onboarded) show(); else { st().pendingPoem = p.id; L.save(); }
    } catch (e) { L.toast('Dieses Gedicht ist nicht mehr auf der Bühne'); }
  }

  /* ---------- Einhängen ---------- */
  const css = document.createElement('style');
  css.textContent =
    '.bu-top{padding:14px 16px;text-align:center}.bu-theme{font-size:17px}.bu-wings{font-size:14px;color:var(--text-muted);margin-top:8px}' +
    '.bu-sorts,.bu-prods{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;margin:10px 0;padding-bottom:4px;scrollbar-width:none}.bu-sorts button,.bu-prods button{flex:none;white-space:nowrap}.bu-sorts button{min-height:40px}' +
    '.bu-poem{padding:16px 18px;text-align:left;margin-bottom:12px;width:100%}.bu-poem h4{font-family:var(--serif);font-weight:400;font-size:21px;margin:0;color:var(--text)}' +
    '.bu-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.bu-meta{font-size:14px;color:var(--text-muted);margin:2px 0 10px}' +
    '.bu-body{font-family:var(--serif);font-style:italic;font-size:18px;line-height:1.55;color:var(--text-soft);white-space:normal}' +
    '.bu-long{max-height:13.5em;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent);mask-image:linear-gradient(#000 70%,transparent)}' +
    '.bu-more{background:none;border:0;color:var(--accent-2);font:inherit;font-size:15px;padding:6px 0;cursor:pointer}' +
    '.bu-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.bu-act{min-height:44px;min-width:56px;padding:6px 12px;border-radius:22px;border:1px solid rgba(255,255,255,.14);background:var(--glass);color:var(--text);font:inherit;font-size:16px;cursor:pointer}' +
    '.bu-act b{font-weight:600;margin-left:2px}.bu-act.on{border-color:var(--accent-2);background:rgba(255,133,161,.18)}.bu-gift{margin-left:auto;border-color:var(--accent-2)}' +
    '.bu-star{border:1px solid rgba(232,194,122,.6);box-shadow:0 0 24px rgba(232,194,122,.18)}.bu-badge{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.5px;color:#2a1a08;background:#e8c27a;border-radius:10px;padding:3px 10px;margin-bottom:8px}' +
    '.bu-empty{text-align:center;padding:16px}.linkish{background:none;border:0;color:var(--accent-2);font:inherit;text-decoration:underline;cursor:pointer;padding:0}' +
    '.bu-mockbox{background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(255,255,255,.02));border-radius:18px;padding:6px;margin:6px 0}.bu-mock{width:100%;height:auto;display:block}' +
    '.bu-hint{font-size:14px;color:var(--text-muted);margin:4px 0}.bu-pick{display:flex;flex-direction:column;gap:4px;max-height:200px;overflow:auto;margin-bottom:6px}' +
    '.bu-pick button{text-align:left;font-family:var(--serif);font-style:italic;font-size:16px;padding:8px 10px;min-height:40px;border-radius:10px;border:1px solid transparent;background:var(--glass-2,rgba(255,255,255,.03));color:var(--text-soft);cursor:pointer}' +
    '.bu-pick button.on{border-color:var(--accent-2);background:rgba(255,133,161,.16);color:var(--text)}' +
    '.bu-ad{font-size:11px;font-weight:700;border:1px solid currentColor;border-radius:6px;padding:0 4px;margin-left:4px;opacity:.85}' +
    '.bu-check{display:flex;gap:10px;align-items:flex-start;font-size:15px;line-height:1.4;margin:8px 0;color:var(--text-soft)}.bu-check input{width:22px;height:22px;flex:none;margin-top:1px}' +
    '.bu-rules{margin:6px 0 4px;font-size:15px}.bu-count{font-size:13px;color:var(--text-muted);font-weight:400}.bu-reasons{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}' +
    '.bu-mine{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}.bu-mine>div{flex:1;min-width:0}.bu-mine span{display:block;font-size:14px;color:var(--text-muted)}' +
    '.bu-offer{font-size:14px;margin-top:4px;color:var(--text-soft)}.bu-offer a{color:var(--accent-2)}';
  document.head.appendChild(css);

  const seg = document.querySelector('.seg[data-seg="play"] [data-sub="buehne"]');
  if (seg) seg.addEventListener('click', () => { C('bu_open'); load(); });
  render();
  handleParam();
  /* Nach der Einrichtung ein geteiltes Gedicht zeigen */
  setInterval(() => { const b = L.S.buehne; if (b && b.pendingPoem && L.S.onboarded && !document.querySelector('#modal.open')) { const id = b.pendingPoem; delete b.pendingPoem; L.save(); history.replaceState(null, '', location.pathname + '?gedicht=' + id); handleParam(); } }, 3000);
  window.LZBU = { SHOP_URL, open, load, render, writeSheet, mineSheet, giftSheet, mockup, PRODUCTS, PARTNERS, CLASSICS, _state: st, _data: () => data };
})();
