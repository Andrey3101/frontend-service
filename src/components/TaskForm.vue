<template>
  <v-container class="task-form-container">
    <v-row>
      <v-col>
        <h1 class="form-title">{{ isEditMode ? 'Редактировать задачу' : 'Создать задачу' }}</h1>
        <v-form ref="form" v-model="valid" @submit.prevent="confirmSave" class="task-form">
          <v-text-field
            v-model="task.title"
            label="Заголовок"
            outlined
            dense
            :rules="[v => !!v || 'Заголовок обязателен']"
            class="input-field"
          />
          <v-select
            v-model="task.status"
            :items="statusOptions"
            label="Статус"
            outlined
            dense
            :rules="[v => !!v || 'Статус обязателен']"
            class="input-field"
          />
          <v-select
            v-model="task.priority"
            :items="priorityOptions"
            label="Приоритет"
            outlined
            dense
            :rules="[v => !!v || 'Приоритет обязателен']"
            class="input-field"
          />
          <v-text-field
            v-model="task.due_date"
            label="Дата выполнения"
            type="date"
            outlined
            dense
            :rules="[v => !!v || 'Дата выполнения обязательна']"
            class="input-field"
          />
          <v-autocomplete
            v-model="task.assignee_id"
            :items="users"
            item-text="name"
            item-value="id"
            label="Исполнитель"
            outlined
            dense
            :loading="usersLoading"
            class="input-field"
          />
          <v-textarea
            v-model="task.description"
            label="Описание"
            outlined
            dense
            rows="3"
            class="input-field"
          />
          <div class="button-group">
            <v-btn
              type="submit"
              color="primary"
              class="action-btn"
              :disabled="!valid || loading"
              :loading="loading"
            >
              {{ isEditMode ? 'Сохранить' : 'Создать' }}
            </v-btn>
            <v-btn
              color="grey"
              text
              class="action-btn"
              @click="cancel"
            >
              Отмена
            </v-btn>
          </div>
        </v-form>

        <!-- Диалог подтверждения -->
        <v-dialog v-model="showConfirmDialog" max-width="400" class="custom-dialog">
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Подтверждение</v-card-title>
            <v-card-text class="dialog-text">Вы уверены, что хотите {{ isEditMode ? 'сохранить изменения' : 'создать задачу' }}?</v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showConfirmDialog = false" class="dialog-btn">Отмена</v-btn>
              <v-btn color="primary" @click="saveTask" class="dialog-btn primary-btn">Подтвердить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { createTask, updateTask, getTask, getUsers } from '../api';

export default {
  props: {
    id: {
      type: [String, Number],
      default: null,
    },
  },
  data() {
    return {
      task: {
        title: '',
        status: null,
        priority: null,
        due_date: null,
        assignee_id: null,
        description: '',
      },
      statusOptions: [
        { text: 'Ожидает', value: 'pending' },
        { text: 'В работе', value: 'in_progress' },
        { text: 'Завершена', value: 'completed' },
      ],
      priorityOptions: [
        { text: 'Низкий (1)', value: 1 },
        { text: 'Средний (2)', value: 2 },
        { text: 'Высокий (3)', value: 3 },
        { text: 'Критический (4)', value: 4 },
        { text: 'Срочный (5)', value: 5 },
      ],
      users: [],
      usersLoading: false,
      valid: true,
      loading: false,
      showConfirmDialog: false,
    };
  },
  computed: {
    isEditMode() {
      return !!this.id;
    },
  },
  async created() {
    await this.loadUsers();
    if (this.isEditMode) {
      await this.loadTask();
    }
  },
  methods: {
    async loadTask() {
      try {
        this.loading = true;
        const taskData = await getTask(this.id);
        this.task = { ...taskData };
      } catch (error) {
        console.error('Ошибка загрузки задачи:', error);
        this.$emit('error', 'Не удалось загрузить задачу');
      } finally {
        this.loading = false;
      }
    },
    async loadUsers() {
      try {
        this.usersLoading = true;
        this.users = await getUsers();
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        this.$emit('error', 'Не удалось загрузить список пользователей');
      } finally {
        this.usersLoading = false;
      }
    },
    confirmSave() {
      if (!this.$refs.form.validate()) return;
      this.showConfirmDialog = true;
    },
    async saveTask() {
      try {
        this.loading = true;
        if (this.isEditMode) {
          await updateTask(this.id, this.task);
          this.$emit('success', 'Задача успешно обновлена');
        } else {
          await createTask(this.task);
          this.$emit('success', 'Задача успешно создана');
        }
        this.$router.push('/tasks');
      } catch (error) {
        console.error('Ошибка сохранения задачи:', error);
        this.$emit('error', 'Не удалось сохранить задачу');
      } finally {
        this.loading = false;
        this.showConfirmDialog = false;
      }
    },
    cancel() {
      this.$router.push('/tasks');
    },
  },
};
</script>

<style scoped>
.task-form-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.form-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 2rem;
  color: #1976d2;
  margin-bottom: 24px;
  text-align: center;
}

.task-form {
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
  .form-title {
    font-size: 1.75rem;
  }
  .task-form {
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