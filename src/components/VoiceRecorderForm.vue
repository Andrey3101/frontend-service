<template>
  <div>
    <v-snackbar
      v-model="showError"
      color="error"
      :timeout="5000"
      top
      centered
      class="mic-error-snackbar"
      aria-label="Ошибка доступа к микрофону"
    >
      Доступ к микрофону не получен
    </v-snackbar>
    <v-btn
      color="secondary"
      class="voice-recorder-btn"
      :class="{ recording: isRecording }"
      @click="startRecording"
      elevation="4"
      v-if="!isRecording"
      aria-label="Начать запись голоса"
    >
      Начать запись
      <img src ="@/assets/sidebaricon/microfone.svg" class="custom-icon" alt="Microfone">
    </v-btn>
    <v-btn
      color="secondary"
      class="voice-recorder-btn"
      @click="stopRecording"
      elevation="4"
      v-else
      aria-label="Остановить запись голоса"
    >
      Остановить запись
      <img src ="@/assets/sidebaricon/stop.svg" class="custom-icon" alt="Stop">
    </v-btn>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isRecording: false,
      showError: false,
    };
  },
  methods: {
    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.isRecording = true;
        this.showError = false;
        this.$emit('recording-started');
        console.log('Microphone access granted:', stream);
      } catch (error) {
        this.showError = true;
        console.error('Microphone access denied:', error);
      }
    },
    stopRecording() {
      this.isRecording = false;
      this.$emit('recording-stopped');
    },
  },
};
</script>

<style scoped>
.voice-recorder-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2500;
  border-radius: 30px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff5722, #ff8a65);
  color: white;
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 1rem;
  text-transform: none;
  transition: transform 0.2s ease;
}

.voice-recorder-btn:hover {
  transform: scale(1.05);
}

/* Анимация пульсации во время записи */
.voice-recorder-btn.recording {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.mic-error-snackbar {
  z-index: 3000;
  font-family: 'Gilroy-Regular', sans-serif;
}

/* Адаптация для планшетной версии (600px–959px) */
@media (min-width: 600px) and (max-width: 959px) {
  .voice-recorder-btn {
    bottom: 80px;
    right: 5%;
  }
}

/* Адаптация для мобильной версии (< 600px) */
@media (max-width: 599px) {
  .voice-recorder-btn {
    bottom: 90px;
    right: 5%;
    font-size: 0.9rem;
    padding: 6px 12px;
  }
}
</style>