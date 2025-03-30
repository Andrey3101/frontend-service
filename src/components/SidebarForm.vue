<template>
  <div>
    <v-app-bar app flat color="primary" dark class="app-bar">
      <div class="user-info" v-if="user">
        <span class="user-name">{{ user.name }}</span>
        <span class="user-phone">{{ user.phone }}</span>
      </div>
      <v-spacer v-if="!isMobileOnly" />
      <div class="menu-wrapper">
        <div v-if="isMobileOnly" class="menu-scroll">
          <div class="menu-scroll-inner">
            <v-btn text to="/dashboard" class="menu-item" aria-label="Перейти к дашборду">
              <img src="@/assets/sidebaricon/dashboards.svg" class="custom-icon" alt="Dashboard" />
              Дашборд
            </v-btn>
            <v-btn text to="/tasks" class="menu-item" aria-label="Перейти к задачам">
              <img src="@/assets/sidebaricon/tasks.svg" class="custom-icon" alt="Tasks" />
              Задачи
            </v-btn>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn text v-bind="attrs" v-on="on" class="menu-item" aria-label="Документы">
                  <img src="@/assets/sidebaricon/reports.svg" class="custom-icon" alt="Documents" />
                  Документы
                </v-btn>
              </template>
              <v-list>
                <v-list-item to="/reports" aria-label="Перейти к отчётам">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/reports.svg" class="custom-icon" alt="Reports" />
                  </v-list-item-icon>
                  <v-list-item-title>Отчеты</v-list-item-title>
                </v-list-item>
                <v-list-item to="/acts" aria-label="Перейти к актам">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/acts.svg" class="custom-icon" alt="Acts" />
                  </v-list-item-icon>
                  <v-list-item-title>Акты</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn text to="/users" class="menu-item" aria-label="Пользователи">
              <img src="@/assets/sidebaricon/users.svg" class="custom-icon" alt="Users" />
              Пользователи
            </v-btn>
            <v-btn text to="/profile" class="menu-item" aria-label="Перейти к профилю">
              <img src="@/assets/sidebaricon/profile.svg" class="custom-icon" alt="Profile" />
              Профиль
            </v-btn>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn text v-bind="attrs" v-on="on" class="menu-item" aria-label="Инструменты">
                  <img src="@/assets/sidebaricon/calculator.svg" class="custom-icon" alt="Tools" />
                  Инструменты
                </v-btn>
              </template>
              <v-list>
                <v-list-item to="/tax-calculator" aria-label="Калькулятор налогов">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/calculator.svg" class="custom-icon" alt="Calculator" />
                  </v-list-item-icon>
                  <v-list-item-title>Калькулятор налогов</v-list-item-title>
                </v-list-item>
                <v-list-item to="/competitor-analysis" aria-label="Анализ конкурентов">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/competitors.svg" class="custom-icon" alt="Competitors" />
                  </v-list-item-icon>
                  <v-list-item-title>Анализ конкурентов</v-list-item-title>
                </v-list-item>
                <v-list-item to="/promotion-recommendations" aria-label="Рекомендации по продвижению">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/promotion.svg" class="custom-icon" alt="Promotion" />
                  </v-list-item-icon>
                  <v-list-item-title>Рекомендации по продвижению</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
        <div v-else class="desktop-menu">
          <div class="desktop-menu-inner">
            <v-btn text to="/dashboard" class="menu-item" aria-label="Перейти к дашборду">
              <img src="@/assets/sidebaricon/dashboards.svg" class="custom-icon" alt="Dashboard" />
              Дашборд
            </v-btn>
            <v-btn text to="/tasks" class="menu-item" aria-label="Перейти к задачам">
              <img src="@/assets/sidebaricon/tasks.svg" class="custom-icon" alt="Tasks" />
              Задачи
            </v-btn>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn text v-bind="attrs" v-on="on" class="menu-item" aria-label="Документы">
                  <img src="@/assets/sidebaricon/reports.svg" class="custom-icon" alt="Documents" />
                  Документы
                </v-btn>
              </template>
              <v-list>
                <v-list-item to="/reports" aria-label="Перейти к отчётам">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/reports.svg" class="custom-icon" alt="Reports" />
                  </v-list-item-icon>
                  <v-list-item-title>Отчеты</v-list-item-title>
                </v-list-item>
                <v-list-item to="/acts" aria-label="Перейти к актам">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/acts.svg" class="custom-icon" alt="Acts" />
                  </v-list-item-icon>
                  <v-list-item-title>Акты</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn text to="/users" class="menu-item" aria-label="Пользователи">
              <img src="@/assets/sidebaricon/users.svg" class="custom-icon" alt="Users" />
              Пользователи
            </v-btn>
            <v-btn text to="/profile" class="menu-item" aria-label="Перейти к профилю">
              <img src="@/assets/sidebaricon/profile.svg" class="custom-icon" alt="Profile" />
              Профиль
            </v-btn>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn text v-bind="attrs" v-on="on" class="menu-item" aria-label="Инструменты">
                  <img src="@/assets/sidebaricon/calculator.svg" class="custom-icon" alt="Tools" />
                  Инструменты
                </v-btn>
              </template>
              <v-list>
                <v-list-item to="/tax-calculator" aria-label="Калькулятор налогов">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/calculator.svg" class="custom-icon" alt="Calculator" />
                  </v-list-item-icon>
                  <v-list-item-title>Калькулятор налогов</v-list-item-title>
                </v-list-item>
                <v-list-item to="/competitor-analysis" aria-label="Анализ конкурентов">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/competitors.svg" class="custom-icon" alt="Competitors" />
                  </v-list-item-icon>
                  <v-list-item-title>Анализ конкурентов</v-list-item-title>
                </v-list-item>
                <v-list-item to="/promotion-recommendations" aria-label="Рекомендации по продвижению">
                  <v-list-item-icon>
                    <img src="@/assets/sidebaricon/promotion.svg" class="custom-icon" alt="Promotion" />
                  </v-list-item-icon>
                  <v-list-item-title>Рекомендации по продвижению</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </div>
      <v-spacer v-if="!isMobileOnly" />
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
            class="notification-btn"
            aria-label="Открыть уведомления"
          >
            <img src="@/assets/sidebaricon/notification.svg" class="custom-icon" alt="Notification" />
            <v-badge v-if="notifications.length" color="red" :content="notifications.length" overlap />
          </v-btn>
        </template>
        <v-list class="notification-list">
          <v-list-item v-if="wsError">
            <v-list-item-title class="error-text">Ошибка подключения к уведомлениям</v-list-item-title>
          </v-list-item>
          <v-list-item v-for="(notification, index) in notifications" :key="index" @click="markAsRead(index)">
            <v-list-item-icon>
              <img
                :src="getNotificationIcon(notification.type)"
                class="notification-icon"
                :alt="notification.type"
              />
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
      return this.$vuetify?.breakpoint?.xsOnly ?? window.innerWidth < 600;
    },
  },
  async mounted() {
    try {
      this.user = await getProfile();
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      }
      this.connectToNotifications();
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.user = { name: 'Иванов Иван', phone: '+7 (999) 123-45-67' };
    }
  },
  beforeUnmount() {
    if (this.ws) this.ws.close();
  },
  watch: {
    notifications(newNotifications) {
      localStorage.setItem('notifications', JSON.stringify(newNotifications));
    },
  },
  methods: {
    connectToNotifications() {
      const userId = this.user?.user_id || localStorage.getItem('user_id') || 'user123';
      this.ws = connectWebSocket('tasks', 'ws/tasks', userId, (data) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.notifications.push({
          text: data.message,
          timestamp,
          type: data.type || 'info',
          read: false,
        });
        if (this.notifications.length > 10) this.notifications.shift();
        this.wsError = false;
        this.playNotificationSound();
        this.showToast(data.message);
      });
      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({ partition: new Date().toISOString().slice(0, 7) }));
      };
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.wsError = true;
      };
      this.ws.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        this.wsError = true;
        setTimeout(() => this.connectToNotifications(), 2000);
      };
    },
    playNotificationSound() {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(err => console.error('Audio error:', err));
    },
    showToast(message) {
      this.$toast.info(message, { timeout: 5000 });
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
    margin-right: 24px;
  }
}

@media (min-width: 960px) {
  .desktop-menu .menu-item {
    font-size: 1rem;
    margin: 0 8px;
  }
  .notification-btn {
    margin-right: 24px;
  }
}

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

.clear-btn {
  color: #1976d2;
  font-family: 'Gilroy-Medium', sans-serif;
}

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

.v-list-item-title {
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 0.9rem;
}
</style>