/**
 * documents-service: акты и счета, PDF.
 * Сумма (total, amount строк) всегда пересчитывается сервером — отправлять её не нужно.
 */
import { cleanParams, downloadFile, http } from './http.js';

/**
 * @typedef {{status?: import('./types.js').DocStatus, client_id?: string, search?: string,
 *   date_from?: string, date_to?: string, page?: number, limit?: number}} DocListParams
 */
/**
 * @typedef {{client_id: string, date?: string, items: import('./types.js').DocItem[],
 *   status?: import('./types.js').DocStatus, notes?: string, vat_rate?: number|null, number?: string,
 *   seller_name?: string, seller_inn?: string, paid_at?: string|null}} ActInput
 *   number по умолчанию — автонумерация «ГГГГ-NNN»; date по умолчанию — сегодня.
 *   paid_at ('YYYY-MM-DD') учитывается только при status='paid' (по умолчанию — сегодня по МСК);
 *   у неоплаченного документа сервер всегда возвращает paid_at=null (API.md, 12.1).
 */
/**
 * @typedef {{to?: string, message?: string}} DocSendInput
 *   to — e-mail получателя (по умолчанию email клиента; нет адреса → 422); message ≤ 2000 символов.
 */

// ---------------------------------------------------------------- акты

/**
 * GET /api/acts
 * @param {DocListParams} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').Document>>}
 */
export async function listActs(params = {}) {
  return (await http.get('/acts', { params: cleanParams(params) })).data;
}

/**
 * GET /api/acts/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').Document>}
 */
export async function getAct(id) {
  return (await http.get(`/acts/${id}`)).data;
}

/**
 * POST /api/acts — 201.
 * @param {ActInput} data
 * @returns {Promise<import('./types.js').Document>}
 */
export async function createAct(data) {
  return (await http.post('/acts', data)).data;
}

/**
 * PUT /api/acts/{id} — частичное обновление.
 * @param {string} id
 * @param {Partial<ActInput>} data
 * @returns {Promise<import('./types.js').Document>}
 */
export async function updateAct(id, data) {
  return (await http.put(`/acts/${id}`, data)).data;
}

/**
 * DELETE /api/acts/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteAct(id) {
  await http.delete(`/acts/${id}`);
}

/**
 * GET /api/acts/{id}/pdf — скачать PDF акта (браузер сохраняет файл).
 * @param {string} id
 * @param {string} [filename] например `Акт-${act.number}.pdf`
 * @returns {Promise<void>}
 */
export async function downloadActPdf(id, filename) {
  await downloadFile(`/acts/${id}/pdf`, filename);
}

/**
 * POST /api/acts/{id}/send — отправить акт клиенту по e-mail (PDF вложением). 202.
 * Черновик (draft) переводится в sent. 422 — нет/некорректный адрес; 503 — отправка писем
 * не настроена администратором; 502 — не удалось отправить письмо (API.md, 12.2).
 * @param {string} id
 * @param {DocSendInput} [data]
 * @returns {Promise<{sent_to: string}>}
 */
export async function sendAct(id, data = {}) {
  return (await http.post(`/acts/${id}/send`, cleanParams(data))).data;
}

// ---------------------------------------------------------------- счета

/**
 * GET /api/invoices
 * @param {DocListParams} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').Document>>}
 */
export async function listInvoices(params = {}) {
  return (await http.get('/invoices', { params: cleanParams(params) })).data;
}

/**
 * GET /api/invoices/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').Document>}
 */
export async function getInvoice(id) {
  return (await http.get(`/invoices/${id}`)).data;
}

/**
 * POST /api/invoices — 201. Как акт + due_date ('YYYY-MM-DD').
 * @param {ActInput & {due_date?: string|null}} data
 * @returns {Promise<import('./types.js').Document>}
 */
export async function createInvoice(data) {
  return (await http.post('/invoices', data)).data;
}

/**
 * PUT /api/invoices/{id}
 * @param {string} id
 * @param {Partial<ActInput> & {due_date?: string|null}} data
 * @returns {Promise<import('./types.js').Document>}
 */
export async function updateInvoice(id, data) {
  return (await http.put(`/invoices/${id}`, data)).data;
}

/**
 * DELETE /api/invoices/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteInvoice(id) {
  await http.delete(`/invoices/${id}`);
}

/**
 * GET /api/invoices/{id}/pdf — скачать PDF счёта.
 * @param {string} id
 * @param {string} [filename]
 * @returns {Promise<void>}
 */
export async function downloadInvoicePdf(id, filename) {
  await downloadFile(`/invoices/${id}/pdf`, filename);
}

/**
 * POST /api/invoices/{id}/send — отправить счёт клиенту по e-mail (PDF вложением). 202.
 * Как sendAct: 422 / 503 / 502 (API.md, 12.2).
 * @param {string} id
 * @param {DocSendInput} [data]
 * @returns {Promise<{sent_to: string}>}
 */
export async function sendInvoice(id, data = {}) {
  return (await http.post(`/invoices/${id}/send`, cleanParams(data))).data;
}
