<template>
  <v-container class="reports-detail-container">
    <v-row>
      <v-col>
        <h1 class="detail-title">Детали отчёта</h1>
        <v-progress-circular v-if="loading" indeterminate color="primary" class="loading-spinner" />
        <v-alert v-else-if="error" type="error" dense>{{ error }}</v-alert>
        <v-card v-else elevation="4" class="detail-card">
          <v-card-title class="card-title">
            Отчёт #{{ report.id }}
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <p><strong>Название:</strong> {{ report.title }}</p>
                <p><strong>Дата создания:</strong> {{ report.createdAt }}</p>
              </v-col>
              <v-col cols="12" sm="6">
                <p><strong>Статус:</strong> {{ report.status }}</p>
                <p><strong>Автор:</strong> {{ report.author }}</p>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="$router.push('/reports')">Назад к отчётам</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'ReportsDetail',
  setup() {
    const route = useRoute();
    const report = ref(null);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        const response = await fetch(`/api/reports/${route.params.id}`); // Замените на ваш API
        if (!response.ok) throw new Error('Не удалось загрузить отчёт');
        report.value = await response.json();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return { report, loading, error };
  },
};
</script>

<style scoped>
.reports-detail-container {
  padding: 20px;
}

.detail-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 2rem;
  color: #1976d2;
  margin-bottom: 20px;
}

.loading-spinner {
  display: block;
  margin: 20px auto;
}

.detail-card {
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.card-title {
  font-family: 'Gilroy-Bold', sans-serif;
  font-size: 1.5rem;
  color: #1976d2;
}

p {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1rem;
  color: #2c3e50;
  margin: 8px 0;
}

strong {
  font-family: 'Gilroy-Medium', sans-serif;
  color: #34495e;
}
</style>