<template>
  <div class="contractors-page">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-account-group</v-icon>
              Проверка контрагентов
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                @click="showAddDialog = true"
                prepend-icon="mdi-plus"
              >
                Добавить контрагента
              </v-btn>
            </v-card-title>
            
            <v-card-text>
              <v-text-field
                v-model="searchQuery"
                label="Поиск по ИНН или названию"
                prepend-icon="mdi-magnify"
                clearable
                @input="filterContractors"
              ></v-text-field>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Список контрагентов -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              Контрагенты ({{ filteredContractors.length }})
            </v-card-title>
            
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="filteredContractors"
                :loading="loading"
                :items-per-page="10"
                class="elevation-1"
              >
                <template v-slot:item.fns_status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.fns_status)"
                    size="small"
                  >
                    {{ getStatusText(item.fns_status) }}
                  </v-chip>
                </template>
                
                <template v-slot:item.risk_score="{ item }">
                  <v-chip
                    :color="getRiskColor(item.risk_score)"
                    size="small"
                  >
                    {{ item.risk_score }}%
                  </v-chip>
                </template>
                
                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="viewContractor(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-refresh"
                    size="small"
                    variant="text"
                    @click="refreshContractor(item)"
                    :loading="refreshing === item.id"
                  ></v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Диалог добавления контрагента -->
      <v-dialog v-model="showAddDialog" max-width="600px">
        <v-card>
          <v-card-title>Добавить контрагента</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-text-field
                v-model="newContractor.inn"
                label="ИНН"
                :rules="[rules.required, rules.inn]"
                maxlength="12"
                counter
              ></v-text-field>
              
              <v-text-field
                v-model="newContractor.name"
                label="Название компании"
                :rules="[rules.required]"
                maxlength="200"
                counter
              ></v-text-field>
              
              <v-select
                v-model="newContractor.type"
                label="Тип контрагента"
                :items="contractorTypes"
                :rules="[rules.required]"
              ></v-select>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showAddDialog = false">Отмена</v-btn>
            <v-btn
              color="primary"
              @click="addContractor"
              :loading="adding"
              :disabled="!valid"
            >
              Добавить
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Диалог просмотра контрагента -->
      <v-dialog v-model="showViewDialog" max-width="800px">
        <v-card>
          <v-card-title>Информация о контрагенте</v-card-title>
          <v-card-text v-if="selectedContractor">
            <v-row>
              <v-col cols="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-domain</v-icon>
                    </template>
                    <v-list-item-title>Название</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedContractor.name }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-identifier</v-icon>
                    </template>
                    <v-list-item-title>ИНН</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedContractor.inn }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-tag</v-icon>
                    </template>
                    <v-list-item-title>Тип</v-list-item-title>
                    <v-list-item-subtitle>{{ getTypeText(selectedContractor.type) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              
              <v-col cols="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title>Статус ФНС</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getStatusColor(selectedContractor.fns_status)"
                        size="small"
                      >
                        {{ getStatusText(selectedContractor.fns_status) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-alert</v-icon>
                    </template>
                    <v-list-item-title>Уровень риска</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getRiskColor(selectedContractor.risk_score)"
                        size="small"
                      >
                        {{ selectedContractor.risk_score }}%
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-currency-rub</v-icon>
                    </template>
                    <v-list-item-title>Общая сумма транзакций</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(selectedContractor.total_transactions) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
            
            <!-- Детальная информация от ФНС -->
            <v-expansion-panels v-if="selectedContractor.fns_data">
              <v-expansion-panel>
                <v-expansion-panel-title>Детальная информация от ФНС</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <pre>{{ JSON.stringify(selectedContractor.fns_data, null, 2) }}</pre>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showViewDialog = false">Закрыть</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { checkContractor, getContractor } from '@/api/index.js';

export default {
  name: 'ContractorsPage',
  
  data() {
    return {
      loading: false,
      adding: false,
      refreshing: null,
      contractors: [],
      filteredContractors: [],
      searchQuery: '',
      showAddDialog: false,
      showViewDialog: false,
      selectedContractor: null,
      valid: false,
      
      newContractor: {
        inn: '',
        name: '',
        type: 'client'
      },
      
      contractorTypes: [
        { title: 'Клиент', value: 'client' },
        { title: 'Поставщик', value: 'supplier' },
        { title: 'Партнер', value: 'partner' }
      ],
      
      headers: [
        { title: 'Название', key: 'name', sortable: true },
        { title: 'ИНН', key: 'inn', sortable: true },
        { title: 'Тип', key: 'type', sortable: true },
        { title: 'Статус ФНС', key: 'fns_status', sortable: true },
        { title: 'Уровень риска', key: 'risk_score', sortable: true },
        { title: 'Сумма транзакций', key: 'total_transactions', sortable: true },
        { title: 'Действия', key: 'actions', sortable: false }
      ],
      
      rules: {
        required: v => !!v || 'Обязательное поле',
        inn: v => /^\d{10,12}$/.test(v) || 'ИНН должен содержать 10-12 цифр'
      }
    };
  },
  
  async mounted() {
    await this.loadContractors();
  },
  
  methods: {
    async loadContractors() {
      this.loading = true;
      try {
        // В реальности здесь будет вызов API для получения списка контрагентов
        // Пока используем моковые данные
        this.contractors = [
          {
            id: '1',
            name: 'ООО "Тестовая компания"',
            inn: '1234567890',
            type: 'client',
            fns_status: 'active',
            risk_score: 15,
            total_transactions: 150000,
            fns_data: { status: 'active', company_name: 'ООО "Тестовая компания"' }
          }
        ];
        this.filteredContractors = [...this.contractors];
      } catch (error) {
        console.error('Ошибка загрузки контрагентов:', error);
        this.$toast.error('Ошибка загрузки контрагентов');
      } finally {
        this.loading = false;
      }
    },
    
    async addContractor() {
      if (!this.$refs.form.validate()) return;
      
      this.adding = true;
      try {
        const response = await checkContractor(this.newContractor);
        if (response.status === 'success') {
          this.contractors.push(response.contractor);
          this.filteredContractors = [...this.contractors];
          this.showAddDialog = false;
          this.resetForm();
          this.$toast.success('Контрагент успешно добавлен');
        }
      } catch (error) {
        console.error('Ошибка добавления контрагента:', error);
        this.$toast.error('Ошибка добавления контрагента');
      } finally {
        this.adding = false;
      }
    },
    
    async refreshContractor(contractor) {
      this.refreshing = contractor.id;
      try {
        const response = await getContractor(contractor.id);
        const index = this.contractors.findIndex(c => c.id === contractor.id);
        if (index !== -1) {
          this.contractors[index] = response;
          this.filteredContractors = [...this.contractors];
        }
        this.$toast.success('Данные контрагента обновлены');
      } catch (error) {
        console.error('Ошибка обновления контрагента:', error);
        this.$toast.error('Ошибка обновления контрагента');
      } finally {
        this.refreshing = null;
      }
    },
    
    viewContractor(contractor) {
      this.selectedContractor = contractor;
      this.showViewDialog = true;
    },
    
    filterContractors() {
      if (!this.searchQuery) {
        this.filteredContractors = [...this.contractors];
        return;
      }
      
      const query = this.searchQuery.toLowerCase();
      this.filteredContractors = this.contractors.filter(contractor =>
        contractor.name.toLowerCase().includes(query) ||
        contractor.inn.includes(query)
      );
    },
    
    resetForm() {
      this.newContractor = {
        inn: '',
        name: '',
        type: 'client'
      };
      this.$refs.form.resetValidation();
    },
    
    getStatusColor(status) {
      const colors = {
        active: 'success',
        liquidated: 'error',
        bankrupt: 'error',
        unknown: 'warning'
      };
      return colors[status] || 'grey';
    },
    
    getStatusText(status) {
      const texts = {
        active: 'Активна',
        liquidated: 'Ликвидирована',
        bankrupt: 'Банкрот',
        unknown: 'Неизвестно'
      };
      return texts[status] || status;
    },
    
    getRiskColor(score) {
      if (score <= 25) return 'success';
      if (score <= 50) return 'warning';
      if (score <= 75) return 'orange';
      return 'error';
    },
    
    getTypeText(type) {
      const texts = {
        client: 'Клиент',
        supplier: 'Поставщик',
        partner: 'Партнер'
      };
      return texts[type] || type;
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(amount);
    }
  }
};
</script>

<style scoped>
.contractors-page {
  padding: 20px;
}

.v-data-table {
  margin-top: 20px;
}
</style> 