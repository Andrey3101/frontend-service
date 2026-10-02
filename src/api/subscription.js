/** auth-service: подписка компании и оплата через T-Bank. */
import { http } from './http.js';

/**
 * GET /api/subscription — статус подписки.
 * @returns {Promise<import('./types.js').Subscription>}
 */
export async function getSubscription() {
  return (await http.get('/subscription')).data;
}

/**
 * POST /api/subscription/pay — создать платёж T-Bank (owner/admin).
 * Ответ содержит payment_url — на него нужно перейти (window.location.assign).
 * Оплата не настроена → 503 «Онлайн-оплата не настроена».
 * @returns {Promise<{payment_url: string}>}
 */
export async function paySubscription() {
  return (await http.post('/subscription/pay')).data;
}

/**
 * POST /api/subscription/cancel-auto-renew — отключить автопродление (owner/admin).
 * @returns {Promise<import('./types.js').Subscription>}
 */
export async function cancelAutoRenew() {
  return (await http.post('/subscription/cancel-auto-renew')).data;
}
