/**
 * Экспорт таблицы в CSV (замена xlsx). Разделитель «;» и BOM — файл корректно
 * открывается в Excel с кириллицей. PDF документов/отчётов отдаёт бэкенд
 * (downloadActPdf / downloadInvoicePdf / downloadReportPdf).
 */

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value).replace('.', ',');
  let s = String(value);
  // Защита от CSV-инъекции формул в Excel.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * @param {Record<string, any>[]} rows
 * @param {{key: string, title: string, format?: (value: any, row: Record<string, any>) => any}[]} columns
 * @returns {string}
 */
export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.title)).join(';');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCell(c.format ? c.format(row[c.key], row) : row[c.key])).join(';'),
  );
  return [header, ...lines].join('\r\n');
}

/**
 * Скачать CSV в браузере.
 * @param {Record<string, any>[]} rows
 * @param {{key: string, title: string, format?: (value: any, row: Record<string, any>) => any}[]} columns
 * @param {string} filename например 'acts.csv'
 */
export function downloadCsv(rows, columns, filename) {
  const blob = new Blob(['﻿', toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
