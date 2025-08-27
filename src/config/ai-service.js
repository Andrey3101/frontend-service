/**
 * Конфигурация для ai-service
 * Содержит настройки подключения и параметры интеграции
 */

// Базовые настройки для разных окружений
const ENVIRONMENTS = {
  development: {
    baseURL: 'http://localhost:8002',
    timeout: 30000, // AI запросы могут быть медленными
    retryAttempts: 2,
    retryDelay: 2000,
    enableLogging: true,
    enableMetrics: true
  },
  staging: {
    baseURL: 'https://staging-ai-service.example.com',
    timeout: 45000,
    retryAttempts: 3,
    retryDelay: 3000,
    enableLogging: true,
    enableMetrics: true
  },
  production: {
    baseURL: 'https://ai-service.example.com',
    timeout: 60000,
    retryAttempts: 2,
    retryDelay: 5000,
    enableLogging: false,
    enableMetrics: true
  }
};

// Определяем текущее окружение
const getCurrentEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  } else if (process.env.NODE_ENV === 'staging') {
    return 'staging';
  } else {
    return 'development';
  }
};

// Получаем конфигурацию для текущего окружения
export const getAIServiceConfig = () => {
  const env = getCurrentEnvironment();
  const baseConfig = ENVIRONMENTS[env];
  
  // Переопределяем настройки переменными окружения, если они заданы
  return {
    ...baseConfig,
    baseURL: process.env.VUE_APP_AI_SERVICE_URL || baseConfig.baseURL,
    timeout: parseInt(process.env.VUE_APP_AI_SERVICE_TIMEOUT) || baseConfig.timeout,
    retryAttempts: parseInt(process.env.VUE_APP_AI_SERVICE_RETRY_ATTEMPTS) || baseConfig.retryAttempts,
    retryDelay: parseInt(process.env.VUE_APP_AI_SERVICE_RETRY_DELAY) || baseConfig.retryDelay,
    enableLogging: process.env.VUE_APP_AI_SERVICE_ENABLE_LOGGING !== 'false' && baseConfig.enableLogging,
    enableMetrics: process.env.VUE_APP_AI_SERVICE_ENABLE_METRICS !== 'false' && baseConfig.enableMetrics
  };
};

// Конфигурация для AI моделей
export const getAIModelsConfig = () => {
  return {
    supportedModels: {
      regression: ['linear', 'random_forest', 'xgboost', 'neural_network'],
      classification: ['logistic', 'random_forest', 'svm', 'neural_network'],
      anomaly_detection: ['isolation_forest', 'one_class_svm', 'autoencoder'],
      time_series: ['arima', 'prophet', 'lstm', 'transformer']
    },
    defaultModels: {
      regression: 'random_forest',
      classification: 'random_forest',
      anomaly_detection: 'isolation_forest',
      time_series: 'prophet'
    },
    modelParameters: {
      random_forest: {
        n_estimators: 100,
        max_depth: 10,
        random_state: 42
      },
      neural_network: {
        hidden_layers: [64, 32],
        activation: 'relu',
        dropout: 0.2
      }
    }
  };
};

// Конфигурация для анализа данных
export const getAnalysisConfig = () => {
  const baseConfig = getAIServiceConfig();
  
  return {
    ...baseConfig,
    endpoints: {
      analysis: '/analysis',
      prediction: '/prediction',
      training: '/training',
      models: '/models',
      datasets: '/datasets',
      reports: '/reports',
      insights: '/insights'
    },
    features: {
      enableDataAnalysis: true,
      enablePredictions: true,
      enableModelTraining: true,
      enableAnomalyDetection: true,
      enableTimeSeriesAnalysis: true,
      enableNaturalLanguageProcessing: true,
      enableComputerVision: true
    },
    limits: {
      maxDataSize: 100 * 1024 * 1024, // 100 MB
      maxTrainingTime: 300, // 5 минут
      maxPredictionBatchSize: 1000,
      maxConcurrentRequests: 5
    }
  };
};

// Конфигурация для обработки речи
export const getSpeechConfig = () => {
  return {
    supportedLanguages: ['ru', 'en', 'de', 'fr', 'es'],
    defaultLanguage: 'ru',
    audioFormats: ['wav', 'mp3', 'ogg', 'flac'],
    sampleRates: [8000, 16000, 22050, 44100],
    maxAudioDuration: 300, // 5 минут
    features: {
      enableSpeechRecognition: true,
      enableSpeechSynthesis: true,
      enableVoiceCloning: true,
      enableEmotionDetection: true,
      enableSpeakerIdentification: true
    }
  };
};

// Конфигурация для NLP
export const getNLPConfig = () => {
  return {
    supportedLanguages: ['ru', 'en'],
    models: {
      sentiment: 'bert-base-multilingual-cased',
      classification: 'distilbert-base-multilingual-cased',
      summarization: 'facebook/bart-large-cnn',
      translation: 'Helsinki-NLP/opus-mt-ru-en'
    },
    features: {
      enableSentimentAnalysis: true,
      enableTextClassification: true,
      enableTextSummarization: true,
      enableTranslation: true,
      enableNamedEntityRecognition: true,
      enableKeywordExtraction: true
    }
  };
};

// Конфигурация для мониторинга
export const getMonitoringConfig = () => {
  return {
    healthCheck: {
      enabled: true,
      interval: 60 * 1000, // 1 минута
      timeout: 10000
    },
    metrics: {
      enabled: true,
      collectPredictionAccuracy: true,
      collectTrainingMetrics: true,
      collectResponseTimes: true,
      collectErrorRates: true
    },
    logging: {
      level: 'info',
      format: 'json',
      includeModelOutputs: false
    }
  };
};

// Функция проверки здоровья сервиса
export const checkAIServiceHealth = async () => {
  try {
    const config = getAIServiceConfig();
    const response = await fetch(`${config.baseURL}/health`, {
      method: 'GET',
      timeout: config.timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        healthy: true,
        status: data.status || 'ok',
        timestamp: data.timestamp || new Date().toISOString(),
        version: data.version || 'unknown',
        models: data.models || [],
        gpu: data.gpu || false
      };
    } else {
      return {
        healthy: false,
        status: 'error',
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      healthy: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Функция получения информации о сервисе
export const getAIServiceInfo = async () => {
  try {
    const config = getAIServiceConfig();
    const response = await fetch(`${config.baseURL}/info`, {
      method: 'GET',
      timeout: config.timeout
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Ошибка получения информации о ai-service:', error);
    return null;
  }
};

// Функция проверки доступности моделей
export const checkAIModelsAvailability = async () => {
  try {
    const config = getAIServiceConfig();
    const response = await fetch(`${config.baseURL}/models/status`, {
      method: 'GET',
      timeout: config.timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        models: data.models || [],
        totalModels: data.total || 0,
        activeModels: data.active || 0
      };
    } else {
      return {
        available: false,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
};

// Экспорт по умолчанию
export default {
  getAIServiceConfig,
  getAIModelsConfig,
  getAnalysisConfig,
  getSpeechConfig,
  getNLPConfig,
  getMonitoringConfig,
  checkAIServiceHealth,
  getAIServiceInfo,
  checkAIModelsAvailability
}; 