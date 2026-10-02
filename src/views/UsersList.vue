<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        Пользователи компании
        <span v-if="auth.user?.company?.name" class="text-medium-emphasis">«{{ auth.user.company.name }}»</span>
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-account-plus-outline" @click="openCreate">Добавить</v-btn>
      </v-card-title>
      <v-card-text>
        <v-row dense class="mb-2">
          <v-col cols="12" sm="8" md="6">
            <v-text-field
              v-model="filters.search"
              label="Поиск по имени или email"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              density="compact"
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select v-model="filters.role" :items="roleFilterItems" label="Роль" hide-details density="compact" />
          </v-col>
        </v-row>

        <v-data-table-server
          v-model:page="page"
          v-model:items-per-page="limit"
          :headers="headers"
          :items="users"
          :items-length="total"
          :items-per-page-options="[10, 20, 50, 100]"
          :loading="loading"
          loading-text="Загрузка…"
          no-data-text="Пользователи не найдены"
          item-value="id"
        >
          <template #[`item.full_name`]="{ item }">
            <router-link :to="`/users/${item.id}`" class="font-weight-medium">{{ item.full_name }}</router-link>
            <span v-if="isSelf(item)" class="text-caption text-medium-emphasis"> (вы)</span>
            <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
          </template>
          <template #[`item.role`]="{ item }">
            <v-chip size="small" variant="tonal" :color="roleColor(item.role)">{{ roleLabel(item.role) }}</v-chip>
          </template>
          <template #[`item.phone`]="{ item }">{{ item.phone || '—' }}</template>
          <template #[`item.position`]="{ item }">{{ item.position || '—' }}</template>
          <template #[`item.is_active`]="{ item }">
            <v-chip size="small" variant="tonal" :color="item.is_active ? 'success' : 'grey'">
              {{ item.is_active ? 'Активен' : 'Отключён' }}
            </v-chip>
          </template>
          <template #[`item.telegram_linked`]="{ item }">
            <v-icon
              :icon="item.telegram_linked ? 'mdi-check-circle' : 'mdi-minus'"
              :color="item.telegram_linked ? 'success' : 'grey'"
              size="small"
              :aria-label="item.telegram_linked ? 'Telegram привязан' : 'Telegram не привязан'"
            />
          </template>
          <template #[`item.created_at`]="{ item }">{{ formatDate(item.created_at) }}</template>
          <template #[`item.actions`]="{ item }">
            <div class="d-flex justify-end">
              <v-tooltip :text="editHint(item)" :disabled="canEdit(item)" location="top">
                <template #activator="{ props: tip }">
                  <span v-bind="tip">
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      aria-label="Изменить"
                      :disabled="!canEdit(item)"
                      @click="openEdit(item)"
                    />
                  </span>
                </template>
              </v-tooltip>
              <v-tooltip :text="deleteHint(item)" :disabled="canDelete(item)" location="top">
                <template #activator="{ props: tip }">
                  <span v-bind="tip">
                    <v-btn
                      icon="mdi-delete-outline"
                      size="small"
                      variant="text"
                      color="error"
                      aria-label="Удалить"
                      :disabled="!canDelete(item)"
                      @click="askDelete(item)"
                    />
                  </span>
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- Создание / редактирование -->
    <v-dialog v-model="formDialog" max-width="560" persistent>
      <v-card>
        <v-card-title class="pt-4">{{ editing ? 'Редактирование пользователя' : 'Новый пользователь' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-if="editing"
                  :model-value="editing.email"
                  label="Email"
                  readonly
                  hint="Email пользователя не меняется"
                  persistent-hint
                  class="mb-2"
                />
                <v-text-field
                  v-else
                  v-model.trim="form.email"
                  label="Email *"
                  type="email"
                  autocomplete="off"
                  :rules="emailRules"
                  :error-messages="emailError"
                  @update:model-value="emailError = ''"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.full_name" label="ФИО *" :rules="fullNameRules" />
              </v-col>
              <v-col v-if="!editing" cols="12">
                <v-text-field
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  label="Пароль *"
                  autocomplete="new-password"
                  hint="Не менее 8 символов. Передайте пароль сотруднику — он сможет сменить его в профиле"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :rules="passwordRules"
                  @click:append-inner="showPassword = !showPassword"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.phone" label="Телефон" type="tel" :rules="phoneRules" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.position" label="Должность" :rules="[maxLen(255)]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.role"
                  :items="roleSelectItems"
                  label="Роль"
                  :disabled="Boolean(editing) && !canChangeRole(editing)"
                  :hint="editing ? roleHint(editing) : 'Администратор управляет пользователями и данными компании'"
                  persistent-hint
                />
              </v-col>
              <v-col v-if="editing" cols="12" sm="6">
                <v-switch
                  v-model="form.is_active"
                  label="Активен"
                  color="primary"
                  :disabled="!canChangeActive(editing)"
                  :hint="activeHint(editing)"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="formDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="save">
            {{ editing ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Удаление -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title class="pt-4">Удалить пользователя?</v-card-title>
        <v-card-text>
          Пользователь <strong>{{ deleting?.full_name }}</strong> ({{ deleting?.email }}) потеряет доступ к системе.
          Действие необратимо. Если доступ нужно закрыть временно — отключите пользователя вместо удаления.
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
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { createUser, deleteUser, listUsers, updateUser } from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { debounce } from '@/utils/debounce';
import { formatDate } from '@/utils/format';

const auth = useAuthStore();
const notify = useNotifyStore();

// ---------------------------------------------------------------- справочники и права
const ROLE_LABELS = { owner: 'Владелец', admin: 'Администратор', user: 'Пользователь' };
const ROLE_COLORS = { owner: 'deep-purple', admin: 'primary', user: 'grey' };
const roleLabel = (role) => ROLE_LABELS[role] || role || '—';
const roleColor = (role) => ROLE_COLORS[role] || 'grey';

const roleFilterItems = [
  { title: 'Все', value: '' },
  { title: 'Владелец', value: 'owner' },
  { title: 'Администратор', value: 'admin' },
  { title: 'Пользователь', value: 'user' },
];

const isSelf = (u) => Boolean(u) && u.id === auth.user?.id;
/** Владельца может изменять только сам владелец (admin получит 403). */
const canEdit = (u) => u.role !== 'owner' || auth.isOwner;
/** Нельзя удалить себя и владельца. */
const canDelete = (u) => !isSelf(u) && u.role !== 'owner';
/** Роль владельца не меняется; свою роль не меняем, чтобы не потерять доступ. */
const canChangeRole = (u) => u.role !== 'owner' && !isSelf(u);
/** Нельзя отключить владельца и самого себя. */
const canChangeActive = (u) => u.role !== 'owner' && !isSelf(u);

function editHint(u) {
  return canEdit(u) ? '' : 'Данные владельца может изменить только он сам';
}
function deleteHint(u) {
  if (isSelf(u)) return 'Нельзя удалить самого себя';
  if (u.role === 'owner') return 'Нельзя удалить владельца компании';
  return '';
}
function roleHint(u) {
  if (u.role === 'owner') return 'Роль владельца изменить нельзя';
  if (isSelf(u)) return 'Свою роль изменить нельзя';
  return '';
}
function activeHint(u) {
  if (u.role === 'owner') return 'Владельца нельзя отключить';
  if (isSelf(u)) return 'Нельзя отключить самого себя';
  return 'Отключённый пользователь не может войти';
}

// ---------------------------------------------------------------- таблица
const headers = [
  { title: 'Пользователь', key: 'full_name', sortable: false },
  { title: 'Роль', key: 'role', sortable: false },
  { title: 'Телефон', key: 'phone', sortable: false },
  { title: 'Должность', key: 'position', sortable: false },
  { title: 'Статус', key: 'is_active', sortable: false },
  { title: 'Telegram', key: 'telegram_linked', sortable: false, align: 'center' },
  { title: 'Создан', key: 'created_at', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const users = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const loading = ref(false);
const filters = reactive({ search: '', role: '' });

async function load() {
  loading.value = true;
  try {
    const data = await listUsers({
      page: page.value,
      limit: limit.value,
      role: filters.role,
      search: (filters.search || '').trim(),
    });
    users.value = data.items;
    total.value = data.total;
  } catch (err) {
    notify.error(err);
  } finally {
    loading.value = false;
  }
}

function reloadFromFirstPage() {
  if (page.value !== 1) {
    page.value = 1; // watch(page) перезагрузит
  } else {
    load();
  }
}
const debouncedReload = debounce(reloadFromFirstPage, 400);
// Отложенный вызов debounce после ухода со страницы дал бы лишний запрос.
onUnmounted(() => debouncedReload.cancel());

watch([page, limit], load);
watch(() => filters.role, reloadFromFirstPage);
watch(() => filters.search, debouncedReload);
onMounted(load);

// ---------------------------------------------------------------- форма
const maxLen = (n) => (v) => (v || '').length <= n || `Не более ${n} символов`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailRules = [(v) => !!v || 'Введите email', (v) => EMAIL_RE.test(v || '') || 'Некорректный email'];
const fullNameRules = [(v) => !!(v || '').trim() || 'Введите ФИО', maxLen(255)];
const passwordRules = [(v) => !!v || 'Введите пароль', (v) => (v || '').length >= 8 || 'Не менее 8 символов', maxLen(128)];
const phoneRules = [
  (v) => {
    if (!v || !v.trim()) return true;
    const digits = v.replace(/\D/g, '').length;
    return (digits >= 10 && digits <= 15 && v.length <= 32) || 'Некорректный номер телефона';
  },
];

const formDialog = ref(false);
const formRef = ref(null);
/** @type {import('vue').Ref<object|null>} редактируемый пользователь; null — создание */
const editing = ref(null);
const saving = ref(false);
const showPassword = ref(false);
const emailError = ref('');
const form = reactive({
  email: '',
  full_name: '',
  password: '',
  phone: '',
  position: '',
  role: 'user',
  is_active: true,
});

const roleSelectItems = computed(() => {
  const items = [
    { title: 'Администратор', value: 'admin' },
    { title: 'Пользователь', value: 'user' },
  ];
  return editing.value?.role === 'owner' ? [{ title: 'Владелец', value: 'owner' }, ...items] : items;
});

function openCreate() {
  editing.value = null;
  Object.assign(form, {
    email: '',
    full_name: '',
    password: '',
    phone: '',
    position: '',
    role: 'user',
    is_active: true,
  });
  emailError.value = '';
  showPassword.value = false;
  formDialog.value = true;
  nextTick(() => formRef.value?.resetValidation());
}

function openEdit(user) {
  editing.value = user;
  Object.assign(form, {
    email: user.email,
    full_name: user.full_name || '',
    password: '',
    phone: user.phone || '',
    position: user.position || '',
    role: user.role,
    is_active: user.is_active,
  });
  emailError.value = '';
  formDialog.value = true;
  nextTick(() => formRef.value?.resetValidation());
}

async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    if (editing.value) {
      const target = editing.value;
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        position: form.position.trim() || null,
      };
      if (canChangeRole(target) && form.role !== target.role) payload.role = form.role;
      if (canChangeActive(target) && form.is_active !== target.is_active) payload.is_active = form.is_active;
      const updated = await updateUser(target.id, payload);
      if (isSelf(updated)) auth.setUser(updated);
      const idx = users.value.findIndex((u) => u.id === updated.id);
      if (idx !== -1) users.value[idx] = updated;
      notify.success('Изменения сохранены');
    } else {
      await createUser({
        email: form.email,
        full_name: form.full_name.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || undefined,
        position: form.position.trim() || undefined,
      });
      notify.success('Пользователь создан');
      reloadFromFirstPage();
    }
    formDialog.value = false;
  } catch (err) {
    if (!editing.value && err?.response?.status === 409) {
      emailError.value = 'Пользователь с таким email уже существует';
    } else {
      notify.error(err);
    }
  } finally {
    saving.value = false;
  }
}

// ---------------------------------------------------------------- удаление
const deleteDialog = ref(false);
const deleting = ref(null);
const deleteLoading = ref(false);

function askDelete(user) {
  deleting.value = user;
  deleteDialog.value = true;
}

async function confirmDelete() {
  deleteLoading.value = true;
  try {
    await deleteUser(deleting.value.id);
    deleteDialog.value = false;
    notify.success('Пользователь удалён');
    // Последняя запись на странице — шаг назад.
    if (users.value.length === 1 && page.value > 1) {
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
