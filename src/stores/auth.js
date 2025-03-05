import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: !!localStorage.getItem('token'),
    userName: localStorage.getItem('userName') || '',
    phone: localStorage.getItem('phone') || '',
  }),
  actions: {
    async login(email, password) {
      // Пример простой авторизации
      if (email && password) {
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('userName', 'Иванов Иван');
        localStorage.setItem('phone', '+7 (999) 123-45-67');
        this.isAuthenticated = true;
        this.userName = 'Иванов Иван';
        this.phone = '+7 (999) 123-45-67';
      } else {
        throw new Error('Неверные данные');
      }
    },
    async register(name, email, password) {
      // Пример простой регистрации
      if (name && email && password) {
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('userName', name);
        localStorage.setItem('phone', '+7 (999) 123-45-67'); // Можно добавить поле в форму
        this.isAuthenticated = true;
        this.userName = name;
        this.phone = '+7 (999) 123-45-67';
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
  },
});