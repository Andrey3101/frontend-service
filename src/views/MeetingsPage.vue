<template>
  <div>
    <v-row>
      <!-- Встречи -->
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex flex-wrap align-center ga-2">
            <v-icon icon="mdi-calendar-clock" class="mr-1" />
            Встречи
            <v-chip size="small" variant="tonal">{{ meetings.length }}</v-chip>
            <v-spacer />
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateMeeting()">Новая встреча</v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Период -->
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-btn
                v-for="preset in PRESETS"
                :key="preset.key"
                size="small"
                color="primary"
                :variant="activePreset === preset.key ? 'flat' : 'outlined'"
                @click="applyPreset(preset.key)"
              >
                {{ preset.title }}
              </v-btn>
            </div>
            <v-row dense class="mb-2">
              <v-col cols="6" sm="4">
                <v-text-field
                  v-model="period.from"
                  type="date"
                  label="С"
                  hide-details
                  density="compact"
                  @update:model-value="activePreset = ''"
                />
              </v-col>
              <v-col cols="6" sm="4">
                <v-text-field
                  v-model="period.to"
                  type="date"
                  label="По"
                  hide-details
                  density="compact"
                  @update:model-value="activePreset = ''"
                />
              </v-col>
              <v-col cols="12" sm="4" class="d-flex align-center ga-1">
                <v-btn icon="mdi-chevron-left" variant="text" size="small" aria-label="Предыдущий период" @click="shiftPeriod(-1)" />
                <v-btn icon="mdi-chevron-right" variant="text" size="small" aria-label="Следующий период" @click="shiftPeriod(1)" />
                <v-btn variant="text" size="small" prepend-icon="mdi-refresh" :loading="meetingsLoading" @click="loadMeetings">
                  Обновить
                </v-btn>
              </v-col>
            </v-row>

            <v-progress-linear v-if="meetingsLoading" indeterminate color="primary" class="mb-2" />
            <v-alert v-if="meetingsTruncated" type="info" variant="tonal" density="compact" class="mb-3">
              Показаны первые {{ meetings.length }} встреч периода — сузьте период, чтобы увидеть остальные.
            </v-alert>

            <div v-if="!meetingsLoading && !meetings.length" class="text-center text-medium-emphasis py-8">
              <v-icon icon="mdi-calendar-blank-outline" size="40" class="mb-2" />
              <div>За выбранный период встреч нет</div>
            </div>

            <!-- Список по дням -->
            <div v-for="day in meetingsByDay" :key="day.date" class="mb-4">
              <div class="d-flex align-center mb-1">
                <span class="text-subtitle-2 text-capitalize" :class="{ 'text-primary': day.isToday }">
                  {{ day.label }}
                </span>
                <v-chip v-if="day.isToday" size="x-small" color="primary" variant="flat" class="ml-2">сегодня</v-chip>
                <v-btn
                  icon="mdi-plus"
                  size="x-small"
                  variant="text"
                  class="ml-1"
                  aria-label="Добавить встречу на этот день"
                  @click="openCreateMeeting(day.date)"
                />
              </div>
              <v-card
                v-for="m in day.items"
                :key="m.id"
                variant="outlined"
                class="mb-2"
                :class="{ 'meeting-past': isPast(m) }"
              >
                <v-card-text class="py-3">
                  <div class="d-flex align-start ga-3">
                    <div class="time-col text-body-2 font-weight-medium">
                      {{ formatTime(m.start_at) }}<br />
                      <span class="text-medium-emphasis">{{ formatTime(m.end_at) }}</span>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                      <div class="text-body-1 font-weight-medium">{{ m.title }}</div>
                      <div v-if="!sameDay(m.start_at, m.end_at)" class="text-caption text-medium-emphasis">
                        до {{ formatDateTime(m.end_at) }}
                      </div>
                      <div v-if="m.location" class="text-body-2 text-medium-emphasis">
                        <v-icon icon="mdi-map-marker-outline" size="small" /> {{ m.location }}
                      </div>
                      <div v-if="m.client_id" class="text-body-2 text-medium-emphasis">
                        <v-icon icon="mdi-briefcase-account-outline" size="small" /> {{ clientName(m.client_id) }}
                      </div>
                      <div v-if="m.description" class="text-body-2 mt-1 pre-wrap">{{ m.description }}</div>
                      <div v-if="m.participants?.length" class="d-flex flex-wrap ga-1 mt-2">
                        <v-chip v-for="p in m.participants" :key="p" size="x-small" prepend-icon="mdi-account-outline">
                          {{ p }}
                        </v-chip>
                      </div>
                    </div>
                    <div class="d-flex text-no-wrap">
                      <v-btn icon="mdi-pencil" size="small" variant="text" aria-label="Изменить" @click="openEditMeeting(m)" />
                      <v-btn
                        icon="mdi-delete-outline"
                        size="small"
                        variant="text"
                        color="error"
                        aria-label="Удалить"
                        @click="askDelete('meeting', m)"
                      />
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Важные даты -->
      <v-col cols="12" lg="4">
        <v-card>
          <v-card-title class="d-flex flex-wrap align-center ga-2">
            <v-icon icon="mdi-calendar-star" class="mr-1" />
            Важные даты
            <v-spacer />
            <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="openCreateDate">
              Добавить
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-btn-toggle v-model="datesScope" mandatory density="compact" variant="outlined" color="primary" divided class="mb-3">
              <v-btn value="upcoming" size="small">Предстоящие</v-btn>
              <v-btn value="all" size="small">Все</v-btn>
            </v-btn-toggle>

            <v-progress-linear v-if="datesLoading" indeterminate color="primary" class="mb-2" />
            <div v-if="!datesLoading && !dates.length" class="text-body-2 text-medium-emphasis py-4 text-center">
              {{ datesScope === 'upcoming' ? 'Предстоящих дат нет' : 'Важных дат нет' }}
            </div>

            <v-list v-else density="compact" class="py-0">
              <v-list-item v-for="d in dates" :key="d.id" class="px-0" :class="{ 'meeting-past': d.date < today }">
                <template #prepend>
                  <v-avatar :color="DATE_TYPES[d.type]?.color ?? 'grey'" variant="tonal" size="36" class="mr-3">
                    <v-icon :icon="DATE_TYPES[d.type]?.icon ?? 'mdi-calendar'" size="small" />
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">{{ d.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ formatDate(d.date) }} · {{ DATE_TYPES[d.type]?.title ?? d.type }}
                  <template v-if="daysLeft(d.date) >= 0"> · {{ daysLeftText(d.date) }}</template>
                </v-list-item-subtitle>
                <v-list-item-subtitle v-if="d.remind_days_before" class="text-caption">
                  <v-icon icon="mdi-bell-outline" size="x-small" /> за {{ d.remind_days_before }} дн.
                </v-list-item-subtitle>
                <template #append>
                  <v-btn icon="mdi-pencil" size="x-small" variant="text" aria-label="Изменить" @click="openEditDate(d)" />
                  <v-btn
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    color="error"
                    aria-label="Удалить"
                    @click="askDelete('date', d)"
                  />
                </template>
              </v-list-item>
            </v-list>

            <div v-if="datesTotal > dates.length" class="text-center mt-2">
              <v-btn size="small" variant="tonal" :loading="datesLoading" @click="loadMoreDates">
                Показать ещё ({{ datesTotal - dates.length }})
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалог встречи -->
    <v-dialog v-model="meetingDialog" max-width="640" persistent scrollable>
      <v-card>
        <v-card-title>{{ meetingForm.id ? 'Изменить встречу' : 'Новая встреча' }}</v-card-title>
        <v-card-text>
          <v-form ref="meetingFormRef" @submit.prevent="saveMeeting">
            <v-row dense>
              <v-col cols="12">
                <v-text-field v-model="meetingForm.title" label="Название *" counter="255" :rules="[rules.required, rules.max(255)]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="meetingForm.start"
                  type="datetime-local"
                  label="Начало *"
                  :rules="[rules.required]"
                  @update:model-value="onStartChange"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="meetingForm.end"
                  type="datetime-local"
                  label="Окончание *"
                  :rules="[rules.required, rules.endAfterStart]"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="meetingForm.location" label="Место / ссылка" prepend-inner-icon="mdi-map-marker-outline" :rules="[rules.max(255)]" />
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  v-model="meetingForm.clientId"
                  v-model:search="clientSearch"
                  :items="clientItems"
                  :loading="clientsLoading"
                  label="Клиент"
                  prepend-inner-icon="mdi-briefcase-account-outline"
                  clearable
                  no-filter
                  no-data-text="Клиенты не найдены"
                />
              </v-col>
              <v-col cols="12">
                <v-combobox
                  v-model="meetingForm.participants"
                  label="Участники"
                  multiple
                  chips
                  closable-chips
                  hint="Имя или email, Enter — добавить"
                  persistent-hint
                  :rules="[rules.participants]"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="meetingForm.description" label="Описание" rows="3" auto-grow :rules="[rules.max(10000)]" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="meetingDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveMeeting">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог важной даты -->
    <v-dialog v-model="dateDialog" max-width="520" persistent>
      <v-card>
        <v-card-title>{{ dateForm.id ? 'Изменить дату' : 'Новая важная дата' }}</v-card-title>
        <v-card-text>
          <v-form ref="dateFormRef" @submit.prevent="saveDate">
            <v-row dense>
              <v-col cols="12">
                <v-text-field v-model="dateForm.title" label="Название *" counter="255" :rules="[rules.required, rules.max(255)]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="dateForm.date" type="date" label="Дата *" :rules="[rules.required]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select v-model="dateForm.type" :items="DATE_TYPE_ITEMS" label="Тип" />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model.number="dateForm.remind"
                  type="number"
                  min="0"
                  max="365"
                  label="Напомнить за, дней"
                  hint="0 — без заблаговременного напоминания"
                  persistent-hint
                  :rules="[rules.remind]"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="dateForm.description" label="Описание" rows="2" auto-grow :rules="[rules.max(10000)]" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="dateDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveDate">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>{{ toDelete?.kind === 'meeting' ? 'Удалить встречу?' : 'Удалить важную дату?' }}</v-card-title>
        <v-card-text>«{{ toDelete?.item.title }}» будет удалена.</v-card-text>
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
/** Встречи (список по дням за период, CRUD) и важные даты (CRUD). */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import {
  createImportantDate,
  createMeeting,
  deleteImportantDate,
  deleteMeeting,
  getClient,
  listClients,
  listImportantDates,
  listMeetings,
  updateImportantDate,
  updateMeeting,
} from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { debounce } from '@/utils/debounce.js';
import { formatDate, formatDateTime } from '@/utils/format.js';

