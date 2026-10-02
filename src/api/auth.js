/**
 * auth-service: аутентификация, профиль текущего пользователя, сброс пароля, Telegram.
 *
 * ВАЖНО: authLogin / authRegister / authRefresh / authLogout — низкоуровневые вызовы.
 * Во views используйте действия стора: useAuthStore().login/register/logout — они ещё
 * и сохраняют/очищают сессию.
 */
import { http } from './http.js';

/**
 * POST /api/auth/login — вход. Бэкенд ставит httpOnly-cookie refresh_token.
 * 401 «Неверный email или пароль», 429 — превышен лимит попыток.
 * @param {{email: string, password: string}} data
 * @returns {Promise<import('./types.js').TokenResponse>}
 */
export async function authLogin(data) {
  return (await http.post('/auth/login', data)).data;
}

/**
 * POST /api/auth/register — регистрация компании и владельца (роль owner, триал).
 * 409 — email занят; без `pd_consent: true` → 422 (согласие на обработку ПДн, API.md 12.6).
 * @param {{email: string, password: string, full_name: string, phone?: string,
 *   company_name: string, company_type: import('./types.js').CompanyType, inn?: string,
 *   pd_consent: true}} data
 * @returns {Promise<import('./types.js').TokenResponse>}
 */
export async function authRegister(data) {
  return (await http.post('/auth/register', data)).data;
}

/**
 * POST /api/auth/refresh — новый access-токен по cookie refresh_token (тело не нужно).
 * 401 — cookie нет / недействительна.
 * @returns {Promise<import('./types.js').TokenResponse>}
 */
export async function authRefresh() {
  return (await http.post('/auth/refresh')).data;
}

/**
 * POST /api/auth/logout — отзыв refresh-токена, cookie очищается. 204.
 * @returns {Promise<void>}
 */
export async function authLogout() {
  await http.post('/auth/logout');
}

/**
 * GET /api/auth/me — текущий пользователь.
 * @returns {Promise<import('./types.js').User>}
 */
export async function getMe() {
  return (await http.get('/auth/me')).data;
}

/**
 * PUT /api/auth/me — изменить свой профиль.
 * @param {{full_name?: string, phone?: string|null, position?: string|null}} data
 * @returns {Promise<import('./types.js').User>}
 */
export async function updateMe(data) {
  return (await http.put('/auth/me', data)).data;
}

/**
 * PUT /api/auth/me/password — смена пароля. 204; неверный текущий пароль → 400.
 * @param {{current_password: string, new_password: string}} data
 * @returns {Promise<void>}
 */
export async function changePassword(data) {
  await http.put('/auth/me/password', data);
}

/**
 * POST /api/auth/password-reset — запросить письмо со ссылкой сброса. Всегда 202.
 * @param {{email: string}} data
 * @returns {Promise<{detail: string}>}
 */
export async function requestPasswordReset(data) {
  return (await http.post('/auth/password-reset', data)).data;
}

/**
 * POST /api/auth/password-reset/confirm — установить новый пароль по токену из письма.
 * 204; неверный/просроченный токен → 400.
 * @param {{token: string, new_password: string}} data
 * @returns {Promise<void>}
 */
export async function confirmPasswordReset(data) {
  await http.post('/auth/password-reset/confirm', data);
}

/**
 * POST /api/auth/telegram/link-code — код для привязки Telegram (команда боту `/link <код>`).
 * @returns {Promise<{code: string, expires_in: number, bot_username: string|null}>}
 */
export async function createTelegramLinkCode() {
  return (await http.post('/auth/telegram/link-code')).data;
}

/**
 * DELETE /api/auth/telegram/link — отвязать Telegram. 204.
 * @returns {Promise<void>}
 */
export async function unlinkTelegram() {
  await http.delete('/auth/telegram/link');
}
