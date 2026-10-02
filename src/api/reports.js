/**
 * documents-service: отчёты. content — markdown: показывать ТОЛЬКО через
 * renderMarkdown() из @/utils/markdown (v-html с DOMPurify).
 */
import { cleanParams, downloadFile, http } from './http.js';

/** @typedef {'tasks'|'finance'|'time'|'clients'|'inventory'} ReportType */

/**
 * GET /api/reports
 * @param {{type?: ReportType, page?: number, limit?: number}} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').Report>>}
 */
export async function listReports(params = {}) {
  return (await http.get('/reports', { params: cleanParams(params) })).data;
}

/**
 * POST /api/reports/generate — сформировать отчёт за период. 201.
 * Может занимать до нескольких секунд (данные из task-/financial-service).
 * @param {{type: ReportType, period_from: string, period_to: string, title?: string}} data даты 'YYYY-MM-DD'
 * @returns {Promise<import('./types.js').Report>}
 */
export async function generateReport(data) {
  return (await http.post('/reports/generate', data, { timeout: 120_000 })).data;
}

/**
 * GET /api/reports/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').Report>}
 */
export async function getReport(id) {
  return (await http.get(`/reports/${id}`)).data;
}

/**
 * PUT /api/reports/{id} — изменить заголовок и/или текст (markdown).
 * @param {string} id
 * @param {{title?: string, content?: string}} data
 * @returns {Promise<import('./types.js').Report>}
 */
export async function updateReport(id, data) {
  return (await http.put(`/reports/${id}`, data)).data;
}

/**
 * DELETE /api/reports/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteReport(id) {
  await http.delete(`/reports/${id}`);
}

/**
 * GET /api/reports/{id}/pdf — скачать PDF отчёта.
 * @param {string} id
 * @param {string} [filename]
 * @returns {Promise<void>}
 */
export async function downloadReportPdf(id, filename) {
  await downloadFile(`/reports/${id}/pdf`, filename);
}
