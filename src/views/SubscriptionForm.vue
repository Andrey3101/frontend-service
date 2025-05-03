<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h5 mb-4">Управление подпиской</h1>
        <v-alert
          v-if="subscriptionStatus === 'trial' && trialEnd"
          type="info"
          class="mb-4"
        >
          Ваш пробный период заканчивается {{ formatTrialEnd(trialEnd) }}.
          Оформите подписку за 159 рублей/месяц, чтобы продолжить пользоваться всеми функциями.
        </v-alert>
        <v-alert
          v-if="subscriptionStatus === 'expired'"
          type="warning"
          class="mb-4"
        >
          Ваш пробный период истек. Оформите подписку, чтобы восстановить доступ к функциям.
        </v-alert>
        <v-alert
          v-if="subscriptionStatus === 'active'"
          type="success"
          class="mb-4"
        >
          Ваша подписка активна. Спасибо за использование нашего сервиса!
        </v-alert>
        <v-alert
          v-if="error"
          type="error"
          class="mb-4"
        >
          {{ error }}
        </v-alert>

        <!-- Диалог подтверждения пробного периода -->
        <v-dialog v-model="showTrialDialog" max-width="500px" persistent>
          <v-card>
            <v-card-title>Активация пробного периода</v-card-title>
            <v-card-text>
              Хотите активировать пробный период на 5 дней? Это позволит вам бесплатно протестировать все функции сервиса.
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="grey" text @click="showTrialDialog = false">Отмена</v-btn>
              <v-btn color="primary" @click="activateTrial">Активировать</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Форма для прикрепления карты -->
        <v-card class="mb-6" v-if="isCompanyAdmin">
          <v-card-title>Прикрепить новую карту</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="attachCard" v-model="isFormValid">
              <v-text-field
                v-model="cardData.card_number"
                label="Номер карты"
                :rules="[v => !!v || 'Номер карты обязателен', v => /^\d{16}$/.test(v) || 'Номер карты должен содержать 16 цифр']"
                required
                @input="$v.cardData.card_number.$touch()"
                :error-messages="$v.cardData.card_number.$errors.map(e => e.$message)"
              />
              <v-text-field
                v-model="cardData.expiry"
                label="Срок действия (MM/YY)"
                :rules="[v => !!v || 'Срок действия обязателен', v => /^\d{2}\/\d{2}$/.test(v) || 'Формат: MM/YY']"
                required
                @input="$v.cardData.expiry.$touch()"
                :error-messages="$v.cardData.expiry.$errors.map(e => e.$message)"
              />
              <v-text-field
                v-model="cardData.cvc"
                label="CVC"
                :rules="[v => !!v || 'CVC обязателен', v => /^\d{3}$/.test(v) || 'CVC должен содержать 3 цифры']"
                required
                @input="$v.cardData.cvc.$touch()"
                :error-messages="$v.cardData.cvc.$errors.map(e => e.$message)"
              />
              <v-btn
                type="submit"
                color="primary"
                :disabled="!isFormValid || isPaymentPending"
                :loading="isPaymentPending"
              >
                Прикрепить карту
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Список карт -->
        <v-card class="mb-6" v-if="isCompanyAdmin && companyCards.length > 0">
          <v-card-title>Прикрепленные карты</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="cardHeaders"
              :items="companyCards"
              :items-per-page="5"
              class="elevation-1"
            >
              <template v-slot:item.is_active="{ item }">
                <v-chip :color="item.is_active ? 'green' : 'grey'" small>
                  {{ item.is_active ? 'Активна' : 'Неактивна' }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  color="error"
                  small
                  @click="detachCard(item.card_id)"
                  :disabled="isPaymentPending"
                >
                  Удалить
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- История платежей -->
        <v-card class="mb-6" v-if="isCompanyAdmin && paymentHistory.length > 0">
          <v-card-title>История платежей</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="paymentHeaders"
              :items="paymentHistory"
              :items-per-page="5"
              class="elevation-1"
            >
              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" small>
                  {{ item.status }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- Кнопка оплаты -->
        <v-btn
          v-if="subscriptionStatus !== 'active' && isCompanyAdmin"
          color="primary"
          :loading="isPaymentPending"
          @click="initiatePayment"
          :disabled="isPaymentPending"
        >
          Оплатить подписку {{ activeCard ? 'с картой' : 'через форму' }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useVuelidate } from '@vuelidate/core';
import { required, regex } from '@vuelidate/validators';
import { useAuthStore } from '../stores/auth';
import { useSubscriptionStore } from '../stores/subscription';
import { fetchWithCsrf } from '../api';

export default {
  setup() {
    const authStore = useAuthStore();
    const subscriptionStore = useSubscriptionStore();
    const toast = useToast();
    const $v = useVuelidate();

    const subscriptionStatus = ref('');
    const trialEnd = ref('');
    const error = ref('');
    const isFormValid = ref(false);
    const showTrialDialog = ref(false);

    const cardData = ref({
      card_number: '',
      expiry: '',
      cvc: '',
    });

    const cardHeaders = [
      { title: 'Последние 4 цифры', key: 'last4' },
      { title: 'Бренд', key: 'brand' },
      { title: 'Статус', key: 'is_active' },
      { title: 'Дата добавления', key: 'created_at' },
      { title: 'Действия', key: 'actions', sortable: false },
    ];

    const paymentHeaders = [
      { title: 'ID платежа', key: 'payment_id' },
      { title: 'Сумма', key: 'amount' },
      { title: 'Статус', key: 'status' },
      { title: 'Дата', key: 'created_at' },
      { title: 'ID карты', key: 'card_id' },
    ];

    const companyId = computed(() => authStore.user?.company_id || '');
    const isCompanyAdmin = computed(() => authStore.isCompanyAdmin);
    const companyCards = computed(() => subscriptionStore.companyCards);
    const paymentHistory = computed(() => subscriptionStore.paymentHistory);
    const isPaymentPending = computed(() => subscriptionStore.isPaymentPending);
    const activeCard = computed(() => subscriptionStore.activeCard);

    // Загрузка данных
    const loadData = async () => {
      try {
        await authStore.fetchProfile();
        subscriptionStatus.value = authStore.subscriptionStatus;
        trialEnd.value = authStore.trialEnd;
        if (isCompanyAdmin.value) {
          await subscriptionStore.fetchCompanyCards();
          await subscriptionStore.fetchPaymentHistory();
          // Проверяем, нужно ли показать диалог пробного периода
          if (subscriptionStatus.value === 'trial' && !trialEnd.value) {
            showTrialDialog.value = true;
          }
        }
      } catch (err) {
        error.value = 'Ошибка загрузки данных';
        toast.error(error.value);
      }
    };

    // Форматирование даты окончания пробного периода
    const formatTrialEnd = (date) => {
      const endDate = new Date(date);
      return endDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Цвет статуса платежа
    const getStatusColor = (status) => {
      switch (status.toLowerCase()) {
        case 'success':
          return 'green';
        case 'pending':
          return 'orange';
        case 'failed':
          return 'red';
        default:
          return 'grey';
      }
    };

    // Активация пробного периода
    const activateTrial = async () => {
      if (!companyId.value) {
        error.value = 'Компания не найдена';
        toast.error(error.value);
        return;
      }
      try {
        await fetchWithCsrf(`${BASE_URLS.auth}/subscription/activate-trial`, {
          method: 'POST',
          body: JSON.stringify({ company_id: companyId.value }),
        }, 'activateTrial');
        await authStore.fetchProfile();
        subscriptionStatus.value = authStore.subscriptionStatus;
        trialEnd.value = authStore.trialEnd;
        showTrialDialog.value = false;
        toast.success('Пробный период на 5 дней активирован!');
      } catch (err) {
        error.value = err.message || 'Ошибка активации пробного периода';
        toast.error(error.value);
      }
    };

    // Прикрепление карты
    const attachCard = async () => {
      $v.cardData.$touch();
      if ($v.cardData.$invalid) {
        toast.error('Пожалуйста, заполните все поля корректно');
        return;
      }
      try {
        await subscriptionStore.attachCard(cardData.value);
        cardData.value = { card_number: '', expiry: '', cvc: '' };
        $v.cardData.$reset();
      } catch (err) {
        error.value = err.message || 'Ошибка при прикреплении карты';
        toast.error(error.value);
      }
    };

    // Открепление карты
    const detachCard = async (cardId) => {
      try {
        await subscriptionStore.detachCard(cardId);
      } catch (err) {
        error.value = err.message || 'Ошибка при откреплении карты';
        toast.error(error.value);
      }
    };

    // Инициализация платежа
    const initiatePayment = async () => {
      if (!companyId.value) {
        error.value = 'Компания не найдена';
        toast.error(error.value);
        return;
      }
      try {
        const response = await subscriptionStore.initiateSubscriptionPayment(activeCard.value?.card_id);
        if (response.payment_url) {
          const paymentWindow = window.open(response.payment_url, '_blank');
          if (!paymentWindow) {
            error.value = 'Не удалось открыть окно оплаты. Проверьте настройки браузера.';
            toast.error(error.value);
            return;
          }
          const paymentId = response.payment_id;
          const checkPaymentStatus = setInterval(async () => {
            try {
              const result = await subscriptionStore.confirmSubscriptionPayment(paymentId);
              if (result.message === 'Подписка успешно активирована') {
                clearInterval(checkPaymentStatus);
                paymentWindow.close();
                subscriptionStatus.value = 'active';
                toast.success('Подписка успешно активирована!');
                await loadData();
              }
            } catch (err) {
              console.error('Ошибка проверки статуса платежа:', err);
            }
          }, 5000);
        } else {
          subscriptionStatus.value = 'active';
          toast.success('Подписка успешно активирована!');
          await loadData();
        }
      } catch (err) {
        error.value = err.response?.data?.detail || 'Ошибка инициализации платежа';
        toast.error(error.value);
      }
    };

    // Загрузка данных при монтировании
    loadData();

    // Отслеживание изменений статуса подписки
    watch(() => authStore.subscriptionStatus, (newStatus) => {
      if (newStatus === 'trial' && !authStore.trialEnd && isCompanyAdmin.value) {
        showTrialDialog.value = true;
      }
    });

    return {
      subscriptionStatus,
      trialEnd,
      error,
      isFormValid,
      cardData,
      cardHeaders,
      paymentHeaders,
      companyId,
      isCompanyAdmin,
      companyCards,
      paymentHistory,
      isPaymentPending,
      activeCard,
      showTrialDialog,
      formatTrialEnd,
      getStatusColor,
      activateTrial,
      attachCard,
      detachCard,
      initiatePayment,
      $v,
    };
  },
  validations: {
    cardData: {
      card_number: {
        required,
        regex: regex(/^\d{16}$/, 'Номер карты должен содержать 16 цифр'),
      },
      expiry: {
        required,
        regex: regex(/^\d{2}\/\d{2}$/, 'Формат: MM/YY'),
      },
      cvc: {
        required,
        regex: regex(/^\d{3}$/, 'CVC должен содержать 3 цифры'),
      },
    },
  },
};
</script>

<style scoped>
.v-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
</style>