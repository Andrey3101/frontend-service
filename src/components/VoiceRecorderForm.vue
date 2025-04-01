<template>
  <div class="voice-recorder-container">
    <!-- The voice recorder button -->
    <div
      class="voice-recorder-wrapper"
      :class="{ recording: isRecording }"
      @click="toggleRecording"
    >
      <img
        :src="getIcon('microfone.svg')"
        class="voice-recorder-icon"
        alt="Microphone"
      />
    </div>

    <!-- Alerts for success or error -->
    <v-alert
      v-if="result"
      type="success"
      class="result-alert"
    >
      {{ result.command }}
    </v-alert>
    <v-alert
      v-if="error"
      type="error"
      class="error-alert"
    >
      {{ error }}
    </v-alert>
  </div>
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
    getIcon(iconName) {
      try {
        return require(`@/assets/${iconName}`); // Path to the icon
      } catch (e) {
        console.error(`Icon not found: ${iconName}`);
        return '';
      }
    },
    async toggleRecording() {
      console.log('toggleRecording called, isRecording:', this.isRecording);
      if (this.isRecording) {
        this.stopRecording();
      } else {
        await this.startRecording();
      }
    },
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
/* Wrapper for the entire component */
.voice-recorder-container {
  position: relative;
  pointer-events: none; /* Prevent the container from blocking clicks */
}

/* The voice recorder button */
.voice-recorder-wrapper {
  position: fixed;
  bottom: 100px; /* Position above the chat button */
  right: 20px;
  z-index: 5000; /* Ensure it's above other elements */
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #34d399, #10b981); /* Green gradient */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  pointer-events: auto; /* Ensure the button is clickable */
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  animation: bounceIn 0.6s ease-out forwards; /* Bounce animation on load */
}

.voice-recorder-wrapper:hover {
  transform: scale(1.1);
  background: linear-gradient(135deg, #2dd4bf, #059669);
  box-shadow: 0 8px 20px rgba(52, 211, 153, 0.5); /* Glow on hover */
}

/* Recording state */
.voice-recorder-wrapper.recording {
  background: linear-gradient(135deg, #f472b6, #fb7185); /* Pink gradient */
  animation: pulse 1s infinite, glow 1.5s infinite alternate;
}

.voice-recorder-wrapper.recording:hover {
  background: linear-gradient(135deg, #ec4899, #f43f5e);
  box-shadow: 0 8px 20px rgba(244, 114, 182, 0.5);
}

.voice-recorder-icon {
  width: 32px;
  height: 32px;
  filter: brightness(0) invert(1); /* White icon */
  transition: transform 0.3s ease;
}

.voice-recorder-wrapper:hover .voice-recorder-icon {
  transform: rotate(20deg) scale(1.1); /* Rotate and scale on hover */
}

.voice-recorder-wrapper.recording .voice-recorder-icon {
  animation: vibrate 0.3s infinite; /* Vibration during recording */
}

/* Ripple effect on click */
.voice-recorder-wrapper {
  position: relative;
  overflow: hidden;
}

.voice-recorder-wrapper::after {
  content: '';
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: scale(0);
  opacity: 0;
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.voice-recorder-wrapper:active::after {
  transform: scale(1.5);
  opacity: 1;
}

/* Alerts styling */
.result-alert,
.error-alert {
  position: fixed;
  bottom: 180px; /* Above the button */
  right: 20px;
  z-index: 5100; /* Above the button */
  pointer-events: auto; /* Ensure alerts are interactable */
  max-width: 300px;
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.05) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes glow {
  from { box-shadow: 0 6px 16px rgba(244, 114, 182, 0.5); }
  to { box-shadow: 0 10px 24px rgba(244, 114, 182, 0.8); }
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.1); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

@keyframes vibrate {
  0% { transform: translateX(0); }
  25% { transform: translateX(-2px) rotate(-5deg); }
  50% { transform: translateX(2px) rotate(5px); }
  75% { transform: translateX(-2px) rotate(-5deg); }
  100% { transform: translateX(0); }
}

/* Tablet version (600px–959px) */
@media (min-width: 600px) and (max-width: 959px) {
  .voice-recorder-wrapper {
    bottom: 90px;
    right: 5%;
    width: 56px;
    height: 56px;
  }
  .voice-recorder-icon {
    width: 28px;
    height: 28px;
  }
  .result-alert,
  .error-alert {
    bottom: 170px;
    right: 5%;
  }
}

/* Mobile version (< 600px) */
@media (max-width: 599px) {
  .voice-recorder-wrapper {
    bottom: 100px;
    right: 5%;
    width: 50px;
    height: 50px;
  }
  .voice-recorder-icon {
    width: 24px;
    height: 24px;
  }
  .result-alert,
  .error-alert {
    bottom: 160px;
    right: 5%;
  }
}
</style>