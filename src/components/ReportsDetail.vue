<template>
  <v-container class="reports-detail-container">
    <v-row>
      <v-col>
        <h1 class="detail-title">Детали отчёта</h1>

        <!-- Индикатор загрузки -->
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          size="50"
          class="loading-spinner"
        />

        <!-- Ошибка -->
        <v-alert
          v-else-if="error"
          type="error"
          dense
          class="error-alert"
          icon="mdi-alert-circle"
        >
          {{ error }}
        </v-alert>

        <!-- Карточка отчёта -->
        <v-card v-else elevation="4" class="detail-card animate__animated animate__fadeInUp">
          <v-card-title class="card-title">
            Отчёт #{{ report.id }}
            <v-spacer />
            <v-chip :color="statusColor(report.status)" small class="status-chip">
              {{ report.status }}
            </v-chip>
          </v-card-title>
          <v-card-text class="card-content">
            <v-row>
              <v-col cols="12" sm="6">
                <p><strong>Название:</strong> {{ report.title || 'Не указано' }}</p>
                <p><strong>Дата создания:</strong> {{ formatDate(report.created_at) }}</p>
              </v-col>
              <v-col cols="12" sm="6">
                <p><strong>Статус:</strong> {{ report.status || 'Не определён' }}</p>
                <p><strong>Автор:</strong> {{ report.author || 'Не указан' }}</p>
              </v-col>
            </v-row>
            <v-divider class="content-divider" />
            <p class="report-body"><strong>Содержимое:</strong> {{ report.content || 'Отсутствует' }}</p>
          </v-card-text>
          <v-card-actions class="card-actions">
            <v-btn
              color="primary"
              outlined
              class="action-btn"
              @click="$router.push('/reports')"
            >
              <v-icon left>mdi-arrow-left</v-icon> Назад к отчётам
            </v-btn>
            <v-spacer />
            <v-btn color="blue" text @click="editReport" class="action-btn">
              <v-icon left>mdi-pencil</v-icon> Редактировать
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getReports } from '../api';
import dayjs from 'dayjs';

export default {
  name: 'ReportsDetail',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const report = ref(null);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        const reports = await getReports();
        report.value = reports.find((r) => r.id === Number(route.params.id));
        if (!report.value) throw new Error('Отчёт не найден');
      } catch (err) {
        error.value = err.message || 'Не удалось загрузить отчёт';
      } finally {
        loading.value = false;
      }
    });

    const formatDate = (date) => {
      return date ? dayjs(date).format('DD.MM.YYYY HH:mm') : 'Не указано';
    };

    const statusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'новый': return 'blue';
        case 'в работе': return 'orange';
        case 'завершён': return 'green';
        default: return 'grey';
      }
    };

    const editReport = () => {
      router.push(`/reports/${route.params.id}/edit`); // Предполагается маршрут для редактирования
    };

    return { report, loading, error, formatDate, statusColor, editReport };
  },
};
</script>

<style scoped>
.reports-detail-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.detail-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 2.25rem;
  color: #1976d2;
  margin-bottom: 24px;
  text-align: center;
}

.loading-spinner {
  display: block;
  margin: 40px auto;
}

.error-alert {
  font-family: 'Gilroy-Regular', sans-serif;
  border-radius: 8px;
  margin: 20px 0;
}

.detail-card {
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-family: 'Gilroy-Bold', sans-serif;
  font-size: 1.75rem;
  color: #1976d2;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
}

.status-chip {
  font-family: 'Gilroy-Medium', sans-serif;
  color: white;
}

.card-content p {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 12px 0;
}

.card-content strong {
  font-family: 'Gilroy-Medium', sans-serif;
  color: #34495e;
}

.content-divider {
  margin: 16px 0;
}

.report-body {
  background: #f0f4f8;
  padding: 16px;
  border-radius: 8px;
  white-space: pre-wrap;
}

.card-actions {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.action-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

@media (max-width: 600px) {
  .detail-title {
    font-size: 1.75rem;
  }
  .card-title {
    font-size: 1.5rem;
  }
  .card-content p {
    font-size: 1rem;
  }
}
</style>