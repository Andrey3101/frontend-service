<!-- src/components/VoiceRecorderForm.vue -->
<template>
  <v-card>
    <v-card-title>Голосовая запись</v-card-title>
    <v-card-text>
      <v-btn @click="startRecording" :disabled="isRecording">Начать запись</v-btn>
      <v-btn @click="stopRecording" :disabled="!isRecording">Остановить</v-btn>
      <v-alert v-if="result" type="success">{{ result.command }}</v-alert>
      <v-alert v-if="error" type="error">{{ error }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
import { analyzeVoice } from '@/api';

export default {
  data() {
    return {
      isRecording: false,
      recorder: null,
      result: null,
      error: null,
    };
  },
  methods: {
    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const chunks = [];
        this.recorder.ondataavailable = (e) => chunks.push(e.data);
        this.recorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          const blob = new Blob(chunks, { type: 'audio/webm' });
          await this.sendAudio(blob);
        };
        this.recorder.start();
        this.isRecording = true;
      } catch (err) {
        this.error = 'Ошибка доступа к микрофону: ' + err.message;
      }
    },
    stopRecording() {
      if (this.recorder) {
        this.recorder.stop();
        this.isRecording = false;
      }
    },
    async sendAudio(blob) {
      try {
        const base64 = await this.blobToBase64(blob);
        const response = await analyzeVoice({ audio_file: base64, format: 'webm' });
        this.result = response;
        this.error = null;
        if (response.action?.type === 'create_task') {
          this.$emit('taskCreated', response.action.data);
        }
      } catch (err) {
        this.error = 'Ошибка обработки аудио: ' + err.message;
      }
    },
    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
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