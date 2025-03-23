import { defineStore } from 'pinia';
import { login, logoutUser, getProfile, updateProfile, googleCallback } from '@/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    csrfToken: localStorage.getItem('csrf_token') || null,
    userId: localStorage.getItem('user_id') || null,
  }),
  actions: {
    async login(email, password) {
      const data = await login(email, password); // Использует 'login'
      this.userId = data.user_id;
      this.token = data.token;
      this.csrfToken = data.csrf_token;
      this.user = await getProfile();
    },
    async register(payload) {
      const response = await fetchWithTimeout(`${BASE_URLS.auth}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 'register'); // Использует 'register'
      this.userId = response.user_id;
      this.token = response.token;
      this.csrfToken = response.csrf_token;
      this.user = await getProfile();
    },
    async googleLogin(code, state) {
      const data = await googleCallback(code, state); // Использует 'googleCallback'
      this.userId = data.user_id;
      this.token = data.token;
      this.csrfToken = data.csrf_token;
      this.user = await getProfile();
    },
    async logout() {
      await logoutUser();
      this.user = null;
      this.token = null;
      this.csrfToken = null;
      this.userId = null;
    },
    async fetchProfile() {
      this.user = await getProfile();
    },
    async updateProfile(profile) {
      await updateProfile(profile);
      this.user = await getProfile();
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
});