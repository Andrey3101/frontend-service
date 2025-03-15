<template>
  <v-container class="tasks-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Мои задачи</h1>
        <v-btn color="primary" @click="showCreateForm = true" class="create-btn elevation-2">
          <v-icon left>mdi-plus</v-icon> Создать задачу
        </v-btn>
        <v-row class="filters">
          <v-col cols="12" sm="6">
            <v-select
              v-model="statusFilter"
              :items="['Все', ...statuses]"
              label="Фильтр по статусу"
              outlined
              dense
              @change="applyFilters"
              class="filter-select"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="assigneeFilter"
              :items="['Все', ...users.map(u => u.email)]"
              label="Фильтр по исполнителю"
              outlined
              dense
              @change="applyFilters"
              class="filter-autocomplete"
            />
          </v-col>
        </v-row>
        <v-progress-linear v-if="loading" indeterminate color="blue" class="loading-bar" />
        <v-alert v-if="error" type="error" dense class="error-alert" dismissible @input="error = null">
          {{ error }}
        </v-alert>
        <v-data-table
          :headers="headers"
          :items="filteredTasks"
          item-key="task_id"
          class="tasks-table elevation-1"
          v-model:sort-by="sortBy"
          v-model:sort-desc="sortDesc"
          @click:row="rowClicked"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn icon class="edit-btn" @click.stop="editTask(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon class="delete-btn" @click.stop="confirmDeleteTask(item.task_id)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
        <!-- Диалог создания -->
        <v-dialog v-model="showCreateForm" max-width="600px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Создание задачи</v-card-title>
            <v-card-text class="dialog-content">
              <v-text-field v-model="newTask.title" label="Название" outlined :rules="[v => !!v || 'Введите название']" class="input-field" />
              <v-textarea v-model="newTask.description" label="Описание" outlined class="input-field" />
              <v-select v-model="newTask.priority" :items="priorities" label="Приоритет" outlined :rules="[v => !!v || 'Выберите приоритет']" class="input-field" />
              <v-select v-model="newTask.status" :items="statuses" label="Статус" outlined :rules="[v => !!v || 'Выберите статус']" class="input-field" />
              <v-autocomplete
                v-model="newTask.assignee"
                :items="users"
                item-text="email"
                item-value="email"
                label="Исполнитель"
                outlined
                :rules="assigneeRules"
                class="input-field"
              />
              <v-text-field v-model="newTask.due_date" label="Срок (YYYY-MM-DD)" outlined :rules="dateRules" class="input-field" />
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showCreateForm = false" class="dialog-btn">Отмена</v-btn>
              <v-btn color="primary" @click="createTask" :disabled="!isCreateFormValid" class="dialog-btn primary-btn">Создать</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Диалог редактирования -->
        <v-dialog v-model="showEditForm" max-width="600px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Редактирование задачи</v-card-title>
            <v-card-text class="dialog-content">
              <v-text-field v-model="editTask.title" label="Название" outlined :rules="[v => !!v || 'Введите название']" class="input-field" />
              <v-textarea v-model="editTask.description" label="Описание" outlined class="input-field" />
              <v-select v-model="editTask.priority" :items="priorities" label="Приоритет" outlined :rules="[v => !!v || 'Выберите приоритет']" class="input-field" />
              <v-select v-model="editTask.status" :items="statuses" label="Статус" outlined :rules="[v => !!v || 'Выберите статус']" class="input-field" />
              <v-autocomplete
                v-model="editTask.assignee"
                :items="users"
                item-text="email"
                item-value="email"
                label="Исполнитель"
                outlined
                :rules="assigneeRules"
                class="input-field"
              />
              <v-text-field v-model="editTask.due_date" label="Срок (YYYY-MM-DD)" outlined :rules="dateRules" class="input-field" />
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showEditForm = false" class="dialog-btn">Отмена</v-btn>
              <v-btn color="primary" @click="updateTask" :disabled="!isEditFormValid" class="dialog-btn primary-btn">Сохранить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Подтверждение удаления -->
        <v-dialog v-model="showDeleteConfirm" max-width="400px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title delete-confirm-title">Удаление задачи</v-card-title>
            <v-card-text class="dialog-text">Вы уверены, что хотите удалить задачу?</v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showDeleteConfirm = false" class="dialog-btn">Отмена</v-btn>
              <v-btn color="red" @click="deleteTask" class="dialog-btn delete-btn">Удалить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getMyTasks, createTask, updateTask, deleteTask, getUsers } from '../api';

