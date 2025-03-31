<template>
  <div class="comment-form">
    <v-textarea
      v-model="commentText"
      :label="editMode ? 'Редактирование комментария' : 'Новый комментарий'"
      outlined
      dense
      rows="3"
      class="comment-textarea"
      :rules="commentRules"
      counter
      maxlength="1000"
      :error-messages="errorMessages"
      :disabled="loading"
      aria-label="Текст комментария"
      @keydown.enter.exact.prevent="handleEnterKey"
    />
    
    <v-alert
      v-if="error"
      type="error"
      dense
      class="error-alert"
      dismissible
      @input="clearError"
      aria-label="Сообщение об ошибке"
    >
      <v-icon small left>mdi-alert-circle</v-icon>
      {{ error }}
    </v-alert>
    
    <div class="button-group">
      <v-btn
        color="primary"
        class="action-btn"
        @click="saveComment"
        :disabled="!isFormValid || loading"
        :loading="loading"
        :aria-label="editMode ? 'Сохранить изменения' : 'Добавить комментарий'"
      >
        <v-icon left>{{ editMode ? 'mdi-content-save' : 'mdi-plus' }}</v-icon>
        {{ editMode ? 'Сохранить' : 'Добавить' }}
      </v-btn>
      
      <v-btn
        v-if="editMode"
        color="grey"
        text
        class="cancel-btn"
        @click="cancel"
        :disabled="loading"
        aria-label="Отменить редактирование"
      >
        <v-icon left>mdi-close</v-icon>
        Отмена
      </v-btn>
    </div>
  </div>
</template>

<script>
import { createComment, updateComment } from '../api';
import debounce from 'lodash/debounce';

export default {
  name: 'CommentForm',
  props: {
    taskId: {
      type: String,
      required: true,
      validator: value => /^[a-f\d]{24}$/.test(value) // Проверка формата ID
    },
    comment: {
      type: Object,
      default: null,
      validator: comment => {
        if (!comment) return true;
        return comment.id && comment.text && typeof comment.text === 'string';
      }
    }
  },
  data() {
    return {
      commentText: '',
      loading: false,
      error: null,
      errorMessages: [],
      commentRules: [
        v => !!v.trim() || 'Комментарий не может быть пустым',
        v => v.length <= 1000 || 'Комментарий слишком длинный (макс. 1000 символов)',
        v => v.trim().length >= 3 || 'Комментарий слишком короткий (мин. 3 символа)'
      ],
      lastSavedText: '' // Для отслеживания изменений
    };
  },
  computed: {
    editMode() {
      return !!this.comment;
    },
    isFormValid() {
      return this.commentText.trim().length >= 3 && 
             this.commentText.trim().length <= 1000 &&
             this.commentText !== this.lastSavedText;
    },
    hasChanges() {
      return this.commentText !== this.lastSavedText;
    }
  },
  watch: {
    comment: {
      immediate: true,
      handler(newVal) {
        this.commentText = newVal ? newVal.text : '';
        this.lastSavedText = newVal ? newVal.text : '';
      }
    },
    commentText: debounce(function(newVal) {
      this.validateComment(newVal);
    }, 300)
  },
  methods: {
    validateComment(text) {
      this.errorMessages = this.commentRules
        .map(rule => rule(text))
        .filter(result => typeof result === 'string');
    },
    async saveComment() {
      if (!this.isFormValid) return;
      
      this.loading = true;
      this.error = null;
      this.errorMessages = [];
      
      try {
        const trimmedText = this.commentText.trim();
        const response = this.editMode
          ? await updateComment(this.taskId, this.comment.id, trimmedText)
          : await createComment(this.taskId, trimmedText);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        this.lastSavedText = trimmedText;
        this.commentText = '';
        
        this.$emit('comment-saved', {
          action: this.editMode ? 'updated' : 'created',
          message: this.editMode 
            ? 'Комментарий успешно обновлен' 
            : 'Комментарий успешно добавлен',
          comment: response.data || {
            id: this.comment?.id || Date.now().toString(),
            text: trimmedText,
            date: new Date().toISOString()
          }
        });
        
        this.$nextTick(() => {
          this.$toast?.success(this.editMode 
            ? 'Комментарий обновлен' 
            : 'Комментарий добавлен');
        });
      } catch (error) {
        console.error('Ошибка сохранения комментария:', error);
        
        let errorMessage = 'Не удалось сохранить комментарий';
        if (error.response) {
          // Ошибка от сервера
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        error.response.statusText || 
                        errorMessage;
          
          if (error.response.status === 401) {
            errorMessage = 'Требуется авторизация';
            this.$emit('auth-required');
          } else if (error.response.status === 404) {
            errorMessage = 'Задача не найдена';
            this.$emit('task-not-found');
          }
        } else if (error.request) {
          // Ошибка сети
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
        } else {
          // Другие ошибки
          errorMessage = error.message || errorMessage;
        }
        
        this.error = errorMessage;
        this.$toast?.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },
    cancel() {
      if (this.hasChanges) {
        this.$confirm('Отменить изменения?', {
          title: 'Подтверждение',
          buttonTrueText: 'Да',
          buttonFalseText: 'Нет'
        }).then(res => {
          if (res) {
            this.resetForm();
            this.$emit('cancel');
          }
        });
      } else {
        this.resetForm();
        this.$emit('cancel');
      }
    },
    resetForm() {
      this.commentText = this.comment?.text || '';
      this.lastSavedText = this.comment?.text || '';
      this.error = null;
      this.errorMessages = [];
    },
    clearError() {
      this.error = null;
    },
    handleEnterKey(event) {
      if (event.ctrlKey || event.metaKey) {
        this.saveComment();
      }
    }
  },
  beforeRouteLeave(to, from, next) {
    if (this.hasChanges) {
      this.$confirm('У вас есть несохраненные изменения. Продолжить?', {
        title: 'Подтверждение',
        buttonTrueText: 'Да',
        buttonFalseText: 'Нет'
      }).then(res => {
        if (res) {
          next();
        } else {
          next(false);
        }
      });
    } else {
      next();
    }
  }
};
</script>

<style scoped>
.comment-form {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.comment-form:focus-within {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.comment-textarea {
  font-family: 'Gilroy-Regular', sans-serif;
  margin-bottom: 16px;
}

.comment-textarea >>> .v-text-field__details {
  margin-bottom: 4px;
}

.error-alert {
  margin-bottom: 12px;
  animation: fadeIn 0.3s ease;
}

.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.2s ease;
  min-width: 120px;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cancel-btn {
  font-family: 'Gilroy-Regular', sans-serif;
  text-transform: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.05);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .comment-form {
    padding: 12px;
  }
  
  .button-group {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-btn, .cancel-btn {
    width: 100%;
    margin: 0;
  }
}
</style>
