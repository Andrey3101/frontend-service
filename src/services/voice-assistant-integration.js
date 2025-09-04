/**
 * Обновленный интеграционный сервис для voice-assistant
 * Использует единый API клиент с версионированием v2
 */

import apiClient from './api-client.js';
import websocketService from './websocket-service.js';
import { getVoiceAssistantConfig } from '../config/voice-assistant';

class VoiceAssistantIntegration {
  constructor() {
    this.client = apiClient;
    this.wsService = websocketService;
    this.config = getVoiceAssistantConfig();
    this.isListening = false;
    this.isSpeaking = false;
    this.recognitionStream = null;
    this.synthesisQueue = [];
  }

  /**
   * Обработка голосовой команды
   */
  async processVoiceCommand(audioFile, language = 'ru') {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language', language);
    
    return this.client.post('/v2/voice/command', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Подключение к голосовому WebSocket
   */
  async connectVoiceWebSocket() {
    const config = getVoiceAssistantConfig();
    return this.wsService.connect(config.wsURL);
  }

  /**
   * Отключение от голосового WebSocket
   */
  async disconnectVoiceWebSocket() {
    return this.wsService.disconnect();
  }

  /**
   * Синтез речи
   */
  async synthesizeSpeech(text, voice = 'default', language = 'ru') {
    return this.client.post('/v2/voice/synthesize', {
      text,
      voice,
      language
    });
  }

  /**
   * Распознавание речи
   */
  async transcribeSpeech(audioFile, language = 'ru') {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language', language);
    
    return this.client.post('/v2/voice/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Получение доступных голосов
   */
  async getAvailableVoices(language = 'ru') {
    return this.client.get('/v2/voice/voices', { language }, { cache: true });
  }

  /**
   * Получение настроек голосового помощника
   */
  async getVoiceSettings(userId) {
    return this.client.get(`/v2/voice/settings/${userId}`, null, { cache: true });
  }

  /**
   * Обновление настроек голосового помощника
   */
  async updateVoiceSettings(userId, settings) {
    return this.client.put(`/v2/voice/settings/${userId}`, settings);
  }

  /**
   * Создание голосового события
   */
  async createVoiceEvent(eventData) {
    return this.client.post('/v2/voice/events', eventData);
  }

  /**
   * Получение голосовых событий
   */
  async getVoiceEvents(filters = {}) {
    return this.client.get('/v2/voice/events', filters, { cache: true });
  }

  /**
   * Создание голосовой метрики
   */
  async createVoiceMetric(metricData) {
    return this.client.post('/v2/voice/metrics', metricData);
  }

  /**
   * Получение голосовых метрик
   */
  async getVoiceMetrics(filters = {}) {
    return this.client.get('/v2/voice/metrics', filters, { cache: true });
  }

  /**
   * Получение аналитики голосовых взаимодействий
   */
  async getVoiceAnalytics(userId, period = 'week') {
    return this.client.get(`/v2/voice/analytics/${userId}?period=${period}`, null, { cache: true });
  }

  /**
   * Отправка сообщения через WebSocket
   */
  async sendWebSocketMessage(type, payload = {}) {
    return this.wsService.send({
      type,
      payload,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Подписка на WebSocket события
   */
  on(event, callback) {
    return this.wsService.on(event, callback);
  }

  /**
   * Отписка от WebSocket событий
   */
  off(event, callback) {
    return this.wsService.off(event, callback);
  }

  /**
   * Начало прослушивания
   */
  async startListening(language = 'ru') {
    if (this.isListening) {
      console.warn('Voice Assistant: уже прослушивает');
      return;
    }

    try {
      this.isListening = true;
      await this.sendWebSocketMessage('start_listening', { language });
      console.log('Voice Assistant: начало прослушивания');
    } catch (error) {
      this.isListening = false;
      console.error('Voice Assistant: ошибка начала прослушивания:', error);
      throw error;
    }
  }

  /**
   * Остановка прослушивания
   */
  async stopListening() {
    if (!this.isListening) {
      console.warn('Voice Assistant: не прослушивает');
      return;
    }

    try {
      this.isListening = false;
      await this.sendWebSocketMessage('stop_listening');
      console.log('Voice Assistant: остановка прослушивания');
    } catch (error) {
      console.error('Voice Assistant: ошибка остановки прослушивания:', error);
      throw error;
    }
  }

  /**
   * Воспроизведение речи
   */
  async speak(text, voice = 'default', language = 'ru') {
    if (this.isSpeaking) {
      // Добавляем в очередь
      this.synthesisQueue.push({ text, voice, language });
      return;
    }

    try {
      this.isSpeaking = true;
      const response = await this.synthesizeSpeech(text, voice, language);
      
      if (response.success && response.data.audio_url) {
        await this.playAudio(response.data.audio_url);
      }
      
      this.isSpeaking = false;
      
      // Обрабатываем очередь
      if (this.synthesisQueue.length > 0) {
        const next = this.synthesisQueue.shift();
        await this.speak(next.text, next.voice, next.language);
      }
    } catch (error) {
      this.isSpeaking = false;
      console.error('Voice Assistant: ошибка воспроизведения речи:', error);
      throw error;
    }
  }

  /**
   * Воспроизведение аудио
   */
  async playAudio(audioUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        resolve();
      };
      
      audio.onerror = (error) => {
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  }

  /**
   * Обработка голосовой команды
   */
  async handleVoiceCommand(command) {
    try {
      const response = await this.processVoiceCommand(command);
      
      if (response.success) {
        // Выполняем команду
        await this.executeCommand(response.data.command);
        
        // Отвечаем голосом
        if (response.data.response) {
          await this.speak(response.data.response);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Voice Assistant: ошибка обработки команды:', error);
      throw error;
    }
  }

  /**
   * Выполнение команды
   */
  async executeCommand(command) {
    switch (command.type) {
      case 'create_task':
        // Создание задачи
        break;
      case 'get_tasks':
        // Получение задач
        break;
      case 'send_message':
        // Отправка сообщения
        break;
      case 'open_document':
        // Открытие документа
        break;
      default:
        console.warn('Voice Assistant: неизвестная команда:', command.type);
    }
  }

  /**
   * Проверка здоровья сервиса
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/v2/voice/health');
      return {
        healthy: true,
        status: response.data.status,
        timestamp: response.data.timestamp,
        version: response.data.version
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Получение информации о сервисе
   */
  async getServiceInfo() {
    try {
      const response = await this.client.get('/v2/voice/info');
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения информации о Voice Assistant: ${error.message}`);
    }
  }

  /**
   * Получение статуса сервиса
   */
  getStatus() {
    return {
      wsConnected: this.wsService.isConnected,
      wsStatus: this.wsService.getStatus(),
      apiStatus: this.client.getStatus(),
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      synthesisQueueLength: this.synthesisQueue.length
    };
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    this.isListening = false;
    this.isSpeaking = false;
    this.synthesisQueue = [];
    
    if (this.recognitionStream) {
      this.recognitionStream.stop();
      this.recognitionStream = null;
    }
  }
}

// Создаем и экспортируем единственный экземпляр
const voiceAssistantIntegration = new VoiceAssistantIntegration();

export default voiceAssistantIntegration; 