/* Schmetterlingsfutter – „Anonym mithelfen“ (3.21.0)
   Zählt NUR mit Zustimmung, wie oft Bereiche, Spiele und Funktionen genutzt, beendet oder abgebrochen werden,
   Klicks auf Werbelinks (nur der Bereich), bereinigte Suchbegriffe und App-Fehler. Keine Nachrichten, keine Namen,
   keine Antworten aus Gleichklang, Klartext oder Zweisamkeit, keine Geräte- oder Paar-Kennung, keine Uhrzeit.
   Gesendet wird höchstens einmal am Tag, und nur die Tagessummen der Vortage. */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const S = () => L.S, P = () => window.LZP;
  const $ = (id) => document.getElementById(id);
  const FILL = new Set('und oder für fuer mit von der die das den dem ein eine einen einem einer zu zum zur ich du wir ihr mein meine dein deine unser unsere uns mir dir mich dich bitte'.split(' '));
  const MAX_N = 500, MAX_TERMS = 30, MAX_KEYS = 300;
  const ok = () => S().statsOk === true;
  const utcDay = (t) => new Date(t || Date.now()).toISOString().slice(0, 10);

  function store() { const s = S(); if (!s.stats || typeof s.stats !== 'object') s.stats = { days: {} }; if (!s.stats.days) s.stats.days = {}; return s.stats; }
  function bucket() {
    const st = store(), d = utcDay(); let b = st.days[d];
    if (!b) { b = st.days[d] = { c: { app_day: 1 }, q: {} }; const p = P(); if (p && p.paired && p.paired() && p.joined()) b.c.paired_day = 1; }
    return b;
  }
  const cleanKey = (k) => String(k).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9_:.-]+/g, '_').slice(0, 64);
  let saveT = null;
  const later = () => { clearTimeout(saveT); saveT = setTimeout(() => L.save(), 1500); };
  function count(key, n) {
    if (!ok() || !key) return; const b = bucket(), k = cleanKey(key);
    if (!(k in b.c) && Object.keys(b.c).length >= MAX_KEYS) return;
    b.c[k] = Math.min(MAX_N, (b.c[k] || 0) + (n || 1)); later();
  }
  /* Suchbegriffe: eure Namen, Ziffernfolgen, Mail-Adressen und Sonderzeichen fliegen raus */
  function cleanTerm(t) {
    let x = ' ' + String(t || '').toLowerCase() + ' ';
    const names = [S().sender, S().receiver, P() && P().partnerName && P().partnerName()].filter(Boolean).map((n) => String(n).toLowerCase().trim()).filter((n) => n.length > 1);
    names.forEach((n) => { x = x.split(n).join(' '); });
    x = x.replace(/\S*@\S*/g, ' ').replace(/\d{3,}/g, ' ').replace(/[^a-z0-9äöüß .&+-]+/g, ' ').replace(/\s+/g, ' ').trim();
    x = x.split(' ').filter((w) => !FILL.has(w)).join(' ');
    return x.length >= 2 && x.length <= 40 ? x : '';
  }
  function term(src, t) {
    if (!ok()) return; const x = cleanTerm(t); if (!x) return; const b = bucket();
    const q = b.q[src] || (b.q[src] = {}); if (!(x in q) && Object.keys(q).length >= MAX_TERMS) return;
    q[x] = Math.min(20, (q[x] || 0) + 1); later();
  }

  /* Abliefern: nur abgeschlossene Tage, höchstens 7 auf einmal */
  let sending = false;
  async function flush() {
    if (!ok() || sending || !navigator.onLine) return; const p = P(); const relay = p && p.RELAY; if (!relay) return;
    const st = store(), today = utcDay(), oldest = utcDay(Date.now() - 8 * 864e5);
    Object.keys(st.days).forEach((d) => { if (d < oldest) delete st.days[d]; });
    const days = Object.keys(st.days).filter((d) => d < today).sort().slice(0, 7); if (!days.length) return;
    sending = true;
    try {
      const body = { ver: D.version, days: days.map((d) => ({ day: d, c: st.days[d].c, q: st.days[d].q })) };
      const r = await fetch(relay + '/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok || r.status === 400) { days.forEach((d) => delete st.days[d]); L.save(); }
    } catch (e) { /* nächstes Mal */ } finally { sending = false; }
  }

  /* Zustimmung: einmal fragen (ab dem dritten Öffnen), jederzeit unter „Mehr“ änderbar */
  function setOk(v) {
    S().statsOk = v; S().statsAsked = Date.now(); if (!v) delete S().stats; L.save(); renderPromo(); syncToggle();
    if (v) { count('stats_on'); L.toast('Danke! Papillon lernt jetzt anonym mit 🦋'); }
  }
  function infoSheet() {
    L.openSheet('<h3>🦋 Anonym mithelfen</h3><p class="about" style="font-size:17px;margin-bottom:10px">Damit wir sehen, was gefällt, was nicht gefunden wird und wo etwas hakt.</p>' +
      '<div class="eyebrow">Gezählt wird</div><ul class="stats-list"><li>welche Bereiche, Spiele und Funktionen geöffnet, beendet oder abgebrochen werden</li><li>Klicks auf Werbelinks (nur in welchem Bereich)</li><li>Suchbegriffe aus der eigenen Suche und aus „Frag Papillon“, ohne eure Namen und Zahlen</li><li>bei „Gemeinsam“, welche Karten zu Gemeinsamkeiten werden (nicht, bei wem)</li><li>Fehler der App</li></ul>' +
      '<div class="eyebrow" style="margin-top:12px">Nie</div><ul class="stats-list"><li>Nachrichten, Namen, Fotos</li><li>Antworten aus Gleichklang, Klartext oder Zweisamkeit</li><li>Geräte- oder Paar-Kennung, Uhrzeit, Standort</li></ul>' +
      '<p class="about" style="font-size:16px;color:var(--text-muted);margin-top:10px">Einmal am Tag gehen nur Tagessummen an den Dienst. Abschalten löscht noch nicht gesendete Zähler. Mehr dazu im <a href="privacy.html#mithelfen">Datenschutz</a>.</p>' +
      '<div class="row wrap" style="margin-top:12px">' + (ok() ? '<button class="pill-btn ghost" data-off>Abschalten</button>' : '<button class="pill-btn primary" data-on>Ja, anonym mithelfen</button>') + '<button class="pill-btn ghost" data-cancel>Schließen</button></div>', (sh) => {
      sh.querySelector('[data-cancel]').onclick = L.closeSheet;
      const on = sh.querySelector('[data-on]'); if (on) on.onclick = () => { L.closeSheet(); setOk(true); };
      const off = sh.querySelector('[data-off]'); if (off) off.onclick = () => { L.closeSheet(); setOk(false); };
    });
  }
  function renderPromo() {
    let el = $('statsPromo'); const show = S().onboarded && S().statsOk === undefined && (S().launches || 0) >= 3;
    if (!show) { if (el) el.remove(); return; }
    if (!el) { const anchor = $('partnerCard'); if (!anchor) return; el = document.createElement('div'); el.id = 'statsPromo'; el.className = 'card promo'; anchor.parentNode.insertBefore(el, anchor.nextSibling); }
    el.innerHTML = '<div class="promo-title">🦋 Hilf Papillon, besser zu werden</div><p class="about" style="font-size:17px;margin:6px 0 0">Anonym zählen, was ihr nutzt und was hakt. Nie Nachrichten, Namen oder Antworten.</p>' +
      '<div class="row wrap" style="margin-top:12px;justify-content:flex-start"><button class="pill-btn primary" data-on>Ja, gern</button><button class="pill-btn ghost" data-info>Was genau?</button><button class="pill-btn ghost" data-no>Nein danke</button></div>';
    el.querySelector('[data-on]').onclick = () => setOk(true);
    el.querySelector('[data-no]').onclick = () => setOk(false);
    el.querySelector('[data-info]').onclick = infoSheet;
  }
  function mountToggle() {
    const anchor = $('togFly') || $('togHaptic'); if (!anchor || $('togStats')) return;
    const row = document.createElement('div'); row.className = 'switch';
    row.innerHTML = '<div>Anonym mithelfen<small>Zählt nur, was genutzt wird und was hakt · <a href="#" data-info>Was genau?</a></small></div><button class="toggle" id="togStats" role="switch" aria-label="Anonym mithelfen"></button>';
    const slot = $('privacySlot'); /* 3.43.0: Karte „Daten“ in den Einstellungen */
    if (slot) slot.appendChild(row); else anchor.closest('.switch').after(row);
    row.querySelector('[data-info]').onclick = (e) => { e.preventDefault(); infoSheet(); };
    $('togStats').onclick = () => setOk(!ok());
    syncToggle();
  }
  function syncToggle() { const t = $('togStats'); if (t) t.setAttribute('aria-checked', ok() ? 'true' : 'false'); }

  /* Allgemeine Messpunkte: Reiter, Kacheln, Werbelinks, Fehler */
  document.addEventListener('click', (e) => {
    if (!ok()) return; const b = e.target.closest && e.target.closest('button, a'); if (!b) return;
    if (b.dataset.view) count('view:' + b.dataset.view);
    else if (b.dataset.sub) count('sub:' + b.dataset.sub);
    else if (b.id && /^btn[A-Z]/.test(b.id)) count('tap:' + b.id.slice(3));
    else if (b.classList.contains('tip') && b.dataset.q) { const box = b.closest('[id]'); count('ad:' + (box ? box.id : 'sonst')); }
  }, true);
  window.addEventListener('error', (e) => { const f = String(e.filename || '').split('/').pop().split('?')[0] || 'x'; count('err:' + f + ':' + (e.lineno || 0)); });
  window.addEventListener('unhandledrejection', () => count('err:promise'));

  S().launches = (S().launches || 0) + 1; L.save();
  mountToggle(); renderPromo();
  (window.__sfErr || []).forEach((x) => count('err:' + x)); window.__sfErr = null;
  setTimeout(flush, 6000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(flush, 3000); });
  window.LZS = { count, term, flush, infoSheet, cleanTerm, ok };
})();
