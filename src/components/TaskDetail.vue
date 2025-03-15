<template>
  <v-container class="task-detail-container">
    <v-row>
      <v-col>
        <h1 class="detail-title animate__animated animate__fadeIn">Детали задачи</h1>

        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          size="50"
          class="loading-spinner animate__animated animate__rotateIn"
        />
        <v-alert v-else-if="error" type="error" dense class="error-alert animate__animated animate__shakeX" dismissible @input="error = null">
          {{ error }}
        </v-alert>

        <v-card v-else elevation="6" class="detail-card animate__animated animate__zoomIn">
          <v-card-title class="card-title">
            Задача #{{ task.task_id }}
            <v-spacer />
            <v-chip :color="statusColor(task.status)" small class="status-chip animate__animated animate__pulse">
              {{ task.status }}
            </v-chip>
          </v-card-title>
          <v-card-text class="card-content">
            <v-row>
              <v-col cols="12" sm="6">
                <p class="task-field"><strong>Название:</strong> {{ task.title || 'Не указано' }}</p>
                <p class="task-field"><strong>Дата создания:</strong> {{ formatDate(task.created_at) }}</p>
                <p class="task-field"><strong>Срок:</strong> {{ task.due_date || 'Не указан' }}</p>
              </v-col>
              <v-col cols="12" sm="6">
                <p class="task-field"><strong>Статус:</strong> {{ task.status || 'Не определён' }}</p>
                <p class="task-field"><strong>Исполнитель:</strong> {{ task.assignee || 'Не назначен' }}</p>
                <p class="task-field"><strong>Приоритет:</strong> {{ task.priority || 'Не указан' }}</p>
              </v-col>
            </v-row>
            <v-divider class="content-divider" v-if="task.description" />
            <p v-if="task.description" class="task-description animate__animated animate__fadeInUp">
              <strong>Описание:</strong> {{ task.description }}
            </p>
          </v-card-text>
          <v-card-actions class="card-actions">
            <v-btn color="primary" outlined @click="$router.push('/tasks')" class="action-btn back-btn">
              <v-icon left>mdi-arrow-left</v-icon> Назад
            </v-btn>
            <v-spacer />
            <v-btn color="blue" text @click="exportToPDF" class="action-btn export-btn">
              <v-icon left>mdi-file-pdf-box</v-icon> PDF
            </v-btn>
            <v-btn color="green" text @click="exportToExcel" class="action-btn export-btn">
              <v-icon left>mdi-file-excel</v-icon> XLSX
            </v-btn>
            <v-btn color="blue" text @click="showEditModal = true" class="action-btn edit-btn">
              <v-icon left>mdi-pencil</v-icon> Редактировать
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Модальное окно редактирования -->
        <edit-modal
          v-model="showEditModal"
          title="Редактировать задачу"
          :is-valid="!!editData.title"
          @save="confirmSave"
          class="animate__animated animate__zoomIn"
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
            :items="['Новая', 'В работе', 'Завершена', 'Отменена']"
            label="Статус"
            outlined
            dense
            class="input-field"
          />
          <v-autocomplete
            v-model="editData.assignee"
            :items="users"
            item-text="email"
            item-value="email"
            label="Исполнитель"
            outlined
            dense
            class="input-field"
          />
          <v-select
            v-model="editData.priority"
            :items="['Низкий', 'Средний', 'Высокий']"
            label="Приоритет"
            outlined
            dense
            class="input-field"
          />
          <v-text-field
            v-model="editData.due_date"
            label="Срок (YYYY-MM-DD)"
            outlined
            dense
            class="input-field"
            :rules="[v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) || 'Формат: YYYY-MM-DD']"
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

        <!-- Диалог подтверждения -->
        <v-dialog v-model="showConfirmDialog" max-width="400" class="confirmation-dialog">
          <v-card class="dialog-card animate__animated animate__bounceIn">
            <v-card-title class="dialog-title">Подтверждение</v-card-title>
            <v-card-text class="dialog-text">Вы уверены, что хотите сохранить изменения в задаче?</v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showConfirmDialog = false" class="dialog-btn">Отмена</v-btn>
              <v-btn color="primary" @click="saveTask" class="dialog-btn primary-btn">Сохранить</v-btn>
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
import { getTask, updateTask, getUsers } from '../api';
import EditModal from './EditModal.vue';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default {
  components: { EditModal },
  setup() {
    const route = useRoute();
    const task = ref(null);
    const users = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const showEditModal = ref(false);
    const showConfirmDialog = ref(false);
    const editData = ref({});

    onMounted(async () => {
      await fetchTask();
      await fetchUsers();
    });

    const fetchTask = async () => {
      loading.value = true;
      error.value = null;
      try {
        task.value = await getTask(route.params.taskId);
        editData.value = { ...task.value };
      } catch (err) {
        const errorMessage = err.response
          ? err.response.error || err.response.detail || err.message
          : err.message || 'Не удалось загрузить задачу';
        error.value = errorMessage;
      } finally {
        loading.value = false;
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        users.value = Array.isArray(response) ? response : [];
      } catch (err) {
        console.error('Ошибка загрузки пользователей:', err);
      }
    };

    const formatDate = (date) => {
      return date ? dayjs(date).format('DD.MM.YYYY HH:mm') : 'Не указано';
    };

    const statusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'новая': return 'blue';
        case 'в работе': return 'orange';
        case 'завершена': return 'green';
        case 'отменена': return 'red';
        default: return 'grey';
      }
    };

    const confirmSave = () => {
      if (!editData.value.title) return;
      showConfirmDialog.value = true;
      error.value = null;
    };

    const saveTask = async () => {
      loading.value = true;
      error.value = null;
      try {
        await updateTask(route.params.taskId, editData.value);
        await fetchTask();
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
      doc.text(`Задача #${task.value.task_id}`, 10, 10);

      doc.autoTable({
        startY: 20,
        head: [['Поле', 'Значение']],
        body: [
          ['Название', task.value.title || 'Не указано'],
          ['Дата создания', formatDate(task.value.created_at)],
          ['Срок', task.value.due_date || 'Не указан'],
          ['Статус', task.value.status || 'Не определён'],
          ['Исполнитель', task.value.assignee || 'Не назначен'],
          ['Приоритет', task.value.priority || 'Не указан'],
          ['Описание', task.value.description || 'Отсутствует'],
        ],
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 244, 248] },
        columnStyles: { 1: { cellWidth: 120 } },
      });

      doc.save(`task_${task.value.task_id}.pdf`);
    };

    const exportToExcel = () => {
      const data = [{
        'ID': task.value.task_id,
        'Название': task.value.title || 'Не указано',
        'Дата создания': formatDate(task.value.created_at),
        'Срок': task.value.due_date || 'Не указан',
        'Статус': task.value.status || 'Не определён',
        'Исполнитель': task.value.assignee || 'Не назначен',
        'Приоритет': task.value.priority || 'Не указан',
        'Описание': task.value.description || 'Отсутствует',
      }];
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Task');
      XLSX.writeFile(workbook, `task_${task.value.task_id}.xlsx`);
    };

    return { task, users, loading, error, showEditModal, showConfirmDialog, editData, formatDate, statusColor, confirmSave, saveTask, exportToPDF, exportToExcel };
  },
};
</script>

