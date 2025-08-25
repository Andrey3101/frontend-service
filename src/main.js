import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import VueAnimateOnScroll from 'vue3-animate-onscroll';
import VueTheMask from 'vue-the-mask';
import { Toast } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

import App from './App.vue';
import router from './router';

// Импорт Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import './assets/styles/mdi.css';

// Импорт новых сервисов
import adaptivePerformance from './services/adaptive-performance.js';
import predictivePreloader from './services/predictive-preloader.js';
import distributedProcessing from './services/distributed-processing.js';
import wasmCalculator from './wasm/wasm-calculator.js';
import performanceMetrics from './services/performance-metrics.js';
import cacheService from './services/cache-service.js';
import redisCache from './services/redis-cache.js';

// Импорт новой структуры сервисов
import { initializeServices } from './services/index.js';

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
    
    // Инициализация кэш сервиса
    console.log('Cache Service initialized');
    
    // Инициализация Redis кэша
    console.log('Redis Cache initialized');
    
    // Инициализация новой структуры сервисов
    await initializeServices();
    console.log('New Services Structure initialized');
    
  } catch (error) {
    console.error('Error initializing services:', error);
  }
};

// Запуск инициализации
initializeServices();

// Монтирование приложения
app.mount('#app');