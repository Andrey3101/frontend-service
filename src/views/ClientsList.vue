<template>
  <v-container class="clients-container">
    <v-row>
      <v-col>
        <h1 class="clients-title">Клиенты</h1>
        
        <!-- Лента состояния операций -->
        <v-snackbar
          v-model="snackbar.show"
          :timeout="snackbar.timeout"
          :color="snackbar.color"
          top
          right
        >
          {{ snackbar.message }}
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

        <v-row class="filter-row" align="center">
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Поиск по имени или email"
              prepend-inner-icon="mdi-magnify"
              outlined
              dense
              clearable
              @input="debounceFilter"
              :error-messages="fieldErrors.search"
              class="search-field"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filter.amount"
              :items="amountFilters"
              label="Фильтр по сумме"
              outlined
              dense
              clearable
              @change="filterClients"
              :error-messages="fieldErrors.filter"
              class="filter-select"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn 
              color="primary" 
              @click="openAddDialog" 
              class="add-btn"
              :loading="loading"
            >
              <v-icon left>mdi-plus</v-icon> Добавить клиента
            </v-btn>
          </v-col>
        </v-row>

        <!-- Диалог подтверждения удаления -->
        <v-dialog v-model="confirmDeleteDialog" max-width="400px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Подтверждение удаления</v-card-title>
            <v-card-text>
              Вы уверены, что хотите удалить клиента {{ clientToDelete?.name || '' }}?
              <br><br>
              <strong>Это действие нельзя отменить.</strong>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="grey" text @click="confirmDeleteDialog = false">Отмена</v-btn>
              <v-btn color="error" @click="confirmDelete" :loading="deleting">Удалить</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-data-table
          :headers="headers"
          :items="filteredClients"
          :loading="loading"
          class="clients-table"
          :items-per-page="10"
          :footer-props="{ 'items-per-page-options': [5, 10, 20, -1] }"
        >
          <template v-slot:item.amount="{ item }">
            <span>{{ item.amount !== null ? `${formatAmount(item.amount)} ₽` : '—' }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn 
                  small 
                  color="primary" 
                  @click="openEditDialog(item)" 
                  class="action-btn ma-1"
                  v-on="on"
                  :disabled="loading"
                >
                  <v-icon small left>mdi-pencil</v-icon>
                  <span class="d-none d-sm-inline">Редактировать</span>
                </v-btn>
              </template>
              <span>Редактировать клиента</span>
            </v-tooltip>

            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn 
                  small 
                  color="error" 
                  @click="initDeleteClient(item)" 
                  class="action-btn ma-1"
                  v-on="on"
                  :disabled="loading"
                >
                  <v-icon small left>mdi-delete</v-icon>
                  <span class="d-none d-sm-inline">Удалить</span>
                </v-btn>
              </template>
              <span>Удалить клиента</span>
            </v-tooltip>
          </template>

          <template v-slot:no-data>
            <div class="no-data-message">
              <v-icon large color="grey">mdi-account-question</v-icon>
              <p>Нет данных о клиентах</p>
              <v-btn color="primary" @click="fetchClients" :loading="loading">
                <v-icon left>mdi-refresh</v-icon>
                Обновить
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <!-- Диалог добавления/редактирования -->
    <v-dialog v-model="clientDialog" max-width="600px" persistent>
      <v-card class="dialog-card">
        <v-card-title class="dialog-title">
          {{ editMode ? 'Редактировать клиента' : 'Добавить клиента' }}
          <v-spacer />
          <v-btn icon @click="closeDialog" class="close-btn" :disabled="saving">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form v-model="formValid" ref="form">
            <v-text-field
              v-model="form.name"
              label="Имя"
              required
              :rules="nameRules"
              :error-messages="fieldErrors.name"
              @input="clearFieldError('name')"
              outlined
              dense
              class="form-field"
            />
            
            <v-text-field
              v-model="form.phone"
              label="Телефон"
              :rules="phoneRules"
              :error-messages="fieldErrors.phone"
              @input="clearFieldError('phone')"
              outlined
              dense
              class="form-field"
            />
            
            <v-text-field
              v-model="form.email"
              label="Email"
              :rules="emailRules"
              :error-messages="fieldErrors.email"
              @input="clearFieldError('email')"
              outlined
              dense
              class="form-field"
            />
            
            <v-text-field
              v-model="form.amount"
              label="Сумма (₽)"
              type="number"
              :rules="amountRules"
              :error-messages="fieldErrors.amount"
              @input="clearFieldError('amount')"
              outlined
              dense
              class="form-field"
            />
            
            <v-textarea
              v-model="form.description"
              label="Описание"
              :rules="descriptionRules"
              :error-messages="fieldErrors.description"
              @input="clearFieldError('description')"
              outlined
              rows="3"
              class="form-field"
            />
          </v-form>
        </v-card-text>
        
        <v-card-actions class="dialog-actions">
          <v-btn 
            color="grey" 
            text 
            @click="closeDialog" 
            :disabled="saving"
          >
            Отмена
          </v-btn>
          <v-btn 
            color="primary" 
            @click="saveClient" 
            :disabled="!formValid || saving" 
            :loading="saving"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { addClient, getClients, updateClient, deleteClient } from '@/api/index.js';
import debounce from 'lodash/debounce';

export default {
  name: 'ClientsList',
  data() {
    return {
      clients: [],
      filteredClients: [],
      loading: false,
      saving: false,
      deleting: false,
      clientDialog: false,
      confirmDeleteDialog: false,
      editMode: false,
      formValid: false,
      searchQuery: '',
      filter: { amount: null },
      clientToDelete: null,
      form: {
        name: '',
        phone: '',
        email: '',
        amount: null,
        description: '',
        client_id: null,
      },
      fieldErrors: {},
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        timeout: 5000
      },
      headers: [
        { text: 'Имя', value: 'name', sortable: true },
        { text: 'Телефон', value: 'phone', sortable: true },
        { text: 'Email', value: 'email', sortable: true },
        { text: 'Сумма', value: 'amount', sortable: true },
        { text: 'Описание', value: 'description', sortable: false },
        { text: 'Действия', value: 'actions', sortable: false, align: 'right' },
      ],
      amountFilters: [
        { text: 'Все', value: null },
        { text: 'До 10,000 ₽', value: '0-10000' },
        { text: '10,000 - 50,000 ₽', value: '10000-50000' },
        { text: 'Более 50,000 ₽', value: '50000+' },
      ],
      nameRules: [
        v => !!v || 'Имя обязательно',
        v => (v && v.length <= 100) || 'Максимум 100 символов'
      ],
      phoneRules: [
        v => !v || /^[\d\s+\-()]+$/.test(v) || 'Некорректный номер телефона'
      ],
      emailRules: [
        v => !v || /.+@.+\..+/.test(v) || 'Некорректный email'
      ],
      amountRules: [
        v => !v || v >= 0 || 'Сумма не может быть отрицательной'
      ],
      descriptionRules: [
        v => !v || v.length <= 500 || 'Максимум 500 символов'
      ],
      debounceFilter: null
    };
  },
  created() {
    this.debounceFilter = debounce(this.filterClients, 500);
    this.fetchClients();
  },
  methods: {
    async fetchClients() {
      this.loading = true;
      this.clearErrors();
      
      try {
        const filters = {};
        if (this.searchQuery) filters.search = this.searchQuery;
        if (this.filter.amount) {
          const [min, max] = this.filter.amount.split('-');
          filters.amount_min = min || 0;
          filters.amount_max = max || (this.filter.amount === '50000+' ? null : max);
        }
        
        const response = await getClients(filters);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        this.clients = response.clients || [];
        this.filteredClients = this.clients;
        
      } catch (error) {
        this.handleError(
          error,
          'Не удалось загрузить клиентов',
          'Произошла ошибка при загрузке списка клиентов. Пожалуйста, попробуйте позже.'
        );
      } finally {
        this.loading = false;
      }
    },
    
    filterClients() {
      this.fetchClients();
    },
    
    openAddDialog() {
      this.editMode = false;
      this.form = { 
        name: '', 
        phone: '', 
        email: '', 
        amount: null, 
        description: '', 
        client_id: null 
      };
      this.clientDialog = true;
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.resetValidation();
        }
      });
    },
    
    openEditDialog(client) {
      this.editMode = true;
      this.form = { 
        ...client, 
        amount: client.amount !== null ? client.amount : null 
      };
      this.clientDialog = true;
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.resetValidation();
        }
      });
    },
    
    closeDialog() {
      if (!this.saving) {
        this.clientDialog = false;
        this.clearErrors();
      }
    },
    
    initDeleteClient(client) {
      this.clientToDelete = client;
      this.confirmDeleteDialog = true;
    },
    
    async confirmDelete() {
      if (!this.clientToDelete) return;
      
      this.deleting = true;
      try {
        const response = await deleteClient(this.clientToDelete.client_id);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        this.showSnackbar('Клиент успешно удалён', 'success');
        await this.fetchClients();
        this.confirmDeleteDialog = false;
        this.clientToDelete = null;
        
      } catch (error) {
        this.handleError(
          error,
          'Не удалось удалить клиента',
          'Произошла ошибка при удалении клиента. Пожалуйста, попробуйте позже.'
        );
      } finally {
        this.deleting = false;
      }
    },
    
    async saveClient() {
      if (!this.formValid) return;
      
      this.saving = true;
      this.clearErrors();
      
      try {
        let response;
        
        if (this.editMode) {
          response = await updateClient(this.form.client_id, this.form);
        } else {
          response = await addClient(this.form);
        }
        
        if (response.error) {
          if (response.errors) {
            this.fieldErrors = response.errors;
            throw new Error('Проверьте правильность заполнения полей');
          }
          throw new Error(response.error);
        }
        
        this.showSnackbar(
          this.editMode ? 'Клиент успешно обновлён' : 'Клиент успешно добавлен',
          'success'
        );
        
        this.clientDialog = false;
        await this.fetchClients();
        
      } catch (error) {
        this.handleError(
          error,
          this.editMode ? 'Ошибка обновления клиента' : 'Ошибка добавления клиента',
          'Произошла ошибка при сохранении данных клиента. Пожалуйста, проверьте введённые данные и попробуйте снова.'
        );
      } finally {
        this.saving = false;
      }
    },
    
    formatAmount(amount) {
      return new Intl.NumberFormat('ru-RU').format(amount);
    },
    
    handleError(error, defaultMessage) {
      console.error('Error:', error);
      
      let message = defaultMessage;
      
      if (error.response) {
        switch(error.response.status) {
          case 400:
            message = 'Некорректные данные';
            if (error.response.data?.errors) {
              this.fieldErrors = error.response.data.errors;
            }
            break;
          case 401:
            message = 'Требуется авторизация';
            this.$router.push('/login');
            break;
          case 403:
            message = 'Доступ запрещен';
            break;
          case 404:
            message = 'Данные не найдены';
            break;
          case 500:
            message = 'Ошибка сервера';
            break;
          default:
            message = error.response.data?.message || 
                     error.response.data?.detail || 
                     defaultMessage;
        }
      } else if (error.request) {
        message = 'Проблемы с соединением';
      } else {
        message = error.message || defaultMessage;
      }
      
      this.showSnackbar(message, 'error');
    },
    
    showSnackbar(message, color = 'success') {
      this.snackbar = {
        show: true,
        message,
        color,
        timeout: 5000
      };
    },
    
    clearErrors() {
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
.clients-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f7fa;
  border-radius: 12px;
}

