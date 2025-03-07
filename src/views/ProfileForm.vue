<template>
  <v-container class="profile-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Профиль</h1>

        <v-avatar size="100" class="profile-avatar" v-if="profile.avatar">
          <img :src="profile.avatar" alt="Аватар" />
        </v-avatar>

        <v-form ref="form" v-model="valid" class="profile-form">
          <v-text-field
            v-model="profile.name"
            label="Имя"
            outlined
            dense
            :disabled="!isEditing"
            class="input-field"
          />
          <v-text-field
            v-model="profile.email"
            label="Email"
            outlined
            dense
            :disabled="!isEditing"
            :rules="[v => !!v || 'Email обязателен', v => /.+@.+\..+/.test(v) || 'Неверный формат email']"
            class="input-field"
          />
          <v-text-field
            v-if="profile.role !== 'user'"
            v-model="profile.company_name"
            label="Название компании"
            outlined
            dense
            :disabled="!isEditing"
            class="input-field"
          />
          <v-text-field
            v-if="profile.role !== 'user'"
            v-model="profile.inn"
            label="ИНН"
            outlined
            dense
            :disabled="!isEditing"
            :rules="[v => !v || /^\d{10}$|^\d{12}$/.test(v) || 'ИНН должен содержать 10 или 12 цифр']"
            class="input-field"
          />
          <div class="button-group">
            <v-btn
              v-if="!isEditing"
              color="blue"
              outlined
              class="action-btn"
              @click="isEditing = true"
            >
              <v-icon left>mdi-pencil</v-icon> Редактировать
            </v-btn>
            <template v-else>
              <v-btn
                color="primary"
                class="action-btn"
                @click="confirmSave"
                :disabled="!valid"
                :loading="loading"
              >
                Сохранить
              </v-btn>
              <v-btn
                color="grey"
                text
                class="action-btn"
                @click="cancelEdit"
              >
                Отмена
              </v-btn>
            </template>
          </div>
          <p v-if="profile.tasks_endpoint" class="tasks-link">
            Просмотр задач:
            <router-link :to="profile.tasks_endpoint" class="link">
              {{ profile.tasks_endpoint }}
            </router-link>
          </p>
        </v-form>

        <!-- Диалог подтверждения -->
        <v-dialog v-model="showConfirmDialog" max-width="400" class="custom-dialog">
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Подтверждение</v-card-title>
            <v-card-text class="dialog-text">Вы уверены, что хотите сохранить изменения в профиле?</v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showConfirmDialog = false" class="dialog-btn">Отмена</v-btn>
              <v-btn color="primary" @click="handleUpdate" class="dialog-btn primary-btn">Сохранить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar" :timeout="5000" :color="snackbarColor" top>
          {{ snackbarMessage }}
          <template v-slot:action="{ attrs }">
            <v-btn color="white" text v-bind="attrs" @click="snackbar = false">
              Закрыть
            </v-btn>
          </template>
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getProfile, updateProfile } from '../api';

export default {
  data() {
    return {
      profile: {},
      originalProfile: {},
      valid: true,
      loading: false,
      isEditing: false,
      showConfirmDialog: false,
      snackbar: false,
      snackbarMessage: '',
      snackbarColor: 'red',
    };
  },
  async created() {
    this.profile = await getProfile();
    this.originalProfile = { ...this.profile };
    this.isEditing = this.profile.editable || false;
  },
  methods: {
    confirmSave() {
      if (!this.$refs.form.validate()) return;
      this.showConfirmDialog = true;
    },
    async handleUpdate() {
      this.loading = true;
      try {
        await updateProfile(this.profile);
        this.snackbarMessage = 'Профиль успешно обновлён';
        this.snackbarColor = 'green';
        this.snackbar = true;
        this.isEditing = false;
        this.originalProfile = { ...this.profile };
      } catch (error) {
        this.snackbarMessage = 'Ошибка обновления профиля: ' + error.message;
        this.snackbarColor = 'red';
        this.snackbar = true;
      } finally {
        this.loading = false;
        this.showConfirmDialog = false;
      }
    },
    cancelEdit() {
      this.profile = { ...this.originalProfile };
      this.isEditing = false;
      this.$refs.form.resetValidation();
    },
  },
};
</script>

<style scoped>
.profile-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 2.25rem;
  color: #1976d2;
  margin-bottom: 24px;
  text-align: center;
}

.profile-avatar {
  display: block;
  margin: 0 auto 20px;
  border: 2px solid #1976d2;
}

.profile-form {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  margin: 0 auto;
}

.input-field {
  font-family: 'Gilroy-Regular', sans-serif;
  margin-bottom: 16px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.action-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 10px 20px;
  transition: transform 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.tasks-link {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1rem;
  color: #2c3e50;
  margin-top: 20px;
  text-align: center;
}

.link {
  color: #1976d2;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* Стили для диалога */
.dialog-card {
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.dialog-title {
  font-family: 'Gilroy-Bold', sans-serif;
  font-size: 1.5rem;
  color: #1976d2;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-text {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1.1rem;
  color: #2c3e50;
  padding: 20px 24px;
}

.dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.dialog-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
  transition: transform 0.2s ease;
}

.dialog-btn:hover {
  transform: translateY(-2px);
}

.primary-btn {
  background-color: #1976d2;
  color: white !important;
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.75rem;
  }
  .profile-form {
    padding: 16px;
  }
  .input-field {
    margin-bottom: 12px;
  }
  .button-group {
    flex-direction: column;
    gap: 8px;
  }
  .action-btn {
    width: 100%;
  }
  .dialog-title {
    font-size: 1.25rem;
  }
  .dialog-text {
    font-size: 1rem;
  }
}
</style>