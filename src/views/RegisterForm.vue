<template>
  <v-container class="register-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="register-col">
        <v-snackbar v-model="showError" color="error" :timeout="5000" top rounded="pill" elevation="4">
          {{ errorMessage }}
          <template v-slot:action="{ attrs }">
            <v-btn text v-bind="attrs" @click="showError = false">{{ $t('register.errors.close') }}</v-btn>
          </template>
        </v-snackbar>
        <v-snackbar v-model="showSuccess" color="success" :timeout="3000" top rounded="pill" elevation="4">
          {{ $t('register.success') }}
          <template v-slot:action="{ attrs }">
            <v-btn text v-bind="attrs" @click="showSuccess = false">{{ $t('register.errors.close') }}</v-btn>
          </template>
        </v-snackbar>
        <v-card class="register-card" elevation="10">
          <v-card-title class="register-title">
            <v-icon left color="primary">mdi-account-plus</v-icon>
            {{ $t('register.title') }}
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="register" ref="form" v-model="valid">
              <v-text-field
                v-model="name"
                :label="$t('register.name')"
                required
                prepend-inner-icon="mdi-account"
                class="input-field"
                :rules="[rules.required]"
                outlined
                dense
                :aria-label="$t('register.name')"
              />
              <v-text-field
                v-model="email"
                :label="$t('register.email')"
                type="email"
                required
                prepend-inner-icon="mdi-email"
                class="input-field"
                :rules="[rules.required, rules.email]"
                outlined
                dense
                :aria-label="$t('register.email')"
              />
              <v-text-field
                v-model="phone"
                :label="$t('register.phone')"
                prepend-inner-icon="mdi-phone"
                class="input-field"
                :rules="[rules.required, rules.phone]"
                :input-mask="phoneMask"
                @focus="phoneMask = ''"
                @blur="phoneMask = '+7(###) ###-##-##'"
                placeholder="+7(ххх) ххх-хх-хх"
                outlined
                dense
                :aria-label="$t('register.phone')"
              />
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :label="$t('register.password')"
                required
                prepend-inner-icon="mdi-lock"
                append-icon="mdi-eye"
                @click:append="showPassword = !showPassword"
                class="input-field"
                :rules="[rules.required, rules.minLength]"
                outlined
                dense
                :aria-label="$t('register.password')"
              />
              <v-select
                v-model="companyType"
                :items="companyTypes"
                :label="$t('register.companyType')"
                prepend-inner-icon="mdi-domain"
                class="input-field"
                :rules="[rules.required]"
                outlined
                dense
                :aria-label="$t('register.companyType')"
              />

              <!-- Поля для самозанятого -->
              <div v-if="companyType === 'Самозанятый'" class="company-fields">
                <v-text-field
                  v-model="selfEmployedData.inn"
                  :label="$t('register.inn')"
                  prepend-inner-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.inn]"
                  outlined
                  dense
                  :aria-label="$t('register.inn')"
                />
              </div>

              <!-- Поля для ИП -->
              <div v-if="companyType === 'ИП'" class="company-fields">
                <v-text-field
                  v-model="ipData.inn"
                  :label="$t('register.inn')"
                  prepend-inner-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.inn]"
                  outlined
                  dense
                  :aria-label="$t('register.inn')"
                />
                <v-text-field
                  v-model="ipData.ogrnip"
                  :label="$t('register.ogrnip')"
                  prepend-inner-icon="mdi-file-document"
                  class="input-field"
                  :rules="[rules.required, rules.ogrnip]"
                  outlined
                  dense
                  :aria-label="$t('register.ogrnip')"
                />
              </div>

              <!-- Поля для ООО -->
              <div v-if="companyType === 'ООО'" class="company-fields">
                <v-text-field
                  v-model="oooData.companyName"
                  :label="$t('register.companyName')"
                  prepend-inner-icon="mdi-office-building"
                  class="input-field"
                  :rules="[rules.required]"
                  outlined
                  dense
                  :aria-label="$t('register.companyName')"
                />
                <v-text-field
                  v-model="oooData.inn"
                  :label="$t('register.inn')"
                  prepend-inner-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.inn]"
                  outlined
                  dense
                  :aria-label="$t('register.inn')"
                />
                <v-text-field
                  v-model="oooData.ogrn"
                  :label="$t('register.ogrn')"
                  prepend-inner-icon="mdi-file-document"
                  class="input-field"
                  :rules="[rules.required, rules.ogrn]"
                  outlined
                  dense
                  :aria-label="$t('register.ogrn')"
                />
              </div>

              <v-btn
                type="submit"
                color="primary"
                block
                class="register-btn"
                :disabled="!valid || loading"
                :loading="loading"
                elevation="2"
                :aria-label="$t('register.registerBtn')"
              >
                <span v-if="!loading">{{ $t('register.registerBtn') }}</span>
                <v-progress-circular
                  v-if="loading"
                  :value="registerProgress"
                  size="24"
                  color="white"
                  rotate="-90"
                >
                  <span class="timer-text">{{ registerTimeLeft }}</span>
                </v-progress-circular>
              </v-btn>

              <v-btn
                color="white"
                block
                class="google-btn"
                :loading="googleLoading"
                :disabled="googleLoading"
                @click="googleLogin"
                elevation="2"
                :aria-label="$t('register.googleBtn')"
              >
                <v-icon left color="grey darken-2">mdi-google</v-icon>
                <span v-if="!googleLoading">{{ $t('register.googleBtn') }}</span>
                <v-progress-circular
                  v-if="googleLoading"
                  :value="googleProgress"
                  size="24"
                  color="grey darken-2"
                  rotate="-90"
                >
                  <span class="timer-text">{{ googleTimeLeft }}</span>
                </v-progress-circular>
              </v-btn>

              <v-btn
                text
                block
                class="reset-password-btn"
                @click="$router.push('/reset-password')"
                :aria-label="$t('register.forgotPassword')"
              >
                {{ $t('register.forgotPassword') }}
              </v-btn>
              <v-btn
                text
                block
                class="login-btn"
                @click="$router.push('/login')"
                :aria-label="$t('register.alreadyHaveAccount')"
              >
                {{ $t('register.alreadyHaveAccount') }}
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
import { getGoogleLoginUrl, googleCallback } from '@/api';

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
      googleLoading: false,
      showError: false,
      showSuccess: false,
      errorMessage: '',
      companyType: null,
      companyTypes: [
        { text: this.$t('register.companyTypes.selfEmployed'), value: 'Самозанятый' },
        { text: this.$t('register.companyTypes.ip'), value: 'ИП' },
        { text: this.$t('register.companyTypes.ooo'), value: 'ООО' },
      ],
      selfEmployedData: { inn: '' },
      ipData: { inn: '', ogrnip: '' },
      oooData: { companyName: '', inn: '', ogrn: '' },
      rules: {
        required: value => !!value || this.$t('register.errors.required'),
        email: value => {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return pattern.test(value) || this.$t('register.errors.email');
        },
        phone: value => {
          const cleaned = value.replace(/\D/g, '');
          return (cleaned.length === 11 && cleaned.startsWith('7')) || this.$t('register.errors.phone');
        },
        minLength: value => value.length >= 6 || this.$t('register.errors.minLength'),
        inn: value => /^\d{12}$/.test(value) || this.$t('register.errors.inn'),
        ogrnip: value => /^\d{15}$/.test(value) || this.$t('register.errors.ogrnip'),
        ogrn: value => /^\d{13}$/.test(value) || this.$t('register.errors.ogrn'),
      },
      registerTimeLeft: 15, // Начальное значение для регистрации (соответствует TIMEOUTS.register)
      registerProgress: 100,
      googleTimeLeft: 8,    // Начальное значение для Google (соответствует TIMEOUTS.googleAuth)
      googleProgress: 100,
      timerInterval: null,
    };
  },
  methods: {
    startTimer(type) {
      const timeout = type === 'register' ? 15000 : 8000; // Соответствует TIMEOUTS.register и TIMEOUTS.googleAuth
      const startTime = Date.now();
      clearInterval(this.timerInterval);

      this.timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeout - elapsed);
        const progress = (remaining / timeout) * 100;

        if (type === 'register') {
          this.registerTimeLeft = Math.ceil(remaining / 1000);
          this.registerProgress = progress;
        } else {
          this.googleTimeLeft = Math.ceil(remaining / 1000);
          this.googleProgress = progress;
        }

        if (remaining <= 0) {
          clearInterval(this.timerInterval);
        }
      }, 100);
    },
    stopTimer() {
      clearInterval(this.timerInterval);
      this.registerTimeLeft = 15;
      this.registerProgress = 100;
      this.googleTimeLeft = 8;
      this.googleProgress = 100;
    },
    async register() {
      if (this.$refs.form.validate()) {
        this.loading = true;
        this.startTimer('register');
        const authStore = useAuthStore();
        const payload = {
          name: this.name,
          email: this.email,
          phone: this.phone,
          password: this.password,
          company_type: this.companyType,
        };

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
          this.handleError(error, 'register');
        } finally {
          this.loading = false;
          this.stopTimer();
        }
      }
    },
    async googleLogin() {
      this.googleLoading = true;
      this.startTimer('google');
      try {
        const { url } = await getGoogleLoginUrl();
        window.location.href = url;
      } catch (error) {
        this.handleError(error, 'google');
      } finally {
        this.googleLoading = false;
        this.stopTimer();
      }
    },
    async handleGoogleCallback() {
      const query = this.$route.query;
      if (query.code && query.state) {
        const authStore = useAuthStore();
        try {
          await authStore.googleLogin(query.code, query.state);
          this.showSuccess = true;
          setTimeout(() => {
            this.$router.push('/dashboard');
          }, 1500);
        } catch (error) {
          this.handleError(error, 'googleCallback');
        }
      }
    },
    handleError(error, context) {
      console.error(`${context} error:`, error);
      this.showError = true;
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          this.errorMessage = this.$t('register.errors.badRequest');
        } else if (status === 401) {
          this.errorMessage = this.$t('register.errors.unauthorized');
        } else if (status === 409) {
          this.errorMessage = this.$t('register.errors.conflict');
        } else {
          this.errorMessage = this.$t('register.errors.serverError', { status });
        }
      } else if (error.message.includes('Network Error') || error.name === 'AbortError') {
        this.errorMessage = this.$t('register.errors.networkError');
      } else {
        this.errorMessage = this.$t('register.errors.unknownError');
      }
    },
  },
  mounted() {
    this.handleGoogleCallback();
  },
};
</script>

