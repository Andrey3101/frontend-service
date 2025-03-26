<template>
  <v-container class="users-container">
    <v-row>
      <v-col>
        <h1>Пользователи компании {{ profile?.company_name || 'Загрузка...' }}</h1>
        <v-btn color="primary" @click="showCreateForm = true" class="create-btn" :disabled="!isAdmin">
          Создать пользователя
        </v-btn>
        <v-dialog v-model="showCreateForm" max-width="500px" persistent>
          <v-card class="create-user-card">
            <v-card-title class="create-user-title">Создание пользователя</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="newUser.email"
                label="Email"
                outlined
                dense
                :rules="emailRules"
                class="create-user-field"
              />
              <v-text-field
                v-model="newUser.password"
                label="Пароль"
                type="password"
                dense
                outlined
                :rules="passwordRules"
                class="create-user-field"
              />
              <v-select
                v-model="newUser.role"
                :items="allowedRoles"
                label="Роль"
                outlined
                dense
                :rules="[v => !!v || 'Выберите роль']"
                class="create-user-field"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showCreateForm = false">Отмена</v-btn>
              <v-btn color="primary" @click="createUserInCompanyHandler" :disabled="!isCreateFormValid">Создать</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="showEditForm" max-width="500px" persistent>
          <v-card class="create-user-card">
            <v-card-title class="create-user-title">Редактирование пользователя</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="editUser.email"
                label="Email"
                outlined
                dense
                :rules="emailRules"
                class="create-user-field"
              />
              <v-select
                v-model="editUser.role"
                :items="allowedRoles"
                label="Роль"
                outlined
                dense
                :rules="[v => !!v || 'Выберите роль']"
                class="create-user-field"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showEditForm = false">Отмена</v-btn>
              <v-btn color="primary" @click="updateUser" :disabled="!isEditFormValid">Сохранить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-list class="users-list">
          <v-list-item v-for="user in filteredUsers" :key="user.user_id" v-animate-onscroll="'fadeInUp'">
            <v-list-item-content>
              <v-list-item-title>ID: {{ user.user_id }}</v-list-item-title>
              <v-list-item-subtitle v-if="isMobile">
                {{ user.role }} | {{ user.email }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else>
                Роль: {{ user.role }} | Email: {{ user.email }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn icon class="edit" @click="editUser(user)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon class="delete" @click="confirmDelete(user.user_id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
        <v-dialog v-model="showDeleteConfirm" max-width="400px">
          <v-card>
            <v-card-title class="delete-confirm-title">Подтверждение удаления</v-card-title>
            <v-card-text>Вы уверены, что хотите удалить пользователя?</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showDeleteConfirm = false">Отмена</v-btn>
              <v-btn color="red" @click="deleteUser">Удалить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="showError" max-width="400px">
          <v-card class="error-dialog-card">
            <v-card-title class="error-dialog-title">Ошибка</v-card-title>
            <v-card-text class="error-dialog-text">{{ errorMessage }}</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showError = false">Закрыть</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getUsers, updateUser, deleteUser, createUserInCompany, getProfile } from '../api';

export default {
  data() {
    return {
      users: [],
      showCreateForm: false,
      showEditForm: false,
      showDeleteConfirm: false,
      showError: false,
      deleteUserId: null,
      errorMessage: '',
      newUser: { email: '', password: '', role: 'user' },
      editUser: { user_id: null, email: '', role: 'user' },
      allowedRoles: ['user', 'manager'],
      emailRules: [
        v => !!v || 'Введите email',
        v => /.+@.+\..+/.test(v) || 'Email должен быть валидным',
      ],
      passwordRules: [
        v => !!v || 'Введите пароль',
        v => v.length >= 6 || 'Пароль должен содержать минимум 6 символов',
      ],
      profile: null,
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    isCreateFormValid() {
      return this.emailRules.every(rule => rule(this.newUser.email) === true) &&
             this.passwordRules.every(rule => rule(this.newUser.password) === true) &&
             !!this.newUser.role;
    },
    isEditFormValid() {
      return this.emailRules.every(rule => rule(this.editUser.email) === true) &&
             !!this.editUser.role;
    },
    isAdmin() {
      return this.profile?.role === 'admin';
    },
    filteredUsers() {
      return this.users.filter(user => user.company_id === this.profile?.company_id);
    },
  },
  async created() {
    await this.fetchProfile();
    if (this.isAdmin) await this.fetchUsers();
    else {
      this.showErrorDialog('У вас нет прав для просмотра этой страницы');
      this.$router.push('/');
    }
  },
  methods: {
    async fetchProfile() {
      try {
        this.profile = await getProfile();
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить профиль: ' + (error.response?.data?.detail || error.message));
      }
    },
    async fetchUsers() {
      try {
        this.users = await getUsers() || [];
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить пользователей: ' + this.getErrorMessage(error));
      }
    },
    async createUserInCompanyHandler() {
      if (!this.isCreateFormValid || !this.isAdmin) return;
      try {
        const csrfToken = localStorage.getItem('csrf_token');
        await createUserInCompany(this.profile.company_id, this.newUser.email, this.newUser.password, this.newUser.role, csrfToken);
        await this.fetchUsers();
        this.showCreateForm = false;
        this.newUser = { email: '', password: '', role: 'user' };
      } catch (error) {
        this.showErrorDialog('Не удалось создать пользователя: ' + this.getErrorMessage(error));
      }
    },
    editUser(user) {
      if (user.company_id !== this.profile?.company_id) {
        this.showErrorDialog('Вы не можете редактировать пользователей из других компаний');
        return;
      }
      this.editUser = { ...user };
      this.showEditForm = true;
    },
    async updateUser() {
      if (!this.isEditFormValid || this.editUser.company_id !== this.profile?.company_id) return;
      try {
        const csrfToken = localStorage.getItem('csrf_token');
        await updateUser(this.editUser.user_id, this.editUser, csrfToken);
        await this.fetchUsers();
        this.showEditForm = false;
      } catch (error) {
        this.showErrorDialog('Не удалось обновить пользователя: ' + this.getErrorMessage(error));
      }
    },
    confirmDelete(userId) {
      const user = this.filteredUsers.find(u => u.user_id === userId);
      if (!user || user.company_id !== this.profile?.company_id) {
        this.showErrorDialog('Вы не можете удалить пользователей из других компаний');
        return;
      }
      this.deleteUserId = userId;
      this.showDeleteConfirm = true;
    },
    async deleteUser() {
      const user = this.filteredUsers.find(u => u.user_id === this.deleteUserId);
      if (!user || user.company_id !== this.profile?.company_id) {
        this.showErrorDialog('Вы не можете удалить пользователей из других компаний');
        this.showDeleteConfirm = false;
        return;
      }
      try {
        await deleteUser(this.deleteUserId);
        await this.fetchUsers();
        this.showDeleteConfirm = false;
        this.deleteUserId = null;
      } catch (error) {
        this.showErrorDialog('Не удалось удалить пользователя: ' + this.getErrorMessage(error));
      }
    },
    showErrorDialog(message) {
      this.errorMessage = message;
      this.showError = true;
    },
    getErrorMessage(error) {
      return error.response?.data?.detail || error.message || 'Неизвестная ошибка';
    },
  },
};
</script>

<style scoped>
.users-container {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  animation: fadeIn 0.5s ease-out;
}

.create-btn {
  margin-bottom: 20px;
  background: linear-gradient(90deg, #388e3c, #66bb6a);
}

.create-btn:hover {
  background: linear-gradient(90deg, #2e7d32, #4caf50);
}

.create-user-card {
  padding: 20px;
  background: #fbfcfe;
}

.create-user-title {
  font-family: 'Gilroy-Black', sans-serif;
  color: #1e88e5;
  font-size: 1.2rem;
}

.create-user-field {
  margin-bottom: 15px;
}

.users-list {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.delete-confirm-title {
  font-family: 'Gilroy-Black', sans-serif;
  color: #e53935;
  font-size: 1.2rem;
}

@media (max-width: 600px) {
  .create-btn {
    width: 100%;
  }

  .create-user-card {
    padding: 15px;
  }

  .users-list {
    padding: 10px;
  }
}
</style>