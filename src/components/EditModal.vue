<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card class="edit-modal">
      <v-card-title class="modal-title">
        {{ title }}
        <v-spacer />
        <v-btn icon @click="close" class="close-btn">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="modal-content">
        <slot />
      </v-card-text>
      <v-card-actions class="modal-actions">
        <v-spacer />
        <v-btn color="grey" text @click="close" class="action-btn">Отмена</v-btn>
        <v-btn
          color="primary"
          class="action-btn"
          @click="save"
          :loading="saving"
          :disabled="!isValid"
        >
          Сохранить
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-snackbar v-model="snackbar" :timeout="5000" color="red" top>
      {{ errorMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" @click="snackbar = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-dialog>
</template>

<script>
export default {
  props: {
    value: Boolean,
    title: String,
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      dialog: this.value,
      saving: false,
      snackbar: false,
      errorMessage: '',
    };
  },
  watch: {
    value(val) {
      this.dialog = val;
    },
    dialog(val) {
      this.$emit('input', val);
    },
  },
  methods: {
    close() {
      this.dialog = false;
    },
    async save() {
      this.saving = true;
      try {
        await this.$emit('save');
        this.dialog = false;
      } catch (error) {
        this.errorMessage = error.message || 'Ошибка при сохранении';
        this.snackbar = true;
      } finally {
        this.saving = false;
      }
    },
    showError(message) {
      this.errorMessage = message;
      this.snackbar = true;
    },
  },
};
</script>

<style scoped>
.edit-modal {
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 1.5rem;
  color: #1976d2;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.close-btn {
  transition: transform 0.2s ease;
}

.close-btn:hover {
  transform: rotate(90deg);
}

.modal-content {
  padding: 24px;
}

.modal-actions {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.action-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}
</style>