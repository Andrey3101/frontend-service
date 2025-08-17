<template>
  <div>
    <!-- Кнопка меню для мобильных устройств -->
    <v-btn
      v-if="shouldShowMobileMenuButton"
      icon
      class="mobile-menu-btn"
      @click.stop="toggleDrawer"
    >
      <v-icon>mdi-menu</v-icon>
    </v-btn>
    
    <v-navigation-drawer
      v-model="localDrawer"
      app
      :temporary="isMobileOrTablet"
      :permanent="!isMobileOrTablet"
      :clipped="false"
      left
      class="sidebar"
      :width="isCollapsed && !isMobileOrTablet ? '80px' : sidebarWidth"
    >
      <div class="sidebar-header" :class="{ 'collapsed-header': isCollapsed && !isMobileOrTablet }">
        <v-btn
          icon
          @click.stop="toggleDrawer"
          class="menu-toggle-btn"
        >
          <v-icon color="white">{{ isCollapsed ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
        </v-btn>
        <img
          v-if="!isCollapsed || isMobileOrTablet"
          src="@/assets/logo.png"
          alt="Logo"
          class="logo-icon"
        />
        <span v-if="!isCollapsed || isMobileOrTablet" class="logo-text">Мой Проект</span>

        <v-btn
          v-if="isMobileOrTablet"
          icon
          @click.stop="toggleDrawer"
          class="ml-auto close-btn"
        >
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-list dense class="sidebar-list">
        <!-- Основные пункты меню -->
        <template v-for="item in menuItems" :key="item.route">
          <template v-if="item.submenu">
            <!-- Пункты с подменю -->
            <v-list-group
              v-model="openSubmenus[item.route]"
              prepend-icon=""
              class="sidebar-item-group"
              :append-icon="null"
              :disabled="isCollapsed && !isMobileOrTablet"
            >
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" class="sidebar-item">
                  <v-list-item-icon>
                    <img :src="getIcon(item.icon)" class="custom-icon" :alt="item.title" />
                  </v-list-item-icon>
                  <v-list-item-title
                    v-if="!isCollapsed || isMobileOrTablet"
                    class="item-title"
                  >
                    {{ item.title }}
                  </v-list-item-title>
                  <v-icon
                    v-if="!isCollapsed || isMobileOrTablet"
                    class="toggle-icon ml-auto"
                  >
                    {{ openSubmenus[item.route] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </v-list-item>
              </template>

              <v-list-item
                v-for="subItem in item.submenu"
                :key="subItem.route"
                :to="subItem.route"
                class="submenu-item"
                :class="{ 'sidebar-item-active': isActive(subItem.route) }"
                @click="closeDrawer"
              >
                <v-list-item-icon class="submenu-icon">
                  <v-icon color="white">mdi-circle-small</v-icon>
                </v-list-item-icon>
                <v-list-item-title class="submenu-title">
                  {{ subItem.title }}
                </v-list-item-title>
              </v-list-item>
            </v-list-group>
          </template>
          
          <template v-else>
            <!-- Одиночные пункты меню -->
            <v-list-item
              :to="item.route"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive(item.route) }"
              @click="closeDrawer"
            >
              <v-list-item-icon>
                <img :src="getIcon(item.icon)" class="custom-icon" :alt="item.title" />
              </v-list-item-icon>
              <v-list-item-title
                v-if="!isCollapsed || isMobileOrTablet"
                class="item-title"
              >
                {{ item.title }}
              </v-list-item-title>
              <v-icon
                v-if="!isCollapsed || isMobileOrTablet"
                class="empty-icon"
              >
                mdi-circle-small
              </v-icon>
            </v-list-item>
          </template>
        </template>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  props: {
    value: Boolean,
    showMobileButton: Boolean,
    isMobileOrTablet: Boolean, // Passed from App.vue
  },
  setup(props, { emit }) {
    const route = useRoute();
    const router = useRouter();

    const shouldShowMobileMenuButton = computed(() => {
      return props.showMobileButton;
    });

    // Close sidebar on mobile/tablet after navigation
    router.afterEach(() => {
      if (props.isMobileOrTablet) {
        emit('update:value', false); // Emit event to update parent
      }
    });

    return {
      shouldShowMobileMenuButton,
      route,
      router,
    };
  },
  data() {
    return {
      localDrawer: false,
      isCollapsed: false, // For desktop collapse/expand
      openSubmenus: reactive({}),
      menuItems: [
        {
          title: 'Дашборд',
          route: '/dashboard',
          icon: 'dashboards.svg',
        },
        {
          title: 'Задачи',
          route: '/tasks',
          icon: 'tasks.svg',
        },
        {
          title: 'Документы',
          route: '/documents',
          icon: 'reports.svg',
          submenu: [
            { title: 'Отчеты', route: '/reports' },
            { title: 'Акты', route: '/acts' },
          ],
        },
        {
          title: 'Пользователи',
          route: '/users',
          icon: 'users.svg',
        },
        {
          title: 'Клиенты',
          route: '/clients',
          icon: 'clients.svg',
        },
        {
          title: 'Инструменты',
          route: '/tools',
          icon: 'calculator.svg',
          submenu: [
            { title: 'Калькулятор налогов', route: '/tax-calculator' },
            { title: 'Анализ конкурентов', route: '/competitor-analysis' },
            { title: 'Рекомендации по продвижению', route: '/promotion' },
            
            // НОВЫЕ РАЗДЕЛЫ ДЛЯ НОВЫХ ФИЧ
            { title: 'Проверка контрагентов', route: '/contractors' },
            { title: 'Анализ клиентов', route: '/client-analysis' },
            { title: 'Планирование встреч', route: '/meetings' },
            { title: 'Управление товарами', route: '/inventory' },
          ],
        },
        {
          title: 'Новые функции',
          route: '/new-features',
          icon: 'chat.svg',
          submenu: [
            { title: 'Доступность', route: '/accessibility' },
            { title: 'A/B тестирование', route: '/ab-testing' },
            { title: 'Edge Computing', route: '/edge-computing' },
            { title: '3D визуализация', route: '/3d-visualization' },
            { title: 'Голосовое управление', route: '/voice-control' },
          ],
        },
        {
          title: 'Профиль',
          route: '/profile',
          icon: 'profile.svg',
        },
      ],
    };
  },
  created() {
    this.menuItems.forEach(item => {
      if (item.submenu) {
        this.openSubmenus[item.route] = false; // Изначально все подменю закрыты
      }
    });

    // Load collapsed state from localStorage
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    this.isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;

    // Initialize localDrawer based on props.value
    this.localDrawer = this.value;
  },
  computed: {
    localDrawer: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('update:value', val); // Emit event to update parent
        // Save drawer state for desktop
        if (!this.isMobileOrTablet) {
          localStorage.setItem('sidebarDrawer', JSON.stringify(val));
        }
      },
    },
    isMobile() {
      return this.$vuetify?.breakpoint?.xsOnly || false;
    },
    isTablet() {
      return this.$vuetify?.breakpoint?.smOnly || false;
    },
    sidebarWidth() {
      if (this.isMobile) return '100%';
      if (this.isTablet) return '300px';
      return '280px';
    },
  },
  methods: {
    getIcon(iconName) {
      try {
        return require(`@/assets/sidebaricon/${iconName}`);
      } catch (e) {
        console.error(`Icon not found: ${iconName}`);
        return '';
      }
    },
    isActive(route) {
      return this.route.path === route || this.route.path.startsWith(route + '/');
    },
    toggleDrawer() {
      if (!this.isMobileOrTablet) {
        // On desktop, toggle collapse state
        this.isCollapsed = !this.isCollapsed;
        localStorage.setItem('sidebarCollapsed', JSON.stringify(this.isCollapsed));
      } else {
        // On mobile/tablet, toggle the drawer
        this.localDrawer = !this.localDrawer;
      }
    },
    closeDrawer() {
      if (this.isMobileOrTablet) {
        this.localDrawer = false;
      }
    },
  },
};
</script>

