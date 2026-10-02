<template>
  <div>
    <v-row>
      <v-col cols="12" lg="5">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-account-search-outline" class="mr-2" />
            Анализ конкурентов
          </v-card-title>
          <v-card-subtitle class="text-wrap">
            ИИ-ассистент сравнит ваш бизнес с конкурентами и предложит, как выделиться.
          </v-card-subtitle>
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="submit">
              <v-text-field
                v-model="form.business"
                label="Вид бизнеса *"
                placeholder="Например: кофейня с выпечкой навынос"
                variant="outlined"
                density="compact"
                :rules="[rules.required, rules.max]"
                :counter="FIELD_MAX"
                class="mb-2"
              />
              <v-text-field
                v-model="form.city"
                label="Город"
                placeholder="Например: Казань"
                variant="outlined"
                density="compact"
                :rules="[rules.max]"
                class="mb-2"
              />
              <v-combobox
                v-model="form.competitors"
                label="Конкуренты"
                placeholder="Название или сайт, Enter — добавить"
                variant="outlined"
                density="compact"
                multiple
                chips
                closable-chips
                :items="[]"
                :rules="[rules.competitors]"
                hint="До 20 конкурентов. Сайты не загружаются — анализ строится на знаниях ИИ и ваших заметках."
                persistent-hint
                class="mb-4"
              />
              <v-textarea
                v-model="form.notes"
                label="Заметки"
                placeholder="Цены, сильные и слабые стороны конкурентов, ваше преимущество…"
                variant="outlined"
                density="compact"
                rows="4"
                auto-grow
                :rules="[rules.max]"
                :counter="FIELD_MAX"
              />
              <div class="d-flex flex-wrap ga-2 mt-2">
                <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-creation" :loading="loading">
                  Проанализировать
                </v-btn>
                <v-btn variant="text" :disabled="loading" @click="reset">Очистить</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="7">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center flex-wrap ga-2">
            <span>Результат</span>
            <v-spacer />
            <template v-if="analysis">
              <v-btn size="small" variant="text" prepend-icon="mdi-content-copy" @click="copy">Копировать</v-btn>
              <v-btn size="small" variant="text" prepend-icon="mdi-download" @click="exportMarkdown">Скачать .md</v-btn>
            </template>
          </v-card-title>
          <v-card-text>
            <div v-if="loading" class="py-6">
              <v-progress-linear indeterminate color="primary" rounded />
              <div class="text-body-2 text-medium-emphasis mt-3">Анализ может занять до минуты…</div>
            </div>
            <div v-else-if="analysis" class="markdown-body" v-html="renderMarkdown(analysis)" />
            <div v-else class="text-medium-emphasis py-6 text-center">
              Заполните форму и нажмите «Проанализировать».
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { analyzeCompetitors } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { renderMarkdown } from '@/utils/markdown.js';

/** Лимиты ai-service (CompetitorsRequest): поля ≤ 2000 символов, конкурентов ≤ 20. */
const FIELD_MAX = 2000;
const COMPETITORS_MAX = 20;

const notify = useNotifyStore();

const formRef = ref(/** @type {any} */ (null));
const loading = ref(false);
const analysis = ref('');
/** Параметры запроса, по которым получен текущий результат (для заголовка файла). */
const lastRequest = ref(/** @type {{business: string, city: string}|null} */ (null));

const form = reactive({
  business: '',
  city: '',
  /** @type {string[]} */
  competitors: [],
  notes: '',
});

const rules = {
  /** @param {string} v */
  required: (v) => !!(v && v.trim()) || 'Обязательное поле',
  /** @param {string} v */
  max: (v) => !v || v.length <= FIELD_MAX || `Не более ${FIELD_MAX} символов`,
  /** @param {string[]} v */
  competitors: (v) => {
    if ((v || []).length > COMPETITORS_MAX) return `Не более ${COMPETITORS_MAX} конкурентов`;
    if ((v || []).some((x) => String(x).length > FIELD_MAX)) return `Каждый — не более ${FIELD_MAX} символов`;
    return true;
  },
};

/** @param {unknown} err */
function reportError(err) {
  const status = /** @type {any} */ (err)?.response?.status;
  if (status === 503) notify.warning('ИИ не настроен администратором');
  else if (status === 429) notify.warning('Слишком много запросов, подождите минуту');
  else notify.error(err);
}

async function submit() {
  const { valid } = await formRef.value.validate();
  if (!valid || loading.value) return;
  const competitors = [...new Set((form.competitors || []).map((c) => String(c).trim()).filter(Boolean))];
  const payload = {
    business: (form.business || '').trim(),
    city: (form.city || '').trim() || undefined,
    competitors: competitors.length ? competitors : undefined,
    notes: (form.notes || '').trim() || undefined,
  };
  loading.value = true;
  try {
    const data = await analyzeCompetitors(payload);
    analysis.value = data.analysis || '';
    lastRequest.value = { business: payload.business, city: payload.city || '' };
  } catch (err) {
    reportError(err);
  } finally {
    loading.value = false;
  }
}

function reset() {
  Object.assign(form, { business: '', city: '', competitors: [], notes: '' });
  formRef.value?.resetValidation();
  analysis.value = '';
  lastRequest.value = null;
}

async function copy() {
  try {
    await navigator.clipboard.writeText(analysis.value);
    notify.success('Скопировано в буфер обмена');
  } catch {
    notify.error('Не удалось скопировать — выделите текст вручную');
  }
}

function exportMarkdown() {
  const req = lastRequest.value;
  const title = `# Анализ конкурентов${req ? `: ${req.business}${req.city ? ` (${req.city})` : ''}` : ''}`;
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([`${title}\n\n_${date}_\n\n${analysis.value}\n`], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analiz-konkurentov-${date}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>
