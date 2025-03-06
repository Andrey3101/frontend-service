<template>
  <v-container class="task-form-container">
    <v-row>
      <v-col>
        <h1>{{ isEditMode ? 'Редактировать задачу' : 'Создать задачу' }}</h1>
        <v-form @submit.prevent="saveTask">
          <v-text-field
            v-model="task.title"
            label="Заголовок"
            required
            :rules="[v => !!v || 'Заголовок обязателен']"
          />
          <v-select
            v-model="task.status"
            :items="statusOptions"
            label="Статус"
            required
            :rules="[v => !!v || 'Статус обязателен']"
          />
          <v-select
            v-model="task.priority"
            :items="priorityOptions"
            label="Приоритет"
            required
            :rules="[v => !!v || 'Приоритет обязателен']"
          />
          <v-text-field
            v-model="task.due_date"
            label="Дата выполнения (YYYY-MM-DD)"
            type="date"
            required
            :rules="[v => !!v || 'Дата выполнения обязательна']"
          />
          <v-text-field
            v-model="task.assignee_id"
            label="ID исполнителя"
            type="number"
          />
          <v-btn type="submit" color="primary" :disabled="loading">
            {{ isEditMode ? 'Сохранить' : 'Создать' }}
          </v-btn>
          <v-btn color="secondary" @click="cancel" class="ml-2">Отмена</v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { createTask, updateTask, getTask } from '../api';

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
      },
      statusOptions: ['pending', 'in_progress', 'completed'],
      priorityOptions: [1, 2, 3, 4, 5],
      loading: false,
    };
  },
  computed: {
    isEditMode() {
      return !!this.id;
    },
  },
  async created() {
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
        alert('Не удалось загрузить задачу');
      } finally {
        this.loading = false;
      }
    },
    async saveTask() {
      try {
        this.loading = true;
        if (this.isEditMode) {
          await updateTask(this.id, this.task);
          alert('Задача успешно обновлена');
        } else {
          await createTask(this.task);
          alert('Задача успешно создана');
        }
        this.$router.push('/tasks');
      } catch (error) {
        console.error('Ошибка сохранения задачи:', error);
        alert('Не удалось сохранить задачу');
      } finally {
        this.loading = false;
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
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
</style>