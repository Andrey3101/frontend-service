<template>
  <div>
    <!-- Верхняя панель (head) -->
    <v-app-bar app flat color="primary" dark>
      <!-- Левая часть: ФИ и телефон -->
      <div class="user-info" v-if="user">
        <span class="user-name">{{ user.name }}</span>
        <span class="user-phone">{{ user.phone }}</span>
      </div>

      <!-- Центральное меню: прокрутка для мобильных, планшетов и десктопа -->
      <v-spacer v-if="!isMobileOnly" />
      <div class="menu-wrapper">
        <!-- Прокручиваемое меню для мобильной версии -->
        <div v-if="isMobileOnly" class="menu-scroll">
          <div class="menu-scroll-inner">
            <v-btn text to="/dashboard" class="menu-item" aria-label="Перейти к дашборду">
              <img src ="@/assets/sidebaricon/dashboards.svg" class="custom-icon" alt="Dashboard">
              Дашборд
            </v-btn>
            <v-btn text to="/tasks" class="menu-item" aria-label="Перейти к задачам">
              <img src ="@/assets/sidebaricon/tasks.svg" class="custom-icon" alt="Tasks">
              Задачи
            </v-btn>
            <v-btn text to="/reports" class="menu-item" aria-label="Перейти к отчётам">
              <img src ="@/assets/sidebaricon/reports.svg" class="custom-icon" alt="Reports">
              Отчеты
            </v-btn>
            <v-btn text to="/acts" class="menu-item" aria-label="Перейти к актам">
              <img src ="@/assets/sidebaricon/acts.svg" class="custom-icon" alt="Acts">
              Акты
            </v-btn>
            <v-btn text to="/users" class="menu-item" aria-label="Пользователи">
              <img src ="@/assets/sidebaricon/users.svg" class="custom-icon" alt="Users">
              Пользователи
            </v-btn>
            <v-btn text to="/profile" class="menu-item" aria-label="Перейти к профилю">
              <img src ="@/assets/sidebaricon/profile.svg" class="custom-icon" alt="Profile">
              Профиль
            </v-btn>
          </div>
        </div>
        <!-- Прокручиваемое меню для планшета и десктопа -->
        <div v-else class="desktop-menu">
          <div class="desktop-menu-inner">
            <v-btn text to="/dashboard" class="menu-item" aria-label="Перейти к дашборду">
              <img src ="@/assets/sidebaricon/dashboards.svg" class="custom-icon" alt="Dashboard">
              Дашборд
            </v-btn>
            <v-btn text to="/tasks" class="menu-item" aria-label="Перейти к задачам">
              <img src ="@/assets/sidebaricon/tasks.svg" class="custom-icon" alt="Tasks">
              Задачи
            </v-btn>
            <v-btn text to="/reports" class="menu-item" aria-label="Перейти к отчётам">
              <img src ="@/assets/sidebaricon/reports.svg" class="custom-icon" alt="Reports">
              Отчеты
            </v-btn>
            <v-btn text to="/acts" class="menu-item" aria-label="Перейти к актам">
              <img src ="@/assets/sidebaricon/acts.svg" class="custom-icon" alt="Acts">
              Акты
            </v-btn>
            <v-btn text to="/users" class="menu-item" aria-label="Пользователи">
              <img src ="@/assets/sidebaricon/users.svg" class="custom-icon" alt="Users">
              Пользователи
            </v-btn>
            <v-btn text to="/profile" class="menu-item" aria-label="Перейти к профилю">
              <img src ="@/assets/sidebaricon/profile.svg" class="custom-icon" alt="Profile">
              Профиль
            </v-btn>
          </div>
        </div>
      </div>
      <v-spacer v-if="!isMobileOnly" />

      <!-- Правая часть: уведомления -->
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
            class="notification-btn"
            aria-label="Открыть уведомления"
          >
            <img src ="@/assets/sidebaricon/notification.svg" class="custom-icon" alt="Notification">
            <v-badge v-if="notifications.length" color="red" :content="notifications.length" overlap />
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-for="(notification, index) in notifications" :key="index">
            <v-list-item-title>{{ notification.text }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="!notifications.length">
            <v-list-item-title>Нет уведомлений</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: 'Иванов Иван',
        phone: '+7 (999) 123-45-67',
      },
      notifications: [
        { text: 'Созданная задача переведена на Иванова Ивана' },
        { text: 'Новый отчёт добавлен' },
      ],
    };
  },
  computed: {
    isMobileOnly() {
      const mobile = this.$vuetify?.breakpoint?.xsOnly ?? window.innerWidth < 600;
      console.log('isMobileOnly:', mobile, 'Width:', this.$vuetify?.breakpoint?.width || window.innerWidth);
      return mobile;
    },
    isTablet() {
      const tablet = (this.$vuetify?.breakpoint?.smOnly ?? (window.innerWidth >= 600 && window.innerWidth < 960));
      console.log('isTablet:', tablet);
      return tablet;
    },
    isDesktop() {
      const desktop = this.$vuetify?.breakpoint?.mdAndUp ?? window.innerWidth >= 960;
      console.log('isDesktop:', desktop);
      return desktop;
    },
  },
  mounted() {
    console.log('SidebarForm mounted, isMobileOnly:', this.isMobileOnly, 'isTablet:', this.isTablet);
  },
};
</script>

