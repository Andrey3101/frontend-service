<template>
  <div>
    <v-alert v-if="statusError" type="error" variant="tonal" class="mb-4">{{ statusError }}</v-alert>
    <template v-else-if="status">
      <v-alert v-if="!status.llm_configured" type="warning" variant="tonal" class="mb-4">
        ИИ-провайдер не настроен на сервере — чат и анализ временно недоступны.
      </v-alert>
      <v-alert v-else-if="!status.stt_configured" type="info" variant="tonal" class="mb-4">
        Распознавание речи не настроено — голосовые команды недоступны, текстовый чат работает.
      </v-alert>
    </template>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-chat-processing-outline" class="mr-2" />
            Чат с ассистентом
            <v-spacer />
            <v-chip v-if="status?.provider" size="small" variant="tonal">
              {{ status.provider }}<template v-if="status.model"> · {{ status.model }}</template>
            </v-chip>
          </v-card-title>
          <v-card-text>
            <!-- Начинку ChatForm переписывает фаза 2 (встраиваемый режим, POST /api/ai/chat). -->
            <ChatForm embedded />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-microphone-outline" class="mr-2" />
            Голосовая команда
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-3">
              Например: «Создай задачу подготовить акт для Ромашки до пятницы» или
              «Добавь доход 15 000 рублей за консультацию».
            </p>
            <!-- Начинку VoiceRecorderForm переписывает фаза 2: POST /api/ai/voice и emit('result', {text, reply, intent}). -->
            <VoiceRecorderForm embedded :disabled="status ? !status.stt_configured : false" @result="onVoiceResult" />
          </v-card-text>
        </v-card>

        <v-card v-if="voiceResult">
          <v-card-title class="text-subtitle-1">Результат</v-card-title>
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Распознано</div>
            <p class="mb-3">«{{ voiceResult.text }}»</p>
            <div class="text-caption text-medium-emphasis">Ответ ассистента</div>
            <div class="markdown-body mb-3" v-html="renderMarkdown(voiceResult.reply)" />

            <v-alert v-if="intentSummary" type="info" variant="tonal" density="compact">
              {{ intentSummary }}
            </v-alert>
          </v-card-text>
          <v-card-actions v-if="intentSummary && !intentDone">
            <v-spacer />
            <v-btn variant="text" @click="voiceResult = null">Отмена</v-btn>
            <v-btn color="primary" variant="flat" :loading="executing" @click="executeIntent">Выполнить</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import ChatForm from '@/components/ChatForm.vue';
import VoiceRecorderForm from '@/components/VoiceRecorderForm.vue';
import { createTask, createTransaction, errorMessage, getAiStatus } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDate, formatMoney } from '@/utils/format.js';
import { renderMarkdown } from '@/utils/markdown.js';

const notify = useNotifyStore();

const status = ref(null);
const statusError = ref('');
/** @type {import('vue').Ref<{text: string, reply: string, intent?: import('@/api/types.js').Intent}|null>} */
const voiceResult = ref(null);
const executing = ref(false);
const intentDone = ref(false);

onMounted(async () => {
  try {
    status.value = await getAiStatus();
  } catch (err) {
    statusError.value = errorMessage(err);
  }
});

/** @param {{text: string, reply: string, intent?: import('@/api/types.js').Intent}} result */
function onVoiceResult(result) {
  voiceResult.value = result;
  intentDone.value = false;
}

const intentSummary = computed(() => {
  const intent = voiceResult.value?.intent;
  if (!intent || intent.type === 'none') return '';
  if (intent.type === 'create_task') {
    const due = intent.due_date ? `, срок ${formatDate(intent.due_date)}` : '';
    return `Создать задачу «${intent.title || intent.description || 'Без названия'}»${due}`;
  }
  if (intent.type === 'add_income' || intent.type === 'add_expense') {
    if (!intent.amount) return '';
    const kind = intent.type === 'add_income' ? 'доход' : 'расход';
    const what = intent.description ? ` — ${intent.description}` : '';
    return `Добавить ${kind} ${formatMoney(intent.amount)}${what}`;
  }
  return '';
});

async function executeIntent() {
  const intent = voiceResult.value?.intent;
  if (!intent) return;
  executing.value = true;
  try {
    if (intent.type === 'create_task') {
      await createTask({
        title: intent.title || intent.description || 'Задача из голосовой команды',
        description: intent.title ? intent.description || '' : '',
        due_date: intent.due_date || null, // 'YYYY-MM-DD' — сервер принимает и дату
      });
      notify.success('Задача создана');
    } else if (intent.type === 'add_income' || intent.type === 'add_expense') {
      await createTransaction({
        type: intent.type === 'add_income' ? 'income' : 'expense',
        amount: intent.amount,
        description: intent.description || '',
      });
      notify.success(intent.type === 'add_income' ? 'Доход добавлен' : 'Расход добавлен');
    }
    intentDone.value = true;
  } catch (err) {
    notify.error(err);
  } finally {
    executing.value = false;
  }
}
</script>
