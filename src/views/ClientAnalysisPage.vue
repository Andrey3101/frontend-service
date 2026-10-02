<template>
  <div>
    <!-- Выбор клиента -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row dense align="center">
          <v-col cols="12" md="8">
            <v-autocomplete
              :model-value="pickerValue"
              :items="pickerItems"
              :loading="pickerLoading"
              item-title="name"
              item-value="id"
              label="Клиент"
              placeholder="Начните вводить имя или ИНН"
              prepend-inner-icon="mdi-account-search"
              no-filter
              clearable
              hide-details
              no-data-text="Клиенты не найдены"
              @update:model-value="selectClient"
              @update:search="searchClients"
              @update:focused="(f) => f && loadPickerOnce()"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :subtitle="item.raw.inn ? `ИНН ${item.raw.inn}` : ''" />
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="4" class="d-flex justify-md-end">
            <v-btn variant="text" prepend-icon="mdi-account-group-outline" to="/clients">Все клиенты</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert v-if="!clientId" type="info" variant="tonal">
      Выберите клиента, чтобы увидеть статистику по актам и счетам и получить ИИ-анализ.
    </v-alert>

    <template v-else>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
      <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">
        {{ loadError }}
        <template #append>
          <v-btn variant="text" @click="loadClient">Повторить</v-btn>
        </template>
      </v-alert>

      <template v-if="client">
        <v-row>
          <!-- Карточка клиента -->
          <v-col cols="12" lg="4">
            <v-card class="h-100">
              <v-card-title class="text-wrap">{{ client.name }}</v-card-title>
              <v-card-subtitle>{{ typeTitle(client.type) }}</v-card-subtitle>
              <v-card-text>
                <v-list density="compact" class="py-0">
                  <v-list-item v-for="row in clientRows" :key="row.label" class="px-0" :prepend-icon="row.icon">
                    <v-list-item-subtitle>{{ row.label }}</v-list-item-subtitle>
                    <v-list-item-title class="text-wrap">{{ row.value }}</v-list-item-title>
                  </v-list-item>
                </v-list>
                <div v-if="client.notes" class="text-body-2 mt-2 notes">{{ client.notes }}</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Статистика -->
          <v-col cols="12" lg="8">
            <v-row dense>
              <v-col v-for="card in statCards" :key="card.key" cols="6" md="4">
                <v-card variant="tonal" :color="card.color" class="h-100">
                  <v-card-text>
                    <div class="text-caption">{{ card.title }}</div>
                    <div class="text-h6 font-weight-bold">{{ card.value }}</div>
                    <div v-if="card.hint" class="text-caption text-medium-emphasis">{{ card.hint }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-card v-if="stats && stats.revenue_total > 0" class="mt-2">
              <v-card-text class="d-flex flex-wrap align-center ga-4">
                <div class="chart-box">
                  <Doughnut :data="paymentChart" :options="chartOptions" />
                </div>
                <div class="text-body-2">
                  Оплачено {{ paidPercent }}% выставленной суммы.<br />
                  <span class="text-medium-emphasis">
                    Учитываются документы, кроме черновиков и отменённых; «оплачено» — документы в статусе «Оплачен».
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <!-- Документы клиента -->
          <v-col cols="12" lg="6">
            <v-card class="h-100">
              <v-tabs v-model="docKind" color="primary" density="compact">
                <v-tab value="act">Акты</v-tab>
                <v-tab value="invoice">Счета</v-tab>
              </v-tabs>
              <v-divider />
              <v-data-table-server
                v-model:page="docPage"
                v-model:items-per-page="docLimit"
                :headers="docHeaders"
                :items="docs"
                :items-length="docTotal"
                :items-per-page-options="[10, 20, 50]"
                :loading="docsLoading"
                loading-text="Загрузка…"
                :no-data-text="docKind === 'invoice' ? 'Счетов нет' : 'Актов нет'"
                item-value="id"
                density="compact"
                hover
                class="clickable-rows"
                @click:row="onDocClick"
              >
                <template #[`item.number`]="{ item }">№ {{ item.number }}</template>
                <template #[`item.date`]="{ item }">{{ formatDate(item.date) }}</template>
                <template #[`item.total`]="{ item }">{{ formatMoney(item.total) }}</template>
                <template #[`item.status`]="{ item }">
                  <v-chip size="small" variant="tonal" :color="statusColor(item.status)">{{ statusLabel(item.status) }}</v-chip>
                </template>
              </v-data-table-server>
            </v-card>
          </v-col>

          <!-- ИИ-анализ -->
          <v-col cols="12" lg="6">
            <v-card class="h-100">
              <v-card-title class="d-flex align-center">
                ИИ-анализ
                <v-spacer />
                <v-btn
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-robot-outline"
                  :loading="analyzing"
                  :disabled="!stats"
                  @click="runAnalysis"
                >
                  {{ summary ? 'Обновить' : 'Проанализировать' }}
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-alert v-if="aiWarning" type="warning" variant="tonal" density="compact" class="mb-2">
                  {{ aiWarning }}
                </v-alert>
                <div v-if="summary" class="markdown-body" v-html="renderMarkdown(summary)" />
                <div v-else-if="!aiWarning" class="text-body-2 text-medium-emphasis">
                  {{ analyzing ? 'Готовим резюме…' : 'ИИ составит резюме по клиенту на основе его данных и статистики документов.' }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Doughnut } from 'vue-chartjs';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { analyzeClient, errorMessage, getClient, getClientStats, listActs, listClients, listInvoices } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { debounce } from '@/utils/debounce.js';
import { formatDate, formatMoney, formatNumber } from '@/utils/format.js';
import { renderMarkdown } from '@/utils/markdown.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const route = useRoute();
const router = useRouter();
const notify = useNotifyStore();

const TYPE_TITLES = { company: 'Организация', ip: 'Индивидуальный предприниматель', individual: 'Физическое лицо' };
const STATUS_ITEMS = {
  draft: ['Черновик', 'grey'],
  sent: ['Отправлен', 'info'],
  signed: ['Подписан', 'primary'],
  paid: ['Оплачен', 'success'],
  cancelled: ['Отменён', 'error'],
};

function typeTitle(type) {
  return TYPE_TITLES[type] ?? type;
}
function statusLabel(status) {
  return STATUS_ITEMS[status]?.[0] ?? status;
}
function statusColor(status) {
  return STATUS_ITEMS[status]?.[1] ?? 'grey';
}

// ------------------------------------------------------------------ выбор клиента
const pickerResults = ref([]);
const pickerPinned = ref(null);
const pickerLoading = ref(false);
let pickerSeq = 0;
let pickerLoaded = false;

const pickerItems = computed(() => {
  const list = pickerResults.value;
  const pinned = pickerPinned.value;
  return pinned && !list.some((c) => c.id === pinned.id) ? [pinned, ...list] : list;
});

async function loadPicker(query = '') {
  const seq = ++pickerSeq;
  pickerLoading.value = true;
  try {
    const data = await listClients({ search: query?.trim(), limit: 20 });
    if (seq === pickerSeq) {
      pickerResults.value = data.items;
      pickerLoaded = true;
    }
  } catch (err) {
    if (seq === pickerSeq) notify.error(err);
  } finally {
    if (seq === pickerSeq) pickerLoading.value = false;
  }
}
const searchClients = debounce(loadPicker, 300);
// Отложенный вызов debounce после ухода со страницы дал бы лишний запрос.
onUnmounted(() => searchClients.cancel());

function loadPickerOnce() {
  if (!pickerLoaded) loadPicker('');
}

/** Выбор меняет ?client=<id>; загрузка — по изменению маршрута (ссылки из списка клиентов работают так же). */
function selectClient(id) {
  const picked = pickerItems.value.find((c) => c.id === id);
  if (picked) pickerPinned.value = picked;
  const query = { ...route.query };
  if (id) query.client = id;
  else delete query.client;
  router.replace({ query });
}

const clientId = computed(() => (typeof route.query.client === 'string' && route.query.client) || null);
/** Пока клиент не загружен, не показываем UUID в поле выбора. */
const pickerValue = computed(() =>
  clientId.value && pickerItems.value.some((c) => c.id === clientId.value) ? clientId.value : null,
);

// ------------------------------------------------------------------ клиент и статистика
const client = ref(null);
const stats = ref(null);
const loading = ref(false);
const loadError = ref('');

let loadSeq = 0;
async function loadClient() {
  const id = clientId.value;
  const seq = ++loadSeq;
  client.value = null;
  stats.value = null;
  summary.value = '';
  aiWarning.value = '';
  loadError.value = '';
  if (!id) return;
  loading.value = true;
  try {
    const [c, s] = await Promise.all([getClient(id), getClientStats(id)]);
    if (seq !== loadSeq) return;
    client.value = c;
    stats.value = s;
    pickerPinned.value = c;
  } catch (err) {
    if (seq === loadSeq) loadError.value = errorMessage(err);
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
}

const clientRows = computed(() => {
  const c = client.value;
  if (!c) return [];
  const rows = [
    { label: 'ИНН', value: c.inn, icon: 'mdi-identifier' },
    { label: 'КПП', value: c.kpp, icon: 'mdi-identifier' },
    { label: c.type === 'ip' ? 'ОГРНИП' : 'ОГРН', value: c.ogrn, icon: 'mdi-identifier' },
    { label: 'Контактное лицо', value: c.contact_person, icon: 'mdi-account-tie' },
    { label: 'Телефон', value: c.phone, icon: 'mdi-phone' },
    { label: 'Email', value: c.email, icon: 'mdi-email-outline' },
    { label: 'Адрес', value: c.address, icon: 'mdi-map-marker-outline' },
  ];
  return rows.filter((r) => r.value);
});

const statCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  const unpaid = Math.max(0, (s.revenue_total ?? 0) - (s.paid_total ?? 0));
  return [
    { key: 'revenue', title: 'Выставлено', value: formatMoney(s.revenue_total), color: 'primary', hint: 'без черновиков и отменённых' },
    { key: 'paid', title: 'Оплачено', value: formatMoney(s.paid_total), color: 'success' },
    { key: 'unpaid', title: 'Не оплачено', value: formatMoney(unpaid), color: unpaid > 0 ? 'warning' : 'grey' },
    { key: 'avg', title: 'Средний чек', value: formatMoney(s.average_check), color: 'info' },
    {
      key: 'docs',
      title: 'Документы',
      value: `${formatNumber(s.acts_count)} / ${formatNumber(s.invoices_count)}`,
      color: 'secondary',
      hint: 'актов / счетов',
    },
    { key: 'last', title: 'Последний документ', value: formatDate(s.last_document_date), color: 'grey' },
  ];
});

