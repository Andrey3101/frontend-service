/** financial-service: проверка контрагентов по ИНН (DaData). */
import { http } from './http.js';

/**
 * GET /api/contractors/check?inn=... — данные о контрагенте.
 * Ошибки: неверный ИНН → 400; не найден → 404; ключ DaData не задан → 503
 * «Проверка контрагентов не настроена»; сбой DaData → 502.
 * @param {{inn: string}} params
 * @returns {Promise<{inn: string|null, kpp: string|null, ogrn: string|null, name: string|null,
 *   status: string|null, address: string|null, registration_date: string|null,
 *   management: {name: string|null, post: string|null}|null, okved: string|null,
 *   risk_flags: string[]}>}
 */
export async function checkContractor(params) {
  return (await http.get('/contractors/check', { params: { inn: params.inn } })).data;
}
