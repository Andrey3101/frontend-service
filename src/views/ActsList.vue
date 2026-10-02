<template>
  <div>
    <v-card>
      <v-tabs v-model="kind" color="primary">
        <v-tab value="act" prepend-icon="mdi-file-document-outline">Акты</v-tab>
        <v-tab value="invoice" prepend-icon="mdi-receipt-text-outline">Счета</v-tab>
      </v-tabs>
      <v-divider />

      <v-card-text>
        <!-- Фильтры -->
        <v-row dense align="center" class="mb-2">
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.search"
              label="Поиск: номер, клиент, заметки"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              density="compact"
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filters.status"
              :items="STATUS_ITEMS"
              label="Статус"
              clearable
              hide-details
              density="compact"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              v-model="filters.client_id"
              :items="filterClients.items.value"
              :loading="filterClients.loading.value"
              item-title="name"
              item-value="id"
              label="Клиент"
              no-filter
              clearable
              hide-details
              density="compact"
              no-data-text="Клиенты не найдены"
              @update:search="filterClients.search"
              @update:model-value="filterClients.pinById"
              @update:focused="(f) => f && filterClients.loadOnce()"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field v-model="filters.date_from" type="date" label="С" hide-details density="compact" />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field v-model="filters.date_to" type="date" label="По" hide-details density="compact" />
          </v-col>
        </v-row>

        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
            {{ kind === 'invoice' ? 'Новый счёт' : 'Новый акт' }}
          </v-btn>
          <v-spacer />
          <v-btn
            variant="outlined"
            prepend-icon="mdi-file-delimited-outline"
            :loading="exporting"
            :disabled="!total"
            @click="exportCsv"
          >
            Экспорт CSV
          </v-btn>
        </div>

        <v-data-table-server
          v-model:page="page"
          v-model:items-per-page="limit"
          :headers="headers"
          :items="documents"
          :items-length="total"
          :items-per-page-options="[10, 20, 50, 100]"
          :loading="loading"
          loading-text="Загрузка…"
          :no-data-text="kind === 'invoice' ? 'Счетов нет' : 'Актов нет'"
          item-value="id"
          hover
          class="clickable-rows"
          @click:row="onRowClick"
        >
          <template #[`item.number`]="{ item }">
            <span class="font-weight-medium">№ {{ item.number }}</span>
          </template>
          <template #[`item.date`]="{ item }">{{ formatDate(item.date) }}</template>
          <template #[`item.client_name`]="{ item }">{{ item.client_name || '—' }}</template>
          <template #[`item.total`]="{ item }">
            <div class="font-weight-medium">{{ formatMoney(item.total) }}</div>
            <div class="text-caption text-medium-emphasis">{{ vatLabel(item.vat_rate) }}</div>
          </template>
          <template #[`item.due_date`]="{ item }">
            <span :class="{ 'text-error': isOverdue(item) }">{{ formatDate(item.due_date) }}</span>
          </template>
          <template #[`item.status`]="{ item }">
            <v-menu>
              <template #activator="{ props: menuProps }">
                <v-chip
                  v-bind="menuProps"
                  :color="statusColor(item.status)"
                  size="small"
                  variant="tonal"
                  append-icon="mdi-menu-down"
                  :disabled="statusSaving === item.id"
                  @click.stop
                >
                  {{ statusLabel(item.status) }}
                </v-chip>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="s in STATUS_ITEMS"
                  :key="s.value"
                  :title="s.title"
                  :active="s.value === item.status"
                  @click="changeStatus(item, s.value)"
                />
              </v-list>
            </v-menu>
          </template>
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
              <v-btn icon="mdi-pencil" size="small" variant="text" aria-label="Изменить" @click.stop="openEdit(item)" />
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

    <!-- Диалог создания / редактирования документа -->
    <v-dialog v-model="editDialog" max-width="980" persistent scrollable>
      <v-card>
        <v-card-title>
          {{ editingId ? `${kindMeta.title} № ${editingNumber}` : kind === 'invoice' ? 'Новый счёт' : 'Новый акт' }}
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-row dense>
              <v-col cols="12" md="8" class="d-flex ga-2 align-start">
                <v-autocomplete
                  v-model="form.client_id"
                  :items="formClients.items.value"
                  :loading="formClients.loading.value"
                  item-title="name"
                  item-value="id"
                  label="Клиент *"
                  no-filter
                  :rules="[rules.required]"
                  no-data-text="Клиенты не найдены"
                  @update:search="formClients.search"
                  @update:model-value="formClients.pinById"
                  @update:focused="(f) => f && formClients.loadOnce()"
                >
                  <template #item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps" :subtitle="item.raw.inn ? `ИНН ${item.raw.inn}` : ''" />
                  </template>
                </v-autocomplete>
                <v-btn
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-account-plus"
                  class="mt-2"
                  @click="openQuickClient"
                >
                  Новый клиент
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-select v-model="form.status" :items="STATUS_ITEMS" label="Статус" />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="form.number"
                  label="Номер"
                  :placeholder="editingId ? '' : 'авто'"
                  :hint="editingId ? '' : 'Пусто — присвоится автоматически (ГГГГ-NNN)'"
                  persistent-hint
                  :rules="[rules.max32]"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field v-model="form.date" type="date" label="Дата *" :rules="[rules.required]" />
              </v-col>
              <v-col v-if="kind === 'invoice'" cols="12" sm="6" md="3">
                <v-text-field
                  v-model="form.due_date"
                  type="date"
                  label="Оплатить до"
                  clearable
                  :rules="[rules.dueDate]"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select v-model="form.vat" :items="vatItems" label="НДС" />
              </v-col>
            </v-row>

            <!-- Позиции -->
            <div class="text-subtitle-1 font-weight-medium mt-4 mb-2">Позиции</div>
            <div v-for="(row, index) in form.items" :key="row.key" class="item-row">
              <v-row dense align="start">
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="row.name"
                    :label="`Наименование ${index + 1} *`"
                    density="compact"
                    :rules="[rules.required, rules.max500]"
                  />
                </v-col>
                <v-col cols="4" md="2">
                  <v-text-field
                    v-model="row.quantity"
                    type="number"
                    min="0"
                    step="any"
                    label="Кол-во *"
                    density="compact"
                    :rules="[rules.positive]"
                  />
                </v-col>
                <v-col cols="4" md="1">
                  <v-combobox
                    v-model="row.unit"
                    :items="UNIT_ITEMS"
                    label="Ед."
                    density="compact"
                    :rules="[rules.required, rules.max20]"
                  />
                </v-col>
                <v-col cols="4" md="2">
                  <v-text-field
                    v-model="row.price"
                    type="number"
                    min="0"
                    step="0.01"
                    label="Цена, ₽ *"
                    density="compact"
                    :rules="[rules.nonNegative]"
                  />
                </v-col>
                <v-col cols="10" md="1" class="d-flex align-center item-amount">
                  {{ formatMoney(rowAmount(row)) }}
                </v-col>
                <v-col cols="2" md="1" class="d-flex justify-end">
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    aria-label="Удалить позицию"
                    :disabled="form.items.length === 1"
                    @click="removeRow(index)"
                  />
                </v-col>
              </v-row>
            </div>
            <div class="d-flex flex-wrap align-center ga-2">
              <v-btn variant="text" color="primary" prepend-icon="mdi-plus" @click="addRow">Добавить позицию</v-btn>
              <v-spacer />
              <div class="text-right">
                <div class="text-h6">Итого: {{ formatMoney(formTotal) }}</div>
                <div class="text-caption text-medium-emphasis">
                  <template v-if="form.vat === NO_VAT">Без НДС</template>
                  <template v-else>в т.ч. НДС {{ form.vat }}%: {{ formatMoney(vatIncluded(formTotal, form.vat)) }}</template>
                  · окончательную сумму рассчитает сервер
                </div>
              </div>
            </div>

            <v-divider class="my-4" />

            <v-row dense>
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="form.seller_name"
                  :label="kind === 'invoice' ? 'Поставщик' : 'Исполнитель'"
                  hint="Для PDF; по умолчанию — ваша компания"
                  persistent-hint
                  :rules="[rules.max255]"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="form.seller_inn" label="ИНН исполнителя" :rules="[rules.inn]" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="form.notes" label="Заметки" rows="2" auto-grow />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="editDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="save">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Быстрое создание клиента -->
    <v-dialog v-model="quickClientDialog" max-width="480" persistent>
      <v-card>
        <v-card-title>Новый клиент</v-card-title>
        <v-card-text>
          <v-form ref="quickClientFormRef" @submit.prevent="saveQuickClient">
            <v-text-field
              v-model="quickClient.name"
              label="Наименование / ФИО *"
              :rules="[rules.required, rules.max255]"
              autofocus
            />
            <v-select v-model="quickClient.type" :items="CLIENT_TYPE_ITEMS" label="Тип" />
            <v-text-field v-model="quickClient.inn" label="ИНН" :rules="[rules.inn]" />
            <v-text-field v-model="quickClient.email" label="Email" type="email" :rules="[rules.email]" />
            <v-text-field v-model="quickClient.phone" label="Телефон" :rules="[rules.max50]" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="quickClientSaving" @click="quickClientDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="quickClientSaving" @click="saveQuickClient">Создать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>{{ kind === 'invoice' ? 'Удалить счёт?' : 'Удалить акт?' }}</v-card-title>
        <v-card-text v-if="toDelete">
          № {{ toDelete.number }} от {{ formatDate(toDelete.date) }} — {{ toDelete.client_name }},
          {{ formatMoney(toDelete.total) }}
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
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
  createAct,
  createClient,
  createInvoice,
  deleteAct,
  deleteInvoice,
  downloadActPdf,
  downloadInvoicePdf,
  listActs,
  listClients,
  listInvoices,
  updateAct,
  updateInvoice,
} from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { downloadCsv } from '@/utils/csv.js';
import { debounce } from '@/utils/debounce.js';
import { formatDate, formatMoney } from '@/utils/format.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notify = useNotifyStore();

