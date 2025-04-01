const BASE_URLS = {
  tasks: 'http://localhost:5001',
  auth: 'http://localhost:8000',
  ai: 'http://localhost:8002',
  notifications: 'http://localhost:8003'
};

const TIMEOUTS = {
  default: 10000,
  login: 5000,
  register: 15000,
  googleAuth: 8000,
  googleCallback: 12000,
};

async function fetchWithTimeout(url, options = {}, timeoutKey = 'default') {
  const timeout = TIMEOUTS[timeoutKey] || TIMEOUTS.default;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const token = localStorage.getItem('token');
  const csrfToken = localStorage.getItem('csrf_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Ошибка ${response.status}: ${errorText || response.statusText}`);
      error.response = { status: response.status, data: { detail: errorText } };
      throw error;
    }
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Fetch error (timeout: ${timeout}ms):`, error);
    throw error;
  }
}

export async function login(email, password) {
  const response = await fetchWithTimeout(`${BASE_URLS.auth}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, 'login');
  localStorage.setItem('token', response.token);
  localStorage.setItem('csrf_token', response.csrf_token);
  localStorage.setItem('user_id', response.user_id);
  const profile = await getProfile();
  localStorage.setItem('user_role', profile.role);
  return response;
}

export async function getGoogleLoginUrl() {
  return fetchWithTimeout(`${BASE_URLS.auth}/auth/google`);
}

export async function googleCallback(code, state) {
  const response = await fetchWithTimeout(
    `${BASE_URLS.auth}/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    { method: 'GET' },
    'googleCallback'
  );
  localStorage.setItem('token', response.token);
  localStorage.setItem('csrf_token', response.csrf_token);
  localStorage.setItem('user_id', response.user_id);
  const profile = await getProfile();
  localStorage.setItem('user_role', profile.role);
  return response;
}

async function fetchWithCsrf(url, options = {}) {
  const token = localStorage.getItem('token');
  const csrfToken = localStorage.getItem('csrf_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка ${response.status}: ${errorText || response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function requestPasswordReset(email) {
  return fetchWithTimeout(`${BASE_URLS.auth}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  }, 'default');
}

export async function getDashboardMetrics() {
  // Используем GET /tasks/dashboard как источник метрик
  const data = await fetchWithCsrf(`${BASE_URLS.tasks}/dashboard`);
  // Преобразуем данные бэкенда в ожидаемый формат фронтенда
  return {
    completed_tasks: data.task_count || 0, // Предполагаем, что task_count включает завершенные задачи
    new_clients: 0, // Нет данных в текущем эндпоинте, временно 0
    total_amount: 0, // Нет данных, временно 0
    productivity: 0, // Нет данных, временно 0
    tasks_change: 0, // Нет данных об изменении, временно 0
    clients_change: 0,
    amount_change: 0,
    productivity_change: 0
  };
}

export async function getActivityData(period) {
  // Используем GET /tasks/task для статистики активности
  const data = await fetchWithCsrf(`${BASE_URLS.tasks}/task?period=${period}`);
  // Преобразуем данные в формат для графика
  return {
    labels: data.weeklyTrends?.map(trend => trend.date) || [], // Предполагаем, что weeklyTrends доступен
    completed: data.weeklyTrends?.map(trend => trend.completed) || [],
    created: data.weeklyTrends?.map(trend => trend.created) || []
  };
}

export async function getTaskDistribution() {
  // Используем GET /tasks/dashboard для распределения задач по сотрудникам
  const data = await fetchWithCsrf(`${BASE_URLS.tasks}/dashboard`);
  // Преобразуем employee_load в формат для круговой диаграммы
  return {
    labels: data.employee_load.map(emp => emp.user_id),
    values: data.employee_load.map(emp => emp.task_count)
  };
}

export async function getProductivityData() {
  // Используем GET /tasks/productivity с периодом week
  const data = await fetchWithCsrf(`${BASE_URLS.tasks}/productivity?period=week`);
  // Преобразуем данные в формат для линейного графика
  const labels = Object.keys(data.task_times || {});
  const values = Object.values(data.task_times || {});
  return {
    labels,
    values
  };
}

