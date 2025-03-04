<template>
  <v-container :fluid="$vuetify.breakpoint.xs">
    <h1 class="text-h5 mb-4">Пользователи</h1>
    <v-row>
      <v-col cols="12" sm="5">
        <v-text-field v-model="userId" label="ID пользователя" outlined dense />
      </v-col>
      <v-col cols="12" sm="5">
        <v-text-field v-model="phoneNumber" label="Новый номер" outlined dense />
      </v-col>
      <v-col cols="12" sm="2" class="d-flex align-center">
        <v-btn color="primary" @click="updateUser" block :small="$vuetify.breakpoint.xs">
          Обновить
        </v-btn>
      </v-col>
    </v-row>
    <v-list :dense="$vuetify.breakpoint.xs">
      <v-list-item v-for="user in users" :key="user.user_id">
        <v-list-item-content>
          <v-list-item-title>ID: {{ user.user_id }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ $vuetify.breakpoint.xs ? user.role : `Роль: ${user.role}` }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script>
import axios from 'axios';
import { useAuthStore } from '@/store';

export default {
  data: () => ({
    users: [],
    userId: '',
    phoneNumber: ''
  }),
  async created() {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:8000/users', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    this.users = response.data || [];
  },
  methods: {
    async updateUser() {
      if (this.userId && this.phoneNumber) {
        const authStore = useAuthStore();
        await axios.put(`http://localhost:8000/users/${this.userId}`, { phone_number: this.phoneNumber }, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        this.$root.showSnackbar('Пользователь обновлён', 'success');
        const response = await axios.get('http://localhost:8000/users', {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        this.users = response.data || [];
        this.userId = '';
        this.phoneNumber = '';
      }
    }
  }
};
</script>
