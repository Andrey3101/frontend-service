import { createRouter, createWebHistory } from 'vue-router';
import LoginForm from '../views/LoginForm.vue';
import RegisterForm from '../views/RegisterForm.vue';
import Dashboard from '../views/DashboardPage.vue';
import Tasks from '../views/TasksList.vue';
import Users from '../views/UsersList.vue';
import Acts from '../views/ActsList.vue';
import Reports from '../views/ReportList.vue';
import Profile from '../views/ProfileForm.vue';
import ActsDetail from '../components/ActsDetail.vue';
import UsersDetail from '../components/UsersDetail.vue';
import ReportsDetail from '../components/ReportsDetail.vue';
import TaxCalculator from '@/components/TaxCalculator.vue';
import ResetPassword from '../views/ResetPassword.vue';
import NotFound from '../views/NotFound.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginForm },
  { path: '/register', component: RegisterForm },
  { 
    path: '/dashboard', 
    component: Dashboard, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/tax-calculator', 
    name: 'TaxCalculator', 
    component: TaxCalculator,
    meta: { requiresAuth: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
  },
  { 
    path: '/tasks', 
    component: Tasks, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/users', 
    component: Users, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/users/:id', 
    component: UsersDetail, 
    meta: { requiresAuth: true },
    props: true 
  },
  { 
    path: '/acts', 
    component: Acts, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/acts/:id', 
    component: ActsDetail, 
    meta: { requiresAuth: true },
    props: true 
  },
  { 
    path: '/reports', 
    component: Reports, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/reports/:id', 
    component: ReportsDetail, 
    meta: { requiresAuth: true },
    props: true 
  },
  { 
    path: '/profile', 
    component: Profile, 
    meta: { requiresAuth: true } 
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;