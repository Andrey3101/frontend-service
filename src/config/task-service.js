/**
 * Конфигурация для task-service
 * Содержит настройки подключения и параметры интеграции
 */

// Базовые настройки для разных окружений
const ENVIRONMENTS = {
  development: {
    baseURL: 'http://localhost:8080',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableMetrics: true
  },
  staging: {
    baseURL: 'https://staging-task-service.example.com',
    timeout: 15000,
    retryAttempts: 5,
    retryDelay: 2000,
    enableLogging: true,
    enableMetrics: true
  },
  production: {
    baseURL: 'https://task-service.example.com',
    timeout: 20000,
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
export const getTaskServiceConfig = () => {
  const env = getCurrentEnvironment();
  const baseConfig = ENVIRONMENTS[env];
  
  // Переопределяем настройки переменными окружения, если они заданы
  return {
    ...baseConfig,
    baseURL: process.env.VUE_APP_TASK_SERVICE_URL || baseConfig.baseURL,
    timeout: parseInt(process.env.VUE_APP_TASK_SERVICE_TIMEOUT) || baseConfig.timeout,
    retryAttempts: parseInt(process.env.VUE_APP_TASK_SERVICE_RETRY_ATTEMPTS) || baseConfig.retryAttempts,
    retryDelay: parseInt(process.env.VUE_APP_TASK_SERVICE_RETRY_DELAY) || baseConfig.retryDelay,
    enableLogging: process.env.VUE_APP_TASK_SERVICE_ENABLE_LOGGING !== 'false' && baseConfig.enableLogging,
    enableMetrics: process.env.VUE_APP_TASK_SERVICE_ENABLE_METRICS !== 'false' && baseConfig.enableMetrics
  };
};

// Конфигурация для WebSocket соединений
export const getWebSocketConfig = () => {
  const baseConfig = getTaskServiceConfig();
  const wsURL = baseConfig.baseURL.replace(/^https?:\/\//, 'ws://');
  
  return {
    url: `${wsURL}/ws`,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    enableCompression: true
  };
};

// Конфигурация для кэширования
export const getCacheConfig = () => {
  return {
    // Кэш для задач
    tasks: {
      ttl: 5 * 60 * 1000, // 5 минут
      maxSize: 1000,
      enableCompression: true
    },
    // Кэш для комментариев
    comments: {
      ttl: 10 * 60 * 1000, // 10 минут
      maxSize: 5000,
      enableCompression: true
    },
    // Кэш для статистики
    statistics: {
      ttl: 15 * 60 * 1000, // 15 минут
      maxSize: 100,
      enableCompression: false
    },
    // Кэш для метрик
    metrics: {
      ttl: 60 * 1000, // 1 минута
      maxSize: 200,
      enableCompression: false
    }
  };
};

// Конфигурация для уведомлений
export const getNotificationConfig = () => {
  return {
    // Уведомления о задачах
    tasks: {
      enablePush: true,
      enableEmail: true,
      enableSMS: false,
      soundEnabled: true,
      vibrationEnabled: true
    },
    // Уведомления о комментариях
    comments: {
      enablePush: true,
      enableEmail: false,
      enableSMS: false,
      soundEnabled: true,
      vibrationEnabled: false
    },
    // Уведомления о дедлайнах
    deadlines: {
      enablePush: true,
      enableEmail: true,
      enableSMS: true,
      soundEnabled: true,
      vibrationEnabled: true,
      advanceWarning: 24 * 60 * 60 * 1000 // 24 часа
    },
    // Уведомления о встречах
    meetings: {
      enablePush: true,
      enableEmail: true,
      enableSMS: false,
      soundEnabled: true,
      vibrationEnabled: true,
      advanceWarning: 15 * 60 * 1000 // 15 минут
    }
  };
};

// Конфигурация для синхронизации
export const getSyncConfig = () => {
  return {
    // Автоматическая синхронизация
    autoSync: {
      enabled: true,
      interval: 30 * 1000, // 30 секунд
      maxRetries: 3,
      retryDelay: 5000
    },
    // Синхронизация при изменении
    changeSync: {
      enabled: true,
      debounceDelay: 1000,
      batchSize: 10,
      maxBatchDelay: 5000
    },
    // Синхронизация при восстановлении соединения
    reconnectSync: {
      enabled: true,
      maxRetries: 5,
      retryDelay: 2000
    },
    // Конфликт-резолюшн
    conflictResolution: {
      strategy: 'server-wins', // 'server-wins', 'client-wins', 'manual'
      enableMerge: true,
      maxMergeDepth: 3
    }
  };
};

// Конфигурация для валидации
export const getValidationConfig = () => {
  return {
    // Валидация задач
    tasks: {
      title: {
        required: true,
        minLength: 1,
        maxLength: 255,
        pattern: /^[\w\s\-_.,!?()]+$/
      },
      description: {
        required: false,
        maxLength: 1000,
        pattern: /^[\w\s\-_.,!?()\n\r]+$/
      },
      priority: {
        required: true,
        min: 1,
        max: 4,
        type: 'integer'
      },
      status: {
        required: true,
        allowedValues: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']
      },
      dueDate: {
        required: false,
        type: 'date',
        minDate: 'now',
        maxDate: 'now+1year'
      }
    },
    // Валидация комментариев
    comments: {
      text: {
        required: true,
        minLength: 1,
        maxLength: 1000,
        pattern: /^[\w\s\-_.,!?()\n\r]+$/
      }
    },
    // Валидация встреч
    meetings: {
      title: {
        required: true,
        minLength: 1,
        maxLength: 255
      },
      startTime: {
        required: true,
        type: 'datetime'
      },
      endTime: {
        required: true,
        type: 'datetime',
        after: 'startTime'
      }
    }
  };
};

// Конфигурация для метрик и мониторинга
export const getMetricsConfig = () => {
  return {
    // Сбор метрик
    collection: {
      enabled: true,
      interval: 60 * 1000, // 1 минута
      batchSize: 100,
      maxBatchDelay: 5000
    },
    // Метрики производительности
    performance: {
      responseTime: true,
      throughput: true,
      errorRate: true,
      availability: true
    },
    // Метрики бизнеса
    business: {
      taskCompletion: true,
      userActivity: true,
      systemUsage: true,
      qualityMetrics: true
    },
    // Экспорт метрик
    export: {
      format: 'json', // 'json', 'csv', 'prometheus'
      destination: 'console', // 'console', 'file', 'http'
      schedule: 'daily' // 'realtime', 'hourly', 'daily', 'weekly'
    }
  };
};

// Конфигурация для безопасности
export const getSecurityConfig = () => {
  return {
    // Аутентификация
    authentication: {
      method: 'jwt', // 'jwt', 'oauth2', 'api_key'
      tokenExpiry: 24 * 60 * 60 * 1000, // 24 часа
      refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 дней
      enableRefresh: true
    },
    // Авторизация
    authorization: {
      enableRBAC: true,
      defaultRole: 'user',
      adminRole: 'admin'
    },
    // Шифрование
    encryption: {
      enableHTTPS: true,
      enableDataEncryption: false,
      encryptionAlgorithm: 'AES-256'
    },
    // Аудит
    audit: {
      enabled: true,
      logLevel: 'info',
      retentionDays: 90
    }
  };
};

// Конфигурация для тестирования
export const getTestConfig = () => {
  return {
    // Мок-данные
    mockData: {
      enabled: process.env.NODE_ENV === 'test',
      tasksCount: 100,
      usersCount: 10,
      commentsCount: 500
    },
    // Тестовые API
    testAPI: {
      enabled: process.env.NODE_ENV === 'test',
      baseURL: 'http://localhost:8081',
      timeout: 5000
    },
    // Симуляция задержек
    delays: {
      network: 100,
      processing: 50,
      database: 200
    }
  };
};

// Функция для проверки здоровья сервиса
export const checkTaskServiceHealth = async (config) => {
  try {
    const response = await fetch(`${config.baseURL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(config.timeout)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - performance.now(),
        details: data
      };
    } else {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: `HTTP ${response.status}`,
        details: null
      };
    }
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      details: null
    };
  }
};

// Функция для получения информации о сервисе
export const getTaskServiceInfo = async (config) => {
  try {
    const response = await fetch(`${config.baseURL}/info`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(config.timeout)
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Ошибка получения информации о сервисе: ${error.message}`);
  }
};

// Функция для проверки совместимости версий
export const checkVersionCompatibility = (frontendVersion, backendVersion) => {
  const frontend = parseVersion(frontendVersion);
  const backend = parseVersion(backendVersion);
  
  // Проверяем совместимость по мажорной версии
  if (frontend.major !== backend.major) {
    return {
      compatible: false,
      reason: 'Несовместимые мажорные версии',
      frontend: frontendVersion,
      backend: backendVersion
    };
  }
  
  // Проверяем минимальную минорную версию
  if (frontend.minor > backend.minor) {
    return {
      compatible: false,
      reason: 'Frontend требует более новую версию backend',
      frontend: frontendVersion,
      backend: backendVersion
    };
  }
  
  return {
    compatible: true,
    reason: 'Версии совместимы',
    frontend: frontendVersion,
    backend: backendVersion
  };
};

// Вспомогательная функция для парсинга версий
const parseVersion = (versionString) => {
  const parts = versionString.split('.').map(part => parseInt(part) || 0);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
};

// Экспортируем все конфигурации
export default {
  getTaskServiceConfig,
  getWebSocketConfig,
  getCacheConfig,
  getNotificationConfig,
  getSyncConfig,
  getValidationConfig,
  getMetricsConfig,
  getSecurityConfig,
  getTestConfig,
  checkTaskServiceHealth,
  getTaskServiceInfo,
  checkVersionCompatibility
}; 