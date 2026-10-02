/**
 * Markdown → безопасный HTML. ЕДИНСТВЕННЫЙ разрешённый источник для v-html
 * (ответы ИИ, отчёты): <div class="markdown-body" v-html="renderMarkdown(text)" />.
 */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

// Ссылки из markdown открываем в новой вкладке без доступа к window.opener.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * @param {string|null|undefined} text markdown
 * @returns {string} очищенный HTML
 */
export function renderMarkdown(text) {
  const html = marked.parse(String(text ?? ''), { async: false });
  return DOMPurify.sanitize(/** @type {string} */ (html), { USE_PROFILES: { html: true } });
}
