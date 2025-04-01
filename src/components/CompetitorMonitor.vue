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
          <v-btn
            @click="clearAll"
            color="warning"
            class="ml-2"
            aria-label="Очистить все данные"
            :disabled="!hasData"
          >
            Очистить все
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
        <template v-slot:default>{{ Math.round(progress) }}%</template>
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
      <v-expansion-panels ref="resultsPanel" v-if="filteredResults.length" class="mt-4" multiple>
        <v-expansion-panel v-for="(result, index) in filteredResults" :key="`result-${index}`">
          <v-expansion-panel-header>
            {{ result.url }} - {{ result.status }}
            <v-icon v-if="result.status === 'Ошибка'" color="error" class="ml-2">mdi-alert</v-icon>
            <v-icon v-else color="success" class="ml-2">mdi-check</v-icon>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-alert v-if="result.error" type="error" dense>{{ result.error }}</v-alert>
            <div v-else>
              <p><strong>Последняя проверка:</strong> {{ formatDate(result.timestamp) }}</p>
              <p><strong>Длина:</strong> {{ result.content?.length || 0 }} символов</p>
              <v-expansion-panels v-if="result.content" class="mt-2" flat>
                <v-expansion-panel>
                  <v-expansion-panel-header>Показать содержимое</v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <pre class="content-pre">{{ result.content }}</pre>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
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
      <v-alert v-if="error" type="error" class="mt-4" dense dismissible @input="error = null">
        {{ error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
import { monitorCompetitors } from '@/api/index.js';
import debounce from 'lodash/debounce';
//import { saveAs } from 'file-saver';

export default {
  name: 'CompetitorMonitor',
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
    hasData() {
      return this.competitorUrls.trim() || this.results.length;
    },
  },
  methods: {
    formatDate(timestamp) {
      if (!timestamp) return 'Неизвестно';
      return new Date(timestamp).toLocaleString();
    },
    clearAll() {
      this.competitorUrls = '';
      this.clearResults();
      this.$toast?.info('Все данные очищены');
    },
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
        // Имитация прогресса для демонстрации
        const progressInterval = setInterval(() => {
          if (this.progress < 90) {
            this.progress += 10;
          }
        }, 500);

        const response = await monitorCompetitors(urls, { signal: this.cancelToken.signal });
        clearInterval(progressInterval);
        this.progress = 100;

        if (response.error) {
          this.error = response.error;
          return;
        }

        if (!response.action) {
          this.error = 'Неожиданный формат ответа от сервера';
          return;
        }

        // Обработка разных форматов ответа
        let processedResults = [];
        if (Array.isArray(response.action)) {
          processedResults = response.action.map((item) => ({
            url: item.url,
            status: item.error ? 'Ошибка' : 'Успешно',
            content: item.content || null,
            error: item.error || null,
            timestamp: Date.now(),
          }));
        } else if (typeof response.action === 'object') {
          processedResults = Object.entries(response.action).map(([url, content]) => ({
            url,
            status: content.includes('Error') || content.includes('Failed') ? 'Ошибка' : 'Успешно',
            content: content.includes('Error') || content.includes('Failed') ? null : content,
            error: content.includes('Error') || content.includes('Failed') ? content : null,
            timestamp: Date.now(),
          }));
        } else {
          this.error = 'Неизвестный формат данных в ответе';
          return;
        }

        this.results = processedResults;
        this.$nextTick(() => {
          this.focusFirstResult();
        });
      } catch (err) {
        clearInterval(progressInterval);
        if (err.name === 'AbortError') {
          this.error = 'Мониторинг отменён пользователем';
        } else if (err.response) {
          // Ошибка от сервера
          this.error = `Ошибка сервера: ${err.response.data?.message || err.response.statusText}`;
        } else if (err.request) {
          // Ошибка сети
          this.error = 'Ошибка сети: не удалось подключиться к серверу';
        } else {
          // Другие ошибки
          this.error = `Ошибка мониторинга: ${err.message}`;
        }
        console.error('Ошибка мониторинга:', err);
      } finally {
        this.isLoading = false;
      }
    },
    focusFirstResult() {
      try {
        const panels = this.$refs.resultsPanel?.$el?.querySelectorAll('.v-expansion-panel-header');
        if (panels?.[0]) {
          panels[0].focus();
        }
      } catch (e) {
        console.warn('Не удалось сфокусироваться на результатах:', e);
      }
    },
    cancelMonitor() {
      this.cancelToken?.abort();
      this.isLoading = false;
      this.progress = 0;
      this.$toast?.info('Мониторинг остановлен');
    },
    saveUrls() {
      try {
        localStorage.setItem('competitorUrls', this.competitorUrls);
        this.$toast?.success('URLs сохранены');
      } catch (e) {
        this.$toast?.error('Не удалось сохранить URLs: ' + e.message);
        console.error('Ошибка сохранения URLs:', e);
      }
    },
    loadUrls() {
      try {
        const saved = localStorage.getItem('competitorUrls');
        if (saved) {
          this.competitorUrls = saved;
          this.$toast?.info('URLs загружены');
        } else {
          this.$toast?.error('Нет сохранённых URLs');
        }
      } catch (e) {
        this.$toast?.error('Не удалось загрузить URLs: ' + e.message);
        console.error('Ошибка загрузки URLs:', e);
      }
    },
    exportResults() {
      try {
        const dataToExport = {
          meta: {
            exportedAt: new Date().toISOString(),
            total: this.results.length,
            success: this.results.filter((r) => r.status === 'Успешно').length,
            errors: this.results.filter((r) => r.status === 'Ошибка').length,
          },
          results: this.results,
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
          type: 'application/json;charset=utf-8',
        });
        saveAs(blob, `competitor_monitor_${new Date().toISOString().slice(0, 10)}.json`);
        this.$toast?.success('Результаты экспортированы');
      } catch (e) {
        this.$toast?.error('Ошибка экспорта: ' + e.message);
        console.error('Ошибка экспорта:', e);
      }
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

.content-pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.v-expansion-panel-header {
  font-weight: 500;
}

.v-expansion-panel-content {
  padding-top: 12px;
}
</style>
