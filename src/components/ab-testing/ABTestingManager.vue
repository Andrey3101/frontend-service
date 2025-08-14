<template>
  <div class="ab-testing-manager">
    <!-- Панель управления A/B тестами -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-test-tube</v-icon>
        A/B Тестирование
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="showCreateDialog = true"
          :disabled="!isAdmin"
        >
          Создать тест
        </v-btn>
      </v-card-title>
    </v-card>

    <!-- Список активных тестов -->
    <v-row>
      <v-col v-for="test in activeTests" :key="test.id" cols="12" md="6" lg="4">
        <v-card class="test-card" :class="`test-${test.status}`">
          <v-card-title class="d-flex align-center">
            <v-icon :color="getStatusColor(test.status)" class="mr-2">
              {{ getStatusIcon(test.status) }}
            </v-icon>
            {{ test.name }}
            <v-spacer></v-spacer>
            <v-chip
              :color="getStatusColor(test.status)"
              small
            >
              {{ getStatusText(test.status) }}
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <div class="test-info">
              <p><strong>Описание:</strong> {{ test.description }}</p>
              <p><strong>Цель:</strong> {{ test.objective }}</p>
              <p><strong>Метрика:</strong> {{ test.primaryMetric }}</p>
              <p><strong>Длительность:</strong> {{ formatDuration(test.duration) }}</p>
              <p><strong>Трафик:</strong> {{ test.trafficPercentage }}%</p>
            </div>
            
            <v-divider class="my-3"></v-divider>
            
            <div class="variants-info">
              <h4>Варианты:</h4>
              <div v-for="variant in test.variants" :key="variant.id" class="variant-item">
                <div class="variant-header">
                  <span class="variant-name">{{ variant.name }}</span>
                  <span class="variant-traffic">{{ variant.trafficPercentage }}%</span>
                </div>
                <v-progress-linear
                  :value="variant.trafficPercentage"
                  :color="variant.color"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </div>
            
            <v-divider class="my-3"></v-divider>
            
            <div class="metrics-info">
              <h4>Метрики:</h4>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-label">Конверсия:</span>
                  <span class="metric-value">{{ test.metrics?.conversion || 0 }}%</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Доход:</span>
                  <span class="metric-value">{{ formatCurrency(test.metrics?.revenue || 0) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Время на сайте:</span>
                  <span class="metric-value">{{ formatTime(test.metrics?.timeOnSite || 0) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Отказы:</span>
                  <span class="metric-value">{{ test.metrics?.bounceRate || 0 }}%</span>
                </div>
              </div>
            </div>
          </v-card-text>
          
          <v-card-actions>
            <v-btn
              text
              color="primary"
              @click="viewTestDetails(test)"
            >
              Детали
            </v-btn>
            <v-btn
              text
              color="secondary"
              @click="editTest(test)"
              :disabled="!isAdmin"
            >
              Редактировать
            </v-btn>
            <v-btn
              text
              color="error"
              @click="stopTest(test.id)"
              :disabled="!isAdmin || test.status === 'stopped'"
            >
              Остановить
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалог создания теста -->
    <v-dialog v-model="showCreateDialog" max-width="800">
      <v-card>
        <v-card-title>
          Создать A/B тест
          <v-spacer></v-spacer>
          <v-btn icon @click="showCreateDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="testForm" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newTest.name"
                  label="Название теста"
                  required
                  :rules="[v => !!v || 'Название обязательно']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="newTest.objective"
                  label="Цель теста"
                  :items="testObjectives"
                  required
                  :rules="[v => !!v || 'Цель обязательна']"
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="newTest.description"
                  label="Описание"
                  rows="3"
                ></v-textarea>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="newTest.primaryMetric"
                  label="Основная метрика"
                  :items="primaryMetrics"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="newTest.duration"
                  label="Длительность (дни)"
                  type="number"
                  min="1"
                  max="90"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-slider
                  v-model="newTest.trafficPercentage"
                  label="Процент трафика"
                  min="1"
                  max="100"
                  thumb-label
                  required
                ></v-slider>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="newTest.confidenceLevel"
                  label="Уровень доверия"
                  :items="confidenceLevels"
                  required
                ></v-select>
              </v-col>
            </v-row>
            
            <v-divider class="my-4"></v-divider>
            
            <h4>Варианты теста:</h4>
            <div v-for="(variant, index) in newTest.variants" :key="index" class="variant-form">
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="variant.name"
                    :label="`Вариант ${index + 1}`"
                    required
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-textarea
                    v-model="variant.description"
                    :label="`Описание варианта ${index + 1}`"
                    rows="2"
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12" md="3">
                  <v-slider
                    v-model="variant.trafficPercentage"
                    :label="`Трафик ${index + 1}`"
                    min="0"
                    max="100"
                    thumb-label
                  ></v-slider>
                </v-col>
                
                <v-col cols="12" md="1">
                  <v-btn
                    icon
                    color="error"
                    @click="removeVariant(index)"
                    :disabled="newTest.variants.length <= 2"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </div>
            
            <v-btn
              text
              color="primary"
              @click="addVariant"
              class="mt-2"
            >
              Добавить вариант
            </v-btn>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="showCreateDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            @click="createTest"
            :disabled="!formValid"
          >
            Создать тест
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог деталей теста -->
    <v-dialog v-model="showDetailsDialog" max-width="1000">
      <v-card v-if="selectedTest">
        <v-card-title>
          {{ selectedTest.name }} - Детали
          <v-spacer></v-spacer>
          <v-btn icon @click="showDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-tabs v-model="activeTab">
            <v-tab>Обзор</v-tab>
            <v-tab>Метрики</v-tab>
            <v-tab>Анализ</v-tab>
            <v-tab>Отчет</v-tab>
          </v-tabs>
          
          <v-tab-items v-model="activeTab">
            <v-tab-item>
              <div class="test-overview pa-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <h3>Основная информация</h3>
                    <p><strong>Статус:</strong> {{ getStatusText(selectedTest.status) }}</p>
                    <p><strong>Цель:</strong> {{ selectedTest.objective }}</p>
                    <p><strong>Основная метрика:</strong> {{ selectedTest.primaryMetric }}</p>
                    <p><strong>Длительность:</strong> {{ formatDuration(selectedTest.duration) }}</p>
                    <p><strong>Трафик:</strong> {{ selectedTest.trafficPercentage }}%</p>
                    <p><strong>Уровень доверия:</strong> {{ selectedTest.confidenceLevel }}%</p>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <h3>Варианты</h3>
                    <div v-for="variant in selectedTest.variants" :key="variant.id" class="variant-detail">
                      <h4>{{ variant.name }}</h4>
                      <p>{{ variant.description }}</p>
                      <p><strong>Трафик:</strong> {{ variant.trafficPercentage }}%</p>
                      <p><strong>Конверсия:</strong> {{ variant.metrics?.conversion || 0 }}%</p>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tab-item>
            
            <v-tab-item>
              <div class="test-metrics pa-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <h3>Основные метрики</h3>
                    <div class="metrics-chart">
                      <canvas ref="metricsChart" width="400" height="300"></canvas>
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <h3>Статистическая значимость</h3>
                    <div class="significance-info">
                      <p><strong>P-значение:</strong> {{ selectedTest.statistics?.pValue || 'N/A' }}</p>
                      <p><strong>Статистическая мощность:</strong> {{ selectedTest.statistics?.power || 'N/A' }}%</p>
                      <p><strong>Размер эффекта:</strong> {{ selectedTest.statistics?.effectSize || 'N/A' }}</p>
                      <p><strong>Достаточно данных:</strong> {{ selectedTest.statistics?.sufficientData ? 'Да' : 'Нет' }}</p>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tab-item>
            
            <v-tab-item>
              <div class="test-analysis pa-4">
                <h3>Анализ результатов</h3>
                <div class="analysis-content">
                  <div v-if="selectedTest.analysis" v-html="selectedTest.analysis"></div>
                  <div v-else>
                    <p>Анализ пока недоступен. Дождитесь завершения теста.</p>
                  </div>
                </div>
              </div>
            </v-tab-item>
            
            <v-tab-item>
              <div class="test-report pa-4">
                <h3>Отчет по тесту</h3>
                <div class="report-actions">
                  <v-btn
                    color="primary"
                    @click="generateReport(selectedTest.id)"
                    class="mr-2"
                  >
                    Сгенерировать отчет
                  </v-btn>
                  <v-btn
                    color="secondary"
                    @click="exportReport(selectedTest.id)"
                  >
                    Экспорт PDF
                  </v-btn>
                </div>
                
                <div v-if="selectedTest.report" class="report-content mt-4">
                  <div v-html="selectedTest.report"></div>
                </div>
              </div>
            </v-tab-item>
          </v-tab-items>
        </v-card-text>
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
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Chart from 'chart.js/auto';

export default {
  name: 'ABTestingManager',
  
  setup() {
    const authStore = useAuthStore();
    
    // Состояние компонента
    const showCreateDialog = ref(false);
    const showDetailsDialog = ref(false);
    const activeTab = ref(0);
    const formValid = ref(false);
    const selectedTest = ref(null);
    const metricsChart = ref(null);
    
    // Данные
    const activeTests = ref([]);
    const newTest = reactive({
      name: '',
      description: '',
      objective: '',
      primaryMetric: '',
      duration: 14,
      trafficPercentage: 50,
      confidenceLevel: 95,
      variants: [
        { name: 'Контроль', description: 'Текущая версия', trafficPercentage: 50, color: '#1976d2' },
        { name: 'Вариант A', description: 'Новая версия', trafficPercentage: 50, color: '#4caf50' }
      ]
    });
    
    // Опции для селекторов
    const testObjectives = [
      'Увеличение конверсии',
      'Увеличение дохода',
      'Улучшение UX',
      'Увеличение времени на сайте',
      'Снижение отказов',
      'Другое'
    ];
    
    const primaryMetrics = [
      'Конверсия',
      'Доход на пользователя',
      'Время на сайте',
      'Количество страниц за сессию',
      'Отказы',
      'Клики по CTA'
    ];
    
    const confidenceLevels = [
      { text: '90%', value: 90 },
      { text: '95%', value: 95 },
      { text: '99%', value: 99 }
    ];
    
    // Уведомления
    const snackbar = reactive({
      show: false,
      message: '',
      color: 'success',
      timeout: 3000
    });
    
    // Вычисляемые свойства
    const isAdmin = computed(() => authStore.isCompanyAdmin);
    
    // Методы
    const getStatusColor = (status) => {
      switch (status) {
        case 'running': return 'success';
        case 'paused': return 'warning';
        case 'stopped': return 'error';
        case 'completed': return 'info';
        default: return 'grey';
      }
    };
    
    const getStatusIcon = (status) => {
      switch (status) {
        case 'running': return 'mdi-play-circle';
        case 'paused': return 'mdi-pause-circle';
        case 'stopped': return 'mdi-stop-circle';
        case 'completed': return 'mdi-check-circle';
        default: return 'mdi-help-circle';
      }
    };
    
    const getStatusText = (status) => {
      switch (status) {
        case 'running': return 'Запущен';
        case 'paused': return 'Приостановлен';
        case 'stopped': return 'Остановлен';
        case 'completed': return 'Завершен';
        default: return 'Неизвестно';
      }
    };
    
    const formatDuration = (days) => {
      if (days === 1) return '1 день';
      if (days < 5) return `${days} дня`;
      return `${days} дней`;
    };
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(amount);
    };
    
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    const addVariant = () => {
      const variantCount = newTest.variants.length;
      const colors = ['#ff9800', '#9c27b0', '#f44336', '#00bcd4'];
      
      newTest.variants.push({
        name: `Вариант ${String.fromCharCode(65 + variantCount)}`,
        description: '',
        trafficPercentage: 0,
        color: colors[variantCount % colors.length]
      });
    };
    
    const removeVariant = (index) => {
      newTest.variants.splice(index, 1);
    };
    
    const createTest = async () => {
      try {
        // Валидация трафика
        const totalTraffic = newTest.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
        if (Math.abs(totalTraffic - 100) > 1) {
          showSnackbar('Общий трафик вариантов должен быть равен 100%', 'error');
          return;
        }
        
        // Создание теста
        const test = {
          id: Date.now().toString(),
          ...newTest,
          status: 'running',
          createdAt: new Date(),
          metrics: {},
          statistics: {},
          analysis: null,
          report: null
        };
        
        activeTests.value.push(test);
        
        // Сброс формы
        Object.assign(newTest, {
          name: '',
          description: '',
          objective: '',
          primaryMetric: '',
          duration: 14,
          trafficPercentage: 50,
          confidenceLevel: 95,
          variants: [
            { name: 'Контроль', description: 'Текущая версия', trafficPercentage: 50, color: '#1976d2' },
            { name: 'Вариант A', description: 'Новая версия', trafficPercentage: 50, color: '#4caf50' }
          ]
        });
        
        showCreateDialog.value = false;
        showSnackbar('A/B тест успешно создан', 'success');
        
        // Сохранение в кэш
        authStore.setCachedData('ab_tests', activeTests.value, 3600, 'ab_testing');
        
      } catch (error) {
        console.error('Failed to create test:', error);
        showSnackbar('Ошибка при создании теста', 'error');
      }
    };
    
    const viewTestDetails = (test) => {
      selectedTest.value = test;
      showDetailsDialog.value = true;
      
      // Инициализация графика при открытии вкладки метрик
      setTimeout(() => {
        if (activeTab.value === 1 && metricsChart.value) {
          initMetricsChart();
        }
      }, 100);
    };
    
    const editTest = (test) => {
      // Логика редактирования теста
      showSnackbar('Редактирование пока не реализовано', 'info');
    };
    
    const stopTest = async (testId) => {
      try {
        const test = activeTests.value.find(t => t.id === testId);
        if (test) {
          test.status = 'stopped';
          test.stoppedAt = new Date();
          
          // Анализ результатов
          await analyzeTestResults(test);
          
          showSnackbar('Тест остановлен и проанализирован', 'success');
          
          // Сохранение в кэш
          authStore.setCachedData('ab_tests', activeTests.value, 3600, 'ab_testing');
        }
      } catch (error) {
        console.error('Failed to stop test:', error);
        showSnackbar('Ошибка при остановке теста', 'error');
      }
    };
    
    const analyzeTestResults = async (test) => {
      try {
        // Симуляция анализа результатов
        const controlVariant = test.variants.find(v => v.name === 'Контроль');
        const testVariant = test.variants.find(v => v.name !== 'Контроль');
        
        if (controlVariant && testVariant) {
          // Простой статистический анализ
          const controlConversion = controlVariant.metrics?.conversion || 0;
          const testConversion = testVariant.metrics?.conversion || 0;
          
          const improvement = ((testConversion - controlConversion) / controlConversion) * 100;
          
          test.statistics = {
            pValue: Math.random() < 0.05 ? 0.03 : 0.12,
            power: Math.floor(Math.random() * 30) + 70,
            effectSize: Math.abs(improvement),
            sufficientData: test.metrics?.sampleSize > 1000
          };
          
          test.analysis = `
            <h4>Результаты анализа:</h4>
            <p><strong>Улучшение:</strong> ${improvement.toFixed(2)}%</p>
            <p><strong>Статистическая значимость:</strong> ${test.statistics.pValue < 0.05 ? 'Да' : 'Нет'}</p>
            <p><strong>Рекомендация:</strong> ${improvement > 0 ? 'Внедрить вариант' : 'Оставить контрольную версию'}</p>
          `;
        }
      } catch (error) {
        console.error('Failed to analyze test results:', error);
      }
    };
    
    const generateReport = async (testId) => {
      try {
        const test = activeTests.value.find(t => t.id === testId);
        if (test) {
          // Генерация отчета
          test.report = `
            <h3>Отчет по A/B тесту: ${test.name}</h3>
            <p><strong>Дата создания:</strong> ${test.createdAt.toLocaleDateString('ru-RU')}</p>
            <p><strong>Статус:</strong> ${getStatusText(test.status)}</p>
            <p><strong>Цель:</strong> ${test.objective}</p>
            <p><strong>Основная метрика:</strong> ${test.primaryMetric}</p>
            
            <h4>Результаты:</h4>
            ${test.analysis || '<p>Анализ недоступен</p>'}
            
            <h4>Рекомендации:</h4>
            <p>На основе результатов теста рекомендуется ${test.statistics?.pValue < 0.05 ? 'внедрить новый вариант' : 'продолжить тестирование'}.</p>
          `;
          
          showSnackbar('Отчет сгенерирован', 'success');
        }
      } catch (error) {
        console.error('Failed to generate report:', error);
        showSnackbar('Ошибка при генерации отчета', 'error');
      }
    };
    
    const exportReport = async (testId) => {
      try {
        // Экспорт в PDF
        showSnackbar('Экспорт в PDF пока не реализован', 'info');
      } catch (error) {
        console.error('Failed to export report:', error);
        showSnackbar('Ошибка при экспорте отчета', 'error');
      }
    };
    
    const initMetricsChart = () => {
      if (!metricsChart.value || !selectedTest.value) return;
      
      const ctx = metricsChart.value.getContext('2d');
      
      // Уничтожаем предыдущий график
      if (window.metricsChartInstance) {
        window.metricsChartInstance.destroy();
      }
      
      const chartData = {
        labels: selectedTest.value.variants.map(v => v.name),
        datasets: [{
          label: 'Конверсия (%)',
          data: selectedTest.value.variants.map(v => v.metrics?.conversion || 0),
          backgroundColor: selectedTest.value.variants.map(v => v.color),
          borderColor: selectedTest.value.variants.map(v => v.color),
          borderWidth: 2
        }]
      };
      
      window.metricsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    };
    
    const showSnackbar = (message, color = 'success') => {
      snackbar.message = message;
      snackbar.color = color;
      snackbar.show = true;
    };
    
    const loadTests = async () => {
      try {
        // Загружаем из кэша
        const cachedTests = await authStore.getCachedData('ab_tests', 'ab_testing');
        if (cachedTests) {
          activeTests.value = cachedTests;
        } else {
          // Загружаем с сервера или создаем демо данные
          activeTests.value = [
            {
              id: '1',
              name: 'Тест кнопки CTA',
              description: 'Тестирование различных вариантов кнопки призыва к действию',
              objective: 'Увеличение конверсии',
              primaryMetric: 'Конверсия',
              duration: 14,
              trafficPercentage: 30,
              confidenceLevel: 95,
              status: 'running',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              variants: [
                { id: '1-1', name: 'Контроль', description: 'Синяя кнопка', trafficPercentage: 50, color: '#1976d2', metrics: { conversion: 2.5 } },
                { id: '1-2', name: 'Вариант A', description: 'Зеленая кнопка', trafficPercentage: 50, color: '#4caf50', metrics: { conversion: 3.2 } }
              ],
              metrics: { conversion: 2.85, revenue: 15000, timeOnSite: 180, bounceRate: 45 },
              statistics: {},
              analysis: null,
              report: null
            }
          ];
        }
      } catch (error) {
        console.error('Failed to load tests:', error);
      }
    };
    
    // Наблюдение за изменением активной вкладки
    const watchActiveTab = (newTab) => {
      if (newTab === 1 && metricsChart.value) {
        setTimeout(initMetricsChart, 100);
      }
    };
    
    // Жизненный цикл
    onMounted(() => {
      loadTests();
    });
    
    return {
      showCreateDialog,
      showDetailsDialog,
      activeTab,
      formValid,
      selectedTest,
      metricsChart,
      activeTests,
      newTest,
      testObjectives,
      primaryMetrics,
      confidenceLevels,
      snackbar,
      isAdmin,
      getStatusColor,
      getStatusIcon,
      getStatusText,
      formatDuration,
      formatCurrency,
      formatTime,
      addVariant,
      removeVariant,
      createTest,
      viewTestDetails,
      editTest,
      stopTest,
      generateReport,
      exportReport,
      watchActiveTab
    };
  }
};
</script>

<style scoped>
.ab-testing-manager {
  padding: 20px;
}

.test-card {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.test-card.test-running {
  border-left-color: #4caf50;
}

.test-card.test-paused {
  border-left-color: #ff9800;
}

.test-card.test-stopped {
  border-left-color: #f44336;
}

.test-card.test-completed {
  border-left-color: #2196f3;
}

.test-info p {
  margin-bottom: 8px;
  font-size: 14px;
}

.variants-info h4,
.metrics-info h4 {
  margin-bottom: 16px;
  color: #333;
}

.variant-item {
  margin-bottom: 16px;
}

.variant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.variant-name {
  font-weight: 500;
  color: #333;
}

.variant-traffic {
  font-size: 12px;
  color: #666;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.metric-label {
  font-weight: 500;
  color: #333;
}

.metric-value {
  font-weight: 600;
  color: #1976d2;
}

.variant-form {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fafafa;
}

.variant-detail {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.variant-detail h4 {
  margin-bottom: 8px;
  color: #1976d2;
}

.variant-detail p {
  margin-bottom: 4px;
  font-size: 14px;
}

.metrics-chart {
  height: 300px;
  margin-bottom: 16px;
}

.significance-info p {
  margin-bottom: 12px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.analysis-content {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 4px solid #1976d2;
}

.report-actions {
  margin-bottom: 16px;
}

.report-content {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .ab-testing-manager {
    padding: 10px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .variant-form {
    padding: 12px;
  }
}
</style> 