import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router/index.js';
import vuetify from './plugins/vuetify.js';
import { setAuthHandlers } from './api/http.js';
import { useAuthStore } from './stores/auth.js';
import { useNotifyStore } from './stores/notify.js';
import { useSubscriptionStore } from './stores/subscription.js';
import './assets/styles.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const auth = useAuthStore(pinia);

// Связываем HTTP-клиент с сессией: токен из памяти, общий refresh, выход при неудаче.
setAuthHandlers({
  getAccessToken: () => auth.accessToken,
  refreshSession: () => auth.refresh(),
  onSessionExpired: () => {
    auth.clearSession();
    useSubscriptionStore(pinia).reset();
    const current = router.currentRoute.value;
    if (!current.meta.public) {
      router.replace({ path: '/login', query: { redirect: current.fullPath } });
    }
  },
});

app.config.errorHandler = (err, _instance, info) => {
  console.error('[ClerkAI]', info, err);
  // Необработанные ошибки запросов показываем текстом сервера, прочие — общим сообщением.
  useNotifyStore(pinia).error(err?.isAxiosError ? err : 'Внутренняя ошибка приложения');
};

app.use(router);
app.use(vuetify);
app.mount('#app');
