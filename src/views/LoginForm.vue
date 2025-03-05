<template>
  <v-container class="login-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="login-col">
        <v-card class="login-card" elevation="8">
          <v-card-title class="login-title">Вход</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-icon="mdi-email"
                class="input-field"
              />
              <v-text-field
                v-model="password"
                label="Пароль"
                type="password"
                required
                prepend-icon="mdi-lock"
                class="input-field"
              />
              <v-btn type="submit" color="primary" block class="login-btn">Войти</v-btn>
              <v-btn
                text
                block
                class="register-btn"
                @click="$router.push('/register')"
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
      email: '',
      password: '',
    };
  },
  methods: {
    async login() {
      const authStore = useAuthStore();
      try {
        await authStore.login(this.email, this.password);
        this.$router.push('/dashboard');
      } catch (error) {
        console.error('Ошибка входа:', error);
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
  padding: 20px;
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
  margin-bottom: 16px;
  font-family: 'Gilroy-Regular', sans-serif;
}

.login-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  margin-top: 16px;
}

.register-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  color: #1976d2;
  margin-top: 8px;
}

/* Адаптация для десктопа */
@media (min-width: 960px) {
  .login-card {
    width: 100%;
    max-width: 900px; /* Растянуто в 2.5 раза */
  }
}

/* Адаптация для мобильных устройств (320px) */
@media (max-width: 320px) {
  .login-card {
    padding: 12px; /* Уменьшаем отступы */
    max-width: 280px; /* Уменьшаем ширину */
  }
  .login-title {
    font-size: 1.4rem; /* Уменьшаем заголовок */
  }
  .input-field {
    margin-bottom: 12px; /* Уменьшаем отступы */
    font-size: 0.9rem; /* Уменьшаем шрифт */
  }
  .login-btn,
  .register-btn {
    font-size: 0.9rem; /* Уменьшаем шрифт кнопок */
    padding: 8px 12px; /* Уменьшаем размер кнопок */
    margin-top: 8px; /* Уменьшаем отступы */
  }
}
</style>