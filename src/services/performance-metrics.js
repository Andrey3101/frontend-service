/**
 * Сервис метрик производительности
 */

class PerformanceMetrics {
  constructor() {
    this.metrics = {
      api: {
        requests: 0,
        responses: 0,
        errors: 0,
        totalTime: 0,
        averageTime: 0,
        slowestRequest: 0,
        fastestRequest: Infinity
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        averageSize: 0
      },
      rendering: {
        componentMounts: 0,
        componentUpdates: 0,
        renderTime: 0,
        averageRenderTime: 0
      },
      memory: {
        used: 0,
        peak: 0,
        garbageCollections: 0
      },
      network: {
        requests: 0,
        bytesReceived: 0,
        bytesSent: 0,
        averageLatency: 0
      }
    };
    
    this.history = [];
    this.maxHistorySize = 1000;
    this.observers = new Set();
    
    this.init();
  }

  /**
   * Инициализация метрик
   */
  init() {
    // Отслеживание производительности API
    this.trackAPI();
    
    // Отслеживание производительности рендеринга
    this.trackRendering();
    
    // Отслеживание использования памяти
    this.trackMemory();
    
    // Отслеживание сетевых запросов
    this.trackNetwork();
    
    // Периодическое сохранение метрик
    this.startPeriodicSaving();
  }

