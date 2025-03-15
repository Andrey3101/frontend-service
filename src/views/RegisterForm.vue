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
      },
    };
  },
  methods: {
    async register() {
      if (this.$refs.form.validate()) {
        this.loading = true;
        const authStore = useAuthStore();
        try {
          await authStore.register(this.name, this.email, this.password, this.phone);
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
}

.register-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-card {
  width: 100%;
  padding: 20px;
}

.register-title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  padding: 16px 0;
}

.input-field {
  margin-bottom: 16px;
}

.register-btn {
  margin: 20px 0 10px 0;
  padding: 10px;
  font-weight: bold;
}

.reset-password-btn {
  margin: 10px 0;
  color: #9c27b0; /* Фиолетовый цвет для отличия от других кнопок */
  text-transform: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.reset-password-btn:hover {
  color: #7b1fa2; /* Более темный фиолетовый при наведении */
  background-color: rgba(156, 39, 176, 0.1); /* Легкий фиолетовый фон */
  text-decoration: underline;
}

.login-btn {
  margin: 10px 0;
  color: #666;
  text-transform: none;
  font-size: 14px;
}

.login-btn:hover {
  color: #333;
  background-color: rgba(0, 0, 0, 0.05);
}

.register-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2f7 0%, #d9e2ec 100%);
}

.register-col {
  display: flex;
  justify-content: center;
}

.register-card {
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  width: 100%;
}

.register-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 1.8rem;
  color: #1976d2;
  text-align: center;
}

.input-field {
  margin-bottom: 20px;
  font-family: 'Gilroy-Regular', sans-serif;
}

.register-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  margin-top: 16px;
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  color: white;
  transition: transform 0.2s ease;
}

.register-btn:hover {
  transform: scale(1.02);
}

.login-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  margin-top: 12px;
  color: #1565c0;
  background: #e3f2fd;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.login-btn:hover {
  background: #bbdefb;
}

/* Адаптация для десктопа */
@media (min-width: 960px) {
  .register-card {
    width: 100%;
    max-width: 900px;
  }
}

/* Адаптация для мобильных устройств (320px) */
@media (max-width: 320px) {
  .register-card {
    padding: 16px;
    max-width: 280px;
  }
  .register-title {
    font-size: 1.6rem;
  }
  .input-field {
    margin-bottom: 16px;
    font-size: 1rem;
  }
  .register-btn,
  .login-btn {
    font-size: 1rem;
    padding: 10px 14px;
    margin-top: 12px;
  }
}
</style>