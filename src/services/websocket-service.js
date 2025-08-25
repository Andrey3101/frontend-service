/**
 * WebSocket сервис для real-time коммуникации с task-service
 * Обеспечивает двустороннюю связь для уведомлений и обновлений
 */

import { getWebSocketConfig } from '../config/task-service';

class WebSocketService {
  constructor() {
    this.config = getWebSocketConfig();
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.messageQueue = [];
    this.eventListeners = new Map();
    this.connectionStatus = 'disconnected';
    
    // Привязываем методы к контексту
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.sendHeartbeat = this.sendHeartbeat.bind(this);
  }

  /**
   * Подключается к WebSocket серверу
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket уже подключен');
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
      this.connectionStatus = 'connecting';
      
      console.log('WebSocket: попытка подключения к', this.config.url);
    } catch (error) {
      console.error('WebSocket: ошибка создания соединения:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Настраивает обработчики событий WebSocket
   */
  setupEventHandlers() {
    this.ws.onopen = this.handleOpen;
    this.ws.onmessage = this.handleMessage;
    this.ws.onclose = this.handleClose;
    this.ws.onerror = this.handleError;
  }

  /**
   * Обработчик открытия соединения
   */
  handleOpen(event) {
    console.log('WebSocket: соединение установлено');
    this.isConnected = true;
    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
    
    // Очищаем таймер переподключения
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Запускаем heartbeat
    this.startHeartbeat();
    
    // Отправляем накопленные сообщения
    this.flushMessageQueue();
    
    // Уведомляем слушателей о подключении
    this.emit('connected', event);
  }

