<template>
  <div class="chat-wrapper">
    <v-card v-show="!isMinimized" class="chat-container" elevation="4">
      <v-card-title class="chat-header">
        Чат
        <v-spacer />
        <v-btn icon @click="minimizeChat" class="minimize-btn" aria-label="Свернуть чат">
          <img src ="@/assets/sidebaricon/down.svg" class="custom-icon" alt="Down">
        </v-btn>
      </v-card-title>
      <v-card-text class="chat-messages">
        <transition-group name="message" tag="div">
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="chat-message"
            :class="{ 'user': message.isUser }"
          >
            <span class="message-text">{{ message.text }}</span>
            <span class="message-timestamp">{{ message.timestamp }}</span>
          </div>
        </transition-group>
        <div class="chat-input-wrapper">
          <div class="chat-input-area">
            <v-text-field
              v-model="newMessage"
              placeholder="Введите сообщение"
              @keyup.enter="sendMessage"
              class="chat-input-field"
              dense
              hide-details
              aria-label="Введите сообщение в чат"
            />
            <v-btn
              icon
              @click="sendMessage"
              class="chat-send-btn"
              aria-label="Отправить сообщение"
            >
              <img src ="@/assets/sidebaricon/send_icon.svg" class="custom-icon" alt="Send">
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
    <v-btn
      v-show="isMinimized"
      color="primary"
      class="chat-minimized"
      @click="maximizeChat"
      elevation="4"
      aria-label="Открыть чат"
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
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.messages.push({ text: this.newMessage, isUser: true, timestamp });
        this.newMessage = '';
        this.$nextTick(() => {
          const container = this.$el.querySelector('.chat-messages');
          container.scrollTop = container.scrollHeight;
        });
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
  max-height: 750px;
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

.minimize-btn {
  width: 6px;
  height: 6px;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fbfcfe;
  display: flex;
  flex-direction: column;
  gap: 140px;
}

.chat-message {
  padding: 10px 14px;
  margin: 0;
  border-radius: 12px;
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 0.95rem;
  max-width: 80%;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
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

.message-timestamp {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 4px;
  align-self: flex-end;
}

.chat-input-wrapper {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  background: #fff;
  position: sticky;
  bottom: 0;
  z-index: 1;
}

.chat-input-area {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 300px;
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

/* Анимация появления сообщений */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Адаптация для планшетной версии (600px–959px) */
@media (min-width: 600px) and (max-width: 959px) {
  .chat-container {
    bottom: 140px; /* Опускаем ниже (было 320px) */
    right: 5%;
    width: 300px;
    max-height: 400px;
  }
  .chat-minimized {
    bottom: 140px; /* Опускаем ниже (было 320px) */
    right: 5%;
  }
  .chat-header {
    font-size: 1rem;
    padding: 4px 14px;
  }
  .minimize-btn {
    width: 3.5px;
    height: 3.5px;
  }
  .chat-messages {
    padding: 14px;
    gap: 90px;
  }
  .chat-message {
    font-size: 1rem;
    padding: 8px 12px;
  }
  .chat-input-field {
    font-size: 0.9rem;
    height: 53px;
  }
  .chat-send-btn {
    width: 34px;
    height: 34px;
  }
  .chat-input-area {
    max-width: 260px;
  }
}

/* Адаптация для мобильной версии (< 600px) */
@media (max-width: 599px) {
  .chat-container {
    bottom: 160px; /* Опускаем ниже (было 150px) */
    right: 5%;
    width: 260px;
    max-height: 525px;
  }
  .v-btn--icon.v-btn--density-default {
    width: calc(var(--v-btn-height) + 5px) !important; 
    height: calc(var(--v-btn-height) + 5px) !important; 
  }
  .chat-minimized {
    bottom: 160px; /* Опускаем ниже (было 150px) */
    right: 5%;
    font-size: 0.9rem;
    padding: 6px 12px;
  }
  .chat-header {
    font-size: 0.9rem;
    padding: 5px 12px;
  }
  .minimize-btn {
    width: 2.5px;
    height: 2.5px;
  }
  .chat-messages {
    padding: 12px;
    gap: 80px;
  }
  .chat-message {
    font-size: 0.95rem;
    padding: 6px 10px;
  }
  .chat-input-field {
    font-size: 0.85rem;
    height: 50px;
    padding-top: 100;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
    margin-right: 5px;
  }
  .chat-send-btn {
    width: 30px;
    height: 30px;
  }
  .chat-input-area {
    max-width: 230px;
  }
}
</style>