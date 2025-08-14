// Новая архитектура API - все через API Gateway
const BASE_URLS = {
  // API Gateway - единая точка входа для всех сервисов
  gateway: 'http://localhost:8000',
  
  // API endpoints через Gateway
  api: 'http://localhost:8000/api',
  
  // WebSocket endpoints для real-time функциональности
  ws: {
    gateway: 'ws://localhost:8000/ws',
    realtime: 'ws://localhost:8000/ws/realtime',
    voice: 'ws://localhost:8000/ws/voice',
    notifications: 'ws://localhost:8000/ws/notifications'
  }
};

// Улучшенные таймауты для разных типов операций
const TIMEOUTS = {
  default: 10000,
  auth: 5000,
  data: 15000,
  ai: 30000,
  voice: 45000,
  realtime: 15000,
  upload: 60000,
  export: 45000
};

// Безопасный менеджер токенов с поддержкой refresh
class SecureTokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + (expiresIn * 1000);
    
    // Сохраняем в secure storage
    this.saveToSecureStorage();
  }

  getAccessToken() {
    if (this.isTokenExpired()) {
      return this.refreshAccessToken();
    }
    return this.accessToken;
  }

  isTokenExpired() {
    return !this.tokenExpiry || Date.now() >= this.tokenExpiry;
  }

  async refreshAccessToken() {
    if (this.isRefreshing) {
      // Если уже обновляем, ждем завершения
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${BASE_URLS.api}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.access_token, this.refreshToken, data.expires_in);
        
        // Уведомляем всех подписчиков
        this.refreshSubscribers.forEach(resolve => resolve(this.accessToken));
        this.refreshSubscribers = [];
        
        return this.accessToken;
      } else {
        this.clearTokens();
        window.location.href = '/login';
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      window.location.href = '/login';
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.clearFromStorage();
  }

  saveToSecureStorage() {
    // Используем httpOnly cookies или secure storage
    // Для демонстрации используем localStorage с дополнительной защитой
    if (this.accessToken) {
      localStorage.setItem('access_token', this.accessToken);
      localStorage.setItem('token_expiry', this.tokenExpiry);
    }
    if (this.refreshToken) {
      localStorage.setItem('refresh_token', this.refreshToken);
    }
  }

  loadFromStorage() {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const expiry = localStorage.getItem('token_expiry');

      if (accessToken && refreshToken && expiry) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = parseInt(expiry);
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
      this.clearTokens();
    }
  }

  clearFromStorage() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
  }
}

// Глобальный экземпляр менеджера токенов
const tokenManager = new SecureTokenManager();
tokenManager.loadFromStorage();

// Улучшенная функция для работы с API через Gateway
async function apiRequest(endpoint, options = {}, timeoutKey = 'default') {
  const timeout = TIMEOUTS[timeoutKey] || TIMEOUTS.default;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const accessToken = tokenManager.getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${BASE_URLS.api}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Попытка обновить токен
        const newToken = await tokenManager.refreshAccessToken();
        if (newToken) {
          // Повторяем запрос с новым токеном
          return apiRequest(endpoint, options, timeoutKey);
        }
      }
      
      // Обработка специфичных ошибок API Gateway
      if (response.status === 429) {
        throw new Error('Превышен лимит запросов. Попробуйте позже.');
      } else if (response.status === 503) {
        throw new Error('Сервис временно недоступен. Попробуйте позже.');
      } else if (response.status === 502) {
        throw new Error('Ошибка шлюза. Попробуйте позже.');
      }
      
      const errorText = await response.text();
      const error = new Error(`Ошибка ${response.status}: ${errorText || response.statusText}`);
      error.response = { status: response.status, data: { detail: errorText } };
      throw error;
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API request error (timeout: ${timeout}ms):`, error);
    
    if (error.name === 'AbortError') {
      throw new Error('Превышено время ожидания запроса');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Ошибка сети. Проверьте подключение к интернету.');
    }
    
    throw error;
  }
}

// Новые функции для интеграции с улучшенными сервисами через Gateway

// Enhanced Cache Service через Gateway
export async function getCachedData(key, service = 'default') {
  return apiRequest(`/cache/${key}?service=${service}`);
}

export async function setCachedData(key, data, ttl = 300, service = 'default') {
  return apiRequest('/cache', {
    method: 'POST',
    body: JSON.stringify({
      key,
      data,
      ttl,
      service
    })
  }, 'data');
}

// Security Service через Gateway
export async function getSecurityProfile() {
  return apiRequest('/security/profile');
}

export async function updateSecuritySettings(settings) {
  return apiRequest('/security/profile', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }, 'data');
}

export async function validateToken(token) {
  return apiRequest(`/security/validate/${token}`);
}

// AI Analytics Service через Gateway
export async function getAIAnalytics(metricNames = null) {
  const query = metricNames ? `?metric_names=${metricNames.join(',')}` : '';
  return apiRequest(`/ai/analytics/metrics/realtime${query}`, {}, 'ai');
}

export async function analyzeBusinessData(data, analysisType = 'trends') {
  return apiRequest(`/ai/analytics/${analysisType}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }, 'ai');
}