  /**
   * Отслеживание производительности API
   */
  trackAPI() {
    // Перехватываем fetch запросы
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        this.metrics.api.requests++;
        const response = await originalFetch(...args);
        this.metrics.api.responses++;
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.updateAPIMetrics(duration);
        this.trackNetworkMetrics(url, response, duration);
        
        return response;
      } catch (error) {
        this.metrics.api.errors++;
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.updateAPIMetrics(duration);
        throw error;
      }
    };
  }

  /**
   * Обновление метрик API
   */
  updateAPIMetrics(duration) {
    this.metrics.api.totalTime += duration;
    this.metrics.api.averageTime = this.metrics.api.totalTime / this.metrics.api.responses;
    
    if (duration > this.metrics.api.slowestRequest) {
      this.metrics.api.slowestRequest = duration;
    }
    
    if (duration < this.metrics.api.fastestRequest) {
      this.metrics.api.fastestRequest = duration;
    }
  }

  /**
   * Отслеживание производительности рендеринга
   */
  trackRendering() {
    // Отслеживаем время рендеринга компонентов
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      if (tagName.toLowerCase() === 'div') {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'measure') {
              PerformanceMetrics.instance.metrics.rendering.renderTime += entry.duration;
              PerformanceMetrics.instance.metrics.rendering.componentUpdates++;
              PerformanceMetrics.instance.instance.metrics.rendering.averageRenderTime = 
                PerformanceMetrics.instance.instance.metrics.rendering.renderTime / 
                PerformanceMetrics.instance.instance.metrics.rendering.componentUpdates;
            }
          });
        });
        
        observer.observe({ entryTypes: ['measure'] });
      }
      
      return element;
    };
  }

  /**
   * Отслеживание использования памяти
   */
  trackMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memory.used = memory.usedJSHeapSize;
        this.metrics.memory.peak = Math.max(this.metrics.memory.peak, memory.usedJSHeapSize);
        
        if (memory.usedJSHeapSize < this.metrics.memory.used) {
          this.metrics.memory.garbageCollections++;
        }
      }, 1000);
    }
  }

  /**
   * Отслеживание сетевых запросов
   */
  trackNetwork() {
    // Отслеживаем размер ответов
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.headers) {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          this.metrics.network.bytesReceived += parseInt(contentLength);
        }
      }
      
      return response;
    };
  }

  /**
   * Обновление метрик кэша
   */
  updateCacheMetrics(hit, size = 0) {
    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
    
    this.metrics.cache.totalSize += size;
    this.metrics.cache.averageSize = this.metrics.cache.totalSize / (this.metrics.cache.hits + this.metrics.cache.misses);
    this.metrics.cache.hitRate = (this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses)) * 100;
  }

  /**
   * Отслеживание времени рендеринга компонента
   */
  trackComponentRender(componentName, renderTime) {
    this.metrics.rendering.componentMounts++;
    this.metrics.rendering.renderTime += renderTime;
    this.metrics.rendering.averageRenderTime = this.metrics.rendering.renderTime / this.metrics.rendering.componentMounts;
  }

  /**
   * Получение текущих метрик
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      uptime: performance.now()
    };
  }

  /**
   * Получение метрик по категории
   */
  getMetricsByCategory(category) {
    return this.metrics[category] || null;
  }

  /**
   * Сброс метрик
   */
  resetMetrics(category = null) {
    if (category) {
      if (this.metrics[category]) {
        this.metrics[category] = this.getDefaultCategoryMetrics(category);
      }
    } else {
      this.metrics = this.getDefaultMetrics();
    }
  }

  /**
   * Получение метрик по умолчанию
   */
  getDefaultMetrics() {
    return {
      api: {
        requests: 0,
        responses: 0,
        errors: 0,
        totalTime: 0,
        averageTime: 0,
        slowestRequest: 0,
        fastestRequest: Infinity
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        averageSize: 0
      },
      rendering: {
        componentMounts: 0,
        componentUpdates: 0,
        renderTime: 0,
        averageRenderTime: 0
      },
      memory: {
        used: 0,
        peak: 0,
        garbageCollections: 0
      },
      network: {
        requests: 0,
        bytesReceived: 0,
        bytesSent: 0,
        averageLatency: 0
      }
    };
  }

  /**
   * Получение метрик категории по умолчанию
   */
  getDefaultCategoryMetrics(category) {
    const defaults = this.getDefaultMetrics();
    return defaults[category] || null;
  }

  /**
   * Сохранение метрик в историю
   */
  saveToHistory() {
    const snapshot = this.getMetrics();
    this.history.push(snapshot);
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // Уведомляем наблюдателей
    this.notifyObservers(snapshot);
  }

  /**
   * Получение истории метрик
   */
  getHistory(limit = 100) {
    return this.history.slice(-limit);
  }

  /**
   * Получение метрик за период
   */
  getMetricsForPeriod(startTime, endTime) {
    return this.history.filter(
      snapshot => snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );
  }

  /**
   * Анализ трендов
   */
  analyzeTrends(metricPath, period = '1h') {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);
    const startTime = now - periodMs;
    
    const periodMetrics = this.getMetricsForPeriod(startTime, now);
    
    if (periodMetrics.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }
    
    const values = periodMetrics.map(snapshot => this.getNestedValue(snapshot, metricPath));
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend = 'stable';
    if (change > 5) trend = 'increasing';
    else if (change < -5) trend = 'decreasing';
    
    return { trend, change: Math.round(change * 100) / 100 };
  }

  /**
   * Получение вложенного значения по пути
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Получение периода в миллисекундах
   */
  getPeriodMs(period) {
    const periods = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '3h': 3 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    return periods[period] || periods['1h'];
  }

  /**
   * Добавление наблюдателя
   */
  addObserver(observer) {
    this.observers.add(observer);
  }

  /**
   * Удаление наблюдателя
   */
  removeObserver(observer) {
    this.observers.delete(observer);
  }

  /**
   * Уведомление наблюдателей
   */
  notifyObservers(snapshot) {
    this.observers.forEach(observer => {
      try {
        observer(snapshot);
      } catch (error) {
        console.error('Error in metrics observer:', error);
      }
    });
  }

  /**
   * Запуск периодического сохранения
   */
  startPeriodicSaving() {
    setInterval(() => {
      this.saveToHistory();
    }, 60000); // Каждую минуту
  }

  /**
   * Экспорт метрик
   */
  exportMetrics(format = 'json') {
    const data = this.getMetrics();
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'prometheus':
        return this.convertToPrometheus(data);
      default:
        return data;
    }
  }

  /**
   * Конвертация в CSV
   */
  convertToCSV(data) {
    const flatten = (obj, prefix = '') => {
      return Object.keys(obj).reduce((acc, key) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          Object.assign(acc, flatten(obj[key], pre + key));
        } else {
          acc[pre + key] = obj[key];
        }
        return acc;
      }, {});
    };
    
    const flattened = flatten(data);
    const headers = Object.keys(flattened);
    const values = Object.values(flattened);
    
    return [headers.join(','), values.join(',')].join('\n');
  }

  /**
   * Конвертация в Prometheus формат
   */
  convertToPrometheus(data) {
    const flatten = (obj, prefix = '') => {
      return Object.keys(obj).reduce((acc, key) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          Object.assign(acc, flatten(obj[key], pre + key));
        } else {
          acc[pre + key] = obj[key];
        }
        return acc;
      }, {});
    };
    
    const flattened = flatten(data);
    const lines = [];
    
    Object.entries(flattened).forEach(([key, value]) => {
      if (typeof value === 'number') {
        lines.push(`# HELP ${key} ${key} metric`);
        lines.push(`# TYPE ${key} gauge`);
        lines.push(`${key} ${value}`);
      }
    });
    
    return lines.join('\n');
  }
}

// Создаем глобальный экземпляр
PerformanceMetrics.instance = new PerformanceMetrics();

export default PerformanceMetrics.instance; 