<template>
  <v-container class="tasks-container">
    <v-row>
      <v-col>
        <h1>Мои задачи</h1>
        <v-btn color="primary" @click="showCreateForm = true" class="create-btn">
          Создать задачу
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
            />
          </v-col>
        </v-row>
        <v-data-table
          :headers="headers"
          :items="filteredTasks"
          item-key="task_id"
          class="tasks-table"
          v-model:sort-by="sortBy"
          v-model:sort-desc="sortDesc"
          @click:row="rowClicked"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn icon class="edit" @click.stop="editTask(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon class="delete" @click.stop="confirmDeleteTask(item.task_id)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
        <!-- Диалог создания -->
        <v-dialog v-model="showCreateForm" max-width="600px">
          <v-card>
            <v-card-title>Создание задачи</v-card-title>
            <v-card-text>
              <v-text-field v-model="newTask.title" label="Название" outlined :rules="[v => !!v || 'Введите название']" />
              <v-textarea v-model="newTask.description" label="Описание" outlined />
              <v-select v-model="newTask.priority" :items="priorities" label="Приоритет" outlined :rules="[v => !!v || 'Выберите приоритет']" />
              <v-select v-model="newTask.status" :items="statuses" label="Статус" outlined :rules="[v => !!v || 'Выберите статус']" />
              <v-autocomplete
                v-model="newTask.assignee"
                :items="users"
                item-text="email"
                item-value="email"
                label="Исполнитель"
                outlined
                :rules="assigneeRules"
              />
              <v-text-field v-model="newTask.due_date" label="Срок (YYYY-MM-DD)" outlined :rules="dateRules" />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showCreateForm = false">Отмена</v-btn>
              <v-btn color="primary" @click="createTask" :disabled="!isCreateFormValid">Создать</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Диалог редактирования -->
        <v-dialog v-model="showEditForm" max-width="600px">
          <v-card>
            <v-card-title>Редактирование задачи</v-card-title>
            <v-card-text>
              <v-text-field v-model="editTask.title" label="Название" outlined :rules="[v => !!v || 'Введите название']" />
              <v-textarea v-model="editTask.description" label="Описание" outlined />
              <v-select v-model="editTask.priority" :items="priorities" label="Приоритет" outlined :rules="[v => !!v || 'Выберите приоритет']" />
              <v-select v-model="editTask.status" :items="statuses" label="Статус" outlined :rules="[v => !!v || 'Выберите статус']" />
              <v-autocomplete
                v-model="editTask.assignee"
                :items="users"
                item-text="email"
                item-value="email"
                label="Исполнитель"
                outlined
                :rules="assigneeRules"
              />
              <v-text-field v-model="editTask.due_date" label="Срок (YYYY-MM-DD)" outlined :rules="dateRules" />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showEditForm = false">Отмена</v-btn>
              <v-btn color="primary" @click="updateTask" :disabled="!isEditFormValid">Сохранить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Подтверждение удаления -->
        <v-dialog v-model="showDeleteConfirm" max-width="400px">
          <v-card>
            <v-card-title class="delete-confirm-title">Удаление задачи</v-card-title>
            <v-card-text>Вы уверены, что хотите удалить задачу?</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showDeleteConfirm = false">Отмена</v-btn>
              <v-btn color="delete" @click="deleteTask">Удалить</v-btn>
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
        <router-view />
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
      showCreateForm: false,
      showEditForm: false,
      showDeleteConfirm: false,
      showError: false,
      errorMessage: '',
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
      try {
        const data = await getMyTasks();
        this.tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить задачи: ' + error.message);
      }
    },
    async fetchUsers() {
      try {
        const data = await getUsers();
        this.users = Array.isArray(data) ? data : [];
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить пользователей: ' + error.message);
      }
    },
    async createTask() {
      if (!this.isCreateFormValid) return;
      try {
        await createTask(this.newTask);
        await this.fetchTasks();
        this.showCreateForm = false;
        this.newTask = { title: '', description: '', priority: 'Средний', status: 'Новая', assignee: '', due_date: '' };
      } catch (error) {
        this.showErrorDialog('Не удалось создать задачу: ' + error.message);
      }
    },
    editTask(task) {
      this.editTask = { ...task };
      this.showEditForm = true;
    },
    async updateTask() {
      if (!this.isEditFormValid) return;
      try {
        await updateTask(this.editTask.task_id, this.editTask);
        await this.fetchTasks();
        this.showEditForm = false;
      } catch (error) {
        this.showErrorDialog('Не удалось обновить задачу: ' + error.message);
      }
    },
    confirmDeleteTask(taskId) {
      this.deleteTaskId = taskId;
      this.showDeleteConfirm = true;
    },
    async deleteTask() {
      try {
        await deleteTask(this.deleteTaskId);
        await this.fetchTasks();
        this.showDeleteConfirm = false;
        this.deleteTaskId = null;
      } catch (error) {
        this.showErrorDialog('Не удалось удалить задачу: ' + error.message);
      }
    },
    applyFilters() {
      // Локальная фильтрация, обновление автоматическое
    },
    rowClicked(item) {
      this.$router.push({ name: 'TaskDetail', params: { taskId: item.task_id } });
    },
    showErrorDialog(message) {
      this.errorMessage = message;
      this.showError = true;
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
.filters {
  margin-bottom: 20px;
}

.tasks-table {
  cursor: pointer;
}
</style>