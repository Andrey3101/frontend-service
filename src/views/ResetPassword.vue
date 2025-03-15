<template>
  <v-container class="reset-password-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="reset-password-col">
        <v-snackbar v-model="showError" color="error" :timeout="5000" top centered>
          {{ errorMessage }}
        </v-snackbar>
        <v-snackbar v-model="showSuccess" color="success" :timeout="3000" top centered>
          {{ successMessage }}
        </v-snackbar>
        <v-card class="reset-password-card" elevation="8">
          <v-card-title class="reset-password-title">Сброс пароля</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="resetPassword" ref="form" v-model="valid">
              <v-text-field
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                label="Новый пароль"
                required
                prepend-icon="mdi-lock"
                append-icon="mdi-eye"
                @click:append="showPassword = !showPassword"
                class="input-field"
                :rules="[rules.required, rules.minLength]"
                aria-label="Введите новый пароль"
              />
              <v-btn
                type="submit"
                color="primary"
                block
                class="reset-btn"
                :disabled="!valid"
                :loading="loading"
                aria-label="Сбросить пароль"
              >
                Сбросить пароль
              </v-btn>
              <v-btn
                text
                block
                class="login-btn"
                @click="$router.push('/login')"
                aria-label="Вернуться ко входу"
              >
                Вернуться ко входу
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { confirmPasswordReset } from '@/api/index';

export default {
  name: 'ResetPasswordForm',
  data() {
    return {
      valid: false,
      newPassword: '',
      showPassword: false,
      loading: false,
      showError: false,
      showSuccess: false,
      errorMessage: 'Ошибка при сбросе пароля',
      successMessage: 'Пароль успешно сброшен! Перенаправляем...',
      rules: {
        required: value => !!value || 'Это поле обязательно',
        minLength: value => value.length >= 6 || 'Пароль должен содержать минимум 6 символов',
      },
    };
  },
  computed: {
    token() {
      return this.$route.query.token || '';
    },
  },
  methods: {
    async resetPassword() {
      if (this.$refs.form.validate()) {
        this.loading = true;
        try {
          const response = await confirmPasswordReset(this.token, this.newPassword);
          this.successMessage = response.message;
          this.showSuccess = true;
          setTimeout(() => {
            this.$router.push('/login');
          }, 1500);
        } catch (error) {
          this.errorMessage = error.message || 'Ошибка при сбросе пароля';
          this.showError = true;
          console.error('Ошибка сброса пароля:', error);
        } finally {
          this.loading = false;
        }
      }
    },
  },
};
</script>

<style scoped>
.reset-password-container {
  height: 100vh;
}

.reset-password-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

.reset-password-card {
  width: 100%;
  padding: 20px;
}

.reset-password-title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  padding: 16px 0;
}

.input-field {
  margin-bottom: 16px;
}

.reset-btn {
  margin: 20px 0 10px 0;
  padding: 10px;
  font-weight: bold;
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
</style>