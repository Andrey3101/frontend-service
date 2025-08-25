/**
 * Сервис метрик для task-service
 * Обеспечивает сбор, анализ и отправку метрик производительности и использования
 */

import { getTaskServiceConfig } from '../config/task-service';
import cacheService from './cache-service';
import auditService from './audit-service';
import activityService from './activity-service';

class MetricsService {
  constructor() {
    this.config = getTaskServiceConfig();
    this.metrics = new Map();
    this.counters = new Map();
    this.timers = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.batchSize = 100;
    this.flushInterval = 60000; // 1 минута
    this.isCollecting = true;
    this.flushTimer = null;
    this.performanceObserver = null;
    
    this.metricTypes = {
      counter: 'counter',
      gauge: 'gauge',
      histogram: 'histogram',
      timer: 'timer'
    };
    
    this.defaultMetrics = [
      'page_load_time',
      'api_response_time',
      'memory_usage',
      'cpu_usage',
      'network_requests',
      'errors_count',
      'user_actions',
      'cache_hit_rate',
      'sync_duration',
      'notification_delivery_time'
    ];
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    // Инициализируем метрики по умолчанию
    this.initializeDefaultMetrics();
    
    // Настраиваем сбор метрик производительности
    this.setupPerformanceMonitoring();
    
    // Настраиваем обработчики событий
    this.setupEventListeners();
    
    // Запускаем периодическую отправку метрик
    this.startPeriodicFlush();
    
    console.log('MetricsService: инициализирован');
  }

  /**
   * Инициализирует метрики по умолчанию
   */
  initializeDefaultMetrics() {
    // Счетчики
    this.defaultMetrics.forEach(metric => {
      if (metric.includes('count') || metric.includes('rate')) {
        this.createCounter(metric, `Счетчик для ${metric}`);
      } else if (metric.includes('time') || metric.includes('duration')) {
        this.createTimer(metric, `Таймер для ${metric}`);
      } else if (metric.includes('usage') || metric.includes('memory') || metric.includes('cpu')) {
        this.createGauge(metric, `Показатель для ${metric}`);
      } else {
        this.createCounter(metric, `Метрика для ${metric}`);
      }
    });
  }

