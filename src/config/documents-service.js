/**
 * Конфигурация для documents-service
 * Содержит настройки подключения и параметры интеграции
 */

// Базовые настройки для разных окружений
const ENVIRONMENTS = {
  development: {
    baseURL: 'http://localhost:8003',
    timeout: 20000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableMetrics: true
  },
  staging: {
    baseURL: 'https://staging-api.msb-platform.ru/documents',
    timeout: 30000,
    retryAttempts: 5,
    retryDelay: 2000,
    enableLogging: true,
    enableMetrics: true
  },
  production: {
    baseURL: 'https://api.msb-platform.ru/documents', // Исправлен URL
    timeout: 40000,
    retryAttempts: 3,
    retryDelay: 3000,
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
export const getDocumentsServiceConfig = () => {
  const env = getCurrentEnvironment();
  const baseConfig = ENVIRONMENTS[env];
  
  // Переопределяем настройки переменными окружения, если они заданы
  return {
    ...baseConfig,
    baseURL: process.env.VUE_APP_DOCUMENTS_SERVICE_URL || baseConfig.baseURL,
    timeout: parseInt(process.env.VUE_APP_DOCUMENTS_SERVICE_TIMEOUT) || baseConfig.timeout,
    retryAttempts: parseInt(process.env.VUE_APP_DOCUMENTS_SERVICE_RETRY_ATTEMPTS) || baseConfig.retryAttempts,
    retryDelay: parseInt(process.env.VUE_APP_DOCUMENTS_SERVICE_RETRY_DELAY) || baseConfig.retryDelay,
    enableLogging: process.env.VUE_APP_DOCUMENTS_SERVICE_ENABLE_LOGGING !== 'false' && baseConfig.enableLogging,
    enableMetrics: process.env.VUE_APP_DOCUMENTS_SERVICE_ENABLE_METRICS !== 'false' && baseConfig.enableMetrics
  };
};

// Конфигурация для шаблонов документов
export const getTemplatesConfig = () => {
  return {
    supportedTypes: [
      'contract', 'invoice', 'act', 'receipt', 'agreement',
      'application', 'letter', 'report', 'certificate', 'declaration'
    ],
    defaultTemplates: {
      contract: 'contract_template_v1',
      invoice: 'invoice_template_v1',
      act: 'act_template_v1',
      receipt: 'receipt_template_v1'
    },
    categories: {
      legal: ['contract', 'agreement', 'application'],
      financial: ['invoice', 'receipt', 'act'],
      business: ['letter', 'report', 'certificate'],
      government: ['declaration', 'application', 'certificate']
    },
    features: {
      enableCustomTemplates: true,
      enableTemplateVersioning: true,
      enableTemplateSharing: true,
      enableTemplateValidation: true
    }
  };
};

// Конфигурация для генерации документов
export const getGenerationConfig = () => {
  const baseConfig = getDocumentsServiceConfig();
  
  return {
    ...baseConfig,
    endpoints: {
      documents: '/documents',
      templates: '/templates',
      generate: '/generate',
      convert: '/convert',
      validate: '/validate',
      sign: '/sign'
    },
    features: {
      enableDocumentGeneration: true,
      enableTemplateEngine: true,
      enablePDFConversion: true,
      enableWordConversion: true,
      enableDigitalSigning: true,
      enableDocumentValidation: true
    },
    formats: {
      input: ['docx', 'odt', 'html', 'markdown'],
      output: ['pdf', 'docx', 'html', 'txt']
    },
    limits: {
      maxFileSize: 50 * 1024 * 1024, // 50 MB
      maxTemplateSize: 1 * 1024 * 1024, // 1 MB
      maxConcurrentGenerations: 10,
      maxDocumentsPerUser: 1000
    }
  };
};

// Конфигурация для хранения документов
export const getStorageConfig = () => {
  return {
    providers: {
      local: {
        enabled: true,
        path: '/app/storage',
        maxSize: 10 * 1024 * 1024 * 1024 // 10 GB
      },
      s3: {
        enabled: false,
        bucket: 'documents-bucket',
        region: 'us-east-1',
        accessKey: process.env.AWS_ACCESS_KEY_ID,
        secretKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      minio: {
        enabled: false,
        endpoint: 'http://minio:9000',
        bucket: 'documents',
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY
      }
    },
    features: {
      enableCompression: true,
      enableEncryption: true,
      enableBackup: true,
      enableVersioning: true
    },
    retention: {
      defaultDays: 365 * 3, // 3 года
      maxDays: 365 * 10, // 10 лет
      enableAutoCleanup: true
    }
  };
};

// Конфигурация для подписи документов
export const getSigningConfig = () => {
  return {
    methods: {
      digital: {
        enabled: true,
        algorithms: ['RSA', 'ECDSA', 'EdDSA'],
        certificateTypes: ['X.509', 'PKCS#12']
      },
      electronic: {
        enabled: true,
        providers: ['gosuslugi', 'sberbank', 'alfabank']
      },
      handwritten: {
        enabled: true,
        formats: ['png', 'jpg', 'svg']
      }
    },
    features: {
      enableMultiSigning: true,
      enableSigningWorkflow: true,
      enableSignatureValidation: true,
      enableTimestamping: true
    }
  };
};

// Конфигурация для интеграции с другими сервисами
export const getIntegrationConfig = () => {
  return {
    authService: {
      url: process.env.VUE_APP_AUTH_SERVICE_URL || 'http://localhost:8001',
      required: true,
      endpoints: {
        validateToken: '/auth/validate',
        getUserInfo: '/auth/user'
      }
    },
    aiService: {
      url: process.env.VUE_APP_AI_SERVICE_URL || 'http://localhost:8002',
      required: false,
      features: {
        enableSmartTemplates: true,
        enableDocumentAnalysis: true,
        enableAutoClassification: true
      }
    },
    taskService: {
      url: process.env.VUE_APP_TASK_SERVICE_URL || 'http://localhost:8080',
      required: false,
      features: {
        enableTaskCreation: true,
        enableDocumentLinking: true
      }
    }
  };
};

// Конфигурация для мониторинга
export const getMonitoringConfig = () => {
  return {
    healthCheck: {
      enabled: true,
      interval: 60 * 1000, // 1 минута
      timeout: 15000
    },
    metrics: {
      enabled: true,
      collectGenerationMetrics: true,
      collectStorageMetrics: true,
      collectSigningMetrics: true,
      collectErrorRates: true
    },
    logging: {
      level: 'info',
      format: 'json',
      includeDocumentContent: false,
      includeUserData: false
    }
  };
};

// Функция проверки здоровья сервиса
export const checkDocumentsServiceHealth = async () => {
  try {
    const config = getDocumentsServiceConfig();
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
        storage: data.storage || {},
        templates: data.templates || {}
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
export const getDocumentsServiceInfo = async () => {
  try {
    const config = getDocumentsServiceConfig();
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
    console.error('Ошибка получения информации о documents-service:', error);
    return null;
  }
};

// Функция проверки доступности шаблонов
export const checkTemplatesAvailability = async () => {
  try {
    const config = getDocumentsServiceConfig();
    const response = await fetch(`${config.baseURL}/templates/status`, {
      method: 'GET',
      timeout: config.timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        templates: data.templates || [],
        totalTemplates: data.total || 0,
        activeTemplates: data.active || 0,
        categories: data.categories || []
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
  getDocumentsServiceConfig,
  getTemplatesConfig,
  getGenerationConfig,
  getStorageConfig,
  getSigningConfig,
  getIntegrationConfig,
  getMonitoringConfig,
  checkDocumentsServiceHealth,
  getDocumentsServiceInfo,
  checkTemplatesAvailability
}; 