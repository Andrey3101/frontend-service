/**
 * Замена lodash/debounce (lodash удалён из зависимостей).
 * @template {(...args: any[]) => void} F
 * @param {F} fn
 * @param {number} [wait=300] мс
 * @returns {F & {cancel: () => void}}
 */
export function debounce(fn, wait = 300) {
  let timer = null;
  const debounced = function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return /** @type {any} */ (debounced);
}

export default debounce;
