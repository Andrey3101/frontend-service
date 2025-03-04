<template>
  <v-container :fluid="$vuetify.breakpoint.xs">
    <h1 class="text-h5 mb-4">Задачи</h1>
    <v-row>
      <v-col cols="12" sm="6">
        <v-textarea v-model="taskText" label="Введите команду" outlined dense />
      </v-col>
      <v-col cols="12" sm="6" class="d-flex align-center">
        <v-btn color="primary" @click="processTask" block :small="$vuetify.breakpoint.xs">
          Обработать
        </v-btn>
      </v-col>
    </v-row>
    <v-list two-line :dense="$vuetify.breakpoint.xs">
      <v-list-item v-for="task in tasks" :key="task.task_id" @click="updateTask(task.task_id)">
        <v-list-item-content>
          <v-list-item-title>{{ task.title }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ $vuetify.breakpoint.xs ? task.status : `${task.status} | ${task.due_date}` }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script>
import axios from 'axios';
import { useAuthStore } from '@/store';

export default {
  data: () => ({
    tasks: [],
    taskText: ''
  }),
  async created() {
    await this.fetchTasks();
  },
  methods: {
    async fetchTasks() {
      const authStore = useAuthStore();
      const response = await axios.get('http://localhost:8000/tasks/my', {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      this.tasks = response.data.tasks || [];
      console.log(response);
    },
    async processTask() {
      const authStore = useAuthStore();
      const response = await axios.post('http://localhost:8000/text', { text: this.taskText }, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      this.$root.showSnackbar('Задача обработана', 'success');
      await this.fetchTasks();
      this.taskText = '';
      console.log(response);
    },
    async updateTask(taskId) {
      const newTitle = prompt('Новое название:');
      if (newTitle) {
        const authStore = useAuthStore();
        await axios.put(`http://localhost:8000/tasks/${taskId}`, { title: newTitle }, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        this.$root.showSnackbar('Задача обновлена', 'success');
        await this.fetchTasks();
      }
    }
  }
};
</script>
