<template>
  <div class="login">
    <h1>Вход</h1>
    <input v-model="email" placeholder="Email" type="email" />
    <input v-model="password" placeholder="Пароль" type="password" />
    <button @click="login">Войти</button>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'LoginForm',
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    return { authStore, router };
  },
  data() {
    return {
      email: '',
      password: '',
      error: '',
    };
  },
  methods: {
    async login() {
      try {
        await this.authStore.login(this.email, this.password);
        this.router.push('/tasks');
      } catch (err) {
        this.error = err.message;
      }
    },
  },
};
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}
input {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 8px;
}
button {
  padding: 8px 16px;
}
</style>
