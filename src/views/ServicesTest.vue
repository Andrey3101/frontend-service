<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" color="primary">mdi-test-tube</v-icon>
            Тестирование сервисов
          </v-card-title>
          
          <v-card-text>
            <v-alert
              v-if="testResult"
              :type="testResult.success ? 'success' : 'error'"
              :title="testResult.success ? 'Тест пройден' : 'Тест не пройден'"
              :text="testResult.message"
              class="mb-4"
            />
            
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title class="text-subtitle-1">
                    Быстрый тест
                  </v-card-title>
                  <v-card-text>
                    <p class="text-body-2 mb-3">
                      Быстрая проверка инициализации и статуса всех сервисов
                    </p>
                    <v-btn
                      color="primary"
                      @click="runQuickTest"
                      :loading="quickTestLoading"
                      :disabled="fullTestLoading"
                    >
                      <v-icon left>mdi-play</v-icon>
                      Запустить быстрый тест
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title class="text-subtitle-1">
                    Полный тест
                  </v-card-title>
                  <v-card-text>
                    <p class="text-body-2 mb-3">
                      Детальное тестирование каждого сервиса с проверкой функциональности
                    </p>
                    <v-btn
                      color="secondary"
                      @click="runFullTest"
                      :loading="fullTestLoading"
                      :disabled="quickTestLoading"
                    >
                      <v-icon left>mdi-test-tube</v-icon>
                      Запустить полный тест
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            
            <v-divider class="my-4"></v-divider>
            
            <!-- Результаты тестов -->
            <div v-if="testResults.length > 0">
              <h3 class="text-h6 mb-3">Результаты тестов</h3>
              
              <v-expansion-panels>
                <v-expansion-panel
                  v-for="(result, index) in testResults"
                  :key="index"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon
                        :color="result.success ? 'success' : 'error'"
                        class="mr-2"
                      >
                        {{ result.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                      </v-icon>
                      <span class="font-weight-medium">
                        {{ result.name }} - {{ result.success ? 'Пройден' : 'Не пройден' }}
                      </span>
                      <v-spacer></v-spacer>
                      <v-chip
                        :color="result.success ? 'success' : 'error'"
                        size="small"
                      >
                        {{ result.duration }}ms
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>
                  
                  <v-expansion-panel-text>
                    <div v-if="result.error" class="text-error mb-2">
                      <strong>Ошибка:</strong> {{ result.error }}
                    </div>
                    
                    <div v-if="result.details" class="text-body-2">
                      <pre class="bg-grey-lighten-4 pa-2 rounded">{{ JSON.stringify(result.details, null, 2) }}</pre>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
            
            <!-- Статус сервисов -->
            <v-divider class="my-4"></v-divider>
            
            <div>
              <h3 class="text-h6 mb-3">Статус сервисов</h3>
              
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
              
              <v-row class="mt-3">
                <v-col cols="12">
                  <v-btn
                    color="info"
                    @click="refreshServicesStatus"
                    :loading="refreshingStatus"
                    variant="outlined"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    Обновить статус
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { initializeServices, getServicesStatus } from '@/services';

// Состояние
const quickTestLoading = ref(false);
const fullTestLoading = ref(false);
const refreshingStatus = ref(false);
const testResult = ref(null);
const testResults = ref([]);
const servicesStatus = ref({});

// Вычисляемые свойства
const servicesSummary = computed(() => {
  const total = Object.keys(servicesStatus.value).length;
  const loaded = Object.values(servicesStatus.value).filter(s => s.loaded).length;
  const errors = Object.values(servicesStatus.value).filter(s => s.status === 'error').length;
  const ready = Object.values(servicesStatus.value).filter(s => s.status === 'ready').length;
  
  return { total, loaded, errors, ready };
});

// Методы
const runQuickTest = async () => {
  try {
    quickTestLoading.value = true;
    testResult.value = null;
    
    const startTime = Date.now();
    
    // Инициализируем сервисы
    await initializeServices();
    
    // Получаем статус
    const status = getServicesStatus();
    
    const duration = Date.now() - startTime;
    
    testResult.value = {
      success: true,
      message: `Быстрый тест пройден за ${duration}ms. Инициализировано ${Object.keys(status).length} сервисов.`,
      duration
    };
    
    // Обновляем статус
    await refreshServicesStatus();
    
  } catch (error) {
    testResult.value = {
      success: false,
      message: `Ошибка быстрого теста: ${error.message}`,
      duration: 0
    };
  } finally {
    quickTestLoading.value = false;
  }
};

const runFullTest = async () => {
  try {
    fullTestLoading.value = true;
    testResult.value = null;
    testResults.value = [];
    
    // Инициализируем сервисы если нужно
    if (Object.keys(servicesStatus.value).length === 0) {
      await initializeServices();
    }
    
    // Тестируем каждый сервис
    const services = [
      'cache', 'notifications', 'sync', 'websocket', 'taskIntegration',
      'activity', 'audit', 'metrics', 'error', 'validation', 'settings'
    ];
    
    for (const serviceName of services) {
      const startTime = Date.now();
      
      try {
        const service = getService(serviceName);
        if (!service) {
          throw new Error('Сервис не найден');
        }
        
        // Проверяем базовые методы
        if (service.getStatus) {
          const status = service.getStatus();
          if (!status || typeof status !== 'object') {
            throw new Error('Метод getStatus вернул неверный результат');
          }
        }
        
        const duration = Date.now() - startTime;
        
        testResults.value.push({
          name: serviceName,
          success: true,
          duration,
          details: service.getStatus ? service.getStatus() : null
        });
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        testResults.value.push({
          name: serviceName,
          success: false,
          duration,
          error: error.message,
          details: null
        });
      }
    }
    
    // Подсчитываем результаты
    const passed = testResults.value.filter(r => r.success).length;
    const total = testResults.value.length;
    
    testResult.value = {
      success: passed === total,
      message: `Полный тест завершен. Пройдено: ${passed}/${total}`,
      duration: testResults.value.reduce((sum, r) => sum + r.duration, 0)
    };
    
    // Обновляем статус
    await refreshServicesStatus();
    
  } catch (error) {
    testResult.value = {
      success: false,
      message: `Ошибка полного теста: ${error.message}`,
      duration: 0
    };
  } finally {
    fullTestLoading.value = false;
  }
};

const refreshServicesStatus = async () => {
  try {
    refreshingStatus.value = true;
    servicesStatus.value = getServicesStatus();
  } catch (error) {
    console.error('Ошибка обновления статуса сервисов:', error);
  } finally {
    refreshingStatus.value = false;
  }
};

const getService = (serviceName) => {
  try {
    const { getService } = require('@/services');
    return getService(serviceName);
  } catch (error) {
    console.error(`Ошибка получения сервиса ${serviceName}:`, error);
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
  refreshServicesStatus();
});
</script>

<style scoped>
pre {
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}
</style> 