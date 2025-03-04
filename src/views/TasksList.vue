<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Мои задачи</h1>
        <v-list>
          <v-list-item v-for="task in tasks" :key="task.task_id">
            <v-list-item-content>
              <v-list-item-title>{{ task.title }}</v-list-item-title>
              <v-list-item-subtitle v-if="isMobile">
                {{ task.status }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else>
                Статус: {{ task.status }} | Срок: {{ task.due_date }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getMyTasks } from '../api';

export default {
  data() {
    return {
      tasks: [],
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  async created() {
    const data = await getMyTasks();
    this.tasks = data.tasks || [];
  },
};
</script>

<style scoped>
h1 {
  margin-bottom: 20px;
}
</style>