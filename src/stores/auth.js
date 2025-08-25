import { defineStore } from 'pinia';
import { 
  login, 
  register, 
  logout, 
  refreshToken, 
  getProfile, 
  updateProfile,
  resetPassword,
  confirmResetPassword
  // Удаляем googleLogin
} from '@/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

  getters: {
    userRole: (state) => state.user?.role || null,
    companyId: (state) => state.user?.company_id || null,
    isAdmin: (state) => state.user?.role === 'admin',
    isManager: (state) => state.user?.role === 'manager',
    isUser: (state) => state.user?.role === 'user'
  },

  actions: {
    async login(credentials) {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await login(credentials);
        this.setAuthData(data);
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(userData) {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await register(userData);
        this.setAuthData(data);
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Удаляем googleLogin метод
    // async googleLogin(code, state) {
    //   this.loading = true;
    //   this.error = null;
    //   
    //   try {
    //     const data = await googleLogin(code, state);
    //     this.setAuthData(data);
    //     return data;
    //   } catch (error) {
    //     this.error = error.message;
    //     throw error;
    //   } finally {
    //     this.loading = false;
    //   }
    // },

    async logout() {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearAuthData();
      }
    },

    async refreshToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      try {
        const data = await refreshToken(this.refreshToken);
        this.setAuthData(data);
        return data;
      } catch (error) {
        this.clearAuthData();
        throw error;
      }
    },

    async getProfile() {
      if (!this.token) return;

      try {
        const data = await getProfile();
        this.user = data;
        return data;
      } catch (error) {
        console.error('Failed to get profile:', error);
        throw error;
      }
    },

    async updateProfile(profileData) {
      try {
        const data = await updateProfile(profileData);
        this.user = { ...this.user, ...data };
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    async resetPassword(email) {
      try {
        return await resetPassword(email);
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    async confirmResetPassword(token, newPassword) {
      try {
        return await confirmResetPassword(token, newPassword);
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    setAuthData(data) {
      this.token = data.token;
      this.refreshToken = data.refresh_token;
      this.user = data.user;
      this.isAuthenticated = true;
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refresh_token);
    },

    clearAuthData() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      this.error = null;
      
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },

    setError(error) {
      this.error = error;
    },

    clearError() {
      this.error = null;
    }
  }
});