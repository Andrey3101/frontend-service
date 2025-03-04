<template>
  <v-btn color="primary" class="record-btn" @click="recording ? stopRecording() : startRecording()">
    {{ recording ? 'Остановить запись' : 'Начать запись' }}
  </v-btn>
</template>

<script>
import { processVoice } from '../api';

export default {
  emits: ['recording-started', 'recording-stopped', 'suggestions-updated'],
  data() {
    return {
      recording: false,
      mediaRecorder: null,
    };
  },
  methods: {
    async startRecording() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const audioBase64 = await this.blobToBase64(blob);
        const response = await processVoice(audioBase64, 'webm');
        this.$emit('recording-stopped');
        if (response.action?.status === 'predictive') {
          this.$emit('suggestions-updated', response.action.suggestions);
        } else {
          alert('Задача создана');
        }
      };
      this.mediaRecorder.start();
      this.recording = true;
      this.$emit('recording-started');
    },
    stopRecording() {
      this.mediaRecorder.stop();
      this.recording = false;
    },
    blobToBase64(blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
    },
  },
};
</script>

<style scoped>
.record-btn {
  padding: 10px 20px;
  font-size: 1.1rem;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
  color: white;
}
</style>