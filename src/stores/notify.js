/**
 * Глобальный snackbar (замена vue-toastification). Отрисовывается компонентом
 * AppSnackbar.vue в App.vue.
 *   const notify = useNotifyStore();
 *   notify.success('Сохранено');
 *   notify.error(err);            // err — ошибка axios/Error/строка
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { errorMessage } from '@/api/http.js';

export const useNotifyStore = defineStore('notify', () => {
  const visible = ref(false);
  const message = ref('');
  /** Цвет темы Vuetify: success | error | info | warning */
  const color = ref('success');
  const timeout = ref(4000);

  /**
   * @param {string} text
   * @param {{color?: string, timeout?: number}} [options]
   */
  function show(text, options = {}) {
    message.value = text;
    color.value = options.color ?? 'info';
    timeout.value = options.timeout ?? 4000;
    visible.value = false;
    // Перезапуск таймера, если snackbar уже открыт.
    queueMicrotask(() => {
      visible.value = true;
    });
  }

  /** @param {string} text */
  function success(text) {
    show(text, { color: 'success' });
  }

  /** @param {string} text */
  function info(text) {
    show(text, { color: 'info' });
  }

  /** @param {string} text */
  function warning(text) {
    show(text, { color: 'warning', timeout: 6000 });
  }

  /** @param {unknown} errOrText ошибка запроса или текст */
  function error(errOrText) {
    show(typeof errOrText === 'string' ? errOrText : errorMessage(errOrText), { color: 'error', timeout: 7000 });
  }

  function hide() {
    visible.value = false;
  }

  return { visible, message, color, timeout, show, success, info, warning, error, hide };
});
