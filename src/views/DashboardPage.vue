<template>
  <v-container class="dashboard-container">
    <v-row>
      <v-col>
        <h1 class="dashboard-title">Дашборд</h1>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Завершено за неделю</v-card-title>
              <v-card-text>
                <BarChart :chart-data="completedLastWeekData" :chart-options="chartOptions" />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Сумма за неделю</v-card-title>
              <v-card-text>
                <BarChart :chart-data="totalCompletedLastWeekData" :chart-options="chartOptionsSum" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row class="mt-6">
          <v-col cols="12" md="6">
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Завершено вчера</v-card-title>
              <v-card-text>
                <BarChart :chart-data="completedYesterdayData" :chart-options="chartOptions" />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Сумма за вчера</v-card-title>
              <v-card-text>
                <BarChart :chart-data="totalCompletedYesterdayData" :chart-options="chartOptionsSum" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row class="mt-6">
          <v-col cols="12" md="6">
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>В работе сегодня</v-card-title>
              <v-card-text>
                <BarChart :chart-data="inProgressTodayData" :chart-options="chartOptions" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row class="mt-6">
          <v-col>
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Отчёт о продуктивности</v-card-title>
              <v-card-text>
                <v-select
                  v-model="selectedProductivityPeriod"
                  :items="productivityPeriods"
                  label="Период"
                  outlined
                  dense
                  @change="fetchProductivityReport"
                />
                <v-progress-linear v-if="productivityLoading" indeterminate color="blue" class="loading-bar mt-2" />
                <BarChart v-if="productivityData.total_minutes" :chart-data="productivityChartData" :chart-options="chartOptionsSum" />
                <p v-else-if="!productivityLoading" class="no-data">Нет данных о продуктивности</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row class="mt-6">
          <v-col>
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Моя зарплата</v-card-title>
              <v-card-text>
                <v-select
                  v-model="selectedPayrollPeriod"
                  :items="payrollPeriods"
                  label="Период"
                  outlined
                  dense
                  class="period-select"
                  @change="fetchPayroll"
                />
                <v-btn color="primary" @click="startPayrollCalculation" class="calculate-btn">Рассчитать</v-btn>
                <v-progress-linear v-if="payrollLoading" indeterminate color="blue" class="loading-bar mt-2" />
                <BarChart v-if="payrollData.amount" :chart-data="payrollChartData" :chart-options="chartOptionsSum" />
                <p v-else-if="!payrollLoading" class="no-data">Нет данных о зарплате</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row class="mt-6" v-if="isAdmin">
          <v-col>
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Агрегированная зарплата сотрудников</v-card-title>
              <v-card-text>
                <v-select
                  v-model="selectedAggregatePeriod"
                  :items="aggregatePeriods"
                  label="Выберите период"
                  outlined
                  dense
                  class="period-select"
                  @change="fetchAggregatePayroll"
                />
                <v-select
                  v-model="aggregateView"
                  :items="aggregateViews"
                  label="Тип отображения"
                  outlined
                  dense
                  class="period-select"
                  @change="fetchAggregatePayroll"
                />
                <v-progress-linear v-if="aggregateLoading" indeterminate color="blue" class="loading-bar mt-2" />
                <BarChart v-if="aggregatePayrollData.length && aggregateView === 'byDepartment'" :chart-data="aggregatePayrollByDepartmentChartData" :chart-options="chartOptionsSum" />
                <BarChart v-else-if="aggregatePayrollData.length && aggregateView === 'byEmployee'" :chart-data="aggregatePayrollByEmployeeChartData" :chart-options="chartOptionsSum" />
                <p v-else-if="!aggregateLoading" class="no-data">Нет данных о зарплате сотрудников</p>
                <v-data-table
                  v-if="aggregatePayrollData.length"
                  :headers="aggregateHeaders"
                  :items="aggregatePayrollData"
                  class="aggregate-table mt-4"
                >
                  <template v-slot:item.amount="{ item }">
                    <span>{{ item.amount.toFixed(2) }} ₽</span>
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
import { DndContext } from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';
import DraggableItem from '../components/DraggableItem.vue';
import DroppableWrapper from '../components/DroppableWrapper.vue';
import BarChart from '../components/BarChart.vue';
import { getDashboard, updateEmployeeOrder, getTasks, calculatePayroll, getPayroll, getAggregatePayroll, getProductivityReport } from '../api';

