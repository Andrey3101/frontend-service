<template>
  <v-app>
    <template v-if="showLayout">
      <v-navigation-drawer v-model="drawer" color="secondary" width="272" mobile-breakpoint="md">
        <SidebarForm />
      </v-navigation-drawer>

      <v-app-bar color="surface" elevation="1" density="comfortable">
        <v-app-bar-nav-icon aria-label="Меню" @click="drawer = !drawer" />
        <v-app-bar-title>{{ pageTitle }}</v-app-bar-title>

        <NotificationsBell />

        <v-menu location="bottom end" offset="8">
          <template #activator="{ props: activatorProps }">
            <v-btn v-bind="activatorProps" variant="text" class="text-none ml-1" aria-label="Меню пользователя">
              <v-avatar size="32" color="primary" class="mr-sm-2">
                <span class="text-body-2 text-white">{{ initials }}</span>
              </v-avatar>
              <span class="d-none d-sm-inline">{{ auth.user?.full_name }}</span>
              <v-icon icon="mdi-chevron-down" end />
            </v-btn>
          </template>
          <v-list density="compact" min-width="240">
            <v-list-item :title="auth.user?.full_name" :subtitle="auth.user?.email" />
            <v-divider class="my-1" />
            <v-list-item to="/profile" prepend-icon="mdi-account-outline" title="Профиль" />
            <v-list-item to="/subscription" prepend-icon="mdi-credit-card-outline" title="Подписка" />
            <v-list-item prepend-icon="mdi-logout" title="Выйти" @click="onLogout" />
          </v-list>
        </v-menu>
      </v-app-bar>

      <v-main>
        <v-container fluid class="pa-4 pa-md-6">
          <v-alert
            v-if="subscription.isExpired && route.path !== '/subscription'"
            type="warning"
            variant="tonal"
            class="mb-4"
            prominent
          >
            Подписка истекла — часть функций может быть недоступна.
            <router-link to="/subscription" class="font-weight-medium">Продлить подписку</router-link>
          </v-alert>
          <router-view />
        </v-container>
      </v-main>
    </template>

    <v-main v-else>
      <router-view />
    </v-main>

    <AppSnackbar />
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppSnackbar from '@/components/AppSnackbar.vue';
import NotificationsBell from '@/components/NotificationsBell.vue';
import SidebarForm from '@/components/SidebarForm.vue';
import { useAuthStore } from '@/stores/auth.js';
import { useSubscriptionStore } from '@/stores/subscription.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const subscription = useSubscriptionStore();

/** null — Vuetify сам решает: открыт на десктопе, закрыт на мобильных. */
const drawer = ref(null);

// Маршруты без meta.public доступны только после входа (см. guard в router), поэтому layout зависит только от маршрута:
// иначе при выходе страница перемонтировалась бы без layout и успевала отправить запросы без токена.
const showLayout = computed(() => route.matched.length > 0 && !route.meta.public);
const pageTitle = computed(() => route.meta.title || 'ClerkAI');
const initials = computed(() => {
  const name = auth.user?.full_name || auth.user?.email || '';
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?'
  );
});

// Статус подписки нужен баннеру; грузим при входе, сбрасываем при выходе.
watch(
  () => auth.isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      subscription.load().catch(() => {
        /* баннер не критичен — ошибку покажет страница подписки */
      });
    } else {
      subscription.reset();
    }
  },
  { immediate: true },
);

async function onLogout() {
  await auth.logout();
  router.replace('/login');
}
</script>
