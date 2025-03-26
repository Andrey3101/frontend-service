<template>
  <v-container class="profile-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Профиль</h1>

        <v-btn color="primary" outlined class="logout-btn" @click="logout">
          <v-icon left>mdi-logout</v-icon> Выйти
        </v-btn>

        <v-form ref="form" v-model="valid" class="profile-form">
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
            v-model="profile.company_name"
            label="Название компании"
            outlined
            dense
            :disabled="!isEditing || profile.role !== 'admin'"
            class="input-field"
          />
          <v-text-field
            v-model="profile.inn"
            label="ИНН"
            outlined
            dense
            :disabled="!isEditing || profile.role !== 'admin'"
            :rules="[v => !v || /^\d{10}$|^\d{12}$/.test(v) || 'ИНН должен содержать 10 или 12 цифр']"
            class="input-field"
          />
          <div class="button-group">
            <v-btn v-if="!isEditing" color="blue" outlined class="action-btn" @click="isEditing = true" :disabled="!profile.editable">
              <v-icon left>mdi-pencil</v-icon> Редактировать
            </v-btn>
            <template v-else>
              <v-btn color="primary" class="action-btn" @click="confirmSave" :disabled="!valid" :loading="loading">
                Сохранить
              </v-btn>
              <v-btn color="grey" text class="action-btn" @click="cancelEdit">
                Отмена
              </v-btn>
            </template>
            <v-btn v-if="profile.role === 'admin'" color="red" outlined class="delete-btn" @click="showDeleteDialog = true">
              <v-icon left>mdi-delete</v-icon> Удалить компанию
            </v-btn>
          </div>
        </v-form>

        <v-snackbar v-model="snackbar" :timeout="5000" :color="snackbarColor" top>
          {{ snackbarMessage }}
          <template v-slot:action="{ attrs }">
            <v-btn color="white" text v-bind="attrs" @click="snackbar = false">Закрыть</v-btn>
          </template>
        </v-snackbar>

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

        <v-dialog v-model="showDeleteDialog" max-width="400" class="custom-dialog">
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Удаление компании</v-card-title>
            <v-card-text class="dialog-text">Вы уверены, что хотите удалить компанию? Это действие нельзя отменить.</v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showDeleteDialog = false" class="dialog-btn">Отмена</v-btn>
              <v-btn color="red" @click="handleDeleteCompany" class="dialog-btn delete-btn">Удалить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getProfile, updateProfile, deleteCompany, logoutUser } from '../api';

export default {
  data() {
    return {
      profile: {},
      originalProfile: {},
      valid: true,
      loading: false,
      isEditing: false,
      showConfirmDialog: false,
      showDeleteDialog: false,
      snackbar: false,
      snackbarMessage: '',
      snackbarColor: 'red',
    };
  },
  async created() {
    try {
      this.profile = await getProfile();
      this.originalProfile = { ...this.profile };
      this.isEditing = this.profile.editable || false;
    } catch (error) {
      this.showSnackbar('Ошибка загрузки профиля: ' + (error.response?.data?.detail || error.message), 'red');
    }
  },
  methods: {
    confirmSave() {
      if (!this.$refs.form.validate()) return;
      this.showConfirmDialog = true;
    },
    async handleUpdate() {
      this.loading = true;
      try {
        const csrfToken = localStorage.getItem('csrf_token');
        await updateProfile(this.profile, csrfToken);
        this.showSnackbar('Профиль успешно обновлён', 'green');
        this.isEditing = false;
        this.originalProfile = { ...this.profile };
      } catch (error) {
        this.showSnackbar('Ошибка обновления профиля: ' + (error.response?.data?.detail || error.message), 'red');
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
    async handleDeleteCompany() {
      try {
        const csrfToken = localStorage.getItem('csrf_token');
        await deleteCompany(this.profile.company_id, csrfToken);
        this.showSnackbar('Компания успешно удалена', 'green');
        setTimeout(() => this.$router.push('/login'), 2000);
      } catch (error) {
        this.showSnackbar('Ошибка удаления компании: ' + (error.response?.data?.detail || error.message), 'red');
      } finally {
        this.showDeleteDialog = false;
      }
    },
    async logout() {
      try {
        await logoutUser();
        this.showSnackbar('Вы успешно вышли из профиля', 'green');
        setTimeout(() => this.$router.push('/login'), 2000);
      } catch (error) {
        this.showSnackbar('Ошибка выхода из профиля: ' + (error.response?.data?.detail || error.message), 'red');
      }
    },
    showSnackbar(message, color) {
      this.snackbarMessage = message;
      this.snackbarColor = color;
      this.snackbar = true;
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

.logout-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  color: white !important;
  background-color: #e53935 !important;
  border: none;
  font-family: 'Gilroy-Bold', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 10px 20px;
  transition: transform 0.2s ease;
}

.logout-btn:hover {
  background-color: #c62828 !important;
  transform: translateY(-2px);
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

.delete-btn {
  color: white !important;
  background-color: #e53935 !important;
  border: none;
}

.delete-btn:hover {
  background-color: #c62828 !important;
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

.payroll-card {
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  margin: 0 auto;
}

.period-select {
  max-width: 200px;
  display: inline-block;
  margin-right: 10px;
}

.calculate-btn {
  vertical-align: top;
}

.payroll-table {
  width: 100%;
}

.no-data {
  text-align: center;
  color: #757575;
  margin-top: 20px;
}

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
  font-size: 1rem;
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
  .profile-form, .payroll-card {
    padding: 16px;
  }
  .input-field {
    margin-bottom: 12px;
  }
  .button-group {
    flex-direction: column;
    gap: 8px;
  }
  .action-btn, .delete-btn {
    width: 100%;
  }
  .period-select {
    max-width: 100%;
    margin-bottom: 10px;
  }
  .calculate-btn {
    width: 100%;
  }
}
</style>