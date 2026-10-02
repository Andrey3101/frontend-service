<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-3 px-1" :to="{ name: 'tasks' }">К списку задач</v-btn>

    <v-card v-if="loading && !task">
      <v-skeleton-loader type="article, actions" />
    </v-card>

    <v-card v-else-if="loadError" class="text-center pa-8">
      <v-icon icon="mdi-clipboard-alert-outline" size="48" class="mb-2 text-medium-emphasis" />
      <div class="text-h6 mb-1">{{ notFound ? 'Задача не найдена' : 'Не удалось загрузить задачу' }}</div>
      <div class="text-body-2 text-medium-emphasis mb-4">{{ loadError }}</div>
      <v-btn v-if="!notFound" color="primary" variant="tonal" prepend-icon="mdi-refresh" @click="loadAll">Повторить</v-btn>
    </v-card>

    <template v-else-if="task">
      <v-row>
        <!-- Основное -->
        <v-col cols="12" lg="8">
          <v-card class="mb-4" :loading="loading">
            <v-card-item>
              <v-card-title class="text-wrap text-h6">{{ task.title }}</v-card-title>
              <v-card-subtitle>
                Создал(а) {{ task.created_by_name || '—' }} · {{ formatDateTime(task.created_at) }}
              </v-card-subtitle>
              <template #append>
                <div class="d-flex ga-1">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    aria-label="Редактировать"
                    :disabled="!canModify"
                    @click="editDialog = true"
                  />
                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    size="small"
                    color="error"
                    aria-label="Удалить"
                    :disabled="!canModify"
                    @click="deleteDialog = true"
                  />
                </div>
              </template>
            </v-card-item>

            <v-card-text>
              <div class="d-flex flex-wrap align-center ga-2 mb-4">
                <v-menu location="bottom start" :disabled="!canModify || statusSaving">
                  <template #activator="{ props: menuProps }">
                    <v-chip
                      v-bind="menuProps"
                      :color="STATUS[task.status]?.color"
                      variant="flat"
                      append-icon="mdi-menu-down"
                      :disabled="statusSaving"
                    >
                      {{ STATUS[task.status]?.title ?? task.status }}
                    </v-chip>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-for="(meta, key) in STATUS"
                      :key="key"
                      :title="meta.title"
                      :active="key === task.status"
                      @click="changeStatus(key)"
                    >
                      <template #prepend>
                        <v-icon :icon="meta.icon" :color="meta.color" size="small" />
                      </template>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-chip :color="PRIORITY[task.priority]?.color" variant="tonal" prepend-icon="mdi-flag-outline">
                  {{ PRIORITY[task.priority]?.title ?? task.priority }}
                </v-chip>
                <v-chip v-for="tag in task.tags" :key="tag" size="small" variant="outlined">#{{ tag }}</v-chip>
              </div>

              <div class="text-subtitle-2 mb-1">Описание</div>
              <div v-if="task.description" class="text-body-1 description">{{ task.description }}</div>
              <div v-else class="text-body-2 text-medium-emphasis">Описание не заполнено</div>
            </v-card-text>
          </v-card>

          <!-- Комментарии -->
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-comment-text-multiple-outline" class="mr-2" />
              Комментарии
              <v-chip size="small" variant="tonal" class="ml-2">{{ commentsTotal }}</v-chip>
            </v-card-title>
            <v-card-text>
              <div v-if="commentsLoading && !comments.length" class="text-center py-4">
                <v-progress-circular indeterminate color="primary" />
              </div>
              <div v-else-if="!comments.length" class="text-body-2 text-medium-emphasis mb-4">
                Комментариев пока нет
              </div>

              <div v-for="comment in comments" :key="comment.id" class="comment mb-4">
                <div class="d-flex align-center">
                  <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                    {{ initials(comment.author_name) }}
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">{{ comment.author_name || '—' }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDateTime(comment.created_at) }}
                      <template v-if="comment.updated_at && comment.updated_at !== comment.created_at">
                        · изменён {{ formatDateTime(comment.updated_at) }}
                      </template>
                    </div>
                  </div>
                  <template v-if="canEditComment(comment) && editingCommentId !== comment.id">
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="x-small"
                      aria-label="Изменить комментарий"
                      @click="editingCommentId = comment.id"
                    />
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      size="x-small"
                      color="error"
                      aria-label="Удалить комментарий"
                      @click="askDeleteComment(comment)"
                    />
                  </template>
                </div>
                <div class="pl-10 mt-1">
                  <CommentForm
                    v-if="editingCommentId === comment.id"
                    :task-id="task.id"
                    :comment="comment"
                    @saved="onCommentUpdated"
                    @cancel="editingCommentId = null"
                  />
                  <div v-else class="text-body-2 description">{{ comment.text }}</div>
                </div>
              </div>

              <div v-if="comments.length < commentsTotal" class="text-center mb-4">
                <v-btn variant="tonal" size="small" :loading="commentsLoading" @click="loadMoreComments">
                  Показать ещё ({{ commentsTotal - comments.length }})
                </v-btn>
              </div>

              <v-divider class="mb-4" />
              <CommentForm :task-id="task.id" @saved="onCommentCreated" />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Сведения и время -->
        <v-col cols="12" lg="4">
          <v-card class="mb-4">
            <v-card-title>Сведения</v-card-title>
            <v-list density="compact" class="py-0">
              <v-list-item prepend-icon="mdi-account-outline" title="Исполнитель" :subtitle="task.assignee_name || 'Не назначен'" />
              <v-list-item prepend-icon="mdi-calendar-clock" title="Срок">
                <v-list-item-subtitle :class="{ 'text-error': isOverdue }">
                  {{ task.due_date ? formatDateTime(task.due_date) : 'Не указан' }}
                  <template v-if="isOverdue"> · просрочена</template>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item
                v-if="task.completed_at"
                prepend-icon="mdi-check-circle-outline"
                title="Выполнена"
                :subtitle="formatDateTime(task.completed_at)"
              />
              <v-list-item prepend-icon="mdi-account-edit-outline" title="Автор" :subtitle="task.created_by_name || '—'" />
              <v-list-item prepend-icon="mdi-update" title="Обновлена" :subtitle="formatDateTime(task.updated_at)" />
            </v-list>
          </v-card>

          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-timer-outline" class="mr-2" />
              Учёт времени
            </v-card-title>
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Всего по задаче (все исполнители)</div>
              <div class="text-h5 font-weight-bold mb-3">{{ formatMinutes(liveTotalMinutes) }}</div>

              <v-alert v-if="activeHere" type="success" variant="tonal" density="compact" class="mb-3">
                Таймер идёт с {{ formatDateTime(activeHere.started_at) }} —
                <strong>{{ elapsed(activeHere.started_at) }}</strong>
              </v-alert>
              <v-alert v-else-if="activeOther" type="info" variant="tonal" density="compact" class="mb-3">
                Сейчас идёт таймер по задаче «{{ activeOther.task_title }}». Запуск здесь остановит его.
              </v-alert>

              <v-btn
                v-if="activeHere"
                block
                color="error"
                variant="flat"
                prepend-icon="mdi-stop"
                :loading="timerBusy"
                @click="stopTimer"
              >
                Остановить таймер
              </v-btn>
              <v-btn
                v-else
                block
                color="success"
                variant="flat"
                prepend-icon="mdi-play"
                :loading="timerBusy"
                @click="startTimer"
              >
                Запустить таймер
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Редактирование -->
    <v-dialog v-model="editDialog" max-width="720" persistent scrollable>
      <TaskForm v-if="editDialog && task" :task="task" @saved="onTaskSaved" @cancel="editDialog = false" />
    </v-dialog>

    <!-- Удаление задачи -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title>Удалить задачу?</v-card-title>
        <v-card-text>
          «{{ task?.title }}» будет удалена вместе с комментариями и учётом времени. Действие необратимо.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="removeTask">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Удаление комментария -->
    <v-dialog v-model="commentDeleteDialog" max-width="420">
      <v-card>
        <v-card-title>Удалить комментарий?</v-card-title>
        <v-card-text class="description">{{ commentToDelete?.text }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="commentDeleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="removeComment">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
/** Карточка задачи /tasks/:id: просмотр, редактирование, комментарии, таймер, удаление. */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  deleteTask,
  deleteTaskComment,
  getActiveTimeEntries,
  getTask,
  listTaskComments,
  startTimeTracking,
  stopTimeTracking,
  updateTask,
  errorMessage,
} from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDateTime, formatMinutes } from '@/utils/format.js';
import TaskForm from '@/components/TaskForm.vue';
import CommentForm from '@/components/CommentForm.vue';

