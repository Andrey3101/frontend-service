import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/LoginForm.vue';
import Dashboard from '../views/DashboardPage.vue';
import Profile from '../views/ProfileForm.vue';
import Tasks from '../views/TasksList.vue';
import Acts from '../views/ActsList.vue';
import Users from '../views/UsersList.vue';
import Reports from '../views/ReportList.vue';
import TaskDetail from '../components/TaskDetail.vue';

const routes = [
  { path: '/login', component: Login },
  { 
    path: '/tasks', 
    component: Tasks,
    meta: { requiresAuth: true },
    children: [
      { path: ':taskId', component: TaskDetail, name: 'TaskDetail' }
    ]
  },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/acts', component: Acts, meta: { requiresAuth: true } },
  { path: '/users', component: Users, meta: { requiresAuth: true } },
  { path: '/reports', component: Reports, meta: { requiresAuth: true } },
  { path: '/', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;