const notify = useNotifyStore();

const DATE = 'YYYY-MM-DD';
const LOCAL_DATETIME = 'YYYY-MM-DDTHH:mm';
const today = dayjs().format(DATE);

const DATE_TYPES = {
  deadline: { title: 'Дедлайн', color: 'error', icon: 'mdi-flag-checkered' },
  payment: { title: 'Платёж', color: 'warning', icon: 'mdi-cash-clock' },
  birthday: { title: 'День рождения', color: 'pink', icon: 'mdi-cake-variant-outline' },
  holiday: { title: 'Праздник', color: 'success', icon: 'mdi-party-popper' },
  other: { title: 'Другое', color: 'grey', icon: 'mdi-calendar' },
};
const DATE_TYPE_ITEMS = Object.entries(DATE_TYPES).map(([value, t]) => ({ title: t.title, value }));

const rules = {
  required: (v) => (v !== null && v !== undefined && String(v).trim() !== '') || 'Обязательное поле',
  max: (n) => (v) => !v || String(v).length <= n || `Не более ${n} символов`,
  endAfterStart: (v) => !v || !meetingForm.start || !dayjs(v).isBefore(dayjs(meetingForm.start)) || 'Окончание раньше начала',
  participants: (v) => {
    const list = (v ?? []).map((s) => String(s).trim()).filter(Boolean);
    if (list.length > 100) return 'Не более 100 участников';
    if (list.some((s) => s.length > 255)) return 'Не длиннее 255 символов';
    return true;
  },
  remind: (v) => (v === '' || v === null || (Number.isInteger(Number(v)) && v >= 0 && v <= 365)) || 'От 0 до 365',
};

