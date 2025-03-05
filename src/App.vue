<template>
  <v-app>
    <!-- Меню и кнопки отображаются только после авторизации и не на страницах входа/регистрации -->
    <Sidebar v-if="isAuthenticated && !$route.path.includes('/login') && !$route.path.includes('/register')" />
    <v-main>
      <v-container fluid class="main-container">
        <router-view />
        <VoiceRecorderForm
          v-if="isAuthenticated && !$route.path.includes('/login') && !$route.path.includes('/register')"
          @recording-started="onRecordingStarted"
          @recording-stopped="onRecordingStopped"
          @suggestions-updated="onSuggestionsUpdated"
          class="voice-recorder-global"
        />
        <Chat
          v-if="isAuthenticated && !$route.path.includes('/login') && !$route.path.includes('/register')"
          :suggestions="suggestions"
          @suggestion-selected="handleSuggestion"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Sidebar from './components/SidebarForm.vue';
import VoiceRecorderForm from './components/VoiceRecorderForm.vue';
import Chat from './components/ChatForm.vue';
import { processVoice } from './api';
import { useAuthStore } from './stores/auth';

export default {
  components: { Sidebar, VoiceRecorderForm, Chat },
  data() {
    return {
      suggestions: [],
    };
  },
  computed: {
    isAuthenticated() {
      const authStore = useAuthStore();
      return authStore.isAuthenticated;
    },
  },
  mounted() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
          reg.pushManager.subscribe({ userVisibleOnly: true })
            .then((sub) => console.log('Push subscription:', sub))
            .catch((err) => console.error('Push subscription failed:', err));
        })
        .catch((err) => console.error('Service Worker registration failed:', err));
    }
  },
  methods: {
    onRecordingStarted() {
      console.log('Recording started');
    },
    onRecordingStopped() {
      console.log('Recording stopped');
    },
    onSuggestionsUpdated(suggestions) {
      this.suggestions = suggestions;
    },
    async handleSuggestion(suggestion) {
      try {
        const response = await processVoice('', 'webm', suggestion.action);
        console.log('API response:', response);
        this.suggestions = [];
      } catch (error) {
        console.error('Ошибка обработки предложения:', error);
      }
    },
  },
};
</script>

<style scoped>
.main-container {
  position: relative;
  padding: 20px;
  z-index: 1;
}

.voice-recorder-global {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
</style>