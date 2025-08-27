/**
 * Интеграционный сервис для voice-assistant
 * Обеспечивает взаимодействие между frontend и voice-assistant
 */

import { getVoiceAssistantConfig, getWebSocketConfig } from '../config/voice-assistant';

class VoiceAssistantIntegration {
  constructor() {
    this.config = getVoiceAssistantConfig();
    this.wsConfig = getWebSocketConfig();
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.messageQueue = [];
    this.eventListeners = new Map();
    this.recognitionStream = null;
    this.synthesisQueue = [];
    
    this.setupEventHandlers();
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventHandlers() {
    // Обработчик успешного подключения
    this.on('connected', () => {
      console.log('Voice Assistant: WebSocket подключен');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.processMessageQueue();
      this.startHeartbeat();
    });

    // Обработчик отключения
    this.on('disconnected', () => {
      console.log('Voice Assistant: WebSocket отключен');
      this.isConnected = false;
      this.stopHeartbeat();
      this.scheduleReconnect();
    });

    // Обработчик ошибок
    this.on('error', (error) => {
      console.error('Voice Assistant: WebSocket ошибка:', error);
      this.handleConnectionError(error);
    });

    // Обработчик сообщений
    this.on('message', (data) => {
      this.handleMessage(data);
    });
  }

  /**
   * Подключение к WebSocket
   */
  connect() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      console.log('Voice Assistant: WebSocket уже подключен');
      return;
    }