// ------------------------------------------------------------------ период встреч
const PRESETS = [
  { key: 'week', title: 'Эта неделя' },
  { key: 'next7', title: '7 дней' },
  { key: 'month', title: 'Этот месяц' },
  { key: 'next30', title: '30 дней' },
];
const period = reactive({ from: '', to: '' });
const activePreset = ref('next30');

function applyPreset(key) {
  const now = dayjs();
  const ranges = {
    // Неделя с понедельника.
    week: [now.subtract((now.day() + 6) % 7, 'day'), now.subtract((now.day() + 6) % 7, 'day').add(6, 'day')],
    next7: [now, now.add(6, 'day')],
    month: [now.startOf('month'), now.endOf('month')],
    next30: [now, now.add(29, 'day')],
  };
  const [from, to] = ranges[key];
  activePreset.value = key;
  period.from = from.format(DATE);
  period.to = to.format(DATE);
}

/** Сдвинуть период на его длину назад/вперёд. */
function shiftPeriod(direction) {
  if (!period.from || !period.to) return;
  const from = dayjs(period.from);
  const to = dayjs(period.to);
  const isMonth = from.date() === 1 && to.isSame(from.endOf('month'), 'day');
  activePreset.value = '';
  if (isMonth) {
    const next = from.add(direction, 'month');
    period.from = next.startOf('month').format(DATE);
    period.to = next.endOf('month').format(DATE);
    return;
  }
  const days = to.diff(from, 'day') + 1;
  period.from = from.add(direction * days, 'day').format(DATE);
  period.to = to.add(direction * days, 'day').format(DATE);
}

