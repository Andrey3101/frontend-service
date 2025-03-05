<template>
  <v-container class="register-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="register-col">
        <v-card class="register-card" elevation="8">
          <v-card-title class="register-title">Регистрация</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="register">
              <v-text-field
                v-model="name"
                label="Имя"
                required
                prepend-icon="mdi-account"
                class="input-field"
              />
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
              <v-btn type="submit" color="primary" block class="register-btn">Зарегистрироваться</v-btn>
              <v-btn
                text
                block
                class="login-btn"
                @click="$router.push('/login')"
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
      name: '',
      email: '',
      password: '',
    };
  },
  methods: {
    async register() {
      const authStore = useAuthStore();
      try {
        await authStore.register(this.name, this.email, this.password);
        this.$router.push('/dashboard');
      } catch (error) {
        console.error('Ошибка регистрации:', error);
      }
    },
  },
};
</script>

<style scoped>
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
  padding: 20px;
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
  margin-bottom: 16px;
  font-family: 'Gilroy-Regular', sans-serif;
}

.register-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  margin-top: 16px;
}

.login-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  color: #1976d2;
  margin-top: 8px;
}

/* Адаптация для десктопа */
@media (min-width: 960px) {
  .register-card {
    width: 100%;
    max-width: 900px; /* Растянуто в 2.5 раза */
  }
}

/* Адаптация для мобильных устройств (320px) */
@media (max-width: 320px) {
  .register-card {
    padding: 12px; /* Уменьшаем отступы */
    max-width: 280px; /* Уменьшаем ширину */
  }
  .register-title {
    font-size: 1.4rem; /* Уменьшаем заголовок */
  }
  .input-field {
    margin-bottom: 12px; /* Уменьшаем отступы */
    font-size: 0.9rem; /* Уменьшаем шрифт */
  }
  .register-btn,
  .login-btn {
    font-size: 0.9rem; /* Уменьшаем шрифт кнопок */
    padding: 8px 12px; /* Уменьшаем размер кнопок */
    margin-top: 8px; /* Уменьшаем отступы */
  }
}
</style>