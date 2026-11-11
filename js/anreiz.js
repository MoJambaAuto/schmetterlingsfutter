/* Schmetterlingsfutter – Papillon fliegt vorbei (3.19.0)
   Ab und zu flattert ein bunter Schmetterling über den Bildschirm und lädt zu einem Spiel ein.
   Vorrang hat, was zwischen euch offen ist (Schatz wartet, Ergebnis da). Höchstens einmal je Besuch und dreimal am Tag,
   nie über offenen Fenstern, abschaltbar unter Mehr. Ohne Animationen erscheint er ruhig, ohne Flug. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const S = () => L.S, P = () => window.LZP;
  const $ = (id) => document.getElementById(id);
  const HUES = [0, 40, 95, 150, 200, 260, 310];
  let shownThisVisit = false, timer = null, el = null;

  const busy = () => ($('modal') && $('modal').classList.contains('open')) || ($('matchScreen') && !$('matchScreen').classList.contains('hidden')) || document.hidden || !S().onboarded || $('onboarding') && !$('onboarding').classList.contains('hidden');
  const calm = () => S().motion === false || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const off = () => S().flyOff === true;

  function dayCount() { const k = L.todayKey(); const f = S().flyDay; return f && f.d === k ? f.n : 0; }
  function countUp() { const k = L.todayKey(); const f = S().flyDay && S().flyDay.d === k ? S().flyDay : { d: k, n: 0 }; f.n++; S().flyDay = f; L.save(); }

  /* Was schlägt Papillon vor? */
  function suggestion() {
    const p = P(); const name = p ? p.partnerName() : S().receiver;
    if (p && p.joined()) {
      const a = p.activity().find((x) => x.kind !== 'wait');
      if (a) return { key: 'act_' + a.deck.id, text: a.kind === 'turn' ? name + ' wartet bei „' + a.deck.title + '“ auf dich!' : 'Euer Ergebnis bei „' + a.deck.title + '“ ist da ✨', go: 'Ansehen', run: () => p.openDeckFromStatus(a.deck) };
    }
    const pool = [];
    (D.decks || []).forEach((deck) => {
      if (deck.talk || (deck.adult && !S().intim)) return;
      const rec = (S().matches || {})[deck.id];
      if (rec && deck.daily && rec.date.slice(0, 10) === L.todayKey()) return;
      if (rec && rec.matches === null) return; // wartet ohnehin
      const fresh = !rec, more = p && deck.items.length > (deck.round || 8) && p.explored(deck) < deck.items.length;
      let text;
      if (deck.common) text = fresh ? 'Was verbindet euch bei „' + deck.title + '“? Findet es heraus 🤝' : more ? 'Neue Fragen bei „' + deck.title + '“ – was mögt ihr beide?' : '';
      else if (deck.daily) text = 'Heute schon „' + deck.title + '“ gespielt? 🎯';
      else text = fresh ? 'Schon „' + deck.title + '“ ausprobiert? Ein paar schnelle Fragen 💞' : more ? '„' + deck.title + '“ hat neue Fragen für euch' : '';
      if (text) pool.push({ key: 'deck_' + deck.id, text, go: 'Los', run: () => p && p.playDeck(deck.id) });
    });
    if (window.LZK) pool.push({ key: 'kamera', text: 'Ein Selfie mit Schmetterlingen für ' + name + '? 📸', go: 'Los', run: () => window.LZK.open() });
    pool.push({ key: 'oracle', text: 'Zupf mal am Gänseblümchen-Orakel 🌼', go: 'Los', run: () => { L.showView('play'); L.showSub('play', 'oracle'); } });
    pool.push({ key: 'klartext', text: 'Etwas Wichtiges sanft ansprechen? Klartext hilft 🕊️', go: 'Ansehen', run: () => { L.showView('play'); L.showSub('play', 'klartext'); } });
    pool.push({ key: 'music', text: 'Ein Lied für ' + name + '? 🎵', go: 'Los', run: () => { L.showView('play'); L.showSub('play', 'music'); } });
    const last = S().flyLast; const choice = pool.filter((x) => x.key !== last);
    return choice.length ? choice[Math.floor(Math.random() * choice.length)] : null;
  }

  function leave(fast) {
    if (!el) return; const e = el; el = null;
    const bub = e.querySelector('.fly-bubble'); if (bub) bub.classList.add('gone');
    if (calm() || fast) { e.style.opacity = '0'; setTimeout(() => e.remove(), 300); return; }
    const b = e.querySelector('.fly-b'); const r = b.getBoundingClientRect();
    b.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(' + (window.innerWidth - r.left + 60) + 'px,' + (-r.top - 80) + 'px) rotate(25deg)' }], { duration: 1800, easing: 'ease-in', fill: 'forwards' });
    setTimeout(() => e.remove(), 1900);
  }

  function fly(sug) {
    if (el || !sug) return;
    shownThisVisit = true; countUp(); S().flyLast = sug.key; L.save();
    el = document.createElement('div'); el.className = 'fly'; el.setAttribute('role', 'status');
    el.innerHTML = '<button type="button" class="fly-b" aria-label="Papillon: ' + L.esc(sug.text) + '"><span class="fly-w" style="filter:hue-rotate(' + HUES[Math.floor(Math.random() * HUES.length)] + 'deg) saturate(1.4)">🦋</span></button>' +
      '<div class="fly-bubble"><div class="fly-t">' + L.esc(sug.text) + '</div><div class="row" style="gap:8px;justify-content:flex-start;margin-top:8px"><button type="button" class="pill-btn small primary" data-go>' + L.esc(sug.go) + ' ›</button><button type="button" class="pill-btn small ghost" data-no aria-label="Papillon wegschicken">Später</button></div></div>';
    document.body.appendChild(el);
    const go = () => { leave(true); try { sug.run(); } catch (e) {} };
    el.querySelector('[data-go]').onclick = go; el.querySelector('.fly-b').onclick = go;
    el.querySelector('[data-no]').onclick = () => leave(false);
    const b = el.querySelector('.fly-b');
    if (calm()) { el.classList.add('landed'); }
    else {
      /* Flug in Schlangenlinien vom linken Rand zum Landeplatz */
      const r = b.getBoundingClientRect(); const sx = -r.left - 60, sy = -Math.min(r.top - 80, window.innerHeight * 0.45);
      const kf = []; for (let i = 0; i <= 8; i++) { const t = i / 8; kf.push({ transform: 'translate(' + (sx * (1 - t)) + 'px,' + (sy * (1 - t) + Math.sin(t * Math.PI * 3) * 46 * (1 - t)) + 'px) rotate(' + (Math.sin(t * Math.PI * 4) * 14) + 'deg)' }); }
      b.animate(kf, { duration: 4200, easing: 'ease-out' }).onfinish = () => { if (el) el.classList.add('landed'); };
    }
    setTimeout(() => { if (el) leave(false); }, 16000);
  }

  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(function tryFly() {
      if (off() || shownThisVisit || dayCount() >= 3) return;
      if (busy()) { timer = setTimeout(tryFly, 6000); return; }
      fly(suggestion());
    }, ms);
  }

  /* Schalter unter Mehr */
  function mountToggle() {
    const hap = $('togHaptic'); if (!hap || $('togFly')) return;
    const row = document.createElement('div'); row.className = 'switch';
    row.innerHTML = '<div>Papillon fliegt vorbei<small>Lädt ab und zu zu einem Spiel ein</small></div><button class="toggle" id="togFly" role="switch" aria-label="Papillon fliegt vorbei"></button>';
    hap.closest('.switch').after(row);
    const t = $('togFly'); const set = () => t.setAttribute('aria-checked', off() ? 'false' : 'true'); set();
    t.onclick = () => { S().flyOff = !off(); L.save(); set(); if (off()) leave(true); };
  }

  mountToggle();
  /* Wartet jemand auf dich, kommt Papillon früher */
  setTimeout(() => { const p = P(); const urgent = p && p.joined() && p.activity().some((x) => x.kind !== 'wait'); schedule(urgent ? 6000 : 25000); }, 1500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !shownThisVisit) schedule(15000); });
  window.LZA = { fly: (force) => { shownThisVisit = false; if (force) { const f = S().flyDay; if (f) f.n = 0; } fly(suggestion()); }, leave, suggestion };
})();
