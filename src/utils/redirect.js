/**
 * Безопасный путь возврата после входа: только внутренние пути приложения
 * (защита от open redirect через ?redirect=https://evil.example).
 *   router.replace(safeRedirect(route.query.redirect))
 * @param {unknown} value значение route.query.redirect
 * @param {string} [fallback='/dashboard']
 * @returns {string}
 */
export function safeRedirect(value, fallback = '/dashboard') {
  const path = Array.isArray(value) ? value[0] : value;
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return fallback;
  }
  return path;
}
