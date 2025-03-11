<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Калькулятор налогов (РФ)</h1>
        <v-card class="form-card">
          <v-card-text>
            <v-form @submit.prevent="calculateTax" ref="form">
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
                :rules="[
                  v => v >= 0 || 'Доход не может быть отрицательным',
                  v => /^\d+$/.test(v) || 'Введите только цифры'
                ]"
                :hint="taxType === 'usn' ? 'Для ИП на УСН учитываются страховые взносы' : ''"
                persistent-hint
                @input="resetResults"
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
                :rules="[
                  v => v >= 0 || 'Доход не может быть отрицательным',
                  v => /^\d+$/.test(v) || 'Введите только цифры'
                ]"
                hint="Ставка 4% для доходов от физлиц"
                persistent-hint
                @input="resetResults"
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
                :rules="[
                  v => v >= 0 || 'Доход не может быть отрицательным',
                  v => /^\d+$/.test(v) || 'Введите только цифры'
                ]"
                hint="Ставка 6% для доходов от юрлиц"
                persistent-hint
                @input="resetResults"
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
                :rules="[
                  v => v >= 0 || 'Расходы не могут быть отрицательными',
                  v => /^\d+$/.test(v) || 'Введите только цифры',
                  v => v <= this.income || 'Расходы не могут превышать доход'
                ]"
                hint="Учитываются только при УСН 'Доходы минус расходы'"
                persistent-hint
                @input="resetResults"
              ></v-text-field>

              <!-- Кнопки -->
              <v-btn
                color="primary"
                type="submit"
                :disabled="!isFormValid"
                class="calculate-btn mr-2"
              >
                Рассчитать
              </v-btn>
              <v-btn
                color="secondary"
                @click="compareAllSystems"
                :disabled="!isFormValid"
                class="calculate-btn mr-2"
              >
                Сравнить все
              </v-btn>
              <v-btn
                color="error"
                @click="clearData"
                class="calculate-btn"
              >
                Очистить
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Предупреждение о лимитах -->
    <v-row v-if="limitWarning">
      <v-col cols="12">
        <v-alert type="warning" dense>
          {{ limitWarning }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Результаты -->
    <v-row v-if="results">
      <v-col cols="12">
        <v-card class="result-card">
          <v-card-title class="result-title">Результаты расчета</v-card-title>
          <v-card-text class="result-text">
            <p v-if="taxType === 'ndfl' || comparisonMode">
              НДФЛ (13%): <span class="amount">{{ results.ndfl.toLocaleString() }}</span> руб.
            </p>
            <p v-if="taxType === 'usn' || comparisonMode">
              УСН ({{ usnRate }}%): <span class="amount">{{ results.usn.toLocaleString() }}</span> руб.
              <br>
              Страховые взносы: <span class="amount">{{ results.insurance.toLocaleString() }}</span> руб.
              <br v-if="results.usnReduction">
              Вычет взносов: <span class="amount">{{ results.usnReduction.toLocaleString() }}</span> руб.
              <br>
              Итого к уплате: <span class="amount total">{{ results.total.toLocaleString() }}</span> руб.
            </p>
            <p v-if="taxType === 'npd' || comparisonMode">
              НПД: <span class="amount">{{ results.npd.toLocaleString() }}</span> руб.
              <br v-if="taxType === 'npd' || comparisonMode">
              - от физлиц (4%): <span class="amount">{{ results.npdFromIndividuals.toLocaleString() }}</span> руб.
              <br>
              - от юрлиц (6%): <span class="amount">{{ results.npdFromEntities.toLocaleString() }}</span> руб.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диаграмма -->
    <v-row v-if="results">
      <v-col cols="12">
        <v-card class="chart-card">
          <v-card-title class="result-title">Распределение налогов</v-card-title>
          <v-card-text>
            <BarChart :chart-data="chartData" :options="chartOptions" />
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

// Регистрация компонентов Chart.js
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
      results: null,
      limitWarning: null,
      comparisonMode: false,
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
          },
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw.toLocaleString()} руб.` } },
        },
      },
    };
  },
  computed: {
    filteredTaxTypes() {
      return this.taxTypes.filter(type => type.statuses.includes(this.status));
    },
    isFormValid() {
      if (this.taxType === 'ndfl') {
        return this.income >= 0 && /^\d+$/.test(this.income);
      }
      if (this.taxType === 'usn') {
        return (
          this.income >= 0 &&
          this.expenses >= 0 &&
          this.income >= this.expenses &&
          /^\d+$/.test(this.income) &&
          /^\d+$/.test(this.expenses)
        );
      }
      if (this.taxType === 'npd') {
        return (
          this.incomeFromIndividuals >= 0 &&
          this.incomeFromEntities >= 0 &&
          /^\d+$/.test(this.incomeFromIndividuals) &&
          /^\d+$/.test(this.incomeFromEntities)
        );
      }
      return false;
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
    },
    checkLimits() {
      if (this.taxType === 'npd' || this.comparisonMode) {
        const totalNpdIncome = this.incomeFromIndividuals + this.incomeFromEntities;
        if (totalNpdIncome > 2400000) {
          this.limitWarning = 'Доход для НПД превышает лимит в 2.4 млн руб. в год.';
        }
      }
    },
    calculateInsurance(income) {
      const fixedInsurance2025 = 45842;
      const additionalInsurance = income > 300000 ? (income - 300000) * 0.01 : 0;
      return Math.min(fixedInsurance2025 + additionalInsurance, fixedInsurance2025 * 8);
    },
    calculateTax() {
      if (!this.$refs.form.validate()) return;

      this.comparisonMode = false;
      this.checkLimits();
      this.saveData();

      if (this.taxType === 'ndfl') {
        const ndfl = this.income * 0.13;
        this.results = { ndfl };
        this.updateChart([{ label: 'НДФЛ', data: [ndfl], backgroundColor: '#4CAF50' }]); // Зеленый
      } else if (this.taxType === 'usn') {
        const taxableBase = this.income - this.expenses > 0 ? this.income - this.expenses : this.income;
        const usnRate = this.income - this.expenses > 0 ? 0.15 : 0.06;
        const usn = taxableBase * usnRate;
        const insurance = this.status === 'ip' ? this.calculateInsurance(this.income) : 0;
        let total = usn + insurance;
        let usnReduction = 0;

        if (usnRate === 0.06 && this.status === 'ip') {
          usnReduction = Math.min(insurance, usn * 0.5);
          total = Math.max(usn - usnReduction, 0) + insurance;
        }

        this.results = { usn, insurance, total, usnReduction };
        this.updateChart([
          { label: 'УСН', data: [usn], backgroundColor: '#2196F3' }, // Синий
          { label: 'Страховые взносы', data: [insurance], backgroundColor: '#FF9800' }, // Оранжевый
          { label: 'Вычет', data: [usnReduction], backgroundColor: '#8BC34A' }, // Светло-зеленый
          { label: 'Итого', data: [total], backgroundColor: '#F44336' }, // Красный
        ]);
      } else if (this.taxType === 'npd') {
        const npdFromIndividuals = this.incomeFromIndividuals * 0.04;
        const npdFromEntities = this.incomeFromEntities * 0.06;
        const npd = npdFromIndividuals + npdFromEntities;
        this.results = { npd, npdFromIndividuals, npdFromEntities };
        this.updateChart([
          { label: 'НПД (физлица)', data: [npdFromIndividuals], backgroundColor: '#3F51B5' }, // Индиго
          { label: 'НПД (юрлица)', data: [npdFromEntities], backgroundColor: '#9C27B0' }, // Фиолетовый
          { label: 'Итого НПД', data: [npd], backgroundColor: '#E91E63' }, // Розовый
        ]);
      }
    },
    compareAllSystems() {
      if (!this.$refs.form.validate()) return;

      this.comparisonMode = true;
      this.checkLimits();
      this.saveData();

      const results = {};

      // НДФЛ
      results.ndfl = this.income * 0.13;

      // УСН
      const taxableBase = this.income - this.expenses > 0 ? this.income - this.expenses : this.income;
      const usnRate = this.income - this.expenses > 0 ? 0.15 : 0.06;
      const usn = taxableBase * usnRate;
      const insurance = this.status === 'ip' ? this.calculateInsurance(this.income) : 0;
      let total = usn + insurance;
      let usnReduction = 0;
      if (usnRate === 0.06 && this.status === 'ip') {
        usnReduction = Math.min(insurance, usn * 0.5);
        total = Math.max(usn - usnReduction, 0) + insurance;
      }
      results.usn = usn;
      results.insurance = insurance;
      results.total = total;
      results.usnReduction = usnReduction;

      // НПД
      const npdFromIndividuals = this.incomeFromIndividuals * 0.04;
      const npdFromEntities = this.incomeFromEntities * 0.06;
      const npd = npdFromIndividuals + npdFromEntities;
      results.npd = npd;
      results.npdFromIndividuals = npdFromIndividuals;
      results.npdFromEntities = npdFromEntities;

      this.results = results;
      this.updateChart([
        { label: 'НДФЛ', data: [results.ndfl], backgroundColor: '#4CAF50' }, // Зеленый
        { label: 'УСН', data: [usn], backgroundColor: '#2196F3' }, // Синий
        { label: 'Страховые взносы', data: [insurance], backgroundColor: '#FF9800' }, // Оранжевый
        { label: 'Вычет', data: [usnReduction], backgroundColor: '#8BC34A' }, // Светло-зеленый
        { label: 'УСН Итого', data: [total], backgroundColor: '#F44336' }, // Красный
        { label: 'НПД', data: [npd], backgroundColor: '#E91E63' }, // Розовый
      ]);
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
      const savedData = localStorage.getItem('taxCalculatorData');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.status = data.status;
        this.taxType = data.taxType;
        this.income = data.income;
        this.expenses = data.expenses;
        this.incomeFromIndividuals = data.incomeFromIndividuals;
        this.incomeFromEntities = data.incomeFromEntities;
      }
    },
    clearData() {
      // Очистка данных и localStorage
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
      localStorage.removeItem('taxCalculatorData');
      this.$refs.form.resetValidation(); // Сброс валидации формы
    },
    updateChart(datasets) {
      this.chartData = {
        labels: ['Налоги'],
        datasets: datasets.filter(d => d.data[0] > 0),
      };
    },
  },
};
</script>

<style scoped>
/* Заголовок */
.text-h4 {
  font-weight: 500;
  color: #2c3e50;
  text-align: center;
}

/* Карточка формы */
.form-card {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
}

/* Поля ввода и селект */
.v-select,
.v-text-field {
  max-width: 400px;
  margin: 0 auto;
}

/* Кнопка "Рассчитать" */
.calculate-btn {
  display: inline-block;
  margin: 20px 5px 0;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 6px;
  text-transform: none;
  transition: background-color 0.3s;
}

.calculate-btn:hover {
  background-color: #1976d2 !important; /* Для primary */
}

/* Карточка результатов */
.result-card,
.chart-card {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
}

/* Заголовок результатов */
.result-title {
  font-size: 20px;
  color: #34495e;
}

/* Текст результатов */
.result-text {
  font-size: 16px;
  color: #333;
  line-height: 1.6;
}

/* Суммы в результатах */
.amount {
  font-weight: bold;
  color: #2980b9;
}

/* Итоговая сумма */
.amount.total {
  color: #e74c3c;
  font-size: 18px;
}

/* Адаптивность и высота диаграммы */
.chart-card {
  height: 400px; /* Десктоп */
}

@media (max-width: 960px) {
  .chart-card {
    height: 350px; /* Планшет */
  }
}

@media (max-width: 600px) {
  .v-select,
  .v-text-field {
    max-width: 100%;
  }

  .calculate-btn {
    width: 100%;
    margin: 10px 0;
  }

  .chart-card {
    height: 300px; /* Мобильные устройства */
  }
}
</style>