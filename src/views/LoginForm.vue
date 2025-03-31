<template>
  <v-container class="login-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="login-col">
        <!-- Уведомления об ошибках и успехе -->
        <v-snackbar
          v-model="snackbar.show"
          :timeout="snackbar.timeout"
          :color="snackbar.color"
          top
          centered
          elevation="24"
        >
          <div class="snackbar-content">
            <v-icon left>{{ snackbar.icon }}</v-icon>
            <div>
              <div class="snackbar-title">{{ snackbar.title }}</div>
              <div class="snackbar-message">{{ snackbar.message }}</div>
            </div>
          </div>
          <template v-slot:action="{ attrs }">
            <v-btn
              icon
              v-bind="attrs"
              @click="snackbar.show = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-snackbar>

        <!-- Основная форма входа -->
        <v-card class="login-card" elevation="8">
          <div class="login-header">
            <v-img
              src="@/assets/logo.png"
              contain
              height="60"
              class="logo"
            ></v-img>
            <v-card-title class="login-title">Вход в систему</v-card-title>
          </div>

          <v-card-text>
            <v-form @submit.prevent="login" ref="form" v-model="valid">
              <!-- Поле email -->
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-inner-icon="mdi-email-outline"
                outlined
                dense
                class="input-field"
                :rules="emailRules"
                :error-messages="fieldErrors.email"
                @input="clearFieldError('email')"
                autofocus
                aria-label="Введите ваш email"
                placeholder="example@domain.com"
              />

              <!-- Поле телефона -->
              <v-text-field
                v-model="phone"
                label="Телефон"
                prepend-inner-icon="mdi-phone-outline"
                outlined
                dense
                class="input-field"
                :rules="phoneRules"
                :error-messages="fieldErrors.phone"
                @input="handlePhoneInput"
                @focus="phoneFocused = true"
                @blur="phoneFocused = false"
                aria-label="Введите ваш номер телефона"
                placeholder="+7 (___) ___-__-__"
              />

              <!-- Поле пароля -->
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                label="Пароль"
                required
                prepend-inner-icon="mdi-lock-outline"
                :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="showPassword = !showPassword"
                outlined
                dense
                class="input-field"
                :rules="passwordRules"
                :error-messages="fieldErrors.password"
                @input="clearFieldError('password')"
                aria-label="Введите ваш пароль"
              />

              <!-- Кнопка входа -->
              <v-btn
                type="submit"
                color="primary"
                block
                large
                class="login-btn"
                :disabled="!valid || loading"
                :loading="loading"
                aria-label="Войти в систему"
              >
                <v-icon left>mdi-login</v-icon>
                Войти
              </v-btn>

              <!-- Дополнительные действия -->
              <div class="actions">
                <v-btn
                  text
                  small
                  class="action-btn"
                  @click="requestResetPassword"
                  :disabled="loading"
                  aria-label="Восстановить пароль"
                >
                  Забыли пароль?
                </v-btn>
                <v-btn
                  text
                  small
                  class="action-btn"
                  @click="$router.push('/register')"
                  :disabled="loading"
                  aria-label="Зарегистрироваться"
                >
                  Создать аккаунт
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useAuthStore } from '@/stores/auth';
import { requestPasswordReset } from '@/api/auth';
import { mapPhoneNumber } from '@/utils/format';

