<template>
  <v-app>
    <v-app-bar app flat color="primary" dark v-if="isMobile">
      <v-app-bar-nav-icon @click="toggleDrawer" />
      <v-toolbar-title>{{ currentPageTitle }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ $vuetify.theme.dark ? 'mdi-white-balance-sunny' : 'mdi-moon-waxing-crescent' }}</v-icon>
      </v-btn>
    </v-app-bar>
    <Sidebar v-model="drawer" />
    <v-main>
      <v-container fluid class="main-container">
        <VoiceRecorderForm
          v-if="isAuthenticated && $route.path !== '/login'"
          @recording-started="onRecordingStarted"
          @recording-stopped="onRecordingStopped"
          @suggestions-updated="onSuggestionsUpdated"
          class="voice-recorder-global"
        />
        <router-view />
        <Chat
          v-if="isAuthenticated && $route.path !== '/login'"
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
      drawer: null,
      suggestions: [],
    };
  },
  computed: {
    isAuthenticated() {
      const authStore = useAuthStore();
      return authStore.isAuthenticated;
    },
    isMobile() {
      return this.$vuetify?.breakpoint?.smAndDown ?? false;
    },
    drawerState: {
      get() {
        return this.drawer !== null ? this.drawer : !this.isMobile;
      },
      set(value) {
        this.drawer = value;
        console.log('Drawer state updated:', value); // Отладка состояния меню
      },
    },
    currentPageTitle() {
      switch (this.$route.path) {
        case '/login': return 'Вход';
        case '/dashboard': return 'Дашборд';
        case '/tasks': return 'Задачи';
        case '/users': return 'Пользователи';
        case '/acts': return 'Акты';
        case '/reports': return 'Отчеты';
        case '/profile': return 'Профиль';
        default: return 'Мое приложение';
      }
    },
  },
  created() {
    this.$nextTick(() => {
      this.drawer = !this.isMobile; // Устанавливаем начальное состояние меню
      console.log('Initial drawer state:', this.drawer);
    });
  },
  watch: {
    // Отслеживаем изменение ширины экрана
    isMobile(newVal) {
      if (newVal) {
        this.drawer = false; // Закрываем меню при переходе в мобильный режим
      } else {
        this.drawer = true; // Открываем меню в десктопном режиме
      }
      console.log('isMobile changed:', newVal, 'Drawer:', this.drawer);
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
    toggleDrawer() {
      this.drawer = !this.drawer; // Переключаем состояние меню вручную
      console.log('Toggle drawer:', this.drawer);
    },
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
    toggleTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },
  },
};
</script>

<style scoped>
.main-container {
  position: relative;
  padding: 20px;
  z-index: 1; /* Основной контент ниже меню */
}

.voice-recorder-global {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000; /* Кнопка записи ниже чата */
}
</style>