<style scoped>
.register-container {
  height: 100vh;
  background: linear-gradient(120deg, #e0e7ff 0%, #dbeafe 100%);
  padding: 32px;
  display: flex;
  align-items: center;
}

.register-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-card {
  width: 100%;
  max-width: 480px;
  padding: 32px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.register-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
}

.register-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e88e5;
  text-align: center;
  margin-bottom: 24px;
  letter-spacing: 0.5px;
}

.input-field {
  margin-bottom: 20px;
  border-radius: 8px;
}

.company-fields {
  padding: 20px;
  background: #f7fafc;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.register-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 8px;
  background: linear-gradient(90deg, #1e88e5 0%, #42a5f5 100%);
  transition: background 0.3s ease, transform 0.2s ease;
  margin-bottom: 16px;
}

.register-btn:hover {
  background: linear-gradient(90deg, #1565c0 0%, #1976d2 100%);
  transform: scale(1.02);
}

.google-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  background: #ffffff;
  color: #424242;
  transition: background 0.3s ease, transform 0.2s ease, border-color 0.3s ease;
  margin-bottom: 16px;
}

.google-btn:hover {
  background: #f5f5f5;
  border-color: #bdbdbd;
  transform: scale(1.02);
}

.reset-password-btn,
.login-btn {
  margin-top: 12px;
  font-size: 14px;
  text-transform: none;
  color: #1e88e5;
  transition: color 0.3s ease;
}

.reset-password-btn:hover,
.login-btn:hover {
  color: #1565c0;
}

.timer-text {
  font-size: 12px;
  color: inherit;
}
</style>