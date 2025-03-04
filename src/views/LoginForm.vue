<template>
  <v-container class="login-container">
    <v-row justify="center">
      <v-col cols="12" sm="6">
        <v-card>
          <v-card-title>Вход</v-card-title>
          <v-card-text>
            <v-text-field v-model="email" label="Email" />
            <v-text-field v-model="password" label="Пароль" type="password" />
            <v-btn color="primary" @click="handleLogin">Войти</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { login } from '../api';

export default {
  data() {
    return {
      email: '',
      password: '',
    };
  },
  methods: {
    async handleLogin() {
      try {
        const data = await login(this.email, this.password);
        this.$store.dispatch('login', data.token);
        this.$router.push('/dashboard');
      } catch (error) {
        alert('Ошибка входа: ' + error.message);
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}
</style>