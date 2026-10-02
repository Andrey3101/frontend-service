<template>
  <div>
    <v-row>
      <v-col cols="12" lg="5">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-bullhorn-outline" class="mr-2" />
            Рекомендации по продвижению
          </v-card-title>
          <v-card-subtitle class="text-wrap">
            Опишите бизнес — ИИ-ассистент подберёт каналы продвижения под вашу аудиторию и бюджет.
          </v-card-subtitle>
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="submit">
              <v-text-field
                v-model="form.business"
                label="Бизнес *"
                placeholder="Например: студия маникюра у метро"
                variant="outlined"
                density="compact"
                :rules="[rules.required, rules.max]"
                :counter="FIELD_MAX"
                class="mb-2"
              />
              <v-text-field
                v-model="form.audience"
                label="Целевая аудитория"
                placeholder="Например: женщины 25–45 лет, живут или работают рядом"
                variant="outlined"
                density="compact"
                :rules="[rules.max]"
                class="mb-2"
              />
              <v-text-field
                v-model="form.budget"
                label="Бюджет"
                placeholder="Например: 30 000 ₽ в месяц"
                variant="outlined"
                density="compact"
                :rules="[rules.max]"
                class="mb-2"
              />
              <v-textarea
                v-model="form.goals"
                label="Цели"
                placeholder="Например: +20 новых клиентов в месяц, повторные визиты"
                variant="outlined"
                density="compact"
                rows="3"
                auto-grow
                :rules="[rules.max]"
                :counter="FIELD_MAX"
              />
              <div class="d-flex flex-wrap ga-2 mt-2">
                <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-creation" :loading="loading">
                  Получить рекомендации
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
            <span>Рекомендации</span>
            <v-spacer />
            <template v-if="recommendations">
              <v-btn size="small" variant="text" prepend-icon="mdi-content-copy" @click="copy">Копировать</v-btn>
              <v-btn size="small" variant="text" prepend-icon="mdi-download" @click="exportMarkdown">Скачать .md</v-btn>
            </template>
          </v-card-title>
          <v-card-text>
            <div v-if="loading" class="py-6">
              <v-progress-linear indeterminate color="primary" rounded />
              <div class="text-body-2 text-medium-emphasis mt-3">Подбираем рекомендации, это может занять до минуты…</div>
            </div>
            <div v-else-if="recommendations" class="markdown-body" v-html="renderMarkdown(recommendations)" />
            <div v-else class="text-medium-emphasis py-6 text-center">
              Заполните форму и нажмите «Получить рекомендации».
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { getPromotionRecommendations } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { renderMarkdown } from '@/utils/markdown.js';

/** Лимит ai-service (PromotionRequest): каждое поле ≤ 2000 символов. */
const FIELD_MAX = 2000;

const notify = useNotifyStore();

const formRef = ref(/** @type {any} */ (null));
const loading = ref(false);
const recommendations = ref('');
const lastBusiness = ref('');

const form = reactive({
  business: '',
  audience: '',
  budget: '',
  goals: '',
});

const rules = {
  /** @param {string} v */
  required: (v) => !!(v && v.trim()) || 'Обязательное поле',
  /** @param {string} v */
  max: (v) => !v || v.length <= FIELD_MAX || `Не более ${FIELD_MAX} символов`,
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
  const payload = {
    business: (form.business || '').trim(),
    audience: (form.audience || '').trim() || undefined,
    budget: (form.budget || '').trim() || undefined, // строка: бэкенд принимает и текст, и число
    goals: (form.goals || '').trim() || undefined,
  };
  loading.value = true;
  try {
    const data = await getPromotionRecommendations(payload);
    recommendations.value = data.recommendations || '';
    lastBusiness.value = payload.business;
  } catch (err) {
    reportError(err);
  } finally {
    loading.value = false;
  }
}

function reset() {
  Object.assign(form, { business: '', audience: '', budget: '', goals: '' });
  formRef.value?.resetValidation();
  recommendations.value = '';
  lastBusiness.value = '';
}

async function copy() {
  try {
    await navigator.clipboard.writeText(recommendations.value);
    notify.success('Скопировано в буфер обмена');
  } catch {
    notify.error('Не удалось скопировать — выделите текст вручную');
  }
}

function exportMarkdown() {
  const date = new Date().toISOString().slice(0, 10);
  const title = `# Рекомендации по продвижению${lastBusiness.value ? `: ${lastBusiness.value}` : ''}`;
  const blob = new Blob([`${title}\n\n_${date}_\n\n${recommendations.value}\n`], {
    type: 'text/markdown;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prodvizhenie-${date}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>