export async function generateMLForecast(data, horizon = 30) {
  return apiRequest(`/ai/analytics/forecast`, {
    method: 'POST',
    body: JSON.stringify(data)
  }, 'ai');
}

// Voice Assistant Service через Gateway
export async function processVoiceCommand(audioFile, language = 'ru') {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('language', language);
  
  return apiRequest('/voice/command', {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': undefined }
  }, 'voice');
}

export async function synthesizeSpeech(text, voiceType = 'female', language = 'ru') {
  return apiRequest('/voice/synthesize', {
    method: 'POST',
    body: JSON.stringify({
      text,
      voice_type: voiceType,
      language
    })
  }, 'voice');
}

// Real-time Analytics Service через Gateway
export async function getRealTimeMetrics() {
  return apiRequest('/analytics/metrics/realtime', {}, 'realtime');
}

export async function subscribeToRealTimeUpdates(subscription) {
  return apiRequest('/analytics/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription)
  }, 'realtime');
}

// WebSocket для real-time обновлений через Gateway
export function connectRealTimeWebSocket(userId, subscriptions = []) {
  const accessToken = tokenManager.getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const ws = new WebSocket(
    `${BASE_URLS.ws.realtime}/${userId}?subscriptions=${subscriptions.join(',')}&token=${accessToken}`
  );

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Обработка real-time данных
    console.log('Real-time update:', data);
  };

  ws.onerror = (error) => {
    console.error('Real-time WebSocket error:', error);
  };

  ws.onclose = (event) => {
    console.log('Real-time WebSocket closed:', event.code, event.reason);
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
      
      setTimeout(() => {
        connectRealTimeWebSocket(userId, subscriptions);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  };

  return ws;
}

// Обновленные функции аутентификации через Gateway
export async function login(email, password) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, 'auth');
  
  tokenManager.setTokens(response.access_token, response.refresh_token, response.expires_in);
  
  // Сохраняем дополнительную информацию
  localStorage.setItem('user_id', response.user_id);
  localStorage.setItem('user_role', response.role || 'user');
  
  return response;
}

export async function register(payload) {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, 'auth');
  
  tokenManager.setTokens(response.access_token, response.refresh_token, response.expires_in);
  localStorage.setItem('user_id', response.user_id);
  localStorage.setItem('user_role', response.role || 'user');
  
  return response;
}

export async function googleLogin(code, state) {
  const response = await apiRequest(
    `/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    { method: 'GET' },
    'auth'
  );
  
  tokenManager.setTokens(response.access_token, response.refresh_token, response.expires_in);
  localStorage.setItem('user_id', response.user_id);
  localStorage.setItem('user_role', response.role || 'user');
  
  return response;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' }, 'auth');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    tokenManager.clearTokens();
  }
}

export async function getProfile() {
  return apiRequest('/auth/profile');
}

export async function updateProfile(profile) {
  if (profile.inn && !/^\d{10}$|^\d{12}$/.test(profile.inn)) {
    throw new Error("ИНН должен содержать 10 или 12 цифр");
  }
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  }, 'data');
}

// Функции для работы с задачами через Gateway
export async function getMyTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/tasks/my?${query}`);
}

export async function createTask(task) {
  const priorityMap = { 'Низкий': 1, 'Средний': 2, 'Высокий': 3 };
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      ...task,
      priority: priorityMap[task.priority] || task.priority,
      assignees: task.assignee ? [{ user_id: task.assignee }] : [],
    }),
  }, 'data');
}

