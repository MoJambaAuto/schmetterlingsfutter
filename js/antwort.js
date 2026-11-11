/* Schmetterlingsfutter – Antworten zuordnen (LZR, 3.26.0)
   Wer auf eine Nachricht antwortet, schickt einen kurzen Bezug mit („↩ auf: …“).
   So sieht der Schatz, worauf sich „Tut mir leid“ bezieht. Der Bezug gilt für die nächste Sendung (höchstens 30 Minuten)
   und lässt sich über die Leiste oben jederzeit lösen. Ältere App-Versionen ignorieren das Feld „re“. */
(function () {
  'use strict';
  const L = window.LZ; if (!L) return;
  const S = () => L.S;
  const P = () => window.LZP;
  const esc = L.esc;
  const TTL = 30 * 60 * 1000;
  const CARRY = { msg: 1, pic: 1, jingle: 1, coupon: 1, gift: 1 };
  const ICON = { msg: '💌', pic: '🎨', jingle: '🎶', coupon: '🎟️', gift: '🎁', game: '🎲', spiel: '🎲', match: '🎯' };

  /* Kurzer, lesbarer Bezug aus einem Postfach-Eintrag */
  function snippet(m) {
    let t = String(m.text || '').replace(/\s+/g, ' ').trim();
    if (!t) t = m.t === 'pic' ? 'Kritzel-Gruß' : m.t === 'jingle' ? 'Jingle' : 'Nachricht';
    return t.length > 90 ? t.slice(0, 88) + '…' : t;
  }
  function clean(re) {
    if (!re || typeof re !== 'object') return null;
    const text = String(re.text || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    const t = String(re.t || 'msg').slice(0, 10);
    return text ? { text, t: ICON[t] ? t : 'msg' } : null;
  }
  function active() {
    const r = S().replyTo;
    if (!r) return null;
    if (Date.now() - r.since > TTL) { S().replyTo = null; L.save(); bar(); return null; }
    return r;
  }

  /* Antworten beginnen: Bezug merken und oben anzeigen */
  function start(m) {
    if (!m) return;
    S().replyTo = { text: snippet(m), t: m.t || 'msg', since: Date.now() };
    L.save(); bar();
  }
  function stop() { S().replyTo = null; L.save(); bar(); }

  /* Vor dem Senden: Bezug anhängen und danach lösen */
  function attach(obj) {
    if (!obj || !CARRY[obj.t] || obj.re) return obj;
    const r = active(); if (!r) return obj;
    S().replyTo = null; L.save(); setTimeout(bar, 0);
    return Object.assign({}, obj, { re: { text: r.text, t: r.t } });
  }

  /* „↩ auf: …“ als kleines Zitat über der eigentlichen Nachricht */
  function quoteHtml(re, who) {
    const r = clean(re); if (!r) return '';
    return '<div class="re-quote"><span class="re-k">↩ ' + esc(who ? 'Antwort auf ' + who : 'Antwort auf') + '</span><span class="re-t">' + ICON[r.t] + ' „' + esc(r.text) + '“</span></div>';
  }

  /* Leiste oben, solange ein Bezug offen ist */
  function bar() {
    let el = document.getElementById('replyBar');
    const r = S().replyTo && Date.now() - S().replyTo.since <= TTL ? S().replyTo : null;
    if (!r) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'replyBar'; el.className = 'reply-bar'; el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = '<span class="rb-i">↩</span><span class="rb-b"><span class="rb-k">Deine Antwort bezieht sich auf</span><span class="rb-t">' + ICON[r.t] + ' „' + esc(r.text) + '“</span></span><button type="button" class="rb-x" aria-label="Bezug entfernen">✕</button>';
    el.querySelector('.rb-x').onclick = () => { stop(); L.toast('Bezug entfernt'); };
  }

  const css = document.createElement('style');
  css.textContent =
    '.re-quote{display:flex;flex-direction:column;gap:2px;border-left:3px solid var(--accent);background:var(--glass-2);border-radius:8px;padding:6px 10px;margin:0 0 8px;text-align:left}' +
    '.re-quote .re-k{font-size:13px;letter-spacing:.3px;color:var(--text-muted);font-style:normal;font-family:inherit}' +
    '.re-quote .re-t{font-size:15px;color:var(--text-soft);font-style:normal;font-family:inherit;line-height:1.35}' +
    '.msg-card .re-quote{margin:4px 0 12px}' +
    '.reply-bar{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);z-index:58;display:flex;align-items:center;gap:10px;max-width:min(92vw,520px);' +
    'background:var(--accent-dark);color:#fff;border-radius:16px;padding:8px 8px 8px 14px;box-shadow:0 6px 22px rgba(0,0,0,.35)}' +
    '.reply-bar .rb-i{font-size:20px}.reply-bar .rb-b{display:flex;flex-direction:column;min-width:0}' +
    '.reply-bar .rb-k{font-size:12px;opacity:.85}.reply-bar .rb-t{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.reply-bar .rb-x{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:16px}';
  document.head.appendChild(css);

  window.LZR = { start, stop, attach, clean, quoteHtml, active, snippet, bar };
  bar();
})();
