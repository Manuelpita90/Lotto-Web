const CACHE_NAME = 'lotto-ia-v30';
const DATA_CACHE_NAME = 'lotto-data-v1'; // Nuevo caché específico para datos
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './style.css',
  './script.js',
  './sounds/win.mp3',
  './sounds/notify.mp3',
  './startup.mp3',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Forzar activación inmediata de la nueva versión
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
      ).then(() => self.clients.claim()) // Tomar control de la página inmediatamente
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
      .then(response => {
        if (response) return response; // Si está en caché, devolverlo

        // Si no está, ir a la red y guardarlo dinámicamente (Dynamic Caching)
        return fetch(event.request).then(networkResponse => {
          // Verificar si la respuesta es válida antes de guardar
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'error') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        });
      })
  );
});

// 3. NOTIFICACIONES PUSH Y LOCALES
self.addEventListener('push', event => {
  // Manejo de notificaciones enviadas desde un servidor (Backend)
  const data = event.data ? event.data.json() : { title: 'Lotto IA', body: 'Nueva actualización' };
  
  const options = {
    body: data.body,
    icon: './icon.png',
    badge: './icon.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './index.html' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Al hacer clic, abrir la ventana de la app o enfocarla si ya está abierta
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});