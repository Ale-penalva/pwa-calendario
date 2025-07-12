const CACHE_NAME = "calendar-static-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/calendar.js",
  "/manifest.json",
  "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js"
];

// ✅ Instalación: cachear los recursos esenciales
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // activa el SW sin esperar
});

// ✅ Fetch: responder con caché primero
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// 🧹 Limpieza de versiones antiguas (opcional pero recomendable)
self.addEventListener("activate", event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (!cacheWhitelist.includes(name)) {
            return caches.delete(name);
          }
        })
      )
    )
  );
});