export default {
  components: { DndContext, DraggableItem, DroppableWrapper, BarChart },
  data() {
    return {
      dashboard: {},
      employeeLoad: [],
      taskStats: {
        completedLastWeek: 0,
        completedYesterday: 0,
        inProgressToday: 0,
        totalCompletedLastWeek: 0,
        totalCompletedYesterday: 0,
      },
      closestCenter,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.5,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Gilroy-Medium', size: 14 }, color: '#546e7a' } },
          title: { display: true, font: { family: 'Gilroy-ExtraBold', size: 16 }, color: '#1e88e5' },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { family: 'Gilroy-Medium', size: 14 },
            bodyFont: { family: 'Gilroy-Regular', size: 12 },
            callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.y} шт.` },
          },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Задачи, шт.', font: { family: 'Gilroy-Medium', size: 14 }, color: '#37474f' }, ticks: { font: { family: 'Gilroy-Regular', size: 12 }, color: '#546e7a' }, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
          x: { title: { display: true, text: 'Период', font: { family: 'Gilroy-Medium', size: 14 }, color: '#37474f' }, ticks: { font: { family: 'Gilroy-Regular', size: 12 }, color: '#546e7a' }, grid: { display: false } },
        },
        animation: { duration: 1000, easing: 'easeOutQuart' },
      },
      chartOptionsSum: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.5,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Gilroy-Medium', size: 14 }, color: '#546e7a' } },
          title: { display: true, font: { family: 'Gilroy-ExtraBold', size: 16 }, color: '#1e88e5' },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { family: 'Gilroy-Medium', size: 14 },
            bodyFont: { family: 'Gilroy-Regular', size: 12 },
            callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.y} руб.` },
          },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Сумма, руб.', font: { family: 'Gilroy-Medium', size: 14 }, color: '#37474f' }, ticks: { font: { family: 'Gilroy-Regular', size: 12 }, color: '#546e7a' }, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
          x: { title: { display: true, text: 'Период', font: { family: 'Gilroy-Medium', size: 14 }, color: '#37474f' }, ticks: { font: { family: 'Gilroy-Regular', size: 12 }, color: '#546e7a' }, grid: { display: false } },
        },
        animation: { duration: 1000, easing: 'easeOutQuart' },
      },
      selectedPayrollPeriod: 'month',
      payrollPeriods: ['week', 'month', 'quarter'],
      payrollLoading: false,
      payrollData: { amount: 0 },
      selectedAggregatePeriod: 'month',
      aggregatePeriods: ['week', 'month', 'quarter'],
      aggregateLoading: false,
      aggregatePayrollData: [],
      aggregateView: 'byDepartment',
      aggregateViews: [
        { text: 'По отделам', value: 'byDepartment' },
        { text: 'По сотрудникам', value: 'byEmployee' },
      ],
      aggregateHeaders: [
        { text: 'Сотрудник', value: 'employee_name' },
        { text: 'Отдел', value: 'department' },
        { text: 'Сумма', value: 'amount' },
      ],
      selectedProductivityPeriod: 'week',
      productivityPeriods: ['day', 'week', 'month'],
      productivityLoading: false,
      productivityData: { total_minutes: 0, task_times: {} },
      isAdmin: false,
    };
  },
  computed: {
    completedLastWeekData() {
      return {
        labels: ['За неделю'],
        datasets: [{ label: 'Задачи', backgroundColor: '#1976d2', borderColor: '#ffffff', borderWidth: 2, data: [this.taskStats.completedLastWeek], barThickness: 40, borderRadius: 6, hoverBackgroundColor: '#1565c0' }],
      };
    },
    totalCompletedLastWeekData() {
      return {
        labels: ['За неделю'],
        datasets: [{ label: 'Сумма', backgroundColor: '#0288d1', borderColor: '#ffffff', borderWidth: 2, data: [this.taskStats.totalCompletedLastWeek], barThickness: 40, borderRadius: 6, hoverBackgroundColor: '#0277bd' }],
      };
    },
    completedYesterdayData() {
      return {
        labels: ['За вчера'],
        datasets: [{ label: 'Задачи', backgroundColor: '#42a5f5', borderColor: '#ffffff', borderWidth: 2, data: [this.taskStats.completedYesterday], barThickness: 40, borderRadius: 6, hoverBackgroundColor: '#2196f3' }],
      };
    },
    totalCompletedYesterdayData() {
      return {
        labels: ['За вчера'],
        datasets: [{ label: 'Сумма', backgroundColor: '#4fc3f7', borderColor: '#ffffff', borderWidth: 2, data: [this.taskStats.totalCompletedYesterday], barThickness: 40, borderRadius: 6, hoverBackgroundColor: '#29b6f6' }],
      };
    },
    inProgressTodayData() {
      return {
        labels: ['На сегодня'],
        datasets: [{ label: 'Задачи', backgroundColor: '#ff9800', borderColor: '#ffffff', borderWidth: 2, data: [this.taskStats.inProgressToday], barThickness: 40, borderRadius: 6, hoverBackgroundColor: '#f57c00' }],
      };
    },
    payrollChartData() {
      return {
        labels: [this.selectedPayrollPeriod === 'week' ? 'Неделя' : this.selectedPayrollPeriod === 'month' ? 'Месяц' : 'Квартал'],
        datasets: [{ label: 'Зарплата', backgroundColor: '#4caf50', borderColor: '#ffffff', borderWidth: 2, data: [this.payrollData.amount], barThickness: 40, borderRadius: 6, hoverBackgroundColor: '#388e3c' }],
      };
    },
    aggregatePayrollByDepartmentChartData() {
      const departments = [...new Set(this.aggregatePayrollData.map(item => item.department))];
      const data = departments.map(dept => {
        return this.aggregatePayrollData
          .filter(item => item.department === dept)
          .reduce((sum, item) => sum + item.amount, 0);
      });
      return {
        labels: departments,
        datasets: [{
          label: 'Зарплата по отделам',
          backgroundColor: '#7b1fa2',
          borderColor: '#ffffff',
          borderWidth: 2,
          data: data,
          barThickness: 40,
          borderRadius: 6,
          hoverBackgroundColor: '#6a1b9a',
        }],
      };
    },
    aggregatePayrollByEmployeeChartData() {
      const employees = this.aggregatePayrollData.map(item => item.employee_name);
      const data = this.aggregatePayrollData.map(item => item.amount);
      return {
        labels: employees,
        datasets: [{
          label: 'Зарплата по сотрудникам',
          backgroundColor: '#7b1fa2',
          borderColor: '#ffffff',
          borderWidth: 2,
          data: data,
          barThickness: 40,
          borderRadius: 6,
          hoverBackgroundColor: '#6a1b9a',
        }],
      };
    },
    productivityChartData() {
      const labels = Object.keys(this.productivityData.task_times);
      const data = Object.values(this.productivityData.task_times);
      return {
        labels,
        datasets: [{
          label: 'Время на задачи (мин)',
          backgroundColor: '#ff5722',
          borderColor: '#ffffff',
          borderWidth: 2,
          data,
          barThickness: 40,
          borderRadius: 6,
          hoverBackgroundColor: '#e64a19',
        }],
      };
    },
  },
  async created() {
    await this.fetchDashboardData();
    await this.fetchPayroll();
    this.isAdmin = localStorage.getItem('user_role') === 'admin';
    if (this.isAdmin) await this.fetchAggregatePayroll();
    await this.fetchProductivityReport();
  },
  methods: {
    async fetchDashboardData() {
      try {
        const dashboardData = await getDashboard();
        this.dashboard = dashboardData;
        this.employeeLoad = dashboardData.employee_load || [];
        const taskData = await getTasks();
        this.taskStats = {
          completedLastWeek: taskData.completedLastWeek || 0,
          completedYesterday: taskData.completedYesterday || 0,
          inProgressToday: taskData.inProgressToday || 0,
          totalCompletedLastWeek: taskData.totalCompletedLastWeek || 0,
          totalCompletedYesterday: taskData.totalCompletedYesterday || 0,
        };
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert('Не удалось загрузить данные');
      }
    },
    async onDragEnd(event) {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const items = [...this.employeeLoad];
      const oldIndex = items.findIndex((item) => item.user_id === active.id);
      const newIndex = items.findIndex((item) => item.user_id === over.id);
      const [reorderedItem] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, reorderedItem);
      this.employeeLoad = items;
      try {
        const order = this.employeeLoad.map((emp) => emp.user_id);
        await updateEmployeeOrder(order);
        console.log('Порядок успешно сохранен');
      } catch (error) {
        console.error('Ошибка сохранения порядка:', error);
        alert('Не удалось сохранить порядок');
      }
    },
    async startPayrollCalculation() {
      this.payrollLoading = true;
      try {
        await calculatePayroll(this.selectedPayrollPeriod);
        setTimeout(async () => {
          await this.fetchPayroll();
          this.payrollLoading = false;
        }, 2000);
      } catch (error) {
        console.error('Ошибка расчета зарплаты:', error);
        this.payrollLoading = false;
      }
    },
    async fetchPayroll() {
      this.payrollLoading = true;
      try {
        const userId = localStorage.getItem('user_id');
        const payroll = await getPayroll(userId);
        this.payrollData = payroll.find(p => p.period === this.selectedPayrollPeriod) || { amount: 0 };
      } catch (error) {
        console.error('Ошибка загрузки зарплаты:', error);
      } finally {
        this.payrollLoading = false;
      }
    },
    async fetchAggregatePayroll() {
      this.aggregateLoading = true;
      try {
        this.aggregatePayrollData = await getAggregatePayroll(this.selectedAggregatePeriod);
      } catch (error) {
        console.error('Ошибка загрузки агрегированных данных о зарплате:', error);
      } finally {
        this.aggregateLoading = false;
      }
    },
    async fetchProductivityReport() {
      this.productivityLoading = true;
      const cacheKey = `productivity_${this.selectedProductivityPeriod}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          this.productivityData = data;
          this.productivityLoading = false;
          return;
        }
      }
      try {
        const userId = localStorage.getItem('user_id');
        this.productivityData = await getProductivityReport(userId, this.selectedProductivityPeriod);
        localStorage.setItem(cacheKey, JSON.stringify({ data: this.productivityData, timestamp: Date.now() }));
      } catch (error) {
        console.error('Ошибка загрузки отчёта о продуктивности:', error);
      } finally {
        this.productivityLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  animation: fadeIn 0.5s ease-out;
}

.employee-card {
  background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
  padding: 15px;
  font-family: 'Gilroy-Medium', sans-serif;
  border-left: 4px solid #1976d2;
}

.chart-card {
  background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
  padding: 15px;
  border-left: 4px solid #42a5f5;
  margin-bottom: 20px;
}

.period-select {
  max-width: 200px;
  display: inline-block;
  margin-right: 10px;
}

.calculate-btn {
  vertical-align: top;
  margin-bottom: 10px;
}

.no-data {
  text-align: center;
  color: #757575;
  margin-top: 20px;
}

.aggregate-table {
  width: 100%;
}

@media (max-width: 600px) {
  .employee-card {
    padding: 10px;
  }
  .chart-card {
    padding: 10px;
  }
  .period-select {
    max-width: 100%;
    margin-bottom: 10px;
  }
  .calculate-btn {
    width: 100%;
  }
}
</style>