const DATE = 'YYYY-MM-DD';

// ------------------------------------------------------------------ справочники
const STATUS_ITEMS = [
  { title: 'Черновик', value: 'draft' },
  { title: 'Отправлен', value: 'sent' },
  { title: 'Подписан', value: 'signed' },
  { title: 'Оплачен', value: 'paid' },
  { title: 'Отменён', value: 'cancelled' },
];
const STATUS_COLORS = { draft: 'grey', sent: 'info', signed: 'primary', paid: 'success', cancelled: 'error' };
const UNIT_ITEMS = ['шт', 'усл', 'час', 'кг', 'м', 'мес'];
const CLIENT_TYPE_ITEMS = [
  { title: 'Организация', value: 'company' },
  { title: 'ИП', value: 'ip' },
  { title: 'Физическое лицо', value: 'individual' },
];
/** v-select не показывает выбранный null, поэтому «без НДС» — отдельное значение. */
const NO_VAT = 'none';
const BASE_VAT_RATES = [20, 10, 5, 7];

const KINDS = {
  act: {
    title: 'Акт',
    list: listActs,
    create: createAct,
    update: updateAct,
    remove: deleteAct,
    pdf: downloadActPdf,
    csvName: 'acts',
  },
  invoice: {
    title: 'Счёт',
    list: listInvoices,
    create: createInvoice,
    update: updateInvoice,
    remove: deleteInvoice,
    pdf: downloadInvoicePdf,
    csvName: 'invoices',
  },
};

