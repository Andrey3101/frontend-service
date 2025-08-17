<template>
  <div class="bank-accounts-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-6">Управление банковскими счетами</h1>
        </v-col>
      </v-row>

      <!-- Подключенные счета -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-bank</v-icon>
              Подключенные счета
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                @click="showConnectDialog = true"
                :loading="loading"
              >
                <v-icon left>mdi-plus</v-icon>
                Подключить счет
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="connectedAccounts.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey">mdi-bank-off</v-icon>
                <p class="text-h6 text-grey mt-4">Нет подключенных счетов</p>
                <p class="text-body-2 text-grey">Подключите свой первый банковский счет</p>
              </div>
              
              <v-list v-else>
                <v-list-item
                  v-for="account in connectedAccounts"
                  :key="account.connection_id"
                  class="mb-2"
                >
                  <v-list-item-avatar>
                    <v-icon color="primary">mdi-credit-card</v-icon>
                  </v-list-item-avatar>
                  
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ account.bank_name }} - {{ account.account_number }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Тип: {{ getAccountTypeLabel(account.account_type) }} | 
                      Подключен: {{ formatDate(account.connected_at) }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  
                  <v-list-item-action>
                    <v-btn
                      icon
                      color="error"
                      @click="disconnectAccount(account.connection_id)"
                      :loading="disconnecting === account.connection_id"
                    >
                      <v-icon>mdi-disconnect</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Запросы на подключение -->
      <v-row v-if="connectionRequests.length > 0">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-clock</v-icon>
              Запросы на подключение
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="request in connectionRequests"
                  :key="request.request_id"
                  class="mb-2"
                >
                  <v-list-item-avatar>
                    <v-icon color="warning">mdi-clock</v-icon>
                  </v-list-item-avatar>
                  
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ request.bank_name }} - {{ request.account_number }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Статус: {{ getStatusLabel(request.status) }} | 
                      Запрошен: {{ formatDate(request.created_at) }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  
                  <v-list-item-action>
                    <v-chip
                      :color="getStatusColor(request.status)"
                      text-color="white"
                    >
                      {{ getStatusLabel(request.status) }}
                    </v-chip>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Диалог подключения счета -->
      <v-dialog v-model="showConnectDialog" max-width="500">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-bank-plus</v-icon>
            Подключение банковского счета
          </v-card-title>
          
          <v-card-text>
            <v-form ref="form" v-model="formValid">
              <v-select
                v-model="newAccount.bank_name"
                :items="availableBanks"
                label="Банк"
                :rules="[v => !!v || 'Выберите банк']"
                required
              ></v-select>
              
              <v-text-field
                v-model="newAccount.account_number"
                label="Номер счета"
                :rules="[v => !!v || 'Введите номер счета']"
                required
              ></v-text-field>
              
              <v-select
                v-model="newAccount.account_type"
                :items="accountTypes"
                label="Тип счета"
                :rules="[v => !!v || 'Выберите тип счета']"
                required
              ></v-select>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showConnectDialog = false">Отмена</v-btn>
            <v-btn
              color="primary"
              @click="connectAccount"
              :loading="connecting"
              :disabled="!formValid"
            >
              Подключить
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Диалог запроса в банк -->
      <v-dialog v-model="showRequestDialog" max-width="500">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-bank-transfer</v-icon>
            Запрос в банк на подключение
          </v-card-title>
          
          <v-card-text>
            <p class="text-body-2 mb-4">
              Отправить запрос в банк для подключения счета. 
              Банк проверит данные и свяжется с вами для подтверждения.
            </p>
            
            <v-form ref="requestForm" v-model="requestFormValid">
              <v-select
                v-model="bankRequest.bank_name"
                :items="availableBanks"
                label="Банк"
                :rules="[v => !!v || 'Выберите банк']"
                required
              ></v-select>
              
              <v-text-field
                v-model="bankRequest.account_number"
                label="Номер счета"
                :rules="[v => !!v || 'Введите номер счета']"
                required
              ></v-text-field>
              
              <v-select
                v-model="bankRequest.account_type"
                :items="accountTypes"
                label="Тип счета"
                :rules="[v => !!v || 'Выберите тип счета']"
                required
              ></v-select>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showRequestDialog = false">Отмена</v-btn>
            <v-btn
              color="primary"
              @click="sendBankRequest"
              :loading="sendingRequest"
              :disabled="!requestFormValid"
            >
              Отправить запрос
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>

  <!-- Уведомления -->
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="3000"
  >
    {{ snackbar.message }}
    <template v-slot:action="{ attrs }">
      <v-btn text v-bind="attrs" @click="snackbar.show = false">
        Закрыть
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import {
  getConnectedBankAccounts,
  connectBankAccount,
  disconnectBankAccount,
  requestBankConnection,
  getBankConnectionStatus
} from '@/api';

export default {
  name: 'BankAccountsPage',
  
  data() {
    return {
      loading: false,
      connecting: false,
      disconnecting: null,
      sendingRequest: false,
      
      showConnectDialog: false,
      showRequestDialog: false,
      
      formValid: false,
      requestFormValid: false,
      
      connectedAccounts: [],
      connectionRequests: [],
      
      newAccount: {
        bank_name: '',
        account_number: '',
        account_type: ''
      },
      
      bankRequest: {
        bank_name: '',
        account_number: '',
        account_type: ''
      },
      
      availableBanks: [
        { text: 'Сбербанк', value: 'sberbank' },
        { text: 'Тинькофф', value: 'tinkoff' },
        { text: 'Альфа-Банк', value: 'alfabank' },
        { text: 'ЮMoney', value: 'yoomoney' }
      ],
      
      accountTypes: [
        { text: 'Расчетный счет', value: 'current' },
        { text: 'Сберегательный счет', value: 'savings' },
        { text: 'Кредитный счет', value: 'credit' }
      ],
      
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      }
    };
  },
  
  async mounted() {
    await this.loadData();
  },
  
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [accounts, requests] = await Promise.all([
          getConnectedBankAccounts(),
          this.loadConnectionRequests()
        ]);
        
        this.connectedAccounts = accounts.accounts || [];
        this.connectionRequests = requests || [];
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        this.showSnackbar('Ошибка загрузки данных', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    async loadConnectionRequests() {
      try {
        // Здесь можно добавить загрузку запросов на подключение
        return [];
      } catch (error) {
        console.error('Ошибка загрузки запросов:', error);
        return [];
      }
    },
    
    async connectAccount() {
      if (!this.$refs.form.validate()) return;
      
      this.connecting = true;
      try {
        await connectBankAccount(this.newAccount);
        this.showSnackbar('Счет успешно подключен', 'success');
        this.showConnectDialog = false;
        this.resetForm();
        await this.loadData();
      } catch (error) {
        console.error('Ошибка подключения:', error);
        this.showSnackbar('Ошибка подключения счета', 'error');
      } finally {
        this.connecting = false;
      }
    },
    
    async disconnectAccount(connectionId) {
      if (!confirm('Вы уверены, что хотите отключить этот счет?')) return;
      
      this.disconnecting = connectionId;
      try {
        await disconnectBankAccount(connectionId);
        this.showSnackbar('Счет успешно отключен', 'success');
        await this.loadData();
      } catch (error) {
        console.error('Ошибка отключения:', error);
        this.showSnackbar('Ошибка отключения счета', 'error');
      } finally {
        this.disconnecting = null;
      }
    },
    
    async sendBankRequest() {
      if (!this.$refs.requestForm.validate()) return;
      
      this.sendingRequest = true;
      try {
        await requestBankConnection(this.bankRequest);
        this.showSnackbar('Запрос отправлен в банк', 'success');
        this.showRequestDialog = false;
        this.resetRequestForm();
        await this.loadData();
      } catch (error) {
        console.error('Ошибка отправки запроса:', error);
        this.showSnackbar('Ошибка отправки запроса', 'error');
      } finally {
        this.sendingRequest = false;
      }
    },
    
    resetForm() {
      this.newAccount = {
        bank_name: '',
        account_number: '',
        account_type: ''
      };
      this.$refs.form.reset();
    },
    
    resetRequestForm() {
      this.bankRequest = {
        bank_name: '',
        account_number: '',
        account_type: ''
      };
      this.$refs.requestForm.reset();
    },
    
    getAccountTypeLabel(type) {
      const accountType = this.accountTypes.find(t => t.value === type);
      return accountType ? accountType.text : type;
    },
    
    getStatusLabel(status) {
      const statusMap = {
        'pending': 'В обработке',
        'completed': 'Завершен',
        'failed': 'Ошибка',
        'cancelled': 'Отменен'
      };
      return statusMap[status] || status;
    },
    
    getStatusColor(status) {
      const colorMap = {
        'pending': 'warning',
        'completed': 'success',
        'failed': 'error',
        'cancelled': 'grey'
      };
      return colorMap[status] || 'grey';
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Не указано';
      return new Date(dateString).toLocaleDateString('ru-RU');
    },
    
    showSnackbar(message, color = 'success') {
      this.snackbar = {
        show: true,
        message,
        color
      };
    }
  }
};
</script>

<style scoped>
.bank-accounts-page {
  padding: 20px 0;
}

.v-list-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
}

.v-list-item:hover {
  background-color: #f5f5f5;
}
</style> 