const paidPercent = computed(() => {
  const s = stats.value;
  if (!s || !s.revenue_total) return 0;
  return Math.min(100, Math.round((s.paid_total / s.revenue_total) * 100));
});

const paymentChart = computed(() => {
  const s = stats.value ?? { revenue_total: 0, paid_total: 0 };
  const unpaid = Math.max(0, s.revenue_total - s.paid_total);
  return {
    labels: ['Оплачено', 'Не оплачено'],
    datasets: [{ data: [s.paid_total, unpaid], backgroundColor: ['#43a047', '#fb8c00'] }],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatMoney(ctx.parsed)}` } },
  },
};

// ------------------------------------------------------------------ документы клиента
const docKind = ref('act');
const docs = ref([]);
const docTotal = ref(0);
const docPage = ref(1);
const docLimit = ref(10);
const docsLoading = ref(false);

const docHeaders = [
  { title: 'Номер', key: 'number', sortable: false },
  { title: 'Дата', key: 'date', sortable: false },
  { title: 'Сумма', key: 'total', sortable: false, align: 'end' },
  { title: 'Статус', key: 'status', sortable: false },
];

let docsSeq = 0;
async function loadDocs() {
  const id = clientId.value;
  const seq = ++docsSeq;
  if (!id) {
    docs.value = [];
    docTotal.value = 0;
    return;
  }
  docsLoading.value = true;
  try {
    const list = docKind.value === 'invoice' ? listInvoices : listActs;
    const data = await list({ client_id: id, page: docPage.value, limit: docLimit.value });
    if (seq !== docsSeq) return;
    docs.value = data.items;
    docTotal.value = data.total;
  } catch (err) {
    if (seq === docsSeq) notify.error(err);
  } finally {
    if (seq === docsSeq) docsLoading.value = false;
  }
}

function reloadDocsFromFirstPage() {
  if (docPage.value !== 1) docPage.value = 1;
  else loadDocs();
}

watch([docPage, docLimit], loadDocs);
watch(docKind, reloadDocsFromFirstPage);

function onDocClick(_event, { item }) {
  router.push({
    name: 'act-detail',
    params: { id: item.id },
    query: docKind.value === 'invoice' ? { kind: 'invoice' } : {},
  });
}

// ------------------------------------------------------------------ ИИ-анализ
const summary = ref('');
const analyzing = ref(false);
const aiWarning = ref('');

async function runAnalysis() {
  if (!client.value || !stats.value) return;
  const forId = client.value.id;
  analyzing.value = true;
  aiWarning.value = '';
  try {
    const result = await analyzeClient({ client: client.value, stats: stats.value });
    if (client.value?.id === forId) summary.value = result.summary;
  } catch (err) {
    if (client.value?.id !== forId) return;
    if (err?.response?.status === 503) {
      aiWarning.value = 'ИИ не настроен на сервере — анализ недоступен. Обратитесь к администратору.';
    } else {
      notify.error(err);
    }
  } finally {
    analyzing.value = false;
  }
}

// ------------------------------------------------------------------ старт и смена клиента
watch(
  clientId,
  () => {
    loadClient();
    reloadDocsFromFirstPage();
  },
  { immediate: true },
);
</script>

<style scoped>
.chart-box {
  position: relative;
  width: 220px;
  height: 180px;
}
.notes {
  white-space: pre-line;
}
.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}
</style>
