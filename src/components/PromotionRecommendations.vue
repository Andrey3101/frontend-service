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
        <v-row v-for="(comp, index) in competitors" :key="index" class="mb-2">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="comp.name"
              label="Название конкурента"
              outlined
              :rules="[v => !!v || 'Введите название']"
              @input="clearResultsDebounced"
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
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-btn
              @click="removeCompetitor(index)"
              color="error"
              small
              aria-label="Удалить конкурента"
            >
              Удалить
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
          Добавить конкурента
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
              Получить рекомендации
            </v-btn>
            <v-btn
              @click="resetForm"
              color="warning"
              class="ml-2"
              :disabled="isLoading"
              aria-label="Сбросить форму"
            >
              Сбросить
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
                  Выбрать шаблон
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(template, index) in competitorTemplates"
                  :key="index"
                  @click="applyTemplate(template.data)"
                >
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
          <v-card-title>Рекомендации</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="(item, index) in formattedRecommendations" :key="index">
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
              Экспорт в TXT
            </v-btn>
          </v-card-text>
        </v-card>
      </transition>

      <!-- Ошибка -->
      <v-alert v-if="error" type="error" class="mt-4" dense>{{ error }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
import { getPromotionRecommendations } from '@/api/index.js';
import debounce from 'lodash/debounce';

export default {
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
      salesRules: [(v) => v >= 0 || 'Значение не может быть отрицательным'],
      unitsRules: [(v) => v >= 0 || 'Значение не может быть отрицательным'],
      periodOptions: [
        { text: 'Месяц', value: 'month' },
        { text: 'Квартал', value: 'quarter' },
        { text: 'Год', value: 'year' },
      ],
      competitorTemplates: [
        {
          name: 'Малый бизнес',
          data: [
            { name: 'competitor1', sales: 50000, units: 100 },
            { name: 'competitor2', sales: 75000, units: 150 },
          ],
        },
        {
          name: 'Средний бизнес',
          data: [
            { name: 'competitor1', sales: 200000, units: 400 },
            { name: 'competitor2', sales: 300000, units: 600 },
          ],
        },
        {
          name: 'Крупный бизнес',
          data: [
            { name: 'competitor1', sales: 1000000, units: 2000 },
            { name: 'competitor2', sales: 1500000, units: 3000 },
          ],
        },
      ],
    };
  },
  computed: {
    competitorData() {
      return this.competitors.reduce((acc, comp) => {
        acc[comp.name] = { sales: comp.sales, units: comp.units };
        return acc;
      }, {});
    },
    formattedRecommendations() {
      return this.recommendations?.split('\n').filter((line) => line.trim()) || [];
    },
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
      if (!this.$refs.form.validate()) return;

      this.isLoading = true;
      this.clearResults();

      try {
        const response = await getPromotionRecommendations(this.salesData, this.competitorData);
        if (response.error) {
          this.error = response.error;
        } else if (response.action) {
          this.recommendations = typeof response.action === 'string' ? response.action : JSON.stringify(response.action);
        } else {
          this.error = 'Неожиданный формат ответа от сервера';
        }
      } catch (err) {
        this.error = `Ошибка получения рекомендаций: ${err.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    addCompetitor() {
      this.competitors.push({ name: '', sales: 0, units: 0 });
    },
    removeCompetitor(index) {
      this.competitors.splice(index, 1);
      this.clearResultsDebounced();
    },
    applyTemplate(templateData) {
      this.competitors = [...templateData];
      this.clearResults();
      this.$toast?.info('Шаблон применён');
    },
    resetForm() {
      this.salesData = { totalSales: 0, unitsSold: 0, period: 'month' };
      this.competitors = [];
      this.clearResults();
      this.$refs.form.resetValidation();
      this.$toast?.info('Форма сброшена');
    },
    exportRecommendations() {
      const text = `Рекомендации по продвижению (${this.salesData.period}):\n\n${this.recommendations}`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promotion_recommendations_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      this.$toast?.success('Рекомендации экспортированы');
    },
  },
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
</style>