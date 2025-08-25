<template>
  <v-container class="register-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="register-col">
        <!-- Error Snackbar -->
        <v-snackbar 
          v-model="showError" 
          color="error" 
          :timeout="errorTimeout" 
          top 
          rounded="pill" 
          elevation="4"
          multi-line
        >
          <v-icon left>mdi-alert-circle</v-icon>
          {{ errorMessage }}
          <template v-slot:action="{ attrs }">
            <v-btn text v-bind="attrs" @click="showError = false">
              {{ $t('register.errors.close') }}
            </v-btn>
          </template>
        </v-snackbar>

        <!-- Success Snackbar -->
        <v-snackbar 
          v-model="showSuccess" 
          color="success" 
          :timeout="3000" 
          top 
          rounded="pill" 
          elevation="4"
        >
          <v-icon left>mdi-check-circle</v-icon>
          {{ $t('register.success') }}
          <template v-slot:action="{ attrs }">
            <v-btn text v-bind="attrs" @click="showSuccess = false">
              {{ $t('register.errors.close') }}
            </v-btn>
          </template>
        </v-snackbar>

        <v-card class="register-card" elevation="10">
          <v-card-title class="register-title">
            <v-icon left color="primary">mdi-account-plus</v-icon>
            {{ $t('register.title') }}
          </v-card-title>
          
          <v-card-text>
            <!-- Registration Form -->
            <v-form @submit.prevent="register" ref="form" v-model="valid" lazy-validation>
              <!-- Email Field -->
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
                :error-messages="fieldErrors.email"
                @input="clearFieldError('email')"
              />

              <!-- Phone Field -->
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
                :error-messages="fieldErrors.phone"
                @input="clearFieldError('phone')"
              />

              <!-- Password Field -->
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
                :error-messages="fieldErrors.password"
                @input="clearFieldError('password')"
              />

              <!-- Company Type Select -->
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
                :error-messages="fieldErrors.companyType"
                @change="clearFieldError('companyType')"
              />

              <!-- Fields for Self-Employed -->
              <div v-if="companyType === 'Самозанятый'" class="company-fields">
                <v-text-field
                  v-model="selfEmployedData.inn"
                  :label="$t('register.inn')"
                  prepend-inner-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.innSelfEmployed]"
                  outlined
                  dense
                  :aria-label="$t('register.inn')"
                  :error-messages="fieldErrors['selfEmployedData.inn']"
                  @input="clearFieldError('selfEmployedData.inn')"
                />
              </div>

              <!-- Fields for IP -->
              <div v-if="companyType === 'ИП'" class="company-fields">
                <v-text-field
                  v-model="ipData.inn"
                  :label="$t('register.inn')"
                  prepend-inner-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.innSelfEmployed]"
                  outlined
                  dense
                  :aria-label="$t('register.inn')"
                  :error-messages="fieldErrors['ipData.inn']"
                  @input="clearFieldError('ipData.inn')"
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
                  :error-messages="fieldErrors['ipData.ogrnip']"
                  @input="clearFieldError('ipData.ogrnip')"
                />
              </div>

              <!-- Fields for OOO -->
              <div v-if="companyType === 'ООО'" class="company-fields">
                <v-text-field
                  v-model="oooData.companyName"
                  :label="$t('register.companyName')"
                  prepend-inner-icon="mdi-office-building"
                  class="input-field"
                  :rules="[rules.required, rules.companyName]"
                  outlined
                  dense
                  :aria-label="$t('register.companyName')"
                  :error-messages="fieldErrors['oooData.companyName']"
                  @input="clearFieldError('oooData.companyName')"
                />
                <v-text-field
                  v-model="oooData.inn"
                  :label="$t('register.inn')"
                  prepend-inner-icon="mdi-card-account-details"
                  class="input-field"
                  :rules="[rules.required, rules.innOOO]"
                  outlined
                  dense
                  :aria-label="$t('register.inn')"
                  :error-messages="fieldErrors['oooData.inn']"
                  @input="clearFieldError('oooData.inn')"
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
                  :error-messages="fieldErrors['oooData.ogrn']"
                  @input="clearFieldError('oooData.ogrn')"
                />
              </div>

              <!-- Submit Button -->
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
                <v-progress-circular v-if="loading" indeterminate size="24" color="white" />
              </v-btn>

              <!-- Additional Actions -->
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

