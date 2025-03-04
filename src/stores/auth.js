import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    role: '',
    userId: '',
    companyName: '',
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(email, password) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { token, role, user_id, company_name } = response.data;
        this.token = token;
        this.role = role;
        this.userId = user_id;
        this.companyName = company_name || '';
        localStorage.setItem('token', token);
        await this.fetchProfile();
      } catch (error) {
        throw new Error('Ошибка входа: ' + error.message);
      }
    },
    async fetchProfile() {
      try {
        const response = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        this.role = response.data.role;
        this.userId = response.data.user_id;
        this.companyName = response.data.company_name || '';
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      }
    },
    logout() {
      this.token = '';
      this.role = '';
      this.userId = '';
      this.companyName = '';
      localStorage.removeItem('token');
    },
  },
});

