import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: !!localStorage.getItem('token'),
    userName: localStorage.getItem('userName') || '',
    phone: localStorage.getItem('phone') || '',
  }),
  actions: {
    async login(email, password, phone) {
      if (email && password && phone) {
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('userName', 'Иванов Иван');
        localStorage.setItem('phone', phone);
        this.isAuthenticated = true;
        this.userName = 'Иванов Иван';
        this.phone = phone;
      } else {
        throw new Error('Неверные данные');
      }
    },
    async register(name, email, password, phone) {
      if (name && email && password && phone) {
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('userName', name);
        localStorage.setItem('phone', phone);
        this.isAuthenticated = true;
        this.userName = name;
        this.phone = phone;
      } else {
        throw new Error('Неверные данные');
      }
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('phone');
      this.isAuthenticated = false;
      this.userName = '';
      this.phone = '';
    },
    setTestToken() {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('userName', 'Тестовый Пользователь');
      localStorage.setItem('phone', '+7 (999) 000-00-00');
      this.isAuthenticated = true;
      this.userName = 'Тестовый Пользователь';
      this.phone = '+7 (999) 000-00-00';
      console.log('Тестовый токен установлен через auth store');
    },
  },
});