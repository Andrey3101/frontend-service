/** task-service: встречи и важные даты. */
import { cleanParams, http } from './http.js';

// ---------------------------------------------------------------- встречи

/**
 * GET /api/meetings — встречи (фильтр по start_at: from включительно, to — не включая).
 * @param {{from?: string, to?: string, page?: number, limit?: number}} [params] дата или ISO-время
 * @returns {Promise<import('./types.js').Page<import('./types.js').Meeting>>}
 */
export async function listMeetings(params = {}) {
  return (await http.get('/meetings', { params: cleanParams(params) })).data;
}

/**
 * GET /api/meetings/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').Meeting>}
 */
export async function getMeeting(id) {
  return (await http.get(`/meetings/${id}`)).data;
}

/**
 * POST /api/meetings — 201. start_at/end_at — ISO 8601 (например new Date(...).toISOString()).
 * @param {{title: string, description?: string, start_at: string, end_at: string, location?: string,
 *   participants?: string[], client_id?: string|null}} data
 * @returns {Promise<import('./types.js').Meeting>}
 */
export async function createMeeting(data) {
  return (await http.post('/meetings', data)).data;
}

/**
 * PUT /api/meetings/{id} — частичное обновление теми же полями.
 * @param {string} id
 * @param {{title?: string, description?: string, start_at?: string, end_at?: string, location?: string,
 *   participants?: string[], client_id?: string|null}} data
 * @returns {Promise<import('./types.js').Meeting>}
 */
export async function updateMeeting(id, data) {
  return (await http.put(`/meetings/${id}`, data)).data;
}

/**
 * DELETE /api/meetings/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteMeeting(id) {
  await http.delete(`/meetings/${id}`);
}

// ---------------------------------------------------------------- важные даты

/**
 * GET /api/important-dates — важные даты (по возрастанию даты).
 * @param {{from?: string, to?: string, page?: number, limit?: number}} [params] 'YYYY-MM-DD'
 * @returns {Promise<import('./types.js').Page<import('./types.js').ImportantDate>>}
 */
export async function listImportantDates(params = {}) {
  return (await http.get('/important-dates', { params: cleanParams(params) })).data;
}

/**
 * GET /api/important-dates/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').ImportantDate>}
 */
export async function getImportantDate(id) {
  return (await http.get(`/important-dates/${id}`)).data;
}

/**
 * POST /api/important-dates — 201.
 * @param {{title: string, date: string, type?: 'deadline'|'birthday'|'holiday'|'payment'|'other',
 *   remind_days_before?: number, description?: string}} data
 * @returns {Promise<import('./types.js').ImportantDate>}
 */
export async function createImportantDate(data) {
  return (await http.post('/important-dates', data)).data;
}

/**
 * PUT /api/important-dates/{id}
 * @param {string} id
 * @param {{title?: string, date?: string, type?: string, remind_days_before?: number, description?: string}} data
 * @returns {Promise<import('./types.js').ImportantDate>}
 */
export async function updateImportantDate(id, data) {
  return (await http.put(`/important-dates/${id}`, data)).data;
}

/**
 * DELETE /api/important-dates/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteImportantDate(id) {
  await http.delete(`/important-dates/${id}`);
}
