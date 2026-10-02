<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      {{ title }}
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" size="small" aria-label="Закрыть" :disabled="saving" @click="emit('cancel')" />
    </v-card-title>

    <v-card-text>
      <v-form ref="formRef" @submit.prevent="save">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="form.title"
              label="Название *"
              :rules="[rules.required, rules.max(255)]"
              counter="255"
              autofocus
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.description"
              label="Описание"
              rows="3"
              auto-grow
              :rules="[rules.max(10000)]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select v-model="form.status" :items="STATUS_ITEMS" label="Статус" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select v-model="form.priority" :items="PRIORITY_ITEMS" label="Приоритет" />
          </v-col>

          <v-col v-if="!recurringMode" cols="12" sm="6">
            <v-text-field
              v-model="form.due"
              type="datetime-local"
              label="Срок"
              clearable
              :rules="[rules.datetime]"
            />
          </v-col>
          <v-col cols="12" :sm="recurringMode ? 12 : 6">
            <v-autocomplete
              v-if="auth.isAdmin"
              v-model="form.assigneeId"
              :items="assigneeItems"
              :loading="usersLoading"
              label="Исполнитель"
              clearable
              no-data-text="Пользователи не найдены"
            />
            <v-select
              v-else
              v-model="form.assigneeId"
              :items="assigneeItems"
              label="Исполнитель"
            />
          </v-col>

          <v-col cols="12">
            <v-combobox
              v-model="form.tags"
              label="Теги"
              multiple
              chips
              closable-chips
              hint="Введите тег и нажмите Enter (до 20 тегов, до 50 символов)"
              persistent-hint
              :rules="[rules.tags]"
            />
          </v-col>

          <!-- Повторяющаяся серия — только при создании -->
          <v-col v-if="!isEdit" cols="12">
            <v-switch
              v-model="recurringMode"
              color="primary"
              label="Повторяющаяся задача (серия)"
              hide-details
              inset
            />
          </v-col>
          <template v-if="recurringMode && !isEdit">
            <v-col cols="12" sm="4">
              <v-select v-model="form.recurrence" :items="RECURRENCE_ITEMS" label="Повтор" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.count"
                type="number"
                min="1"
                max="52"
                label="Количество задач *"
                :rules="[rules.count]"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.startDate"
                type="date"
                label="Срок первой задачи *"
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-medium-emphasis">
                Будет создано задач: {{ form.count || 0 }}; сроки — {{ recurrenceHint }}, начиная с
                {{ formatDate(form.startDate) }}.
              </div>
            </v-col>
          </template>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" :disabled="saving" @click="emit('cancel')">Отмена</v-btn>
      <v-btn color="primary" variant="flat" :loading="saving" @click="save">
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
/**
 * Форма задачи (создание / редактирование / серия повторяющихся задач).
 * props:
 *   task      — Task для редактирования (без него — создание);
 *   users     — список пользователей компании (необязательно; для owner/admin
 *               при отсутствии загружается через listUsers);
 *   recurring — открыть сразу в режиме «серия» (только создание).
 * emits:
 *   saved(task, items?) — сохранённая задача; для серии — первая задача и весь список;
 *   cancel.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { createRecurringTasks, createTask, listUsers, updateTask } from '@/api';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDate } from '@/utils/format.js';

const props = defineProps({
  task: { type: Object, default: null },
  users: { type: Array, default: null },
  recurring: { type: Boolean, default: false },
});
const emit = defineEmits(['saved', 'cancel']);

const auth = useAuthStore();
const notify = useNotifyStore();

const STATUS_ITEMS = [
  { title: 'К выполнению', value: 'todo' },
  { title: 'В работе', value: 'in_progress' },
  { title: 'Выполнена', value: 'done' },
  { title: 'Отменена', value: 'cancelled' },
];
const PRIORITY_ITEMS = [
  { title: 'Низкий', value: 'low' },
  { title: 'Средний', value: 'medium' },
  { title: 'Высокий', value: 'high' },
  { title: 'Срочный', value: 'urgent' },
];
const RECURRENCE_ITEMS = [
  { title: 'Ежедневно', value: 'daily' },
  { title: 'Еженедельно', value: 'weekly' },
  { title: 'Ежемесячно', value: 'monthly' },
];
const LOCAL_DATETIME = 'YYYY-MM-DDTHH:mm';

const isEdit = computed(() => Boolean(props.task?.id));
const recurringMode = ref(false);
const title = computed(() => {
  if (isEdit.value) return 'Редактирование задачи';
  return recurringMode.value ? 'Новая серия задач' : 'Новая задача';
});
const recurrenceHint = computed(
  () => ({ daily: 'каждый день', weekly: 'каждую неделю', monthly: 'каждый месяц' })[form.recurrence] ?? '',
);

// ------------------------------------------------------------------ форма
const formRef = ref(null);
const saving = ref(false);

function emptyForm() {
  return {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due: '',
    assigneeId: null,
    tags: [],
    recurrence: 'weekly',
    count: 4,
    startDate: dayjs().format('YYYY-MM-DD'),
  };
}
const form = reactive(emptyForm());

function fillForm() {
  Object.assign(form, emptyForm());
  recurringMode.value = !isEdit.value && props.recurring;
  const t = props.task;
  if (!t) return;
  Object.assign(form, {
    title: t.title ?? '',
    description: t.description ?? '',
    status: t.status ?? 'todo',
    priority: t.priority ?? 'medium',
    due: t.due_date ? dayjs(t.due_date).format(LOCAL_DATETIME) : '',
    assigneeId: t.assignee_id ?? null,
    tags: [...(t.tags ?? [])],
  });
  formRef.value?.resetValidation();
}

watch(() => [props.task, props.recurring], fillForm, { immediate: true });

const rules = {
  required: (v) => (v !== null && v !== undefined && String(v).trim() !== '') || 'Обязательное поле',
  max: (n) => (v) => !v || String(v).length <= n || `Не более ${n} символов`,
  datetime: (v) => !v || dayjs(v).isValid() || 'Некорректная дата',
  count: (v) => (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 52) || 'От 1 до 52',
  tags: (v) => {
    const list = (v ?? []).map((s) => String(s).trim()).filter(Boolean);
    if (list.length > 20) return 'Не более 20 тегов';
    if (list.some((s) => s.length > 50)) return 'Тег — не длиннее 50 символов';
    return true;
  },
};

// ------------------------------------------------------------------ исполнители
const loadedUsers = ref([]);
const usersLoading = ref(false);
const companyUsers = computed(() => props.users ?? loadedUsers.value);

async function loadUsers() {
  if (!auth.isAdmin || props.users) return;
  usersLoading.value = true;
  try {
    loadedUsers.value = (await listUsers({ limit: 100 })).items;
  } catch (err) {
    notify.error(err);
  } finally {
    usersLoading.value = false;
  }
}

/** Имена исполнителей: id → имя (для assignee_name). */
const assigneeItems = computed(() => {
  const me = auth.user;
  const items = [];
  if (auth.isAdmin) {
    for (const u of companyUsers.value) {
      if (!u.is_active && u.id !== props.task?.assignee_id) continue;
      items.push({ title: u.id === me?.id ? `${u.full_name} (я)` : u.full_name, value: u.id, name: u.full_name });
    }
  } else {
    items.push({ title: 'Без исполнителя', value: null, name: null });
    if (me) items.push({ title: `${me.full_name} (я)`, value: me.id, name: me.full_name });
  }
  // Текущий исполнитель задачи, если его нет в списке (например, назначен коллегой).
  const t = props.task;
  if (t?.assignee_id && !items.some((i) => i.value === t.assignee_id)) {
    items.push({ title: t.assignee_name || 'Другой пользователь', value: t.assignee_id, name: t.assignee_name });
  }
  return items;
});

