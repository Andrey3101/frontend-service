<template>
  <div class="chat-wrapper">
    <v-card v-show="!isMinimized" class="chat-container" elevation="4">
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
        <div class="chat-input-area">
          <v-text-field
            v-model="newMessage"
            placeholder="Введите сообщение"
            @keyup.enter="sendMessage"
            class="chat-input-field"
          />
          <v-btn
            icon
            @click="sendMessage"
            class="chat-send-btn"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    <v-btn
      v-show="isMinimized"
      color="primary"
      class="chat-minimized"
      @click="maximizeChat"
      elevation="4"
    >
      Чат
      <v-icon right small>mdi-chat</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  props: ['suggestions'],
  data() {
    return {
      isMinimized: true,
      messages: [],
      newMessage: '',
    };
  },
  methods: {
    sendMessage() {
      if (this.newMessage.trim()) {
        this.messages.push({ text: this.newMessage, isUser: true });
        this.newMessage = '';
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
.chat-wrapper {
  position: relative;
}

.chat-container {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 360px;
  max-height: 500px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e7ff;
  z-index: 5000;
}

.chat-header {
  background: linear-gradient(135deg, #0288d1, #4fc3f7);
  color: white;
  padding: 12px 16px;
  font-family: 'Gilroy-Black', sans-serif;
  font-size: 1.2rem;
  border-bottom: 2px solid #0277bd;
  display: flex;
  align-items: center;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fbfcfe;
  display: flex;
  flex-direction: column;
}

.chat-message {
  padding: 12px 16px;
  margin: 6px 0;
  border-radius: 12px;
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 0.95rem;
  max-width: 80%;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chat-message.user {
  background: #e1f5fe;
  align-self: flex-end;
  color: #0277bd;
}

.chat-message:not(.user) {
  background: #eceff1;
  align-self: flex-start;
  color: #37474f;
}

.chat-input-area {
  display: flex;
  align-items: center;
  padding: 10px 0;
  background: #fff;
  position: sticky;
  bottom: 0;
  z-index: 1;
}

.chat-input-field {
  flex-grow: 1;
  margin-right: 10px;
  font-family: 'Gilroy-Regular', sans-serif;
}

.chat-send-btn {
  background: linear-gradient(135deg, #0288d1, #4fc3f7);
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  transition: transform 0.2s ease;
}

.chat-send-btn:hover {
  transform: scale(1.1);
}

.chat-minimized {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 5000;
  border-radius: 30px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #0288d1, #4fc3f7);
  color: white;
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 1rem;
  text-transform: none;
  transition: transform 0.2s ease;
}

.chat-minimized:hover {
  transform: scale(1.05);
}

@media (max-width: 960px) {
  .chat-container {
    bottom: 250px; /* Увеличиваем расстояние для мобильного меню */
    right: 5%;
  }
  .chat-minimized {
    bottom: 250px; /* Увеличиваем расстояние для мобильного меню */
  }
}
</style>