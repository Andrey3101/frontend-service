<template>
  <v-container class="dashboard-container">
    <v-row>
      <v-col>
        <h1>Дашборд</h1>
        <DndContext :collision-detection="closestCenter" @drag-end="onDragEnd">
          <DroppableWrapper droppable-id="employees">
            <v-row>
              <DraggableItem v-for="emp in employeeLoad" :key="emp.user_id" :id="emp.user_id">
                <v-card class="employee-card" v-animate-onscroll="'fadeInUp'">
                  <v-card-text>{{ emp.user_id }}: {{ emp.task_count }} задач</v-card-text>
                </v-card>
              </DraggableItem>
            </v-row>
          </DroppableWrapper>
        </DndContext>

        <!-- График 1: Задачи за неделю -->
        <v-row class="mt-6">
          <v-col>
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Задачи за неделю</v-card-title>
              <v-card-text>
                <BarChart :chart-data="completedLastWeekData" :chart-options="chartOptions" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- График 2: Сумма за неделю -->
        <v-row class="mt-6">
          <v-col>
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Сумма за неделю</v-card-title>
              <v-card-text>
                <BarChart :chart-data="totalCompletedLastWeekData" :chart-options="chartOptionsSum" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- График 3: Задачи за вчера -->
        <v-row class="mt-6">
          <v-col>
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Задачи за вчера</v-card-title>
              <v-card-text>
                <BarChart :chart-data="completedYesterdayData" :chart-options="chartOptions" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- График 4: Сумма за вчера -->
        <v-row class="mt-6">
          <v-col>
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Сумма за вчера</v-card-title>
              <v-card-text>
                <BarChart :chart-data="totalCompletedYesterdayData" :chart-options="chartOptionsSum" />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- График 5: Задачи на сегодня -->
        <v-row class="mt-6">
          <v-col>
            <v-card class="chart-card" v-animate-onscroll="'fadeInUp'">
              <v-card-title>Задачи на сегодня</v-card-title>
              <v-card-text>
                <BarChart :chart-data="inProgressTodayData" :chart-options="chartOptions" />
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
import { getDashboard, updateEmployeeOrder, getTasks } from '../api';

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
          legend: {
            position: 'top',
            labels: {
              font: {
                family: 'Gilroy-Medium',
                size: 14,
              },
              color: '#546e7a',
            },
          },
          title: {
            display: true,
            font: {
              family: 'Gilroy-ExtraBold',
              size: 16,
            },
            color: '#1e88e5',
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              family: 'Gilroy-Medium',
              size: 14,
            },
            bodyFont: {
              family: 'Gilroy-Regular',
              size: 12,
            },
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value} шт.`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Задачи, шт.',
              font: {
                family: 'Gilroy-Medium',
                size: 14,
              },
              color: '#37474f',
            },
            ticks: {
              font: {
                family: 'Gilroy-Regular',
                size: 12,
              },
              color: '#546e7a',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Период',
              font: {
                family: 'Gilroy-Medium',
                size: 14,
              },
              color: '#37474f',
            },
            ticks: {
              font: {
                family: 'Gilroy-Regular',
                size: 12,
              },
              color: '#546e7a',
            },
            grid: {
              display: false,
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
      },
      chartOptionsSum: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.5,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: 'Gilroy-Medium',
                size: 14,
              },
              color: '#546e7a',
            },
          },
          title: {
            display: true,
            font: {
              family: 'Gilroy-ExtraBold',
              size: 16,
            },
            color: '#1e88e5',
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              family: 'Gilroy-Medium',
              size: 14,
            },
            bodyFont: {
              family: 'Gilroy-Regular',
              size: 12,
            },
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value} руб.`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Сумма, руб.',
              font: {
                family: 'Gilroy-Medium',
                size: 14,
              },
              color: '#37474f',
            },
            ticks: {
              font: {
                family: 'Gilroy-Regular',
                size: 12,
              },
              color: '#546e7a',
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Период',
              font: {
                family: 'Gilroy-Medium',
                size: 14,
              },
              color: '#37474f',
            },
            ticks: {
              font: {
                family: 'Gilroy-Regular',
                size: 12,
              },
              color: '#546e7a',
            },
            grid: {
              display: false,
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
      },
    };
  },
  computed: {
    completedLastWeekData() {
      return {
        labels: ['За неделю'],
        datasets: [
          {
            label: 'Задачи',
            backgroundColor: '#1976d2',
            borderColor: '#ffffff',
            borderWidth: 2,
            data: [this.taskStats.completedLastWeek],
            barThickness: 40,
            borderRadius: 6,
            hoverBackgroundColor: '#1565c0',
          },
        ],
      };
    },
    totalCompletedLastWeekData() {
      return {
        labels: ['За неделю'],
        datasets: [
          {
            label: 'Сумма',
            backgroundColor: '#0288d1',
            borderColor: '#ffffff',
            borderWidth: 2,
            data: [this.taskStats.totalCompletedLastWeek],
            barThickness: 40,
            borderRadius: 6,
            hoverBackgroundColor: '#0277bd',
          },
        ],
      };
    },
    completedYesterdayData() {
      return {
        labels: ['За вчера'],
        datasets: [
          {
            label: 'Задачи',
            backgroundColor: '#42a5f5',
            borderColor: '#ffffff',
            borderWidth: 2,
            data: [this.taskStats.completedYesterday],
            barThickness: 40,
            borderRadius: 6,
            hoverBackgroundColor: '#2196f3',
          },
        ],
      };
    },
    totalCompletedYesterdayData() {
      return {
        labels: ['За вчера'],
        datasets: [
          {
            label: 'Сумма',
            backgroundColor: '#4fc3f7',
            borderColor: '#ffffff',
            borderWidth: 2,
            data: [this.taskStats.totalCompletedYesterday],
            barThickness: 40,
            borderRadius: 6,
            hoverBackgroundColor: '#29b6f6',
          },
        ],
      };
    },
    inProgressTodayData() {
      return {
        labels: ['На сегодня'],
        datasets: [
          {
            label: 'Задачи',
            backgroundColor: '#ff9800',
            borderColor: '#ffffff',
            borderWidth: 2,
            data: [this.taskStats.inProgressToday],
            barThickness: 40,
            borderRadius: 6,
            hoverBackgroundColor: '#f57c00',
          },
        ],
      };
    },
  },
  async created() {
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
  methods: {
    async onDragEnd(event) {
      const { active, over } = event;
      if (!over || active.id === active.id) return;

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

@media (max-width: 600px) {
  .employee-card {
    padding: 10px;
  }
  .chart-card {
    padding: 10px;
  }
}
</style>