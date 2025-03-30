<template>
  <v-card class="pa-4" elevation="2">
    <v-card-title class="headline">Мониторинг конкурентов</v-card-title>
    <v-card-subtitle>Введите URLs конкурентов для анализа их сайтов</v-card-subtitle>
    <v-card-text>
      <v-textarea
        v-model="competitorUrls"
        label="URLs конкурентов (по одному в строке)"
        placeholder="https://example.com"
        rows="5"
        outlined
        :rules="urlRules"
        clearable
        @input="clearResultsDebounced"
        hint="Введите URLs сайтов конкурентов, например, https://example.com"
        persistent-hint
        aria-label="URLs конкурентов для мониторинга"
      ></v-textarea>
      <v-row class="mt-2">
        <v-col>
          <v-btn
            @click="monitor"
            :disabled="isMonitorButtonDisabled"
            :loading="isLoading"
            color="primary"
            aria-label="Запустить мониторинг конкурентов"
          >
            Запустить мониторинг
          </v-btn>
          <v-btn
            v-if="isLoading"
            @click="cancelMonitor"
            color="error"
            class="ml-2"
            :disabled="!isLoading"
            aria-label="Остановить мониторинг"
          >
            Остановить
          </v-btn>
          <v-btn
            @click="saveUrls"
            :disabled="!competitorUrls.trim()"
            color="secondary"
            class="ml-2"
            aria-label="Сохранить URLs конкурентов"
          >
            Сохранить URLs
          </v-btn>
          <v-btn
            @click="loadUrls"
            color="info"
            class="ml-2"
            aria-label="Загрузить сохранённые URLs"
          >
            Загрузить URLs
          </v-btn>
        </v-col>
      </v-row>

      <!-- Прогресс -->
      <v-progress-linear
        v-if="isLoading"
        :value="progress"
        color="primary"
        class="mt-4"
        height="10"
      >
        {{ Math.round(progress) }}%
      </v-progress-linear>

      <!-- Сводка и фильтрация -->
      <v-card-text v-if="results.length" class="mt-4">
        <p>
          Успешно: {{ results.filter((r) => r.status === 'Успешно').length }} | Ошибки:
          {{ results.filter((r) => r.status === 'Ошибка').length }}
        </p>
      </v-card-text>
      <v-row v-if="results.length" class="mt-2">
        <v-col>
          <v-btn-toggle v-model="filter" mandatory dense>
            <v-btn value="all" aria-label="Показать все результаты">Все</v-btn>
            <v-btn value="success" aria-label="Показать успешные результаты">Успешные</v-btn>
            <v-btn value="error" aria-label="Показать ошибки">Ошибки</v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <!-- Результаты -->
      <v-expansion-panels ref="resultsPanel" v-if="filteredResults.length" class="mt-4">
        <v-expansion-panel v-for="(result, index) in filteredResults" :key="index">
          <v-expansion-panel-header>
            {{ result.url }} - {{ result.status }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-alert v-if="result.error" type="error" dense>{{ result.error }}</v-alert>
            <div v-else>
              <p><strong>Содержимое:</strong> {{ result.content || 'Нет данных' }}</p>
              <p><strong>Длина:</strong> {{ result.content?.length || 0 }} символов</p>
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Экспорт -->
      <v-btn
        v-if="results.length"
        @click="exportResults"
        color="success"
        class="mt-4"
        :disabled="isLoading"
        aria-label="Экспортировать результаты в JSON"
      >
        Экспорт в JSON
      </v-btn>

      <!-- Ошибка -->
      <v-alert v-if="error" type="error" class="mt-4" dense>{{ error }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
import { monitorCompetitors } from '@/api/index.js';
import debounce from 'lodash/debounce';

export default {
  data() {
    return {
      competitorUrls: '',
      results: [],
      error: null,
      isLoading: false,
      progress: 0,
      filter: 'all',
      cancelToken: null,
      urlRules: [
        (v) => !!v || 'Введите хотя бы один URL',
        (v) =>
          v.split('\n').filter((url) => url.trim()).length <= 10 || 'Максимум 10 URL',
        (v) =>
          v
            .split('\n')
            .filter((url) => url.trim())
            .every((url) => /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url)) ||
          'Все URLs должны быть валидными',
      ],
    };
  },
  computed: {
    isMonitorButtonDisabled() {
      return !this.competitorUrls.trim() || this.isLoading;
    },
    normalizedUrls() {
      return this.competitorUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url)
        .map((url) => (url.match(/^https?:\/\//) ? url : `https://${url}`));
    },
    filteredResults() {
      if (this.filter === 'all') return this.results;
      return this.results.filter((result) =>
        this.filter === 'success' ? result.status === 'Успешно' : result.status === 'Ошибка'
      );
    },
  },
  methods: {
    clearResults() {
      this.results = [];
      this.error = null;
      this.progress = 0;
    },
    clearResultsDebounced: debounce(function () {
      this.clearResults();
    }, 300),
    async monitor() {
      this.isLoading = true;
      this.clearResults();
      this.cancelToken = new AbortController();

      const urls = this.normalizedUrls;
      if (!urls.length) {
        this.error = 'Введите хотя бы один URL';
        this.isLoading = false;
        return;
      }

      try {
        const response = await monitorCompetitors(urls, { signal: this.cancelToken.signal });
        if (response.error) {
          this.error = response.error;
        } else if (response.action && typeof response.action === 'object' && !Array.isArray(response.action)) {
          this.results = Object.entries(response.action).map(([url, content]) => ({
            url,
            status: content.includes('Error') || content.includes('Failed') ? 'Ошибка' : 'Успешно',
            content: content.includes('Error') || content.includes('Failed') ? null : content,
            error: content.includes('Error') || content.includes('Failed') ? content : null,
          }));
        } else {
          this.error = 'Неожиданный формат ответа от сервера';
        }
        this.progress = 100;
        this.$nextTick(() => {
          const panel = this.$refs.resultsPanel?.$el?.querySelector('.v-expansion-panel-header');
          if (panel) {
            panel.focus();
          } else {
            console.warn('Не удалось найти панель результатов для фокусировки');
          }
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          this.error = 'Мониторинг отменён пользователем';
        } else {
          this.error = `Ошибка мониторинга: ${err.message}`;
        }
      } finally {
        this.isLoading = false;
      }
    },
    cancelMonitor() {
      this.cancelToken?.abort();
      this.isLoading = false;
      this.progress = 0;
      this.$toast?.info('Мониторинг остановлен');
    },
    saveUrls() {
      localStorage.setItem('competitorUrls', this.competitorUrls);
      this.$toast?.success('URLs сохранены');
    },
    loadUrls() {
      const saved = localStorage.getItem('competitorUrls');
      if (saved) {
        this.competitorUrls = saved;
        this.$toast?.info('URLs загружены');
      } else {
        this.$toast?.error('Нет сохранённых URLs');
      }
    },
    exportResults() {
      const json = JSON.stringify(this.results, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `competitor_monitor_results_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.$toast?.success('Результаты экспортированы');
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
</style>