  /**
   * Настраивает мониторинг производительности
   */
  setupPerformanceMonitoring() {
    // Мониторинг времени загрузки страницы
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            this.recordPerformanceMetric(entry);
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
        
      } catch (error) {
        console.warn('MetricsService: ошибка настройки PerformanceObserver:', error);
      }
    }
    
    // Мониторинг времени загрузки страницы
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.recordPageLoadTime();
      });
    } else {
      this.recordPageLoadTime();
    }
    
    // Мониторинг времени до интерактивности
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
          this.recordTimeToInteractive();
        }
      });
    }
    
    // Мониторинг времени до полной загрузки
    window.addEventListener('load', () => {
      this.recordFullLoadTime();
    });
  }

  /**
   * Настраивает обработчики событий
   */
  setupEventListeners() {
    // Мониторинг ошибок
    window.addEventListener('error', (event) => {
      this.incrementCounter('errors_count');
      this.recordErrorMetric(event);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.incrementCounter('errors_count');
      this.recordUnhandledRejectionMetric(event);
    });
    
    // Мониторинг сетевых запросов
    this.setupNetworkMonitoring();
    
    // Мониторинг использования памяти
    this.setupMemoryMonitoring();
    
    // Мониторинг активности пользователя
    this.setupUserActivityMonitoring();
    
    // Мониторинг кеша
    cacheService.on('cacheHit', () => {
      this.incrementCounter('cache_hits');
      this.updateCacheHitRate();
    });
    
    cacheService.on('cacheMiss', () => {
      this.incrementCounter('cache_misses');
      this.updateCacheHitRate();
    });
    
    // Мониторинг синхронизации
    if (window.syncService) {
      window.syncService.on('syncCompleted', (data) => {
        if (data.success && data.duration) {
          this.recordHistogram('sync_duration', data.duration);
        }
      });
    }
    
    // Мониторинг уведомлений
    if (window.notificationService) {
      window.notificationService.subscribe('notificationCreated', (notification) => {
        this.incrementCounter('notifications_created');
      });
      
      window.notificationService.subscribe('notificationClicked', (notification) => {
        this.incrementCounter('notifications_clicked');
      });
    }
  }

  /**
   * Настраивает мониторинг сети
   */
  setupNetworkMonitoring() {
    // Перехватываем fetch запросы
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      this.incrementCounter('network_requests');
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        this.recordHistogram('api_response_time', duration);
        
        if (!response.ok) {
          this.incrementCounter('network_errors');
        }
        
        return response;
        
      } catch (error) {
        this.incrementCounter('network_errors');
        throw error;
      }
    };
    
    // Перехватываем XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(...args) {
      this._startTime = performance.now();
      this.incrementCounter('network_requests');
      return originalXHROpen.apply(this, args);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      const startTime = xhr._startTime;
      
      xhr.addEventListener('load', () => {
        const duration = performance.now() - startTime;
        this.recordHistogram('api_response_time', duration);
        
        if (xhr.status >= 400) {
          this.incrementCounter('network_errors');
        }
      });
      
      xhr.addEventListener('error', () => {
        this.incrementCounter('network_errors');
      });
      
      return originalXHRSend.apply(this, args);
    };
  }

  /**
   * Настраивает мониторинг памяти
   */
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.updateGauge('memory_usage', memory.usedJSHeapSize);
        this.updateGauge('memory_limit', memory.jsHeapSizeLimit);
        this.updateGauge('memory_total', memory.totalJSHeapSize);
      }, 30000); // Каждые 30 секунд
    }
    
    // Мониторинг утечек памяти
    let lastMemoryUsage = 0;
    setInterval(() => {
      if ('memory' in performance) {
        const currentMemory = performance.memory.usedJSHeapSize;
        const memoryGrowth = currentMemory - lastMemoryUsage;
        
        if (lastMemoryUsage > 0) {
          this.recordHistogram('memory_growth', memoryGrowth);
        }
        
        lastMemoryUsage = currentMemory;
      }
    }, 60000); // Каждую минуту
  }

  /**
   * Настраивает мониторинг активности пользователя
   */
  setupUserActivityMonitoring() {
    let lastActivity = Date.now();
    let idleTime = 0;
    
    const updateActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      if (timeSinceLastActivity > 60000) { // Более минуты
        idleTime += timeSinceLastActivity - 60000;
      }
      
      lastActivity = now;
      this.incrementCounter('user_actions');
    };
    
    // Отслеживаем различные действия пользователя
    ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, updateActivity, { passive: true });
    });
    
    // Отслеживаем время простоя
    setInterval(() => {
      this.updateGauge('idle_time', idleTime);
    }, 60000);
  }

  /**
   * Методы для работы с метриками
   */

  /**
   * Создает счетчик
   */
  createCounter(name, description = '') {
    if (this.counters.has(name)) {
      return;
    }
    
    this.counters.set(name, {
      name,
      description,
      value: 0,
      type: this.metricTypes.counter,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    
    this.emit('counterCreated', { name, description });
  }

  /**
   * Создает таймер
   */
  createTimer(name, description = '') {
    if (this.timers.has(name)) {
      return;
    }
    
    this.timers.set(name, {
      name,
      description,
      value: 0,
      count: 0,
      min: Infinity,
      max: -Infinity,
      sum: 0,
      type: this.metricTypes.timer,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    
    this.emit('timerCreated', { name, description });
  }

  /**
   * Создает показатель
   */
  createGauge(name, description = '') {
    if (this.gauges.has(name)) {
      return;
    }
    
    this.gauges.set(name, {
      name,
      description,
      value: 0,
      min: Infinity,
      max: -Infinity,
      type: this.metricTypes.gauge,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    
    this.emit('gaugeCreated', { name, description });
  }

  /**
   * Создает гистограмму
   */
  createHistogram(name, description = '') {
    if (this.histograms.has(name)) {
      return;
    }
    
    this.histograms.set(name, {
      name,
      description,
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      counts: new Array(12).fill(0),
      sum: 0,
      count: 0,
      min: Infinity,
      max: -Infinity,
      type: this.metricTypes.histogram,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    
    this.emit('histogramCreated', { name, description });
  }

  /**
   * Увеличивает счетчик
   */
  incrementCounter(name, value = 1) {
    if (!this.counters.has(name)) {
      this.createCounter(name);
    }
    
    const counter = this.counters.get(name);
    counter.value += value;
    counter.lastUpdated = Date.now();
    
    this.emit('counterUpdated', { name, value: counter.value, increment: value });
  }

  /**
   * Устанавливает значение счетчика
   */
  setCounter(name, value) {
    if (!this.counters.has(name)) {
      this.createCounter(name);
    }
    
    const counter = this.counters.get(name);
    counter.value = value;
    counter.lastUpdated = Date.now();
    
    this.emit('counterUpdated', { name, value: counter.value });
  }

  /**
   * Запускает таймер
   */
  startTimer(name) {
    if (!this.timers.has(name)) {
      this.createTimer(name);
    }
    
    const timer = this.timers.get(name);
    timer._startTime = performance.now();
    
    return timer;
  }

  /**
   * Останавливает таймер
   */
  stopTimer(name) {
    const timer = this.timers.get(name);
    if (!timer || !timer._startTime) {
      return;
    }
    
    const duration = performance.now() - timer._startTime;
    
    timer.value = duration;
    timer.count++;
    timer.sum += duration;
    timer.min = Math.min(timer.min, duration);
    timer.max = Math.max(timer.max, duration);
    timer.lastUpdated = Date.now();
    
    delete timer._startTime;
    
    this.emit('timerStopped', { name, duration });
    
    return duration;
  }

  /**
   * Обновляет показатель
   */
  updateGauge(name, value) {
    if (!this.gauges.has(name)) {
      this.createGauge(name);
    }
    
    const gauge = this.gauges.get(name);
    gauge.value = value;
    gauge.min = Math.min(gauge.min, value);
    gauge.max = Math.max(gauge.max, value);
    gauge.lastUpdated = Date.now();
    
    this.emit('gaugeUpdated', { name, value });
  }

  /**
   * Записывает значение в гистограмму
   */
  recordHistogram(name, value) {
    if (!this.histograms.has(name)) {
      this.createHistogram(name);
    }
    
    const histogram = this.histograms.get(name);
    
    histogram.sum += value;
    histogram.count++;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);
    histogram.lastUpdated = Date.now();
    
    // Обновляем бакеты
    for (let i = 0; i < histogram.buckets.length; i++) {
      if (value <= histogram.buckets[i]) {
        histogram.counts[i]++;
        break;
      }
    }
    
    this.emit('histogramUpdated', { name, value });
  }

  /**
   * Методы для получения метрик
   */

  /**
   * Получает все метрики
   */
  getAllMetrics() {
    const metrics = {
      counters: Array.from(this.counters.values()),
      timers: Array.from(this.timers.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: Array.from(this.histograms.values())
    };
    
    return metrics;
  }

  /**
   * Получает метрику по имени
   */
  getMetric(name) {
    return this.counters.get(name) || 
           this.timers.get(name) || 
           this.gauges.get(name) || 
           this.histograms.get(name);
  }

  /**
   * Получает счетчик по имени
   */
  getCounter(name) {
    return this.counters.get(name);
  }

  /**
   * Получает таймер по имени
   */
  getTimer(name) {
    return this.timers.get(name);
  }

  /**
   * Получает показатель по имени
   */
  getGauge(name) {
    return this.gauges.get(name);
  }

  /**
   * Получает гистограмму по имени
   */
  getHistogram(name) {
    return this.histograms.get(name);
  }

  /**
   * Получает статистику по метрикам
   */
  getMetricsStats() {
    const stats = {
      total: this.counters.size + this.timers.size + this.gauges.size + this.histograms.size,
      counters: this.counters.size,
      timers: this.timers.size,
      gauges: this.gauges.size,
      histograms: this.histograms.size,
      lastUpdated: this.getLastUpdateTime()
    };
    
    return stats;
  }

  /**
   * Получает время последнего обновления
   */
  getLastUpdateTime() {
    let lastUpdate = 0;
    
    [...this.counters.values(), ...this.timers.values(), ...this.gauges.values(), ...this.histograms.values()]
      .forEach(metric => {
        if (metric.lastUpdated > lastUpdate) {
          lastUpdate = metric.lastUpdated;
        }
      });
    
    return lastUpdate;
  }

  /**
   * Методы для записи специфических метрик
   */

  /**
   * Записывает метрику производительности
   */
  recordPerformanceMetric(entry) {
    switch (entry.entryType) {
      case 'navigation':
        this.recordNavigationMetrics(entry);
        break;
      
      case 'resource':
        this.recordResourceMetrics(entry);
        break;
      
      case 'paint':
        this.recordPaintMetrics(entry);
        break;
    }
  }

  /**
   * Записывает метрики навигации
   */
  recordNavigationMetrics(entry) {
    if (entry.loadEventEnd > 0) {
      this.recordHistogram('page_load_time', entry.loadEventEnd - entry.loadEventStart);
    }
    
    if (entry.domContentLoadedEventEnd > 0) {
      this.recordHistogram('dom_content_loaded_time', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
    }
    
    if (entry.firstPaint > 0) {
      this.recordHistogram('first_paint_time', entry.firstPaint);
    }
    
    if (entry.firstContentfulPaint > 0) {
      this.recordHistogram('first_contentful_paint_time', entry.firstContentfulPaint);
    }
  }

  /**
   * Записывает метрики ресурсов
   */
  recordResourceMetrics(entry) {
    if (entry.duration > 0) {
      this.recordHistogram('resource_load_time', entry.duration);
    }
    
    if (entry.transferSize > 0) {
      this.recordHistogram('resource_size', entry.transferSize);
    }
    
    // Группируем по типу ресурса
    const resourceType = this.getResourceType(entry.name);
    if (resourceType) {
      this.incrementCounter(`resource_${resourceType}_count`);
    }
  }

  /**
   * Записывает метрики отрисовки
   */
  recordPaintMetrics(entry) {
    if (entry.name === 'first-paint') {
      this.recordHistogram('first_paint_time', entry.startTime);
    } else if (entry.name === 'first-contentful-paint') {
      this.recordHistogram('first_contentful_paint_time', entry.startTime);
    }
  }

  /**
   * Определяет тип ресурса
   */
  getResourceType(url) {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['js', 'css', 'html'].includes(extension)) {
      return extension;
    } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) {
      return 'image';
    } else if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension)) {
      return 'font';
    } else if (['mp4', 'webm', 'ogg', 'mp3', 'wav'].includes(extension)) {
      return 'media';
    }
    
    return 'other';
  }

  /**
   * Записывает время загрузки страницы
   */
  recordPageLoadTime() {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (loadTime > 0) {
      this.recordHistogram('page_load_time', loadTime);
    }
  }

  /**
   * Записывает время до интерактивности
   */
  recordTimeToInteractive() {
    const tti = performance.timing.domInteractive - performance.timing.navigationStart;
    if (tti > 0) {
      this.recordHistogram('time_to_interactive', tti);
    }
  }

  /**
   * Записывает время полной загрузки
   */
  recordFullLoadTime() {
    const fullLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (fullLoadTime > 0) {
      this.recordHistogram('full_load_time', fullLoadTime);
    }
  }

  /**
   * Записывает метрику ошибки
   */
  recordErrorMetric(error) {
    this.incrementCounter('errors_count');
    
    const errorType = error.error?.name || 'Unknown';
    this.incrementCounter(`error_${errorType.toLowerCase()}_count`);
    
    if (error.filename) {
      this.incrementCounter(`error_file_${error.filename.split('/').pop()}_count`);
    }
  }

  /**
   * Записывает метрику необработанного отклонения Promise
   */
  recordUnhandledRejectionMetric(event) {
    this.incrementCounter('unhandled_rejections_count');
    
    const reason = event.reason;
    if (reason && typeof reason === 'object') {
      const errorType = reason.name || 'Unknown';
      this.incrementCounter(`rejection_${errorType.toLowerCase()}_count`);
    }
  }

  /**
   * Обновляет показатель попаданий в кеш
   */
  updateCacheHitRate() {
    const hits = this.getCounter('cache_hits')?.value || 0;
    const misses = this.getCounter('cache_misses')?.value || 0;
    const total = hits + misses;
    
    if (total > 0) {
      const hitRate = (hits / total) * 100;
      this.updateGauge('cache_hit_rate', hitRate);
    }
  }

  /**
   * Методы для отправки метрик
   */

  /**
   * Запускает периодическую отправку метрик
   */
  startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
    
    console.log(`MetricsService: периодическая отправка метрик запущена каждые ${this.flushInterval / 1000} секунд`);
  }

  /**
   * Отправляет метрики на сервер
   */
  async flushMetrics() {
    if (!this.isCollecting || this.getMetricsStats().total === 0) {
      return;
    }
    
    try {
      const metrics = this.prepareMetricsForFlush();
      
      const response = await fetch(`${this.config.baseURL}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(metrics)
      });
      
      if (response.ok) {
        this.emit('metricsFlushed', { success: true, count: metrics.length });
        console.log(`MetricsService: отправлено ${metrics.length} метрик`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.warn('MetricsService: ошибка отправки метрик:', error);
      this.emit('metricsFlushed', { success: false, error: error.message });
    }
  }

  /**
   * Подготавливает метрики для отправки
   */
  prepareMetricsForFlush() {
    const now = Date.now();
    const metrics = [];
    
    // Добавляем счетчики
    this.counters.forEach(counter => {
      metrics.push({
        name: counter.name,
        type: counter.type,
        value: counter.value,
        timestamp: now,
        metadata: {
          description: counter.description
        }
      });
    });
    
    // Добавляем таймеры
    this.timers.forEach(timer => {
      if (timer.count > 0) {
        metrics.push({
          name: timer.name,
          type: timer.type,
          value: timer.sum / timer.count, // среднее значение
          count: timer.count,
          min: timer.min,
          max: timer.max,
          sum: timer.sum,
          timestamp: now,
          metadata: {
            description: timer.description
          }
        });
      }
    });
    
    // Добавляем показатели
    this.gauges.forEach(gauge => {
      metrics.push({
        name: gauge.name,
        type: gauge.type,
        value: gauge.value,
        min: gauge.min,
        max: gauge.max,
        timestamp: now,
        metadata: {
          description: gauge.description
        }
      });
    });
    
    // Добавляем гистограммы
    this.histograms.forEach(histogram => {
      if (histogram.count > 0) {
        metrics.push({
          name: histogram.name,
          type: histogram.type,
          value: histogram.sum / histogram.count, // среднее значение
          count: histogram.count,
          min: histogram.min,
          max: histogram.max,
          sum: histogram.sum,
          buckets: histogram.buckets,
          bucketCounts: histogram.counts,
          timestamp: now,
          metadata: {
            description: histogram.description
          }
        });
      }
    });
    
    return metrics;
  }

  /**
   * Методы для управления сервисом
   */

  /**
   * Включает сбор метрик
   */
  enableCollection() {
    this.isCollecting = true;
    this.emit('collectionEnabled');
    console.log('MetricsService: сбор метрик включен');
  }

  /**
   * Отключает сбор метрик
   */
  disableCollection() {
    this.isCollecting = false;
    this.emit('collectionDisabled');
    console.log('MetricsService: сбор метрик отключен');
  }

  /**
   * Проверяет, включен ли сбор метрик
   */
  isCollectionEnabled() {
    return this.isCollecting;
  }

  /**
   * Устанавливает размер пакета для отправки
   */
  setBatchSize(size) {
    if (typeof size === 'number' && size > 0) {
      this.batchSize = size;
      this.emit('batchSizeChanged', { size });
      console.log(`MetricsService: размер пакета изменен на ${size}`);
      return true;
    }
    return false;
  }

  /**
   * Устанавливает интервал отправки
   */
  setFlushInterval(interval) {
    if (typeof interval === 'number' && interval > 0) {
      this.flushInterval = interval;
      
      // Перезапускаем таймер
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.startPeriodicFlush();
      }
      
      this.emit('flushIntervalChanged', { interval });
      console.log(`MetricsService: интервал отправки изменен на ${interval}ms`);
      return true;
    }
    return false;
  }

  /**
   * Сбрасывает все метрики
   */
  resetAllMetrics() {
    this.counters.clear();
    this.timers.clear();
    this.gauges.clear();
    this.histograms.clear();
    
    // Пересоздаем метрики по умолчанию
    this.initializeDefaultMetrics();
    
    this.emit('allMetricsReset');
    console.log('MetricsService: все метрики сброшены');
  }

  /**
   * Сбрасывает конкретную метрику
   */
  resetMetric(name) {
    let reset = false;
    
    if (this.counters.delete(name)) reset = true;
    if (this.timers.delete(name)) reset = true;
    if (this.gauges.delete(name)) reset = true;
    if (this.histograms.delete(name)) reset = true;
    
    if (reset) {
      this.emit('metricReset', { name });
      console.log(`MetricsService: метрика ${name} сброшена`);
    }
    
    return reset;
  }

  /**
   * Экспортирует метрики
   */
  exportMetrics(format = 'json') {
    try {
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(this.getAllMetrics(), null, 2);
        
        case 'csv':
          return this.exportToCSV();
        
        default:
          throw new Error(`Неподдерживаемый формат: ${format}`);
      }
    } catch (error) {
      console.error('MetricsService: ошибка экспорта метрик:', error);
      return null;
    }
  }

  /**
   * Экспортирует в CSV
   */
  exportToCSV() {
    const headers = ['Name', 'Type', 'Value', 'Count', 'Min', 'Max', 'Sum', 'Description'];
    const rows = [];
    
    // Добавляем счетчики
    this.counters.forEach(counter => {
      rows.push([
        counter.name,
        counter.type,
        counter.value,
        '',
        '',
        '',
        '',
        counter.description
      ]);
    });
    
    // Добавляем таймеры
    this.timers.forEach(timer => {
      rows.push([
        timer.name,
        timer.type,
        timer.value,
        timer.count,
        timer.min,
        timer.max,
        timer.sum,
        timer.description
      ]);
    });
    
    // Добавляем показатели
    this.gauges.forEach(gauge => {
      rows.push([
        gauge.name,
        gauge.type,
        gauge.value,
        '',
        gauge.min,
        gauge.max,
        '',
        gauge.description
      ]);
    });
    
    // Добавляем гистограммы
    this.histograms.forEach(histogram => {
      rows.push([
        histogram.name,
        histogram.type,
        histogram.sum / histogram.count,
        histogram.count,
        histogram.min,
        histogram.max,
        histogram.sum,
        histogram.description
      ]);
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * Система событий
   */
  eventListeners = new Map();

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`MetricsService: ошибка в обработчике события ${event}:`, error);
      }
    });
  }

  /**
   * Получает статус сервиса
   */
  getStatus() {
    return {
      isCollecting: this.isCollecting,
      batchSize: this.batchSize,
      flushInterval: this.flushInterval,
      totalMetrics: this.getMetricsStats().total,
      lastUpdate: this.getLastUpdateTime()
    };
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    // Останавливаем периодическую отправку
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Отключаем PerformanceObserver
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    // Очищаем все метрики
    this.counters.clear();
    this.timers.clear();
    this.gauges.clear();
    this.histograms.clear();
    
    // Очищаем обработчики событий
    this.eventListeners.clear();
    
    console.log('MetricsService: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const metricsService = new MetricsService();

export default metricsService; 