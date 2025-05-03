<template>
  <v-container class="dashboard-container">
    <v-row>
      <v-col>
        <h1 class="dashboard-title">Дашборд</h1>

        <!-- Система уведомлений -->
        <v-snackbar
          v-model="snackbar.show"
          :timeout="snackbar.timeout"
          :color="snackbar.color"
          elevation="24"
          top
          right
          multi-line
        >
          <div class="snackbar-content">
            <v-icon left>{{ snackbar.icon }}</v-icon>
            <div>
              <div class="snackbar-title">{{ snackbar.title }}</div>
              <div class="snackbar-message">{{ snackbar.message }}</div>
            </div>
          </div>
          <template v-slot:action="{ attrs }">
            <v-btn icon v-bind="attrs" @click="snackbar.show = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-snackbar>

        <!-- Основные метрики -->
        <v-row>
          <v-col v-for="(metric, index) in quickMetrics" :key="index" cols="12" sm="6" md="3">
            <v-card
              class="metric-card"
              :class="`metric-${index}`"
              v-animate-onscroll="'animated fadeInUp'"
              :style="`animation-delay: ${index * 0.1}s`"
            >
              <v-card-text>
                <div class="metric-title">{{ metric.title }}</div>
                <div class="metric-value">
                  <template v-if="!loadingQuickMetrics">
                    {{ metric.value }}
                    <span v-if="metric.unit" class="metric-unit">{{ metric.unit }}</span>
                  </template>
                  <v-skeleton-loader v-else type="text" width="80%"></v-skeleton-loader>
                </div>
                <v-divider class="my-3"></v-divider>
                <div class="metric-change">
                  <v-icon small :color="metric.change >= 0 ? 'success' : 'error'">
                    {{ metric.change >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                  </v-icon>
                  <span
                    :class="{
                      'success--text': metric.change >= 0,
                      'error--text': metric.change < 0
                    }"
                  >
                    {{ Math.abs(metric.change) }}% {{ metric.change >= 0 ? 'рост' : 'снижение' }}
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Основные графики -->
        <v-row class="mt-4">
          <v-col cols="12" lg="8">
            <v-card
              class="main-chart-card"
              v-animate-onscroll="'animated fadeInUp'"
              style="animation-delay: 0.2s"
            >
              <v-card-title class="chart-title">
                Активность за период
                <v-spacer></v-spacer>
                <v-select
                  v-model="activityPeriod"
                  :items="periods"
                  outlined
                  dense
                  hide-details
                  label="Период"
                  class="period-select"
                  @change="fetchActivityData"
                ></v-select>
              </v-card-title>
              <v-card-text>
                <BarChart
                  v-if="activityData.labels.length && !loadingActivity"
                  :chart-data="activityData"
                  :chart-options="activityOptions"
                  height="350"
                />
                <v-skeleton-loader v-else type="image" height="350"></v-skeleton-loader>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Таблица последних задач -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card
              class="table-card"
              v-animate-onscroll="'animated fadeInUp'"
              style="animation-delay: 0.5s"
            >
              <v-card-title class="chart-title">
                Последние задачи
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="taskSearch"
                  append-icon="mdi-magnify"
                  label="Поиск"
                  single-line
                  hide-details
                  class="search-field"
                ></v-text-field>
              </v-card-title>
              <v-card-text>
                <v-data-table
                  :headers="taskHeaders"
                  :items="filteredTasks"
                  :search="taskSearch"
                  :loading="loadingTasks"
                  loading-text="Загрузка задач..."
                  no-data-text="Нет задач для отображения"
                  :items-per-page="5"
                  class="elevation-0"
                >
                  <template v-slot:item.status="{ item }">
                    <v-chip small :color="getStatusColor(item.status)" dark>
                      {{ item.status }}
                    </v-chip>
                  </template>
                  <template v-slot:item.actions="{ item }">
                    <v-btn icon small @click="viewTask(item)">
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import BarChart from '@/components/BarChart.vue';
import { getDashboardMetrics, getActivityData, getRecentTasks } from '@/api/index.js';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'DashboardPage',
  components: {
    BarChart
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const loadingQuickMetrics = ref(true);
    const loadingActivity = ref(true);
    const loadingTasks = ref(true);

    const snackbar = ref({
      show: false,
      title: '',
      message: '',
      color: 'error',
      icon: 'mdi-alert-circle',
      timeout: 6000
    });

    const quickMetrics = ref([
      { title: 'Всего задач', value: 0, change: 0, unit: 'шт.' },
      { title: 'Новых клиентов', value: 0, change: 0, unit: 'чел.' },
      { title: 'Общая сумма', value: 0, change: 0, unit: '₽' },
      { title: 'Продуктивность', value: 0, change: 0, unit: '%' }
    ]);

    const activityPeriod = ref('month');
    const periods = ref([
      { text: 'Неделя', value: 'week' },
      { text: 'Месяц', value: 'month' },
      { text: 'Квартал', value: 'quarter' }
    ]);
    const activityData = ref({
      labels: [],
      datasets: []
    });
    const activityOptions = ref({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.raw} задач`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Количество задач' } },
        x: { title: { display: true, text: 'Дата' } }
      }
    });

    const taskSearch = ref('');
    const taskHeaders = ref([
      { text: 'Название', value: 'title' },
      { text: 'Статус', value: 'status' },
      { text: 'Срок', value: 'due_date' },
      { text: 'Действия', value: 'actions', sortable: false }
    ]);
    const tasks = ref([]);

    const isAdmin = computed(() => authStore.user?.role === 'admin');

    const filteredTasks = computed(() => {
      return tasks.value.filter(task => {
        const search = taskSearch.value.toLowerCase();
        return (
          task.title.toLowerCase().includes(search) ||
          task.status.toLowerCase().includes(search)
        );
      });
    });

    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchQuickMetrics(),
          fetchActivityData(),
          fetchRecentTasks()
        ]);
      } catch (error) {
        handleError('Ошибка загрузки данных', 'Не удалось загрузить данные дашборда', error);
      }
    };

    const fetchQuickMetrics = async () => {
      loadingQuickMetrics.value = true;
      try {
        const metrics = await getDashboardMetrics();
        quickMetrics.value = [
          { title: 'Всего задач', value: metrics.completed_tasks, change: metrics.tasks_change, unit: 'шт.' },
          { title: 'Новых клиентов', value: metrics.new_clients, change: metrics.clients_change, unit: 'чел.' },
          { title: 'Общая сумма', value: metrics.total_amount.toLocaleString(), change: metrics.amount_change, unit: '₽' },
          { title: 'Продуктивность', value: metrics.productivity, change: metrics.productivity_change, unit: '%' }
        ];
      } catch (error) {
        throw error;
      } finally {
        loadingQuickMetrics.value = false;
      }
    };

    const fetchActivityData = async () => {
      loadingActivity.value = true;
      try {
        const data = await getActivityData(activityPeriod.value);
        activityData.value = {
          labels: data.labels,
          datasets: [
            {
              label: 'Завершённые задачи',
              backgroundColor: '#42A5F5',
              borderColor: '#1976D2',
              borderWidth: 2,
              data: data.completed
            },
            {
              label: 'Созданные задачи',
              backgroundColor: '#66BB6A',
              borderColor: '#388E3C',
              borderWidth: 2,
              data: data.created
            }
          ]
        };
      } catch (error) {
        throw error;
      } finally {
        loadingActivity.value = false;
      }
    };

    const fetchRecentTasks = async () => {
      loadingTasks.value = true;
      try {
        tasks.value = await getRecentTasks();
      } catch (error) {
        throw error;
      } finally {
        loadingTasks.value = false;
      }
    };

    const viewTask = (task) => {
      router.push(`/tasks/${task.id}`);
    };

    const getStatusColor = (status) => {
      const statusColors = {
        'Новая': 'blue',
        'В работе': 'orange',
        'Завершена': 'green',
        'Отменена': 'red'
      };
      return statusColors[status] || 'grey';
    };

    const handleError = (title, message, error) => {
      console.error(title, error);
      
      let detailedMessage = message;
      if (error.response) {
        switch (error.response.status) {
          case 401:
            detailedMessage = 'Требуется авторизация';
            router.push('/login');
            break;
          case 402:
            detailedMessage = 'Подписка истекла. Оформите подписку для продолжения.';
            break;
          case 403:
            detailedMessage = 'У вас нет прав для просмотра этой информации';
            break;
          case 404:
            detailedMessage = 'Данные не найдены';
            break;
          case 500:
            detailedMessage = 'Ошибка сервера. Пожалуйста, попробуйте позже.';
            break;
          default:
            detailedMessage = error.response.data?.message || error.response.data?.detail || message;
        }
      } else if (error.message) {
        detailedMessage = error.message;
      }
      
      showError(title, detailedMessage);
    };

    const showError = (title, message) => {
      snackbar.value = {
        show: true,
        title,
        message,
        color: 'error',
        icon: 'mdi-alert-circle',
        timeout: 6000
      };
    };

    const showSuccess = (title, message) => {
      snackbar.value = {
        show: true,
        title,
        message,
        color: 'success',
        icon: 'mdi-check-circle',
        timeout: 4000
      };
    };

    loadAllData();

    return {
      loadingQuickMetrics,
      loadingActivity,
      loadingTasks,
      snackbar,
      quickMetrics,
      activityPeriod,
      periods,
      activityData,
      activityOptions,
      taskSearch,
      taskHeaders,
      tasks,
      isAdmin,
      filteredTasks,
      loadAllData,
      fetchQuickMetrics,
      fetchActivityData,
      fetchRecentTasks,
      viewTask,
      getStatusColor,
      handleError,
      showError,
      showSuccess,
      router
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  max-width: 1800px;
  margin: 0 auto;
}

.dashboard-title {
  font-size: 2.2rem;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 24px;
  text-align: center;
  background: linear-gradient(to right, #1976d2, #2196f3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  padding-bottom: 8px;
}

.dashboard-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(to right, #1976d2, #2196f3);
  border-radius: 3px;
}

.metric-card {
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
  border-left: 4px solid;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, #1976d2, #2196f3);
}

.metric-0 { border-left-color: #42A5F5; }
.metric-1 { border-left-color: #66BB6A; }
.metric-2 { border-left-color: #FFA726; }
.metric-3 { border-left-color: #7E57C2; }

.metric-title {
  font-size: 1rem;
  font-weight: 500;
  color: #546e7a;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: #263238;
  margin-bottom: 8px;
}

.metric-unit {
  font-size: 1rem;
  font-weight: 400;
  color: #78909c;
}

.metric-change {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.main-chart-card,
.table-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%;
  overflow: hidden;
}

.main-chart-card:hover,
.table-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.chart-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #263238;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.period-select {
  max-width: 150px;
  margin-left: 12px;
}

.search-field {
  max-width: 200px;
}

.snackbar-content {
  display: flex;
  align-items: center;
}

.snackbar-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.snackbar-message {
  font-size: 0.9rem;
  opacity: 0.9;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 1264px) {
  .dashboard-container {
    padding: 16px;
  }
  .dashboard-title {
    font-size: 1.8rem;
  }
  .metric-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 960px) {
  .dashboard-title {
    font-size: 1.6rem;
  }
  .metric-card {
    margin-bottom: 16px;
  }
  .period-select {
    max-width: 120px;
  }
}

@media (max-width: 600px) {
  .dashboard-title {
    font-size: 1.4rem;
    margin-bottom: 16px;
  }
  .chart-title {
    font-size: 1.1rem;
  }
  .period-select,
  .search-field {
    max-width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>