<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Акты</h1>
        <v-list>
          <v-list-item v-for="act in acts" :key="act.id" @click="handleUpdateAct(act.id)">
            <v-list-item-content>
              <v-list-item-title>Акт ID: {{ act.id }}</v-list-item-title>
              <v-list-item-subtitle v-if="isMobile">
                {{ act.type }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else>
                Тип: {{ act.type }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getActs, updateAct } from '../api';

export default {
  data() {
    return {
      acts: [],
    };
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  async created() {
    const data = await getActs();
    this.acts = data || [];
  },
  methods: {
    async handleUpdateAct(actId) {
      const newType = prompt('Введите новый тип акта:');
      if (newType) {
        const data = await updateAct(actId, { type: newType });
        alert(JSON.stringify(data, null, 2));
        const newActs = await getActs();
        this.acts = newActs || [];
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