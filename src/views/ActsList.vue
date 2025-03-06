<template>
  <v-container class="acts-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Акты</h1>
        <v-list class="acts-list elevation-1">
          <v-list-item
            v-for="act in acts"
            :key="act.id"
            @click="handleUpdateAct(act.id)"
            class="act-item"
            :class="{ 'mobile-item': isMobile }"
          >
            <v-list-item-content>
              <v-list-item-title class="act-title">
                Акт ID: {{ act.id }}
              </v-list-item-title>
              <v-list-item-subtitle class="act-subtitle">
                {{ isMobile ? act.type : `Тип: ${act.type}` }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn icon class="edit-btn">
                <v-icon color="blue-grey">mdi-pencil</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
          <v-list-item v-if="!acts.length" class="empty-item">
            <v-list-item-content>
              <v-list-item-title>Нет актов</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getActs, updateAct } from '../api';

export default {
  data() {
    return {
      acts: [],
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  async created() {
    const data = await getActs();
    this.acts = data || [];
  },
  methods: {
    async handleUpdateAct(actId) {
      const newType = prompt('Введите новый тип акта:');
      if (newType) {
        try {
          const data = await updateAct(actId, { type: newType });
          alert(JSON.stringify(data, null, 2));
          const newActs = await getActs();
          this.acts = newActs || [];
        } catch (error) {
          alert('Ошибка обновления акта: ' + error.message);
        }
      }
    },
  },
};
</script>

<style scoped>
.acts-container {
  padding: 24px;
  background: #f5f7fa;
  border-radius: 12px;
  min-height: 100vh;
}

.page-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 2rem;
  color: #1e88e5;
  margin-bottom: 24px;
}

.acts-list {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.act-item {
  padding: 12px 16px;
  transition: background-color 0.2s ease;
}

.act-item:hover {
  background-color: #f0f4f8;
}

.mobile-item {
  padding: 8px 12px;
}

.act-title {
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 1.1rem;
  color: #2c3e50;
}

.act-subtitle {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 0.9rem;
  color: #546e7a;
}

.edit-btn {
  transition: transform 0.2s ease;
}

.edit-btn:hover {
  transform: scale(1.1);
}

.empty-item {
  text-align: center;
  padding: 20px;
  color: #78909c;
  font-family: 'Gilroy-Regular', sans-serif;
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }
  .act-title {
    font-size: 1rem;
  }
  .act-subtitle {
    font-size: 0.85rem;
  }
}
</style>