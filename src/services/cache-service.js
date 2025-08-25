/**
 * Сервис кэширования для оптимизации работы с task-service
 * Обеспечивает локальное хранение данных и управление их жизненным циклом
 */

import { getCacheConfig } from '../config/task-service';

class CacheService {
  constructor() {
    this.config = getCacheConfig();
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    // Очищаем устаревшие записи каждые 5 минут
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Получает значение из кэша
   */
  get(key, namespace = 'default') {
    const fullKey = this.buildKey(key, namespace);
    const item = this.cache.get(fullKey);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Проверяем срок действия
    if (this.isExpired(item)) {
      this.delete(key, namespace);
      this.stats.misses++;
      return null;
    }
    
    // Обновляем время последнего доступа
    item.lastAccessed = Date.now();
    
    this.stats.hits++;
    return item.value;
  }

  /**
   * Сохраняет значение в кэш
   */
  set(key, value, namespace = 'default', options = {}) {
    const fullKey = this.buildKey(key, namespace);
    const config = this.getNamespaceConfig(namespace);
    
    // Проверяем лимит размера кэша
    if (this.cache.size >= config.maxSize) {
      this.evictOldest(namespace);
    }
    
    const item = {
      value,
      namespace,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      ttl: options.ttl || config.ttl,
      compressed: options.compressed || config.enableCompression
    };
    
    // Сжимаем данные если включено
    if (item.compressed) {
      item.value = this.compress(item.value);
    }
    
    this.cache.set(fullKey, item);
    this.stats.sets++;
    
    // Устанавливаем таймер для автоматического удаления
    this.setExpirationTimer(fullKey, item.ttl);
    
    return true;
  }

  /**
   * Удаляет значение из кэша
   */
  delete(key, namespace = 'default') {
    const fullKey = this.buildKey(key, namespace);
    const item = this.cache.get(fullKey);
    
    if (item) {
      // Очищаем таймер
      this.clearExpirationTimer(fullKey);
      
      // Удаляем из кэша
      this.cache.delete(fullKey);
      this.stats.deletes++;
      
      return true;
    }
    
    return false;
  }

  /**
   * Проверяет существование ключа в кэше
   */
  has(key, namespace = 'default') {
    const fullKey = this.buildKey(key, namespace);
    const item = this.cache.get(fullKey);
    
    if (!item) {
      return false;
    }
    
    if (this.isExpired(item)) {
      this.delete(key, namespace);
      return false;
    }
    
    return true;
  }

  /**
   * Получает несколько значений по ключам
   */
  getMultiple(keys, namespace = 'default') {
    const result = {};
    const missingKeys = [];
    
    keys.forEach(key => {
      const value = this.get(key, namespace);
      if (value !== null) {
        result[key] = value;
      } else {
        missingKeys.push(key);
      }
    });
    
    return {
      found: result,
      missing: missingKeys
    };
  }

  /**
   * Сохраняет несколько значений
   */
  setMultiple(items, namespace = 'default', options = {}) {
    const results = {};
    
    Object.entries(items).forEach(([key, value]) => {
      results[key] = this.set(key, value, namespace, options);
    });
    
    return results;
  }

  /**
   * Удаляет несколько значений
   */
  deleteMultiple(keys, namespace = 'default') {
    const results = {};
    
    keys.forEach(key => {
      results[key] = this.delete(key, namespace);
    });
    
    return results;
  }

  /**
   * Очищает весь кэш или кэш определенного namespace
   */
  clear(namespace = null) {
    if (namespace === null) {
      // Очищаем весь кэш
      this.cache.clear();
      this.timers.forEach(timer => clearTimeout(timer));
      this.timers.clear();
    } else {
      // Очищаем только указанный namespace
      const keysToDelete = [];
      
      this.cache.forEach((item, key) => {
        if (item.namespace === namespace) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.clearExpirationTimer(key);
      });
    }
  }

  /**
   * Получает все ключи в namespace
   */
  getKeys(namespace = 'default') {
    const keys = [];
    
    this.cache.forEach((item, key) => {
      if (item.namespace === namespace && !this.isExpired(item)) {
        keys.push(key.replace(`${namespace}:`, ''));
      }
    });
    
    return keys;
  }

  /**
   * Получает размер кэша
   */
  getSize(namespace = null) {
    if (namespace === null) {
      return this.cache.size;
    }
    
    let size = 0;
    this.cache.forEach(item => {
      if (item.namespace === namespace && !this.isExpired(item)) {
        size++;
      }
    });
    
    return size;
  }

  /**
   * Получает статистику кэша
   */
  getStats() {
    const totalItems = this.cache.size;
    const expiredItems = this.getExpiredCount();
    const activeItems = totalItems - expiredItems;
    
    return {
      ...this.stats,
      totalItems,
      expiredItems,
      activeItems,
      hitRate: totalItems > 0 ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 : 0,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Получает информацию о namespace
   */
  getNamespaceInfo(namespace = 'default') {
    const keys = this.getKeys(namespace);
    const size = this.getSize(namespace);
    const config = this.getNamespaceConfig(namespace);
    
    return {
      namespace,
      size,
      keys,
      config,
      oldestItem: this.getOldestItem(namespace),
      newestItem: this.getNewestItem(namespace)
    };
  }

  /**
   * Обновляет TTL для ключа
   */
  touch(key, namespace = 'default', newTtl = null) {
    const fullKey = this.buildKey(key, namespace);
    const item = this.cache.get(fullKey);
    
    if (!item) {
      return false;
    }
    
    if (newTtl !== null) {
      item.ttl = newTtl;
    }
    
    item.lastAccessed = Date.now();
    
    // Обновляем таймер
    this.setExpirationTimer(fullKey, item.ttl);
    
    return true;
  }

  /**
   * Получает значение с обновлением TTL
   */
  getAndTouch(key, namespace = 'default', newTtl = null) {
    const value = this.get(key, namespace);
    
    if (value !== null) {
      this.touch(key, namespace, newTtl);
    }
    
    return value;
  }

  /**
   * Инкрементирует числовое значение
   */
  increment(key, namespace = 'default', amount = 1) {
    const value = this.get(key, namespace);
    
    if (typeof value === 'number') {
      const newValue = value + amount;
      this.set(key, newValue, namespace);
      return newValue;
    }
    
    return null;
  }

  /**
   * Декрементирует числовое значение
   */
  decrement(key, namespace = 'default', amount = 1) {
    return this.increment(key, namespace, -amount);
  }

  /**
   * Добавляет значение в список
   */
  push(key, value, namespace = 'default') {
    const list = this.get(key, namespace) || [];
    
    if (Array.isArray(list)) {
      list.push(value);
      this.set(key, list, namespace);
      return list.length;
    }
    
    return null;
  }

  /**
   * Удаляет значение из списка
   */
  pop(key, namespace = 'default') {
    const list = this.get(key, namespace);
    
    if (Array.isArray(list) && list.length > 0) {
      const value = list.pop();
      this.set(key, list, namespace);
      return value;
    }
    
    return null;
  }

  /**
   * Вспомогательные методы
   */

  /**
   * Строит полный ключ для кэша
   */
  buildKey(key, namespace) {
    return `${namespace}:${key}`;
  }

  /**
   * Получает конфигурацию для namespace
   */
  getNamespaceConfig(namespace) {
    return this.config[namespace] || this.config.tasks;
  }

  /**
   * Проверяет, истек ли срок действия элемента
   */
  isExpired(item) {
    if (!item.ttl) {
      return false;
    }
    
    return Date.now() - item.createdAt > item.ttl;
  }

  /**
   * Устанавливает таймер для автоматического удаления
   */
  setExpirationTimer(key, ttl) {
    // Очищаем существующий таймер
    this.clearExpirationTimer(key);
    
    // Устанавливаем новый таймер
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
      this.stats.evictions++;
    }, ttl);
    
    this.timers.set(key, timer);
  }

  /**
   * Очищает таймер истечения
   */
  clearExpirationTimer(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Удаляет самые старые элементы для освобождения места
   */
  evictOldest(namespace) {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    this.cache.forEach((item, key) => {
      if (item.namespace === namespace && item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.delete(oldestKey.replace(`${namespace}:`, ''), namespace);
    }
  }

  /**
   * Очищает устаревшие элементы
   */
  cleanup() {
    const keysToDelete = [];
    
    this.cache.forEach((item, key) => {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.clearExpirationTimer(key);
      this.stats.evictions++;
    });
    
    if (keysToDelete.length > 0) {
      console.log(`Cache: очищено ${keysToDelete.length} устаревших элементов`);
    }
  }

  /**
   * Получает количество устаревших элементов
   */
  getExpiredCount() {
    let count = 0;
    
    this.cache.forEach(item => {
      if (this.isExpired(item)) {
        count++;
      }
    });
    
    return count;
  }

  /**
   * Получает самый старый элемент в namespace
   */
  getOldestItem(namespace) {
    let oldest = null;
    let oldestTime = Date.now();
    
    this.cache.forEach((item, key) => {
      if (item.namespace === namespace && item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldest = { key: key.replace(`${namespace}:`, ''), item };
      }
    });
    
    return oldest;
  }

  /**
   * Получает самый новый элемент в namespace
   */
  getNewestItem(namespace) {
    let newest = null;
    let newestTime = 0;
    
    this.cache.forEach((item, key) => {
      if (item.namespace === namespace && item.createdAt > newestTime) {
        newestTime = item.createdAt;
        newest = { key: key.replace(`${namespace}:`, ''), item };
      }
    });
    
    return newest;
  }

  /**
   * Простое сжатие данных
   */
  compress(data) {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.warn('Cache: не удалось сжать данные:', error);
      return data;
    }
  }

  /**
   * Простое распаковка данных
   */
  decompress(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Cache: не удалось распаковать данные:', error);
      return data;
    }
  }

  /**
   * Оценка использования памяти
   */
  getMemoryUsage() {
    try {
      const cacheSize = JSON.stringify(Array.from(this.cache.entries())).length;
      return {
        cacheSize,
        cacheSizeKB: Math.round(cacheSize / 1024 * 100) / 100,
        cacheSizeMB: Math.round(cacheSize / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      return { error: 'Не удалось вычислить размер' };
    }
  }

  /**
   * Экспортирует кэш в JSON
   */
  export() {
    const exportData = {};
    
    this.cache.forEach((item, key) => {
      if (!this.isExpired(item)) {
        exportData[key] = {
          value: item.value,
          namespace: item.namespace,
          createdAt: item.createdAt,
          lastAccessed: item.lastAccessed,
          ttl: item.ttl
        };
      }
    });
    
    return exportData;
  }

  /**
   * Импортирует кэш из JSON
   */
  import(data) {
    this.clear();
    
    Object.entries(data).forEach(([key, item]) => {
      this.cache.set(key, {
        ...item,
        compressed: false
      });
      
      if (item.ttl) {
        this.setExpirationTimer(key, item.ttl);
      }
    });
    
    console.log(`Cache: импортировано ${Object.keys(data).length} элементов`);
  }

  /**
   * Очищает все ресурсы
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
    
    console.log('Cache: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const cacheService = new CacheService();

export default cacheService; 