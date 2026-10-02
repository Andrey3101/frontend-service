<template>
  <div>
    <v-card>
      <v-card-text>
        <v-row dense align="center" class="mb-2">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="filters.search"
              label="Поиск: имя, ИНН, email, телефон, контакт"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              density="compact"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="filters.type" :items="TYPE_FILTER_ITEMS" label="Тип" hide-details density="compact" />
          </v-col>
          <v-col cols="12" sm="6" md="3" class="d-flex justify-end">
            <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openCreate">Новый клиент</v-btn>
          </v-col>
        </v-row>

        <v-data-table-server
          v-model:page="page"
          v-model:items-per-page="limit"
          :headers="headers"
          :items="clients"
          :items-length="total"
          :items-per-page-options="[10, 20, 50, 100]"
          :loading="loading"
          loading-text="Загрузка…"
          no-data-text="Клиентов нет"
          item-value="id"
        >
          <template #[`item.name`]="{ item }">
            <div class="font-weight-medium">{{ item.name }}</div>
            <div v-if="item.contact_person" class="text-caption text-medium-emphasis">{{ item.contact_person }}</div>
          </template>
          <template #[`item.type`]="{ item }">
            <v-chip size="small" variant="tonal">{{ typeTitle(item.type) }}</v-chip>
          </template>
          <template #[`item.inn`]="{ item }">
            <div>{{ item.inn || '—' }}</div>
            <div v-if="item.kpp" class="text-caption text-medium-emphasis">КПП {{ item.kpp }}</div>
          </template>
          <template #[`item.contacts`]="{ item }">
            <div v-if="item.phone">{{ item.phone }}</div>
            <div v-if="item.email" class="text-caption">
              <a :href="`mailto:${item.email}`">{{ item.email }}</a>
            </div>
            <span v-if="!item.phone && !item.email">—</span>
          </template>
          <template #[`item.actions`]="{ item }">
            <div class="d-flex justify-end text-no-wrap">
              <v-btn
                icon="mdi-chart-box-outline"
                size="small"
                variant="text"
                color="primary"
                aria-label="Анализ клиента"
                :to="{ path: '/client-analysis', query: { client: item.id } }"
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

    <!-- Создание / редактирование -->
    <v-dialog v-model="editDialog" max-width="720" persistent scrollable>
      <v-card>
        <v-card-title>{{ editingId ? 'Изменить клиента' : 'Новый клиент' }}</v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-row dense>
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="form.name"
                  :label="form.type === 'individual' ? 'ФИО *' : 'Наименование *'"
                  :rules="[rules.required, rules.max255]"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-select v-model="form.type" :items="TYPE_ITEMS" label="Тип" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="form.inn"
                  label="ИНН"
                  :hint="innHint"
                  persistent-hint
                  inputmode="numeric"
                  :rules="[rules.inn]"
                />
              </v-col>
              <v-col v-if="form.type === 'company'" cols="12" sm="4">
                <v-text-field v-model="form.kpp" label="КПП" inputmode="numeric" :rules="[rules.kpp]" />
              </v-col>
              <v-col v-if="form.type !== 'individual'" cols="12" sm="4">
                <v-text-field
                  v-model="form.ogrn"
                  :label="form.type === 'ip' ? 'ОГРНИП' : 'ОГРН'"
                  inputmode="numeric"
                  :rules="[rules.ogrn]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.email" label="Email" type="email" :rules="[rules.email]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.phone" label="Телефон" type="tel" :rules="[rules.max50]" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.contact_person" label="Контактное лицо" :rules="[rules.max255]" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="form.address" label="Адрес" rows="1" auto-grow />
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

    <!-- Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title>Удалить клиента?</v-card-title>
        <v-card-text v-if="toDelete">
          «{{ toDelete.name }}» будет удалён. Клиента, по которому есть акты или счета, удалить нельзя.
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
import { createClient, deleteClient, listClients, updateClient } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { debounce } from '@/utils/debounce.js';

const notify = useNotifyStore();

const TYPE_ITEMS = [
  { title: 'Организация', value: 'company' },
  { title: 'ИП', value: 'ip' },
  { title: 'Физическое лицо', value: 'individual' },
];
const TYPE_FILTER_ITEMS = [{ title: 'Все', value: '' }, ...TYPE_ITEMS];

