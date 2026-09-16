const CACHE_NAME = "inventory-portal-v3";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/dashboard.html",
  "/css/styles.css",
  "/js/portal.js",
  "/manifest.json",
  "/images/icon-192.png",
  "/images/icon-512.png",
  "/images/favicon.png",
  "/images/rohde-schwarz-logo.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.status === 200) cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await cache.match(request);
        return cached || new Response("Offline and this page has not been visited yet.", { status: 503 });
      }
    })
  );
});