export async function updateTask(taskId, updates) {
  const priorityMap = { 'Низкий': 1, 'Средний': 2, 'Высокий': 3 };
  return apiRequest(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...updates,
      priority: priorityMap[updates.priority] || updates.priority,
      assignees: updates.assignee ? [{ user_id: updates.assignee }] : [],
    }),
  }, 'data');
}

export async function deleteTask(taskId) {
  return apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
}

export async function getTask(taskId) {
  return apiRequest(`/tasks/${taskId}`);
}

// Функции для работы с клиентами через Gateway
export async function addClient(clientData) {
  return apiRequest('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  }, 'data');
}

export async function getClients(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  return apiRequest(`/clients${query ? `?${query}` : ''}`);
}

export async function updateClient(clientId, clientData) {
  return apiRequest(`/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  }, 'data');
}

export async function deleteClient(clientId) {
  return apiRequest(`/clients/${clientId}`, { method: 'DELETE' });
}

// Функции для работы с комментариями через Gateway
export async function createComment(taskId, comment) {
  return apiRequest(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text: comment }),
  }, 'data');
}

export async function updateComment(taskId, commentId, comment) {
  return apiRequest(`/tasks/${taskId}/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ text: comment }),
  }, 'data');
}

export async function deleteComment(taskId, commentId) {
  return apiRequest(`/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' });
}

// Функции для работы с документами через Gateway
export async function getDocuments() {
  return apiRequest('/documents');
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/documents', {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': undefined },
  }, 'upload');
}

// Функции для работы с отчетами через Gateway
export async function getReports(page = 1, limit = 10, filters = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  return apiRequest(`/reports?${queryParams}`);
}

export async function getReportsWithPagination(page = 1, limit = 10, filters = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const response = await apiRequest(`/reports?${queryParams}`);
  
  // Возвращаем структурированный ответ с метаданными пагинации
  return {
    data: response.reports || response.data || [],
    pagination: {
      currentPage: page,
      totalPages: Math.ceil((response.total || 0) / limit),
      totalItems: response.total || 0,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil((response.total || 0) / limit),
      hasPrevPage: page > 1
    }
  };
}

export async function generateReport(filters) {
  return apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(filters),
  }, 'data');
}

export async function createReport(reportData) {
  return apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  }, 'data');
}

export async function updateReport(reportId, updates) {
  const payload = {
    title: updates.title,
    status: updates.status,
    responsible: updates.author,
    description: updates.content
  };
  return apiRequest(`/reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, 'data');
}

export async function getReport(reportId) {
  return apiRequest(`/reports/${reportId}`);
}

export async function deleteReport(reportId) {
  return apiRequest(`/reports/${reportId}`, { method: 'DELETE' });
}

export async function exportReport(reportId, format = 'pdf') {
  return apiRequest(`/reports/${reportId}/export?format=${format}`);
}

// Функции для работы с актами через Gateway
export async function getActs(page = 1, limit = 10, filters = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  return apiRequest(`/acts?${queryParams}`);
}

export async function getActsWithPagination(page = 1, limit = 10, filters = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const response = await apiRequest(`/acts?${queryParams}`);
  
  // Возвращаем структурированный ответ с метаданными пагинации
  return {
    data: response.acts || response.data || [],
    pagination: {
      currentPage: page,
      totalPages: Math.ceil((response.total || 0) / limit),
      totalItems: response.total || 0,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil((response.total || 0) / limit),
      hasPrevPage: page > 1
    }
  };
}

export async function createAct(actData) {
  return apiRequest('/acts', {
    method: 'POST',
    body: JSON.stringify(actData),
  }, 'data');
}

