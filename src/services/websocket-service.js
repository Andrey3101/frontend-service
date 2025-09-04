/**
 * Улучшенный WebSocket сервис для real-time коммуникации
 * Обеспечивает надежную связь с полной обработкой состояний,
 * автоматическим переподключением и буферизацией сообщений
 */

import { getWebSocketConfig } from '../config/task-service';

class WebSocketService {
  constructor() {
    this.config = getWebSocketConfig();
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.heartbeatInterval = 30000; // 30 секунд
    this.messageQueue = [];
    this.eventListeners = new Map();
    this.connectionStatus = 'disconnected';
    this.lastHeartbeat = Date.now();
    this.connectionStartTime = null;
    this.messageBuffer = [];
    this.maxBufferSize = 100;
    
    // Привязываем методы к контексту
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.sendHeartbeat = this.sendHeartbeat.bind(this);
    this.processMessageQueue = this.processMessageQueue.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  /**
   * Подключение к WebSocket серверу
   */
  async connect() {
    if (this.isConnecting) {
      console.log('WebSocket: уже выполняется подключение...');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket: уже подключен');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket: подключение в процессе...');
      return;
    }

    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    try {
      console.log('WebSocket: попытка подключения к', this.config.url);
      
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
      this.connectionStartTime = Date.now();
      
    } catch (error) {
      console.error('WebSocket: ошибка создания соединения:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Настройка обработчиков событий WebSocket
   */
  setupEventHandlers() {
    if (!this.ws) return;

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
    this.isConnecting = false;
    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
    this.lastHeartbeat = Date.now();
    
    // Очищаем таймер переподключения
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Запускаем heartbeat
    this.startHeartbeat();
    
    // Обрабатываем накопленные сообщения
    this.processMessageQueue();
    
    // Уведомляем слушателей о подключении
    this.emit('connected', {
      timestamp: Date.now(),
      connectionTime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0
    });
  }

  /**
   * Обработчик получения сообщения
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket: получено сообщение:', data);
      
      // Обновляем время последнего heartbeat
      if (data.type === 'heartbeat') {
        this.lastHeartbeat = Date.now();
        return;
      }
      
      // Добавляем сообщение в буфер
      this.addToBuffer(data);
      
      // Обрабатываем различные типы сообщений
      this.handleIncomingMessage(data);
      
      // Уведомляем слушателей о сообщении
      this.emit('message', data);
    } catch (error) {
      console.error('WebSocket: ошибка парсинга сообщения:', error);
      this.emit('error', { type: 'parse_error', error: error.message });
    }
  }

  /**
   * Обработчик закрытия соединения
   */
  handleClose(event) {
    console.log('WebSocket: соединение закрыто', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionStatus = 'disconnected';
    
    // Останавливаем heartbeat
    this.stopHeartbeat();
    
    // Очищаем таймер переподключения
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Определяем, нужно ли переподключение
    if (event.code === 1000 || event.code === 1001) {
      // Нормальное закрытие или уход со страницы
      console.log('WebSocket: нормальное закрытие, переподключение не требуется');
      this.emit('disconnected', { reason: 'normal_close', code: event.code });
    } else {
      // Аномальное закрытие - пытаемся переподключиться
      console.log('WebSocket: аномальное закрытие, пытаемся переподключиться');
      this.scheduleReconnect();
      this.emit('disconnected', { reason: 'abnormal_close', code: event.code });
    }
  }

  /**
   * Обработчик ошибок
   */
  handleError(error) {
    console.error('WebSocket: ошибка соединения:', error);
    this.connectionStatus = 'error';
    this.emit('error', { type: 'connection_error', error: error.message });
  }

  /**
   * Обработка ошибки подключения
   */
  handleConnectionError(error) {
    this.isConnecting = false;
    this.connectionStatus = 'error';
    this.emit('error', { type: 'connection_error', error: error.message });
    this.scheduleReconnect();
  }

  /**
   * Планирование переподключения
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('WebSocket: достигнут максимальный лимит попыток переподключения');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    console.log(`WebSocket: переподключение через ${delay}ms (попытка ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Запуск heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
  }

  /**
   * Остановка heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Отправка heartbeat
   */
  sendHeartbeat() {
    if (this.isConnected) {
      this.send({
        type: 'heartbeat',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Отправка сообщения
   */
  send(data) {
    if (!this.isConnected) {
      // Добавляем в очередь, если не подключены
      this.messageQueue.push(data);
      console.log('WebSocket: сообщение добавлено в очередь (не подключены)');
      return false;
    }

    try {
      const message = JSON.stringify(data);
      this.ws.send(message);
      console.log('WebSocket: отправлено сообщение:', data);
      return true;
    } catch (error) {
      console.error('WebSocket: ошибка отправки сообщения:', error);
      this.emit('error', { type: 'send_error', error: error.message });
      return false;
    }
  }

  /**
   * Обработка очереди сообщений
   */
  processMessageQueue() {
    if (this.messageQueue.length === 0) return;

    console.log(`WebSocket: обработка ${this.messageQueue.length} сообщений из очереди`);
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Добавление сообщения в буфер
   */
  addToBuffer(message) {
    this.messageBuffer.push({
      ...message,
      timestamp: Date.now()
    });
    
    // Ограничиваем размер буфера
    if (this.messageBuffer.length > this.maxBufferSize) {
      this.messageBuffer.shift();
    }
  }

  /**
   * Получение сообщений из буфера
   */
  getMessageBuffer(limit = 50) {
    return this.messageBuffer.slice(-limit);
  }

  /**
   * Очистка буфера сообщений
   */
  clearMessageBuffer() {
    this.messageBuffer = [];
  }

  /**
   * Обработка входящих сообщений по типу
   */
  handleIncomingMessage(data) {
    switch (data.type) {
      case 'task_update':
        this.handleTaskUpdate(data);
        break;
      case 'notification':
        this.handleNotification(data);
        break;
      case 'user_status':
        this.handleUserStatus(data);
        break;
      case 'system_alert':
        this.handleSystemAlert(data);
        break;
      case 'heartbeat':
        // Обрабатывается в handleMessage
        break;
      default:
        console.log('WebSocket: неизвестный тип сообщения:', data.type);
    }
  }

  /**
   * Обработка обновления задачи
   */
  handleTaskUpdate(data) {
    this.emit('task_update', data);
  }

  /**
   * Обработка уведомления
   */
  handleNotification(data) {
    this.emit('notification', data);
  }

  /**
   * Обработка статуса пользователя
   */
  handleUserStatus(data) {
    this.emit('user_status', data);
  }

  /**
   * Обработка системного предупреждения
   */
  handleSystemAlert(data) {
    this.emit('system_alert', data);
  }

  /**
   * Отключение от сервера
   */
  disconnect() {
    console.log('WebSocket: принудительное отключение');
    
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
    
    this.cleanup();
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.ws = null;
  }

  /**
   * Подписка на события
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Отписка от событий
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Уведомление о событиях
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) return;
    
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`WebSocket: ошибка в обработчике события ${event}:`, error);
      }
    });
  }

  /**
   * Получение статуса соединения
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      status: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      messageQueueSize: this.messageQueue.length,
      bufferSize: this.messageBuffer.length,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0
    };
  }

  /**
   * Проверка здоровья соединения
   */
  isHealthy() {
    if (!this.isConnected) return false;
    
    const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
    return timeSinceLastHeartbeat < this.heartbeatInterval * 2;
  }

  /**
   * Принудительная перезагрузка соединения
   */
  async reconnect() {
    console.log('WebSocket: принудительное переподключение');
    this.disconnect();
    
    // Ждем немного перед переподключением
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Установка максимального количества попыток переподключения
   */
  setMaxReconnectAttempts(max) {
    this.maxReconnectAttempts = max;
  }

  /**
   * Установка интервала heartbeat
   */
  setHeartbeatInterval(interval) {
    this.heartbeatInterval = interval;
    if (this.isConnected) {
      this.stopHeartbeat();
      this.startHeartbeat();
    }
  }

  /**
   * Установка размера буфера сообщений
   */
  setMaxBufferSize(size) {
    this.maxBufferSize = size;
    while (this.messageBuffer.length > this.maxBufferSize) {
      this.messageBuffer.shift();
    }
  }
}

// Создаем и экспортируем единственный экземпляр
const websocketService = new WebSocketService();

export default websocketService; 