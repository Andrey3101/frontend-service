/** documents-service: клиенты (заменяют старые «контакты»). */
import { cleanParams, http } from './http.js';

/**
 * GET /api/clients — список клиентов.
 * @param {{search?: string, type?: 'individual'|'ip'|'company', page?: number, limit?: number}} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').Client>>}
 */
export async function listClients(params = {}) {
  return (await http.get('/clients', { params: cleanParams(params) })).data;
}

/**
 * GET /api/clients/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').Client>}
 */
export async function getClient(id) {
  return (await http.get(`/clients/${id}`)).data;
}

/**
 * POST /api/clients — 201. Обязательно name.
 * @param {{name: string, type?: 'individual'|'ip'|'company', inn?: string, kpp?: string, ogrn?: string,
 *   email?: string, phone?: string, address?: string, contact_person?: string, notes?: string}} data
 * @returns {Promise<import('./types.js').Client>}
 */
export async function createClient(data) {
  return (await http.post('/clients', data)).data;
}

/**
 * PUT /api/clients/{id} — те же поля, все необязательные.
 * @param {string} id
 * @param {Partial<import('./types.js').Client>} data
 * @returns {Promise<import('./types.js').Client>}
 */
export async function updateClient(id, data) {
  return (await http.put(`/clients/${id}`, data)).data;
}

/**
 * DELETE /api/clients/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteClient(id) {
  await http.delete(`/clients/${id}`);
}

/**
 * GET /api/clients/{id}/stats — статистика по документам клиента.
 * @param {string} id
 * @returns {Promise<{acts_count: number, invoices_count: number, revenue_total: number,
 *   paid_total: number, last_document_date: string|null, average_check: number}>}
 */
export async function getClientStats(id) {
  return (await http.get(`/clients/${id}/stats`)).data;
}
