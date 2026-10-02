<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3" to="/users">К списку пользователей</v-btn>

    <v-card v-if="loading && !user" loading>
      <v-card-text class="text-medium-emphasis">Загрузка…</v-card-text>
    </v-card>

    <v-alert v-else-if="loadError" type="error" variant="tonal">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="small" @click="load">Повторить</v-btn>
      </template>
    </v-alert>

    <v-row v-else-if="user">
      <!-- Карточка -->
      <v-col cols="12" md="5">
        <v-card class="h-100">
          <v-card-text class="text-center pt-6">
            <v-avatar size="72" color="primary" class="mb-3">
              <span class="text-h5 text-white">{{ initials }}</span>
            </v-avatar>
            <div class="text-h6">
              {{ user.full_name }}
              <span v-if="isSelf" class="text-body-2 text-medium-emphasis">(вы)</span>
            </div>
            <div class="text-body-2 text-medium-emphasis mb-3">{{ user.email }}</div>
            <div class="d-flex justify-center flex-wrap ga-2">
              <v-chip size="small" variant="tonal" :color="roleColor(user.role)">{{ roleLabel(user.role) }}</v-chip>
              <v-chip size="small" variant="tonal" :color="user.is_active ? 'success' : 'grey'">
                {{ user.is_active ? 'Активен' : 'Отключён' }}
              </v-chip>
            </div>
          </v-card-text>
          <v-divider />
          <v-table density="compact">
            <tbody>
              <tr>
                <td class="text-medium-emphasis">Телефон</td>
                <td>{{ user.phone || '—' }}</td>
              </tr>
              <tr>
                <td class="text-medium-emphasis">Должность</td>
                <td>{{ user.position || '—' }}</td>
              </tr>
              <tr>
                <td class="text-medium-emphasis">Компания</td>
                <td>{{ user.company?.name || '—' }}</td>
              </tr>
              <tr>
                <td class="text-medium-emphasis">Telegram</td>
                <td>{{ user.telegram_linked ? 'Привязан' : 'Не привязан' }}</td>
              </tr>
              <tr>
                <td class="text-medium-emphasis">В системе с</td>
                <td>{{ formatDate(user.created_at) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <!-- Редактирование -->
      <v-col cols="12" md="7">
        <v-card class="h-100">
          <v-card-title>Редактирование</v-card-title>
          <v-card-text>
            <v-alert v-if="!canEdit" type="info" variant="tonal" density="compact">
              Данные владельца компании может изменить только он сам (в своём профиле).
            </v-alert>
            <v-form v-else ref="formRef" @submit.prevent="save">
              <v-text-field v-model="form.full_name" label="ФИО *" :rules="fullNameRules" class="mb-1" />
              <v-row dense>
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
                    :disabled="!canChangeRole"
                    :hint="roleHint"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="form.is_active"
                    label="Активен"
                    color="primary"
                    :disabled="!canChangeActive"
                    :hint="activeHint"
                    persistent-hint
                  />
                </v-col>
              </v-row>
              <div class="d-flex mt-4">
                <v-btn variant="text" :disabled="!dirty || saving" @click="fillForm(user)">Сбросить</v-btn>
                <v-spacer />
                <v-btn type="submit" color="primary" :loading="saving" :disabled="!dirty">Сохранить</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { errorMessage, getUser, updateUser } from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDate } from '@/utils/format';

const props = defineProps({
  id: { type: String, required: true },
});

const auth = useAuthStore();
const notify = useNotifyStore();

const ROLE_LABELS = { owner: 'Владелец', admin: 'Администратор', user: 'Пользователь' };
const ROLE_COLORS = { owner: 'deep-purple', admin: 'primary', user: 'grey' };
const roleLabel = (role) => ROLE_LABELS[role] || role || '—';
const roleColor = (role) => ROLE_COLORS[role] || 'grey';

const user = ref(null);
const loading = ref(false);
const loadError = ref('');
const saving = ref(false);
const formRef = ref(null);
const form = reactive({ full_name: '', phone: '', position: '', role: 'user', is_active: true });

const isSelf = computed(() => Boolean(user.value) && user.value.id === auth.user?.id);
const isOwnerTarget = computed(() => user.value?.role === 'owner');
/** Владельца может изменять только сам владелец (admin получит 403). */
const canEdit = computed(() => !isOwnerTarget.value || auth.isOwner);
/** Роль владельца не меняется; свою роль не меняем, чтобы не потерять доступ. */
const canChangeRole = computed(() => !isOwnerTarget.value && !isSelf.value);
/** Нельзя отключить владельца и самого себя. */
const canChangeActive = computed(() => !isOwnerTarget.value && !isSelf.value);

const roleHint = computed(() => {
  if (isOwnerTarget.value) return 'Роль владельца изменить нельзя';
  if (isSelf.value) return 'Свою роль изменить нельзя';
  return 'Администратор управляет пользователями и данными компании';
});
const activeHint = computed(() => {
  if (isOwnerTarget.value) return 'Владельца нельзя отключить';
  if (isSelf.value) return 'Нельзя отключить самого себя';
  return 'Отключённый пользователь не может войти';
});

const roleSelectItems = computed(() => {
  const items = [
    { title: 'Администратор', value: 'admin' },
    { title: 'Пользователь', value: 'user' },
  ];
  return isOwnerTarget.value ? [{ title: 'Владелец', value: 'owner' }, ...items] : items;
});

const initials = computed(() => {
  const name = user.value?.full_name || user.value?.email || '';
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?'
  );
});

const maxLen = (n) => (v) => (v || '').length <= n || `Не более ${n} символов`;
const fullNameRules = [(v) => !!(v || '').trim() || 'Введите ФИО', maxLen(255)];
const phoneRules = [
  (v) => {
    if (!v || !v.trim()) return true;
    const digits = v.replace(/\D/g, '').length;
    return (digits >= 10 && digits <= 15 && v.length <= 32) || 'Некорректный номер телефона';
  },
];

function fillForm(u) {
  form.full_name = u?.full_name || '';
  form.phone = u?.phone || '';
  form.position = u?.position || '';
  form.role = u?.role || 'user';
  form.is_active = u?.is_active ?? true;
}

const dirty = computed(() => {
  const u = user.value;
  if (!u) return false;
  return (
    form.full_name.trim() !== (u.full_name || '') ||
    form.phone.trim() !== (u.phone || '') ||
    form.position.trim() !== (u.position || '') ||
    form.role !== u.role ||
    form.is_active !== u.is_active
  );
});

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    user.value = await getUser(props.id);
    fillForm(user.value);
  } catch (err) {
    user.value = null;
    loadError.value = err?.response?.status === 404 ? 'Пользователь не найден' : errorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      position: form.position.trim() || null,
    };
    if (canChangeRole.value && form.role !== user.value.role) payload.role = form.role;
    if (canChangeActive.value && form.is_active !== user.value.is_active) payload.is_active = form.is_active;
    const updated = await updateUser(user.value.id, payload);
    user.value = updated;
    fillForm(updated);
    if (updated.id === auth.user?.id) auth.setUser(updated);
    notify.success('Изменения сохранены');
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

watch(() => props.id, load, { immediate: true });
</script>