function typeTitle(type) {
  return TYPE_ITEMS.find((t) => t.value === type)?.title ?? type;
}

// ------------------------------------------------------------------ список
const headers = [
  { title: 'Клиент', key: 'name', sortable: false },
  { title: 'Тип', key: 'type', sortable: false, width: 150 },
  { title: 'ИНН', key: 'inn', sortable: false, width: 150 },
  { title: 'Контакты', key: 'contacts', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 140 },
];

const filters = reactive({ search: '', type: '' });
const clients = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const loading = ref(false);

let requestSeq = 0;
async function load() {
  const seq = ++requestSeq;
  loading.value = true;
  try {
    const data = await listClients({
      search: filters.search?.trim(),
      type: filters.type,
      page: page.value,
      limit: limit.value,
    });
    if (seq !== requestSeq) return;
    clients.value = data.items;
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

watch([page, limit], load);
watch(() => filters.type, reloadFromFirstPage);
const debouncedReload = debounce(reloadFromFirstPage, 400);
watch(() => filters.search, debouncedReload);
// Отложенный вызов debounce после ухода со страницы дал бы лишний запрос.
onUnmounted(() => debouncedReload.cancel());

// ------------------------------------------------------------------ форма
const editDialog = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formRef = ref(null);

const FIELDS = ['name', 'type', 'inn', 'kpp', 'ogrn', 'email', 'phone', 'address', 'contact_person', 'notes'];

function emptyForm() {
  return {
    name: '',
    type: 'company',
    inn: '',
    kpp: '',
    ogrn: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    notes: '',
  };
}
const form = reactive(emptyForm());

const innHint = computed(() => (form.type === 'company' ? 'У организации 10 цифр' : 'У ИП и физлица 12 цифр'));

const digits = (v) => String(v ?? '').trim();
const rules = {
  required: (v) => Boolean(v && String(v).trim()) || 'Обязательное поле',
  max50: (v) => !v || String(v).length <= 50 || 'Не более 50 символов',
  max255: (v) => !v || String(v).length <= 255 || 'Не более 255 символов',
  inn: (v) => !digits(v) || /^(\d{10}|\d{12})$/.test(digits(v)) || 'ИНН — 10 или 12 цифр',
  kpp: (v) => !digits(v) || /^\d{9}$/.test(digits(v)) || 'КПП — 9 цифр',
  ogrn: (v) => !digits(v) || /^(\d{13}|\d{15})$/.test(digits(v)) || 'ОГРН — 13 цифр, ОГРНИП — 15 цифр',
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) || 'Некорректный email',
};

// Смена типа: очистить неприменимые поля.
watch(
  () => form.type,
  (type) => {
    if (type !== 'company') form.kpp = '';
    if (type === 'individual') form.ogrn = '';
  },
);

function openCreate() {
  editingId.value = null;
  Object.assign(form, emptyForm());
  editDialog.value = true;
  formRef.value?.resetValidation();
}

/** @param {import('@/api/types.js').Client} client */
function openEdit(client) {
  editingId.value = client.id;
  const values = emptyForm();
  for (const key of FIELDS) values[key] = client[key] ?? values[key];
  Object.assign(form, values);
  editDialog.value = true;
}

function buildPayload() {
  const payload = {};
  for (const key of FIELDS) {
    const value = form[key];
    payload[key] = typeof value === 'string' ? value.trim() : value;
  }
  return payload;
}

async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const payload = buildPayload();
    if (editingId.value) {
      await updateClient(editingId.value, payload);
      notify.success('Клиент сохранён');
    } else {
      await createClient(payload);
      notify.success('Клиент добавлен');
    }
    editDialog.value = false;
    await load();
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

function askDelete(client) {
  toDelete.value = client;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await deleteClient(toDelete.value.id);
    notify.success('Клиент удалён');
    deleteDialog.value = false;
    if (clients.value.length === 1 && page.value > 1) page.value -= 1;
    else await load();
  } catch (err) {
    notify.error(err); // 409 — есть акты/счета: текст приходит с сервера
  } finally {
    deleting.value = false;
  }
}

onMounted(load);
</script>
