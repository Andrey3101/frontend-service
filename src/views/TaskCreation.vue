<template>
  <v-container class="task-creation-container">
    <v-row>
      <v-col cols="12">
        <h1 class="page-title">Создание задачи</h1>
      </v-col>
    </v-row>
    <v-form @submit.prevent="createTask" class="task-form">
      <v-text-field
        v-model="task.title"
        label="Название задачи"
        outlined
        class="task-input"
        required
      />
      <v-textarea
        v-model="task.description"
        label="Описание"
        outlined
        rows="3"
        class="task-input"
      />
      <v-select
        v-model="task.priority"
        :items="priorities"
        label="Приоритет"
        outlined
        class="task-input"
      />
      <v-menu
        v-model="dateMenu"
        :close-on-content-click="false"
        max-width="290"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="task.dueDate"
            label="Срок выполнения"
            outlined
            readonly
            v-bind="attrs"
            v-on="on"
            class="task-input"
          />
        </template>
        <v-date-picker
          v-model="task.dueDate"
          @input="dateMenu = false"
          no-title
          scrollable
        />
      </v-menu>
      <v-btn type="submit" color="primary" class="submit-btn" :disabled="loading">
        <v-icon left>mdi-plus</v-icon>
        Создать задачу
      </v-btn>
    </v-form>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      task: {
        title: '',
        description: '',
        priority: 'Средний',
        dueDate: null,
      },
      priorities: ['Низкий', 'Средний', 'Высокий'],
      dateMenu: false,
      loading: false,
    };
  },
  methods: {
    async createTask() {
      this.loading = true;
      // Логика создания задачи
      setTimeout(() => {
        console.log('Задача создана:', this.task);
        this.loading = false;
        this.$router.push('/tasks');
      }, 1000);
    },
  },
};
</script>

<style scoped>
.task-creation-container {
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #333;
}

.task-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.task-input {
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  text-transform: none;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #1565c0;
}
</style>