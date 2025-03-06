<template>
  <v-container class="acts-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Акты</h1>

        <!-- Фильтр -->
        <v-text-field
          v-model="searchQuery"
          label="Поиск по ID или типу"
          outlined
          dense
          clearable
          prepend-inner-icon="mdi-magnify"
          class="search-field"
        />

        <!-- Кнопка экспорта -->
        <v-btn-toggle v-model="exportFormat" mandatory class="export-toggle">
          <v-btn value="pdf" color="primary" class="export-btn" @click="exportToPDF">
            <v-icon left>mdi-file-pdf-box</v-icon> PDF
          </v-btn>
          <v-btn value="xlsx" color="primary" class="export-btn" @click="exportToExcel">
            <v-icon left>mdi-file-excel</v-icon> XLSX
          </v-btn>
        </v-btn-toggle>

        <!-- Индикатор загрузки -->
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="blue"
          class="loading-bar"
        />

        <v-list class="acts-list elevation-1">
          <v-list-item
            v-for="act in filteredActs"
            :key="act.id"
            class="act-item"
            :class="{ 'mobile-item': isMobile }"
            @click="viewActDetails(act.id)"
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
              <v-btn icon class="edit-btn" @click.stop="handleUpdateAct(act.id)">
                <v-icon color="blue-grey">mdi-pencil</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
          <v-list-item v-if="!filteredActs.length && !loading" class="empty-item">
            <v-list-item-content>
              <v-list-item-title>Нет актов</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

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
              />
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn color="grey" text @click="showEditDialog = false">Отмена</v-btn>
              <v-btn color="primary" class="action-btn-primary" @click="saveActUpdate">Сохранить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getActs, updateAct } from '../api';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      acts: [],
      loading: false,
      searchQuery: '',
      showEditDialog: false,
      newActType: '',
      selectedActId: null,
      exportFormat: 'pdf',
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
    filteredActs() {
      if (!this.searchQuery) return this.acts;
      const query = this.searchQuery.toLowerCase();
      return this.acts.filter(
        (act) =>
          act.id.toString().includes(query) || act.type.toLowerCase().includes(query)
      );
    },
  },
  async created() {
    await this.fetchActs();
  },
  methods: {
    async fetchActs() {
      this.loading = true;
      try {
        const data = await getActs();
        this.acts = data || [];
      } catch (error) {
        alert('Ошибка загрузки актов: ' + error.message);
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
    },
    async saveActUpdate() {
      if (this.newActType) {
        try {
          await updateAct(this.selectedActId, { type: this.newActType });
          await this.fetchActs();
          this.showEditDialog = false;
        } catch (error) {
          alert('Ошибка обновления акта: ' + error.message);
        }
      }
    },
    exportToPDF() {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(12);
      doc.text('Список актов', 10, 10);
      this.filteredActs.forEach((act, index) => {
        const y = 20 + index * 10;
        doc.text(`ID: ${act.id} | Тип: ${act.type}`, 10, y);
      });
      doc.save('acts.pdf');
    },
    exportToExcel() {
      const worksheet = XLSX.utils.json_to_sheet(
        this.filteredActs.map((act) => ({
          'ID': act.id,
          'Тип': act.type,
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