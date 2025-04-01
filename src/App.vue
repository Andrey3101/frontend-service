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
    const drawer = ref(false); // Default to closed

    const isMobile = computed(() => {
      return window.innerWidth < 960;
    });

    const isAuthPage = computed(() => {
      return ['/login', '/register'].some(path => route.path.startsWith(path));
    });

    const showSidebar = computed(() => {
      return authStore.isAuthenticated && !isAuthPage.value;
    });

    return {
      drawer,
      isMobile,
      showSidebar,
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