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

// Специализированные сервисы
export { default as activityService } from './activity-service.js';
export { default as auditService } from './audit-service.js';
export { default as metricsService } from './metricsService.js';

// Утилитарные сервисы
export { default as errorService } from './error-service.js';
export { default as validationService } from './validation-service.js';

// Упрощенный сервис настроек
export { default as settingsService } from './settings.js';

// Конфигурация
export * from '../config/task-service.js';

// Создаем единый объект для глобального доступа
const services = {
  cache: null,
  notifications: null,
  sync: null,
  websocket: null,
  taskIntegration: null,
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

// Экспортируем объект сервисов для глобального доступа
export default services; 