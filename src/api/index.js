const TasksURL = "http://localhost:8000";
const DocumentURL = "http://localhost:8000";
const AUTHURL = "http://localhost:8000";
const AISERVICE = "http://localhost:8000";
let csrfToken = localStorage.getItem('csrf_token') || '';

export async function login(email, password) {
  const response = await fetch(`${AUTHURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  const data = await response.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('csrf_token', data.csrf_token);
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

export async function getDashboard() {
  const response = await fetchWithCsrf(`http://localhost:8001/report?period=week`);
  return response.json();
}

export async function getProfile() {
  const response = await fetchWithCsrf(`${AUTHURL}/auth/profile`);
  return response.json();
}

export async function updateProfile(profile) {
  if (profile.inn && !/^\d{10}$|^\d{12}$/.test(profile.inn)) {
    throw new Error("ИНН должен содержать 10 или 12 цифр");
  }
  const response = await fetchWithCsrf(`${AUTHURL}/auth/profile`, {
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
  const response = await fetchWithCsrf(`${AUTHURL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
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
  
  export async function getTasks() {
    const response = await fetchWithCsrf(`${TasksURL}/tasks/stats`);
    return response.json();
  }