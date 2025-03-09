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
              <img src="@/assets/sidebaricon/dashboards.svg" class="custom-icon" alt="Dashboard">
              Дашборд
            </v-btn>
            <v-btn text to="/tasks" class="menu-item" aria-label="Перейти к задачам">
              <img src="@/assets/sidebaricon/tasks.svg" class="custom-icon" alt="Tasks">
              Задачи
            </v-btn>
            <v-btn text to="/reports" class="menu-item" aria-label="Перейти к отчётам">
              <img src="@/assets/sidebaricon/reports.svg" class="custom-icon" alt="Reports">
              Отчеты
            </v-btn>
            <v-btn text to="/acts" class="menu-item" aria-label="Перейти к актам">
              <img src="@/assets/sidebaricon/acts.svg" class="custom-icon" alt="Acts">
              Акты
            </v-btn>
            <v-btn text to="/users" class="menu-item" aria-label="Пользователи">
              <img src="@/assets/sidebaricon/users.svg" class="custom-icon" alt="Users">
              Пользователи
            </v-btn>
            <v-btn text to="/profile" class="menu-item" aria-label="Перейти к профилю">
              <img src="@/assets/sidebaricon/profile.svg" class="custom-icon" alt="Profile">
              Профиль
            </v-btn>
          </div>
        </div>
        <!-- Прокручиваемое меню для планшета и десктопа -->
        <div v-else class="desktop-menu">
          <div class="desktop-menu-inner">
            <v-btn text to="/dashboard" class="menu-item" aria-label="Перейти к дашборду">
              <img src="@/assets/sidebaricon/dashboards.svg" class="custom-icon" alt="Dashboard">
              Дашборд
            </v-btn>
            <v-btn text to="/tasks" class="menu-item" aria-label="Перейти к задачам">
              <img src="@/assets/sidebaricon/tasks.svg" class="custom-icon" alt="Tasks">
              Задачи
            </v-btn>
            <v-btn text to="/reports" class="menu-item" aria-label="Перейти к отчётам">
              <img src="@/assets/sidebaricon/reports.svg" class="custom-icon" alt="Reports">
              Отчеты
            </v-btn>
            <v-btn text to="/acts" class="menu-item" aria-label="Перейти к актам">
              <img src="@/assets/sidebaricon/acts.svg" class="custom-icon" alt="Acts">
              Акты
            </v-btn>
            <v-btn text to="/users" class="menu-item" aria-label="Пользователи">
              <img src="@/assets/sidebaricon/users.svg" class="custom-icon" alt="Users">
              Пользователи
            </v-btn>
            <v-btn text to="/profile" class="menu-item" aria-label="Перейти к профилю">
              <img src="@/assets/sidebaricon/profile.svg" class="custom-icon" alt="Profile">
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
            <img src="@/assets/sidebaricon/notification.svg" class="custom-icon" alt="Notification">
            <v-badge v-if="notifications.length" color="red" :content="notifications.length" overlap />
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-if="wsError">
            <v-list-item-title class="error-text">Ошибка подключения к уведомлениям</v-list-item-title>
          </v-list-item>
          <v-list-item v-for="(notification, index) in notifications" :key="index" @click="markAsRead(index)">
            <v-list-item-icon>
              <img
                :src="getNotificationIcon(notification.type)"
                class="notification-icon"
                :alt="notification.type"
              >
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title :class="{ 'read': notification.read }">
                {{ notification.text }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ notification.timestamp }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="!notifications.length && !wsError">
            <v-list-item-title>Нет уведомлений</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="notifications.length">
            <v-btn text @click="clearNotifications" class="clear-btn">Очистить уведомления</v-btn>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
  </div>
</template>

<script>
import { connectWebSocket, getProfile } from '@/api/index.js';

export default {
  data() {
    return {
      user: null,
      notifications: [],
      ws: null,
      wsError: false,
    };
  },
  computed: {
    isMobileOnly() {
      const mobile = this.$vuetify?.breakpoint?.xsOnly ?? window.innerWidth < 600;
      return mobile;
    },
    isTablet() {
      const tablet = this.$vuetify?.breakpoint?.smOnly ?? (window.innerWidth >= 600 && window.innerWidth < 960);
      return tablet;
    },
    isDesktop() {
      const desktop = this.$vuetify?.breakpoint?.mdAndUp ?? window.innerWidth >= 960;
      return desktop;
    },
  },
  async mounted() {
    try {
      this.user = await getProfile(); // Получаем данные пользователя
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      }
      this.connectToNotifications();
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.user = { name: 'Иванов Иван', phone: '+7 (999) 123-45-67' }; // Заглушка
    }
  },
  beforeDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  },
  watch: {
    notifications(newNotifications) {
      localStorage.setItem('notifications', JSON.stringify(newNotifications));
    },
  },
  methods: {
    connectToNotifications() {
      const userId = this.user?.user_id || localStorage.getItem('user_id') || 'user123';
      this.ws = connectWebSocket(userId);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.notifications.push({
          text: data.message,
          timestamp,
          type: data.type || 'info',
          read: false,
        });
        if (this.notifications.length > 10) {
          this.notifications.shift();
        }
        this.wsError = false;
      };
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.wsError = true;
      };
      this.ws.onclose = () => {
        console.log('WebSocket closed, attempting to reconnect...');
        this.wsError = true;
        setTimeout(() => {
          this.wsError = false;
          this.connectToNotifications();
        }, 2000);
      };
    },
    clearNotifications() {
      this.notifications = [];
    },
    markAsRead(index) {
      this.$set(this.notifications, index, { ...this.notifications[index], read: true });
    },
    getNotificationIcon(type) {
      const icons = {
        task: require('@/assets/sidebaricon/tasks.svg'),
        report: require('@/assets/sidebaricon/reports.svg'),
        info: require('@/assets/sidebaricon/notification.svg'),
      };
      return icons[type] || icons.info;
    },
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
  .notification-btn {
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
  .notification-btn {
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
  .notification-btn {
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
  .notification-btn {
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
    width: 450px;
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
    position: absolute;
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
  .v-btn--icon.v-btn--density-default {
    width: calc(var(--v-btn-height) + 5px) !important;
    height: calc(var(--v-btn-height) + 5px) !important;
  }
}

/* Стили для кнопки уведомлений и бейджа */
.notification-btn {
  margin-right: 24px;
  position: relative;
}

.notification-btn .v-badge__badge {
  top: 10px;
  right: -2px;
  background-color: red;
  color: white;
  font-size: 0.75rem;
  height: 18px;
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

@media (max-width: 959px) {
  .notification-btn .v-badge__badge {
    top: 12px;
    right: -2px;
  }
}

/* Стили для кнопки очистки уведомлений */
.clear-btn {
  color: #1976d2;
  font-family: 'Gilroy-Medium', sans-serif;
}

/* Стили для уведомлений */
.notification-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.read {
  color: #888;
  text-decoration: line-through;
}

.error-text {
  color: #ff5252;
}
</style>