<template>
  <v-container class="clients-container">
    <v-row>
      <v-col>
        <h1 class="clients-title">Клиенты</h1>
        <v-row class="filter-row" align="center">
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Поиск по имени или email"
              prepend-inner-icon="mdi-magnify"
              outlined
              dense
              clearable
              @input="filterClients"
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
              class="filter-select"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn color="primary" @click="openAddDialog" class="add-btn">
              <v-icon left>mdi-plus</v-icon> Добавить клиента
            </v-btn>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="filteredClients"
          :loading="loading"
          class="clients-table"
          :items-per-page="10"
          :footer-props="{ 'items-per-page-options': [5, 10, 20, -1] }"
        >
          <template v-slot:item.amount="{ item }">
            <span>{{ item.amount !== null ? `${item.amount} ₽` : '—' }}</span>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn small color="primary" @click="openEditDialog(item)" class="action-btn ma-1">
              <v-icon small left>mdi-pencil</v-icon>
              <span class="d-none d-sm-inline">Редактировать</span>
            </v-btn>
            <v-btn small color="error" @click="deleteClient(item.client_id)" class="action-btn ma-1">
              <v-icon small left>mdi-delete</v-icon>
              <span class="d-none d-sm-inline">Удалить</span>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <!-- Диалог добавления/редактирования -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card class="dialog-card">
        <v-card-title class="dialog-title">
          {{ editMode ? 'Редактировать клиента' : 'Добавить клиента' }}
          <v-spacer />
          <v-btn icon @click="dialog = false" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form v-model="valid" ref="form">
            <v-text-field
              v-model="form.name"
              label="Имя"
              required
              :rules="[v => !!v || 'Обязательное поле']"
              outlined
              dense
              class="form-field"
            />
            <v-text-field
              v-model="form.phone"
              label="Телефон"
              outlined
              dense
              class="form-field"
            />
            <v-text-field
              v-model="form.email"
              label="Email"
              :rules="[v => !v || /.+@.+\..+/.test(v) || 'Неверный email']"
              outlined
              dense
              class="form-field"
            />
            <v-text-field
              v-model="form.amount"
              label="Сумма (₽)"
              type="number"
              outlined
              dense
              class="form-field"
            />
            <v-textarea
              v-model="form.description"
              label="Описание"
              outlined
              rows="3"
              class="form-field"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn color="grey" text @click="dialog = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveClient" :disabled="!valid" :loading="saving">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { addClient, getClients, updateClient, deleteClient } from '../api';

export default {
  data() {
    return {
      clients: [],
      filteredClients: [],
      loading: false,
      saving: false,
      dialog: false,
      editMode: false,
      valid: false,
      searchQuery: '',
      filter: { amount: null },
      form: {
        name: '',
        phone: '',
        email: '',
        amount: null,
        description: '',
        client_id: null,
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
    };
  },
  created() {
    this.fetchClients();
  },
  methods: {
    async fetchClients() {
      this.loading = true;
      try {
        const filters = {};
        if (this.searchQuery) filters.name = this.searchQuery;
        if (this.filter.amount) {
          const [min, max] = this.filter.amount.split('-');
          filters.amount_min = min || 0;
          filters.amount_max = max || (this.filter.amount === '50000+' ? null : max);
        }
        this.clients = await getClients(filters);
        this.filteredClients = this.clients; // Фильтрация теперь на сервере
      } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
        const message = error.response?.data?.detail || 'Не удалось загрузить список клиентов';
        this.$toast.error(message);
      } finally {
        this.loading = false;
      }
    },
    filterClients() {
      this.fetchClients(); // Вызываем серверную фильтрацию
    },
    openAddDialog() {
      this.editMode = false;
      this.form = { name: '', phone: '', email: '', amount: null, description: '', client_id: null };
      this.dialog = true;
      this.$nextTick(() => this.$refs.form.resetValidation());
    },
    openEditDialog(item) {
      this.editMode = true;
      this.form = { ...item, amount: item.amount !== null ? item.amount : null };
      this.dialog = true;
      this.$nextTick(() => this.$refs.form.resetValidation());
    },
    async saveClient() {
      this.saving = true;
      try {
        if (this.editMode) {
          await updateClient(this.form.client_id, this.form);
          this.$toast.success('Клиент обновлён');
        } else {
          await addClient(this.form);
          this.$toast.success('Клиент добавлен');
        }
        this.dialog = false;
        await this.fetchClients();
      } catch (error) {
        console.error('Ошибка сохранения клиента:', error);
        const message = error.response?.data?.detail || 'Не удалось сохранить клиента';
        this.$toast.error(message);
      } finally {
        this.saving = false;
      }
    },
    async deleteClient(clientId) {
      if (confirm('Вы уверены, что хотите удалить клиента?')) {
        try {
          await deleteClient(clientId);
          this.$toast.success('Клиент удалён');
          await this.fetchClients();
        } catch (error) {
          console.error('Ошибка удаления клиента:', error);
          const message = error.response?.data?.detail || 'Не удалось удалить клиента';
          this.$toast.error(message);
        }
      }
    },
  },
};
</script>

<style scoped>
.clients-container {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-out;
}

.clients-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 28px;
  color: #1e88e5;
  margin-bottom: 20px;
}

.filter-row {
  margin-bottom: 20px;
}

.search-field {
  background: #fff;
  border-radius: 8px;
}

.filter-select {
  background: #fff;
  border-radius: 8px;
}

.add-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.clients-table {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.clients-table th {
  font-family: 'Gilroy-Medium', sans-serif !important;
  color: #37474f !important;
}

.clients-table td {
  font-family: 'Gilroy-Regular', sans-serif;
  color: #546e7a;
}

.action-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 6px;
}

.dialog-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.dialog-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 20px;
  color: #1e88e5;
}

.form-field {
  margin-bottom: 12px;
}

.dialog-actions {
  padding: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 600px) {
  .clients-container {
    padding: 16px;
  }
  .clients-title {
    font-size: 24px;
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
    justify-content: flex-start;
  }
}
</style>