  /**
   * Обработчик получения сообщения
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket: получено сообщение:', data);
      
      // Обрабатываем различные типы сообщений
      this.handleIncomingMessage(data);
      
      // Уведомляем слушателей о сообщении
      this.emit('message', data);
    } catch (error) {
      console.error('WebSocket: ошибка парсинга сообщения:', error);
    }
  }

  /**
   * Обработчик закрытия соединения
   */
  handleClose(event) {
    console.log('WebSocket: соединение закрыто:', event.code, event.reason);
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
    
    // Останавливаем heartbeat
    this.stopHeartbeat();
    
    // Уведомляем слушателей о закрытии
    this.emit('disconnected', event);
    
    // Пытаемся переподключиться если это не было инициативным закрытием
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Обработчик ошибок WebSocket
   */
  handleError(error) {
    console.error('WebSocket: ошибка:', error);
    this.connectionStatus = 'error';
    
    // Уведомляем слушателей об ошибке
    this.emit('error', error);
  }

  /**
   * Обрабатывает входящие сообщения по типу
   */
  handleIncomingMessage(data) {
    const { type, payload, timestamp } = data;
    
    switch (type) {
      case 'task_update':
        this.handleTaskUpdate(payload);
        break;
      case 'task_created':
        this.handleTaskCreated(payload);
        break;
      case 'task_deleted':
        this.handleTaskDeleted(payload);
        break;
      case 'comment_added':
        this.handleCommentAdded(payload);
        break;
      case 'notification':
        this.handleNotification(payload);
        break;
      case 'meeting_reminder':
        this.handleMeetingReminder(payload);
        break;
      case 'deadline_warning':
        this.handleDeadlineWarning(payload);
        break;
      case 'system_status':
        this.handleSystemStatus(payload);
        break;
      case 'heartbeat':
        this.handleHeartbeat(payload);
        break;
      default:
        console.warn('WebSocket: неизвестный тип сообщения:', type);
    }
  }

  /**
   * Обработчики конкретных типов сообщений
   */
  handleTaskUpdate(payload) {
    console.log('WebSocket: обновление задачи:', payload);
    this.emit('task:updated', payload);
  }

  handleTaskCreated(payload) {
    console.log('WebSocket: создана новая задача:', payload);
    this.emit('task:created', payload);
  }

  handleTaskDeleted(payload) {
    console.log('WebSocket: удалена задача:', payload);
    this.emit('task:deleted', payload);
  }

  handleCommentAdded(payload) {
    console.log('WebSocket: добавлен комментарий:', payload);
    this.emit('comment:added', payload);
  }

  handleNotification(payload) {
    console.log('WebSocket: уведомление:', payload);
    this.emit('notification', payload);
  }

  handleMeetingReminder(payload) {
    console.log('WebSocket: напоминание о встрече:', payload);
    this.emit('meeting:reminder', payload);
  }

  handleDeadlineWarning(payload) {
    console.log('WebSocket: предупреждение о дедлайне:', payload);
    this.emit('deadline:warning', payload);
  }

  handleSystemStatus(payload) {
    console.log('WebSocket: статус системы:', payload);
    this.emit('system:status', payload);
  }

  handleHeartbeat(payload) {
    console.log('WebSocket: heartbeat получен:', payload);
    this.emit('heartbeat', payload);
  }

  /**
   * Отправляет сообщение через WebSocket
   */
  send(type, payload = {}) {
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('WebSocket: отправлено сообщение:', message);
        return true;
      } catch (error) {
        console.error('WebSocket: ошибка отправки сообщения:', error);
        return false;
      }
    } else {
      // Добавляем сообщение в очередь
      this.messageQueue.push(message);
      console.log('WebSocket: сообщение добавлено в очередь:', message);
      return false;
    }
  }

  /**
   * Отправляет сообщение о создании задачи
   */
  sendTaskCreated(task) {
    return this.send('task_created', { task });
  }

  /**
   * Отправляет сообщение об обновлении задачи
   */
  sendTaskUpdated(task) {
    return this.send('task_updated', { task });
  }

  /**
   * Отправляет сообщение об удалении задачи
   */
  sendTaskDeleted(taskId) {
    return this.send('task_deleted', { taskId });
  }

  /**
   * Отправляет сообщение о добавлении комментария
   */
  sendCommentAdded(comment) {
    return this.send('comment_added', { comment });
  }

  /**
   * Отправляет сообщение о начале отслеживания времени
   */
  sendTimeTrackingStarted(taskId, userId) {
    return this.send('time_tracking_started', { taskId, userId });
  }

  /**
   * Отправляет сообщение об остановке отслеживания времени
   */
  sendTimeTrackingStopped(taskId, userId, duration) {
    return this.send('time_tracking_stopped', { taskId, userId, duration });
  }

  /**
   * Отправляет запрос на синхронизацию
   */
  sendSyncRequest(dataType) {
    return this.send('sync_request', { dataType });
  }

  /**
   * Отправляет heartbeat
   */
  sendHeartbeat() {
    return this.send('heartbeat', { timestamp: Date.now() });
  }

  /**
   * Запускает heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Останавливает heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Планирует переподключение
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`WebSocket: переподключение через ${delay}ms (попытка ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Обрабатывает ошибки подключения
   */
  handleConnectionError(error) {
    console.error('WebSocket: ошибка подключения:', error);
    this.connectionStatus = 'error';
    
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Отправляет накопленные сообщения
   */
  flushMessageQueue() {
    if (this.messageQueue.length === 0) {
      return;
    }

    console.log(`WebSocket: отправка ${this.messageQueue.length} сообщений из очереди`);
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(message => {
      this.send(message.type, message.payload);
    });
  }

  /**
   * Генерирует уникальный ID для сообщения
   */
  generateMessageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Подписывается на события
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Отписывается от событий
   */
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

  /**
   * Уведомляет слушателей о событии
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`WebSocket: ошибка в обработчике события ${event}:`, error);
      }
    });
  }

  /**
   * Получает статус соединения
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts,
      url: this.config.url
    };
  }

  /**
   * Получает статистику соединения
   */
  getConnectionStats() {
    return {
      isConnected: this.isConnected,
      connectionStatus: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts,
      messageQueueLength: this.messageQueue.length,
      eventListenersCount: this.eventListeners.size,
      url: this.config.url,
      config: this.config
    };
  }

  /**
   * Отключается от WebSocket сервера
   */
  disconnect() {
    if (this.ws) {
      // Останавливаем heartbeat
      this.stopHeartbeat();
      
      // Очищаем таймер переподключения
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Закрываем соединение
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Disconnect requested');
      }
      
      this.ws = null;
      this.isConnected = false;
      this.connectionStatus = 'disconnected';
      
      console.log('WebSocket: соединение закрыто');
    }
  }

  /**
   * Переподключается к серверу
   */
  reconnect() {
    console.log('WebSocket: принудительное переподключение');
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Очищает все ресурсы
   */
  destroy() {
    this.disconnect();
    
    // Очищаем слушателей событий
    this.eventListeners.clear();
    
    // Очищаем очередь сообщений
    this.messageQueue = [];
    
    console.log('WebSocket: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const websocketService = new WebSocketService();

export default websocketService; 