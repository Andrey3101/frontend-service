<template>
  <div>
    <!-- Развернутый чат -->
    <v-card v-if="!isMinimized" class="chat-container">
      <v-card-title class="chat-header">
        Чат
        <v-spacer />
        <v-btn icon @click="minimizeChat">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="chat-messages">
        <div v-for="(message, index) in messages" :key="index" class="chat-message" :class="{ 'user': message.isUser }">
          {{ message.text }}
        </div>
      </v-card-text>
      <v-card-actions class="chat-input">
        <v-text-field v-model="newMessage" placeholder="Введите сообщение" @keyup.enter="sendMessage" />
        <v-btn icon @click="sendMessage">
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Свернутая кнопка "Чат" -->
    <v-btn
      v-if="isMinimized"
      color="primary"
      class="chat-minimized"
      @click="maximizeChat"
    >
      Чат
    </v-btn>
  </div>
</template>

<script>
export default {
  props: ['suggestions'],
  data() {
    return {
      isMinimized: false, // Состояние сворачивания
      messages: [],
      newMessage: '',
    };
  },
  methods: {
    sendMessage() {
      if (this.newMessage.trim()) {
        this.messages.push({ text: this.newMessage, isUser: true });
        this.newMessage = '';
        // Здесь можно добавить логику ответа бота
      }
    },
    minimizeChat() {
      this.isMinimized = true;
    },
    maximizeChat() {
      this.isMinimized = false;
    },
  },
};
</script>

<style scoped>
.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  max-height: 500px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.5s ease-out;
  border: 2px solid #e0e7ff;
}

.chat-header {
  background: linear-gradient(90deg, #1e88e5, #64b5f6);
  color: white;
  padding: 14px 20px;
  font-family: 'Gilroy-Black', sans-serif;
  font-size: 1.3rem;
  text-align: center;
  border-bottom: 3px solid #1976d2;
  display: flex;
  align-items: center;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fbfcfe;
  display: flex;
  flex-direction: column;
}

.chat-message {
  padding: 14px 18px;
  margin: 8px 0;
  border-radius: 12px;
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1rem;
  max-width: 85%;
  word-wrap: break-word;
  animation: bounceIn 0.4s ease-out;
}

.chat-message.user {
  background: #e1f5fe;
  align-self: flex-end;
  color: #1e88e5;
}

.chat-message:not(.user) {
  background: #eceff1;
  align-self: flex-start;
  color: #455a64;
}

.chat-input {
  display: flex;
  padding: 14px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
}

.chat-minimized {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 50px;
  padding: 10px 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 600px) {
  .chat-container {
    width: 90%;
    right: 5%;
    bottom: 60px;
    max-height: 400px;
  }

  .chat-minimized {
    bottom: 60px;
  }
}
</style>