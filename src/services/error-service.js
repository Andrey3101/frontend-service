/**
 * Сервис обработки ошибок для task-service
 * Обеспечивает централизованную обработку и логирование ошибок
 */

import notificationService from './notificationService.js';
import metricsService from './metricsService.js';

class ErrorService {
  constructor() {
    this.errorHandlers = new Map();
    this.errorCounts = new Map();
    this.errorHistory = [];
    this.maxHistorySize = 100;
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    // Регистрируем глобальные обработчики ошибок
    this.setupGlobalErrorHandlers();
    
    // Регистрируем встроенные обработчики ошибок
    this.registerBuiltInErrorHandlers();
    
    this.isInitialized = true;
    console.log('ErrorService: инициализирован');
  }

  /**
   * Настраивает глобальные обработчики ошибок
   */
  setupGlobalErrorHandlers() {
    // Обработчик JavaScript ошибок
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event.message, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Обработчик необработанных Promise отклонений
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'promise',
        stack: event.reason?.stack
      });
    });

    // Обработчик ошибок загрузки ресурсов
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError(`Ошибка загрузки ресурса: ${event.target.src || event.target.href}`, {
          type: 'resource',
          element: event.target.tagName,
          src: event.target.src || event.target.href
        });
      }
    }, true);

    // Обработчик ошибок fetch
    this.interceptFetchErrors();
  }

  /**
   * Перехватывает ошибки fetch запросов
   */
  interceptFetchErrors() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Проверяем статус ответа
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          
          this.handleError(error, {
            type: 'fetch',
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }
        
        return response;
      } catch (error) {
        this.handleError(error, {
          type: 'fetch',
          url: args[0]
        });
        throw error;
      }
    };
  }

  /**
   * Регистрирует встроенные обработчики ошибок
   */
  registerBuiltInErrorHandlers() {
    // Обработчик ошибок валидации
    this.registerErrorHandler('validation', (error, context) => {
      console.warn('Validation Error:', error);
      
      // Показываем уведомление пользователю
      if (context.field) {
        notificationService.showToast(
          `Ошибка валидации поля "${context.field}": ${error.message}`,
          'warning'
        );
      } else {
        notificationService.showToast(
          `Ошибка валидации: ${error.message}`,
          'warning'
        );
      }
      
      // Записываем метрику
      metricsService.recordError(error, 'validation');
    });

    // Обработчик ошибок API
    this.registerErrorHandler('api', (error, context) => {
      console.error('API Error:', error);
      
      let message = 'Ошибка API';
      
      if (error.status) {
        switch (error.status) {
          case 400:
            message = 'Некорректный запрос';
            break;
          case 401:
            message = 'Необходима авторизация';
            break;
          case 403:
            message = 'Доступ запрещен';
            break;
          case 404:
            message = 'Ресурс не найден';
            break;
          case 422:
            message = 'Ошибка валидации данных';
            break;
          case 429:
            message = 'Слишком много запросов';
            break;
          case 500:
            message = 'Внутренняя ошибка сервера';
            break;
          case 502:
            message = 'Сервис временно недоступен';
            break;
          case 503:
            message = 'Сервис перегружен';
            break;
          default:
            message = `Ошибка ${error.status}`;
        }
      } else if (error.message) {
        message = error.message;
      }
      
      // Показываем уведомление пользователю
      notificationService.showToast(message, 'error');
      
      // Записываем метрику
      metricsService.recordError(error, 'api');
    });

    // Обработчик ошибок сети
    this.registerErrorHandler('network', (error, context) => {
      console.error('Network Error:', error);
      
      notificationService.showToast(
        'Ошибка сети. Проверьте подключение к интернету.',
        'error'
      );
      
      // Записываем метрику
      metricsService.recordError(error, 'network');
    });

    // Обработчик ошибок аутентификации
    this.registerErrorHandler('authentication', (error, context) => {
      console.warn('Authentication Error:', error);
      
      notificationService.showToast(
        'Ошибка аутентификации. Войдите в систему заново.',
        'warning'
      );
      
      // Перенаправляем на страницу входа
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
      // Записываем метрику
      metricsService.recordError(error, 'authentication');
    });

    // Обработчик ошибок авторизации
    this.registerErrorHandler('authorization', (error, context) => {
      console.warn('Authorization Error:', error);
      
      notificationService.showToast(
        'Недостаточно прав для выполнения действия.',
        'warning'
      );
      
      // Записываем метрику
      metricsService.recordError(error, 'authorization');
    });

    // Обработчик ошибок синхронизации
    this.registerErrorHandler('sync', (error, context) => {
      console.error('Sync Error:', error);
      
      notificationService.showToast(
        'Ошибка синхронизации данных. Попробуйте позже.',
        'warning'
      );
      
      // Записываем метрику
      metricsService.recordError(error, 'sync');
    });

    // Обработчик ошибок WebSocket
    this.registerErrorHandler('websocket', (error, context) => {
      console.error('WebSocket Error:', error);
      
      notificationService.showToast(
        'Ошибка соединения в реальном времени.',
        'warning'
      );
      
      // Записываем метрику
      metricsService.recordError(error, 'websocket');
    });

    // Обработчик ошибок кэша
    this.registerErrorHandler('cache', (error, context) => {
      console.warn('Cache Error:', error);
      
      // Записываем метрику
      metricsService.recordError(error, 'cache');
    });

    // Обработчик ошибок метрик
    this.registerErrorHandler('metrics', (error, context) => {
      console.warn('Metrics Error:', error);
      
      // Не показываем пользователю ошибки метрик
      // Записываем в консоль для отладки
    });
  }

  /**
   * Регистрирует обработчик ошибок
   */
  registerErrorHandler(type, handler) {
    this.errorHandlers.set(type, handler);
  }

  /**
   * Обрабатывает ошибку
   */
  handleError(error, context = {}) {
    try {
      // Определяем тип ошибки
      const errorType = this.determineErrorType(error, context);
      
      // Создаем объект ошибки
      const errorInfo = this.createErrorInfo(error, errorType, context);
      
      // Добавляем в историю
      this.addToHistory(errorInfo);
      
      // Увеличиваем счетчик
      this.incrementErrorCount(errorType);
      
      // Вызываем соответствующий обработчик
      const handler = this.errorHandlers.get(errorType);
      if (handler) {
        handler(error, context);
      } else {
        // Используем обработчик по умолчанию
        this.handleDefaultError(error, context);
      }
      
      // Логируем ошибку
      this.logError(errorInfo);
      
      // Отправляем в аналитику если настроено
      this.sendToAnalytics(errorInfo);
      
    } catch (handlerError) {
      console.error('ErrorService: ошибка в обработчике ошибок:', handlerError);
    }
  }

  /**
   * Определяет тип ошибки
   */
  determineErrorType(error, context) {
    // Если тип уже определен в контексте
    if (context.type) {
      return context.type;
    }
    
    // Определяем по содержимому ошибки
    if (error instanceof TypeError) {
      return 'type';
    } else if (error instanceof ReferenceError) {
      return 'reference';
    } else if (error instanceof SyntaxError) {
      return 'syntax';
    } else if (error instanceof RangeError) {
      return 'range';
    } else if (error instanceof URIError) {
      return 'uri';
    } else if (error instanceof EvalError) {
      return 'eval';
    }
    
    // Определяем по сообщению
    const message = error.message || error.toString();
    
    if (message.includes('fetch') || message.includes('HTTP')) {
      return 'api';
    } else if (message.includes('network') || message.includes('connection')) {
      return 'network';
    } else if (message.includes('auth') || message.includes('login')) {
      return 'authentication';
    } else if (message.includes('permission') || message.includes('access')) {
      return 'authorization';
    } else if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    } else if (message.includes('sync') || message.includes('synchronization')) {
      return 'sync';
    } else if (message.includes('websocket') || message.includes('socket')) {
      return 'websocket';
    } else if (message.includes('cache') || message.includes('storage')) {
      return 'cache';
    }
    
    return 'unknown';
  }

  /**
   * Создает информационный объект ошибки
   */
  createErrorInfo(error, type, context) {
    return {
      id: this.generateErrorId(),
      type,
      message: error.message || error.toString(),
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
      severity: this.determineSeverity(type, context),
      handled: false
    };
  }

  /**
   * Определяет серьезность ошибки
   */
  determineSeverity(type, context) {
    const severityMap = {
      'authentication': 'high',
      'authorization': 'high',
      'api': 'medium',
      'network': 'medium',
      'sync': 'medium',
      'validation': 'low',
      'cache': 'low',
      'metrics': 'low'
    };
    
    return severityMap[type] || 'medium';
  }

  /**
   * Генерирует уникальный ID ошибки
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Добавляет ошибку в историю
   */
  addToHistory(errorInfo) {
    this.errorHistory.unshift(errorInfo);
    
    // Ограничиваем размер истории
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Увеличивает счетчик ошибок
   */
  incrementErrorCount(type) {
    const currentCount = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, currentCount + 1);
  }

  /**
   * Обработчик ошибок по умолчанию
   */
  handleDefaultError(error, context) {
    console.error('Unhandled Error:', error, context);
    
    // Показываем общее уведомление
    notificationService.showToast(
      'Произошла ошибка. Попробуйте обновить страницу.',
      'error'
    );
  }

  /**
   * Логирует ошибку
   */
  logError(errorInfo) {
    const logLevel = this.getLogLevel(errorInfo.severity);
    const logMessage = `[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, errorInfo);
        break;
      case 'warn':
        console.warn(logMessage, errorInfo);
        break;
      case 'info':
        console.info(logMessage, errorInfo);
        break;
      default:
        console.log(logMessage, errorInfo);
    }
  }

  /**
   * Получает уровень логирования
   */
  getLogLevel(severity) {
    const levelMap = {
      'high': 'error',
      'medium': 'warn',
      'low': 'info'
    };
    
    return levelMap[severity] || 'log';
  }

  /**
   * Отправляет ошибку в аналитику
   */
  sendToAnalytics(errorInfo) {
    // Здесь должна быть интеграция с аналитическими сервисами
    // Пока просто логируем
    if (errorInfo.severity === 'high') {
      console.log('ErrorService: отправка критической ошибки в аналитику:', errorInfo);
    }
  }

  /**
   * Методы для работы с ошибками
   */

  /**
   * Создает пользовательскую ошибку
   */
  createError(message, type = 'custom', context = {}) {
    const error = new Error(message);
    error.type = type;
    error.context = context;
    
    this.handleError(error, context);
    return error;
  }

  /**
   * Создает ошибку валидации
   */
  createValidationError(message, field = null, context = {}) {
    return this.createError(message, 'validation', {
      field,
      ...context
    });
  }

  /**
   * Создает ошибку API
   */
  createApiError(message, status = null, url = null, context = {}) {
    return this.createError(message, 'api', {
      status,
      url,
      ...context
    });
  }

  /**
   * Создает ошибку сети
   */
  createNetworkError(message, context = {}) {
    return this.createError(message, 'network', context);
  }

  /**
   * Создает ошибку аутентификации
   */
  createAuthenticationError(message, context = {}) {
    return this.createError(message, 'authentication', context);
  }

  /**
   * Создает ошибку авторизации
   */
  createAuthorizationError(message, context = {}) {
    return this.createError(message, 'authorization', context);
  }

  /**
   * Обрабатывает ошибку с повторными попытками
   */
  async handleErrorWithRetry(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.warn(`ErrorService: попытка ${attempt} не удалась, повтор через ${delay}ms`);
          await this.delay(delay);
          delay *= 2; // Экспоненциальная задержка
        }
      }
    }
    
    // Все попытки исчерпаны
    this.handleError(lastError, {
      type: 'retry_exhausted',
      maxRetries,
      operation: operation.name || 'unknown'
    });
    
    throw lastError;
  }

  /**
   * Задержка выполнения
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Обрабатывает ошибку с fallback
   */
  handleErrorWithFallback(operation, fallback, context = {}) {
    try {
      return operation();
    } catch (error) {
      this.handleError(error, context);
      return fallback;
    }
  }

  /**
   * Асинхронная обработка ошибок с fallback
   */
  async handleAsyncErrorWithFallback(operation, fallback, context = {}) {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      return fallback;
    }
  }

  /**
   * Получает статистику ошибок
   */
  getErrorStats() {
    const stats = {
      total: 0,
      byType: {},
      bySeverity: {
        high: 0,
        medium: 0,
        low: 0
      },
      recent: this.errorHistory.slice(0, 10)
    };
    
    // Подсчитываем общее количество
    this.errorCounts.forEach((count, type) => {
      stats.total += count;
      stats.byType[type] = count;
    });
    
    // Подсчитываем по серьезности
    this.errorHistory.forEach(error => {
      stats.bySeverity[error.severity]++;
    });
    
    return stats;
  }

  /**
   * Получает ошибки по типу
   */
  getErrorsByType(type) {
    return this.errorHistory.filter(error => error.type === type);
  }

  /**
   * Получает ошибки по серьезности
   */
  getErrorsBySeverity(severity) {
    return this.errorHistory.filter(error => error.severity === severity);
  }

  /**
   * Получает ошибки за период
   */
  getErrorsByPeriod(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.errorHistory.filter(error => {
      const errorTime = new Date(error.timestamp).getTime();
      return errorTime >= start && errorTime <= end;
    });
  }

  /**
   * Очищает историю ошибок
   */
  clearErrorHistory() {
    this.errorHistory = [];
    console.log('ErrorService: история ошибок очищена');
  }

  /**
   * Сбрасывает счетчики ошибок
   */
  resetErrorCounts() {
    this.errorCounts.clear();
    console.log('ErrorService: счетчики ошибок сброшены');
  }

  /**
   * Получает статус сервиса
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      errorHandlersCount: this.errorHandlers.size,
      errorHistorySize: this.errorHistory.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      stats: this.getErrorStats()
    };
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    this.errorHandlers.clear();
    this.errorCounts.clear();
    this.errorHistory = [];
    
    console.log('ErrorService: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const errorService = new ErrorService();

export default errorService; 