    try {
      this.websocket = new WebSocket(this.wsConfig.url, this.wsConfig.protocols);
      this.setupWebSocketHandlers();
      console.log('Voice Assistant: попытка подключения к', this.wsConfig.url);
    } catch (error) {
      console.error('Voice Assistant: ошибка создания WebSocket:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Настройка обработчиков WebSocket
   */
  setupWebSocketHandlers() {
    this.websocket.onopen = () => {
      this.emit('connected');
    };

    this.websocket.onclose = (event) => {
      console.log('Voice Assistant: WebSocket закрыт:', event.code, event.reason);
      this.emit('disconnected', event);
    };

    this.websocket.onerror = (error) => {
      console.error('Voice Assistant: WebSocket ошибка:', error);
      this.emit('error', error);
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (error) {
        console.error('Voice Assistant: ошибка парсинга сообщения:', error);
      }
    };
  }

  /**
   * Отключение от WebSocket
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.clearReconnectTimer();
  }

  /**
   * Планирование переподключения
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.wsConfig.maxReconnectAttempts) {
      console.error('Voice Assistant: превышено максимальное количество попыток переподключения');
      return;
    }

    this.clearReconnectTimer();
    const delay = this.wsConfig.reconnectInterval * Math.pow(2, this.reconnectAttempts);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Voice Assistant: попытка переподключения ${this.reconnectAttempts + 1}`);
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Очистка таймера переподключения
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Запуск heartbeat
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, this.wsConfig.heartbeatInterval);
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
   * Отправка сообщения
   */
  sendMessage(message) {
    if (this.isConnected && this.websocket) {
      try {
        this.websocket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Voice Assistant: ошибка отправки сообщения:', error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Обработка очереди сообщений
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  /**
   * Обработка входящих сообщений
   */
  handleMessage(data) {
    switch (data.type) {
      case 'recognition_result':
        this.emit('recognitionResult', data);
        break;
      case 'synthesis_ready':
        this.emit('synthesisReady', data);
        break;
      case 'command_executed':
        this.emit('commandExecuted', data);
        break;
      case 'error':
        this.emit('error', data);
        break;
      default:
        console.log('Voice Assistant: неизвестный тип сообщения:', data.type);
    }
  }

  /**
   * Методы для распознавания речи
   */

  /**
   * Начало распознавания речи
   */
  async startVoiceRecognition(options = {}) {
    const defaultOptions = {
      language: 'ru',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // Проверяем поддержку Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        return this.startBrowserRecognition(finalOptions);
      } else {
        // Используем WebSocket для распознавания
        return this.startWebSocketRecognition(finalOptions);
      }
    } catch (error) {
      console.error('Voice Assistant: ошибка запуска распознавания:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Распознавание через браузер
   */
  startBrowserRecognition(options) {
    return new Promise((resolve, reject) => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = options.language;
        recognition.continuous = options.continuous;
        recognition.interimResults = options.interimResults;
        recognition.maxAlternatives = options.maxAlternatives;

        recognition.onstart = () => {
          this.emit('recognitionStarted');
          resolve({ success: true, method: 'browser' });
        };

        recognition.onresult = (event) => {
          const results = Array.from(event.results);
          const transcript = results
            .map(result => result[0].transcript)
            .join('');

          this.emit('recognitionResult', {
            transcript,
            isFinal: results[results.length - 1].isFinal,
            confidence: results[results.length - 1][0].confidence
          });
        };

        recognition.onerror = (event) => {
          this.emit('recognitionError', event.error);
          reject({ success: false, error: event.error });
        };

        recognition.onend = () => {
          this.emit('recognitionEnded');
        };

        recognition.start();
        this.recognitionStream = recognition;

      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }

  /**
   * Распознавание через WebSocket
   */
  startWebSocketRecognition(options) {
    if (!this.isConnected) {
      this.connect();
    }

    this.sendMessage({
      type: 'start_recognition',
      options
    });

    return { success: true, method: 'websocket' };
  }

  /**
   * Остановка распознавания речи
   */
  stopVoiceRecognition() {
    if (this.recognitionStream) {
      this.recognitionStream.stop();
      this.recognitionStream = null;
    }

    if (this.isConnected) {
      this.sendMessage({ type: 'stop_recognition' });
    }

    this.emit('recognitionStopped');
  }

  /**
   * Методы для синтеза речи
   */

  /**
   * Синтез речи
   */
  async synthesizeSpeech(text, options = {}) {
    const defaultOptions = {
      voice: 'anna',
      language: 'ru',
      speed: 1.0,
      pitch: 1.0
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // Проверяем поддержку Web Speech API
      if ('speechSynthesis' in window) {
        return this.browserSpeechSynthesis(text, finalOptions);
      } else {
        // Используем WebSocket для синтеза
        return this.webSocketSpeechSynthesis(text, finalOptions);
      }
    } catch (error) {
      console.error('Voice Assistant: ошибка синтеза речи:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Синтез речи через браузер
   */
  browserSpeechSynthesis(text, options) {
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.language;
        utterance.rate = options.speed;
        utterance.pitch = options.pitch;

        utterance.onstart = () => {
          this.emit('synthesisStarted', { text, options });
        };

        utterance.onend = () => {
          this.emit('synthesisEnded', { text, options });
          resolve({ success: true, method: 'browser' });
        };

        utterance.onerror = (event) => {
          this.emit('synthesisError', event.error);
          reject({ success: false, error: event.error });
        };

        speechSynthesis.speak(utterance);

      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }

  /**
   * Синтез речи через WebSocket
   */
  webSocketSpeechSynthesis(text, options) {
    if (!this.isConnected) {
      this.connect();
    }

    const message = {
      type: 'synthesize_speech',
      text,
      options
    };

    this.sendMessage(message);
    this.synthesisQueue.push({ text, options });

    return { success: true, method: 'websocket' };
  }

  /**
   * Методы для голосовых команд
   */

  /**
   * Выполнение голосовой команды
   */
  async executeVoiceCommand(command, context = {}) {
    try {
      if (!this.isConnected) {
        this.connect();
      }

      this.sendMessage({
        type: 'execute_command',
        command,
        context,
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Получение доступных команд
   */
  async getAvailableCommands() {
    try {
      if (!this.isConnected) {
        this.connect();
      }

      this.sendMessage({
        type: 'get_commands',
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Система событий
   */

  /**
   * Подписка на событие
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Отписка от события
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Эмиссия события
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Voice Assistant: ошибка в обработчике события ${event}:`, error);
        }
      });
    }
  }

  /**
   * Обработка ошибок подключения
   */
  handleConnectionError(error) {
    this.emit('error', error);
    this.scheduleReconnect();
  }

  /**
   * Проверка здоровья сервиса
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.config.baseURL}/health`, {
        method: 'GET',
        timeout: this.config.timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          status: data.status,
          timestamp: data.timestamp,
          version: data.version,
          features: data.features || [],
          models: data.models || []
        };
      } else {
        return {
          healthy: false,
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Получение статуса сервиса
   */
  getStatus() {
    return {
      configured: !!this.config.baseURL,
      connected: this.isConnected,
      baseURL: this.config.baseURL,
      websocketURL: this.wsConfig.url,
      timeout: this.config.timeout,
      reconnectAttempts: this.reconnectAttempts,
      features: {
        speechRecognition: true,
        speechSynthesis: true,
        voiceCommands: true,
        websocket: true
      }
    };
  }
}

// Создаем и экспортируем единственный экземпляр
const voiceAssistantIntegration = new VoiceAssistantIntegration();

export default voiceAssistantIntegration; 