/**
 * Сервис уведомлений для task-service
 * Обеспечивает управление уведомлениями, push-уведомлениями и умными уведомлениями
 */

import { getTaskServiceConfig } from '../config/task-service';
import activityService from './activity-service';
import auditService from './audit-service';

class NotificationService {
  constructor() {
    this.config = getTaskServiceConfig();
    this.notifications = [];
    this.templates = new Map();
    this.subscribers = new Map();
    this.pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.notificationPermission = 'default';
    this.serviceWorkerRegistration = null;
    this.isInitialized = false;
    
    this.notificationTypes = {
      task: 'task',
      meeting: 'meeting',
      reminder: 'reminder',
      system: 'system',
      update: 'update',
      alert: 'alert',
      success: 'success',
      warning: 'warning',
      error: 'error'
    };
    
    this.priorityLevels = {
      low: 1,
      normal: 2,
      high: 3,
      urgent: 4
    };
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  async init() {
    try {
      // Проверяем поддержку push-уведомлений
      if (this.pushSupported) {
        await this.initializePushNotifications();
      }
      
      // Загружаем шаблоны уведомлений
      this.loadNotificationTemplates();
      
      // Загружаем сохраненные уведомления
      this.loadNotifications();
      
      // Настраиваем обработчики событий
      this.setupEventListeners();
      
      // Запускаем периодические задачи
      this.startPeriodicTasks();
      
      this.isInitialized = true;
      console.log('NotificationService: инициализирован');
      
      // Уведомляем о готовности
      this.emit('serviceReady');
      
    } catch (error) {
      console.error('NotificationService: ошибка инициализации:', error);
      this.emit('initializationError', { error: error.message });
    }
  }

  /**
   * Инициализирует push-уведомления
   */
  async initializePushNotifications() {
    try {
      // Регистрируем service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      
      // Запрашиваем разрешение на уведомления
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;
      } else {
        this.notificationPermission = Notification.permission;
      }
      
      // Подписываемся на push-уведомления
      if (this.notificationPermission === 'granted') {
        await this.subscribeToPushNotifications();
      }
      
      console.log('NotificationService: push-уведомления инициализированы');
      
    } catch (error) {
      console.warn('NotificationService: ошибка инициализации push-уведомлений:', error);
    }
  }

