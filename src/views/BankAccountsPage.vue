<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        Счета
        <v-spacer />
        <v-btn variant="text" prepend-icon="mdi-swap-vertical" to="/finance">Операции</v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Добавить счёт</v-btn>
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Добавьте расчётные счета и загружайте выписки из интернет-банка — операции попадут в раздел
          <router-link to="/finance">Финансы</router-link>, повторно загруженные операции пропускаются.
        </p>

        <v-data-table-server
          v-model:page="page"
          v-model:items-per-page="limit"
          :headers="headers"
          :items="accounts"
          :items-length="total"
          :items-per-page-options="[10, 20, 50, 100]"
          :loading="loading"
          loading-text="Загрузка…"
          no-data-text="Счетов пока нет — добавьте первый"
          item-value="id"
        >
          <template #[`item.bank_name`]="{ item }">
            <div class="font-weight-medium">{{ item.bank_name }}</div>
            <div v-if="item.bik" class="text-caption text-medium-emphasis">БИК {{ item.bik }}</div>
          </template>
          <template #[`item.account_number`]="{ item }">
            <span class="account-number">{{ formatAccount(item.account_number) }}</span>
          </template>
          <template #[`item.balance`]="{ item }">
            <span v-if="item.balance === null || item.balance === undefined" class="text-medium-emphasis">—</span>
            <span v-else class="font-weight-medium">{{ formatMoney(item.balance) }}</span>
          </template>
          <template #[`item.last_import_at`]="{ item }">
            {{ item.last_import_at ? formatDateTime(item.last_import_at) : 'не было' }}
          </template>
          <template #[`item.actions`]="{ item }">
            <div class="d-flex justify-end align-center">
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-file-upload-outline"
                class="mr-1"
                @click="openImport(item)"
              >
                Выписка
              </v-btn>
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

    <!-- Подсказка по выгрузке -->
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon icon="mdi-help-circle-outline" class="mr-2" color="primary" />
          Как выгрузить выписку из банка в формате 1С
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ol class="text-body-2 pl-5">
            <li>Откройте интернет-банк для бизнеса и перейдите в раздел «Выписки» (или «Счета» → «Выписка»).</li>
            <li>Выберите расчётный счёт и период.</li>
            <li>
              Выберите формат <strong>«1С»</strong> («1С:Предприятие», «Для 1С», «1C ClientBankExchange») и скачайте
              файл — обычно это <code>kl_to_1c.txt</code> или файл с расширением <code>.txt</code>.
            </li>
            <li>Здесь нажмите «Выписка» в строке нужного счёта и загрузите файл (до 5 МБ).</li>
          </ol>
          <p class="text-body-2 mt-3 mb-1">
            Поддерживаются кодировки Windows-1251 и UTF-8. Если в выписке есть конечный остаток, он будет записан в
            счёт автоматически.
          </p>
          <p class="text-body-2 mb-0">
            Можно загрузить и CSV-файл с заголовком <code>date;amount;description;counterparty;inn</code>: дата
            <code>ДД.ММ.ГГГГ</code> или <code>ГГГГ-ММ-ДД</code>, сумма со знаком (больше нуля — поступление, меньше
            нуля — списание).
          </p>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Добавление / редактирование счёта -->
    <v-dialog v-model="formDialog" max-width="520" persistent>
      <v-card>
        <v-card-title class="pt-4">{{ editing ? 'Изменить счёт' : 'Новый счёт' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-text-field v-model="form.bank_name" label="Банк *" :rules="bankNameRules" class="mb-1" />
            <v-text-field
              v-model.trim="form.account_number"
              label="Номер счёта *"
              inputmode="numeric"
              :maxlength="20"
              counter="20"
              :rules="accountRules"
              class="mb-1"
            />
            <v-text-field
              v-model.trim="form.bik"
              label="БИК"
              inputmode="numeric"
              :maxlength="9"
              counter="9"
              :rules="bikRules"
              class="mb-1"
            />
            <v-text-field
              v-if="editing"
              v-model="form.balance"
              label="Остаток, ₽"
              type="number"
              step="0.01"
              hint="Необязательно. Обновляется автоматически при загрузке выписки 1С с конечным остатком"
              persistent-hint
              :rules="balanceRules"
            />
            <div class="text-caption text-medium-emphasis mt-2">Валюта счёта — рубли (RUB).</div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="formDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="save">
            {{ editing ? 'Сохранить' : 'Добавить' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Импорт выписки -->
    <v-dialog v-model="importDialog" max-width="600" :persistent="importing">
      <v-card>
        <v-card-title class="pt-4">Загрузка выписки</v-card-title>
        <v-card-subtitle v-if="importAccount">
          {{ importAccount.bank_name }} · {{ formatAccount(importAccount.account_number) }}
        </v-card-subtitle>
        <v-card-text>
          <template v-if="!importResult">
            <v-form ref="importFormRef" @submit.prevent="doImport">
              <v-file-input
                v-model="importFile"
                label="Файл выписки (.txt 1С или .csv)"
                accept=".txt,.csv,text/plain,text/csv"
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                variant="outlined"
                show-size
                :rules="fileRules"
              />
            </v-form>
            <div class="text-caption text-medium-emphasis">
              Формат 1С ClientBankExchange или CSV, размер до 5 МБ. Операции, загруженные ранее, будут пропущены.
            </div>
          </template>

          <template v-else>
            <v-alert :type="importResult.imported ? 'success' : 'info'" variant="tonal" class="mb-3">
              Загружено операций: <strong>{{ importResult.imported }}</strong>, пропущено:
              <strong>{{ importResult.skipped }}</strong>
            </v-alert>
            <template v-if="importResult.errors.length">
              <div class="text-subtitle-2 mb-1">Строки с ошибками ({{ importResult.errors.length }}):</div>
              <v-list density="compact" class="errors-list py-0 mb-3">
                <v-list-item v-for="(error, i) in importResult.errors" :key="i" class="px-0">
                  <template #prepend>
                    <v-icon icon="mdi-alert-circle-outline" color="warning" size="small" class="mr-2" />
                  </template>
                  <v-list-item-title class="text-body-2 text-wrap">{{ error }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </template>
            <v-btn v-if="importResult.imported" to="/finance" color="primary" variant="tonal" append-icon="mdi-arrow-right">
              Посмотреть операции
            </v-btn>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <template v-if="!importResult">
            <v-btn variant="text" :disabled="importing" @click="importDialog = false">Отмена</v-btn>
            <v-btn color="primary" variant="flat" :loading="importing" @click="doImport">Загрузить</v-btn>
          </template>
          <template v-else>
            <v-btn variant="text" @click="resetImport">Загрузить ещё</v-btn>
            <v-btn color="primary" variant="flat" @click="importDialog = false">Готово</v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Удаление -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title class="pt-4">Удалить счёт?</v-card-title>
        <v-card-text>
          Счёт <strong>{{ deleting?.bank_name }}</strong> {{ formatAccount(deleting?.account_number) }} будет удалён.
          Загруженные из выписок операции останутся в разделе «Финансы».
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteLoading" @click="confirmDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import {
  createBankAccount,
  deleteBankAccount,
  importBankStatement,
  listBankAccounts,
  updateBankAccount,
} from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDateTime, formatMoney } from '@/utils/format';

const notify = useNotifyStore();

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** 40702810900000000001 → «40702 810 9 0000 0000001» (группы как в банковских документах). */
function formatAccount(value) {
  const v = String(value || '');
  if (!/^\d{20}$/.test(v)) return v;
  return `${v.slice(0, 5)} ${v.slice(5, 8)} ${v.slice(8, 9)} ${v.slice(9, 13)} ${v.slice(13)}`;
}

// ---------------------------------------------------------------- список
const headers = [
  { title: 'Банк', key: 'bank_name', sortable: false },
  { title: 'Номер счёта', key: 'account_number', sortable: false },
  { title: 'Остаток', key: 'balance', sortable: false, align: 'end' },
  { title: 'Последняя выписка', key: 'last_import_at', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const accounts = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const data = await listBankAccounts({ page: page.value, limit: limit.value });
    accounts.value = data.items;
    total.value = data.total;
  } catch (err) {
    notify.error(err);
  } finally {
    loading.value = false;
  }
}

watch([page, limit], load);
onMounted(load);

// ---------------------------------------------------------------- форма счёта
const bankNameRules = [
  (v) => !!(v || '').trim() || 'Укажите банк',
  (v) => (v || '').length <= 255 || 'Не более 255 символов',
];
const accountRules = [
  (v) => !!v || 'Укажите номер счёта',
  (v) => /^\d{20}$/.test(v || '') || 'Номер счёта — 20 цифр',
];
const bikRules = [(v) => !v || /^\d{9}$/.test(v) || 'БИК — 9 цифр'];
const balanceRules = [
  (v) => v === '' || v === null || v === undefined || Number.isFinite(Number(v)) || 'Введите число',
];

const formDialog = ref(false);
const formRef = ref(null);
const editing = ref(null);
const saving = ref(false);
const form = reactive({ bank_name: '', account_number: '', bik: '', balance: '' });

function openCreate() {
  editing.value = null;
  Object.assign(form, { bank_name: '', account_number: '', bik: '', balance: '' });
  formDialog.value = true;
  nextTick(() => formRef.value?.resetValidation());
}

function openEdit(account) {
  editing.value = account;
  Object.assign(form, {
    bank_name: account.bank_name,
    account_number: account.account_number,
    bik: account.bik || '',
    balance: account.balance === null || account.balance === undefined ? '' : String(account.balance),
  });
  formDialog.value = true;
  nextTick(() => formRef.value?.resetValidation());
}

async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    if (editing.value) {
      const balance = form.balance === '' || form.balance === null ? null : Math.round(Number(form.balance) * 100) / 100;
      await updateBankAccount(editing.value.id, {
        bank_name: form.bank_name.trim(),
        account_number: form.account_number,
        bik: form.bik || null,
        balance,
      });
      notify.success('Счёт сохранён');
    } else {
      await createBankAccount({
        bank_name: form.bank_name.trim(),
        account_number: form.account_number,
        bik: form.bik || undefined,
        currency: 'RUB',
      });
      notify.success('Счёт добавлен');
    }
    formDialog.value = false;
    load();
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

// ---------------------------------------------------------------- импорт выписки
const importDialog = ref(false);
const importFormRef = ref(null);
const importAccount = ref(null);
const importFile = ref(null);
const importing = ref(false);
const importResult = ref(null);

/** v-file-input отдаёт File или File[] в зависимости от версии Vuetify. */
function pickFile(value) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

const fileRules = [
  (v) => Boolean(pickFile(v)) || 'Выберите файл',
  (v) => {
    const file = pickFile(v);
    return !file || /\.(txt|csv)$/i.test(file.name) || 'Нужен файл .txt (1С) или .csv';
  },
  (v) => {
    const file = pickFile(v);
    return !file || file.size <= MAX_FILE_SIZE || 'Файл больше 5 МБ';
  },
];

function resetImport() {
  importFile.value = null;
  importResult.value = null;
}

function openImport(account) {
  importAccount.value = account;
  resetImport();
  importDialog.value = true;
}

async function doImport() {
  const { valid } = await importFormRef.value.validate();
  if (!valid) return;
  importing.value = true;
  try {
    importResult.value = await importBankStatement(importAccount.value.id, pickFile(importFile.value));
    load();
  } catch (err) {
    notify.error(err);
  } finally {
    importing.value = false;
  }
}

// ---------------------------------------------------------------- удаление
const deleteDialog = ref(false);
const deleting = ref(null);
const deleteLoading = ref(false);

function askDelete(account) {
  deleting.value = account;
  deleteDialog.value = true;
}

async function confirmDelete() {
  deleteLoading.value = true;
  try {
    await deleteBankAccount(deleting.value.id);
    deleteDialog.value = false;
    notify.success('Счёт удалён');
    if (accounts.value.length === 1 && page.value > 1) {
      page.value -= 1;
    } else {
      load();
    }
  } catch (err) {
    notify.error(err);
  } finally {
    deleteLoading.value = false;
  }
}
</script>

<style scoped>
.account-number {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.errors-list {
  max-height: 240px;
  overflow-y: auto;
}
</style>