export default {
  data() {
    return {
      tasks: [],
      users: [],
      loading: false,
      error: null,
      showCreateForm: false,
      showEditForm: false,
      showDeleteConfirm: false,
      deleteTaskId: null,
      statusFilter: 'Все',
      assigneeFilter: 'Все',
      sortBy: 'due_date',
      sortDesc: false,
      newTask: {
        title: '',
        description: '',
        priority: 'Средний',
        status: 'Новая',
        assignee: '',
        due_date: '',
      },
      editTask: null,
      headers: [
        { text: 'Название', value: 'title', sortable: true },
        { text: 'Статус', value: 'status', sortable: true },
        { text: 'Исполнитель', value: 'assignee', sortable: true },
        { text: 'Приоритет', value: 'priority', sortable: true },
        { text: 'Срок', value: 'due_date', sortable: true },
        { text: 'Действия', value: 'actions', sortable: false },
      ],
      priorities: ['Низкий', 'Средний', 'Высокий'],
      statuses: ['Новая', 'В работе', 'Завершена', 'Отменена'],
      dateRules: [
        v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) || 'Дата должна быть в формате YYYY-MM-DD',
      ],
      assigneeRules: [
        v => !!v || 'Выберите исполнителя',
        v => this.users.some(user => user.email === v) || 'Исполнитель должен быть в списке пользователей',
      ],
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    isCreateFormValid() {
      return this.isFormValid(this.newTask);
    },
    isEditFormValid() {
      return this.isFormValid(this.editTask);
    },
    filteredTasks() {
      return this.tasks.filter(task => {
        const statusMatch = this.statusFilter === 'Все' || task.status === this.statusFilter;
        const assigneeMatch = this.assigneeFilter === 'Все' || task.assignee === this.assigneeFilter;
        return statusMatch && assigneeMatch;
      });
    },
  },
  async created() {
    await this.fetchTasks();
    await this.fetchUsers();
  },
  methods: {
    async fetchTasks() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getMyTasks();
        this.tasks = Array.isArray(response?.tasks) ? response.tasks : [];
      } catch (error) {
        const errorMessage = error.response
          ? error.response.error || error.response.detail || error.message
          : error.message || 'Не удалось загрузить задачи';
        this.error = errorMessage;
      } finally {
        this.loading = false;
      }
    },
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getUsers();
        this.users = Array.isArray(response) ? response : [];
      } catch (error) {
        const errorMessage = error.response
          ? error.response.error || error.response.detail || error.message
          : error.message || 'Не удалось загрузить пользователей';
        this.error = errorMessage;
      } finally {
        this.loading = false;
      }
    },
    async createTask() {
      if (!this.isCreateFormValid) return;
      this.loading = true;
      this.error = null;
      try {
        await createTask(this.newTask);
        await this.fetchTasks();
        this.showCreateForm = false;
        this.newTask = { title: '', description: '', priority: 'Средний', status: 'Новая', assignee: '', due_date: '' };
      } catch (error) {
        const errorMessage = error.response
          ? error.response.error || error.response.detail || error.message
          : error.message || 'Не удалось создать задачу';
        this.error = errorMessage;
      } finally {
        this.loading = false;
      }
    },
    editTask(task) {
      this.editTask = { ...task };
      this.showEditForm = true;
      this.error = null;
    },
    async updateTask() {
      if (!this.isEditFormValid) return;
      this.loading = true;
      this.error = null;
      try {
        await updateTask(this.editTask.task_id, this.editTask);
        await this.fetchTasks();
        this.showEditForm = false;
      } catch (error) {
        const errorMessage = error.response
          ? error.response.error || error.response.detail || error.message
          : error.message || 'Не удалось обновить задачу';
        this.error = errorMessage;
      } finally {
        this.loading = false;
      }
    },
    confirmDeleteTask(taskId) {
      this.deleteTaskId = taskId;
      this.showDeleteConfirm = true;
      this.error = null;
    },
    async deleteTask() {
      this.loading = true;
      this.error = null;
      try {
        await deleteTask(this.deleteTaskId);
        await this.fetchTasks();
        this.showDeleteConfirm = false;
        this.deleteTaskId = null;
      } catch (error) {
        const errorMessage = error.response
          ? error.response.error || error.response.detail || error.message
          : error.message || 'Не удалось удалить задачу';
        this.error = errorMessage;
      } finally {
        this.loading = false;
      }
    },
    applyFilters() {
      // Локальная фильтрация
    },
    rowClicked(item) {
      this.$router.push({ name: 'TaskDetail', params: { taskId: item.task_id } });
    },
    isFormValid(task) {
      return (
        !!task?.title &&
        this.dateRules.every(rule => rule(task?.due_date || '') === true) &&
        !!task?.priority &&
        !!task?.status &&
        this.assigneeRules.every(rule => rule(task?.assignee) === true)
      );
    },
  },
};
</script>

<style scoped>
.tasks-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 500;
  color: #1976d2;
  margin-bottom: 20px;
}

.create-btn {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.filters {
  margin-bottom: 20px;
  gap: 16px;
}

.filter-select,
.filter-autocomplete {
  border-radius: 8px;
}

.loading-bar {
  margin-bottom: 16px;
  border-radius: 4px;
}

.error-alert {
  margin-bottom: 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.tasks-table {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}

.tasks-table :deep(.v-data-table-header th) {
  background-color: #f5f7fa;
  color: #333;
  font-weight: 600;
}

.tasks-table :deep(tr:hover) {
  background-color: #e3f2fd !important;
  transition: background-color 0.2s ease;
}

.edit-btn,
.delete-btn {
  transition: all 0.3s ease;
}

.edit-btn:hover {
  color: #1976d2;
  transform: scale(1.1);
}

.delete-btn:hover {
  color: #d32f2f;
  transform: scale(1.1);
}

.dialog-card {
  border-radius: 12px;
  padding: 16px;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  background-color: #f5f7fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-content {
  padding: 20px;
}

.input-field {
  margin-bottom: 16px;
  border-radius: 8px;
}

.dialog-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.dialog-btn {
  border-radius: 6px;
  padding: 6px 16px;
  transition: all 0.3s ease;
}

.dialog-btn:hover {
  transform: translateY(-1px);
}

.primary-btn {
  background-color: #1976d2;
  color: white;
}

.primary-btn:hover {
  background-color: #1565c0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.delete-btn {
  background-color: #d32f2f;
  color: white;
}

.delete-btn:hover {
  background-color: #b71c1c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.delete-confirm-title {
  color: #d32f2f;
}

.dialog-text {
  font-size: 1rem;
  color: #555;
  padding: 16px;
}

/* Адаптивность */
@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }

  .create-btn {
    width: 100%;
    margin-bottom: 16px;
  }

  .filters {
    flex-direction: column;
  }

  .tasks-table :deep(.v-data-table-header th),
  .tasks-table :deep(td) {
    font-size: 0.85rem;
    padding: 8px;
  }

  .edit-btn,
  .delete-btn {
    margin: 0 4px;
  }
}
</style>