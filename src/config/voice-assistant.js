/**
 * Конфигурация для voice-assistant
 * Содержит настройки подключения и параметры интеграции
 */

// Базовые настройки для разных окружений
const ENVIRONMENTS = {
  development: {
    baseURL: 'http://localhost:8013',
    timeout: 60000, // Голосовые запросы требуют времени
    retryAttempts: 1,
    retryDelay: 1000,
    enableLogging: true,
    enableMetrics: true
  },
  staging: {
    baseURL: 'https://staging-voice-assistant.example.com',
    timeout: 90000,
    retryAttempts: 2,
    retryDelay: 2000,
    enableLogging: true,
    enableMetrics: true
  },
  production: {
    baseURL: 'https://voice-assistant.example.com',
    timeout: 120000,
    retryAttempts: 1,
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
export const getVoiceAssistantConfig = () => {
  const env = getCurrentEnvironment();
  const baseConfig = ENVIRONMENTS[env];
  
  // Переопределяем настройки переменными окружения, если они заданы
  return {
    ...baseConfig,
    baseURL: process.env.VUE_APP_VOICE_ASSISTANT_URL || baseConfig.baseURL,
    timeout: parseInt(process.env.VUE_APP_VOICE_ASSISTANT_TIMEOUT) || baseConfig.timeout,
    retryAttempts: parseInt(process.env.VUE_APP_VOICE_ASSISTANT_RETRY_ATTEMPTS) || baseConfig.retryAttempts,
    retryDelay: parseInt(process.env.VUE_APP_VOICE_ASSISTANT_RETRY_DELAY) || baseConfig.retryDelay,
    enableLogging: process.env.VUE_APP_VOICE_ASSISTANT_ENABLE_LOGGING !== 'false' && baseConfig.enableLogging,
    enableMetrics: process.env.VUE_APP_VOICE_ASSISTANT_ENABLE_METRICS !== 'false' && baseConfig.enableMetrics
  };
};

// Конфигурация для WebSocket соединений
export const getWebSocketConfig = () => {
  const baseConfig = getVoiceAssistantConfig();
  const wsURL = baseConfig.baseURL.replace(/^https?:\/\//, 'ws://');
  
  return {
    url: `${wsURL}/ws`,
    reconnectInterval: 3000,
    maxReconnectAttempts: 15,
    heartbeatInterval: 25000,
    enableCompression: true,
    protocols: ['voice-protocol-v1']
  };
};

// Конфигурация для распознавания речи
export const getSpeechRecognitionConfig = () => {
  return {
    supportedLanguages: ['ru', 'en', 'de', 'fr', 'es'],
    defaultLanguage: 'ru',
    audioFormats: ['wav', 'mp3', 'ogg', 'flac', 'm4a'],
    sampleRates: [8000, 16000, 22050, 44100, 48000],
    maxAudioDuration: 300, // 5 минут
    chunkSize: 1024,
    features: {
      enableContinuousRecognition: true,
      enableInterimResults: true,
      enableLanguageDetection: true,
      enableSpeakerIdentification: true,
      enableEmotionDetection: true,
      enableNoiseReduction: true
    },
    models: {
      whisper: 'base',
      vosk: 'vosk-model-small-ru-0.22',
      deepspeech: 'deepspeech-0.9.3-models'
    }
  };
};

// Конфигурация для синтеза речи
export const getSpeechSynthesisConfig = () => {
  return {
    supportedLanguages: ['ru', 'en', 'de', 'fr', 'es'],
    defaultLanguage: 'ru',
    voices: {
      ru: ['anna', 'dmitry', 'elena', 'sergey'],
      en: ['alice', 'bob', 'carol', 'david'],
      de: ['hans', 'greta', 'klaus', 'lisa']
    },
    defaultVoice: {
      ru: 'anna',
      en: 'alice',
      de: 'hans'
    },
    audioFormats: ['wav', 'mp3', 'ogg'],
    sampleRates: [22050, 44100],
    features: {
      enableVoiceCloning: true,
      enableEmotionSynthesis: true,
      enableSpeedControl: true,
      enablePitchControl: true,
      enableVolumeControl: true
    }
  };
};

// Конфигурация для AI интеграции
export const getAIIntegrationConfig = () => {
  return {
    enabled: true,
    aiServiceUrl: process.env.VUE_APP_AI_SERVICE_URL || 'http://localhost:8002',
    features: {
      enableNaturalLanguageUnderstanding: true,
      enableIntentRecognition: true,
      enableEntityExtraction: true,
      enableContextManagement: true,
      enableConversationFlow: true
    },
    models: {
      nlu: 'bert-base-multilingual-cased',
      intent: 'distilbert-base-multilingual-cased',
      entity: 'dbmdz/bert-base-multilingual-cased-cased'
    }
  };
};

// Конфигурация для обработки команд
export const getCommandsConfig = () => {
  return {
    supportedDomains: [
      'tasks', 'calendar', 'documents', 'analytics', 
      'banking', 'notifications', 'settings', 'help'
    ],
    defaultDomain: 'tasks',
    commandPatterns: {
      tasks: [
        'создать задачу',
        'показать задачи',
        'обновить задачу',
        'удалить задачу'
      ],
      calendar: [
        'запланировать встречу',
        'показать календарь',
        'найти свободное время'
      ],
      documents: [
        'создать документ',
        'найти документ',
        'отправить документ'
      ]
    },
    features: {
      enableVoiceCommands: true,
      enableNaturalLanguage: true,
      enableContextAwareness: true,
      enableLearning: true
    }
  };
};

// Конфигурация для мониторинга
export const getMonitoringConfig = () => {
  return {
    healthCheck: {
      enabled: true,
      interval: 45 * 1000, // 45 секунд
      timeout: 15000
    },
    metrics: {
      enabled: true,
      collectRecognitionAccuracy: true,
      collectSynthesisQuality: true,
      collectResponseTimes: true,
      collectErrorRates: true,
      collectUserInteractions: true
    },
    logging: {
      level: 'info',
      format: 'json',
      includeAudioData: false,
      includeUserInputs: false
    }
  };
};

// Конфигурация для безопасности
export const getSecurityConfig = () => {
  return {
    authentication: {
      required: true,
      tokenHeader: 'Authorization',
      tokenPrefix: 'Bearer'
    },
    privacy: {
      enableAudioEncryption: true,
      enableDataAnonymization: true,
      enableUserConsent: true,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000 // 30 дней
    },
    rateLimiting: {
      enabled: true,
      maxRequests: 50,
      windowMs: 15 * 60 * 1000 // 15 минут
    }
  };
};

// Функция проверки здоровья сервиса
export const checkVoiceAssistantHealth = async () => {
  try {
    const config = getVoiceAssistantConfig();
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
        features: data.features || [],
        models: data.models || []
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
export const getVoiceAssistantInfo = async () => {
  try {
    const config = getVoiceAssistantConfig();
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
    console.error('Ошибка получения информации о voice-assistant:', error);
    return null;
  }
};

// Функция проверки доступности моделей
export const checkVoiceModelsAvailability = async () => {
  try {
    const config = getVoiceAssistantConfig();
    const response = await fetch(`${config.baseURL}/models/status`, {
      method: 'GET',
      timeout: config.timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        recognitionModels: data.recognition || [],
        synthesisModels: data.synthesis || [],
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
  getVoiceAssistantConfig,
  getWebSocketConfig,
  getSpeechRecognitionConfig,
  getSpeechSynthesisConfig,
  getAIIntegrationConfig,
  getCommandsConfig,
  getMonitoringConfig,
  getSecurityConfig,
  checkVoiceAssistantHealth,
  getVoiceAssistantInfo,
  checkVoiceModelsAvailability
}; 