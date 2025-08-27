/**
 * Интеграционный сервис для ai-service
 * Обеспечивает взаимодействие между frontend и ai-service
 */

import axios from 'axios';
import { getAIServiceConfig } from '../config/ai-service';

class AIServiceIntegration {
  constructor() {
    this.config = getAIServiceConfig();
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Создает экземпляр axios с базовой конфигурацией
   */
  createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return instance;
  }

  /**
   * Настраивает перехватчики для обработки ошибок
   */
  setupInterceptors() {
    // Перехватчик запросов
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Добавляем заголовки для CORS
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Перехватчик ответов
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Обрабатываем различные типы ошибок
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 400:
              this.handleBadRequest(data);
              break;
            case 422:
              this.handleValidationError(data);
              break;
            case 500:
              this.handleServerError(data);
              break;
            default:
              this.handleGenericError(status, data);
          }
        } else if (error.request) {
          // Запрос был отправлен, но ответ не получен
          this.handleNetworkError();
        } else {
          // Ошибка при настройке запроса
          this.handleRequestError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Методы для анализа данных
   */

  /**
   * Анализ данных
   */
  async analyzeData(data, analysisType = 'general') {
    try {
      const response = await this.axiosInstance.post('/analysis', {
        data,
        type: analysisType
      });
      
      return {
        success: true,
        analysis: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Получение предсказания
   */
  async getPrediction(model, input, options = {}) {
    try {
      const response = await this.axiosInstance.post('/prediction', {
        model,
        input,
        options
      });
      
      return {
        success: true,
        prediction: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Обучение модели
   */
  async trainModel(trainingData, modelType = 'regression', options = {}) {
    try {
      const response = await this.axiosInstance.post('/training', {
        data: trainingData,
        model_type: modelType,
        options
      });
      
      return {
        success: true,
        training: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Получение списка доступных моделей
   */
  async getAvailableModels() {
    try {
      const response = await this.axiosInstance.get('/models');
      
      return {
        success: true,
        models: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Методы для обработки речи
   */

  /**
   * Распознавание речи
   */
  async recognizeSpeech(audioData, language = 'ru') {
    try {
      const formData = new FormData();
      formData.append('audio', audioData);
      formData.append('language', language);

      const response = await this.axiosInstance.post('/speech/recognize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return {
        success: true,
        recognition: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Синтез речи
   */
  async synthesizeSpeech(text, voice = 'anna', language = 'ru') {
    try {
      const response = await this.axiosInstance.post('/speech/synthesize', {
        text,
        voice,
        language
      });
      
      return {
        success: true,
        synthesis: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Методы для NLP
   */

  /**
   * Анализ тональности
   */
  async analyzeSentiment(text, language = 'ru') {
    try {
      const response = await this.axiosInstance.post('/nlp/sentiment', {
        text,
        language
      });
      
      return {
        success: true,
        sentiment: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Классификация текста
   */
  async classifyText(text, categories = [], language = 'ru') {
    try {
      const response = await this.axiosInstance.post('/nlp/classify', {
        text,
        categories,
        language
      });
      
      return {
        success: true,
        classification: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Извлечение ключевых слов
   */
  async extractKeywords(text, maxKeywords = 10, language = 'ru') {
    try {
      const response = await this.axiosInstance.post('/nlp/keywords', {
        text,
        max_keywords: maxKeywords,
        language
      });
      
      return {
        success: true,
        keywords: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Обработка ошибок
   */

  handleBadRequest(data) {
    console.error('Некорректный запрос:', data);
  }

  handleValidationError(data) {
    console.error('Ошибка валидации:', data);
  }

  handleServerError(data) {
    console.error('Ошибка сервера:', data);
  }

  handleGenericError(status, data) {
    console.error(`HTTP ${status}:`, data);
  }

  handleNetworkError() {
    console.error('Ошибка сети');
  }

  handleRequestError(error) {
    console.error('Ошибка запроса:', error);
  }

  /**
   * Проверка здоровья сервиса
   */
  async checkHealth() {
    try {
      const response = await this.axiosInstance.get('/health');
      return {
        healthy: true,
        status: response.data.status,
        timestamp: response.data.timestamp,
        version: response.data.version,
        models: response.data.models || [],
        gpu: response.data.gpu || false
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Получение информации о сервисе
   */
  async getServiceInfo() {
    try {
      const response = await this.axiosInstance.get('/info');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения информации о ai-service:', error);
      return null;
    }
  }

  /**
   * Получение статуса сервиса
   */
  getStatus() {
    return {
      configured: !!this.config.baseURL,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      features: {
        dataAnalysis: true,
        predictions: true,
        modelTraining: true,
        speechProcessing: true,
        nlp: true
      }
    };
  }
}

// Создаем и экспортируем единственный экземпляр
const aiServiceIntegration = new AIServiceIntegration();

export default aiServiceIntegration; 