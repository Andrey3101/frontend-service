<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="backLink">
        {{ kind === 'invoice' ? 'К счетам' : 'К актам' }}
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="doc"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-file-pdf-box"
        :loading="pdfLoading"
        @click="downloadPdf"
      >
        Скачать PDF
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" @click="load">Повторить</v-btn>
      </template>
    </v-alert>

    <v-row v-if="doc">
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex flex-wrap align-center ga-2">
            {{ meta.title }} № {{ doc.number }} от {{ formatDate(doc.date) }}
            <v-spacer />
            <v-chip :color="statusColor(doc.status)" variant="tonal">{{ statusLabel(doc.status) }}</v-chip>
          </v-card-title>
          <v-card-text>
            <v-row dense class="mb-2">
              <v-col cols="12" sm="6">
                <div class="text-caption text-medium-emphasis">{{ kind === 'invoice' ? 'Плательщик' : 'Заказчик' }}</div>
                <div class="text-body-1 font-weight-medium">
                  <router-link :to="{ path: '/client-analysis', query: { client: doc.client_id } }">
                    {{ doc.client_name || '—' }}
                  </router-link>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-caption text-medium-emphasis">{{ kind === 'invoice' ? 'Поставщик' : 'Исполнитель' }}</div>
                <div class="text-body-1">{{ doc.seller_name || '—' }}</div>
                <div v-if="doc.seller_inn" class="text-caption">ИНН {{ doc.seller_inn }}</div>
              </v-col>
              <v-col v-if="kind === 'invoice'" cols="12" sm="6">
                <div class="text-caption text-medium-emphasis">Оплатить до</div>
                <div class="text-body-1" :class="{ 'text-error': overdue }">
                  {{ formatDate(doc.due_date) }}<span v-if="overdue"> — просрочен</span>
                </div>
              </v-col>
            </v-row>

            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-left">№</th>
                  <th class="text-left">Наименование</th>
                  <th class="text-right">Кол-во</th>
                  <th class="text-left">Ед.</th>
                  <th class="text-right">Цена</th>
                  <th class="text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in doc.items" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.name }}</td>
                  <td class="text-right">{{ formatNumber(item.quantity) }}</td>
                  <td>{{ item.unit }}</td>
                  <td class="text-right text-no-wrap">{{ formatMoney(item.price) }}</td>
                  <td class="text-right text-no-wrap">{{ formatMoney(item.amount) }}</td>
                </tr>
              </tbody>
            </v-table>

            <div class="text-right mt-4">
              <div class="text-h6">Итого: {{ formatMoney(doc.total) }}</div>
              <div class="text-body-2 text-medium-emphasis">
                <template v-if="doc.vat_rate === null || doc.vat_rate === undefined">Без НДС</template>
                <template v-else>
                  в т.ч. НДС {{ formatNumber(doc.vat_rate) }}%: {{ formatMoney(vatIncluded(doc.total, doc.vat_rate)) }}
                </template>
              </div>
            </div>

            <div class="text-caption text-medium-emphasis mt-4">
              Создан {{ formatDateTime(doc.created_at) }} · изменён {{ formatDateTime(doc.updated_at) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card>
          <v-card-title>Статус и заметки</v-card-title>
          <v-card-text>
            <v-select v-model="edit.status" :items="STATUS_ITEMS" label="Статус" />
            <v-textarea v-model="edit.notes" label="Заметки" rows="4" auto-grow />
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" :disabled="!dirty || saving" @click="resetEdit">Сбросить</v-btn>
            <v-spacer />
            <v-btn color="primary" variant="flat" :disabled="!dirty" :loading="saving" @click="save">
              Сохранить
            </v-btn>
          </v-card-actions>
        </v-card>
        <div class="text-caption text-medium-emphasis mt-2 px-1">
          Позиции, клиента и реквизиты можно изменить в списке документов (кнопка «Изменить»).
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import {
  downloadActPdf,
  downloadInvoicePdf,
  errorMessage,
  getAct,
  getInvoice,
  updateAct,
  updateInvoice,
} from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/utils/format.js';

const props = defineProps({
  id: { type: String, required: true },
});

const route = useRoute();
const notify = useNotifyStore();

const STATUS_ITEMS = [
  { title: 'Черновик', value: 'draft' },
  { title: 'Отправлен', value: 'sent' },
  { title: 'Подписан', value: 'signed' },
  { title: 'Оплачен', value: 'paid' },
  { title: 'Отменён', value: 'cancelled' },
];
const STATUS_COLORS = { draft: 'grey', sent: 'info', signed: 'primary', paid: 'success', cancelled: 'error' };

const KINDS = {
  act: { title: 'Акт', get: getAct, update: updateAct, pdf: downloadActPdf },
  invoice: { title: 'Счёт', get: getInvoice, update: updateInvoice, pdf: downloadInvoicePdf },
};

/** Тип документа: /acts/:id?kind=invoice — счёт, иначе акт (ссылки формирует ActsList). */
const kind = computed(() => (route.query.kind === 'invoice' ? 'invoice' : 'act'));
const meta = computed(() => KINDS[kind.value]);
const backLink = computed(() => ({ path: '/acts', query: kind.value === 'invoice' ? { kind: 'invoice' } : {} }));

function statusLabel(status) {
  return STATUS_ITEMS.find((s) => s.value === status)?.title ?? status;
}
function statusColor(status) {
  return STATUS_COLORS[status] ?? 'grey';
}
function vatIncluded(total, rate) {
  const r = Number(rate);
  if (!r) return 0;
  return Math.round(((Number(total) || 0) * r * 100) / (100 + r)) / 100;
}

const doc = ref(null);
const loading = ref(false);
const loadError = ref('');

const overdue = computed(
  () =>
    Boolean(doc.value?.due_date) &&
    !['paid', 'cancelled'].includes(doc.value.status) &&
    doc.value.due_date < dayjs().format('YYYY-MM-DD'),
);

const edit = reactive({ status: 'draft', notes: '' });
const dirty = computed(
  () => Boolean(doc.value) && (edit.status !== doc.value.status || edit.notes !== (doc.value.notes ?? '')),
);

function resetEdit() {
  edit.status = doc.value?.status ?? 'draft';
  edit.notes = doc.value?.notes ?? '';
}

let requestSeq = 0;
async function load() {
  const seq = ++requestSeq;
  loading.value = true;
  loadError.value = '';
  try {
    const data = await meta.value.get(props.id);
    if (seq !== requestSeq) return;
    doc.value = data;
    resetEdit();
  } catch (err) {
    if (seq !== requestSeq) return;
    doc.value = null;
    loadError.value = errorMessage(err);
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

const saving = ref(false);
async function save() {
  if (!doc.value) return;
  saving.value = true;
  try {
    doc.value = await meta.value.update(doc.value.id, { status: edit.status, notes: edit.notes ?? '' });
    resetEdit();
    notify.success('Сохранено');
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

const pdfLoading = ref(false);
async function downloadPdf() {
  if (!doc.value) return;
  pdfLoading.value = true;
  try {
    await meta.value.pdf(doc.value.id, `${meta.value.title}-${doc.value.number}.pdf`);
  } catch (err) {
    notify.error(err);
  } finally {
    pdfLoading.value = false;
  }
}

watch(() => [props.id, kind.value], load, { immediate: true });
</script>