<style scoped>
.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: 16px;
  min-width: 150px;
}

.user-name {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 1.2rem;
}

.user-phone {
  font-family: 'Gilroy-Light', sans-serif;
  font-size: 0.9rem;
  opacity: 0.8;
  white-space: nowrap;
}

/* Стили для десктопного и планшетного меню */
.desktop-menu {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.desktop-menu-inner {
  display: flex;
  white-space: nowrap;
  min-width: max-content;
}

.custom-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
  margin-right: 8px;
}

/* Общие стили для пунктов меню */
.menu-item {
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 1rem;
  color: white;
  margin: 0 8px;
  transition: color 0.2s ease;
}

.menu-item:hover {
  color: #e3f2fd;
}

/* Стили для прокрутки в мобильной версии */
.menu-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.menu-scroll {
  width: 200px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.menu-scroll-inner {
  display: flex;
  white-space: nowrap;
  min-width: max-content;
}

/* Увеличиваем ширину меню, чтобы прокрутка сработала */
@media (max-width: 599px) {
  .menu-scroll {
    width: 200px;
    overflow-x: auto;
    padding-bottom: 5px;
  }
  .menu-scroll-inner {
    display: flex;
    white-space: nowrap;
  }
  .menu-scroll .menu-item {
    font-size: 0.8rem;
    margin: 0 2px;
    padding: 0 8px;
    flex: 0 0 auto;
    min-width: 80px;
  }
  .notification-btn {
    margin-right: 16px;
    width: 45px;
    height: 45px;
  }
}

@media (max-width: 430px) {
  .menu-scroll {
    width: 260px;
    overflow-x: auto;
    padding-bottom: 5px;
  }
  notification-btn {
    margin-right: auto;
    margin-left: 3px;
  }
}

@media (max-width: 414px) {
  .menu-scroll {
    width: 240px;
    overflow-x: auto;
    padding-bottom: 5px;
  }
}

@media (max-width: 390px) {
  .menu-scroll {
    width: 220px;
    overflow-x: auto;
    padding-bottom: 5px;
  }
  notification-btn {
    margin-right: 3px;
    margin-left: 3px;
  }
}

@media (max-width: 375px) {
  .menu-scroll {
    width: 190px;
    overflow-x: auto;
    padding-bottom: 5px;
  }
  notification-btn {
    margin-right: auto;
    margin-left: 3px;
  }
}

@media (max-width: 320px) {
  .menu-scroll {
    width: 155px;
    overflow-x: auto;
    padding-bottom: 5px;
  }
  notification-btn {
    margin-right: 2px;
    margin-left: 2px;
  }
}

.menu-scroll::-webkit-scrollbar {
  height: 4px;
}

.menu-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

/* Стили для планшетной версии (600px–959px) */
@media (min-width: 600px) and (max-width: 959px) {
  .desktop-menu {
    width: 450px; /* Фиксированная ширина для прокрутки */
    overflow-x: auto;
    padding-bottom: 5px;
  }
  .desktop-menu-inner {
    display: flex;
    white-space: nowrap;
  }
  .desktop-menu .menu-item {
    font-size: 0.9rem;
    margin: 0 4px;
    flex: 0 0 auto;
    min-width: 80px;
  }
  .desktop-menu::-webkit-scrollbar {
    height: 4px;
  }
  .desktop-menu::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
  }
  .notification-btn {
    position: absolute; /* Фиксируем кнопку */
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 24;
  }
}

/* Стили для десктопной версии (≥ 960px) */
@media (min-width: 960px) {
  .desktop-menu .menu-item {
    font-size: 1rem;
    margin: 0 8px;
  }
  .notification-btn {
    margin-right: 24px;
  }
}

/* Адаптация для мобильных и планшетных устройств */
@media (max-width: 959px) {
  .user-info {
    padding-left: 8px;
    min-width: 120px;
  }
  .user-name {
    font-size: 1rem;
  }
  .user-phone {
    font-size: 0.8rem;
    white-space: normal;
    overflow: visible;
    text-overflow: initial;
  }
  .notification-btn {
    margin-right: 24px;
    margin-left: auto;
  }
  /* Переопределение стиля для кнопки "Нотификации" */
  .v-btn--icon.v-btn--density-default {
    width: calc(var(--v-btn-height) + 5px) !important; 
    height: calc(var(--v-btn-height) + 5px) !important; 
}
}
</style>