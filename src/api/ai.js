/**
 * ai-service: чат, голос, распознавание намерений, маркетинговая аналитика.
 * Все текстовые ответы — markdown: показывать ТОЛЬКО через renderMarkdown()
 * из @/utils/markdown. Провайдер не настроен → 503 «ИИ-провайдер не настроен».
 */
import { http } from './http.js';
import { getClient, getClientStats } from './clients.js';

/** Генерация ответа ИИ может идти дольше стандартных 30 с. */
const AI_TIMEOUT = 120_000;

/**
 * GET /api/ai/status — что настроено на сервере.
 * @returns {Promise<{llm_configured: boolean, provider: string|null, model: string|null, stt_configured: boolean}>}
 */
export async function getAiStatus() {
  return (await http.get('/ai/status')).data;
}

/**
 * POST /api/ai/chat — диалог с ассистентом.
 * @param {{message: string, history?: {role: 'user'|'assistant', content: string}[]}} data
 *   message ≤ 4000 символов; history — не более 20 последних сообщений.
 * @returns {Promise<{reply: string, provider: string}>}
 */
export async function aiChat(data) {
  return (await http.post('/ai/chat', data, { timeout: AI_TIMEOUT })).data;
}

/**
 * POST /api/ai/voice — голосовое сообщение (multipart `file`: ogg/opus, webm, wav, mp3; ≤ 10 МБ).
 * Возвращает распознанный текст, ответ ассистента и намерение. Действие по intent
 * (создать задачу / добавить доход/расход) фронтенд выполняет сам через tasks/finance API.
 * STT не настроен → 503; речь не распознана → 422; неподдерживаемый формат → 415.
 * @param {Blob} audio
 * @param {string} [filename] например 'voice.webm' (по расширению сервер уточняет формат)
 * @returns {Promise<{text: string, reply: string, intent: import('./types.js').Intent}>}
 */
export async function aiVoice(audio, filename = 'voice.webm') {
  const form = new FormData();
  form.append('file', audio, filename);
  return (await http.post('/ai/voice', form, { timeout: AI_TIMEOUT })).data;
}

/**
 * POST /api/ai/intent — распознать намерение в тексте.
 * @param {{text: string}} data
 * @returns {Promise<{intent: import('./types.js').Intent}>}
 */
export async function detectIntent(data) {
  return (await http.post('/ai/intent', data, { timeout: AI_TIMEOUT })).data;
}

/**
 * POST /api/ai/competitors — анализ конкурентов.
 * @param {{business: string, city?: string, competitors?: string[], notes?: string}} data
 *   competitors — до 20 названий/ссылок.
 * @returns {Promise<{analysis: string}>} markdown
 */
export async function analyzeCompetitors(data) {
  return (await http.post('/ai/competitors', data, { timeout: AI_TIMEOUT })).data;
}

/**
 * POST /api/ai/promotion — рекомендации по продвижению.
 * @param {{business: string, audience?: string, budget?: string|number, goals?: string}} data
 * @returns {Promise<{recommendations: string}>} markdown
 */
export async function getPromotionRecommendations(data) {
  return (await http.post('/ai/promotion', data, { timeout: AI_TIMEOUT })).data;
}

/**
 * POST /api/ai/client-analysis — ИИ-резюме по клиенту.
 * @param {{client: object, stats: object}} data объекты ≤ 4000 символов в JSON
 * @returns {Promise<{summary: string}>} markdown
 */
export async function analyzeClient(data) {
  return (await http.post('/ai/client-analysis', data, { timeout: AI_TIMEOUT })).data;
}

/**
 * Составной вызов для страницы анализа клиента: GET /api/clients/{id} +
 * GET /api/clients/{id}/stats → POST /api/ai/client-analysis.
 * @param {string} clientId
 * @returns {Promise<{client: import('./types.js').Client, stats: object, summary: string}>}
 */
export async function analyzeClientById(clientId) {
  const [client, stats] = await Promise.all([getClient(clientId), getClientStats(clientId)]);
  const { summary } = await analyzeClient({ client, stats });
  return { client, stats, summary };
}
