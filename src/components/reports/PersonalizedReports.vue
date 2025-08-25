<template>
  <div class="personalized-reports">
    <!-- Заголовок -->
    <v-card class="reports-header" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon left size="32" color="primary">mdi-chart-line</v-icon>
        <div>
          <div class="text-h5">Персонализированные отчеты</div>
          <div class="text-subtitle-1 text-grey">
            AI-аналитика и инсайты для вашей продуктивности
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="generateNewReport"
          :loading="generatingReport"
        >
          <v-icon left>mdi-plus</v-icon>
          Новый отчет
        </v-btn>
      </v-card-title>
    </v-card>

    <!-- Фильтры и настройки -->
    <v-card class="filters-section" elevation="1">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.period"
              :items="periodOptions"
              label="Период"
              variant="outlined"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.category"
              :items="categoryOptions"
              label="Категория"
              variant="outlined"
              density="compact"
              multiple
              chips
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.priority"
              :items="priorityOptions"
              label="Приоритет"
              variant="outlined"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              variant="outlined"
              @click="applyFilters"
              :loading="applyingFilters"
            >
              <v-icon left>mdi-filter</v-icon>
              Применить
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Основной контент -->
    <v-row class="reports-content">
      <!-- Боковая панель с отчетами -->
      <v-col cols="12" md="4">
        <v-card class="reports-list" elevation="1">
          <v-card-title>
            <v-icon left>mdi-file-document</v-icon>
            Мои отчеты
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="report in filteredReports"
                :key="report.id"
                :class="{ 'active-report': selectedReport?.id === report.id }"
                @click="selectReport(report)"
                class="mb-2"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getReportColor(report.type)" size="32">
                    <v-icon color="white" size="20">
                      {{ getReportIcon(report.type) }}
                    </v-icon>
                  </v-avatar>
                </template>
                
                <v-list-item-title>{{ report.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDate(report.createdAt) }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-chip
                    :color="getStatusColor(report.status)"
                    size="small"
                    variant="outlined"
                  >
                    {{ report.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Основная область отчета -->
      <v-col cols="12" md="8">
        <div v-if="selectedReport" class="report-viewer">
          <!-- Заголовок отчета -->
          <v-card class="report-header" elevation="1">
            <v-card-title class="d-flex align-center">
              <v-icon left size="24" :color="getReportColor(selectedReport.type)">
                {{ getReportIcon(selectedReport.type) }}
              </v-icon>
              <div>
                <div class="text-h6">{{ selectedReport.title }}</div>
                <div class="text-caption text-grey">
                  Создан {{ formatDate(selectedReport.createdAt) }} • 
                  {{ selectedReport.status }}
                </div>
              </div>
              <v-spacer></v-spacer>
              <v-btn-group>
                <v-btn
                  icon
                  @click="exportReport"
                  :loading="exportingReport"
                >
                  <v-icon>mdi-download</v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="shareReport"
                >
                  <v-icon>mdi-share</v-icon>
                </v-btn>
                <v-btn
                  icon
                  @click="editReport"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </v-btn-group>
            </v-card-title>
          </v-card>

          <!-- Содержимое отчета -->
          <v-card class="report-content" elevation="1">
            <v-card-text>
              <!-- AI Инсайты -->
              <div class="ai-insights mb-6">
                <h3 class="text-h6 mb-3">
                  <v-icon left color="primary">mdi-lightbulb</v-icon>
                  AI Инсайты
                </h3>
                <v-alert
                  v-for="insight in selectedReport.aiInsights"
                  :key="insight.id"
                  :type="insight.type"
                  :icon="insight.icon"
                  class="mb-2"
                >
                  <div class="d-flex align-center">
                    <div class="flex-grow-1">
                      <strong>{{ insight.title }}</strong>
                      <p class="mb-0">{{ insight.description }}</p>
                    </div>
                    <v-btn
                      v-if="insight.action"
                      :color="insight.action.color"
                      size="small"
                      @click="executeInsightAction(insight.action)"
                    >
                      {{ insight.action.text }}
                    </v-btn>
                  </div>
                </v-alert>
              </div>

              <!-- Ключевые метрики -->
              <div class="key-metrics mb-6">
                <h3 class="text-h6 mb-3">
                  <v-icon left color="primary">mdi-chart-box</v-icon>
                  Ключевые метрики
                </h3>
                <v-row>
                  <v-col
                    v-for="metric in selectedReport.keyMetrics"
                    :key="metric.id"
                    cols="12"
                    sm="6"
                    md="3"
                  >
                    <v-card class="metric-card" elevation="1">
                      <v-card-text class="text-center">
                        <div class="metric-value" :style="{ color: metric.color }">
                          {{ metric.value }}
                        </div>
                        <div class="metric-label">{{ metric.label }}</div>
                        <div class="metric-change" :class="getChangeClass(metric.change)">
                          <v-icon size="16">
                            {{ getChangeIcon(metric.change) }}
                          </v-icon>
                          {{ Math.abs(metric.change) }}%
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>

              <!-- Графики и диаграммы -->
              <div class="charts-section mb-6">
                <h3 class="text-h6 mb-3">
                  <v-icon left color="primary">mdi-chart-areaspline</v-icon>
                  Аналитика
                </h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card class="chart-card" elevation="1">
                      <v-card-title>Продуктивность по дням</v-card-title>
                      <v-card-text>
                        <canvas ref="productivityChart" height="200"></canvas>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card class="chart-card" elevation="1">
                      <v-card-title>Распределение задач</v-card-title>
                      <v-card-text>
                        <canvas ref="tasksChart" height="200"></canvas>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>

              <!-- Рекомендации -->
              <div class="recommendations mb-6">
                <h3 class="text-h6 mb-3">
                  <v-icon left color="primary">mdi-thumb-up</v-icon>
                  Рекомендации
                </h3>
                <v-list>
                  <v-list-item
                    v-for="recommendation in selectedReport.recommendations"
                    :key="recommendation.id"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-avatar :color="recommendation.priority" size="32">
                        <v-icon color="white" size="20">
                          {{ getRecommendationIcon(recommendation.type) }}
                        </v-icon>
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title>{{ recommendation.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ recommendation.description }}
                    </v-list-item-subtitle>
                    
                    <template v-slot:append>
                      <v-btn
                        :color="recommendation.action.color"
                        size="small"
                        @click="executeRecommendation(recommendation)"
                      >
                        {{ recommendation.action.text }}
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </div>

              <!-- Детальная таблица -->
              <div class="detailed-table">
                <h3 class="text-h6 mb-3">
                  <v-icon left color="primary">mdi-table</v-icon>
                  Детализация
                </h3>
                <v-data-table
                  :headers="selectedReport.tableHeaders"
                  :items="selectedReport.tableData"
                  :loading="loadingTableData"
                  class="elevation-1"
                >
                  <template v-slot:item.priority="{ item }">
                    <v-chip
                      :color="getPriorityColor(item.priority)"
                      size="small"
                    >
                      {{ item.priority }}
                    </v-chip>
                  </template>
                  
                  <template v-slot:item.status="{ item }">
                    <v-chip
                      :color="getStatusColor(item.status)"
                      size="small"
                    >
                      {{ item.status }}
                    </v-chip>
                  </template>
                  
                  <template v-slot:item.progress="{ item }">
                    <v-progress-linear
                      :model-value="item.progress"
                      :color="getProgressColor(item.progress)"
                      height="20"
                      rounded
                    >
                      <template v-slot:default>
                        {{ item.progress }}%
                      </template>
                    </v-progress-linear>
                  </template>
                </v-data-table>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Пустое состояние -->
        <div v-else class="empty-state">
          <v-card class="text-center pa-8" elevation="1">
            <v-icon size="64" color="grey lighten-1" class="mb-4">
              mdi-chart-line
            </v-icon>
            <h3 class="text-h5 mb-2">Выберите отчет</h3>
            <p class="text-body-1 text-grey mb-4">
              Выберите отчет из списка слева для просмотра детальной информации
            </p>
            <v-btn
              color="primary"
              @click="generateNewReport"
            >
              <v-icon left>mdi-plus</v-icon>
              Создать первый отчет
            </v-btn>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <!-- Диалог создания отчета -->
    <v-dialog v-model="reportDialog" max-width="800">
      <v-card>
        <v-card-title>Создание персонализированного отчета</v-card-title>
        <v-card-text>
          <v-form ref="reportForm" v-model="reportFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newReport.title"
                  label="Название отчета"
                  required
                  :rules="[v => !!v || 'Название обязательно']"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="newReport.type"
                  :items="reportTypeOptions"
                  label="Тип отчета"
                  required
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="newReport.period"
                  :items="periodOptions"
                  label="Период"
                  required
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="newReport.metrics"
                  :items="availableMetrics"
                  label="Метрики для анализа"
                  multiple
                  chips
                  required
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-checkbox
                  v-model="newReport.includeAIInsights"
                  label="Включить AI инсайты"
                ></v-checkbox>
                <v-checkbox
                  v-model="newReport.includeRecommendations"
                  label="Включить рекомендации"
                ></v-checkbox>
                <v-checkbox
                  v-model="newReport.includeCharts"
                  label="Включить графики"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="newReport.description"
                  label="Описание"
                  rows="3"
                  placeholder="Опишите, что именно вас интересует в отчете..."
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="reportDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="createReport"
            :loading="creatingReport"
            :disabled="!reportFormValid"
          >
            Создать отчет
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог редактирования отчета -->
    <v-dialog v-model="editDialog" max-width="800">
      <v-card>
        <v-card-title>Редактирование отчета</v-card-title>
        <v-card-text>
          <v-form ref="editForm" v-model="editFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editingReport.title"
                  label="Название отчета"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="editingReport.description"
                  label="Описание"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-checkbox
                  v-model="editingReport.autoRefresh"
                  label="Автообновление"
                ></v-checkbox>
                <v-checkbox
                  v-model="editingReport.includeNotifications"
                  label="Уведомления об изменениях"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="editDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="saveReportChanges"
            :loading="savingChanges"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  name: 'PersonalizedReports',
  data() {
    return {
      // Фильтры
      filters: {
        period: 'week',
        category: [],
        priority: 'all'
      },
      
      // Опции фильтров
      periodOptions: [
        { text: 'Сегодня', value: 'today' },
        { text: 'Вчера', value: 'yesterday' },
        { text: 'Неделя', value: 'week' },
        { text: 'Месяц', value: 'month' },
        { text: 'Квартал', value: 'quarter' },
        { text: 'Год', value: 'year' },
        { text: 'Кастомный', value: 'custom' }
      ],
      
      categoryOptions: [
        { text: 'Задачи', value: 'tasks' },
        { text: 'Встречи', value: 'meetings' },
        { text: 'Проекты', value: 'projects' },
        { text: 'Время', value: 'time' },
        { text: 'Продуктивность', value: 'productivity' }
      ],
      
      priorityOptions: [
        { text: 'Все', value: 'all' },
        { text: 'Высокий', value: 'high' },
        { text: 'Средний', value: 'medium' },
        { text: 'Низкий', value: 'low' }
      ],
      
      // Отчеты
      reports: [],
      selectedReport: null,
      filteredReports: [],
      
      // Диалоги
      reportDialog: false,
      editDialog: false,
      
      // Формы
      reportFormValid: false,
      editFormValid: false,
      
      // Новый отчет
      newReport: {
        title: '',
        type: '',
        period: '',
        metrics: [],
        description: '',
        includeAIInsights: true,
        includeRecommendations: true,
        includeCharts: true
      },
      
      // Редактирование
      editingReport: {},
      
      // Загрузка
      generatingReport: false,
      applyingFilters: false,
      creatingReport: false,
      savingChanges: false,
      exportingReport: false,
      loadingTableData: false,
      
      // Опции отчетов
      reportTypeOptions: [
        { text: 'Отчет по продуктивности', value: 'productivity' },
        { text: 'Отчет по задачам', value: 'tasks' },
        { text: 'Отчет по времени', value: 'time' },
        { text: 'Отчет по проектам', value: 'projects' },
        { text: 'Отчет по команде', value: 'team' },
        { text: 'Кастомный отчет', value: 'custom' }
      ],
      
      availableMetrics: [
        { text: 'Количество задач', value: 'task_count' },
        { text: 'Время выполнения', value: 'completion_time' },
        { text: 'Продуктивность', value: 'productivity' },
        { text: 'Загруженность', value: 'workload' },
        { text: 'Качество работы', value: 'quality' },
        { text: 'Время в встречах', value: 'meeting_time' },
        { text: 'Время на проекты', value: 'project_time' }
      ],
      
      // Графики
      productivityChart: null,
      tasksChart: null
    };
  },
  
  mounted() {
    this.loadReports();
    this.generateSampleData();
  },
  
  beforeDestroy() {
    this.destroyCharts();
  },
  
  methods: {
    // Загрузка отчетов
    async loadReports() {
      try {
        // Здесь должна быть загрузка с сервера
        this.reports = this.getSampleReports();
        this.filteredReports = [...this.reports];
        
        if (this.reports.length > 0) {
          this.selectReport(this.reports[0]);
        }
        
      } catch (error) {
        console.error('Ошибка загрузки отчетов:', error);
      }
    },
    
    // Применение фильтров
    async applyFilters() {
      this.applyingFilters = true;
      
      try {
        // Фильтрация отчетов
        this.filteredReports = this.reports.filter(report => {
          let matches = true;
          
          if (this.filters.period !== 'all') {
            matches = matches && report.period === this.filters.period;
          }
          
          if (this.filters.category.length > 0) {
            matches = matches && this.filters.category.includes(report.category);
          }
          
          if (this.filters.priority !== 'all') {
            matches = matches && report.priority === this.filters.priority;
          }
          
          return matches;
        });
        
        // Если выбранный отчет не проходит фильтры, выбираем первый
        if (!this.filteredReports.includes(this.selectedReport)) {
          this.selectedReport = this.filteredReports[0] || null;
        }
        
      } catch (error) {
        console.error('Ошибка применения фильтров:', error);
      } finally {
        this.applyingFilters = false;
      }
    },
    
    // Выбор отчета
    selectReport(report) {
      this.selectedReport = report;
      this.$nextTick(() => {
        this.renderCharts();
      });
    },
    
    // Генерация нового отчета
    generateNewReport() {
      this.reportDialog = true;
    },
    
    // Создание отчета
    async createReport() {
      if (!this.$refs.reportForm.validate()) return;
      
      this.creatingReport = true;
      
      try {
        // Здесь должна быть логика создания отчета
        const report = await this.generateReportData(this.newReport);
        
        this.reports.unshift(report);
        this.filteredReports = [...this.reports];
        this.selectReport(report);
        
        this.reportDialog = false;
        this.resetReportForm();
        
        this.showSuccessMessage('Отчет успешно создан!');
        
      } catch (error) {
        console.error('Ошибка создания отчета:', error);
        this.showErrorMessage('Ошибка при создании отчета');
      } finally {
        this.creatingReport = false;
      }
    },
    
    // Редактирование отчета
    editReport() {
      this.editingReport = { ...this.selectedReport };
      this.editDialog = true;
    },
    
    // Сохранение изменений
    async saveReportChanges() {
      this.savingChanges = true;
      
      try {
        // Здесь должна быть логика сохранения
        Object.assign(this.selectedReport, this.editingReport);
        
        this.editDialog = false;
        this.showSuccessMessage('Изменения сохранены!');
        
      } catch (error) {
        console.error('Ошибка сохранения:', error);
        this.showErrorMessage('Ошибка при сохранении');
      } finally {
        this.savingChanges = false;
      }
    },
    
    // Экспорт отчета
    async exportReport() {
      this.exportingReport = true;
      
      try {
        // Здесь должна быть логика экспорта
        await this.exportReportToPDF(this.selectedReport);
        this.showSuccessMessage('Отчет экспортирован!');
        
      } catch (error) {
        console.error('Ошибка экспорта:', error);
        this.showErrorMessage('Ошибка при экспорте');
      } finally {
        this.exportingReport = false;
      }
    },
    
    // Поделиться отчетом
    shareReport() {
      // Здесь должна быть логика шаринга
      this.showInfoMessage('Функция шаринга в разработке');
    },
    
    // Выполнение действия инсайта
    executeInsightAction(action) {
      // Здесь должна быть логика выполнения действия
      this.showInfoMessage(`Выполняется: ${action.text}`);
    },
    
    // Выполнение рекомендации
    executeRecommendation(recommendation) {
      // Здесь должна быть логика выполнения рекомендации
      this.showInfoMessage(`Применяется: ${recommendation.title}`);
    },
    
    // Рендеринг графиков
    renderCharts() {
      this.destroyCharts();
      
      if (this.selectedReport) {
        this.renderProductivityChart();
        this.renderTasksChart();
      }
    },
    
    // График продуктивности
    renderProductivityChart() {
      const ctx = this.$refs.productivityChart;
      if (!ctx) return;
      
      this.productivityChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.selectedReport.chartData.labels,
          datasets: [{
            label: 'Продуктивность',
            data: this.selectedReport.chartData.productivity,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    },
    
    // График задач
    renderTasksChart() {
      const ctx = this.$refs.tasksChart;
      if (!ctx) return;
      
      this.tasksChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.selectedReport.chartData.taskLabels,
          datasets: [{
            data: this.selectedReport.chartData.taskData,
            backgroundColor: [
              '#1976d2',
              '#388e3c',
              '#f57c00',
              '#d32f2f',
              '#7b1fa2'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    },
    
    // Уничтожение графиков
    destroyCharts() {
      if (this.productivityChart) {
        this.productivityChart.destroy();
        this.productivityChart = null;
      }
      if (this.tasksChart) {
        this.tasksChart.destroy();
        this.tasksChart = null;
      }
    },
    
    // Генерация данных отчета
    async generateReportData(config) {
      // Здесь должна быть логика генерации данных
      return {
        id: Date.now().toString(),
        title: config.title,
        type: config.type,
        period: config.period,
        createdAt: new Date(),
        status: 'completed',
        category: 'analytics',
        priority: 'medium',
        
        aiInsights: [
          {
            id: 1,
            type: 'success',
            icon: 'mdi-trending-up',
            title: 'Рост продуктивности',
            description: 'Ваша продуктивность выросла на 15% по сравнению с прошлым периодом',
            action: {
              text: 'Подробнее',
              color: 'primary'
            }
          },
          {
            id: 2,
            type: 'warning',
            icon: 'mdi-clock-alert',
            title: 'Внимание к срокам',
            description: '30% задач имеют риск превышения дедлайна',
            action: {
              text: 'Проверить',
              color: 'warning'
            }
          }
        ],
        
        keyMetrics: [
          {
            id: 1,
            label: 'Задачи выполнено',
            value: '24',
            change: 12,
            color: '#388e3c'
          },
          {
            id: 2,
            label: 'Продуктивность',
            value: '87%',
            change: 8,
            color: '#1976d2'
          },
          {
            id: 3,
            label: 'Время в встречах',
            value: '12ч',
            change: -5,
            color: '#f57c00'
          },
          {
            id: 4,
            label: 'Качество работы',
            value: '92%',
            change: 3,
            color: '#388e3c'
          }
        ],
        
        recommendations: [
          {
            id: 1,
            title: 'Оптимизация встреч',
            description: 'Сократите время встреч на 20% для повышения продуктивности',
            type: 'optimization',
            priority: 'success',
            action: {
              text: 'Применить',
              color: 'success'
            }
          },
          {
            id: 2,
            title: 'Приоритизация задач',
            description: 'Используйте матрицу Эйзенхауэра для лучшего планирования',
            type: 'planning',
            priority: 'info',
            action: {
              text: 'Изучить',
              color: 'info'
            }
          }
        ],
        
        chartData: {
          labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
          productivity: [75, 82, 78, 85, 90, 65, 70],
          taskLabels: ['Выполнено', 'В работе', 'Ожидает', 'Отложено', 'Отменено'],
          taskData: [24, 8, 3, 2, 1]
        },
        
        tableHeaders: [
          { title: 'Задача', key: 'title' },
          { title: 'Приоритет', key: 'priority' },
          { title: 'Статус', key: 'status' },
          { title: 'Прогресс', key: 'progress' },
          { title: 'Дедлайн', key: 'deadline' }
        ],
        
        tableData: [
          {
            title: 'Разработка API',
            priority: 'high',
            status: 'completed',
            progress: 100,
            deadline: '2024-01-15'
          },
          {
            title: 'Тестирование модуля',
            priority: 'medium',
            status: 'in_progress',
            progress: 75,
            deadline: '2024-01-20'
          }
        ]
      };
    },
    
    // Экспорт в PDF
    async exportReportToPDF(report) {
      // Здесь должна быть логика экспорта в PDF
      return new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
    },
    
    // Сброс формы отчета
    resetReportForm() {
      this.newReport = {
        title: '',
        type: '',
        period: '',
        metrics: [],
        description: '',
        includeAIInsights: true,
        includeRecommendations: true,
        includeCharts: true
      };
      this.$refs.reportForm.resetValidation();
    },
    
    // Генерация примерных данных
    generateSampleData() {
      // Генерация примерных отчетов
      this.reports = [
        {
          id: '1',
          title: 'Еженедельный отчет по продуктивности',
          type: 'productivity',
          period: 'week',
          createdAt: new Date(),
          status: 'completed',
          category: 'analytics',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Анализ выполнения задач',
          type: 'tasks',
          period: 'month',
          createdAt: new Date(Date.now() - 86400000),
          status: 'completed',
          category: 'tasks',
          priority: 'medium'
        }
      ];
      
      this.filteredReports = [...this.reports];
    },
    
    // Получение цвета отчета
    getReportColor(type) {
      const colors = {
        productivity: '#1976d2',
        tasks: '#388e3c',
        time: '#f57c00',
        projects: '#7b1fa2',
        team: '#d32f2f',
        custom: '#666666'
      };
      return colors[type] || '#666666';
    },
    
    // Получение иконки отчета
    getReportIcon(type) {
      const icons = {
        productivity: 'mdi-chart-line',
        tasks: 'mdi-checkbox-marked-circle',
        time: 'mdi-clock',
        projects: 'mdi-folder',
        team: 'mdi-account-group',
        custom: 'mdi-file-document'
      };
      return icons[type] || 'mdi-file-document';
    },
    
    // Получение цвета статуса
    getStatusColor(status) {
      const colors = {
        completed: 'success',
        in_progress: 'warning',
        pending: 'info',
        failed: 'error'
      };
      return colors[status] || 'grey';
    },
    
    // Получение цвета приоритета
    getPriorityColor(priority) {
      const colors = {
        high: 'error',
        medium: 'warning',
        low: 'success'
      };
      return colors[priority] || 'grey';
    },
    
    // Получение цвета прогресса
    getProgressColor(progress) {
      if (progress >= 80) return 'success';
      if (progress >= 50) return 'warning';
      return 'error';
    },
    
    // Получение класса изменения
    getChangeClass(change) {
      return change >= 0 ? 'positive-change' : 'negative-change';
    },
    
    // Получение иконки изменения
    getChangeIcon(change) {
      return change >= 0 ? 'mdi-trending-up' : 'mdi-trending-down';
    },
    
    // Получение иконки рекомендации
    getRecommendationIcon(type) {
      const icons = {
        optimization: 'mdi-lightning-bolt',
        planning: 'mdi-calendar-clock',
        learning: 'mdi-school',
        collaboration: 'mdi-account-group'
      };
      return icons[type] || 'mdi-lightbulb';
    },
    
    // Форматирование даты
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
    
    // Показ сообщений
    showSuccessMessage(message) {
      this.$emit('show-message', { type: 'success', text: message });
    },
    
    showErrorMessage(message) {
      this.$emit('show-message', { type: 'error', text: message });
    },
    
    showInfoMessage(message) {
      this.$emit('show-message', { type: 'info', text: message });
    }
  }
};
</script>

<style scoped>
.personalized-reports {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.reports-header {
  margin-bottom: 16px;
  border-radius: 8px;
}

.filters-section {
  margin-bottom: 16px;
  border-radius: 8px;
}

.reports-content {
  margin: 0;
}

.reports-list {
  height: fit-content;
  border-radius: 8px;
}

.report-viewer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-header {
  border-radius: 8px;
}

.report-content {
  border-radius: 8px;
}

.active-report {
  background: rgba(25, 118, 210, 0.1);
  border-radius: 8px;
}

.metric-card {
  border-radius: 8px;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 4px;
}

.metric-change {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.positive-change {
  color: #388e3c;
}

.negative-change {
  color: #d32f2f;
}

.chart-card {
  border-radius: 8px;
}

.empty-state {
  padding: 32px;
}

.ai-insights,
.key-metrics,
.charts-section,
.recommendations,
.detailed-table {
  margin-bottom: 24px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .personalized-reports {
    padding: 8px;
  }
  
  .reports-content {
    flex-direction: column;
  }
  
  .reports-list {
    margin-bottom: 16px;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .personalized-reports {
    background: #121212;
  }
  
  .reports-header,
  .filters-section,
  .reports-list,
  .report-header,
  .report-content {
    background: #1e1e1e;
    color: #ffffff;
  }
}
</style> 