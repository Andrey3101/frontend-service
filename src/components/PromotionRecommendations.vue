<template>
  <v-card class="pa-4" elevation="2">
    <v-card-title class="headline">Рекомендации по продвижению</v-card-title>
    <v-card-subtitle>Введите данные о продажах и конкурентах</v-card-subtitle>
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row>
          <v-col cols="12" sm="6">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model.number="salesData.totalSales"
                  label="Общие продажи (руб)"
                  type="number"
                  outlined
                  :rules="salesRules"
                  @input="clearResultsDebounced"
                  hint="Сумма продаж за выбранный период"
                  persistent-hint
                  v-bind="attrs"
                  v-on="on"
                  aria-label="Общие продажи в рублях"
                ></v-text-field>
              </template>
              <span>Сумма продаж за выбранный период в рублях</span>
            </v-tooltip>
          </v-col>
          <v-col cols="12" sm="6">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model.number="salesData.unitsSold"
                  label="Продано единиц"
                  type="number"
                  outlined
                  :rules="unitsRules"
                  @input="clearResultsDebounced"
                  hint="Количество проданных единиц"
                  persistent-hint
                  v-bind="attrs"
                  v-on="on"
                  aria-label="Количество проданных единиц"
                ></v-text-field>
              </template>
              <span>Количество проданных единиц товара</span>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-select
          v-model="salesData.period"
          :items="periodOptions"
          label="Период анализа"
          outlined
          @change="clearResultsDebounced"
          hint="Выберите период для анализа данных"
          persistent-hint
          aria-label="Период анализа данных"
        ></v-select>

        <!-- Динамическая форма для конкурентов -->
        <v-row v-for="(comp, index) in competitors" :key="`competitor-${index}`" class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="comp.name"
              label="Название конкурента"
              outlined
              :rules="[v => !!v || 'Введите название']"
              @input="clearResultsDebounced"
              aria-label="Название конкурента"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model.number="comp.sales"
              label="Продажи (руб)"
              type="number"
              outlined
              :rules="salesRules"
              @input="clearResultsDebounced"
              aria-label="Продажи конкурента в рублях"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model.number="comp.units"
              label="Единиц"
              type="number"
              outlined
              :rules="unitsRules"
              @input="clearResultsDebounced"
              aria-label="Количество единиц у конкурента"
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-btn
              @click="removeCompetitor(index)"
              color="error"
              small
              aria-label="Удалить конкурента"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-btn
          @click="addCompetitor"
          color="primary"
          small
          class="mb-4"
          aria-label="Добавить конкурента"
        >
          <v-icon left>mdi-plus</v-icon> Добавить конкурента
        </v-btn>

        <v-row class="mt-2">
          <v-col>
            <v-btn
              @click="getRecommendations"
              :disabled="!valid || isLoading"
              :loading="isLoading"
              color="primary"
              aria-label="Получить рекомендации по продвижению"
            >
              <v-icon left>mdi-lightbulb-on</v-icon> Получить рекомендации
            </v-btn>
            <v-btn
              @click="resetForm"
              color="warning"
              class="ml-2"
              :disabled="isLoading"
              aria-label="Сбросить форму"
            >
              <v-icon left>mdi-autorenew</v-icon> Сбросить
            </v-btn>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  color="info"
                  class="ml-2"
                  v-bind="attrs"
                  v-on="on"
                  :disabled="isLoading"
                  aria-label="Выбрать шаблон данных конкурентов"
                >
                  <v-icon left>mdi-content-save</v-icon> Выбрать шаблон
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(template, index) in competitorTemplates"
                  :key="`template-${index}`"
                  @click="applyTemplate(template.data)"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-file-document</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>{{ template.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
      </v-form>

      <!-- Результаты с анимацией -->
      <transition name="fade">
        <v-card v-if="recommendations" flat class="mt-4">
          <v-card-title>
            <v-icon color="primary" class="mr-2">mdi-lightbulb</v-icon>
            Рекомендации
          </v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item
                v-for="(item, index) in formattedRecommendations"
                :key="`recommendation-${index}`"
              >
                <v-list-item-icon>
                  <v-icon color="primary">mdi-check</v-icon>
                </v-list-item-icon>
                <v-list-item-content>{{ item }}</v-list-item-content>
              </v-list-item>
            </v-list>
            <v-btn
              @click="exportRecommendations"
              color="success"
              small
              class="mt-2"
              :disabled="isLoading"
              aria-label="Экспортировать рекомендации в TXT"
            >
              <v-icon left>mdi-download</v-icon> Экспорт в TXT
            </v-btn>
          </v-card-text>
        </v-card>
      </transition>

      <!-- Ошибка -->
      <v-alert
        v-if="error"
        type="error"
        class="mt-4"
        dense
        dismissible
        @input="error = null"
        aria-label="Сообщение об ошибке"
      >
        <v-icon left>mdi-alert-circle</v-icon> {{ error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
import { getPromotionRecommendations } from '@/api/index.js';
import debounce from 'lodash/debounce';
import { saveAs } from 'file-saver';

export default {
  name: 'PromotionRecommendations',
  data() {
    return {
      valid: true,
      salesData: {
        totalSales: 0,
        unitsSold: 0,
        period: 'month',
      },
      competitors: [],
      recommendations: null,
      error: null,
      isLoading: false,
      salesRules: [
        (v) => v !== null && v !== undefined || 'Введите значение',
        (v) => v >= 0 || 'Значение не может быть отрицательным',
        (v) => v <= 1000000000 || 'Значение слишком большое'
      ],
      unitsRules: [
        (v) => v !== null && v !== undefined || 'Введите значение',
        (v) => v >= 0 || 'Значение не может быть отрицательным',
        (v) => v <= 1000000 || 'Значение слишком большое'
      ],
      periodOptions: [
        { text: 'Месяц', value: 'month' },
        { text: 'Квартал', value: 'quarter' },
        { text: 'Год', value: 'year' },
      ],
      competitorTemplates: [
        {
          name: 'Малый бизнес (2 конкурента)',
          data: [
            { name: 'Конкурент 1', sales: 50000, units: 100 },
            { name: 'Конкурент 2', sales: 75000, units: 150 },
          ],
        },
        {
          name: 'Средний бизнес (3 конкурента)',
          data: [
            { name: 'Конкурент A', sales: 200000, units: 400 },
            { name: 'Конкурент B', sales: 300000, units: 600 },
            { name: 'Конкурент C', sales: 250000, units: 500 },
          ],
        },
        {
          name: 'Крупный бизнес (4 конкурента)',
          data: [
            { name: 'Компания X', sales: 1000000, units: 2000 },
            { name: 'Компания Y', sales: 1500000, units: 3000 },
            { name: 'Компания Z', sales: 1200000, units: 2500 },
            { name: 'Компания W', sales: 1800000, units: 3500 },
          ],
        },
      ],
    };
  },
  computed: {
    competitorData() {
      return this.competitors.reduce((acc, comp) => {
        if (comp.name && (comp.sales || comp.units)) {
          acc[comp.name] = { sales: comp.sales, units: comp.units };
        }
        return acc;
      }, {});
    },
    formattedRecommendations() {
      if (!this.recommendations) return [];
      
      try {
        if (typeof this.recommendations === 'string') {
          return this.recommendations.split('\n').filter(line => line.trim());
        } else if (Array.isArray(this.recommendations)) {
          return this.recommendations;
        } else if (typeof this.recommendations === 'object') {
          return Object.entries(this.recommendations).map(([key, value]) => `${key}: ${value}`);
        }
        return ['Неизвестный формат рекомендаций'];
      } catch (e) {
        console.error('Ошибка форматирования рекомендаций:', e);
        return ['Ошибка обработки рекомендаций'];
      }
    },
    hasCompetitors() {
      return this.competitors.some(comp => comp.name && (comp.sales || comp.units));
    }
  },
  methods: {
    clearResults() {
      this.recommendations = null;
      this.error = null;
    },
    clearResultsDebounced: debounce(function () {
      this.clearResults();
    }, 300),
    async getRecommendations() {
      if (!this.$refs.form.validate()) {
        this.error = 'Пожалуйста, заполните все обязательные поля корректно';
        return;
      }

      if (!this.hasCompetitors) {
        this.error = 'Добавьте хотя бы одного конкурента с данными';
        return;
      }

      this.isLoading = true;
      this.clearResults();

      try {
        const response = await getPromotionRecommendations(
          this.salesData,
          this.competitorData
        );

        if (response.error) {
          this.error = response.error;
          return;
        }

        if (!response.action) {
          this.error = 'Не удалось получить рекомендации. Попробуйте позже.';
          return;
        }

        // Обработка разных форматов ответа
        if (typeof response.action === 'string') {
          this.recommendations = response.action;
        } else if (Array.isArray(response.action)) {
          this.recommendations = response.action.join('\n');
        } else if (typeof response.action === 'object') {
          this.recommendations = JSON.stringify(response.action, null, 2);
        } else {
          this.error = 'Неизвестный формат рекомендаций';
        }

        this.$nextTick(() => {
          const el = this.$el.querySelector('.v-card__title');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } catch (err) {
        console.error('Ошибка получения рекомендаций:', err);
        
        if (err.response) {
          // Ошибка от сервера
          this.error = err.response.data?.message || 
                      `Ошибка сервера: ${err.response.status} ${err.response.statusText}`;
        } else if (err.request) {
          // Ошибка сети
          this.error = 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
        } else {
          // Другие ошибки
          this.error = `Ошибка: ${err.message}`;
        }
      } finally {
        this.isLoading = false;
      }
    },
    addCompetitor() {
      if (this.competitors.length >= 10) {
        this.error = 'Максимальное количество конкурентов - 10';
        return;
      }
      this.competitors.push({ name: '', sales: 0, units: 0 });
      this.clearResultsDebounced();
    },
    removeCompetitor(index) {
      this.competitors.splice(index, 1);
      this.clearResultsDebounced();
    },
    applyTemplate(templateData) {
      try {
        if (!Array.isArray(templateData)) {
          throw new Error('Неверный формат шаблона');
        }
        
        this.competitors = templateData.map(item => ({
          name: item.name || '',
          sales: Number(item.sales) || 0,
          units: Number(item.units) || 0
        }));
        
        this.clearResults();
        this.$toast?.success('Шаблон успешно применён');
      } catch (e) {
        console.error('Ошибка применения шаблона:', e);
        this.error = 'Не удалось применить шаблон. Попробуйте другой.';
      }
    },
    resetForm() {
      try {
        this.salesData = { totalSales: 0, unitsSold: 0, period: 'month' };
        this.competitors = [];
        this.clearResults();
        this.$refs.form.resetValidation();
        this.$toast?.info('Форма сброшена');
      } catch (e) {
        console.error('Ошибка сброса формы:', e);
        this.error = 'Не удалось сбросить форму';
      }
    },
    exportRecommendations() {
      try {
        if (!this.recommendations) {
          this.error = 'Нет рекомендаций для экспорта';
          return;
        }

        const date = new Date().toISOString().slice(0, 10);
        const period = this.periodOptions.find(p => p.value === this.salesData.period)?.text || 'период';
        
        const header = `Рекомендации по продвижению (${period})\nДата: ${date}\n\n`;
        const content = typeof this.recommendations === 'string' 
          ? this.recommendations 
          : JSON.stringify(this.recommendations, null, 2);
        
        const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `promotion_recommendations_${date}.txt`);
        
        this.$toast?.success('Рекомендации успешно экспортированы');
      } catch (e) {
        console.error('Ошибка экспорта:', e);
        this.error = 'Не удалось экспортировать рекомендации';
        this.$toast?.error('Ошибка при экспорте рекомендаций');
      }
    },
  },
  mounted() {
    // Добавляем одного конкурента по умолчанию
    this.addCompetitor();
  }
};
</script>

<style scoped>
.headline {
  font-size: 1.5rem;
  font-weight: 500;
  font-family: 'Gilroy-Medium', sans-serif;
}

.pa-4 {
  padding: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.v-list-item {
  padding-left: 0;
}

.v-list-item__icon {
  margin-right: 12px;
  margin-left: 0;
}

.v-alert {
  margin-top: 20px;
}

.v-btn {
  text-transform: none;
}

.v-text-field {
  margin-bottom: 8px;
}

.v-card__title {
  padding-bottom: 0;
}

.v-card__text {
  padding-top: 8px;
}
</style>
