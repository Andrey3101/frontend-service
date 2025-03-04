<template>
  <v-container class="dashboard-container">
    <v-row>
      <v-col>
        <h1>Дашборд</h1>
        <DndContext :collision-detection="closestCenter" @drag-end="onDragEnd">
          <DroppableWrapper droppable-id="employees">
            <v-row>
              <DraggableItem v-for="emp in employeeLoad" :key="emp.user_id" :id="emp.user_id">
                <v-card class="employee-card" v-animate-onscroll="'fadeInUp'">
                  <v-card-text>{{ emp.user_id }}: {{ emp.task_count }} задач</v-card-text>
                </v-card>
              </DraggableItem>
            </v-row>
          </DroppableWrapper>
        </DndContext>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { DndContext } from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';
import DraggableItem from '../components/DraggableItem.vue';
import DroppableWrapper from '../components/DroppableWrapper.vue';
import { getDashboard, updateEmployeeOrder } from '../api';

export default {
  components: { DndContext, DraggableItem, DroppableWrapper },
  data() {
    return {
      dashboard: {},
      employeeLoad: [],
      closestCenter,
    };
  },
  async created() {
    const data = await getDashboard();
    this.dashboard = data;
    this.employeeLoad = data.employee_load || [];
  },
  methods: {
    async onDragEnd(event) {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const items = [...this.employeeLoad];
      const oldIndex = items.findIndex((item) => item.user_id === active.id);
      const newIndex = items.findIndex((item) => item.user_id === over.id);

      const [reorderedItem] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, reorderedItem);
      this.employeeLoad = items;

      try {
        const order = this.employeeLoad.map((emp) => emp.user_id);
        await updateEmployeeOrder(order);
        console.log('Порядок успешно сохранен');
      } catch (error) {
        console.error('Ошибка сохранения порядка:', error);
        alert('Не удалось сохранить порядок');
      }
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  animation: fadeIn 0.5s ease-out;
}

.employee-card {
  background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
  padding: 15px;
  font-family: 'Gilroy-Medium', sans-serif;
  border-left: 4px solid #1976d2;
}

@media (max-width: 600px) {
  .employee-card {
    padding: 10px;
  }
}
</style>