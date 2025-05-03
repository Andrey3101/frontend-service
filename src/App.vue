<template>
  <v-app>
    <Sidebar 
      v-if="showSidebar"
      v-model="drawer"
      :show-mobile-button="isMobile && showSidebar"
      :is-mobile-or-tablet="isMobile"
    />
    
    <v-main>
      <v-container fluid class="main-container" :class="{ 'mobile-padding': isMobile }">
        <v-alert
          v-if="showSubscriptionAlert"
          type="warning"
          dismissible
          class="mb-4"
          @click:dismiss="dismissSubscriptionAlert"
        >
          {{ subscriptionAlertMessage }}
          <v-btn
            color="primary"
            small
            class="ml-2"
            :to="{ name: 'Subscription' }"
          >
            Оформить подписку
          </v-btn>
        </v-alert>
        <router-view />
        
        <VoiceRecorderForm
          v-if="showSidebar"
          class="voice-recorder-global"
        />
        
        <Chat
          v-if="showSidebar"
          class="chat-global"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import Sidebar from './components/SidebarForm.vue';
import VoiceRecorderForm from './components/VoiceRecorderForm.vue';
import Chat from './components/ChatForm.vue';

export default {
  components: { Sidebar, VoiceRecorderForm, Chat },
  setup() {
    const route = useRoute();
    const authStore = useAuthStore();
    const drawer = ref(false);
    const isDismissed = ref(false);

    const isMobile = computed(() => {
      return window.innerWidth < 960;
    });

    const isAuthPage = computed(() => {
      return ['/login', '/register', '/reset-password'].some(path => route.path.startsWith(path));
    });

    const showSidebar = computed(() => {
      return authStore.isAuthenticated && !isAuthPage.value;
    });

    const showSubscriptionAlert = computed(() => {
      if (!authStore.isAuthenticated || isAuthPage.value || isDismissed.value) return false;
      const status = authStore.profile?.subscription_status;
      return status === 'expired' || (status === 'trial' && isTrialEndingSoon());
    });

    const subscriptionAlertMessage = computed(() => {
      const status = authStore.profile?.subscription_status;
      if (status === 'expired') {
        return 'Ваш пробный период истек. Оформите подписку, чтобы продолжить пользоваться сервисом.';
      } else if (status === 'trial') {
        const trialEnd = new Date(authStore.profile?.trial_end);
        const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
        return `Ваш пробный период заканчивается через ${daysLeft} дн. Оформите подписку, чтобы избежать ограничений.`;
      }
      return '';
    });

    const isTrialEndingSoon = () => {
      const trialEnd = new Date(authStore.profile?.trial_end);
      const daysLeft = (trialEnd - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 2; // Показывать уведомление за 2 дня до окончания
    };

    const dismissSubscriptionAlert = () => {
      isDismissed.value = true;
    };

    return {
      drawer,
      isMobile,
      showSidebar,
      showSubscriptionAlert,
      subscriptionAlertMessage,
      dismissSubscriptionAlert,
    };
  },
};
</script>

<style scoped>
.main-container {
  position: relative;
  padding: 24px;
  transition: padding 0.3s ease;
}

.mobile-padding {
  padding: 16px;
}

.voice-recorder-global {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}

.chat-global {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 999;
}

@media (max-width: 600px) {
  .main-container {
    padding: 12px;
  }
  
  .voice-recorder-global {
    bottom: 10px;
    right: 10px;
  }
  
  .chat-global {
    bottom: 70px;
    right: 10px;
  }
}
</style>