function statusLabel(status) {
  return STATUS_ITEMS.find((s) => s.value === status)?.title ?? status;
}
function statusColor(status) {
  return STATUS_COLORS[status] ?? 'grey';
}
function vatLabel(rate) {
  return rate === null || rate === undefined ? 'без НДС' : `НДС ${Number(rate)}%`;
}
/** НДС, включённый в сумму (как в PDF: «В том числе НДС»). */
function vatIncluded(total, rate) {
  const r = Number(rate);
  if (!r) return 0;
  return Math.round(((Number(total) || 0) * r * 100) / (100 + r)) / 100;
}
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function isOverdue(doc) {
  return Boolean(
    doc.due_date && !['paid', 'cancelled'].includes(doc.status) && doc.due_date < dayjs().format(DATE),
  );
}

// ------------------------------------------------------------------ вкладка (акты / счета)
const kind = ref(route.query.kind === 'invoice' ? 'invoice' : 'act');
const kindMeta = computed(() => KINDS[kind.value]);

watch(kind, (value) => {
  const query = { ...route.query };
  if (value === 'invoice') query.kind = 'invoice';
  else delete query.kind;
  router.replace({ query });
  reloadFromFirstPage();
});

watch(
  () => route.query.kind,
  (value) => {
    const next = value === 'invoice' ? 'invoice' : 'act';
    if (next !== kind.value) kind.value = next;
  },
);

