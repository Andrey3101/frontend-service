/** Форматирование чисел и дат для UI (ru-RU). */
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

/**
 * 12345.6 → «12 345,60 ₽». null/undefined/NaN → «—».
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
export function formatMoney(value) {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(n)) return '—';
  return moneyFormatter.format(n);
}

/**
 * 1234.5 → «1 234,5».
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(n)) return '—';
  return numberFormatter.format(n);
}

/**
 * '2026-10-02' или ISO → «02.10.2026».
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format('DD.MM.YYYY') : '—';
}

/**
 * ISO UTC → локальное время «02.10.2026 15:00».
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format('DD.MM.YYYY HH:mm') : '—';
}

/**
 * Минуты → «2 ч 05 мин».
 * @param {number|null|undefined} minutes
 * @returns {string}
 */
export function formatMinutes(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return h ? `${h} ч ${String(rest).padStart(2, '0')} мин` : `${rest} мин`;
}

/**
 * Дата для API: Date/dayjs/строка → 'YYYY-MM-DD'.
 * @param {string|Date|null|undefined} value
 * @returns {string|null}
 */
export function toApiDate(value) {
  if (!value) return null;
  const d = dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD') : null;
}