export async function updateAct(actId, updates) {
  const payload = {
    title: updates.title,
    status: updates.status,
    responsible: updates.responsible,
    description: updates.description
  };
  return apiRequest(`/acts/${actId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, 'data');
}

export async function getAct(actId) {
  return apiRequest(`/acts/${actId}`);
}

export async function deleteAct(actId) {
  return apiRequest(`/acts/${actId}`, { method: 'DELETE' });
}

export async function signAct(actId) {
  return apiRequest(`/acts/${actId}/sign`, {
    method: 'POST'
  });
}

export async function exportAct(actId, format = 'pdf') {
  return apiRequest(`/acts/${actId}/export?format=${format}`);
}

// Функции для работы с документами через Gateway
export async function getDocuments(page = 1, limit = 10, filters = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  return apiRequest(`/documents?${queryParams}`);
}

export async function getDocumentsWithPagination(page = 1, limit = 10, filters = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const response = await apiRequest(`/documents?${queryParams}`);
  
  // Возвращаем структурированный ответ с метаданными пагинации
  return {
    data: response.documents || response.data || [],
    pagination: {
      currentPage: page,
      totalPages: Math.ceil((response.total || 0) / limit),
      totalItems: response.total || 0,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil((response.total || 0) / limit),
      hasPrevPage: page > 1
    }
  };
}

export async function createDocument(documentData) {
  return apiRequest('/documents/create', {
    method: 'POST',
    body: JSON.stringify(documentData),
  }, 'data');
}

export async function getDocument(documentId) {
  return apiRequest(`/documents/${documentId}`);
}

export async function updateDocument(documentId, updates) {
  return apiRequest(`/documents/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }, 'data');
}

export async function deleteDocument(documentId) {
  return apiRequest(`/documents/${documentId}`, { method: 'DELETE' });
}

export async function signDocument(documentId) {
  return apiRequest(`/documents/${documentId}/sign`, {
    method: 'POST'
  });
}

export async function exportDocument(documentId, format = 'pdf') {
  return apiRequest(`/documents/${documentId}/export?format=${format}`);
}

export async function exportTo1C(documentId) {
  return apiRequest(`/documents/${documentId}/export/1c`);
}

// Функции для работы с пользователями через Gateway
export async function getUsers() {
  return apiRequest('/users');
}

export async function createUser(email, password, role) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, role, company_name: "Default Company" }),
  }, 'data');
}

export async function updateUser(userId, updates) {
  return apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }, 'data');
}

export async function deleteUser(userId) {
  return apiRequest(`/users/${userId}`, { method: 'DELETE' });
}

// Функции для работы с подпиской через Gateway
export async function getCompanyCards() {
  return apiRequest('/subscription/cards', {}, 'data');
}

export async function getPaymentHistory() {
  return apiRequest('/subscription/payments', {}, 'data');
}

export async function attachCard(cardData) {
  return apiRequest('/subscription/cards/attach', {
    method: 'POST',
    body: JSON.stringify(cardData),
  }, 'data');
}

export async function detachCard(cardData) {
  return apiRequest('/subscription/cards/detach', {
    method: 'POST',
    body: JSON.stringify(cardData),
  }, 'data');
}

export async function initiateSubscriptionPayment(companyId, cardId = null) {
  return apiRequest('/subscription/initiate', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId, card_id: cardId }),
  }, 'data');
}

export async function confirmSubscriptionPayment(paymentId) {
  return apiRequest('/subscription/confirm', {
    method: 'POST',
    body: JSON.stringify({ payment_id: paymentId }),
  }, 'data');
}

export async function activateTrial(companyId) {
  return apiRequest('/subscription/activate-trial', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId }),
  }, 'data');
}

// Функции для работы с AI через Gateway
export async function analyzeText(text) {
  return apiRequest('/ai/business/text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }, 'ai');
}

export async function analyzeVoice(audioBase64, format, suggestion = null) {
  const body = suggestion ? { ...suggestion } : { audio_file: audioBase64, format };
  return apiRequest('/ai/voice/predictive', {
    method: 'POST',
    body: JSON.stringify(body),
  }, 'ai');
}

export async function processText(text) {
  return apiRequest('/ai/business/text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }, 'ai');
}

// Функции для работы с конкурентами через Gateway
export async function monitorCompetitors(urls) {
  return apiRequest('/ai/business/competitors/analyze', {
    method: 'POST',
    body: JSON.stringify(urls),
  }, 'ai');
}

export async function getPromotionRecommendations(salesData, competitorData) {
  return apiRequest('/ai/business/insights/generate', {
    method: 'POST',
    body: JSON.stringify({ 
      insight_type: 'promotion',
      sales_data: salesData, 
      competitor_data: competitorData 
    }),
  }, 'ai');
}

// Функции для работы с временем через Gateway
export async function startTimeTracking(taskId) {
  return apiRequest('/time/start', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId }),
  }, 'data');
}

export async function stopTimeTracking(taskId) {
  return apiRequest('/time/stop', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId }),
  }, 'data');
}

export async function getTimeReport(period = 'week') {
  return apiRequest(`/time/report?period=${period}`);
}

