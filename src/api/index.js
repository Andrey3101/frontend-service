const BASE_URLS = {
  tasks: 'http://localhost:8000',        // task-service
  auth: 'http://localhost:8000',         // auth-service
  ai: 'http://localhost:8002',           // ai-service
  notifications: 'http://localhost:8003' // notification-service
};

let csrfToken = localStorage.getItem('csrf_token') || '';

export async function login(email, password) {
  const response = await fetch(`${AUTHURL}/login`, {
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
  const response = await fetch(`${AUTHURL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error('Ошибка запроса сброса пароля');
  return response.json();
}

// Новая функция для подтверждения сброса пароля
export async function confirmPasswordReset(token, new_password) {
  const response = await fetch(`${AUTHURL}/reset-password/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });
  if (!response.ok) throw new Error('Ошибка подтверждения сброса пароля');
  return response.json();
}

export async function getDashboard() {
  const response = await fetchWithCsrf(`${DocumentURL}/report?period=week`); // Исправлено на DocumentURL
  return response.json();
}

export async function logoutUser() {
  const response = await fetchWithCsrf(`${AUTHURL}/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  localStorage.removeItem('token');
  localStorage.removeItem('csrf_token');
  localStorage.removeItem('user_id');
  return response.json();
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
  const response = await fetchWithCsrf(`${AUTHURL}/profile`);
  return response.json();
}

export async function updateProfile(profile) {
  if (profile.inn && !/^\d{10}$|^\d{12}$/.test(profile.inn)) {
    throw new Error("ИНН должен содержать 10 или 12 цифр");
  }
  const response = await fetchWithCsrf(`${AUTHURL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  return response.json();
}

export async function getMyTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchWithCsrf(`${BASE_URLS.tasks}/tasks/my?${query}`);
}

export async function createTask(task) {
  const response = await fetchWithCsrf(`${TasksURL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return response.json();
}

export async function analyzeText(text) {
  const response = await fetchWithCsrf(`${BASE_URLS.ai}/ai/analyze`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return response.json();
}

export async function getDocuments() {
  const response = await fetchWithCsrf(`${BASE_URLS.documents}/documents`);
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetchWithCsrf(`${BASE_URLS.documents}/documents`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': undefined }, // FormData сам установит заголовок
  });
  return response.json();
}

export async function updateTask(taskId, updates) {
  const response = await fetchWithCsrf(`${TasksURL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
}

export async function updateReport(reportId, updates) {
  const response = await fetchWithCsrf(`${DocumentURL}/reports/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
}

export async function deleteTask(taskId) {
  const response = await fetchWithCsrf(`${TasksURL}/tasks/${taskId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getTask(taskId) {
  const response = await fetchWithCsrf(`${TasksURL}/tasks/${taskId}`);
  return response.json();
}

export async function createComment(taskId, comment) {
  const response = await fetchWithCsrf(`${TasksURL}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: comment }),
  });
  return response.json();
}

export async function updateComment(taskId, commentId, comment) {
  const response = await fetchWithCsrf(`${TasksURL}/tasks/${taskId}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: comment }),
  });
  return response.json();
}

export async function deleteComment(taskId, commentId) {
  const response = await fetchWithCsrf(`${TasksURL}/tasks/${taskId}/comments/${commentId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function processVoice(audioBase64, format, suggestion = null) {
  const body = suggestion ? { ...suggestion } : { audio_file: audioBase64, format };
  const response = await fetchWithCsrf(`${AISERVICE}/ai/voice/predictive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function processText(text) {
  const response = await fetchWithCsrf(`${AISERVICE}/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return response.json();
}

export async function getActs() {
  const response = await fetchWithCsrf(`${DocumentURL}/acts`);
  return response.json();
}

export async function updateAct(actId, updates) {
  const response = await fetchWithCsrf(`${DocumentURL}/acts/${actId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
}

export async function getAct(actId) {
  const response = await fetchWithCsrf(`${DocumentURL}/acts/${actId}`);
  return response.json();
}

export async function getUsers() {
  const response = await fetchWithCsrf(`${AUTHURL}/users`);
  return response.json();
}

export async function checkEmailUnique(email) {
  const response = await fetchWithCsrf(`${AUTHURL}/users/check-email?email=${encodeURIComponent(email)}`);
  return response.json();
}

export async function createUser(email, password, role) {
  const response = await fetchWithCsrf(`${AUTHURL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role, company_name: "Default Company" }),
  });
  return response.json();
}

export async function updateUser(userId, updates) {
  const response = await fetchWithCsrf(`${AUTHURL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
}

export async function deleteUser(userId) {
  const response = await fetchWithCsrf(`${AUTHURL}/users/${userId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function generateReport(filters) {
  const response = await fetchWithCsrf(`${DocumentURL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  return response.json();
}

export async function getReports() {
  const response = await fetchWithCsrf(`${DocumentURL}/reports`);
  return response.json();
}

export async function updateEmployeeOrder(orderData) {
  const response = await fetchWithCsrf(`${AUTHURL}/employees/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return response.json();
}

export async function deleteCompany(companyId) {
  const response = await fetchWithCsrf(`${AUTHURL}/companies/${companyId}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getTasks() {
  const response = await fetchWithCsrf(`${TasksURL}/tasks/stats`);
  return response.json();
}

export async function getTask(id) {
  const response = await fetchWithCsrf(`${BASE_URLS.tasks}/tasks/${id}`);
  return response.json();
}

export async function getFinancialEvents() {
  const response = await fetchWithCsrf(`${TasksURL}/financial-events`);
  return response.json();
}

export async function startTimeTracking(taskId) {
  const response = await fetchWithCsrf(`${TasksURL}/time/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId }),
  });
  return response.json();
}

export async function stopTimeTracking(taskId) {
  const response = await fetchWithCsrf(`${TasksURL}/time/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId }),
  });
  return response.json();
}

export async function getTimeReport(period = 'week') {
  const response = await fetchWithCsrf(`${DocumentURL}/time-report?period=${period}`);
  return response.json();
}