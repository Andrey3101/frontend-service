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
        @input="clearResults"
        hint="Введите URLs сайтов конкурентов, например, https://example.com"
        persistent-hint
      ></v-textarea>
      <v-row class="mt-2">
        <v-col>
          <v-btn
            @click="monitor"
            :disabled="isMonitorButtonDisabled"
            :loading="isLoading"
            color="primary"
          >
            Запустить мониторинг
          </v-btn>
          <v-btn
            @click="saveUrls"
            :disabled="!competitorUrls.trim()"
            color="secondary"
            class="ml-2"
          >
            Сохранить URLs
          </v-btn>
          <v-btn @click="loadUrls" color="info" class="ml-2">Загрузить URLs</v-btn>
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

      <!-- Результаты -->
      <v-expansion-panels v-if="results.length" class="mt-4">
        <v-expansion-panel v-for="(result, index) in results" :key="index">
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

export default {
  data() {
    return {
      competitorUrls: '',
      results: [],
      error: null,
      isLoading: false,
      progress: 0,
      urlRules: [
        (v) => !!v || 'Введите хотя бы один URL',
        (v) => {
          const urls = v.split('\n').filter((url) => url.trim());
          return urls.every((url) => /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url)) || 'Все URLs должны быть валидными';
        },
      ],
    };
  },
  computed: {
    isMonitorButtonDisabled() {
      return !this.competitorUrls.trim() || this.isLoading;
    },
  },
  methods: {
    clearResults() {
      this.results = [];
      this.error = null;
      this.progress = 0;
    },
    async monitor() {
      this.isLoading = true;
      this.clearResults();

      const urls = this.competitorUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url);

      if (!urls.length) {
        this.error = 'Введите хотя бы один URL';
        this.isLoading = false;
        return;
      }

      try {
        const response = await this.monitorWithProgress(urls);
        if (response.error) {
          this.error = response.error;
        } else if (response.action && typeof response.action === 'object') {
          this.results = Object.entries(response.action).map(([url, content]) => ({
            url,
            status: content.includes('Error') || content.includes('Failed') ? 'Ошибка' : 'Успешно',
            content: content.includes('Error') || content.includes('Failed') ? null : content,
            error: content.includes('Error') || content.includes('Failed') ? content : null,
          }));
        } else {
          this.error = 'Неожиданный формат ответа от сервера';
        }
      } catch (err) {
        this.error = `Ошибка мониторинга: ${err.message}`;
      } finally {
        this.isLoading = false;
        this.progress = 100;
      }
    },
    async monitorWithProgress(urls) {
      const response = await monitorCompetitors(urls);
      const total = urls.length;
      let completed = 0;
      const interval = setInterval(() => {
        completed += 1;
        this.progress = (completed / total) * 100;
        if (completed >= total) clearInterval(interval);
      }, 500); // Симуляция прогресса
      return response;
    },
    saveUrls() {
      localStorage.setItem('competitorUrls', this.competitorUrls);
      this.$toast.success('URLs сохранены');
    },
    loadUrls() {
      const saved = localStorage.getItem('competitorUrls');
      if (saved) {
        this.competitorUrls = saved;
        this.$toast.info('URLs загружены');
      } else {
        this.$toast.error('Нет сохранённых URLs');
      }
    },
    exportResults() {
      const json = JSON.stringify(this.results, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'competitor_monitor_results.json';
      a.click();
      URL.revokeObjectURL(url);
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
</style>