/* FamilyQuest service worker — caches the app shell for offline/PWA use.
   Cross-origin requests (Supabase API, auth, realtime, fonts) are never cached
   and always go to the network.

   IMPORTANT: we only ever cache *valid* responses (2xx and NOT text/html).
   Caching an HTML error/SPA-fallback page for a /assets/*.js URL is what causes
   the "module script MIME type text/html" console errors, so we guard against it. */
const CACHE = 'familiaquest-v3';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// A response is safe to cache only if it succeeded and isn't an HTML page
// (HTML pages must never be stored under an asset/manifest URL).
function isCacheable(resp) {
  const type = resp.headers.get('content-type') || '';
  return resp.ok && !type.startsWith('text/html');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests.
  if (url.origin !== self.location.origin || req.method !== 'GET') return;

  // Navigations: network-first, fall back to the cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp.ok) {
            caches.open(CACHE).then((cache) => cache.put('/index.html', resp.clone())).catch(() => {});
          }
          return resp;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first, but never cache an HTML/error response.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (isCacheable(resp)) {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return resp;
      });
    })
  );
});
