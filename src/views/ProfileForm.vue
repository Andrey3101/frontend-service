<template>
  <v-container class="profile-container">
    <v-row>
      <v-col>
        <!-- Уведомления -->
        <v-snackbar
          v-model="snackbar.show"
          :timeout="snackbar.timeout"
          :color="snackbar.color"
          top
          right
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

        <h1 class="page-title">Профиль</h1>

        <v-btn 
          color="error" 
          outlined 
          class="logout-btn" 
          @click="confirmLogout"
          :loading="logoutLoading"
        >
          <v-icon left>mdi-logout</v-icon> Выйти
        </v-btn>

        <v-card class="profile-card" elevation="4">
          <v-form ref="form" v-model="valid" @submit.prevent="confirmSave">
            <v-row>
              <!-- Аватар и основная информация -->
              <v-col cols="12" md="4" class="avatar-col">
                <div class="avatar-wrapper">
                  <v-avatar size="150" class="profile-avatar">
                    <v-img
                      :src="profile.avatar || require('@/assets/default-avatar.png')"
                      alt="Аватар профиля"
                    ></v-img>
                  </v-avatar>
                  <v-btn
                    v-if="isEditing"
                    color="primary"
                    small
                    fab
                    absolute
                    bottom
                    right
                    class="avatar-edit-btn"
                    @click="uploadAvatar"
                  >
                    <v-icon>mdi-camera</v-icon>
                  </v-btn>
                </div>
                <input type="file" ref="avatarInput" accept="image/*" style="display: none" @change="handleAvatarChange">
                
                <div class="user-meta">
                  <h3 class="user-name">{{ profile.name || 'Без имени' }}</h3>
                  <v-chip small class="role-chip">{{ formatRole(profile.role) }}</v-chip>
                  <v-chip small color="grey lighten-2" class="mt-2">ID: {{ profile.user_id }}</v-chip>
                </div>
              </v-col>

              <!-- Форма редактирования -->
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="profile.email"
                  label="Email"
                  outlined
                  dense
                  persistent-hint
                  :disabled="!isEditing"
                  :rules="emailRules"
                  :error-messages="fieldErrors.email"
                  @input="clearFieldError('email')"
                  class="input-field"
                />

                <v-text-field
                  v-model="profile.name"
                  label="Имя"
                  outlined
                  dense
                  :disabled="!isEditing"
                  :rules="nameRules"
                  :error-messages="fieldErrors.name"
                  @input="clearFieldError('name')"
                  class="input-field"
                />

                <v-text-field
                  v-model="profile.company_name"
                  label="Название компании"
                  outlined
                  dense
                  :disabled="!isEditing || !isCompanyAdmin"
                  :error-messages="fieldErrors.company_name"
                  @input="clearFieldError('company_name')"
                  class="input-field"
                />

                <v-text-field
                  v-model="profile.inn"
                  label="ИНН компании"
                  outlined
                  dense
                  :disabled="!isEditing || !isCompanyAdmin"
                  :rules="innRules"
                  :error-messages="fieldErrors.inn"
                  @input="clearFieldError('inn')"
                  class="input-field"
                  hint="10 или 12 цифр"
                  persistent-hint
                />

                <v-text-field
                  v-model="profile.phone"
                  label="Телефон"
                  outlined
                  dense
                  :disabled="!isEditing"
                  :rules="phoneRules"
                  :error-messages="fieldErrors.phone"
                  @input="clearFieldError('phone')"
                  class="input-field"
                />

                <v-menu
                  v-if="isEditing"
                  ref="dobMenu"
                  v-model="dobMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="profile.date_of_birth"
                      label="Дата рождения"
                      prepend-icon="mdi-calendar"
                      readonly
                      outlined
                      dense
                      v-bind="attrs"
                      v-on="on"
                      class="input-field"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="profile.date_of_birth"
                    no-title
                    scrollable
                    :max="new Date().toISOString().substr(0, 10)"
                    @input="dobMenu = false"
                  ></v-date-picker>
                </v-menu>

                <div class="button-group">
                  <v-btn
                    v-if="!isEditing"
                    color="primary"
                    outlined
                    class="action-btn"
                    @click="startEditing"
                    :disabled="!profile.editable"
                  >
                    <v-icon left>mdi-pencil</v-icon> Редактировать
                  </v-btn>

                  <template v-else>
                    <v-btn
                      type="submit"
                      color="primary"
                      class="action-btn"
                      :loading="loading"
                      :disabled="!valid"
                    >
                      <v-icon left>mdi-content-save</v-icon> Сохранить
                    </v-btn>
                    <v-btn
                      color="error"
                      outlined
                      class="action-btn"
                      @click="cancelEditing"
                      :disabled="loading"
                    >
                      <v-icon left>mdi-close</v-icon> Отмена
                    </v-btn>
                  </template>

                  <v-btn
                    v-if="isCompanyAdmin"
                    color="error"
                    outlined
                    class="action-btn"
                    @click="showDeleteDialog = true"
                    :loading="deleteLoading"
                  >
                    <v-icon left>mdi-delete</v-icon> Удалить компанию
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card>

        <!-- Диалог подтверждения сохранения -->
        <v-dialog v-model="showConfirmDialog" max-width="450" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              Подтверждение изменений
            </v-card-title>
            <v-card-text class="dialog-text">
              Вы уверены, что хотите сохранить изменения в профиле?
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer/>
              <v-btn text color="grey" @click="showConfirmDialog = false">
                Отменить
              </v-btn>
              <v-btn color="primary" @click="saveProfile" :loading="loading">
                Подтвердить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог подтверждения выхода -->
        <v-dialog v-model="showLogoutDialog" max-width="450" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              Подтверждение выхода
            </v-card-title>
            <v-card-text class="dialog-text">
              Вы уверены, что хотите выйти из профиля?
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer/>
              <v-btn text color="grey" @click="showLogoutDialog = false">
                Отменить
              </v-btn>
              <v-btn color="error" @click="logout" :loading="logoutLoading">
                Выйти
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог удаления компании -->
        <v-dialog v-model="showDeleteDialog" max-width="450" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              Удаление компании
            </v-card-title>
            <v-card-text class="dialog-text">
              <v-alert
                type="error"
                outlined
                prominent
                class="mb-4"
              >
                Внимание! Это действие удалит компанию и всех её пользователей. Отменить это действие будет невозможно.
              </v-alert>
              <v-text-field
                v-model="deleteConfirmation"
                label="Введите название компании для подтверждения"
                outlined
                dense
              />
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer/>
              <v-btn text color="grey" @click="showDeleteDialog = false">
                Отменить
              </v-btn>
              <v-btn
                color="error"
                @click="deleteCompany"
                :loading="deleteLoading"
                :disabled="deleteConfirmation !== profile.company_name"
              >
                Удалить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';
