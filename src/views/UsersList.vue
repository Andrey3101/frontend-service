<template>
  <v-container class="users-container">
    <v-row>
      <v-col>
        <h1>Пользователи компании {{ profile?.company_name || 'Загрузка...' }}</h1>
        <v-btn color="primary" @click="showCreateForm = true" class="create-btn" :disabled="!isAdmin || isLoading">
          <v-icon left>mdi-account-plus</v-icon>
          Создать пользователя
        </v-btn>
        
        <!-- Диалог создания пользователя -->
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
                :error-messages="apiErrors.email"
                @input="clearError('email')"
                class="create-user-field"
              />
              <v-text-field
                v-model="newUser.password"
                label="Пароль"
                type="password"
                dense
                outlined
                :rules="passwordRules"
                :error-messages="apiErrors.password"
                @input="clearError('password')"
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
              <v-btn color="grey" text @click="cancelCreate">Отмена</v-btn>
              <v-btn 
                color="primary" 
                @click="createUserInCompanyHandler" 
                :disabled="!isCreateFormValid"
                :loading="isLoading"
              >
                Создать
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог редактирования пользователя -->
        <v-dialog v-model="showEditForm" max-width="500px" persistent>
          <v-card class="edit-user-card">
            <v-card-title class="edit-user-title">Редактирование пользователя</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="editUser.email"
                label="Email"
                outlined
                dense
                :rules="emailRules"
                :error-messages="apiErrors.email"
                @input="clearError('email')"
                class="edit-user-field"
              />
              <v-select
                v-model="editUser.role"
                :items="allowedRoles"
                label="Роль"
                outlined
                dense
                :rules="[v => !!v || 'Выберите роль']"
                class="edit-user-field"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="cancelEdit">Отмена</v-btn>
              <v-btn 
                color="primary" 
                @click="updateUser" 
                :disabled="!isEditFormValid"
                :loading="isLoading"
              >
                Сохранить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Список пользователей -->
        <v-list class="users-list" v-if="!isLoading">
          <v-list-item 
            v-for="user in filteredUsers" 
            :key="user.user_id" 
            v-animate-onscroll="'fadeInUp'"
            class="user-item"
          >
            <v-list-item-avatar>
              <v-icon>mdi-account-circle</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="user-id">ID: {{ user.user_id }}</v-list-item-title>
              <v-list-item-subtitle v-if="isMobile">
                {{ user.role }} | {{ user.email }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else>
                <span class="role-badge">{{ user.role }}</span> | {{ user.email }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action v-if="isAdmin">
              <v-btn icon class="edit-btn" @click="editUser(user)" :disabled="isLoading">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon class="delete-btn" @click="confirmDelete(user.user_id)" :disabled="isLoading">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>

        <!-- Индикатор загрузки -->
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="primary"
          class="loader"
        />

        <!-- Диалог подтверждения удаления -->
        <v-dialog v-model="showDeleteConfirm" max-width="400px">
          <v-card>
            <v-card-title class="delete-confirm-title">Подтверждение удаления</v-card-title>
            <v-card-text>Вы уверены, что хотите удалить пользователя?</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showDeleteConfirm = false">Отмена</v-btn>
              <v-btn color="red" @click="deleteUser" :loading="isLoading">Удалить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог ошибки -->
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
  name: 'UsersList',
  data() {
    return {
      users: [],
      profile: null,
      showCreateForm: false,
      showEditForm: false,
      showDeleteConfirm: false,
      showError: false,
      deleteUserId: null,
      isLoading: false,
      errorMessage: '',
      apiErrors: {},
      newUser: { 
        email: '', 
        password: '', 
        role: 'user' 
      },
      editUser: { 
        user_id: null, 
        email: '', 
        role: 'user' 
      },
      allowedRoles: [
        { text: 'Пользователь', value: 'user' },
        { text: 'Менеджер', value: 'manager' },
        { text: 'Администратор', value: 'admin' }
      ],
      emailRules: [
        v => !!v || 'Введите email',
        v => /.+@.+\..+/.test(v) || 'Email должен быть валидным',
      ],
      passwordRules: [
        v => !!v || 'Введите пароль',
        v => v.length >= 6 || 'Пароль должен содержать минимум 6 символов',
      ],
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
    if (this.isAdmin) {
      await this.fetchUsers();
    } else {
      this.handleCustomError('У вас нет прав для просмотра этой страницы');
      this.$router.push('/');
    }
  },
  methods: {
    async fetchProfile() {
      this.isLoading = true;
      try {
        const response = await getProfile();
        this.profile = response.data;
      } catch (error) {
        this.handleApiError(error, 'profile');
        if (error.response?.status === 403 || error.response?.status === 401) {
          this.$router.push('/login');
        }
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUsers() {
      this.isLoading = true;
      try {
        const response = await getUsers();
        this.users = response.data || [];
      } catch (error) {
        this.handleApiError(error, 'users');
      } finally {
        this.isLoading = false;
      }
    },

    async createUserInCompanyHandler() {
      if (!this.isCreateFormValid || !this.isAdmin) return;

      this.isLoading = true;
      try {
        const csrfToken = localStorage.getItem('csrf_token');
        const response = await createUserInCompany(
          this.profile.company_id, 
          this.newUser.email, 
          this.newUser.password, 
          this.newUser.role, 
          csrfToken
        );

        if (response.status === 201) {
          this.$toast.success('Пользователь успешно создан');
          await this.fetchUsers();
          this.cancelCreate();
        }
      } catch (error) {
        this.handleApiError(error, 'createUser');
        
        if (error.response?.data?.email) {
          this.apiErrors.email = error.response.data.email.join(', ');
        }
        if (error.response?.data?.password) {
          this.apiErrors.password = error.response.data.password.join(', ');
        }
      } finally {
        this.isLoading = false;
      }
    },

    editUser(user) {
      if (user.company_id !== this.profile?.company_id) {
        this.handleCustomError('Вы не можете редактировать пользователей из других компаний');
        return;
      }
      this.editUser = { ...user };
      this.showEditForm = true;
    },

    async updateUser() {
      if (!this.isEditFormValid || this.editUser.company_id !== this.profile?.company_id) return;

      this.isLoading = true;
      try {
        const csrfToken = localStorage.getItem('csrf_token');
        const response = await updateUser(this.editUser.user_id, this.editUser, csrfToken);

        if (response.status === 200) {
          this.$toast.success('Изменения сохранены');
          await this.fetchUsers();
          this.cancelEdit();
        }
      } catch (error) {
        this.handleApiError(error, 'updateUser');
      } finally {
        this.isLoading = false;
      }
    },

    confirmDelete(userId) {
      const user = this.filteredUsers.find(u => u.user_id === userId);
      if (!user || user.company_id !== this.profile?.company_id) {
        this.handleCustomError('Вы не можете удалить пользователей из других компаний');
        return;
      }
      this.deleteUserId = userId;
      this.showDeleteConfirm = true;
    },

    async deleteUser() {
      const user = this.filteredUsers.find(u => u.user_id === this.deleteUserId);
      if (!user || user.company_id !== this.profile?.company_id) {
        this.handleCustomError('Вы не можете удалить пользователей из других компаний');
        this.showDeleteConfirm = false;
        return;
      }

      this.isLoading = true;
      try {
        const response = await deleteUser(this.deleteUserId);
        
        if (response.status === 204) {
          this.$toast.success('Пользователь удален');
          await this.fetchUsers();
          this.showDeleteConfirm = false;
          this.deleteUserId = null;
        }
      } catch (error) {
        this.handleApiError(error, 'deleteUser');
        
        if (error.response?.status === 404) {
          this.handleCustomError('Пользователь не найден. Возможно, он был уже удален.');
          await this.fetchUsers();
        }
      } finally {
        this.isLoading = false;
      }
    },

    cancelCreate() {
      this.showCreateForm = false;
      this.newUser = { email: '', password: '', role: 'user' };
      this.clearErrors();
    },

    cancelEdit() {
      this.showEditForm = false;
      this.editUser = { user_id: null, email: '', role: 'user' };
      this.clearErrors();
    },

    handleApiError(error, context = '') {
      console.error(`Error in ${context}:`, error);
      
      let errorMessage = 'Произошла ошибка';
      
      if (error.response) {
        switch(error.response.status) {
          case 400:
            errorMessage = 'Некорректные данные';
            break;
          case 401:
            errorMessage = 'Требуется авторизация';
            this.$router.push('/login');
            break;
          case 403:
            errorMessage = 'Доступ запрещен';
            break;
          case 404:
            errorMessage = 'Данные не найдены';
            break;
          case 500:
            errorMessage = 'Ошибка сервера';
            break;
          default:
            errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          'Неизвестная ошибка';
        }
        
        if (error.response.data && typeof error.response.data === 'object') {
          Object.entries(error.response.data.errors || {}).forEach(([field, messages]) => {
            this.apiErrors[field] = Array.isArray(messages) ? messages.join(', ') : messages;
          });
        }
      } else if (error.request) {
        errorMessage = 'Проблемы с соединением. Проверьте интернет и попробуйте снова.';
      } else {
        errorMessage = error.message || 'Неизвестная ошибка';
      }
      
      this.showErrorDialog(errorMessage);
    },
    
    handleCustomError(message) {
      this.$toast.error(message);
      this.showErrorDialog(message);
    },

    showErrorDialog(message) {
      this.errorMessage = message;
      this.showError = true;
    },

    clearErrors() {
      this.apiErrors = {};
    },

    clearError(field) {
      if (this.apiErrors[field]) {
        delete this.apiErrors[field];
      }
    }
  }
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
  color: white;
  text-transform: none;
  font-weight: 500;
  letter-spacing: normal;
}

.create-btn:hover {
  background: linear-gradient(90deg, #2e7d32, #4caf50);
}

.create-user-card, .edit-user-card {
  padding: 20px;
  background: #fbfcfe;
  border-radius: 12px;
}

.create-user-title, .edit-user-title {
  font-family: 'Gilroy-Black', sans-serif;
  color: #1e88e5;
  font-size: 1.2rem;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.create-user-field, .edit-user-field {
  margin-bottom: 15px;
}

.users-list {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.user-item {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.user-item:hover {
  background-color: #f5f5f5;
}

.user-id {
  font-weight: 500;
  color: #333;
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: #e3f2fd;
  color: #1976d2;
  font-size: 0.8rem;
  font-weight: 500;
}

.edit-btn {
  color: #1976d2;
}

.delete-btn {
  color: #e53935;
}

.delete-confirm-title {
  font-family: 'Gilroy-Black', sans-serif;
  color: #e53935;
  font-size: 1.2rem;
  padding-bottom: 16px;
  border-bottom: 1px solid #ffcdd2;
}

.error-dialog-card {
  background-color: #ffebee;
  border-radius: 12px;
}

.error-dialog-title {
  color: #d32f2f;
  padding-bottom: 16px;
  border-bottom: 1px solid #ef9a9a;
}

.error-dialog-text {
  color: #5f2120;
  padding: 16px 0;
}

.loader {
  display: block;
  margin: 40px auto;
}

.error-message {
  color: #d32f2f;
  font-size: 0.8rem;
  margin-top: 4px;
}

@media (max-width: 600px) {
  .users-container {
    padding: 15px;
  }
  
  .create-btn {
    width: 100%;
    margin-bottom: 15px;
  }

  .create-user-card, .edit-user-card {
    padding: 15px;
  }

  .users-list {
    padding: 10px;
  }
  
  .user-item {
    padding: 10px 0;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
