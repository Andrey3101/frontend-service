// api/index.js
const TasksURL = "http://localhost:8000"; // Проверить порт Tasks-service
const DocumentURL = "http://localhost:5001"; // Исправлено для Documents-service
const AUTHURL = "http://localhost:8000"; // Порт Auth-service (FastAPI по умолчанию 8000)
const AISERVICE = "http://localhost:8002"; // Проверить порт AI-service
const NOTIFICATIONURL = "http://localhost:8003";
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
  const headers = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'X-CSRF-Token': csrfToken,
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`Ошибка: ${response.statusText || response.status}`);
  return response;
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

export async function logoutUser(token) {
  const response = await fetchWithCsrf(`${AUTHURL}/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token)
  });
  return response.json();
}

export function connectWebSocket(userId) {
  const token = localStorage.getItem('token');
  const ws = new WebSocket(`${NOTIFICATIONURL.replace('http', 'ws')}/notifications/ws/${userId}?token=${token}`);
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

export async function getMyTasks() {
  const response = await fetchWithCsrf(`${TasksURL}/tasks/my`);
  return response.json();
}

export async function createTask(task) {
  const response = await fetchWithCsrf(`${TasksURL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
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