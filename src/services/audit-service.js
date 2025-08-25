/**
 * Сервис аудита для task-service
 * Обеспечивает логирование и отслеживание действий пользователей для безопасности
 */

import settingsService from './settings.js';

class AuditService {
  constructor() {
    this.auditLog = [];
    this.maxLogSize = 10000;
    this.logLevel = 'info';
    this.enabled = true;
    this.sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    this.maskedFields = ['email', 'phone', 'address', 'ssn', 'credit_card'];
    this.retentionDays = 90;
    this.exportFormats = ['json', 'csv', 'xml'];
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    // Загружаем настройки аудита
    this.loadAuditSettings();
    
    // Загружаем сохраненный лог
    this.loadAuditLog();
    
    // Настраиваем автоматическую очистку
    this.setupAutoCleanup();
    
    // Настраиваем обработчики событий
    this.setupEventListeners();
    
    console.log('AuditService: инициализирован');
  }

  /**
   * Загружает настройки аудита
   */
  loadAuditSettings() {
    try {
      const auditEnabled = settingsService.getSetting('security', 'enableAuditLog');
      if (auditEnabled !== undefined) {
        this.enabled = auditEnabled;
      }
      
      const logLevel = settingsService.getSetting('security', 'auditLogLevel');
      if (logLevel) {
        this.logLevel = logLevel;
      }
      
      const retentionDays = settingsService.getSetting('security', 'dataRetentionDays');
      if (retentionDays) {
        this.retentionDays = retentionDays;
      }
    } catch (error) {
      console.warn('AuditService: ошибка загрузки настроек аудита:', error);
    }
  }

