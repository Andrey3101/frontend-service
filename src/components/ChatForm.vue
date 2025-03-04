<template>
  <div class="chat-container" v-if="isVisible">
    <div class="chat-header">Чат</div>
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" :class="['chat-message', message.type]">
        {{ message.text }}
      </div>
    </div>
    <div class="chat-suggestions" v-if="suggestions.length > 0">
      <v-list dense>
        <v-list-item v-for="(sug, index) in suggestions" :key="index" @click="handleSuggestion(sug)">
          <v-list-item-title>{{ sug.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
    <div class="chat-input">
      <v-text-field
        v-model="inputText"
        class="chat-input-field"
        placeholder="Введите команду..."
        @keyup.enter="sendMessage"
        dense
        outlined
      />
      <v-btn color="primary" @click="sendMessage" small>Отправить</v-btn>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    suggestions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      messages: [],
      inputText: '',
      defaultSuggestions: [
        { text: 'Создать задачу', action: { type: 'create_task' } },
        { text: 'Составить отчет', action: { type: 'generate_report' } },
        { text: 'Показать задачи', action: { type: 'show_tasks' } },
        { text: 'Обновить профиль', action: { type: 'update_profile' } },
      ],
    };
  },
  computed: {
    isVisible() {
      return this.messages.length > 0 || this.suggestions.length > 0;
    },
  },
  watch: {
    suggestions(newVal) {
      if (newVal.length > 0) {
        this.messages = [{ text: 'Выберите действие или введите команду:', type: 'bot' }];
      } else if (this.messages.length === 0) {
        this.messages = [{ text: 'Введите команду или используйте голос:', type: 'bot' }];
      }
    },
    messages() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        container.scrollTop = container.scrollHeight;
      });
    },
  },
  methods: {
    handleSuggestion(suggestion) {
      this.messages.push({ text: suggestion.text, type: 'user' });
      this.$emit('suggestion-selected', suggestion);
      this.messages.push({ text: `Выполняю: ${suggestion.text}`, type: 'bot' });
    },
    sendMessage() {
      if (!this.inputText.trim()) return;
      this.messages.push({ text: this.inputText, type: 'user' });
      this.processCommand(this.inputText);
      this.inputText = '';
    },
    processCommand(command) {
      const lowerCommand = command.toLowerCase();
      let response = 'Команда не распознана. Попробуйте снова.';
      if (lowerCommand.includes('создать задачу')) {
        this.$emit('suggestion-selected', { text: 'Создать задачу', action: { type: 'create_task' } });
        response = 'Задача создается...';
      } else if (lowerCommand.includes('составить отчет')) {
        this.$emit('suggestion-selected', { text: 'Составить отчет', action: { type: 'generate_report' } });
        response = 'Отчет составляется...';
      } else if (lowerCommand.includes('показать задачи')) {
        this.$emit('suggestion-selected', { text: 'Показать задачи', action: { type: 'show_tasks' } });
        response = 'Загружаю задачи...';
      } else if (lowerCommand.includes('обновить профиль')) {
        this.$emit('suggestion-selected', { text: 'Обновить профиль', action: { type: 'update_profile' } });
        response = 'Обновляю профиль...';
      }
      this.messages.push({ text: response, type: 'bot' });
    },
  },
  mounted() {
    if (this.suggestions.length === 0) {
      this.messages = [{ text: 'Введите команду или используйте голос:', type: 'bot' }];
    }
  },
};
</script>