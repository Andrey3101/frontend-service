/**
 * Интеграционный сервис для auth-service
 * Обеспечивает взаимодействие между frontend и auth-service
 */

import axios from 'axios';
import { getAuthServiceConfig, getJWTConfig } from '../config/auth-service';

class AuthServiceIntegration {
  constructor() {
    this.config = getAuthServiceConfig();
    this.jwtConfig = getJWTConfig();
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
   * Настраивает перехватчики для обработки ошибок и токенов
   */
  setupInterceptors() {
    // Перехватчик запросов
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Добавляем токен авторизации
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Добавляем CSRF токен
        const csrfToken = this.getCSRFToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }

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
            case 401:
              await this.handleUnauthorized();
              break;
            case 403:
              this.handleForbidden();
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
   * Получает токен авторизации из localStorage
   */
  getAuthToken() {
    return localStorage.getItem(this.jwtConfig.accessTokenKey) || 
           sessionStorage.getItem(this.jwtConfig.accessTokenKey);
  }

  /**
   * Получает refresh токен
   */
  getRefreshToken() {
    return localStorage.getItem(this.jwtConfig.refreshTokenKey) || 
           sessionStorage.getItem(this.jwtConfig.refreshTokenKey);
  }

  /**
   * Получает CSRF токен
   */
  getCSRFToken() {
    return localStorage.getItem(this.jwtConfig.csrfTokenKey) || 
           sessionStorage.getItem(this.jwtConfig.csrfTokenKey);
  }

  /**
   * Сохраняет токены
   */
  saveTokens(accessToken, refreshToken, csrfToken) {
    if (accessToken) {
      localStorage.setItem(this.jwtConfig.accessTokenKey, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(this.jwtConfig.refreshTokenKey, refreshToken);
    }
    if (csrfToken) {
      localStorage.setItem(this.jwtConfig.csrfTokenKey, csrfToken);
    }
  }

  /**
   * Очищает токены
   */
  clearTokens() {
    localStorage.removeItem(this.jwtConfig.accessTokenKey);
    localStorage.removeItem(this.jwtConfig.refreshTokenKey);
    localStorage.removeItem(this.jwtConfig.csrfTokenKey);
    sessionStorage.removeItem(this.jwtConfig.accessTokenKey);
    sessionStorage.removeItem(this.jwtConfig.refreshTokenKey);
    sessionStorage.removeItem(this.jwtConfig.csrfTokenKey);
  }

  /**
   * Проверяет, истек ли токен
   */
  isTokenExpired() {
    const token = this.getAuthToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      return currentTime >= (expiryTime - this.jwtConfig.tokenExpiryThreshold);
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      return true;
    }
  }

  /**
   * Обновляет токен
   */
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Refresh токен отсутствует');
      }

      const response = await this.axiosInstance.post(this.jwtConfig.refreshEndpoint, {
        refresh_token: refreshToken
      });

      const { access_token, refresh_token, csrf_token } = response.data;
      this.saveTokens(access_token, refresh_token, csrf_token);

