<template>
  <v-container class="reports-container">
    <v-row>
      <v-col>
        <h1>Отчеты</h1>
        <v-btn color="primary" @click="showGenerateForm = true" class="create-btn">
          Сгенерировать отчет
        </v-btn>
        <v-data-table
          :headers="headers"
          :items="reports"
          item-key="id"
          class="reports-table"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn icon class="edit" @click="viewReport(item)">
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
        <!-- Диалог генерации -->
        <v-dialog v-model="showGenerateForm" max-width="600px">
          <v-card>
            <v-card-title>Генерация отчета</v-card-title>
            <v-card-text>
              <v-select v-model="reportFilter.status" :items="['Все', ...statuses]" label="Статус задач" outlined />
              <v-autocomplete
                v-model="reportFilter.assignee"
                :items="['Все', ...users.map(u => u.email)]"
                label="Исполнитель"
                outlined
              />
              <v-select v-model="reportFilter.period" :items="periods" label="Период" outlined />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showGenerateForm = false">Отмена</v-btn>
              <v-btn color="primary" @click="generateReport">Сгенерировать</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Просмотр отчета -->
        <v-dialog v-model="showReport" max-width="800px">
          <v-card>
            <v-card-title>Отчет</v-card-title>
            <v-card-text>
              <pre>{{ selectedReport?.content }}</pre>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showReport = false">Закрыть</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Окно ошибки -->
        <v-dialog v-model="showError" max-width="400px">
          <v-card class="error-dialog-card">
            <v-card-title class="error-dialog-title">Ошибка</v-card-title>
            <v-card-text class="error-dialog-text">{{ errorMessage }}</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showError = false">Закрыть</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getReports, generateReport, getUsers } from '../api';

export default {
  data() {
    return {
      reports: [],
      users: [],
      showGenerateForm: false,
      showReport: false,
      showError: false,
      errorMessage: '',
      selectedReport: null,
      reportFilter: {
        status: 'Все',
        assignee: 'Все',
        period: 'Неделя',
      },
      headers: [
        { text: 'ID', value: 'id' },
        { text: 'Дата создания', value: 'created_at' },
        { text: 'Действия', value: 'actions', sortable: false },
      ],
      statuses: ['Новая', 'В работе', 'Завершена', 'Отменена'],
      periods: ['Неделя', 'Месяц', 'Квартал'],
    };
  },
  async created() {
    await this.fetchReports();
    await this.fetchUsers();
  },
  methods: {
    async fetchReports() {
      try {
        const data = await getReports();
        this.reports = data || [];
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить отчеты: ' + error.message);
      }
    },
    async fetchUsers() {
      try {
        const data = await getUsers();
        this.users = data || [];
      } catch (error) {
        this.showErrorDialog('Не удалось загрузить пользователей: ' + error.message);
      }
    },
    async generateReport() {
      try {
        const filters = { ...this.reportFilter };
        if (filters.status === 'Все') delete filters.status;
        if (filters.assignee === 'Все') delete filters.assignee;
        await generateReport(filters);
        await this.fetchReports();
        this.showGenerateForm = false;
      } catch (error) {
        this.showErrorDialog('Не удалось сгенерировать отчет: ' + error.message);
      }
    },
    viewReport(report) {
      this.selectedReport = report;
      this.showReport = true;
    },
    showErrorDialog(message) {
      this.errorMessage = message;
      this.showError = true;
    },
  },
};
</script>

<style scoped>
.reports-table pre {
  white-space: pre-wrap;
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1rem;
  color: #2c3e50;
}
</style>