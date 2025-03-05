<template>
  <div>
    <v-btn
      color="secondary"
      class="voice-recorder-btn"
      @click="startRecording"
      elevation="4"
      v-if="!showError"
    >
      Начать запись
      <v-icon right small>mdi-microphone</v-icon>
    </v-btn>
    <v-alert
      v-if="showError"
      type="error"
      dense
      class="mic-error"
    >
      Доступ к микрофону не получен
    </v-alert>
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

.mic-error {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2500;
  font-family: 'Gilroy-Regular', sans-serif;
  max-width: 300px;
}

@media (max-width: 960px) {
  .voice-recorder-btn,
  .mic-error {
    bottom: 180px; /* Увеличиваем расстояние для мобильного меню */
    right: 5%;
  }
}
</style>