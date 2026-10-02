<template>
  <div>
    <v-card>
      <v-card-text>
        <div class="d-flex flex-wrap align-center ga-2 mb-3">
          <v-select
            v-model="filterType"
            :items="TYPE_FILTER_ITEMS"
            label="Тип отчёта"
            hide-details
            density="compact"
            class="type-filter"
          />
          <v-spacer />
          <v-btn color="primary" prepend-icon="mdi-file-chart-outline" @click="openGenerate">Сформировать отчёт</v-btn>
        </div>

        <v-data-table-server
          v-model:page="page"
          v-model:items-per-page="limit"
          :headers="headers"
          :items="reports"
          :items-length="total"
          :items-per-page-options="[10, 20, 50, 100]"
          :loading="loading"
          loading-text="Загрузка…"
          no-data-text="Отчётов пока нет — сформируйте первый"
          item-value="id"
          hover
          class="clickable-rows"
          @click:row="onRowClick"
        >
          <template #[`item.title`]="{ item }">
            <span class="font-weight-medium">{{ item.title }}</span>
          </template>
          <template #[`item.type`]="{ item }">
            <v-chip size="small" variant="tonal" :color="typeMeta(item.type).color" :prepend-icon="typeMeta(item.type).icon">
              {{ typeMeta(item.type).title }}
            </v-chip>
          </template>
          <template #[`item.period`]="{ item }">
            {{ formatDate(item.period_from) }} — {{ formatDate(item.period_to) }}
          </template>
          <template #[`item.created_at`]="{ item }">{{ formatDateTime(item.created_at) }}</template>
          <template #[`item.actions`]="{ item }">
            <div class="d-flex justify-end text-no-wrap">
              <v-btn
                icon="mdi-file-pdf-box"
                size="small"
                variant="text"
                aria-label="Скачать PDF"
                :loading="pdfLoading === item.id"
                @click.stop="downloadPdf(item)"
              />
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                aria-label="Удалить"
                @click.stop="askDelete(item)"
              />
            </div>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- Генерация отчёта -->
    <v-dialog v-model="generateDialog" max-width="560" :persistent="generating">
      <v-card>
        <v-card-title>Новый отчёт</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="generate">
            <v-select
              v-model="form.type"
              :items="TYPE_ITEMS"
              label="Тип отчёта *"
              :hint="typeMeta(form.type).hint"
              persistent-hint
              class="mb-3"
            />
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-btn
                v-for="preset in PRESETS"
                :key="preset.key"
                size="small"
                color="primary"
                :variant="activePreset === preset.key ? 'flat' : 'outlined'"
                @click="applyPreset(preset.key)"
              >
                {{ preset.title }}
              </v-btn>
            </div>
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model="form.period_from"
                  type="date"
                  label="С *"
                  :rules="[rules.required]"
                  @update:model-value="activePreset = ''"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="form.period_to"
                  type="date"
                  label="По *"
                  :rules="[rules.required, rules.periodOrder]"
                  @update:model-value="activePreset = ''"
                />
              </v-col>
            </v-row>
            <v-text-field
              v-model="form.title"
              label="Название"
              placeholder="По умолчанию — тип и период"
              persistent-placeholder
              :rules="[rules.max255]"
            />
          </v-form>
          <v-alert v-if="generateError" type="error" variant="tonal" density="compact" class="mt-2">
            {{ generateError }}
          </v-alert>
          <div v-if="generating" class="text-body-2 text-medium-emphasis mt-2">
            Собираем данные… Это может занять до пары минут.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="generating" @click="generateDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="generating" @click="generate">Сформировать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Удалить отчёт?</v-card-title>
        <v-card-text v-if="toDelete">«{{ toDelete.title }}» будет удалён без возможности восстановления.</v-card-text>
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
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { deleteReport, downloadReportPdf, errorMessage, generateReport, listReports } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDate, formatDateTime } from '@/utils/format.js';

const router = useRouter();
const notify = useNotifyStore();

const DATE = 'YYYY-MM-DD';

const TYPES = {
  tasks: {
    title: 'Задачи',
    icon: 'mdi-checkbox-marked-outline',
    color: 'primary',
    hint: 'Созданные и завершённые задачи, просрочки, загрузка исполнителей',
  },
  finance: {
    title: 'Финансы',
    icon: 'mdi-cash-multiple',
    color: 'success',
    hint: 'Доходы, расходы и прибыль за период по категориям и месяцам',
  },
  time: {
    title: 'Учёт времени',
    icon: 'mdi-timer-outline',
    color: 'info',
    hint: 'Затраченное время по задачам',
  },
  clients: {
    title: 'Клиенты',
    icon: 'mdi-account-group-outline',
    color: 'deep-purple',
    hint: 'Выручка и документы по клиентам',
  },
  inventory: {
    title: 'Склад',
    icon: 'mdi-warehouse',
    color: 'orange',
    hint: 'Остатки, движение товаров и позиции с низким остатком',
  },
};
const TYPE_ITEMS = Object.entries(TYPES).map(([value, t]) => ({ title: t.title, value }));
const TYPE_FILTER_ITEMS = [{ title: 'Все типы', value: '' }, ...TYPE_ITEMS];

