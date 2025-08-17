// API конфигурация
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Основная функция для API запросов
async function apiRequest(endpoint, options = {}, service = 'gateway') {
  const url = service === 'gateway' ? `${API_BASE_URL}${endpoint}` : endpoint;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Функции для работы с аутентификацией через Gateway
export async function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }, 'auth');
}

export async function register(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }, 'auth');
}

export async function refreshToken(refreshToken) {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  }, 'auth');
}

export async function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  }, 'auth');
}

export async function getProfile() {
  return apiRequest('/auth/profile');
}

export async function updateProfile(profileData) {
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }, 'auth');
}

// Функции для работы с пользователями через Gateway
export async function getUsers(page = 1, limit = 50, role = null, companyId = null) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (role) params.append('role', role);
  if (companyId) params.append('company_id', companyId);
  
  return apiRequest(`/users?${params}`);
}

export async function createUser(userData) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }, 'auth');
}

export async function updateUser(userId, userData) {
  return apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }, 'auth');
}

export async function deleteUser(userId) {
  return apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  }, 'auth');
}

export async function createUserInCompany(companyId, userData) {
  return apiRequest(`/companies/${companyId}/users`, {
    method: 'POST',
    body: JSON.stringify(userData),
  }, 'auth');
}

// Функции для работы с задачами через Gateway
export async function getTasks(page = 1, limit = 50, status = null, priority = null) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  
  return apiRequest(`/tasks?${params}`);
}

// Алиас для совместимости с существующими компонентами
export async function getMyTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/tasks/my?${query}`);
}

export async function getTask(taskId) {
  return apiRequest(`/tasks/${taskId}`);
}

export async function createTask(taskData) {
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }, 'tasks');
}

export async function updateTask(taskId, taskData) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }, 'tasks');
}

export async function deleteTask(taskId) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE',
  }, 'tasks');
}

export async function getTaskComments(taskId) {
  return apiRequest(`/tasks/${taskId}/comments`);
}

export async function addTaskComment(taskId, commentData) {
  return apiRequest(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  }, 'tasks');
}

// Функции для работы с клиентами через Gateway
export async function getClients(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  
  const query = params.toString() ? `?${params}` : '';
  return apiRequest(`/clients${query}`);
}

export async function addClient(clientData) {
  return apiRequest('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  }, 'clients');
}

export async function updateClient(clientId, clientData) {
  return apiRequest(`/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  }, 'clients');
}

export async function deleteClient(clientId) {
  return apiRequest(`/clients/${clientId}`, {
    method: 'DELETE',
  }, 'clients');
}

// Функции для работы с отчетами через Gateway
export async function getReports(page = 1, limit = 10, filters = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  return apiRequest(`/reports?${params}`);
}

export async function getReport(reportId) {
  return apiRequest(`/reports/${reportId}`);
}

export async function createReport(reportData) {
  return apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  }, 'reports');
}

