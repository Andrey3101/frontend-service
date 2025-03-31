<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Калькулятор налогов (РФ)</h1>
        
        <!-- Сообщения об ошибках и предупреждениях -->
        <v-row v-if="errorMessage || limitWarning">
          <v-col cols="12">
            <v-alert v-if="errorMessage" type="error" dismissible @input="errorMessage = ''">
              <v-icon left>mdi-alert-circle</v-icon>
              {{ errorMessage }}
            </v-alert>
            <v-alert v-if="limitWarning" type="warning" dense>
              <v-icon left>mdi-alert</v-icon>
              {{ limitWarning }}
            </v-alert>
          </v-col>
        </v-row>
        
        <v-card class="form-card">
          <v-card-text>
            <v-form @submit.prevent="calculateTax" ref="form" lazy-validation>
              <!-- Выбор статуса -->
              <v-select
                v-model="status"
                :items="statuses"
                label="Статус"
                outlined
                dense
                class="mb-3"
                :rules="[v => !!v || 'Выберите статус']"
                item-text="text"
                item-value="value"
                @change="resetResults"
                :error-messages="fieldErrors.status"
              ></v-select>

              <!-- Тип налогообложения -->
              <v-select
                v-model="taxType"
                :items="filteredTaxTypes"
                label="Тип налогообложения"
                outlined
                dense
                class="mb-3"
                :rules="[v => !!v || 'Выберите тип налогообложения']"
                item-text="text"
                item-value="value"
                @change="resetResults"
                :error-messages="fieldErrors.taxType"
              ></v-select>

              <!-- Доход для НДФЛ и УСН -->
              <v-text-field
                v-if="taxType !== 'npd'"
                v-model.number="income"
                label="Доход (руб.)"
                type="number"
                outlined
                dense
                class="mb-3"
                :rules="incomeRules"
                :hint="taxType === 'usn' ? 'Для ИП на УСН учитываются страховые взносы' : ''"
                persistent-hint
                @input="resetResults"
                :error-messages="fieldErrors.income"
              ></v-text-field>

              <!-- Доход от физлиц для НПД -->
              <v-text-field
                v-if="taxType === 'npd'"
                v-model.number="incomeFromIndividuals"
                label="Доход от физлиц (руб.)"
                type="number"
                outlined
                dense
                class="mb-3"
                :rules="incomeRules"
                hint="Ставка 4% для доходов от физлиц"
                persistent-hint
                @input="resetResults"
                :error-messages="fieldErrors.incomeFromIndividuals"
              ></v-text-field>

              <!-- Доход от юрлиц для НПД -->
              <v-text-field
                v-if="taxType === 'npd'"
                v-model.number="incomeFromEntities"
                label="Доход от юрлиц (руб.)"
                type="number"
                outlined
                dense
                class="mb-3"
                :rules="incomeRules"
                hint="Ставка 6% для доходов от юрлиц"
                persistent-hint
                @input="resetResults"
                :error-messages="fieldErrors.incomeFromEntities"
              ></v-text-field>

              <!-- Расходы для УСН -->
              <v-text-field
                v-if="taxType === 'usn'"
                v-model.number="expenses"
                label="Расходы (руб.)"
                type="number"
                outlined
                dense
                class="mb-3"
                :rules="expensesRules"
                hint="Учитываются только при УСН 'Доходы минус расходы'"
                persistent-hint
                @input="resetResults"
                :error-messages="fieldErrors.expenses"
              ></v-text-field>

              <!-- Кнопки -->
              <div class="button-group">
                <v-btn
                  color="primary"
                  type="submit"
                  :disabled="!isFormValid"
                  :loading="loading"
                  class="action-btn"
                  elevation="2"
                >
                  <v-icon left>mdi-calculator</v-icon>
                  Рассчитать
                </v-btn>
                <v-btn
                  color="primary"
                  outlined
                  @click="compareAllSystems"
                  :disabled="!isFormValid || loading"
                  :loading="comparisonLoading"
                  class="action-btn"
                  elevation="2"
                >
                  <v-icon left>mdi-scale-balance</v-icon>
                  Сравнить все
                </v-btn>
                <v-btn
                  color="error"
                  outlined
                  @click="clearData"
                  :disabled="loading || comparisonLoading"
                  class="action-btn"
                  elevation="2"
                >
                  <v-icon left>mdi-broom</v-icon>
                  Очистить
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Результаты -->
    <v-row v-if="results && !loading">
      <v-col cols="12">
        <v-card class="result-card">
          <v-card-title class="result-title">
            <v-icon left color="primary">mdi-chart-bar</v-icon>
            Результаты расчета
          </v-card-title>
          <v-card-text class="result-text">
            <template v-if="taxType === 'ndfl' || comparisonMode">
              <div class="result-item">
                <span>НДФЛ (13%):</span>
                <span class="amount">{{ formatCurrency(results.ndfl) }}</span>
              </div>
            </template>
            
            <template v-if="taxType === 'usn' || comparisonMode">
              <div class="result-item">
                <span>УСН ({{ usnRate }}%):</span>
                <span class="amount">{{ formatCurrency(results.usn) }}</span>
              </div>
              <div class="result-item">
                <span>Страховые взносы:</span>
                <span class="amount">{{ formatCurrency(results.insurance) }}</span>
              </div>
              <div v-if="results.usnReduction" class="result-item">
                <span>Вычет взносов:</span>
                <span class="amount">{{ formatCurrency(results.usnReduction) }}</span>
              </div>
              <div class="result-item total">
                <span>Итого к уплате:</span>
                <span class="amount total">{{ formatCurrency(results.total) }}</span>
              </div>
            </template>
            
            <template v-if="taxType === 'npd' || comparisonMode">
              <div class="result-item">
                <span>Всего НПД:</span>
                <span class="amount">{{ formatCurrency(results.npd) }}</span>
              </div>
              <div class="result-item">
                <span>- от физлиц (4%):</span>
                <span class="amount">{{ formatCurrency(results.npdFromIndividuals) }}</span>
              </div>
              <div class="result-item">
                <span>- от юрлиц (6%):</span>
                <span class="amount">{{ formatCurrency(results.npdFromEntities) }}</span>
              </div>
            </template>
          </v-card-text>
        </v-card>
      </v-col>
    </row>

    <!-- Диаграмма -->
    <v-row v-if="chartData.labels.length > 0 && !loading">
      <v-col cols="12">
        <v-card class="chart-card">
          <v-card-title class="result-title">
            <v-icon left color="primary">mdi-chart-pie</v-icon>
            Распределение налогов
          </v-card-title>
          <v-card-text>
            <div class="chart-container">
              <BarChart :chart-data="chartData" :options="chartOptions" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
  name: 'TaxCalculator',
  components: {
    BarChart: Bar,
  },
  data() {
    return {
      status: 'selfEmployed',
      statuses: [
        { text: 'Самозанятый', value: 'selfEmployed' },
        { text: 'ИП', value: 'ip' },
        { text: 'ООО', value: 'ooo' },
      ],
      taxType: 'npd',
      taxTypes: [
        { text: 'НДФЛ (13%)', value: 'ndfl', statuses: ['ip', 'ooo'] },
        { text: 'УСН (Доходы или Доходы минус расходы)', value: 'usn', statuses: ['ip', 'ooo'] },
        { text: 'НПД (4% или 6%)', value: 'npd', statuses: ['selfEmployed', 'ip'] },
      ],
      income: 0,
      expenses: 0,
      incomeFromIndividuals: 0,
      incomeFromEntities: 0,
      loading: false,
      comparisonLoading: false,
      errorMessage: '',
      limitWarning: null,
      results: null,
      comparisonMode: false,
      fieldErrors: {},
      chartData: {
        labels: [],
        datasets: [],
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Сумма (руб.)' },
            ticks: {
              callback: (value) => value.toLocaleString() + ' ₽'
            }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { 
            position: 'top',
            labels: { boxWidth: 12 }
          },
          tooltip: { 
            callbacks: { 
              label: (tooltipItem) => {
                return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString()} ₽`;
              } 
            } 
          },
          datalabels: {
            display: false
          }
        },
      },
      incomeRules: [
        v => v !== null && v !== undefined || 'Введите сумму',
        v => v >= 0 || 'Сумма не может быть отрицательной',
        v => /^\d+$/.test(v) || 'Введите целое число',
        v => v <= 1000000000 || 'Сумма слишком большая'
      ],
      expensesRules: [
        v => v !== null && v !== undefined || 'Введите сумму',
        v => v >= 0 || 'Сумма не может быть отрицательной',
        v => /^\d+$/.test(v) || 'Введите целое число',
        v => v <= this.income || 'Расходы не могут превышать доход',
        v => v <= 1000000000 || 'Сумма слишком большая'
      ]
    };
  },
  computed: {
    filteredTaxTypes() {
      return this.taxTypes.filter(type => type.statuses.includes(this.status));
    },
    isFormValid() {
      return this.$refs.form ? this.$refs.form.validate() : false;
    },
    usnRate() {
      return this.income - this.expenses > 0 ? 15 : 6;
    },
  },
  watch: {
    status(newStatus) {
      if (!this.taxTypes.some(t => t.value === this.taxType && t.statuses.includes(newStatus))) {
        this.taxType = this.filteredTaxTypes[0]?.value || 'npd';
      }
    },
  },
  mounted() {
    this.loadSavedData();
  },
  methods: {
    resetResults() {
      this.results = null;
      this.limitWarning = null;
      this.comparisonMode = false;
      this.chartData = { labels: [], datasets: [] };
      this.clearErrors();
    },
    
    clearErrors() {
      this.errorMessage = '';
      this.fieldErrors = {};
    },
    
    checkLimits() {
      this.limitWarning = null;
      
      if (this.taxType === 'npd' || this.comparisonMode) {
        const totalNpdIncome = this.incomeFromIndividuals + this.incomeFromEntities;
        if (totalNpdIncome > 2400000) {
          this.limitWarning = 'Доход для НПД превышает лимит в 2.4 млн руб. в год.';
        }
      }
      
      if (this.income > 100000000 || this.expenses > 100000000 || 
          this.incomeFromIndividuals > 100000000 || this.incomeFromEntities > 100000000) {
        this.limitWarning = (this.limitWarning ? this.limitWarning + ' ' : '') + 
          'Внимание: введены очень большие суммы. Проверьте правильность ввода.';
      }
    },
    
    calculateInsurance(income) {
      const fixedInsurance2025 = 45842;
      const additionalInsurance = income > 300000 ? (income - 300000) * 0.01 : 0;
      return Math.min(fixedInsurance2025 + additionalInsurance, fixedInsurance2025 * 8);
    },
    
    async calculateTax() {
      if (!this.isFormValid) {
        this.errorMessage = 'Пожалуйста, исправьте ошибки в форме';
        return;
      }

      try {
        this.loading = true;
        this.clearErrors();
        this.checkLimits();
        this.saveData();

        if (this.taxType === 'ndfl') {
          const ndfl = Math.round(this.income * 0.13);
          this.results = { ndfl };
          this.updateChart([{ 
            label: 'НДФЛ', 
            data: [ndfl], 
            backgroundColor: '#4CAF50',
            borderColor: '#388E3C',
            borderWidth: 1
          }]);
        } 
        else if (this.taxType === 'usn') {
          const taxableBase = this.income - this.expenses > 0 ? this.income - this.expenses : this.income;
          const usnRate = this.income - this.expenses > 0 ? 0.15 : 0.06;
          const usn = Math.round(taxableBase * usnRate);
          const insurance = this.status === 'ip' ? this.calculateInsurance(this.income) : 0;
          let total = usn + insurance;
          let usnReduction = 0;

          if (usnRate === 0.06 && this.status === 'ip') {
            usnReduction = Math.min(insurance, usn * 0.5);
            total = Math.max(usn - usnReduction, 0) + insurance;
          }

          this.results = { 
            usn, 
            insurance, 
            total: Math.round(total), 
            usnReduction: Math.round(usnReduction) 
          };
          
          this.updateChart([
            { 
              label: 'УСН', 
              data: [usn], 
              backgroundColor: '#2196F3',
              borderColor: '#1976D2',
              borderWidth: 1
            },
            { 
              label: 'Страховые взносы', 
              data: [insurance], 
              backgroundColor: '#FF9800',
              borderColor: '#FB8C00',
              borderWidth: 1
            },
            { 
              label: 'Вычет', 
              data: [usnReduction], 
              backgroundColor: '#8BC34A',
              borderColor: '#7CB342',
              borderWidth: 1
            },
            { 
              label: 'Итого', 
              data: [total], 
              backgroundColor: '#F44336',
              borderColor: '#E53935',
              borderWidth: 1
            }
          ]);
        } 
        else if (this.taxType === 'npd') {
          const npdFromIndividuals = Math.round(this.incomeFromIndividuals * 0.04);
          const npdFromEntities = Math.round(this.incomeFromEntities * 0.06);
          const npd = npdFromIndividuals + npdFromEntities;
          
          this.results = { 
            npd, 
            npdFromIndividuals, 
            npdFromEntities 
          };
          
          this.updateChart([
            { 
              label: 'НПД (физлица)', 
              data: [npdFromIndividuals], 
              backgroundColor: '#3F51B5',
              borderColor: '#303F9F',
              borderWidth: 1
            },
            { 
              label: 'НПД (юрлица)', 
              data: [npdFromEntities], 
              backgroundColor: '#9C27B0',
              borderColor: '#7B1FA2',
              borderWidth: 1
            },
            { 
              label: 'Итого НПД', 
              data: [npd], 
              backgroundColor: '#E91E63',
              borderColor: '#C2185B',
              borderWidth: 1
            }
          ]);
        }
      } catch (error) {
        this.handleError(error, 'calculateTax');
      } finally {
        this.loading = false;
      }
    },
    
    async compareAllSystems() {
      if (!this.isFormValid) {
        this.errorMessage = 'Пожалуйста, исправьте ошибки в форме';
        return;
      }

      try {
        this.comparisonLoading = true;
        this.clearErrors();
        this.checkLimits();
        this.saveData();

        const results = {};

        // НДФЛ
        results.ndfl = Math.round(this.income * 0.13);

        // УСН
        const taxableBase = this.income - this.expenses > 0 ? this.income - this.expenses : this.income;
        const usnRate = this.income - this.expenses > 0 ? 0.15 : 0.06;
        const usn = Math.round(taxableBase * usnRate);
        const insurance = this.status === 'ip' ? this.calculateInsurance(this.income) : 0;
        let total = usn + insurance;
        let usnReduction = 0;
        
        if (usnRate === 0.06 && this.status === 'ip') {
          usnReduction = Math.min(insurance, usn * 0.5);
          total = Math.max(usn - usnReduction, 0) + insurance;
        }
        
        results.usn = usn;
        results.insurance = insurance;
        results.total = Math.round(total);
        results.usnReduction = Math.round(usnReduction);

        // НПД
        const npdFromIndividuals = Math.round(this.incomeFromIndividuals * 0.04);
        const npdFromEntities = Math.round(this.incomeFromEntities * 0.06);
        const npd = npdFromIndividuals + npdFromEntities;
        
        results.npd = npd;
        results.npdFromIndividuals = npdFromIndividuals;
        results.npdFromEntities = npdFromEntities;

        this.results = results;
        this.comparisonMode = true;
        
        this.updateChart([
          { 
            label: 'НДФЛ', 
            data: [results.ndfl], 
            backgroundColor: '#4CAF50',
            borderColor: '#388E3C',
            borderWidth: 1
          },
          { 
            label: 'УСН', 
            data: [usn], 
            backgroundColor: '#2196F3',
            borderColor: '#1976D2',
            borderWidth: 1
          },
          { 
            label: 'Страховые взносы', 
            data: [insurance], 
            backgroundColor: '#FF9800',
            borderColor: '#FB8C00',
            borderWidth: 1
          },
          { 
            label: 'Вычет', 
            data: [usnReduction], 
            backgroundColor: '#8BC34A',
            borderColor: '#7CB342',
            borderWidth: 1
          },
          { 
            label: 'УСН Итого', 
            data: [total], 
            backgroundColor: '#F44336',
            borderColor: '#E53935',
            borderWidth: 1
          },
          { 
            label: 'НПД', 
            data: [npd], 
            backgroundColor: '#E91E63',
            borderColor: '#C2185B',
            borderWidth: 1
          }
        ]);
      } catch (error) {
        this.handleError(error, 'compareAllSystems');
      } finally {
        this.comparisonLoading = false;
      }
    },
    
    handleError(error, context) {
      console.error(`Error in ${context}:`, error);
      
      let message = 'Произошла ошибка при расчете налогов';
      
      if (error.response) {
        // Обработка ошибок API
        switch (error.response.status) {
          case 400:
            message = 'Некорректные данные для расчета';
            if (error.response.data.errors) {
              this.fieldErrors = error.response.data.errors;
            }
            break;
          case 500:
            message = 'Ошибка сервера. Пожалуйста, попробуйте позже';
            break;
          default:
            message = error.response.data?.message || message;
        }
      } else if (error.request) {
        message = 'Ошибка сети. Проверьте подключение к интернету';
      } else if (error.message) {
        message = error.message;
      }
      
      this.errorMessage = message;
      this.results = null;
      this.chartData = { labels: [], datasets: [] };
    },
    
    saveData() {
      const data = {
        status: this.status,
        taxType: this.taxType,
        income: this.income,
        expenses: this.expenses,
        incomeFromIndividuals: this.incomeFromIndividuals,
        incomeFromEntities: this.incomeFromEntities,
      };
      localStorage.setItem('taxCalculatorData', JSON.stringify(data));
    },
    
    loadSavedData() {
      try {
        const savedData = localStorage.getItem('taxCalculatorData');
        if (savedData) {
          const data = JSON.parse(savedData);
          this.status = data.status || 'selfEmployed';
          this.taxType = data.taxType || 'npd';
          this.income = data.income || 0;
          this.expenses = data.expenses || 0;
          this.incomeFromIndividuals = data.incomeFromIndividuals || 0;
          this.incomeFromEntities = data.incomeFromEntities || 0;
        }
      } catch (e) {
        console.error('Error loading saved data:', e);
        localStorage.removeItem('taxCalculatorData');
      }
    },
    
    clearData() {
      this.status = 'selfEmployed';
      this.taxType = 'npd';
      this.income = 0;
      this.expenses = 0;
      this.incomeFromIndividuals = 0;
      this.incomeFromEntities = 0;
      this.results = null;
      this.limitWarning = null;
      this.comparisonMode = false;
      this.chartData = { labels: [], datasets: [] };
      this.clearErrors();
      localStorage.removeItem('taxCalculatorData');
      
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }
    },
    
    updateChart(datasets) {
      this.chartData = {
        labels: ['Налоги'],
        datasets: datasets.filter(d => d.data[0] > 0).map(dataset => ({
          ...dataset,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }))
      };
    },
    
    formatCurrency(value) {
      return value.toLocaleString('ru-RU') + ' ₽';
    }
  }
};
</script>

<style scoped>
/* Основные стили */
.text-h4 {
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  margin-top: 20px;
}

/* Карточка формы */
.form-card {
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background-color: #ffffff;
  margin-bottom: 24px;
}

/* Поля ввода */
.v-select,
.v-text-field {
  max-width: 500px;
  margin: 0 auto 16px;
}

/* Группа кнопок */
.button-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.action-btn {
  min-width: 180px;
  font-weight: 500;
  letter-spacing: 0.5px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Карточки результатов */
.result-card,
.chart-card {
  margin-top: 24px;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background-color: #ffffff;
}

.result-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
}

.result-text {
  font-size: 16px;
  color: #333;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.result-item.total {
  font-weight: 600;
  border-top: 2px solid #eee;
  margin-top: 8px;
  padding-top: 12px;
}

.amount {
  font-weight: 500;
  color: #1e88e5;
}

.amount.total {
  color: #e53935;
  font-size: 18px;
}

/* Контейнер диаграммы */
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}

/* Адаптивные стили */
@media (max-width: 960px) {
  .form-card {
    padding: 20px;
  }
  
  .button-group {
    flex-direction: column;
    align-items: center;
  }
  
  .action-btn {
    width: 100%;
    max-width: 300px;
  }
  
  .chart-container {
    height: 350px;
  }
}

@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.5rem;
  }
  
  .form-card {
    padding: 16px;
  }
  
  .v-select,
  .v-text-field {
    margin-bottom: 12px;
  }
  
  .result-title {
    font-size: 18px;
  }
  
  .result-text {
    font-size: 15px;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>
