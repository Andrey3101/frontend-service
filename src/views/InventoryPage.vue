<template>
  <div>
    <!-- Сводка по складу -->
    <v-row class="mb-2">
      <v-col v-for="card in summaryCards" :key="card.key" cols="6" md="3">
        <v-card
          :loading="analyticsLoading"
          class="h-100"
          :color="card.color"
          :variant="card.color ? 'tonal' : 'elevated'"
          v-bind="card.onClick ? { onClick: card.onClick } : {}"
        >
          <v-card-text>
            <div class="text-caption text-medium-emphasis">{{ card.title }}</div>
            <div class="text-h5 font-weight-bold">{{ card.value }}</div>
            <div v-if="card.hint" class="text-caption text-medium-emphasis">{{ card.hint }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Товары -->
      <v-col cols="12" xl="8">
        <v-card>
          <v-card-title class="d-flex flex-wrap align-center ga-2">
            Товары
            <v-spacer />
            <v-btn variant="text" prepend-icon="mdi-history" @click="openHistory(null)">Журнал движений</v-btn>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Добавить товар</v-btn>
          </v-card-title>
          <v-card-text>
            <v-row dense align="center" class="mb-2">
              <v-col cols="12" md="5">
                <v-text-field
                  v-model="filters.search"
                  label="Поиск по названию или артикулу"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  hide-details
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-combobox
                  v-model="filters.category"
                  :items="categories"
                  label="Категория"
                  clearable
                  hide-details
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-switch
                  v-model="filters.lowStock"
                  label="Мало на складе"
                  color="warning"
                  hide-details
                  density="compact"
                  inset
                />
              </v-col>
            </v-row>

            <v-data-table-server
              v-model:page="page"
              v-model:items-per-page="limit"
              :headers="headers"
              :items="products"
              :items-length="total"
              :items-per-page-options="[10, 20, 50, 100]"
              :loading="loading"
              loading-text="Загрузка…"
              :no-data-text="filters.lowStock ? 'Товаров с низким остатком нет' : 'Товаров нет'"
              item-value="id"
            >
              <template #[`item.name`]="{ item }">
                <div class="font-weight-medium">{{ item.name }}</div>
                <div v-if="item.sku" class="text-caption text-medium-emphasis">Арт. {{ item.sku }}</div>
              </template>
              <template #[`item.category`]="{ item }">{{ item.category || '—' }}</template>
              <template #[`item.quantity`]="{ item }">
                <v-chip v-if="isLow(item)" size="small" color="warning" variant="tonal" prepend-icon="mdi-alert-outline">
                  {{ formatNumber(item.quantity) }} {{ item.unit }}
                </v-chip>
                <span v-else class="text-no-wrap">{{ formatNumber(item.quantity) }} {{ item.unit }}</span>
                <div class="text-caption text-medium-emphasis">мин. {{ formatNumber(item.min_quantity) }}</div>
              </template>
              <template #[`item.price`]="{ item }">
                <div class="text-no-wrap">{{ formatMoney(item.price) }}</div>
                <div class="text-caption text-medium-emphasis text-no-wrap">себест. {{ formatMoney(item.cost) }}</div>
              </template>
              <template #[`item.actions`]="{ item }">
                <div class="d-flex justify-end text-no-wrap">
                  <v-btn
                    icon="mdi-swap-vertical"
                    size="small"
                    variant="text"
                    color="primary"
                    aria-label="Движение товара"
                    title="Приход / расход / инвентаризация"
                    @click="openMovement(item)"
                  />
                  <v-btn
                    icon="mdi-history"
                    size="small"
                    variant="text"
                    aria-label="История движений"
                    title="История движений"
                    @click="openHistory(item)"
                  />
                  <v-btn
                    icon="mdi-chart-timeline-variant"
                    size="small"
                    variant="text"
                    aria-label="Прогноз"
                    title="Прогноз расхода"
                    @click="openForecast(item)"
                  />
                  <v-btn icon="mdi-pencil" size="small" variant="text" aria-label="Изменить" @click="openEdit(item)" />
                  <v-btn
                    icon="mdi-delete-outline"
                    size="small"
                    variant="text"
                    color="error"
                    aria-label="Удалить"
                    @click="askDelete(item)"
                  />
                </div>
              </template>
            </v-data-table-server>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Аналитика -->
      <v-col cols="12" xl="4">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            Заканчиваются
            <v-spacer />
            <v-btn icon="mdi-refresh" size="small" variant="text" aria-label="Обновить" :loading="analyticsLoading" @click="loadAnalytics" />
          </v-card-title>
          <v-card-text>
            <v-list v-if="lowStock.length" density="compact" class="py-0">
              <v-list-item v-for="p in lowStock.slice(0, 8)" :key="p.id" class="px-0">
                <v-list-item-title>{{ p.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  остаток {{ formatNumber(p.quantity) }} {{ p.unit }} · минимум {{ formatNumber(p.min_quantity) }}
                </v-list-item-subtitle>
                <template #append>
                  <v-btn size="small" variant="tonal" color="primary" @click="openMovement(p, 'in')">Приход</v-btn>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-body-2 text-medium-emphasis">
              {{ analyticsLoading ? 'Загрузка…' : 'Все остатки выше минимальных' }}
            </div>
            <v-btn
              v-if="lowStock.length > 8"
              variant="text"
              size="small"
              class="mt-2"
              @click="filters.lowStock = true"
            >
              Показать все в таблице
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Топ по расходу за 30 дней</v-card-title>
          <v-card-text>
            <v-list v-if="topMoving.length" density="compact" class="py-0">
              <v-list-item v-for="(t, index) in topMoving" :key="t.product_id" class="px-0">
                <template #prepend>
                  <span class="text-medium-emphasis mr-3">{{ index + 1 }}.</span>
                </template>
                <v-list-item-title>{{ t.name }}</v-list-item-title>
                <v-list-item-subtitle>списано {{ formatNumber(t.out_quantity) }}</v-list-item-subtitle>
                <template #append>
                  <v-btn
                    icon="mdi-chart-timeline-variant"
                    size="small"
                    variant="text"
                    aria-label="Прогноз"
                    title="Прогноз расхода"
                    @click="openForecast({ id: t.product_id, name: t.name })"
                  />
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-body-2 text-medium-emphasis">
              {{ analyticsLoading ? 'Загрузка…' : 'За последние 30 дней списаний не было' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Товар: создание / редактирование -->
    <v-dialog v-model="productDialog" max-width="640" persistent>
      <v-card>
        <v-card-title>{{ editingId ? 'Изменить товар' : 'Новый товар' }}</v-card-title>
        <v-card-text>
          <v-form ref="productFormRef" @submit.prevent="saveProduct">
            <v-row dense>
              <v-col cols="12" sm="8">
                <v-text-field v-model="productForm.name" label="Название *" :rules="[rules.required, rules.max255]" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="productForm.sku" label="Артикул" :rules="[rules.max100]" />
              </v-col>
              <v-col cols="12" sm="8">
                <v-combobox v-model="productForm.category" :items="categories" label="Категория" :rules="[rules.max100]" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-combobox
                  v-model="productForm.unit"
                  :items="UNIT_ITEMS"
                  label="Единица *"
                  :rules="[rules.required, rules.max20]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="productForm.price"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Цена продажи, ₽"
                  :rules="[rules.nonNegative]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="productForm.cost"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Себестоимость, ₽"
                  :rules="[rules.nonNegative]"
                />
              </v-col>
              <v-col v-if="!editingId" cols="12" sm="6">
                <v-text-field
                  v-model="productForm.quantity"
                  type="number"
                  min="0"
                  step="any"
                  label="Начальный остаток"
                  :rules="[rules.nonNegative]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="productForm.min_quantity"
                  type="number"
                  min="0"
                  step="any"
                  label="Минимальный остаток"
                  hint="При остатке не выше этого товар попадёт в «Мало на складе»"
                  persistent-hint
                  :rules="[rules.nonNegative]"
                />
              </v-col>
            </v-row>
            <div v-if="editingId" class="text-caption text-medium-emphasis mt-2">
              Остаток меняется через движение товара (приход, расход, инвентаризация) — так сохраняется история.
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="productSaving" @click="productDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="productSaving" @click="saveProduct">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Движение товара -->
    <v-dialog v-model="movementDialog" max-width="520" persistent>
      <v-card v-if="movementProduct">
        <v-card-title class="text-wrap">Движение: {{ movementProduct.name }}</v-card-title>
        <v-card-text>
          <v-form ref="movementFormRef" @submit.prevent="saveMovement">
            <v-btn-toggle v-model="movement.type" mandatory color="primary" variant="outlined" divided class="mb-4 flex-wrap">
              <v-btn value="in" prepend-icon="mdi-tray-arrow-down">Приход</v-btn>
              <v-btn value="out" prepend-icon="mdi-tray-arrow-up">Расход</v-btn>
              <v-btn value="adjust" prepend-icon="mdi-clipboard-check-outline">Инвентаризация</v-btn>
            </v-btn-toggle>
            <div class="text-body-2 mb-3">
              Сейчас на складе: <strong>{{ formatNumber(movementProduct.quantity) }} {{ movementProduct.unit }}</strong>
            </div>
            <v-text-field
              v-model="movement.quantity"
              type="number"
              min="0"
              step="any"
              :label="movement.type === 'adjust' ? 'Фактический остаток *' : 'Количество *'"
              :suffix="movementProduct.unit"
              :hint="movement.type === 'adjust' ? 'Сколько товара фактически на складе по итогам пересчёта' : ''"
              persistent-hint
              :rules="[rules.movementQuantity]"
              autofocus
            />
            <v-textarea v-model="movement.note" label="Комментарий" rows="2" auto-grow class="mt-2" />
            <v-alert
              v-if="movementResult !== null"
              :type="movementResult < 0 ? 'error' : 'info'"
              variant="tonal"
              density="compact"
            >
              <template v-if="movementResult < 0">Недостаточно товара: расход больше остатка</template>
              <template v-else>
                После операции: {{ formatNumber(movementResult) }} {{ movementProduct.unit }}
                <span v-if="movement.type === 'adjust'">
                  ({{ movementDelta >= 0 ? '+' : '' }}{{ formatNumber(movementDelta) }})
                </span>
              </template>
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="movementSaving" @click="movementDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="movementSaving" @click="saveMovement">Провести</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- История движений -->
    <v-dialog v-model="historyDialog" max-width="860" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center text-wrap">
          {{ historyProduct ? `История: ${historyProduct.name}` : 'Журнал движений' }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" aria-label="Закрыть" @click="historyDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-data-table-server
            v-model:page="historyPage"
            v-model:items-per-page="historyLimit"
            :headers="historyHeaders"
            :items="history"
            :items-length="historyTotal"
            :items-per-page-options="[10, 20, 50, 100]"
            :loading="historyLoading"
            loading-text="Загрузка…"
            no-data-text="Движений нет"
            item-value="id"
            density="compact"
          >
            <template #[`item.created_at`]="{ item }">{{ formatDateTime(item.created_at) }}</template>
            <template #[`item.type`]="{ item }">
              <v-chip size="small" variant="tonal" :color="TX_TYPES[item.type]?.color">
                {{ TX_TYPES[item.type]?.title ?? item.type }}
              </v-chip>
            </template>
            <template #[`item.quantity`]="{ item }">
              <span :class="TX_TYPES[item.type]?.textClass" class="font-weight-medium text-no-wrap">
                {{ TX_TYPES[item.type]?.sign }}{{ formatNumber(item.quantity) }}
              </span>
            </template>
            <template #[`item.note`]="{ item }">{{ item.note || '—' }}</template>
          </v-data-table-server>
          <div class="text-caption text-medium-emphasis pa-3">
            Для инвентаризации указан фактический остаток после пересчёта.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Прогноз -->
    <v-dialog v-model="forecastDialog" max-width="600">
      <v-card v-if="forecastProduct">
        <v-card-title class="text-wrap">Прогноз: {{ forecastProduct.name }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="forecastDays"
            :items="FORECAST_DAYS"
            label="Период"
            hint="Средний расход за последние N дней переносится на следующие N дней"
            persistent-hint
            class="mb-4"
          />
          <v-progress-linear v-if="forecastLoading" indeterminate color="primary" class="mb-3" />
          <template v-if="forecast">
            <v-table density="compact" class="mb-3">
              <tbody>
                <tr>
                  <td>Текущий остаток</td>
                  <td class="text-right">{{ formatNumber(forecast.current_quantity) }} {{ forecastUnit }}</td>
                </tr>
                <tr>
                  <td>Средний расход в день</td>
                  <td class="text-right">{{ formatNumber(forecast.avg_daily_out) }} {{ forecastUnit }}</td>
                </tr>
                <tr>
                  <td>Ожидаемый расход за {{ forecastDays }} дн.</td>
                  <td class="text-right">{{ formatNumber(forecast.forecast_out) }} {{ forecastUnit }}</td>
                </tr>
                <tr>
                  <td>Запаса хватит на</td>
                  <td class="text-right">
                    {{ forecast.days_until_stockout === null ? '—' : `${formatNumber(forecast.days_until_stockout)} дн.` }}
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-medium">Рекомендуется заказать</td>
                  <td class="text-right font-weight-medium">
                    {{ formatNumber(forecast.recommended_order) }} {{ forecastUnit }}
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-alert :type="forecastAdvice.type" variant="tonal" density="compact">
              <div v-for="(line, i) in forecastAdvice.lines" :key="i">{{ line }}</div>
            </v-alert>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-btn
            v-if="forecast && forecast.recommended_order > 0 && forecastProductFull"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-tray-arrow-down"
            @click="receiveRecommended"
          >
            Оформить приход
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="forecastDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Удаление товара -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title>Удалить товар?</v-card-title>
        <v-card-text v-if="toDelete">
          «{{ toDelete.name }}» будет удалён вместе с историей движений.
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
import {
  createInventoryTransaction,
  createProduct,
  deleteProduct,
  getInventoryAnalytics,
  getInventoryForecast,
  getProduct,
  listInventoryTransactions,
  listProducts,
  updateProduct,
} from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { debounce } from '@/utils/debounce.js';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/utils/format.js';

const notify = useNotifyStore();

const UNIT_ITEMS = ['шт', 'кг', 'г', 'л', 'м', 'м²', 'уп', 'компл'];
const TX_TYPES = {
  in: { title: 'Приход', color: 'success', sign: '+', textClass: 'text-success' },
  out: { title: 'Расход', color: 'error', sign: '−', textClass: 'text-error' },
  adjust: { title: 'Инвентаризация', color: 'info', sign: '= ', textClass: 'text-info' },
};
const FORECAST_DAYS = [7, 14, 30, 60, 90, 180, 365].map((d) => ({ title: `${d} дней`, value: d }));

function isLow(product) {
  return Number(product.quantity) <= Number(product.min_quantity);
}

// ------------------------------------------------------------------ аналитика
const analytics = ref(null);
const analyticsLoading = ref(false);

const lowStock = computed(() => analytics.value?.low_stock ?? []);
const topMoving = computed(() => analytics.value?.top_moving ?? []);

const summaryCards = computed(() => {
  const a = analytics.value;
  const lowCount = lowStock.value.length;
  return [
    { key: 'products', title: 'Товаров', value: a ? formatNumber(a.total_products) : '—' },
    { key: 'qty', title: 'Единиц на складе', value: a ? formatNumber(a.total_quantity) : '—' },
    {
      key: 'value',
      title: 'Стоимость запасов',
      value: a ? formatMoney(a.stock_value) : '—',
      hint: 'по себестоимости (если не задана — по цене)',
    },
    {
      key: 'low',
      title: 'Мало на складе',
      value: a ? (lowCount >= 100 ? '100+' : formatNumber(lowCount)) : '—',
      color: lowCount ? 'warning' : undefined,
      hint: lowCount ? 'нажмите, чтобы показать' : '',
      onClick: lowCount
        ? () => {
            filters.lowStock = true;
          }
        : null,
    },
  ];
});

async function loadAnalytics() {
  analyticsLoading.value = true;
  try {
    analytics.value = await getInventoryAnalytics();
    rememberCategories(analytics.value.low_stock);
  } catch (err) {
    notify.error(err);
  } finally {
    analyticsLoading.value = false;
  }
}

// ------------------------------------------------------------------ товары
const headers = [
  { title: 'Товар', key: 'name', sortable: false },
  { title: 'Категория', key: 'category', sortable: false },
  { title: 'Остаток', key: 'quantity', sortable: false, width: 150 },
  { title: 'Цена', key: 'price', sortable: false, align: 'end', width: 150 },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 220 },
];

const filters = reactive({ search: '', category: null, lowStock: false });
const products = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const loading = ref(false);

/** Справочника категорий в API нет — собираем из увиденных товаров. */
const categories = ref([]);
function rememberCategories(list) {
  const set = new Set(categories.value);
  for (const p of list ?? []) if (p.category) set.add(p.category);
  if (set.size !== categories.value.length) categories.value = [...set].sort((a, b) => a.localeCompare(b, 'ru'));
}

let requestSeq = 0;
async function loadProducts() {
  const seq = ++requestSeq;
  loading.value = true;
  try {
    const data = await listProducts({
      search: filters.search?.trim(),
      category: typeof filters.category === 'string' ? filters.category.trim() : null,
      low_stock: filters.lowStock || undefined,
      page: page.value,
      limit: limit.value,
    });
    if (seq !== requestSeq) return;
    products.value = data.items;
    total.value = data.total;
    rememberCategories(data.items);
  } catch (err) {
    if (seq === requestSeq) notify.error(err);
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

function reloadFromFirstPage() {
  if (page.value !== 1) page.value = 1;
  else loadProducts();
}

watch([page, limit], loadProducts);
const debouncedReload = debounce(reloadFromFirstPage, 400);
// Отложенный вызов debounce после ухода со страницы дал бы лишний запрос.
onUnmounted(() => debouncedReload.cancel());
watch(() => filters.lowStock, reloadFromFirstPage);
// v-combobox обновляет значение при вводе — категорию и поиск применяем с задержкой.
watch(() => [filters.search, filters.category], debouncedReload);

async function refreshAll() {
  await Promise.all([loadProducts(), loadAnalytics()]);
}

// ------------------------------------------------------------------ форма товара
const productDialog = ref(false);
const editingId = ref(null);
const productSaving = ref(false);
const productFormRef = ref(null);

function emptyProduct() {
  return { name: '', sku: '', category: '', unit: 'шт', price: '0', cost: '0', quantity: '0', min_quantity: '0' };
}
const productForm = reactive(emptyProduct());

const rules = {
  required: (v) => Boolean(v && String(v).trim()) || 'Обязательное поле',
  max20: (v) => !v || String(v).length <= 20 || 'Не более 20 символов',
  max100: (v) => !v || String(v).length <= 100 || 'Не более 100 символов',
  max255: (v) => !v || String(v).length <= 255 || 'Не более 255 символов',
  nonNegative: (v) => v === '' || v === null || Number(v) >= 0 || 'Не меньше нуля',
  movementQuantity: (v) => {
    if (v === '' || v === null || Number.isNaN(Number(v))) return 'Укажите количество';
    if (movement.type === 'adjust') return Number(v) >= 0 || 'Не меньше нуля';
    return Number(v) > 0 || 'Больше нуля';
  },
};

function openCreate() {
  editingId.value = null;
  Object.assign(productForm, emptyProduct(), { category: filters.category || '' });
  productDialog.value = true;
}

/** @param {import('@/api/types.js').Product} product */
function openEdit(product) {
  editingId.value = product.id;
  Object.assign(productForm, {
    name: product.name,
    sku: product.sku ?? '',
    category: product.category ?? '',
    unit: product.unit || 'шт',
    price: String(product.price ?? 0),
    cost: String(product.cost ?? 0),
    quantity: String(product.quantity ?? 0),
    min_quantity: String(product.min_quantity ?? 0),
  });
  productDialog.value = true;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function saveProduct() {
  const { valid } = await productFormRef.value.validate();
  if (!valid) return;
  productSaving.value = true;
  try {
    const payload = {
      name: productForm.name.trim(),
      sku: productForm.sku?.trim() ?? '',
      category: String(productForm.category ?? '').trim(),
      unit: String(productForm.unit ?? '').trim() || 'шт',
      price: num(productForm.price),
      cost: num(productForm.cost),
      min_quantity: num(productForm.min_quantity),
    };
    if (editingId.value) {
      await updateProduct(editingId.value, payload);
      notify.success('Товар сохранён');
    } else {
      await createProduct({ ...payload, quantity: num(productForm.quantity) });
      notify.success('Товар добавлен');
    }
    productDialog.value = false;
    await refreshAll();
  } catch (err) {
    notify.error(err);
  } finally {
    productSaving.value = false;
  }
}

// ------------------------------------------------------------------ движение товара
const movementDialog = ref(false);
const movementProduct = ref(null);
const movementSaving = ref(false);
const movementFormRef = ref(null);
const movement = reactive({ type: 'in', quantity: '', note: '' });

const movementResult = computed(() => {
  const q = Number(movement.quantity);
  if (!movementProduct.value || movement.quantity === '' || Number.isNaN(q) || q < 0) return null;
  const current = Number(movementProduct.value.quantity);
  if (movement.type === 'in') return current + q;
  if (movement.type === 'out') return current - q;
  return q;
});
const movementDelta = computed(() =>
  movementResult.value === null ? 0 : movementResult.value - Number(movementProduct.value?.quantity ?? 0),
);

function openMovement(product, type = 'in', quantity = '') {
  movementProduct.value = product;
  Object.assign(movement, { type, quantity: quantity === '' ? '' : String(quantity), note: '' });
  movementDialog.value = true;
}

watch(
  () => movement.type,
  () => movementFormRef.value?.resetValidation(),
);

async function saveMovement() {
  const { valid } = await movementFormRef.value.validate();
  if (!valid) return;
  if (movementResult.value !== null && movementResult.value < 0) {
    notify.warning('Расход больше остатка на складе');
    return;
  }
  movementSaving.value = true;
  try {
    const productId = movementProduct.value.id;
    await createInventoryTransaction({
      product_id: productId,
      type: movement.type,
      quantity: Number(movement.quantity),
      note: movement.note?.trim() ?? '',
    });
    notify.success(`${TX_TYPES[movement.type].title}: проведено`);
    movementDialog.value = false;
    await refreshAll();
    if (historyDialog.value && (!historyProduct.value || historyProduct.value.id === productId)) await loadHistory();
  } catch (err) {
    notify.error(err); // 400 — недостаточно товара (текст с сервера)
  } finally {
    movementSaving.value = false;
  }
}

// ------------------------------------------------------------------ история движений
const historyDialog = ref(false);
const historyProduct = ref(null);
const history = ref([]);
const historyTotal = ref(0);
const historyPage = ref(1);
const historyLimit = ref(20);
const historyLoading = ref(false);

const historyHeaders = computed(() => {
  const list = [{ title: 'Дата', key: 'created_at', sortable: false, width: 150 }];
  if (!historyProduct.value) list.push({ title: 'Товар', key: 'product_name', sortable: false });
  list.push(
    { title: 'Операция', key: 'type', sortable: false, width: 150 },
    { title: 'Кол-во', key: 'quantity', sortable: false, align: 'end', width: 110 },
    { title: 'Комментарий', key: 'note', sortable: false },
  );
  return list;
});

let historySeq = 0;
async function loadHistory() {
  const seq = ++historySeq;
  historyLoading.value = true;
  try {
    const data = await listInventoryTransactions({
      product_id: historyProduct.value?.id,
      page: historyPage.value,
      limit: historyLimit.value,
    });
    if (seq !== historySeq) return;
    history.value = data.items;
    historyTotal.value = data.total;
  } catch (err) {
    if (seq === historySeq) notify.error(err);
  } finally {
    if (seq === historySeq) historyLoading.value = false;
  }
}

function openHistory(product) {
  historyProduct.value = product;
  history.value = [];
  historyTotal.value = 0;
  historyDialog.value = true;
  if (historyPage.value !== 1) historyPage.value = 1; // watcher загрузит
  else loadHistory();
}

watch([historyPage, historyLimit], () => {
  if (historyDialog.value) loadHistory();
});

// ------------------------------------------------------------------ прогноз
const forecastDialog = ref(false);
const forecastProduct = ref(null);
/** Полная карточка товара (единица, минимум) — у позиций «топа» есть только id и имя. */
const forecastProductFull = ref(null);
const forecastDays = ref(30);
const forecast = ref(null);
const forecastLoading = ref(false);

const forecastUnit = computed(() => forecastProductFull.value?.unit ?? '');

async function openForecast(product) {
  forecastProduct.value = product;
  forecastProductFull.value = product.unit ? product : null;
  forecast.value = null;
  forecastDialog.value = true;
  if (!forecastProductFull.value) {
    try {
      forecastProductFull.value = await getProduct(product.id);
    } catch (err) {
      notify.error(err);
    }
  }
  await loadForecast();
}

let forecastSeq = 0;
async function loadForecast() {
  if (!forecastProduct.value) return;
  const seq = ++forecastSeq;
  forecastLoading.value = true;
  try {
    const data = await getInventoryForecast({ product_id: forecastProduct.value.id, days: forecastDays.value });
    if (seq === forecastSeq) forecast.value = data;
  } catch (err) {
    if (seq === forecastSeq) {
      forecast.value = null;
      notify.error(err);
    }
  } finally {
    if (seq === forecastSeq) forecastLoading.value = false;
  }
}

watch(forecastDays, () => {
  if (forecastDialog.value) loadForecast();
});

function daysWord(n) {
  const v = Math.abs(Math.round(n)) % 100;
  const d = v % 10;
  if (v > 10 && v < 20) return 'дней';
  if (d === 1) return 'день';
  if (d >= 2 && d <= 4) return 'дня';
  return 'дней';
}

const forecastAdvice = computed(() => {
  const f = forecast.value;
  if (!f) return { type: 'info', lines: [] };
  const days = forecastDays.value;
  const unit = forecastUnit.value;
  const min = forecastProductFull.value?.min_quantity;
  const lines = [];
  let type = 'success';

  if (!f.avg_daily_out) {
    lines.push(`За последние ${days} ${daysWord(days)} расхода не было — оценить, когда закончится товар, нельзя.`);
    type = 'info';
  } else if (f.days_until_stockout !== null && f.days_until_stockout <= days) {
    const date = formatDate(dayjs().add(Math.floor(f.days_until_stockout), 'day'));
    lines.push(
      `При текущем темпе (${formatNumber(f.avg_daily_out)} ${unit} в день) товар закончится примерно через ` +
        `${formatNumber(f.days_until_stockout)} ${daysWord(f.days_until_stockout)} — около ${date}.`,
    );
    type = f.days_until_stockout <= 7 ? 'error' : 'warning';
  } else {
    lines.push(`При текущем темпе запаса хватит на ${formatNumber(f.days_until_stockout)} ${daysWord(f.days_until_stockout)} — дольше выбранного периода.`);
  }

  if (f.recommended_order > 0) {
    const minText = min ? ` и сохранить минимальный остаток ${formatNumber(min)} ${unit}` : '';
    lines.push(`Чтобы покрыть расход на ${days} ${daysWord(days)}${minText}, закажите ${formatNumber(f.recommended_order)} ${unit}.`);
    if (type === 'success') type = 'warning';
  } else {
    lines.push('Дозаказ сейчас не нужен.');
  }
  return { type, lines };
});

function receiveRecommended() {
  const product = forecastProductFull.value;
  if (!product || !forecast.value) return;
  forecastDialog.value = false;
  openMovement({ ...product, quantity: forecast.value.current_quantity }, 'in', forecast.value.recommended_order);
}

// ------------------------------------------------------------------ удаление
const deleteDialog = ref(false);
const toDelete = ref(null);
const deleting = ref(false);

function askDelete(product) {
  toDelete.value = product;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await deleteProduct(toDelete.value.id);
    notify.success('Товар удалён');
    deleteDialog.value = false;
    if (products.value.length === 1 && page.value > 1) page.value -= 1;
    else await loadProducts();
    await loadAnalytics();
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

onMounted(refreshAll);
</script>
