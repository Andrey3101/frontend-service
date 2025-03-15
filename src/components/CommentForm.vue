<template>
  <div class="comment-form">
    <v-textarea
      v-model="commentText"
      label="Комментарий"
      outlined
      dense
      rows="3"
      class="comment-textarea"
      :rules="[v => !!v.trim() || 'Комментарий не может быть пустым']"
    />
    <v-alert v-if="error" type="error" dense class="error-alert" dismissible @input="error = null">
      {{ error }}
    </v-alert>
    <div class="button-group">
      <v-btn
        color="primary"
        class="action-btn"
        @click="saveComment"
        :disabled="!commentText.trim() || loading"
        :loading="loading"
      >
        {{ editMode ? 'Сохранить' : 'Добавить' }}
      </v-btn>
      <v-btn
        v-if="editMode"
        color="grey"
        text
        class="cancel-btn"
        @click="cancel"
      >
        Отмена
      </v-btn>
    </div>
  </div>
</template>

<script>
import { createComment, updateComment } from '../api';

export default {
  props: {
    taskId: {
      type: String,
      required: true,
    },
    comment: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      commentText: '',
      loading: false,
      error: null,
    };
  },
  computed: {
    editMode() {
      return !!this.comment;
    },
  },
  watch: {
    comment(newVal) {
      this.commentText = newVal ? newVal.text : '';
    },
  },
  methods: {
    async saveComment() {
      this.loading = true;
      this.error = null;
      try {
        const response = this.editMode
          ? await updateComment(this.taskId, this.comment.id, this.commentText)
          : await createComment(this.taskId, this.commentText);
        this.commentText = '';
        this.$emit('comment-saved', this.editMode ? 'Комментарий успешно обновлен' : 'Комментарий успешно добавлен');
      } catch (error) {
        const errorMessage = error.response
          ? error.response.error || error.response.detail || error.message
          : error.message || 'Не удалось сохранить комментарий';
        this.error = errorMessage;
      } finally {
        this.loading = false;
      }
    },
    cancel() {
      this.commentText = '';
      this.error = null;
      this.$emit('cancel');
    },
  },
};
</script>

<style scoped>
.comment-form {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.comment-textarea {
  font-family: 'Gilroy-Regular', sans-serif;
  margin-bottom: 16px;
}

.button-group {
  display: flex;
  gap: 12px;
}

.action-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  text-transform: none;
  border-radius: 8px;
  padding: 8px 16px;
  transition: transform 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.cancel-btn {
  font-family: 'Gilroy-Regular', sans-serif;
  text-transform: none;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .button-group {
    flex-direction: column;
    gap: 8px;
  }
  .action-btn, .cancel-btn {
    width: 100%;
  }
}
</style>