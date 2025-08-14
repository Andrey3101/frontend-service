/**
 * Redis адаптер для кэширования
 */

class RedisCacheAdapter {
  constructor(options = {}) {
    this.options = {
      host: options.host || 'localhost',
      port: options.port || 6379,
      password: options.password || null,
      db: options.db || 0,
      keyPrefix: options.keyPrefix || 'cache:',
      defaultTTL: options.defaultTTL || 300, // 5 минут
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };
    
    this.redis = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      connectionErrors: 0
    };
    
    this.init();
  }

  /**
   * Инициализация подключения к Redis
   */
  async init() {
    try {
      // В браузере используем WebSocket или HTTP прокси
      if (typeof window !== 'undefined') {
        await this.initBrowserConnection();
      } else {
        // В Node.js используем redis клиент
        await this.initNodeConnection();
      }
    } catch (error) {
      console.error('Ошибка инициализации Redis:', error);
      this.metrics.connectionErrors++;
    }
  }

  /**
   * Инициализация подключения для браузера
   */
  async initBrowserConnection() {
    // Используем WebSocket или HTTP прокси для подключения к Redis
    if (this.options.websocketUrl) {
      await this.initWebSocketConnection();
    } else if (this.options.httpProxyUrl) {
      await this.initHttpProxyConnection();
    } else {
      throw new Error('Redis connection not configured for browser');
    }
  }

  /**
   * Инициализация WebSocket подключения
   */
  async initWebSocketConnection() {
    return new Promise((resolve, reject) => {
      try {
        this.redis = new WebSocket(this.options.websocketUrl);
        
        this.redis.onopen = () => {
          this.isConnected = true;
          resolve();
        };
        
        this.redis.onerror = (error) => {
          this.isConnected = false;
          this.metrics.connectionErrors++;
          reject(error);
        };
        
        this.redis.onclose = () => {
          this.isConnected = false;
        };
        
        this.redis.onmessage = (event) => {
          this.handleRedisMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Инициализация HTTP прокси подключения
   */
  async initHttpProxyConnection() {
    this.redis = {
      // Эмулируем Redis команды через HTTP API
      get: async (key) => {
        try {
          const response = await fetch(`${this.options.httpProxyUrl}/get/${encodeURIComponent(key)}`);
          if (response.ok) {
            const data = await response.json();
            return data.value;
          }
          return null;
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      },
      
      set: async (key, value, ttl) => {
        try {
          const response = await fetch(`${this.options.httpProxyUrl}/set`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value, ttl })
          });
          return response.ok;
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      },
      
      del: async (key) => {
        try {
          const response = await fetch(`${this.options.httpProxyUrl}/del/${encodeURIComponent(key)}`, {
            method: 'DELETE'
          });
          return response.ok;
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      },
      
      exists: async (key) => {
        try {
          const response = await fetch(`${this.options.httpProxyUrl}/exists/${encodeURIComponent(key)}`);
          if (response.ok) {
            const data = await response.json();
            return data.exists;
          }
          return false;
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      },
      
      keys: async (pattern) => {
        try {
          const response = await fetch(`${this.options.httpProxyUrl}/keys/${encodeURIComponent(pattern)}`);
          if (response.ok) {
            const data = await response.json();
            return data.keys;
          }
          return [];
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      },
      
      expire: async (key, ttl) => {
        try {
          const response = await fetch(`${this.options.httpProxyUrl}/expire`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, ttl })
          });
          return response.ok;
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      },
      
      ttl: async (key) => {
        try {
          const response = await fetch(`${this.options.httpProxyUrl}/ttl/${encodeURIComponent(key)}`);
          if (response.ok) {
            const data = await response.json();
            return data.ttl;
          }
          return -1;
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      }
    };
    
    this.isConnected = true;
  }

  /**
   * Инициализация подключения для Node.js
   */
  async initNodeConnection() {
    try {
      const Redis = require('redis');
      
      this.redis = Redis.createClient({
        host: this.options.host,
        port: this.options.port,
        password: this.options.password,
        db: this.options.db,
        retry_strategy: (options) => {
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > this.options.maxRetries) {
            return undefined;
          }
          return Math.min(options.attempt * this.options.retryDelay, 3000);
        }
      });
      
      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('Connected to Redis');
      });
      
      this.redis.on('error', (error) => {
        this.isConnected = false;
        this.metrics.connectionErrors++;
        console.error('Redis error:', error);
      });
      
      this.redis.on('end', () => {
        this.isConnected = false;
        console.log('Disconnected from Redis');
      });
      
      await this.redis.connect();
    } catch (error) {
      console.error('Ошибка подключения к Redis:', error);
      this.metrics.connectionErrors++;
      throw error;
    }
  }

  /**
   * Получить значение из Redis
   */
  async get(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const fullKey = this.options.keyPrefix + key;
      const value = await this.redis.get(fullKey);
      
      if (value !== null) {
        this.metrics.hits++;
        return JSON.parse(value);
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Установить значение в Redis
   */
  async set(key, value, ttl = this.options.defaultTTL) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const fullKey = this.options.keyPrefix + key;
      const serializedValue = JSON.stringify(value);
      
      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else {
        await this.redis.set(fullKey, serializedValue);
      }
      
      this.metrics.sets++;
      return true;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Удалить значение из Redis
   */
  async delete(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const fullKey = this.options.keyPrefix + key;
      const result = await this.redis.del(fullKey);
      
      this.metrics.deletes++;
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Проверить существование ключа
   */
  async exists(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const fullKey = this.options.keyPrefix + key;
      const result = await this.redis.exists(fullKey);
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Получить все ключи по паттерну
   */
  async keys(pattern) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const fullPattern = this.options.keyPrefix + pattern;
      const keys = await this.redis.keys(fullPattern);
      
      // Убираем префикс из ключей
      return keys.map(key => key.replace(this.options.keyPrefix, ''));
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Установить TTL для ключа
   */
  async expire(key, ttl) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const fullKey = this.options.keyPrefix + key;
      const result = await this.redis.expire(fullKey, ttl);
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Получить TTL ключа
   */
  async ttl(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const fullKey = this.options.keyPrefix + key;
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Очистить все ключи по паттерну
   */
  async clear(pattern = '*') {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        const pipeline = this.redis.pipeline();
        keys.forEach(key => {
          pipeline.del(this.options.keyPrefix + key);
        });
        await pipeline.exec();
        
        this.metrics.deletes += keys.length;
        return keys.length;
      }
      return 0;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Получить статистику
   */
  getStats() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    
    return {
      ...this.metrics,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      isConnected: this.isConnected
    };
  }

  /**
   * Сбросить метрики
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      connectionErrors: 0
    };
  }

  /**
   * Закрыть подключение
   */
  async close() {
    if (this.redis && typeof this.redis.quit === 'function') {
      await this.redis.quit();
    }
    this.isConnected = false;
  }

  /**
   * Обработка сообщений от Redis (для WebSocket)
   */
  handleRedisMessage(data) {
    try {
      const message = JSON.parse(data);
      // Обработка различных типов сообщений от Redis
      console.log('Redis message:', message);
    } catch (error) {
      console.error('Error parsing Redis message:', error);
    }
  }
}

export default RedisCacheAdapter; 