<template>
  <div>
    <!-- Статистика -->
    <v-row dense class="mb-2">
      <v-col v-for="card in statCards" :key="card.key" cols="6" sm="4" md="2">
        <v-card
          :loading="statsLoading"
          :color="card.active ? 'primary' : undefined"
          :variant="card.active ? 'tonal' : 'elevated'"
          class="h-100"
          @click="card.apply"
        >
          <v-card-text class="py-3">
            <div class="d-flex align-center text-caption text-medium-emphasis">
              <v-icon :icon="card.icon" :color="card.color" size="small" class="mr-1" />
              {{ card.title }}
            </div>
            <div class="text-h5 font-weight-bold" :class="card.valueClass">
              {{ stats ? card.value : '—' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Активный таймер -->
    <v-alert
      v-if="activeEntry"
      type="success"
      variant="tonal"
      icon="mdi-timer-outline"
      class="mb-4"
    >
      <div class="d-flex flex-wrap align-center ga-2">
        <span>
          Идёт таймер: <strong>{{ activeEntry.task_title || 'задача' }}</strong> —
          <span class="font-weight-medium timer-digits">{{ elapsed(activeEntry.started_at) }}</span>
        </span>
        <v-spacer />
        <v-btn size="small" variant="text" :to="taskLink(activeEntry.task_id)">Открыть</v-btn>
        <v-btn
          size="small"
          color="error"
          variant="flat"
          prepend-icon="mdi-stop"
          :loading="timerBusyId === activeEntry.task_id"
          @click="stopTimer(activeEntry.task_id)"
        >
          Остановить
        </v-btn>
      </div>
    </v-alert>

    <!-- Подсказки -->
    <v-expansion-panels v-if="suggestions.length" class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon icon="mdi-lightbulb-on-outline" color="warning" class="mr-2" />
          Обратите внимание
          <v-chip size="small" color="warning" variant="tonal" class="ml-2">{{ suggestions.length }}</v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list density="compact" class="py-0">
            <v-list-item
              v-for="s in suggestions"
              :key="s.task_id"
              :to="taskLink(s.task_id)"
              :title="s.title"
              class="px-0"
            >
              <template #append>
                <v-chip size="small" :color="reasonColor(s.reason)" variant="tonal">{{ s.reason }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card>
      <v-card-title class="d-flex flex-wrap align-center ga-2">
        Задачи
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate(false)">Создать задачу</v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-repeat" @click="openCreate(true)">Серия</v-btn>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" aria-label="Ещё" :loading="taxBusy" />
          </template>
          <v-list density="compact">
            <v-list-item
              v-for="year in taxYears"
              :key="year"
              prepend-icon="mdi-bank-outline"
              :title="`Создать налоговые напоминания на ${year}`"
              @click="createTaxReminders(year)"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-file-delimited-outline"
              title="Экспорт видимого списка в CSV"
              :disabled="!tasks.length"
              @click="exportCsv"
            />
          </v-list>
        </v-menu>
      </v-card-title>

      <v-card-text>
        <!-- Фильтры -->
        <v-row dense class="mb-1">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.search"
              label="Поиск по названию и описанию"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              density="compact"
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select v-model="filters.status" :items="STATUS_FILTER_ITEMS" label="Статус" hide-details density="compact" />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select v-model="filters.priority" :items="PRIORITY_FILTER_ITEMS" label="Приоритет" hide-details density="compact" />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select v-model="filters.due" :items="DUE_FILTER_ITEMS" label="Срок" hide-details density="compact" />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select v-model="filters.sort" :items="SORT_ITEMS" label="Сортировка" hide-details density="compact" />
          </v-col>
          <v-col v-if="auth.isAdmin" cols="12" sm="6" md="4">
            <v-autocomplete
              v-model="filters.assigneeId"
              :items="userItems"
              :loading="usersLoading"
              label="Исполнитель"
              clearable
              hide-details
              density="compact"
              :disabled="filters.mine"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3" class="d-flex align-center">
            <v-switch
              v-model="filters.mine"
              color="primary"
              label="Только мои"
              hide-details
              density="compact"
              inset
            />
          </v-col>
          <v-col v-if="hasFilters" cols="12" sm="auto" class="d-flex align-center">
            <v-btn variant="text" size="small" prepend-icon="mdi-filter-remove-outline" @click="resetFilters">
              Сбросить фильтры
            </v-btn>
          </v-col>
        </v-row>

        <!-- Массовое назначение (owner/admin) -->
        <v-expand-transition>
          <v-card
            v-if="auth.isAdmin && selected.length"
            color="primary"
            variant="tonal"
            rounded="lg"
            class="pa-3 mb-3 d-flex flex-wrap align-center ga-3"
          >
            <span class="font-weight-medium">Выбрано: {{ selected.length }}</span>
            <v-autocomplete
              v-model="bulkAssigneeId"
              :items="userItems"
              label="Назначить исполнителя"
              hide-details
              density="compact"
              class="bulk-select"
            />
            <v-btn
              color="primary"
              variant="flat"
              :disabled="!bulkAssigneeId || selected.length > 100"
              :loading="bulkBusy"
              @click="bulkAssign"
            >
              Назначить
            </v-btn>
            <v-btn variant="text" @click="selected = []">Снять выделение</v-btn>
            <span v-if="selected.length > 100" class="text-caption text-error">Не более 100 задач за раз</span>
          </v-card>
        </v-expand-transition>

        <v-data-table-server
          v-model="selected"
          v-model:page="page"
          v-model:items-per-page="limit"
          :headers="headers"
          :items="tasks"
          :items-length="total"
          :items-per-page-options="[10, 20, 50, 100]"
          :loading="tableLoading"
          :show-select="auth.isAdmin"
          item-value="id"
          loading-text="Загрузка…"
          no-data-text="Задач не найдено"
          hover
          class="tasks-table"
          @click:row="onRowClick"
        >
          <template #[`item.title`]="{ item }">
            <div class="py-2">
              <router-link :to="taskLink(item.id)" class="task-link font-weight-medium" @click.stop>
                {{ item.title }}
              </router-link>
              <div class="d-flex flex-wrap align-center ga-1 mt-1">
                <v-chip v-for="tag in item.tags" :key="tag" size="x-small" variant="outlined">#{{ tag }}</v-chip>
                <span v-if="item.comments_count" class="text-caption text-medium-emphasis">
                  <v-icon icon="mdi-comment-outline" size="x-small" /> {{ item.comments_count }}
                </span>
              </div>
            </div>
          </template>

          <template #[`item.status`]="{ item }">
            <v-menu location="bottom start">
              <template #activator="{ props: menuProps }">
                <v-chip
                  v-bind="menuProps"
                  size="small"
                  :color="STATUS[item.status]?.color"
                  variant="flat"
                  append-icon="mdi-menu-down"
                  :disabled="statusBusyId === item.id"
                  @click.stop
                >
                  {{ STATUS[item.status]?.title ?? item.status }}
                </v-chip>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="(meta, key) in STATUS"
                  :key="key"
                  :title="meta.title"
                  :active="key === item.status"
                  @click="changeStatus(item, key)"
                >
                  <template #prepend>
                    <v-icon :icon="meta.icon" :color="meta.color" size="small" />
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <template #[`item.priority`]="{ item }">
            <v-chip size="small" :color="PRIORITY[item.priority]?.color" variant="tonal">
              {{ PRIORITY[item.priority]?.title ?? item.priority }}
            </v-chip>
          </template>

          <template #[`item.due_date`]="{ item }">
            <span :class="{ 'text-error font-weight-medium': isOverdue(item) }">
              {{ item.due_date ? formatDateTime(item.due_date) : '—' }}
            </span>
          </template>

          <template #[`item.assignee_name`]="{ item }">
            {{ item.assignee_name || (item.assignee_id ? 'Назначен' : '—') }}
          </template>

          <template #[`item.total_minutes`]="{ item }">
            <span :class="{ 'text-success font-weight-medium': isTracking(item) }">
              {{ formatMinutes(liveMinutes(item)) }}
            </span>
          </template>

          <template #[`item.actions`]="{ item }">
            <div class="d-flex justify-end text-no-wrap">
              <v-btn
                v-if="isTracking(item)"
                icon="mdi-stop"
                size="small"
                variant="text"
                color="error"
                aria-label="Остановить таймер"
                :loading="timerBusyId === item.id"
                @click.stop="stopTimer(item.id)"
              />
              <v-btn
                v-else
                icon="mdi-play"
                size="small"
                variant="text"
                color="success"
                aria-label="Запустить таймер"
                :loading="timerBusyId === item.id"
                @click.stop="startTimer(item)"
              />
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                aria-label="Редактировать"
                :disabled="!canModify(item)"
                @click.stop="openEdit(item)"
              />
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                aria-label="Удалить"
                :disabled="!canModify(item)"
                @click.stop="askDelete(item)"
              />
            </div>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- Создание / редактирование -->
    <v-dialog v-model="formDialog" max-width="720" persistent scrollable>
      <TaskForm
        v-if="formDialog"
        :task="editingTask"
        :users="auth.isAdmin ? users : null"
        :recurring="formRecurring"
        @saved="onSaved"
        @cancel="formDialog = false"
      />
    </v-dialog>

    <!-- Удаление -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title>Удалить задачу?</v-card-title>
        <v-card-text>
          «{{ toDelete?.title }}» будет удалена вместе с комментариями и учётом времени. Действие необратимо.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
/** Список задач: фильтры, статистика, подсказки, таймер, массовое назначение, налоговые напоминания. */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
  bulkAssignTasks,
  createTaxReminderTasks,
  deleteTask,
  getActiveTimeEntries,
  getTaskStats,
  getTaskSuggestions,
  listTasks,
  listUsers,
  startTimeTracking,
  stopTimeTracking,
  updateTask,
} from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { debounce } from '@/utils/debounce.js';
import { downloadCsv } from '@/utils/csv.js';
import { formatDateTime, formatMinutes } from '@/utils/format.js';
import TaskForm from '@/components/TaskForm.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notify = useNotifyStore();

// ------------------------------------------------------------------ справочники
const STATUS = {
  todo: { title: 'К выполнению', color: 'grey', icon: 'mdi-checkbox-blank-circle-outline' },
  in_progress: { title: 'В работе', color: 'primary', icon: 'mdi-progress-clock' },
  done: { title: 'Выполнена', color: 'success', icon: 'mdi-check-circle' },
  cancelled: { title: 'Отменена', color: 'error', icon: 'mdi-close-circle-outline' },
};
const PRIORITY = {
  low: { title: 'Низкий', color: 'grey' },
  medium: { title: 'Средний', color: 'info' },
  high: { title: 'Высокий', color: 'warning' },
  urgent: { title: 'Срочный', color: 'error' },
};
const ACTIVE_STATUSES = 'todo,in_progress';
const STATUS_FILTER_ITEMS = [
  { title: 'Все', value: '' },
  { title: 'Активные', value: ACTIVE_STATUSES },
  ...Object.entries(STATUS).map(([value, m]) => ({ title: m.title, value })),
];
const PRIORITY_FILTER_ITEMS = [
  { title: 'Все', value: '' },
  ...Object.entries(PRIORITY).map(([value, m]) => ({ title: m.title, value })),
];
const DUE_FILTER_ITEMS = [
  { title: 'Любой', value: '' },
  { title: 'Просроченные', value: 'overdue' },
  { title: 'Сегодня', value: 'today' },
  { title: 'Ближайшие 7 дней', value: 'week' },
];
const SORT_ITEMS = [
  { title: 'Сначала новые', value: '-created_at' },
  { title: 'Сначала старые', value: 'created_at' },
  { title: 'Срок: ближайшие', value: 'due_date' },
  { title: 'Срок: дальние', value: '-due_date' },
  { title: 'По приоритету', value: 'priority' },
  { title: 'Недавно изменённые', value: '-updated_at' },
];

const headers = computed(() => [
  { title: 'Задача', key: 'title', sortable: false },
  { title: 'Статус', key: 'status', sortable: false, width: 150 },
  { title: 'Приоритет', key: 'priority', sortable: false, width: 120 },
  { title: 'Срок', key: 'due_date', sortable: false, width: 150 },
  { title: 'Исполнитель', key: 'assignee_name', sortable: false },
  { title: 'Время', key: 'total_minutes', sortable: false, width: 110 },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 140 },
]);

function taskLink(id) {
  return { name: 'task-detail', params: { id } };
}

// ------------------------------------------------------------------ фильтры
function defaultFilters() {
  return {
    search: '',
    status: '',
    priority: '',
    due: '',
    sort: '-created_at',
    mine: !auth.isAdmin,
    assigneeId: null,
  };
}
const filters = reactive(defaultFilters());

const hasFilters = computed(() => {
  const d = defaultFilters();
  return Object.keys(d).some((k) => (filters[k] || '') !== (d[k] || ''));
});

function resetFilters() {
  Object.assign(filters, defaultFilters());
}

/** Начальные фильтры из ссылки (например, с дашборда: /tasks?status=in_progress&due=overdue). */
function applyRouteQuery() {
  const q = route.query;
  if (typeof q.status === 'string' && STATUS_FILTER_ITEMS.some((i) => i.value === q.status)) filters.status = q.status;
  if (typeof q.priority === 'string' && PRIORITY[q.priority]) filters.priority = q.priority;
  if (typeof q.due === 'string' && DUE_FILTER_ITEMS.some((i) => i.value === q.due)) filters.due = q.due;
  if (q.mine === 'true' || q.mine === '1') filters.mine = true;
  if (q.mine === 'false' || q.mine === '0') filters.mine = false;
}
applyRouteQuery(); // до регистрации watcher-ов — без лишнего запроса

// Переход на /tasks?… с этой же страницы (уведомление, ссылка в меню) переиспользует компонент —
// применяем новые параметры ссылки; смену фильтров подхватят watcher-ы ниже.
watch(
  () => route.query,
  (query, prev) => {
    // При уходе со страницы route меняется до размонтирования — такие изменения пропускаем.
    if (route.name !== 'tasks' || JSON.stringify(query) === JSON.stringify(prev)) return;
    Object.assign(filters, defaultFilters());
    applyRouteQuery();
  },
);

function dueRange() {
  const now = dayjs();
  switch (filters.due) {
    case 'overdue':
      return { due_to: now.toISOString() };
    case 'today':
      return { due_from: now.startOf('day').toISOString(), due_to: now.add(1, 'day').startOf('day').toISOString() };
    case 'week':
      return { due_from: now.startOf('day').toISOString(), due_to: now.add(7, 'day').endOf('day').toISOString() };
    default:
      return {};
  }
}

function queryParams() {
  let status = filters.status;
  // «Просроченные» имеют смысл только для незавершённых задач (как в /tasks/stats).
  if (filters.due === 'overdue' && !status) status = ACTIVE_STATUSES;
  return {
    status,
    priority: filters.priority,
    search: filters.search?.trim(),
    mine: filters.mine || undefined,
    assignee_id: !filters.mine && auth.isAdmin ? filters.assigneeId : undefined,
    sort: filters.sort,
    ...dueRange(),
  };
}

// ------------------------------------------------------------------ список
const tasks = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const tableLoading = ref(false);
const selected = ref([]);
/** Момент загрузки списка — для «живого» времени активного таймера. */
const tasksLoadedAt = ref(Date.now());

let requestSeq = 0;
async function loadTasks() {
  const seq = ++requestSeq;
  tableLoading.value = true;
  try {
    const data = await listTasks({ ...queryParams(), page: page.value, limit: limit.value });
    if (seq !== requestSeq) return;
    tasks.value = data.items;
    total.value = data.total;
    tasksLoadedAt.value = Date.now();
  } catch (err) {
    if (seq === requestSeq) notify.error(err);
  } finally {
    if (seq === requestSeq) tableLoading.value = false;
  }
}

function reloadFromFirstPage() {
  selected.value = [];
  if (page.value !== 1) {
    page.value = 1;
  } else {
    loadTasks();
  }
}
const debouncedReload = debounce(reloadFromFirstPage, 400);

watch([page, limit], loadTasks);
watch(
  () => [filters.status, filters.priority, filters.due, filters.sort, filters.mine, filters.assigneeId],
  reloadFromFirstPage,
);
watch(() => filters.search, debouncedReload);

function onRowClick(_event, { item }) {
  router.push(taskLink(item.id));
}

function canModify(task) {
  const me = auth.user?.id;
  return auth.isAdmin || task.created_by === me || task.assignee_id === me;
}

function isOverdue(task) {
  return Boolean(task.due_date) && ['todo', 'in_progress'].includes(task.status) && new Date(task.due_date).getTime() < now.value;
}

/** Обновить всё, что зависит от задач. */
function refreshAll() {
  loadTasks();
  loadStats();
  loadSuggestions();
}

// ------------------------------------------------------------------ статистика
const stats = ref(null);
const statsLoading = ref(false);

async function loadStats() {
  statsLoading.value = true;
  try {
    stats.value = await getTaskStats();
  } catch (err) {
    stats.value = null;
    notify.error(err);
  } finally {
    statsLoading.value = false;
  }
}

function setQuickFilter(status, due) {
  Object.assign(filters, { status, due });
}

const statCards = computed(() => {
  const s = stats.value;
  return [
    {
      key: 'total', title: 'Всего', icon: 'mdi-format-list-checks', color: 'primary',
      value: s?.total ?? 0, active: !filters.status && !filters.due,
      apply: () => setQuickFilter('', ''),
    },
    {
      key: 'todo', title: 'К выполнению', icon: STATUS.todo.icon, color: 'grey',
      value: s?.by_status.todo ?? 0, active: filters.status === 'todo' && !filters.due,
      apply: () => setQuickFilter('todo', ''),
    },
    {
      key: 'in_progress', title: 'В работе', icon: STATUS.in_progress.icon, color: 'primary',
      value: s?.by_status.in_progress ?? 0, active: filters.status === 'in_progress' && !filters.due,
      apply: () => setQuickFilter('in_progress', ''),
    },
    {
      key: 'overdue', title: 'Просрочено', icon: 'mdi-alert-circle-outline', color: 'error',
      value: s?.overdue ?? 0, valueClass: s?.overdue ? 'text-error' : '', active: filters.due === 'overdue',
      apply: () => setQuickFilter(ACTIVE_STATUSES, 'overdue'),
    },
    {
      key: 'today', title: 'Срок сегодня', icon: 'mdi-calendar-today', color: 'warning',
      value: s?.due_today ?? 0, active: filters.due === 'today',
      apply: () => setQuickFilter(ACTIVE_STATUSES, 'today'),
    },
    {
      key: 'week', title: 'Выполнено за неделю', icon: 'mdi-check-all', color: 'success',
      value: s?.completed_this_week ?? 0, active: filters.status === 'done' && !filters.due,
      apply: () => setQuickFilter('done', ''),
    },
  ];
});

// ------------------------------------------------------------------ подсказки
const suggestions = ref([]);

async function loadSuggestions() {
  try {
    suggestions.value = (await getTaskSuggestions()).items;
  } catch (err) {
    suggestions.value = [];
    notify.error(err);
  }
}

function reasonColor(reason) {
  if (/просроч/i.test(reason)) return 'error';
  if (/срок/i.test(reason)) return 'warning';
  return 'info';
}

// ------------------------------------------------------------------ пользователи (owner/admin)
const users = ref([]);
const usersLoading = ref(false);
const userItems = computed(() =>
  users.value
    .filter((u) => u.is_active)
    .map((u) => ({ title: u.id === auth.user?.id ? `${u.full_name} (я)` : u.full_name, value: u.id })),
);

async function loadUsers() {
  if (!auth.isAdmin) return;
  usersLoading.value = true;
  try {
    users.value = (await listUsers({ limit: 100 })).items;
  } catch (err) {
    notify.error(err);
  } finally {
    usersLoading.value = false;
  }
}

// ------------------------------------------------------------------ массовое назначение
const bulkAssigneeId = ref(null);
const bulkBusy = ref(false);

async function bulkAssign() {
  const user = users.value.find((u) => u.id === bulkAssigneeId.value);
  if (!user || !selected.value.length) return;
  bulkBusy.value = true;
  try {
    const { updated } = await bulkAssignTasks({
      task_ids: [...selected.value],
      assignee_id: user.id,
      assignee_name: user.full_name,
    });
    notify.success(updated ? `Назначено задач: ${updated}` : 'Задачи уже назначены этому исполнителю');
    selected.value = [];
    bulkAssigneeId.value = null;
    loadTasks();
  } catch (err) {
    notify.error(err);
  } finally {
    bulkBusy.value = false;
  }
}

// ------------------------------------------------------------------ смена статуса
const statusBusyId = ref(null);

async function changeStatus(task, status) {
  if (status === task.status) return;
  statusBusyId.value = task.id;
  try {
    const updated = await updateTask(task.id, { status });
    const i = tasks.value.findIndex((t) => t.id === task.id);
    if (i >= 0) tasks.value[i] = updated;
    notify.success(`«${updated.title}»: ${STATUS[status].title.toLowerCase()}`);
    loadStats();
    loadSuggestions();
  } catch (err) {
    notify.error(err);
  } finally {
    statusBusyId.value = null;
  }
}

// ------------------------------------------------------------------ таймер
const activeEntry = ref(null);
const timerBusyId = ref(null);
const now = ref(Date.now());
let tickTimer = null;

function isTracking(task) {
  return activeEntry.value?.task_id === task.id;
}

function liveMinutes(task) {
  const base = task.total_minutes ?? 0;
  if (!isTracking(task)) return base;
  return base + Math.max(0, Math.floor((now.value - tasksLoadedAt.value) / 60000));
}

function elapsed(startedAt) {
  const sec = Math.max(0, Math.floor((now.value - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

async function loadActive() {
  try {
    const { items } = await getActiveTimeEntries();
    activeEntry.value = items[0] ?? null;
  } catch (err) {
    activeEntry.value = null;
    notify.error(err);
  }
}

async function startTimer(task) {
  timerBusyId.value = task.id;
  try {
    activeEntry.value = await startTimeTracking(task.id);
    notify.success(`Таймер запущен: «${task.title}»`);
    loadTasks(); // предыдущий таймер (если был) остановлен — обновить время в списке
  } catch (err) {
    notify.error(err);
  } finally {
    timerBusyId.value = null;
  }
}

async function stopTimer(taskId) {
  timerBusyId.value = taskId;
  try {
    const entry = await stopTimeTracking({ task_id: taskId });
    notify.success(`Таймер остановлен: ${formatMinutes(entry.duration_minutes)}`);
    loadTasks();
  } catch (err) {
    notify.error(err);
  } finally {
    timerBusyId.value = null;
    loadActive();
  }
}

// ------------------------------------------------------------------ создание / редактирование
const formDialog = ref(false);
const editingTask = ref(null);
const formRecurring = ref(false);

function openCreate(recurring) {
  editingTask.value = null;
  formRecurring.value = recurring;
  formDialog.value = true;
}

function openEdit(task) {
  editingTask.value = task;
  formRecurring.value = false;
  formDialog.value = true;
}

function onSaved() {
  formDialog.value = false;
  refreshAll();
}

// ------------------------------------------------------------------ удаление
const deleteDialog = ref(false);
const toDelete = ref(null);
const deleting = ref(false);

function askDelete(task) {
  toDelete.value = task;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await deleteTask(toDelete.value.id);
    notify.success('Задача удалена');
    deleteDialog.value = false;
    selected.value = selected.value.filter((id) => id !== toDelete.value.id);
    if (activeEntry.value?.task_id === toDelete.value.id) loadActive();
    if (tasks.value.length === 1 && page.value > 1) {
      page.value -= 1; // загрузку запустит watcher
    } else {
      loadTasks();
    }
    loadStats();
    loadSuggestions();
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

// ------------------------------------------------------------------ налоговые напоминания
const currentYear = dayjs().year();
const taxYears = [currentYear, currentYear + 1];
const taxBusy = ref(false);

async function createTaxReminders(year) {
  taxBusy.value = true;
  try {
    const { items } = await createTaxReminderTasks({ year });
    if (items.length) {
      notify.success(`Создано напоминаний на ${year} год: ${items.length}`);
      refreshAll();
    } else {
      notify.info(`Напоминания на ${year} год уже созданы`);
    }
  } catch (err) {
    notify.error(err);
  } finally {
    taxBusy.value = false;
  }
}

// ------------------------------------------------------------------ экспорт
function exportCsv() {
  downloadCsv(
    tasks.value,
    [
      { key: 'title', title: 'Задача' },
      { key: 'status', title: 'Статус', format: (v) => STATUS[v]?.title ?? v },
      { key: 'priority', title: 'Приоритет', format: (v) => PRIORITY[v]?.title ?? v },
      { key: 'due_date', title: 'Срок', format: (v) => (v ? formatDateTime(v) : '') },
      { key: 'assignee_name', title: 'Исполнитель' },
      { key: 'created_by_name', title: 'Автор' },
      { key: 'tags', title: 'Теги', format: (v) => (v ?? []).join(', ') },
      { key: 'total_minutes', title: 'Время, мин', format: (v) => v ?? 0 },
      { key: 'created_at', title: 'Создана', format: (v) => formatDateTime(v) },
      { key: 'completed_at', title: 'Выполнена', format: (v) => (v ? formatDateTime(v) : '') },
    ],
    `tasks-${dayjs().format('YYYY-MM-DD')}.csv`,
  );
}

// ------------------------------------------------------------------ жизненный цикл
onMounted(() => {
  loadTasks();
  loadStats();
  loadSuggestions();
  loadActive();
  loadUsers();
  tickTimer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(tickTimer);
  debouncedReload.cancel();
});
</script>

<style scoped>
.task-link {
  color: inherit;
  text-decoration: none;
}
.task-link:hover {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}
.tasks-table :deep(tbody tr) {
  cursor: pointer;
}
.timer-digits {
  font-variant-numeric: tabular-nums;
}
.bulk-select {
  min-width: 240px;
  max-width: 360px;
}
</style>
