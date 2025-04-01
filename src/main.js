import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VueQueryPlugin } from '@tanstack/vue-query';
import VueAnimateOnScroll from 'vue3-animate-onscroll';
import VueTheMask from 'vue-the-mask';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './assets/styles.css';
import './assets/styles/mdi.css';

// Отладочный вывод для проверки компонентов
console.log('Vuetify components:', components);

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
app.use(createPinia());
app.use(router);
app.use(vuetify);
app.use(VueQueryPlugin);
app.use(VueAnimateOnScroll);
app.use(VueTheMask);
app.use(Toast, { timeout: 5000 });
app.mount('#app');