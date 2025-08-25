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
                  v-if="service.status === 'error'"
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
            @click="exportServicesStatus"
            :disabled="!hasServicesData"
          >
            <v-icon left>mdi-download</v-icon>
            Экспорт статуса
          </v-btn>
        </v-col>
      </v-row>
      
      <!-- Детальная информация -->
      <v-expand-transition>
        <div v-show="showServicesDetails">
          <v-divider class="my-4"></v-divider>
          
          <v-row>
            <v-col cols="12" v-for="(service, name) in servicesStatus" :key="`details-${name}`">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  {{ getServiceDisplayName(name) }}
                </v-card-title>
                
                <v-card-text>
                  <div class="text-caption mb-2">
                    {{ getServiceDescription(name) }}
                  </div>
                  
                  <v-chip-group>
                    <v-chip
                      v-for="capability in getServiceCapabilities(name)"
                      :key="capability"
                      size="small"
                      color="primary"
                      variant="outlined"
                    >
                      {{ capability }}
                    </v-chip>
                  </v-chip-group>
                  
                  <v-divider class="my-3"></v-divider>
                  
                  <div v-if="getServiceMetrics(name)">
                    <div class="text-subtitle-2 mb-2">Метрики:</div>
                    <pre class="text-caption">{{ JSON.stringify(getServiceMetrics(name), null, 2) }}</pre>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getServicesStatus, initializeServices } from '@/services';

// Состояние
const refreshing = ref(false);
const restartingServices = ref([]);
const restartingAll = ref(false);
const showServicesDetails = ref(false);
const servicesStatus = ref({});

// Store
const authStore = useAuthStore();

// Вычисляемые свойства
const servicesSummary = computed(() => {
  const total = Object.keys(servicesStatus.value).length;
  const loaded = Object.values(servicesStatus.value).filter(s => s.loaded).length;
  const errors = Object.values(servicesStatus.value).filter(s => s.status === 'error').length;
  const ready = Object.values(servicesStatus.value).filter(s => s.status === 'ready').length;
  
  return { total, loaded, errors, ready };
});

const hasServicesWithErrors = computed(() => {
  return servicesSummary.value.errors > 0;
});

const hasServicesData = computed(() => {
  return Object.keys(servicesStatus.value).length > 0;
});

// Методы
const refreshServices = async () => {
  try {
    refreshing.value = true;
    
    // Инициализируем сервисы если они еще не инициализированы
    if (Object.keys(servicesStatus.value).length === 0) {
      await initializeServices();
    }
    
    // Получаем статус всех сервисов
    servicesStatus.value = getServicesStatus();
    
  } catch (error) {
    console.error('Ошибка обновления статуса сервисов:', error);
  } finally {
    refreshing.value = false;
  }
};

const restartService = async (serviceName) => {
  try {
    restartingServices.value.push(serviceName);
    
    // Здесь можно добавить логику перезапуска конкретного сервиса
    console.log(`Перезапуск сервиса: ${serviceName}`);
    
    // Обновляем статус
    await refreshServices();
    
  } catch (error) {
    console.error(`Ошибка перезапуска сервиса ${serviceName}:`, error);
  } finally {
    restartingServices.value = restartingServices.value.filter(s => s !== serviceName);
  }
};

const restartAllServices = async () => {
  try {
    restartingAll.value = true;
    
    // Перезапускаем все сервисы с ошибками
    const errorServices = Object.keys(servicesStatus.value).filter(
      name => servicesStatus.value[name].status === 'error'
    );
    
    for (const serviceName of errorServices) {
      await restartService(serviceName);
    }
    
  } catch (error) {
    console.error('Ошибка перезапуска всех сервисов:', error);
  } finally {
    restartingAll.value = false;
  }
};

const exportServicesStatus = () => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      services: servicesStatus.value,
      summary: servicesSummary.value
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services-status-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Ошибка экспорта статуса сервисов:', error);
  }
};

// Вспомогательные методы
const getServiceStatusClass = (service) => {
  if (!service.loaded) return 'service-unloaded';
  if (service.status === 'error') return 'service-error';
  if (service.status === 'ready') return 'service-ready';
  return 'service-loading';
};

const getServiceStatusColor = (service) => {
  if (!service.loaded) return 'grey';
  if (service.status === 'error') return 'error';
  if (service.status === 'ready') return 'success';
  return 'warning';
};

const getServiceStatusIcon = (service) => {
  if (!service.loaded) return 'mdi-help-circle';
  if (service.status === 'error') return 'mdi-alert-circle';
  if (service.status === 'ready') return 'mdi-check-circle';
  return 'mdi-loading';
};

