import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VueQueryPlugin } from '@tanstack/vue-query';
import VueAnimateOnScroll from 'vue3-animate-onscroll';
import VueTheMask from 'vue-the-mask';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './assets/styles.css';
import './assets/styles/mdi.css';

// Импорт новых сервисов
import adaptivePerformance from './services/adaptive-performance.js';
import predictivePreloader from './services/predictive-preloader.js';
import distributedProcessing from './services/distributed-processing.js';
import wasmCalculator from './wasm/wasm-calculator.js';
import performanceMetrics from './services/performance-metrics.js';
import cacheService from './services/cache.js';
import redisCache from './services/redis-cache.js';

// Создание экземпляра Vuetify с улучшенной конфигурацией
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: { 
        primary: '#1976d2',
        secondary: '#424242',
        accent: '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107'
      },
      dark: { 
        primary: '#2196F3',
        secondary: '#424242',
        accent: '#FF4081',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107'
      },
    },
  },
  defaults: {
    VBtn: {
      variant: 'elevated',
      rounded: 'lg',
    },
    VCard: {
      rounded: 'lg',
      elevation: 2,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },
});

// Создание приложения Vue
const app = createApp(App);

// Настройка плагинов
app.use(createPinia());
app.use(router);
app.use(vuetify);
app.use(VueQueryPlugin);
app.use(VueAnimateOnScroll);
app.use(VueTheMask);
app.use(Toast, { 
  timeout: 5000,
  position: 'top-right',
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
});

// Инициализация новых сервисов
const initializeServices = async () => {
  try {
    // Инициализация адаптивной производительности
    await adaptivePerformance.init();
    console.log('Adaptive Performance initialized');
    
    // Инициализация предзагрузки
    await predictivePreloader.init();
    console.log('Predictive Preloader initialized');
    
    // Инициализация распределенной обработки
    await distributedProcessing.init();
    console.log('Distributed Processing initialized');
    
    // Инициализация WASM калькулятора
    await wasmCalculator.init();
    console.log('WASM Calculator initialized');
    
    // Инициализация метрик производительности
    performanceMetrics.init();
    console.log('Performance Metrics initialized');
    
    // Инициализация кэш сервисов
    cacheService.init();
    redisCache.init();
    console.log('Cache services initialized');
    
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// Глобальная обработка ошибок
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err);
  console.error('Component:', vm);
  console.error('Info:', info);
  
  // Отправка ошибки в метрики производительности
  if (performanceMetrics) {
    performanceMetrics.trackError(err, vm, info);
  }
};

// Глобальная обработка предупреждений
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Vue Warning:', msg);
  console.warn('Component:', vm);
  console.warn('Trace:', trace);
};

// Монтирование приложения
app.mount('#app');

// Инициализация сервисов после монтирования
initializeServices();

// Экспорт сервисов для глобального доступа
window.selfEmployedServices = {
  adaptivePerformance,
  predictivePreloader,
  distributedProcessing,
  wasmCalculator,
  performanceMetrics,
  cacheService,
  redisCache
};