<template>
  <div class="bar-chart" :style="{ height: cssHeight }">
    <Bar :data="barData" :options="barOptions" />
  </div>
</template>

<script setup>
/**
 * Тонкая обёртка над vue-chartjs <Bar>.
 *   <BarChart :labels="['Янв', 'Фев']" :datasets="[{ label: 'Доход', data: [1, 2] }]" :options="{...}" />
 * Совместимость со старым вызовом (DashboardPage): :chart-data="{labels, datasets}" :chart-options="{...}".
 */
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({
  /** Подписи по оси X. */
  labels: { type: Array, default: () => [] },
  /** Наборы данных chart.js: [{label, data, backgroundColor?, ...}]. */
  datasets: { type: Array, default: () => [] },
  /** Опции chart.js — поверх значений по умолчанию (неглубокое слияние). */
  options: { type: Object, default: () => ({}) },
  /** Высота: число (px) или CSS-строка. */
  height: { type: [Number, String], default: 300 },
  /** @deprecated используйте labels + datasets */
  chartData: { type: Object, default: null },
  /** @deprecated используйте options */
  chartOptions: { type: Object, default: null },
});

const barData = computed(() => ({
  labels: props.chartData?.labels ?? props.labels,
  datasets: props.chartData?.datasets ?? props.datasets,
}));

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: { y: { beginAtZero: true } },
  ...(props.chartOptions || {}),
  ...props.options,
}));

const cssHeight = computed(() => {
  const h = props.height;
  return typeof h === 'number' || /^\d+$/.test(String(h)) ? `${h}px` : String(h);
});
</script>

<style scoped>
.bar-chart {
  position: relative;
  width: 100%;
}
</style>