export async function updateReport(reportId, reportData) {
  return apiRequest(`/reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify(reportData),
  }, 'reports');
}

export async function deleteReport(reportId) {
  return apiRequest(`/reports/${reportId}`, {
    method: 'DELETE',
  }, 'reports');
}

export async function generateReport(filters) {
  return apiRequest('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(filters),
  }, 'reports');
}

export async function exportReport(reportId, format = 'pdf') {
  return apiRequest(`/reports/${reportId}/export?format=${format}`);
}

// Функции для работы с актами через Gateway
export async function getActs(page = 1, limit = 10, filters = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (filters.status) params.append('status', filters.status);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  return apiRequest(`/acts?${params}`);
}

export async function getAct(actId) {
  return apiRequest(`/acts/${actId}`);
}

export async function createAct(actData) {
  return apiRequest('/acts', {
    method: 'POST',
    body: JSON.stringify(actData),
  }, 'acts');
}

export async function updateAct(actId, actData) {
  return apiRequest(`/acts/${actId}`, {
    method: 'PUT',
    body: JSON.stringify(actData),
  }, 'acts');
}

export async function deleteAct(actId) {
  return apiRequest(`/acts/${actId}`, {
    method: 'DELETE',
  }, 'acts');
}

export async function signAct(actId) {
  return apiRequest(`/acts/${actId}/sign`, {
    method: 'POST'
  });
}

export async function exportAct(actId, format = 'pdf') {
  return apiRequest(`/acts/${actId}/export?format=${format}`);
}

// Функции для работы с временем через Gateway
export async function startTimeTracking(taskId) {
  return apiRequest('/time/start', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId }),
  }, 'time');
}

export async function stopTimeTracking(taskId) {
  return apiRequest('/time/stop', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId }),
  }, 'time');
}

export async function getTimeReport(period = 'week') {
  return apiRequest(`/time/report?period=${period}`);
}

// Функции для работы с дашбордом через Gateway
export async function getDashboardMetrics() {
  return apiRequest('/dashboard/metrics');
}

export async function getActivityData(period) {
  return apiRequest(`/dashboard/activity?period=${period}`);
}

export async function getRecentTasks() {
  return apiRequest('/tasks/recent?limit=5');
}

export async function getTaskDistribution() {
  return apiRequest('/dashboard/task-distribution');
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

// Функции для работы с подпиской через Gateway
export async function getCompanyCards() {
  return apiRequest('/subscription/cards');
}

export async function getPaymentHistory() {
  return apiRequest('/subscription/payments');
}

export async function attachCard(cardData) {
  return apiRequest('/subscription/cards/attach', {
    method: 'POST',
    body: JSON.stringify(cardData),
  }, 'subscription');
}

export async function detachCard(cardData) {
  return apiRequest('/subscription/cards/detach', {
    method: 'POST',
    body: JSON.stringify(cardData),
  }, 'subscription');
}

export async function initiateSubscriptionPayment(companyId, cardId = null) {
  return apiRequest('/subscription/initiate', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId, card_id: cardId }),
  }, 'subscription');
}

export async function confirmSubscriptionPayment(paymentId) {
  return apiRequest('/subscription/confirm', {
    method: 'POST',
    body: JSON.stringify({ payment_id: paymentId }),
  }, 'subscription');
}

export async function activateTrial(companyId) {
  return apiRequest('/subscription/activate-trial', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId }),
  }, 'subscription');
}

// Функции для работы с Google Auth через Gateway
export async function getGoogleLoginUrl() {
  return apiRequest('/auth/google');
}

export async function googleLogin(code, state) {
  return apiRequest(
    `/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    { method: 'GET' },
    'auth'
  );
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
export async function deleteCompany(companyId) {
  return apiRequest(`/companies/${companyId}`, { method: 'DELETE' });
}

export async function updateEmployeeOrder(orderData) {
  return apiRequest('/employees/order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }, 'employees');
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

// Функции для работы с объединенным финансовым сервисом через Gateway
export async function getTransactions(page = 1, limit = 50, category = null, dateFrom = null, dateTo = null) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (category) params.append('category', category);
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  
  return apiRequest(`/financial/transactions?${params}`);
}

export async function createTransaction(transactionData) {
  return apiRequest('/financial/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  }, 'financial');
}

export async function updateTransaction(transactionId, transactionData) {
  return apiRequest(`/financial/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(transactionData),
  }, 'financial');
}

export async function deleteTransaction(transactionId) {
  return apiRequest(`/financial/transactions/${transactionId}`, {
    method: 'DELETE',
  }, 'financial');
}

export async function getCategories() {
  return apiRequest('/financial/categories');
}

export async function createCategory(categoryData) {
  return apiRequest('/financial/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }, 'financial');
}

export async function getBudgets() {
  return apiRequest('/financial/budgets');
}

export async function createBudget(budgetData) {
  return apiRequest('/financial/budgets', {
    method: 'POST',
    body: JSON.stringify(budgetData),
  }, 'financial');
}

export async function getFinancialAnalytics(period = 'month') {
  return apiRequest(`/financial/analytics/summary?period=${period}`);
}

export async function getCashflowAnalysis(period = 'month') {
  return apiRequest(`/financial/analytics/cashflow?period=${period}`);
}

// Функции для работы с налоговой интеграцией (теперь часть финансового сервиса)
export async function createTaxReport(taxReportData) {
  return apiRequest('/financial/tax/reports', {
    method: 'POST',
    body: JSON.stringify(taxReportData),
  }, 'financial');
}

export async function submitTaxReport(reportId) {
  return apiRequest(`/financial/tax/reports/${reportId}/submit`, {
    method: 'POST',
  }, 'financial');
}

export async function getTaxCalendar(year = new Date().getFullYear()) {
  return apiRequest(`/financial/tax/calendar/${year}`);
}

export async function getTaxOptimizationSuggestions() {
  return apiRequest('/financial/tax/optimization/suggestions');
}

export async function getTaxReminders() {
  return apiRequest('/financial/tax/reminders');
}

export async function getTaxCalculations() {
  return apiRequest('/financial/tax/calculations');
}

export async function createTaxPayment(taxPaymentData) {
  return apiRequest('/financial/tax/payments', {
    method: 'POST',
    body: JSON.stringify(taxPaymentData),
  }, 'financial');
}

export async function getTaxHistory() {
  return apiRequest('/financial/tax/history');
}

// Функции для работы с объединенным банковским сервисом через Gateway
export async function getBankAccounts() {
  return apiRequest('/bank/accounts');
}

export async function createBankAccount(accountData) {
  return apiRequest('/bank/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  }, 'bank');
}

// НОВЫЕ ФУНКЦИИ ДЛЯ БАНКОВСКИХ ПОДКЛЮЧЕНИЙ ЧЕРЕЗ AUTH-SERVICE
export async function connectBankAccount(bankData) {
  return apiRequest('/auth/bank/connect', {
    method: 'POST',
    body: JSON.stringify(bankData),
  }, 'auth');
}

export async function getConnectedBankAccounts() {
  return apiRequest('/auth/bank/accounts', {}, 'auth');
}

export async function disconnectBankAccount(connectionId) {
  return apiRequest(`/auth/bank/accounts/${connectionId}`, {
    method: 'DELETE',
  }, 'auth');
}

export async function requestBankConnection(bankData) {
  return apiRequest('/auth/bank/request-connection', {
    method: 'POST',
    body: JSON.stringify(bankData),
  }, 'auth');
}

export async function getBankConnectionStatus(requestId) {
  return apiRequest(`/auth/bank/connection-status/${requestId}`, {}, 'auth');
}

export async function getAccountBalance(accountId) {
  return apiRequest(`/bank/accounts/${accountId}/balance`);
}

export async function createPayment(paymentData) {
  return apiRequest('/bank/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }, 'bank');
}

export async function getPayments(page = 1, limit = 50, status = null) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (status) params.append('status', status);
  
  return apiRequest(`/bank/payments?${params}`);
}

export async function createRecurringPayment(paymentData) {
  return apiRequest('/bank/recurring-payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }, 'bank');
}

export async function getRecurringPayments() {
  return apiRequest('/bank/recurring-payments');
}

export async function generateSBPQR(paymentData) {
  return apiRequest('/bank/qr/sbp', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }, 'bank');
}

export async function generatePaymentQR(paymentData) {
  return apiRequest('/bank/qr/payment', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }, 'bank');
}

export async function getQRCodes() {
  return apiRequest('/bank/qr');
}

export async function getBankConnections() {
  return apiRequest('/bank/connections');
}

export async function createBankConnection(connectionData) {
  return apiRequest('/bank/connections', {
    method: 'POST',
    body: JSON.stringify(connectionData),
  }, 'bank');
}

export async function syncBankConnection(connectionId) {
  return apiRequest(`/bank/connections/${connectionId}/sync`, {
    method: 'POST',
  }, 'bank');
}

export async function getBankTransactions(connectionId, page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  return apiRequest(`/bank/connections/${connectionId}/transactions?${params}`);
}

export async function getBankAnalyticsSummary(connectionId, period = 'month') {
  return apiRequest(`/bank/connections/${connectionId}/analytics/summary?period=${period}`);
}

export async function getBankCashflowAnalysis(connectionId, period = 'month') {
  return apiRequest(`/bank/connections/${connectionId}/analytics/cashflow?period=${period}`);
}

// Функции для работы с объединенным сервисом документов через Gateway
export async function getDocuments(page = 1, limit = 50, type = null, status = null) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  
  return apiRequest(`/documents?${params}`);
}

export async function getDocument(documentId) {
  return apiRequest(`/documents/${documentId}`);
}

export async function createDocument(documentData) {
  return apiRequest('/documents', {
    method: 'POST',
    body: JSON.stringify(documentData),
  }, 'documents');
}

export async function updateDocument(documentId, documentData) {
  return apiRequest(`/documents/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(documentData),
  }, 'documents');
}

export async function deleteDocument(documentId) {
  return apiRequest(`/documents/${documentId}`, {
    method: 'DELETE',
  }, 'documents');
}

export async function signDocument(documentId, signatureData) {
  return apiRequest(`/documents/${documentId}/sign`, {
    method: 'POST',
    body: JSON.stringify(signatureData),
  }, 'documents');
}

export async function exportDocument(documentId, format = 'pdf') {
  return apiRequest(`/documents/${documentId}/export?format=${format}`);
}

export async function exportTo1C(documentId) {
  return apiRequest(`/documents/${documentId}/export/1c`);
}

export async function getReports(page = 1, limit = 50, type = null) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (type) params.append('type', type);
  
  return apiRequest(`/documents/reports?${params}`);
}

export async function createReport(reportData) {
  return apiRequest('/documents/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  }, 'documents');
}

export async function getActs(page = 1, limit = 50, status = null) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (status) params.append('status', status);
  
  return apiRequest(`/documents/acts?${params}`);
}

export async function createAct(actData) {
  return apiRequest('/documents/acts', {
    method: 'POST',
    body: JSON.stringify(actData),
  }, 'documents');
}

export async function createTimeReport(timeReportData) {
  return apiRequest('/documents/time-reports', {
    method: 'POST',
    body: JSON.stringify(timeReportData),
  }, 'documents');
}

export async function activateTrial() {
  return apiRequest('/documents/trial/activate', {
    method: 'POST',
  }, 'documents');
}

// Функции для работы с шаблонами документов (теперь часть сервиса документов)
export async function getDocumentTemplates(type = null) {
  const query = type ? `?type=${type}` : '';
  return apiRequest(`/documents/templates${query}`);
}

export async function getDocumentTemplate(templateType) {
  return apiRequest(`/documents/templates/${templateType}`);
}

export async function generateDocument(templateType, variables) {
  return apiRequest('/documents/generate', {
    method: 'POST',
    body: JSON.stringify({
      template_type: templateType,
      variables: variables
    }),
  }, 'documents');
}

export async function generateWordDocument(templateType, variables) {
  return apiRequest('/documents/generate/word', {
    method: 'POST',
    body: JSON.stringify({
      template_type: templateType,
      variables: variables
    }),
  }, 'documents');
}

export async function generatePDFDocument(templateType, variables) {
  return apiRequest('/documents/generate/pdf', {
    method: 'POST',
    body: JSON.stringify({
      template_type: templateType,
      variables: variables
    }),
  }, 'documents');
}

export async function getTemplateCategories() {
  return apiRequest('/documents/templates/categories');
}

export async function getTemplateTypes() {
  return apiRequest('/documents/templates/types');
}

// Функции для работы с объединенным сервисом уведомлений через Gateway
export async function createSmartNotification(notificationData) {
  return apiRequest('/notifications/smart/notifications', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  }, 'notifications');
}