function assigneeName(id) {
  if (!id) return null;
  return assigneeItems.value.find((i) => i.value === id)?.name ?? null;
}

// ------------------------------------------------------------------ сохранение
function cleanTags() {
  return [...new Set((form.tags ?? []).map((s) => String(s).trim()).filter(Boolean))];
}

function basePayload() {
  return {
    title: form.title.trim(),
    description: form.description?.trim() ?? '',
    status: form.status,
    priority: form.priority,
    assignee_id: form.assigneeId || null,
    assignee_name: assigneeName(form.assigneeId),
    tags: cleanTags(),
  };
}

function dueIso() {
  return form.due ? new Date(form.due).toISOString() : null;
}

/** Для PUT — только изменённые поля (частичное обновление). */
function changedFields() {
  const t = props.task;
  const next = { ...basePayload(), due_date: dueIso() };
  const out = {};
  if (next.title !== t.title) out.title = next.title;
  if (next.description !== (t.description ?? '')) out.description = next.description;
  if (next.status !== t.status) out.status = next.status;
  if (next.priority !== t.priority) out.priority = next.priority;
  const prevDue = t.due_date ? dayjs(t.due_date).format(LOCAL_DATETIME) : '';
  if ((form.due || '') !== prevDue) out.due_date = next.due_date;
  if ((next.assignee_id ?? null) !== (t.assignee_id ?? null)) {
    out.assignee_id = next.assignee_id;
    out.assignee_name = next.assignee_name;
  }
  if (JSON.stringify(next.tags) !== JSON.stringify(t.tags ?? [])) out.tags = next.tags;
  return out;
}

async function save() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    if (isEdit.value) {
      const changes = changedFields();
      if (!Object.keys(changes).length) {
        emit('saved', props.task);
        return;
      }
      const task = await updateTask(props.task.id, changes);
      notify.success('Задача сохранена');
      emit('saved', task);
    } else if (recurringMode.value) {
      const { items } = await createRecurringTasks({
        ...basePayload(),
        recurrence: form.recurrence,
        count: Number(form.count),
        start_date: form.startDate,
      });
      notify.success(`Создано задач: ${items.length}`);
      emit('saved', items[0] ?? null, items);
    } else {
      const task = await createTask({ ...basePayload(), due_date: dueIso() });
      notify.success('Задача создана');
      emit('saved', task);
    }
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

onMounted(loadUsers);
</script>
