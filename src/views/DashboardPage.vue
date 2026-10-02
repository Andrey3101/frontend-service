<template>
  <div>
    <div class="d-flex flex-wrap align-center mb-4 ga-2">
      <div>
        <div class="text-h6">{{ greeting }}</div>
        <div class="text-body-2 text-medium-emphasis text-capitalize">{{ todayLabel }}</div>
      </div>
      <v-spacer />
      <v-btn variant="text" prepend-icon="mdi-refresh" :loading="refreshing" @click="loadAll">Обновить</v-btn>
    </div>

    <!-- Статистика задач -->
    <v-row dense class="mb-2">
      <v-col v-for="card in statCards" :key="card.key" cols="6" md="3">
        <v-card :loading="w.stats.loading" class="h-100" :to="card.to">
          <v-card-text>
            <div class="d-flex align-center text-caption text-medium-emphasis mb-1">
              <v-icon :icon="card.icon" :color="card.color" size="small" class="mr-1" />
              {{ card.title }}
            </div>
            <div class="text-h4 font-weight-bold" :class="card.valueClass">
              {{ w.stats.data ? card.value : '—' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="w.stats.error" cols="12">
        <v-alert type="warning" variant="tonal" density="compact">
          Статистика задач недоступна: {{ w.stats.error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <!-- Активность -->
      <v-col cols="12" lg="8">
        <v-card class="h-100" :loading="w.activity.loading">
          <v-card-title class="d-flex flex-wrap align-center ga-2">
            Активность по задачам
            <v-spacer />
            <v-btn-toggle v-model="activityDays" mandatory density="compact" variant="outlined" color="primary" divided>
              <v-btn :value="7" size="small">7 дн.</v-btn>
              <v-btn :value="30" size="small">30 дн.</v-btn>
              <v-btn :value="90" size="small">90 дн.</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <div v-if="activityHasData" class="chart-box">
              <Line :data="activityChart" :options="activityOptions" />
            </div>
            <WidgetEmpty
              v-else
              :loading="w.activity.loading"
              :error="w.activity.error"
              empty-text="За период не было созданных и завершённых задач"
              @retry="w.activity.load"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Подсказки -->
      <v-col cols="12" lg="4">
        <v-card class="h-100" :loading="w.suggestions.loading">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-lightbulb-on-outline" color="warning" class="mr-2" />
            Обратите внимание
          </v-card-title>
          <v-list v-if="w.suggestions.data?.items.length" density="compact" class="py-0">
            <v-list-item
              v-for="s in w.suggestions.data.items.slice(0, 6)"
              :key="s.task_id"
              :to="{ name: 'task-detail', params: { id: s.task_id } }"
              :title="s.title"
              :subtitle="s.reason"
            >
              <template #prepend>
                <v-icon v-bind="reasonIcon(s.reason)" />
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else>
            <WidgetEmpty
              :loading="w.suggestions.loading"
              :error="w.suggestions.error"
              empty-text="Срочных и просроченных задач нет"
              empty-icon="mdi-check-circle-outline"
              @retry="w.suggestions.load"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Последние задачи -->
      <v-col cols="12" lg="8">
        <v-card class="h-100" :loading="w.recent.loading">
          <v-card-title class="d-flex align-center">
            Последние задачи
            <v-spacer />
            <v-btn variant="text" size="small" append-icon="mdi-arrow-right" :to="{ name: 'tasks' }">Все задачи</v-btn>
          </v-card-title>
          <v-table v-if="w.recent.data?.items.length" density="compact" hover>
            <thead>
              <tr>
                <th>Задача</th>
                <th>Статус</th>
                <th>Срок</th>
                <th class="d-none d-sm-table-cell">Исполнитель</th>
                <th class="d-none d-md-table-cell">Изменена</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in w.recent.data.items" :key="t.id" class="clickable" @click="openTask(t.id)">
                <td class="font-weight-medium">{{ t.title }}</td>
                <td>
                  <v-chip size="x-small" :color="STATUS[t.status]?.color" variant="flat">
                    {{ STATUS[t.status]?.title ?? t.status }}
                  </v-chip>
                </td>
                <td class="text-no-wrap">{{ t.due_date ? formatDate(t.due_date) : '—' }}</td>
                <td class="d-none d-sm-table-cell">{{ t.assignee_name || '—' }}</td>
                <td class="d-none d-md-table-cell text-no-wrap">{{ formatDateTime(t.updated_at) }}</td>
              </tr>
            </tbody>
          </v-table>
          <v-card-text v-else>
            <WidgetEmpty
              :loading="w.recent.loading"
              :error="w.recent.error"
              empty-text="Задач пока нет"
              @retry="w.recent.load"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Финансы за месяц -->
      <v-col cols="12" lg="4">
        <v-card class="h-100" :loading="w.finance.loading">
          <v-card-title class="d-flex align-center">
            Финансы за {{ monthLabel }}
            <v-spacer />
            <v-btn icon="mdi-arrow-right" variant="text" size="small" aria-label="Финансы" :to="{ name: 'finance' }" />
          </v-card-title>
          <v-card-text>
            <template v-if="w.finance.data">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Доходы</span>
                <span class="text-success font-weight-medium">{{ formatMoney(w.finance.data.income) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Расходы</span>
                <span class="text-error font-weight-medium">{{ formatMoney(w.finance.data.expense) }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between">
                <span class="font-weight-medium">Прибыль</span>
                <span class="text-h6 font-weight-bold" :class="w.finance.data.profit < 0 ? 'text-error' : 'text-primary'">
                  {{ formatMoney(w.finance.data.profit) }}
                </span>
              </div>
            </template>
            <WidgetEmpty v-else :loading="w.finance.loading" :error="w.finance.error" @retry="w.finance.load" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Встречи на 7 дней -->
      <v-col cols="12" md="6">
        <v-card class="h-100" :loading="w.meetings.loading">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-calendar-clock" class="mr-2" />
            Встречи на неделю
            <v-spacer />
            <v-btn variant="text" size="small" append-icon="mdi-arrow-right" :to="{ name: 'meetings' }">Все</v-btn>
          </v-card-title>
          <v-list v-if="w.meetings.data?.items.length" density="compact" class="py-0">
            <v-list-item v-for="m in w.meetings.data.items" :key="m.id" :title="m.title">
              <template #prepend>
                <v-chip size="small" variant="tonal" color="primary" class="mr-3 text-no-wrap">
                  {{ meetingWhen(m.start_at) }}
                </v-chip>
              </template>
              <v-list-item-subtitle v-if="m.location">
                <v-icon icon="mdi-map-marker-outline" size="x-small" /> {{ m.location }}
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="w.meetings.data.total > w.meetings.data.items.length" class="text-caption text-medium-emphasis">
              и ещё {{ w.meetings.data.total - w.meetings.data.items.length }}…
            </v-list-item>
          </v-list>
          <v-card-text v-else>
            <WidgetEmpty
              :loading="w.meetings.loading"
              :error="w.meetings.error"
              empty-text="В ближайшие 7 дней встреч нет"
              empty-icon="mdi-calendar-blank-outline"
              @retry="w.meetings.load"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Налоговые сроки -->
      <v-col cols="12" md="6">
        <v-card class="h-100" :loading="w.tax.loading">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-bank-outline" class="mr-2" />
            Ближайшие налоговые сроки
          </v-card-title>
          <v-list v-if="w.tax.data?.length" density="compact" class="py-0">
            <v-list-item v-for="item in w.tax.data" :key="item.date + item.title" :title="item.title" :subtitle="item.description">
              <template #prepend>
                <v-chip size="small" variant="tonal" :color="daysUntil(item.date) <= 7 ? 'error' : 'warning'" class="mr-3 text-no-wrap">
                  {{ formatDate(item.date) }}
                </v-chip>
              </template>
              <template #append>
                <span class="text-caption text-medium-emphasis text-no-wrap">{{ daysUntilText(item.date) }}</span>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else>
            <WidgetEmpty
              :loading="w.tax.loading"
              :error="w.tax.error"
              empty-text="Ближайших налоговых сроков нет"
              @retry="w.tax.load"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
/** Дашборд: независимые виджеты (ошибка одного не ломает остальные). */
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { Line } from 'vue-chartjs';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
// Точечные импорты: barrel 'vuetify/components' затянул бы в чанк все компоненты Vuetify и их стили.
import { VBtn } from 'vuetify/components/VBtn';
import { VIcon } from 'vuetify/components/VIcon';
import { VProgressCircular } from 'vuetify/components/VProgressCircular';
import {
  errorMessage,
  getFinanceSummary,
  getTaskActivity,
  getTaskStats,
  getTaskSuggestions,
  getTaxCalendar,
  listMeetings,
  listTasks,
} from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const router = useRouter();
const auth = useAuthStore();

const STATUS = {
  todo: { title: 'К выполнению', color: 'grey' },
  in_progress: { title: 'В работе', color: 'primary' },
  done: { title: 'Выполнена', color: 'success' },
  cancelled: { title: 'Отменена', color: 'error' },
};
const DATE = 'YYYY-MM-DD';

/** Заглушка виджета: загрузка / ошибка (503 — «не настроено») / пусто. */
const WidgetEmpty = defineComponent({
  name: 'WidgetEmpty',
  props: {
    loading: Boolean,
    error: { type: String, default: '' },
    emptyText: { type: String, default: 'Нет данных' },
    emptyIcon: { type: String, default: 'mdi-information-outline' },
  },
  emits: ['retry'],
  setup(props, { emit }) {
    return () => {
      if (props.loading) {
        return h('div', { class: 'text-center py-6' }, [h(VProgressCircular, { indeterminate: true, color: 'primary' })]);
      }
      if (props.error) {
        return h('div', { class: 'text-center py-6 text-medium-emphasis' }, [
          h(VIcon, { icon: 'mdi-cloud-off-outline', size: 32, class: 'mb-1' }),
          h('div', { class: 'text-body-2' }, 'Нет данных'),
          h('div', { class: 'text-caption mb-2' }, props.error),
          h(VBtn, { size: 'small', variant: 'tonal', onClick: () => emit('retry') }, () => 'Повторить'),
        ]);
      }
      return h('div', { class: 'text-center py-6 text-medium-emphasis' }, [
        h(VIcon, { icon: props.emptyIcon, size: 32, class: 'mb-1' }),
        h('div', { class: 'text-body-2' }, props.emptyText),
      ]);
    };
  },
});

/**
 * Состояние одного виджета. Ошибки не пробрасываются — показываются в самом виджете.
 * @template T
 * @param {() => Promise<T>} loader
 */
function useWidget(loader) {
  const state = reactive({
    data: null,
    loading: false,
    error: '',
    async load() {
      state.loading = true;
      state.error = '';
      try {
        state.data = await loader();
      } catch (err) {
        state.data = null;
        state.error = err?.response?.status === 503 ? 'Сервис не настроен на сервере' : errorMessage(err);
      } finally {
        state.loading = false;
      }
    },
  });
  return state;
}

// ------------------------------------------------------------------ виджеты
const activityDays = ref(30);

async function loadTaxDeadlines() {
  const today = dayjs().format(DATE);
  const year = dayjs().year();
  let items = (await getTaxCalendar({ year })).items.filter((i) => i.date >= today);
  if (items.length < 3) {
    try {
      items = items.concat((await getTaxCalendar({ year: year + 1 })).items);
    } catch {
      // календаря на следующий год может не быть — показываем то, что есть
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
}

const w = {
  stats: useWidget(() => getTaskStats()),
  activity: useWidget(() => getTaskActivity({ days: activityDays.value })),
  recent: useWidget(() => listTasks({ sort: '-updated_at', limit: 5 })),
  suggestions: useWidget(() => getTaskSuggestions()),
  finance: useWidget(() =>
    getFinanceSummary({
      date_from: dayjs().startOf('month').format(DATE),
      date_to: dayjs().endOf('month').format(DATE),
    }),
  ),
  tax: useWidget(loadTaxDeadlines),
  meetings: useWidget(() =>
    listMeetings({
      from: dayjs().toISOString(),
      to: dayjs().add(7, 'day').endOf('day').toISOString(),
      limit: 8,
    }),
  ),
};

const refreshing = ref(false);

async function loadAll() {
  refreshing.value = true;
  await Promise.allSettled(Object.values(w).map((widget) => widget.load()));
  refreshing.value = false;
}

watch(activityDays, () => w.activity.load());

// ------------------------------------------------------------------ заголовок
const greeting = computed(() => {
  const hour = dayjs().hour();
  const part = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  const name = auth.user?.full_name?.split(/\s+/)[0];
  return name ? `${part}, ${name}!` : `${part}!`;
});
const todayLabel = dayjs().format('dddd, D MMMM YYYY');
const monthLabel = dayjs().format('MMMM');

// ------------------------------------------------------------------ статистика
const statCards = computed(() => {
  const s = w.stats.data;
  return [
    {
      key: 'total', title: 'Всего задач', icon: 'mdi-format-list-checks', color: 'primary',
      value: s?.total ?? 0, to: { name: 'tasks' },
    },
    {
      key: 'in_progress', title: 'В работе', icon: 'mdi-progress-clock', color: 'primary',
      value: s?.by_status.in_progress ?? 0, to: { name: 'tasks', query: { status: 'in_progress' } },
    },
    {
      key: 'overdue', title: 'Просрочено', icon: 'mdi-alert-circle-outline', color: 'error',
      value: s?.overdue ?? 0, valueClass: s?.overdue ? 'text-error' : '',
      to: { name: 'tasks', query: { due: 'overdue' } },
    },
    {
      key: 'done_week', title: 'Выполнено за неделю', icon: 'mdi-check-all', color: 'success',
      value: s?.completed_this_week ?? 0, to: { name: 'tasks', query: { status: 'done' } },
    },
  ];
});

// ------------------------------------------------------------------ график
const activityItems = computed(() => w.activity.data?.items ?? []);
const activityHasData = computed(() => activityItems.value.some((i) => i.created || i.completed));

const activityChart = computed(() => ({
  labels: activityItems.value.map((i) => dayjs(i.date).format('DD.MM')),
  datasets: [
    {
      label: 'Создано',
      data: activityItems.value.map((i) => i.created),
      borderColor: '#1e88e5',
      backgroundColor: 'rgba(30, 136, 229, 0.12)',
      fill: true,
      tension: 0.3,
      pointRadius: activityItems.value.length > 31 ? 0 : 3,
    },
    {
      label: 'Завершено',
      data: activityItems.value.map((i) => i.completed),
      borderColor: '#43a047',
      backgroundColor: 'rgba(67, 160, 71, 0.12)',
      fill: true,
      tension: 0.3,
      pointRadius: activityItems.value.length > 31 ? 0 : 3,
    },
  ],
}));

const activityOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { position: 'bottom' } },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { ticks: { maxRotation: 0, autoSkip: true } },
  },
};

// ------------------------------------------------------------------ помощники
function openTask(id) {
  router.push({ name: 'task-detail', params: { id } });
}

function meetingWhen(iso) {
  const d = dayjs(iso);
  if (d.isSame(dayjs(), 'day')) return `Сегодня ${d.format('HH:mm')}`;
  if (d.isSame(dayjs().add(1, 'day'), 'day')) return `Завтра ${d.format('HH:mm')}`;
  return d.format('dd, DD.MM HH:mm');
}

function reasonIcon(reason) {
  return /просроч/i.test(reason)
    ? { icon: 'mdi-alert-circle', color: 'error' }
    : { icon: 'mdi-clock-alert-outline', color: 'warning' };
}

function daysUntil(date) {
  return dayjs(date).diff(dayjs().startOf('day'), 'day');
}

function daysUntilText(date) {
  const n = daysUntil(date);
  if (n <= 0) return 'сегодня';
  if (n === 1) return 'завтра';
  return `через ${n} дн.`;
}

onMounted(loadAll);
</script>

<style scoped>
.chart-box {
  position: relative;
  height: 300px;
}
.clickable {
  cursor: pointer;
}
</style>
