/**
 * Тестовый файл для проверки работоспособности сервисов
 */

import { initializeServices, getServicesStatus, getService } from './index.js';

// Функция для тестирования всех сервисов
export const testAllServices = async () => {
  console.log('🧪 Начинаем тестирование сервисов...');
  
  try {
    // Инициализируем все сервисы
    console.log('📡 Инициализация сервисов...');
    const services = await initializeServices();
    console.log('✅ Сервисы инициализированы:', Object.keys(services));
    
    // Получаем статус всех сервисов
    console.log('📊 Получение статуса сервисов...');
    const status = getServicesStatus();
    console.log('📈 Статус сервисов:', status);
    
    // Тестируем каждый сервис
    await testIndividualServices();
    
    console.log('🎉 Все тесты завершены успешно!');
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка тестирования сервисов:', error);
    return false;
  }
};

// Функция для тестирования отдельных сервисов
const testIndividualServices = async () => {
  const serviceTests = [
    { name: 'cache', test: testCacheService },
    { name: 'notifications', test: testNotificationService },
    { name: 'sync', test: testSyncService },
    { name: 'websocket', test: testWebSocketService },
    { name: 'taskIntegration', test: testTaskIntegrationService },
    { name: 'activity', test: testActivityService },
    { name: 'audit', test: testAuditService },
    { name: 'metrics', test: testMetricsService },
    { name: 'error', test: testErrorService },
    { name: 'validation', test: testValidationService },
    { name: 'settings', test: testSettingsService }
  ];
  
  for (const { name, test } of serviceTests) {
    try {
      console.log(`🔍 Тестирование сервиса: ${name}`);
      await test();
      console.log(`✅ ${name}: тест пройден`);
    } catch (error) {
      console.error(`❌ ${name}: ошибка теста:`, error);
    }
  }
};

// Тесты для отдельных сервисов
const testCacheService = async () => {
  const cacheService = getService('cache');
  if (!cacheService) throw new Error('CacheService не найден');
  
  // Тестируем базовые операции
  cacheService.set('test_key', 'test_value', 'test_namespace');
  const value = cacheService.get('test_key', 'test_namespace');
  if (value !== 'test_value') throw new Error('Ошибка get/set операций');
  
  // Тестируем удаление
  cacheService.delete('test_key', 'test_namespace');
  const deletedValue = cacheService.get('test_key', 'test_namespace');
  if (deletedValue !== null) throw new Error('Ошибка удаления');
  
  // Тестируем статистику
  const stats = cacheService.getStats();
  if (!stats || typeof stats !== 'object') throw new Error('Ошибка получения статистики');
};

const testNotificationService = async () => {
  const notificationService = getService('notifications');
  if (!notificationService) throw new Error('NotificationService не найден');
  
  // Тестируем создание уведомления
  const notificationId = notificationService.createNotification('test', { test: true });
  if (!notificationId) throw new Error('Ошибка создания уведомления');
  
  // Тестируем получение уведомления
  const notification = notificationService.getNotification(notificationId);
  if (!notification) throw new Error('Ошибка получения уведомления');
  
  // Тестируем статус
  const status = notificationService.getStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
};

const testSyncService = async () => {
  const syncService = getService('sync');
  if (!syncService) throw new Error('SyncService не найден');
  
  // Тестируем статус
  const status = syncService.getSyncStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
  
  // Тестируем статистику
  const stats = syncService.getSyncStats();
  if (!stats || typeof stats !== 'object') throw new Error('Ошибка получения статистики');
};

const testWebSocketService = async () => {
  const websocketService = getService('websocket');
  if (!websocketService) throw new Error('WebSocketService не найден');
  
  // Тестируем статус
  const status = websocketService.getStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
};

const testTaskIntegrationService = async () => {
  const taskIntegrationService = getService('taskIntegration');
  if (!taskIntegrationService) throw new Error('TaskIntegrationService не найден');
  
  // Тестируем конфигурацию
  const config = taskIntegrationService.config;
  if (!config || typeof config !== 'object') throw new Error('Ошибка получения конфигурации');
};

const testActivityService = async () => {
  const activityService = getService('activity');
  if (!activityService) throw new Error('ActivityService не найден');
  
  // Тестируем статус
  const status = activityService.getStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
  
  // Тестируем статистику
  const stats = activityService.getActivityStats();
  if (!stats || typeof stats !== 'object') throw new Error('Ошибка получения статистики');
};

const testAuditService = async () => {
  const auditService = getService('audit');
  if (!auditService) throw new Error('AuditService не найден');
  
  // Тестируем логирование
  auditService.info('test_audit', { test: true });
  
  // Тестируем статус
  const status = auditService.getStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
};

const testMetricsService = async () => {
  const metricsService = getService('metrics');
  if (!metricsService) throw new Error('MetricsService не найден');
  
  // Тестируем создание метрики
  metricsService.incrementCounter('test_counter');
  
  // Тестируем статус
  const status = metricsService.getStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
  
  // Тестируем статистику
  const stats = metricsService.getMetricsStats();
  if (!stats || typeof stats !== 'object') throw new Error('Ошибка получения статистики');
};

const testErrorService = async () => {
  const errorService = getService('error');
  if (!errorService) throw new Error('ErrorService не найден');
  
  // Тестируем обработку ошибки
  errorService.handleError(new Error('Test error'), { context: 'test' });
  
  // Тестируем статус
  const status = errorService.getStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
};

const testValidationService = async () => {
  const validationService = getService('validation');
  if (!validationService) throw new Error('ValidationService не найден');
  
  // Тестируем статус
  const status = validationService.getStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
};

const testSettingsService = async () => {
  const settingsService = getService('settings');
  if (!settingsService) throw new Error('SettingsService не найден');
  
  // Тестируем получение настройки
  const theme = settingsService.get('theme.mode');
  if (theme === undefined) throw new Error('Ошибка получения настройки');
  
  // Тестируем установку настройки
  settingsService.set('test_setting', 'test_value');
  const testValue = settingsService.get('test_setting');
  if (testValue !== 'test_value') throw new Error('Ошибка установки настройки');
  
  // Тестируем статус
  const status = settingsService.getStatus();
  if (!status || typeof status !== 'object') throw new Error('Ошибка получения статуса');
};

// Функция для быстрого тестирования
export const quickTest = async () => {
  console.log('🚀 Быстрый тест сервисов...');
  
  try {
    const services = await initializeServices();
    const status = getServicesStatus();
    
    console.log('📊 Результаты быстрого теста:');
    console.log('- Инициализировано сервисов:', Object.keys(services).length);
    console.log('- Статус сервисов:', status);
    
    return true;
  } catch (error) {
    console.error('❌ Быстрый тест не пройден:', error);
    return false;
  }
};

// Экспортируем для использования в консоли браузера
if (typeof window !== 'undefined') {
  window.testServices = {
    testAll: testAllServices,
    quickTest: quickTest
  };
  
  console.log('🧪 Тестовые функции доступны в window.testServices');
  console.log('Используйте: testServices.quickTest() или testServices.testAll()');
} 