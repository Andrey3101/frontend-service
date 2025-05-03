import { defineStore } from 'pinia';
import { attachCard, detachCard, initiateSubscriptionPayment, confirmSubscriptionPayment, getCompanyCards, getPaymentHistory } from '@/api';
import { useAuthStore } from './auth';
import { useToast } from 'vue-toastification';

export const useSubscriptionStore = defineStore('subscription', {
  state: () => ({
    paymentStatus: 'idle', // idle, pending, success, error
    paymentError: null,
    attachedCard: null,
    companyCards: [],
    paymentHistory: [],
  }),
  actions: {
    async attachCard(cardData) {
      const authStore = useAuthStore();
      if (!authStore.isCompanyAdmin) {
        useToast().error('Только администраторы могут прикреплять карты');
        throw new Error('Access denied');
      }
      try {
        this.paymentStatus = 'pending';
        const response = await attachCard({
          ...cardData,
          company_id: authStore.user?.company_id,
        });
        this.attachedCard = response;
        await authStore.fetchProfile();
        await this.fetchCompanyCards();
        this.paymentStatus = 'success';
        useToast().success('Карта успешно прикреплена');
      } catch (error) {
        this.paymentStatus = 'error';
        this.paymentError = error.message || 'Ошибка при прикреплении карты';
        useToast().error(this.paymentError);
        throw error;
      }
    },
    async detachCard(cardId) {
      const authStore = useAuthStore();
      if (!authStore.isCompanyAdmin) {
        useToast().error('Только администраторы могут откреплять карты');
        throw new Error('Access denied');
      }
      try {
        this.paymentStatus = 'pending';
        await detachCard({
          company_id: authStore.user?.company_id,
          card_id: cardId,
        });
        this.attachedCard = null;
        await authStore.fetchProfile();
        await this.fetchCompanyCards();
        this.paymentStatus = 'success';
        useToast().success('Карта успешно откреплена');
      } catch (error) {
        this.paymentStatus = 'error';
        this.paymentError = error.message || 'Ошибка при откреплении карты';
        useToast().error(this.paymentError);
        throw error;
      }
    },
    async initiateSubscriptionPayment(cardId = null) {
      const authStore = useAuthStore();
      if (!authStore.isCompanyAdmin) {
        useToast().error('Только администраторы могут инициировать платежи');
        throw new Error('Access denied');
      }
      try {
        this.paymentStatus = 'pending';
        const response = await initiateSubscriptionPayment(authStore.user?.company_id, cardId);
        this.paymentStatus = 'success';
        useToast().success('Платеж инициирован');
        await this.fetchPaymentHistory();
        return response;
      } catch (error) {
        this.paymentStatus = 'error';
        this.paymentError = error.message || 'Ошибка при инициализации платежа';
        useToast().error(this.paymentError);
        throw error;
      }
    },
    async confirmSubscriptionPayment(paymentId) {
      try {
        this.paymentStatus = 'pending';
        const response = await confirmSubscriptionPayment(paymentId);
        this.paymentStatus = 'success';
        useToast().success('Платеж подтвержден');
        await this.fetchPaymentHistory();
        return response;
      } catch (error) {
        this.paymentStatus = 'error';
        this.paymentError = error.message || 'Ошибка при подтверждении платежа';
        useToast().error(this.paymentError);
        throw error;
      }
    },
    async fetchCompanyCards() {
      const authStore = useAuthStore();
      if (!authStore.isCompanyAdmin) {
        return;
      }
      try {
        this.companyCards = await getCompanyCards();
      } catch (error) {
        useToast().error('Ошибка при загрузке списка карт');
      }
    },
    async fetchPaymentHistory() {
      const authStore = useAuthStore();
      if (!authStore.isCompanyAdmin) {
        return;
      }
      try {
        this.paymentHistory = await getPaymentHistory();
      } catch (error) {
        useToast().error('Ошибка при загрузке истории платежей');
      }
    },
    resetPaymentStatus() {
      this.paymentStatus = 'idle';
      this.paymentError = null;
    },
  },
  getters: {
    isPaymentPending: (state) => state.paymentStatus === 'pending',
    hasAttachedCard: (state) => !!state.attachedCard,
    activeCard: (state) => state.companyCards.find(card => card.is_active) || null,
  },
});