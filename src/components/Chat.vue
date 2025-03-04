<template>
  <div class="chat-container">
    <div v-for="(message, index) in messages" :key="index" :class="['chat-message', message.type]">
      {{ message.text }}
    </div>
    <v-list v-if="showSuggestions">
      <v-list-item v-for="(sug, index) in suggestions" :key="index" @click="handleSuggestion(sug)">
        <v-list-item-title>{{ sug.text }}</v-list-item-title>
      </v-list-item>
    </v-list>
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
      messages: [
        { text: 'Выберите действие:', type: 'bot' },
      ],
      defaultSuggestions: [
        { text: 'Создать задачу', action: { type: 'create_task' } },
        { text: 'Составить отчет', action: { type: 'generate_report' } },
      ],
    };
  },
  computed: {
    showSuggestions() {
      return this.suggestions.length > 0 || this.messages.length === 1;
    },
  },
  watch: {
    suggestions(newVal) {
      if (newVal.length > 0) {
        this.messages = [{ text: 'Выберите действие:', type: 'bot' }];
      }
    },
  },
  methods: {
    handleSuggestion(suggestion) {
      this.messages.push({ text: suggestion.text, type: 'user' });
      this.$emit('suggestion-selected', suggestion);
      this.messages.push({ text: 'Действие выполнено!', type: 'bot' });
    },
  },
};
</script>