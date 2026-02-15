/**
 * Service Worker - Ata Sacramental
 * Funcionalidade 100% offline com Cache First
 * Com atualização automática forçada
 */

// Versão baseada em timestamp - atualiza automaticamente a cada build
const BUILD_TIMESTAMP = '2026-02-15T22:49:49.555Z'; // Será substituído no build
const CACHE_VERSION = `v${new Date(BUILD_TIMESTAMP).getTime()}`;
const CACHE_NAME = `ata-sacramental-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ata-sacramental-runtime-${CACHE_VERSION}`;

// URLs essenciais para funcionar offline (serão pré-carregados)
const CRITICAL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/church_logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];


// Instalar Service Worker e fazer cache AGRESSIVO
self.addEventListener('install', (event) => {
  console.log(`[SW] Instalando Service Worker versão ${CACHE_VERSION}...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Fazendo cache dos arquivos críticos...');
      
      // Tentar fazer cache dos arquivos críticos
      const cachePromises = CRITICAL_URLS.map(url => 
        cache.add(url).catch(err => {
          console.warn(`[SW] Não foi possível cachear ${url}:`, err);
          return null;
        })
      );
      
      await Promise.allSettled(cachePromises);
      console.log('[SW] Cache inicial completo!');
      
      // Força ativação imediata (pula a espera)
      return self.skipWaiting();
    })
  );
});

// Ativar Service Worker IMEDIATAMENTE
self.addEventListener('activate', (event) => {
  console.log(`[SW] Ativando Service Worker versão ${CACHE_VERSION}...`);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Deletar caches antigos
      const deletePromises = cacheNames
        .filter(name => name.startsWith('ata-sacramental-') && name !== CACHE_NAME && name !== RUNTIME_CACHE)
        .map(name => {
          console.log(`[SW] Removendo cache antigo: ${name}`);
          return caches.delete(name);
        });
      
      return Promise.all(deletePromises);
    }).then(() => {
      console.log('[SW] Service Worker ativado!');
      // Assumir controle imediato de todas as páginas
      return self.clients.claim();
    }).then(() => {
      // Notificar todas as janelas abertas que há uma nova versão
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});


// Estratégia CACHE FIRST - Offline First!
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar Firebase e APIs externas (precisam de conexão), mas PERMITIR fontes
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebase.com')
  ) {
    // Para Firebase: tentar rede, sem cache
    event.respondWith(fetch(request));
    return;
  }

  // Para Google Fonts: cachear agressivamente (são estáticos)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Fontes não são críticas, app funciona sem elas
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // Para todos os outros recursos: CACHE FIRST (offline-first)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(`[SW] Servindo do cache: ${url.pathname}`);
        
        // Retornar do cache imediatamente
        // E atualizar cache em background (stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // Ignorar erros de rede silenciosamente
          });
        
        return cachedResponse;
      }

      // Se não está no cache, tentar buscar na rede
      console.log(`[SW] Buscando da rede: ${url.pathname}`);
      return fetch(request)
        .then((networkResponse) => {
          // Cachear apenas respostas válidas
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return networkResponse;
        })
        .catch((error) => {
          console.log(`[SW] Falha ao buscar ${url.pathname}:`, error);
          
          // Se for HTML, retornar a página principal do cache
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          
          // Para outros recursos, retornar erro
          return new Response('Offline - recurso não disponível', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
    })
  );
});

// Mensagem para atualizar cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