  /**
   * Подписывается на push-уведомления
   */
  async subscribeToPushNotifications() {
    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.config.pushPublicKey || '')
      });
      
      // Отправляем подписку на сервер
      await this.sendSubscriptionToServer(subscription);
      
      console.log('NotificationService: подписка на push-уведомления создана');
      
    } catch (error) {
      console.warn('NotificationService: ошибка подписки на push-уведомления:', error);
    }
  }

  /**
   * Отправляет подписку на сервер
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch(`${this.config.baseURL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('NotificationService: подписка отправлена на сервер');
      
    } catch (error) {
      console.warn('NotificationService: ошибка отправки подписки на сервер:', error);
    }
  }

  /**
   * Конвертирует base64 ключ в Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Загружает шаблоны уведомлений
   */
  loadNotificationTemplates() {
    // Шаблоны для задач
    this.templates.set('task_created', {
      title: 'Новая задача создана',
      body: 'Задача "{title}" была создана и назначена вам',
      icon: '/icons/task-created.png',
      badge: '/icons/badge.png',
      tag: 'task_created',
      requireInteraction: false,
      silent: false
    });
    
    this.templates.set('task_due_soon', {
      title: 'Срок задачи истекает',
      body: 'Задача "{title}" должна быть выполнена {dueDate}',
      icon: '/icons/task-due.png',
      badge: '/icons/badge.png',
      tag: 'task_due_soon',
      requireInteraction: true,
      silent: false
    });
    
    this.templates.set('task_overdue', {
      title: 'Задача просрочена',
      body: 'Задача "{title}" просрочена на {overdueDays} дней',
      icon: '/icons/task-overdue.png',
      badge: '/icons/badge.png',
      tag: 'task_overdue',
      requireInteraction: true,
      silent: false
    });
    
    // Шаблоны для встреч
    this.templates.set('meeting_reminder', {
      title: 'Напоминание о встрече',
      body: 'Встреча "{title}" начнется через {timeUntil}',
      icon: '/icons/meeting.png',
      badge: '/icons/badge.png',
      tag: 'meeting_reminder',
      requireInteraction: true,
      silent: false
    });
    
    this.templates.set('meeting_starting', {
      title: 'Встреча начинается',
      body: 'Встреча "{title}" начинается сейчас',
      icon: '/icons/meeting-start.png',
      badge: '/icons/badge.png',
      tag: 'meeting_starting',
      requireInteraction: true,
      silent: false
    });
    
    // Шаблоны для системы
    this.templates.set('system_update', {
      title: 'Обновление системы',
      body: 'Доступно обновление системы. Перезагрузите страницу для применения изменений.',
      icon: '/icons/system-update.png',
      badge: '/icons/badge.png',
      tag: 'system_update',
      requireInteraction: false,
      silent: true
    });
    
    this.templates.set('error_occurred', {
      title: 'Произошла ошибка',
      body: 'Произошла ошибка: {errorMessage}',
      icon: '/icons/error.png',
      badge: '/icons/badge.png',
      tag: 'error_occurred',
      requireInteraction: true,
      silent: false
    });
    
    // Шаблоны для успешных операций
    this.templates.set('operation_success', {
      title: 'Операция выполнена',
      body: '{operationName} успешно выполнена',
      icon: '/icons/success.png',
      badge: '/icons/badge.png',
      tag: 'operation_success',
      requireInteraction: false,
      silent: true
    });
    
    // Шаблоны для предупреждений
    this.templates.set('warning', {
      title: 'Предупреждение',
      body: '{warningMessage}',
      icon: '/icons/warning.png',
      badge: '/icons/badge.png',
      tag: 'warning',
      requireInteraction: false,
      silent: false
    });
  }

  /**
   * Загружает сохраненные уведомления
   */
  loadNotifications() {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
        console.log(`NotificationService: загружено ${this.notifications.length} уведомлений`);
      }
    } catch (error) {
      console.warn('NotificationService: ошибка загрузки уведомлений:', error);
    }
  }

  /**
   * Настраивает обработчики событий
   */
  setupEventListeners() {
    // Обработчик для входящих push-уведомлений
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          this.handlePushNotification(event.data.payload);
        }
      });
    }
    
    // Обработчик для изменения разрешений на уведомления
    if ('Notification' in window) {
      Notification.onpermissionchange = () => {
        this.notificationPermission = Notification.permission;
        this.emit('permissionChanged', { permission: this.notificationPermission });
      };
    }
    
    // Обработчик для изменения видимости страницы
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.markNotificationsAsRead();
      }
    });
    
    // Обработчик для фокуса окна
    window.addEventListener('focus', () => {
      this.markNotificationsAsRead();
    });
  }

  /**
   * Запускает периодические задачи
   */
  startPeriodicTasks() {
    // Проверяем уведомления каждую минуту
    setInterval(() => {
      this.checkScheduledNotifications();
    }, 60 * 1000);
    
    // Очищаем старые уведомления каждый час
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 60 * 60 * 1000);
    
    // Синхронизируем с сервером каждые 5 минут
    setInterval(() => {
      this.syncWithServer();
    }, 5 * 60 * 1000);
  }

  /**
   * Методы для создания уведомлений
   */

  /**
   * Создает уведомление
   */
  createNotification(type, data = {}, options = {}) {
    const notification = {
      id: this.generateNotificationId(),
      type,
      data,
      title: options.title || '',
      body: options.body || '',
      icon: options.icon || '',
      badge: options.badge || '',
      tag: options.tag || '',
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      priority: options.priority || this.priorityLevels.normal,
      createdAt: Date.now(),
      readAt: null,
      actionedAt: null,
      dismissedAt: null,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...options.metadata
      }
    };
    
    // Добавляем в список
    this.addNotification(notification);
    
    // Показываем браузерное уведомление если разрешено
    if (this.notificationPermission === 'granted' && !options.silent) {
      this.showBrowserNotification(notification);
    }
    
    // Записываем в аудит
    auditService.info('notification_created', {
      notificationId: notification.id,
      type,
      title: notification.title,
      priority: notification.priority
    });
    
    // Уведомляем подписчиков
    this.emit('notificationCreated', notification);
    
    return notification.id;
  }

  /**
   * Создает уведомление по шаблону
   */
  createNotificationFromTemplate(templateName, data = {}, options = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Шаблон уведомления "${templateName}" не найден`);
    }
    
    // Заменяем плейсхолдеры в шаблоне
    let title = template.title;
    let body = template.body;
    
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(placeholder, value);
      body = body.replace(placeholder, value);
    });
    
    return this.createNotification(templateName, data, {
      ...template,
      title,
      body,
      ...options
    });
  }

  /**
   * Создает уведомление о задаче
   */
  createTaskNotification(action, task, options = {}) {
    const taskData = {
      taskId: task.id,
      taskTitle: task.title,
      taskStatus: task.status,
      taskPriority: task.priority,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy
    };
    
    switch (action) {
      case 'created':
        return this.createNotificationFromTemplate('task_created', taskData, options);
      
      case 'due_soon':
        const dueDate = new Date(task.dueDate);
        const timeUntil = this.formatTimeUntil(dueDate);
        return this.createNotificationFromTemplate('task_due_soon', {
          ...taskData,
          dueDate: dueDate.toLocaleDateString(),
          timeUntil
        }, options);
      
      case 'overdue':
        const overdueDays = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return this.createNotificationFromTemplate('task_overdue', {
          ...taskData,
          overdueDays
        }, options);
      
      default:
        return this.createNotification('task', taskData, {
          title: `Задача ${action}`,
          body: `Задача "${task.title}" ${action}`,
          ...options
        });
    }
  }

  /**
   * Создает уведомление о встрече
   */
  createMeetingNotification(action, meeting, options = {}) {
    const meetingData = {
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      participants: meeting.participants,
      location: meeting.location
    };
    
    switch (action) {
      case 'reminder':
        const startTime = new Date(meeting.startTime);
        const timeUntil = this.formatTimeUntil(startTime);
        return this.createNotificationFromTemplate('meeting_reminder', {
          ...meetingData,
          timeUntil
        }, options);
      
      case 'starting':
        return this.createNotificationFromTemplate('meeting_starting', meetingData, options);
      
      default:
        return this.createNotification('meeting', meetingData, {
          title: `Встреча ${action}`,
          body: `Встреча "${meeting.title}" ${action}`,
          ...options
        });
    }
  }

  /**
   * Создает системное уведомление
   */
  createSystemNotification(action, data = {}, options = {}) {
    switch (action) {
      case 'update':
        return this.createNotificationFromTemplate('system_update', data, options);
      
      case 'error':
        return this.createNotificationFromTemplate('error_occurred', {
          errorMessage: data.errorMessage || 'Неизвестная ошибка'
        }, options);
      
      default:
        return this.createNotification('system', data, {
          title: `Система: ${action}`,
          body: data.message || '',
          ...options
        });
    }
  }

  /**
   * Создает уведомление об успешной операции
   */
  createSuccessNotification(operationName, data = {}, options = {}) {
    return this.createNotificationFromTemplate('operation_success', {
      operationName,
      ...data
    }, options);
  }

  /**
   * Создает предупреждение
   */
  createWarningNotification(warningMessage, data = {}, options = {}) {
    return this.createNotificationFromTemplate('warning', {
      warningMessage,
      ...data
    }, options);
  }

  /**
   * Создает запланированное уведомление
   */
  createScheduledNotification(type, data, scheduleTime, options = {}) {
    const notification = this.createNotification(type, data, {
      ...options,
      scheduledFor: scheduleTime,
      silent: true // Не показываем сразу
    });
    
    // Планируем показ
    const delay = scheduleTime - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.showScheduledNotification(notification.id);
      }, delay);
    }
    
    return notification.id;
  }

  /**
   * Методы для управления уведомлениями
   */

  /**
   * Добавляет уведомление в список
   */
  addNotification(notification) {
    this.notifications.push(notification);
    
    // Ограничиваем количество уведомлений
    const maxNotifications = this.config.maxNotifications || 1000;
    if (this.notifications.length > maxNotifications) {
      this.notifications = this.notifications.slice(-maxNotifications);
    }
    
    // Сохраняем в localStorage
    this.saveNotifications();
  }

  /**
   * Получает уведомление по ID
   */
  getNotification(id) {
    return this.notifications.find(notification => notification.id === id);
  }

  /**
   * Получает все уведомления
   */
  getAllNotifications() {
    return [...this.notifications];
  }

  /**
   * Получает непрочитанные уведомления
   */
  getUnreadNotifications() {
    return this.notifications.filter(notification => !notification.readAt);
  }

  /**
   * Получает уведомления по типу
   */
  getNotificationsByType(type) {
    return this.notifications.filter(notification => notification.type === type);
  }

  /**
   * Получает уведомления по приоритету
   */
  getNotificationsByPriority(priority) {
    return this.notifications.filter(notification => notification.priority >= priority);
  }

  /**
   * Получает уведомления за период
   */
  getNotificationsByPeriod(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.notifications.filter(notification => {
      const timestamp = notification.createdAt;
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Получает последние уведомления
   */
  getRecentNotifications(limit = 50) {
    return this.notifications.slice(-limit);
  }

  /**
   * Отмечает уведомление как прочитанное
   */
  markAsRead(id) {
    const notification = this.getNotification(id);
    if (notification && !notification.readAt) {
      notification.readAt = Date.now();
      this.saveNotifications();
      this.emit('notificationRead', notification);
    }
  }

  /**
   * Отмечает все уведомления как прочитанные
   */
  markAllAsRead() {
    const unreadCount = this.getUnreadNotifications().length;
    
    this.notifications.forEach(notification => {
      if (!notification.readAt) {
        notification.readAt = Date.now();
      }
    });
    
    this.saveNotifications();
    this.emit('allNotificationsRead', { count: unreadCount });
  }

  /**
   * Отмечает уведомление как обработанное
   */
  markAsActioned(id, action = 'clicked') {
    const notification = this.getNotification(id);
    if (notification) {
      notification.actionedAt = Date.now();
      notification.action = action;
      this.saveNotifications();
      this.emit('notificationActioned', notification);
    }
  }

  /**
   * Отклоняет уведомление
   */
  dismissNotification(id) {
    const notification = this.getNotification(id);
    if (notification) {
      notification.dismissedAt = Date.now();
      this.saveNotifications();
      this.emit('notificationDismissed', notification);
    }
  }

  /**
   * Удаляет уведомление
   */
  deleteNotification(id) {
    const index = this.notifications.findIndex(notification => notification.id === id);
    if (index > -1) {
      const notification = this.notifications[index];
      this.notifications.splice(index, 1);
      this.saveNotifications();
      this.emit('notificationDeleted', notification);
    }
  }

  /**
   * Очищает все уведомления
   */
  clearAllNotifications() {
    const count = this.notifications.length;
    this.notifications = [];
    this.saveNotifications();
    this.emit('allNotificationsCleared', { count });
  }

  /**
   * Методы для показа уведомлений
   */

  /**
   * Показывает браузерное уведомление
   */
  showBrowserNotification(notification) {
    if (this.notificationPermission !== 'granted') {
      return;
    }
    
    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        data: notification
      });
      
      // Обработчики событий
      browserNotification.onclick = () => {
        this.handleNotificationClick(notification);
        browserNotification.close();
      };
      
      browserNotification.onclose = () => {
        this.handleNotificationClose(notification);
      };
      
      browserNotification.onshow = () => {
        this.handleNotificationShow(notification);
      };
      
      // Автоматически закрываем через 10 секунд если не требует взаимодействия
      if (!notification.requireInteraction) {
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      }
      
    } catch (error) {
      console.warn('NotificationService: ошибка показа браузерного уведомления:', error);
    }
  }

  /**
   * Показывает запланированное уведомление
   */
  showScheduledNotification(id) {
    const notification = this.getNotification(id);
    if (notification && notification.scheduledFor) {
      // Убираем флаг запланированности
      delete notification.scheduledFor;
      
      // Показываем уведомление
      if (this.notificationPermission === 'granted') {
        this.showBrowserNotification(notification);
      }
      
      // Уведомляем подписчиков
      this.emit('scheduledNotificationShown', notification);
    }
  }

  /**
   * Обрабатывает клик по уведомлению
   */
  handleNotificationClick(notification) {
    // Отмечаем как прочитанное и обработанное
    this.markAsRead(notification.id);
    this.markAsActioned(notification.id, 'clicked');
    
    // Фокусируем окно
    window.focus();
    
    // Выполняем действие в зависимости от типа уведомления
    switch (notification.type) {
      case 'task':
        this.handleTaskNotificationClick(notification);
        break;
      
      case 'meeting':
        this.handleMeetingNotificationClick(notification);
        break;
      
      case 'system':
        this.handleSystemNotificationClick(notification);
        break;
      
      default:
        // По умолчанию ничего не делаем
        break;
    }
    
    // Записываем в аудит
    auditService.info('notification_clicked', {
      notificationId: notification.id,
      type: notification.type,
      action: 'clicked'
    });
  }

  /**
   * Обрабатывает клик по уведомлению о задаче
   */
  handleTaskNotificationClick(notification) {
    const taskId = notification.data.taskId;
    if (taskId) {
      // Переходим на страницу задачи
      const taskUrl = `/tasks/${taskId}`;
      if (window.location.pathname !== taskUrl) {
        window.location.href = taskUrl;
      }
    }
  }

  /**
   * Обрабатывает клик по уведомлению о встрече
   */
  handleMeetingNotificationClick(notification) {
    const meetingId = notification.data.meetingId;
    if (meetingId) {
      // Переходим на страницу встречи
      const meetingUrl = `/meetings/${meetingId}`;
      if (window.location.pathname !== meetingUrl) {
        window.location.href = meetingUrl;
      }
    }
  }

  /**
   * Обрабатывает клик по системному уведомлению
   */
  handleSystemNotificationClick(notification) {
    if (notification.data.action === 'update') {
      // Перезагружаем страницу для применения обновлений
      window.location.reload();
    }
  }

  /**
   * Обрабатывает закрытие уведомления
   */
  handleNotificationClose(notification) {
    // Отмечаем как отклоненное
    this.dismissNotification(notification.id);
    
    // Записываем в аудит
    auditService.info('notification_dismissed', {
      notificationId: notification.id,
      type: notification.type
    });
  }

  /**
   * Обрабатывает показ уведомления
   */
  handleNotificationShow(notification) {
    // Записываем в аудит
    auditService.info('notification_shown', {
      notificationId: notification.id,
      type: notification.type
    });
  }

  /**
   * Обрабатывает push-уведомление
   */
  handlePushNotification(payload) {
    try {
      const notification = {
        id: payload.id || this.generateNotificationId(),
        type: payload.type || 'system',
        title: payload.title || 'Новое уведомление',
        body: payload.body || '',
        icon: payload.icon || '',
        badge: payload.badge || '',
        tag: payload.tag || '',
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        priority: payload.priority || this.priorityLevels.normal,
        createdAt: Date.now(),
        readAt: null,
        actionedAt: null,
        dismissedAt: null,
        data: payload.data || {},
        metadata: {
          source: 'push',
          ...payload.metadata
        }
      };
      
      // Добавляем в список
      this.addNotification(notification);
      
      // Показываем браузерное уведомление
      if (this.notificationPermission === 'granted') {
        this.showBrowserNotification(notification);
      }
      
      // Уведомляем подписчиков
      this.emit('pushNotificationReceived', notification);
      
    } catch (error) {
      console.error('NotificationService: ошибка обработки push-уведомления:', error);
    }
  }

  /**
   * Методы для умных уведомлений
   */

  /**
   * Создает умное уведомление на основе контекста
   */
  createSmartNotification(context, data = {}) {
    // Анализируем контекст и создаем соответствующее уведомление
    const smartNotification = this.analyzeContext(context, data);
    
    if (smartNotification) {
      return this.createNotification(
        smartNotification.type,
        smartNotification.data,
        smartNotification.options
      );
    }
    
    return null;
  }

  /**
   * Анализирует контекст для создания умного уведомления
   */
  analyzeContext(context, data) {
    // Здесь можно добавить логику анализа контекста
    // Например, анализ активности пользователя, времени дня, приоритетов и т.д.
    
    switch (context.type) {
      case 'productivity_low':
        return {
          type: 'reminder',
          data: { ...data, context: 'productivity' },
          options: {
            title: 'Время для перерыва',
            body: 'Вы работаете уже долго. Возможно, стоит сделать перерыв?',
            priority: this.priorityLevels.low,
            silent: true
          }
        };
      
      case 'deadline_approaching':
        return {
          type: 'reminder',
          data: { ...data, context: 'deadline' },
          options: {
            title: 'Срок приближается',
            body: 'До дедлайна осталось мало времени. Ускоритесь!',
            priority: this.priorityLevels.high,
            requireInteraction: true
          }
        };
      
      case 'collaboration_opportunity':
        return {
          type: 'update',
          data: { ...data, context: 'collaboration' },
          options: {
            title: 'Возможность для сотрудничества',
            body: 'Коллега работает над похожей задачей. Возможно, стоит объединить усилия?',
            priority: this.priorityLevels.normal
          }
        };
      
      default:
        return null;
    }
  }

  /**
   * Методы для управления подписками
   */

  /**
   * Подписывает на события уведомлений
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
    
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Отписывает от событий уведомлений
   */
  unsubscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      return;
    }
    
    const callbacks = this.subscribers.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Уведомляет подписчиков
   */
  emit(event, data) {
    if (!this.subscribers.has(event)) {
      return;
    }
    
    this.subscribers.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`NotificationService: ошибка в обработчике события ${event}:`, error);
      }
    });
  }

  /**
   * Методы для утилит
   */

  /**
   * Генерирует уникальный ID для уведомления
   */
  generateNotificationId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Форматирует время до события
   */
  formatTimeUntil(targetDate) {
    const now = Date.now();
    const diff = targetDate.getTime() - now;
    
    if (diff <= 0) {
      return 'сейчас';
    }
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} дн.`;
    } else if (hours > 0) {
      return `${hours} ч.`;
    } else if (minutes > 0) {
      return `${minutes} мин.`;
    } else {
      return 'менее минуты';
    }
  }

  /**
   * Получает токен аутентификации
   */
  getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  /**
   * Сохраняет уведомления в localStorage
   */
  saveNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.warn('NotificationService: ошибка сохранения уведомлений:', error);
    }
  }

  /**
   * Методы для периодических задач
   */

  /**
   * Проверяет запланированные уведомления
   */
  checkScheduledNotifications() {
    const now = Date.now();
    
    this.notifications.forEach(notification => {
      if (notification.scheduledFor && notification.scheduledFor <= now) {
        this.showScheduledNotification(notification.id);
      }
    });
  }

  /**
   * Очищает старые уведомления
   */
  cleanupOldNotifications() {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней
    const cutoff = Date.now() - maxAge;
    
    const initialCount = this.notifications.length;
    this.notifications = this.notifications.filter(notification => 
      notification.createdAt > cutoff
    );
    
    const removedCount = initialCount - this.notifications.length;
    if (removedCount > 0) {
      this.saveNotifications();
      console.log(`NotificationService: очищено ${removedCount} старых уведомлений`);
    }
  }

  /**
   * Синхронизирует с сервером
   */
  async syncWithServer() {
    try {
      const response = await fetch(`${this.config.baseURL}/notifications/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          lastSync: this.getLastSyncTime(),
          notifications: this.getRecentNotifications(100)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.processServerNotifications(data.notifications);
        this.setLastSyncTime(Date.now());
      }
      
    } catch (error) {
      console.warn('NotificationService: ошибка синхронизации с сервером:', error);
    }
  }

  /**
   * Обрабатывает уведомления с сервера
   */
  processServerNotifications(serverNotifications) {
    if (!Array.isArray(serverNotifications)) {
      return;
    }
    
    serverNotifications.forEach(serverNotification => {
      // Проверяем, есть ли уже такое уведомление
      const existing = this.notifications.find(n => n.id === serverNotification.id);
      
      if (!existing) {
        // Добавляем новое уведомление
        this.addNotification({
          ...serverNotification,
          createdAt: Date.now()
        });
      }
    });
  }

  /**
   * Получает время последней синхронизации
   */
  getLastSyncTime() {
    return parseInt(localStorage.getItem('notifications_last_sync') || '0');
  }

  /**
   * Устанавливает время последней синхронизации
   */
  setLastSyncTime(timestamp) {
    localStorage.setItem('notifications_last_sync', timestamp.toString());
  }

  /**
   * Отмечает все уведомления как прочитанные при фокусе
   */
  markNotificationsAsRead() {
    const unreadCount = this.getUnreadNotifications().length;
    
    if (unreadCount > 0) {
      this.markAllAsRead();
    }
  }

  /**
   * Получает статус сервиса
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pushSupported: this.pushSupported,
      notificationPermission: this.notificationPermission,
      totalNotifications: this.notifications.length,
      unreadCount: this.getUnreadNotifications().length,
      templatesCount: this.templates.size,
      subscribersCount: this.subscribers.size
    };
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    this.notifications = [];
    this.templates.clear();
    this.subscribers.clear();
    this.isInitialized = false;
    
    console.log('NotificationService: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const notificationService = new NotificationService();

export default notificationService; 