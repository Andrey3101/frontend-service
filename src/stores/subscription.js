/** Подписка компании (GET /api/subscription) — для баннера в App.vue и SubscriptionForm. */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  cancelAutoRenew as apiCancelAutoRenew,
  getSubscription,
  paySubscription,
} from '@/api/subscription.js';

export const useSubscriptionStore = defineStore('subscription', () => {
  /** @type {import('vue').Ref<import('@/api/types.js').Subscription|null>} */
  const subscription = ref(null);
  const loading = ref(false);

  const status = computed(() => subscription.value?.status ?? null);
  const isExpired = computed(() => status.value === 'expired');
  const isTrial = computed(() => status.value === 'trial');
  const daysLeft = computed(() => subscription.value?.days_left ?? null);

  /**
   * Загрузить статус. Ошибка пробрасывается (вызывающий решает, показывать ли её).
   * @returns {Promise<import('@/api/types.js').Subscription>}
   */
  async function load() {
    loading.value = true;
    try {
      subscription.value = await getSubscription();
      return subscription.value;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Перейти к оплате T-Bank (owner/admin). 503 — оплата не настроена.
   * @returns {Promise<void>}
   */
  async function pay() {
    const { payment_url: paymentUrl } = await paySubscription();
    window.location.assign(paymentUrl);
  }

  /** Отключить автопродление (owner/admin). */
  async function cancelAutoRenew() {
    subscription.value = await apiCancelAutoRenew();
    return subscription.value;
  }

  function reset() {
    subscription.value = null;
  }

  return { subscription, loading, status, isExpired, isTrial, daysLeft, load, pay, cancelAutoRenew, reset };
});
