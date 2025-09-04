/**
 * Конфигурация для auth-service
 * Содержит настройки подключения и параметры интеграции
 */

// Базовые настройки для разных окружений
const ENVIRONMENTS = {
  development: {
    baseURL: 'http://localhost:8000',
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableMetrics: true
  },
  staging: {
    baseURL: 'https://staging-api.msb-platform.ru',
    timeout: 20000,
    retryAttempts: 5,
    retryDelay: 2000,
    enableLogging: true,
    enableMetrics: true
  },
  production: {
    baseURL: 'https://api.msb-platform.ru',
    timeout: 25000,
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
export const getAuthServiceConfig = () => {
  const env = getCurrentEnvironment();
  const baseConfig = ENVIRONMENTS[env];
  
  // Переопределяем настройки переменными окружения, если они заданы
  return {
    ...baseConfig,
    baseURL: process.env.VUE_APP_AUTH_SERVICE_URL || baseConfig.baseURL,
    timeout: parseInt(process.env.VUE_APP_AUTH_SERVICE_TIMEOUT) || baseConfig.timeout,
    retryAttempts: parseInt(process.env.VUE_APP_AUTH_SERVICE_RETRY_ATTEMPTS) || baseConfig.retryAttempts,
    retryDelay: parseInt(process.env.VUE_APP_AUTH_SERVICE_RETRY_DELAY) || baseConfig.retryDelay,
    enableLogging: process.env.VUE_APP_AUTH_SERVICE_ENABLE_LOGGING !== 'false' && baseConfig.enableLogging,
    enableMetrics: process.env.VUE_APP_AUTH_SERVICE_ENABLE_METRICS !== 'false' && baseConfig.enableMetrics
  };
};

// Конфигурация для JWT токенов
export const getJWTConfig = () => {
  return {
    accessTokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    csrfTokenKey: 'csrf_token',
    tokenExpiryThreshold: 5 * 60 * 1000, // 5 минут до истечения
    autoRefresh: true,
    refreshEndpoint: '/v2/auth/refresh'
  };
};

// Конфигурация для аутентификации с версионированием API
export const getAuthConfig = () => {
  const baseConfig = getAuthServiceConfig();
  
  return {
    ...baseConfig,
    endpoints: {
      login: '/v2/auth/login',
      register: '/v2/auth/register',
      logout: '/v2/auth/logout',
      profile: '/v2/auth/profile',
      refresh: '/v2/auth/refresh',
      passwordReset: '/v2/auth/password/reset',
      passwordResetConfirm: '/v2/auth/password/reset/confirm',
      bank: {
        connect: '/v2/auth/bank/connect',
        accounts: '/v2/auth/bank/accounts',
        disconnect: '/v2/auth/bank/accounts',
        requestConnection: '/v2/auth/bank/request-connection',
        connectionStatus: '/v2/auth/bank/connection-status'
      },
      users: {
        list: '/v2/auth/users',
        create: '/v2/auth/users',
        update: '/v2/auth/users',
        delete: '/v2/auth/users',
        roles: '/v2/auth/users/roles'
      },
      companies: {
        create: '/v2/auth/companies',
        update: '/v2/auth/companies',
        delete: '/v2/auth/companies',
        list: '/v2/auth/companies'
      }
    },
    features: {
      enableBankIntegration: true,
      enableUserManagement: true,
      enableCompanyManagement: true,
      enablePasswordReset: true,
      enableCSRF: true,
      enableRefreshTokens: true,
      enableTokenEncryption: true
    }
  };
};

// Конфигурация для безопасности
export const getSecurityConfig = () => {
  return {
    csrfProtection: true,
    xssProtection: true,
    contentSecurityPolicy: true,
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      windowMs: 15 * 60 * 1000 // 15 минут
    },
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    tokenEncryption: {
      enabled: true,
      algorithm: 'AES-GCM',
      keyDerivation: 'PBKDF2'
    }
  };
};

// Конфигурация для мониторинга
export const getMonitoringConfig = () => {
  return {
    healthCheck: {
      enabled: true,
      interval: 30 * 1000, // 30 секунд
      timeout: 5000
    },
    metrics: {
      enabled: true,
      collectAuthAttempts: true,
      collectTokenUsage: true,
      collectUserActivity: true,
      collectPerformanceMetrics: true
    },
    logging: {
      level: 'info',
      format: 'json',
      includeSensitiveData: false,
      enableRequestLogging: true,
      enableErrorLogging: true
    }
  };
};

// Функция проверки здоровья сервиса
export const checkAuthServiceHealth = async () => {
  try {
    const config = getAuthServiceConfig();
    const response = await fetch(`${config.baseURL}/v2/health`, {
      method: 'GET',
      timeout: config.timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        healthy: true,
        status: data.status || 'ok',
        timestamp: data.timestamp || new Date().toISOString(),
        version: data.version || 'unknown'
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
export const getAuthServiceInfo = async () => {
  try {
    const config = getAuthServiceConfig();
    const response = await fetch(`${config.baseURL}/v2/info`, {
      method: 'GET',
      timeout: config.timeout
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Ошибка получения информации о auth-service:', error);
    return null;
  }
};

// Экспорт по умолчанию
export default {
  getAuthServiceConfig,
  getJWTConfig,
  getAuthConfig,
  getSecurityConfig,
  getMonitoringConfig,
  checkAuthServiceHealth,
  getAuthServiceInfo
}; 