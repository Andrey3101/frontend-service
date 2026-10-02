<template>
  <v-dialog :model-value="props.modelValue" max-width="560" persistent @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="props.doc">
      <v-card-title>Отправить клиенту</v-card-title>
      <v-card-subtitle>
        {{ kindTitle }} № {{ props.doc.number }} от {{ formatDate(props.doc.date) }} — {{ props.doc.client_name || '—' }}
      </v-card-subtitle>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="send">
          <v-text-field
            v-model="form.to"
            label="Email получателя"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            :loading="clientLoading"
            :rules="[rules.requiredIfNoClientEmail, rules.email]"
            :hint="toHint"
            persistent-hint
            autofocus
          />
          <v-textarea
            v-model="form.message"
            label="Сообщение"
            rows="3"
            auto-grow
            counter="2000"
            class="mt-3"
            :rules="[rules.max2000]"
          />
          <div class="text-caption text-medium-emphasis">
            PDF документа будет приложен к письму.
            <template v-if="props.doc.status === 'draft'">Черновик получит статус «Отправлен».</template>
          </div>
          <v-alert v-if="errorText" type="error" variant="tonal" density="compact" class="mt-3">
            {{ errorText }}
          </v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="sending" @click="close">Отмена</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-send" :loading="sending" @click="send">
          Отправить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * Диалог отправки акта/счёта клиенту по e-mail (API.md, 12.2):
 * POST /api/acts|invoices/{id}/send {to?, message?} → 202 {sent_to}.
 * Адрес по умолчанию — email клиента; если у клиента email нет, поле обязательно.
 * Emit `sent` ({sent_to}) — родитель перезагружает документ (draft → sent).
 */
import { computed, reactive, ref, watch } from 'vue';
import { errorMessage, getClient, sendAct, sendInvoice } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDate } from '@/utils/format.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** @type {import('vue').PropType<import('@/api/types.js').Document|null>} */
  doc: { type: Object, default: null },
  kind: { type: String, default: 'act', validator: (v) => ['act', 'invoice'].includes(v) },
});
const emit = defineEmits(['update:modelValue', 'sent']);

const notify = useNotifyStore();

const formRef = ref(null);
const form = reactive({ to: '', message: '' });
const clientEmail = ref('');
const clientLoading = ref(false);
const sending = ref(false);
const errorText = ref('');

const kindTitle = computed(() => (props.kind === 'invoice' ? 'Счёт' : 'Акт'));
const toHint = computed(() => {
  if (clientLoading.value) return '';
  return clientEmail.value
    ? `Email клиента: ${clientEmail.value}`
    : 'У клиента не указан email — укажите адрес получателя';
});

const rules = {
  requiredIfNoClientEmail: (v) => Boolean(clientEmail.value) || Boolean(String(v ?? '').trim()) || 'Укажите email получателя',
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) || 'Некорректный email',
  max2000: (v) => !v || String(v).length <= 2000 || 'Не более 2000 символов',
};

let loadSeq = 0;
async function loadClient() {
  const seq = ++loadSeq;
  clientEmail.value = '';
  if (!props.doc?.client_id) return;
  clientLoading.value = true;
  try {
    const client = await getClient(props.doc.client_id);
    if (seq !== loadSeq) return;
    clientEmail.value = (client.email ?? '').trim();
    if (!form.to) form.to = clientEmail.value;
  } catch {
    // Клиент мог быть удалён — адрес тогда вводится вручную (поле станет обязательным).
  } finally {
    if (seq === loadSeq) clientLoading.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    form.to = '';
    form.message = '';
    errorText.value = '';
    formRef.value?.resetValidation();
    loadClient();
  },
  { immediate: true },
);

function close() {
  emit('update:modelValue', false);
}

async function send() {
  if (!props.doc || sending.value) return;
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  sending.value = true;
  errorText.value = '';
  try {
    const fn = props.kind === 'invoice' ? sendInvoice : sendAct;
    const result = await fn(props.doc.id, { to: form.to.trim(), message: form.message.trim() });
    notify.success(`Документ отправлен на ${result.sent_to}`);
    emit('sent', result);
    close();
  } catch (err) {
    const status = err?.response?.status;
    if (status === 503) {
      notify.warning('Отправка писем не настроена администратором');
      close();
    } else if (status === 422) {
      errorText.value = errorMessage(err);
    } else {
      notify.error(err);
    }
  } finally {
    sending.value = false;
  }
}
</script>
