<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>AI Task Manager</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="isAuthenticated" to="/dashboard" text>Дашборд</v-btn>
      <v-btn v-if="isAuthenticated" to="/tasks" text>Задачи</v-btn>
      <v-btn v-if="canViewActs" to="/acts" text>Акты</v-btn>
      <v-btn v-if="canViewUsers" to="/users" text>Пользователи</v-btn>
      <v-btn v-if="isAuthenticated" to="/voice" text>Голос</v-btn>
      <v-btn v-if="isAuthenticated" to="/profile" text>Профиль</v-btn>
      <v-btn v-if="isAuthenticated" @click="logout" text>Выйти</v-btn>
      <v-btn v-else to="/login" text>Войти</v-btn>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" bottom>
      {{ snackbar.message }}
      <v-btn text @click="snackbar.show = false">Закрыть</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import { useAuthStore } from '@/store';

export default {
  name: 'App',
  data: () => ({
    snackbar: { show: false, message: '', color: 'success' }
  }),
  setup() {
    const authStore = useAuthStore();
    return {
      isAuthenticated: authStore.isAuthenticated,
      role: authStore.role,
      canViewActs: ['manager', 'admin', 'super_admin'].includes(authStore.role),
      canViewUsers: ['manager', 'admin', 'super_admin'].includes(authStore.role),
      logout: () => {
        authStore.logout();
        this.$router.push('/login');
      }
    };
  },
  methods: {
    showSnackbar(message, color = 'success') {
      this.snackbar = { show: true, message, color };
    }
  }
};
</script>

<style>
.v-main {
  background: #f5f5f5;
}
</style>