export default {
  name: 'LoginForm',
  data() {
    return {
      valid: false,
      loading: false,
      email: '',
      phone: '',
      password: '',
      showPassword: false,
      phoneFocused: false,
      
      // Обработка ошибок
      snackbar: {
        show: false,
        title: '',
        message: '',
        color: 'error',
        icon: 'mdi-alert-circle',
        timeout: 6000
      },
      fieldErrors: {
        email: [],
        phone: [],
        password: []
      },

      // Правила валидации
      emailRules: [
        v => !!v || 'Email обязателен',
        v => /.+@.+\..+/.test(v) || 'Введите корректный email'
      ],
      phoneRules: [
        v => !!v || 'Телефон обязателен',
        v => {
          const cleaned = v.replace(/\D/g, '');
          return cleaned.length >= 11 || 'Введите корректный номер';
        }
      ],
      passwordRules: [
        v => !!v || 'Пароль обязателен',
        v => v.length >= 6 || 'Минимум 6 символов',
        v => /[A-Z]/.test(v) || 'Хотя бы одна заглавная буква',
        v => /\d/.test(v) || 'Хотя бы одна цифра'
      ]
    };
  },
  computed: {
    formattedPhone() {
      return this.phoneFocused ? this.phone : mapPhoneNumber(this.phone);
    }
  },
  methods: {
    async login() {
      if (!this.$refs.form.validate()) return;
      
      this.loading = true;
      this.clearErrors();
      
      try {
        const authStore = useAuthStore();
        await authStore.login({
          email: this.email,
          phone: this.phone.replace(/\D/g, ''),
          password: this.password
        });

        this.showSuccess('Успешный вход', 'Перенаправляем на главную страницу...');
        setTimeout(() => {
          this.$router.push('/dashboard');
        }, 1500);
      } catch (error) {
        this.handleLoginError(error);
      } finally {
        this.loading = false;
      }
    },

    async requestResetPassword() {
      if (!this.email) {
        this.showError('Ошибка', 'Введите email для восстановления пароля');
        return;
      }

      this.loading = true;
      try {
        await requestPasswordReset(this.email);
        this.showSuccess(
          'Запрос отправлен', 
          'Инструкции по восстановлению пароля отправлены на ваш email'
        );
      } catch (error) {
        this.handleError(
          error,
          'Ошибка восстановления',
          'Не удалось отправить запрос на восстановление пароля'
        );
      } finally {
        this.loading = false;
      }
    },

    handlePhoneInput(value) {
      // Очищаем от всех нецифровых символов
      let cleaned = value.replace(/\D/g, '');
      
      // Если номер начинается с 7 или 8, заменяем на +7
      if (cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.substring(1);
      } else if (!cleaned.startsWith('7')) {
        cleaned = '7' + cleaned;
      }
      
      // Ограничиваем длину номера
      if (cleaned.length > 11) {
        cleaned = cleaned.substring(0, 11);
      }
      
      this.phone = cleaned;
    },

    handleLoginError(error) {
      let message = 'Неверный email или пароль';
      let fieldErrors = {};

      if (error.response) {
        switch (error.response.status) {
          case 400:
            if (error.response.data.errors) {
              fieldErrors = error.response.data.errors;
              message = 'Проверьте правильность введённых данных';
            }
            break;
          case 401:
            message = 'Неверные учетные данные';
            break;
          case 403:
            message = 'Аккаунт не активирован';
            break;
          case 429:
            message = 'Слишком много попыток. Попробуйте позже';
            break;
          case 500:
            message = 'Ошибка сервера. Попробуйте позже';
            break;
        }
      } else if (error.request) {
        message = 'Ошибка сети. Проверьте подключение';
      }

      this.fieldErrors = fieldErrors;
      this.showError('Ошибка входа', message);
    },

    handleError(error, title, defaultMessage) {
      console.error(title, error);
      
      let message = defaultMessage;
      if (error.response) {
        message = error.response.data?.message || 
                 error.response.data?.detail || 
                 defaultMessage;
      } else if (error.message) {
        message = error.message;
      }

      this.showError(title, message);
    },

    showError(title, message) {
      this.snackbar = {
        show: true,
        title,
        message,
        color: 'error',
        icon: 'mdi-alert-circle',
        timeout: 6000
      };
    },

    showSuccess(title, message) {
      this.snackbar = {
        show: true,
        title,
        message,
        color: 'success',
        icon: 'mdi-check-circle',
        timeout: 4000
      };
    },

    clearErrors() {
      this.fieldErrors = {
        email: [],
        phone: [],
        password: []
      };
    },

    clearFieldError(field) {
      if (this.fieldErrors[field]) {
        this.fieldErrors[field] = [];
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px;
}

.login-col {
  max-width: 450px;
}

.login-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.login-header {
  padding: 24px 24px 16px;
  text-align: center;
  background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
}

.logo {
  margin: 0 auto 12px;
  max-width: 120px;
}

.login-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  width: 100%;
  padding: 0;
  margin-bottom: 8px;
}

.input-field {
  margin-bottom: 16px;
}

.login-btn {
  margin-top: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  height: 48px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(25, 118, 210, 0.2);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(25, 118, 210, 0.3);
}

.login-btn:active {
  transform: translateY(0);
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.action-btn {
  font-size: 0.8rem;
  color: #1976d2;
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: #0d47a1;
  text-decoration: underline;
}

.snackbar-content {
  display: flex;
  align-items: center;
}

.snackbar-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.snackbar-message {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Адаптация для мобильных устройств */
@media (max-width: 600px) {
  .login-col {
    padding: 8px;
  }

  .login-card {
    border-radius: 8px;
  }

  .login-header {
    padding: 16px 16px 12px;
  }

  .login-title {
    font-size: 1.3rem;
  }

  .input-field {
    margin-bottom: 12px;
  }

  .login-btn {
    height: 44px;
    font-size: 0.9rem;
  }

  .actions {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
}

@media (max-width: 400px) {
  .login-title {
    font-size: 1.2rem;
  }
}
</style>
