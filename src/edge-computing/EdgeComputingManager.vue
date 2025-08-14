<template>
  <div class="edge-computing-manager">
    <!-- Основная панель Edge Computing -->
    <v-card class="edge-panel" elevation="4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-server-network</v-icon>
        Edge Computing
        <v-spacer></v-spacer>
        <v-chip
          :color="edgeStatus === 'connected' ? 'success' : 'error'"
          small
        >
          {{ edgeStatus === 'connected' ? 'Подключено' : 'Отключено' }}
        </v-chip>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <div class="edge-info">
              <h4>Статус системы:</h4>
              <p><strong>Edge Node:</strong> {{ edgeNodeInfo.name || 'Не подключен' }}</p>
              <p><strong>Локация:</strong> {{ edgeNodeInfo.location || 'N/A' }}</p>
              <p><strong>Задержка:</strong> {{ edgeNodeInfo.latency || 'N/A' }}ms</p>
              <p><strong>Пропускная способность:</strong> {{ edgeNodeInfo.bandwidth || 'N/A' }} Mbps</p>
            </div>
          </v-col>
          
          <v-col cols="12" md="6">
            <div class="edge-controls">
              <v-btn
                :color="edgeStatus === 'connected' ? 'error' : 'success'"
                :loading="isConnecting"
                @click="toggleEdgeConnection"
                block
                large
                class="mb-3"
              >
                <v-icon left>
                  {{ edgeStatus === 'connected' ? 'mdi-server-off' : 'mdi-server-network' }}
                </v-icon>
                {{ edgeStatus === 'connected' ? 'Отключиться' : 'Подключиться' }}
              </v-btn>
              
              <v-btn
                color="secondary"
                @click="showEdgeSettings = true"
                block
                outlined
              >
                <v-icon left>mdi-cog</v-icon>
                Настройки Edge
              </v-btn>
            </div>
          </v-col>
        </v-row>
        
        <!-- Индикатор производительности -->
        <div v-if="edgeStatus === 'connected'" class="performance-indicator">
          <v-row>
            <v-col cols="12" md="3">
              <div class="metric-card">
                <div class="metric-value">{{ performanceMetrics.cpu }}%</div>
                <div class="metric-label">CPU</div>
                <v-progress-linear
                  :value="performanceMetrics.cpu"
                  :color="getMetricColor(performanceMetrics.cpu)"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </v-col>
            
            <v-col cols="12" md="3">
              <div class="metric-card">
                <div class="metric-value">{{ performanceMetrics.memory }}%</div>
                <div class="metric-label">Память</div>
                <v-progress-linear
                  :value="performanceMetrics.memory"
                  :color="getMetricColor(performanceMetrics.memory)"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </v-col>
            
            <v-col cols="12" md="3">
              <div class="metric-card">
                <div class="metric-value">{{ performanceMetrics.network }}%</div>
                <div class="metric-label">Сеть</div>
                <v-progress-linear
                  :value="performanceMetrics.network"
                  :color="getMetricColor(performanceMetrics.network)"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </v-col>
            
            <v-col cols="12" md="3">
              <div class="metric-card">
                <div class="metric-value">{{ performanceMetrics.storage }}%</div>
                <div class="metric-label">Хранилище</div>
                <v-progress-linear
                  :value="performanceMetrics.storage"
                  :color="getMetricColor(performanceMetrics.storage)"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Панель Edge сервисов -->
    <v-card class="edge-services-panel mt-4" elevation="2">
      <v-card-title>
        <v-icon class="mr-2" color="info">mdi-apps</v-icon>
        Edge сервисы
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="refreshEdgeServices"
          :loading="isRefreshingServices"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col v-for="service in edgeServices" :key="service.id" cols="12" md="6" lg="4">
            <v-card class="service-card" :class="`service-${service.status}`" outlined>
              <v-card-title class="d-flex align-center">
                <v-icon :color="getServiceStatusColor(service.status)" class="mr-2">
                  {{ getServiceIcon(service.type) }}
                </v-icon>
                {{ service.name }}
                <v-spacer></v-spacer>
                <v-chip
                  :color="getServiceStatusColor(service.status)"
                  x-small
                >
                  {{ getServiceStatusText(service.status) }}
                </v-chip>
              </v-card-title>
              
              <v-card-text>
                <p class="service-description">{{ service.description }}</p>
                <p><strong>Тип:</strong> {{ getServiceTypeText(service.type) }}</p>
                <p><strong>Версия:</strong> {{ service.version }}</p>
                <p><strong>Задержка:</strong> {{ service.latency }}ms</p>
                <p><strong>Нагрузка:</strong> {{ service.load }}%</p>
              </v-card-text>
              
              <v-card-actions>
                <v-btn
                  x-small
                  text
                  color="primary"
                  @click="testService(service)"
                  :disabled="service.status !== 'active'"
                >
                  Тест
                </v-btn>
                <v-btn
                  x-small
                  text
                  color="secondary"
                  @click="showServiceDetails(service)"
                >
                  Детали
                </v-btn>
                <v-btn
                  x-small
                  text
                  :color="service.status === 'active' ? 'error' : 'success'"
                  @click="toggleService(service)"
                >
                  {{ service.status === 'active' ? 'Остановить' : 'Запустить' }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Панель Edge задач -->
    <v-card class="edge-tasks-panel mt-4" elevation="2">
      <v-card-title>
        <v-icon class="mr-2" color="warning">mdi-playlist-check</v-icon>
        Edge задачи
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="showTaskDialog = true"
          :disabled="edgeStatus !== 'connected'"
        >
          <v-icon left>mdi-plus</v-icon>
          Новая задача
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="taskHeaders"
          :items="edgeTasks"
          :items-per-page="10"
          class="elevation-1"
        >
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getTaskStatusColor(item.status)"
              small
            >
              {{ getTaskStatusText(item.status) }}
            </v-chip>
          </template>
          
          <template v-slot:item.priority="{ item }">
            <v-chip
              :color="getPriorityColor(item.priority)"
              small
            >
              {{ getPriorityText(item.priority) }}
            </v-chip>
          </template>
          
          <template v-slot:item.progress="{ item }">
            <v-progress-linear
              :value="item.progress"
              :color="getProgressColor(item.progress)"
              height="20"
              rounded
            >
              <template v-slot:default>
                <strong>{{ item.progress }}%</strong>
              </template>
            </v-progress-linear>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn
              x-small
              text
              color="primary"
              @click="viewTaskDetails(item)"
            >
              Просмотр
            </v-btn>
            <v-btn
              x-small
              text
              color="error"
              @click="cancelTask(item)"
              :disabled="item.status === 'completed' || item.status === 'cancelled'"
            >
              Отмена
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- Панель Edge аналитики -->
    <v-card class="edge-analytics-panel mt-4" elevation="2">
      <v-card-title>
        <v-icon class="mr-2" color="success">mdi-chart-line</v-icon>
        Edge аналитика
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <h4>Производительность по времени</h4>
            <div class="chart-container">
              <canvas ref="performanceChart" width="400" height="200"></canvas>
            </div>
          </v-col>
          
          <v-col cols="12" md="6">
            <h4>Использование ресурсов</h4>
            <div class="chart-container">
              <canvas ref="resourcesChart" width="400" height="200"></canvas>
            </div>
          </v-col>
        </v-row>
        
        <v-row class="mt-4">
          <v-col cols="12">
            <h4>Статистика Edge узлов</h4>
            <v-data-table
              :headers="nodeHeaders"
              :items="edgeNodes"
              :items-per-page="5"
              class="elevation-1"
            >
              <template v-slot:item.health="{ item }">
                <v-chip
                  :color="getHealthColor(item.health)"
                  small
                >
                  {{ getHealthText(item.health) }}
                </v-chip>
              </template>
              
              <template v-slot:item.actions="{ item }">
                <v-btn
                  x-small
                  text
                  color="primary"
                  @click="viewNodeDetails(item)"
                >
                  Детали
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Диалог настроек Edge -->
    <v-dialog v-model="showEdgeSettings" max-width="700">
      <v-card>
        <v-card-title>
          Настройки Edge Computing
          <v-spacer></v-spacer>
          <v-btn icon @click="showEdgeSettings = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="settingsForm" v-model="settingsValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="edgeSettings.serverUrl"
                  label="Edge сервер"
                  required
                  :rules="[v => !!v || 'URL сервера обязателен']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="edgeSettings.apiKey"
                  label="API ключ"
                  type="password"
                  required
                  :rules="[v => !!v || 'API ключ обязателен']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="edgeSettings.autoConnect"
                  label="Автоподключение"
                  :items="autoConnectOptions"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="edgeSettings.connectionTimeout"
                  label="Таймаут подключения (сек)"
                  :items="timeoutOptions"
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="edgeSettings.enableCompression"
                  label="Включить сжатие данных"
                ></v-switch>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="edgeSettings.enableCaching"
                  label="Включить кэширование"
                ></v-switch>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="edgeSettings.enableMonitoring"
                  label="Включить мониторинг"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="showEdgeSettings = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            @click="saveEdgeSettings"
            :disabled="!settingsValid"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Диалог новой задачи -->
    <v-dialog v-model="showTaskDialog" max-width="600">
      <v-card>
        <v-card-title>
          Создать Edge задачу
          <v-spacer></v-spacer>
          <v-btn icon @click="showTaskDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="taskForm" v-model="taskFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newTask.name"
                  label="Название задачи"
                  required
                  :rules="[v => !!v || 'Название обязательно']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="newTask.description"
                  label="Описание"
                  rows="3"
                ></v-textarea>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="newTask.type"
                  label="Тип задачи"
                  :items="taskTypes"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="newTask.priority"
                  label="Приоритет"
                  :items="priorityOptions"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="newTask.code"
                  label="Код задачи"
                  rows="6"
                  placeholder="// Введите JavaScript код для выполнения на Edge узле"
                  required
                  :rules="[v => !!v || 'Код обязателен']"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="showTaskDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            @click="createTask"
            :disabled="!taskFormValid"
          >
            Создать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Уведомления -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'EdgeComputingManager',
  
  setup() {
    // Состояние компонента
    const edgeStatus = ref('disconnected');
    const isConnecting = ref(false);
    const isRefreshingServices = ref(false);
    const showEdgeSettings = ref(false);
    const showTaskDialog = ref(false);
    const settingsValid = ref(true);
    const taskFormValid = ref(true);
    
    // Edge информация
    const edgeNodeInfo = reactive({
      name: '',
      location: '',
      latency: 0,
      bandwidth: 0
    });
    
    // Метрики производительности
    const performanceMetrics = reactive({
      cpu: 0,
      memory: 0,
      network: 0,
      storage: 0
    });
    
    // Edge сервисы
    const edgeServices = ref([
      {
        id: 'ml-inference',
        name: 'ML Inference',
        description: 'Машинное обучение на Edge узле',
        type: 'ml',
        status: 'active',
        version: '1.0.0',
        latency: 15,
        load: 45
      },
      {
        id: 'data-processing',
        name: 'Data Processing',
        description: 'Обработка данных в реальном времени',
        type: 'data',
        status: 'active',
        version: '1.2.0',
        latency: 8,
        load: 32
      },
      {
        id: 'iot-gateway',
        name: 'IoT Gateway',
        description: 'Шлюз для IoT устройств',
        type: 'iot',
        status: 'active',
        version: '1.1.0',
        latency: 5,
        load: 28
      },
      {
        id: 'cache-service',
        name: 'Cache Service',
        description: 'Кэширование данных',
        type: 'cache',
        status: 'inactive',
        version: '1.0.0',
        latency: 2,
        load: 15
      }
    ]);
    
    // Edge задачи
    const edgeTasks = ref([
      {
        id: '1',
        name: 'Анализ данных',
        description: 'Обработка аналитических данных',
        type: 'data-processing',
        status: 'running',
        priority: 'high',
        progress: 65,
        createdAt: new Date(Date.now() - 3600000),
        estimatedTime: 1800000
      },
      {
        id: '2',
        name: 'ML предсказание',
        description: 'Выполнение ML модели',
        type: 'ml-inference',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        createdAt: new Date(Date.now() - 7200000),
        estimatedTime: 900000
      }
    ]);
    
    // Edge узлы
    const edgeNodes = ref([
      {
        id: '1',
        name: 'Edge Node 1',
        location: 'Москва',
        health: 'healthy',
        cpu: 45,
        memory: 62,
        network: 38,
        uptime: 86400000
      },
      {
        id: '2',
        name: 'Edge Node 2',
        location: 'Санкт-Петербург',
        health: 'warning',
        cpu: 78,
        memory: 85,
        network: 45,
        uptime: 43200000
      }
    ]);
    
    // Настройки Edge
    const edgeSettings = reactive({
      serverUrl: 'https://edge.example.com',
      apiKey: '',
      autoConnect: 'on-startup',
      connectionTimeout: 30,
      enableCompression: true,
      enableCaching: true,
      enableMonitoring: true
    });
    
    // Новая задача
    const newTask = reactive({
      name: '',
      description: '',
      type: 'data-processing',
      priority: 'medium',
      code: ''
    });
    
    // Уведомления
    const snackbar = reactive({
      show: false,
      message: '',
      color: 'success',
      timeout: 3000
    });
    
    // Опции для селекторов
    const autoConnectOptions = [
      { text: 'При запуске', value: 'on-startup' },
      { text: 'При загрузке страницы', value: 'on-page-load' },
      { text: 'Вручную', value: 'manual' }
    ];
    
    const timeoutOptions = [
      { text: '15 секунд', value: 15 },
      { text: '30 секунд', value: 30 },
      { text: '60 секунд', value: 60 }
    ];
    
    const taskTypes = [
      { text: 'Обработка данных', value: 'data-processing' },
      { text: 'ML Inference', value: 'ml-inference' },
      { text: 'IoT обработка', value: 'iot-processing' },
      { text: 'Кэширование', value: 'caching' },
      { text: 'Аналитика', value: 'analytics' }
    ];
    
    const priorityOptions = [
      { text: 'Низкий', value: 'low' },
      { text: 'Средний', value: 'medium' },
      { text: 'Высокий', value: 'high' },
      { text: 'Критический', value: 'critical' }
    ];
    
    // Заголовки таблиц
    const taskHeaders = [
      { text: 'Название', value: 'name' },
      { text: 'Тип', value: 'type' },
      { text: 'Статус', value: 'status' },
      { text: 'Приоритет', value: 'priority' },
      { text: 'Прогресс', value: 'progress' },
      { text: 'Действия', value: 'actions', sortable: false }
    ];
    
    const nodeHeaders = [
      { text: 'Имя', value: 'name' },
      { text: 'Локация', value: 'location' },
      { text: 'Состояние', value: 'health' },
      { text: 'CPU', value: 'cpu' },
      { text: 'Память', value: 'memory' },
      { text: 'Действия', value: 'actions', sortable: false }
    ];
    
    // Методы
    const toggleEdgeConnection = async () => {
      if (edgeStatus.value === 'connected') {
        await disconnectFromEdge();
      } else {
        await connectToEdge();
      }
    };
    
    const connectToEdge = async () => {
      try {
        isConnecting.value = true;
        
        // Симуляция подключения к Edge узлу
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        edgeStatus.value = 'connected';
        edgeNodeInfo.name = 'Edge Node 1';
        edgeNodeInfo.location = 'Москва';
        edgeNodeInfo.latency = 15;
        edgeNodeInfo.bandwidth = 100;
        
        // Запуск мониторинга
        startPerformanceMonitoring();
        
        showSnackbar('Подключение к Edge узлу установлено', 'success');
        
      } catch (error) {
        console.error('Failed to connect to edge:', error);
        showSnackbar('Ошибка подключения к Edge узлу', 'error');
      } finally {
        isConnecting.value = false;
      }
    };
    
    const disconnectFromEdge = async () => {
      try {
        // Остановка мониторинга
        stopPerformanceMonitoring();
        
        edgeStatus.value = 'disconnected';
        edgeNodeInfo.name = '';
        edgeNodeInfo.location = '';
        edgeNodeInfo.latency = 0;
        edgeNodeInfo.bandwidth = 0;
        
        // Сброс метрик
        Object.assign(performanceMetrics, {
          cpu: 0,
          memory: 0,
          network: 0,
          storage: 0
        });
        
        showSnackbar('Отключение от Edge узла выполнено', 'info');
        
      } catch (error) {
        console.error('Failed to disconnect from edge:', error);
        showSnackbar('Ошибка отключения от Edge узла', 'error');
      }
    };
    
    const startPerformanceMonitoring = () => {
      // Симуляция мониторинга производительности
      const interval = setInterval(() => {
        if (edgeStatus.value !== 'connected') {
          clearInterval(interval);
          return;
        }
        
        performanceMetrics.cpu = Math.floor(Math.random() * 30) + 20;
        performanceMetrics.memory = Math.floor(Math.random() * 40) + 30;
        performanceMetrics.network = Math.floor(Math.random() * 50) + 20;
        performanceMetrics.storage = Math.floor(Math.random() * 25) + 15;
      }, 5000);
    };
    
    const stopPerformanceMonitoring = () => {
      // Остановка мониторинга
    };
    
    const refreshEdgeServices = async () => {
      isRefreshingServices.value = true;
      
      try {
        // Симуляция обновления сервисов
        await new Promise(resolve => setTimeout(resolve, 1000));
        showSnackbar('Edge сервисы обновлены', 'success');
      } catch (error) {
        console.error('Failed to refresh services:', error);
        showSnackbar('Ошибка обновления сервисов', 'error');
      } finally {
        isRefreshingServices.value = false;
      }
    };
    
    const testService = (service) => {
      showSnackbar(`Тестирование сервиса: ${service.name}`, 'info');
      
      // Симуляция тестирования
      setTimeout(() => {
        showSnackbar(`Сервис ${service.name} работает корректно`, 'success');
      }, 2000);
    };
    
    const showServiceDetails = (service) => {
      showSnackbar(`Детали сервиса: ${service.name}`, 'info');
    };
    
    const toggleService = (service) => {
      if (service.status === 'active') {
        service.status = 'inactive';
        showSnackbar(`Сервис ${service.name} остановлен`, 'info');
      } else {
        service.status = 'active';
        showSnackbar(`Сервис ${service.name} запущен`, 'success');
      }
    };
    
    const createTask = () => {
      if (!taskFormValid.value) return;
      
      const task = {
        id: Date.now().toString(),
        ...newTask,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        estimatedTime: 1800000
      };
      
      edgeTasks.value.unshift(task);
      
      // Сброс формы
      Object.assign(newTask, {
        name: '',
        description: '',
        type: 'data-processing',
        priority: 'medium',
        code: ''
      });
      
      showTaskDialog.value = false;
      showSnackbar('Edge задача создана', 'success');
    };
    
    const viewTaskDetails = (task) => {
      showSnackbar(`Детали задачи: ${task.name}`, 'info');
    };
    
    const cancelTask = (task) => {
      task.status = 'cancelled';
      task.progress = 0;
      showSnackbar(`Задача ${task.name} отменена`, 'warning');
    };
    
    const viewNodeDetails = (node) => {
      showSnackbar(`Детали узла: ${node.name}`, 'info');
    };
    
    const saveEdgeSettings = () => {
      // Сохранение настроек
      showEdgeSettings.value = false;
      showSnackbar('Настройки Edge сохранены', 'success');
      
      // Сохранение в localStorage
      localStorage.setItem('edge-settings', JSON.stringify(edgeSettings));
    };
    
    const loadEdgeSettings = () => {
      const saved = localStorage.getItem('edge-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          Object.assign(edgeSettings, parsed);
        } catch (error) {
          console.error('Failed to load edge settings:', error);
        }
      }
    };
    
    // Утилиты
    const getMetricColor = (value) => {
      if (value < 50) return 'success';
      if (value < 80) return 'warning';
      return 'error';
    };
    
    const getServiceStatusColor = (status) => {
      switch (status) {
        case 'active': return 'success';
        case 'inactive': return 'grey';
        case 'error': return 'error';
        default: return 'grey';
      }
    };
    
    const getServiceStatusText = (status) => {
      switch (status) {
        case 'active': return 'Активен';
        case 'inactive': return 'Неактивен';
        case 'error': return 'Ошибка';
        default: return 'Неизвестно';
      }
    };
    
    const getServiceIcon = (type) => {
      switch (type) {
        case 'ml': return 'mdi-brain';
        case 'data': return 'mdi-database';
        case 'iot': return 'mdi-wifi';
        case 'cache': return 'mdi-cached';
        default: return 'mdi-cog';
      }
    };
    
    const getServiceTypeText = (type) => {
      switch (type) {
        case 'ml': return 'Машинное обучение';
        case 'data': return 'Обработка данных';
        case 'iot': return 'IoT';
        case 'cache': return 'Кэширование';
        default: return 'Неизвестно';
      }
    };
    
    const getTaskStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'grey';
        case 'running': return 'primary';
        case 'completed': return 'success';
        case 'cancelled': return 'error';
        default: return 'grey';
      }
    };
    
    const getTaskStatusText = (status) => {
      switch (status) {
        case 'pending': return 'Ожидает';
        case 'running': return 'Выполняется';
        case 'completed': return 'Завершена';
        case 'cancelled': return 'Отменена';
        default: return 'Неизвестно';
      }
    };
    
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'low': return 'grey';
        case 'medium': return 'blue';
        case 'high': return 'orange';
        case 'critical': return 'red';
        default: return 'grey';
      }
    };
    
    const getPriorityText = (priority) => {
      switch (priority) {
        case 'low': return 'Низкий';
        case 'medium': return 'Средний';
        case 'high': return 'Высокий';
        case 'critical': return 'Критический';
        default: return 'Неизвестно';
      }
    };
    
    const getProgressColor = (progress) => {
      if (progress < 30) return 'error';
      if (progress < 70) return 'warning';
      return 'success';
    };
    
    const getHealthColor = (health) => {
      switch (health) {
        case 'healthy': return 'success';
        case 'warning': return 'warning';
        case 'critical': return 'error';
        default: return 'grey';
      }
    };
    
    const getHealthText = (health) => {
      switch (health) {
        case 'healthy': return 'Здоров';
        case 'warning': return 'Предупреждение';
        case 'critical': return 'Критично';
        default: return 'Неизвестно';
      }
    };
    
    const showSnackbar = (message, color = 'success') => {
      snackbar.message = message;
      snackbar.color = color;
      snackbar.show = true;
    };
    
    // Жизненный цикл
    onMounted(() => {
      loadEdgeSettings();
      
      // Автоподключение если включено
      if (edgeSettings.autoConnect === 'on-page-load') {
        setTimeout(connectToEdge, 1000);
      }
    });
    
    onUnmounted(() => {
      if (edgeStatus.value === 'connected') {
        disconnectFromEdge();
      }
    });
    
    return {
      edgeStatus,
      isConnecting,
      isRefreshingServices,
      showEdgeSettings,
      showTaskDialog,
      settingsValid,
      taskFormValid,
      edgeNodeInfo,
      performanceMetrics,
      edgeServices,
      edgeTasks,
      edgeNodes,
      edgeSettings,
      newTask,
      snackbar,
      autoConnectOptions,
      timeoutOptions,
      taskTypes,
      priorityOptions,
      taskHeaders,
      nodeHeaders,
      toggleEdgeConnection,
      refreshEdgeServices,
      testService,
      showServiceDetails,
      toggleService,
      createTask,
      viewTaskDetails,
      cancelTask,
      viewNodeDetails,
      saveEdgeSettings,
      getMetricColor,
      getServiceStatusColor,
      getServiceStatusText,
      getServiceIcon,
      getServiceTypeText,
      getTaskStatusColor,
      getTaskStatusText,
      getPriorityColor,
      getPriorityText,
      getProgressColor,
      getHealthColor,
      getHealthText
    };
  }
};
</script>