const getServiceStatusText = (service) => {
  if (!service.loaded) return 'Не загружен';
  if (service.status === 'error') return 'Ошибка';
  if (service.status === 'ready') return 'Готов';
  return 'Загрузка...';
};

const getServiceDisplayName = (name) => {
  const names = {
    cache: 'Кэш сервис',
    notifications: 'Уведомления',
    sync: 'Синхронизация',
    websocket: 'WebSocket',
    taskIntegration: 'Интеграция с backend',
    activity: 'Активность пользователей',
    audit: 'Аудит',
    metrics: 'Метрики',
    error: 'Обработка ошибок',
    validation: 'Валидация',
    settings: 'Настройки'
  };
  return names[name] || name;
};

const getServiceDescription = (name) => {
  const descriptions = {
    cache: 'Многоуровневое кэширование данных',
    notifications: 'Управление уведомлениями и push-уведомлениями',
    sync: 'Синхронизация данных между frontend и backend',
    websocket: 'Real-time коммуникация',
    taskIntegration: 'Интеграция с backend API',
    activity: 'Отслеживание пользовательской активности',
    audit: 'Аудит действий пользователей',
    metrics: 'Сбор метрик производительности',
    error: 'Централизованная обработка ошибок',
    validation: 'Валидация данных',
    settings: 'Управление настройками приложения'
  };
  return descriptions[name] || 'Описание недоступно';
};

const getServiceCapabilities = (name) => {
  const capabilities = {
    cache: [
      'Многоуровневое кэширование',
      'Автоматическая очистка',
      'TTL управление',
      'Статистика использования'
    ],
    notifications: [
      'Push-уведомления',
      'Шаблоны уведомлений',
      'Умные уведомления',
      'Управление разрешениями'
    ],
    sync: [
      'Автоматическая синхронизация',
      'Очереди изменений',
      'Retry логика',
      'Мониторинг статуса'
    ],
    websocket: [
      'Real-time обновления',
      'Автоматическое переподключение',
      'Heartbeat мониторинг',
      'Обработка ошибок'
    ],
    taskIntegration: [
      'HTTP клиент с interceptors',
      'Обработка ошибок',
      'Аутентификация',
      'Мониторинг состояния'
    ],
    activity: [
      'Отслеживание сессий',
      'Аналитика поведения',
      'Метрики взаимодействия',
      'Экспорт данных'
    ],
    audit: [
      'Логирование действий',
      'Отслеживание изменений',
      'Экспорт логов',
      'Фильтрация и поиск'
    ],
    metrics: [
      'Сбор метрик производительности',
      'Аналитика использования',
      'Экспорт данных',
      'Мониторинг в реальном времени'
    ],
    error: [
      'Централизованная обработка',
      'Логирование ошибок',
      'Уведомления об ошибках',
      'Анализ паттернов'
    ],
    validation: [
      'Валидация форм',
      'Проверка данных',
      'Кастомные правила',
      'Интеграция с UI'
    ],
    settings: [
      'Управление темами',
      'Локализация',
      'Настройки UI',
      'Персонализация'
    ]
  };
  return capabilities[name] || ['Возможности недоступны'];
};

const getServiceMetrics = (name) => {
  try {
    const service = servicesStatus.value[name];
    if (service && service.status && typeof service.status === 'object') {
      return service.status;
    }
    return null;
  } catch (error) {
    console.error(`Failed to get metrics for ${name}:`, error);
    return null;
  }
};

const getStatColor = (key) => {
  const colors = {
    total: 'text-primary',
    loaded: 'text-success',
    errors: 'text-error',
    ready: 'text-info'
  };
  return colors[key] || 'text-default';
};

const getStatLabel = (key) => {
  const labels = {
    total: 'Всего сервисов',
    loaded: 'Загружено',
    errors: 'Ошибки',
    ready: 'Готово'
  };
  return labels[key] || key;
};

// Инициализация
onMounted(() => {
  // Загружаем статус сервисов при монтировании
  refreshServices();
  
  // Автоматическое обновление каждые 30 секунд
  const interval = setInterval(() => {
    if (authStore.isAuthenticated) {
      refreshServices();
    }
  }, 30000);
  
  // Очистка интервала при размонтировании
  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>

<style scoped>
.services-monitor {
  margin: 16px;
}

.service-card {
  transition: all 0.3s ease;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.service-unloaded {
  border-left: 4px solid #9e9e9e;
}

.service-ready {
  border-left: 4px solid #4caf50;
}

.service-error {
  border-left: 4px solid #f44336;
}

.service-loading {
  border-left: 4px solid #ff9800;
}

pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}
</style> 