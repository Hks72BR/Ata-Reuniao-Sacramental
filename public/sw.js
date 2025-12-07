/**
 * Service Worker - Ata Sacramental
 * Permite funcionalidade offline e cache de assets
 */

const CACHE_NAME = 'ata-sacramental-v1';
const RUNTIME_CACHE = 'ata-sacramental-runtime';

// Assets para fazer cache na instalação
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/images/hero-background.png',
  '/images/form-accent.png',
  '/images/icon-presiding.png',
  '/images/icon-speakers.png',
  '/images/icon-hymns.png',
];

// Instalar Service Worker e fazer cache dos assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tentar fazer cache dos assets, mas não falhar se alguns não existirem
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch(() => {
            console.log(`Não foi possível fazer cache de ${url}`);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Ativar Service Worker e limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de fetch: Network First, Fall back to Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de origem diferente
  if (url.origin !== self.location.origin) {
    return;
  }

  // Para requisições GET, usar Network First
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache bem-sucedidas
          if (response.status === 200) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tentar cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não houver cache, retornar página offline
            return caches.match('/index.html');
          });
        })
    );
  }
});

// Mensagem para atualizar cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
