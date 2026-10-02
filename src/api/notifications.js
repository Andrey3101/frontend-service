/** notification-service: уведомления текущего пользователя и настройки доставки. */
import { cleanParams, http } from './http.js';

/**
 * GET /api/notifications — список (новые сверху) + счётчик непрочитанных.
 * @param {{unread_only?: boolean, page?: number, limit?: number}} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').Notification> & {unread_count: number}>}
 */
export async function listNotifications(params = {}) {
  return (await http.get('/notifications', { params: cleanParams(params) })).data;
}

/**
 * GET /api/notifications/unread-count
 * @returns {Promise<{unread_count: number}>}
 */
export async function getUnreadCount() {
  return (await http.get('/notifications/unread-count')).data;
}

/**
 * POST /api/notifications/{id}/read — отметить прочитанным.
 * @param {string} id
 * @returns {Promise<import('./types.js').Notification>}
 */
export async function markNotificationRead(id) {
  return (await http.post(`/notifications/${id}/read`)).data;
}

/**
 * POST /api/notifications/read-all — отметить все прочитанными.
 * @returns {Promise<{updated: number}>}
 */
export async function markAllNotificationsRead() {
  return (await http.post('/notifications/read-all')).data;
}

/**
 * DELETE /api/notifications/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteNotification(id) {
  await http.delete(`/notifications/${id}`);
}

/**
 * GET /api/notifications/settings — каналы доставки.
 * @returns {Promise<import('./types.js').NotificationSettings>}
 */
export async function getNotificationSettings() {
  return (await http.get('/notifications/settings')).data;
}

/**
 * PUT /api/notifications/settings
 * @param {{email_enabled?: boolean, telegram_enabled?: boolean}} data
 * @returns {Promise<import('./types.js').NotificationSettings>}
 */
export async function updateNotificationSettings(data) {
  return (await http.put('/notifications/settings', data)).data;
}
