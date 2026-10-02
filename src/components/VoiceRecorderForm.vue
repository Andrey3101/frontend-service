<template>
  <div class="voice-recorder" :class="{ 'voice-recorder--embedded': props.embedded }">
    <div class="d-flex align-center">
      <v-btn
        :icon="state === 'recording' ? 'mdi-stop' : 'mdi-microphone'"
        :color="state === 'recording' ? 'error' : 'primary'"
        size="x-large"
        variant="flat"
        :disabled="props.disabled || state === 'processing'"
        :loading="state === 'processing'"
        :class="{ 'voice-recorder__btn--recording': state === 'recording' }"
        :aria-label="state === 'recording' ? 'Остановить запись и отправить' : 'Начать запись голоса'"
        @click="toggle"
      />

      <div class="ml-4 flex-grow-1">
        <template v-if="state === 'recording'">
          <div class="d-flex align-center text-body-2">
            <v-icon icon="mdi-record" color="error" size="small" class="mr-1 voice-recorder__dot" />
            Запись {{ formatSeconds(elapsed) }} / {{ formatSeconds(MAX_SECONDS) }}
          </div>
          <v-progress-linear :model-value="(elapsed / MAX_SECONDS) * 100" color="error" rounded class="mt-2" />
          <div class="text-caption text-medium-emphasis mt-1">Нажмите «стоп», чтобы отправить</div>
        </template>
        <template v-else-if="state === 'processing'">
          <div class="text-body-2">{{ stage }}</div>
          <v-progress-linear indeterminate color="primary" rounded class="mt-2" />
        </template>
        <template v-else>
          <div class="text-body-2">
            {{ props.disabled ? 'Распознавание речи не настроено администратором' : 'Нажмите на микрофон и говорите' }}
          </div>
          <div class="text-caption text-medium-emphasis">До {{ MAX_SECONDS }} секунд, запись остановится автоматически</div>
        </template>
      </div>

      <v-btn
        v-if="state !== 'idle'"
        variant="text"
        size="small"
        class="ml-2"
        @click="cancel"
      >
        Отмена
      </v-btn>
    </div>

    <v-alert
      v-if="errorText"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mt-3"
      @click:close="errorText = ''"
    >
      {{ errorText }}
    </v-alert>

    <div v-if="displayResult && result" class="mt-4">
      <div class="text-caption text-medium-emphasis">Распознано</div>
      <p class="mb-3">«{{ result.text }}»</p>
      <div class="text-caption text-medium-emphasis">Ответ ассистента</div>
      <div class="markdown-body" v-html="renderMarkdown(result.reply)" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { aiVoice, errorMessage } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { renderMarkdown } from '@/utils/markdown.js';
import { blobToWavPcm16 } from '@/utils/wav.js';

const props = defineProps({
  /** Встроенный режим: результат показывает родитель (AssistantPage) по событию `result`. */
  embedded: { type: Boolean, default: false },
  /** Кнопка записи недоступна (например, STT не настроен на сервере). */
  disabled: { type: Boolean, default: false },
  /** Показывать распознанный текст и ответ внутри компонента. По умолчанию — только вне embedded. */
  showResult: { type: Boolean, default: undefined },
});

const emit = defineEmits({
  /** @param {{text: string, reply: string, intent: import('@/api/types.js').Intent}} payload */
  result: (payload) => !!payload && typeof payload.text === 'string',
});

/**
 * 55 с WAV PCM16 моно 16 кГц ≈ 1,76 МБ — меньше лимита SaluteSpeech 2 МБ на синхронное распознавание.
 */
const MAX_SECONDS = 55;
const MIN_SECONDS = 0.5;
const STT_MAX_BYTES = 2 * 1024 * 1024;
/** Порядок предпочтения форматов MediaRecorder — подойдёт любой, который браузер умеет декодировать. */
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/mp4'];

const notify = useNotifyStore();

/** @type {import('vue').Ref<'idle'|'recording'|'processing'>} */
const state = ref('idle');
const elapsed = ref(0);
const stage = ref('');
const errorText = ref('');
/** @type {import('vue').Ref<{text: string, reply: string, intent: any}|null>} */
const result = ref(null);

const displayResult = computed(() => props.showResult ?? !props.embedded);

/** @type {MediaRecorder|null} */
let recorder = null;
/** @type {MediaStream|null} */
let stream = null;
/** @type {Blob[]} */
let chunks = [];
let startedAt = 0;
/** @type {ReturnType<typeof setInterval>|null} */
let ticker = null;
/** Номер текущей попытки: ответ отменённой/устаревшей попытки игнорируется. */
let attempt = 0;
let cancelled = false;

/** @param {number} sec */
function formatSeconds(sec) {
  const s = Math.min(Math.floor(sec), 5999);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function stopTicker() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}

function releaseMicrophone() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
}

function cleanupRecording() {
  stopTicker();
  if (recorder) {
    recorder.ondataavailable = null;
    recorder.onstop = null;
    recorder.onerror = null;
    if (recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        /* уже остановлен */
      }
    }
  }
  recorder = null;
  chunks = [];
  releaseMicrophone();
}

/** @param {unknown} err ошибка getUserMedia */
function microphoneError(err) {
  const name = /** @type {any} */ (err)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Нет доступа к микрофону. Разрешите доступ к микрофону для этого сайта в настройках браузера.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Микрофон не найден. Подключите микрофон и попробуйте снова.';
  if (name === 'NotReadableError' || name === 'AbortError') return 'Микрофон занят другим приложением или недоступен.';
  return 'Не удалось включить микрофон.';
}

