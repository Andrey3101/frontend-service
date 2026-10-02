/** financial-service: транзакции (доходы/расходы), сводка, категории, налоги. */
import { cleanParams, http } from './http.js';

/**
 * @typedef {{type: 'income'|'expense', amount: number, date?: string, category?: string,
 *   description?: string, counterparty?: string|null, counterparty_inn?: string|null,
 *   client_id?: string|null, payer_type?: 'individual'|'legal'|null, npd_receipt?: string|null,
 *   source?: 'manual'|'bot'}} TransactionInput
 *   amount > 0; date по умолчанию — сегодня; category по умолчанию «Прочие доходы/расходы»;
 *   payer_type важен для НПД (физлица 4%, юрлица/ИП 6%) — указывать для доходов.
 *   npd_receipt — номер чека «Мой налог» (≤ 64), только для дохода (для расхода непустой → 422;
 *   пустая строка = null). Операции с source='document' (из оплаченного акта/счёта) через PUT
 *   меняют только category, description, npd_receipt; иначе и при DELETE → 409 (API.md, 12.1, 12.4).
 */

// ---------------------------------------------------------------- транзакции

/**
 * GET /api/finance/transactions
 * @param {{type?: 'income'|'expense', category?: string, date_from?: string, date_to?: string,
 *   search?: string, page?: number, limit?: number}} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').Transaction>>}
 */
export async function listTransactions(params = {}) {
  return (await http.get('/finance/transactions', { params: cleanParams(params) })).data;
}

/**
 * GET /api/finance/transactions/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').Transaction>}
 */
export async function getTransaction(id) {
  return (await http.get(`/finance/transactions/${id}`)).data;
}

/**
 * POST /api/finance/transactions — 201.
 * @param {TransactionInput} data
 * @returns {Promise<import('./types.js').Transaction>}
 */
export async function createTransaction(data) {
  return (await http.post('/finance/transactions', data)).data;
}

/**
 * PUT /api/finance/transactions/{id} — частичное обновление.
 * Для source='document' — только category/description/npd_receipt, иначе 409.
 * @param {string} id
 * @param {Partial<TransactionInput>} data
 * @returns {Promise<import('./types.js').Transaction>}
 */
export async function updateTransaction(id, data) {
  return (await http.put(`/finance/transactions/${id}`, data)).data;
}

/**
 * DELETE /api/finance/transactions/{id} — 204. Для source='document' → 409.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTransaction(id) {
  await http.delete(`/finance/transactions/${id}`);
}

/**
 * GET /api/finance/summary — доход/расход/прибыль за период + разбивки.
 * @param {{date_from?: string, date_to?: string}} [params] 'YYYY-MM-DD'
 * @returns {Promise<{income: number, expense: number, profit: number,
 *   by_category: {category: string, type: 'income'|'expense', amount: number}[],
 *   by_month: {month: string, income: number, expense: number}[],
 *   incomes_without_receipt: number}>}  month — 'YYYY-MM'; incomes_without_receipt — доходов
 *   без номера чека НПД за период (только для self_employed, иначе 0)
 */
export async function getFinanceSummary(params = {}) {
  return (await http.get('/finance/summary', { params: cleanParams(params) })).data;
}

/**
 * GET /api/finance/categories — справочник категорий.
 * @returns {Promise<{income: string[], expense: string[]}>}
 */
export async function getFinanceCategories() {
  return (await http.get('/finance/categories')).data;
}

// ---------------------------------------------------------------- налоги

/**
 * GET /api/tax/estimate — оценка налога по типу компании из токена
 * (self_employed → НПД 4%/6% с вычетом 10 000 ₽; ip/ooo → УСН «доходы» 6%).
 * @param {{year?: number, quarter?: 1|2|3|4, regime?: 'usn_income'|'usn_income_expense',
 *   deduction_used?: number}} [params]  regime/deduction_used — расширения бэкенда (необязательны)
 * @returns {Promise<{regime: string, period: string, income: number, income_individuals: number,
 *   income_legal: number, expenses: number, tax_base: number, tax: number,
 *   rate_description: string, notes: string[]}>}
 */
export async function getTaxEstimate(params = {}) {
  return (await http.get('/tax/estimate', { params: cleanParams(params) })).data;
}

/**
 * GET /api/tax/calendar — налоговые сроки на год для типа компании.
 * @param {{year?: number}} [params]
 * @returns {Promise<{items: {date: string, title: string, description: string, regime: string}[]}>}
 */
export async function getTaxCalendar(params = {}) {
  return (await http.get('/tax/calendar', { params: cleanParams(params) })).data;
}
