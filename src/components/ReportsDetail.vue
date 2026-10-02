<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/reports">К отчётам</v-btn>
      <v-spacer />
      <template v-if="report && !editing">
        <v-btn variant="tonal" prepend-icon="mdi-pencil" @click="startEdit">Редактировать</v-btn>
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-file-pdf-box" :loading="pdfLoading" @click="downloadPdf">
          Скачать PDF
        </v-btn>
        <v-btn color="error" variant="text" prepend-icon="mdi-delete-outline" @click="deleteDialog = true">Удалить</v-btn>
      </template>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" @click="load">Повторить</v-btn>
      </template>
    </v-alert>

    <template v-if="report">
      <!-- Просмотр -->
      <v-card v-if="!editing">
        <v-card-title class="text-wrap">{{ report.title }}</v-card-title>
        <v-card-subtitle class="d-flex flex-wrap align-center ga-2 pb-2">
          <v-chip size="small" variant="tonal" color="primary">{{ typeTitle(report.type) }}</v-chip>
          <span>Период: {{ formatDate(report.period_from) }} — {{ formatDate(report.period_to) }}</span>
          <span>· создан {{ formatDateTime(report.created_at) }}</span>
          <span v-if="report.updated_at !== report.created_at">· изменён {{ formatDateTime(report.updated_at) }}</span>
        </v-card-subtitle>
        <v-divider />
        <v-card-text>
          <div v-if="report.content" class="markdown-body" v-html="renderMarkdown(report.content)" />
          <div v-else class="text-medium-emphasis">Отчёт пуст</div>
        </v-card-text>
      </v-card>

      <!-- Редактирование -->
      <v-card v-else>
        <v-card-title>Редактирование отчёта</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-text-field v-model="edit.title" label="Название *" :rules="[rules.required, rules.max255]" class="mb-2" />
            <v-tabs v-if="!mdAndUp" v-model="editTab" density="compact" class="mb-2">
              <v-tab value="source">Markdown</v-tab>
              <v-tab value="preview">Предпросмотр</v-tab>
            </v-tabs>
            <v-row>
              <v-col v-if="mdAndUp || editTab === 'source'" cols="12" md="6">
                <v-textarea
                  v-model="edit.content"
                  label="Текст (markdown)"
                  rows="20"
                  auto-grow
                  class="md-source"
                  hint="# заголовок, **жирный**, - список, | таблица |"
                  persistent-hint
                />
              </v-col>
              <v-col v-if="mdAndUp || editTab === 'preview'" cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">Предпросмотр</div>
                <v-sheet border rounded class="pa-4 preview">
                  <div v-if="edit.content" class="markdown-body" v-html="renderMarkdown(edit.content)" />
                  <div v-else class="text-medium-emphasis">Пусто</div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="cancelEdit">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!dirty" :loading="saving" @click="save">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </template>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Удалить отчёт?</v-card-title>
        <v-card-text v-if="report">«{{ report.title }}» будет удалён без возможности восстановления.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { deleteReport, downloadReportPdf, errorMessage, getReport, updateReport } from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDate, formatDateTime } from '@/utils/format.js';
import { renderMarkdown } from '@/utils/markdown.js';

const props = defineProps({
  id: { type: String, required: true },
});

const router = useRouter();
const notify = useNotifyStore();
const { mdAndUp } = useDisplay();

const TYPE_TITLES = {
  tasks: 'Задачи',
  finance: 'Финансы',
  time: 'Учёт времени',
  clients: 'Клиенты',
  inventory: 'Склад',
};
function typeTitle(type) {
  return TYPE_TITLES[type] ?? type;
}

const report = ref(null);
const loading = ref(false);
const loadError = ref('');

let requestSeq = 0;
async function load() {
  const seq = ++requestSeq;
  loading.value = true;
  loadError.value = '';
  try {
    const data = await getReport(props.id);
    if (seq !== requestSeq) return;
    report.value = data;
  } catch (err) {
    if (seq !== requestSeq) return;
    report.value = null;
    loadError.value = errorMessage(err);
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

// ------------------------------------------------------------------ редактирование
const editing = ref(false);
const editTab = ref('source');
const saving = ref(false);
const formRef = ref(null);
const edit = reactive({ title: '', content: '' });

const rules = {
  required: (v) => Boolean(v && String(v).trim()) || 'Обязательное поле',
  max255: (v) => !v || String(v).trim().length <= 255 || 'Не более 255 символов',
};

const dirty = computed(
  () =>
    Boolean(report.value) &&
    (edit.title.trim() !== report.value.title || edit.content !== (report.value.content ?? '')),
);

function startEdit() {
  edit.title = report.value.title;
  edit.content = report.value.content ?? '';
  editTab.value = 'source';
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
}

async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const payload = {};
    if (edit.title.trim() !== report.value.title) payload.title = edit.title.trim();
    if (edit.content !== (report.value.content ?? '')) payload.content = edit.content;
    report.value = await updateReport(report.value.id, payload);
    editing.value = false;
    notify.success('Отчёт сохранён');
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

// ------------------------------------------------------------------ PDF, удаление
const pdfLoading = ref(false);
async function downloadPdf() {
  pdfLoading.value = true;
  try {
    const name = String(report.value.title || 'Отчёт').replace(/[\\/:*?"<>|\r\n]+/g, '_').slice(0, 120);
    await downloadReportPdf(report.value.id, `${name}.pdf`);
  } catch (err) {
    notify.error(err);
  } finally {
    pdfLoading.value = false;
  }
}

const deleteDialog = ref(false);
const deleting = ref(false);
async function confirmDelete() {
  deleting.value = true;
  try {
    await deleteReport(report.value.id);
    deleteDialog.value = false;
    notify.success('Отчёт удалён');
    router.replace('/reports');
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

watch(
  () => props.id,
  () => {
    editing.value = false;
    load();
  },
  { immediate: true },
);
</script>

<style scoped>
.md-source :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
}
.preview {
  min-height: 300px;
  max-height: 70vh;
  overflow: auto;
}
</style>