  /**
   * Настраивает автоматическую очистку
   */
  setupAutoCleanup() {
    // Очищаем старые записи каждые 24 часа
    setInterval(() => {
      this.cleanupOldEntries();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Настраивает обработчики событий
   */
  setupEventListeners() {
    // Слушаем изменения в истории
    historyService.on('historyRecorded', (entry) => {
      this.auditHistoryChange(entry);
    });
    
    // Слушаем изменения настроек
    settingsService.on('settingChanged', (change) => {
      this.auditSettingChange(change);
    });
    
    // Слушаем изменения в localStorage
    this.setupStorageAudit();
    
    // Слушаем изменения в sessionStorage
    this.setupSessionStorageAudit();
    
    // Слушаем изменения в cookies
    this.setupCookieAudit();
  }

  /**
   * Настраивает аудит localStorage
   */
  setupStorageAudit() {
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    localStorage.setItem = (key, value) => {
      this.auditStorageChange('set', key, value);
      return originalSetItem.call(localStorage, key, value);
    };
    
    localStorage.removeItem = (key) => {
      this.auditStorageChange('remove', key);
      return originalRemoveItem.call(localStorage, key);
    };
    
    localStorage.clear = () => {
      this.auditStorageChange('clear');
      return originalClear.call(localStorage);
    };
  }

  /**
   * Настраивает аудит sessionStorage
   */
  setupSessionStorageAudit() {
    const originalSetItem = sessionStorage.setItem;
    const originalRemoveItem = sessionStorage.removeItem;
    const originalClear = sessionStorage.clear;
    
    sessionStorage.setItem = (key, value) => {
      this.auditStorageChange('set', key, value, 'session');
      return originalSetItem.call(sessionStorage, key, value);
    };
    
    sessionStorage.removeItem = (key) => {
      this.auditStorageChange('remove', key, null, 'session');
      return originalRemoveItem.call(sessionStorage, key);
    };
    
    sessionStorage.clear = () => {
      this.auditStorageChange('clear', null, null, 'session');
      return originalClear.call(sessionStorage);
    };
  }

  /**
   * Настраивает аудит cookies
   */
  setupCookieAudit() {
    // Перехватываем изменения cookies через document.cookie
    const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    
    Object.defineProperty(document, 'cookie', {
      get: function() {
        return originalCookie.get.call(this);
      },
      set: function(value) {
        // Аудит изменения cookie
        if (window.auditService) {
          window.auditService.auditCookieChange(value);
        }
        return originalCookie.set.call(this, value);
      }
    });
  }

  /**
   * Методы для записи аудита
   */

  /**
   * Записывает запись аудита
   */
  log(level, action, details = {}) {
    if (!this.enabled || !this.shouldLog(level)) {
      return null;
    }
    
    const auditEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      level,
      action,
      details: this.sanitizeData(details),
      metadata: {
        user: this.getCurrentUser(),
        session: this.getSessionInfo(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ipAddress: this.getClientIP(),
        ...details.metadata
      }
    };
    
    // Добавляем в лог
    this.addToAuditLog(auditEntry);
    
    // Уведомляем об изменении
    this.emit('auditLogged', auditEntry);
    
    return auditEntry.id;
  }

  /**
   * Записывает информационную запись
   */
  info(action, details = {}) {
    return this.log('info', action, details);
  }

  /**
   * Записывает предупреждение
   */
  warn(action, details = {}) {
    return this.log('warn', action, details);
  }

  /**
   * Записывает ошибку
   */
  error(action, details = {}) {
    return this.log('error', action, details);
  }

  /**
   * Записывает критическую ошибку
   */
  critical(action, details = {}) {
    return this.log('critical', action, details);
  }

  /**
   * Записывает отладочную информацию
   */
  debug(action, details = {}) {
    return this.log('debug', action, details);
  }

  /**
   * Проверяет, нужно ли логировать
   */
  shouldLog(level) {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4
    };
    
    return levels[level] >= levels[this.logLevel];
  }

  /**
   * Генерирует уникальный ID для записи аудита
   */
  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получает текущего пользователя
   */
  getCurrentUser() {
    return localStorage.getItem('user_id') || 
           sessionStorage.getItem('user_id') || 
           'anonymous';
  }

  /**
   * Получает информацию о сессии
   */
  getSessionInfo() {
    return {
      sessionId: sessionStorage.getItem('session_id') || 'unknown',
      startTime: sessionStorage.getItem('session_start') || Date.now(),
      currentTime: Date.now()
    };
  }

  /**
   * Получает IP адрес клиента
   */
  getClientIP() {
    // В реальном приложении IP адрес будет получен с сервера
    // Пока возвращаем заглушку
    return 'unknown';
  }

  /**
   * Очищает чувствительные данные
   */
  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (this.isMaskedField(key)) {
        sanitized[key] = this.maskValue(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  /**
   * Проверяет, является ли поле чувствительным
   */
  isSensitiveField(fieldName) {
    return this.sensitiveFields.some(field => 
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  /**
   * Проверяет, является ли поле маскируемым
   */
  isMaskedField(fieldName) {
    return this.maskedFields.some(field => 
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  /**
   * Маскирует значение
   */
  maskValue(value) {
    if (typeof value !== 'string') {
      return value;
    }
    
    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }
    
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
  }

  /**
   * Методы для специфических типов аудита
   */

  /**
   * Аудит изменения в истории
   */
  auditHistoryChange(entry) {
    this.info('history_change', {
      historyId: entry.id,
      type: entry.type,
      category: entry.category,
      action: entry.action,
      description: entry.description
    });
  }

  /**
   * Аудит изменения настроек
   */
  auditSettingChange(change) {
    this.info('setting_change', {
      category: change.category,
      key: change.key,
      oldValue: this.sanitizeData(change.oldValue),
      newValue: this.sanitizeData(change.newValue)
    });
  }

  /**
   * Аудит изменения в хранилище
   */
  auditStorageChange(action, key, value, type = 'local') {
    this.info('storage_change', {
      type,
      action,
      key: this.isSensitiveField(key) ? '[REDACTED]' : key,
      value: this.sanitizeData(value)
    });
  }

  /**
   * Аудит изменения cookie
   */
  auditCookieChange(value) {
    this.info('cookie_change', {
      value: this.sanitizeData(value)
    });
  }

  /**
   * Аудит аутентификации
   */
  auditAuthentication(action, userId, details = {}) {
    this.info('authentication', {
      action,
      userId,
      ...details
    });
  }

  /**
   * Аудит авторизации
   */
  auditAuthorization(action, resource, userId, details = {}) {
    this.info('authorization', {
      action,
      resource,
      userId,
      ...details
    });
  }

  /**
   * Аудит доступа к ресурсам
   */
  auditResourceAccess(action, resource, userId, details = {}) {
    this.info('resource_access', {
      action,
      resource,
      userId,
      ...details
    });
  }

  /**
   * Аудит изменения данных
   */
  auditDataChange(action, dataType, recordId, userId, details = {}) {
    this.info('data_change', {
      action,
      dataType,
      recordId,
      userId,
      ...details
    });
  }

  /**
   * Аудит экспорта данных
   */
  auditDataExport(format, dataType, recordCount, userId, details = {}) {
    this.info('data_export', {
      format,
      dataType,
      recordCount,
      userId,
      ...details
    });
  }

  /**
   * Аудит импорта данных
   */
  auditDataImport(format, dataType, recordCount, userId, details = {}) {
    this.info('data_import', {
      format,
      dataType,
      recordCount,
      userId,
      ...details
    });
  }

  /**
   * Аудит ошибок
   */
  auditError(error, context = {}) {
    this.error('application_error', {
      message: error.message || error.toString(),
      stack: error.stack,
      context
    });
  }

  /**
   * Аудит безопасности
   */
  auditSecurityEvent(event, details = {}) {
    this.warn('security_event', {
      event,
      ...details
    });
  }

  /**
   * Аудит производительности
   */
  auditPerformance(metric, value, context = {}) {
    this.debug('performance', {
      metric,
      value,
      context
    });
  }

  /**
   * Методы для работы с логом аудита
   */

  /**
   * Добавляет запись в лог аудита
   */
  addToAuditLog(entry) {
    this.auditLog.push(entry);
    
    // Ограничиваем размер лога
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog.shift();
    }
    
    // Сохраняем лог
    this.saveAuditLog();
  }

  /**
   * Получает запись аудита по ID
   */
  getAuditEntry(id) {
    return this.auditLog.find(entry => entry.id === id);
  }

  /**
   * Получает все записи аудита
   */
  getAllAuditLog() {
    return [...this.auditLog];
  }

  /**
   * Получает лог аудита с фильтрацией
   */
  getFilteredAuditLog(filters = {}) {
    let filtered = [...this.auditLog];
    
    // Фильтр по уровню
    if (filters.level) {
      filtered = filtered.filter(entry => entry.level === filters.level);
    }
    
    // Фильтр по действию
    if (filters.action) {
      filtered = filtered.filter(entry => entry.action === filters.action);
    }
    
    // Фильтр по пользователю
    if (filters.user) {
      filtered = filtered.filter(entry => entry.metadata.user === filters.user);
    }
    
    // Фильтр по диапазону дат
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(entry => {
        const timestamp = new Date(entry.timestamp).getTime();
        return timestamp >= start && timestamp <= end;
      });
    }
    
    // Фильтр по поисковому запросу
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.action.toLowerCase().includes(query) ||
        JSON.stringify(entry.details).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }

  /**
   * Получает лог аудита по уровню
   */
  getAuditLogByLevel(level) {
    return this.auditLog.filter(entry => entry.level === level);
  }

  /**
   * Получает лог аудита по действию
   */
  getAuditLogByAction(action) {
    return this.auditLog.filter(entry => entry.action === action);
  }

  /**
   * Получает лог аудита по пользователю
   */
  getAuditLogByUser(userId) {
    return this.auditLog.filter(entry => entry.metadata.user === userId);
  }

  /**
   * Получает лог аудита за период
   */
  getAuditLogByPeriod(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.auditLog.filter(entry => {
      const timestamp = new Date(entry.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Получает последние записи аудита
   */
  getRecentAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }

  /**
   * Методы для управления логом
   */

  /**
   * Очищает лог аудита
   */
  clearAuditLog() {
    this.auditLog = [];
    this.saveAuditLog();
    
    this.emit('auditLogCleared');
    console.log('AuditService: лог аудита очищен');
  }

  /**
   * Очищает старые записи
   */
  cleanupOldEntries() {
    const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    const initialLength = this.auditLog.length;
    
    this.auditLog = this.auditLog.filter(entry => {
      const timestamp = new Date(entry.timestamp).getTime();
      return timestamp >= cutoff;
    });
    
    this.saveAuditLog();
    
    const cleanedCount = initialLength - this.auditLog.length;
    if (cleanedCount > 0) {
      this.emit('oldAuditEntriesCleaned', { cleanedCount });
      console.log(`AuditService: очищено ${cleanedCount} старых записей аудита`);
    }
  }

  /**
   * Удаляет запись по ID
   */
  removeAuditEntry(id) {
    const index = this.auditLog.findIndex(entry => entry.id === id);
    if (index !== -1) {
      const entry = this.auditLog[index];
      this.auditLog.splice(index, 1);
      
      this.saveAuditLog();
      
      this.emit('auditEntryRemoved', { id, entry });
      console.log(`AuditService: удалена запись аудита ${id}`);
      
      return true;
    }
    return false;
  }

  /**
   * Методы для сохранения и загрузки
   */

  /**
   * Сохраняет лог аудита
   */
  saveAuditLog() {
    try {
      localStorage.setItem('auditLog', JSON.stringify({
        log: this.auditLog,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('AuditService: ошибка сохранения лога аудита:', error);
    }
  }

  /**
   * Загружает лог аудита
   */
  loadAuditLog() {
    try {
      const saved = localStorage.getItem('auditLog');
      if (saved) {
        const data = JSON.parse(saved);
        this.auditLog = data.log || [];
        
        console.log(`AuditService: загружено ${this.auditLog.length} записей аудита`);
      }
    } catch (error) {
      console.warn('AuditService: ошибка загрузки лога аудита:', error);
    }
  }

  /**
   * Методы для экспорта и импорта
   */

  /**
   * Экспортирует лог аудита
   */
  exportAuditLog(format = 'json') {
    try {
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify({
            auditLog: this.auditLog,
            exportTimestamp: new Date().toISOString(),
            totalEntries: this.auditLog.length
          }, null, 2);
        
        case 'csv':
          return this.exportToCSV();
        
        case 'xml':
          return this.exportToXML();
        
        default:
          throw new Error(`Неподдерживаемый формат: ${format}`);
      }
    } catch (error) {
      console.error('AuditService: ошибка экспорта лога аудита:', error);
      return null;
    }
  }

  /**
   * Экспортирует в CSV
   */
  exportToCSV() {
    const headers = ['ID', 'Timestamp', 'Level', 'Action', 'User', 'URL', 'Details'];
    const rows = this.auditLog.map(entry => [
      entry.id,
      entry.timestamp,
      entry.level,
      entry.action,
      entry.metadata.user,
      entry.metadata.url,
      JSON.stringify(entry.details)
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * Экспортирует в XML
   */
  exportToXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<auditLog>\n';
    
    this.auditLog.forEach(entry => {
      xml += '  <entry>\n';
      xml += `    <id>${entry.id}</id>\n`;
      xml += `    <timestamp>${entry.timestamp}</timestamp>\n`;
      xml += `    <level>${entry.level}</level>\n`;
      xml += `    <action>${entry.action}</action>\n`;
      xml += `    <user>${entry.metadata.user}</user>\n`;
      xml += `    <url>${entry.metadata.url}</url>\n`;
      xml += `    <details>${JSON.stringify(entry.details)}</details>\n`;
      xml += '  </entry>\n';
    });
    
    xml += '</auditLog>';
    return xml;
  }

  /**
   * Импортирует лог аудита
   */
  importAuditLog(data) {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      if (data.auditLog && Array.isArray(data.auditLog)) {
        // Добавляем импортированные записи
        data.auditLog.forEach(entry => {
          if (entry.id && !this.getAuditEntry(entry.id)) {
            this.addToAuditLog(entry);
          }
        });
        
        this.emit('auditLogImported', { importedCount: data.auditLog.length });
        console.log(`AuditService: импортировано ${data.auditLog.length} записей аудита`);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('AuditService: ошибка импорта лога аудита:', error);
      return false;
    }
  }

  /**
   * Методы для управления сервисом
   */

  /**
   * Включает аудит
   */
  enable() {
    this.enabled = true;
    this.emit('auditEnabled');
    console.log('AuditService: аудит включен');
  }

  /**
   * Отключает аудит
   */
  disable() {
    this.enabled = false;
    this.emit('auditDisabled');
    console.log('AuditService: аудит отключен');
  }

  /**
   * Устанавливает уровень логирования
   */
  setLogLevel(level) {
    if (['debug', 'info', 'warn', 'error', 'critical'].includes(level)) {
      this.logLevel = level;
      this.emit('logLevelChanged', { level });
      console.log(`AuditService: уровень логирования изменен на ${level}`);
      return true;
    }
    return false;
  }

  /**
   * Устанавливает размер лога
   */
  setMaxLogSize(size) {
    if (typeof size === 'number' && size > 0) {
      this.maxLogSize = size;
      
      // Обрезаем лог если необходимо
      if (this.auditLog.length > this.maxLogSize) {
        this.auditLog = this.auditLog.slice(-this.maxLogSize);
      }
      
      this.emit('maxLogSizeChanged', { size });
      console.log(`AuditService: максимальный размер лога изменен на ${size}`);
      return true;
    }
    return false;
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
        console.error(`AuditService: ошибка в обработчике события ${event}:`, error);
      }
    });
  }

  /**
   * Получает статус сервиса
   */
  getStatus() {
    return {
      enabled: this.enabled,
      logLevel: this.logLevel,
      totalEntries: this.auditLog.length,
      maxLogSize: this.maxLogSize,
      retentionDays: this.retentionDays,
      exportFormats: this.exportFormats
    };
  }

  /**
   * Получает статистику аудита
   */
  getAuditStats() {
    const stats = {
      total: this.auditLog.length,
      byLevel: {},
      byAction: {},
      byUser: {},
      byDate: {},
      recentActivity: this.getRecentAuditLog(100)
    };
    
    // Группируем по уровням
    this.auditLog.forEach(entry => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
      stats.byUser[entry.metadata.user] = (stats.byUser[entry.metadata.user] || 0) + 1;
      
      const date = new Date(entry.timestamp).toDateString();
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    this.auditLog = [];
    this.eventListeners.clear();
    
    console.log('AuditService: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const auditService = new AuditService();

// Делаем доступным глобально для перехвата cookie
window.auditService = auditService;

export default auditService; 