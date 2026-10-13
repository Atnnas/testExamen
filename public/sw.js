const CACHE_NAME = 'wkf-app-shell-v3';
const QUESTIONS_CACHE = 'wkf-offline-questions-v3';
const AUTH_CACHE = 'wkf-offline-auth-v2';

const STATIC_PRECACHE = [
  '/',
  '/favicon.ico',
  '/favicon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/app-icon.png'
];

// Instalación: precachear App Shell y tomar control inmediato
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activación: purgar cachés antiguos y reclamar clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== QUESTIONS_CACHE && key !== AUTH_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptor de solicitudes de red (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API Protegida del Banco de Preguntas: Network-First con Fallback a Caché Offline
  if (url.pathname === '/api/exams/questions' && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Si la respuesta fue exitosa (usuario aprobado), guardar copia para modo offline
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(QUESTIONS_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // En caso de estar sin internet (avión, dojo sin cobertura), servir preguntas cacheadas
          const questionsCache = await caches.open(QUESTIONS_CACHE);
          const cachedResponse = await questionsCache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Estás sin conexión y aún no habías sincronizado el banco de preguntas con internet.'
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
          );
        })
    );
    return;
  }

  // 2. Sesión Activa de NextAuth: Network-First con Fallback a Sesión Offline Guardada
  if (url.pathname === '/api/auth/session' && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            try {
              const copy = networkResponse.clone();
              const sessionData = await copy.json();
              const authCache = await caches.open(AUTH_CACHE);
              // Si la sesión contiene un usuario válido activo, guardarla offline
              if (sessionData && sessionData.user) {
                await authCache.put(request, networkResponse.clone());
              } else {
                // Si la sesión está vacía (usuario no autenticado), limpiar caché
                await authCache.delete(request);
              }
            } catch (err) {
              console.warn('Error al procesar caché de sesión:', err);
            }
          }
          return networkResponse;
        })
        .catch(async () => {
          // Si no hay red (offline), servir la última sesión guardada autorizada
          const authCache = await caches.open(AUTH_CACHE);
          const cachedSession = await authCache.match(request);
          if (cachedSession) {
            return cachedSession;
          }
          // Si nunca hubo sesión previa, responder con objeto vacío para que NextAuth no rompa
          return new Response(JSON.stringify({}), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          });
        })
    );
    return;
  }

  // 3. Cierre de sesión (Signout): Eliminar caché de autenticación offline inmediatamente
  if (url.pathname.startsWith('/api/auth/signout')) {
    event.waitUntil(
      caches.delete(AUTH_CACHE)
    );
    return;
  }

  // 4. Otras rutas de autenticación y panel admin: NUNCA cachear por seguridad
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/admin')
  ) {
    return;
  }

  // 5. Documentos HTML y recursos estáticos: Network-First con Fallback a Caché
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si navega a otra página y no hay red, servir la shell principal
          if (request.mode === 'navigate') {
            const rootCache = await caches.match('/');
            if (rootCache) return rootCache;
          }
          return Promise.reject('offline');
        })
    );
  }
});
