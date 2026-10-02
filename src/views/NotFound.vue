<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="text-center pa-6" elevation="4">
          <v-icon icon="mdi-map-marker-question-outline" size="72" color="primary" class="mb-4" />
          <div class="text-h4 font-weight-bold mb-2">404</div>
          <div class="text-h6 mb-2">Страница не найдена</div>
          <p class="text-medium-emphasis mb-6">
            Возможно, ссылка устарела или адрес набран с ошибкой.
          </p>
          <div class="d-flex justify-center ga-2 flex-wrap">
            <v-btn v-if="auth.isAuthenticated" color="primary" to="/dashboard">На главную</v-btn>
            <template v-else>
              <v-btn color="primary" to="/login">Войти</v-btn>
              <v-btn variant="text" to="/register">Регистрация</v-btn>
            </template>
            <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">Назад</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const auth = useAuthStore();

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push(auth.isAuthenticated ? '/dashboard' : '/login');
  }
}
</script>
