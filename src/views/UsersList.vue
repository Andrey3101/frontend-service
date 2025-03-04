<template>
  <v-container class="users-container">
    <v-row>
      <v-col>
        <h1>Пользователи</h1>
        <v-btn color="primary" @click="showCreateForm = true" class="create-btn">
          Создать пользователя
        </v-btn>
        <!-- Диалог создания -->
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
                @blur="checkEmailUnique(newUser.email)"
                class="create-user-field"
              />
              <v-text-field
                v-model="newUser.password"
                label="Пароль"
                type="password"
                outlined
                dense
                :rules="passwordRules"
                class="create-user-field"
              />
              <v-select
                v-model="newUser.role"
                :items="roles"
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
              <v-btn color="primary" @click="createUser" :disabled="!isCreateFormValid || !isEmailUnique">Создать</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Диалог редактирования -->
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
                @blur="checkEmailUnique(editUser.email, editUser.user_id)"
                class="create-user-field"
              />
              <v-text-field
                v-model="editUser.phone_number"
                label="Номер телефона"
                outlined
                dense
                :rules="phoneRules"
                class="create-user-field"
              />
              <v-select
                v-model="editUser.role"
                :items="roles"
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
              <v-btn color="primary" @click="updateUser" :disabled="!isEditFormValid || !isEmailUnique">Сохранить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Список пользователей -->
        <v-list class="users-list">
          <v-list-item v-for="user in users" :key="user.user_id" v-animate-onscroll="'fadeInUp'">
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
        <!-- Подтверждение удаления -->
        <v-dialog v-model="showDeleteConfirm" max-width="400px">
          <v-card>
            <v-card-title class="delete-confirm-title">Подтверждение удаления</v-card-title>
            <v-card-text>Вы уверены, что хотите удалить пользователя?</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showDeleteConfirm = false">Отмена</v-btn>
              <v-btn color="delete" @click="deleteUser">Удалить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Окно ошибки -->
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
import { getUsers, updateUser, createUser, deleteUser, checkEmailUnique } from '../api';

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
      isEmailUnique: true,
      newUser: {
        email: '',
        password: '',
        role: 'user',
      },
      editUser: {
        user_id: null,
        email: '',
        phone_number: '',
        role: 'user',
      },
      roles: ['user', 'admin'],
      emailRules: [
        v => !!v || 'Введите email',
        v => /.+@.+\..+/.test(v) || 'Email должен быть валидным',
      ],
      passwordRules: [
        v => !!v || 'Введите пароль',
        v => v.length >= 6 || 'Пароль должен содержать минимум 6 символов',
      ],
      phoneRules: [
        v => !v || /^\+?\d{10,15}$/.test(v) || 'Номер телефона должен быть валидным (10-15 цифр)',
      ],
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    isCreateFormValid() {
      return this.isFormValid(this.newUser, true);
    },
    isEditFormValid() {
      return this.isFormValid(this.editUser);
    },
  },
  async created() {
    await this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      try {
        const data = await getUsers();
        this.users = Array.isArray(data) ? data : [];
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить пользователей: ' + error.message);
      }
    },
    async checkEmailUnique(email, excludeUserId = null) {
      try {
        const response = await checkEmailUnique(email);
        this.isEmailUnique = response.isUnique || (excludeUserId && this.users.find(u => u.user_id === excludeUserId)?.email === email);
        if (!this.isEmailUnique) {
          this.emailRules.push(() => 'Этот email уже используется');
        } else {
          this.emailRules = this.emailRules.filter(rule => typeof rule !== 'function' || rule() !== 'Этот email уже используется');
        }
      } catch (error) {
        this.showErrorDialog('Ошибка проверки email: ' + error.message);
      }
    },
    async createUser() {
      if (!this.isCreateFormValid || !this.isEmailUnique) return;
      try {
        await createUser(this.newUser.email, this.newUser.password, this.newUser.role);
        await this.fetchUsers();
        this.showCreateForm = false;
        this.newUser = { email: '', password: '', role: 'user' };
      } catch (error) {
        this.showErrorDialog('Не удалось создать пользователя: ' + error.message);
      }
    },
    editUser(user) {
      this.editUser = { ...user };
      this.checkEmailUnique(this.editUser.email, this.editUser.user_id);
      this.showEditForm = true;
    },
    async updateUser() {
      if (!this.isEditFormValid || !this.isEmailUnique) return;
      try {
        await updateUser(this.editUser.user_id, {
          email: this.editUser.email,
          phone_number: this.editUser.phone_number,
          role: this.editUser.role,
        });
        await this.fetchUsers();
        this.showEditForm = false;
      } catch (error) {
        this.showErrorDialog('Не удалось обновить пользователя: ' + error.message);
      }
    },
    confirmDelete(userId) {
      this.deleteUserId = userId;
      this.showDeleteConfirm = true;
    },
    async deleteUser() {
      try {
        await deleteUser(this.deleteUserId);
        await this.fetchUsers();
        this.showDeleteConfirm = false;
        this.deleteUserId = null;
      } catch (error) {
        this.showErrorDialog('Не удалось удалить пользователя: ' + error.message);
      }
    },
    showErrorDialog(message) {
      this.errorMessage = message;
      this.showError = true;
    },
    isFormValid(user, isNew = false) {
      const emailValid = this.emailRules.every(rule => rule(user.email) === true);
      const phoneValid = this.phoneRules.every(rule => rule(user.phone_number || '') === true);
      const roleValid = !!user.role;
      return emailValid && (isNew ? this.passwordRules.every(rule => rule(user.password) === true) : true) && phoneValid && roleValid;
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