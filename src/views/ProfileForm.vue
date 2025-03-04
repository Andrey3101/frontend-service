<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Профиль</h1>
        <v-text-field v-model="profile.email" label="Email" :disabled="!profile.editable" />
        <v-text-field
          v-if="profile.role !== 'user'"
          v-model="profile.company_name"
          label="Название компании"
          :disabled="!profile.editable"
        />
        <v-text-field
          v-if="profile.role !== 'user'"
          v-model="profile.inn"
          label="ИНН"
          :disabled="!profile.editable"
        />
        <v-btn v-if="profile.editable" color="primary" @click="handleUpdate">Обновить</v-btn>
        <p v-if="profile.tasks_endpoint">
          Просмотр задач: <router-link to="/tasks">{{ profile.tasks_endpoint }}</router-link>
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getProfile, updateProfile } from '../api';

export default {
  data() {
    return {
      profile: {},
    };
  },
  async created() {
    this.profile = await getProfile();
  },
  methods: {
    async handleUpdate() {
      if (!this.profile.editable) return;
      if (this.profile.inn && !/^\d{10}$|^\d{12}$/.test(this.profile.inn)) {
        alert('ИНН должен содержать 10 или 12 цифр');
        return;
      }
      await updateProfile(this.profile);
      alert('Профиль обновлён');
    },
  },
};
</script>