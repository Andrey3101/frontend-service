<template>
  <div class="edge-computing-manager">
    <!-- Панель управления Edge Computing -->
    <v-card class="edge-panel" v-if="showPanel">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-server-network</v-icon>
        Edge Computing
        <v-spacer></v-spacer>
        <v-btn icon @click="showPanel = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Статус Edge узлов -->
        <v-expansion-panels v-model="activePanel" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-server</v-icon>
              Edge узлы
              <v-chip
                :color="getOverallStatusColor()"
                small
                class="ml-2"
              >
                {{ getOverallStatusText() }}
              </v-chip>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <v-row>
                <v-col
                  v-for="node in edgeNodes"
                  :key="node.id"
                  cols="12"
                  md="6"
                >
                  <v-card
                    :class="`edge-node-card ${node.status}`"
                    outlined
                    elevation="2"
                  >
                    <v-card-title class="d-flex align-center">
                      <v-icon
                        :color="getNodeStatusColor(node.status)"
                        class="mr-2"
                      >
                        {{ getNodeStatusIcon(node.status) }}
                      </v-icon>
                      {{ node.name }}
                      <v-spacer></v-spacer>
                      <v-chip
                        :color="getNodeStatusColor(node.status)"
                        small
                      >
                        {{ getNodeStatusText(node.status) }}
                      </v-chip>
                    </v-card-title>
                    
                    <v-card-text>
                      <div class="node-info">
                        <div class="info-item">
                          <span class="info-label">Расположение:</span>
                          <span class="info-value">{{ node.location }}</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Задержка:</span>
                          <span class="info-value">{{ node.latency }}ms</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Загрузка CPU:</span>
                          <span class="info-value">{{ node.cpuLoad }}%</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Память:</span>
                          <span class="info-value">{{ node.memoryUsage }}%</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Сеть:</span>
                          <span class="info-value">{{ node.networkLoad }}%</span>
                        </div>
                      </div>
                      
                      <!-- График производительности -->
                      <div class="performance-chart">
                        <canvas
                          :ref="`chart-${node.id}`"
                          width="200"
                          height="100"
                        ></canvas>
                      </div>
                    </v-card-text>
                    
                    <v-card-actions>
                      <v-btn
                        text
                        small
                        color="primary"
                        @click="connectToNode(node)"
                        :disabled="node.status === 'offline'"
                      >
                        Подключиться
                      </v-btn>
                      <v-btn
                        text
                        small
                        color="secondary"
                        @click="testNode(node)"
                        :disabled="node.status === 'offline'"
                      >
                        Тест
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-cog</v-icon>
              Настройки Edge Computing
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <v-form ref="edgeForm" v-model="formValid">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-switch
                      v-model="edgeSettings.enabled"
                      label="Включить Edge Computing"
                      @change="updateEdgeSettings"
                    ></v-switch>
                    
                    <v-switch
                      v-model="edgeSettings.autoSelect"
                      label="Автоматический выбор узла"
                      @change="updateEdgeSettings"
                    ></v-switch>
                    
                    <v-switch
                      v-model="edgeSettings.loadBalancing"
                      label="Балансировка нагрузки"
                      @change="updateEdgeSettings"
                    ></v-switch>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="edgeSettings.maxLatency"
                      label="Максимальная задержка (мс)"
                      type="number"
                      min="10"
                      max="1000"
                      @change="updateEdgeSettings"
                    ></v-text-field>
                    
                    <v-text-field
                      v-model="edgeSettings.connectionTimeout"
                      label="Таймаут подключения (с)"
                      type="number"
                      min="1"
                      max="30"
                      @change="updateEdgeSettings"
                    ></v-text-field>
                    
                    <v-select
                      v-model="edgeSettings.priority"
                      label="Приоритет выбора узла"
                      :items="priorityOptions"
                      @change="updateEdgeSettings"
                    ></v-select>
                  </v-col>
                </v-row>
              </v-form>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-chart-line</v-icon>
              Производительность
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="6">
                  <h4>Метрики Edge Computing</h4>
                  <div class="metrics-grid">
                    <div class="metric-item">
                      <div class="metric-value">{{ edgeMetrics.totalRequests }}</div>
                      <div class="metric-label">Всего запросов</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-value">{{ edgeMetrics.avgLatency }}ms</div>
                      <div class="metric-label">Средняя задержка</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-value">{{ edgeMetrics.successRate }}%</div>
                      <div class="metric-label">Успешность</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-value">{{ edgeMetrics.bandwidth }}MB/s</div>
                      <div class="metric-label">Пропускная способность</div>
                    </div>
                  </div>
                </v-col>
                
                <v-col cols="12" md="6">
                  <h4>График производительности</h4>
                  <div class="performance-chart-large">
                    <canvas
                      ref="performanceChart"
                      width="400"
                      height="200"
                    ></canvas>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-code-braces</v-icon>
              Edge функции
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12">
                  <h4>Доступные Edge функции</h4>
                  <div class="edge-functions">
                    <div
                      v-for="func in edgeFunctions"
                      :key="func.id"
                      class="edge-function-item"
                      :class="{ 'active': func.active }"
                    >
                      <div class="function-header">
                        <v-icon
                          :color="func.active ? 'success' : 'grey'"
                          class="mr-2"
                        >
                          {{ func.active ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                        </v-icon>
                        <span class="function-name">{{ func.name }}</span>
                        <v-spacer></v-spacer>
                        <v-chip
                          :color="func.type === 'compute' ? 'primary' : 'secondary'"
                          small
                        >
                          {{ func.type }}
                        </v-chip>
                      </div>
                      
                      <div class="function-description">
                        {{ func.description }}
                      </div>
                      
                      <div class="function-metrics">
                        <span class="metric">Время выполнения: {{ func.executionTime }}ms</span>
                        <span class="metric">Использование: {{ func.usageCount }}</span>
                      </div>
                      
                      <v-btn
                        :color="func.active ? 'error' : 'success'"
                        small
                        @click="toggleEdgeFunction(func)"
                        class="mt-2"
                      >
                        {{ func.active ? 'Отключить' : 'Включить' }}
                      </v-btn>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Кнопки управления -->
        <v-row class="mt-4">
          <v-col cols="6">
            <v-btn
              block
              color="primary"
              @click="optimizeEdgeNodes"
              :loading="optimizing"
            >
              <v-icon left>mdi-tune</v-icon>
              Оптимизировать узлы
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              block
              color="secondary"
              @click="refreshEdgeStatus"
              :loading="refreshing"
            >
              <v-icon left>mdi-refresh</v-icon>
              Обновить статус
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Кнопка открытия панели -->
    <v-btn
      v-if="!showPanel"
      icon
      class="edge-toggle"
      @click="showPanel = true"
      color="primary"
    >
      <v-icon>mdi-server-network</v-icon>
    </v-btn>

    <!-- Индикатор Edge Computing -->
    <div class="edge-indicator" v-if="edgeSettings.enabled">
      <v-chip
        :color="getOverallStatusColor()"
        small
        class="edge-status"
      >
        <v-icon left>mdi-server-network</v-icon>
        Edge: {{ getOverallStatusText() }}
      </v-chip>
    </div>

    <!-- Уведомления -->
    <v-snackbar
      v-model="showNotification"
      :color="notificationColor"
      :timeout="3000"
      top
      right
    >
      {{ notificationMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="showNotification = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'EdgeComputingManager',
  
  setup() {
    const authStore = useAuthStore();
    
    // Состояние компонента
    const showPanel = ref(false);
    const activePanel = ref([0]);
    const formValid = ref(false);
    const optimizing = ref(false);
    const refreshing = ref(false);
    const showNotification = ref(false);
    const notificationMessage = ref('');
    const notificationColor = ref('info');
    
    // Настройки Edge Computing
    const edgeSettings = reactive({
      enabled: true,
      autoSelect: true,
      loadBalancing: true,
      maxLatency: 100,
      connectionTimeout: 5,
      priority: 'latency'
    });
    
    // Опции приоритета
    const priorityOptions = [
      { text: 'Минимальная задержка', value: 'latency' },
      { text: 'Максимальная пропускная способность', value: 'bandwidth' },
      { text: 'Минимальная загрузка', value: 'load' },
      { text: 'Географическая близость', value: 'location' }
    ];
    
    // Edge узлы
    const edgeNodes = ref([
      {
        id: 'edge-1',
        name: 'Edge Node Moscow',
        location: 'Москва, Россия',
        status: 'online',
        latency: 15,
        cpuLoad: 45,
        memoryUsage: 62,
        networkLoad: 38,
        coordinates: { lat: 55.7558, lng: 37.6176 }
      },
      {
        id: 'edge-2',
        name: 'Edge Node SPb',
        location: 'Санкт-Петербург, Россия',
        status: 'online',
        latency: 25,
        cpuLoad: 38,
        memoryUsage: 55,
        networkLoad: 42,
        coordinates: { lat: 59.9311, lng: 30.3609 }
      },
      {
        id: 'edge-3',
        name: 'Edge Node Kazan',
        location: 'Казань, Россия',
        status: 'online',
        latency: 35,
        cpuLoad: 52,
        memoryUsage: 68,
        networkLoad: 45,
        coordinates: { lat: 55.7887, lng: 49.1221 }
      },
      {
        id: 'edge-4',
        name: 'Edge Node Novosibirsk',
        location: 'Новосибирск, Россия',
        status: 'offline',
        latency: 0,
        cpuLoad: 0,
        memoryUsage: 0,
        networkLoad: 0,
        coordinates: { lat: 55.0084, lng: 82.9357 }
      }
    ]);
    
    // Edge функции
    const edgeFunctions = ref([
      {
        id: 'func-1',
        name: 'AI Предобработка',
        description: 'Предварительная обработка данных для AI моделей',
        type: 'compute',
        active: true,
        executionTime: 45,
        usageCount: 1250
      },
      {
        id: 'func-2',
        name: 'Кэширование',
        description: 'Кэширование часто используемых данных',
        type: 'storage',
        active: true,
        executionTime: 12,
        usageCount: 3420
      },
      {
        id: 'func-3',
        name: 'Сжатие данных',
        description: 'Сжатие данных для оптимизации передачи',
        type: 'compute',
        active: false,
        executionTime: 78,
        usageCount: 890
      },
      {
        id: 'func-4',
        name: 'Фильтрация',
        description: 'Фильтрация и валидация данных',
        type: 'compute',
        active: true,
        executionTime: 23,
        usageCount: 2100
      }
    ]);
    
    // Метрики Edge Computing
    const edgeMetrics = reactive({
      totalRequests: 15680,
      avgLatency: 28,
      successRate: 98.5,
      bandwidth: 45.2
    });
    
    // Вычисляемые свойства
    const onlineNodes = computed(() => {
      return edgeNodes.value.filter(node => node.status === 'online');
    });
    
    const offlineNodes = computed(() => {
      return edgeNodes.value.filter(node => node.status === 'offline');
    });
    
    // Методы
    const getOverallStatusColor = () => {
      const onlineCount = onlineNodes.value.length;
      const totalCount = edgeNodes.value.length;
      
      if (onlineCount === totalCount) return 'success';
      if (onlineCount > totalCount / 2) return 'warning';
      return 'error';
    };
    
    const getOverallStatusText = () => {
      const onlineCount = onlineNodes.value.length;
      const totalCount = edgeNodes.value.length;
      
      if (onlineCount === totalCount) return 'Все узлы онлайн';
      if (onlineCount > totalCount / 2) return `${onlineCount}/${totalCount} узлов онлайн`;
      return `${onlineCount}/${totalCount} узлов онлайн`;
    };
    
    const getNodeStatusColor = (status) => {
      switch (status) {
        case 'online': return 'success';
        case 'offline': return 'error';
        case 'maintenance': return 'warning';
        default: return 'grey';
      }
    };
    
    const getNodeStatusIcon = (status) => {
      switch (status) {
        case 'online': return 'mdi-server';
        case 'offline': return 'mdi-server-off';
        case 'maintenance': return 'mdi-tools';
        default: return 'mdi-help-circle';
      }
    };
    
    const getNodeStatusText = (status) => {
      switch (status) {
        case 'online': return 'Онлайн';
        case 'offline': return 'Офлайн';
        case 'maintenance': return 'Обслуживание';
        default: return 'Неизвестно';
      }
    };
    
    const connectToNode = async (node) => {
      try {
        // Симуляция подключения к Edge узлу
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showNotificationMessage(`Подключение к ${node.name} установлено`, 'success');
        
        // Обновляем метрики
        edgeMetrics.totalRequests += 1;
        edgeMetrics.avgLatency = Math.round((edgeMetrics.avgLatency + node.latency) / 2);
        
      } catch (error) {
        console.error('Failed to connect to edge node:', error);
        showNotificationMessage(`Ошибка подключения к ${node.name}`, 'error');
      }
    };
    
    const testNode = async (node) => {
      try {
        // Симуляция тестирования узла
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Обновляем статус узла
        if (node.status === 'offline') {
          node.status = 'online';
          node.latency = Math.floor(Math.random() * 50) + 10;
          node.cpuLoad = Math.floor(Math.random() * 60) + 20;
          node.memoryUsage = Math.floor(Math.random() * 40) + 40;
          node.networkLoad = Math.floor(Math.random() * 50) + 20;
        }
        
        showNotificationMessage(`Тест ${node.name} завершен успешно`, 'success');
        
      } catch (error) {
        console.error('Failed to test edge node:', error);
        showNotificationMessage(`Ошибка тестирования ${node.name}`, 'error');
      }
    };
    
    const toggleEdgeFunction = (func) => {
      func.active = !func.active;
      
      if (func.active) {
        showNotificationMessage(`Функция ${func.name} включена`, 'success');
      } else {
        showNotificationMessage(`Функция ${func.name} отключена`, 'warning');
      }
      
      // Сохраняем в кэш
      authStore.setCachedData('edge_functions', edgeFunctions.value, 3600, 'system');
    };
    
    const optimizeEdgeNodes = async () => {
      optimizing.value = true;
      
      try {
        // Симуляция оптимизации
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Оптимизируем узлы
        edgeNodes.value.forEach(node => {
          if (node.status === 'online') {
            node.cpuLoad = Math.max(20, node.cpuLoad - 10);
            node.memoryUsage = Math.max(30, node.memoryUsage - 15);
            node.networkLoad = Math.max(25, node.networkLoad - 12);
          }
        });
        
        showNotificationMessage('Edge узлы оптимизированы', 'success');
        
      } catch (error) {
        console.error('Failed to optimize edge nodes:', error);
        showNotificationMessage('Ошибка оптимизации узлов', 'error');
      } finally {
        optimizing.value = false;
      }
    };
    
    const refreshEdgeStatus = async () => {
      refreshing.value = true;
      
      try {
        // Симуляция обновления статуса
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Обновляем метрики узлов
        edgeNodes.value.forEach(node => {
          if (node.status === 'online') {
            node.latency = Math.floor(Math.random() * 50) + 10;
            node.cpuLoad = Math.floor(Math.random() * 60) + 20;
            node.memoryUsage = Math.floor(Math.random() * 40) + 40;
            node.networkLoad = Math.floor(Math.random() * 50) + 20;
          }
        });
        
        showNotificationMessage('Статус Edge узлов обновлен', 'success');
        
      } catch (error) {
        console.error('Failed to refresh edge status:', error);
        showNotificationMessage('Ошибка обновления статуса', 'error');
      } finally {
        refreshing.value = false;
      }
    };
    
    const updateEdgeSettings = () => {
      // Сохраняем в localStorage
      localStorage.setItem('edge-settings', JSON.stringify(edgeSettings));
      
      // Сохраняем в кэш
      authStore.setCachedData('edge_settings', edgeSettings, 86400, 'user');
      
      showNotificationMessage('Настройки Edge Computing обновлены', 'success');
    };
    
    const showNotificationMessage = (message, color = 'info') => {
      notificationMessage.value = message;
      notificationColor.value = color;
      showNotification.value = true;
    };
    
    // Загрузка настроек
    const loadSettings = async () => {
      try {
        // Из localStorage
        const saved = localStorage.getItem('edge-settings');
        if (saved) {
          Object.assign(edgeSettings, JSON.parse(saved));
        }
        
        // Из кэша
        const cached = await authStore.getCachedData('edge_settings', 'user');
        if (cached) {
          Object.assign(edgeSettings, cached);
        }
        
        const functionsCached = await authStore.getCachedData('edge_functions', 'system');
        if (functionsCached) {
          edgeFunctions.value = functionsCached;
        }
      } catch (error) {
        console.error('Failed to load edge settings:', error);
      }
    };
    
    // Автоматическое обновление статуса
    let statusUpdateInterval;
    
    const startStatusUpdates = () => {
      statusUpdateInterval = setInterval(() => {
        if (edgeSettings.enabled) {
          refreshEdgeStatus();
        }
      }, 30000); // Каждые 30 секунд
    };
    
    const stopStatusUpdates = () => {
      if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
      }
    };
    
    // Жизненный цикл
    onMounted(() => {
      loadSettings();
      startStatusUpdates();
    });
    
    onUnmounted(() => {
      stopStatusUpdates();
    });
    
    return {
      showPanel,
      activePanel,
      formValid,
      optimizing,
      refreshing,
      showNotification,
      notificationMessage,
      notificationColor,
      edgeSettings,
      priorityOptions,
      edgeNodes,
      edgeFunctions,
      edgeMetrics,
      getOverallStatusColor,
      getOverallStatusText,
      getNodeStatusColor,
      getNodeStatusIcon,
      getNodeStatusText,
      connectToNode,
      testNode,
      toggleEdgeFunction,
      optimizeEdgeNodes,
      refreshEdgeStatus,
      updateEdgeSettings
    };
  }
};
</script>

<style scoped>
.edge-computing-manager {
  position: relative;
}

.edge-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 600px;
  height: 100vh;
  z-index: 1000;
  overflow-y: auto;
}

.edge-toggle {
  position: fixed;
  top: 140px;
  right: 20px;
  z-index: 999;
}

.edge-indicator {
  position: fixed;
  top: 200px;
  right: 20px;
  z-index: 999;
}

.edge-node-card {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.edge-node-card.online {
  border-left-color: #4CAF50;
}

.edge-node-card.offline {
  border-left-color: #f44336;
}

.edge-node-card.maintenance {
  border-left-color: #FFC107;
}

.node-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-label {
  font-weight: 500;
  color: #666;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.performance-chart {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.performance-chart-large {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.metric-item {
  text-align: center;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #1976d2;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.edge-functions {
  max-height: 400px;
  overflow-y: auto;
}

.edge-function-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.edge-function-item.active {
  border-color: #4CAF50;
  background-color: #f1f8e9;
}

.function-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.function-name {
  font-weight: 600;
  font-size: 16px;
}

.function-description {
  color: #666;
  margin-bottom: 12px;
  line-height: 1.4;
}

.function-metrics {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.metric {
  font-size: 12px;
  color: #666;
  background-color: #e0e0e0;
  padding: 4px 8px;
  border-radius: 4px;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .edge-panel {
    width: 100%;
    height: 100vh;
  }
  
  .edge-toggle {
    top: 120px;
    right: 10px;
  }
  
  .edge-indicator {
    top: 180px;
    right: 10px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .function-metrics {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 