/* Schmetterlingsfutter Service Worker – App-Shell offline verfügbar machen. */
const CACHE = 'schmetterlingsfutter-v3.40.0';
const ASSETS = [
  './', './index.html', './privacy.html', './manifest.webmanifest',
  './css/app.css', './js/data.js', './js/data2.js', './js/vendor/qrcode.js', './js/app.js', './js/features.js', './js/antwort.js', './js/geschenk.js', './js/ordnung.js', './js/zurueck.js', './js/jagd.js', './js/raum.js', './js/empfehlung.js', './js/buehne.js', './js/neu.js', './img/falter.webp', './js/partner.js', './js/naehe.js', './js/extra.js', './js/frag.js', './js/anreiz.js', './js/kamera.js', './js/daten.js', './js/koppeln.js', './js/spiele.js', './js/spiele2.js', './js/stats.js',
  './fonts/PlayfairDisplay-400.woff2', './fonts/PlayfairDisplay-400i.woff2',
  './fonts/Lato-300.woff2', './fonts/Lato-400.woff2', './fonts/Lato-700.woff2',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
const META = 'sf-meta'; // kleiner Merkzettel der App für den Service Worker (Name des Schatzes), bleibt über Versionen erhalten
self.addEventListener('install', (e) => {
  // cache:'reload' = am Browser-Zwischenspeicher vorbei laden, damit eine neue Version nie alte Dateien einsammelt
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== META).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.includes('/hoerprobe/')) return; // Hörprobe immer frisch aus dem Netz
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

/* ---------- Mitteilungen aufs Handy ----------
   Der Vermittlungsdienst stupst nur an (Push ohne Inhalt). Ist die App gerade offen und vorn, meldet sie sich selbst. */
async function partnerName() {
  try { const c = await caches.open(META); const r = await c.match('./__meta'); if (r) { const j = await r.json(); return (j && j.partner) || ''; } } catch (e) {}
  return '';
}
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const front = wins.filter((w) => w.visibilityState === 'visible' && w.focused);
    if (front.length) { front.forEach((w) => w.postMessage({ t: 'push' })); return; }
    const name = await partnerName();
    await self.registration.showNotification('Schmetterlingsfutter', {
      body: 'Neues von ' + (name || 'deinem Schatz') + ' 💌', icon: './icons/icon-192.png', tag: 'sf-neu', renotify: true, data: { url: './?postfach=1' }
    });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) { if ('focus' in w) { try { await w.focus(); } catch (err) {} w.postMessage({ t: 'postfach' }); return; } }
    await self.clients.openWindow('./?postfach=1');
  })());
});
