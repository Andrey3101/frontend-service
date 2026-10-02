<template>
  <div>
    <v-row>
      <!-- Личные данные -->
      <v-col cols="12" lg="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center flex-wrap ga-2">
            <v-icon icon="mdi-account-circle-outline" class="mr-1" />
            Личные данные
            <v-spacer />
            <v-chip size="small" variant="tonal" :color="roleColor(auth.role)">{{ roleLabel(auth.role) }}</v-chip>
          </v-card-title>
          <v-card-text>
            <v-form ref="profileFormRef" @submit.prevent="saveProfile">
              <v-text-field
                :model-value="auth.user?.email"
                label="Email"
                prepend-inner-icon="mdi-email-outline"
                readonly
                hint="Email используется для входа и не меняется"
                persistent-hint
                class="mb-3"
              />
              <v-text-field
                v-model="profile.full_name"
                label="ФИО"
                prepend-inner-icon="mdi-account-outline"
                :rules="fullNameRules"
                class="mb-1"
              />
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="profile.phone"
                    label="Телефон"
                    type="tel"
                    prepend-inner-icon="mdi-phone-outline"
                    :rules="phoneRules"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="profile.position"
                    label="Должность"
                    prepend-inner-icon="mdi-badge-account-horizontal-outline"
                    :rules="[maxLen(255)]"
                  />
                </v-col>
              </v-row>
              <div class="d-flex align-center">
                <div class="text-caption text-medium-emphasis">
                  <div>В системе с {{ formatDate(auth.user?.created_at) }}</div>
                  <div v-if="auth.user?.pd_consent_at" data-testid="pd-consent-at">
                    Согласие на обработку ПДн: {{ formatDate(auth.user.pd_consent_at) }}
                  </div>
                </div>
                <v-spacer />
                <v-btn type="submit" color="primary" :loading="profileSaving" :disabled="!profileDirty">
                  Сохранить
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Смена пароля -->
      <v-col cols="12" lg="6">
        <v-card class="h-100">
          <v-card-title>
            <v-icon icon="mdi-lock-outline" class="mr-1" />
            Смена пароля
          </v-card-title>
          <v-card-text>
            <v-form ref="passwordFormRef" @submit.prevent="savePassword">
              <v-text-field
                v-model="passwordForm.current"
                :type="showPasswords ? 'text' : 'password'"
                label="Текущий пароль"
                autocomplete="current-password"
                :rules="[(v) => !!v || 'Введите текущий пароль']"
                class="mb-1"
              />
              <v-text-field
                v-model="passwordForm.next"
                :type="showPasswords ? 'text' : 'password'"
                label="Новый пароль"
                autocomplete="new-password"
                hint="Не менее 8 символов"
                :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="newPasswordRules"
                class="mb-1"
                @click:append-inner="showPasswords = !showPasswords"
              />
              <v-text-field
                v-model="passwordForm.confirm"
                :type="showPasswords ? 'text' : 'password'"
                label="Повторите новый пароль"
                autocomplete="new-password"
                :rules="confirmPasswordRules"
              />
              <div class="d-flex">
                <v-spacer />
                <v-btn type="submit" color="primary" :loading="passwordSaving">Изменить пароль</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Компания -->
      <v-col cols="12" lg="6">
        <v-card class="h-100" :loading="companyLoading">
          <v-card-title>
            <v-icon icon="mdi-domain" class="mr-1" />
            Компания
          </v-card-title>
          <v-card-text>
            <template v-if="company">
              <v-form v-if="auth.isAdmin" ref="companyFormRef" @submit.prevent="saveCompany">
                <v-text-field
                  v-model="companyForm.name"
                  label="Название"
                  :rules="companyNameRules"
                  class="mb-1"
                />
                <v-row dense>
                  <v-col cols="12" sm="5">
                    <v-select v-model="companyForm.type" :items="companyTypes" label="Тип" />
                  </v-col>
                  <v-col cols="12" sm="7">
                    <v-text-field
                      ref="innFieldRef"
                      v-model.trim="companyForm.inn"
                      label="ИНН"
                      inputmode="numeric"
                      :maxlength="12"
                      :counter="innLength"
                      :rules="innRules"
                    />
                  </v-col>
                </v-row>
                <v-alert
                  v-if="companyForm.type !== company.type"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mb-3"
                >
                  Тип компании определяет налоговый режим в расчётах и налоговом календаре.
                </v-alert>
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis">Создана {{ formatDate(company.created_at) }}</span>
                  <v-spacer />
                  <v-btn type="submit" color="primary" :loading="companySaving" :disabled="!companyDirty">
                    Сохранить
                  </v-btn>
                </div>
              </v-form>

              <v-table v-else density="compact">
                <tbody>
                  <tr>
                    <td class="text-medium-emphasis">Название</td>
                    <td>{{ company.name }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis">Тип</td>
                    <td>{{ companyTypeLabel(company.type) }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis">ИНН</td>
                    <td>{{ company.inn || '—' }}</td>
                  </tr>
                  <tr>
                    <td class="text-medium-emphasis">Создана</td>
                    <td>{{ formatDate(company.created_at) }}</td>
                  </tr>
                </tbody>
              </v-table>
              <div v-if="!auth.isAdmin" class="text-caption text-medium-emphasis mt-2">
                Изменять данные компании может владелец или администратор.
              </div>
            </template>
            <div v-else-if="!companyLoading" class="d-flex align-center ga-2">
              <span class="text-medium-emphasis">Не удалось загрузить данные компании.</span>
              <v-btn variant="text" size="small" @click="loadCompany">Повторить</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Telegram -->
      <v-col cols="12" lg="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center flex-wrap ga-2">
            <v-icon icon="mdi-send-circle-outline" class="mr-1" />
            Telegram-бот
            <v-spacer />
            <v-chip
              size="small"
              variant="tonal"
              :color="auth.user?.telegram_linked ? 'success' : 'grey'"
              :prepend-icon="auth.user?.telegram_linked ? 'mdi-check-circle' : 'mdi-link-off'"
            >
              {{ auth.user?.telegram_linked ? 'Привязан' : 'Не привязан' }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <template v-if="auth.user?.telegram_linked">
              <p class="text-body-2 mb-4">
                Аккаунт привязан: в боте доступны задачи, учёт доходов и расходов и голосовые команды. Уведомления
                приходят в Telegram, если это включено в настройках ниже.
              </p>
              <v-btn
                color="error"
                variant="outlined"
                prepend-icon="mdi-link-variant-off"
                :loading="unlinking"
                @click="unlinkDialog = true"
              >
                Отвязать Telegram
              </v-btn>
            </template>

            <template v-else>
              <p class="text-body-2 mb-4">
                Привяжите Telegram, чтобы ставить задачи, записывать доходы и расходы и получать уведомления прямо в
                мессенджере.
              </p>

              <template v-if="linkCode && !codeExpired">
                <div class="code-box pa-4 mb-3 rounded-lg">
                  <div class="text-caption text-medium-emphasis">Код привязки</div>
                  <div class="d-flex align-center">
                    <span class="text-h4 font-weight-bold code-value">{{ linkCode.code }}</span>
                    <v-btn
                      icon="mdi-content-copy"
                      variant="text"
                      size="small"
                      class="ml-2"
                      aria-label="Скопировать команду"
                      @click="copyCommand"
                    />
                  </div>
                  <div class="text-caption text-medium-emphasis">Действует ещё {{ countdown }}</div>
                </div>
                <ol class="text-body-2 pl-5 mb-3">
                  <li v-if="botUsername">
                    Откройте бота
                    <a :href="botLink" target="_blank" rel="noopener noreferrer">@{{ botUsername }}</a>
                    — код подставится автоматически (команда <code>/start {{ linkCode.code }}</code>).
                  </li>
                  <li>
                    Или отправьте боту команду <code>/link {{ linkCode.code }}</code>.
                  </li>
                  <li>После ответа бота нажмите «Проверить привязку».</li>
                </ol>
                <div class="d-flex flex-wrap ga-2">
                  <v-btn
                    v-if="botLink"
                    :href="botLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    prepend-icon="mdi-open-in-new"
                  >
                    Открыть бота
                  </v-btn>
                  <v-btn variant="outlined" prepend-icon="mdi-refresh" :loading="checkingLink" @click="checkTelegram">
                    Проверить привязку
                  </v-btn>
                </div>
              </template>

              <template v-else>
                <v-alert v-if="codeExpired" type="warning" variant="tonal" density="compact" class="mb-3">
                  Срок действия кода истёк. Получите новый код.
                </v-alert>
                <v-btn color="primary" prepend-icon="mdi-key-outline" :loading="codeLoading" @click="getLinkCode">
                  Получить код
                </v-btn>
              </template>
            </template>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Уведомления -->
      <v-col cols="12" lg="6">
        <v-card class="h-100" :loading="settingsLoading">
          <v-card-title>
            <v-icon icon="mdi-bell-outline" class="mr-1" />
            Каналы уведомлений
          </v-card-title>
          <v-card-text>
            <template v-if="notifySettings">
              <v-switch
                :model-value="notifySettings.email_enabled"
                label="Дублировать уведомления на email"
                color="primary"
                hide-details
                :disabled="settingsSaving"
                @update:model-value="(v) => saveSetting('email_enabled', v)"
              />
              <v-switch
                :model-value="notifySettings.telegram_enabled"
                label="Дублировать уведомления в Telegram"
                color="primary"
                hide-details
                :disabled="settingsSaving"
                @update:model-value="(v) => saveSetting('telegram_enabled', v)"
              />
              <div v-if="!auth.user?.telegram_linked" class="text-caption text-medium-emphasis">
                Уведомления в Telegram начнут приходить после привязки бота.
              </div>
            </template>
            <div v-else-if="!settingsLoading" class="d-flex align-center ga-2">
              <span class="text-medium-emphasis">Не удалось загрузить настройки.</span>
              <v-btn variant="text" size="small" @click="loadSettings">Повторить</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Подписка -->
      <v-col cols="12" lg="6">
        <v-card class="h-100">
          <v-card-title>
            <v-icon icon="mdi-credit-card-outline" class="mr-1" />
            Подписка
          </v-card-title>
          <v-card-text>
            <div v-if="subscription.subscription" class="d-flex align-center flex-wrap ga-2 mb-4">
              <v-chip size="small" variant="tonal" :color="subscriptionColor">{{ subscriptionLabel }}</v-chip>
              <span v-if="subscription.status !== 'expired'" class="text-body-2">
                осталось дней: {{ subscription.daysLeft }}
              </span>
            </div>
            <div v-else class="text-body-2 text-medium-emphasis mb-4">Статус подписки загружается…</div>
            <v-btn to="/subscription" color="primary" variant="outlined" append-icon="mdi-arrow-right">
              Управление подпиской
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Опасная зона -->
      <v-col v-if="auth.isOwner" cols="12">
        <v-card variant="outlined" class="danger-card">
          <v-card-title class="text-error">
            <v-icon icon="mdi-alert-octagon-outline" class="mr-1" />
            Удаление компании
          </v-card-title>
          <v-card-text class="d-flex align-center flex-wrap ga-4">
            <span class="text-body-2">
              Будут удалены компания, все её пользователи и подписка. Действие необратимо.
            </span>
            <v-spacer />
            <v-btn color="error" variant="flat" prepend-icon="mdi-delete-forever" :disabled="!company" @click="openDeleteDialog">
              Удалить компанию
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Подтверждение отвязки Telegram -->
    <v-dialog v-model="unlinkDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4">Отвязать Telegram?</v-card-title>
        <v-card-text>Бот перестанет принимать команды от вашего аккаунта и присылать уведомления.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="unlinkDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" :loading="unlinking" @click="doUnlink">Отвязать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Подтверждение удаления компании -->
    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card>
        <v-card-title class="pt-4 text-error">Удалить компанию?</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Компания «{{ company?.name }}», все её пользователи и подписка будут удалены без возможности
            восстановления. Для подтверждения введите название компании.
          </p>
          <v-text-field v-model="deleteConfirm" label="Название компании" autocomplete="off" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" :disabled="!deleteConfirmed" :loading="deleting" @click="doDeleteCompany">
            Удалить навсегда
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  changePassword,
  createTelegramLinkCode,
  deleteCompany,
  getCompany,
  getNotificationSettings,
  unlinkTelegram,
  updateCompany,
  updateMe,
  updateNotificationSettings,
} from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { useSubscriptionStore } from '@/stores/subscription.js';
import { formatDate } from '@/utils/format';

const router = useRouter();
const auth = useAuthStore();
const notify = useNotifyStore();
const subscription = useSubscriptionStore();

// ---------------------------------------------------------------- справочники
const ROLE_LABELS = { owner: 'Владелец', admin: 'Администратор', user: 'Пользователь' };
const ROLE_COLORS = { owner: 'deep-purple', admin: 'primary', user: 'grey' };
const companyTypes = [
  { title: 'Самозанятый', value: 'self_employed' },
  { title: 'ИП', value: 'ip' },
  { title: 'ООО', value: 'ooo' },
];

function roleLabel(role) {
  return ROLE_LABELS[role] || '—';
}
function roleColor(role) {
  return ROLE_COLORS[role] || 'grey';
}
function companyTypeLabel(type) {
  return companyTypes.find((t) => t.value === type)?.title || '—';
}

const maxLen = (n) => (v) => (v || '').length <= n || `Не более ${n} символов`;
const fullNameRules = [(v) => !!(v || '').trim() || 'Введите ФИО', maxLen(255)];
const phoneRules = [
  (v) => {
    if (!v || !v.trim()) return true;
    const digits = v.replace(/\D/g, '').length;
    return (digits >= 10 && digits <= 15 && v.length <= 32) || 'Некорректный номер телефона';
  },
];

// ---------------------------------------------------------------- личные данные
const profileFormRef = ref(null);
const profile = reactive({ full_name: '', phone: '', position: '' });
const profileSaving = ref(false);

function fillProfile(user) {
  profile.full_name = user?.full_name || '';
  profile.phone = user?.phone || '';
  profile.position = user?.position || '';
}

const profileDirty = computed(() => {
  const u = auth.user;
  if (!u) return false;
  return (
    profile.full_name.trim() !== (u.full_name || '') ||
    profile.phone.trim() !== (u.phone || '') ||
    profile.position.trim() !== (u.position || '')
  );
});

async function saveProfile() {
  const { valid } = await profileFormRef.value.validate();
  if (!valid) return;
  profileSaving.value = true;
  try {
    const user = await updateMe({
      full_name: profile.full_name.trim(),
      phone: profile.phone.trim() || null,
      position: profile.position.trim() || null,
    });
    auth.setUser(user);
    fillProfile(user);
    notify.success('Профиль сохранён');
  } catch (err) {
    notify.error(err);
  } finally {
    profileSaving.value = false;
  }
}

// ---------------------------------------------------------------- пароль
const passwordFormRef = ref(null);
const passwordForm = reactive({ current: '', next: '', confirm: '' });
const showPasswords = ref(false);
const passwordSaving = ref(false);
const newPasswordRules = [
  (v) => !!v || 'Введите новый пароль',
  (v) => (v || '').length >= 8 || 'Не менее 8 символов',
  maxLen(128),
  (v) => v !== passwordForm.current || 'Новый пароль совпадает с текущим',
];
const confirmPasswordRules = [
  (v) => !!v || 'Повторите новый пароль',
  (v) => v === passwordForm.next || 'Пароли не совпадают',
];

async function savePassword() {
  const { valid } = await passwordFormRef.value.validate();
  if (!valid) return;
  passwordSaving.value = true;
  try {
    await changePassword({ current_password: passwordForm.current, new_password: passwordForm.next });
    passwordFormRef.value.reset();
    passwordFormRef.value.resetValidation();
    notify.success('Пароль изменён');
  } catch (err) {
    notify.error(err);
  } finally {
    passwordSaving.value = false;
  }
}

// ---------------------------------------------------------------- компания
const company = ref(null);
const companyLoading = ref(false);
const companySaving = ref(false);
const companyFormRef = ref(null);
const innFieldRef = ref(null);
const companyForm = reactive({ name: '', type: 'self_employed', inn: '' });

function fillCompany(value) {
  companyForm.name = value?.name || '';
  companyForm.type = value?.type || 'self_employed';
  companyForm.inn = value?.inn || '';
}

const companyNameRules = [(v) => !!(v || '').trim() || 'Введите название', maxLen(255)];
/** У организаций (ООО) ИНН 10 цифр, у ИП и самозанятых — 12. */
const innLength = computed(() => (companyForm.type === 'ooo' ? 10 : 12));
const innRules = [
  (v) => {
    if (!v) return true;
    if (!/^\d+$/.test(v)) return 'Только цифры';
    return v.length === innLength.value || `ИНН должен содержать ${innLength.value} цифр`;
  },
];
watch(
  () => companyForm.type,
  () => {
    if (companyForm.inn) innFieldRef.value?.validate();
  },
);

const companyDirty = computed(() => {
  const c = company.value;
  if (!c) return false;
  return (
    companyForm.name.trim() !== c.name || companyForm.type !== c.type || (companyForm.inn || null) !== (c.inn || null)
  );
});

async function loadCompany() {
  companyLoading.value = true;
  try {
    company.value = await getCompany();
    fillCompany(company.value);
  } catch (err) {
    notify.error(err);
  } finally {
    companyLoading.value = false;
  }
}

async function saveCompany() {
  const { valid } = await companyFormRef.value.validate();
  if (!valid) return;
  const typeChanged = companyForm.type !== company.value.type;
  companySaving.value = true;
  try {
    company.value = await updateCompany({
      name: companyForm.name.trim(),
      type: companyForm.type,
      inn: companyForm.inn || null,
    });
    fillCompany(company.value);
    notify.success('Данные компании сохранены');
  } catch (err) {
    notify.error(err);
    return;
  } finally {
    companySaving.value = false;
  }
  // Тип компании зашит в access-токен (налоговые расчёты) — получаем новый токен;
  // иначе достаточно перечитать пользователя (user.company).
  try {
    if (typeChanged) {
      await auth.refresh();
    } else {
      await auth.fetchMe();
    }
  } catch {
    if (!auth.isAuthenticated) router.replace('/login');
  }
}

// ---------------------------------------------------------------- Telegram
const linkCode = ref(null);
const codeLoading = ref(false);
const checkingLink = ref(false);
const unlinking = ref(false);
const unlinkDialog = ref(false);
const codeExpiresAt = ref(0);
const now = ref(Date.now());
let timer = null;

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

const secondsLeft = computed(() => Math.max(0, Math.round((codeExpiresAt.value - now.value) / 1000)));
const codeExpired = computed(() => Boolean(linkCode.value) && secondsLeft.value === 0);
const countdown = computed(() => {
  const s = secondsLeft.value;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
});
const botUsername = computed(() => (linkCode.value?.bot_username || '').replace(/^@/, ''));
const botLink = computed(() =>
  botUsername.value && linkCode.value
    ? `https://t.me/${encodeURIComponent(botUsername.value)}?start=${encodeURIComponent(linkCode.value.code)}`
    : null,
);

async function getLinkCode() {
  codeLoading.value = true;
  try {
    linkCode.value = await createTelegramLinkCode();
    codeExpiresAt.value = Date.now() + (Number(linkCode.value.expires_in) || 0) * 1000;
    now.value = Date.now();
    stopTimer();
    timer = setInterval(() => {
      now.value = Date.now();
      if (secondsLeft.value === 0) stopTimer();
    }, 1000);
  } catch (err) {
    notify.error(err);
  } finally {
    codeLoading.value = false;
  }
}

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(`/link ${linkCode.value.code}`);
    notify.info('Команда скопирована');
  } catch {
    notify.warning('Не удалось скопировать — выделите код вручную');
  }
}

