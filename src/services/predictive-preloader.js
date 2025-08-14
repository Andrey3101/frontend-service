/**
 * Сервис предзагрузки на основе поведения пользователя
 * Анализирует паттерны использования и предзагружает контент
 */

class PredictivePreloader {
  constructor() {
    this.userBehavior = {
      navigationPatterns: new Map(),
      clickPatterns: new Map(),
      scrollPatterns: new Map(),
      timePatterns: new Map(),
      searchPatterns: new Map()
    };
    
    this.preloadQueue = [];
    this.preloadCache = new Map();
    this.learningEnabled = true;
    this.confidenceThreshold = 0.7;
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    this.setupBehaviorTracking();
    this.setupPreloadEngine();
    this.startLearning();
  }

  /**
   * Настройка отслеживания поведения
   */
  setupBehaviorTracking() {
    // Отслеживание навигации
    this.trackNavigation();
    
    // Отслеживание кликов
    this.trackClicks();
    
    // Отслеживание скролла
    this.trackScroll();
    
    // Отслеживание времени
    this.trackTimePatterns();
    
    // Отслеживание поиска
    this.trackSearch();
    
    // Отслеживание фокуса
    this.trackFocus();
    
    // Отслеживание наведения мыши
    this.trackHover();
  }

  /**
   * Отслеживание навигации
   */
  trackNavigation() {
    let currentPath = window.location.pathname;
    let navigationStartTime = Date.now();
    
    // Отслеживаем изменения маршрута
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      const newPath = args[2];
      if (newPath !== currentPath) {
        this.recordNavigation(currentPath, newPath, Date.now() - navigationStartTime);
        currentPath = newPath;
        navigationStartTime = Date.now();
      }
      return originalPushState.apply(this, args);
    }.bind(this);
    
    history.replaceState = function(...args) {
      const newPath = args[2];
      if (newPath !== currentPath) {
        this.recordNavigation(currentPath, newPath, Date.now() - navigationStartTime);
        currentPath = newPath;
        navigationStartTime = Date.now();
      }
      return originalReplaceState.apply(this, args);
    }.bind(this);
    
