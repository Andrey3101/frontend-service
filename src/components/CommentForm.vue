<template>
  <v-form ref="formRef" @submit.prevent="save">
    <v-textarea
      v-model="text"
      :label="isEdit ? 'Изменить комментарий' : 'Новый комментарий'"
      placeholder="Напишите комментарий… (Ctrl+Enter — отправить)"
      rows="2"
      auto-grow
      counter="5000"
      :rules="[rules.required, rules.max]"
      :disabled="saving"
      @keydown.enter.ctrl.prevent="save"
      @keydown.enter.meta.prevent="save"
    />
    <div class="d-flex justify-end ga-2">
      <v-btn v-if="isEdit || props.cancelable" variant="text" :disabled="saving" @click="cancel">Отмена</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :loading="saving"
        :disabled="!text.trim()"
        :prepend-icon="isEdit ? 'mdi-content-save' : 'mdi-send'"
        @click="save"
      >
        {{ isEdit ? 'Сохранить' : 'Отправить' }}
      </v-btn>
    </div>
  </v-form>
</template>

<script setup>
/**
 * Форма комментария к задаче.
 * props: taskId — id задачи; comment — Comment для редактирования (без него — новый);
 *        cancelable — показывать «Отмена» и в режиме создания.
 * emits: saved(comment), cancel.
 */
import { computed, ref, watch } from 'vue';
import { createTaskComment, updateTaskComment } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';

const props = defineProps({
  taskId: { type: String, required: true },
  comment: { type: Object, default: null },
  cancelable: { type: Boolean, default: false },
});
const emit = defineEmits(['saved', 'cancel']);

const notify = useNotifyStore();
const formRef = ref(null);
const text = ref('');
const saving = ref(false);
const isEdit = computed(() => Boolean(props.comment?.id));

const rules = {
  required: (v) => Boolean(v && v.trim()) || 'Введите текст',
  max: (v) => !v || v.trim().length <= 5000 || 'Не более 5000 символов',
};

watch(
  () => props.comment,
  (c) => {
    text.value = c?.text ?? '';
  },
  { immediate: true },
);

function cancel() {
  text.value = props.comment?.text ?? '';
  formRef.value?.resetValidation();
  emit('cancel');
}

async function save() {
  if (saving.value) return;
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const body = { text: text.value.trim() };
    const saved = isEdit.value
      ? await updateTaskComment(props.taskId, props.comment.id, body)
      : await createTaskComment(props.taskId, body);
    if (!isEdit.value) {
      text.value = '';
      formRef.value?.resetValidation();
    }
    emit('saved', saved);
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}
</script>