export async function getRecentTasks() {
  // Используем GET /tasks/my с лимитом для получения последних задач
  return fetchWithCsrf(`${BASE_URLS.tasks}/my?limit=5`);
}

export async function getAdminDashboardData() {
  // Комбинируем данные из /tasks/dashboard и /tasks/users
  const [dashboardData, usersData] = await Promise.all([
    fetchWithCsrf(`${BASE_URLS.tasks}/dashboard`),
    fetchWithCsrf(`${BASE_URLS.tasks}/users`)
  ]);
  return {
    users: usersData,
    system: {
      task_count: dashboardData.task_count,
      overdue_tasks: dashboardData.overdue_tasks
    }
  };
}

export async function confirmPasswordReset(token, new_password) {
  return fetchWithTimeout(`${BASE_URLS.auth}/reset-password/confirm`, {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  }, 'default');
}

export async function getDashboard() {
  return fetchWithCsrf(`${BASE_URLS.tasks}/report?period=week`);
}

export async function logoutUser() {
  const response = await fetchWithTimeout(`${BASE_URLS.auth}/logout`, {
    method: 'POST',
  }, 'default');
  localStorage.removeItem('token');
  localStorage.removeItem('csrf_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_role');
  return response;
}

export async function analyzeVoice(data) {
  return fetchWithCsrf(`${BASE_URLS.ai}/voice`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function connectWebSocket(service, endpoint, userId, onMessage) {
  if (!BASE_URLS[service]) throw new Error(`Unknown service: ${service}`);
  const token = localStorage.getItem('token');
  const ws = new WebSocket(`ws://${BASE_URLS[service]}/${endpoint}/${userId}?token=${token}`);
  ws.onmessage = (event) => onMessage(JSON.parse(event.data));
  ws.onerror = (error) => console.error(`WebSocket error (${service}):`, error);
  return ws;
}

export async function getProfile() {
  return fetchWithTimeout(`${BASE_URLS.auth}/profile`, {}, 'default');
}

export async function createUserInCompany(companyId, email, password, role) {
  return fetchWithTimeout(`${BASE_URLS.auth}/companies/${companyId}/users`, {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  }, 'default');
}

export async function updateProfile(profile) {
  if (profile.inn && !/^\d{10}$|^\d{12}$/.test(profile.inn)) {
    throw new Error("ИНН должен содержать 10 или 12 цифр");
  }
  return fetchWithTimeout(`${BASE_URLS.auth}/profile`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  }, 'default');
}

export async function getMyTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/my?${query}`);
}

export async function createTask(task) {
  const priorityMap = { 'Низкий': 1, 'Средний': 2, 'Высокий': 3 };
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      ...task,
      priority: priorityMap[task.priority] || task.priority,
      assignees: task.assignee ? [{ user_id: task.assignee }] : [],
    }),
  });
}

export async function analyzeText(text) {
  return fetchWithCsrf(`${BASE_URLS.ai}/ai/analyze`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function getDocuments() {
  return fetchWithCsrf(`${BASE_URLS.tasks}/documents`);
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetchWithCsrf(`${BASE_URLS.tasks}/documents`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': undefined },
  });
}

export async function updateTask(taskId, updates) {
  const priorityMap = { 'Низкий': 1, 'Средний': 2, 'Высокий': 3 };
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...updates,
      priority: priorityMap[updates.priority] || updates.priority,
      assignees: updates.assignee ? [{ user_id: updates.assignee }] : [],
    }),
  });
}

export async function updateReport(reportId, updates) {
  const payload = {
    title: updates.title,
    status: updates.status,
    responsible: updates.author,
    description: updates.content
  };
  return fetchWithCsrf(`${BASE_URLS.tasks}/documents/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getReport(reportId) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/documents/${reportId}`);
}

export async function deleteTask(taskId) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export async function getTask(taskId) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}`);
}

