<template>
  <v-navigation-drawer
    v-model="drawer"
    :app="isDesktop"
    :temporary="isMobile"
    :permanent="isDesktop"
    :width="isMobile ? '100%' : (isCollapsed ? 60 : 300)"
    class="sidebar"
  >
    <v-list dense>
      <!-- Заголовок и кнопка закрытия/сворачивания -->
      <v-list-item v-if="isMobile" class="mobile-header">
        <v-list-item-title class="sidebar-title">Меню</v-list-item-title>
        <v-spacer />
        <v-btn icon @click="closeMenu" class="close-btn-mobile">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-list-item>
      <v-list-item v-else>
        <v-list-item-title class="sidebar-title" v-if="!isCollapsed">Меню</v-list-item-title>
        <v-spacer />
        <v-btn icon @click="toggleCollapse">
          <v-icon>{{ isCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
        </v-btn>
      </v-list-item>

      <!-- Пункты меню -->
      <v-list-item to="/dashboard" :disabled="isCollapsed && !isMobile">
        <v-list-item-icon><v-icon>mdi-view-dashboard</v-icon></v-list-item-icon>
        <v-list-item-title v-if="!isCollapsed || isMobile">Дашборд</v-list-item-title>
      </v-list-item>
      <v-list-item to="/tasks" :disabled="isCollapsed && !isMobile">
        <v-list-item-icon><v-icon>mdi-checkbox-marked-circle</v-icon></v-list-item-icon>
        <v-list-item-title v-if="!isCollapsed || isMobile">Задачи</v-list-item-title>
      </v-list-item>
      <v-list-item to="/users" :disabled="isCollapsed && !isMobile">
        <v-list-item-icon><v-icon>mdi-account-group</v-icon></v-list-item-icon>
        <v-list-item-title v-if="!isCollapsed || isMobile">Пользователи</v-list-item-title>
      </v-list-item>
      <v-list-item to="/acts" :disabled="isCollapsed && !isMobile">
        <v-list-item-icon><v-icon>mdi-file-document</v-icon></v-list-item-icon>
        <v-list-item-title v-if="!isCollapsed || isMobile">Акты</v-list-item-title>
      </v-list-item>
      <v-list-item to="/reports" :disabled="isCollapsed && !isMobile">
        <v-list-item-icon><v-icon>mdi-chart-bar</v-icon></v-list-item-icon>
        <v-list-item-title v-if="!isCollapsed || isMobile">Отчеты</v-list-item-title>
      </v-list-item>
      <v-list-item to="/profile" :disabled="isCollapsed && !isMobile">
        <v-list-item-icon><v-icon>mdi-account</v-icon></v-list-item-icon>
        <v-list-item-title v-if="!isCollapsed || isMobile">Профиль</v-list-item-title>
      </v-list-item>

      <!-- Переключатель темы только на десктопе -->
      <v-list-item v-if="!isMobile" @click="$vuetify.theme.dark = !$vuetify.theme.dark">
        <v-list-item-icon>
          <v-icon>{{ $vuetify.theme.dark ? 'mdi-white-balance-sunny' : 'mdi-moon-waxing-crescent' }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title v-if="!isCollapsed">Тема</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  props: ['value'],
  data() {
    return {
      isCollapsed: false,
    };
  },
  computed: {
    drawer: {
      get() { return this.value; },
      set(value) { this.$emit('input', value); },
    },
    isMobile() {
      return this.$vuetify?.breakpoint?.smAndDown ?? false;
    },
    isDesktop() {
      return this.$vuetify?.breakpoint?.mdAndUp ?? true;
    },
  },
  methods: {
    closeMenu() {
      this.$emit('input', false);
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
  },
};
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #1976d2, #42a5f5);
  color: white;
}

.sidebar-title {
  font-family: 'Gilroy-Black', sans-serif;
  font-size: 1.5rem;
  padding: 16px;
}

.v-list-item-title {
  color: white;
}

.v-list-item:hover .v-list-item-title {
  color: #e3f2fd;
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 2; /* Фиксируем заголовок и кнопку */
  background: linear-gradient(180deg, #1976d2, #42a5f5);
}

.close-btn-mobile {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 3; /* Увеличиваем z-index для кнопки */
}

@media (max-width: 960px) {
  .sidebar {
    width: 100% !important;
  }
}
</style>