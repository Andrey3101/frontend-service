const BASE_URLS = {
  tasks: 'http://localhost:8000',        // task-service
  auth: 'http://localhost:8000',         // auth-service
  ai: 'http://localhost:8002',           // ai-service
  notifications: 'http://localhost:8003' // notification-service
};

let csrfToken = localStorage.getItem('csrf_token') || '';

export async function login(email, password) {
  const response = await fetch(`${BASE_URLS.auth}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  const data = await response.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('csrf_token', data.csrf_token);
  localStorage.setItem('user_id', data.user_id);
  csrfToken = data.csrf_token;
  return data;
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

// Новая функция для запроса сброса пароля
export async function requestPasswordReset(email) {
  const response = await fetch(`${BASE_URLS.auth}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error('Ошибка запроса сброса пароля');
  return response.json();
}

// Новая функция для подтверждения сброса пароля
export async function confirmPasswordReset(token, new_password) {
  const response = await fetch(`${BASE_URLS.auth}/reset-password/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });
  if (!response.ok) throw new Error('Ошибка подтверждения сброса пароля');
  return response.json();
}

export async function getDashboard() {
  return fetchWithCsrf(`${BASE_URLS.tasks}/report?period=week`);
}

export async function logoutUser() {
  const response = await fetchWithCsrf(`${BASE_URLS.auth}/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  localStorage.removeItem('token');
  localStorage.removeItem('csrf_token');
  localStorage.removeItem('user_id');
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
  return fetchWithCsrf(`${BASE_URLS.auth}/profile`);
}

export async function updateProfile(profile) {
  if (profile.inn && !/^\d{10}$|^\d{12}$/.test(profile.inn)) {
    throw new Error("ИНН должен содержать 10 или 12 цифр");
  }
  return fetchWithCsrf(`${BASE_URLS.auth}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}

export async function getMyTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/my?${query}`);
}

export async function createTask(task) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
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
    headers: { 'Content-Type': undefined }, // FormData сам установит заголовок
  });
}

export async function updateTask(taskId, updates) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function updateReport(reportId, updates) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/reports/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(taskId) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export async function getTask(taskId) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${taskId}`);
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
  return fetchWithCsrf(`${BASE_URLS.ai}/ai/voice/predictive`, {
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
  return fetchWithCsrf(`${BASE_URLS.tasks}/acts/${actId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function getAct(actId) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/acts/${actId}`);
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

// Новая функция для создания повторяющихся задач
export async function createRecurringTask(taskData) {
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/recurring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
}

// Новая функция для создания напоминаний о налогах
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