export async function addClient(clientData) {
  return fetchWithCsrf(`${BASE_URLS.auth}/clients`, {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
}

export async function getClients(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  return fetchWithCsrf(`${BASE_URLS.auth}/clients${query ? `?${query}` : ''}`);
}

export async function updateClient(clientId, clientData) {
  return fetchWithCsrf(`${BASE_URLS.auth}/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  });
}

export async function deleteClient(clientId) {
  return fetchWithCsrf(`${BASE_URLS.auth}/clients/${clientId}`, {
    method: 'DELETE',
  });
}

export async function createComment(taskId, comment) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: comment }),
  });
}

export async function updateComment(taskId, commentId, comment) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: comment }),
  });
}

export async function deleteComment(taskId, commentId) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

export async function processVoice(audioBase64, format, suggestion = null) {
  const body = suggestion ? { ...suggestion } : { audio_file: audioBase64, format };
  return fetchWithCsrf(`${BASE_URLS.ai}/voice/predictive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function processText(text) {
  return fetchWithCsrf(`${BASE_URLS.ai}/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function getActs() {
  return fetchWithCsrf(`${BASE_URLS.tasks}/acts`);
}

export async function updateAct(actId, updates) {
  const payload = {
    title: updates.title,
    status: updates.status,
    responsible: updates.responsible,
    description: updates.description
  };
  return fetchWithCsrf(`${BASE_URLS.tasks}/documents/${actId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getAct(actId) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/documents/${actId}`);
}

export async function getUsers() {
  return fetchWithCsrf(`${BASE_URLS.auth}/users`);
}

export async function checkEmailUnique(email) {
  return fetchWithCsrf(`${BASE_URLS.auth}/users/check-email?email=${encodeURIComponent(email)}`);
}

export async function createUser(email, password, role) {
  return fetchWithCsrf(`${BASE_URLS.auth}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role, company_name: "Default Company" }),
  });
}

export async function updateUser(userId, updates) {
  return fetchWithCsrf(`${BASE_URLS.auth}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteUser(userId) {
  return fetchWithCsrf(`${BASE_URLS.auth}/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function generateReport(filters) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
}

export async function getReports() {
  return fetchWithCsrf(`${BASE_URLS.tasks}/reports`);
}

export async function updateEmployeeOrder(orderData) {
  return fetchWithCsrf(`${BASE_URLS.auth}/employees/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
}

export async function deleteCompany(companyId) {
  return fetchWithCsrf(`${BASE_URLS.auth}/companies/${companyId}`, {
    method: 'DELETE',
  });
}

export async function getTasks() {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/stats`);
}

export async function getFinancialEvents() {
  return fetchWithCsrf(`${BASE_URLS.tasks}/financial-events`);
}

export async function calculatePayroll(period) {
  return fetchWithCsrf(`${BASE_URLS.auth}/payroll/calculate`, {
    method: 'POST',
    body: JSON.stringify({ period }),
  });
}

export async function getPayroll(userId) {
  return fetchWithCsrf(`${BASE_URLS.auth}/payroll/${userId}`);
}

export async function createRecurringTask(taskData) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/recurring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
}

export async function createTaxReminders(data) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/tax-reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function startTimeTracking(taskId) {
  return fetchWithCsrf(`${BASE_URLS.auth}/time/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId }),
  });
}

export async function stopTimeTracking(taskId) {
  return fetchWithCsrf(`${BASE_URLS.auth}/time/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId }),
  });
}

export async function getTimeReport(period = 'week') {
  return fetchWithCsrf(`${BASE_URLS.tasks}/time-report?period=${period}`);
}

export async function monitorCompetitors(urls) {
  return fetchWithCsrf(`${BASE_URLS.ai}/competitors/monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(urls),
  });
}

export async function getPromotionRecommendations(salesData, competitorData) {
  return fetchWithCsrf(`${BASE_URLS.ai}/promotion/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sales_data: salesData, competitor_data: competitorData }),
  });
}

export async function getAggregatePayroll(period) {
  return fetchWithCsrf(`${BASE_URLS.auth}/payroll/aggregate?period=${period}`);
}

export async function getProductivityReport(userId, period) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/productivity/${userId}?period=${period}`);
}

export {
  BASE_URLS,
  fetchWithTimeout,
  fetchWithCsrf,
};