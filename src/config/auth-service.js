/**
 * Конфигурация для auth-service
 * Содержит настройки подключения и параметры интеграции
 */

// Базовые настройки для разных окружений
const ENVIRONMENTS = {
  development: {
    baseURL: 'http://localhost:8001',
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableMetrics: true
  },
  staging: {
    baseURL: 'https://staging-auth-service.example.com',
    timeout: 20000,
    retryAttempts: 5,
    retryDelay: 2000,
    enableLogging: true,
    enableMetrics: true
  },
  production: {
    baseURL: 'https://auth-service.example.com',
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
    refreshEndpoint: '/auth/refresh'
  };
};

// Конфигурация для аутентификации
export const getAuthConfig = () => {
  const baseConfig = getAuthServiceConfig();
  
  return {
    ...baseConfig,
    endpoints: {
      login: '/login',
      register: '/register',
      logout: '/logout',
      profile: '/profile',
      refresh: '/refresh',
      passwordReset: '/password/reset',
      passwordResetConfirm: '/password/reset/confirm',
      bank: {
        connect: '/bank/connect',
        accounts: '/bank/accounts',
        disconnect: '/bank/accounts',
        requestConnection: '/bank/request-connection',
        connectionStatus: '/bank/connection-status'
      },
      users: {
        list: '/users',
        create: '/users',
        update: '/users',
        delete: '/users',
        roles: '/users/roles'
      },
      companies: {
        create: '/companies',
        update: '/companies',
        delete: '/companies',
        list: '/companies'
      }
    },
    features: {
      enableBankIntegration: true,
      enableUserManagement: true,
      enableCompanyManagement: true,
      enablePasswordReset: true,
      enableCSRF: true,
      enableRefreshTokens: true
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
      collectUserActivity: true
    },
    logging: {
      level: 'info',
      format: 'json',
      includeSensitiveData: false
    }
  };
};

// Функция проверки здоровья сервиса
export const checkAuthServiceHealth = async () => {
  try {
    const config = getAuthServiceConfig();
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