<template>
  <div id="app">
    <!-- Основное содержимое -->
    <router-view v-if="!isAuthenticated" />
    
    <div v-else class="app-container">
      <!-- Боковая панель -->
      <SidebarForm v-if="showSidebar" />
      
      <!-- Основной контент -->
      <main class="main-content" :class="{ 'with-sidebar': showSidebar }">
        <!-- Уведомления о подписке -->
        <v-alert
          v-if="showSubscriptionAlert"
          type="warning"
          class="subscription-alert"
          dismissible
        >
          <template v-slot:prepend>
            <v-icon>mdi-alert-circle</v-icon>
          </template>
          Ваша подписка истекает через {{ subscriptionDaysLeft }} дней. 
          <v-btn
            text
            color="primary"
            @click="$router.push('/subscription')"
            class="ml-2"
          >
            Продлить
          </v-btn>
        </v-alert>
        
        <!-- Основной роутер -->
        <router-view />
      </main>
    </div>

    <!-- Глобальные компоненты -->
    <VoiceRecorderForm v-if="isAuthenticated" />
    <Chat v-if="isAuthenticated" />
    
    <!-- Новые компоненты -->
    <AccessibilityManager v-if="isAuthenticated" />
    <ABTestingManager v-if="isAuthenticated" />
    <EdgeComputingManager v-if="isAuthenticated" />
    <VoiceControlManager v-if="isAuthenticated" />
    
    <!-- Мониторинг сервисов -->
    <ServicesMonitor v-if="isAuthenticated && showServicesMonitor" />
    
    <!-- 3D графики (условно) -->
    <ThreeJSChart 
      v-if="isAuthenticated && show3DCharts"
      :data="chartData"
      type="bar3d"
      :height="400"
    />
    
    <!-- Микрофронтенды -->
    <div id="micro-frontends-container" v-if="isAuthenticated"></div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import SidebarForm from '@/components/SidebarForm.vue';
import VoiceRecorderForm from '@/components/VoiceRecorderForm.vue';
import Chat from '@/components/Chat.vue';
import AccessibilityManager from '@/components/accessibility/AccessibilityManager.vue';
import ABTestingManager from '@/components/ab-testing/ABTestingManager.vue';
import EdgeComputingManager from '@/components/edge-computing/EdgeComputingManager.vue';
import ThreeJSChart from '@/components/3d-visualization/ThreeJSChart.vue';
import VoiceControlManager from '@/components/voice-control/VoiceControlManager.vue';
import ServicesMonitor from '@/components/ServicesMonitor.vue';
import registry from '@/micro-frontends/registry';

export default {
  name: 'App',
  
  components: {
    SidebarForm,
    VoiceRecorderForm,
    Chat,
    AccessibilityManager,
    ABTestingManager,
    EdgeComputingManager,
    ThreeJSChart,
    VoiceControlManager,
    ServicesMonitor
  },
  
  setup() {
    const authStore = useAuthStore();
    
    // Вычисляемые свойства
    const isAuthenticated = computed(() => authStore.isAuthenticated);
    const showSidebar = computed(() => authStore.isAuthenticated);
    const showSubscriptionAlert = computed(() => {
      return authStore.isAuthenticated && 
             authStore.subscriptionStatus === 'active' && 
             authStore.subscriptionDaysLeft <= 7;
    });
    const subscriptionDaysLeft = computed(() => authStore.subscriptionDaysLeft);
    const show3DCharts = computed(() => authStore.isAuthenticated);
    
    // Показывать мониторинг сервисов только администраторам
    const showServicesMonitor = computed(() => 
      authStore.isAuthenticated && authStore.isCompanyAdmin
    );
    
    // Данные для 3D графиков
    const chartData = computed(() => [
      { label: 'Задачи', value: 25, category: 'tasks', period: 'today' },
      { label: 'Клиенты', value: 18, category: 'clients', period: 'today' },
      { label: 'Отчеты', value: 12, category: 'reports', period: 'today' },
      { label: 'Акты', value: 8, category: 'acts', period: 'today' }
    ]);
    
    // Инициализация микрофронтендов
    const initMicroFrontends = async () => {
      try {
        // Загружаем основные модули
        await registry.load('auth-module');
        await registry.load('tasks-module');
        await registry.load('analytics-module');
        
        console.log('Micro-frontends loaded successfully');
      } catch (error) {
        console.error('Failed to load micro-frontends:', error);
      }
    };
    
    // Инициализация PWA
    const initPWA = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered:', registration);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      }
      
      // Проверяем возможность установки
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Показываем кнопку установки
        console.log('PWA install prompt available');
      });
    };
    
    // Инициализация GraphQL
    const initGraphQL = () => {
      // Здесь можно инициализировать GraphQL клиент
      console.log('GraphQL client ready');
    };
    
    // Жизненный цикл
    onMounted(() => {
      if (isAuthenticated.value) {
        initMicroFrontends();
        initPWA();
        initGraphQL();
      }
    });
    
    onUnmounted(() => {
      // Очистка ресурсов
    });
    
    return {
      isAuthenticated,
      showSidebar,
      showSubscriptionAlert,
      subscriptionDaysLeft,
      show3DCharts,
      showServicesMonitor,
      chartData
    };
  }
};
</script>

<style>
#app {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
  transition: margin-left 0.3s ease;
}

.main-content.with-sidebar {
  margin-left: 280px;
}

.subscription-alert {
  margin-bottom: 20px;
}

/* PWA стили */
@media (display-mode: standalone) {
  .main-content {
    padding-top: 40px;
  }
}

/* Доступность */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Высокий контраст */
@media (prefers-contrast: high) {
  .main-content {
    background-color: #000;
    color: #fff;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .main-content {
    background-color: #121212;
    color: #fff;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .main-content.with-sidebar {
    margin-left: 0;
  }
  
  .main-content {
    padding: 10px;
  }
}

/* Микрофронтенды */
#micro-frontends-container {
  position: relative;
  z-index: 100;
}

/* Edge Computing индикаторы */
.edge-status-indicator {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

/* 3D графики */
.threejs-chart-container {
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Голосовое управление */
.voice-control-indicator {
  position: fixed;
  bottom: 80px;
  left: 20px;
  z-index: 1000;
}

/* A/B тестирование */
.ab-testing-indicator {
  position: fixed;
  top: 60px;
  left: 20px;
  z-index: 1000;
}
</style>