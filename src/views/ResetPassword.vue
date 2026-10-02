<template>
  <v-container class="fill-height auth-page">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <div class="text-center mb-6">
          <v-icon icon="mdi-lock-reset" size="48" color="primary" />
          <div class="text-h5 font-weight-bold mt-2">Восстановление пароля</div>
        </div>

        <v-card elevation="4">
          <!-- Установка нового пароля по ссылке из письма -->
          <template v-if="token">
            <v-card-title class="text-h6 pt-5 px-6">Новый пароль</v-card-title>
            <v-card-text class="px-6">
              <v-alert v-if="confirmError" type="error" variant="tonal" density="compact" class="mb-4">
                {{ confirmError }}
                <div v-if="tokenInvalid" class="mt-2">
                  <router-link to="/reset-password" class="font-weight-medium">Запросить новую ссылку</router-link>
                </div>
              </v-alert>

              <v-form ref="confirmFormRef" @submit.prevent="onConfirm">
                <v-text-field
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  label="Новый пароль"
                  autocomplete="new-password"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :rules="passwordRules"
                  hint="Не менее 8 символов"
                  autofocus
                  class="mb-2"
                  @click:append-inner="showPassword = !showPassword"
                />
                <v-text-field
                  v-model="newPasswordConfirm"
                  :type="showPassword ? 'text' : 'password'"
                  label="Повторите пароль"
                  autocomplete="new-password"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :rules="confirmRules"
                />
                <v-btn type="submit" color="primary" size="large" block class="mt-2" :loading="loading">
                  Сохранить пароль
                </v-btn>
              </v-form>
            </v-card-text>
          </template>

          <!-- Запрос письма со ссылкой -->
          <template v-else>
            <v-card-title class="text-h6 pt-5 px-6">Сброс пароля</v-card-title>
            <v-card-text class="px-6">
              <v-alert v-if="requestSent" type="success" variant="tonal">
                Если адрес зарегистрирован, мы отправили письмо со ссылкой для сброса пароля. Проверьте почту, в том
                числе папку «Спам».
              </v-alert>
              <v-form v-else ref="requestFormRef" @submit.prevent="onRequest">
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Укажите email, с которым вы регистрировались. Мы пришлём ссылку для установки нового пароля.
                </p>
                <v-text-field
                  v-model.trim="email"
                  label="Email"
                  type="email"
                  autocomplete="email"
                  prepend-inner-icon="mdi-email-outline"
                  :rules="emailRules"
                  autofocus
                />
                <v-btn type="submit" color="primary" size="large" block class="mt-2" :loading="loading">
                  Отправить ссылку
                </v-btn>
              </v-form>
            </v-card-text>
          </template>

          <v-divider />
          <v-card-text class="text-center text-body-2">
            <router-link to="/login" class="font-weight-medium">Вернуться ко входу</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { confirmPasswordReset, errorMessage, requestPasswordReset } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';

const route = useRoute();
const router = useRouter();
const notify = useNotifyStore();

const token = computed(() => {
  const value = Array.isArray(route.query.token) ? route.query.token[0] : route.query.token;
  return typeof value === 'string' ? value.trim() : '';
});

const loading = ref(false);

// ---- новый пароль ----
const confirmFormRef = ref(null);
const newPassword = ref('');
const newPasswordConfirm = ref('');
const showPassword = ref(false);
const confirmError = ref('');
const tokenInvalid = ref(false);

const passwordRules = [
  (v) => !!v || 'Введите пароль',
  (v) => (v || '').length >= 8 || 'Не менее 8 символов',
  (v) => (v || '').length <= 128 || 'Не более 128 символов',
];
const confirmRules = [(v) => !!v || 'Повторите пароль', (v) => v === newPassword.value || 'Пароли не совпадают'];

async function onConfirm() {
  const { valid } = await confirmFormRef.value.validate();
  if (!valid) return;
  loading.value = true;
  confirmError.value = '';
  tokenInvalid.value = false;
  try {
    await confirmPasswordReset({ token: token.value, new_password: newPassword.value });
    notify.success('Пароль изменён. Войдите с новым паролем.');
    router.replace('/login');
  } catch (err) {
    tokenInvalid.value = err?.response?.status === 400;
    confirmError.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}

// ---- запрос ссылки ----
const requestFormRef = ref(null);
const email = ref('');
const requestSent = ref(false);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailRules = [(v) => !!v || 'Введите email', (v) => EMAIL_RE.test(v || '') || 'Некорректный email'];

async function onRequest() {
  const { valid } = await requestFormRef.value.validate();
  if (!valid) return;
  loading.value = true;
  try {
    await requestPasswordReset({ email: email.value });
    requestSent.value = true;
  } catch (err) {
    if (err?.response?.status === 429) {
      notify.error('Слишком много запросов. Попробуйте позже.');
    } else {
      notify.error(err);
    }
  } finally {
    loading.value = false;
  }
}

// Переход между режимами (например, «Запросить новую ссылку») — сбросить состояние форм.
watch(token, () => {
  confirmError.value = '';
  tokenInvalid.value = false;
  requestSent.value = false;
  newPassword.value = '';
  newPasswordConfirm.value = '';
});
</script>

<style scoped>
.auth-page {
  max-width: 1200px;
}
</style>
