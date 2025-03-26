<template>
  <v-card class="pa-4" elevation="2">
    <v-card-title class="headline">Рекомендации по продвижению</v-card-title>
    <v-card-subtitle>Введите данные о продажах и конкурентах</v-card-subtitle>
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model.number="salesData.totalSales"
              label="Общие продажи (руб)"
              type="number"
              outlined
              :rules="salesRules"
              @input="clearResults"
              hint="Сумма продаж за выбранный период"
              persistent-hint
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="salesData.unitsSold"
              label="Продано единиц"
              type="number"
              outlined
              :rules="unitsRules"
              @input="clearResults"
              hint="Количество проданных единиц"
              persistent-hint
            ></v-text-field>
          </v-col>
        </v-row>
        <v-select
          v-model="salesData.period"
          :items="periodOptions"
          label="Период анализа"
          outlined
          @change="clearResults"
          hint="Выберите период для анализа данных"
          persistent-hint
        ></v-select>
        <v-textarea
          v-model="competitorDataInput"
          label="Данные конкурентов (JSON)"
          placeholder='Пример: {"competitor1": {"sales": 10000, "units": 50}}'
          rows="5"
          outlined
          :rules="jsonRules"
          @input="clearResults"
          hint="Введите данные о конкурентах или выберите шаблон"
          persistent-hint
        ></v-textarea>
        <v-row class="mt-2">
          <v-col>
            <v-btn
              @click="getRecommendations"
              :disabled="!valid || isLoading"
              :loading="isLoading"
              color="primary"
            >
              Получить рекомендации
            </v-btn>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  color="info"
                  class="ml-2"
                  v-bind="attrs"
                  v-on="on"
                  :disabled="isLoading"
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
            <p>{{ recommendations }}</p>
            <v-btn
              @click="exportRecommendations"
              color="success"
              small
              class="mt-2"
              :disabled="isLoading"
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

export default {
  data() {
    return {
      valid: true,
      salesData: {
        totalSales: 0,
        unitsSold: 0,
        period: 'month', // Значение по умолчанию
      },
      competitorDataInput: '',
      recommendations: null,
      error: null,
      isLoading: false,
      salesRules: [(v) => v >= 0 || 'Значение не может быть отрицательным'],
      unitsRules: [(v) => v >= 0 || 'Значение не может быть отрицательным'],
      jsonRules: [
        (v) => !!v || 'Введите данные конкурентов',
        (v) => {
          try {
            JSON.parse(v);
            return true;
          } catch {
            return 'Некорректный JSON';
          }
        },
      ],
      periodOptions: [
        { text: 'Месяц', value: 'month' },
        { text: 'Квартал', value: 'quarter' },
        { text: 'Год', value: 'year' },
      ],
      competitorTemplates: [
        {
          name: 'Малый бизнес',
          data: JSON.stringify({
            competitor1: { sales: 50000, units: 100 },
            competitor2: { sales: 75000, units: 150 },
          }, null, 2),
        },
        {
          name: 'Средний бизнес',
          data: JSON.stringify({
            competitor1: { sales: 200000, units: 400 },
            competitor2: { sales: 300000, units: 600 },
          }, null, 2),
        },
        {
          name: 'Крупный бизнес',
          data: JSON.stringify({
            competitor1: { sales: 1000000, units: 2000 },
            competitor2: { sales: 1500000, units: 3000 },
          }, null, 2),
        },
      ],
    };
  },
  computed: {
    competitorData() {
      try {
        return JSON.parse(this.competitorDataInput || '{}');
      } catch {
        return {};
      }
    },
  },
  methods: {
    clearResults() {
      this.recommendations = null;
      this.error = null;
    },
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
    applyTemplate(templateData) {
      this.competitorDataInput = templateData;
      this.clearResults();
      this.$toast.info('Шаблон применён');
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
      this.$toast.success('Рекомендации экспортированы');
    },
  },
};
</script>

<style scoped>
.headline {
  font-size: 1.5rem;
  font-weight: 500;
}

.pa-4 {
  padding: 16px;
}

/* Анимация появления результатов */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>