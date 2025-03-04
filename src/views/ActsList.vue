<template>
  <v-container :fluid="$vuetify.breakpoint.xs">
    <h1 class="text-h5 mb-4">Акты</h1>
    <v-list :dense="$vuetify.breakpoint.xs">
<v-list-item v-for="act in acts" :key="act.id" @click="updateAct(act.id)">
        <v-list-item-content>
          <v-list-item-title>Акт ID: {{ act.id }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ $vuetify.breakpoint.xs ? act.type : `Тип: ${act.type}` }}
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
    acts: []
  }),
  async created() {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:8000/acts', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    this.acts = response.data || [];
  },
  methods: {
    async updateAct(actId) {
      const newType = prompt('Новый тип акта:');
      if (newType) {
        const authStore = useAuthStore();
        await axios.put(`http://localhost:8000/acts/${actId}`, { type: newType }, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        this.$root.showSnackbar('Акт обновлён', 'success');
        const response = await axios.get('http://localhost:8000/acts', {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        this.acts = response.data || [];
      }
    }
  }
};
</script>
