<template>
  <v-container class="task-detail-container">
    <v-row>
      <v-col cols="12" md="8">
        <h2>{{ task.title }}</h2>
        <v-textarea
          v-model="task.description"
          label="Описание"
          outlined
          readonly
          class="task-description"
        />
        <v-list class="comments-list">
          <v-list-item v-for="comment in task.comments" :key="comment.id">
            <v-list-item-content>
              <v-list-item-title>{{ comment.text }}</v-list-item-title>
              <v-list-item-subtitle>
                Автор: {{ comment.author }} | {{ comment.created_at }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn icon class="edit" @click="editComment(comment)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon class="delete" @click="confirmDeleteComment(comment.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
        <CommentForm
          :task-id="task.task_id"
          :comment="editCommentData"
          @comment-saved="fetchTask"
          @cancel="editCommentData = null"
        />
      </v-col>
      <v-col cols="12" md="4" class="task-info">
        <v-card>
          <v-card-title>Информация о задаче</v-card-title>
          <v-card-text>
            <p><strong>Создатель:</strong> {{ task.creator }}</p>
            <p><strong>Исполнитель:</strong> {{ task.assignee }}</p>
            <p><strong>Приоритет:</strong> {{ task.priority }}</p>
            <p><strong>Статус:</strong> {{ task.status }}</p>
            <p><strong>Срок:</strong> {{ task.due_date }}</p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="editTask">Редактировать</v-btn>
            <v-btn color="delete" @click="confirmDeleteTask">Удалить</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <!-- Диалог редактирования задачи -->
    <v-dialog v-model="showEditTaskForm" max-width="600px">
      <v-card>
        <v-card-title>Редактирование задачи</v-card-title>
        <v-card-text>
          <v-text-field v-model="editTaskData.title" label="Название" outlined :rules="[v => !!v || 'Введите название']" />
          <v-textarea v-model="editTaskData.description" label="Описание" outlined />
          <v-select v-model="editTaskData.priority" :items="priorities" label="Приоритет" outlined :rules="[v => !!v || 'Выберите приоритет']" />
          <v-select v-model="editTaskData.status" :items="statuses" label="Статус" outlined :rules="[v => !!v || 'Выберите статус']" />
          <v-autocomplete
            v-model="editTaskData.assignee"
            :items="users"
            item-text="email"
            item-value="email"
            label="Исполнитель"
            outlined
            :rules="assigneeRules"
          />
          <v-text-field v-model="editTaskData.due_date" label="Срок (YYYY-MM-DD)" outlined :rules="dateRules" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" text @click="showEditTaskForm = false">Отмена</v-btn>
          <v-btn color="primary" @click="updateTask" :disabled="!isEditFormValid">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Подтверждение удаления задачи -->
    <v-dialog v-model="showDeleteTaskConfirm" max-width="400px">
      <v-card>
        <v-card-title class="delete-confirm-title">Удаление задачи</v-card-title>
        <v-card-text>Вы уверены, что хотите удалить задачу?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" text @click="showDeleteTaskConfirm = false">Отмена</v-btn>
          <v-btn color="delete" @click="deleteTask">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Подтверждение удаления комментария -->
    <v-dialog v-model="showDeleteCommentConfirm" max-width="400px">
      <v-card>
        <v-card-title class="delete-confirm-title">Удаление комментария</v-card-title>
        <v-card-text>Вы уверены, что хотите удалить комментарий?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" text @click="showDeleteCommentConfirm = false">Отмена</v-btn>
          <v-btn color="delete" @click="deleteComment">Удалить</v-btn>
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
  </v-container>
</template>

<script>
import { getTask, updateTask, deleteTask, deleteComment, getUsers } from '../api';
import CommentForm from './CommentForm.vue';

export default {
  components: { CommentForm },
  data() {
    return {
      task: {},
      users: [],
      editTaskData: null,
      editCommentData: null,
      deleteCommentId: null,
      showEditTaskForm: false,
      showDeleteTaskConfirm: false,
      showDeleteCommentConfirm: false,
      showError: false,
      errorMessage: '',
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
    isEditFormValid() {
      return (
        !!this.editTaskData?.title &&
        this.dateRules.every(rule => rule(this.editTaskData?.due_date || '') === true) &&
        !!this.editTaskData?.priority &&
        !!this.editTaskData?.status &&
        this.assigneeRules.every(rule => rule(this.editTaskData?.assignee) === true)
      );
    },
  },
  async created() {
    await this.fetchTask();
    await this.fetchUsers();
  },
  methods: {
    async fetchTask() {
      try {
        const data = await getTask(this.$route.params.taskId);
        this.task = data;
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить задачу: ' + error.message);
      }
    },
    async fetchUsers() {
      try {
        const data = await getUsers();
        this.users = data || [];
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить пользователей: ' + error.message);
      }
    },
    editTask() {
      this.editTaskData = { ...this.task };
      this.showEditTaskForm = true;
    },
    async updateTask() {
      if (!this.isEditFormValid) return;
      try {
        await updateTask(this.task.task_id, this.editTaskData);
        await this.fetchTask();
        this.showEditTaskForm = false;
      } catch (error) {
        this.showErrorDialog('Не удалось обновить задачу: ' + error.message);
      }
    },
    confirmDeleteTask() {
      this.showDeleteTaskConfirm = true;
    },
    async deleteTask() {
      try {
        await deleteTask(this.task.task_id);
        this.showDeleteTaskConfirm = false;
        this.$router.push('/tasks');
      } catch (error) {
        this.showErrorDialog('Не удалось удалить задачу: ' + error.message);
      }
    },
    editComment(comment) {
      this.editCommentData = { ...comment };
    },
    confirmDeleteComment(commentId) {
      this.deleteCommentId = commentId;
      this.showDeleteCommentConfirm = true;
    },
    async deleteComment() {
      try {
        await deleteComment(this.task.task_id, this.deleteCommentId);
        await this.fetchTask();
        this.showDeleteCommentConfirm = false;
        this.deleteCommentId = null;
      } catch (error) {
        this.showErrorDialog('Не удалось удалить комментарий: ' + error.message);
      }
    },
    showErrorDialog(message) {
      this.errorMessage = message;
      this.showError = true;
    },
  },
};
</script>

<style scoped>
.task-detail-container {
  padding: 20px;
}

.task-description {
  margin-bottom: 20px;
}

.comments-list {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.task-info {
  padding: 0;
}

.task-info .v-card {
  height: 100%;
}

.delete-confirm-title {
  font-family: 'Gilroy-Black', sans-serif;
  color: #e53935;
}

@media (max-width: 600px) {
  .task-detail-container {
    padding: 10px;
  }
}
</style>