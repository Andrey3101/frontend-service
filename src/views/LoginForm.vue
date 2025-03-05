<template>
  <v-container class="login-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="login-col">
        <v-snackbar v-model="showError" color="error" :timeout="5000" top centered>
          Ошибка входа: неверные данные
        </v-snackbar>
        <v-snackbar v-model="showSuccess" color="success" :timeout="3000" top centered>
          Успешный вход! Перенаправляем...
        </v-snackbar>
        <v-card class="login-card" elevation="8">
          <v-card-title class="login-title">Вход</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="login" ref="form" v-model="valid">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-icon="mdi-email"
                class="input-field"
                :rules="[rules.required, rules.email]"
                autofocus
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
                class="login-btn"
                :disabled="!valid"
                :loading="loading"
                aria-label="Войти в аккаунт"
              >
                Войти
              </v-btn>
              <v-btn
                text
                block
                class="register-btn"
                @click="$router.push('/register')"
                aria-label="Перейти к регистрации"
              >
                Зарегистрироваться
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
  name: 'LoginForm',
  data() {
    return {
      valid: false,
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
    async login() {
      if (this.$refs.form.validate()) {
        this.loading = true;
        const authStore = useAuthStore();
        try {
          await authStore.login(this.email, this.password, this.phone);
          this.showSuccess = true;
          setTimeout(() => {
            this.$router.push('/dashboard');
          }, 1500);
        } catch (error) {
          this.showError = true;
          console.error('Ошибка входа:', error);
        } finally {
          this.loading = false;
        }
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2f7 0%, #d9e2ec 100%);
}

.login-col {
  display: flex;
  justify-content: center;
}

.login-card {
  padding: 24px; /* Увеличиваем отступы */
  border-radius: 16px;
  background: #ffffff;
  width: 100%;
}

.login-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 1.8rem;
  color: #1976d2;
  text-align: center;
}

.input-field {
  margin-bottom: 20px; /* Увеличиваем расстояние между полями */
  font-family: 'Gilroy-Regular', sans-serif;
}

.login-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  margin-top: 16px;
  background: linear-gradient(135deg, #1976d2, #42a5f5); /* Градиент для кнопки */
  color: white;
  transition: transform 0.2s ease;
}

.login-btn:hover {
  transform: scale(1.02);
}

.register-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  margin-top: 12px;
  color: #1565c0; /* Более тёмный оттенок для контраста */
  background: #e3f2fd; /* Лёгкий фон для кнопки */
  border-radius: 8px;
  transition: background 0.2s ease;
}

.register-btn:hover {
  background: #bbdefb;
}

/* Адаптация для десктопа */
@media (min-width: 960px) {
  .login-card {
    width: 100%;
    max-width: 900px;
  }
}

/* Адаптация для мобильных устройств (320px) */
@media (max-width: 320px) {
  .login-card {
    padding: 16px;
    max-width: 280px;
  }
  .login-title {
    font-size: 1.6rem;
  }
  .input-field {
    margin-bottom: 16px;
    font-size: 1rem; /* Увеличиваем шрифт для лучшей читаемости */
  }
  .login-btn,
  .register-btn {
    font-size: 1rem;
    padding: 10px 14px; /* Увеличиваем размер кнопок */
    margin-top: 12px;
  }
}
</style>