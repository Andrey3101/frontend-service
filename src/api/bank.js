/**
 * financial-service: банковские счета и импорт выписок.
 * Подключения к банкам по API нет — только учёт счетов и загрузка файла выписки.
 */
import { cleanParams, http } from './http.js';

/**
 * GET /api/bank/accounts
 * @param {{page?: number, limit?: number}} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').BankAccount>>}
 */
export async function listBankAccounts(params = {}) {
  return (await http.get('/bank/accounts', { params: cleanParams(params) })).data;
}

/**
 * GET /api/bank/accounts/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').BankAccount>}
 */
export async function getBankAccount(id) {
  return (await http.get(`/bank/accounts/${id}`)).data;
}

/**
 * POST /api/bank/accounts — 201. account_number — 20 цифр, bik — 9 цифр.
 * @param {{bank_name: string, account_number: string, bik?: string, currency?: 'RUB'}} data
 * @returns {Promise<import('./types.js').BankAccount>}
 */
export async function createBankAccount(data) {
  return (await http.post('/bank/accounts', data)).data;
}

/**
 * PUT /api/bank/accounts/{id}
 * @param {string} id
 * @param {{bank_name?: string, account_number?: string, bik?: string|null, currency?: 'RUB',
 *   balance?: number|null}} data
 * @returns {Promise<import('./types.js').BankAccount>}
 */
export async function updateBankAccount(id, data) {
  return (await http.put(`/bank/accounts/${id}`, data)).data;
}

/**
 * DELETE /api/bank/accounts/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteBankAccount(id) {
  await http.delete(`/bank/accounts/${id}`);
}

/**
 * POST /api/bank/accounts/{id}/import — загрузить выписку (multipart, поле `file`, ≤ 5 МБ):
 * 1С ClientBankExchange (cp1251/utf-8) или CSV `date;amount;description;counterparty;inn`.
 * Дубликаты пропускаются.
 * @param {string} accountId
 * @param {File|Blob} file
 * @returns {Promise<{imported: number, skipped: number, errors: string[]}>}
 */
export async function importBankStatement(accountId, file) {
  const form = new FormData();
  form.append('file', file);
  return (await http.post(`/bank/accounts/${accountId}/import`, form, { timeout: 120_000 })).data;
}
