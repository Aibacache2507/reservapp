const CACHE_NAME = "reservapp-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icon.svg",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network-First con fallback a caché para offline
self.addEventListener("fetch", (event) => {
  // Ignorar peticiones que no sean GET o que sean hacia la API/Supabase
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("supabase.co")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar copia fresca en caché si es exitosa
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback a caché si no hay conexión
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Sin conexión a internet", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});