// ------------------------------------------------------------------ встречи
const MEETINGS_LIMIT = 100;
const MEETINGS_MAX_PAGES = 5;
const meetings = ref([]);
const meetingsLoading = ref(false);
const meetingsTruncated = ref(false);

let meetingsSeq = 0;
async function loadMeetings() {
  if (!period.from || !period.to) return;
  if (period.from > period.to) {
    notify.warning('Дата начала периода позже даты окончания');
    return;
  }
  const seq = ++meetingsSeq;
  meetingsLoading.value = true;
  // Границы — в локальном времени пользователя (to — начало следующего дня, не включая).
  const params = {
    from: dayjs(period.from).startOf('day').toISOString(),
    to: dayjs(period.to).add(1, 'day').startOf('day').toISOString(),
    limit: MEETINGS_LIMIT,
  };
  try {
    let items = [];
    let total = 0;
    for (let page = 1; page <= MEETINGS_MAX_PAGES; page += 1) {
      const data = await listMeetings({ ...params, page });
      items = items.concat(data.items);
      total = data.total;
      if (items.length >= total || !data.items.length) break;
    }
    if (seq !== meetingsSeq) return;
    meetings.value = items;
    meetingsTruncated.value = items.length < total;
    resolveClientNames(items);
  } catch (err) {
    if (seq === meetingsSeq) notify.error(err);
  } finally {
    if (seq === meetingsSeq) meetingsLoading.value = false;
  }
}

watch(() => [period.from, period.to], loadMeetings);

const meetingsByDay = computed(() => {
  const groups = new Map();
  for (const m of meetings.value) {
    const key = dayjs(m.start_at).format(DATE);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      date,
      label: dayjs(date).format('dddd, D MMMM YYYY'),
      isToday: date === today,
      items: items.sort((a, b) => a.start_at.localeCompare(b.start_at)),
    }));
});

function formatTime(iso) {
  return iso ? dayjs(iso).format('HH:mm') : '—';
}

function sameDay(a, b) {
  return dayjs(a).isSame(dayjs(b), 'day');
}

function isPast(m) {
  return dayjs(m.end_at).isBefore(dayjs());
}

// ------------------------------------------------------------------ клиенты
/** id → имя клиента. */
const clientNames = reactive({});
const clientOptions = ref([]);
const clientSearch = ref('');
const clientsLoading = ref(false);

