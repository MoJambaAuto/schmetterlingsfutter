/* Schmetterlingsfutter Service Worker – App-Shell offline verfügbar machen. */
const CACHE = 'schmetterlingsfutter-v3.0.0';
const ASSETS = [
  './', './index.html', './privacy.html', './manifest.webmanifest',
  './css/app.css', './js/data.js', './js/app.js', './js/features.js', './js/partner.js',
  './fonts/PlayfairDisplay-400.woff2', './fonts/PlayfairDisplay-400i.woff2',
  './fonts/Lato-300.woff2', './fonts/Lato-400.woff2', './fonts/Lato-700.woff2',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
