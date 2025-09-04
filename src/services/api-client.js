/**
 * Единый API клиент для всех сервисов
 * Обеспечивает централизованную обработку ошибок, автоматическое обновление токенов,
 * retry механизмы, кэширование и безопасность
 */

import axios from 'axios';
import { encrypt, decrypt } from '../utils/encryption.js';

class ApiClient {
  constructor() {
    this.config = this.getConfig();
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.retryQueue = [];
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  /**
   * Получение конфигурации для разных окружений
   */
  getConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    const baseConfig = {
      development: {
        baseURL: 'http://localhost:8000',
        timeout: 15000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableLogging: true,
        enableMetrics: true,
        cacheTTL: 5 * 60 * 1000, // 5 минут
        enableCSRF: true
      },
      staging: {
        baseURL: 'https://staging-api.msb-platform.ru',
        timeout: 20000,
        retryAttempts: 5,
        retryDelay: 2000,
        enableLogging: true,
        enableMetrics: true,
        cacheTTL: 10 * 60 * 1000, // 10 минут
        enableCSRF: true
      },
      production: {
        baseURL: 'https://api.msb-platform.ru',
        timeout: 25000,
        retryAttempts: 3,
        retryDelay: 3000,
        enableLogging: false,
        enableMetrics: true,
        cacheTTL: 15 * 60 * 1000, // 15 минут
        enableCSRF: true
      }
    };

    const config = baseConfig[env];
    
    // Переопределяем переменными окружения
    return {
      ...config,
      baseURL: process.env.VUE_APP_API_BASE_URL || config.baseURL,
      timeout: parseInt(process.env.VUE_APP_API_TIMEOUT) || config.timeout,
      retryAttempts: parseInt(process.env.VUE_APP_API_RETRY_ATTEMPTS) || config.retryAttempts,
      retryDelay: parseInt(process.env.VUE_APP_API_RETRY_DELAY) || config.retryDelay,
      enableLogging: process.env.VUE_APP_API_ENABLE_LOGGING !== 'false' && config.enableLogging,
      enableMetrics: process.env.VUE_APP_API_ENABLE_METRICS !== 'false' && config.enableMetrics,
      cacheTTL: parseInt(process.env.VUE_APP_API_CACHE_TTL) || config.cacheTTL,
      enableCSRF: process.env.VUE_APP_API_ENABLE_CSRF !== 'false' && config.enableCSRF
    };
  }

