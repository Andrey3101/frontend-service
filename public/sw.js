/**
 * Service Worker для PWA функциональности
 */

const CACHE_NAME = 'self-employed-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Файлы для предварительного кэширования
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// Стратегии кэширования
const CACHE_STRATEGIES = {
  // Кэш-первый для статических файлов
  CACHE_FIRST: 'cache-first',
  // Сеть-первая для API запросов
  NETWORK_FIRST: 'network-first',
  // Stale-while-revalidate для динамического контента
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Old caches cleaned');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Service Worker: Error cleaning old caches:', error);
      })
  );
});

// Перехват fetch запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Определяем стратегию кэширования
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('Service Worker: Error handling request:', error);
        return handleOfflineFallback(request);
      })
  );
});

// Определение стратегии кэширования
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Статические файлы
  if (isStaticFile(request)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // API запросы
  if (isAPIRequest(request)) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Динамический контент
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

// Проверка статических файлов
function isStaticFile(request) {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    (url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.jpg') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.woff') ||
     url.pathname.endsWith('.woff2'))
  );
}

// Проверка API запросов
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/reports') || url.pathname.startsWith('/acts');
}

// Обработка запросов по стратегии
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return handleCacheFirst(request);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return handleNetworkFirst(request);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return handleStaleWhileRevalidate(request);
    default:
      return fetch(request);
  }
}

// Стратегия: кэш-первый
async function handleCacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Стратегия: сеть-первая
async function handleNetworkFirst(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Стратегия: stale-while-revalidate
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Возвращаем кэшированный ответ немедленно
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return fetchPromise;
}

// Обработка офлайн fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Для навигационных запросов возвращаем офлайн страницу
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Создаем простую офлайн страницу
    const offlineHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Офлайн - Self Employed</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
            .offline-title { font-size: 24px; margin-bottom: 10px; }
            .offline-message { color: #666; margin-bottom: 20px; }
            .retry-button { padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="offline-icon">📱</div>
          <div class="offline-title">Нет подключения к интернету</div>
          <div class="offline-message">Проверьте подключение и попробуйте снова</div>
          <button class="retry-button" onclick="window.location.reload()">Повторить</button>
        </body>
      </html>
    `;
    
    return new Response(offlineHTML, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Для других запросов возвращаем пустой ответ
  return new Response('Offline', { status: 503 });
}

// Обработка push уведомлений
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Новое уведомление',
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Self Employed', options)
    );
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action) {
    // Обработка действий уведомления
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Открытие приложения при клике на уведомление
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Обработка действий уведомлений
function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      clients.openWindow(data.url || '/');
      break;
    case 'dismiss':
      // Просто закрываем уведомление
      break;
    default:
      console.log('Unknown notification action:', action);
  }
}

// Обработка background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      performBackgroundSync()
    );
  }
});

// Выполнение фоновой синхронизации
async function performBackgroundSync() {
  try {
    // Синхронизация данных
    await syncOfflineData();
    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Синхронизация офлайн данных
async function syncOfflineData() {
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        // Обновляем кэш
        cache.put(request, response.clone());
      }
    } catch (error) {
      console.error('Service Worker: Error syncing request:', error);
    }
  }
}

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_CACHE_INFO':
      getCacheInfo().then((info) => {
        event.ports[0].postMessage(info);
      });
      break;
    case 'CLEAR_CACHE':
      clearCache(data.cacheName).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    case 'UPDATE_CACHE':
      updateCache(data.files).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    default:
      console.log('Service Worker: Unknown message type:', type);
  }
});

// Получение информации о кэше
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const cacheInfo = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    cacheInfo[cacheName] = {
      size: keys.length,
      keys: keys.map(key => key.url)
    };
  }
  
  return cacheInfo;
}

// Очистка кэша
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

// Обновление кэша
async function updateCache(files) {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(files);
}

// Периодическая очистка старых кэшей
setInterval(async () => {
  try {
    const cacheNames = await caches.keys();
    const now = Date.now();
    
    for (const cacheName of cacheNames) {
      if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const date = response.headers.get('date');
            if (date && (now - new Date(date).getTime()) > 7 * 24 * 60 * 60 * 1000) {
              // Удаляем файлы старше 7 дней
              await cache.delete(request);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: Error cleaning old caches:', error);
  }
}, 24 * 60 * 60 * 1000); // Каждые 24 часа

console.log('Service Worker: Loaded successfully'); 