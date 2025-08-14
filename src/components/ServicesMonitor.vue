<template>
  <v-card class="services-monitor" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-server</v-icon>
      Мониторинг сервисов
      <v-spacer></v-spacer>
      <v-btn
        icon
        small
        @click="refreshServices"
        :loading="refreshing"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6" v-for="(service, name) in servicesStatus" :key="name">
          <v-card
            :class="`service-card ${getServiceStatusClass(service)}`"
            variant="outlined"
            elevation="1"
          >
            <v-card-text class="pa-3">
              <div class="d-flex align-center">
                <v-icon
                  :color="getServiceStatusColor(service)"
                  class="mr-2"
                >
                  {{ getServiceStatusIcon(service) }}
                </v-icon>
                
                <div class="flex-grow-1">
                  <div class="text-subtitle-2 font-weight-medium">
                    {{ getServiceDisplayName(name) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getServiceStatusText(service) }}
                  </div>
                </div>
                
                <v-btn
                  v-if="service === 'error'"
                  icon
                  small
                  color="error"
                  @click="restartService(name)"
                  :loading="restartingServices.includes(name)"
                >
                  <v-icon>mdi-restart</v-icon>
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Общая статистика -->
      <v-divider class="my-4"></v-divider>
      
      <v-row>
        <v-col cols="12" md="3" v-for="(stat, key) in servicesSummary" :key="key">
          <v-card variant="outlined" class="text-center">
            <v-card-text class="pa-3">
              <div class="text-h6 font-weight-bold" :class="getStatColor(key)">
                {{ stat }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ getStatLabel(key) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Действия -->
      <v-divider class="my-4"></v-divider>
      
      <v-row>
        <v-col cols="12" class="text-center">
          <v-btn
            color="primary"
            @click="restartAllServices"
            :disabled="!hasServicesWithErrors"
            :loading="restartingAll"
            class="mr-3"
          >
            <v-icon left>mdi-restart</v-icon>
            Перезапустить все сервисы с ошибками
          </v-btn>
          
          <v-btn
            color="secondary"
            @click="showServicesDetails = !showServicesDetails"
            class="mr-3"
          >
            <v-icon left>{{ showServicesDetails ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
            {{ showServicesDetails ? 'Скрыть детали' : 'Показать детали' }}
          </v-btn>
          
          <v-btn
            color="info"
            @click="exportServicesReport"
            :disabled="!allServicesReady"
          >
            <v-icon left>mdi-download</v-icon>
            Экспорт отчета
          </v-btn>
        </v-col>
      </v-row>
      
      <!-- Детальная информация -->
      <v-expand-transition>
        <div v-if="showServicesDetails">
          <v-divider class="my-4"></v-divider>
          
          <v-expansion-panels>
            <v-expansion-panel
              v-for="(service, name) in servicesStatus"
              :key="name"
            >
              <v-expansion-panel-title>
                <v-icon
                  :color="getServiceStatusColor(service)"
                  class="mr-2"
                >
                  {{ getServiceStatusIcon(service) }}
                </v-icon>
                {{ getServiceDisplayName(name) }}
                <v-chip
                  :color="getServiceStatusColor(service)"
                  size="small"
                  class="ml-auto"
                >
                  {{ service }}
                </v-chip>
              </v-expansion-panel-title>
              
              <v-expansion-panel-text>
                <div class="pa-3">
                  <div class="text-body-2">
                    <strong>Описание:</strong> {{ getServiceDescription(name) }}
                  </div>
                  
                  <div class="text-body-2 mt-2">
                    <strong>Возможности:</strong>
                    <ul class="mt-1">
                      <li v-for="capability in getServiceCapabilities(name)" :key="capability">
                        {{ capability }}
                      </li>
                    </ul>
                  </div>
                  
                  <div class="text-body-2 mt-2" v-if="getServiceMetrics(name)">
                    <strong>Метрики:</strong>
                    <pre class="mt-1 pa-2 bg-grey-lighten-4 rounded">{{ JSON.stringify(getServiceMetrics(name), null, 2) }}</pre>
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'ServicesMonitor',
  
  setup() {
    const authStore = useAuthStore();
    const refreshing = ref(false);
    const restartingServices = ref([]);
    const restartingAll = ref(false);
    const showServicesDetails = ref(false);
    
    // Вычисляемые свойства
    const servicesStatus = computed(() => authStore.getServicesStatus());
    const servicesSummary = computed(() => authStore.servicesStatusSummary);
    const allServicesReady = computed(() => authStore.allServicesReady);
    const hasServicesWithErrors = computed(() => 
      Object.values(servicesStatus.value).some(status => status === 'error')
    );
    
    // Методы
    const refreshServices = async () => {
      refreshing.value = true;
      try {
        // Обновляем статус сервисов
        await authStore.initializeServices();
      } catch (error) {
        console.error('Failed to refresh services:', error);
      } finally {
        refreshing.value = false;
      }
    };
    
    const restartService = async (serviceName) => {
      restartingServices.value.push(serviceName);
      try {
        await authStore.restartService(serviceName);
      } catch (error) {
        console.error(`Failed to restart service ${serviceName}:`, error);
      } finally {
        const index = restartingServices.value.indexOf(serviceName);
        if (index > -1) {
          restartingServices.value.splice(index, 1);
        }
      }
    };
    
    const restartAllServices = async () => {
      restartingAll.value = true;
      try {
        const servicesWithErrors = Object.entries(servicesStatus.value)
          .filter(([_, status]) => status === 'error')
          .map(([name, _]) => name);
        
        for (const serviceName of servicesWithErrors) {
          await authStore.restartService(serviceName);
        }
      } catch (error) {
        console.error('Failed to restart all services:', error);
      } finally {
        restartingAll.value = false;
      }
    };
    
    const exportServicesReport = () => {
      const report = {
        timestamp: new Date().toISOString(),
        services: servicesStatus.value,
        summary: servicesSummary.value,
        user: authStore.user?.email || 'unknown'
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `services-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    
    // Вспомогательные методы
    const getServiceStatusClass = (status) => {
      const classes = {
        ready: 'service-ready',
        pending: 'service-pending',
        initializing: 'service-initializing',
        error: 'service-error',
        restarting: 'service-restarting'
      };
      return classes[status] || 'service-unknown';
    };
    
    const getServiceStatusColor = (status) => {
      const colors = {
        ready: 'success',
        pending: 'warning',
        initializing: 'info',
        error: 'error',
        restarting: 'warning'
      };
      return colors[status] || 'grey';
    };
    
    const getServiceStatusIcon = (status) => {
      const icons = {
        ready: 'mdi-check-circle',
        pending: 'mdi-clock-outline',
        initializing: 'mdi-loading',
        error: 'mdi-alert-circle',
        restarting: 'mdi-restart'
      };
      return icons[status] || 'mdi-help-circle';
    };
    
    const getServiceStatusText = (status) => {
      const texts = {
        ready: 'Готов к работе',
        pending: 'Ожидает инициализации',
        initializing: 'Инициализация...',
        error: 'Ошибка инициализации',
        restarting: 'Перезапуск...'
      };
      return texts[status] || 'Неизвестный статус';
    };
    
    const getServiceDisplayName = (name) => {
      const names = {
        adaptivePerformance: 'Адаптивная производительность',
        predictivePreloader: 'Умная предзагрузка',
        distributedProcessing: 'Распределенная обработка',
        wasmCalculator: 'WASM калькулятор',
        performanceMetrics: 'Метрики производительности',
        cacheService: 'Кэш сервис',
        redisCache: 'Redis кэш'
      };
      return names[name] || name;
    };
    
    const getServiceDescription = (name) => {
      const descriptions = {
        adaptivePerformance: 'Автоматическая настройка производительности под устройство',
        predictivePreloader: 'Предзагрузка контента на основе поведения пользователя',
        distributedProcessing: 'Распределение вычислений между клиентом и сервером',
        wasmCalculator: 'Высокопроизводительные вычисления в WebAssembly',
        performanceMetrics: 'Мониторинг и анализ производительности приложения',
        cacheService: 'Многоуровневое кэширование данных',
        redisCache: 'Распределенное кэширование через Redis'
      };
      return descriptions[name] || 'Описание недоступно';
    };
    
    const getServiceCapabilities = (name) => {
      const capabilities = {
        adaptivePerformance: [
          'Автоматическое определение профиля устройства',
          'Адаптивная настройка рендеринга',
          'Мониторинг FPS и памяти',
          'Оптимизация под батарею и сеть'
        ],
        predictivePreloader: [
          'Анализ паттернов навигации',
          'Предзагрузка на основе кликов',
          'Машинное обучение поведения',
          'Умная оптимизация загрузки'
        ],
        distributedProcessing: [
          'Обнаружение доступных узлов',
          'Балансировка нагрузки',
          'Web Workers для параллельных вычислений',
          'Мониторинг здоровья узлов'
        ],
        wasmCalculator: [
          'Финансовые расчеты',
          'Математические функции',
          'Статистический анализ',
          'Матричные операции'
        ],
        performanceMetrics: [
          'Отслеживание API запросов',
          'Мониторинг рендеринга',
          'Анализ памяти',
          'Экспорт метрик'
        ],
        cacheService: [
          'Многоуровневое кэширование',
          'Автоматическая очистка',
          'Паттерн-инвалидация',
          'Статистика использования'
        ],
        redisCache: [
          'Распределенное кэширование',
          'Поддержка браузера и Node.js',
          'Метрики производительности',
          'Автоматическое переподключение'
        ]
      };
      return capabilities[name] || ['Возможности недоступны'];
    };
    
    const getServiceMetrics = (name) => {
      try {
        switch (name) {
          case 'adaptivePerformance':
            return authStore.adaptivePerformance?.getMetrics();
          case 'predictivePreloader':
            return authStore.predictivePreloader?.getStats();
          case 'distributedProcessing':
            return authStore.distributedProcessing?.getStats();
          case 'performanceMetrics':
            return authStore.performanceMetrics?.getMetrics();
          case 'cacheService':
            return authStore.cacheService?.getStats();
          case 'redisCache':
            return authStore.redisCache?.getStats();
          default:
            return null;
        }
      } catch (error) {
        console.error(`Failed to get metrics for ${name}:`, error);
        return null;
      }
    };
    
    // Инициализация
    onMounted(() => {
      // Автоматическое обновление каждые 30 секунд
      setInterval(() => {
        if (authStore.isAuthenticated) {
          refreshServices();
        }
      }, 30000);
    });
    
    return {
      refreshing,
      restartingServices,
      restartingAll,
      showServicesDetails,
      servicesStatus,
      servicesSummary,
      allServicesReady,
      hasServicesWithErrors,
      refreshServices,
      restartService,
      restartAllServices,
      exportServicesReport,
      getServiceStatusClass,
      getServiceStatusColor,
      getServiceStatusIcon,
      getServiceStatusText,
      getServiceDisplayName,
      getServiceDescription,
      getServiceCapabilities,
      getServiceMetrics
    };
  }
};
</script>

<style scoped>
.services-monitor {
  margin: 20px 0;
}

.service-card {
  transition: all 0.3s ease;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.service-ready {
  border-color: #4CAF50 !important;
  background-color: #f1f8e9;
}

.service-pending {
  border-color: #FF9800 !important;
  background-color: #fff3e0;
}

.service-initializing {
  border-color: #2196F3 !important;
  background-color: #e3f2fd;
}

.service-error {
  border-color: #F44336 !important;
  background-color: #ffebee;
}

.service-restarting {
  border-color: #FF9800 !important;
  background-color: #fff3e0;
}

.service-unknown {
  border-color: #9E9E9E !important;
  background-color: #fafafa;
}

pre {
  font-size: 0.8em;
  max-height: 200px;
  overflow-y: auto;
}
</style> 