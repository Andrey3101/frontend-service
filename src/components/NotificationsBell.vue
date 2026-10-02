<template>
  <v-menu v-model="open" location="bottom end" :close-on-content-click="false" offset="8">
    <template #activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" icon aria-label="Уведомления">
        <v-badge :model-value="unreadCount > 0" :content="badgeText" color="error">
          <v-icon icon="mdi-bell-outline" />
        </v-badge>
      </v-btn>
    </template>

    <v-card width="380" max-width="95vw">
      <v-card-title class="d-flex align-center text-subtitle-1">
        Уведомления
        <v-spacer />
        <v-btn
          variant="text"
          size="small"
          color="primary"
          :disabled="unreadCount === 0 || markingAll"
          :loading="markingAll"
          @click="readAll"
        >
          Прочитать все
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <v-list v-if="items.length" lines="two" density="compact" max-height="420" class="overflow-y-auto py-0">
        <v-list-item
          v-for="n in items"
          :key="n.id"
          :class="{ 'notification--unread': !n.is_read }"
          @click="openItem(n)"
        >
          <template #prepend>
            <v-icon :icon="iconFor(n.type)" :color="n.is_read ? 'grey' : 'primary'" />
          </template>
          <v-list-item-title class="font-weight-medium">{{ n.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ n.message }}</v-list-item-subtitle>
          <div class="text-caption text-medium-emphasis mt-1">{{ formatDateTime(n.created_at) }}</div>
        </v-list-item>
      </v-list>
      <v-card-text v-else-if="!loading" class="text-medium-emphasis">
        {{ loadError || 'Уведомлений нет' }}
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  errorMessage,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDateTime } from '@/utils/format.js';

const POLL_INTERVAL_MS = 60_000;

const router = useRouter();
const notify = useNotifyStore();

const open = ref(false);
const items = ref([]);
const unreadCount = ref(0);
const loading = ref(false);
const loadError = ref('');
const markingAll = ref(false);
let timer = null;

const badgeText = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)));

const ICONS = {
  task: 'mdi-checkbox-marked-circle-outline',
  finance: 'mdi-cash-multiple',
  system: 'mdi-cog-outline',
  info: 'mdi-information-outline',
};

function iconFor(type) {
  return ICONS[type] || ICONS.info;
}

async function refreshCount() {
  if (document.hidden) return;
  try {
    const data = await getUnreadCount();
    unreadCount.value = data.unread_count;
  } catch {
    // Тихо: счётчик не критичен, следующий опрос повторит попытку.
  }
}

async function loadList() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await listNotifications({ page: 1, limit: 10 });
    items.value = data.items;
    unreadCount.value = data.unread_count;
  } catch (err) {
    loadError.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function readAll() {
  markingAll.value = true;
  try {
    await markAllNotificationsRead();
    items.value = items.value.map((n) => ({ ...n, is_read: true }));
    unreadCount.value = 0;
  } catch (err) {
    notify.error(err);
  } finally {
    markingAll.value = false;
  }
}

async function openItem(n) {
  if (!n.is_read) {
    try {
      const updated = await markNotificationRead(n.id);
      items.value = items.value.map((x) => (x.id === n.id ? updated : x));
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (err) {
      notify.error(err);
    }
  }
  // Переходим только по внутренним ссылкам приложения.
  if (n.link && n.link.startsWith('/') && !n.link.startsWith('//')) {
    open.value = false;
    router.push(n.link);
  }
}

watch(open, (value) => {
  if (value) loadList();
});

onMounted(() => {
  refreshCount();
  timer = setInterval(refreshCount, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.notification--unread {
  background: rgba(30, 136, 229, 0.06);
}
</style>
