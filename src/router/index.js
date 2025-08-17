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
import CompetitorMonitor from '@/components/CompetitorMonitor.vue';
import PromotionRecommendations from '@/components/PromotionRecommendations.vue';
import Clients from '../views/ClientsList.vue';
import SubscriptionForm from '../views/SubscriptionForm.vue';
import AccessibilityManager from '@/components/accessibility/AccessibilityManager.vue';
import ABTestingManager from '@/components/ab-testing/ABTestingManager.vue';
import EdgeComputingManager from '@/components/edge-computing/EdgeComputingManager.vue';
import ThreeJSChart from '@/components/3d-visualization/ThreeJSChart.vue';
import VoiceControlManager from '@/components/voice-control/VoiceControlManager.vue';

// НОВЫЕ СТРАНИЦЫ ДЛЯ НОВЫХ ФИЧ
import ContractorsPage from '../views/ContractorsPage.vue';
import ClientAnalysisPage from '../views/ClientAnalysisPage.vue';
import MeetingsPage from '../views/MeetingsPage.vue';
import InventoryPage from '../views/InventoryPage.vue';
import BankAccountsPage from '../views/BankAccountsPage.vue';

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
    path: '/clients',
    name: 'Clients',
    component: Clients,
    meta: { requiresAuth: true }
  },
  { 
    path: '/competitors', 
    name: 'CompetitorMonitor', 
    component: CompetitorMonitor,
    meta: { requiresAuth: true }
  },
  { 
    path: '/promotion', 
    name: 'PromotionRecommendations', 
    component: PromotionRecommendations,
    meta: { requiresAuth: true }
  },
  
  // НОВЫЕ МАРШРУТЫ ДЛЯ НОВЫХ ФИЧ
  {
    path: '/contractors',
    name: 'Contractors',
    component: ContractorsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/client-analysis',
    name: 'ClientAnalysis',
    component: ClientAnalysisPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/meetings',
    name: 'Meetings',
    component: MeetingsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: InventoryPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/bank-accounts',
    name: 'BankAccounts',
    component: BankAccountsPage,
    meta: { requiresAuth: true }
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
    path: '/subscription',
    name: 'Subscription',
    component: SubscriptionForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/accessibility',
    name: 'Accessibility',
    component: AccessibilityManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/ab-testing',
    name: 'ABTesting',
    component: ABTestingManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/edge-computing',
    name: 'EdgeComputing',
    component: EdgeComputingManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/3d-visualization',
    name: '3DVisualization',
    component: ThreeJSChart,
    meta: { requiresAuth: true }
  },
  {
    path: '/voice-control',
    name: 'VoiceControl',
    component: VoiceControlManager,
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