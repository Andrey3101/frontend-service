<template>
  <v-container class="register-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="register-col">
        <v-snackbar v-model="showError" color="error" :timeout="5000" top centered>
          Ошибка регистрации: проверьте данные
        </v-snackbar>
        <v-snackbar v-model="showSuccess" color="success" :timeout="3000" top centered>
          Успешная регистрация! Перенаправляем...
        </v-snackbar>
        <v-card class="register-card" elevation="8">
          <v-card-title class="register-title">Регистрация</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="register" ref="form" v-model="valid">
              <v-text-field
                v-model="name"
                label="Имя"
                required
                prepend-icon="mdi-account"
                class="input-field"
                :rules="[rules.required]"
                aria-label="Введите ваше имя"
              />
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-icon="mdi-email"
                class="input-field"
                :rules="[rules.required, rules.email]"
                aria-label="Введите ваш email"
              />
              <v-text-field
                v-model="phone"
                label="Телефон"
                prepend-icon="mdi-phone"
                class="input-field"
                :rules="[rules.required, rules.phone]"
                :input-mask="phoneMask"
                @focus="phoneMask = ''"
                @blur="phoneMask = '+7(###) ###-##-##'"
                placeholder="+7(ххх) ххх-хх-хх"
                aria-label="Введите ваш номер телефона в формате +7(ххх) ххх-хх-хх"
              />
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                label="Пароль"
                required
                prepend-icon="mdi-lock"
                append-icon="mdi-eye"
                @click:append="showPassword = !showPassword"
                class="input-field"
                :rules="[rules.required, rules.minLength]"
                aria-label="Введите ваш пароль"
              />
              <v-select
                v-model="companyType"
                :items="companyTypes"
                label="Тип компании"
                prepend-icon="mdi-domain"
                class="input-field"
                :rules="[rules.required]"
                aria-label="Выберите тип компании"
              />

              <!-- Поля для самозанятого -->
              <div v-if="companyType === 'Самозанятый'" class="company-fields">
                <v-text-field
                  v-model="selfEmployedData.inn"
                  label="ИНН"
                  prepend-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.inn]"
                  aria-label="Введите ваш ИНН"
                />
              </div>

              <!-- Поля для ИП -->
              <div v-if="companyType === 'ИП'" class="company-fields">
                <v-text-field
                  v-model="ipData.inn"
                  label="ИНН"
                  prepend-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.inn]"
                  aria-label="Введите ваш ИНН"
                />
                <v-text-field
                  v-model="ipData.ogrnip"
                  label="ОГРНИП"
                  prepend-icon="mdi-file-document"
                  class="input-field"
                  :rules="[rules.required, rules.ogrnip]"
                  aria-label="Введите ваш ОГРНИП"
                />
              </div>

              <!-- Поля для ООО -->
              <div v-if="companyType === 'ООО'" class="company-fields">
                <v-text-field
                  v-model="oooData.companyName"
                  label="Название компании"
                  prepend-icon="mdi-office-building"
                  class="input-field"
                  :rules="[rules.required]"
                  aria-label="Введите название компании"
                />
                <v-text-field
                  v-model="oooData.inn"
                  label="ИНН"
                  prepend-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.inn]"
                  aria-label="Введите ИНН компании"
                />
                <v-text-field
                  v-model="oooData.ogrn"
                  label="ОГРН"
                  prepend-icon="mdi-file-document"
                  class="input-field"
                  :rules="[rules.required, rules.ogrn]"
                  aria-label="Введите ОГРН компании"
                />
              </div>

              <v-btn
                type="submit"
                color="primary"
                block
                class="register-btn"
                :disabled="!valid"
                :loading="loading"
                aria-label="Зарегистрироваться"
              >
                Зарегистрироваться
              </v-btn>
              <v-btn
                text
                block
                class="reset-password-btn"
                @click="$router.push('/reset-password')"
                aria-label="Восстановить пароль"
              >
                Забыли пароль?
              </v-btn>
              <v-btn
                text
                block
                class="login-btn"
                @click="$router.push('/login')"
                aria-label="Перейти ко входу"
              >
                Уже есть аккаунт? Войти
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'RegisterForm',
  data() {
    return {
      valid: false,
      name: '',
      email: '',
      phone: '',
      password: '',
      showPassword: false,
      phoneMask: '+7(###) ###-##-##',
      loading: false,
      showError: false,
      showSuccess: false,
      companyType: null,
      companyTypes: ['Самозанятый', 'ИП', 'ООО'],
      selfEmployedData: { inn: '' },
      ipData: { inn: '', ogrnip: '' },
      oooData: { companyName: '', inn: '', ogrn: '' },
      rules: {
        required: value => !!value || 'Это поле обязательно',
        email: value => {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return pattern.test(value) || 'Неверный формат email';
        },
        phone: value => {
          const cleaned = value.replace(/\D/g, '');
          return (cleaned.length === 11 && cleaned.startsWith('7')) || 'Номер должен быть в формате +7(ххх) ххх-хх-хх';
        },
        minLength: value => value.length >= 6 || 'Пароль должен содержать минимум 6 символов',
        inn: value => /^\d{12}$/.test(value) || 'ИНН должен содержать 12 цифр',
        ogrnip: value => /^\d{15}$/.test(value) || 'ОГРНИП должен содержать 15 цифр',
        ogrn: value => /^\d{13}$/.test(value) || 'ОГРН должен содержать 13 цифр',
      },
    };
  },
  methods: {
    async register() {
      if (this.$refs.form.validate()) {
        this.loading = true;
        const authStore = useAuthStore();
        const payload = {
          name: this.name,
          email: this.email,
          phone: this.phone,
          password: this.password,
          company_type: this.companyType,
        };

        // Добавляем данные компании в зависимости от типа
        if (this.companyType === 'Самозанятый') {
          payload.company_data = this.selfEmployedData;
        } else if (this.companyType === 'ИП') {
          payload.company_data = this.ipData;
        } else if (this.companyType === 'ООО') {
          payload.company_data = this.oooData;
        }

        try {
          await authStore.register(payload);
          this.showSuccess = true;
          setTimeout(() => {
            this.$router.push('/dashboard');
          }, 1500);
        } catch (error) {
          this.showError = true;
          console.error('Ошибка регистрации:', error);
        } finally {
          this.loading = false;
        }
      }
    },
  },
};
</script>

<style scoped>
.register-container {
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
}

.register-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-card {
  width: 100%;
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.register-title {
  font-size: 28px;
  font-weight: 600;
  color: #1976d2;
  text-align: center;
  margin-bottom: 16px;
}

.input-field {
  margin-bottom: 16px;
}

.company-fields {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
}

.register-btn {
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.5px;
  transition: background-color 0.3s ease;
}

.register-btn:hover {
  background-color: #1565c0;
}

.reset-password-btn,
.login-btn {
  margin-top: 8px;
  text-transform: none;
  color: #1976d2;
}

.reset-password-btn:hover,
.login-btn:hover {
  color: #1565c0;
}
</style>