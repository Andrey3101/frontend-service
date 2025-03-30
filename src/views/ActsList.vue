<template>
  <v-container class="acts-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Акты</h1>
        <v-text-field
          v-model="searchQuery"
          label="Поиск по ID или типу"
          outlined
          dense
          clearable
          prepend-inner-icon="mdi-magnify"
          class="search-field"
        />
        <v-btn-toggle v-model="exportFormat" mandatory class="export-toggle">
          <v-btn value="pdf" color="primary" class="export-btn" @click="exportToPDF">
            <v-icon left>mdi-file-pdf-box</v-icon> PDF
          </v-btn>
          <v-btn value="xlsx" color="primary" class="export-btn" @click="exportToExcel">
            <v-icon left>mdi-file-excel</v-icon> XLSX
          </v-btn>
        </v-btn-toggle>
        <v-progress-linear v-if="loading" indeterminate color="blue" class="loading-bar" />
        <v-alert v-if="error" type="error" dense class="error-alert" dismissible @input="error = null">
          {{ error }}
        </v-alert>
        <v-data-table
          :headers="headers"
          :items="filteredActs"
          :items-per-page="10"
          class="elevation-1"
          :loading="loading"
          loading-text="Загрузка данных..."
          no-data-text="Нет доступных актов"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn icon @click="viewActDetails(item.id)">
              <v-icon color="blue">mdi-eye</v-icon>
            </v-btn>
            <v-btn icon @click="handleUpdateAct(item.id)" class="ml-2">
              <v-icon color="blue-grey">mdi-pencil</v-icon>
            </v-btn>
          </template>
        </v-data-table>

        <!-- Диалог редактирования -->
        <v-dialog v-model="showEditDialog" max-width="400px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Редактировать акт</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="newActType"
                label="Новый тип акта"
                outlined
                dense
                class="input-field"
                :rules="[v => !!v || 'Тип обязателен']"
              />
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showEditDialog = false">Отмена</v-btn>
              <v-btn color="primary" class="action-btn-primary" @click="saveActUpdate" :disabled="!newActType">Сохранить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getActs, updateAct } from '@/api/acts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default {
  name: 'ActsList',
  data() {
    return {
      acts: [],
      loading: false,
      error: null,
      searchQuery: '',
      showEditDialog: false,
      newActType: '',
      selectedActId: null,
      exportFormat: 'pdf',
      headers: [
        { text: 'ID', value: 'id' },
        { text: 'Тип', value: 'type' },
        { text: 'Дата создания', value: 'created_at' },
        { text: 'Действия', value: 'actions', sortable: false },
      ],
    };
  },
  computed: {
    filteredActs() {
      if (!this.searchQuery) return this.acts;
      const query = this.searchQuery.toLowerCase();
      return this.acts.filter(
        (act) =>
          act.id.toString().includes(query) || 
          act.type.toLowerCase().includes(query)
      );
    },
  },
  async created() {
    await this.fetchActs();
  },
  methods: {
    async fetchActs() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getActs();
        this.acts = response.data.map(act => ({
          id: act.id,
          type: act.type,
          created_at: new Date(act.created_at).toLocaleDateString(),
        }));
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки актов';
      } finally {
        this.loading = false;
      }
    },
    viewActDetails(actId) {
      this.$router.push(`/acts/${actId}`);
    },
    handleUpdateAct(actId) {
      this.selectedActId = actId;
      this.newActType = this.acts.find((act) => act.id === actId)?.type || '';
      this.showEditDialog = true;
      this.error = null;
    },
    async saveActUpdate() {
      if (!this.newActType) return;
      this.loading = true;
      this.error = null;
      try {
        await updateAct(this.selectedActId, { type: this.newActType });
        await this.fetchActs();
        this.showEditDialog = false;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка обновления акта';
      } finally {
        this.loading = false;
      }
    },
    exportToPDF() {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(12);
      doc.text('Список актов', 10, 10);
      this.filteredActs.forEach((act, index) => {
        const y = 20 + index * 10;
        doc.text(`ID: ${act.id} | Тип: ${act.type} | Дата: ${act.created_at}`, 10, y);
      });
      doc.save('acts.pdf');
    },
    exportToExcel() {
      const worksheet = XLSX.utils.json_to_sheet(
        this.filteredActs.map((act) => ({
          'ID': act.id,
          'Тип': act.type,
          'Дата создания': act.created_at,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Acts');
      XLSX.writeFile(workbook, 'acts.xlsx');
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
  margin-bottom: 20px;
}

.search-field {
  max-width: 400px;
  margin-bottom: 20px;
  font-family: 'Gilroy-Regular', sans-serif;
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

.acts-list {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.act-item {
  padding: 12px 16px;
  transition: background-color 0.2s ease;
  cursor: pointer;
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

.input-field {
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

@media (max-width: 600px) {
  .page-title {
    font-size: 1.5rem;
  }
  .search-field {
    max-width: 100%;
  }
  .export-btn {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>