export async function getSmartNotifications(userId, status = null, type = null, page = 1, limit = 50) {
  const params = new URLSearchParams({
    user_id: userId,
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  
  return apiRequest(`/notifications/smart/notifications?${params}`);
}

export async function createNotificationTemplate(templateData) {
  return apiRequest('/notifications/smart/templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
  }, 'notifications');
}

export async function getNotificationTemplates(type = null) {
  const query = type ? `?type=${type}` : '';
  return apiRequest(`/notifications/smart/templates${query}`);
}

export async function updateUserNotificationSettings(userId, settingsData) {
  return apiRequest(`/notifications/smart/settings/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(settingsData),
  }, 'notifications');
}

export async function getUserNotificationSettings(userId) {
  return apiRequest(`/notifications/smart/settings/${userId}`);
}

export async function createNotificationRule(ruleData) {
  return apiRequest('/notifications/smart/rules', {
    method: 'POST',
    body: JSON.stringify(ruleData),
  }, 'notifications');
}

export async function getNotificationRules(userId) {
  return apiRequest(`/notifications/smart/rules?user_id=${userId}`);
}

export async function getNotificationAnalytics(userId, period = 'week') {
  return apiRequest(`/notifications/smart/analytics/${userId}?period=${period}`);
}

// Функции для работы с объединенным AI сервисом через Gateway
export async function analyzeCompetitors(competitorUrls, industry = null, focusAreas = []) {
  return apiRequest('/ai/business/competitors/analyze', {
    method: 'POST',
    body: JSON.stringify({
      competitor_urls: competitorUrls,
      industry,
      focus_areas: focusAreas
    }),
  }, 'ai');
}

export async function analyzePricing(serviceName, currentPrice, serviceDescription, targetMarket = null, competitors = null) {
  return apiRequest('/ai/business/pricing/analyze', {
    method: 'POST',
    body: JSON.stringify({
      service_name: serviceName,
      current_price: currentPrice,
      service_description: serviceDescription,
      target_market: targetMarket,
      competitors
    }),
  }, 'ai');
}

export async function generateBusinessInsights(insightType, data, priority = 'medium') {
  return apiRequest('/ai/business/insights/generate', {
    method: 'POST',
    body: JSON.stringify({
      insight_type: insightType,
      data,
      priority
    }),
  }, 'ai');
}

export async function trainAIModel(modelName, modelType, trainingData, parameters = null) {
  return apiRequest('/ai/analytics/models/train', {
    method: 'POST',
    body: JSON.stringify({
      model_name: modelName,
      model_type: modelType,
      training_data: trainingData,
      parameters
    }),
  }, 'ai');
}

export async function makePrediction(modelName, inputData) {
  return apiRequest('/ai/analytics/predict', {
    method: 'POST',
    body: JSON.stringify({
      model_name: modelName,
      input_data: inputData
    }),
  }, 'ai');
}

export async function getAIModels(modelType = null) {
  const query = modelType ? `?model_type=${modelType}` : '';
  return apiRequest(`/ai/analytics/models${query}`);
}

export async function getPredictions(userId, modelName = null, page = 1, limit = 50) {
  const params = new URLSearchParams({
    user_id: userId,
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (modelName) params.append('model_name', modelName);
  
  return apiRequest(`/ai/analytics/predictions?${params}`);
}

// Функции для работы с объединенным сервисом безопасности и кэширования через Gateway
export async function setCacheValue(key, value, service = 'default', ttl = null) {
  return apiRequest('/security/cache/set', {
    method: 'POST',
    body: JSON.stringify({
      key,
      service,
      ttl,
      data: value
    }),
  }, 'security');
}

export async function getCacheValue(key, service = 'default') {
  return apiRequest(`/security/cache/get/${key}?service=${service}`);
}

export async function deleteCacheValue(key, service = 'default') {
  return apiRequest(`/security/cache/delete/${key}?service=${service}`, {
    method: 'DELETE',
  }, 'security');
}

export async function invalidateCache(pattern, service = 'default', level = 'all') {
  return apiRequest('/security/cache/invalidate', {
    method: 'POST',
    body: JSON.stringify({
      pattern,
      service,
      level
    }),
  }, 'security');
}

export async function getCacheStats() {
  return apiRequest('/security/cache/stats');
}

export async function createSecurityEvent(eventData) {
  return apiRequest('/security/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  }, 'security');
}

export async function checkIPSecurity(ipAddress) {
  return apiRequest(`/security/ip/${ipAddress}`);
}

export async function blockIPAddress(ipAddress, reason, duration = 3600) {
  const params = new URLSearchParams({
    ip_address: ipAddress,
    reason,
    duration: duration.toString()
  });
  
  return apiRequest(`/security/block-ip?${params}`, {
    method: 'POST',
  }, 'security');
}

export async function getSecurityEvents(eventType = null, severity = null, page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (eventType) params.append('event_type', eventType);
  if (severity) params.append('severity', severity);
  
  return apiRequest(`/security/events?${params}`);
}

export async function getSecurityPolicies() {
  return apiRequest('/security/policies');
}

export async function createSecurityPolicy(policyData) {
  return apiRequest('/security/policies', {
    method: 'POST',
    body: JSON.stringify(policyData),
  }, 'security');
}

// Функции для работы с объединенным голосовым помощником и аналитикой через Gateway
export async function processVoiceCommand(audioFile, language = 'ru', commandType = null) {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('language', language);
  if (commandType) formData.append('command_type', commandType);
  
  return apiRequest('/voice/command', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  }, 'voice');
}

export async function getVoiceAnalytics(userId, period = 'week') {
  return apiRequest(`/voice/analytics/${userId}?period=${period}`);
}

export async function updateVoiceSettings(userId, settingsData) {
  return apiRequest(`/voice/settings/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(settingsData),
  }, 'voice');
}

