/** auth-service: пользователи компании (управление — owner/admin). */
import { cleanParams, http } from './http.js';

/**
 * GET /api/users — пользователи компании (owner/admin, иначе 403).
 * @param {{page?: number, limit?: number, role?: import('./types.js').Role, search?: string}} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').User>>}
 */
export async function listUsers(params = {}) {
  return (await http.get('/users', { params: cleanParams(params) })).data;
}

/**
 * POST /api/users — создать пользователя в своей компании (owner/admin). 201; email занят → 409.
 * @param {{email: string, full_name: string, password: string, role: 'admin'|'user',
 *   phone?: string, position?: string}} data
 * @returns {Promise<import('./types.js').User>}
 */
export async function createUser(data) {
  return (await http.post('/users', data)).data;
}

/**
 * GET /api/users/{id} — пользователь своей компании.
 * @param {string} id
 * @returns {Promise<import('./types.js').User>}
 */
export async function getUser(id) {
  return (await http.get(`/users/${id}`)).data;
}

/**
 * PUT /api/users/{id} — изменить пользователя (owner/admin; роль owner менять нельзя).
 * @param {string} id
 * @param {{full_name?: string, phone?: string|null, position?: string|null,
 *   role?: 'admin'|'user', is_active?: boolean}} data
 * @returns {Promise<import('./types.js').User>}
 */
export async function updateUser(id, data) {
  return (await http.put(`/users/${id}`, data)).data;
}

/**
 * DELETE /api/users/{id} — удалить пользователя (owner/admin; нельзя себя и owner). 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
  await http.delete(`/users/${id}`);
}
