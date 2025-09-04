import { defineStore } from 'pinia';
import apiClient from '../services/api-client.js';
import { secureSetItemSync, secureGetItemSync, clearSecureStorage } from '../utils/encryption.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: secureGetItemSync('auth_token', true) || null,
    refreshToken: secureGetItemSync('refresh_token', true) || null,
    isAuthenticated: false,
    loading: false,
    error: null,
    lastActivity: Date.now(),
    sessionTimeout: 30 * 60 * 1000, // 30 минут
    optimisticUpdates: new Map()
  }),

  getters: {
    userRole: (state) => state.user?.role || null,
    companyId: (state) => state.user?.company_id || null,
    isAdmin: (state) => state.user?.role === 'admin',
    isManager: (state) => state.user?.role === 'manager',
    isUser: (state) => state.user?.role === 'user',
    isSessionExpired: (state) => {
      return Date.now() - state.lastActivity > state.sessionTimeout;
    },
    hasOptimisticUpdate: (state) => (key) => state.optimisticUpdates.has(key)
  },

  actions: {
    /**
     * Вход в систему с оптимистичным обновлением
     */
    async login(credentials) {
      this.loading = true;
      this.error = null;
      
      try {
        // Оптимистичное обновление - показываем загрузку пользователя
        const optimisticUser = {
          id: 'temp',
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: 'user',
          status: 'loading'
        };
        
        this.setOptimisticUser(optimisticUser);
        
        const response = await apiClient.post('/v2/auth/login', credentials);
        
        if (response.success) {
          this.setAuthData(response.data);
          this.clearOptimisticUpdate('login');
          return response.data;
        } else {
          throw new Error(response.error || 'Ошибка входа');
        }
      } catch (error) {
        this.error = error.message;
        this.clearOptimisticUpdate('login');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Регистрация с оптимистичным обновлением
     */
    async register(userData) {
      this.loading = true;
      this.error = null;
      
      try {
        // Оптимистичное обновление
        const optimisticUser = {
          id: 'temp',
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          role: 'user',
          status: 'registering'
        };
        
        this.setOptimisticUser(optimisticUser);
        
        const response = await apiClient.post('/v2/auth/register', userData);
        
        if (response.success) {
          this.setAuthData(response.data);
          this.clearOptimisticUpdate('register');
          return response.data;
        } else {
          throw new Error(response.error || 'Ошибка регистрации');
        }
      } catch (error) {
        this.error = error.message;
        this.clearOptimisticUpdate('register');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Выход из системы
     */
    async logout() {
      try {
        await apiClient.post('/v2/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearAuthData();
      }
    },

    /**
     * Обновление токена
     */
    async refreshToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      try {
        const response = await apiClient.post('/v2/auth/refresh', {
          refresh_token: this.refreshToken
        });
        
        if (response.success) {
          this.setAuthData(response.data);
          return response.data;
        } else {
          throw new Error(response.error || 'Ошибка обновления токена');
        }
      } catch (error) {
        this.clearAuthData();
        throw error;
      }
    },

    /**
     * Получение профиля пользователя с кэшированием
     */
    async getProfile() {
      if (!this.token) return;

      try {
        const response = await apiClient.get('/v2/auth/profile', null, { cache: true });
        
        if (response.success) {
          this.user = response.data;
          this.updateLastActivity();
          return response.data;
        } else {
          throw new Error(response.error || 'Ошибка получения профиля');
        }
      } catch (error) {
        console.error('Failed to get profile:', error);
        throw error;
      }
    },

    /**
     * Обновление профиля с оптимистичным обновлением
     */
    async updateProfile(profileData) {
      try {
        // Оптимистичное обновление
        const optimisticData = { ...this.user, ...profileData };
        this.setOptimisticUser(optimisticData);
        
        const response = await apiClient.put('/v2/auth/profile', profileData);
        
        if (response.success) {
          this.user = { ...this.user, ...response.data };
          this.clearOptimisticUpdate('profile');
          this.updateLastActivity();
          return response.data;
        } else {
          throw new Error(response.error || 'Ошибка обновления профиля');
        }
      } catch (error) {
        this.error = error.message;
        this.clearOptimisticUpdate('profile');
        throw error;
      }
    },

    /**
     * Сброс пароля
     */
    async resetPassword(email) {
      try {
        const response = await apiClient.post('/v2/auth/password/reset', { email });
        
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error || 'Ошибка сброса пароля');
        }
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    /**
     * Подтверждение сброса пароля
     */
    async confirmResetPassword(token, newPassword) {
      try {
        const response = await apiClient.post('/v2/auth/password/reset/confirm', {
          token,
          new_password: newPassword
        });
        
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error || 'Ошибка подтверждения сброса пароля');
        }
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    /**
     * Установка данных аутентификации с шифрованием
     */
    setAuthData(data) {
      this.token = data.access_token || data.token;
      this.refreshToken = data.refresh_token;
      this.user = data.user;
      this.isAuthenticated = true;
      this.error = null;
      this.updateLastActivity();
      
      // Безопасное сохранение токенов
      if (this.token) {
        secureSetItemSync('auth_token', this.token, true);
      }
      if (this.refreshToken) {
        secureSetItemSync('refresh_token', this.refreshToken, true);
      }
    },

    /**
     * Очистка данных аутентификации
     */
    clearAuthData() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      this.error = null;
      this.optimisticUpdates.clear();
      
      // Очистка безопасного хранилища
      clearSecureStorage();
    },

    /**
     * Установка ошибки
     */
    setError(error) {
      this.error = error;
    },

    /**
     * Очистка ошибки
     */
    clearError() {
      this.error = null;
    },

    /**
     * Обновление времени последней активности
     */
    updateLastActivity() {
      this.lastActivity = Date.now();
    },

    /**
     * Проверка активности сессии
     */
    checkSessionActivity() {
      if (this.isSessionExpired) {
        this.clearAuthData();
        return false;
      }
      this.updateLastActivity();
      return true;
    },

    /**
     * Установка оптимистичного пользователя
     */
    setOptimisticUser(user) {
      this.optimisticUpdates.set('user', user);
      this.user = user;
    },

    /**
     * Очистка оптимистичного обновления
     */
    clearOptimisticUpdate(key) {
      this.optimisticUpdates.delete(key);
    },

    /**
     * Откат оптимистичного обновления
     */
    rollbackOptimisticUpdate(key) {
      if (this.optimisticUpdates.has(key)) {
        this.optimisticUpdates.delete(key);
        // Здесь можно добавить логику отката к предыдущему состоянию
      }
    },

    /**
     * Проверка здоровья аутентификации
     */
    async checkAuthHealth() {
      try {
        const response = await apiClient.checkHealth();
        return response.healthy;
      } catch (error) {
        console.error('Auth health check failed:', error);
        return false;
      }
    },

    /**
     * Инициализация аутентификации
     */
    async initializeAuth() {
      if (this.token && !this.isSessionExpired) {
        try {
          await this.getProfile();
          return true;
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          this.clearAuthData();
          return false;
        }
      }
      return false;
    },

    /**
     * Автоматическое обновление токена
     */
    async autoRefreshToken() {
      if (this.token && apiClient.isTokenExpired()) {
        try {
          await this.refreshToken();
          return true;
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          this.clearAuthData();
          return false;
        }
      }
      return true;
    }
  }
});