export async function getVoiceSettings(userId) {
  return apiRequest(`/voice/settings/${userId}`);
}

export async function createAnalyticsEvent(eventData) {
  return apiRequest('/voice/analytics/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  }, 'voice');
}

export async function createRealTimeMetric(metricData) {
  return apiRequest('/voice/analytics/metrics', {
    method: 'POST',
    body: JSON.stringify(metricData),
  }, 'voice');
}

export async function getAnalyticsEvents(eventType = null, source = null, page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (eventType) params.append('event_type', eventType);
  if (source) params.append('source', source);
  
  return apiRequest(`/voice/analytics/events?${params}`);
}

export async function getRealTimeMetrics(metricName = null, source = null, page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (metricName) params.append('metric_name', metricName);
  if (source) params.append('source', source);
  
  return apiRequest(`/voice/analytics/metrics?${params}`);
}

// Функции для работы с ботами через Gateway
export async function getBotStatus(botType) {
  return apiRequest(`/bots/${botType}/status`);
}

export async function sendBotMessage(botType, messageData) {
  return apiRequest(`/bots/${botType}/send`, {
    method: 'POST',
    body: JSON.stringify(messageData),
  }, 'bots');
}

export async function getBotHistory(botType, page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  return apiRequest(`/bots/${botType}/history?${params}`);
}

// Устаревшие функции для совместимости (deprecated)
export async function getCachedData(key, service = 'default') {
  console.warn('getCachedData is deprecated, use getCacheValue instead');
  return getCacheValue(key, service);
}

export async function getSecurityProfile() {
  console.warn('getSecurityProfile is deprecated, use getSecurityPolicies instead');
  return getSecurityPolicies();
}

export async function getAIAnalytics(metricNames = null) {
  console.warn('getAIAnalytics is deprecated, use getRealTimeMetrics instead');
  return getRealTimeMetrics('ai_analytics', 'ai_service');
}

export async function connectRealTimeWebSocket(userId, subscriptions = []) {
  console.warn('connectRealTimeWebSocket is deprecated, use WebSocket directly');
  // Возвращаем заглушку для совместимости
  return { status: 'deprecated' };
}

// Функции для совместимости с существующими компонентами
export async function monitorCompetitors(urls, options = {}) {
  return analyzeCompetitors(urls);
}

export async function getPromotionRecommendations(salesData, competitorData) {
  return generateBusinessInsights('promotion', { sales_data: salesData, competitor_data: competitorData });
}

export async function analyzeVoice(audioData, format = 'webm') {
  return processVoiceCommand(audioData, 'ru', 'voice_analysis');
}

export async function processText(text) {
  return generateBusinessInsights('text_analysis', { text });
}

// Функции для работы с CSRF (если необходимо)
export async function fetchWithCsrf(url, options = {}) {
  // Получаем CSRF токен из meta тега или cookie
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                   document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
  
  const headers = {
    'X-CSRF-Token': csrfToken,
    ...options.headers
  };
  
  return fetch(url, { ...options, headers });
}

// Константы для совместимости (deprecated)
export const BASE_URLS = {
  gateway: API_BASE_URL,
  api: `${API_BASE_URL}/api`,
  auth: `${API_BASE_URL}/auth`,
  tasks: `${API_BASE_URL}/tasks`,
  documents: `${API_BASE_URL}/documents`,
  financial: `${API_BASE_URL}/financial`,
  bank: `${API_BASE_URL}/bank`,
  notifications: `${API_BASE_URL}/notifications`,
  ai: `${API_BASE_URL}/ai`,
  security: `${API_BASE_URL}/security`,
  voice: `${API_BASE_URL}/voice`,
  bots: `${API_BASE_URL}/bots`
};

// Экспорт основных функций и констант
export {
  apiRequest,
  API_BASE_URL
};

// Функции для работы с новыми фичами финансового сервиса

// Проверка контрагентов по базе ФНС
export async function checkContractor(contractorData) {
  return apiRequest('/financial/contractors/check', {
    method: 'POST',
    body: JSON.stringify(contractorData),
  }, 'financial');
}

export async function getContractor(contractorId) {
  return apiRequest(`/financial/contractors/${contractorId}`);
}

// Анализ клиентской базы
export async function analyzeClient(clientId, analysisPeriod = 'all') {
  return apiRequest('/financial/clients/analyze', {
    method: 'POST',
    body: JSON.stringify({
      client_id: clientId,
      analysis_period: analysisPeriod
    }),
  }, 'financial');
}

// Оптимизация бизнеса
export async function createBusinessOptimization(optimizationData) {
  return apiRequest('/financial/business/optimize', {
    method: 'POST',
    body: JSON.stringify(optimizationData),
  }, 'financial');
}

export async function getBusinessOptimizations(optimizationType = null, priority = null) {
  const params = new URLSearchParams();
  if (optimizationType) params.append('optimization_type', optimizationType);
  if (priority) params.append('priority', priority);

  return apiRequest(`/financial/business/optimizations?${params}`);
}

// Выявление убыточных направлений
export async function identifyUnprofitableDirections(directionData) {
  return apiRequest('/financial/business/unprofitable-directions', {
    method: 'POST',
    body: JSON.stringify(directionData),
  }, 'financial');
}

// Функции для работы с новыми фичами AI сервиса

// Анализ конкурентов в реальном времени
export async function analyzeCompetitor(competitorData) {
  return apiRequest('/ai/competitors/analyze', {
    method: 'POST',
    body: JSON.stringify(competitorData),
  }, 'ai');
}

// Прогнозирование доходов и расходов
export async function createBusinessForecast(forecastData) {
  return apiRequest('/ai/business/forecast', {
    method: 'POST',
    body: JSON.stringify(forecastData),
  }, 'ai');
}

// Рекомендации по оптимизации бизнеса
export async function generateBusinessRecommendations(recommendationData) {
  return apiRequest('/ai/business/recommendations', {
    method: 'POST',
    body: JSON.stringify(recommendationData),
  }, 'ai');
}

export async function getBusinessRecommendations(recommendationType = null, priority = null, status = null) {
  const params = new URLSearchParams();
  if (recommendationType) params.append('recommendation_type', recommendationType);
  if (priority) params.append('priority', priority);
  if (status) params.append('status', status);

  return apiRequest(`/ai/business/recommendations?${params}`);
}

// Функции для работы с новыми фичами task сервиса

// Планирование встреч
export async function createMeeting(meetingData) {
  return apiRequest('/tasks/meetings', {
    method: 'POST',
    body: JSON.stringify(meetingData),
  }, 'tasks');
}

export async function getMeetings(startDate = null, endDate = null, meetingType = null) {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (meetingType) params.append('meeting_type', meetingType);

  return apiRequest(`/tasks/meetings?${params}`);
}

export async function getMeeting(meetingId) {
  return apiRequest(`/tasks/meetings/${meetingId}`);
}

export async function updateMeeting(meetingId, meetingData) {
  return apiRequest(`/tasks/meetings/${meetingId}`, {
    method: 'PUT',
    body: JSON.stringify(meetingData),
  }, 'tasks');
}

export async function deleteMeeting(meetingId) {
  return apiRequest(`/tasks/meetings/${meetingId}`, {
    method: 'DELETE',
  }, 'tasks');
}

// Управление важными датами
export async function createImportantDate(dateData) {
  return apiRequest('/tasks/important-dates', {
    method: 'POST',
    body: JSON.stringify(dateData),
  }, 'tasks');
}

export async function getImportantDates(dateType = null, priority = null) {
  const params = new URLSearchParams();
  if (dateType) params.append('type', dateType);
  if (priority) params.append('priority', priority);

  return apiRequest(`/tasks/important-dates?${params}`);
}

export async function getImportantDate(dateId) {
  return apiRequest(`/tasks/important-dates/${dateId}`);
}

export async function updateImportantDate(dateId, dateData) {
  return apiRequest(`/tasks/important-dates/${dateId}`, {
    method: 'PUT',
    body: JSON.stringify(dateData),
  }, 'tasks');
}

export async function deleteImportantDate(dateId) {
  return apiRequest(`/tasks/important-dates/${dateId}`, {
    method: 'DELETE',
  }, 'tasks');
}

// Синхронизация с внешними системами
export async function createExternalIntegration(integrationData) {
  return apiRequest('/tasks/integrations', {
    method: 'POST',
    body: JSON.stringify(integrationData),
  }, 'tasks');
}

export async function getExternalIntegrations() {
  return apiRequest('/tasks/integrations');
}

export async function getExternalIntegration(integrationId) {
  return apiRequest(`/tasks/integrations/${integrationId}`);
}

export async function updateExternalIntegration(integrationId, integrationData) {
  return apiRequest(`/tasks/integrations/${integrationId}`, {
    method: 'PUT',
    body: JSON.stringify(integrationData),
  }, 'tasks');
}

export async function deleteExternalIntegration(integrationId) {
  return apiRequest(`/tasks/integrations/${integrationId}`, {
    method: 'DELETE',
  }, 'tasks');
}

export async function syncExternalData(integrationId) {
  return apiRequest(`/tasks/integrations/${integrationId}/sync`, {
    method: 'POST',
  }, 'tasks');
}

// Управление контактами
export async function createContact(contactData) {
  return apiRequest('/tasks/contacts', {
    method: 'POST',
    body: JSON.stringify(contactData),
  }, 'tasks');
}

export async function getContacts(contactType = null, company = null) {
  const params = new URLSearchParams();
  if (contactType) params.append('type', contactType);
  if (company) params.append('company', company);

  return apiRequest(`/tasks/contacts?${params}`);
}

export async function getContact(contactId) {
  return apiRequest(`/tasks/contacts/${contactId}`);
}

export async function updateContact(contactId, contactData) {
  return apiRequest(`/tasks/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(contactData),
  }, 'tasks');
}

export async function deleteContact(contactId) {
  return apiRequest(`/tasks/contacts/${contactId}`, {
    method: 'DELETE',
  }, 'tasks');
}

// Функции для работы с новыми фичами documents сервиса

// Учет товаров
export async function createProduct(productData) {
  return apiRequest('/documents/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }, 'documents');
}

// Транзакции по товарам
export async function createInventoryTransaction(transactionData) {
  return apiRequest('/documents/inventory/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  }, 'documents');
}

// Прогнозирование спроса
export async function createDemandForecast(forecastData) {
  return apiRequest('/documents/inventory/forecast', {
    method: 'POST',
    body: JSON.stringify(forecastData),
  }, 'documents');
}

// Автоматическое формирование заказов
export async function generateAutoOrders() {
  return apiRequest('/documents/inventory/auto-orders', {
    method: 'POST',
  }, 'documents');
}

// Аналитика по товарам
export async function getInventoryAnalytics(category = null) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);

  return apiRequest(`/documents/inventory/analytics?${params}`);
}