async function checkTelegram() {
  checkingLink.value = true;
  try {
    const me = await auth.fetchMe();
    if (me.telegram_linked) {
      linkCode.value = null;
      stopTimer();
      notify.success('Telegram привязан');
    } else {
      notify.info('Привязка ещё не выполнена. Отправьте код боту и повторите проверку.');
    }
  } catch (err) {
    notify.error(err);
  } finally {
    checkingLink.value = false;
  }
}

async function doUnlink() {
  unlinking.value = true;
  try {
    await unlinkTelegram();
    auth.setUser({ ...auth.user, telegram_linked: false });
    unlinkDialog.value = false;
    notify.success('Telegram отвязан');
  } catch (err) {
    notify.error(err);
  } finally {
    unlinking.value = false;
  }
}

// ---------------------------------------------------------------- уведомления
const notifySettings = ref(null);
const settingsLoading = ref(false);
const settingsSaving = ref(false);

async function loadSettings() {
  settingsLoading.value = true;
  try {
    notifySettings.value = await getNotificationSettings();
  } catch (err) {
    notify.error(err);
  } finally {
    settingsLoading.value = false;
  }
}

async function saveSetting(key, value) {
  settingsSaving.value = true;
  try {
    notifySettings.value = await updateNotificationSettings({ [key]: Boolean(value) });
  } catch (err) {
    notify.error(err);
  } finally {
    settingsSaving.value = false;
  }
}

