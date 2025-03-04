<template>
  <div class="home">
    <h1>Добро пожаловать, {{ authStore.companyName || 'Пользователь' }}!</h1>
    <p>Ваша роль: {{ authStore.role }}</p>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth';

export default {
  name: 'HomePage',
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
};
</script>

<style scoped>
.home {
  padding: 20px;
}
</style>