  /**
   * Создание экземпляра axios с оптимизированными настройками
   */
  createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      // Настройки connection pooling
      httpAgent: new (require('http').Agent)({
        keepAlive: true,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 60000
      }),
      httpsAgent: new (require('https').Agent)({
        keepAlive: true,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 60000
      })
    });

    return instance;
  }

  /**
   * Настройка перехватчиков
   */
  setupInterceptors() {
    // Перехватчик запросов
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Добавляем токен авторизации
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Добавляем CSRF токен
        if (this.config.enableCSRF) {
          const csrfToken = this.getCSRFToken();
          if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
          }
        }

        // Добавляем заголовки для метрик
        if (this.config.enableMetrics) {
          config.headers['X-Request-ID'] = this.generateRequestId();
          config.headers['X-Client-Version'] = process.env.VUE_APP_VERSION || '1.0.0';
        }

        // Логирование запросов
        if (this.config.enableLogging) {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data
          });
        }

        return config;
      },
      (error) => {
        if (this.config.enableLogging) {
          console.error('API Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Перехватчик ответов
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Логирование успешных ответов
        if (this.config.enableLogging) {
          console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data
          });
        }

        // Обновляем метрики
        if (this.config.enableMetrics) {
          this.updateMetrics('success', response.config.url, response.status);
        }

        return response;
      },
      async (error) => {
        // Логирование ошибок
        if (this.config.enableLogging) {
          console.error('API Response Error:', {
            method: error.config?.method,
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }

        // Обновляем метрики
        if (this.config.enableMetrics) {
          this.updateMetrics('error', error.config?.url, error.response?.status);
        }

        // Обрабатываем различные типы ошибок
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              await this.handleUnauthorized(error);
              break;
            case 403:
              this.handleForbidden(error);
              break;
            case 404:
              this.handleNotFound(error);
              break;
            case 422:
              this.handleValidationError(error);
              break;
            case 429:
              await this.handleRateLimit(error);
              break;
            case 500:
              this.handleServerError(error);
              break;
            default:
              this.handleGenericError(error);
          }
        } else if (error.request) {
          this.handleNetworkError(error);
        } else {
          this.handleRequestError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Основной метод для выполнения запросов
   */
  async request(options) {
    const {
      method = 'GET',
      url,
      data = null,
      params = null,
      headers = {},
      cache = false,
      cacheTTL = this.config.cacheTTL,
      retry = true,
      retryAttempts = this.config.retryAttempts,
      retryDelay = this.config.retryDelay,
      optimistic = false,
      optimisticData = null
    } = options;

    // Проверяем кэш для GET запросов
    if (method === 'GET' && cache) {
      const cachedResponse = this.getFromCache(url, params);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Проверяем дублирующиеся запросы
    const requestKey = this.generateRequestKey(method, url, params, data);
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    // Создаем промис для запроса
    const requestPromise = this.executeRequest({
      method,
      url,
      data,
      params,
      headers,
      retry,
      retryAttempts,
      retryDelay,
      optimistic,
      optimisticData
    });

    // Сохраняем промис для предотвращения дублирующихся запросов
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;
      
      // Кэшируем успешные GET ответы
      if (method === 'GET' && cache && response.success) {
        this.setCache(url, params, response.data, cacheTTL);
      }

      return response;
    } finally {
      // Удаляем промис из pending requests
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Выполнение запроса с retry механизмом
   */
  async executeRequest(options) {
    const {
      method,
      url,
      data,
      params,
      headers,
      retry,
      retryAttempts,
      retryDelay,
      optimistic,
      optimisticData
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Если это оптимистичный запрос, возвращаем данные сразу
        if (optimistic && optimisticData) {
          return {
            success: true,
            data: optimisticData,
            optimistic: true,
            cached: false
          };
        }

        const response = await this.axiosInstance.request({
          method,
          url,
          data,
          params,
          headers
        });

        return {
          success: true,
          data: response.data,
          status: response.status,
          headers: response.headers,
          optimistic: false,
          cached: false
        };

      } catch (error) {
        lastError = error;
        
        // Не повторяем запрос для определенных ошибок
        if (error.response?.status === 401 || 
            error.response?.status === 403 || 
            error.response?.status === 404 ||
            !retry) {
          break;
        }

        // Ждем перед повторной попыткой
        if (attempt < retryAttempts) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    // Все попытки исчерпаны
    throw lastError;
  }

  /**
   * GET запрос
   */
  async get(url, params = null, options = {}) {
    return this.request({
      method: 'GET',
      url,
      params,
      cache: true,
      ...options
    });
  }

  /**
   * POST запрос
   */
  async post(url, data = null, options = {}) {
    return this.request({
      method: 'POST',
      url,
      data,
      ...options
    });
  }

  /**
   * PUT запрос
   */
  async put(url, data = null, options = {}) {
    return this.request({
      method: 'PUT',
      url,
      data,
      ...options
    });
  }

  /**
   * DELETE запрос
   */
  async delete(url, options = {}) {
    return this.request({
      method: 'DELETE',
      url,
      ...options
    });
  }

  /**
   * PATCH запрос
   */
  async patch(url, data = null, options = {}) {
    return this.request({
      method: 'PATCH',
      url,
      data,
      ...options
    });
  }

  /**
   * Кэширование
   */
  getFromCache(url, params = null) {
    const key = this.generateCacheKey(url, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    // Удаляем истекший кэш
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  setCache(url, params = null, data, ttl = this.config.cacheTTL) {
    const key = this.generateCacheKey(url, params);
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Управление токенами
   */
  getAuthToken() {
    const encryptedToken = localStorage.getItem('auth_token') || 
                          sessionStorage.getItem('auth_token');
    
    if (encryptedToken) {
      try {
        return decrypt(encryptedToken);
      } catch (error) {
        console.error('Ошибка расшифровки токена:', error);
        this.clearTokens();
        return null;
      }
    }
    
    return null;
  }

  getRefreshToken() {
    const encryptedToken = localStorage.getItem('refresh_token') || 
                          sessionStorage.getItem('refresh_token');
    
    if (encryptedToken) {
      try {
        return decrypt(encryptedToken);
      } catch (error) {
        console.error('Ошибка расшифровки refresh токена:', error);
        this.clearTokens();
        return null;
      }
    }
    
    return null;
  }

  getCSRFToken() {
    return localStorage.getItem('csrf_token') || 
           sessionStorage.getItem('csrf_token') ||
           document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  }

  saveTokens(accessToken, refreshToken, csrfToken) {
    if (accessToken) {
      const encryptedToken = encrypt(accessToken);
      localStorage.setItem('auth_token', encryptedToken);
    }
    if (refreshToken) {
      const encryptedToken = encrypt(refreshToken);
      localStorage.setItem('refresh_token', encryptedToken);
    }
    if (csrfToken) {
      localStorage.setItem('csrf_token', csrfToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('csrf_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('csrf_token');
  }

  /**
   * Обновление токена
   */
  async refreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Refresh токен отсутствует');
      }

      const response = await this.axiosInstance.post('/auth/refresh', {
        refresh_token: refreshToken
      });

      const { access_token, refresh_token, csrf_token } = response.data;
      this.saveTokens(access_token, refresh_token, csrf_token);

      // Уведомляем подписчиков
      this.refreshSubscribers.forEach(resolve => resolve({
        success: true,
        accessToken: access_token,
        refreshToken: refresh_token,
        csrfToken: csrf_token
      }));
      this.refreshSubscribers = [];

      return {
        success: true,
        accessToken: access_token,
        refreshToken: refresh_token,
        csrfToken: csrf_token
      };
    } catch (error) {
      // Уведомляем подписчиков об ошибке
      this.refreshSubscribers.forEach(resolve => resolve({
        success: false,
        error: error.message
      }));
      this.refreshSubscribers = [];

      this.clearTokens();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Обработка ошибок
   */
  async handleUnauthorized(error) {
    console.log('Токен истек, пытаемся обновить...');
    
    try {
      await this.refreshToken();
      console.log('Токен успешно обновлен');
      
      // Повторяем оригинальный запрос
      const originalRequest = error.config;
      const token = this.getAuthToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }
      
      return this.axiosInstance.request(originalRequest);
    } catch (refreshError) {
      console.log('Не удалось обновить токен, перенаправляем на страницу входа');
      this.clearTokens();
      
      // Уведомляем приложение о необходимости перенаправления
      this.emit('auth:logout', { reason: 'token_refresh_failed' });
      
      throw error;
    }
  }

  handleForbidden(error) {
    console.error('Доступ запрещен');
    this.emit('auth:forbidden', { error: error.response?.data });
  }

  handleNotFound(error) {
    console.error('Ресурс не найден');
    this.emit('api:not_found', { error: error.response?.data });
  }

  handleValidationError(error) {
    console.error('Ошибка валидации:', error.response?.data);
    this.emit('api:validation_error', { error: error.response?.data });
  }

  async handleRateLimit(error) {
    console.error('Превышен лимит запросов');
    const retryAfter = error.response?.headers['retry-after'];
    
    if (retryAfter) {
      await this.delay(parseInt(retryAfter) * 1000);
    }
    
    this.emit('api:rate_limit', { retryAfter });
  }

  handleServerError(error) {
    console.error('Ошибка сервера:', error.response?.data);
    this.emit('api:server_error', { error: error.response?.data });
  }

  handleGenericError(error) {
    console.error(`HTTP ${error.response?.status}:`, error.response?.data);
    this.emit('api:generic_error', { 
      status: error.response?.status,
      error: error.response?.data 
    });
  }

  handleNetworkError(error) {
    console.error('Ошибка сети');
    this.emit('api:network_error', { error: error.message });
  }

  handleRequestError(error) {
    console.error('Ошибка запроса:', error);
    this.emit('api:request_error', { error: error.message });
  }

  /**
   * Утилиты
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRequestKey(method, url, params, data) {
    const key = `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  generateCacheKey(url, params) {
    return `${url}:${JSON.stringify(params)}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateMetrics(type, url, status) {
    // Здесь можно добавить отправку метрик в систему мониторинга
    if (this.config.enableMetrics) {
      // Пример: отправка в Google Analytics или другую систему
      if (window.gtag) {
        window.gtag('event', 'api_request', {
          event_category: 'api',
          event_label: url,
          value: status,
          custom_parameter: type
        });
      }
    }
  }

  /**
   * Event emitter для уведомлений
   */
  emit(event, data) {
    // Уведомляем приложение о событиях
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`api:${event}`, { detail: data }));
    }
  }

  /**
   * Проверка здоровья сервиса
   */
  async checkHealth() {
    try {
      const response = await this.get('/health');
      return {
        healthy: true,
        status: response.data.status,
        timestamp: response.data.timestamp,
        version: response.data.version
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Получение статуса клиента
   */
  getStatus() {
    return {
      configured: !!this.config.baseURL,
      hasToken: !!this.getAuthToken(),
      tokenExpired: this.isTokenExpired(),
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    };
  }

  isTokenExpired() {
    const token = this.getAuthToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      return currentTime >= (expiryTime - 5 * 60 * 1000); // 5 минут до истечения
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      return true;
    }
  }
}

// Создаем и экспортируем единственный экземпляр
const apiClient = new ApiClient();

export default apiClient; 