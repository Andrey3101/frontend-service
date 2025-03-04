<template>
  <v-app>
    <sidebar v-if="isAuthenticated" v-model="drawer" />
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
          v-if="isAuthenticated && $route.path !== '/login' && suggestions.length > 0"
          :suggestions="suggestions"
          @suggestion-selected="handleSuggestion"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import VoiceRecorderForm from './components/VoiceRecorderForm.vue';
import Chat from './components/Chat.vue';
import { processVoice } from './api';

export default {
  components: { Sidebar, VoiceRecorderForm, Chat },
  data() {
    return {
      drawer: true,
      suggestions: [],
    };
  },
  computed: {
    isAuthenticated() {
      return !!this.$store.state.token;
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
      this.suggestions = suggestions.length > 0 ? suggestions : this.defaultSuggestions;
    },
    async handleSuggestion(suggestion) {
      const response = await processVoice('', 'webm', suggestion.action);
      alert('Задача выполнена: ' + suggestion.text);
      this.suggestions = [];
    },
  },
};
</script>

<style scoped>
.main-container {
  position: relative;
  padding: 20px;
}

.voice-recorder-global {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
</style>