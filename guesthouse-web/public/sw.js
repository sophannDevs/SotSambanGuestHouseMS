// Guest House Manager Service Worker (Offline Shell Caching)
const CACHE_NAME = "guesthouse-v2";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/reservations",
  "/calendar",
  "/rooms",
  "/guests",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Real backend data (next.config.mjs proxies /api/v1/* to the Spring
  // backend, so from the browser these requests are same-origin and would
  // otherwise be caught by the cache-first strategy below) must always hit
  // the network — reservations, rooms, payments, front-desk state, etc. are
  // time-sensitive, and serving a stale cached response first would mean a
  // front-desk page silently shows an out-of-date guest/room/folio state.
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
