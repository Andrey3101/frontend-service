<template>
  <v-dialog :model-value="props.modelValue" max-width="420" persistent @update:model-value="onDialogToggle">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <div v-if="props.doc" class="text-body-2 mb-3">
          {{ kindTitle }} № {{ props.doc.number }} — {{ props.doc.client_name || '—' }}, {{ formatMoney(props.doc.total) }}
        </div>
        <v-form ref="formRef" @submit.prevent="confirm">
          <v-text-field
            v-model="paidAt"
            type="date"
            label="Дата оплаты"
            :rules="[rules.required]"
            hint="По этой дате доход попадёт в раздел «Финансы»"
            persistent-hint
            autofocus
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="props.loading" @click="cancel">Отмена</v-btn>
        <v-btn color="success" variant="flat" prepend-icon="mdi-cash-check" :loading="props.loading" @click="confirm">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * Диалог даты оплаты документа (API.md, 12.1): родитель по `confirm(paidAt)` делает
 * PUT {status: 'paid', paid_at}. `cancel` — пользователь передумал (вернуть прежний статус).
 */
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { formatMoney } from '@/utils/format.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** @type {import('vue').PropType<import('@/api/types.js').Document|null>} */
  doc: { type: Object, default: null },
  kind: { type: String, default: 'act', validator: (v) => ['act', 'invoice'].includes(v) },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const formRef = ref(null);
const paidAt = ref('');
const today = computed(() => dayjs().format('YYYY-MM-DD'));

const kindTitle = computed(() => (props.kind === 'invoice' ? 'Счёт' : 'Акт'));
/** Документ уже оплачен — меняем только дату. */
const isChange = computed(() => props.doc?.status === 'paid');
const title = computed(() => (isChange.value ? 'Дата оплаты' : 'Отметить как оплаченный'));
const confirmText = computed(() => (isChange.value ? 'Сохранить' : 'Оплачен'));

const rules = {
  required: (v) => Boolean(v) || 'Укажите дату оплаты',
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) paidAt.value = props.doc?.paid_at || today.value;
  },
  { immediate: true },
);

function onDialogToggle(value) {
  if (!value) cancel();
}

function cancel() {
  emit('update:modelValue', false);
  emit('cancel');
}

async function confirm() {
  if (props.loading) return;
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  emit('confirm', paidAt.value);
}
</script>
