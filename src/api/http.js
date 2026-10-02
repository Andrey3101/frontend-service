/**
 * Единый HTTP-клиент ClerkAI.
 *
 * - baseURL `/api` (относительный): в Docker запросы принимает nginx того же origin,
 *   при `npm run dev` — прокси Vite (vite.config.js).
 * - Access-токен живёт ТОЛЬКО в памяти (Pinia, stores/auth.js) и подставляется
 *   интерсептором запроса. Refresh-токен — httpOnly-cookie `refresh_token`
 *   (Path=/api/auth), её ставит и читает только бэкенд.
 * - На 401 выполняется один общий refresh (single-flight в сторе) и исходный запрос
 *   повторяется один раз. Если refresh не удался — сессия очищается и пользователь
 *   уходит на /login?redirect=...
 *
 * Связь со стором устанавливается через setAuthHandlers() в main.js — так http.js
 * не импортирует стор напрямую (нет циклических импортов).
 */
import axios from 'axios';

/** Запросы, на которые 401 означает «неверные данные», а не «протух access». */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const handlers = {
  /** @type {() => (string | null)} */
  getAccessToken: () => null,
  /** @type {() => Promise<unknown>} */
  refreshSession: () => Promise.reject(new Error('refreshSession не настроен')),
  /** @type {() => void} */
  onSessionExpired: () => {},
};

/**
 * Подключает HTTP-клиент к auth-стору. Вызывается один раз в main.js.
 * @param {{getAccessToken?: () => (string|null), refreshSession?: () => Promise<unknown>, onSessionExpired?: () => void}} h
 */
export function setAuthHandlers(h) {
  Object.assign(handlers, h);
}

export const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = handlers.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isAuthEndpoint(url) {
  const path = (url || '').split('?')[0];
  return AUTH_ENDPOINTS.some((p) => path === p || path.startsWith(`${p}/`));
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (!config || !response || response.status !== 401 || config._retry || isAuthEndpoint(config.url)) {
      throw error;
    }
    config._retry = true;
    try {
      await handlers.refreshSession();
    } catch {
      handlers.onSessionExpired();
      throw error;
    }
    return http(config);
  },
);

/**
 * Удаляет из объекта параметров `undefined`, `null` и пустые строки,
 * чтобы не отправлять `?status=` (FastAPI ответит 422 на пустой enum).
 * @param {Record<string, any>} [params]
 * @returns {Record<string, any>}
 */
export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}

/**
 * Человекочитаемый текст ошибки запроса.
 * - `detail` строкой → как есть;
 * - 422 FastAPI (`detail` — массив `{loc, msg, type}`) → `msg` через «; »;
 * - нет ответа (сеть, таймаут) → «Сервер недоступен».
 * @param {unknown} err
 * @returns {string}
 */
export function errorMessage(err) {
  if (!err) return 'Неизвестная ошибка';
  if (typeof err === 'string') return err;
  if (axios.isAxiosError(err)) {
    if (err.code === 'ERR_CANCELED') return 'Запрос отменён';
    const res = err.response;
    if (!res) return 'Сервер недоступен';
    const detail = res.data && typeof res.data === 'object' ? res.data.detail : undefined;
    if (typeof detail === 'string' && detail) return detail;
    if (Array.isArray(detail) && detail.length) {
      return detail
        .map((d) => (d && typeof d === 'object' ? d.msg : String(d)))
        .filter(Boolean)
        .join('; ');
    }
    if (res.status === 401) return 'Не авторизован';
    if (res.status === 403) return 'Недостаточно прав';
    if (res.status === 404) return 'Не найдено';
    if (res.status === 413) return 'Файл слишком большой';
    if (res.status === 429) return 'Слишком много запросов, попробуйте позже';
    if (res.status === 502 || res.status === 503 || res.status === 504) return 'Сервер недоступен';
    if (res.status >= 500) return 'Ошибка сервера';
    return `Ошибка запроса (${res.status})`;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Неизвестная ошибка';
}

function filenameFromDisposition(header) {
  if (!header) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
    } catch {
      /* падение на кривом заголовке — используем обычный filename */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/**
 * Скачивает файл (PDF и т.п.) с авторизацией и сохраняет его через браузер.
 * @param {string} url путь относительно /api, например `/acts/<id>/pdf`
 * @param {string} [filename] имя файла; по умолчанию — из Content-Disposition
 * @param {Record<string, any>} [params] query-параметры
 * @returns {Promise<void>}
 */
export async function downloadFile(url, filename, params) {
  let response;
  try {
    response = await http.get(url, { responseType: 'blob', params: cleanParams(params) });
  } catch (err) {
    // При responseType=blob тело ошибки тоже Blob — превращаем в JSON, чтобы errorMessage() увидел detail.
    const data = err?.response?.data;
    if (data instanceof Blob) {
      try {
        err.response.data = JSON.parse(await data.text());
      } catch {
        /* тело не JSON — оставляем как есть */
      }
    }
    throw err;
  }
  const name = filename || filenameFromDisposition(response.headers['content-disposition']) || 'file';
  const objectUrl = URL.createObjectURL(response.data);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

export default http;
