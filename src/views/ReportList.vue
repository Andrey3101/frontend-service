<template>
  <v-container class="reports-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Отчеты</h1>
        <v-text-field
          v-model="searchQuery"
          label="Поиск по ID или дате"
          outlined
          dense
          clearable
          prepend-inner-icon="mdi-magnify"
          class="search-field"
        />
        <v-btn color="primary" @click="showGenerateForm = true" class="create-btn elevation-2">
          <v-icon left>mdi-plus</v-icon> Сгенерировать отчет
        </v-btn>
        <v-btn-toggle v-model="exportFormat" mandatory class="export-toggle">
          <v-btn value="pdf" color="primary" class="export-btn" @click="exportToPDF">
            <v-icon left>mdi-file-pdf-box</v-icon> PDF
          </v-btn>
          <v-btn value="xlsx" color="primary" class="export-btn" @click="exportToExcel">
            <v-icon left>mdi-file-excel</v-icon> XLSX
          </v-btn>
        </v-btn-toggle>
        <v-progress-linear v-if="loading" indeterminate color="blue" class="loading-bar" />
        <v-alert v-if="error" type="error" dense class="error-alert">
          {{ error }}
        </v-alert>
        <v-data-table
          :headers="headers"
          :items="filteredReports"
          item-key="id"
          class="reports-table elevation-1"
          :items-per-page="10"
          :footer-props="{ 'items-per-page-options': [5, 10, 15, -1] }"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn icon class="action-btn" @click="viewReport(item)">
              <v-icon color="blue">mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
        <!-- Диалог генерации -->
        <v-dialog v-model="showGenerateForm" max-width="600px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Генерация отчета</v-card-title>
            <v-card-text class="dialog-content">
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
                :items="['Все', ...users.map(u => u.email)]"
                label="Исполнитель"
                outlined
                dense
                class="input-field"
              />
              <v-select
                v-model="reportFilter.period"
                :items="periods"
                label="Период"
                outlined
                dense
                class="input-field"
              />
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showGenerateForm = false">Отмена</v-btn>
              <v-btn color="primary" class="action-btn-primary" @click="generateReport">Сгенерировать</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Просмотр отчета -->
        <v-dialog v-model="showReport" max-width="800px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Отчет</v-card-title>
            <v-card-text class="report-content">
              <pre>{{ selectedReport?.content }}</pre>
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showReport = false">Закрыть</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getReports, generateReport, getUsers } from '../api';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      reports: [],
      users: [],
      loading: false,
      error: null,
      searchQuery: '',
      showGenerateForm: false,
      showReport: false,
      selectedReport: null,
      exportFormat: 'pdf',
      reportFilter: {
        status: 'Все',
        assignee: 'Все',
        period: 'Неделя',
      },
      headers: [
        { text: 'ID', value: 'id', width: '10%' },
        { text: 'Дата создания', value: 'created_at', width: '70%' },
        { text: 'Действия', value: 'actions', sortable: false, width: '20%' },
      ],
      statuses: ['Новая', 'В работе', 'Завершена', 'Отменена'],
      periods: ['Неделя', 'Месяц', 'Квартал'],
    };
  },
  computed: {
    filteredReports() {
      if (!this.searchQuery) return this.reports;
      const query = this.searchQuery.toLowerCase();
      return this.reports.filter(
        (report) =>
          report.id.toString().includes(query) ||
          report.created_at.toLowerCase().includes(query)
      );
    },
  },
  async created() {
    await this.fetchReports();
    await this.fetchUsers();
  },
  methods: {
    async fetchReports() {
      this.loading = true;
      this.error = null;
      try {
        const data = await getReports();
        this.reports = Array.isArray(data) ? data : [];
      } catch (error) {
        this.error = error.message || 'Не удалось загрузить отчеты';
      } finally {
        this.loading = false;
      }
    },
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const data = await getUsers();
        this.users = Array.isArray(data) ? data : [];
      } catch (error) {
        this.error = error.message || 'Не удалось загрузить пользователей';
      } finally {
        this.loading = false;
      }
    },
    async generateReport() {
      this.loading = true;
      this.error = null;
      try {
        const filters = { ...this.reportFilter };
        if (filters.status === 'Все') delete filters.status;
        if (filters.assignee === 'Все') delete filters.assignee;
        await generateReport(filters);
        await this.fetchReports();
        this.showGenerateForm = false;
      } catch (error) {
        this.error = error.message || 'Не удалось сгенерировать отчет';
      } finally {
        this.loading = false;
      }
    },
    viewReport(report) {
      this.selectedReport = report;
      this.showReport = true;
    },
    exportToPDF() {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(12);
      doc.text('Список отчетов', 10, 10);
      this.filteredReports.forEach((report, index) => {
        const y = 20 + index * 10;
        doc.text(`ID: ${report.id} | Дата: ${report.created_at}`, 10, y);
      });
      doc.save('reports.pdf');
    },
    exportToExcel() {
      const worksheet = XLSX.utils.json_to_sheet(
        this.filteredReports.map((report) => ({
          'ID': report.id,
          'Дата создания': report.created_at,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
      XLSX.writeFile(workbook, 'reports.xlsx');
    },
  },
};
</script>

<style scoped>
.reports-container {
  padding: 24px;
  background: #f5f7fa;
  border-radius: 12px;
  min-height: 100vh;
}

.page-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 2rem;
  color: #1e88e5;
  margin-bottom: 20px;
}

.search-field {
  max-width: 400px;
  margin-bottom: 20px;
  font-family: 'Gilroy-Regular', sans-serif;
}

.create-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 10px 20px;
  margin-right: 16px;
  margin-bottom: 20px;
  transition: transform 0.2s ease;
}

.create-btn:hover {
  transform: translateY(-2px);
}

.export-toggle {
  margin-bottom: 20px;
}

.export-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
  transition: transform 0.2s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
}

.loading-bar {
  margin-bottom: 20px;
}

.reports-table {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.action-btn {
  transition: transform 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.dialog-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.dialog-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 1.5rem;
  color: #1e88e5;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-content {
  padding: 24px;
}

.input-field {
  margin-bottom: 16px;
  font-family: 'Gilroy-Regular', sans-serif;
}

.dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.action-btn-primary {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
}

.report-content pre {
  white-space: pre-wrap;
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1rem;
  color: #2c3e50;
  background: #f0f4f8;
  padding: 16px;
  border-radius: 8px;
}

.error-dialog-card {
  background: #fff3f3;
  border-radius: 12px;
}

.error-dialog-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 1.25rem;
  color: #d32f2f;
}

.error-dialog-text {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1rem;
  color: #b71c1c;
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }
  .create-btn, .export-btn {
    width: 100%;
    margin-bottom: 10px;
  }
  .search-field {
    max-width: 100%;
  }
}
</style>