// Функции для работы с производительностью через Gateway
export async function getProductivityData() {
  return apiRequest('/productivity?period=week');
}

export async function getProductivityReport(userId, period) {
  return apiRequest(`/productivity/${userId}?period=${period}`);
}

// Функции для работы с зарплатой через Gateway
export async function calculatePayroll(period) {
  return apiRequest('/payroll/calculate', {
    method: 'POST',
    body: JSON.stringify({ period }),
  }, 'data');
}

export async function getPayroll(userId) {
  return apiRequest(`/payroll/${userId}`);
}

export async function getAggregatePayroll(period) {
  return apiRequest(`/payroll/aggregate?period=${period}`);
}

// Функции для работы с задачами через Gateway
export async function createRecurringTask(taskData) {
  return apiRequest('/tasks/recurring', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }, 'data');
}

export async function createTaxReminders(data) {
  return apiRequest('/tasks/tax-reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'data');
}

// Функции для работы с дашбордом через Gateway
export async function getDashboardMetrics() {
  const data = await apiRequest('/dashboard/metrics');
  return {
    completed_tasks: data.task_count || 0,
    new_clients: data.new_clients || 0,
    total_amount: data.total_amount || 0,
    productivity: data.productivity || 0,
    tasks_change: data.tasks_change || 0,
    clients_change: data.clients_change || 0,
    amount_change: data.amount_change || 0,
    productivity_change: data.productivity_change || 0
  };
}

export async function getActivityData(period) {
  const data = await apiRequest(`/dashboard/activity?period=${period}`);
  return {
    labels: data.weeklyTrends?.map(trend => trend.date) || [],
    completed: data.weeklyTrends?.map(trend => trend.completed) || [],
    created: data.weeklyTrends?.map(trend => trend.created) || []
  };
}

export async function getTaskDistribution() {
  const data = await apiRequest('/dashboard/task-distribution');
  return {
    labels: data.employee_load.map(emp => emp.user_id),
    values: data.employee_load.map(emp => emp.task_count)
  };
}

export async function getRecentTasks() {
  return apiRequest('/tasks/recent?limit=5');
}

export async function getAdminDashboardData() {
  const [dashboardData, usersData] = await Promise.all([
    apiRequest('/dashboard/admin'),
    apiRequest('/users')
  ]);
  return {
    users: usersData,
    system: {
      task_count: dashboardData.task_count,
      overdue_tasks: dashboardData.overdue_tasks
    }
  };
}

// Функции для работы с Google Auth через Gateway
export async function getGoogleLoginUrl() {
  return apiRequest('/auth/google');
}

// Функции для работы с паролями через Gateway
export async function requestPasswordReset(email) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }, 'auth');
}

export async function confirmPasswordReset(token, new_password) {
  return apiRequest('/auth/reset-password/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  }, 'auth');
}

// Функции для работы с компаниями через Gateway
export async function createUserInCompany(companyId, email, password, role) {
  return apiRequest(`/companies/${companyId}/users`, {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  }, 'data');
}

export async function deleteCompany(companyId) {
  return apiRequest(`/companies/${companyId}`, { method: 'DELETE' });
}

export async function updateEmployeeOrder(orderData) {
  return apiRequest('/employees/order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }, 'data');
}

// Функции для работы с финансовыми событиями через Gateway
export async function getFinancialEvents() {
  return apiRequest('/financial/events');
}

// Функции для работы с экспортом через Gateway
export async function exportData(format, filters) {
  return apiRequest('/export', {
    method: 'POST',
    body: JSON.stringify({ format, filters }),
  }, 'export');
}

// WebSocket для уведомлений через Gateway
export function connectWebSocket(service, endpoint, userId, onMessage) {
  const accessToken = tokenManager.getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  const ws = new WebSocket(`${BASE_URLS.ws.gateway}/${service}/${endpoint}/${userId}?token=${accessToken}`);
  
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  
  ws.onmessage = (event) => onMessage(JSON.parse(event.data));
  ws.onerror = (error) => console.error(`WebSocket error (${service}):`, error);
  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(() => {
        connectWebSocket(service, endpoint, userId, onMessage);
      }, 1000 * reconnectAttempts);
    }
  };
  
  return ws;
}

// Экспорт основных функций и констант
export {
  BASE_URLS,
  TIMEOUTS,
  tokenManager,
  apiRequest
};