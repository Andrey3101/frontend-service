/** auth-service: компания текущего пользователя. */
import { http } from './http.js';

/**
 * GET /api/company — своя компания.
 * @returns {Promise<import('./types.js').Company>}
 */
export async function getCompany() {
  return (await http.get('/company')).data;
}

/**
 * PUT /api/company — изменить компанию (owner/admin).
 * @param {{name?: string, inn?: string|null, type?: import('./types.js').CompanyType}} data
 * @returns {Promise<import('./types.js').Company>}
 */
export async function updateCompany(data) {
  return (await http.put('/company', data)).data;
}

/**
 * DELETE /api/company — удалить компанию и всех её пользователей (только owner). 204.
 * После вызова сессия недействительна — вызовите useAuthStore().logout().
 * @returns {Promise<void>}
 */
export async function deleteCompany() {
  await http.delete('/company');
}
