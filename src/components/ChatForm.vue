<template>
  <div class="chat-form" :class="{ 'chat-form--embedded': props.embedded }">
    <div ref="scrollRef" class="chat-form__messages" :style="{ height: props.height }" aria-live="polite">
      <div v-if="!messages.length && !loading" class="chat-form__empty text-medium-emphasis">
        <v-icon icon="mdi-robot-outline" size="40" class="mb-2" />
        <div>Задайте вопрос ассистенту: про налоги, документы, задачи или продвижение бизнеса.</div>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="chat-form__row"
        :class="msg.role === 'user' ? 'chat-form__row--user' : 'chat-form__row--assistant'"
      >
        <v-sheet
          :color="msg.role === 'user' ? 'primary' : 'surface-variant'"
          rounded="lg"
          class="chat-form__bubble px-3 py-2"
        >
          <div v-if="msg.role === 'user'" class="chat-form__text">{{ msg.content }}</div>
          <div v-else class="markdown-body" v-html="renderMarkdown(msg.content)" />
        </v-sheet>
      </div>

      <div v-if="loading" class="chat-form__row chat-form__row--assistant">
        <v-sheet color="surface-variant" rounded="lg" class="chat-form__bubble px-3 py-2 d-flex align-center">
          <v-progress-circular indeterminate size="16" width="2" class="mr-2" />
          <span class="text-body-2">Ассистент печатает…</span>
        </v-sheet>
      </div>
    </div>

    <v-form class="mt-3" @submit.prevent="send">
      <v-textarea
        v-model="draft"
        placeholder="Введите сообщение (Enter — отправить, Shift+Enter — новая строка)"
        variant="outlined"
        density="compact"
        rows="1"
        max-rows="6"
        auto-grow
        :counter="MESSAGE_MAX"
        :rules="[(v) => (v || '').length <= MESSAGE_MAX || `Не более ${MESSAGE_MAX} символов`]"
        :disabled="loading"
        aria-label="Сообщение ассистенту"
        @keydown.enter.exact.prevent="send"
      >
        <template #append>
          <v-btn
            type="submit"
            icon="mdi-send"
            color="primary"
            variant="flat"
            size="small"
            :disabled="!canSend"
            :loading="loading"
            aria-label="Отправить сообщение"
          />
        </template>
      </v-textarea>
    </v-form>

    <div class="d-flex align-center">
      <span class="text-caption text-medium-emphasis">
        Ответы ИИ могут содержать ошибки — проверяйте важные данные.
      </span>
      <v-spacer />
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-broom"
        :disabled="!messages.length || loading"
        @click="clear"
      >
        Очистить
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { aiChat } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { renderMarkdown } from '@/utils/markdown.js';

const props = defineProps({
  /** Встроенный режим (внутри карточки страницы). Плавающего режима больше нет. */
  embedded: { type: Boolean, default: false },
  /** Высота области сообщений (CSS). */
  height: { type: String, default: '460px' },
});

/** Ограничения ai-service: message и content ≤ 4000 символов, history ≤ 20 сообщений. */
const MESSAGE_MAX = 4000;
const HISTORY_MAX = 20;

const notify = useNotifyStore();

/** @type {import('vue').Ref<{id: number, role: 'user'|'assistant', content: string}[]>} */
const messages = ref([]);
const draft = ref('');
const loading = ref(false);
const scrollRef = ref(/** @type {HTMLElement|null} */ (null));
let nextId = 1;

const canSend = computed(() => {
  const text = draft.value.trim();
  return !loading.value && text.length > 0 && text.length <= MESSAGE_MAX;
});

/**
 * История для бэкенда: последние ≤ 20 сообщений, каждое не длиннее 4000 символов
 * (длинный ответ ассистента иначе дал бы 422 от валидации HistoryMessage).
 */
function buildHistory() {
  return messages.value.slice(-HISTORY_MAX).map((m) => ({
    role: m.role,
    content: m.content.length > MESSAGE_MAX ? m.content.slice(0, MESSAGE_MAX) : m.content,
  }));
}

/** @param {unknown} err */
function reportError(err) {
  const status = /** @type {any} */ (err)?.response?.status;
  if (status === 503) notify.warning('ИИ не настроен администратором');
  else if (status === 429) notify.warning('Слишком много запросов, подождите минуту');
  else notify.error(err);
}

async function send() {
  if (!canSend.value) return;
  const text = draft.value.trim();
  const history = buildHistory();
  const userMsg = { id: nextId++, role: /** @type {const} */ ('user'), content: text };
  messages.value.push(userMsg);
  draft.value = '';
  loading.value = true;
  try {
    const { reply } = await aiChat({ message: text, history });
    messages.value.push({ id: nextId++, role: 'assistant', content: reply || '' });
  } catch (err) {
    // Неотвеченное сообщение убираем из истории и возвращаем в поле ввода для повтора.
    messages.value = messages.value.filter((m) => m.id !== userMsg.id);
    if (!draft.value) draft.value = text;
    reportError(err);
  } finally {
    loading.value = false;
  }
}

function clear() {
  messages.value = [];
}

async function scrollToBottom() {
  await nextTick();
  const el = scrollRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

watch(() => [messages.value.length, loading.value], scrollToBottom);
</script>

<style scoped>
.chat-form__messages {
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-form__empty {
  margin: auto;
  max-width: 360px;
  text-align: center;
}

.chat-form__row {
  display: flex;
}

.chat-form__row--user {
  justify-content: flex-end;
}

.chat-form__row--assistant {
  justify-content: flex-start;
}

.chat-form__bubble {
  max-width: 85%;
  overflow-wrap: anywhere;
}

.chat-form__text {
  white-space: pre-wrap;
}

.chat-form__bubble :deep(.markdown-body > :first-child) {
  margin-top: 0;
}

.chat-form__bubble :deep(.markdown-body > :last-child) {
  margin-bottom: 0;
}
</style>
