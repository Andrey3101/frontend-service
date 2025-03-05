<template>
  <div>
    <!-- Верхняя панель (head) -->
    <v-app-bar app flat color="primary" dark>
      <!-- Левая часть: ФИ и телефон -->
      <div class="user-info" v-if="user">
        <span class="user-name">{{ user.name }}</span>
        <span class="user-phone">{{ user.phone }}</span>
      </div>

      <!-- Центральное меню (только для десктопа) -->
      <v-spacer v-if="!isMobile" />
      <v-toolbar-items v-if="!isMobile" class="desktop-menu">
        <v-btn text to="/dashboard">Дашборд</v-btn>
        <v-btn text to="/tasks">Задачи</v-btn>
        <v-btn text to="/reports">Отчеты</v-btn>
        <v-btn text to="/acts">Акты</v-btn>
        <v-btn text to="/profile">Профиль</v-btn>
      </v-toolbar-items>
      <v-spacer v-if="!isMobile" />

      <!-- Правая часть: уведомления -->
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" class="notification-btn">
            <v-icon>mdi-bell</v-icon>
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

    <!-- Мобильное меню (вертикальное под head) -->
    <v-container v-if="isMobile" class="mobile-menu" fluid>
      <v-row class="mobile-menu-row" no-gutters>
        <v-col cols="12">
          <v-btn text to="/dashboard" block class="mobile-menu-item">Дашборд</v-btn>
        </v-col>
        <v-col cols="12">
          <v-btn text to="/tasks" block class="mobile-menu-item">Задачи</v-btn>
        </v-col>
        <v-col cols="12">
          <v-btn text to="/reports" block class="mobile-menu-item">Отчеты</v-btn>
        </v-col>
        <v-col cols="12">
          <v-btn text to="/acts" block class="mobile-menu-item">Акты</v-btn>
        </v-col>
        <v-col cols="12">
          <v-btn text to="/profile" block class="mobile-menu-item">Профиль</v-btn>
        </v-col>
      </v-row>
    </v-container>
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
    isMobile() {
      const mobile = this.$vuetify?.breakpoint?.smAndDown ?? false;
      console.log('isMobile:', mobile, 'Width:', this.$vuetify?.breakpoint?.width); // Отладка
      return mobile;
    },
    isDesktop() {
      const desktop = this.$vuetify?.breakpoint?.mdAndUp ?? true;
      console.log('isDesktop:', desktop); // Отладка
      return desktop;
    },
  },
  mounted() {
    console.log('SidebarForm mounted, isMobile:', this.isMobile); // Отладка при монтировании
  },
};
</script>

<style scoped>
.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: 16px;
}

.user-name {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 1.2rem;
}

.user-phone {
  font-family: 'Gilroy-Light', sans-serif;
  font-size: 0.9rem;
  opacity: 0.8;
}

.desktop-menu .v-btn {
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 1rem;
  color: white;
  margin: 0 8px;
}

.desktop-menu .v-btn:hover {
  color: #e3f2fd;
}

.notification-btn {
  margin-right: 16px;
}

.mobile-menu {
  display: block !important;
  position: sticky;
  top: 64px; /* Высота v-app-bar по умолчанию */
  z-index: 1000;
  background: linear-gradient(180deg, #1976d2, #42a5f5);
  padding: 10px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.mobile-menu-row {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mobile-menu-item {
  font-family: 'Gilroy-Medium', sans-serif;
  font-size: 1rem;
  color: white;
  text-transform: none;
  margin: 4px 0;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  width: 100%;
  max-width: 200px;
}

.mobile-menu-item:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #e3f2fd;
}

@media (max-width: 960px) {
  .user-info {
    padding-left: 8px;
  }
  .user-name {
    font-size: 1rem;
  }
  .user-phone {
    font-size: 0.8rem;
  }
  .notification-btn {
    margin-right: 8px;
  }
}
</style>