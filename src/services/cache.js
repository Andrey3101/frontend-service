/**
 * Сервис кэширования для оптимизации производительности
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.localStorageCache = new Map();
    this.sessionStorageCache = new Map();
    this.cacheConfig = {
      memory: {
        maxSize: 100,
        ttl: 5 * 60 * 1000, // 5 минут
        cleanupInterval: 60 * 1000 // 1 минута
      },
      localStorage: {
        maxSize: 50,
        ttl: 24 * 60 * 60 * 1000, // 24 часа
        cleanupInterval: 5 * 60 * 1000 // 5 минут
      },
      sessionStorage: {
        maxSize: 30,
        ttl: 60 * 60 * 1000, // 1 час
        cleanupInterval: 10 * 60 * 1000 // 10 минут
      }
    };
    
    this.startCleanup();
  }

  /**
   * Получить значение из кэша
   */
  get(key, type = 'memory') {
    try {
      let cache;
      let config;
      
      switch (type) {
        case 'memory':
          cache = this.memoryCache;
          config = this.cacheConfig.memory;
          break;
        case 'localStorage':
          cache = this.localStorageCache;
          config = this.cacheConfig.localStorage;
          break;
        case 'sessionStorage':
          cache = this.sessionStorageCache;
          config = this.cacheConfig.sessionStorage;
          break;
        default:
          return null;
      }

      const cachedItem = cache.get(key);
      if (!cachedItem) return null;

      // Проверяем TTL
      if (Date.now() > cachedItem.expiresAt) {
        cache.delete(key);
        return null;
      }

      // Обновляем время последнего доступа
      cachedItem.lastAccessed = Date.now();
      return cachedItem.value;
    } catch (error) {
      console.error('Ошибка при получении из кэша:', error);
      return null;
    }
  }

  /**
   * Установить значение в кэш
   */
  set(key, value, type = 'memory', ttl = null) {
    try {
      let cache;
      let config;
      
      switch (type) {
        case 'memory':
          cache = this.memoryCache;
          config = this.cacheConfig.memory;
          break;
        case 'localStorage':
          cache = this.localStorageCache;
          config = this.cacheConfig.localStorage;
          break;
        case 'sessionStorage':
          cache = this.sessionStorageCache;
          config = this.cacheConfig.sessionStorage;
          break;
        default:
          return false;
      }

      // Проверяем размер кэша
      if (cache.size >= config.maxSize) {
        this.evictOldest(cache, type);
      }

      const expiresAt = Date.now() + (ttl || config.ttl);
      const cacheItem = {
        value,
        expiresAt,
        lastAccessed: Date.now(),
        size: this.calculateSize(value)
      };

      cache.set(key, cacheItem);
      
      // Сохраняем в localStorage/sessionStorage если нужно
      if (type !== 'memory') {
        this.persistToStorage(key, cacheItem, type);
      }

      return true;
    } catch (error) {
      console.error('Ошибка при установке в кэш:', error);
      return false;
    }
  }

  /**
   * Удалить значение из кэша
   */
  delete(key, type = 'memory') {
    try {
      let cache;
      
      switch (type) {
        case 'memory':
          cache = this.memoryCache;
          break;
        case 'localStorage':
          cache = this.localStorageCache;
          break;
        case 'sessionStorage':
          cache = this.sessionStorageCache;
          break;
        default:
          return false;
      }

      const deleted = cache.delete(key);
      
      // Удаляем из localStorage/sessionStorage если нужно
      if (type !== 'memory') {
        this.removeFromStorage(key, type);
      }

      return deleted;
    } catch (error) {
      console.error('Ошибка при удалении из кэша:', error);
      return false;
    }
  }

  /**
   * Очистить весь кэш
   */
  clear(type = 'memory') {
    try {
      switch (type) {
        case 'memory':
          this.memoryCache.clear();
          break;
        case 'localStorage':
          this.localStorageCache.clear();
          this.clearStorage('localStorage');
          break;
        case 'sessionStorage':
          this.sessionStorageCache.clear();
          this.clearStorage('sessionStorage');
          break;
        case 'all':
          this.memoryCache.clear();
          this.localStorageCache.clear();
          this.sessionStorageCache.clear();
          this.clearStorage('localStorage');
          this.clearStorage('sessionStorage');
          break;
      }
      return true;
    } catch (error) {
      console.error('Ошибка при очистке кэша:', error);
      return false;
    }
  }

  /**
   * Проверить существование ключа в кэше
   */
  has(key, type = 'memory') {
    try {
      let cache;
      
      switch (type) {
        case 'memory':
          cache = this.memoryCache;
          break;
        case 'localStorage':
          cache = this.localStorageCache;
          break;
        case 'sessionStorage':
          cache = this.sessionStorageCache;
          break;
        default:
          return false;
      }

      const cachedItem = cache.get(key);
      if (!cachedItem) return false;

      // Проверяем TTL
      if (Date.now() > cachedItem.expiresAt) {
        cache.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка при проверке кэша:', error);
      return false;
    }
  }

  /**
   * Получить размер кэша
   */
  size(type = 'memory') {
    try {
      switch (type) {
        case 'memory':
          return this.memoryCache.size;
        case 'localStorage':
          return this.localStorageCache.size;
        case 'sessionStorage':
          return this.sessionStorageCache.size;
        case 'all':
          return {
            memory: this.memoryCache.size,
            localStorage: this.localStorageCache.size,
            sessionStorage: this.sessionStorageCache.size
          };
        default:
          return 0;
      }
    } catch (error) {
      console.error('Ошибка при получении размера кэша:', error);
      return 0;
    }
  }

  /**
   * Получить статистику кэша
   */
  getStats() {
    try {
      const memoryStats = this.getCacheStats(this.memoryCache);
      const localStorageStats = this.getCacheStats(this.localStorageCache);
      const sessionStorageStats = this.getCacheStats(this.sessionStorageCache);

      return {
        memory: memoryStats,
        localStorage: localStorageStats,
        sessionStorage: sessionStorageStats,
        total: {
          items: memoryStats.items + localStorageStats.items + sessionStorageStats.items,
          size: memoryStats.size + localStorageStats.size + sessionStorageStats.size,
          hitRate: (memoryStats.hits + localStorageStats.hits + sessionStorageStats.hits) / 
                   (memoryStats.hits + localStorageStats.hits + sessionStorageStats.hits + 
                    memoryStats.misses + localStorageStats.misses + sessionStorageStats.misses)
        }
      };
    } catch (error) {
      console.error('Ошибка при получении статистики кэша:', error);
      return null;
    }
  }

  /**
   * Кэширование с автоматическим обновлением
   */
  async cacheWithRefresh(key, fetchFunction, options = {}) {
    const {
      type = 'memory',
      ttl = null,
      refreshThreshold = 0.8, // Обновлять когда осталось 80% TTL
      forceRefresh = false
    } = options;

    try {
      // Проверяем кэш
      if (!forceRefresh) {
        const cachedValue = this.get(key, type);
        if (cachedValue) {
          // Проверяем, нужно ли обновить
          const cacheItem = this.getCacheItem(key, type);
          if (cacheItem) {
            const timeLeft = cacheItem.expiresAt - Date.now();
            const totalTtl = ttl || this.cacheConfig[type].ttl;
            
            if (timeLeft > totalTtl * refreshThreshold) {
              return cachedValue;
            }
          }
        }
      }

      // Получаем новые данные
      const newValue = await fetchFunction();
      
      // Кэшируем
      this.set(key, newValue, type, ttl);
      
      return newValue;
    } catch (error) {
      console.error('Ошибка при кэшировании с обновлением:', error);
      
      // Возвращаем кэшированное значение если есть
      const cachedValue = this.get(key, type);
      if (cachedValue) {
        return cachedValue;
      }
      
      throw error;
    }
  }

  /**
   * Кэширование API запросов
   */
  async cacheApiRequest(url, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      type = 'memory',
      ttl = 5 * 60 * 1000, // 5 минут по умолчанию
      forceRefresh = false
    } = options;

    const cacheKey = this.generateApiCacheKey(url, method, body, headers);
    
    if (method === 'GET' && !forceRefresh) {
      const cachedResponse = this.get(cacheKey, type);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    try {
      const response = await fetch(url, {
        method,
        body: body ? JSON.stringify(body) : null,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Кэшируем только успешные GET запросы
      if (method === 'GET') {
        this.set(cacheKey, data, type, ttl);
      }

      return data;
    } catch (error) {
      console.error('Ошибка API запроса:', error);
      throw error;
    }
  }

  /**
   * Инвалидация кэша по паттерну
   */
  invalidateByPattern(pattern, type = 'memory') {
    try {
      let cache;
      
      switch (type) {
        case 'memory':
          cache = this.memoryCache;
          break;
        case 'localStorage':
          cache = this.localStorageCache;
          break;
        case 'sessionStorage':
          cache = this.sessionStorageCache;
          break;
        case 'all':
          this.invalidateByPattern(pattern, 'memory');
          this.invalidateByPattern(pattern, 'localStorage');
          this.invalidateByPattern(pattern, 'sessionStorage');
          return;
        default:
          return false;
      }

      const regex = new RegExp(pattern);
      let deletedCount = 0;

      for (const key of cache.keys()) {
        if (regex.test(key)) {
          cache.delete(key);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Ошибка при инвалидации кэша по паттерну:', error);
      return 0;
    }
  }

  // Приватные методы

  /**
   * Вычисление размера объекта
   */
  calculateSize(obj) {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Удаление старых элементов кэша
   */
  evictOldest(cache, type) {
    try {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Удаляем 20% самых старых элементов
      const deleteCount = Math.ceil(entries.length * 0.2);
      for (let i = 0; i < deleteCount; i++) {
        cache.delete(entries[i][0]);
      }
    } catch (error) {
      console.error('Ошибка при удалении старых элементов кэша:', error);
    }
  }

  /**
   * Получение элемента кэша
   */
  getCacheItem(key, type) {
    try {
      let cache;
      
      switch (type) {
        case 'memory':
          cache = this.memoryCache;
          break;
        case 'localStorage':
          cache = this.localStorageCache;
          break;
        case 'sessionStorage':
          cache = this.sessionStorageCache;
          break;
        default:
          return null;
      }

      return cache.get(key);
    } catch (error) {
      return null;
    }
  }

  /**
   * Получение статистики кэша
   */
  getCacheStats(cache) {
    try {
      let totalSize = 0;
      let hits = 0;
      let misses = 0;

      for (const item of cache.values()) {
        totalSize += item.size || 0;
        // Здесь можно добавить логику подсчета hits/misses
      }

      return {
        items: cache.size,
        size: totalSize,
        hits,
        misses,
        hitRate: hits / (hits + misses) || 0
      };
    } catch (error) {
      return { items: 0, size: 0, hits: 0, misses: 0, hitRate: 0 };
    }
  }

  /**
   * Генерация ключа кэша для API запроса
   */
  generateApiCacheKey(url, method, body, headers) {
    const key = `${method}:${url}:${JSON.stringify(body)}:${JSON.stringify(headers)}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Сохранение в localStorage/sessionStorage
   */
  persistToStorage(key, cacheItem, type) {
    try {
      if (type === 'localStorage' && window.localStorage) {
        window.localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      } else if (type === 'sessionStorage' && window.sessionStorage) {
        window.sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      }
    } catch (error) {
      console.error('Ошибка при сохранении в storage:', error);
    }
  }

  /**
   * Удаление из localStorage/sessionStorage
   */
  removeFromStorage(key, type) {
    try {
      if (type === 'localStorage' && window.localStorage) {
        window.localStorage.removeItem(`cache_${key}`);
      } else if (type === 'sessionStorage' && window.sessionStorage) {
        window.sessionStorage.removeItem(`cache_${key}`);
      }
    } catch (error) {
      console.error('Ошибка при удалении из storage:', error);
    }
  }

  /**
   * Очистка storage
   */
  clearStorage(type) {
    try {
      if (type === 'localStorage' && window.localStorage) {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('cache_')) {
            window.localStorage.removeItem(key);
          }
        }
      } else if (type === 'sessionStorage' && window.sessionStorage) {
        for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
          const key = window.sessionStorage.key(i);
          if (key && key.startsWith('cache_')) {
            window.sessionStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при очистке storage:', error);
    }
  }

  /**
   * Запуск периодической очистки
   */
  startCleanup() {
    // Очистка memory кэша
    setInterval(() => {
      this.cleanupExpired('memory');
    }, this.cacheConfig.memory.cleanupInterval);

    // Очистка localStorage кэша
    setInterval(() => {
      this.cleanupExpired('localStorage');
    }, this.cacheConfig.localStorage.cleanupInterval);

    // Очистка sessionStorage кэша
    setInterval(() => {
      this.cleanupExpired('sessionStorage');
    }, this.cacheConfig.sessionStorage.cleanupInterval);
  }

  /**
   * Очистка истекших элементов
   */
  cleanupExpired(type) {
    try {
      let cache;
      
      switch (type) {
        case 'memory':
          cache = this.memoryCache;
          break;
        case 'localStorage':
          cache = this.localStorageCache;
          break;
        case 'sessionStorage':
          cache = this.sessionStorageCache;
          break;
        default:
          return;
      }

      const now = Date.now();
      for (const [key, item] of cache.entries()) {
        if (now > item.expiresAt) {
          cache.delete(key);
          if (type !== 'memory') {
            this.removeFromStorage(key, type);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при очистке истекших элементов:', error);
    }
  }
}

// Создаем глобальный экземпляр
const cacheService = new CacheService();

export default cacheService; 