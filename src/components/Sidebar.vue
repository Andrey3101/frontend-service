<template>
  <v-navigation-drawer v-model="drawer" app>
    <v-list>
      <v-list-item to="/dashboard" title="Дашборд" />
      <v-list-item to="/profile" title="Профиль" />
      <v-list-item to="/tasks" title="Задачи" />
      <v-list-item to="/voice" title="Голосовые команды" />
      <v-list-item to="/acts" title="Акты" />
      <v-list-item to="/users" title="Пользователи" />
    </v-list>
    <v-switch v-model="darkMode" label="Темная тема" @change="toggleDarkMode" />
  </v-navigation-drawer>
</template>

<script>
export default {
  props: {
    value: Boolean, // Для v-model
  },
  data() {
    return {
      darkMode: false,
    };
  },
  computed: {
    drawer: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      },
    },
  },
  methods: {
    toggleDarkMode() {
      this.$vuetify.theme.global.name = this.darkMode ? 'dark' : 'light';
    },
  },
};
</script>