const props = defineProps({
  id: { type: String, required: true },
});

const router = useRouter();
const auth = useAuthStore();
const notify = useNotifyStore();

const STATUS = {
  todo: { title: 'К выполнению', color: 'grey', icon: 'mdi-checkbox-blank-circle-outline' },
  in_progress: { title: 'В работе', color: 'primary', icon: 'mdi-progress-clock' },
  done: { title: 'Выполнена', color: 'success', icon: 'mdi-check-circle' },
  cancelled: { title: 'Отменена', color: 'error', icon: 'mdi-close-circle-outline' },
};
const PRIORITY = {
  low: { title: 'Низкий', color: 'grey' },
  medium: { title: 'Средний', color: 'info' },
  high: { title: 'Высокий', color: 'warning' },
  urgent: { title: 'Срочный', color: 'error' },
};

// ------------------------------------------------------------------ задача
const task = ref(null);
const loading = ref(false);
const loadError = ref('');
const notFound = ref(false);
/** Момент получения task.total_minutes (для «живого» счётчика при активном таймере). */
const loadedAt = ref(Date.now());

const canModify = computed(() => {
  const t = task.value;
  const me = auth.user?.id;
  if (!t || !me) return false;
  return auth.isAdmin || t.created_by === me || t.assignee_id === me;
});

