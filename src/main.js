import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VueQueryPlugin } from '@tanstack/vue-query';
import VueAnimateOnScroll from 'vue3-animate-onscroll';
import './assets/styles.css';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: { primary: '#1976d2' },
      dark: { primary: '#1976d2' },
    },
  },
});

const app = createApp(App);
app.use(router);
app.use(store);
app.use(vuetify);
app.use(VueQueryPlugin);
app.use(VueAnimateOnScroll);
app.mount('#app');