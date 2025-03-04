<template>
  <v-container :fluid="$vuetify.breakpoint.xs">
    <h1 class="text-h5 mb-4">Голосовой ввод</h1>
    <v-row>
      <v-col cols="12" sm="6">
        <v-btn
          :color="isRecording ? 'error' : 'primary'"
          @click="isRecording ? stopRecording() : startRecording()"
          block
          :small="$vuetify.breakpoint.xs"
        >
          {{ isRecording ? 'Остановить' : 'Начать запись' }}
        </v-btn>
      </v-col>
      <v-col cols="12" sm="6">
<v-btn color="secondary" @click="processVoice" :disabled="!audioBlob" block :small="$vuetify.breakpoint.xs">
          Обработать
        </v-btn>
      </v-col>
    </v-row>
    <v-card class="mt-4" v-if="result">
      <v-card-text>{{ result }}</v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import axios from 'axios';
import { useAuthStore } from '@/store';

export default {
  data: () => ({
    isRecording: false,
    mediaRecorder: null,
    audioBlob: null,
    result: ''
  }),
  methods: {
    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(chunks, { type: 'audio/webm' });
          chunks.length = 0;
          stream.getTracks().forEach(track => track.stop());
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        this.$root.showSnackbar('Запись начата', 'info');
      } catch (error) {
        this.$root.showSnackbar('Ошибка записи: ' + error.message, 'error');
      }
    },
    stopRecording() {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.$root.showSnackbar('Запись остановлена', 'info');
    },
    async processVoice() {
      if (!this.audioBlob) return;

      const authStore = useAuthStore();
      const reader = new FileReader();
      reader.readAsDataURL(this.audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        try {
          const response = await axios.post('http://localhost:8000/ai/voice/predictive', {
            audio_file: base64Audio,
            format: 'webm'
          }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
          });
          this.result = JSON.stringify(response.data, null, 2);
          this.$root.showSnackbar('Голос обработан', 'success');
        } catch (error) {
          this.$root.showSnackbar('Ошибка обработки: ' + error.message, 'error');
        }
      };
    }
  }
};
</script>
