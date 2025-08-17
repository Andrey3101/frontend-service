<template>
  <div class="client-analysis-page">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-chart-line</v-icon>
              Анализ клиентской базы
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                @click="showAnalysisDialog = true"
                prepend-icon="mdi-plus"
              >
                Анализировать клиента
              </v-btn>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>

      <!-- Статистика по клиентам -->
      <v-row>
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-primary">{{ totalClients }}</div>
              <div class="text-subtitle-1">Всего клиентов</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-success">{{ vipClients }}</div>
              <div class="text-subtitle-1">VIP клиенты</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-warning">{{ atRiskClients }}</div>
              <div class="text-subtitle-1">Под угрозой оттока</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-info">{{ formatCurrency(totalRevenue) }}</div>
              <div class="text-subtitle-1">Общий доход</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Графики и аналитика -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Сегментация клиентов</v-card-title>
            <v-card-text>
              <canvas ref="segmentChart" width="400" height="300"></canvas>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Топ клиенты по доходу</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="(client, index) in topClients"
                  :key="client.id"
                  :class="index < 3 ? 'top-client' : ''"
                >
                  <template v-slot:prepend>
                    <v-avatar
                      :color="index < 3 ? 'primary' : 'grey'"
                      size="32"
                    >
                      {{ index + 1 }}
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title>{{ client.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatCurrency(client.total_revenue) }}</v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <v-chip
                      :color="getSegmentColor(client.segment)"
                      size="small"
                    >
                      {{ getSegmentText(client.segment) }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Список клиентов с анализом -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              Клиенты с анализом ({{ filteredClients.length }})
            </v-card-title>
            
            <v-card-text>
              <v-text-field
                v-model="searchQuery"
                label="Поиск по имени клиента"
                prepend-icon="mdi-magnify"
                clearable
                @input="filterClients"
              ></v-text-field>
              
              <v-data-table
                :headers="headers"
                :items="filteredClients"
                :loading="loading"
                :items-per-page="10"
                class="elevation-1"
              >
                <template v-slot:item.segment="{ item }">
                  <v-chip
                    :color="getSegmentColor(item.segment)"
                    size="small"
                  >
                    {{ getSegmentText(item.segment) }}
                  </v-chip>
                </template>
                
                <template v-slot:item.churn_probability="{ item }">
                  <v-chip
                    :color="getChurnColor(item.churn_probability)"
                    size="small"
                  >
                    {{ Math.round(item.churn_probability * 100) }}%
                  </v-chip>
                </template>
                
                <template v-slot:item.total_revenue="{ item }">
                  {{ formatCurrency(item.total_revenue) }}
                </template>
                
                <template v-slot:item.customer_lifetime_value="{ item }">
                  {{ formatCurrency(item.customer_lifetime_value) }}
                </template>
                
                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="viewClientAnalysis(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-refresh"
                    size="small"
                    variant="text"
                    @click="refreshAnalysis(item)"
                    :loading="refreshing === item.id"
                  ></v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Диалог анализа клиента -->
      <v-dialog v-model="showAnalysisDialog" max-width="600px">
        <v-card>
          <v-card-title>Анализ клиента</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-select
                v-model="selectedClient"
                label="Выберите клиента"
                :items="availableClients"
                item-title="name"
                item-value="id"
                :rules="[rules.required]"
                return-object
              ></v-select>
              
              <v-select
                v-model="analysisPeriod"
                label="Период анализа"
                :items="analysisPeriods"
                :rules="[rules.required]"
              ></v-select>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showAnalysisDialog = false">Отмена</v-btn>
            <v-btn
              color="primary"
              @click="analyzeClient"
              :loading="analyzing"
              :disabled="!valid"
            >
              Анализировать
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Диалог просмотра анализа -->
      <v-dialog v-model="showViewDialog" max-width="800px">
        <v-card>
          <v-card-title>Анализ клиента: {{ selectedAnalysis?.client_name }}</v-card-title>
          <v-card-text v-if="selectedAnalysis">
            <v-row>
              <v-col cols="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-currency-rub</v-icon>
                    </template>
                    <v-list-item-title>Общий доход</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(selectedAnalysis.total_revenue) }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-shopping</v-icon>
                    </template>
                    <v-list-item-title>Количество заказов</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedAnalysis.total_orders }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-calculator</v-icon>
                    </template>
                    <v-list-item-title>Средний чек</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(selectedAnalysis.average_order_value) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              
              <v-col cols="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-tag</v-icon>
                    </template>
                    <v-list-item-title>Сегмент</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getSegmentColor(selectedAnalysis.segment)"
                        size="small"
                      >
                        {{ getSegmentText(selectedAnalysis.segment) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-alert</v-icon>
                    </template>
                    <v-list-item-title>Вероятность оттока</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getChurnColor(selectedAnalysis.churn_probability)"
                        size="small"
                      >
                        {{ Math.round(selectedAnalysis.churn_probability * 100) }}%
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-chart-line</v-icon>
                    </template>
                    <v-list-item-title>Lifetime Value</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(selectedAnalysis.customer_lifetime_value) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
            
            <!-- Рекомендации -->
            <v-card class="mt-4" variant="outlined">
              <v-card-title>Рекомендации</v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="(recommendation, index) in getRecommendations(selectedAnalysis)"
                    :key="index"
                  >
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-lightbulb</v-icon>
                    </template>
                    <v-list-item-title>{{ recommendation }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
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
import { analyzeClient, getClients } from '@/api/index.js';
import Chart from 'chart.js/auto';

export default {
  name: 'ClientAnalysisPage',
  
  data() {
    return {
      loading: false,
      analyzing: false,
      refreshing: null,
      clients: [],
      filteredClients: [],
      searchQuery: '',
      showAnalysisDialog: false,
      showViewDialog: false,
      selectedAnalysis: null,
      valid: false,
      
      selectedClient: null,
      analysisPeriod: 'all',
      
      analysisPeriods: [
        { title: 'Все время', value: 'all' },
        { title: 'За месяц', value: 'month' },
        { title: 'За квартал', value: 'quarter' },
        { title: 'За год', value: 'year' }
      ],
      
      headers: [
        { title: 'Имя клиента', key: 'client_name', sortable: true },
        { title: 'Сегмент', key: 'segment', sortable: true },
        { title: 'Общий доход', key: 'total_revenue', sortable: true },
        { title: 'Количество заказов', key: 'total_orders', sortable: true },
        { title: 'Средний чек', key: 'average_order_value', sortable: true },
        { title: 'Вероятность оттока', key: 'churn_probability', sortable: true },
        { title: 'Lifetime Value', key: 'customer_lifetime_value', sortable: true },
        { title: 'Действия', key: 'actions', sortable: false }
      ],
      
      rules: {
        required: v => !!v || 'Обязательное поле'
      },
      
      segmentChart: null
    };
  },
  
  computed: {
    totalClients() {
      return this.clients.length;
    },
    
    vipClients() {
      return this.clients.filter(c => c.segment === 'vip').length;
    },
    
    atRiskClients() {
      return this.clients.filter(c => c.churn_probability > 0.7).length;
    },
    
    totalRevenue() {
      return this.clients.reduce((sum, c) => sum + c.total_revenue, 0);
    },
    
    topClients() {
      return [...this.clients]
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);
    },
    
    availableClients() {
      // В реальности здесь будет список клиентов без анализа
      return [
        { id: '1', name: 'ООО "Клиент 1"' },
        { id: '2', name: 'ИП Иванов' },
        { id: '3', name: 'ООО "Клиент 3"' }
      ];
    }
  },
  
  async mounted() {
    await this.loadClients();
    this.initChart();
  },
  
  methods: {
    async loadClients() {
      this.loading = true;
      try {
        // В реальности здесь будет вызов API для получения списка клиентов с анализом
        // Пока используем моковые данные
        this.clients = [
          {
            id: '1',
            client_name: 'ООО "Клиент 1"',
            total_revenue: 500000,
            total_orders: 25,
            average_order_value: 20000,
            customer_lifetime_value: 50000,
            churn_probability: 0.1,
            segment: 'vip'
          },
          {
            id: '2',
            client_name: 'ИП Иванов',
            total_revenue: 150000,
            total_orders: 15,
            average_order_value: 10000,
            customer_lifetime_value: 15000,
            churn_probability: 0.3,
            segment: 'regular'
          },
          {
            id: '3',
            client_name: 'ООО "Клиент 3"',
            total_revenue: 50000,
            total_orders: 5,
            average_order_value: 10000,
            customer_lifetime_value: 5000,
            churn_probability: 0.8,
            segment: 'at_risk'
          }
        ];
        this.filteredClients = [...this.clients];
      } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
        this.$toast.error('Ошибка загрузки клиентов');
      } finally {
        this.loading = false;
      }
    },
    
    async analyzeClient() {
      if (!this.$refs.form.validate()) return;
      
      this.analyzing = true;
      try {
        const response = await analyzeClient(
          this.selectedClient.id,
          this.analysisPeriod
        );
        
        if (response.status === 'success') {
          // Добавляем имя клиента к анализу
          const analysis = {
            ...response.analysis,
            client_name: this.selectedClient.name
          };
          
          this.clients.push(analysis);
          this.filteredClients = [...this.clients];
          this.showAnalysisDialog = false;
          this.resetForm();
          this.$toast.success('Анализ клиента выполнен успешно');
        }
      } catch (error) {
        console.error('Ошибка анализа клиента:', error);
        this.$toast.error('Ошибка анализа клиента');
      } finally {
        this.analyzing = false;
      }
    },
    
    async refreshAnalysis(client) {
      this.refreshing = client.id;
      try {
        // В реальности здесь будет обновление анализа
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.$toast.success('Анализ клиента обновлен');
      } catch (error) {
        console.error('Ошибка обновления анализа:', error);
        this.$toast.error('Ошибка обновления анализа');
      } finally {
        this.refreshing = null;
      }
    },
    
    viewClientAnalysis(client) {
      this.selectedAnalysis = client;
      this.showViewDialog = true;
    },
    
    filterClients() {
      if (!this.searchQuery) {
        this.filteredClients = [...this.clients];
        return;
      }
      
      const query = this.searchQuery.toLowerCase();
      this.filteredClients = this.clients.filter(client =>
        client.client_name.toLowerCase().includes(query)
      );
    },
    
    resetForm() {
      this.selectedClient = null;
      this.analysisPeriod = 'all';
      this.$refs.form.resetValidation();
    },
    
    initChart() {
      const ctx = this.$refs.segmentChart.getContext('2d');
      this.segmentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['VIP', 'Regular', 'At Risk'],
          datasets: [{
            data: [this.vipClients, this.clients.filter(c => c.segment === 'regular').length, this.atRiskClients],
            backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    },
    
    getSegmentColor(segment) {
      const colors = {
        vip: 'success',
        regular: 'warning',
        at_risk: 'error'
      };
      return colors[segment] || 'grey';
    },
    
    getSegmentText(segment) {
      const texts = {
        vip: 'VIP',
        regular: 'Regular',
        at_risk: 'At Risk'
      };
      return texts[segment] || segment;
    },
    
    getChurnColor(probability) {
      if (probability <= 0.3) return 'success';
      if (probability <= 0.6) return 'warning';
      return 'error';
    },
    
    getRecommendations(analysis) {
      const recommendations = [];
      
      if (analysis.segment === 'at_risk') {
        recommendations.push('Предложить специальные условия для удержания клиента');
        recommendations.push('Увеличить частоту коммуникации');
        recommendations.push('Провести опрос удовлетворенности');
      }
      
      if (analysis.average_order_value < 15000) {
        recommendations.push('Предложить дополнительные товары/услуги');
        recommendations.push('Создать программы лояльности');
      }
      
      if (analysis.churn_probability > 0.5) {
        recommendations.push('Персональный менеджер для клиента');
        recommendations.push('Специальные предложения и скидки');
      }
      
      if (recommendations.length === 0) {
        recommendations.push('Клиент в хорошем состоянии, поддерживать текущий уровень сервиса');
      }
      
      return recommendations;
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
.client-analysis-page {
  padding: 20px;
}

.v-data-table {
  margin-top: 20px;
}

.top-client {
  background-color: rgba(33, 150, 243, 0.1);
}

canvas {
  max-height: 300px;
}
</style> 