// Event Bus для коммуникации между микрофронтендами
class EventBus {
  constructor() {
    this.events = new Map();
    this.middleware = [];
    this.config = {
      maxListeners: 10,
      enableLogging: true,
      enableMetrics: true
    };
    
    // Метрики
    this.metrics = {
      totalEvents: 0,
      totalListeners: 0,
      eventsByType: new Map()
    };
  }

  // Подписка на событие
  on(event, callback, options = {}) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const listeners = this.events.get(event);
    
    // Проверка лимита слушателей
    if (listeners.length >= this.config.maxListeners) {
      console.warn(`Event ${event} has reached maximum listeners limit (${this.config.maxListeners})`);
    }
    
    // Создание слушателя
    const listener = {
      callback,
      id: this.generateListenerId(),
      options: {
        once: options.once || false,
        priority: options.priority || 0,
        ...options
      }
    };
    
    // Добавление с учетом приоритета
    listeners.push(listener);
    listeners.sort((a, b) => b.options.priority - a.options.priority);
    
    // Обновление метрик
    this.updateMetrics('add', event);
    
    if (this.config.enableLogging) {
      console.log(`Listener added for event: ${event} (ID: ${listener.id})`);
    }
    
    // Возврат функции для отписки
    return () => this.off(event, callback);
  }

  // Подписка на событие один раз
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  // Отписка от события
  off(event, callback) {
    if (!this.events.has(event)) {
      return false;
    }
    
    const listeners = this.events.get(event);
    const initialLength = listeners.length;
    
    // Удаление слушателя
    const index = listeners.findIndex(listener => listener.callback === callback);
    if (index !== -1) {
      const removedListener = listeners.splice(index, 1)[0];
      
      // Обновление метрик
      this.updateMetrics('remove', event);
      
      if (this.config.enableLogging) {
        console.log(`Listener removed for event: ${event} (ID: ${removedListener.id})`);
      }
      
      return true;
    }
    
    return false;
  }

  // Отписка всех слушателей от события
  offAll(event) {
    if (!this.events.has(event)) {
      return 0;
    }
    
    const listeners = this.events.get(event);
    const count = listeners.length;
    
    // Обновление метрик
    this.updateMetrics('remove', event, count);
    
    // Удаление всех слушателей
    this.events.delete(event);
    
    if (this.config.enableLogging) {
      console.log(`All listeners removed for event: ${event} (${count} listeners)`);
    }
    
    return count;
  }

  // Отписка всех слушателей
  offAllEvents() {
    const totalListeners = Array.from(this.events.values()).reduce((sum, listeners) => sum + listeners.length, 0);
    
    this.events.clear();
    this.metrics.totalListeners = 0;
    this.metrics.eventsByType.clear();
    
    if (this.config.enableLogging) {
      console.log(`All events cleared (${totalListeners} total listeners)`);
    }
    
    return totalListeners;
  }

  // Эмиссия события
  emit(event, data = null, options = {}) {
    if (!this.events.has(event)) {
      if (this.config.enableLogging) {
        console.log(`Event emitted but no listeners: ${event}`, data);
      }
      return false;
    }
    
    const listeners = this.events.get(event);
    let emittedCount = 0;
    
    // Применение middleware
    let processedData = this.applyMiddleware(event, data, 'emit');
    
    // Выполнение слушателей
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      
      try {
        // Выполнение callback
        const result = listener.callback(processedData, event);
        
        // Обработка Promise результатов
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Error in event listener for ${event}:`, error);
          });
        }
        
        emittedCount++;
        
        // Удаление одноразовых слушателей
        if (listener.options.once) {
          listeners.splice(i, 1);
          i--;
          this.updateMetrics('remove', event);
        }
        
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
        
        // Продолжение выполнения других слушателей
        continue;
      }
    }
    
    // Обновление метрик
    this.updateMetrics('emit', event);
    
    if (this.config.enableLogging) {
      console.log(`Event emitted: ${event} (${emittedCount} listeners executed)`, processedData);
    }
    
    return emittedCount > 0;
  }

  // Асинхронная эмиссия события
  async emitAsync(event, data = null, options = {}) {
    if (!this.events.has(event)) {
      if (this.config.enableLogging) {
        console.log(`Async event emitted but no listeners: ${event}`, data);
      }
      return false;
    }
    
    const listeners = this.events.get(event);
    const promises = [];
    
    // Применение middleware
    let processedData = this.applyMiddleware(event, data, 'emit');
    
    // Создание Promise для каждого слушателя
    for (const listener of listeners) {
      const promise = new Promise(async (resolve, reject) => {
        try {
          const result = listener.callback(processedData, event);
          
          if (result instanceof Promise) {
            await result;
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      promises.push(promise);
    }
    
    // Ожидание выполнения всех слушателей
    const results = await Promise.allSettled(promises);
    
    // Удаление одноразовых слушателей
    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i].options.once) {
        listeners.splice(i, 1);
        this.updateMetrics('remove', event);
      }
    }
    
    // Обновление метрик
    this.updateMetrics('emit', event);
    
    if (this.config.enableLogging) {
      console.log(`Async event emitted: ${event} (${listeners.length} listeners executed)`, processedData);
    }
    
    return results;
  }

  // Добавление middleware
  use(middleware) {
    if (typeof middleware === 'function') {
      this.middleware.push(middleware);
    } else if (middleware && typeof middleware.process === 'function') {
      this.middleware.push(middleware.process.bind(middleware));
    } else {
      throw new Error('Middleware must be a function or have a process method');
    }
    
    if (this.config.enableLogging) {
      console.log('Middleware added to EventBus');
    }
  }

  // Применение middleware
  applyMiddleware(event, data, action) {
    let processedData = data;
    
    for (const middleware of this.middleware) {
      try {
        processedData = middleware(event, processedData, action);
      } catch (error) {
        console.error('Error in middleware:', error);
      }
    }
    
    return processedData;
  }

  // Получение количества слушателей для события
  listenerCount(event) {
    if (!this.events.has(event)) {
      return 0;
    }
    return this.events.get(event).length;
  }

  // Получение всех событий
  eventNames() {
    return Array.from(this.events.keys());
  }

  // Получение слушателей для события
  listeners(event) {
    if (!this.events.has(event)) {
      return [];
    }
    return this.events.get(event).map(listener => ({
      id: listener.id,
      callback: listener.callback,
      options: listener.options
    }));
  }

  // Проверка наличия слушателей для события
  hasListeners(event) {
    return this.listenerCount(event) > 0;
  }

  // Получение метрик
  getMetrics() {
    if (!this.config.enableMetrics) {
      return null;
    }
    
    return {
      totalEvents: this.metrics.totalEvents,
      totalListeners: this.metrics.totalListeners,
      eventsByType: Object.fromEntries(this.metrics.eventsByType),
      config: { ...this.config }
    };
  }

  // Сброс метрик
  resetMetrics() {
    this.metrics = {
      totalEvents: 0,
      totalListeners: 0,
      eventsByType: new Map()
    };
    
    if (this.config.enableLogging) {
      console.log('EventBus metrics reset');
    }
  }

  // Обновление метрик
  updateMetrics(action, event, count = 1) {
    if (!this.config.enableMetrics) {
      return;
    }
    
    switch (action) {
      case 'add':
        this.metrics.totalListeners += count;
        this.metrics.eventsByType.set(event, (this.metrics.eventsByType.get(event) || 0) + count);
        break;
      case 'remove':
        this.metrics.totalListeners = Math.max(0, this.metrics.totalListeners - count);
        const currentCount = this.metrics.eventsByType.get(event) || 0;
        const newCount = Math.max(0, currentCount - count);
        if (newCount === 0) {
          this.metrics.eventsByType.delete(event);
        } else {
          this.metrics.eventsByType.set(event, newCount);
        }
        break;
      case 'emit':
        this.metrics.totalEvents += count;
        break;
    }
  }

  // Генерация уникального ID для слушателя
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Обновление конфигурации
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enableLogging) {
      console.log('EventBus configuration updated:', this.config);
    }
  }

  // Получение конфигурации
  getConfig() {
    return { ...this.config };
  }

  // Очистка ресурсов
  destroy() {
    this.offAllEvents();
    this.middleware = [];
    this.resetMetrics();
    
    if (this.config.enableLogging) {
      console.log('EventBus destroyed');
    }
  }
}

// Создание глобального экземпляра EventBus
const globalEventBus = new EventBus();

// Middleware для логирования
const loggingMiddleware = {
  name: 'logging',
  process: (event, data, action) => {
    if (globalEventBus.config.enableLogging) {
      console.log(`[EventBus] ${action.toUpperCase()}: ${event}`, data);
    }
    return data;
  }
};

// Middleware для валидации
const validationMiddleware = {
  name: 'validation',
  process: (event, data, action) => {
    // Базовая валидация событий
    if (typeof event !== 'string' || event.trim() === '') {
      throw new Error('Event name must be a non-empty string');
    }
    
    return data;
  }
};

// Middleware для трансформации данных
const transformMiddleware = {
  name: 'transform',
  process: (event, data, action) => {
    // Добавление метаданных к данным
    if (data && typeof data === 'object') {
      return {
        ...data,
        _metadata: {
          event,
          action,
          timestamp: Date.now(),
          source: 'EventBus'
        }
      };
    }
    
    return data;
  }
};

// Добавление стандартных middleware
globalEventBus.use(loggingMiddleware);
globalEventBus.use(validationMiddleware);
globalEventBus.use(transformMiddleware);

// Экспорт
export { EventBus, globalEventBus };
export default EventBus; 