/** documents-service: товары, движения склада, аналитика и прогноз. */
import { cleanParams, http } from './http.js';

/**
 * @typedef {{name: string, sku?: string, unit?: string, price?: number, cost?: number,
 *   quantity?: number, min_quantity?: number, category?: string}} ProductInput
 */

// ---------------------------------------------------------------- товары

/**
 * GET /api/products
 * @param {{search?: string, category?: string, low_stock?: boolean, page?: number, limit?: number}} [params]
 *   low_stock=true — только товары с quantity ≤ min_quantity
 * @returns {Promise<import('./types.js').Page<import('./types.js').Product>>}
 */
export async function listProducts(params = {}) {
  return (await http.get('/products', { params: cleanParams(params) })).data;
}

/**
 * GET /api/products/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').Product>}
 */
export async function getProduct(id) {
  return (await http.get(`/products/${id}`)).data;
}

/**
 * POST /api/products — 201.
 * @param {ProductInput} data
 * @returns {Promise<import('./types.js').Product>}
 */
export async function createProduct(data) {
  return (await http.post('/products', data)).data;
}

/**
 * PUT /api/products/{id}
 * @param {string} id
 * @param {Partial<ProductInput>} data
 * @returns {Promise<import('./types.js').Product>}
 */
export async function updateProduct(id, data) {
  return (await http.put(`/products/${id}`, data)).data;
}

/**
 * DELETE /api/products/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  await http.delete(`/products/${id}`);
}

// ---------------------------------------------------------------- движения

/**
 * GET /api/inventory/transactions
 * @param {{product_id?: string, page?: number, limit?: number}} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').InventoryTransaction>>}
 */
export async function listInventoryTransactions(params = {}) {
  return (await http.get('/inventory/transactions', { params: cleanParams(params) })).data;
}

/**
 * POST /api/inventory/transactions — приход/расход/корректировка остатка. 201.
 * type='out' больше остатка → 400.
 * @param {{product_id: string, type: 'in'|'out'|'adjust', quantity: number, note?: string}} data
 * @returns {Promise<import('./types.js').InventoryTransaction>}
 */
export async function createInventoryTransaction(data) {
  return (await http.post('/inventory/transactions', data)).data;
}

// ---------------------------------------------------------------- аналитика

/**
 * GET /api/inventory/analytics — сводка по складу (движение за 30 дней).
 * @returns {Promise<{total_products: number, total_quantity: number, stock_value: number,
 *   low_stock: import('./types.js').Product[],
 *   top_moving: {product_id: string, name: string, out_quantity: number}[]}>}
 */
export async function getInventoryAnalytics() {
  return (await http.get('/inventory/analytics')).data;
}

/**
 * GET /api/inventory/forecast — прогноз расхода и рекомендованный заказ.
 * @param {{product_id: string, days?: number}} params days по умолчанию 30
 * @returns {Promise<{product_id: string, name: string, current_quantity: number, avg_daily_out: number,
 *   forecast_out: number, days_until_stockout: number|null, recommended_order: number}>}
 */
export async function getInventoryForecast(params) {
  return (await http.get('/inventory/forecast', { params: cleanParams(params) })).data;
}
