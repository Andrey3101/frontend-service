<template>
  <v-container class="acts-detail-container">
    <v-row>
      <v-col>
        <h1 class="detail-title">Детали акта</h1>
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          size="50"
          class="loading-spinner"
        />
        <v-alert v-else-if="error" type="error" dense class="error-alert" dismissible @input="error = null">
          {{ error }}
        </v-alert>
        <v-card v-else elevation="4" class="detail-card animate__animated animate__fadeInUp">
          <v-card-title class="card-title">
            Акт #{{ act.id }}
            <v-spacer />
            <v-chip :color="statusColor(act.status)" small class="status-chip">
              {{ act.status }}
            </v-chip>
          </v-card-title>
          <v-card-text class="card-content">
            <v-row>
              <v-col cols="12" sm="6">
                <p><strong>Название:</strong> {{ act.title || 'Не указано' }}</p>
                <p><strong>Дата создания:</strong> {{ formatDate(act.created_at) }}</p>
              </v-col>
              <v-col cols="12" sm="6">
                <p><strong>Статус:</strong> {{ act.status || 'Не определён' }}</p>
                <p><strong>Ответственный:</strong> {{ act.responsible || 'Не назначен' }}</p>
              </v-col>
            </v-row>
            <v-divider class="content-divider" v-if="act.description" />
            <p v-if="act.description" class="act-description"><strong>Описание:</strong> {{ act.description }}</p>
          </v-card-text>
          <v-card-actions class="card-actions">
            <v-btn color="primary" outlined @click="$router.push('/acts')" class="action-btn">
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
          title="Редактировать акт"
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
            v-model="editData.responsible"
            label="Ответственный"
            outlined
            dense
            class="input-field"
          />
          <v-textarea
            v-model="editData.description"
            label="Описание"
            outlined
            dense
            rows="3"
            class="input-field"
          />
        </edit-modal>
        <!-- Диалог подтверждения редактирования -->
        <v-dialog v-model="showConfirmDialog" max-width="400" class="custom-dialog">
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Подтверждение</v-card-title>
            <v-card-text class="dialog-text">Вы уверены, что хотите сохранить изменения в акте?</v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showConfirmDialog = false" class="dialog-btn">Отмена</v-btn>
              <v-btn color="primary" @click="saveAct" class="dialog-btn primary-btn">Сохранить</v-btn>
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
import { getAct, updateAct } from '../api';
import EditModal from './EditModal.vue';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default {
  components: { EditModal },
  setup() {
    const route = useRoute();
    const act = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const showEditModal = ref(false);
    const showConfirmDialog = ref(false);
    const editData = ref({});

    onMounted(async () => {
      await fetchAct();
    });

    const fetchAct = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await getAct(route.params.id);
        act.value = response;
        editData.value = { ...act.value };
      } catch (err) {
        const errorMessage = err.response?.error || err.response?.detail || err.message || 'Не удалось загрузить акт';
        error.value = errorMessage;
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
      error.value = null;
    };

    const saveAct = async () => {
      loading.value = true;
      error.value = null;
      try {
        await updateAct(route.params.id, editData.value);
        await fetchAct();
        showEditModal.value = false;
        showConfirmDialog.value = false;
      } catch (err) {
        const errorMessage = err.response
          ? err.response.error || err.response.detail || err.message
          : err.message || 'Не удалось сохранить изменения';
        error.value = errorMessage;
      } finally {
        loading.value = false;
      }
    };

    const exportToPDF = () => {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(14);
      doc.text(`Акт #${act.value.id}`, 10, 10);

      doc.autoTable({
        startY: 20,
        head: [['Поле', 'Значение']],
        body: [
          ['Название', act.value.title || 'Не указано'],
          ['Дата создания', formatDate(act.value.created_at)],
          ['Статус', act.value.status || 'Не определён'],
          ['Ответственный', act.value.responsible || 'Не назначен'],
          ['Описание', act.value.description || 'Отсутствует'],
        ],
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 244, 248] },
        columnStyles: { 1: { cellWidth: 120 } },
      });

      doc.save(`act_${act.value.id}.pdf`);
    };

    const exportToExcel = () => {
      const data = [{
        'ID': act.value.id,
        'Название': act.value.title || 'Не указано',
        'Дата создания': formatDate(act.value.created_at),
        'Статус': act.value.status || 'Не определён',
        'Ответственный': act.value.responsible || 'Не назначен',
        'Описание': act.value.description || 'Отсутствует',
      }];
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Act');
      XLSX.writeFile(workbook, `act_${act.value.id}.xlsx`);
    };

    return { act, loading, error, showEditModal, showConfirmDialog, editData, formatDate, statusColor, confirmSave, saveAct, exportToPDF, exportToExcel };
  },
};
</script>

<style scoped>
.acts-detail-container {
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

.error-close-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
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

.act-description {
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

/* Стили для диалога */
.dialog-card {
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.dialog-title {
  font-family: 'Gilroy-Bold', sans-serif;
  font-size: 1.5rem;
  color: #1976d2;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-text {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1.1rem;
  color: #2c3e50;
  padding: 20px 24px;
}

.dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.dialog-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
  transition: transform 0.2s ease;
}

.dialog-btn:hover {
  transform: translateY(-2px);
}

.primary-btn {
  background-color: #1976d2;
  color: white !important;
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
  .dialog-title {
    font-size: 1.25rem;
  }
  .dialog-text {
    font-size: 1rem;
  }
}
</style>