function typeMeta(type) {
  return TYPES[type] ?? { title: type, icon: 'mdi-file-document-outline', color: 'grey', hint: '' };
}

// ------------------------------------------------------------------ список
const headers = [
  { title: 'Название', key: 'title', sortable: false },
  { title: 'Тип', key: 'type', sortable: false, width: 170 },
  { title: 'Период', key: 'period', sortable: false, width: 220 },
  { title: 'Создан', key: 'created_at', sortable: false, width: 160 },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 100 },
];

const filterType = ref('');
const reports = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const loading = ref(false);

let requestSeq = 0;
async function load() {
  const seq = ++requestSeq;
  loading.value = true;
  try {
    const data = await listReports({ type: filterType.value, page: page.value, limit: limit.value });
    if (seq !== requestSeq) return;
    reports.value = data.items;
    total.value = data.total;
  } catch (err) {
    if (seq === requestSeq) notify.error(err);
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

watch([page, limit], load);
watch(filterType, () => {
  if (page.value !== 1) page.value = 1;
  else load();
});

function onRowClick(_event, { item }) {
  router.push({ name: 'report-detail', params: { id: item.id } });
}

// ------------------------------------------------------------------ генерация
const PRESETS = [
  { key: 'month', title: 'Текущий месяц' },
  { key: 'prevMonth', title: 'Прошлый месяц' },
  { key: 'quarter', title: 'Квартал' },
  { key: 'year', title: 'Год' },
];

const generateDialog = ref(false);
const generating = ref(false);
const generateError = ref('');
const formRef = ref(null);
const activePreset = ref('month');
const form = reactive({ type: 'tasks', period_from: '', period_to: '', title: '' });

const rules = {
  required: (v) => Boolean(v) || 'Обязательное поле',
  periodOrder: (v) => !v || !form.period_from || form.period_from <= v || 'Окончание раньше начала',
  max255: (v) => !v || String(v).trim().length <= 255 || 'Не более 255 символов',
};

function applyPreset(key) {
  const now = dayjs();
  // От 1-го числа: month(n) у 31-го числа переполняется в следующий месяц.
  const quarterStart = now.startOf('month').month(Math.floor(now.month() / 3) * 3);
  const ranges = {
    month: [now.startOf('month'), now.endOf('month')],
    prevMonth: [now.subtract(1, 'month').startOf('month'), now.subtract(1, 'month').endOf('month')],
    quarter: [quarterStart, quarterStart.add(2, 'month').endOf('month')],
    year: [now.startOf('year'), now.endOf('year')],
  };
  const [from, to] = ranges[key];
  form.period_from = from.format(DATE);
  form.period_to = to.format(DATE);
  activePreset.value = key; // ручной ввод дат сбрасывает пресет через @update:model-value
}

function openGenerate() {
  form.type = filterType.value || 'tasks';
  form.title = '';
  generateError.value = '';
  applyPreset('month');
  generateDialog.value = true;
}

function generateErrorText(err) {
  const status = err?.response?.status;
  if (status === 502) {
    return 'Сервис данных недоступен: не удалось получить данные для отчёта. Попробуйте позже.';
  }
  if (status === 504 || err?.code === 'ECONNABORTED') {
    return 'Формирование отчёта заняло слишком много времени. Попробуйте позже или выберите период короче.';
  }
  return errorMessage(err);
}

async function generate() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  generating.value = true;
  generateError.value = '';
  try {
    const report = await generateReport({
      type: form.type,
      period_from: form.period_from,
      period_to: form.period_to,
      title: form.title?.trim() || undefined,
    });
    generateDialog.value = false;
    notify.success('Отчёт сформирован');
    router.push({ name: 'report-detail', params: { id: report.id } });
  } catch (err) {
    generateError.value = generateErrorText(err);
    notify.error(generateError.value);
  } finally {
    generating.value = false;
  }
}

// ------------------------------------------------------------------ PDF, удаление
const pdfLoading = ref(null);

function reportFilename(report) {
  const name = String(report.title || 'Отчёт').replace(/[\\/:*?"<>|\r\n]+/g, '_').slice(0, 120);
  return `${name}.pdf`;
}

async function downloadPdf(report) {
  pdfLoading.value = report.id;
  try {
    await downloadReportPdf(report.id, reportFilename(report));
  } catch (err) {
    notify.error(err);
  } finally {
    pdfLoading.value = null;
  }
}

const deleteDialog = ref(false);
const toDelete = ref(null);
const deleting = ref(false);

function askDelete(report) {
  toDelete.value = report;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await deleteReport(toDelete.value.id);
    notify.success('Отчёт удалён');
    deleteDialog.value = false;
    if (reports.value.length === 1 && page.value > 1) page.value -= 1;
    else await load();
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.type-filter {
  max-width: 260px;
  min-width: 200px;
}
.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}
</style>