<style scoped>
.task-detail-container {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.detail-title {
  font-size: 2rem;
  font-weight: 500;
  color: #1976d2;
  margin-bottom: 24px;
}

.loading-spinner {
  display: block;
  margin: 40px auto;
}

.error-alert {
  margin-bottom: 20px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.detail-card {
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #333;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}

.status-chip {
  font-weight: 600;
  animation-duration: 1s;
  animation-iteration-count: infinite;
}

.card-content {
  padding: 24px;
}

.task-field {
  font-size: 1rem;
  color: #555;
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.task-field:hover {
  color: #1976d2;
}

.content-divider {
  margin: 20px 0;
  border-color: #e0e0e0;
}

.task-description {
  font-size: 1rem;
  color: #444;
  line-height: 1.6;
  background-color: #f0f4f8;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.task-description:hover {
  background-color: #e3f2fd;
}

.card-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.action-btn {
  border-radius: 6px;
  padding: 6px 16px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-btn {
  border-color: #1976d2;
}

.export-btn {
  color: #1976d2;
}

.export-btn:nth-child(2) {
  color: #388e3c;
}

.edit-btn {
  color: #1976d2;
}

.input-field {
  margin-bottom: 16px;
  border-radius: 8px;
  transition: box-shadow 0.3s ease;
}

.input-field:focus-within {
  box-shadow: 0 0 8px rgba(25, 118, 210, 0.3);
}

.dialog-card {
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  background-color: #f5f7fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-text {
  font-size: 1rem;
  color: #555;
  padding: 16px;
}

.dialog-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.dialog-btn {
  border-radius: 6px;
  padding: 6px 16px;
  transition: all 0.3s ease;
}

.dialog-btn:hover {
  transform: translateY(-1px);
}

.primary-btn {
  background-color: #1976d2;
  color: white;
}

.primary-btn:hover {
  background-color: #1565c0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Адаптивность */
@media (max-width: 600px) {
  .detail-title {
    font-size: 1.5rem;
  }

  .card-title {
    font-size: 1.25rem;
  }

  .task-field,
  .task-description {
    font-size: 0.9rem;
  }

  .action-btn {
    padding: 4px 12px;
    font-size: 0.85rem;
  }
}
</style>