/* Echo English service worker.
 *
 * Strategy:
 * - Navigation (app shell): network-first, cache fallback — new deploys are
 *   picked up immediately when online, cached shell keeps the app working offline.
 * - Hashed assets + generated docs: stale-while-revalidate — instant loads from
 *   cache with background refresh, so the 10-minute Pages cache header no
 *   longer matters after the first visit.
 *
 * Bump CACHE_NAME on every release so old caches are purged on activate.
 */
const CACHE_NAME = 'echo-english-v1';
const DOCS_PATTERN = /\/generated\/(manifest\.json|Day_\d{3}\.md)$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add('./').catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App shell: network-first with cached fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request)
          .then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Hashed assets and generated docs: stale-while-revalidate.
  const isCachedPath = /\/assets\//.test(url.pathname) || DOCS_PATTERN.test(url.pathname);
  if (!isCachedPath) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
