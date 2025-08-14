// Service Worker для Self-Employed Platform
const CACHE_NAME = 'self-employed-v1.0.0';
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
  '/favicon.ico',
  '/assets/logo.png'
];

// API endpoints для кэширования
const API_ENDPOINTS = [
  '/api/auth/profile',
  '/api/dashboard/metrics',
  '/api/tasks/recent'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Кэшируем статические файлы
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Кэшируем API endpoints
      caches.open(API_CACHE).then(cache => {
        console.log('Service Worker: Caching API endpoints');
        return cache.addAll(API_ENDPOINTS);
      })
    ]).then(() => {
      console.log('Service Worker: Installed successfully');
      return self.skipWaiting();
    })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Стратегии кэширования для разных типов запросов
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API запросы - Network First с fallback на кэш
      event.respondWith(handleApiRequest(request));
    } else if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/assets/')) {
      // Статические файлы - Cache First
      event.respondWith(handleStaticRequest(request));
    } else {
      // HTML страницы - Network First с fallback на кэш
      event.respondWith(handlePageRequest(request));
    }
  }
});

// Обработка API запросов (Network First)
async function handleApiRequest(request) {
  try {
    // Сначала пытаемся получить данные из сети
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Клонируем ответ для кэширования
      const responseClone = networkResponse.clone();
      
      // Кэшируем успешный ответ
      caches.open(API_CACHE).then(cache => {
        cache.put(request, responseClone);
      });
      
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', error);
  }
  
  // Fallback на кэш
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Если нет в кэше, возвращаем offline страницу
  return new Response(
    JSON.stringify({ 
      error: 'Offline mode', 
      message: 'Данные недоступны в офлайн режиме' 
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Обработка статических файлов (Cache First)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      caches.open(STATIC_CACHE).then(cache => {
        cache.put(request, responseClone);
      });
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch static file:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Обработка HTML страниц (Network First)
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      caches.open(DYNAMIC_CACHE).then(cache => {
        cache.put(request, responseClone);
      });
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network failed for page:', error);
  }
  
  // Fallback на кэш
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Если нет в кэше, возвращаем offline страницу
  return caches.match('/offline.html');
}

// Push уведомления
self.addEventListener('push', event => {
  console.log('Service Worker: Push event received');
  
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление',
    icon: '/assets/logo.png',
    badge: '/assets/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть',
        icon: '/assets/checkmark.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/assets/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Self-Employed Platform', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Синхронизация в фоне
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Фоновая синхронизация
async function doBackgroundSync() {
  try {
    // Синхронизируем данные с сервером
    const pendingData = await getPendingData();
    
    for (const data of pendingData) {
      await syncData(data);
    }
    
    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Получение отложенных данных
async function getPendingData() {
  const db = await openDB();
  return await db.getAll('pendingData');
}

// Синхронизация данных
async function syncData(data) {
  try {
    const response = await fetch(data.url, {
      method: data.method,
      headers: data.headers,
      body: data.body
    });
    
    if (response.ok) {
      // Удаляем из отложенных данных
      const db = await openDB();
      await db.delete('pendingData', data.id);
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync data:', error);
  }
}

// Открытие IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SelfEmployedDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Создаем хранилище для отложенных данных
      if (!db.objectStoreNames.contains('pendingData')) {
        const store = db.createObjectStore('pendingData', { keyPath: 'id', autoIncrement: true });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Обработка сообщений от основного потока
self.addEventListener('message', event => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(cacheUrls(event.data.urls));
  }
});

// Кэширование URL'ов
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(urls);
  console.log('Service Worker: URLs cached:', urls);
}

// Периодическая очистка старых кэшей
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCaches());
  }
});

// Очистка старых кэшей
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
  
  for (const cacheName of cacheNames) {
    if (cacheName !== STATIC_CACHE) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const date = response.headers.get('date');
          if (date && (now - new Date(date).getTime()) > maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
  }
  
  console.log('Service Worker: Cache cleanup completed');
} 