export default {
  name: 'RegisterForm',
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
      errorMessage: '',
      errorTimeout: 10000, // 10 seconds for error messages
      fieldErrors: {}, // Object to store field-specific errors
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
        email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || this.$t('register.errors.email'),
        phone: value => /^\+7\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(value) || this.$t('register.errors.phone'),
        minLength: value => value.length >= 6 || this.$t('register.errors.minLength'),
        innSelfEmployed: value => /^\d{12}$/.test(value) || this.$t('register.errors.inn'),
        innOOO: value => /^\d{10}$/.test(value) || this.$t('register.errors.inn'),
        ogrnip: value => /^\d{15}$/.test(value) || this.$t('register.errors.ogrnip'),
        ogrn: value => /^\d{13}$/.test(value) || this.$t('register.errors.ogrn'),
        companyName: value => (value && value.length <= 100) || this.$t('register.errors.companyNameLength'),
      },
    };
  },
  methods: {
    async register() {
      if (!this.$refs.form.validate()) {
        this.showError = true;
        this.errorMessage = this.$t('register.errors.formValidation');
        return;
      }

      this.loading = true;
      this.clearAllErrors();
      const authStore = useAuthStore();
      
      const payload = {
        email: this.email,
        phone: this.phone,
        password: this.password,
        company_type: this.companyType,
        company_data: this.companyType === 'Самозанятый' ? this.selfEmployedData :
                      this.companyType === 'ИП' ? this.ipData :
                      this.oooData,
      };

      try {
        const response = await authStore.register(payload);
        localStorage.setItem('csrf_token', response.csrf_token);
        this.showSuccess = true;
        setTimeout(() => this.$router.push('/dashboard'), 1500);
      } catch (error) {
        this.handleError(error, 'register');
      } finally {
        this.loading = false;
      }
    },

    handleError(error, context) {
      console.error(`${context} error:`, error);
      
      // Default error message
      let message = this.$t('register.errors.unknownError');
      let fieldErrors = {};

      if (error.response) {
        // Handle 400 Bad Request with field errors
        if (error.response.status === 400 && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            message = error.response.data.detail;
          } else if (Array.isArray(error.response.data.detail)) {
            // Process field errors from API
            error.response.data.detail.forEach(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : null;
              if (field) {
                fieldErrors[field] = err.msg;
              }
            });
            message = this.$t('register.errors.validationError');
          }
        } 
        // Handle 409 Conflict (duplicate email, etc.)
        else if (error.response.status === 409) {
          message = error.response.data.detail || this.$t('register.errors.conflict');
        }
        // Handle 422 Unprocessable Entity
        else if (error.response.status === 422) {
          message = this.$t('register.errors.validationError');
          if (error.response.data.detail) {
            error.response.data.detail.forEach(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : null;
              if (field) {
                fieldErrors[field] = err.msg;
              }
            });
          }
        }
        // Handle 500 Server Error
        else if (error.response.status >= 500) {
          message = this.$t('register.errors.serverError');
        }
      } else if (error.request) {
        message = this.$t('register.errors.networkError');
      }

      // Set the error state
      this.errorMessage = message;
      this.showError = true;
      
      // Set field-specific errors if any
      if (Object.keys(fieldErrors).length > 0) {
        this.fieldErrors = { ...this.fieldErrors, ...fieldErrors };
      }
    },

    clearFieldError(field) {
      if (this.fieldErrors[field]) {
        this.$set(this.fieldErrors, field, null);
      }
    },

    clearAllErrors() {
      this.fieldErrors = {};
      this.showError = false;
    },
  },
  mounted() {
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

/* Error message styling */
.v-messages.error--text {
  font-size: 12px;
  margin-top: 4px;
}

/* Snackbar custom styling */
.v-snackbar >>> .v-snack__content {
  display: flex;
  align-items: center;
}
</style>
