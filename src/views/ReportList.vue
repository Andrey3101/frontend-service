<template>
  <v-container class="reports-container">
    <v-row>
      <v-col>
        <!-- Уведомления -->
        <v-snackbar
          v-model="snackbar.show"
          :timeout="snackbar.timeout"
          :color="snackbar.color"
          top
          right
          elevation="24"
        >
          <div class="snackbar-content">
            <v-icon left>{{ snackbar.icon }}</v-icon>
            <div>
              <div class="snackbar-title">{{ snackbar.title }}</div>
              <div class="snackbar-message">{{ snackbar.message }}</div>
            </div>
          </div>
          <template v-slot:action="{ attrs }">
            <v-btn
              icon
              v-bind="attrs"
              @click="snackbar.show = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-snackbar>

        <h1 class="page-title">Отчеты</h1>

        <div class="controls-wrapper">
          <!-- Поиск и фильтры -->
          <v-text-field
            v-model="searchQuery"
            label="Поиск по ID или дате"
            outlined
            dense
            clearable
            prepend-inner-icon="mdi-magnify"
            class="search-field"
            :error-messages="fieldErrors.search"
          />

          <div class="action-buttons">
            <v-btn 
              color="primary" 
              @click="showGenerateForm = true" 
              class="create-btn"
              :loading="loading"
            >
              <v-icon left>mdi-plus</v-icon> 
              <span class="btn-text">Создать отчет</span>
            </v-btn>

            <v-btn-toggle v-model="exportFormat" mandatory>
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn 
                    value="pdf" 
                    color="primary" 
                    class="export-btn"
                    @click="exportToPDF"
                    :loading="exportLoading.pdf"
                    v-on="on"
                  >
                    <v-icon left>mdi-file-pdf-box</v-icon>
                    <span class="btn-text">PDF</span>
                  </v-btn>
                </template>
                <span>Экспортировать в PDF</span>
              </v-tooltip>

              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn 
                    value="xlsx" 
                    color="primary" 
                    class="export-btn"
                    @click="exportToExcel"
                    :loading="exportLoading.xlsx"
                    v-on="on"
                  >
                    <v-icon left>mdi-file-excel</v-icon>
                    <span class="btn-text">Excel</span>
                  </v-btn>
                </template>
                <span>Экспортировать в Excel</span>
              </v-tooltip>
            </v-btn-toggle>
          </div>
        </div>

        <!-- Индикатор загрузки -->
        <v-progress-linear 
          v-if="loading" 
          indeterminate 
          color="blue" 
          class="loading-bar"
        />

        <!-- Таблица отчетов -->
        <v-data-table
          :headers="headers"
          :items="filteredReports"
          :search="searchQuery"
          :loading="loading"
          loading-text="Загрузка отчетов..."
          no-data-text="Нет отчетов для отображения"
          class="reports-table"
          :items-per-page="10"
          :footer-props="{
            'items-per-page-options': [5, 10, 20, -1],
            'show-current-page': true
          }"
        >
          <template v-slot:item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip small :color="getStatusColor(item.status)">
              {{ item.status }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn 
                  icon 
                  small 
                  @click="viewReport(item)"
                  v-on="on"
                  :loading="item.loading"
                >
                  <v-icon color="primary">mdi-eye</v-icon>
                </v-btn>
              </template>
              <span>Просмотреть отчет</span>
            </v-tooltip>

            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn 
                  icon 
                  small 
                  @click="downloadReport(item)"
                  v-on="on"
                  :loading="item.downloading"
                >
                  <v-icon color="green">mdi-download</v-icon>
                </v-btn>
              </template>
              <span>Скачать отчет</span>
            </v-tooltip>
          </template>
        </v-data-table>

        <!-- Диалог генерации отчета -->
        <v-dialog v-model="showGenerateForm" max-width="600px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              <v-icon left>mdi-file-document-edit</v-icon>
              Создание отчета
            </v-card-title>
            
            <v-card-text class="dialog-content">
              <v-form ref="generateForm" v-model="generateValid">
                <v-select
                  v-model="reportFilter.type"
                  :items="reportTypes"
                  label="Тип отчета"
                  outlined
                  dense
                  :rules="[v => !!v || 'Выберите тип отчета']"
                  class="input-field"
                />

                <v-select
                  v-model="reportFilter.status"
                  :items="['Все', ...statuses]"
                  label="Статус задач"
                  outlined
                  dense
                  class="input-field"
                />

                <v-autocomplete
                  v-model="reportFilter.assignee"
                  :items="users"
                  item-text="email"
                  item-value="id"
                  label="Исполнитель"
                  outlined
                  dense
                  clearable
                  class="input-field"
                />

                <v-menu
                  v-model="dateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="reportFilter.dateRange"
                      label="Период"
                      prepend-icon="mdi-calendar"
                      readonly
                      outlined
                      dense
                      v-bind="attrs"
                      v-on="on"
                      :rules="[v => !!v || 'Укажите период']"
                      class="input-field"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="reportFilter.dateRange"
                    range
                    no-title
                    scrollable
                  ></v-date-picker>
                </v-menu>
              </v-form>
            </v-card-text>

            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn 
                color="grey" 
                text 
                @click="cancelGenerate"
                :disabled="generating"
              >
                Отмена
              </v-btn>
              <v-btn 
                color="primary" 
                @click="generateReport"
                :loading="generating"
                :disabled="!generateValid"
              >
                Создать
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог просмотра отчета -->
        <v-dialog v-model="showReport" max-width="800px" persistent scrollable>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              Отчет #{{ selectedReport?.id }}
              <v-spacer />
              <v-btn 
                icon 
                @click="downloadReport(selectedReport)"
                :loading="selectedReport?.downloading"
              >
                <v-icon>mdi-download</v-icon>
              </v-btn>
            </v-card-title>
            
            <v-card-text class="report-content">
              <div v-if="selectedReport?.content" class="report-html" v-html="selectedReport.content"></div>
              <div v-else class="no-content">
                <v-icon large color="grey">mdi-file-document-alert</v-icon>
                <p>Содержимое отчета недоступно</p>
              </div>
            </v-card-text>

            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showReport = false">
                Закрыть
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { getReports, generateReport, getReport, getUsers } from '@/api';
import { useAuthStore } from '@/stores/auth';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';

export default {
  name: 'ReportList',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const authStore = useAuthStore();
    const generateForm = ref(null);

    const reports = ref([]);
    const users = ref([]);
    const loading = ref(false);
    const generating = ref(false);
    const searchQuery = ref('');
    const showGenerateForm = ref(false);
    const showReport = ref(false);
    const dateMenu = ref(false);
    const generateValid = ref(false);
    const selectedReport = ref(null);
    const exportFormat = ref('pdf');
    const exportLoading = ref({
      pdf: false,
      xlsx: false
    });
    const reportFilter = ref({
      type: 'tasks',
      status: 'Все',
      assignee: null,
      dateRange: [dayjs().subtract(1, 'week').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
    });
    const fieldErrors = ref({});

    const headers = ref([
      { text: 'ID', value: 'id', width: '100px' },
      { text: 'Тип', value: 'type', width: '120px' },
      { text: 'Статус', value: 'status', width: '120px' },
      { text: 'Дата создания', value: 'created_at' },
      { text: 'Действия', value: 'actions', sortable: false, width: '180px', align: 'right' }
    ]);

    const reportTypes = ref([
      { text: 'Отчет по задачам', value: 'tasks' },
      { text: 'Отчет по времени', value: 'time' },
      { text: 'Финансовый отчет', value: 'financial' }
    ]);

    const statuses = ref(['Новая', 'В работе', 'Завершена', 'Отменена']);

    const snackbar = ref({
      show: false,
      title: '',
      message: '',
      color: 'error',
      icon: 'mdi-alert-circle',
      timeout: 6000
    });

    const isAdmin = computed(() => authStore.user?.role === 'admin');

    const filteredReports = computed(() => {
      return reports.value.map(report => ({
        ...report,
        loading: false,
        downloading: false
      }));
    });

    const formattedDateRange = computed(() => {
      if (!reportFilter.value.dateRange || reportFilter.value.dateRange.length < 2) 
        return null;
      
      return {
        start: reportFilter.value.dateRange[0],
        end: reportFilter.value.dateRange[1] || reportFilter.value.dateRange[0]
      };
    });

    const loadData = async () => {
      loading.value = true;
      try {
        await Promise.all([fetchReports(), fetchUsers()]);
      } catch (error) {
        handleError('Ошибка загрузки данных', 'Не удалось загрузить данные отчетов', error);
      } finally {
        loading.value = false;
      }
    };

    const fetchReports = async () => {
      try {
        const response = await getReports();
        reports.value = response.map(report => ({
          id: report.id,
          type: getReportType(report.type),
          status: report.status,
          created_at: report.created_at,
          content: report.content
        }));
      } catch (error) {
        throw error;
      }
    };

    const fetchUsers = async () => {
      try {
        users.value = await getUsers();
      } catch (error) {
        throw error;
      }
    };

    const getReportType = (type) => {
      const types = {
        'tasks': 'Задачи',
        'time': 'Время',
        'financial': 'Финансы'
      };
      return types[type] || type;
    };

    const getStatusColor = (status) => {
      const colors = {
        'Готов': 'success',
        'В обработке': 'warning',
        'Ошибка': 'error'
      };
      return colors[status] || 'grey';
    };

    const formatDate = (date) => {
      return dayjs(date).format('DD.MM.YYYY HH:mm');
    };

    const generateReport = async () => {
      if (!generateForm.value.validate()) return;
      
      generating.value = true;
      const params = {
        type: reportFilter.value.type,
        filters: {
          status: reportFilter.value.status === 'Все' ? null : reportFilter.value.status,
          assignee_id: reportFilter.value.assignee,
          date_from: formattedDateRange.value?.start,
          date_to: formattedDateRange.value?.end
        }
      };

      try {
        await generateReport(params);
        await fetchReports();
        showGenerateForm.value = false;
        showSuccess('Успешно', 'Отчет успешно создан');
      } catch (error) {
        handleError('Ошибка создания отчета', 'Не удалось создать отчет', error);
      } finally {
        generating.value = false;
      }
    };

    const cancelGenerate = () => {
      showGenerateForm.value = false;
      generateForm.value?.reset();
    };

    const viewReport = async (report) => {
      report.loading = true;
      try {
        const response = await getReport(report.id);
        selectedReport.value = {
          ...report,
          content: response.content || 'Нет содержимого'
        };
        showReport.value = true;
      } catch (error) {
        handleError('Ошибка просмотра отчета', 'Не удалось загрузить содержимое отчета', error);
      } finally {
        report.loading = false;
      }
    };

    const downloadReport = async (report) => {
      report.downloading = true;
      try {
        const response = await getReport(report.id);
        const doc = new jsPDF();
        doc.setFont('helvetica');
        doc.setFontSize(12);
        
        doc.text(`Отчет #${report.id}`, 10, 10);
        doc.setFontSize(10);
        doc.text(`Тип: ${report.type}`, 10, 20);
        doc.text(`Статус: ${report.status}`, 10, 30);
        doc.text(`Дата создания: ${formatDate(report.created_at)}`, 10, 40);
        
        if (response.content) {
          doc.setFontSize(10);
          const contentLines = doc.splitTextToSize(response.content.replace(/<[^>]+>/g, ''), 180);
          let y = 50;
          contentLines.forEach(line => {
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
            doc.text(line, 10, y);
            y += 10;
          });
        }
        
        doc.save(`report_${report.id}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
        showSuccess('Успешно', 'Отчет скачан');
      } catch (error) {
        handleError('Ошибка скачивания отчета', 'Не удалось скачать отчет', error);
      } finally {
        report.downloading = false;
        if (selectedReport.value?.id === report.id) {
          selectedReport.value.downloading = false;
        }
      }
    };

    const exportToPDF = async () => {
      exportLoading.value.pdf = true;
      try {
        const doc = new jsPDF();
        doc.setFont('helvetica');
        doc.setFontSize(12);
        
        doc.text('Список отчетов', 10, 10);
        doc.setFontSize(10);
        doc.text(`Сформировано: ${dayjs().format('DD.MM.YYYY HH:mm')}`, 10, 18);
        
        let y = 30;
        filteredReports.value.forEach(report => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(`ID: ${report.id}`, 10, y);
          doc.text(`Тип: ${report.type}`, 50, y);
          doc.text(`Дата: ${formatDate(report.created_at)}`, 120, y);
          y += 10;
        });
        
        doc.save(`reports_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
        showSuccess('Успешно', 'PDF экспортирован');
      } catch (error) {
        handleError('Ошибка экспорта в PDF', 'Не удалось экспортировать в PDF', error);
      } finally {
        exportLoading.value.pdf = false;
      }
    };

    const exportToExcel = async () => {
      exportLoading.value.xlsx = true;
      try {
        const worksheet = XLSX.utils.json_to_sheet(
          filteredReports.value.map(report => ({
            'ID': report.id,
            'Тип': report.type,
            'Статус': report.status,
            'Дата создания': formatDate(report.created_at)
          }))
        );
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчеты');
        XLSX.writeFile(workbook, `reports_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
        showSuccess('Успешно', 'Excel экспортирован');
      } catch (error) {
        handleError('Ошибка экспорта в Excel', 'Не удалось экспортировать в Excel', error);
      } finally {
        exportLoading.value.xlsx = false;
      }
    };

    const handleError = (title, message, error) => {
      console.error(title, error);
      
      let detailedMessage = message;
      if (error.response) {
        switch(error.response.status) {
          case 400:
            if (error.response.data?.errors) {
              fieldErrors.value = error.response.data.errors;
              detailedMessage = 'Проверьте правильность введенных данных';
            }
            break;
          case 401:
            detailedMessage = 'Требуется авторизация';
            router.push('/login');
            break;
          case 402:
            detailedMessage = 'Подписка истекла. Оформите подписку для продолжения.';
            router.push('/subscription');
            break;
          case 403:
            detailedMessage = 'Доступ запрещен';
            break;
          case 404:
            detailedMessage = 'Данные не найдены';
            break;
          case 500:
            detailedMessage = 'Ошибка сервера';
            break;
          default:
            detailedMessage = error.response.data?.message || error.response.data?.detail || message;
        }
      } else if (error.message) {
        detailedMessage = error.message;
      }
      
      showSnackbar(title, detailedMessage, 'error');
    };

    const showSuccess = (title, message) => {
      showSnackbar(title, message, 'success');
    };

    const showSnackbar = (title, message, type = 'info') => {
      const icons = {
        error: 'mdi-alert-circle',
        success: 'mdi-check-circle',
        info: 'mdi-information'
      };
      
      const colors = {
        error: 'error',
        success: 'success',
        info: 'info'
      };
      
      snackbar.value = {
        show: true,
        title,
        message,
        color: colors[type],
        icon: icons[type],
        timeout: type === 'error' ? 6000 : 4000
      };
    };

    loadData();

    return {
      reports,
      users,
      loading,
      generating,
      searchQuery,
      showGenerateForm,
      showReport,
      dateMenu,
      generateValid,
      selectedReport,
      exportFormat,
      exportLoading,
      reportFilter,
      headers,
      reportTypes,
      statuses,
      snackbar,
      fieldErrors,
      isAdmin,
      filteredReports,
      formattedDateRange,
      loadData,
      fetchReports,
      fetchUsers,
      getReportType,
      getStatusColor,
      formatDate,
      generateReport,
      cancelGenerate,
      viewReport,
      downloadReport,
      exportToPDF,
      exportToExcel,
      handleError,
      showSuccess,
      showSnackbar,
      generateForm,
      router
    };
  }
};
</script>

<style scoped>
.reports-container {
  max-width: 1400px;
  padding: 24px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 24px;
  text-align: center;
}

.controls-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.search-field {
  flex: 1;
  min-width: 300px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.create-btn, .export-btn {
  font-weight: 500;
  letter-spacing: 0.5px;
  border-radius: 8px;
  height: 40px;
}

.btn-text {
  margin-left: 8px;
}

.loading-bar {
  margin-bottom: 16px;
}

.reports-table {
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.dialog-card {
  border-radius: 12px;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1976d2;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.dialog-content {
  padding: 16px;
}

.input-field {
  margin-bottom: 16px;
}

.dialog-actions {
  padding: 16px;
  border-top: 1px solid #eee;
}

.report-content {
  padding: 16px;
}

.report-html {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  max-height: 60vh;
  overflow-y: auto;
}

.no-content {
  text-align: center;
  padding: 40px 0;
  color: #757575;
}

.snackbar-content {
  display: flex;
  align-items: center;
}

.snackbar-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.snackbar-message {
  font-size: 0.9rem;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .controls-wrapper {
    flex-direction: column;
  }
  
  .search-field {
    width: 100%;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .create-btn, .export-btn {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .reports-container {
    padding: 16px;
  }
  
  .btn-text {
    display: none;
  }
}
</style>