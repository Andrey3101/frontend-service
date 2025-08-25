/**
 * Сервис активности для task-service
 * Обеспечивает отслеживание пользовательской активности и аналитику поведения
 */

import auditService from './audit-service.js';
import settingsService from './settings.js';

class ActivityService {
  constructor() {
    this.activities = [];
    this.currentSession = null;
    this.userSessions = new Map();
    this.activityTypes = {
      pageView: 'page_view',
      click: 'click',
      formInteraction: 'form_interaction',
      navigation: 'navigation',
      search: 'search',
      dataOperation: 'data_operation',
      system: 'system',
      error: 'error'
    };
    this.maxActivities = 10000;
    this.sessionTimeout = 30 * 60 * 1000; // 30 минут
    this.isTracking = true;
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    // Инициализируем текущую сессию
    this.initializeSession();
    
    // Настраиваем обработчики событий
    this.setupEventListeners();
    
    // Запускаем периодические задачи
    this.startPeriodicTasks();
    
    console.log('ActivityService: инициализирован');
  }

  /**
   * Инициализирует текущую сессию
   */
  initializeSession() {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();
    
    this.currentSession = {
      id: sessionId,
      startTime,
      lastActivity: startTime,
      pageViews: 0,
      actions: 0,
      errors: 0,
      startUrl: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
    
    // Сохраняем в sessionStorage
    sessionStorage.setItem('activity_session_id', sessionId);
    sessionStorage.setItem('activity_session_start', startTime);
    
    // Записываем в аудит
    auditService.info('session_started', {
      sessionId,
      startTime,
      url: window.location.href
    });
  }

  /**
   * Генерирует уникальный ID сессии
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Настраивает обработчики событий
   */
  setupEventListeners() {
    // Отслеживаем навигацию
    this.trackPageView();
    
    // Отслеживаем клики
    document.addEventListener('click', (event) => {
      this.trackClick(event);
    });
    
    // Отслеживаем изменения формы
    document.addEventListener('change', (event) => {
      this.trackFormChange(event);
    });
    
    // Отслеживаем отправку форм
    document.addEventListener('submit', (event) => {
      this.trackFormSubmit(event);
    });
    
    // Отслеживаем скролл
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackScroll();
      }, 100);
    });
    
    // Отслеживаем фокус
    document.addEventListener('focusin', (event) => {
      this.trackFocus(event);
    });
    
    // Отслеживаем изменения размера окна
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.trackResize();
      }, 100);
    });
    
    // Отслеживаем ошибки
    window.addEventListener('error', (event) => {
      this.trackError(event);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.trackUnhandledRejection(event);
    });
    
    // Отслеживаем видимость страницы
    document.addEventListener('visibilitychange', () => {
      this.trackVisibilityChange();
    });
    
    // Отслеживаем фокус окна
    window.addEventListener('focus', () => {
      this.trackWindowFocus();
    });
    
    window.addEventListener('blur', () => {
      this.trackWindowBlur();
    });
    
    // Отслеживаем изменения в истории
    // historyService.on('historyRecorded', (entry) => { // This line was removed as per the new_code, as historyService is no longer imported.
    //   this.trackHistoryChange(entry);
    // });
  }

  /**
   * Запускает периодические задачи
   */
  startPeriodicTasks() {
    // Проверяем активность каждые 5 минут
    setInterval(() => {
      this.checkSessionActivity();
    }, 5 * 60 * 1000);
    
    // Сохраняем данные каждые 10 минут
    setInterval(() => {
      this.saveActivityData();
    }, 10 * 60 * 1000);
  }

  /**
   * Методы для отслеживания активности
   */

  /**
   * Отслеживает просмотр страницы
   */
  trackPageView() {
    const pageData = {
      type: this.activityTypes.pageView,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    };
    
    this.recordActivity(pageData);
    this.updateSessionActivity();
    
    if (this.currentSession) {
      this.currentSession.pageViews++;
    }
  }

  /**
   * Отслеживает клик
   */
  trackClick(event) {
    const target = event.target;
    const clickData = {
      type: this.activityTypes.click,
      element: target.tagName.toLowerCase(),
      elementId: target.id || null,
      elementClass: target.className || null,
      elementText: target.textContent?.substring(0, 100) || null,
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };
    
    this.recordActivity(clickData);
    this.updateSessionActivity();
  }

  /**
   * Отслеживает изменение формы
   */
  trackFormChange(event) {
    const target = event.target;
    const changeData = {
      type: this.activityTypes.formInteraction,
      action: 'change',
      form: target.form?.id || target.form?.name || 'unknown',
      field: target.name || target.id || 'unknown',
      fieldType: target.type || 'unknown',
      timestamp: Date.now()
    };
    
    this.recordActivity(changeData);
    this.updateSessionActivity();
  }

  /**
   * Отслеживает отправку формы
   */
  trackFormSubmit(event) {
    const form = event.target;
    const submitData = {
      type: this.activityTypes.formInteraction,
      action: 'submit',
      form: form.id || form.name || 'unknown',
      formAction: form.action || null,
      formMethod: form.method || 'GET',
      fieldCount: form.elements.length,
      timestamp: Date.now()
    };
    
    this.recordActivity(submitData);
    this.updateSessionActivity();
  }

  /**
   * Отслеживает скролл
   */
  trackScroll() {
    const scrollData = {
      type: this.activityTypes.navigation,
      action: 'scroll',
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      scrollPercentage: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100),
      timestamp: Date.now()
    };
    
    this.recordActivity(scrollData);
  }

  /**
   * Отслеживает фокус
   */
  trackFocus(event) {
    const target = event.target;
    const focusData = {
      type: this.activityTypes.formInteraction,
      action: 'focus',
      element: target.tagName.toLowerCase(),
      elementId: target.id || null,
      elementClass: target.className || null,
      timestamp: Date.now()
    };
    
    this.recordActivity(focusData);
    this.updateSessionActivity();
  }

  /**
   * Отслеживает изменение размера окна
   */
  trackResize() {
    const resizeData = {
      type: this.activityTypes.system,
      action: 'resize',
      width: window.innerWidth,
      height: window.innerHeight,
      timestamp: Date.now()
    };
    
    this.recordActivity(resizeData);
  }

  /**
   * Отслеживает ошибки
   */
  trackError(event) {
    const errorData = {
      type: this.activityTypes.error,
      action: 'javascript_error',
      message: event.message || 'Unknown error',
      filename: event.filename || null,
      lineno: event.lineno || null,
      colno: event.colno || null,
      stack: event.error?.stack || null,
      timestamp: Date.now()
    };
    
    this.recordActivity(errorData);
    this.updateSessionActivity();
    
    if (this.currentSession) {
      this.currentSession.errors++;
    }
  }

  /**
   * Отслеживает необработанные Promise отклонения
   */
  trackUnhandledRejection(event) {
    const rejectionData = {
      type: this.activityTypes.error,
      action: 'unhandled_rejection',
      reason: event.reason?.toString() || 'Unknown reason',
      stack: event.reason?.stack || null,
      timestamp: Date.now()
    };
    
    this.recordActivity(rejectionData);
    this.updateSessionActivity();
    
    if (this.currentSession) {
      this.currentSession.errors++;
    }
  }

  /**
   * Отслеживает изменение видимости
   */
  trackVisibilityChange() {
    const visibilityData = {
      type: this.activityTypes.system,
      action: 'visibility_change',
      hidden: document.hidden,
      timestamp: Date.now()
    };
    
    this.recordActivity(visibilityData);
  }

  /**
   * Отслеживает фокус окна
   */
  trackWindowFocus() {
    const focusData = {
      type: this.activityTypes.system,
      action: 'window_focus',
      timestamp: Date.now()
    };
    
    this.recordActivity(focusData);
    this.updateSessionActivity();
  }

  /**
   * Отслеживает потерю фокуса окна
   */
  trackWindowBlur() {
    const blurData = {
      type: this.activityTypes.system,
      action: 'window_blur',
      timestamp: Date.now()
    };
    
    this.recordActivity(blurData);
  }

  /**
   * Отслеживает изменения в истории
   */
  // trackHistoryChange(entry) { // This line was removed as per the new_code, as historyService is no longer imported.
  //   const historyData = {
  //     type: this.activityTypes.dataOperation,
  //     action: 'history_change',
  //     historyId: entry.id,
  //     historyType: entry.type,
  //     historyCategory: entry.category,
  //     historyAction: entry.action,
  //     timestamp: Date.now()
  //   };
    
  //   this.recordActivity(historyData);
  //   this.updateSessionActivity();
  // }

  /**
   * Отслеживает поиск
   */
  trackSearch(query, resultsCount, filters = {}) {
    const searchData = {
      type: this.activityTypes.search,
      action: 'search',
      query,
      resultsCount,
      filters,
      timestamp: Date.now()
    };
    
    this.recordActivity(searchData);
    this.updateSessionActivity();
  }

  /**
   * Отслеживает навигацию
   */
  trackNavigation(from, to) {
    const navigationData = {
      type: this.activityTypes.navigation,
      action: 'navigate',
      from,
      to,
      timestamp: Date.now()
    };
    
    this.recordActivity(navigationData);
    this.updateSessionActivity();
  }

  /**
   * Отслеживает операцию с данными
   */
  trackDataOperation(action, dataType, recordId, details = {}) {
    const dataData = {
      type: this.activityTypes.dataOperation,
      action,
      dataType,
      recordId,
      details,
      timestamp: Date.now()
    };
    
    this.recordActivity(dataData);
    this.updateSessionActivity();
  }

  /**
   * Отслеживает системное событие
   */
  trackSystemEvent(action, details = {}) {
    const systemData = {
      type: this.activityTypes.system,
      action,
      details,
      timestamp: Date.now()
    };
    
    this.recordActivity(systemData);
  }

  /**
   * Методы для работы с активностью
   */

  /**
   * Записывает активность
   */
  recordActivity(activity) {
    if (!this.isTracking) {
      return null;
    }
    
    const activityEntry = {
      id: this.generateActivityId(),
      sessionId: this.currentSession?.id || 'unknown',
      user: this.getCurrentUser(),
      ...activity,
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...activity.metadata
      }
    };
    
    // Добавляем в список активностей
    this.addToActivities(activityEntry);
    
    // Уведомляем об изменении
    this.emit('activityRecorded', activityEntry);
    
    return activityEntry.id;
  }

  /**
   * Генерирует уникальный ID для активности
   */
  generateActivityId() {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Добавляет активность в список
   */
  addToActivities(activity) {
    this.activities.push(activity);
    
    // Ограничиваем размер списка
    if (this.activities.length > this.maxActivities) {
      this.activities.shift();
    }
  }

  /**
   * Обновляет активность сессии
   */
  updateSessionActivity() {
    if (this.currentSession) {
      this.currentSession.lastActivity = Date.now();
      this.currentSession.actions++;
    }
  }

  /**
   * Проверяет активность сессии
   */
  checkSessionActivity() {
    if (!this.currentSession) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastActivity = now - this.currentSession.lastActivity;
    
    // Если прошло больше времени таймаута, завершаем сессию
    if (timeSinceLastActivity > this.sessionTimeout) {
      this.endSession();
    }
  }

  /**
   * Завершает текущую сессию
   */
  endSession() {
    if (!this.currentSession) {
      return;
    }
    
    const endTime = Date.now();
    const duration = endTime - this.currentSession.startTime;
    
    const sessionData = {
      ...this.currentSession,
      endTime,
      duration,
      endUrl: window.location.href
    };
    
    // Сохраняем сессию
    this.userSessions.set(this.currentSession.id, sessionData);
    
    // Записываем в аудит
    auditService.info('session_ended', {
      sessionId: this.currentSession.id,
      duration,
      pageViews: this.currentSession.pageViews,
      actions: this.currentSession.actions,
      errors: this.currentSession.errors
    });
    
    // Уведомляем о завершении сессии
    this.emit('sessionEnded', sessionData);
    
    console.log(`ActivityService: сессия ${this.currentSession.id} завершена`, {
      duration: Math.round(duration / 1000) + 's',
      pageViews: this.currentSession.pageViews,
      actions: this.currentSession.actions,
      errors: this.currentSession.errors
    });
    
    // Создаем новую сессию
    this.initializeSession();
  }

  /**
   * Получает запись активности по ID
   */
  getActivity(id) {
    return this.activities.find(activity => activity.id === id);
  }

  /**
   * Получает все активности
   */
  getAllActivities() {
    return [...this.activities];
  }

  /**
   * Получает активности с фильтрацией
   */
  getFilteredActivities(filters = {}) {
    let filtered = [...this.activities];
    
    // Фильтр по типу
    if (filters.type) {
      filtered = filtered.filter(activity => activity.type === filters.type);
    }
    
    // Фильтр по действию
    if (filters.action) {
      filtered = filtered.filter(activity => activity.action === filters.action);
    }
    
    // Фильтр по пользователю
    if (filters.user) {
      filtered = filtered.filter(activity => activity.user === filters.user);
    }
    
    // Фильтр по сессии
    if (filters.sessionId) {
      filtered = filtered.filter(activity => activity.sessionId === filters.sessionId);
    }
    
    // Фильтр по диапазону дат
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(activity => {
        const timestamp = new Date(activity.timestamp).getTime();
        return timestamp >= start && timestamp <= end;
      });
    }
    
    // Фильтр по поисковому запросу
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.action.toLowerCase().includes(query) ||
        JSON.stringify(activity).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }

  /**
   * Получает активности по типу
   */
  getActivitiesByType(type) {
    return this.activities.filter(activity => activity.type === type);
  }

  /**
   * Получает активности по действию
   */
  getActivitiesByAction(action) {
    return this.activities.filter(activity => activity.action === action);
  }

  /**
   * Получает активности по пользователю
   */
  getActivitiesByUser(userId) {
    return this.activities.filter(activity => activity.user === userId);
  }

  /**
   * Получает активности по сессии
   */
  getActivitiesBySession(sessionId) {
    return this.activities.filter(activity => activity.sessionId === sessionId);
  }

  /**
   * Получает активности за период
   */
  getActivitiesByPeriod(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.activities.filter(activity => {
      const timestamp = new Date(activity.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Получает последние активности
   */
  getRecentActivities(limit = 100) {
    return this.activities.slice(-limit);
  }

  /**
   * Методы для работы с сессиями
   */

  /**
   * Получает текущую сессию
   */
  getCurrentSession() {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Получает все сессии пользователя
   */
  getAllSessions() {
    return Array.from(this.userSessions.values());
  }

  /**
   * Получает сессию по ID
   */
  getSession(sessionId) {
    return this.userSessions.get(sessionId);
  }

  /**
   * Получает сессии за период
   */
  getSessionsByPeriod(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return Array.from(this.userSessions.values()).filter(session => {
      const startTime = session.startTime;
      return startTime >= start && startTime <= end;
    });
  }

  /**
   * Методы для аналитики
   */

  /**
   * Получает статистику активности
   */
  getActivityStats() {
    const stats = {
      total: this.activities.length,
      byType: {},
      byAction: {},
      byUser: {},
      bySession: {},
      byDate: {},
      currentSession: this.currentSession,
      totalSessions: this.userSessions.size,
      recentActivity: this.getRecentActivities(50)
    };
    
    // Группируем по типам
    this.activities.forEach(activity => {
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
      stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1;
      stats.byUser[activity.user] = (stats.byUser[activity.user] || 0) + 1;
      stats.bySession[activity.sessionId] = (stats.bySession[activity.sessionId] || 0) + 1;
      
      const date = new Date(activity.timestamp).toDateString();
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Получает аналитику поведения пользователя
   */
  getUserBehaviorAnalytics() {
    const analytics = {
      sessionDuration: this.calculateAverageSessionDuration(),
      pageViewsPerSession: this.calculateAveragePageViewsPerSession(),
      actionsPerSession: this.calculateAverageActionsPerSession(),
      mostActiveHours: this.calculateMostActiveHours(),
      mostActiveDays: this.calculateMostActiveDays(),
      popularPages: this.calculatePopularPages(),
      userJourney: this.calculateUserJourney(),
      engagementScore: this.calculateEngagementScore()
    };
    
    return analytics;
  }

  /**
   * Вычисляет среднюю продолжительность сессии
   */
  calculateAverageSessionDuration() {
    const sessions = Array.from(this.userSessions.values());
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    return totalDuration / sessions.length;
  }

  /**
   * Вычисляет среднее количество просмотров страниц на сессию
   */
  calculateAveragePageViewsPerSession() {
    const sessions = Array.from(this.userSessions.values());
    if (sessions.length === 0) return 0;
    
    const totalPageViews = sessions.reduce((sum, session) => sum + session.pageViews, 0);
    return totalPageViews / sessions.length;
  }

  /**
   * Вычисляет среднее количество действий на сессию
   */
  calculateAverageActionsPerSession() {
    const sessions = Array.from(this.userSessions.values());
    if (sessions.length === 0) return 0;
    
    const totalActions = sessions.reduce((sum, session) => sum + session.actions, 0);
    return totalActions / sessions.length;
  }

  /**
   * Вычисляет самые активные часы
   */
  calculateMostActiveHours() {
    const hourCounts = new Array(24).fill(0);
    
    this.activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    const maxCount = Math.max(...hourCounts);
    const mostActiveHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count === maxCount)
      .map(({ hour }) => hour);
    
    return mostActiveHours;
  }

  /**
   * Вычисляет самые активные дни
   */
  calculateMostActiveDays() {
    const dayCounts = new Array(7).fill(0);
    
    this.activities.forEach(activity => {
      const day = new Date(activity.timestamp).getDay();
      dayCounts[day]++;
    });
    
    const maxCount = Math.max(...dayCounts);
    const mostActiveDays = dayCounts
      .map((count, day) => ({ day, count }))
      .filter(({ count }) => count === maxCount)
      .map(({ day }) => day);
    
    return mostActiveDays;
  }

  /**
   * Вычисляет популярные страницы
   */
  calculatePopularPages() {
    const pageCounts = {};
    
    this.activities
      .filter(activity => activity.type === this.activityTypes.pageView)
      .forEach(activity => {
        const url = activity.url;
        pageCounts[url] = (pageCounts[url] || 0) + 1;
      });
    
    return Object.entries(pageCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Вычисляет путь пользователя
   */
  calculateUserJourney() {
    const pageViews = this.activities
      .filter(activity => activity.type === this.activityTypes.pageView)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const journey = [];
    let currentSession = null;
    
    pageViews.forEach(pageView => {
      if (pageView.sessionId !== currentSession) {
        currentSession = pageView.sessionId;
        journey.push({ type: 'session_start', sessionId: currentSession });
      }
      
      journey.push({
        type: 'page_view',
        url: pageView.url,
        title: pageView.title,
        timestamp: pageView.timestamp
      });
    });
    
    return journey;
  }

  /**
   * Вычисляет оценку вовлеченности
   */
  calculateEngagementScore() {
    if (!this.currentSession) return 0;
    
    const { pageViews, actions, duration } = this.currentSession;
    const durationMinutes = duration / (1000 * 60);
    
    // Простая формула оценки вовлеченности
    let score = 0;
    score += pageViews * 10; // Каждая страница +10 баллов
    score += actions * 5; // Каждое действие +5 баллов
    score += durationMinutes * 2; // Каждая минута +2 балла
    
    return Math.min(score, 100); // Максимум 100 баллов
  }

  /**
   * Методы для управления сервисом
   */

  /**
   * Включает отслеживание
   */
  enableTracking() {
    this.isTracking = true;
    this.emit('trackingEnabled');
    console.log('ActivityService: отслеживание активности включено');
  }

  /**
   * Отключает отслеживание
   */
  disableTracking() {
    this.isTracking = false;
    this.emit('trackingDisabled');
    console.log('ActivityService: отслеживание активности отключено');
  }

  /**
   * Проверяет, включено ли отслеживание
   */
  isTrackingEnabled() {
    return this.isTracking;
  }

  /**
   * Устанавливает размер списка активностей
   */
  setMaxActivities(max) {
    if (typeof max === 'number' && max > 0) {
      this.maxActivities = max;
      
      // Обрезаем список если необходимо
      if (this.activities.length > this.maxActivities) {
        this.activities = this.activities.slice(-this.maxActivities);
      }
      
      this.emit('maxActivitiesChanged', { max });
      console.log(`ActivityService: максимальный размер списка активностей изменен на ${max}`);
      return true;
    }
    return false;
  }

  /**
   * Устанавливает таймаут сессии
   */
  setSessionTimeout(timeout) {
    if (typeof timeout === 'number' && timeout > 0) {
      this.sessionTimeout = timeout;
      this.emit('sessionTimeoutChanged', { timeout });
      console.log(`ActivityService: таймаут сессии изменен на ${timeout}ms`);
      return true;
    }
    return false;
  }

  /**
   * Методы для сохранения и загрузки
   */

  /**
   * Сохраняет данные активности
   */
  saveActivityData() {
    try {
      localStorage.setItem('activityData', JSON.stringify({
        activities: this.activities.slice(-1000), // Сохраняем только последние 1000
        userSessions: Array.from(this.userSessions.entries()),
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('ActivityService: ошибка сохранения данных активности:', error);
    }
  }

  /**
   * Загружает данные активности
   */
  loadActivityData() {
    try {
      const saved = localStorage.getItem('activityData');
      if (saved) {
        const data = JSON.parse(saved);
        
        if (data.activities) {
          this.activities = data.activities;
        }
        
        if (data.userSessions) {
          this.userSessions = new Map(data.userSessions);
        }
        
        console.log(`ActivityService: загружено ${this.activities.length} активностей и ${this.userSessions.size} сессий`);
      }
    } catch (error) {
      console.warn('ActivityService: ошибка загрузки данных активности:', error);
    }
  }

  /**
   * Методы для экспорта и импорта
   */

  /**
   * Экспортирует данные активности
   */
  exportActivityData(format = 'json') {
    try {
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify({
            activities: this.activities,
            userSessions: Array.from(this.userSessions.values()),
            currentSession: this.currentSession,
            exportTimestamp: new Date().toISOString(),
            totalActivities: this.activities.length,
            totalSessions: this.userSessions.size
          }, null, 2);
        
        case 'csv':
          return this.exportToCSV();
        
        default:
          throw new Error(`Неподдерживаемый формат: ${format}`);
      }
    } catch (error) {
      console.error('ActivityService: ошибка экспорта данных активности:', error);
      return null;
    }
  }

  /**
   * Экспортирует в CSV
   */
  exportToCSV() {
    const headers = ['ID', 'Session ID', 'User', 'Type', 'Action', 'URL', 'Timestamp'];
    const rows = this.activities.map(activity => [
      activity.id,
      activity.sessionId,
      activity.user,
      activity.type,
      activity.action,
      activity.url || '',
      activity.timestamp
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * Импортирует данные активности
   */
  importActivityData(data) {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      let importedCount = 0;
      
      if (data.activities && Array.isArray(data.activities)) {
        data.activities.forEach(activity => {
          if (activity.id && !this.getActivity(activity.id)) {
            this.addToActivities(activity);
            importedCount++;
          }
        });
      }
      
      if (data.userSessions && Array.isArray(data.userSessions)) {
        data.userSessions.forEach(session => {
          if (session.id && !this.userSessions.has(session.id)) {
            this.userSessions.set(session.id, session);
          }
        });
      }
      
      this.emit('activityDataImported', { importedCount });
      console.log(`ActivityService: импортировано ${importedCount} активностей`);
      
      return true;
    } catch (error) {
      console.error('ActivityService: ошибка импорта данных активности:', error);
      return false;
    }
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
        console.error(`ActivityService: ошибка в обработчике события ${event}:`, error);
      }
    });
  }

  /**
   * Получает статус сервиса
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      totalActivities: this.activities.length,
      maxActivities: this.maxActivities,
      currentSession: this.currentSession ? { ...this.currentSession } : null,
      totalSessions: this.userSessions.size,
      sessionTimeout: this.sessionTimeout
    };
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    this.activities = [];
    this.userSessions.clear();
    this.currentSession = null;
    this.eventListeners.clear();
    
    console.log('ActivityService: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const activityService = new ActivityService();

export default activityService; 