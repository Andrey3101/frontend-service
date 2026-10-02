<template>
  <div class="sidebar">
    <router-link to="/dashboard" class="sidebar__brand">
      <v-icon icon="mdi-briefcase-check-outline" size="28" class="mr-2" />
      <span class="sidebar__brand-text">ClerkAI</span>
    </router-link>
    <div v-if="companyName" class="sidebar__company text-truncate">{{ companyName }}</div>

    <v-list v-model:opened="opened" nav density="compact" bg-color="transparent" class="sidebar__list">
      <template v-for="item in visibleItems" :key="item.title">
        <v-list-group v-if="item.children" :value="item.title">
          <template #activator="{ props: activatorProps }">
            <v-list-item v-bind="activatorProps" :prepend-icon="item.icon" :title="item.title" />
          </template>
          <v-list-item
            v-for="child in item.children"
            :key="child.to"
            :to="child.to"
            :prepend-icon="child.icon"
            :title="child.title"
            color="white"
          />
        </v-list-group>
        <v-list-item v-else :to="item.to" :prepend-icon="item.icon" :title="item.title" color="white" />
      </template>
    </v-list>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const route = useRoute();
const auth = useAuthStore();

/**
 * Пункты меню. admin: true — только для owner/admin.
 * Маршруты должны совпадать с src/router/index.js.
 */
const items = [
  { title: 'Дашборд', to: '/dashboard', icon: 'mdi-view-dashboard-outline' },
  { title: 'Задачи', to: '/tasks', icon: 'mdi-checkbox-marked-outline' },
  { title: 'Встречи и даты', to: '/meetings', icon: 'mdi-calendar-month-outline' },
  {
    title: 'Клиенты',
    icon: 'mdi-account-group-outline',
    children: [
      { title: 'Список клиентов', to: '/clients', icon: 'mdi-card-account-details-outline' },
      { title: 'Анализ клиента', to: '/client-analysis', icon: 'mdi-chart-box-outline' },
      { title: 'Проверка контрагентов', to: '/contractors', icon: 'mdi-shield-search' },
    ],
  },
  {
    title: 'Документы',
    icon: 'mdi-file-document-multiple-outline',
    children: [
      { title: 'Акты', to: '/acts', icon: 'mdi-file-sign' },
      { title: 'Отчёты', to: '/reports', icon: 'mdi-file-chart-outline' },
    ],
  },
  {
    title: 'Финансы',
    icon: 'mdi-cash-multiple',
    children: [
      { title: 'Доходы и расходы', to: '/finance', icon: 'mdi-swap-vertical' },
      { title: 'Банковские счета', to: '/bank-accounts', icon: 'mdi-bank-outline' },
      { title: 'Налоговый калькулятор', to: '/tax-calculator', icon: 'mdi-calculator-variant-outline' },
    ],
  },
  { title: 'Склад', to: '/inventory', icon: 'mdi-package-variant-closed' },
  {
    title: 'ИИ-инструменты',
    icon: 'mdi-robot-outline',
    children: [
      { title: 'Ассистент', to: '/assistant', icon: 'mdi-chat-processing-outline' },
      { title: 'Анализ конкурентов', to: '/competitors', icon: 'mdi-binoculars' },
      { title: 'Продвижение', to: '/promotion', icon: 'mdi-bullhorn-outline' },
    ],
  },
  { title: 'Пользователи', to: '/users', icon: 'mdi-account-cog-outline', admin: true },
];

const visibleItems = computed(() => items.filter((item) => !item.admin || auth.isAdmin));
const companyName = computed(() => auth.user?.company?.name ?? '');

function isActive(to) {
  return route.path === to || route.path.startsWith(`${to}/`);
}

/** Раскрываем группу, в которой находится текущая страница. */
const opened = ref([]);
watch(
  () => route.path,
  () => {
    const group = items.find((item) => item.children?.some((child) => isActive(child.to)));
    if (group && !opened.value.includes(group.title)) {
      opened.value = [...opened.value, group.title];
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.sidebar {
  color: #ecf0f1;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  padding: 16px 16px 4px;
  color: inherit;
  text-decoration: none;
}

.sidebar__brand-text {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.sidebar__company {
  padding: 0 16px 8px 52px;
  font-size: 0.85rem;
  opacity: 0.7;
}

.sidebar__list :deep(.v-list-item--active) {
  background: rgba(255, 255, 255, 0.12);
}
</style>
