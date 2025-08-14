import { defineStore } from 'pinia';
import { 
  login, 
  logout, 
  getProfile, 
  updateProfile, 
  googleLogin, 
  getCachedData,
  getSecurityProfile,
  getAIAnalytics,
  connectRealTimeWebSocket
} from '@/api';

// Импорт новых сервисов
import adaptivePerformance from '@/services/adaptive-performance.js';
import predictivePreloader from '@/services/predictive-preloader.js';
import distributedProcessing from '@/services/distributed-processing.js';
import wasmCalculator from '@/wasm/wasm-calculator.js';
import performanceMetrics from '@/services/performance-metrics.js';
import cacheService from '@/services/cache.js';
import redisCache from '@/services/redis-cache.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    userId: null,
    notifications: [],
    securityProfile: null,
    aiMetrics: null,
    realtimeConnection: null,
    cachedData: new Map(),
    
    // Новые сервисы
    adaptivePerformance: null,
    predictivePreloader: null,
    distributedProcessing: null,
    wasmCalculator: null,
    performanceMetrics: null,
    cacheService: null,
    redisCache: null,
    
    // Состояние сервисов
    servicesInitialized: false,
    servicesStatus: {
      adaptivePerformance: 'pending',
      predictivePreloader: 'pending',
      distributedProcessing: 'pending',
      wasmCalculator: 'pending',
      performanceMetrics: 'pending',
      cacheService: 'pending',
      redisCache: 'pending'
    }
  }),

  actions: {
    async login(email, password) {
      try {
        const data = await login(email, password);
        this.userId = data.user_id;
        this.token = data.access_token;
        
        // Загружаем профиль пользователя
        await this.fetchProfile();
        
        // Загружаем профиль безопасности
        await this.fetchSecurityProfile();
        
        // Подключаемся к real-time сервисам
        this.connectRealTimeServices();
        
        // Инициализируем кэш
        await this.initializeCache();
        
        // Инициализируем новые сервисы
        await this.initializeServices();
        
        return data;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    async register(payload) {
      try {
        const data = await login(payload.email, payload.password);
        this.userId = data.user_id;
        this.token = data.access_token;
        
        await this.fetchProfile();
        await this.fetchSecurityProfile();
        this.connectRealTimeServices();
        await this.initializeCache();
        await this.initializeServices();
        
        return data;
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    },

    async googleLogin(code, state) {
      try {
        const data = await googleLogin(code, state);
        this.userId = data.user_id;
        this.token = data.access_token;
        
        await this.fetchProfile();
        await this.fetchSecurityProfile();
        this.connectRealTimeServices();
        await this.initializeCache();
        await this.initializeServices();
        
        return data;
      } catch (error) {
        console.error('Google login failed:', error);
        throw error;
      }
    },

    async logout() {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearUserData();
        this.cleanupServices();
      }
    },

    async fetchProfile() {
      try {
        const profile = await getProfile();
        this.user = {
          ...profile,
          subscription_status: profile.subscription_status || 'none',
          trial_end: profile.trial_end || '',
          attachedCard: profile.attachedCard || null,
        };
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        throw error;
      }
    },

    async updateProfile(profile) {
      try {
        await updateProfile(profile);
        await this.fetchProfile();
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },

    async fetchSecurityProfile() {
      try {
        this.securityProfile = await getSecurityProfile();
      } catch (error) {
        console.error('Failed to fetch security profile:', error);
        // Не блокируем основную функциональность
      }
    },

    async fetchAIMetrics() {
      try {
        this.aiMetrics = await getAIAnalytics(['user_activity', 'security_events', 'performance']);
      } catch (error) {
        console.error('Failed to fetch AI metrics:', error);
        // Не блокируем основную функциональность
      }
    },

    connectRealTimeServices() {
      if (!this.userId || !this.token) return;

      try {
        // Подключаемся к real-time уведомлениям
        this.realtimeConnection = connectRealTimeWebSocket(
          this.userId, 
          ['notifications', 'tasks', 'security']
        );

        this.realtimeConnection.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleRealTimeUpdate(data);
        };

        this.realtimeConnection.onerror = (error) => {
          console.error('Real-time connection error:', error);
        };

        this.realtimeConnection.onclose = () => {
          console.log('Real-time connection closed, attempting to reconnect...');
          setTimeout(() => this.connectRealTimeServices(), 5000);
        };
      } catch (error) {
        console.error('Failed to connect to real-time services:', error);
      }
    },

    handleRealTimeUpdate(data) {
      switch (data.type) {
        case 'notification':
          this.notifications.push({
            id: Date.now(),
            message: data.message,
            type: data.notification_type || 'info',
            timestamp: new Date().toISOString()
          });
          break;
        case 'task_update':
          // Обработка обновлений задач
          console.log('Task update received:', data);
          break;
        case 'security_alert':
          // Обработка уведомлений безопасности
          console.log('Security alert received:', data);
          break;
        default:
          console.log('Unknown real-time update type:', data.type);
      }
    },

    async initializeCache() {
      try {
        // Загружаем часто используемые данные в кэш
        const cacheKeys = ['user_preferences', 'dashboard_config', 'ui_settings'];
        
        for (const key of cacheKeys) {
          try {
            const cachedData = await getCachedData(key, 'user');
            if (cachedData) {
              this.cachedData.set(key, cachedData);
            }
          } catch (error) {
            console.warn(`Failed to load cached data for ${key}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize cache:', error);
      }
    },

    async getCachedData(key, service = 'user') {
      // Сначала проверяем локальный кэш
      if (this.cachedData.has(key)) {
        return this.cachedData.get(key);
      }

      try {
        // Если нет в локальном кэше, загружаем с сервера
        const data = await getCachedData(key, service);
        this.cachedData.set(key, data);
        return data;
      } catch (error) {
        console.error(`Failed to get cached data for ${key}:`, error);
        return null;
      }
    },

    async setCachedData(key, data, service = 'user') {
      try {
        this.cachedData.set(key, data);
        // Асинхронно сохраняем на сервере
        setTimeout(() => {
          import('@/api').then(({ setCachedData }) => {
            setCachedData(key, data, 3600, service).catch(console.error);
          });
        }, 0);
      } catch (error) {
        console.error(`Failed to set cached data for ${key}:`, error);
      }
    },

    clearUserData() {
      this.user = null;
      this.token = null;
      this.userId = null;
      this.notifications = [];
      this.securityProfile = null;
      this.aiMetrics = null;
      this.cachedData.clear();
      
      if (this.realtimeConnection) {
        this.realtimeConnection.close();
        this.realtimeConnection = null;
      }
    },

    // Методы для работы с уведомлениями
    addNotification(notification) {
      this.notifications.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...notification
      });
    },

    removeNotification(notificationId) {
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },

    clearNotifications() {
      this.notifications = [];
    },

    // Методы для работы с безопасностью
    async updateSecuritySettings(settings) {
      try {
        const { updateSecuritySettings } = await import('@/api');
        await updateSecuritySettings(settings);
        await this.fetchSecurityProfile();
      } catch (error) {
        console.error('Failed to update security settings:', error);
        throw error;
      }
    },

    // Методы для работы с AI аналитикой
    async refreshAIMetrics() {
      await this.fetchAIMetrics();
    },

    // Методы для работы с кэшем
    clearCache() {
      this.cachedData.clear();
    },

    getCacheSize() {
      return this.cachedData.size;
    },

    // Методы для работы с подпиской
    hasActiveSubscription() {
      return this.user?.subscription_status === 'active';
    },

    isTrialExpired() {
      if (!this.user?.trial_end) return false;
      return new Date() > new Date(this.user.trial_end);
    },

    getTrialDaysLeft() {
      if (!this.user?.trial_end) return 0;
      const trialEnd = new Date(this.user.trial_end);
      const now = new Date();
      const diffTime = trialEnd - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    },

    // Инициализация новых сервисов
    async initializeServices() {
      try {
        this.servicesStatus.adaptivePerformance = 'initializing';
        this.adaptivePerformance = adaptivePerformance;
        await adaptivePerformance.init();
        this.servicesStatus.adaptivePerformance = 'ready';
        
        this.servicesStatus.predictivePreloader = 'initializing';
        this.predictivePreloader = predictivePreloader;
        await predictivePreloader.init();
        this.servicesStatus.predictivePreloader = 'ready';
        
        this.servicesStatus.distributedProcessing = 'initializing';
        this.distributedProcessing = distributedProcessing;
        await distributedProcessing.init();
        this.servicesStatus.distributedProcessing = 'ready';
        
        this.servicesStatus.wasmCalculator = 'initializing';
        this.wasmCalculator = wasmCalculator;
        await wasmCalculator.init();
        this.servicesStatus.wasmCalculator = 'ready';
        
        this.servicesStatus.performanceMetrics = 'initializing';
        this.performanceMetrics = performanceMetrics;
        performanceMetrics.init();
        this.servicesStatus.performanceMetrics = 'ready';
        
        this.servicesStatus.cacheService = 'initializing';
        this.cacheService = cacheService;
        cacheService.init();
        this.servicesStatus.cacheService = 'ready';
        
        this.servicesStatus.redisCache = 'initializing';
        this.redisCache = redisCache;
        await redisCache.init();
        this.servicesStatus.redisCache = 'ready';
        
        this.servicesInitialized = true;
        console.log('All services initialized successfully');
        
      } catch (error) {
        console.error('Failed to initialize services:', error);
        this.servicesStatus = Object.fromEntries(
          Object.keys(this.servicesStatus).map(key => [key, 'error'])
        );
      }
    },

    // Очистка сервисов при выходе
    cleanupServices() {
      try {
        if (this.adaptivePerformance) {
          this.adaptivePerformance.cleanup();
        }
        if (this.predictivePreloader) {
          this.predictivePreloader.reset();
        }
        if (this.distributedProcessing) {
          this.distributedProcessing.cleanup();
        }
        if (this.performanceMetrics) {
          this.performanceMetrics.resetMetrics();
        }
        if (this.cacheService) {
          this.cacheService.clear();
        }
        if (this.redisCache) {
          this.redisCache.close();
        }
        
        this.servicesInitialized = false;
        this.servicesStatus = Object.fromEntries(
          Object.keys(this.servicesStatus).map(key => [key, 'pending'])
        );
        
      } catch (error) {
        console.error('Failed to cleanup services:', error);
      }
    },

    // Получение статуса сервисов
    getServicesStatus() {
      return this.servicesStatus;
    },

    // Проверка готовности сервисов
    areServicesReady() {
      return this.servicesInitialized && 
             Object.values(this.servicesStatus).every(status => status === 'ready');
    },

    // Перезапуск сервиса
    async restartService(serviceName) {
      if (!this.servicesStatus[serviceName]) {
        throw new Error(`Unknown service: ${serviceName}`);
      }
      
      try {
        this.servicesStatus[serviceName] = 'restarting';
        
        switch (serviceName) {
          case 'adaptivePerformance':
            await this.adaptivePerformance.reload();
            break;
          case 'predictivePreloader':
            this.predictivePreloader.reset();
            await this.predictivePreloader.init();
            break;
          case 'distributedProcessing':
            this.distributedProcessing.cleanup();
            await this.distributedProcessing.init();
            break;
          case 'wasmCalculator':
            await this.wasmCalculator.reload();
            break;
          case 'performanceMetrics':
            this.performanceMetrics.resetMetrics();
            this.performanceMetrics.init();
            break;
          case 'cacheService':
            this.cacheService.clear();
            this.cacheService.init();
            break;
          case 'redisCache':
            this.redisCache.close();
            await this.redisCache.init();
            break;
        }
        
        this.servicesStatus[serviceName] = 'ready';
        console.log(`Service ${serviceName} restarted successfully`);
        
      } catch (error) {
        console.error(`Failed to restart service ${serviceName}:`, error);
        this.servicesStatus[serviceName] = 'error';
        throw error;
      }
    }
  },

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    
    isCompanyAdmin: (state) => state.user?.role === 'admin',
    
    subscriptionStatus: (state) => state.user?.subscription_status || 'none',
    
    trialEnd: (state) => state.user?.trial_end || '',
    
    attachedCard: (state) => state.user?.attachedCard || null,
    
    hasSecurityProfile: (state) => !!state.securityProfile,
    
    hasAIMetrics: (state) => !!state.aiMetrics,
    
    isRealTimeConnected: (state) => !!state.realtimeConnection && state.realtimeConnection.readyState === WebSocket.OPEN,
    
    unreadNotificationsCount: (state) => 
      state.notifications.filter(n => !n.read).length,
    
    recentNotifications: (state) => 
      state.notifications
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5),
    
    cacheInfo: (state) => ({
      size: state.cachedData.size,
      keys: Array.from(state.cachedData.keys())
    }),

    // Геттеры для новых сервисов
    servicesReady: (state) => state.servicesInitialized,
    
    adaptivePerformanceReady: (state) => state.servicesStatus.adaptivePerformance === 'ready',
    
    predictivePreloaderReady: (state) => state.servicesStatus.predictivePreloader === 'ready',
    
    distributedProcessingReady: (state) => state.servicesStatus.distributedProcessing === 'ready',
    
    wasmCalculatorReady: (state) => state.servicesStatus.wasmCalculator === 'ready',
    
    performanceMetricsReady: (state) => state.servicesStatus.performanceMetrics === 'ready',
    
    cacheServicesReady: (state) => 
      state.servicesStatus.cacheService === 'ready' && 
      state.servicesStatus.redisCache === 'ready',
    
    allServicesReady: (state) => 
      state.servicesInitialized && 
      Object.values(state.servicesStatus).every(status => status === 'ready'),
    
    servicesWithErrors: (state) => 
      Object.entries(state.servicesStatus)
        .filter(([_, status]) => status === 'error')
        .map(([name, _]) => name),
    
    servicesStatusSummary: (state) => ({
      total: Object.keys(state.servicesStatus).length,
      ready: Object.values(state.servicesStatus).filter(status => status === 'ready').length,
      pending: Object.values(state.servicesStatus).filter(status => status === 'pending').length,
      initializing: Object.values(state.servicesStatus).filter(status => status === 'initializing').length,
      error: Object.values(state.servicesStatus).filter(status => status === 'error').length,
      restarting: Object.values(state.servicesStatus).filter(status => status === 'restarting').length
    })
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth-store',
        storage: localStorage,
        paths: ['userId', 'token']
      }
    ]
  }
});