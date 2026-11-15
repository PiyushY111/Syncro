const CACHE_NAME = 'syncro-cache-v2';
// Only paths that exist in the production build; a missing one makes cache.addAll reject and the install fail.
const STATIC_ASSETS = ['/', '/index.html'];

// respondWith() must always resolve to a Response; caches.match() resolves undefined on a miss.
const offlineFallback = () => Response.error();

// Install Event: cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: intercept requests for network-first API caching and asset loading
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Caching API GET requests for offline fallback
  if (url.pathname.startsWith('/api/')) {
    if (request.method !== 'GET') {
      return;
    }
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || offlineFallback()))
    );
    return;
  }

  // Caching static assets: network-first, fallback to cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (request.mode === 'navigate') {
            return caches.match('/').then((shell) => shell || offlineFallback());
          }
          return offlineFallback();
        });
      })
  );
});