// ---------------------------------------------------------------- подписка
const SUBSCRIPTION_LABELS = { trial: 'Пробный период', active: 'Активна', expired: 'Истекла' };
const SUBSCRIPTION_COLORS = { trial: 'info', active: 'success', expired: 'error' };
const subscriptionLabel = computed(() => SUBSCRIPTION_LABELS[subscription.status] || '—');
const subscriptionColor = computed(() => SUBSCRIPTION_COLORS[subscription.status] || 'grey');

// ---------------------------------------------------------------- удаление компании
const deleteDialog = ref(false);
const deleteConfirm = ref('');
const deleting = ref(false);
const deleteConfirmed = computed(
  () => Boolean(company.value) && deleteConfirm.value.trim() === company.value.name.trim(),
);

function openDeleteDialog() {
  deleteConfirm.value = '';
  deleteDialog.value = true;
}

async function doDeleteCompany() {
  if (!deleteConfirmed.value) return;
  deleting.value = true;
  try {
    await deleteCompany();
  } catch (err) {
    notify.error(err);
    deleting.value = false;
    return;
  }
  deleteDialog.value = false;
  await auth.logout();
  deleting.value = false;
  notify.success('Компания удалена');
  router.replace('/login');
}

// ---------------------------------------------------------------- старт
onMounted(() => {
  fillProfile(auth.user);
  loadCompany();
  loadSettings();
  if (!subscription.subscription) {
    subscription.load().catch(() => {
      /* статус подписки — второстепенный блок страницы */
    });
  }
});

onBeforeUnmount(stopTimer);
</script>

<style scoped>
.code-box {
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px dashed rgba(var(--v-theme-primary), 0.4);
}
.code-value {
  letter-spacing: 0.2em;
  font-variant-numeric: tabular-nums;
}
.danger-card {
  border-color: rgba(var(--v-theme-error), 0.5);
}
</style>
