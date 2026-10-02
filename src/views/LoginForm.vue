<template>
  <v-container class="fill-height auth-page">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <div class="text-center mb-6">
          <v-icon icon="mdi-briefcase-check-outline" size="48" color="primary" />
          <div class="text-h5 font-weight-bold mt-2">ClerkAI</div>
          <div class="text-body-2 text-medium-emphasis">Помощник для самозанятых, ИП и малого бизнеса</div>
        </div>

        <v-card elevation="4">
          <v-card-title class="text-h6 pt-5 px-6">Вход</v-card-title>
          <v-card-text class="px-6">
            <v-alert
              v-if="errorText"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
              closable
              @click:close="errorText = ''"
            >
              {{ errorText }}
            </v-alert>

            <v-form ref="formRef" @submit.prevent="onSubmit">
              <v-text-field
                v-model.trim="form.email"
                label="Email"
                type="email"
                autocomplete="username"
                prepend-inner-icon="mdi-email-outline"
                :rules="emailRules"
                autofocus
                class="mb-2"
              />
              <v-text-field
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                label="Пароль"
                autocomplete="current-password"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="passwordRules"
                @click:append-inner="showPassword = !showPassword"
              />

              <div class="d-flex justify-end mb-3">
                <v-btn variant="text" size="small" class="text-none" @click="openResetDialog">Забыли пароль?</v-btn>
              </div>

              <v-btn type="submit" color="primary" size="large" block :loading="loading" prepend-icon="mdi-login">
                Войти
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider />
          <v-card-text class="text-center text-body-2">
            Нет аккаунта?
            <router-link to="/register" class="font-weight-medium">Регистрация</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Восстановление пароля -->
    <v-dialog v-model="resetDialog" max-width="440">
      <v-card>
        <v-card-title class="pt-4">Восстановление пароля</v-card-title>
        <v-card-text>
          <template v-if="resetSent">
            <v-alert type="success" variant="tonal">
              Если адрес зарегистрирован, мы отправили письмо со ссылкой для сброса пароля. Проверьте почту, в том
              числе папку «Спам».
            </v-alert>
          </template>
          <v-form v-else ref="resetFormRef" @submit.prevent="sendReset">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Укажите email, с которым вы регистрировались. Мы пришлём ссылку для установки нового пароля.
            </p>
            <v-text-field
              v-model.trim="resetEmail"
              label="Email"
              type="email"
              autocomplete="email"
              prepend-inner-icon="mdi-email-outline"
              :rules="emailRules"
              autofocus
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <template v-if="resetSent">
            <v-btn color="primary" variant="flat" @click="resetDialog = false">Понятно</v-btn>
          </template>
          <template v-else>
            <v-btn variant="text" @click="resetDialog = false">Отмена</v-btn>
            <v-btn color="primary" variant="flat" :loading="resetLoading" @click="sendReset">Отправить</v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { errorMessage, requestPasswordReset } from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { safeRedirect } from '@/utils/redirect';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notify = useNotifyStore();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailRules = [(v) => !!v || 'Введите email', (v) => EMAIL_RE.test(v || '') || 'Некорректный email'];
const passwordRules = [(v) => !!v || 'Введите пароль'];

const formRef = ref(null);
const form = reactive({ email: '', password: '' });
const showPassword = ref(false);
const loading = ref(false);
const errorText = ref('');

/** Текст ошибки входа по коду ответа (401 / 429 / 403). */
function loginErrorText(err) {
  const status = err?.response?.status;
  if (status === 401) return 'Неверный email или пароль.';
  if (status === 429) return 'Слишком много попыток входа. Подождите 15 минут и попробуйте снова.';
  if (status === 403) return 'Учётная запись отключена. Обратитесь к администратору вашей компании.';
  return errorMessage(err);
}

async function onSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  loading.value = true;
  errorText.value = '';
  try {
    await auth.login({ email: form.email, password: form.password });
    router.replace(safeRedirect(route.query.redirect));
  } catch (err) {
    errorText.value = loginErrorText(err);
    form.password = '';
  } finally {
    loading.value = false;
  }
}

// ---- сброс пароля ----
const resetDialog = ref(false);
const resetFormRef = ref(null);
const resetEmail = ref('');
const resetLoading = ref(false);
const resetSent = ref(false);

function openResetDialog() {
  resetEmail.value = form.email;
  resetSent.value = false;
  resetDialog.value = true;
}

async function sendReset() {
  const { valid } = await resetFormRef.value.validate();
  if (!valid) return;
  resetLoading.value = true;
  try {
    await requestPasswordReset({ email: resetEmail.value });
    resetSent.value = true;
  } catch (err) {
    if (err?.response?.status === 429) {
      notify.error('Слишком много запросов. Попробуйте позже.');
    } else {
      notify.error(err);
    }
  } finally {
    resetLoading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  max-width: 1200px;
}
</style>
