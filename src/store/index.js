import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
export const useAuthStore = defineStore('auth', {
    state: () => ({
      token: localStorage.getItem('token') || '',
      role: '',
      userId: '',
      companyName: '',
      notifications: []
    }),
    getters: {
      isAuthenticated: (state) => !!state.token,
    },
    actions: {
      async login(email, password) {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        this.token = response.data.token;
        localStorage.setItem('token', this.token);
        await this.fetchProfile();
        this.connectWebSocket();
      },
      async fetchProfile() {
        const response = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.role = response.data.role;
        this.userId = response.data.user_id;
        this.companyName = response.data.company_name || '';
      },
      logout() {
        this.token = '';
        this.role = '';
        this.userId = '';
        this.companyName = '';
        this.notifications = [];
        localStorage.removeItem('token');
      },
      connectWebSocket() {
        const ws = new WebSocket('ws://localhost:8000/ws/tasks');
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.notifications.push(`Задача ${data.TaskID}: ${data.Action}`);
          this.$root.showSnackbar(`Задача ${data.TaskID}: ${data.Action}`);
        };
        ws.onclose = () => setTimeout(() => this.connectWebSocket(), 1000);
      }
    }
  });
  