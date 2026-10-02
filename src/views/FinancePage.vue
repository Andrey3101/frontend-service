<template>
  <div>
    <!-- Период -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row dense align="center">
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="period.from" type="date" label="С" hide-details @update:model-value="activePreset = ''" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="period.to" type="date" label="По" hide-details @update:model-value="activePreset = ''" />
          </v-col>
          <v-col cols="12" md="6" class="d-flex flex-wrap ga-2">
            <v-btn
              v-for="preset in presets"
              :key="preset.key"
              size="small"
              :variant="activePreset === preset.key ? 'flat' : 'outlined'"
              color="primary"
              @click="applyPreset(preset.key)"
            >
              {{ preset.title }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Самозанятый: доходы без чека НПД за период (API.md, 12.4) -->
    <v-alert
      v-if="isSelfEmployed && receiptsMissing > 0"
      type="warning"
      variant="tonal"
      icon="mdi-receipt-text-remove-outline"
      class="mb-4"
      data-testid="npd-receipts-banner"
    >
      {{ receiptsBannerText }}
    </v-alert>

    <!-- Сводка -->
    <v-row class="mb-2">
      <v-col v-for="card in summaryCards" :key="card.key" cols="12" sm="4">
        <v-card :loading="summaryLoading">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">{{ card.title }}</div>
            <div class="text-h5 font-weight-bold" :class="card.class">{{ formatMoney(card.value) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Самозанятый: лимит дохода НПД за текущий год -->
    <v-card v-if="isSelfEmployed" class="mb-4" :loading="limitLoading" data-testid="npd-limit">
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        Лимит НПД
        <v-spacer />
        <span class="text-body-2 text-medium-emphasis">{{ currentYear }} год</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="limitError" type="error" variant="tonal" density="compact">{{ limitError }}</v-alert>
        <template v-else-if="npdLimit">
          <div class="d-flex flex-wrap justify-space-between ga-2 mb-2">
            <span class="text-body-1">
              Доходы: <span class="font-weight-bold">{{ formatMoney(npdLimit.income) }}</span>
              из {{ formatMoney(NPD_LIMIT) }}
            </span>
            <span class="font-weight-medium" :class="`text-${npdLimit.color}`">{{ formatNumber(npdLimit.percent) }}%</span>
          </div>
          <v-progress-linear
            :model-value="Math.min(npdLimit.percent, 100)"
            :color="npdLimit.color"
            height="10"
            rounded
            aria-label="Использование лимита НПД"
          />
          <div class="text-body-2 mt-2" :class="npdLimit.percent > 100 ? 'text-error' : 'text-medium-emphasis'">
            {{ npdLimit.text }}
          </div>
        </template>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="h-100">
          <v-card-title>Доходы и расходы по месяцам</v-card-title>
          <v-card-text>
            <div v-if="chartData.labels.length" class="chart-box">
              <Bar :data="chartData" :options="chartOptions" />
            </div>
            <div v-else class="text-medium-emphasis py-8 text-center">
              {{ summaryLoading ? 'Загрузка…' : 'Нет операций за выбранный период' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Налог -->
      <v-col cols="12" lg="4">
        <v-card class="h-100" :loading="taxLoading">
          <v-card-title class="d-flex align-center">
            Налог
            <v-spacer />
            <v-chip v-if="tax" size="small" variant="tonal" color="primary">{{ REGIME_LABELS[tax.regime] || tax.regime }}</v-chip>
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="6">
                <v-select v-model="taxYear" :items="yearItems" label="Год" hide-details density="compact" />
              </v-col>
              <v-col cols="6">
                <v-select v-model="taxQuarter" :items="quarterItems" label="Период" hide-details density="compact" />
              </v-col>
            </v-row>

            <v-alert v-if="taxError" type="error" variant="tonal" density="compact" class="mt-3">{{ taxError }}</v-alert>
            <template v-else-if="tax">
              <div class="text-caption text-medium-emphasis mt-3">{{ tax.period }}</div>
              <div class="text-h5 font-weight-bold mb-2">{{ formatMoney(tax.tax) }}</div>
              <div class="text-body-2 mb-2">{{ tax.rate_description }}</div>
              <v-table density="compact" class="mb-2">
                <tbody>
                  <tr>
                    <td>Доход</td>
                    <td class="text-right">{{ formatMoney(tax.income) }}</td>
                  </tr>
                  <tr v-if="isSelfEmployed">
                    <td class="pl-6">от физлиц</td>
                    <td class="text-right">{{ formatMoney(tax.income_individuals) }}</td>
                  </tr>
                  <tr v-if="isSelfEmployed">
                    <td class="pl-6">от юрлиц и ИП</td>
                    <td class="text-right">{{ formatMoney(tax.income_legal) }}</td>
                  </tr>
                  <tr>
                    <td>Расходы</td>
                    <td class="text-right">{{ formatMoney(tax.expenses) }}</td>
                  </tr>
                  <tr>
                    <td>Налоговая база</td>
                    <td class="text-right">{{ formatMoney(tax.tax_base) }}</td>
                  </tr>
                </tbody>
              </v-table>
              <ul v-if="tax.notes.length" class="text-caption text-medium-emphasis pl-4">
                <li v-for="(note, i) in tax.notes" :key="i">{{ note }}</li>
              </ul>
            </template>

            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-1">Ближайшие сроки</div>
            <v-list v-if="deadlines.length" density="compact" class="py-0">
              <v-list-item v-for="item in deadlines" :key="item.date + item.title" class="px-0">
                <template #prepend>
                  <v-chip size="small" variant="tonal" class="mr-3">{{ formatDate(item.date) }}</v-chip>
                </template>
                <v-list-item-title class="text-body-2">{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ item.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else class="text-body-2 text-medium-emphasis">{{ calendarError || 'Сроков нет' }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Транзакции -->
    <v-card class="mt-4">
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        Операции
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Добавить</v-btn>
      </v-card-title>
      <v-card-text>
        <v-row dense class="mb-2">
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.type"
              :items="typeFilterItems"
              label="Тип"
              hide-details
              density="compact"
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.category"
              :items="filterCategories"
              label="Категория"
              clearable
              hide-details
              density="compact"
            />
          </v-col>
          <v-col cols="12" sm="4" md="6">
            <v-text-field
              v-model="filters.search"
              label="Поиск по описанию и контрагенту"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              density="compact"
            />
          </v-col>
        </v-row>

        <v-data-table-server
          v-model:page="page"
          v-model:items-per-page="limit"
          :headers="headers"
          :items="transactions"
          :items-length="total"
          :items-per-page-options="[10, 20, 50, 100]"
          :loading="tableLoading"
          loading-text="Загрузка…"
          no-data-text="Операций нет"
          item-value="id"
        >
          <template #[`item.date`]="{ item }">{{ formatDate(item.date) }}</template>
          <template #[`item.type`]="{ item }">
            <v-chip size="small" :color="item.type === 'income' ? 'success' : 'error'" variant="tonal">
              {{ item.type === 'income' ? 'Доход' : 'Расход' }}
            </v-chip>
          </template>
          <template #[`item.counterparty`]="{ item }">
            <div>{{ item.counterparty || '—' }}</div>
            <div v-if="item.counterparty_inn" class="text-caption text-medium-emphasis">ИНН {{ item.counterparty_inn }}</div>
          </template>
          <template #[`item.amount`]="{ item }">
            <span :class="item.type === 'income' ? 'text-success' : 'text-error'" class="font-weight-medium">
              {{ item.type === 'income' ? '+' : '−' }}{{ formatMoney(item.amount) }}
            </span>
          </template>
          <template #[`item.source`]="{ item }">
            <v-chip
              size="small"
              variant="tonal"
              :color="sourceMeta(item.source).color"
              :prepend-icon="sourceMeta(item.source).icon"
              :to="item.source === 'document' ? '/acts' : undefined"
            >
              {{ sourceMeta(item.source).title }}
            </v-chip>
          </template>
          <template #[`item.npd_receipt`]="{ item }">
            <template v-if="item.type === 'income'">
              <span v-if="item.npd_receipt" class="text-no-wrap">{{ item.npd_receipt }}</span>
              <v-chip v-else-if="isSelfEmployed" size="small" color="warning" variant="tonal">нет чека</v-chip>
              <span v-else class="text-medium-emphasis">—</span>
            </template>
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn icon="mdi-pencil" size="small" variant="text" aria-label="Изменить" @click="openEdit(item)" />
            <v-btn
              v-if="item.source !== 'document'"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="error"
              aria-label="Удалить"
              @click="askDelete(item)"
            />
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- Диалог добавления / редактирования -->
    <v-dialog v-model="editDialog" max-width="560" persistent>
      <v-card>
        <v-card-title>{{ editingId ? 'Изменить операцию' : 'Новая операция' }}</v-card-title>
        <v-card-text>
          <v-alert
            v-if="fromDocument"
            type="info"
            variant="tonal"
            density="compact"
            icon="mdi-file-document-outline"
            class="mb-4"
          >
            Сумма и дата берутся из документа. Изменить их можно в
            <router-link to="/acts">акте или счёте</router-link>.
          </v-alert>
          <v-form ref="formRef" @submit.prevent="save">
            <v-btn-toggle
              v-model="form.type"
              mandatory
              color="primary"
              variant="outlined"
              divided
              class="mb-4"
              :disabled="fromDocument"
            >
              <v-btn value="income" prepend-icon="mdi-arrow-down-bold">Доход</v-btn>
              <v-btn value="expense" prepend-icon="mdi-arrow-up-bold">Расход</v-btn>
            </v-btn-toggle>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  label="Сумма, ₽ *"
                  :rules="[rules.positive]"
                  :disabled="fromDocument"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.date"
                  type="date"
                  label="Дата *"
                  :rules="[rules.required]"
                  :disabled="fromDocument"
                />
              </v-col>
              <v-col cols="12">
                <v-combobox
                  v-model="form.category"
                  :items="formCategories"
                  label="Категория"
                  hint="Можно выбрать из списка или ввести свою"
                  persistent-hint
                  :rules="[rules.max100]"
                />
              </v-col>
              <v-col v-if="form.type === 'income'" cols="12">
                <v-select
                  v-model="form.payer_type"
                  :items="payerTypeItems"
                  label="Плательщик"
                  clearable
                  :hint="isSelfEmployed ? 'Для НПД: физлица — 4%, юрлица и ИП — 6%' : ''"
                  persistent-hint
                  :disabled="fromDocument"
                />
              </v-col>
              <v-col v-if="form.type === 'income'" cols="12">
                <v-text-field
                  v-model="form.npd_receipt"
                  label="Номер чека НПД (Мой налог)"
                  prepend-inner-icon="mdi-receipt-text-outline"
                  counter="64"
                  :rules="[rules.max64]"
                  :hint="isSelfEmployed ? 'Чек обязателен для каждого дохода' : ''"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="form.description" label="Описание" rows="2" auto-grow :rules="[rules.max1000]" />
              </v-col>
              <v-col cols="12" sm="7">
                <v-text-field
                  v-model="form.counterparty"
                  label="Контрагент"
                  :rules="[rules.max255]"
                  :disabled="fromDocument"
                />
              </v-col>
              <v-col cols="12" sm="5">
                <v-text-field
                  v-model="form.counterparty_inn"
                  label="ИНН контрагента"
                  :rules="[rules.inn]"
                  :disabled="fromDocument"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="editDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="save">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Удалить операцию?</v-card-title>
        <v-card-text v-if="toDelete">
          {{ toDelete.type === 'income' ? 'Доход' : 'Расход' }} {{ formatMoney(toDelete.amount) }}
          от {{ formatDate(toDelete.date) }}<template v-if="toDelete.description"> — {{ toDelete.description }}</template>
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { Bar } from 'vue-chartjs';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import {
  createTransaction,
  deleteTransaction,
  errorMessage,
  getFinanceCategories,
  getFinanceSummary,
  getTaxCalendar,
  getTaxEstimate,
  listTransactions,
  updateTransaction,
} from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { debounce } from '@/utils/debounce.js';
import { formatDate, formatMoney, formatNumber } from '@/utils/format.js';
const REGIME_LABELS = { npd: 'НПД', usn_income: 'УСН «Доходы»', usn_income_expense: 'УСН «Доходы − расходы»' };

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const auth = useAuthStore();
const notify = useNotifyStore();
const isSelfEmployed = computed(() => auth.companyType === 'self_employed');

// ------------------------------------------------------------------ период
const DATE = 'YYYY-MM-DD';
const presets = [
  { key: 'month', title: 'Месяц' },
  { key: 'quarter', title: 'Квартал' },
  { key: 'year', title: 'Год' },
  { key: 'last12', title: '12 месяцев' },
];
const period = reactive({ from: '', to: '' });
const activePreset = ref('year');

function applyPreset(key) {
  const now = dayjs();
  // От 1-го числа: month(n) у 31-го числа переполняется в следующий месяц (31.05 → month(3) = 01.05).
  const quarterStart = now.startOf('month').month(Math.floor(now.month() / 3) * 3);
  const ranges = {
    month: [now.startOf('month'), now.endOf('month')],
    quarter: [quarterStart, quarterStart.add(2, 'month').endOf('month')],
    year: [now.startOf('year'), now.endOf('year')],
    last12: [now.subtract(11, 'month').startOf('month'), now.endOf('month')],
  };
  const [from, to] = ranges[key];
  activePreset.value = key;
  period.from = from.format(DATE);
  period.to = to.format(DATE);
}

// ------------------------------------------------------------------ сводка
const summary = ref(null);
const summaryLoading = ref(false);

const summaryCards = computed(() => [
  { key: 'income', title: 'Доходы', value: summary.value?.income ?? 0, class: 'text-success' },
  { key: 'expense', title: 'Расходы', value: summary.value?.expense ?? 0, class: 'text-error' },
  {
    key: 'profit',
    title: 'Прибыль',
    value: summary.value?.profit ?? 0,
    class: (summary.value?.profit ?? 0) < 0 ? 'text-error' : 'text-primary',
  },
]);

const chartData = computed(() => {
  const months = summary.value?.by_month ?? [];
  return {
    labels: months.map((m) => dayjs(`${m.month}-01`).format('MMM YYYY')),
    datasets: [
      { label: 'Доходы', backgroundColor: '#43a047', data: months.map((m) => m.income) },
      { label: 'Расходы', backgroundColor: '#e53935', data: months.map((m) => m.expense) },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}` } },
  },
  scales: {
    y: { beginAtZero: true, ticks: { callback: (v) => Number(v).toLocaleString('ru-RU') } },
  },
};

function validPeriod() {
  return !period.from || !period.to || period.from <= period.to;
}

/** Доходов без номера чека НПД за период (для self_employed; иначе сервер отдаёт 0). */
const receiptsMissing = computed(() => Number(summary.value?.incomes_without_receipt) || 0);

/** 1 доход, 2 дохода, 5 доходов. */
function pluralRu(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const receiptsBannerText = computed(() => {
  const n = receiptsMissing.value;
  return (
    `${n} ${pluralRu(n, 'доход', 'дохода', 'доходов')} без чека НПД за период — ` +
    'сформируйте чеки в приложении «Мой налог» и внесите номера'
  );
});

async function loadSummary() {
  if (!validPeriod()) return;
  summaryLoading.value = true;
  try {
    summary.value = await getFinanceSummary({ date_from: period.from, date_to: period.to });
  } catch (err) {
    notify.error(err);
  } finally {
    summaryLoading.value = false;
  }
}

// ------------------------------------------------------------------ категории
const categories = ref({ income: [], expense: [] });

async function loadCategories() {
  try {
    categories.value = await getFinanceCategories();
  } catch (err) {
    notify.error(err);
  }
}

// ------------------------------------------------------------------ транзакции
const headers = [
  { title: 'Дата', key: 'date', sortable: false, width: 110 },
  { title: 'Тип', key: 'type', sortable: false, width: 100 },
  { title: 'Категория', key: 'category', sortable: false },
  { title: 'Описание', key: 'description', sortable: false },
  { title: 'Контрагент', key: 'counterparty', sortable: false },
  { title: 'Источник', key: 'source', sortable: false, width: 150 },
  { title: 'Чек', key: 'npd_receipt', sortable: false, width: 120 },
  { title: 'Сумма', key: 'amount', sortable: false, align: 'end', width: 150 },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 100 },
];

const typeFilterItems = [
  { title: 'Все', value: '' },
  { title: 'Доходы', value: 'income' },
  { title: 'Расходы', value: 'expense' },
];

const filters = reactive({ type: '', category: null, search: '' });
const transactions = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const tableLoading = ref(false);

const filterCategories = computed(() => {
  if (filters.type === 'income') return categories.value.income;
  if (filters.type === 'expense') return categories.value.expense;
  return [...new Set([...categories.value.income, ...categories.value.expense])];
});

const SOURCE_META = {
  manual: { title: 'Вручную', color: 'grey', icon: 'mdi-pencil-outline' },
  bank_import: { title: 'Выписка', color: 'info', icon: 'mdi-bank-outline' },
  bot: { title: 'Бот', color: 'secondary', icon: 'mdi-robot-outline' },
  document: { title: 'Из документа', color: 'primary', icon: 'mdi-file-document-outline' },
};
/** @param {import('@/api/types.js').TransactionSource} source */
function sourceMeta(source) {
  return SOURCE_META[source] ?? { title: source || '—', color: 'grey', icon: undefined };
}

let requestSeq = 0;
async function loadTransactions() {
  if (!validPeriod()) return;
  const seq = ++requestSeq;
  tableLoading.value = true;
  try {
    const data = await listTransactions({
      type: filters.type,
      category: filters.category,
      search: filters.search?.trim(),
      date_from: period.from,
      date_to: period.to,
      page: page.value,
      limit: limit.value,
    });
    if (seq !== requestSeq) return; // пришёл ответ на устаревший запрос
    transactions.value = data.items;
    total.value = data.total;
  } catch (err) {
    if (seq === requestSeq) notify.error(err);
  } finally {
    if (seq === requestSeq) tableLoading.value = false;
  }
}

/** Смена фильтров/периода: на первую страницу (смена page сама вызовет загрузку). */
function reloadFromFirstPage() {
  if (page.value !== 1) {
    page.value = 1;
  } else {
    loadTransactions();
  }
}

const debouncedReload = debounce(reloadFromFirstPage, 400);
// Отложенный вызов debounce после ухода со страницы дал бы лишний запрос.
onUnmounted(() => debouncedReload.cancel());

watch([page, limit], loadTransactions);
watch(() => [filters.type, filters.category], reloadFromFirstPage);
watch(() => filters.search, debouncedReload);
watch(
  () => filters.type,
  () => {
    if (filters.category && !filterCategories.value.includes(filters.category)) filters.category = null;
  },
);
watch(
  () => [period.from, period.to],
  () => {
    if (!validPeriod()) {
      notify.warning('Дата начала периода позже даты окончания');
      return;
    }
    loadSummary();
    reloadFromFirstPage();
  },
);

// ------------------------------------------------------------------ диалог
const editDialog = ref(false);
const editingId = ref(null);
/** Операция создана из оплаченного акта/счёта: меняются только категория, описание и чек (API.md, 12.1). */
const fromDocument = ref(false);
const saving = ref(false);
const formRef = ref(null);

function emptyForm() {
  return {
    type: 'income',
    amount: '',
    date: dayjs().format(DATE),
    category: null,
    description: '',
    counterparty: '',
    counterparty_inn: '',
    payer_type: null,
    npd_receipt: '',
  };
}
const form = reactive(emptyForm());

const formCategories = computed(() => categories.value[form.type] ?? []);

const payerTypeItems = [
  { title: 'Физическое лицо', value: 'individual' },
  { title: 'Юрлицо или ИП', value: 'legal' },
];

const rules = {
  required: (v) => Boolean(v) || 'Обязательное поле',
  positive: (v) => (Number(v) > 0 && Number(v) <= 999999999999.99) || 'Введите сумму больше нуля',
  max100: (v) => !v || String(v).length <= 100 || 'Не более 100 символов',
  max64: (v) => !v || String(v).trim().length <= 64 || 'Не более 64 символов',
  max255: (v) => !v || String(v).length <= 255 || 'Не более 255 символов',
  max1000: (v) => !v || String(v).length <= 1000 || 'Не более 1000 символов',
  inn: (v) => !v || /^(\d{10}|\d{12})$/.test(String(v).trim()) || 'ИНН — 10 или 12 цифр',
};

watch(
  () => form.type,
  (type) => {
    if (type !== 'income') {
      form.payer_type = null;
      form.npd_receipt = ''; // чек НПД бывает только у дохода
    }
  },
);

function openCreate() {
  editingId.value = null;
  fromDocument.value = false;
  Object.assign(form, emptyForm());
  editDialog.value = true;
}

/** @param {import('@/api/types.js').Transaction} item */
function openEdit(item) {
  editingId.value = item.id;
  fromDocument.value = item.source === 'document';
  Object.assign(form, {
    type: item.type,
    amount: String(item.amount),
    date: item.date,
    category: item.category,
    description: item.description ?? '',
    counterparty: item.counterparty ?? '',
    counterparty_inn: item.counterparty_inn ?? '',
    payer_type: item.payer_type,
    npd_receipt: item.npd_receipt ?? '',
  });
  editDialog.value = true;
}

function buildPayload() {
  const receipt = form.type === 'income' ? form.npd_receipt?.trim() || null : null;
  if (fromDocument.value) {
    // Остальные поля задаёт документ; их изменение → 409
    return {
      category: form.category ? String(form.category).trim() : undefined,
      description: form.description?.trim() ?? '',
      npd_receipt: receipt,
    };
  }
  return {
    type: form.type,
    amount: Math.round(Number(form.amount) * 100) / 100,
    date: form.date,
    category: form.category ? String(form.category).trim() : undefined,
    description: form.description?.trim() ?? '',
    counterparty: form.counterparty?.trim() || null,
    counterparty_inn: form.counterparty_inn?.trim() || null,
    payer_type: form.type === 'income' ? form.payer_type || null : null,
    npd_receipt: receipt,
  };
}

async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const payload = buildPayload();
    if (editingId.value) {
      await updateTransaction(editingId.value, payload);
      notify.success('Операция обновлена');
    } else {
      await createTransaction(payload);
      notify.success('Операция добавлена');
    }
    editDialog.value = false;
    await Promise.all([loadTransactions(), loadSummary(), loadTax(), loadNpdLimit()]);
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

// ------------------------------------------------------------------ удаление
const deleteDialog = ref(false);
const toDelete = ref(null);
const deleting = ref(false);

function askDelete(item) {
  toDelete.value = item;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await deleteTransaction(toDelete.value.id);
    notify.success('Операция удалена');
    deleteDialog.value = false;
    if (transactions.value.length === 1 && page.value > 1) {
      page.value -= 1; // загрузка запустится watcher-ом
    } else {
      await loadTransactions();
    }
    await Promise.all([loadSummary(), loadTax(), loadNpdLimit()]);
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

// ------------------------------------------------------------------ налог
const currentYear = dayjs().year();
const yearItems = [currentYear, currentYear - 1, currentYear - 2];
const quarterItems = [
  { title: 'Весь год', value: 0 },
  { title: 'I квартал', value: 1 },
  { title: 'II квартал', value: 2 },
  { title: 'III квартал', value: 3 },
  { title: 'IV квартал', value: 4 },
];
const taxYear = ref(currentYear);
const taxQuarter = ref(0);
const tax = ref(null);
const taxLoading = ref(false);
const taxError = ref('');
const deadlines = ref([]);
const calendarError = ref('');

async function loadTax() {
  taxLoading.value = true;
  taxError.value = '';
  try {
    tax.value = await getTaxEstimate({ year: taxYear.value, quarter: taxQuarter.value || undefined });
  } catch (err) {
    tax.value = null;
    taxError.value = errorMessage(err);
  } finally {
    taxLoading.value = false;
  }
}

async function loadDeadlines() {
  calendarError.value = '';
  const today = dayjs().format(DATE);
  try {
    let items = (await getTaxCalendar({ year: currentYear })).items.filter((i) => i.date >= today);
    if (items.length < 3) {
      const next = await getTaxCalendar({ year: currentYear + 1 });
      items = items.concat(next.items);
    }
    deadlines.value = items.slice(0, 5);
  } catch (err) {
    deadlines.value = [];
    calendarError.value = errorMessage(err);
  }
}

watch([taxYear, taxQuarter], loadTax);

// ------------------------------------------------------------------ лимит НПД (самозанятые)
const NPD_LIMIT = 2400000;
const limitIncome = ref(null);
const limitLoading = ref(false);
const limitError = ref('');

const npdLimit = computed(() => {
  if (limitIncome.value === null) return null;
  const income = limitIncome.value;
  const percent = Math.round((income / NPD_LIMIT) * 1000) / 10;
  let color = 'primary';
  if (percent > 100) color = 'error';
  else if (percent >= 80) color = 'warning';
  const rest = NPD_LIMIT - income;
  const text =
    rest >= 0
      ? `Осталось ${formatMoney(rest)} до годового лимита`
      : `Лимит превышен на ${formatMoney(-rest)} — применять НПД в этом году больше нельзя`;
  return { income, percent, color, text };
});

async function loadNpdLimit() {
  if (!isSelfEmployed.value) return;
  limitLoading.value = true;
  limitError.value = '';
  try {
    const estimate = await getTaxEstimate({ year: currentYear });
    limitIncome.value = Number(estimate.income) || 0;
  } catch (err) {
    limitIncome.value = null;
    limitError.value = errorMessage(err);
  } finally {
    limitLoading.value = false;
  }
}

// ------------------------------------------------------------------ старт
onMounted(() => {
  applyPreset('year'); // watcher периода загрузит сводку и операции
  loadCategories();
  loadTax();
  loadNpdLimit();
  loadDeadlines();
});
</script>

<style scoped>
.chart-box {
  position: relative;
  height: 320px;
}
</style>