<style scoped>
.sidebar {
  background-color: #2c3e50;
  color: #ecf0f1;
  z-index: 1000;
  overflow-x: hidden;
  transition: width 0.3s ease;
}

.mobile-menu-btn {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1001;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #34495e;
  min-height: 64px;
  position: sticky;
  top: 0;
  z-index: 1;
  transition: padding 0.3s ease;
}

.collapsed-header {
  padding: 16px 8px;
  justify-content: center;
}

.menu-toggle-btn {
  margin-right: 12px;
}

.close-btn {
  position: absolute;
  right: 10px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  margin-right: 12px;
  flex-shrink: 0;
}

.logo-text {
  font-family: 'Gilroy-Bold', sans-serif;
  font-size: 1.25rem;
  color: #ecf0f1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-list {
  padding: 0;
  width: 100%;
}

.sidebar-item,
.sidebar-item-group .v-list-item {
  padding: 12px 16px;
  position: relative;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  min-height: 48px;
  cursor: pointer;
}

.sidebar-item:hover,
.sidebar-item-group .v-list-item:hover {
  background-color: #34495e;
}

.sidebar-item-active {
  background-color: #3e5c76;
  font-weight: bold;
}

.custom-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  filter: brightness(0) invert(1);
  flex-shrink: 0;
}

.submenu-item {
  padding: 8px 16px 8px 48px !important;
  min-height: 40px;
}

.submenu-icon {
  min-width: 24px !important;
  margin-right: 12px;
}

.submenu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.item-title,
.submenu-title {
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 1rem;
  color: #ecf0f1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.toggle-icon {
  color: white !important;
  transition: transform 0.2s ease;
  margin-left: auto;
}

.empty-icon {
  opacity: 0;
  margin-left: auto;
}

/* Мобильные стили */
@media (max-width: 600px) {
  .sidebar {
    width: 100%;
  }

  .sidebar-header {
    padding: 12px 16px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    font-size: 1.1rem;
  }

  .sidebar-item,
  .sidebar-item-group .v-list-item {
    padding: 10px 16px;
  }

  .submenu-item {
    padding: 8px 16px 8px 40px !important;
  }

  .custom-icon {
    width: 20px;
    height: 20px;
  }

  .item-title,
  .submenu-title {
    font-size: 0.95rem;
  }
}

/* Планшетные стили */
@media (min-width: 601px) and (max-width: 960px) {
  .sidebar {
    width: 300px;
  }

  .sidebar-header {
    padding: 14px 16px;
  }

  .logo-icon {
    width: 34px;
    height: 34px;
  }

  .logo-text {
    font-size: 1.15rem;
  }

  .sidebar-item,
  .sidebar-item-group .v-list-item {
    padding: 11px 16px;
  }

  .submenu-item {
    padding: 8px 16px 8px 44px !important;
  }

  .custom-icon {
    width: 22px;
    height: 22px;
  }
}

.v-navigation-drawer__content {
  overflow-y: auto;
}

/* Анимация для подменю */
.v-list-group__items {
  transition: all 0.3s ease;
}
</style>