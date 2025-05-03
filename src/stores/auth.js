import { defineStore } from 'pinia';
import { login, logoutUser, getProfile, updateProfile, googleCallback, fetchWithTimeout, connectWebSocket } from '@/api';
import { BASE_URLS } from '@/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    csrfToken: localStorage.getItem('csrf_token') || null,
    userId: localStorage.getItem('user_id') || null,
    notifications: [],
  }),
  actions: {
    async login(email, password) {
      const data = await login(email, password);
      this.userId = data.user_id;
      this.token = data.token;
      this.csrfToken = data.csrf_token;
      await this.fetchProfile();
      this.connectWebSocket();
    },
    async register(payload) {
      const response = await fetchWithTimeout(`${BASE_URLS.auth}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 'register');
      this.userId = response.user_id;
      this.token = response.token;
      this.csrfToken = response.csrf_token;
      await this.fetchProfile();
      this.connectWebSocket();
    },
    async googleLogin(code, state) {
      const data = await googleCallback(code, state);
      this.userId = data.user_id;
      this.token = data.token;
      this.csrfToken = data.csrf_token;
      await this.fetchProfile();
      this.connectWebSocket();
    },
    async logout() {
      await logoutUser();
      this.user = null;
      this.token = null;
      this.csrfToken = null;
      this.userId = null;
      this.notifications = [];
      localStorage.removeItem('token');
      localStorage.removeItem('csrf_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
    },
    async fetchProfile() {
      const profile = await getProfile();
      this.user = {
        ...profile,
        subscription_status: profile.subscription_status || 'none',
        trial_end: profile.trial_end || '',
        attachedCard: profile.attachedCard || null,
      };
    },
    async updateProfile(profile) {
      await updateProfile(profile);
      await this.fetchProfile();
    },
    connectWebSocket() {
      if (!this.userId || !this.token) return;
      const ws = connectWebSocket('auth', 'ws/tasks', this.userId, (data) => {
        this.notifications.push(`Задача ${data.TaskID}: ${data.Action}`);
        import('vue-toastification').then(({ useToast }) => {
          const toast = useToast();
          toast.info(`Задача ${data.TaskID}: ${data.Action}`);
        });
      });
      ws.onclose = () => setTimeout(() => this.connectWebSocket(), 1000);
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    isCompanyAdmin: (state) => state.user?.role === 'admin',
    subscriptionStatus: (state) => state.user?.subscription_status || 'none',
    trialEnd: (state) => state.user?.trial_end || '',
    attachedCard: (state) => state.user?.attachedCard || null,
  },
});