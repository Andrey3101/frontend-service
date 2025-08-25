/**
 * Сервис синхронизации для task-service
 * Обеспечивает синхронизацию данных между frontend и backend
 */

import { getTaskServiceConfig } from '../config/task-service';
import cacheService from './cache-service';
import notificationService from './notificationService';
import auditService from './audit-service';
import activityService from './activity-service';

class SyncService {
  constructor() {
    this.config = getTaskServiceConfig();
    this.syncQueue = [];
    this.syncInProgress = false;
    this.lastSyncTime = 0;
    this.syncInterval = null;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    this.retryDelay = 5000;
    this.isOnline = navigator.onLine;
    this.pendingChanges = new Map();
    this.syncStatus = 'idle';
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncDuration: 0,
      lastSyncError: null
    };
    
    this.syncableEntities = [
      'tasks',
      'meetings',
      'contacts',
      'important_dates',
      'comments',
      'time_entries',
      'reports'
    ];
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    // Загружаем время последней синхронизации
    this.loadLastSyncTime();
    
    // Настраиваем обработчики событий
    this.setupEventListeners();
    
    // Запускаем периодическую синхронизацию
    this.startPeriodicSync();
    
    // Выполняем первоначальную синхронизацию
    this.performInitialSync();
    
    console.log('SyncService: инициализирован');
  }

  /**
   * Настраивает обработчики событий
   */
  setupEventListeners() {
    // Отслеживаем изменения в сети
    window.addEventListener('online', () => {
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      this.handleOffline();
    });
    
    // Отслеживаем изменения в видимости страницы
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.handlePageVisible();
      }
    });
    
    // Отслеживаем фокус окна
    window.addEventListener('focus', () => {
      this.handleWindowFocus();
    });
    
    // Отслеживаем изменения в кеше
    cacheService.on('cacheUpdated', (data) => {
      this.handleCacheUpdate(data);
    });
    
    // Отслеживаем новые уведомления
    notificationService.subscribe('notificationCreated', (notification) => {
      this.handleNewNotification(notification);
    });
    
    // Отслеживаем изменения в активности
    activityService.on('activityRecorded', (activity) => {
      this.handleActivityChange(activity);
    });
  }

  /**
   * Запускает периодическую синхронизацию
   */
  startPeriodicSync() {
    const syncIntervalMs = this.config.syncInterval || 5 * 60 * 1000; // 5 минут по умолчанию
    
    this.syncInterval = setInterval(() => {
      this.performPeriodicSync();
    }, syncIntervalMs);
    
    console.log(`SyncService: периодическая синхронизация запущена каждые ${syncIntervalMs / 1000} секунд`);
  }

  /**
   * Выполняет первоначальную синхронизацию
   */
  async performInitialSync() {
    try {
      this.syncStatus = 'initializing';
      this.emit('syncStarted', { type: 'initial' });
      
      // Проверяем подключение к серверу
      if (!await this.checkServerConnection()) {
        throw new Error('Сервер недоступен');
      }
      
      // Синхронизируем все сущности
      await this.syncAllEntities();
      
      this.syncStatus = 'ready';
      this.emit('syncCompleted', { type: 'initial', success: true });
      
      console.log('SyncService: первоначальная синхронизация завершена');
      
    } catch (error) {
      this.syncStatus = 'error';
      this.emit('syncCompleted', { type: 'initial', success: false, error: error.message });
      
      console.error('SyncService: ошибка первоначальной синхронизации:', error);
      
      // Планируем повторную попытку
      this.scheduleRetry();
    }
  }

  /**
   * Выполняет периодическую синхронизацию
   */
  async performPeriodicSync() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }
    
    try {
      this.syncStatus = 'syncing';
      this.emit('syncStarted', { type: 'periodic' });
      
      const startTime = Date.now();
      
      // Синхронизируем только измененные данные
      await this.syncChangedData();
      
      const duration = Date.now() - startTime;
      this.updateSyncStats(true, duration);
      
      this.syncStatus = 'ready';
      this.emit('syncCompleted', { type: 'periodic', success: true, duration });
      
      console.log(`SyncService: периодическая синхронизация завершена за ${duration}ms`);
      
    } catch (error) {
      this.updateSyncStats(false, 0, error.message);
      this.syncStatus = 'error';
      this.emit('syncCompleted', { type: 'periodic', success: false, error: error.message });
      
      console.error('SyncService: ошибка периодической синхронизации:', error);
      
      // Планируем повторную попытку
      this.scheduleRetry();
    }
  }

  /**
   * Синхронизирует все сущности
   */
  async syncAllEntities() {
    const syncPromises = this.syncableEntities.map(entity => 
      this.syncEntity(entity, { fullSync: true })
    );
    
    await Promise.all(syncPromises);
  }

  /**
   * Синхронизирует только измененные данные
   */
  async syncChangedData() {
    const syncPromises = this.syncableEntities.map(entity => 
      this.syncEntity(entity, { fullSync: false })
    );
    
    await Promise.all(syncPromises);
  }

  /**
   * Синхронизирует конкретную сущность
   */
  async syncEntity(entity, options = {}) {
    try {
      const { fullSync = false } = options;
      
      // Получаем данные с сервера
      const serverData = await this.fetchEntityData(entity, { fullSync });
      
      // Получаем локальные данные
      const localData = this.getLocalEntityData(entity);
      
      // Сравниваем и объединяем данные
      const mergedData = this.mergeEntityData(entity, localData, serverData);
      
      // Обновляем локальные данные
      this.updateLocalEntityData(entity, mergedData);
      
      // Обновляем кеш
      cacheService.set(entity, mergedData, 'sync', { ttl: 24 * 60 * 60 * 1000 }); // 24 часа
      
      // Записываем в аудит
      auditService.info('entity_synced', {
        entity,
        fullSync,
        dataCount: mergedData.length,
        timestamp: Date.now()
      });
      
      // Уведомляем о завершении синхронизации
      this.emit('entitySynced', { entity, fullSync, dataCount: mergedData.length });
      
      return mergedData;
      
    } catch (error) {
      console.error(`SyncService: ошибка синхронизации сущности ${entity}:`, error);
      
      // Записываем ошибку в аудит
      auditService.error('entity_sync_failed', {
        entity,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Получает данные сущности с сервера
   */
  async fetchEntityData(entity, options = {}) {
    const { fullSync = false } = options;
    
    const url = new URL(`${this.config.baseURL}/${entity}`);
    
    if (!fullSync && this.lastSyncTime > 0) {
      url.searchParams.set('since', this.lastSyncTime.toString());
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Получает локальные данные сущности
   */
  getLocalEntityData(entity) {
    // Сначала пытаемся получить из кеша
    let data = cacheService.get(entity, 'sync');
    
    if (!data) {
      // Если нет в кеше, пытаемся получить из localStorage
      try {
        const saved = localStorage.getItem(`sync_${entity}`);
        if (saved) {
          data = JSON.parse(saved);
        }
      } catch (error) {
        console.warn(`SyncService: ошибка загрузки локальных данных для ${entity}:`, error);
      }
    }
    
    return data || [];
  }

  /**
   * Обновляет локальные данные сущности
   */
  updateLocalEntityData(entity, data) {
    // Сохраняем в localStorage
    try {
      localStorage.setItem(`sync_${entity}`, JSON.stringify(data));
    } catch (error) {
      console.warn(`SyncService: ошибка сохранения локальных данных для ${entity}:`, error);
    }
  }

  /**
   * Объединяет локальные и серверные данные
   */
  mergeEntityData(entity, localData, serverData) {
    if (!Array.isArray(localData) || !Array.isArray(serverData)) {
      return serverData || localData || [];
    }
    
    // Создаем Map для быстрого поиска
    const localMap = new Map();
    const serverMap = new Map();
    
    localData.forEach(item => {
      if (item.id) {
        localMap.set(item.id, item);
      }
    });
    
    serverData.forEach(item => {
      if (item.id) {
        serverMap.set(item.id, item);
      }
    });
    
    // Объединяем данные
    const merged = new Map();
    
    // Добавляем все локальные данные
    localMap.forEach((item, id) => {
      merged.set(id, item);
    });
    
    // Обновляем/добавляем серверные данные
    serverMap.forEach((serverItem, id) => {
      const localItem = merged.get(id);
      
      if (!localItem || this.isServerDataNewer(serverItem, localItem)) {
        merged.set(id, serverItem);
      }
    });
    
    // Конвертируем обратно в массив
    return Array.from(merged.values());
  }

  /**
   * Проверяет, новее ли серверные данные
   */
  isServerDataNewer(serverItem, localItem) {
    const serverUpdated = new Date(serverItem.updatedAt || serverItem.updated_at || 0).getTime();
    const localUpdated = new Date(localItem.updatedAt || localItem.updated_at || 0).getTime();
    
    return serverUpdated > localUpdated;
  }

  /**
   * Методы для управления синхронизацией
   */

  /**
   * Запускает принудительную синхронизацию
   */
  async forceSync() {
    if (this.syncInProgress) {
      throw new Error('Синхронизация уже выполняется');
    }
    
    try {
      this.syncInProgress = true;
      this.syncStatus = 'forced';
      this.emit('syncStarted', { type: 'forced' });
      
      const startTime = Date.now();
      
      // Выполняем полную синхронизацию
      await this.syncAllEntities();
      
      const duration = Date.now() - startTime;
      this.updateSyncStats(true, duration);
      
      this.syncStatus = 'ready';
      this.emit('syncCompleted', { type: 'forced', success: true, duration });
      
      console.log(`SyncService: принудительная синхронизация завершена за ${duration}ms`);
      
      return { success: true, duration };
      
    } catch (error) {
      this.updateSyncStats(false, 0, error.message);
      this.syncStatus = 'error';
      this.emit('syncCompleted', { type: 'forced', success: false, error: error.message });
      
      console.error('SyncService: ошибка принудительной синхронизации:', error);
      
      throw error;
      
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Синхронизирует конкретную сущность по требованию
   */
  async syncEntityOnDemand(entity) {
    if (!this.syncableEntities.includes(entity)) {
      throw new Error(`Сущность ${entity} не поддерживается для синхронизации`);
    }
    
    try {
      this.emit('entitySyncStarted', { entity });
      
      const result = await this.syncEntity(entity, { fullSync: false });
      
      this.emit('entitySyncCompleted', { entity, success: true, dataCount: result.length });
      
      return result;
      
    } catch (error) {
      this.emit('entitySyncCompleted', { entity, success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Проверяет статус синхронизации
   */
  getSyncStatus() {
    return {
      status: this.syncStatus,
      inProgress: this.syncInProgress,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      lastSyncFormatted: this.formatLastSyncTime(),
      stats: { ...this.syncStats },
      pendingChanges: this.pendingChanges.size,
      queueLength: this.syncQueue.length
    };
  }

  /**
   * Получает статистику синхронизации
   */
  getSyncStats() {
    return { ...this.syncStats };
  }

  /**
   * Сбрасывает статистику синхронизации
   */
  resetSyncStats() {
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncDuration: 0,
      lastSyncError: null
    };
    
    this.emit('syncStatsReset');
  }

  /**
   * Методы для обработки событий
   */

  /**
   * Обрабатывает восстановление подключения
   */
  handleOnline() {
    this.isOnline = true;
    this.emit('connectionRestored');
    
    console.log('SyncService: подключение восстановлено');
    
    // Выполняем синхронизацию при восстановлении подключения
    if (this.syncStatus === 'error') {
      this.performPeriodicSync();
    }
  }

  /**
   * Обрабатывает потерю подключения
   */
  handleOffline() {
    this.isOnline = false;
    this.emit('connectionLost');
    
    console.log('SyncService: подключение потеряно');
    
    // Останавливаем синхронизацию
    this.syncStatus = 'offline';
  }

  /**
   * Обрабатывает восстановление видимости страницы
   */
  handlePageVisible() {
    // Выполняем синхронизацию при восстановлении видимости
    if (this.isOnline && this.syncStatus === 'ready') {
      this.performPeriodicSync();
    }
  }

  /**
   * Обрабатывает фокус окна
   */
  handleWindowFocus() {
    // Выполняем синхронизацию при фокусе окна
    if (this.isOnline && this.syncStatus === 'ready') {
      this.performPeriodicSync();
    }
  }

  /**
   * Обрабатывает обновление кеша
   */
  handleCacheUpdate(data) {
    // Добавляем в очередь синхронизации
    this.addToSyncQueue(data);
  }

  /**
   * Обрабатывает новое уведомление
   */
  handleNewNotification(notification) {
    // Синхронизируем уведомления с сервером
    this.syncNotifications();
  }

  /**
   * Обрабатывает изменение активности
   */
  handleActivityChange(activity) {
    // Синхронизируем активность с сервером
    this.syncActivity();
  }

  /**
   * Методы для очереди синхронизации
   */

  /**
   * Добавляет задачу в очередь синхронизации
   */
  addToSyncQueue(data) {
    const syncTask = {
      id: this.generateTaskId(),
      type: data.type || 'unknown',
      entity: data.entity || 'unknown',
      data: data,
      priority: data.priority || 'normal',
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: 3
    };
    
    this.syncQueue.push(syncTask);
    
    // Сортируем по приоритету
    this.sortSyncQueue();
    
    // Запускаем обработку очереди
    this.processSyncQueue();
    
    this.emit('taskQueued', syncTask);
  }

  /**
   * Сортирует очередь синхронизации
   */
  sortSyncQueue() {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    
    this.syncQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Обрабатывает очередь синхронизации
   */
  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }
    
    try {
      this.syncInProgress = true;
      
      while (this.syncQueue.length > 0) {
        const task = this.syncQueue.shift();
        
        try {
          await this.processSyncTask(task);
          this.emit('taskProcessed', { task, success: true });
          
        } catch (error) {
          task.attempts++;
          
          if (task.attempts < task.maxAttempts) {
            // Возвращаем в очередь для повторной попытки
            this.syncQueue.push(task);
            this.emit('taskRetry', { task, error: error.message });
          } else {
            // Задача провалена
            this.emit('taskFailed', { task, error: error.message });
          }
        }
      }
      
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Обрабатывает задачу синхронизации
   */
  async processSyncTask(task) {
    switch (task.type) {
      case 'cache_update':
        await this.syncEntityOnDemand(task.entity);
        break;
      
      case 'notification':
        await this.syncNotifications();
        break;
      
      case 'activity':
        await this.syncActivity();
        break;
      
      default:
        throw new Error(`Неизвестный тип задачи синхронизации: ${task.type}`);
    }
  }

  /**
   * Синхронизирует уведомления
   */
  async syncNotifications() {
    try {
      const notifications = notificationService.getAllNotifications();
      
      const response = await fetch(`${this.config.baseURL}/notifications/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ notifications })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('SyncService: уведомления синхронизированы');
      
    } catch (error) {
      console.warn('SyncService: ошибка синхронизации уведомлений:', error);
    }
  }

  /**
   * Синхронизирует активность
   */
  async syncActivity() {
    try {
      const activities = activityService.getAllActivities();
      
      const response = await fetch(`${this.config.baseURL}/activity/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ activities })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('SyncService: активность синхронизирована');
      
    } catch (error) {
      console.warn('SyncService: ошибка синхронизации активности:', error);
    }
  }

  /**
   * Методы для утилит
   */

  /**
   * Генерирует уникальный ID для задачи
   */
  generateTaskId() {
    return `sync_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Проверяет подключение к серверу
   */
  async checkServerConnection() {
    try {
      const response = await fetch(`${this.config.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        signal: AbortSignal.timeout(5000) // 5 секунд таймаут
      });
      
      return response.ok;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Обновляет статистику синхронизации
   */
  updateSyncStats(success, duration, error = null) {
    this.syncStats.totalSyncs++;
    
    if (success) {
      this.syncStats.successfulSyncs++;
      this.syncStats.lastSyncDuration = duration;
      this.syncStats.lastSyncError = null;
    } else {
      this.syncStats.failedSyncs++;
      this.syncStats.lastSyncError = error;
    }
  }

  /**
   * Планирует повторную попытку
   */
  scheduleRetry() {
    if (this.retryAttempts < this.maxRetryAttempts) {
      this.retryAttempts++;
      
      setTimeout(() => {
        this.performPeriodicSync();
      }, this.retryDelay * this.retryAttempts);
      
      console.log(`SyncService: повторная попытка запланирована через ${this.retryDelay * this.retryAttempts}ms`);
    } else {
      console.error('SyncService: превышено максимальное количество попыток синхронизации');
      this.emit('maxRetriesExceeded');
    }
  }

  /**
   * Сбрасывает счетчик попыток
   */
  resetRetryAttempts() {
    this.retryAttempts = 0;
  }

  /**
   * Загружает время последней синхронизации
   */
  loadLastSyncTime() {
    try {
      const saved = localStorage.getItem('last_sync_time');
      if (saved) {
        this.lastSyncTime = parseInt(saved);
      }
    } catch (error) {
      console.warn('SyncService: ошибка загрузки времени последней синхронизации:', error);
    }
  }

  /**
   * Сохраняет время последней синхронизации
   */
  saveLastSyncTime() {
    try {
      localStorage.setItem('last_sync_time', this.lastSyncTime.toString());
    } catch (error) {
      console.warn('SyncService: ошибка сохранения времени последней синхронизации:', error);
    }
  }

  /**
   * Форматирует время последней синхронизации
   */
  formatLastSyncTime() {
    if (this.lastSyncTime === 0) {
      return 'Никогда';
    }
    
    const date = new Date(this.lastSyncTime);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Менее минуты
      return 'Только что';
    } else if (diff < 3600000) { // Менее часа
      const minutes = Math.floor(diff / 60000);
      return `${minutes} мин. назад`;
    } else if (diff < 86400000) { // Менее дня
      const hours = Math.floor(diff / 3600000);
      return `${hours} ч. назад`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Получает токен аутентификации
   */
  getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
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
        console.error(`SyncService: ошибка в обработчике события ${event}:`, error);
      }
    });
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    // Останавливаем периодическую синхронизацию
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Очищаем очередь
    this.syncQueue = [];
    
    // Сбрасываем состояние
    this.syncInProgress = false;
    this.syncStatus = 'destroyed';
    
    // Очищаем обработчики событий
    this.eventListeners.clear();
    
    console.log('SyncService: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const syncService = new SyncService();

export default syncService; 