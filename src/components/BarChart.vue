<template>
  <div class="chart-wrapper">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
  name: 'BarChart',
  components: { Bar },
  props: {
    chartData: {
      type: Object,
      required: true,
    },
    chartOptions: {
      type: Object,
      default: () => ({
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'График задач',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Количество задач',
            },
          },
        },
      }),
    },
  },
};
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 300px; /* Фиксированная высота для графика */
}

/* Анимация появления графика */
.chart-wrapper {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Стили для столбцов (добавляем тень) */
:deep(.chartjs-bar) {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* Стили для фона графика */
:deep(.chartjs-render-monitor) {
  font-family: 'Gilroy-Medium', sans-serif;
  background: linear-gradient(180deg, #f9fafb 0%, #eceff1 100%);
}

/* Стили для заголовка графика */
:deep(.chartjs-title) {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 1.2rem;
  color: #1e88e5;
}

/* Стили для подписей осей */
:deep(.chartjs-axis-label) {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 0.9rem;
  color: #37474f;
}

/* Стили для легенды */
:deep(.chartjs-legend) {
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 0.95rem;
  color: #546e7a;
}

/* Стили для тултипов */
:deep(.chartjs-tooltip) {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 8px;
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 0.9rem;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Адаптация для планшетной версии (600px–959px) */
@media (min-width: 600px) and (max-width: 959px) {
  .chart-wrapper {
    padding: 15px;
    height: 280px; /* Уменьшаем высоту */
  }
  :deep(.chartjs-title) {
    font-size: 1.1rem;
  }
  :deep(.chartjs-axis-label) {
    font-size: 0.85rem;
  }
  :deep(.chartjs-legend) {
    font-size: 0.9rem;
  }
  :deep(.chartjs-tooltip) {
    font-size: 0.85rem;
    padding: 6px;
  }
  :deep(.chartjs-bar) {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* Адаптация для мобильной версии (< 600px) */
@media (max-width: 599px) {
  .chart-wrapper {
    padding: 10px;
    height: 250px; /* Ещё меньше высота */
  }
  :deep(.chartjs-title) {
    font-size: 1rem;
  }
  :deep(.chartjs-axis-label) {
    font-size: 0.8rem;
  }
  :deep(.chartjs-legend) {
    font-size: 0.85rem;
  }
  :deep(.chartjs-tooltip) {
    font-size: 0.8rem;
    padding: 5px;
  }
  :deep(.chartjs-bar) {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}
</style>