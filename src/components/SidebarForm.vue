<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    :temporary="isMobile"
    :fixed="!isMobile"
    :clipped="isMobile"
    left
    class="sidebar"
    :width="sidebarWidth"
  >
    <!-- Заголовок бокового меню -->
    <div class="sidebar-header">
      <v-btn
        v-if="!isMobile"
        icon
        @click.stop="toggleSidebar"
        class="menu-toggle-btn"
      >
        <v-icon color="white">mdi-menu</v-icon>
      </v-btn>
      <img src="@/assets/logo.png" alt="Logo" class="logo-icon" />
      <span class="logo-text">Мой Проект</span>

      <!-- Кнопка закрытия для мобильных -->
      <v-btn
        v-if="isMobile"
        icon
        @click.stop="toggleSidebar"
        class="ml-auto close-btn"
      >
        <v-icon color="white">mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Список пунктов меню -->
    <v-list dense class="sidebar-list">
      <!-- Основные пункты меню -->
      <template v-for="item in menuItems">
        <template v-if="item.submenu">
          <!-- Пункты с подменю -->
          <v-list-group
            :key="item.route"
            :value="isSubmenuOpen(item.route)"
            prepend-icon=""
            class="sidebar-item-group"
          >
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" class="sidebar-item">
                <v-list-item-icon>
                  <img :src="getIcon(item.icon)" class="custom-icon" :alt="item.title" />
                </v-list-item-icon>
                <v-list-item-title class="item-title">{{ item.title }}</v-list-item-title>
                <v-list-item-action>
                  <v-icon class="toggle-icon">{{ isSubmenuOpen(item.route) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </v-list-item-action>
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
            :key="item.route"
            :to="item.route"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive(item.route) }"
            @click="closeDrawer"
          >
            <v-list-item-icon>
              <img :src="getIcon(item.icon)" class="custom-icon" :alt="item.title" />
            </v-list-item-icon>
            <v-list-item-title class="item-title">{{ item.title }}</v-list-item-title>
            <!-- Пустой элемент для выравнивания -->
            <v-list-item-action>
              <v-icon class="empty-icon" v-if="!isMobile">mdi-circle-small</v-icon>
            </v-list-item-action>
          </v-list-item>
        </template>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: 'SidebarForm',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
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
            { title: 'Рекомендации', route: '/promotion-recommendations' },
          ],
        },
        {
          title: 'Профиль',
          route: '/profile',
          icon: 'profile.svg',
        },
      ],
      localDrawer: false,
    };
  },
  computed: {
    drawer: {
      get() {
        return this.value || this.localDrawer;
      },
      set(val) {
        this.localDrawer = val;
        this.$emit('input', val);
      },
    },
    isMobile() {
      return this.$vuetify?.breakpoint?.xsOnly || false;
    },
    sidebarWidth() {
      return this.isMobile ? '100%' : '280px';
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
      return this.$route.path === route || 
             this.$route.path.startsWith(route + '/');
    },
    isSubmenuOpen(route) {
      return this.$route.path.startsWith(route + '/') || 
             this.menuItems.find(i => i.route === route)?.submenu?.some(
               sub => this.$route.path === sub.route
             );
    },
    toggleSidebar() {
      this.drawer = !this.drawer;
    },
    closeDrawer() {
      if (this.isMobile) {
        this.drawer = false;
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

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #34495e;
  min-height: 64px;
  position: relative;
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
  transition: opacity 0.3s ease;
}

.sidebar-list {
  padding: 0;
  width: 100%;
}

.sidebar-item,
.sidebar-item-group >>> .v-list-item {
  padding: 12px 16px;
  position: relative;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  min-height: 48px;
  cursor: pointer;
}

.sidebar-item:hover,
.sidebar-item-group >>> .v-list-item:hover {
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
}

.empty-icon {
  opacity: 0;
}

/* Мобильные стили */
@media (max-width: 600px) {
  .sidebar {
    width: 100% !important;
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
  .sidebar-item-group >>> .v-list-item {
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

.v-navigation-drawer__content {
  overflow-y: auto;
}

/* Анимация для подменю */
.v-list-group__items {
  transition: all 0.3s ease;
}
</style>
