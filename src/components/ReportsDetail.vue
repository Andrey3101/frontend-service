<template>
  <v-container class="reports-detail-container">
    <v-row>
      <v-col>
        <h1 class="detail-title">Детали отчёта</h1>

        <v-progress-circular v-if="loading" indeterminate color="primary" size="50" class="loading-spinner" />
        <v-alert v-else-if="error" type="error" dense class="error-alert">{{ error }}</v-alert>

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
            <v-btn color="primary" outlined @click="$router.push('/reports')" class="action-btn">
              <v-icon left>mdi-arrow-left</v-icon> Назад
            </v-btn>
            <v-spacer />
            <v-btn color="blue" text @click="exportToPDF" class="action-btn">
              <v-icon left>mdi-file-pdf-box</v-icon> PDF
            </v-btn>
            <v-btn color="green" text @click="exportToExcel" class="action-btn">
              <v-icon left>mdi-file-excel</v-icon> XLSX
            </v-btn>
            <v-btn color="blue" text @click="showEditModal = true" class="action-btn">
              <v-icon left>mdi-pencil</v-icon> Редактировать
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Модальное окно редактирования -->
        <edit-modal
          v-model="showEditModal"
          title="Редактировать отчёт"
          :is-valid="!!editData.title"
          @save="confirmSave"
        >
          <v-text-field
            v-model="editData.title"
            label="Название"
            outlined
            dense
            class="input-field"
          />
          <v-select
            v-model="editData.status"
            :items="['Новый', 'В работе', 'Завершён']"
            label="Статус"
            outlined
            dense
            class="input-field"
          />
          <v-text-field
            v-model="editData.author"
            label="Автор"
            outlined
            dense
            class="input-field"
          />
          <v-textarea
            v-model="editData.content"
            label="Содержимое"
            outlined
            dense
            rows="4"
            class="input-field"
          />
        </edit-modal>

        <!-- Диалог подтверждения -->
        <v-dialog v-model="showConfirmDialog" max-width="400">
          <v-card>
            <v-card-title class="headline">Подтверждение</v-card-title>
            <v-card-text>Вы уверены, что хотите сохранить изменения в отчёте?</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showConfirmDialog = false">Отмена</v-btn>
              <v-btn color="primary" @click="saveReport">Сохранить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getReport, updateReport } from '../api';  // Импортируем исправленные функции
import EditModal from './EditModal.vue';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default {
  components: { EditModal },
  setup() {
    const route = useRoute();
    const report = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const showEditModal = ref(false);
    const showConfirmDialog = ref(false);
    const editData = ref({});

    onMounted(async () => {
      await fetchReport();
    });

    const fetchReport = async () => {
      loading.value = true;
      try {
        const response = await getReport(route.params.id);  // Используем getReport
        report.value = response;
        editData.value = {
          title: response.title,
          status: response.status,
          author: response.responsible,  // Приводим responsible к author
          content: response.description  // Приводим description к content
        };
      } catch (err) {
        error.value = err.response?.data?.detail || err.message || 'Не удалось загрузить отчёт';
      } finally {
        loading.value = false;
      }
    };

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

    const confirmSave = () => {
      if (!editData.value.title) return;
      showConfirmDialog.value = true;
    };

    const saveReport = async () => {
      loading.value = true;
      error.value = null;
      try {
        await updateReport(route.params.id, editData.value);  // Используем updateReport
        await fetchReport();
        showEditModal.value = false;
        showConfirmDialog.value = false;
      } catch (err) {
        error.value = err.response?.data?.detail || err.message || 'Не удалось сохранить изменения';
      } finally {
        loading.value = false;
      }
    };

    const exportToPDF = () => {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(14);
      doc.text(`Отчёт #${report.value.id}`, 10, 10);

      doc.autoTable({
        startY: 20,
        head: [['Поле', 'Значение']],
        body: [
          ['Название', report.value.title || 'Не указано'],
          ['Дата создания', formatDate(report.value.created_at)],
          ['Статус', report.value.status || 'Не определён'],
          ['Автор', report.value.responsible || 'Не указан'],  // Используем responsible как author
          ['Содержимое', report.value.description || 'Отсутствует'],  // Используем description как content
        ],
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 244, 248] },
        columnStyles: { 1: { cellWidth: 120 } },
      });

      doc.save(`report_${report.value.id}.pdf`);
    };

    const exportToExcel = () => {
      const data = [{
        'ID': report.value.id,
        'Название': report.value.title || 'Не указано',
        'Дата создания': formatDate(report.value.created_at),
        'Статус': report.value.status || 'Не определён',
        'Автор': report.value.responsible || 'Не указан',
        'Содержимое': report.value.description || 'Отсутствует',
      }];
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `report_${report.value.id}.xlsx`);
    };

    return { report, loading, error, showEditModal, showConfirmDialog, editData, formatDate, statusColor, confirmSave, saveReport, exportToPDF, exportToExcel };
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