    // Отслеживаем popstate
    window.addEventListener('popstate', () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        this.recordNavigation(currentPath, newPath, Date.now() - navigationStartTime);
        currentPath = newPath;
        navigationStartTime = Date.now();
      }
    });
  }

  /**
   * Запись навигации
   */
  recordNavigation(fromPath, toPath, duration) {
    const pattern = `${fromPath} -> ${toPath}`;
    const existing = this.userBehavior.navigationPatterns.get(pattern) || {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      lastUsed: 0,
      confidence: 0
    };
    
    existing.count++;
    existing.totalDuration += duration;
    existing.averageDuration = existing.totalDuration / existing.count;
    existing.lastUsed = Date.now();
    existing.confidence = this.calculateConfidence(existing.count, existing.lastUsed);
    
    this.userBehavior.navigationPatterns.set(pattern, existing);
    
    // Предзагружаем следующую страницу
    this.predictNextPage(toPath);
  }

  /**
   * Отслеживание кликов
   */
  trackClicks() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;
      
      // Анализируем паттерн клика
      const clickPattern = {
        tag: tagName,
        class: className,
        id: id,
        text: target.textContent?.substring(0, 50),
        position: {
          x: event.clientX,
          y: event.clientY
        },
        timestamp: Date.now()
      };
      
      this.analyzeClickPattern(clickPattern);
      
      // Предзагружаем связанный контент
      this.predictFromClick(clickPattern);
    });
  }

  /**
   * Анализ паттерна клика
   */
  analyzeClickPattern(clickPattern) {
    const key = `${clickPattern.tag}.${clickPattern.class}`;
    const existing = this.userBehavior.clickPatterns.get(key) || {
      count: 0,
      positions: [],
      timestamps: [],
      confidence: 0
    };
    
    existing.count++;
    existing.positions.push(clickPattern.position);
    existing.timestamps.push(clickPattern.timestamp);
    
    // Ограничиваем историю
    if (existing.positions.length > 100) {
      existing.positions.shift();
      existing.timestamps.shift();
    }
    
    existing.confidence = this.calculateConfidence(existing.count, existing.timestamps[existing.timestamps.length - 1]);
    
    this.userBehavior.clickPatterns.set(key, existing);
  }

  /**
   * Отслеживание скролла
   */
  trackScroll() {
    let scrollTimeout;
    let scrollStartTime = Date.now();
    let scrollStartY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      
      const currentTime = Date.now();
      const currentY = window.scrollY;
      const scrollDistance = Math.abs(currentY - scrollStartY);
      const scrollDuration = currentTime - scrollStartTime;
      
      if (scrollDistance > 100) {
        const scrollPattern = {
          direction: currentY > scrollStartY ? 'down' : 'up',
          distance: scrollDistance,
          duration: scrollDuration,
          speed: scrollDistance / scrollDuration,
          timestamp: currentTime
        };
        
        this.analyzeScrollPattern(scrollPattern);
        
        // Предзагружаем контент при скролле вниз
        if (scrollPattern.direction === 'down' && scrollPattern.speed > 0.5) {
          this.predictFromScroll(scrollPattern);
        }
        
        scrollStartTime = currentTime;
        scrollStartY = currentY;
      }
      
      // Задержка для анализа окончания скролла
      scrollTimeout = setTimeout(() => {
        this.analyzeScrollEnd();
      }, 150);
    });
  }

  /**
   * Анализ паттерна скролла
   */
  analyzeScrollPattern(scrollPattern) {
    const key = scrollPattern.direction;
    const existing = this.userBehavior.scrollPatterns.get(key) || {
      count: 0,
      totalDistance: 0,
      totalDuration: 0,
      averageSpeed: 0,
      confidence: 0
    };
    
    existing.count++;
    existing.totalDistance += scrollPattern.distance;
    existing.totalDuration += scrollPattern.duration;
    existing.averageSpeed = existing.totalDistance / existing.totalDuration;
    existing.confidence = this.calculateConfidence(existing.count, scrollPattern.timestamp);
    
    this.userBehavior.scrollPatterns.set(key, existing);
  }

  /**
   * Анализ окончания скролла
   */
  analyzeScrollEnd() {
    const currentY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Если пользователь близко к концу страницы
    if (currentY + viewportHeight > documentHeight - 200) {
      this.predictEndOfPage();
    }
  }

  /**
   * Отслеживание временных паттернов
   */
  trackTimePatterns() {
    const now = new Date();
    const timeKey = `${now.getHours()}:${Math.floor(now.getMinutes() / 15) * 15}`;
    const dayKey = now.getDay();
    
    // Увеличиваем счетчик для текущего времени
    const timePattern = this.userBehavior.timePatterns.get(timeKey) || {
      count: 0,
      confidence: 0
    };
    
    timePattern.count++;
    timePattern.confidence = this.calculateConfidence(timePattern.count, Date.now());
    this.userBehavior.timePatterns.set(timeKey, timePattern);
    
    // Анализируем паттерны по дням недели
    const dayPattern = this.userBehavior.timePatterns.get(`day_${dayKey}`) || {
      count: 0,
      confidence: 0
    };
    
    dayPattern.count++;
    dayPattern.confidence = this.calculateConfidence(dayPattern.count, Date.now());
    this.userBehavior.timePatterns.set(`day_${dayKey}`, dayPattern);
  }

  /**
   * Отслеживание поиска
   */
  trackSearch() {
    // Отслеживаем поисковые запросы
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="поиск"], input[placeholder*="search"]');
    
    searchInputs.forEach(input => {
      input.addEventListener('input', (event) => {
        const query = event.target.value;
        if (query.length > 2) {
          this.analyzeSearchPattern(query);
          this.predictFromSearch(query);
        }
      });
    });
  }

  /**
   * Анализ паттерна поиска
   */
  analyzeSearchPattern(query) {
    const key = query.toLowerCase().substring(0, 3);
    const existing = this.userBehavior.searchPatterns.get(key) || {
      count: 0,
      queries: [],
      confidence: 0
    };
    
    existing.count++;
    if (!existing.queries.includes(query)) {
      existing.queries.push(query);
    }
    
    existing.confidence = this.calculateConfidence(existing.count, Date.now());
    this.userBehavior.searchPatterns.set(key, existing);
  }

  /**
   * Отслеживание фокуса
   */
  trackFocus() {
    document.addEventListener('focusin', (event) => {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      
      // Если фокус на форме, предзагружаем связанные данные
      if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
        this.predictFromFormFocus(target);
      }
    });
  }

  /**
   * Отслеживание наведения мыши
   */
  trackHover() {
    let hoverTimeout;
    
    document.addEventListener('mouseover', (event) => {
      const target = event.target;
      
      // Предзагружаем при наведении на ссылки
      if (target.tagName === 'A' && target.href) {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          this.preloadLink(target.href);
        }, 200);
      }
    });
    
    document.addEventListener('mouseout', () => {
      clearTimeout(hoverTimeout);
    });
  }

  /**
   * Настройка движка предзагрузки
   */
  setupPreloadEngine() {
    // Запускаем предзагрузку каждые 5 секунд
    setInterval(() => {
      this.processPreloadQueue();
    }, 5000);
    
    // Очищаем старые данные каждые 10 минут
    setInterval(() => {
      this.cleanupOldData();
    }, 10 * 60 * 1000);
  }

  /**
   * Предсказание следующей страницы
   */
  predictNextPage(currentPath) {
    const predictions = [];
    
    // Анализируем паттерны навигации
    for (const [pattern, data] of this.userBehavior.navigationPatterns) {
      if (pattern.startsWith(currentPath + ' -> ') && data.confidence > this.confidenceThreshold) {
        const nextPath = pattern.split(' -> ')[1];
        predictions.push({
          type: 'navigation',
          path: nextPath,
          confidence: data.confidence,
          priority: data.count
        });
      }
    }
    
    // Сортируем по приоритету
    predictions.sort((a, b) => b.priority - a.priority);
    
    // Предзагружаем топ-3 предсказания
    predictions.slice(0, 3).forEach(prediction => {
      this.addToPreloadQueue(prediction.path, 'navigation', prediction.confidence);
    });
  }

  /**
   * Предсказание на основе клика
   */
  predictFromClick(clickPattern) {
    // Анализируем контекст клика
    const context = this.analyzeClickContext(clickPattern);
    
    if (context.type === 'table-row') {
      // Предзагружаем детали строки
      this.predictTableRowDetails(context);
    } else if (context.type === 'button') {
      // Предзагружаем результат действия
      this.predictButtonAction(context);
    } else if (context.type === 'link') {
      // Предзагружаем связанную страницу
      this.predictRelatedPage(context);
    }
  }

  /**
   * Анализ контекста клика
   */
  analyzeClickContext(clickPattern) {
    const target = clickPattern.target;
    
    // Проверяем, является ли это строкой таблицы
    if (target.closest('tr')) {
      return {
        type: 'table-row',
        element: target.closest('tr'),
        table: target.closest('table')
      };
    }
    
    // Проверяем, является ли это кнопкой
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return {
        type: 'button',
        element: target.tagName === 'BUTTON' ? target : target.closest('button'),
        action: target.dataset.action || target.textContent
      };
    }
    
    // Проверяем, является ли это ссылкой
    if (target.tagName === 'A' || target.closest('a')) {
      return {
        type: 'link',
        element: target.tagName === 'A' ? target : target.closest('a'),
        href: target.href
      };
    }
    
    return { type: 'unknown' };
  }

  /**
   * Предсказание на основе скролла
   */
  predictFromScroll(scrollPattern) {
    if (scrollPattern.direction === 'down' && scrollPattern.speed > 0.5) {
      // Пользователь быстро скроллит вниз - предзагружаем следующий контент
      this.predictNextContent();
    }
  }

  /**
   * Предсказание на основе поиска
   */
  predictFromSearch(query) {
    // Предзагружаем популярные результаты поиска
    const popularQueries = this.getPopularQueries();
    
    popularQueries.forEach(popularQuery => {
      if (popularQuery.startsWith(query.toLowerCase())) {
        this.preloadSearchResults(popularQuery);
      }
    });
  }

  /**
   * Предсказание на основе фокуса формы
   */
  predictFromFormFocus(input) {
    const form = input.closest('form');
    if (form) {
      const formType = this.detectFormType(form);
      this.preloadFormData(formType);
    }
  }

  /**
   * Добавление в очередь предзагрузки
   */
  addToPreloadQueue(resource, type, confidence) {
    // Проверяем, не загружен ли уже ресурс
    if (this.preloadCache.has(resource)) {
      return;
    }
    
    const priority = this.calculatePreloadPriority(type, confidence);
    
    this.preloadQueue.push({
      resource,
      type,
      confidence,
      priority,
      timestamp: Date.now()
    });
    
    // Сортируем по приоритету
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    // Ограничиваем размер очереди
    if (this.preloadQueue.length > 50) {
      this.preloadQueue = this.preloadQueue.slice(0, 50);
    }
  }

  /**
   * Расчет приоритета предзагрузки
   */
  calculatePreloadPriority(type, confidence) {
    const typeWeights = {
      navigation: 1.0,
      click: 0.8,
      scroll: 0.6,
      search: 0.7,
      form: 0.5
    };
    
    return (typeWeights[type] || 0.5) * confidence;
  }

  /**
   * Обработка очереди предзагрузки
   */
  async processPreloadQueue() {
    if (this.preloadQueue.length === 0) return;
    
    // Берем топ-5 элементов для предзагрузки
    const itemsToPreload = this.preloadQueue.splice(0, 5);
    
    for (const item of itemsToPreload) {
      try {
        await this.preloadResource(item);
        this.preloadCache.set(item.resource, {
          timestamp: Date.now(),
          type: item.type
        });
      } catch (error) {
        console.error('Preload failed:', error);
      }
    }
  }

  /**
   * Предзагрузка ресурса
   */
  async preloadResource(item) {
    const { resource, type } = item;
    
    switch (type) {
      case 'navigation':
        return this.preloadPage(resource);
      case 'click':
        return this.preloadComponent(resource);
      case 'scroll':
        return this.preloadContent(resource);
      case 'search':
        return this.preloadSearchResults(resource);
      case 'form':
        return this.preloadFormData(resource);
      default:
        return this.preloadGeneric(resource);
    }
  }

  /**
   * Предзагрузка страницы
   */
  async preloadPage(path) {
    try {
      const response = await fetch(path, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        // Предзагружаем основные ресурсы страницы
        const html = await fetch(path).then(r => r.text());
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Предзагружаем CSS и JS
        const stylesheets = doc.querySelectorAll('link[rel="stylesheet"]');
        const scripts = doc.querySelectorAll('script[src]');
        
        [...stylesheets, ...scripts].forEach(link => {
          if (link.href) {
            this.preloadLink(link.href);
          }
        });
      }
    } catch (error) {
      console.error('Page preload failed:', error);
    }
  }

  /**
   * Предзагрузка компонента
   */
  async preloadComponent(componentName) {
    // Предзагружаем Vue компонент
    try {
      await import(`@/components/${componentName}.vue`);
    } catch (error) {
      console.error('Component preload failed:', error);
    }
  }

  /**
   * Предзагрузка контента
   */
  async preloadContent(contentType) {
    // Предзагружаем данные API
    try {
      const response = await fetch(`/api/${contentType}/preview`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Кэшируем предварительные данные
        this.preloadCache.set(`content_${contentType}`, {
          data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Content preload failed:', error);
    }
  }

  /**
   * Предзагрузка результатов поиска
   */
  async preloadSearchResults(query) {
    try {
      const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const suggestions = await response.json();
        this.preloadCache.set(`search_${query}`, {
          data: suggestions,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Search preload failed:', error);
    }
  }

  /**
   * Предзагрузка данных формы
   */
  async preloadFormData(formType) {
    try {
      const response = await fetch(`/api/forms/${formType}/data`);
      
      if (response.ok) {
        const formData = await response.json();
        this.preloadCache.set(`form_${formType}`, {
          data: formData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Form data preload failed:', error);
    }
  }

  /**
   * Предзагрузка ссылки
   */
  preloadLink(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  /**
   * Предзагрузка общего ресурса
   */
  async preloadGeneric(resource) {
    try {
      const response = await fetch(resource, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        this.preloadCache.set(resource, {
          timestamp: Date.now(),
          type: 'generic'
        });
      }
    } catch (error) {
      console.error('Generic preload failed:', error);
    }
  }

  /**
   * Запуск обучения
   */
  startLearning() {
    // Анализируем поведение каждые 30 секунд
    setInterval(() => {
      this.analyzeBehavior();
    }, 30000);
  }

  /**
   * Анализ поведения
   */
  analyzeBehavior() {
    // Анализируем тренды
    this.analyzeTrends();
    
    // Оптимизируем предзагрузку
    this.optimizePreloading();
    
    // Очищаем устаревшие данные
    this.cleanupOldData();
  }

  /**
   * Анализ трендов
   */
  analyzeTrends() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Анализируем активность по времени
    for (const [timeKey, data] of this.userBehavior.timePatterns) {
      if (data.lastUsed && data.lastUsed < oneHourAgo) {
        // Снижаем уверенность для старых данных
        data.confidence *= 0.9;
      }
    }
  }

  /**
   * Оптимизация предзагрузки
   */
  optimizePreloading() {
    // Адаптируем порог уверенности на основе точности предсказаний
    const accuracy = this.calculatePredictionAccuracy();
    
    if (accuracy > 0.8) {
      this.confidenceThreshold = Math.max(0.5, this.confidenceThreshold - 0.05);
    } else if (accuracy < 0.6) {
      this.confidenceThreshold = Math.min(0.9, this.confidenceThreshold + 0.05);
    }
  }

  /**
   * Расчет точности предсказаний
   */
  calculatePredictionAccuracy() {
    // Простая метрика точности
    let correctPredictions = 0;
    let totalPredictions = 0;
    
    for (const [resource, cache] of this.preloadCache) {
      if (cache.used) {
        totalPredictions++;
        if (cache.used < cache.timestamp + 5 * 60 * 1000) { // Использован в течение 5 минут
          correctPredictions++;
        }
      }
    }
    
    return totalPredictions > 0 ? correctPredictions / totalPredictions : 0.5;
  }

  /**
   * Очистка старых данных
   */
  cleanupOldData() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Очищаем старые паттерны
    for (const [key, data] of this.userBehavior.navigationPatterns) {
      if (data.lastUsed < oneDayAgo && data.confidence < 0.3) {
        this.userBehavior.navigationPatterns.delete(key);
      }
    }
    
    // Очищаем старый кэш предзагрузки
    for (const [key, cache] of this.preloadCache) {
      if (cache.timestamp < oneDayAgo) {
        this.preloadCache.delete(key);
      }
    }
  }

  /**
   * Расчет уверенности
   */
  calculateConfidence(count, lastUsed) {
    const timeFactor = Math.max(0, 1 - (Date.now() - lastUsed) / (24 * 60 * 60 * 1000));
    const countFactor = Math.min(1, count / 10);
    
    return (timeFactor + countFactor) / 2;
  }

  /**
   * Получение популярных запросов
   */
  getPopularQueries() {
    const queries = [];
    
    for (const [key, data] of this.userBehavior.searchPatterns) {
      if (data.confidence > 0.5) {
        queries.push(...data.queries);
      }
    }
    
    return [...new Set(queries)].slice(0, 10);
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      navigationPatterns: this.userBehavior.navigationPatterns.size,
      clickPatterns: this.userBehavior.clickPatterns.size,
      scrollPatterns: this.userBehavior.scrollPatterns.size,
      timePatterns: this.userBehavior.timePatterns.size,
      searchPatterns: this.userBehavior.searchPatterns.size,
      preloadQueue: this.preloadQueue.length,
      preloadCache: this.preloadCache.size,
      confidenceThreshold: this.confidenceThreshold
    };
  }

  /**
   * Включение/выключение обучения
   */
  setLearningEnabled(enabled) {
    this.learningEnabled = enabled;
  }

  /**
   * Сброс данных
   */
  reset() {
    this.userBehavior = {
      navigationPatterns: new Map(),
      clickPatterns: new Map(),
      scrollPatterns: new Map(),
      timePatterns: new Map(),
      searchPatterns: new Map()
    };
    
    this.preloadQueue = [];
    this.preloadCache.clear();
  }
}

// Создаем глобальный экземпляр
const predictivePreloader = new PredictivePreloader();

export default predictivePreloader; 