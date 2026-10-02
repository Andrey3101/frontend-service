/**
 * Сессия пользователя.
 * - accessToken хранится ТОЛЬКО в памяти (после перезагрузки страницы восстанавливается
 *   через init() → POST /api/auth/refresh по httpOnly-cookie).
 * - Никакого localStorage/sessionStorage для токенов.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authLogin, authLogout, authRefresh, authRegister, getMe } from '@/api/auth.js';

export const useAuthStore = defineStore('auth', () => {
  /** @type {import('vue').Ref<import('@/api/types.js').User|null>} */
  const user = ref(null);
  /** @type {import('vue').Ref<string|null>} */
  const accessToken = ref(null);
  /** Момент истечения access-токена, мс since epoch. */
  const expiresAt = ref(0);
  /** init() уже отработал (успешно или нет). */
  const initialized = ref(false);

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const role = computed(() => user.value?.role ?? null);
  const isOwner = computed(() => role.value === 'owner');
  const isAdmin = computed(() => role.value === 'owner' || role.value === 'admin');
  /** 'self_employed' | 'ip' | 'ooo' | null */
  const companyType = computed(() => user.value?.company?.type ?? null);

  /**
   * Сохранить ответ login/register/refresh.
   * @param {import('@/api/types.js').TokenResponse} tokenResponse
   */
  function setSession(tokenResponse) {
    accessToken.value = tokenResponse.access_token;
    expiresAt.value = Date.now() + (Number(tokenResponse.expires_in) || 0) * 1000;
    user.value = tokenResponse.user;
  }

  /** Очистить сессию на клиенте (без запроса к серверу). */
  function clearSession() {
    accessToken.value = null;
    expiresAt.value = 0;
    user.value = null;
  }

  /**
   * Обновить данные пользователя в сторе (например, после PUT /auth/me).
   * @param {import('@/api/types.js').User} value
   */
  function setUser(value) {
    user.value = value;
  }

  /** @type {Promise<import('@/api/types.js').TokenResponse>|null} */
  let refreshPromise = null;

  /**
   * Обновить access-токен по cookie. Параллельные вызовы получают ОДИН общий промис.
   * Ошибка → сессия очищается, промис отклоняется.
   * @returns {Promise<import('@/api/types.js').TokenResponse>}
   */
  function refresh() {
    if (!refreshPromise) {
      refreshPromise = authRefresh()
        .then((data) => {
          setSession(data);
          return data;
        })
        .catch((err) => {
          clearSession();
          throw err;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  }

  /** @type {Promise<void>|null} */
  let initPromise = null;

  /**
   * Восстановить сессию при старте приложения (вызывается роутером один раз).
   * Нет cookie / она недействительна → просто неавторизован.
   * @returns {Promise<void>}
   */
  function init() {
    if (!initPromise) {
      initPromise = refresh()
        .then(() => undefined)
        .catch(() => undefined)
        .finally(() => {
          initialized.value = true;
        });
    }
    return initPromise;
  }

  /**
   * @param {{email: string, password: string}} credentials
   * @returns {Promise<import('@/api/types.js').User>}
   */
  async function login(credentials) {
    const data = await authLogin(credentials);
    setSession(data);
    initialized.value = true;
    return data.user;
  }

  /**
   * Регистрация. В payload обязательно `pd_consent: true` — согласие на обработку ПДн,
   * которое дал пользователь (чекбокс формы); стор его не подставляет. Без него — 422.
   * @param {Parameters<typeof authRegister>[0]} payload
   * @returns {Promise<import('@/api/types.js').User>}
   */
  async function register(payload) {
    const data = await authRegister(payload);
    setSession(data);
    initialized.value = true;
    return data.user;
  }

  /** Выход: отзыв refresh-cookie на сервере (ошибки игнорируются) и очистка сессии. */
  async function logout() {
    try {
      await authLogout();
    } catch {
      /* сервер недоступен или сессия уже недействительна — всё равно выходим */
    } finally {
      clearSession();
    }
  }

  /**
   * Перечитать текущего пользователя (GET /api/auth/me).
   * @returns {Promise<import('@/api/types.js').User>}
   */
  async function fetchMe() {
    const me = await getMe();
    user.value = me;
    return me;
  }

  return {
    user,
    accessToken,
    expiresAt,
    initialized,
    isAuthenticated,
    role,
    isOwner,
    isAdmin,
    companyType,
    setSession,
    clearSession,
    setUser,
    refresh,
    init,
    login,
    register,
    logout,
    fetchMe,
  };
});