import { getProfile, updateProfile, deleteCompany, logout } from '@/api/profile';
import { uploadFile } from '@/api/upload';

export default {
  name: 'ProfileForm',
  data() {
    return {
      valid: false,
      loading: false,
      logoutLoading: false,
      deleteLoading: false,
      isEditing: false,
      dobMenu: false,
      originalProfile: {},
      profile: {
        user_id: '',
        name: '',
        email: '',
        role: '',
        company_name: '',
        inn: '',
        phone: '',
        date_of_birth: '',
        avatar: '',
        editable: false
      },
      showAlert: false,
      showConfirmDialog: false,
      showLogoutDialog: false,
      showDeleteDialog: false,
      deleteConfirmation: '',
      fieldErrors: {},
      // Rules
      emailRules: [
        v => !!v || 'Email обязателен',
        v => /.+@.+\..+/.test(v) || 'Неверный формат email'
      ],
      nameRules: [
        v => !!v || 'Имя обязательно',
        v => v.length >= 2 || 'Минимум 2 символа'
      ],
      innRules: [
        v => !v || /^\d{10}$|^\d{12}$/.test(v) || 'ИНН должен содержать 10 или 12 цифр'
      ],
      phoneRules: [
        v => !v || /^\+?[0-9\s\-()]{11,17}$/.test(v) || 'Неверный формат телефона'
      ],
      // Snackbar
      snackbar: {
        show: false,
        title: '',
        message: '',
        color: 'info',
        icon: '',
        timeout: 5000
      }
    };
  },
  computed: {
    ...mapGetters(['currentUser']),
    isCompanyAdmin() {
      return this.profile.role === 'admin';
    }
  },
  async created() {
    await this.loadProfile();
  },
  methods: {
    async loadProfile() {
      try {
        const response = await getProfile();
        this.profile = { ...response };
        this.originalProfile = { ...response };
      } catch (error) {
        this.showError('Ошибка загрузки', 'Не удалось загрузить профиль', error);
      }
    },
    
    startEditing() {
      this.isEditing = true;
    },
    
    cancelEditing() {
      this.profile = { ...this.originalProfile };
      this.isEditing = false;
      this.fieldErrors = {};
      this.$refs.form.resetValidation();
    },
    
    confirmSave() {
      if (this.$refs.form.validate()) {
        this.showConfirmDialog = true;
      }
    },
    
    async saveProfile() {
      this.loading = true;
      try {
        await updateProfile(this.profile);
        this.originalProfile = { ...this.profile };
        this.isEditing = false;
        this.showSuccess('Успешно', 'Профиль обновлён');
        await this.loadProfile(); // Обновляем данные
      } catch (error) {
        this.handleProfileError(error);
      } finally {
        this.loading = false;
        this.showConfirmDialog = false;
      }
    },
    
    confirmLogout() {
      this.showLogoutDialog = true;
    },
    
    async logout() {
      this.logoutLoading = true;
      try {
        await logout();
        this.$router.push('/login');
      } catch (error) {
        this.showError('Ошибка', 'Не удалось выйти из профиля', error);
      } finally {
        this.logoutLoading = false;
        this.showLogoutDialog = false;
      }
    },
    
    uploadAvatar() {
      this.$refs.avatarInput.click();
    },
    
    async handleAvatarChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      if (file.size > 2 * 1024 * 1024) {
        this.showError('Ошибка', 'Размер файла не должен превышать 2MB');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.showError('Ошибка', 'Допустимы только JPG и PNG изображения');
        return;
      }
      
      try {
        this.loading = true;
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await uploadFile(formData);
        this.profile.avatar = response.url;
        this.showSuccess('Успешно', 'Аватар обновлён');
      } catch (error) {
        this.showError('Ошибка', 'Не удалось загрузить аватар', error);
      } finally {
        this.loading = false;
      }
    },
    
    async deleteCompany() {
      if (this.deleteConfirmation !== this.profile.company_name) return;
      
      this.deleteLoading = true;
      try {
        await deleteCompany(this.profile.company_id);
        this.showSuccess('Успешно', 'Компания удалена');
        this.$router.push('/login');
      } catch (error) {
        this.showError('Ошибка', 'Не удалось удалить компанию', error);
      } finally {
        this.deleteLoading = false;
        this.showDeleteDialog = false;
        this.deleteConfirmation = '';
      }
    },
    
    formatRole(role) {
      const roles = {
        'admin': 'Администратор',
        'manager': 'Менеджер',
        'user': 'Пользователь'
      };
      return roles[role] || role;
    },
    
    handleProfileError(error) {
      if (error.response && error.response.status === 422) {
        // Обработка ошибок валидации
        this.fieldErrors = error.response.data.errors || {};
        this.showError('Ошибка валидации', 'Проверьте правильность введённых данных');
      } else {
        this.showError('Ошибка', 'Не удалось сохранить профиль', error);
      }
    },
    
    clearFieldError(field) {
      if (this.fieldErrors[field]) {
        delete this.fieldErrors[field];
      }
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
    
    showError(title, message, error = null) {
      console.error(title, error);
      
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      
      this.snackbar = {
        show: true,
        title,
        message,
        color: 'error',
        icon: 'mdi-alert-circle',
        timeout: 6000
      };
    }
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  padding: 24px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1976d2;
  text-align: center;
}

.logout-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  font-weight: 500;
}

.profile-card {
  border-radius: 12px;
  padding: 24px;
}

.avatar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.profile-avatar {
  border: 3px solid #1976d2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-edit-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
}

.user-meta {
  text-align: center;
  margin-bottom: 20px;
}

.user-name {
  font-size: 1.4rem;
  margin-bottom: 8px;
}

.role-chip {
  margin-bottom: 8px;
  font-weight: 500;
}

.input-field {
  margin-bottom: 16px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.action-btn {
  flex: 1;
  min-width: 150px;
}

.dialog-card {
  border-radius: 12px;
}

.dialog-title {
  font-weight: 600;
  color: #1976d2;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.dialog-text {
  padding: 16px;
  font-size: 1rem;
}

.dialog-actions {
  padding: 16px;
  border-top: 1px solid #eee;
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
}

@media (max-width: 960px) {
  .profile-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 1.6rem;
  }
  
  .profile-card {
    padding: 16px;
  }
  
  .logout-btn {
    position: relative;
    top: auto;
    right: auto;
    margin-bottom: 16px;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.4rem;
  }
}
</style>
