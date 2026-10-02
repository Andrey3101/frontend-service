import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

/**
 * meta:
 *   public  — доступно без авторизации, рендерится без layout (App.vue);
 *   guest   — только для гостей: авторизованного уводим на /dashboard;
 *   admin   — только owner/admin;
 *   title   — заголовок в app-bar и вкладке.
 * Все страницы загружаются лениво.
 */
const routes = [
  { path: '/', redirect: '/dashboard' },

  // ---- публичные ----
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginForm.vue'),
    meta: { public: true, guest: true, title: 'Вход' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterForm.vue'),
    meta: { public: true, guest: true, title: 'Регистрация' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPassword.vue'),
    meta: { public: true, title: 'Восстановление пароля' },
  },

  // ---- приложение ----
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardPage.vue'),
    meta: { title: 'Дашборд' },
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/views/TasksList.vue'),
    meta: { title: 'Задачи' },
  },
  {
    path: '/tasks/:id',
    name: 'task-detail',
    component: () => import('@/components/TaskDetail.vue'),
    props: true,
    meta: { title: 'Задача' },
  },
  {
    path: '/meetings',
    name: 'meetings',
    component: () => import('@/views/MeetingsPage.vue'),
    meta: { title: 'Встречи и даты' },
  },
  {
    path: '/clients',
    name: 'clients',
    component: () => import('@/views/ClientsList.vue'),
    meta: { title: 'Клиенты' },
  },
  {
    // Страница анализа: клиент выбирается на странице или приходит в ?client=<id>.
    path: '/client-analysis',
    name: 'client-analysis',
    component: () => import('@/views/ClientAnalysisPage.vue'),
    meta: { title: 'Анализ клиента' },
  },
  {
    path: '/clients/:id/analysis',
    redirect: (to) => ({ path: '/client-analysis', query: { client: to.params.id } }),
  },
  {
    path: '/acts',
    name: 'acts',
    component: () => import('@/views/ActsList.vue'),
    meta: { title: 'Акты' },
  },
  {
    path: '/acts/:id',
    name: 'act-detail',
    component: () => import('@/components/ActsDetail.vue'),
    props: true,
    meta: { title: 'Документ' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/ReportList.vue'),
    meta: { title: 'Отчёты' },
  },
  {
    path: '/reports/:id',
    name: 'report-detail',
    component: () => import('@/components/ReportsDetail.vue'),
    props: true,
    meta: { title: 'Отчёт' },
  },
  {
    path: '/finance',
    name: 'finance',
    component: () => import('@/views/FinancePage.vue'),
    meta: { title: 'Финансы' },
  },
  {
    path: '/bank-accounts',
    name: 'bank-accounts',
    component: () => import('@/views/BankAccountsPage.vue'),
    meta: { title: 'Банковские счета' },
  },
  {
    path: '/tax-calculator',
    name: 'tax-calculator',
    component: () => import('@/components/TaxCalculator.vue'),
    meta: { title: 'Налоговый калькулятор' },
  },
  {
    path: '/contractors',
    name: 'contractors',
    component: () => import('@/views/ContractorsPage.vue'),
    meta: { title: 'Проверка контрагентов' },
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/views/InventoryPage.vue'),
    meta: { title: 'Склад' },
  },
  {
    path: '/assistant',
    name: 'assistant',
    component: () => import('@/views/AssistantPage.vue'),
    meta: { title: 'ИИ-ассистент' },
  },
  {
    path: '/competitors',
    name: 'competitors',
    component: () => import('@/components/CompetitorMonitor.vue'),
    meta: { title: 'Анализ конкурентов' },
  },
  {
    path: '/promotion',
    name: 'promotion',
    component: () => import('@/components/PromotionRecommendations.vue'),
    meta: { title: 'Продвижение' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/UsersList.vue'),
    meta: { admin: true, title: 'Пользователи' },
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: () => import('@/components/UsersDetail.vue'),
    props: true,
    meta: { admin: true, title: 'Пользователь' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileForm.vue'),
    meta: { title: 'Профиль' },
  },
  {
    path: '/subscription',
    name: 'subscription',
    component: () => import('@/views/SubscriptionForm.vue'),
    meta: { title: 'Подписка' },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: { public: true, title: 'Страница не найдена' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    return saved || { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.initialized) {
    await auth.init();
  }

  if (to.meta.public) {
    if (to.meta.guest && auth.isAuthenticated) {
      return { path: '/dashboard' };
    }
    return true;
  }

  if (!auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (to.meta.admin && !auth.isAdmin) {
    return { path: '/dashboard' };
  }
  return true;
});

router.afterEach((to) => {
  const title = to.meta.title;
  document.title = title ? `${title} — ClerkAI` : 'ClerkAI';
});

export default router;