const clientItems = computed(() => {
  const items = clientOptions.value.map((c) => ({ title: c.name, value: c.id }));
  const selectedId = meetingForm.clientId;
  if (selectedId && !items.some((i) => i.value === selectedId)) {
    items.unshift({ title: clientNames[selectedId] ?? 'Клиент', value: selectedId });
  }
  return items;
});

function clientName(id) {
  return clientNames[id] ?? 'Клиент';
}

let clientsSeq = 0;
async function searchClients(search) {
  const seq = ++clientsSeq;
  clientsLoading.value = true;
  try {
    const { items } = await listClients({ search: search?.trim(), limit: 20 });
    if (seq !== clientsSeq) return;
    clientOptions.value = items;
    for (const c of items) clientNames[c.id] = c.name;
  } catch (err) {
    if (seq === clientsSeq) notify.error(err);
  } finally {
    if (seq === clientsSeq) clientsLoading.value = false;
  }
}
const debouncedClientSearch = debounce(searchClients, 350);

watch(clientSearch, (value) => {
  // При выборе значения v-autocomplete подставляет его название в search — не ищем повторно.
  const selectedTitle = clientItems.value.find((i) => i.value === meetingForm.clientId)?.title;
  if (meetingDialog.value && value !== selectedTitle) debouncedClientSearch(value);
});

/** Подтянуть имена клиентов, которых ещё нет в кэше (встреча хранит только client_id). */
async function resolveClientNames(items) {
  const missing = [...new Set(items.map((m) => m.client_id).filter((id) => id && !clientNames[id]))];
  await Promise.allSettled(
    missing.map(async (id) => {
      try {
        clientNames[id] = (await getClient(id)).name;
      } catch {
        clientNames[id] = 'Клиент удалён';
      }
    }),
  );
}

// ------------------------------------------------------------------ диалог встречи
const meetingDialog = ref(false);
const meetingFormRef = ref(null);
const saving = ref(false);
const meetingForm = reactive({
  id: null,
  title: '',
  start: '',
  end: '',
  location: '',
  clientId: null,
  participants: [],
  description: '',
});

function openCreateMeeting(date) {
  const base = date ? dayjs(`${date}T10:00`) : dayjs().add(1, 'hour').startOf('hour');
  Object.assign(meetingForm, {
    id: null,
    title: '',
    start: base.format(LOCAL_DATETIME),
    end: base.add(1, 'hour').format(LOCAL_DATETIME),
    location: '',
    clientId: null,
    participants: [],
    description: '',
  });
  openMeetingDialog();
}

function openEditMeeting(m) {
  Object.assign(meetingForm, {
    id: m.id,
    title: m.title,
    start: dayjs(m.start_at).format(LOCAL_DATETIME),
    end: dayjs(m.end_at).format(LOCAL_DATETIME),
    location: m.location ?? '',
    clientId: m.client_id ?? null,
    participants: [...(m.participants ?? [])],
    description: m.description ?? '',
  });
  openMeetingDialog();
}

function openMeetingDialog() {
  meetingDialog.value = true;
  meetingFormRef.value?.resetValidation();
  if (!clientOptions.value.length) searchClients('');
}

/** Сдвигать окончание вместе с началом, сохраняя длительность. */
let lastStart = '';
function onStartChange(value) {
  if (lastStart && value && meetingForm.end) {
    const duration = dayjs(meetingForm.end).diff(dayjs(lastStart), 'minute');
    if (duration >= 0) meetingForm.end = dayjs(value).add(duration, 'minute').format(LOCAL_DATETIME);
  }
  lastStart = value;
}
watch(meetingDialog, (open) => {
  if (open) lastStart = meetingForm.start;
});