const isOverdue = computed(() => {
  const t = task.value;
  if (!t?.due_date || !['todo', 'in_progress'].includes(t.status)) return false;
  return new Date(t.due_date).getTime() < now.value;
});

async function loadTask() {
  const data = await getTask(props.id);
  task.value = data;
  loadedAt.value = Date.now();
}

async function loadAll() {
  loading.value = true;
  loadError.value = '';
  notFound.value = false;
  comments.value = [];
  commentsTotal.value = 0;
  commentsPage.value = 1;
  editingCommentId.value = null;
  try {
    await Promise.all([loadTask(), loadActive()]);
  } catch (err) {
    task.value = null;
    notFound.value = err?.response?.status === 404;
    loadError.value = errorMessage(err);
    return;
  } finally {
    loading.value = false;
  }
  loadComments();
}

// ------------------------------------------------------------------ статус
const statusSaving = ref(false);

async function changeStatus(status) {
  if (!task.value || status === task.value.status) return;
  statusSaving.value = true;
  try {
    task.value = await updateTask(task.value.id, { status });
    loadedAt.value = Date.now();
    notify.success(`Статус: ${STATUS[status].title}`);
  } catch (err) {
    notify.error(err);
  } finally {
    statusSaving.value = false;
  }
}

// ------------------------------------------------------------------ редактирование / удаление
const editDialog = ref(false);
const deleteDialog = ref(false);
const deleting = ref(false);

function onTaskSaved(saved) {
  editDialog.value = false;
  if (saved) {
    task.value = saved;
    loadedAt.value = Date.now();
  }
}