.clients-title {
  font-size: 2rem;
  font-weight: 500;
  color: #1976d2;
  margin-bottom: 20px;
  text-align: center;
}

.filter-row {
  margin-bottom: 20px;
}

.search-field,
.filter-select {
  background: #fff;
  border-radius: 8px;
}

.add-btn {
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: none;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.clients-table {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.clients-table :deep(.v-data-table-header th) {
  background-color: #e3f2fd;
  color: #0d47a1;
  font-weight: 600;
  font-size: 0.9rem;
}

.clients-table :deep(tr:hover) {
  background-color: #f5f7fa !important;
}

.action-btn {
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: none;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-data-message {
  text-align: center;
  padding: 40px 0;
  color: #78909c;
}

.no-data-message p {
  margin: 16px 0;
  font-size: 1.1rem;
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

.close-btn {
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: rotate(90deg);
}

.form-field {
  margin-bottom: 16px;
}

.dialog-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

/* Анимации */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Адаптивность */
@media (max-width: 960px) {
  .clients-container {
    padding: 16px;
  }
  
  .clients-title {
    font-size: 1.5rem;
  }
  
  .filter-row {
    flex-direction: column;
  }
  
  .search-field,
  .filter-select,
  .add-btn {
    margin-bottom: 12px;
    width: 100%;
  }
  
  .action-btn {
    width: 100%;
    margin: 4px 0;
    justify-content: flex-start;
  }
}

@media (max-width: 600px) {
  .clients-title {
    font-size: 1.3rem;
  }
  
  .clients-table :deep(.v-data-table-header th),
  .clients-table :deep(td) {
    font-size: 0.85rem;
    padding: 8px 4px;
  }
  
  .action-btn {
    min-width: 36px;
    padding: 0 8px;
  }
  
  .action-btn span {
    display: none;
  }
}
</style>