/* ========== Schmetterlingsfutter – Zusatzmodule ==========
   Spruch-Generator, Anlässe & Kalender, Wunschsammler, Liebeslied-Pad, Zweisamkeit.
   Nutzt die API aus app.js (window.LZ). */
(function () {
  'use strict';
  const L = window.LZ, D = window.LUZIFER_DATA;
  const $ = (id) => document.getElementById(id);
  const S = () => L.S;
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- 1. Spruch-Generator ---------- */
  function generate() {
    const g = D.gen;
    return L.pick(g.openers) + ' ' + L.pick(g.cores) + '. ' + L.pick(g.closers);
  }
  $('btnGen').onclick = () => { L.spawnHearts(7); L.haptic(8); L.showMessage({ text: generate(), own: false }, 'Frisch gezaubert 😈'); };

  /* ---------- 2. Anlässe, Erinnerungen, Geschenke ---------- */
  function occasionsAll() {
    const s = S(); const list = D.occasions.filter((o) => !(s.hiddenOccasions || []).includes(o.id)).map((o) => Object.assign({ builtin: true }, o));
    if (s.anniversary) { const d = L.parseISODate(s.anniversary); list.push({ id: 'jahrestag', title: 'Unser Jahrestag', month: d.getMonth() + 1, day: d.getDate(), icon: '💍', builtin: true, year0: d.getFullYear() }); }
    if (s.partnerBirthday) { const d = L.parseISODate(s.partnerBirthday); list.push({ id: 'geburtstag', title: 'Geburtstag ' + s.receiver, month: d.getMonth() + 1, day: d.getDate(), icon: '🎂', builtin: true, year0: d.getFullYear() }); }
    s.occasions.forEach((o) => list.push(Object.assign({ builtin: false }, o)));
    const today = L.atMidnight(new Date());
    const special = (o, year) => {
      if (o.special === 'muttertag') { const d = new Date(year, 4, 1); const first = d.getDay(); const second = 1 + ((7 - first) % 7) + 7; return new Date(year, 4, second); }
      return new Date(year, o.month - 1, o.day);
    };
    list.forEach((o) => {
      let next = special(o, today.getFullYear());
      if (next < today) next = special(o, today.getFullYear() + 1);
      o.next = next; o.days = Math.round((next - today) / 86400000);
      if (o.year0) o.nth = next.getFullYear() - o.year0;
    });
    return list.sort((a, b) => a.days - b.days);
  }
  function renderOccasionChip() {
    const chip = $('occasionChip'); const list = occasionsAll(); const o = list[0];
    if (!o) { chip.classList.add('hidden'); return; }
    chip.classList.remove('hidden');
    chip.innerHTML = o.icon + ' ' + L.esc(o.title) + ' ' + (o.days === 0 ? '<b>heute!</b>' : 'in <b>' + o.days + (o.days === 1 ? ' Tag' : ' Tagen') + '</b>');
    chip.onclick = () => { L.showView('time'); L.showSub('time', 'occasions'); };
  }
  function renderOccasions() {
    const l = $('occasionList'); l.innerHTML = '';
    occasionsAll().forEach((o) => {
      const d = document.createElement('div'); d.className = 'occ' + (o.days <= 14 ? ' soon' : '');
      const sub = o.nth ? (o.nth + (o.id === 'geburtstag' ? '. Geburtstag · ' : '. Jahrestag · ')) : '';
      d.innerHTML = '<span class="o-ico">' + o.icon + '</span><div class="o-body"><div class="o-title">' + L.esc(o.title) + '</div><div class="o-date">' + sub + L.fmtDate(o.next) + '</div></div>' +
        '<div class="o-days">' + (o.days === 0 ? '🎉' : o.days + ' T') + '</div>' +
        '<div class="o-actions"><button title="In Kalender" aria-label="In Kalender eintragen" data-cal>📅</button><button title="Geschenkidee" aria-label="Geschenkideen" data-gift>🎁</button></div>';
      d.querySelector('[data-cal]').onclick = () => calendarSheet(o);
      d.querySelector('[data-gift]').onclick = () => giftSheet(o);
      if (o.id !== 'jahrestag' && o.id !== 'geburtstag') {
        d.querySelector('.o-body').style.cursor = 'pointer';
        d.querySelector('.o-body').onclick = () => L.confirmSheet('Anlass ausblenden?', o.title + (o.builtin ? ' (lässt sich über „Einrichtung erneut starten“ nicht zurückholen – Alles löschen setzt zurück)' : ''), 'Ausblenden', () => {
          if (o.builtin) { S().hiddenOccasions = (S().hiddenOccasions || []).concat(o.id); } else { S().occasions = S().occasions.filter((x) => x.id !== o.id); }
          L.save(); renderOccasions(); renderOccasionChip();
        }, true);
      }
      l.appendChild(d);
    });
    renderOccasionChip();
  }
  const pad2 = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  function gcalUrl(o) {
    const start = o.next, end = new Date(start); end.setDate(end.getDate() + 1);
    const details = 'Schmetterlingsfutter erinnert: Zeit für etwas Schönes. Ideen stehen in der App.';
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(o.icon + ' ' + o.title) + '&dates=' + ymd(start) + '/' + ymd(end) + '&details=' + encodeURIComponent(details) + '&recur=' + encodeURIComponent('RRULE:FREQ=YEARLY');
  }
  function icsDownload(o) {
    const start = o.next, end = new Date(start); end.setDate(end.getDate() + 1);
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Schmetterlingsfutter//Liebes-App//DE', 'BEGIN:VEVENT', 'UID:' + o.id + '-' + ymd(start) + '@schmetterlingsfutter-app',
      'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + ymd(start), 'DTEND;VALUE=DATE:' + ymd(end), 'RRULE:FREQ=YEARLY',
      'SUMMARY:' + o.icon + ' ' + o.title, 'DESCRIPTION:Schmetterlingsfutter erinnert: Zeit für etwas Schönes. Ideen stehen in der App.',
      'BEGIN:VALARM', 'TRIGGER:-P14D', 'ACTION:DISPLAY', 'DESCRIPTION:In zwei Wochen: ' + o.title + ' – Geschenk?', 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-P3D', 'ACTION:DISPLAY', 'DESCRIPTION:In drei Tagen: ' + o.title, 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Morgen: ' + o.title, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'schmetterlingsfutter-' + o.id + '.ics';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function calendarSheet(o) {
    L.openSheet('<h3>📅 ' + L.esc(o.title) + ' eintragen</h3><p class="about" style="margin-bottom:16px">Jährlich wiederkehrend. Die Kalenderdatei erinnert 14 Tage, 3 Tage und 1 Tag vorher. Titel bleibt neutral – falls der Kalender geteilt ist. Dann piekst dich dein Handy rechtzeitig.</p>' +
      '<div class="row wrap"><a class="pill-btn primary" style="text-decoration:none" target="_blank" rel="noopener" href="' + gcalUrl(o) + '">Google Kalender öffnen</a><button class="pill-btn" data-ics>Kalenderdatei (.ics)</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-ics]').onclick = () => { icsDownload(o); L.toast('Kalenderdatei erstellt'); };
      sh.querySelector('a').onclick = () => setTimeout(L.closeSheet, 300);
    });
  }
  function amazonUrl(q) {
    const tag = (S().amazonTag || '').trim();
    return 'https://www.amazon.de/s?k=' + encodeURIComponent(q) + (tag ? '&tag=' + encodeURIComponent(tag) : '');
  }
  function giftSheet(o) {
    const key = o.id === 'jahrestag' ? 'jahrestag' : o.id === 'geburtstag' ? 'geburtstag' : (D.gifts[o.id] ? o.id : null);
    const ideas = (key ? D.gifts[key] : []).concat(D.gifts.default);
    const wishes = S().wishes.filter((w) => !w.done && (w.cat || 'wunsch') === 'wunsch');
    let html = '<h3>🎁 Geschenkideen – ' + L.esc(o.title) + '</h3>';
    if (wishes.length) {
      html += '<div class="eyebrow">Aus dem Wunschsammler</div>';
      wishes.slice(0, 5).forEach((w) => { html += '<button class="gift-item" data-q="' + L.esc(w.text) + '"><span class="g-ico">⭐</span><span class="g-t">' + L.esc(w.text) + (w.note ? '<span class="g-s">' + L.esc(w.note) + '</span>' : '') + '</span><span>↗</span></button>'; });
      html += '<div class="eyebrow" style="margin-top:14px">Weitere Ideen</div>';
    } else {
      html += '<p class="about" style="margin-bottom:10px;font-size:13px">Tipp: Wünsche, die ' + L.esc(S().receiver) + ' nebenbei äußert, im Wunschsammler notieren – dann stehen sie hier zuerst.</p>';
    }
    ideas.forEach((g) => { if (g.q) html += '<button class="gift-item" data-q="' + L.esc(g.q) + '"><span class="g-ico">' + g.icon + '</span><span class="g-t">' + L.esc(g.title) + '</span><span>↗</span></button>'; });
    html += '<div class="eyebrow" style="margin-top:14px">Erlebnis statt Ding (nichts zu kaufen)</div>';
    [L.pick(D.experiences), L.pick(D.experiences)].filter((v, i, a) => a.indexOf(v) === i).forEach((e) => { html += '<div class="gift-item" style="cursor:default"><span class="g-ico">' + e.icon + '</span><span class="g-t">' + L.esc(e.title) + '</span></div>'; });
    html += '<div class="row" style="margin-top:14px"><button class="pill-btn ghost" data-cancel>Schließen</button></div>';
    html += '<p class="about" style="font-size:11px;color:var(--text-muted);margin-top:10px">' + (S().amazonTag ? '<span class="ad-note">Werbelinks</span> – Der Anbieter erhält bei einem Kauf eine Provision. ' : '') + 'Links öffnen die Amazon-Suche im Browser, nie in der App.</p>';
    L.openSheet(html, (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => window.open(amazonUrl(b.dataset.q), '_blank', 'noopener'));
    });
  }
  $('btnAddOccasion').onclick = () => L.promptSheet('Eigener Anlass', [
    { key: 'icon', label: 'Symbol (Emoji)', placeholder: '🎉', max: 4 },
    { key: 'title', label: 'Titel', placeholder: 'z. B. Unser erster Kuss', max: 40 },
    { key: 'date', label: 'Datum (TT.MM.)', placeholder: '24.06.', max: 6 }
  ], 'Anlegen', (v) => {
    const m = /^(\d{1,2})\.(\d{1,2})\.?$/.exec(v.date || '');
    if (!v.title || !m) { L.toast('Titel und Datum als TT.MM. eingeben'); return false; }
    const day = +m[1], month = +m[2]; if (day < 1 || day > 31 || month < 1 || month > 12) { L.toast('Datum prüfen'); return false; }
    S().occasions.push({ id: uid('o'), icon: v.icon || '🎉', title: v.title, month, day }); L.save(); renderOccasions();
  });
  $('btnBirthday').onclick = () => L.openSheet('<h3>🎂 Geburtstag von ' + L.esc(S().receiver) + '</h3><div class="field"><label for="pf-bd">Datum</label><input type="date" id="pf-bd" value="' + (S().partnerBirthday || '') + '"></div>' +
    '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Speichern</button></div>', (sh) => {
    sh.querySelector('[data-cancel]').onclick = L.closeSheet;
    sh.querySelector('[data-ok]').onclick = () => { const v = sh.querySelector('#pf-bd').value; if (!v) { L.toast('Bitte Datum wählen'); return; } S().partnerBirthday = v; L.save(); L.closeSheet(); renderOccasions(); L.toast('Gespeichert 🎂'); };
  });

  /* ---------- 3. Wunschsammler ---------- */
  const catOf = (id) => D.loveMapCats.find((c) => c.id === id) || D.loveMapCats[0];
  function renderWishes() {
    const l = $('wishList'); l.innerHTML = '';
    const s = S(); const all = s.wishes; const open = all.filter((w) => !w.done), done = all.filter((w) => w.done);
    const f = s.wishFilter || 'alle';
    $('wishSub').textContent = all.length ? all.length + (all.length === 1 ? ' Eintrag' : ' Einträge') + ' über ' + s.receiver + (open.filter((w) => (w.cat || 'wunsch') === 'wunsch').length ? ' · ' + open.filter((w) => (w.cat || 'wunsch') === 'wunsch').length + ' offene Wünsche' : '') : 'Alles, was du über ' + s.receiver + ' wissen solltest';
    const chips = $('wishChips'); chips.innerHTML = '';
    [{ id: 'alle', label: 'Alle', icon: '' }].concat(D.loveMapCats).forEach((c) => {
      const n = c.id === 'alle' ? all.length : all.filter((w) => (w.cat || 'wunsch') === c.id).length;
      if (c.id !== 'alle' && !n) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = f === c.id ? 'on' : ''; b.textContent = (c.icon ? c.icon + ' ' : '') + c.label + (n ? ' ' + n : '');
      b.onclick = () => { s.wishFilter = c.id; L.save(); renderWishes(); }; chips.appendChild(b);
    });
    $('btnToggleDoneWishes').textContent = (s.showDoneWishes ? 'Erfüllte ausblenden' : 'Erfüllte anzeigen') + (done.length ? ' (' + done.length + ')' : '');
    let show = s.showDoneWishes ? all : open; if (f !== 'alle') show = show.filter((w) => (w.cat || 'wunsch') === f);
    if (!show.length) l.innerHTML = '<div class="empty">Noch nichts notiert. Beim nächsten „Das wäre schön …“ oder „Ich mag …“ hier eintragen.</div>';
    show.slice().reverse().forEach((w) => {
      const c = catOf(w.cat || 'wunsch');
      const d = document.createElement('button'); d.type = 'button'; d.className = 'wish' + (w.done ? ' done' : '');
      d.innerHTML = '<span class="w-star">' + (w.done ? '✅' : c.icon) + '</span><div class="w-body"><div class="w-text">' + L.esc(w.text) + '</div>' + (w.note ? '<div class="w-note">' + L.esc(w.note) + '</div>' : '') +
        '<div class="w-meta">' + c.label + ' · aufgeschnappt am ' + L.fmtDate(new Date(w.date)) + (w.done ? ' · erledigt am ' + L.fmtDate(new Date(w.done)) : '') + '</div></div>';
      d.onclick = () => wishSheet(w);
      l.appendChild(d);
    });
  }
  function wishSheet(w) {
    L.openSheet('<h3>⭐ ' + L.esc(w.text) + '</h3>' + (w.note ? '<p class="about" style="margin-bottom:12px">' + L.esc(w.note) + '</p>' : '') +
      '<div class="row wrap">' + (w.done ? '<button class="pill-btn" data-reopen>Doch noch offen</button>' : '<button class="pill-btn primary" data-done>' + ((w.cat || 'wunsch') === 'wunsch' ? 'Geschenkt ✓' : 'Erledigt ✓') + '</button>') +
      ((w.cat || 'wunsch') === 'wunsch' ? '<button class="pill-btn" data-search>Bei Amazon suchen ↗</button>' : '') + '<button class="pill-btn ghost danger" data-del>Löschen</button><button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const se = sh.querySelector('[data-search]'); if (se) se.onclick = () => window.open(amazonUrl(w.text), '_blank', 'noopener');
      const dn = sh.querySelector('[data-done]'); if (dn) dn.onclick = () => { w.done = new Date().toISOString(); L.save(); L.closeSheet(); renderWishes(); L.spawnHearts(10, $('wishList')); L.toast('Wunsch erfüllt 🎁'); };
      const ro = sh.querySelector('[data-reopen]'); if (ro) ro.onclick = () => { w.done = null; L.save(); L.closeSheet(); renderWishes(); };
      sh.querySelector('[data-del]').onclick = () => { L.closeSheet(); L.confirmSheet('Wunsch löschen?', w.text, 'Löschen', () => { S().wishes = S().wishes.filter((x) => x.id !== w.id); L.save(); renderWishes(); }, true); };
    });
  }
  $('btnAddWish').onclick = () => L.promptSheet('In die Love Map', [
    { key: 'cat', label: 'Art', options: D.loveMapCats.map((c) => ({ value: c.id, label: c.icon + ' ' + c.label })), value: (S().wishFilter && S().wishFilter !== 'alle') ? S().wishFilter : 'wunsch' },
    { key: 'text', label: 'Was hast du aufgeschnappt?', placeholder: 'z. B. die blaue Jacke aus dem Schaufenster', max: 80 },
    { key: 'note', label: 'Notiz (optional: Größe, Farbe, wo, warum)', placeholder: 'Größe M, Laden in der Hauptstraße', max: 160 }
  ], 'Notieren', (v) => {
    if (!v.text) { L.toast('Bitte Text eingeben'); return false; }
    S().wishes.push({ id: uid('w'), cat: v.cat || 'wunsch', text: v.text, note: v.note, date: new Date().toISOString(), done: null }); L.save(); renderWishes(); L.toast('Notiert – das Teufelchen vergisst nichts.');
  });
  $('btnToggleDoneWishes').onclick = () => { S().showDoneWishes = !S().showDoneWishes; L.save(); renderWishes(); };

  /* ---------- 4. Liebeslied-Pad (Web Audio) ---------- */
  let ctx = null, recording = false, recStart = 0, rec = [], playing = false;
  function audio() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq) {
    const c = audio(); if (!c) return;
    const t = c.currentTime, g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2; const g2 = c.createGain(); g2.gain.value = 0.15;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(c.destination);
    o1.start(t); o2.start(t); o1.stop(t + 1.5); o2.stop(t + 1.5);
  }
  function flash(i) { const b = $('pad').children[i]; if (!b) return; b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 160); }
  function hit(i) {
    tone(D.pad[i].f); flash(i); L.haptic(6);
    if (recording) rec.push({ i, t: Date.now() - recStart });
  }
  (function buildPad() {
    const p = $('pad');
    D.pad.forEach((n, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.innerHTML = n.e + '<small>' + n.n + '</small>'; b.setAttribute('aria-label', 'Ton ' + n.n);
      const h = (e) => { e.preventDefault(); hit(i); };
      b.addEventListener('pointerdown', h);
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') h(e); });
      p.appendChild(b);
    });
  })();
  function setRecUI() {
    const r = $('btnRec'); r.textContent = recording ? '■ Stopp' : '● Aufnehmen'; r.classList.toggle('rec', recording);
    $('btnPlayRec').disabled = !rec.length || recording; $('btnSaveSong').disabled = !rec.length || recording;
    $('recHint').textContent = recording ? 'Aufnahme läuft – spiel dein Lied …' : (rec.length ? rec.length + ' Töne aufgenommen. Abspielen oder speichern.' : 'Alle Töne passen zusammen – es kann nichts schief klingen.');
  }
  $('btnRec').onclick = () => {
    if (!recording) { rec = []; recStart = Date.now(); recording = true; audio(); }
    else recording = false;
    setRecUI();
  };
  function playSeq(seq, done) {
    if (playing || !seq.length) return; playing = true; audio();
    const t0 = seq[0].t;
    seq.forEach((n) => setTimeout(() => { tone(D.pad[n.i].f); flash(n.i); }, n.t - t0));
    setTimeout(() => { playing = false; if (done) done(); }, seq[seq.length - 1].t - t0 + 800);
  }
  $('btnPlayRec').onclick = () => playSeq(rec);
  $('btnSaveSong').onclick = () => L.promptSheet('Lied speichern', [{ key: 'name', label: 'Titel', placeholder: 'z. B. Unser Küchen-Tanz', max: 40 }], 'Speichern', (v) => {
    if (!v.name) return false;
    S().songs.push({ id: uid('s'), name: v.name, seq: rec.slice(), date: new Date().toISOString() }); L.save(); renderSongs(); L.toast('Lied gespeichert 🎵');
  });
  function songCode(seq) { return seq.map((n) => n.i + 1).join('·'); }
  function renderSongs() {
    const l = $('songList'); l.innerHTML = ''; $('songCount').textContent = S().songs.length;
    if (!S().songs.length) { l.innerHTML = '<div class="empty">Noch kein Lied. Nimm eins auf und speichere es.</div>'; return; }
    S().songs.slice().reverse().forEach((sg) => {
      const d = document.createElement('div'); d.className = 'song';
      d.innerHTML = '<button class="icon-btn" aria-label="Abspielen">▶</button><span class="s-t">' + L.esc(sg.name) + '<span class="s-m">' + sg.seq.length + ' Töne · ' + L.fmtDate(new Date(sg.date)) + '</span></span><button class="icon-btn" aria-label="Teilen">↗</button><button class="reason-del" aria-label="Löschen">✕</button>';
      const btns = d.querySelectorAll('button');
      btns[0].onclick = () => playSeq(sg.seq);
      btns[1].onclick = () => L.shareText('🎵 Ich habe dir ein Liebeslied komponiert: „' + sg.name + '“\nTöne: ' + songCode(sg.seq) + '\n— ' + S().sender + ' ❤ (Schmetterlingsfutter-App)');
      btns[2].onclick = () => L.confirmSheet('Lied löschen?', sg.name, 'Löschen', () => { S().songs = S().songs.filter((x) => x.id !== sg.id); L.save(); renderSongs(); }, true);
      l.appendChild(d);
    });
  }

  /* ---------- 5. Zweisamkeit ---------- */
  let intimCurrent = '';
  function renderIntim() {
    const on = !!S().intim;
    $('intimLocked').classList.toggle('hidden', on); $('intimContent').classList.toggle('hidden', !on);
    L.setToggle('togIntim', on);
    const l = $('intimWishList'); l.innerHTML = '';
    if (!S().intimWishes.length) l.innerHTML = '<div class="empty">Noch leer. Schreibt auf, was ihr zusammen erleben wollt.</div>';
    S().intimWishes.forEach((w, i) => {
      const d = document.createElement('div'); d.className = 'fav-item'; d.style.fontStyle = 'normal'; d.style.fontFamily = 'var(--sans)';
      d.innerHTML = '<span>' + (w.done ? '✅ ' : '🔥 ') + L.esc(w.text) + '</span><button class="reason-del" aria-label="Umschalten">' + (w.done ? '↺' : '✓') + '</button><button class="reason-del" aria-label="Löschen">✕</button>';
      const b = d.querySelectorAll('button');
      b[0].onclick = () => { w.done = !w.done; L.save(); renderIntim(); };
      b[1].onclick = () => { S().intimWishes.splice(i, 1); L.save(); renderIntim(); };
      l.appendChild(d);
    });
  }
  function enableIntim() {
    L.confirmSheet('Bereich „Zweisamkeit“ einschalten', 'Dieser Bereich enthält Flirt-Nachrichten und Fragen zu Nähe und Intimität. Mit „Ja, wir sind 18+“ bestätigst du, dass ihr beide volljährig seid. Inhalte bleiben auf diesem Gerät.', 'Ja, wir sind 18+', () => { S().intim = true; L.save(); renderIntim(); L.showSub('settings', 'intim'); L.spawnHearts(8, $('intimContent')); });
  }
  $('btnIntimEnable').onclick = enableIntim;
  $('togIntim').onclick = () => { if (S().intim) { S().intim = false; L.save(); renderIntim(); } else enableIntim(); };
  function setIntim(t) { intimCurrent = L.fmt(t); const el = $('intimText'); el.style.opacity = 0; setTimeout(() => { el.textContent = intimCurrent; el.style.opacity = 1; }, 250); }
  $('btnFlirt').onclick = () => { L.spawnHearts(5, $('intimText')); setIntim(L.pick(D.intim.flirt)); };
  $('btnDeepQ').onclick = () => setIntim(L.pick(D.intim.questions));
  $('btnDateIdea').onclick = () => setIntim(L.pick(D.intim.dates));
  $('btnIntimShare').onclick = () => { if (intimCurrent) L.shareText(intimCurrent + '\n— ' + S().sender + ' ❤'); else L.toast('Erst etwas auswählen'); };
  $('btnAddIntimWish').onclick = () => L.promptSheet('Wunsch für zwei', [{ key: 't', label: 'Was wollt ihr zusammen erleben?', placeholder: 'z. B. ein Wochenende ohne Pläne', max: 120 }], 'Hinzufügen', (v) => {
    if (!v.t) return false; S().intimWishes.push({ text: v.t, done: false }); L.save(); renderIntim();
  });

  /* ---------- Einstellungen: Amazon-Kennung ---------- */
  const tagInput = $('setAmazonTag');
  tagInput.addEventListener('change', () => { S().amazonTag = tagInput.value.trim().replace(/[^A-Za-z0-9\-_]/g, ''); tagInput.value = S().amazonTag; L.save(); L.toast(S().amazonTag ? 'Partner-Kennung gespeichert' : 'Partner-Kennung entfernt'); });
  const _origRender = () => { tagInput.value = S().amazonTag || ''; };
  document.getElementById('nav-settings').addEventListener('click', _origRender);

  /* ---------- Start ---------- */
  /* ---------- 6. Piek des Tages ---------- */
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h >>> 0); }
  function todaysPiek() {
    const s = S(); const key = L.todayKey();
    if (s.piekOverride && s.piekOverride.date === key) return D.pieks[s.piekOverride.idx];
    return D.pieks[hash(key + '|piek|' + s.sender) % D.pieks.length];
  }
  function renderPiek() {
    const s = S(); const key = L.todayKey(); const p = todaysPiek(); const done = !!s.piekDone[key];
    $('piekText').textContent = L.fmt(p.t); $('piekCat').textContent = D.piekCats[p.c] || '';
    $('piekCard').classList.toggle('done', done);
    $('btnPiekDone').textContent = done ? 'Erledigt ✓ – stark!' : 'Erledigt ✓'; $('btnPiekDone').disabled = done;
    $('piekStreak').textContent = s.piekCount ? s.piekCount + (s.piekCount === 1 ? ' Piek' : ' Pieks') + ' erledigt' : '';
    $('thanksLabel').textContent = 'Was hat ' + s.receiver + ' heute gut gemacht?';
    $('thanksCount').textContent = s.thanks.length ? s.thanks.length + ' notiert' : '';
  }
  $('btnPiekDone').onclick = () => {
    const s = S(); const key = L.todayKey(); if (s.piekDone[key]) return;
    s.piekDone[key] = true; s.piekCount++; L.save(); renderPiek(); L.spawnHearts(10, $('piekCard')); L.haptic(15);
    L.toast(L.pick(['Das Teufelchen nickt anerkennend. 😈', 'So geht Liebe im Alltag. ✓', 'Piek erledigt – Schmetterlinge gefüttert. 🦋', 'Kein Wort zu ' + s.receiver + '. Einfach gemacht. Stark.']));
  };
  $('btnPiekOther').onclick = () => {
    const s = S(); let idx; const cur = D.pieks.indexOf(todaysPiek());
    do { idx = Math.floor(Math.random() * D.pieks.length); } while (idx === cur && D.pieks.length > 1);
    s.piekOverride = { date: L.todayKey(), idx }; L.save(); renderPiek();
  };

  /* ---------- 7. Dankbarkeits-Notiz ---------- */
  function thanksText() {
    const d = $('thanksInput').value.trim().replace(/[.!]+$/, '');
    if (!d) { L.toast('Erst aufschreiben, was ' + S().receiver + ' gut gemacht hat'); return null; }
    return d;
  }
  function saveThanks(d) { S().thanks.push({ id: uid('t'), text: d, date: new Date().toISOString() }); L.save(); $('thanksInput').value = ''; renderPiek(); }
  $('btnThanksSave').onclick = () => { const d = thanksText(); if (!d) return; saveThanks(d); L.toast('Notiert 🙏'); };
  $('btnThanksSend').onclick = () => {
    const d = thanksText(); if (!d) return;
    const msg = L.fmt(L.pick(D.thanks)).replace('{d}', d);
    saveThanks(d); L.showMessage({ text: msg, own: true }, 'Dein Danke'); L.shareText(msg + '\n— ' + S().sender + ' ❤');
  };
  function renderThanks() {
    const l = $('thanksList'); l.innerHTML = ''; const s = S();
    $('thanksSub').textContent = s.thanks.length ? s.thanks.length + ' Mal hingeschaut' : 'Konkret benannt wirkt am stärksten';
    if (!s.thanks.length) { l.innerHTML = '<div class="empty">Noch keine Notiz. Abends einen Satz auf der Startseite eintragen.</div>'; return; }
    s.thanks.slice().reverse().forEach((t) => {
      const d = document.createElement('div'); d.className = 'thank';
      d.innerHTML = '<span>🙏</span><div class="t-body"><div class="t-text">' + L.esc(t.text) + '</div><div class="t-meta">' + L.fmtDate(new Date(t.date)) + '</div></div><button class="icon-btn" aria-label="Als Danke senden">↗</button><button class="reason-del" aria-label="Löschen">✕</button>';
      const b = d.querySelectorAll('button');
      b[0].onclick = () => L.shareText(L.fmt(L.pick(D.thanks)).replace('{d}', t.text) + '\n— ' + s.sender + ' ❤');
      b[1].onclick = () => { s.thanks = s.thanks.filter((x) => x.id !== t.id); L.save(); renderThanks(); renderPiek(); };
      l.appendChild(d);
    });
  }

  /* ---------- 8. Persönlich machen (Konkretheit vor dem Senden) ---------- */
  $('btnPersonal').onclick = () => {
    const base = $('msgText').textContent; if (!base || base === '…') return;
    L.openSheet('<h3>✎ Persönlich machen</h3><p class="about" style="font-size:13px;margin-bottom:10px">Das Teufelchen sagt: Standardsprüche sind okay, ein konkretes Detail von heute ist besser. Ergänze einen Satz, dann senden.</p>' +
      '<div class="field"><label for="pf-p">Deine Nachricht</label><textarea id="pf-p" maxlength="400">' + L.esc(base) + '</textarea></div>' +
      '<div class="row"><button class="pill-btn ghost" data-cancel>Abbrechen</button><button class="pill-btn primary" data-ok>Senden ↗</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      sh.querySelector('[data-ok]').onclick = () => {
        const t = sh.querySelector('#pf-p').value.trim(); if (!t) return;
        if (t === base) { L.toast('Zu Standard. Nenn was Konkretes. 😈'); return; }
        L.closeSheet(); L.shareText(t + '\n— ' + S().sender + ' ❤');
      };
    });
  };

  window.LZF = { renderOccasions, renderWishes, renderSongs, renderIntim, renderOccasionChip, renderPiek, renderThanks };
  renderOccasionChip(); _origRender(); renderPiek();
  document.querySelector('.seg[data-seg="wishes"] [data-sub="thanks"]').addEventListener('click', renderThanks);
  $('nav-wishes').addEventListener('click', renderThanks);
  $('nav-home').addEventListener('click', renderPiek);
  // Nach Onboarding/Umschlag den Chip aktualisieren
  $('obFinish').addEventListener('click', () => setTimeout(() => { renderOccasionChip(); renderPiek(); }, 50));
})();
