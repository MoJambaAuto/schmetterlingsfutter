/* Schmetterlingsfutter – Umzug von der alten Adresse (mojambaauto.github.io/schmetterlingsfutter) nach app.schmetterlingsfutter.de.
   Läuft als ERSTES Skript. Auf der neuen Adresse tut es nichts.
   Alte Adresse im Browser-Tab: App-Speicher verschlüsselt (AES-GCM, Schlüssel nur im Link-Anker) über den Relay mitnehmen,
   dann weiter zu umzug.html auf der neuen Adresse – dort wird eingespielt. Ohne Daten: einfach weiterleiten.
   Play-App (TWA) bleibt vorerst hier: dort sieht man keine Adresse, und erst ein neues Play-Paket kennt die neue.
   Installierte Web-App (Startbildschirm): kein Zwang, nur ein Hinweis mit Knopf.
   Test am PC: localStorage 'sf.umzugTest' = 'http://127.0.0.1:8003/' auf localhost:8000 → verhält sich wie die alte Adresse. */
(function () {
  'use strict';
  var NEW = 'https://app.schmetterlingsfutter.de/';
  var RELAY = 'https://schmetterlingsfutter-relay.mojamba-automation.workers.dev';
  var OLD_HOST = 'mojambaauto.github.io';
  var NO_COPY = { 'sf.umzug': 1, 'sf.umzugTest': 1, 'sf.twa': 1 };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var test = isLocal ? get('sf.umzugTest') : null;
  if (location.hostname !== OLD_HOST && !test) return;
  if (test) { NEW = test; RELAY = 'http://localhost:8787'; }
  try { if (/^android-app:\/\/de\.mojamba\.schmetterlingsfutter/.test(document.referrer || '')) set('sf.twa', '1'); } catch (e) {}
  if (get('sf.twa') === '1') return;
  try { if (sessionStorage.getItem('sf.umzugSkip') === '1') return; } catch (e) {}

  var rest = location.search + location.hash;
  var standalone = false; try { standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) {}
  var moved = null; try { moved = JSON.parse(get('sf.umzug') || 'null'); } catch (e) {}

  window.SF_UMZUG = { NEW: NEW };
  if (!get('luzifer.v2') || (moved && moved.taken)) { stopApp(); location.replace(NEW + rest); return; }
  if (standalone) { document.addEventListener('DOMContentLoaded', banner); return; }
  stopApp(); go();

  /* Restliche App-Skripte nicht mehr starten (sonst holt sie z. B. Nachrichten ab, die dann nur hier lägen). */
  function stopApp() { try { window.stop(); } catch (e) {} }

  function b64u(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  async function pack() {
    var all = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && !NO_COPY[k]) all[k] = localStorage.getItem(k); }
    var raw = new TextEncoder().encode(JSON.stringify({ v: 1, from: location.origin, at: Date.now(), ls: all }));
    var gz = 0;
    if (window.CompressionStream) { try { raw = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); gz = 1; } catch (e) {} }
    var keyRaw = crypto.getRandomValues(new Uint8Array(32)), iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await crypto.subtle.importKey('raw', keyRaw, 'AES-GCM', false, ['encrypt']);
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, raw));
    var out = new Uint8Array(1 + 12 + ct.length); out[0] = gz; out.set(iv, 1); out.set(ct, 13);
    return { body: out, key: b64u(keyRaw) };
  }
  async function transfer() {
    if (moved && moved.id) {
      try { var r0 = await fetch(RELAY + '/umzug/status?id=' + moved.id, { cache: 'no-store' }); var j0 = await r0.json(); if (j0 && j0.state === 'taken') { moved.taken = 1; set('sf.umzug', JSON.stringify(moved)); return NEW + rest; } } catch (e) {}
    }
    var p = await pack();
    var r = await fetch(RELAY + '/umzug/put', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: p.body });
    if (!r.ok) throw new Error('relay ' + r.status);
    var j = await r.json(); if (!j || !j.id) throw new Error('id');
    set('sf.umzug', JSON.stringify({ id: j.id, at: Date.now() }));
    return NEW + 'umzug.html#' + j.id + '.' + p.key + '.' + encodeURIComponent(rest);
  }

  function screen(html) {
    var d = document.getElementById('sfUmzug');
    if (!d) {
      d = document.createElement('div'); d.id = 'sfUmzug';
      d.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#1a0a1e;color:#fff4f7;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;font:16px/1.5 Lato,system-ui,sans-serif';
      (document.body || document.documentElement).appendChild(d);
    }
    d.innerHTML = html; return d;
  }
  var BTN = 'margin:8px;padding:12px 22px;border-radius:999px;border:0;font:700 16px Lato,system-ui,sans-serif;';
  async function go() {
    screen('<div style="font-size:56px">🦋</div><p style="font-size:20px;margin:12px 0 4px">Schmetterlingsfutter zieht um …</p><p style="opacity:.75;margin:0">Neue Adresse: <b>app.schmetterlingsfutter.de</b><br>Deine Daten kommen mit.</p>');
    try { location.replace(await transfer()); }
    catch (e) {
      var d = screen('<div style="font-size:48px">🦋</div><p style="font-size:19px;margin:12px 0 4px">Umzug klappt gerade nicht</p><p style="opacity:.75;margin:0 0 12px">Bitte prüfe die Internet-Verbindung.</p>'
        + '<button data-again style="' + BTN + 'background:#e8305a;color:#fff">Nochmal versuchen</button><button data-skip style="' + BTN + 'background:transparent;color:#fff4f7;border:1px solid #fff4f7">Erstmal hier weiter</button>');
      d.querySelector('[data-again]').onclick = go;
      d.querySelector('[data-skip]').onclick = function () { try { sessionStorage.setItem('sf.umzugSkip', '1'); } catch (e2) {} location.reload(); };
    }
  }
  function banner() {
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9900;background:#2d1133;color:#fff4f7;border:1px solid rgba(255,244,247,.25);border-radius:16px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.45);font:15px/1.4 Lato,system-ui,sans-serif';
    b.innerHTML = '<b>🦋 Neue Adresse: app.schmetterlingsfutter.de</b><div style="opacity:.8;margin:4px 0 10px">Deine Daten kommen mit. Danach die App dort neu zum Startbildschirm hinzufügen.</div>'
      + '<button data-go style="' + BTN + 'margin:0 8px 0 0;padding:10px 18px;background:#e8305a;color:#fff">Jetzt umziehen</button><button data-later style="' + BTN + 'margin:0;padding:10px 14px;background:transparent;color:#fff4f7">Später</button>';
    document.body.appendChild(b);
    b.querySelector('[data-go]').onclick = function () { b.remove(); go(); };
    b.querySelector('[data-later]').onclick = function () { b.remove(); };
  }
})();
