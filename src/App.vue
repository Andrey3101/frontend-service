<template>
  <v-app>
    <!-- Верхняя панель -->
    <v-app-bar
      app
      flat
      color="primary"
      dark
      v-if="isAuthenticated && !$route.path.includes('/login') && !$route.path.includes('/register')"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" v-if="isMobile" />
      <v-toolbar-title>Мой Проект</v-toolbar-title>
    </v-app-bar>

    <!-- Боковое меню -->
    <Sidebar
      v-if="isAuthenticated && !$route.path.includes('/login') && !$route.path.includes('/register')"
      v-model="drawer"
    />

    <!-- Основной контент -->
    <v-main>
      <v-container fluid class="main-container" :class="{ 'with-sidebar': !isMobile }">
        <router-view />
        <!-- Голосовой рекордер и чат -->
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
          class="chat-global"
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
      drawer: false,
      suggestions: [],
    };
  },
  computed: {
    isAuthenticated() {
      const authStore = useAuthStore();
      return authStore.isAuthenticated;
    },
    isMobile() {
      return this.$vuetify?.breakpoint?.xsOnly ?? window.innerWidth < 600;
    },
  },
  mounted() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          reg.pushManager
            .subscribe({ userVisibleOnly: true })
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
  min-height: 100vh;
  z-index: 1;
  transition: padding-left 0.3s ease;
}

/* Отступы для контента на десктопе, когда боковое меню фиксированное */
.with-sidebar {
  padding-left: 280px; /* Соответствует ширине sidebar */
}

/* Голосовой рекордер */
.voice-recorder-global {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
}

/* Чат */
.chat-global {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

/* Мобильные стили */
@media (max-width: 600px) {
  .main-container {
    padding: 16px;
    padding-left: 16px !important; /* Убираем отступ, так как меню temporary */
  }

  .with-sidebar {
    padding-left: 0; /* На мобильных меню закрывает контент */
  }

  .voice-recorder-global {
    bottom: 70px;
    right: 16px;
  }

  .chat-global {
    bottom: 10px;
    right: 16px;
  }
}
</style>