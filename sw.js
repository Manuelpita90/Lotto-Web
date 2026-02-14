const CACHE_NAME = 'lotto-ia-v8';
const DATA_CACHE_NAME = 'lotto-data-v1'; // Nuevo caché específico para datos
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  // './startup.mp3', // COMENTADO: Si este archivo no existe en GitHub, la instalación falla. Descomenta solo si lo subiste.
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Limpiar cachés antiguos al activar nueva versión
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // 1. ESTRATEGIA PARA API (Supabase): Network First (Red primero, si falla -> Caché)
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la respuesta es válida (status 200), guardamos una copia en caché
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // Si falla internet, devolvemos lo guardado
    );
    return;
  }

  // 2. ESTRATEGIA PARA ARCHIVOS ESTÁTICOS: Cache First (Caché primero, si no está -> Red)
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});