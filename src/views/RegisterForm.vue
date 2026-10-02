<template>
  <v-container class="fill-height auth-page">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <div class="text-center mb-6">
          <v-icon icon="mdi-briefcase-check-outline" size="48" color="primary" />
          <div class="text-h5 font-weight-bold mt-2">ClerkAI</div>
          <div class="text-body-2 text-medium-emphasis">
            Регистрация компании — пробный период начнётся сразу после создания аккаунта
          </div>
        </div>

        <v-card elevation="4">
          <v-card-title class="text-h6 pt-5 px-6">Регистрация</v-card-title>
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
              <div class="text-subtitle-2 mb-2">Учётная запись</div>
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    v-model.trim="form.email"
                    label="Email *"
                    type="email"
                    autocomplete="email"
                    prepend-inner-icon="mdi-email-outline"
                    :rules="emailRules"
                    :error-messages="emailError"
                    autofocus
                    @update:model-value="emailError = ''"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    label="Пароль *"
                    autocomplete="new-password"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    :rules="passwordRules"
                    hint="Не менее 8 символов"
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.passwordConfirm"
                    :type="showPassword ? 'text' : 'password'"
                    label="Повторите пароль *"
                    autocomplete="new-password"
                    prepend-inner-icon="mdi-lock-check-outline"
                    :rules="confirmRules"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.fullName"
                    label="ФИО *"
                    autocomplete="name"
                    prepend-inner-icon="mdi-account-outline"
                    :rules="fullNameRules"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.phone"
                    label="Телефон"
                    type="tel"
                    autocomplete="tel"
                    prepend-inner-icon="mdi-phone-outline"
                    placeholder="+7 900 000-00-00"
                    :rules="phoneRules"
                  />
                </v-col>
              </v-row>

              <div class="text-subtitle-2 mt-2 mb-2">Компания</div>
              <v-row dense>
                <v-col cols="12" sm="5">
                  <v-select
                    v-model="form.companyType"
                    :items="companyTypes"
                    label="Тип *"
                    prepend-inner-icon="mdi-domain"
                    :rules="[(v) => !!v || 'Выберите тип']"
                  />
                </v-col>
                <v-col cols="12" sm="7">
                  <v-text-field
                    v-model="form.companyName"
                    :label="companyNameLabel"
                    :rules="companyNameRules"
                    :hint="form.companyType === 'self_employed' ? 'Можно указать ваше ФИО' : ''"
                  />
                </v-col>
                <v-col cols="12" sm="7">
                  <v-text-field
                    ref="innFieldRef"
                    v-model.trim="form.inn"
                    label="ИНН"
                    inputmode="numeric"
                    :counter="innLength"
                    :maxlength="12"
                    :hint="innHint"
                    persistent-hint
                    :rules="innRules"
                  />
                </v-col>
              </v-row>

              <v-checkbox v-model="form.consent" :rules="consentRules" density="compact" class="mt-2" color="primary">
                <template #label>
                  <span class="text-body-2">
                    Я даю согласие на обработку моих персональных данных в соответствии с Федеральным законом
                    № 152-ФЗ «О персональных данных»
                  </span>
                </template>
              </v-checkbox>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                class="mt-2"
                :loading="loading"
                prepend-icon="mdi-account-plus-outline"
              >
                Зарегистрироваться
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider />
          <v-card-text class="text-center text-body-2">
            Уже есть аккаунт?
            <router-link to="/login" class="font-weight-medium">Войти</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { errorMessage } from '@/api';
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const auth = useAuthStore();

const companyTypes = [
  { title: 'Самозанятый', value: 'self_employed' },
  { title: 'ИП', value: 'ip' },
  { title: 'ООО', value: 'ooo' },
];

const formRef = ref(null);
const innFieldRef = ref(null);
const form = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  fullName: '',
  phone: '',
  companyName: '',
  companyType: 'self_employed',
  inn: '',
  consent: false,
});
const showPassword = ref(false);
const loading = ref(false);
const errorText = ref('');
const emailError = ref('');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailRules = [(v) => !!v || 'Введите email', (v) => EMAIL_RE.test(v || '') || 'Некорректный email'];
const passwordRules = [
  (v) => !!v || 'Введите пароль',
  (v) => (v || '').length >= 8 || 'Не менее 8 символов',
  (v) => (v || '').length <= 128 || 'Не более 128 символов',
];
const confirmRules = [(v) => !!v || 'Повторите пароль', (v) => v === form.password || 'Пароли не совпадают'];
const fullNameRules = [(v) => !!(v || '').trim() || 'Введите ФИО', (v) => (v || '').length <= 255 || 'Слишком длинно'];
const phoneRules = [
  (v) => {
    if (!v || !v.trim()) return true;
    const digits = v.replace(/\D/g, '').length;
    return (digits >= 10 && digits <= 15 && v.length <= 32) || 'Некорректный номер телефона';
  },
];
const companyNameRules = [
  (v) => !!(v || '').trim() || 'Введите название',
  (v) => (v || '').length <= 255 || 'Слишком длинно',
];
const consentRules = [(v) => !!v || 'Без согласия регистрация невозможна'];

const companyNameLabel = computed(() =>
  form.companyType === 'self_employed' ? 'Название или ФИО *' : 'Название компании *',
);

/** У организаций (ООО) ИНН 10 цифр, у ИП и самозанятых (физлиц) — 12. */
const innLength = computed(() => (form.companyType === 'ooo' ? 10 : 12));
const innHint = computed(() => `Необязательно. ${innLength.value} цифр`);
const innRules = [
  (v) => {
    if (!v) return true;
    if (!/^\d+$/.test(v)) return 'Только цифры';
    return v.length === innLength.value || `ИНН должен содержать ${innLength.value} цифр`;
  },
];

// После смены типа перепроверить ИНН (длина зависит от типа).
watch(
  () => form.companyType,
  () => {
    if (form.inn) innFieldRef.value?.validate();
  },
);

async function onSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  loading.value = true;
  errorText.value = '';
  emailError.value = '';
  try {
    await auth.register({
      email: form.email,
      password: form.password,
      full_name: form.fullName.trim(),
      phone: form.phone.trim() || undefined,
      company_name: form.companyName.trim(),
      company_type: form.companyType,
      inn: form.inn || undefined,
    });
    router.replace('/dashboard');
  } catch (err) {
    if (err?.response?.status === 409) {
      emailError.value = 'Пользователь с таким email уже существует';
      errorText.value = 'Пользователь с таким email уже существует. Войдите или восстановите пароль.';
    } else {
      errorText.value = errorMessage(err);
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  max-width: 1200px;
}
</style>
