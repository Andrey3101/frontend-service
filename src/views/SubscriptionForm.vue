<template>
  <div>
    <v-alert
      v-if="returnStatus === 'success'"
      type="success"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="returnStatus = null"
    >
      Оплата прошла успешно. Если статус ниже ещё не обновился, подождите минуту — банк подтверждает платёж с
      небольшой задержкой.
    </v-alert>
    <v-alert
      v-else-if="returnStatus === 'fail'"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="returnStatus = null"
    >
      Оплата не прошла или была отменена. Попробуйте ещё раз или используйте другую карту.
    </v-alert>

    <v-alert v-if="loadError && !sub" type="error" variant="tonal" class="mb-4">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="small" :loading="subscription.loading" @click="reload">Повторить</v-btn>
      </template>
    </v-alert>

    <v-row>
      <v-col cols="12" md="7">
        <v-card :loading="subscription.loading" class="h-100">
          <v-card-title class="d-flex align-center flex-wrap ga-2">
            <v-icon icon="mdi-star-circle-outline" class="mr-1" color="primary" />
            Тариф «Стандарт»
            <v-spacer />
            <v-chip v-if="sub" variant="tonal" :color="statusColor" :prepend-icon="statusIcon">{{ statusLabel }}</v-chip>
          </v-card-title>

          <v-card-text v-if="sub">
            <div class="d-flex align-baseline mb-4">
              <span class="text-h4 font-weight-bold">{{ priceText }}</span>
              <span class="text-body-1 text-medium-emphasis ml-1">/ месяц</span>
            </div>

            <v-table density="compact" class="mb-4">
              <tbody>
                <tr v-if="sub.trial_ends_at">
                  <td class="text-medium-emphasis">Пробный период до</td>
                  <td class="text-right">{{ formatDate(sub.trial_ends_at) }}</td>
                </tr>
                <tr v-if="sub.paid_until">
                  <td class="text-medium-emphasis">Оплачено до</td>
                  <td class="text-right">{{ formatDate(sub.paid_until) }}</td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis">Осталось дней</td>
                  <td class="text-right font-weight-medium" :class="{ 'text-error': sub.days_left <= 3 }">
                    {{ sub.days_left }}
                  </td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis">Автопродление</td>
                  <td class="text-right">{{ sub.auto_renew ? 'Включено' : 'Выключено' }}</td>
                </tr>
              </tbody>
            </v-table>

            <v-alert v-if="subscription.isExpired" type="warning" variant="tonal" density="compact" class="mb-4">
              Подписка истекла. Оплатите её, чтобы продолжить пользоваться всеми функциями.
            </v-alert>
            <v-alert v-else-if="subscription.isTrial" type="info" variant="tonal" density="compact" class="mb-4">
              Идёт пробный период. Оплаченный месяц отсчитывается с момента оплаты, поэтому удобнее оплатить
              подписку ближе к концу пробного периода.
            </v-alert>

            <template v-if="auth.isAdmin">
              <v-alert v-if="!sub.payments_enabled" type="warning" variant="tonal" density="compact" class="mb-4">
                Онлайн-оплата не настроена администратором.
              </v-alert>
              <div class="d-flex flex-wrap ga-2">
                <v-btn
                  color="primary"
                  size="large"
                  prepend-icon="mdi-credit-card-outline"
                  :disabled="!sub.payments_enabled"
                  :loading="paying"
                  @click="onPay"
                >
                  Оплатить {{ priceText }}/мес
                </v-btn>
                <v-btn
                  v-if="sub.auto_renew"
                  variant="outlined"
                  size="large"
                  prepend-icon="mdi-autorenew-off"
                  @click="cancelDialog = true"
                >
                  Отключить автопродление
                </v-btn>
              </div>
              <div class="text-caption text-medium-emphasis mt-3">
                Оплата проходит на защищённой странице Т-Банка. Данные карты в ClerkAI не передаются и не хранятся.
              </div>
            </template>
            <v-alert v-else type="info" variant="tonal" density="compact">
              Оплачивать подписку и управлять автопродлением могут только владелец или администратор компании.
            </v-alert>
          </v-card-text>

          <v-card-text v-else-if="subscription.loading" class="text-medium-emphasis">Загрузка…</v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="h-100">
          <v-card-title>Что входит в подписку</v-card-title>
          <v-list density="compact" class="pt-0">
            <v-list-item v-for="feature in features" :key="feature.title" :prepend-icon="feature.icon">
              <v-list-item-title class="text-body-2 text-wrap">{{ feature.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="cancelDialog" max-width="440">
      <v-card>
        <v-card-title class="pt-4">Отключить автопродление?</v-card-title>
        <v-card-text>
          Подписка будет действовать до конца оплаченного периода. После этого её нужно будет продлить вручную.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="cancelling" @click="onCancelAutoRenew">Отключить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { errorMessage } from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { useSubscriptionStore } from '@/stores/subscription.js';
import { formatDate, formatNumber } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notify = useNotifyStore();
const subscription = useSubscriptionStore();

const sub = computed(() => subscription.subscription);

const STATUS = {
  trial: { label: 'Пробный период', color: 'info', icon: 'mdi-timer-sand' },
  active: { label: 'Активна', color: 'success', icon: 'mdi-check-circle' },
  expired: { label: 'Истекла', color: 'error', icon: 'mdi-alert-circle' },
};
const statusLabel = computed(() => STATUS[subscription.status]?.label || '—');
const statusColor = computed(() => STATUS[subscription.status]?.color || 'grey');
const statusIcon = computed(() => STATUS[subscription.status]?.icon || 'mdi-help-circle');
const priceText = computed(() => (sub.value ? `${formatNumber(sub.value.price)} ₽` : ''));

const features = [
  { icon: 'mdi-checkbox-marked-outline', title: 'Задачи, учёт времени, встречи и важные даты' },
  { icon: 'mdi-account-multiple-outline', title: 'Клиенты, акты и счета с выгрузкой в PDF' },
  { icon: 'mdi-cash-multiple', title: 'Доходы и расходы, импорт банковских выписок' },
  { icon: 'mdi-calculator-variant-outline', title: 'Расчёт налогов и налоговый календарь' },
  { icon: 'mdi-shield-search', title: 'Проверка контрагентов по ИНН' },
  { icon: 'mdi-package-variant-closed', title: 'Складской учёт и прогноз запасов' },
  { icon: 'mdi-robot-outline', title: 'ИИ-ассистент, отчёты и голосовые команды' },
  { icon: 'mdi-send-circle-outline', title: 'Telegram-бот и уведомления' },
  { icon: 'mdi-account-group-outline', title: 'Несколько пользователей в компании' },
];

const loadError = ref('');
const paying = ref(false);
const cancelDialog = ref(false);
const cancelling = ref(false);
/** Результат возврата со страницы оплаты T-Bank: 'success' | 'fail' | null. */
const returnStatus = ref(null);
let recheckTimer = null;
let unmounted = false;

async function reload() {
  loadError.value = '';
  try {
    await subscription.load();
  } catch (err) {
    loadError.value = errorMessage(err);
  }
}

async function onPay() {
  paying.value = true;
  try {
    await subscription.pay(); // редирект на страницу оплаты T-Bank
  } catch (err) {
    paying.value = false;
    if (err?.response?.status === 503) {
      notify.warning(errorMessage(err));
    } else {
      notify.error(err);
    }
  }
}

async function onCancelAutoRenew() {
  cancelling.value = true;
  try {
    await subscription.cancelAutoRenew();
    cancelDialog.value = false;
    notify.success('Автопродление отключено');
  } catch (err) {
    notify.error(err);
  } finally {
    cancelling.value = false;
  }
}

onMounted(async () => {
  const status = Array.isArray(route.query.status) ? route.query.status[0] : route.query.status;
  if (status === 'success' || status === 'fail') {
    returnStatus.value = status;
    // Убрать ?status из адреса, чтобы сообщение не повторялось при обновлении страницы.
    const query = { ...route.query };
    delete query.status;
    router.replace({ query });
  }

  await reload();

  // Уведомление T-Bank о платеже может прийти чуть позже возврата пользователя.
  // Страницу могли покинуть, пока шёл запрос, — таймер тогда не заводим.
  if (!unmounted && returnStatus.value === 'success' && subscription.status !== 'active') {
    recheckTimer = setTimeout(reload, 5000);
  }
});

onBeforeUnmount(() => {
  unmounted = true;
  if (recheckTimer) clearTimeout(recheckTimer);
});
</script>