<style scoped>
.edge-computing-manager {
  padding: 20px;
}

.edge-panel {
  margin-bottom: 16px;
}

.edge-info h4 {
  margin-bottom: 12px;
  color: #333;
}

.edge-info p {
  margin-bottom: 8px;
  font-size: 14px;
}

.edge-controls {
  display: flex;
  flex-direction: column;
}

.performance-indicator {
  margin-top: 20px;
}

.metric-card {
  text-align: center;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.edge-services-panel {
  margin-bottom: 16px;
}

.service-card {
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.service-card.service-active {
  border-left: 4px solid #4caf50;
}

.service-card.service-inactive {
  border-left: 4px solid #9e9e9e;
}

.service-card.service-error {
  border-left: 4px solid #f44336;
}

.service-description {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.edge-tasks-panel {
  margin-bottom: 16px;
}

.edge-analytics-panel {
  margin-bottom: 16px;
}

.chart-container {
  height: 200px;
  margin-bottom: 16px;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .edge-computing-manager {
    padding: 10px;
  }
  
  .edge-panel .v-card-text {
    padding: 12px;
  }
  
  .metric-card {
    padding: 12px;
  }
  
  .metric-value {
    font-size: 20px;
  }
}

/* Анимации */
.edge-panel {
  transition: all 0.3s ease;
}

.service-card {
  transition: transform 0.2s ease;
}

.service-card:hover {
  transform: translateY(-2px);
}

.metric-card {
  transition: all 0.3s ease;
}

.metric-card:hover {
  background-color: #e0e0e0;
}

/* Кастомные скроллбары */
.edge-services-panel ::-webkit-scrollbar {
  width: 6px;
}

.edge-services-panel ::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.edge-services-panel ::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.edge-services-panel ::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style> 