/**
 * Менеджер сервисов с параллельной загрузкой и оптимизацией
 * Обеспечивает быструю инициализацию всех сервисов с улучшенной производительностью
 */

import apiClient from './api-client.js';
import websocketService from './websocket-service.js';
import { useAuthStore } from '../stores/auth.js';

class ServiceManager {
  constructor() {
    this.services = new Map();
    this.loadingPromises = new Map();
    this.initialized = false;
    this.initializationPromise = null;
    this.healthCheckInterval = null;
    this.performanceMetrics = {
      loadTimes: {},
      errors: {},
      lastHealthCheck: null
    };
  }

  /**
   * Инициализация всех сервисов параллельно
   */
  async initialize() {
    if (this.initialized) {
      return this.initializationPromise;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Выполнение инициализации
   */
  async performInitialization() {
    console.log('🚀 Инициализация сервисов...');
    const startTime = Date.now();

    try {
      // Параллельная загрузка всех сервисов
      const servicePromises = [
        this.initializeApiClient(),
        this.initializeWebSocket(),
        this.initializeAuthStore(),
        this.initializeCacheService(),
        this.initializeNotificationService(),
        this.initializeTaskService(),
        this.initializeDocumentService(),
        this.initializeFinancialService(),
        this.initializeBankService(),
        this.initializeAIService(),
        this.initializeSecurityService(),
        this.initializeVoiceService()
      ];

      // Ждем завершения всех сервисов
      const results = await Promise.allSettled(servicePromises);
      
      // Анализируем результаты
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      console.log(`✅ Успешно инициализировано: ${successful.length} сервисов`);
      if (failed.length > 0) {
        console.warn(`⚠️ Ошибки инициализации: ${failed.length} сервисов`);
        failed.forEach((result, index) => {
          console.error(`Сервис ${index}:`, result.reason);
        });
      }

      // Запускаем мониторинг здоровья
      this.startHealthMonitoring();

      this.initialized = true;
      const loadTime = Date.now() - startTime;
      console.log(`🎉 Инициализация завершена за ${loadTime}ms`);

      // Уведомляем о завершении инициализации
      this.emit('initialized', {
        successful: successful.length,
        failed: failed.length,
        loadTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        successful: successful.length,
        failed: failed.length,
        loadTime
      };

    } catch (error) {
      console.error('❌ Критическая ошибка инициализации:', error);
      this.emit('initialization_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Инициализация API клиента
   */
  async initializeApiClient() {
    const startTime = Date.now();
    try {
      // Проверяем здоровье API
      const health = await apiClient.checkHealth();
      this.services.set('apiClient', apiClient);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.apiClient = loadTime;
      
      console.log(`✅ API Client инициализирован за ${loadTime}ms`);
      return { service: 'apiClient', health, loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации API Client:', error);
      throw error;
    }
  }

  /**
   * Инициализация WebSocket
   */
  async initializeWebSocket() {
    const startTime = Date.now();
    try {
      await websocketService.connect();
      this.services.set('websocket', websocketService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.websocket = loadTime;
      
      console.log(`✅ WebSocket инициализирован за ${loadTime}ms`);
      return { service: 'websocket', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации WebSocket:', error);
      throw error;
    }
  }

  /**
   * Инициализация Auth Store
   */
  async initializeAuthStore() {
    const startTime = Date.now();
    try {
      const authStore = useAuthStore();
      await authStore.initializeAuth();
      this.services.set('auth', authStore);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.auth = loadTime;
      
      console.log(`✅ Auth Store инициализирован за ${loadTime}ms`);
      return { service: 'auth', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Auth Store:', error);
      throw error;
    }
  }

  /**
   * Инициализация Cache Service
   */
  async initializeCacheService() {
    const startTime = Date.now();
    try {
      const cacheService = await this.loadServiceModule('./cache-service.js');
      this.services.set('cache', cacheService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.cache = loadTime;
      
      console.log(`✅ Cache Service инициализирован за ${loadTime}ms`);
      return { service: 'cache', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Cache Service:', error);
      throw error;
    }
  }

  /**
   * Инициализация Notification Service
   */
  async initializeNotificationService() {
    const startTime = Date.now();
    try {
      const notificationService = await this.loadServiceModule('./notificationService.js');
      this.services.set('notifications', notificationService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.notifications = loadTime;
      
      console.log(`✅ Notification Service инициализирован за ${loadTime}ms`);
      return { service: 'notifications', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Notification Service:', error);
      throw error;
    }
  }

  /**
   * Инициализация Task Service
   */
  async initializeTaskService() {
    const startTime = Date.now();
    try {
      const taskService = await this.loadServiceModule('./task-service-integration.js');
      this.services.set('tasks', taskService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.tasks = loadTime;
      
      console.log(`✅ Task Service инициализирован за ${loadTime}ms`);
      return { service: 'tasks', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Task Service:', error);
      throw error;
    }
  }

  /**
   * Инициализация Document Service
   */
  async initializeDocumentService() {
    const startTime = Date.now();
    try {
      const documentService = await this.loadServiceModule('./documents-service-integration.js');
      this.services.set('documents', documentService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.documents = loadTime;
      
      console.log(`✅ Document Service инициализирован за ${loadTime}ms`);
      return { service: 'documents', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Document Service:', error);
      throw error;
    }
  }

  /**
   * Инициализация Financial Service
   */
  async initializeFinancialService() {
    const startTime = Date.now();
    try {
      const financialService = await this.loadServiceModule('./financial-service-integration.js');
      this.services.set('financial', financialService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.financial = loadTime;
      
      console.log(`✅ Financial Service инициализирован за ${loadTime}ms`);
      return { service: 'financial', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Financial Service:', error);
      throw error;
    }
  }

  /**
   * Инициализация Bank Service
   */
  async initializeBankService() {
    const startTime = Date.now();
    try {
      const bankService = await this.loadServiceModule('./bank-service-integration.js');
      this.services.set('bank', bankService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.bank = loadTime;
      
      console.log(`✅ Bank Service инициализирован за ${loadTime}ms`);
      return { service: 'bank', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Bank Service:', error);
      throw error;
    }
  }

  /**
   * Инициализация AI Service
   */
  async initializeAIService() {
    const startTime = Date.now();
    try {
      const aiService = await this.loadServiceModule('./ai-service-integration.js');
      this.services.set('ai', aiService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.ai = loadTime;
      
      console.log(`✅ AI Service инициализирован за ${loadTime}ms`);
      return { service: 'ai', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации AI Service:', error);
      throw error;
    }
  }

  /**
   * Инициализация Security Service
   */
  async initializeSecurityService() {
    const startTime = Date.now();
    try {
      const securityService = await this.loadServiceModule('./security-service-integration.js');
      this.services.set('security', securityService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.security = loadTime;
      
      console.log(`✅ Security Service инициализирован за ${loadTime}ms`);
      return { service: 'security', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Security Service:', error);
      throw error;
    }
  }

  /**
   * Инициализация Voice Service
   */
  async initializeVoiceService() {
    const startTime = Date.now();
    try {
      const voiceService = await this.loadServiceModule('./voice-assistant-integration.js');
      this.services.set('voice', voiceService);
      
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.loadTimes.voice = loadTime;
      
      console.log(`✅ Voice Service инициализирован за ${loadTime}ms`);
      return { service: 'voice', loadTime };
    } catch (error) {
      console.error('❌ Ошибка инициализации Voice Service:', error);
      throw error;
    }
  }

  /**
   * Загрузка модуля сервиса
   */
  async loadServiceModule(path) {
    try {
      const module = await import(path);
      return module.default || module;
    } catch (error) {
      console.warn(`⚠️ Не удалось загрузить модуль ${path}:`, error);
      // Возвращаем заглушку для совместимости
      return {
        getStatus: () => ({ loaded: false, error: error.message }),
        checkHealth: () => ({ healthy: false, error: error.message })
      };
    }
  }

  /**
   * Получение сервиса по имени
   */
  getService(name) {
    return this.services.get(name);
  }

  /**
   * Получение всех сервисов
   */
  getAllServices() {
    return Object.fromEntries(this.services);
  }

  /**
   * Проверка здоровья всех сервисов
   */
  async checkAllServicesHealth() {
    const healthChecks = [];
    
    for (const [name, service] of this.services) {
      try {
        if (service.checkHealth) {
          const health = await service.checkHealth();
          healthChecks.push({ name, health });
        } else {
          healthChecks.push({ name, health: { healthy: true } });
        }
      } catch (error) {
        healthChecks.push({ name, health: { healthy: false, error: error.message } });
      }
    }

    const healthy = healthChecks.filter(h => h.health.healthy);
    const unhealthy = healthChecks.filter(h => !h.health.healthy);

    this.performanceMetrics.lastHealthCheck = {
      timestamp: new Date().toISOString(),
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      total: healthChecks.length
    };

    return {
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      total: healthChecks.length,
      services: healthChecks
    };
  }

  /**
   * Запуск мониторинга здоровья
   */
  startHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.checkAllServicesHealth();
        
        if (health.unhealthy > 0) {
          console.warn(`⚠️ Обнаружены нездоровые сервисы: ${health.unhealthy}/${health.total}`);
          this.emit('health_warning', health);
        }
        
        this.emit('health_check', health);
      } catch (error) {
        console.error('❌ Ошибка проверки здоровья сервисов:', error);
      }
    }, 60000); // Проверяем каждую минуту
  }

  /**
   * Остановка мониторинга здоровья
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Получение метрик производительности
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      totalLoadTime: Object.values(this.performanceMetrics.loadTimes).reduce((sum, time) => sum + time, 0),
      averageLoadTime: Object.values(this.performanceMetrics.loadTimes).reduce((sum, time) => sum + time, 0) / Object.keys(this.performanceMetrics.loadTimes).length
    };
  }

  /**
   * Получение статуса инициализации
   */
  getInitializationStatus() {
    return {
      initialized: this.initialized,
      servicesCount: this.services.size,
      availableServices: Array.from(this.services.keys()),
      performance: this.getPerformanceMetrics()
    };
  }

  /**
   * Переинициализация сервиса
   */
  async reinitializeService(serviceName) {
    console.log(`🔄 Переинициализация сервиса: ${serviceName}`);
    
    try {
      const service = this.services.get(serviceName);
      if (service && service.reinitialize) {
        await service.reinitialize();
        console.log(`✅ Сервис ${serviceName} переинициализирован`);
        return true;
      } else {
        console.warn(`⚠️ Сервис ${serviceName} не поддерживает переинициализацию`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Ошибка переинициализации сервиса ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    this.stopHealthMonitoring();
    
    // Очищаем все сервисы
    for (const [name, service] of this.services) {
      if (service.cleanup) {
        try {
          service.cleanup();
        } catch (error) {
          console.error(`Ошибка очистки сервиса ${name}:`, error);
        }
      }
    }
    
    this.services.clear();
    this.initialized = false;
    this.initializationPromise = null;
    
    console.log('🧹 Ресурсы ServiceManager очищены');
  }

  /**
   * Event emitter
   */
  emit(event, data) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`service-manager:${event}`, { detail: data }));
    }
  }
}

// Создаем и экспортируем единственный экземпляр
const serviceManager = new ServiceManager();

export default serviceManager; 