      return {
        success: true,
        accessToken: access_token,
        refreshToken: refresh_token,
        csrfToken: csrf_token
      };
    } catch (error) {
      console.error('Ошибка обновления токена:', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Методы аутентификации
   */

  /**
   * Вход в систему
   */
  async login(credentials) {
    try {
      const response = await this.axiosInstance.post('/login', credentials);
      const { access_token, refresh_token, csrf_token, user } = response.data;
      
      this.saveTokens(access_token, refresh_token, csrf_token);
      
      return {
        success: true,
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
        csrfToken: csrf_token
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Регистрация пользователя
   */
  async register(userData) {
    try {
      const response = await this.axiosInstance.post('/register', userData);
      const { access_token, refresh_token, csrf_token, user } = response.data;
      
      this.saveTokens(access_token, refresh_token, csrf_token);
      
      return {
        success: true,
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
        csrfToken: csrf_token
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Выход из системы
   */
  async logout() {
    try {
      await this.axiosInstance.post('/logout');
      this.clearTokens();
      return { success: true };
    } catch (error) {
      console.error('Ошибка выхода:', error);
      this.clearTokens();
      return { success: true };
    }
  }

  /**
   * Получение профиля пользователя
   */
  async getProfile() {
    try {
      const response = await this.axiosInstance.get('/profile');
      return {
        success: true,
        profile: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Обновление профиля пользователя
   */
  async updateProfile(profileData) {
    try {
      const response = await this.axiosInstance.put('/profile', profileData);
      return {
        success: true,
        profile: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Сброс пароля
   */
  async requestPasswordReset(email) {
    try {
      await this.axiosInstance.post('/password/reset', { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Подтверждение сброса пароля
   */
  async confirmPasswordReset(token, newPassword) {
    try {
      await this.axiosInstance.post('/password/reset/confirm', {
        token,
        new_password: newPassword
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Банковские функции
   */

  /**
   * Подключение банковского счета
   */
  async connectBankAccount(bankData) {
    try {
      const response = await this.axiosInstance.post('/bank/connect', bankData);
      return {
        success: true,
        connection: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Получение подключенных банковских счетов
   */
  async getConnectedBankAccounts() {
    try {
      const response = await this.axiosInstance.get('/bank/accounts');
      return {
        success: true,
        accounts: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Отключение банковского счета
   */
  async disconnectBankAccount(connectionId) {
    try {
      await this.axiosInstance.delete(`/bank/accounts/${connectionId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Управление пользователями (для админов)
   */

  /**
   * Получение списка пользователей
   */
  async getUsers(page = 1, limit = 50, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await this.axiosInstance.get(`/users?${params}`);
      return {
        success: true,
        users: response.data.users,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Создание пользователя
   */
  async createUser(userData) {
    try {
      const response = await this.axiosInstance.post('/users', userData);
      return {
        success: true,
        user: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Обновление пользователя
   */
  async updateUser(userId, userData) {
    try {
      const response = await this.axiosInstance.put(`/users/${userId}`, userData);
      return {
        success: true,
        user: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Удаление пользователя
   */
  async deleteUser(userId) {
    try {
      await this.axiosInstance.delete(`/users/${userId}`);
      return { success: true };
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

  async handleUnauthorized() {
    console.log('Токен истек, пытаемся обновить...');
    
    try {
      await this.refreshToken();
      console.log('Токен успешно обновлен');
    } catch (error) {
      console.log('Не удалось обновить токен, перенаправляем на страницу входа');
      this.clearTokens();
      window.location.href = '/login';
    }
  }

  handleForbidden() {
    console.error('Доступ запрещен');
    // Можно показать уведомление пользователю
  }

  handleValidationError(data) {
    console.error('Ошибка валидации:', data);
    // Можно показать уведомление пользователю
  }

  handleServerError(data) {
    console.error('Ошибка сервера:', data);
    // Можно показать уведомление пользователю
  }

  handleGenericError(status, data) {
    console.error(`HTTP ${status}:`, data);
    // Можно показать уведомление пользователю
  }

  handleNetworkError() {
    console.error('Ошибка сети');
    // Можно показать уведомление пользователю
  }

  handleRequestError(error) {
    console.error('Ошибка запроса:', error);
    // Можно показать уведомление пользователю
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
        version: response.data.version
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Получение статуса сервиса
   */
  getStatus() {
    return {
      configured: !!this.config.baseURL,
      hasToken: !!this.getAuthToken(),
      tokenExpired: this.isTokenExpired(),
      baseURL: this.config.baseURL,
      timeout: this.config.timeout
    };
  }
}

// Создаем и экспортируем единственный экземпляр
const authServiceIntegration = new AuthServiceIntegration();

export default authServiceIntegration; 