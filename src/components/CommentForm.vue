<template>
  <div>
    <v-textarea
      v-model="commentText"
      label="Комментарий"
      outlined
      class="comment-textarea"
    />
    <v-btn color="primary" @click="saveComment" :disabled="!commentText.trim()">
      {{ editMode ? 'Сохранить' : 'Добавить' }}
    </v-btn>
    <v-btn color="grey" text @click="cancel" v-if="editMode">Отмена</v-btn>
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
      try {
        if (this.editMode) {
          await updateComment(this.taskId, this.comment.id, this.commentText);
        } else {
          await createComment(this.taskId, this.commentText);
        }
        this.commentText = '';
        this.$emit('comment-saved');
      } catch (error) {
        this.$emit('error', 'Не удалось сохранить комментарий: ' + error.message);
      }
    },
    cancel() {
      this.commentText = '';
      this.$emit('cancel');
    },
  },
};
</script>

<style scoped>
.comment-textarea {
  margin-bottom: 10px;
}
</style>