/** @param {unknown} err ошибка запроса /api/ai/voice */
function voiceError(err) {
  const status = /** @type {any} */ (err)?.response?.status;
  switch (status) {
    case 413:
      return 'Запись слишком длинная — говорите не дольше минуты.';
    case 415:
      return 'Сервер не принял формат записи. Обновите страницу и попробуйте снова.';
    case 422:
      return 'Не удалось распознать речь. Говорите ближе к микрофону и чётче.';
    case 429:
      return 'Слишком много запросов, подождите минуту.';
    case 503:
      return `Сервис не настроен администратором: ${errorMessage(err)}`;
    case 502:
      return 'Сервис распознавания речи временно недоступен, попробуйте позже.';
    default:
      return errorMessage(err);
  }
}

/** @param {string} text */
function fail(text) {
  errorText.value = text;
  state.value = 'idle';
}

function pickMimeType() {
  if (typeof MediaRecorder.isTypeSupported !== 'function') return '';
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

async function start() {
  if (props.disabled || state.value !== 'idle') return;
  errorText.value = '';
  result.value = null;

  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    fail('Запись голоса доступна только по HTTPS в современном браузере.');
    return;
  }
  if (typeof MediaRecorder === 'undefined') {
    fail('Браузер не поддерживает запись звука (MediaRecorder).');
    return;
  }

  const myAttempt = ++attempt;
  cancelled = false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    fail(microphoneError(err));
    return;
  }
  // Пока ждали разрешение, пользователь мог нажать «Отмена» или уйти со страницы.
  if (cancelled || myAttempt !== attempt) {
    releaseMicrophone();
    return;
  }

  try {
    const mimeType = pickMimeType();
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  } catch {
    releaseMicrophone();
    fail('Браузер не смог начать запись звука.');
    return;
  }

  chunks = [];
  const rec = recorder;
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  rec.onerror = () => {
    cleanupRecording();
    fail('Ошибка записи звука.');
  };
  rec.onstop = () => {
    const recorded = chunks;
    const mime = rec.mimeType || recorded[0]?.type || '';
    const seconds = (Date.now() - startedAt) / 1000;
    cleanupRecording();
    if (cancelled || myAttempt !== attempt) {
      state.value = 'idle';
      return;
    }
    processRecording(new Blob(recorded, mime ? { type: mime } : {}), seconds, myAttempt);
  };

  rec.start(250);
  startedAt = Date.now();
  elapsed.value = 0;
  state.value = 'recording';
  ticker = setInterval(() => {
    elapsed.value = Math.min((Date.now() - startedAt) / 1000, MAX_SECONDS);
    if (elapsed.value >= MAX_SECONDS) stop();
  }, 200);
}

function stop() {
  stopTicker();
  if (recorder && recorder.state !== 'inactive') {
    state.value = 'processing';
    stage.value = 'Подготовка записи…';
    recorder.stop(); // дальше — onstop → processRecording()
  }
}

/**
 * @param {Blob} blob запись MediaRecorder (webm/ogg/mp4)
 * @param {number} seconds длительность
 * @param {number} myAttempt
 */
async function processRecording(blob, seconds, myAttempt) {
  if (!blob.size || seconds < MIN_SECONDS) {
    fail('Запись слишком короткая — произнесите команду и затем нажмите «стоп».');
    return;
  }
  state.value = 'processing';
  stage.value = 'Подготовка записи…';

  let wav;
  try {
    // SaluteSpeech не принимает webm — перекодируем в WAV PCM16 моно 16 кГц.
    wav = await blobToWavPcm16(blob);
  } catch {
    if (myAttempt === attempt) fail('Не удалось обработать запись в браузере. Попробуйте другой браузер.');
    return;
  }
  if (myAttempt !== attempt) return;
  if (wav.size > STT_MAX_BYTES) {
    fail('Запись слишком длинная — говорите не дольше минуты.');
    return;
  }

  stage.value = 'Распознаём речь и готовим ответ…';
  try {
    const file = new File([wav], 'voice.wav', { type: 'audio/wav' });
    const data = await aiVoice(file, 'voice.wav');
    if (myAttempt !== attempt) return; // отменено, пока шёл запрос
    result.value = data;
    state.value = 'idle';
    emit('result', { text: data.text, reply: data.reply, intent: data.intent });
  } catch (err) {
    if (myAttempt !== attempt) return;
    const text = voiceError(err);
    const status = /** @type {any} */ (err)?.response?.status;
    if (status === 503 || status === 429) notify.warning(text);
    else notify.error(text);
    fail(text);
  }
}

function toggle() {
  if (state.value === 'recording') stop();
  else if (state.value === 'idle') start();
}

/** Отмена записи или ожидания ответа: результат текущей попытки будет проигнорирован. */
function cancel() {
  cancelled = true;
  attempt += 1;
  cleanupRecording();
  state.value = 'idle';
  stage.value = '';
}

onBeforeUnmount(cancel);
</script>

<style scoped>
.voice-recorder__btn--recording {
  animation: voice-pulse 1.2s ease-in-out infinite;
}

.voice-recorder__dot {
  animation: voice-blink 1s step-end infinite;
}

@keyframes voice-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-error), 0.45);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(var(--v-theme-error), 0);
  }
}

@keyframes voice-blink {
  50% {
    opacity: 0;
  }
}
</style>
