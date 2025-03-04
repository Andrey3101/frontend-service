import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Home from '../views/HomePage.vue';
import Tasks from '../views/TasksList.vue';
import Acts from '../views/ActsList.vue';
import Users from '../views/UsersList.vue';
import VoiceRecorder from '../views/VoiceRecorderForm.vue';
import Login from '../views/LoginForm.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/tasks', name: 'Tasks', component: Tasks, meta: { roles: ['user', 'manager', 'admin', 'super_admin'] } },
  { path: '/acts', name: 'Acts', component: Acts, meta: { roles: ['manager', 'admin', 'super_admin'] } },
  { path: '/users', name: 'Users', component: Users, meta: { roles: ['manager', 'admin', 'super_admin'] } },
  { path: '/voice', name: 'VoiceRecorder', component: VoiceRecorder, meta: { roles: ['user', 'manager', 'admin', 'super_admin'] } },
  { path: '/login', name: 'Login', component: Login },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Защита маршрутов на основе ролей
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiredRoles = to.meta.roles;

  if (requiredRoles && !authStore.isAuthenticated) {
    return next('/login');
  }

  if (requiredRoles && !requiredRoles.includes(authStore.role)) {
    return next('/'); // Редирект на главную, если нет доступа
  }

  next();
});

export default router;
