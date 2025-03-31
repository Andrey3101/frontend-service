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
          :disabled="!isValid || saving"
        >
          Сохранить
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-snackbar v-model="snackbar" :timeout="5000" color="red" top multi-line>
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
    title: {
      type: String,
      default: 'Редактирование'
    },
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
      // Сбрасываем ошибки при закрытии модального окна
      if (!val) {
        this.resetError();
      }
    },
  },
  methods: {
    close() {
      this.dialog = false;
    },
    async save() {
      if (this.saving) return;
      
      this.resetError();
      this.saving = true;
      
      try {
        const promise = this.$emit('save');
        if (promise && typeof promise.then === 'function') {
          await promise;
        }
        this.dialog = false;
        this.$emit('saved');
      } catch (error) {
        this.handleError(error);
      } finally {
        this.saving = false;
      }
    },
    handleError(error) {
      let message = 'Ошибка при сохранении';
      
      if (typeof error === 'string') {
        message = error;
      } else if (error?.message) {
        message = error.message;
      } else if (error?.response?.data?.message) {
        // Обработка ошибок API
        message = error.response.data.message;
      } else if (error?.response?.status === 422) {
        // Обработка ошибок валидации
        message = this.formatValidationErrors(error.response.data.errors);
      }
      
      this.errorMessage = message;
      this.snackbar = true;
      this.$emit('error', error);
    },
    formatValidationErrors(errors) {
      if (!errors) return 'Ошибка валидации данных';
      
      return Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
    },
    resetError() {
      this.errorMessage = '';
      this.snackbar = false;
    },
    showError(message) {
      this.handleError(message);
    },
  },
};
</script>

<style scoped>
.edit-modal {
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
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
  margin-right: -8px;
}

.close-btn:hover {
  transform: rotate(90deg);
}

.modal-content {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-actions {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.action-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  transition: transform 0.2s ease;
  letter-spacing: normal;
  padding: 8px 24px;
  margin-left: 8px;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.v-btn--disabled {
  opacity: 0.6;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 600px) {
  .modal-title {
    font-size: 1.2rem;
    padding: 12px 16px;
  }
  
  .modal-content {
    padding: 16px;
  }
  
  .modal-actions {
    padding: 12px 16px;
  }
  
  .action-btn {
    padding: 6px 16px;
  }
}
</style>
