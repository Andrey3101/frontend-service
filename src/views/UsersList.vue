<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Пользователи</h1>
        <v-text-field v-model="userId" label="ID пользователя" />
        <v-text-field v-model="phoneNumber" label="Новый номер телефона" />
        <v-btn color="primary" @click="handleUpdateUser">Обновить пользователя</v-btn>
        <v-list>
          <v-list-item v-for="user in users" :key="user.user_id">
            <v-list-item-content>
              <v-list-item-title>ID: {{ user.user_id }}</v-list-item-title>
              <v-list-item-subtitle v-if="isMobile">
                {{ user.role }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else>
                Роль: {{ user.role }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getUsers, updateUser } from '../api';

export default {
  data() {
    return {
      users: [],
      userId: '',
      phoneNumber: '',
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  async created() {
    const data = await getUsers();
    this.users = data || [];
  },
  methods: {
    async handleUpdateUser() {
      if (this.userId && this.phoneNumber) {
        const data = await updateUser(this.userId, { phone_number: this.phoneNumber });
        alert(JSON.stringify(data, null, 2));
        const newUsers = await getUsers();
        this.users = newUsers || [];
        this.userId = '';
        this.phoneNumber = '';
      }
    },
  },
};
</script>

<style scoped>
h1 {
  margin-bottom: 20px;
}
</style>