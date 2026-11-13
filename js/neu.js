/* Schmetterlingsfutter – Neue Versionen zuverlässig laden + „Neu in dieser Version“ (LZU, 3.38.0)
   Problem: Die App lädt zuerst die gespeicherte Fassung (schnell, auch offline) und holt die neue im Hintergrund.
   Wird sie aus dem Hintergrund fortgesetzt statt neu gestartet, blieb die alte Fassung teils tagelang aktiv
   (Auswertung 13.11.2026: ein Gerät noch auf 3.27.0).
   Lösung: Beim Zurückkehren in die App nach Updates fragen (höchstens alle 20 Minuten). Ist eine neue Fassung aktiv,
   wird neu geladen – aber nur in einem ruhigen Moment (kein offenes Fenster, Spiel, Kamera, Eingabe). Sonst ein Hinweis zum Antippen.
   Nach dem Update zeigt ein kurzes Fenster, was neu ist (D.news). */
(function () {
  'use strict';
  const D = window.LUZIFER_DATA, L = window.LZ; if (!D || !L) return;
  const esc = L.esc, C = (k) => window.LZS && window.LZS.count(k);

  /* Was ist neu – kurz, in Alltagssprache. Neueste zuerst. */
  D.news = [
    { v: '3.43.0', items: ['🧭 Neue Leiste unten: Heute · Post · Schicken · Spielen · Wir – jede Funktion hat ihren festen Platz', '📬 Post zeigt alles zwischen euch: was du geschickt hast, was angekommen ist, und ob es gesehen wurde', '⚙️ Einstellungen oben rechts am Zahnrad – dort stehen jetzt nur noch Einstellungen'] },
    { v: '3.42.0', items: ['🏡 Neue Adresse: app.schmetterlingsfutter.de – deine Daten sind mitgekommen', '🔔 Mitteilungen bitte einmal neu einschalten (die neue Adresse fragt neu)'] },
    { v: '3.41.0', items: ['🦋 Neu auf der Startseite: jeden Tag ein Stück Falter-Wissen, passend zur Jahreszeit', '🗓️ Steckbriefe im Schmetterlingsbuch: wann jede Art fliegt und was ihre Raupe frisst', '🧐 Neues Spiel zu zweit: „Wahr oder Falter?“ – echt oder erfunden?', '🌱 Echten Faltern helfen: mitzählen oder spenden, direkt bei den Vereinen'] },
    { v: '3.40.1', items: ['🛍️ Neu: der Schmetterlingsfutter-Poesie-Shop – Goethe, Heine und Rilke fertig auf Tasse, Shirt und Hoodie (unter Bühne → Klassiker → 🎁 Geschenk)'] },
    { v: '3.40.0', items: ['🎤 Neu unter Spielen: die Bühne – Liebesgedichte von euch lesen, applaudieren, Flügel geben und selbst vortragen', '🎁 Aus jedem Gedicht ein Geschenk machen: Tasse, Karte, Poster, Shirt und mehr – mit Vorschau', '🏆 Jede Woche wird das beliebteste Gedicht zum „Gedicht der Woche“'] },
    { v: '3.39.2', items: ['🪂 Neu in den Empfehlungen: Jochen Schweizer Arena – Erlebnisse zu zweit bei München'] },
    { v: '3.39.1', items: ['🦋 Falter in 3D startet und beendet sich zuverlässiger – auch mit der Zurück-Taste'] },
    { v: '3.39.0', items: ['🎁 Papillon bringt ab und zu ein kleines Geschenk vorbei – neue Empfehlungen unserer Partner (als Werbung gekennzeichnet, ganz selten)', '🛠️ Mehrere Verbesserungen an der Falterjagd in 3D'] },
    { v: '3.38.1', items: ['👑 Schmetterlinge fangen: Legt einen Liebesdienst als Wochen-Einsatz fest – wer am Sonntag hinten liegt, schenkt ihn'] },
    { v: '3.38.0', items: [
      '🔥 Neuer Partner Orion: Ideen im Bereich „Zweisamkeit“ (18+) führen jetzt zu einem passenden Erotik-Shop',
      '🔄 Neue Versionen kommen zuverlässig an – die App frischt sich in einem ruhigen Moment selbst auf',
      '✨ „Neu in dieser Version“ – dieses Fenster' ] },
    { v: '3.37.0', items: ['🎁 Empfehlungen unter „Mehr“: ausgesuchte Partner für Erlebnisse, Blumen und Tickets (erscheinen nach und nach)'] },
    { v: '3.36.1', items: ['📳 Die Vibration ist jetzt deutlich spürbar'] },
    { v: '3.36.0', items: ['🦋 Neues Logo auf der Startseite: ein Schmetterling aus Herzen'] },
    { v: '3.35.0', items: [
      '📷 Die Falterjagd startet jetzt im Kamerabild – mit Kompass und Radar zu den Faltern in deiner Nähe',
      '🦋 „Falter in 3D“: echte 3D-Falter um dich herum (auf geeigneten Android-Handys)',
      '💞 Falterspaziergang zu zweit: drei Falter zusammen finden, danach ein Moment nur für euch',
      '✨ Falter zu Besuch: jeden Tag drei Falter bei euch im Zimmer' ] },
    { v: '3.34.0', items: ['🎲 Spiele zu zweit: über „⋯“ neu starten oder beenden'] }
  ];
  const num = (v) => String(v || '0').split('.').map((x) => Number(x) || 0).reduce((a, x) => a * 1000 + x, 0);

  function whatsNew() {
    const S = L.S; let seen = S.seenVersion; S.seenVersion = D.version;
    if (!seen && S.onboarded) seen = '3.33.0'; /* bestehende Nutzer von vor 3.38.0: Neuigkeiten seit der Falterjagd zeigen */
    if (!seen) { L.save(); return; } /* Erststart: nichts zeigen */
    if (num(seen) >= num(D.version)) return;
    L.save();
    const items = []; D.news.filter((n) => num(n.v) > num(seen) && num(n.v) <= num(D.version)).forEach((n) => n.items.forEach((t) => items.push(t)));
    if (!items.length) return;
    C('news_show');
    setTimeout(() => {
      if (document.querySelector('#modal.open') || busy()) return; /* nicht in etwas hineinplatzen */
      L.openSheet('<h3>✨ Neu in Version ' + esc(D.version) + '</h3><ul class="nw-list">' + items.slice(0, 8).map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
        '<div class="row" style="margin-top:12px"><button class="pill-btn primary" data-ok>Schön!</button></div>', (sh) => { sh.querySelector('[data-ok]').onclick = L.closeSheet; });
    }, 1200);
  }

  /* ---------- Updates ---------- */
  const busy = () => !!(document.querySelector('#modal.open, #g2Screen, .jagd, .jagd-fang, .heide, .raum-ov, .cam, .fang, #matchScreen:not(.hidden)') ||
    (document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)));
  let lastCheck = 0, pending = false;
  const hadController = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  function check() {
    if (!navigator.serviceWorker || Date.now() - lastCheck < 20 * 60e3) return; lastCheck = Date.now();
    navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {});
  }
  function bar() {
    if (document.getElementById('nwBar')) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'nwBar'; b.className = 'nw-bar'; b.textContent = '✨ Neue Version bereit – zum Laden antippen';
    b.onclick = () => { C('news_reload_tap'); location.reload(); }; document.body.appendChild(b);
  }
  function tryReload() { if (!pending) return; if (busy()) { bar(); return; } C('news_reload_auto'); location.reload(); }
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController) return; pending = true; tryReload(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { check(); setTimeout(tryReload, 400); } });
    lastCheck = Date.now(); /* beim Start prüft der Browser selbst */
    setInterval(() => { if (pending && !busy()) tryReload(); }, 15000);
  }

  const css = document.createElement('style');
  css.textContent = '.nw-list{margin:8px 0 4px 0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:10px}.nw-list li{font-size:17px;line-height:1.45;background:var(--glass,rgba(255,255,255,.05));border-radius:14px;padding:10px 12px}' +
    '.nw-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom));z-index:9700;border:0;border-radius:22px;padding:12px 18px;min-height:46px;font:700 16px Lato,sans-serif;color:#fff;background:linear-gradient(135deg,#e8467c,#b04fd0);box-shadow:0 6px 20px rgba(0,0,0,.35)}';
  document.head.appendChild(css);
  /* „Was ist neu?“ zum Nachlesen (Kachel unter Wir → Mitmachen und Frag Papillon, 3.43.0) */
  function newsSheet() {
    L.openSheet('<h3>✨ Neu in Version ' + esc(D.version) + '</h3><ul class="nw-list">' + (D.news || []).slice(0, 3).map((n) => n.items.map((t) => '<li>' + esc(t) + '</li>').join('')).join('') + '</ul><div class="row" style="margin-top:12px"><button class="pill-btn primary" data-ok>Schön!</button></div>', (sh) => { sh.querySelector('[data-ok]').onclick = L.closeSheet; });
  }
  whatsNew();
  window.LZU = { whatsNew, check, busy, newsSheet };
})();
