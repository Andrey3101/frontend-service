<template>
  <v-container class="acts-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Акты</h1>
        
        <!-- Поиск и экспорт -->
        <div class="search-export-container">
          <v-text-field
            v-model="searchQuery"
            label="Поиск по ID или типу"
            outlined
            dense
            clearable
            prepend-inner-icon="mdi-magnify"
            class="search-field"
            :error-messages="fieldErrors.search"
          />
          
          <v-btn-toggle v-model="exportFormat" mandatory class="export-toggle">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn 
                  value="pdf" 
                  color="primary" 
                  class="export-btn" 
                  @click="exportToPDF"
                  v-on="on"
                  :loading="exportLoading.pdf"
                >
                  <v-icon left>mdi-file-pdf-box</v-icon> PDF
                </v-btn>
              </template>
              <span>Экспорт в PDF</span>
            </v-tooltip>
            
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn 
                  value="xlsx" 
                  color="primary" 
                  class="export-btn" 
                  @click="exportToExcel"
                  v-on="on"
                  :loading="exportLoading.xlsx"
                >
                  <v-icon left>mdi-file-excel</v-icon> XLSX
                </v-btn>
              </template>
              <span>Экспорт в Excel</span>
            </v-tooltip>
          </v-btn-toggle>
        </div>

        <!-- Индикатор загрузки -->
        <v-progress-linear 
          v-if="loading" 
          indeterminate 
          color="blue" 
          class="loading-bar"
        />

        <!-- Сообщение об ошибке -->
        <v-dialog v-model="errorModal.show" max-width="500px" persistent>
          <v-card>
            <v-card-title class="error-title">
              <v-icon color="error" left>mdi-alert-circle</v-icon>
              Ошибка
            </v-card-title>
            <v-card-text class="error-message">
              {{ errorModal.message }}
              <div v-if="errorModal.details" class="error-details">
                {{ errorModal.details }}
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn 
                color="primary" 
                text 
                @click="errorModal.show = false"
              >
                Закрыть
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Список актов -->
        <v-card class="acts-card">
          <v-list class="acts-list">
            <v-list-item
              v-for="act in filteredActs"
              :key="act.id"
              class="act-item"
              :class="{ 'mobile-item': isMobile }"
              @click="viewActDetails(act.id)"
            >
              <v-list-item-icon>
                <v-icon color="blue-grey">mdi-file-document</v-icon>
              </v-list-item-icon>
              
              <v-list-item-content>
                <v-list-item-title class="act-title">
                  Акт ID: {{ act.id }}
                </v-list-item-title>
                <v-list-item-subtitle class="act-subtitle">
                  {{ isMobile ? act.type : `Тип: ${act.type}` }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="act-date">
                  {{ formatDate(act.created_at) }}
                </v-list-item-subtitle>
              </v-list-item-content>
              
              <v-list-item-action>
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <v-btn 
                      icon 
                      class="edit-btn" 
                      @click.stop="handleUpdateAct(act.id)"
                      v-on="on"
                      :disabled="loading"
                    >
                      <v-icon color="blue-grey">mdi-pencil</v-icon>
                    </v-btn>
                  </template>
                  <span>Редактировать акт</span>
                </v-tooltip>
              </v-list-item-action>
            </v-list-item>
            
            <v-list-item v-if="!filteredActs.length && !loading" class="empty-item">
              <v-list-item-content>
                <v-list-item-title>Нет актов для отображения</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Диалог редактирования -->
        <v-dialog v-model="showEditDialog" max-width="500px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              <v-icon left>mdi-pencil</v-icon>
              Редактировать акт #{{ selectedActId }}
            </v-card-title>
            
            <v-card-text>
              <v-text-field
                v-model="newActType"
                label="Тип акта"
                outlined
                dense
                class="input-field"
                :rules="typeRules"
                :error-messages="fieldErrors.type"
                @input="clearFieldError('type')"
              />
            </v-card-text>
            
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn 
                color="grey" 
                text 
                @click="cancelEdit"
                :disabled="editLoading"
              >
                Отмена
              </v-btn>
              <v-btn 
                color="primary" 
                class="action-btn-primary" 
                @click="saveActUpdate"
                :loading="editLoading"
                :disabled="!isEditFormValid"
              >
                Сохранить изменения
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getActs, updateAct } from '@/api/index.js';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default {
  name: 'ActsList',
  data() {
    return {
      acts: [],
      loading: false,
      searchQuery: '',
      showEditDialog: false,
      newActType: '',
      selectedActId: null,
      exportFormat: 'pdf',
      editLoading: false,
      exportLoading: {
        pdf: false,
        xlsx: false
      },
      errorModal: {
        show: false,
        message: '',
        details: ''
      },
      fieldErrors: {},
      typeRules: [
        v => !!v || 'Тип акта обязателен',
        v => (v && v.length <= 100) || 'Максимальная длина 100 символов'
      ]
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
        act => act.id.toString().includes(query) || 
               act.type.toLowerCase().includes(query)
      );
    },
    isEditFormValid() {
      return this.newActType && 
             this.typeRules.every(rule => rule(this.newActType) === true);
    }
  },
  async created() {
    await this.fetchActs();
  },
  methods: {
    async fetchActs() {
      this.loading = true;
      try {
        const response = await getActs();
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        this.acts = (response.acts || []).map(act => ({
          id: act.document_id,
          type: act.type,
          created_at: act.created_at
        }));
      } catch (error) {
        this.handleError(
          error, 
          'Ошибка загрузки актов',
          'Не удалось загрузить список актов. Пожалуйста, попробуйте позже.'
        );
      } finally {
        this.loading = false;
      }
    },
    
    viewActDetails(actId) {
      this.$router.push(`/acts/${actId}`);
    },
    
    handleUpdateAct(actId) {
      const act = this.acts.find(a => a.id === actId);
      if (!act) {
        this.showError(
          'Акт не найден',
          'Выбранный акт не существует или был удален'
        );
        return;
      }
      
      this.selectedActId = actId;
      this.newActType = act.type;
      this.showEditDialog = true;
      this.clearFieldErrors();
    },
    
    async saveActUpdate() {
      if (!this.isEditFormValid) return;
      
      this.editLoading = true;
      try {
        const response = await updateAct(this.selectedActId, { 
          type: this.newActType 
        });
        
        if (response.error) {
          if (response.errors) {
            this.fieldErrors = response.errors;
            throw new Error('Проверьте правильность заполнения полей');
          }
          throw new Error(response.error);
        }
        
        this.$toast.success('Акт успешно обновлен');
        await this.fetchActs();
        this.showEditDialog = false;
      } catch (error) {
        this.handleError(
          error,
          'Ошибка обновления акта',
          'Не удалось обновить информацию об акте. Пожалуйста, проверьте данные и попробуйте снова.'
        );
      } finally {
        this.editLoading = false;
      }
    },
    
    cancelEdit() {
      this.showEditDialog = false;
      this.clearFieldErrors();
    },
    
    async exportToPDF() {
      this.exportLoading.pdf = true;
      try {
        const doc = new jsPDF();
        doc.setFont('helvetica');
        doc.setFontSize(12);
        
        // Заголовок
        doc.text('Список актов', 10, 10);
        doc.setFontSize(10);
        doc.text(`Сформировано: ${dayjs().format('DD.MM.YYYY HH:mm')}`, 10, 18);
        
        // Данные
        let y = 30;
        this.filteredActs.forEach(act => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(`ID: ${act.id}`, 10, y);
          doc.text(`Тип: ${act.type}`, 50, y);
          doc.text(`Дата: ${this.formatDate(act.created_at)}`, 120, y);
          y += 10;
        });
        
        doc.save(`acts_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
      } catch (error) {
        this.handleError(
          error,
          'Ошибка экспорта в PDF',
          'Не удалось сформировать PDF-документ. Пожалуйста, попробуйте снова.'
        );
      } finally {
        this.exportLoading.pdf = false;
      }
    },
    
    async exportToExcel() {
      this.exportLoading.xlsx = true;
      try {
        const worksheet = XLSX.utils.json_to_sheet(
          this.filteredActs.map(act => ({
            'ID': act.id,
            'Тип': act.type,
            'Дата создания': this.formatDate(act.created_at)
          }))
        );
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Акты');
        XLSX.writeFile(
          workbook, 
          `acts_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
        );
      } catch (error) {
        this.handleError(
          error,
          'Ошибка экспорта в Excel',
          'Не удалось сформировать Excel-документ. Пожалуйста, попробуйте снова.'
        );
      } finally {
        this.exportLoading.xlsx = false;
      }
    },
    
    formatDate(dateString) {
      return dayjs(dateString).format('DD.MM.YYYY HH:mm');
    },
    
    handleError(error, defaultMessage, defaultDetails = '') {
      console.error('Error:', error);
      
      let message = defaultMessage;
      let details = defaultDetails;
      
      if (error.response) {
        // Обработка HTTP ошибок
        switch(error.response.status) {
          case 400:
            message = 'Некорректные данные';
            if (error.response.data?.errors) {
              this.fieldErrors = error.response.data.errors;
            }
            break;
          case 401:
            message = 'Требуется авторизация';
            details = 'Для выполнения этого действия необходимо войти в систему';
            this.$router.push('/login');
            break;
          case 403:
            message = 'Доступ запрещен';
            details = 'У вас недостаточно прав для выполнения этого действия';
            break;
          case 404:
            message = 'Данные не найдены';
            details = 'Запрошенные данные не существуют или были удалены';
            break;
          case 500:
            message = 'Ошибка сервера';
            details = 'Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
            break;
          default:
            message = error.response.data?.message || 
                     error.response.data?.detail || 
                     defaultMessage;
            details = error.response.data?.errors || defaultDetails;
        }
      } else if (error.request) {
        // Ошибка сети или сервер не ответил
        message = 'Проблемы с соединением';
        details = 'Не удалось подключиться к серверу. Проверьте интернет-соединение и попробуйте снова.';
      } else {
        // Другие ошибки
        message = error.message || defaultMessage;
      }
      
      this.showError(message, details);
    },
    
    showError(message, details = '') {
      this.errorModal = {
        show: true,
        message,
        details
      };
    },
    
    clearFieldErrors() {
      this.fieldErrors = {};
    },
    
    clearFieldError(field) {
      if (this.fieldErrors[field]) {
        delete this.fieldErrors[field];
      }
    }
  }
};
</script>