async function saveMeeting() {
  const { valid } = await meetingFormRef.value.validate();
  if (!valid) return;
  saving.value = true;
  const payload = {
    title: meetingForm.title.trim(),
    description: meetingForm.description?.trim() ?? '',
    start_at: new Date(meetingForm.start).toISOString(),
    end_at: new Date(meetingForm.end).toISOString(),
    location: meetingForm.location?.trim() ?? '',
    participants: [...new Set((meetingForm.participants ?? []).map((p) => String(p).trim()).filter(Boolean))],
    client_id: meetingForm.clientId || null,
  };
  try {
    if (meetingForm.id) {
      await updateMeeting(meetingForm.id, payload);
      notify.success('Встреча сохранена');
    } else {
      await createMeeting(payload);
      notify.success('Встреча создана');
    }
    meetingDialog.value = false;
    loadMeetings();
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

// ------------------------------------------------------------------ важные даты
const DATES_LIMIT = 50;
const dates = ref([]);
const datesTotal = ref(0);
const datesPage = ref(1);
const datesLoading = ref(false);
const datesScope = ref('upcoming');

async function loadDates(append = false) {
  datesLoading.value = true;
  try {
    const data = await listImportantDates({
      from: datesScope.value === 'upcoming' ? today : undefined,
      page: datesPage.value,
      limit: DATES_LIMIT,
    });
    dates.value = append ? dates.value.concat(data.items) : data.items;
    datesTotal.value = data.total;
  } catch (err) {
    notify.error(err);
  } finally {
    datesLoading.value = false;
  }
}

function reloadDates() {
  datesPage.value = 1;
  loadDates();
}

function loadMoreDates() {
  datesPage.value += 1;
  loadDates(true);
}

watch(datesScope, reloadDates);

function daysLeft(date) {
  return dayjs(date).diff(dayjs(today), 'day');
}

function daysLeftText(date) {
  const n = daysLeft(date);
  if (n === 0) return 'сегодня';
  if (n === 1) return 'завтра';
  return `через ${n} дн.`;
}

const dateDialog = ref(false);
const dateFormRef = ref(null);
const dateForm = reactive({ id: null, title: '', date: '', type: 'other', remind: 1, description: '' });

function openCreateDate() {
  Object.assign(dateForm, { id: null, title: '', date: today, type: 'other', remind: 1, description: '' });
  dateDialog.value = true;
  dateFormRef.value?.resetValidation();
}

function openEditDate(d) {
  Object.assign(dateForm, {
    id: d.id,
    title: d.title,
    date: d.date,
    type: d.type,
    remind: d.remind_days_before ?? 0,
    description: d.description ?? '',
  });
  dateDialog.value = true;
  dateFormRef.value?.resetValidation();
}

async function saveDate() {
  const { valid } = await dateFormRef.value.validate();
  if (!valid) return;
  saving.value = true;
  const payload = {
    title: dateForm.title.trim(),
    date: dateForm.date,
    type: dateForm.type,
    remind_days_before: Number(dateForm.remind) || 0,
    description: dateForm.description?.trim() ?? '',
  };
  try {
    if (dateForm.id) {
      await updateImportantDate(dateForm.id, payload);
      notify.success('Дата сохранена');
    } else {
      await createImportantDate(payload);
      notify.success('Дата добавлена');
    }
    dateDialog.value = false;
    reloadDates();
  } catch (err) {
    notify.error(err);
  } finally {
    saving.value = false;
  }
}

// ------------------------------------------------------------------ удаление
const deleteDialog = ref(false);
const toDelete = ref(null);
const deleting = ref(false);

function askDelete(kind, item) {
  toDelete.value = { kind, item };
  deleteDialog.value = true;
}

async function confirmDelete() {
  const target = toDelete.value;
  if (!target) return;
  deleting.value = true;
  try {
    if (target.kind === 'meeting') {
      await deleteMeeting(target.item.id);
      meetings.value = meetings.value.filter((m) => m.id !== target.item.id);
      notify.success('Встреча удалена');
    } else {
      await deleteImportantDate(target.item.id);
      notify.success('Дата удалена');
      reloadDates();
    }
    deleteDialog.value = false;
  } catch (err) {
    notify.error(err);
  } finally {
    deleting.value = false;
  }
}

// ------------------------------------------------------------------ старт
onMounted(() => {
  applyPreset('next30'); // watcher периода загрузит встречи
  loadDates();
});

onUnmounted(() => {
  debouncedClientSearch.cancel();
});
</script>

<style scoped>
.time-col {
  min-width: 48px;
  font-variant-numeric: tabular-nums;
}
.min-w-0 {
  min-width: 0;
}
.pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
.meeting-past {
  opacity: 0.6;
}
</style>
