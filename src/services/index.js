/**
 * Центральный файл для экспорта всех сервисов
 * Устраняет дублирование и обеспечивает единую точку входа
 */

// Основные сервисы
export { default as cacheService } from './cache-service.js';
export { default as notificationService } from './notificationService.js';
export { default as syncService } from './syncService.js';
export { default as websocketService } from './websocket-service.js';
export { default as taskServiceIntegration } from './task-service-integration.js';

// Новые интеграционные сервисы
export { default as authServiceIntegration } from './auth-service-integration.js';
export { default as aiServiceIntegration } from './ai-service-integration.js';
export { default as voiceAssistantIntegration } from './voice-assistant-integration.js';
export { default as documentsServiceIntegration } from './documents-service-integration.js';

// Специализированные сервисы
export { default as activityService } from './activity-service.js';
export { default as auditService } from './audit-service.js';
export { default as metricsService } from './metricsService.js';

// Утилитарные сервисы
export { default as errorService } from './error-service.js';
export { default as validationService } from './validation-service.js';
export { default as settingsService } from './settings.js';

// Конфигурация
export * from '../config/task-service.js';
export * from '../config/auth-service.js';
export * from '../config/ai-service.js';
export * from '../config/voice-assistant.js';
export * from '../config/documents-service.js';

// Создаем единый объект для глобального доступа
const services = {
  cache: null,
  notifications: null,
  sync: null,
  websocket: null,
  taskIntegration: null,
  authIntegration: null, // Добавлен новый сервис
  activity: null,
  audit: null,
  metrics: null,
  error: null,
  validation: null,
  settings: null
};

// Функция инициализации всех сервисов
export const initializeServices = async () => {
  try {
    console.log('Инициализация сервисов...');

    // Инициализируем основные сервисы
    const cacheModule = await import('./cache-service.js');
    services.cache = cacheModule.default;

    const notificationModule = await import('./notificationService.js');
    services.notifications = notificationModule.default;

    const syncModule = await import('./syncService.js');
    services.sync = syncModule.default;

    const websocketModule = await import('./websocket-service.js');
    services.websocket = websocketModule.default;

    const taskIntegrationModule = await import('./task-service-integration.js');
    services.taskIntegration = taskIntegrationModule.default;

    // Инициализируем новый интеграционный сервис auth-service
    const authIntegrationModule = await import('./auth-service-integration.js');
    services.authIntegration = authIntegrationModule.default;

    // Инициализируем новые интеграционные сервисы
    const aiIntegrationModule = await import('./ai-service-integration.js');
    services.aiIntegration = aiIntegrationModule.default;

    const voiceAssistantModule = await import('./voice-assistant-integration.js');
    services.voiceAssistant = voiceAssistantModule.default;

    const documentsModule = await import('./documents-service-integration.js');
    services.documents = documentsModule.default;

    // Инициализируем специализированные сервисы
    const activityModule = await import('./activity-service.js');
    services.activity = activityModule.default;

    const auditModule = await import('./audit-service.js');
    services.audit = auditModule.default;

    const metricsModule = await import('./metricsService.js');
    services.metrics = metricsModule.default;

    // Инициализируем утилитарные сервисы
    const errorModule = await import('./error-service.js');
    services.error = errorModule.default;

    const validationModule = await import('./validation-service.js');
    services.validation = validationModule.default;

    // Инициализируем упрощенный сервис настроек
    const settingsModule = await import('./settings.js');
    services.settings = settingsModule.default;

    console.log('Все сервисы инициализированы');
    return services;

  } catch (error) {
    console.error('Ошибка инициализации сервисов:', error);
    throw error;
  }
};

// Функция получения сервиса по имени
export const getService = (serviceName) => {
  return services[serviceName] || null;
};

// Функция проверки статуса сервисов
export const getServicesStatus = () => {
  const status = {};

  Object.keys(services).forEach(serviceName => {
    const service = services[serviceName];
    status[serviceName] = {
      loaded: !!service,
      status: service?.getStatus ? service.getStatus() : 'unknown'
    };
  });

  return status;
};

// Функция для получения всех доступных сервисов
export const getAllServices = () => {
  return { ...services };
};

// Функция проверки совместимости всех сервисов
export const checkServicesCompatibility = async () => {
  const compatibility = {};
  
  try {
    // Проверяем task-service
    if (services.taskIntegration) {
      compatibility.taskService = await services.taskIntegration.checkConnection();
    }

    // Проверяем auth-service
    if (services.authIntegration) {
      compatibility.authService = await services.authIntegration.checkHealth();
    }

    // Проверяем cache-service
    if (services.cache) {
      compatibility.cacheService = {
        healthy: true,
        status: services.cache.getStatus()
      };
    }

    // Проверяем websocket-service
    if (services.websocket) {
      compatibility.websocketService = {
        healthy: services.websocket.isConnected,
        status: services.websocket.getStatus()
      };
    }

    return {
      success: true,
      compatibility,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      compatibility,
      timestamp: new Date().toISOString()
    };
  }
};

// Функция для получения информации о всех сервисах
export const getServicesInfo = async () => {
  const info = {};
  
  try {
    // Получаем информацию о task-service
    if (services.taskIntegration) {
      info.taskService = await services.taskIntegration.getServiceInfo();
    }

    // Получаем информацию о auth-service
    if (services.authIntegration) {
      info.authService = await services.authIntegration.getStatus();
    }

    // Получаем информацию о других сервисах
    Object.keys(services).forEach(serviceName => {
      const service = services[serviceName];
      if (service && service.getStatus) {
        info[serviceName] = service.getStatus();
      }
    });

    return {
      success: true,
      info,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      info,
      timestamp: new Date().toISOString()
    };
  }
};

// Экспортируем объект сервисов для глобального доступа
export default services; 