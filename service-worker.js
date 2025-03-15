const CACHE_NAME = "calendario-v1";
const urlsToCache = [
  "/index.html",
  "/manifest.json",
  "/css/styles.css",
  "/js/calendar.js",
  "/js/sw-register.js",
  "/icon-192x192.png",
  "/icon-512x512.png"
];

// Instalación del Service Worker y cacheo de archivos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Archivos cacheados");
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones y servir desde caché si es posible
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