// ------------------------------------------------------------------ выбор клиента (серверный поиск)
function createClientPicker() {
  const results = ref([]);
  const pinned = ref([]);
  const loading = ref(false);
  let seq = 0;
  let loaded = false;

  const items = computed(() => {
    const ids = new Set(results.value.map((c) => c.id));
    return [...pinned.value.filter((c) => !ids.has(c.id)), ...results.value];
  });

  async function load(query = '') {
    const s = ++seq;
    loading.value = true;
    try {
      const data = await listClients({ search: query?.trim(), limit: 20 });
      if (s === seq) {
        results.value = data.items;
        loaded = true;
      }
    } catch (err) {
      if (s === seq) notify.error(err);
    } finally {
      if (s === seq) loading.value = false;
    }
  }

  /** Держим выбранного клиента в items, иначе autocomplete покажет UUID вместо имени. */
  function pin(client) {
    if (!client?.id) return;
    pinned.value = [{ id: client.id, name: client.name, inn: client.inn ?? '' }];
  }

  function pinById(id) {
    const client = items.value.find((c) => c.id === id);
    if (client) pin(client);
  }

  function loadOnce() {
    if (!loaded) load('');
  }

  return { items, loading, search: debounce(load, 300), pin, pinById, loadOnce, load };
}

const filterClients = createClientPicker();
const formClients = createClientPicker();

// ------------------------------------------------------------------ список
const headers = computed(() => {
  const list = [
    { title: 'Номер', key: 'number', sortable: false, width: 130 },
    { title: 'Дата', key: 'date', sortable: false, width: 110 },
    { title: 'Клиент', key: 'client_name', sortable: false },
    { title: 'Сумма', key: 'total', sortable: false, align: 'end', width: 160 },
  ];
  if (kind.value === 'invoice') list.push({ title: 'Оплатить до', key: 'due_date', sortable: false, width: 120 });
  list.push(
    { title: 'Статус', key: 'status', sortable: false, width: 150 },
    { title: '', key: 'actions', sortable: false, align: 'end', width: 140 },
  );
  return list;
});

const filters = reactive({ search: '', status: null, client_id: null, date_from: '', date_to: '' });
const documents = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const loading = ref(false);

function validPeriod() {
  return !filters.date_from || !filters.date_to || filters.date_from <= filters.date_to;
}

function filterParams() {
  return {
    search: filters.search?.trim(),
    status: filters.status,
    client_id: filters.client_id,
    date_from: filters.date_from,
    date_to: filters.date_to,
  };
}