async function removeTask() {
  deleting.value = true;
  try {
    await deleteTask(task.value.id);
    notify.success('Задача удалена');
    deleteDialog.value = false;
    router.push({ name: 'tasks' });
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

// ------------------------------------------------------------------ комментарии
const COMMENTS_LIMIT = 50;
const comments = ref([]);
const commentsTotal = ref(0);
const commentsPage = ref(1);
const commentsLoading = ref(false);
const editingCommentId = ref(null);
const commentDeleteDialog = ref(false);
const commentToDelete = ref(null);

async function loadComments(append = false) {
  commentsLoading.value = true;
  try {
    const data = await listTaskComments(props.id, { page: commentsPage.value, limit: COMMENTS_LIMIT });
    const known = new Set(append ? comments.value.map((c) => c.id) : []);
    comments.value = append ? comments.value.concat(data.items.filter((c) => !known.has(c.id))) : data.items;
    commentsTotal.value = data.total;
  } catch (err) {
    notify.error(err);
  } finally {
    commentsLoading.value = false;
  }
}

function loadMoreComments() {
  commentsPage.value += 1;
  loadComments(true);
}

function canEditComment(comment) {
  return auth.isAdmin || comment.author_id === auth.user?.id;
}

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function onCommentCreated(comment) {
  comments.value.push(comment);
  commentsTotal.value += 1;
  if (task.value) task.value.comments_count = (task.value.comments_count ?? 0) + 1;
}

function onCommentUpdated(comment) {
  const i = comments.value.findIndex((c) => c.id === comment.id);
  if (i >= 0) comments.value[i] = comment;
  editingCommentId.value = null;
  notify.success('Комментарий изменён');
}

function askDeleteComment(comment) {
  commentToDelete.value = comment;
  commentDeleteDialog.value = true;
}

async function removeComment() {
  const c = commentToDelete.value;
  if (!c) return;
  deleting.value = true;
  try {
    await deleteTaskComment(props.id, c.id);
    comments.value = comments.value.filter((x) => x.id !== c.id);
    commentsTotal.value = Math.max(0, commentsTotal.value - 1);
    if (task.value) task.value.comments_count = Math.max(0, (task.value.comments_count ?? 1) - 1);
    commentDeleteDialog.value = false;
    notify.success('Комментарий удалён');
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

// ------------------------------------------------------------------ таймер
const activeEntries = ref([]);
const timerBusy = ref(false);
const now = ref(Date.now());
let tickTimer = null;

const activeHere = computed(() => activeEntries.value.find((e) => e.task_id === props.id) ?? null);
const activeOther = computed(() => activeEntries.value.find((e) => e.task_id !== props.id) ?? null);

/** total_minutes с сервера уже включает активный таймер на момент загрузки — добавляем прошедшее с тех пор. */
const liveTotalMinutes = computed(() => {
  const base = task.value?.total_minutes ?? 0;
  if (!activeHere.value) return base;
  return base + Math.max(0, Math.floor((now.value - loadedAt.value) / 60000));
});

function elapsed(startedAt) {
  const sec = Math.max(0, Math.floor((now.value - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

async function loadActive() {
  try {
    activeEntries.value = (await getActiveTimeEntries()).items;
  } catch (err) {
    activeEntries.value = [];
    notify.error(err);
  }
}

async function startTimer() {
  timerBusy.value = true;
  try {
    await startTimeTracking(props.id);
    notify.success('Таймер запущен');
    await Promise.all([loadActive(), loadTask()]);
  } catch (err) {
    notify.error(err);
  } finally {
    timerBusy.value = false;
  }
}

async function stopTimer() {
  timerBusy.value = true;
  try {
    const entry = await stopTimeTracking({ task_id: props.id });
    notify.success(`Таймер остановлен: ${formatMinutes(entry.duration_minutes)}`);
    await Promise.all([loadActive(), loadTask()]);
  } catch (err) {
    notify.error(err);
    await loadActive();
  } finally {
    timerBusy.value = false;
  }
}

// ------------------------------------------------------------------ жизненный цикл
watch(() => props.id, loadAll);

onMounted(() => {
  loadAll();
  tickTimer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(tickTimer);
});
</script>

<style scoped>
.description {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
