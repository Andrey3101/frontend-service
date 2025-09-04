/**
 * Обновленный интеграционный сервис для ai-service
 * Использует единый API клиент с версионированием v2
 */

import apiClient from './api-client.js';

class AIServiceIntegration {
  constructor() {
    this.client = apiClient;
  }

  /**
   * Анализ данных
   */
  async analyzeData(data, analysisType = 'general') {
    return this.client.post('/v2/ai/analysis', {
      data,
      type: analysisType
    });
  }

  /**
   * Генерация текста
   */
  async generateText(prompt, options = {}) {
    return this.client.post('/v2/ai/generate', {
      prompt,
      ...options
    });
  }

  /**
   * Анализ конкурентов
   */
  async analyzeCompetitors(competitorUrls, industry = null, focusAreas = []) {
    return this.client.post('/v2/ai/competitors/analyze', {
      competitor_urls: competitorUrls,
      industry,
      focus_areas: focusAreas
    });
  }

  /**
   * Анализ цен
   */
  async analyzePricing(serviceName, currentPrice, serviceDescription, targetMarket = null, competitors = null) {
    return this.client.post('/v2/ai/pricing/analyze', {
      service_name: serviceName,
      current_price: currentPrice,
      service_description: serviceDescription,
      target_market: targetMarket,
      competitors
    });
  }

  /**
   * Генерация бизнес-инсайтов
   */
  async generateBusinessInsights(insightType, data, priority = 'medium') {
    return this.client.post('/v2/ai/insights/generate', {
      insight_type: insightType,
      data,
      priority
    });
  }

  /**
   * Создание бизнес-прогноза
   */
  async createBusinessForecast(forecastData) {
    return this.client.post('/v2/ai/forecast', forecastData);
  }

  /**
   * Генерация бизнес-рекомендаций
   */
  async generateBusinessRecommendations(recommendationData) {
    return this.client.post('/v2/ai/recommendations', recommendationData);
  }

  /**
   * Получение бизнес-рекомендаций
   */
  async getBusinessRecommendations(filters = {}) {
    return this.client.get('/v2/ai/recommendations', filters, { cache: true });
  }

  /**
   * Обучение модели
   */
  async trainModel(modelName, modelType, trainingData, parameters = null) {
    return this.client.post('/v2/ai/models/train', {
      model_name: modelName,
      model_type: modelType,
      training_data: trainingData,
      parameters
    });
  }

  /**
   * Предсказание с помощью модели
   */
  async makePrediction(modelName, inputData) {
    return this.client.post('/v2/ai/predict', {
      model_name: modelName,
      input_data: inputData
    });
  }

  /**
   * Получение списка моделей
   */
  async getModels(modelType = null) {
    const params = modelType ? { model_type: modelType } : {};
    return this.client.get('/v2/ai/models', params, { cache: true });
  }

  /**
   * Получение предсказаний
   */
  async getPredictions(userId, filters = {}) {
    const params = { user_id: userId, ...filters };
    return this.client.get('/v2/ai/predictions', params, { cache: true });
  }

  /**
   * Распознавание речи
   */
  async transcribeAudio(audioFile, language = 'ru') {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language', language);
    
    return this.client.post('/v2/ai/speech/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Синтез речи
   */
  async synthesizeSpeech(text, voice = 'default', language = 'ru') {
    return this.client.post('/v2/ai/speech/synthesize', {
      text,
      voice,
      language
    });
  }

  /**
   * Анализ настроений
   */
  async analyzeSentiment(text, language = 'ru') {
    return this.client.post('/v2/ai/sentiment/analyze', {
      text,
      language
    });
  }

  /**
   * Извлечение ключевых слов
   */
  async extractKeywords(text, language = 'ru', maxKeywords = 10) {
    return this.client.post('/v2/ai/keywords/extract', {
      text,
      language,
      max_keywords: maxKeywords
    });
  }

  /**
   * Классификация текста
   */
  async classifyText(text, categories, language = 'ru') {
    return this.client.post('/v2/ai/text/classify', {
      text,
      categories,
      language
    });
  }

  /**
   * Суммаризация текста
   */
  async summarizeText(text, maxLength = 200, language = 'ru') {
    return this.client.post('/v2/ai/text/summarize', {
      text,
      max_length: maxLength,
      language
    });
  }

  /**
   * Перевод текста
   */
  async translateText(text, sourceLanguage = 'ru', targetLanguage = 'en') {
    return this.client.post('/v2/ai/translate', {
      text,
      source_language: sourceLanguage,
      target_language: targetLanguage
    });
  }

  /**
   * Анализ изображений
   */
  async analyzeImage(imageFile, analysisType = 'general') {
    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('analysis_type', analysisType);
    
    return this.client.post('/v2/ai/vision/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Генерация изображений
   */
  async generateImage(prompt, style = 'realistic', size = '1024x1024') {
    return this.client.post('/v2/ai/vision/generate', {
      prompt,
      style,
      size
    });
  }

  /**
   * Проверка здоровья сервиса
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/v2/ai/health');
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
      const response = await this.client.get('/v2/ai/info');
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения информации о AI сервисе: ${error.message}`);
    }
  }

  /**
   * Получение статуса сервиса
   */
  getStatus() {
    return {
      apiStatus: this.client.getStatus(),
      lastHealthCheck: this.lastHealthCheck
    };
  }
}

// Создаем и экспортируем единственный экземпляр
const aiServiceIntegration = new AIServiceIntegration();

export default aiServiceIntegration; 