let requestSeq = 0;
async function load() {
  if (!validPeriod()) return;
  const seq = ++requestSeq;
  loading.value = true;
  try {
    const data = await kindMeta.value.list({ ...filterParams(), page: page.value, limit: limit.value });
    if (seq !== requestSeq) return;
    documents.value = data.items;
    total.value = data.total;
  } catch (err) {
    if (seq === requestSeq) notify.error(err);
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

function reloadFromFirstPage() {
  if (page.value !== 1) page.value = 1;
  else load();
}
const debouncedReload = debounce(reloadFromFirstPage, 400);

watch([page, limit], load);
watch(() => [filters.status, filters.client_id], reloadFromFirstPage);
watch(() => filters.search, debouncedReload);
watch(
  () => [filters.date_from, filters.date_to],
  () => {
    if (!validPeriod()) {
      notify.warning('Дата начала периода позже даты окончания');
      return;
    }
    reloadFromFirstPage();
  },
);

function onRowClick(_event, { item }) {
  openDetail(item);
}

function openDetail(doc) {
  router.push({
    name: 'act-detail',
    params: { id: doc.id },
    query: kind.value === 'invoice' ? { kind: 'invoice' } : {},
  });
}

// ------------------------------------------------------------------ смена статуса
const statusSaving = ref(null);

async function changeStatus(doc, status) {
  if (doc.status === status) return;
  statusSaving.value = doc.id;
  try {
    const updated = await kindMeta.value.update(doc.id, { status });
    Object.assign(doc, updated);
    notify.success(`Статус: ${statusLabel(status)}`);
    if (filters.status && filters.status !== status) await load();
  } catch (err) {
    notify.error(err);
  } finally {
    statusSaving.value = null;
  }
}

// ------------------------------------------------------------------ PDF и CSV
const pdfLoading = ref(null);

async function downloadPdf(doc) {
  pdfLoading.value = doc.id;
  try {
    await kindMeta.value.pdf(doc.id, `${kindMeta.value.title}-${doc.number}.pdf`);
  } catch (err) {
    notify.error(err);
  } finally {
    pdfLoading.value = null;
  }
}

const exporting = ref(false);
const EXPORT_MAX_PAGES = 50; // до 5000 документов за раз

async function exportCsv() {
  if (!validPeriod()) return;
  exporting.value = true;
  try {
    const rows = [];
    for (let p = 1; p <= EXPORT_MAX_PAGES; p += 1) {
      const data = await kindMeta.value.list({ ...filterParams(), page: p, limit: 100 });
      rows.push(...data.items);
      if (!data.items.length || rows.length >= data.total) break;
    }
    const columns = [
      { key: 'number', title: 'Номер' },
      { key: 'date', title: 'Дата', format: (v) => formatDate(v) },
      { key: 'client_name', title: 'Клиент' },
      { key: 'items', title: 'Позиции', format: (v) => (v ?? []).map((i) => i.name).join(', ') },
      { key: 'total', title: 'Сумма, ₽', format: (v) => round2(v) },
      { key: 'vat_rate', title: 'НДС', format: (v) => vatLabel(v) },
      { key: 'status', title: 'Статус', format: (v) => statusLabel(v) },
    ];
    if (kind.value === 'invoice') {
      columns.push({ key: 'due_date', title: 'Оплатить до', format: (v) => (v ? formatDate(v) : '') });
    }
    columns.push({ key: 'notes', title: 'Заметки' });
    downloadCsv(rows, columns, `${kindMeta.value.csvName}-${dayjs().format(DATE)}.csv`);
    if (rows.length < total.value) notify.warning(`Выгружено ${rows.length} из ${total.value} документов`);
  } catch (err) {
    notify.error(err);
  } finally {
    exporting.value = false;
  }
}

// ------------------------------------------------------------------ форма документа
const editDialog = ref(false);
const editingId = ref(null);
const editingNumber = ref('');
const saving = ref(false);
const formRef = ref(null);
let rowKey = 0;

function emptyRow() {
  rowKey += 1;
  return { key: rowKey, name: '', quantity: '1', unit: 'шт', price: '' };
}

function companyDefaults() {
  const company = auth.user?.company;
  return { seller_name: company?.name ?? '', seller_inn: company?.inn ?? '' };
}

function emptyForm() {
  return {
    client_id: null,
    status: 'draft',
    number: '',
    date: dayjs().format(DATE),
    due_date: '',
    vat: NO_VAT,
    items: [emptyRow()],
    notes: '',
    ...companyDefaults(),
  };
}
const form = reactive(emptyForm());

const vatItems = computed(() => {
  const rates = [...BASE_VAT_RATES];
  if (form.vat !== NO_VAT && !rates.includes(form.vat)) rates.push(form.vat);
  return [{ title: 'Без НДС', value: NO_VAT }, ...rates.map((r) => ({ title: `${r}%`, value: r }))];
});

function rowAmount(row) {
  return round2(Number(row.quantity) * Number(row.price));
}
const formTotal = computed(() => round2(form.items.reduce((sum, row) => sum + rowAmount(row), 0)));

function addRow() {
  form.items.push(emptyRow());
}
function removeRow(index) {
  if (form.items.length > 1) form.items.splice(index, 1);
}

const rules = {
  required: (v) => (v !== null && v !== undefined && String(v).trim() !== '') || 'Обязательное поле',
  positive: (v) => Number(v) > 0 || 'Больше нуля',
  nonNegative: (v) => (v !== '' && v !== null && Number(v) >= 0) || 'Не меньше нуля',
  max20: (v) => !v || String(v).length <= 20 || 'Не более 20 символов',
  max32: (v) => !v || String(v).trim().length <= 32 || 'Не более 32 символов',
  max50: (v) => !v || String(v).length <= 50 || 'Не более 50 символов',
  max255: (v) => !v || String(v).length <= 255 || 'Не более 255 символов',
  max500: (v) => !v || String(v).length <= 500 || 'Не более 500 символов',
  inn: (v) => !v || /^(\d{10}|\d{12})$/.test(String(v).trim()) || 'ИНН — 10 или 12 цифр',
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) || 'Некорректный email',
  dueDate: (v) => !v || !form.date || v >= form.date || 'Срок оплаты раньше даты счёта',
};

function openCreate() {
  editingId.value = null;
  editingNumber.value = '';
  Object.assign(form, emptyForm());
  editDialog.value = true;
  formClients.loadOnce();
}

/** @param {import('@/api/types.js').Document} doc */
function openEdit(doc) {
  editingId.value = doc.id;
  editingNumber.value = doc.number;
  const defaults = companyDefaults();
  const hasSeller = Boolean(doc.seller_name || doc.seller_inn);
  formClients.pin({ id: doc.client_id, name: doc.client_name });
  Object.assign(form, {
    client_id: doc.client_id,
    status: doc.status,
    number: doc.number,
    date: doc.date,
    due_date: doc.due_date ?? '',
    vat: doc.vat_rate === null || doc.vat_rate === undefined ? NO_VAT : Number(doc.vat_rate),
    items: (doc.items ?? []).map((i) => {
      rowKey += 1;
      return { key: rowKey, name: i.name, quantity: String(i.quantity), unit: i.unit, price: String(i.price) };
    }),
    notes: doc.notes ?? '',
    seller_name: hasSeller ? doc.seller_name ?? '' : defaults.seller_name,
    seller_inn: hasSeller ? doc.seller_inn ?? '' : defaults.seller_inn,
  });
  if (!form.items.length) form.items.push(emptyRow());
  editDialog.value = true;
}

function buildPayload() {
  const payload = {
    client_id: form.client_id,
    date: form.date,
    items: form.items.map((row) => ({
      name: row.name.trim(),
      quantity: Number(row.quantity),
      unit: String(row.unit ?? '').trim() || 'шт',
      price: round2(row.price),
    })),
    status: form.status,
    notes: form.notes ?? '',
    vat_rate: form.vat === NO_VAT ? null : Number(form.vat),
    seller_name: form.seller_name?.trim() ?? '',
    seller_inn: form.seller_inn?.trim() ?? '',
  };
  const number = form.number?.trim();
  if (number) payload.number = number;
  if (kind.value === 'invoice') payload.due_date = form.due_date || null;
  return payload;
}

async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const payload = buildPayload();
    if (editingId.value) {
      await kindMeta.value.update(editingId.value, payload);
      notify.success(`${kindMeta.value.title} сохранён`);
    } else {
      const created = await kindMeta.value.create(payload);
      notify.success(`${kindMeta.value.title} № ${created.number} создан`);
    }
    editDialog.value = false;
    await load();
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

// ------------------------------------------------------------------ быстрый клиент
const quickClientDialog = ref(false);
const quickClientSaving = ref(false);
const quickClientFormRef = ref(null);
const quickClient = reactive({ name: '', type: 'company', inn: '', email: '', phone: '' });

function openQuickClient() {
  Object.assign(quickClient, { name: '', type: 'company', inn: '', email: '', phone: '' });
  quickClientDialog.value = true;
}

async function saveQuickClient() {
  const { valid } = await quickClientFormRef.value.validate();
  if (!valid) return;
  quickClientSaving.value = true;
  try {
    const client = await createClient({
      name: quickClient.name.trim(),
      type: quickClient.type,
      inn: quickClient.inn?.trim() ?? '',
      email: quickClient.email?.trim() ?? '',
      phone: quickClient.phone?.trim() ?? '',
    });
    formClients.pin(client);
    form.client_id = client.id;
    quickClientDialog.value = false;
    notify.success(`Клиент «${client.name}» создан`);
  } catch (err) {
    notify.error(err);
  } finally {
    quickClientSaving.value = false;
  }
}

// ------------------------------------------------------------------ удаление
const deleteDialog = ref(false);
const toDelete = ref(null);
const deleting = ref(false);

function askDelete(doc) {
  toDelete.value = doc;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await kindMeta.value.remove(toDelete.value.id);
    notify.success(`${kindMeta.value.title} удалён`);
    deleteDialog.value = false;
    if (documents.value.length === 1 && page.value > 1) page.value -= 1;
    else await load();
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

onMounted(load);

// Отложенный вызов debounce после ухода со страницы дал бы лишний запрос.
onUnmounted(() => {
  debouncedReload.cancel();
  filterClients.search.cancel();
  formClients.search.cancel();
});
</script>

<style scoped>
.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}
.item-row {
  border-bottom: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: 8px;
}
.item-amount {
  min-height: 40px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