<style scoped>
.acts-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 500;
  color: #1976d2;
  margin-bottom: 20px;
  text-align: center;
}

.search-export-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
}

.search-field {
  flex: 1;
  min-width: 300px;
}

.export-toggle {
  flex-shrink: 0;
}

.export-btn {
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.loading-bar {
  margin-bottom: 20px;
  border-radius: 4px;
}

.acts-card {
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.acts-list {
  background: #ffffff;
}

.act-item {
  padding: 16px;
  transition: background-color 0.2s ease;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.act-item:hover {
  background-color: #f5f7fa;
}

.mobile-item {
  padding: 12px;
}

.act-title {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.act-subtitle {
  font-size: 0.9rem;
  color: #546e7a;
  margin-bottom: 4px;
}

.act-date {
  font-size: 0.8rem;
  color: #78909c;
}

.edit-btn {
  transition: all 0.3s ease;
}

.edit-btn:hover {
  transform: scale(1.1);
  color: #1976d2 !important;
}

.empty-item {
  text-align: center;
  padding: 20px;
  color: #78909c;
}

.dialog-card {
  border-radius: 12px;
  overflow: hidden;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  background-color: #f5f7fa;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.input-field {
  margin-top: 16px;
}

.dialog-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.action-btn-primary {
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.action-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.error-title {
  color: #d32f2f;
  font-size: 1.25rem;
  font-weight: 500;
  padding: 16px;
  border-bottom: 1px solid #ffcdd2;
}

.error-message {
  padding: 20px;
  color: #5f2120;
  font-size: 1rem;
  line-height: 1.5;
}

.error-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Адаптивность */
@media (max-width: 960px) {
  .acts-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .search-field {
    min-width: 100%;
  }
  
  .export-toggle {
    width: 100%;
  }
  
  .export-btn {
    width: 100%;
    margin-bottom: 10px;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.3rem;
  }
  
  .act-item {
    padding: 12px;
  }
  
  .act-title {
    font-size: 1rem;
  }
  
  .act-subtitle, .act-date {
    font-size: 0.8rem;
  }
}
</style>