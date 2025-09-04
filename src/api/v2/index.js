/**
 * API v2 - Новый версионированный API
 * Использует единый API клиент с улучшенной безопасностью и производительностью
 */

import apiClient from '../../services/api-client.js';

// Базовые endpoints с версионированием
const API_ENDPOINTS = {
  v2: {
    auth: {
      login: '/v2/auth/login',
      register: '/v2/auth/register',
      logout: '/v2/auth/logout',
      refresh: '/v2/auth/refresh',
      profile: '/v2/auth/profile',
      passwordReset: '/v2/auth/password/reset',
      passwordResetConfirm: '/v2/auth/password/reset/confirm',
      bank: {
        connect: '/v2/auth/bank/connect',
        accounts: '/v2/auth/bank/accounts',
        disconnect: '/v2/auth/bank/accounts',
        requestConnection: '/v2/auth/bank/request-connection',
        connectionStatus: '/v2/auth/bank/connection-status'
      },
      users: {
        list: '/v2/auth/users',
        create: '/v2/auth/users',
        update: '/v2/auth/users',
        delete: '/v2/auth/users',
        roles: '/v2/auth/users/roles'
      }
    },
    tasks: {
      list: '/v2/tasks',
      create: '/v2/tasks',
      get: '/v2/tasks',
      update: '/v2/tasks',
      delete: '/v2/tasks',
      comments: '/v2/tasks',
      timeTracking: '/v2/tasks/time',
      meetings: '/v2/tasks/meetings',
      importantDates: '/v2/tasks/important-dates',
      integrations: '/v2/tasks/integrations',
      contacts: '/v2/tasks/contacts',
      analytics: '/v2/tasks/analytics',
      suggestions: '/v2/tasks/suggestions',
      predictive: '/v2/tasks/predictive'
    },
    documents: {
      list: '/v2/documents',
      create: '/v2/documents',
      get: '/v2/documents',
      update: '/v2/documents',
      delete: '/v2/documents',
      sign: '/v2/documents',
      export: '/v2/documents',
      templates: '/v2/documents/templates',
      generate: '/v2/documents/generate',
      reports: '/v2/documents/reports',
      acts: '/v2/documents/acts',
      inventory: '/v2/documents/inventory'
    },
    financial: {
      transactions: '/v2/financial/transactions',
      categories: '/v2/financial/categories',
      budgets: '/v2/financial/budgets',
      analytics: '/v2/financial/analytics',
      tax: '/v2/financial/tax',
      contractors: '/v2/financial/contractors',
      clients: '/v2/financial/clients',
      business: '/v2/financial/business'
    },
    bank: {
      accounts: '/v2/bank/accounts',
      payments: '/v2/bank/payments',
      recurringPayments: '/v2/bank/recurring-payments',
      qr: '/v2/bank/qr',
      connections: '/v2/bank/connections',
      transactions: '/v2/bank/transactions',
      analytics: '/v2/bank/analytics'
    },
    notifications: {
      smart: '/v2/notifications/smart',
      templates: '/v2/notifications/templates',
      settings: '/v2/notifications/settings',
      rules: '/v2/notifications/rules',
      analytics: '/v2/notifications/analytics'
    },
    ai: {
      business: '/v2/ai/business',
      analytics: '/v2/ai/analytics',
      models: '/v2/ai/models',
      predictions: '/v2/ai/predictions',
      competitors: '/v2/ai/competitors'
    },
    security: {
      cache: '/v2/security/cache',
      events: '/v2/security/events',
      ip: '/v2/security/ip',
      policies: '/v2/security/policies'
    },
    voice: {
      command: '/v2/voice/command',
      analytics: '/v2/voice/analytics',
      settings: '/v2/voice/settings',
      events: '/v2/voice/events',
      metrics: '/v2/voice/metrics'
    },
    dashboard: {
      metrics: '/v2/dashboard/metrics',
      activity: '/v2/dashboard/activity',
      admin: '/v2/dashboard/admin',
      taskDistribution: '/v2/dashboard/task-distribution'
    },
    subscription: {
      cards: '/v2/subscription/cards',
      payments: '/v2/subscription/payments',
      initiate: '/v2/subscription/initiate',
      confirm: '/v2/subscription/confirm',
      trial: '/v2/subscription/trial'
    }
  }
};

/**
 * Класс для работы с API v2
 */
class ApiV2 {
  constructor() {
    this.endpoints = API_ENDPOINTS.v2;
    this.client = apiClient;
  }

  /**
   * Аутентификация
   */
  auth = {
    async login(credentials) {
      return this.client.post(this.endpoints.auth.login, credentials);
    },

    async register(userData) {
      return this.client.post(this.endpoints.auth.register, userData);
    },

    async logout() {
      return this.client.post(this.endpoints.auth.logout);
    },

    async refresh(refreshToken) {
      return this.client.post(this.endpoints.auth.refresh, { refresh_token: refreshToken });
    },

    async getProfile() {
      return this.client.get(this.endpoints.auth.profile);
    },

    async updateProfile(profileData) {
      return this.client.put(this.endpoints.auth.profile, profileData);
    },

    async requestPasswordReset(email) {
      return this.client.post(this.endpoints.auth.passwordReset, { email });
    },

    async confirmPasswordReset(token, newPassword) {
      return this.client.post(this.endpoints.auth.passwordResetConfirm, { token, new_password: newPassword });
    },

    // Банковские функции
    bank: {
      async connect(bankData) {
        return this.client.post(this.endpoints.auth.bank.connect, bankData);
      },

      async getAccounts() {
        return this.client.get(this.endpoints.auth.bank.accounts);
      },

      async disconnect(connectionId) {
        return this.client.delete(`${this.endpoints.auth.bank.disconnect}/${connectionId}`);
      },

      async requestConnection(bankData) {
        return this.client.post(this.endpoints.auth.bank.requestConnection, bankData);
      },

      async getConnectionStatus(requestId) {
        return this.client.get(`${this.endpoints.auth.bank.connectionStatus}/${requestId}`);
      }
    },

    // Управление пользователями
    users: {
      async getList(page = 1, limit = 50, filters = {}) {
        const params = { page, limit, ...filters };
        return this.client.get(this.endpoints.auth.users.list, params);
      },

      async create(userData) {
        return this.client.post(this.endpoints.auth.users.create, userData);
      },

      async update(userId, userData) {
        return this.client.put(`${this.endpoints.auth.users.update}/${userId}`, userData);
      },

      async delete(userId) {
        return this.client.delete(`${this.endpoints.auth.users.delete}/${userId}`);
      },

      async getRoles() {
        return this.client.get(this.endpoints.auth.users.roles);
      }
    }
  };

  /**
   * Задачи
   */
  tasks = {
    async getList(page = 1, limit = 50, filters = {}) {
      const params = { page, limit, ...filters };
      return this.client.get(this.endpoints.tasks.list, params);
    },

    async getById(taskId) {
      return this.client.get(`${this.endpoints.tasks.get}/${taskId}`);
    },

    async create(taskData) {
      return this.client.post(this.endpoints.tasks.create, taskData);
    },

    async update(taskId, taskData) {
      return this.client.put(`${this.endpoints.tasks.update}/${taskId}`, taskData);
    },

    async delete(taskId) {
      return this.client.delete(`${this.endpoints.tasks.delete}/${taskId}`);
    },

    // Комментарии
    async getComments(taskId) {
      return this.client.get(`${this.endpoints.tasks.comments}/${taskId}/comments`);
    },

    async addComment(taskId, commentData) {
      return this.client.post(`${this.endpoints.tasks.comments}/${taskId}/comments`, commentData);
    },

    async updateComment(taskId, commentId, commentData) {
      return this.client.put(`${this.endpoints.tasks.comments}/${taskId}/comments/${commentId}`, commentData);
    },

    async deleteComment(taskId, commentId) {
      return this.client.delete(`${this.endpoints.tasks.comments}/${taskId}/comments/${commentId}`);
    },

    // Учет времени
    async startTimeTracking(taskId) {
      return this.client.post(`${this.endpoints.tasks.timeTracking}/${taskId}/start`);
    },

    async stopTimeTracking(entryId) {
      return this.client.post(`${this.endpoints.tasks.timeTracking}/stop?entry_id=${entryId}`);
    },

    async getTimeReport(period = 'week') {
      return this.client.get(`${this.endpoints.tasks.timeTracking}/report?period=${period}`);
    },

    async getActiveTimeEntries() {
      return this.client.get(`${this.endpoints.tasks.timeTracking}/active`);
    },

    // Встречи
    async getMeetings(filters = {}) {
      return this.client.get(this.endpoints.tasks.meetings, filters);
    },

    async getMeeting(meetingId) {
      return this.client.get(`${this.endpoints.tasks.meetings}/${meetingId}`);
    },

    async createMeeting(meetingData) {
      return this.client.post(this.endpoints.tasks.meetings, meetingData);
    },

    async updateMeeting(meetingId, meetingData) {
      return this.client.put(`${this.endpoints.tasks.meetings}/${meetingId}`, meetingData);
    },

    async deleteMeeting(meetingId) {
      return this.client.delete(`${this.endpoints.tasks.meetings}/${meetingId}`);
    },

    // Важные даты
    async getImportantDates(filters = {}) {
      return this.client.get(this.endpoints.tasks.importantDates, filters);
    },

    async getImportantDate(dateId) {
      return this.client.get(`${this.endpoints.tasks.importantDates}/${dateId}`);
    },

    async createImportantDate(dateData) {
      return this.client.post(this.endpoints.tasks.importantDates, dateData);
    },

    async updateImportantDate(dateId, dateData) {
      return this.client.put(`${this.endpoints.tasks.importantDates}/${dateId}`, dateData);
    },

    async deleteImportantDate(dateId) {
      return this.client.delete(`${this.endpoints.tasks.importantDates}/${dateId}`);
    },

    // Интеграции
    async getIntegrations() {
      return this.client.get(this.endpoints.tasks.integrations);
    },

    async getIntegration(integrationId) {
      return this.client.get(`${this.endpoints.tasks.integrations}/${integrationId}`);
    },

    async createIntegration(integrationData) {
      return this.client.post(this.endpoints.tasks.integrations, integrationData);
    },

    async updateIntegration(integrationId, integrationData) {
      return this.client.put(`${this.endpoints.tasks.integrations}/${integrationId}`, integrationData);
    },

    async deleteIntegration(integrationId) {
      return this.client.delete(`${this.endpoints.tasks.integrations}/${integrationId}`);
    },

    async syncIntegration(integrationId) {
      return this.client.post(`${this.endpoints.tasks.integrations}/${integrationId}/sync`);
    },

    // Контакты
    async getContacts(filters = {}) {
      return this.client.get(this.endpoints.tasks.contacts, filters);
    },

    async getContact(contactId) {
      return this.client.get(`${this.endpoints.tasks.contacts}/${contactId}`);
    },

    async createContact(contactData) {
      return this.client.post(this.endpoints.tasks.contacts, contactData);
    },

    async updateContact(contactId, contactData) {
      return this.client.put(`${this.endpoints.tasks.contacts}/${contactId}`, contactData);
    },

    async deleteContact(contactId) {
      return this.client.delete(`${this.endpoints.tasks.contacts}/${contactId}`);
    },

    // Аналитика
    async getAnalytics(period = 'week') {
      return this.client.get(`${this.endpoints.tasks.analytics}?period=${period}`);
    },

    async getSuggestions(text) {
      return this.client.get(`${this.endpoints.tasks.suggestions}?text=${encodeURIComponent(text)}`);
    },

    // Предиктивные функции
    async createPredictiveTask(text, confirmSuggestion = false, suggestionAction = {}) {
      return this.client.post(this.endpoints.tasks.predictive, {
        text,
        confirm_suggestion: confirmSuggestion,
        suggestion_action: suggestionAction
      });
    }
  };

  /**
   * Документы
   */
  documents = {
    async getList(page = 1, limit = 50, filters = {}) {
      const params = { page, limit, ...filters };
      return this.client.get(this.endpoints.documents.list, params);
    },

    async getById(documentId) {
      return this.client.get(`${this.endpoints.documents.get}/${documentId}`);
    },

    async create(documentData) {
      return this.client.post(this.endpoints.documents.create, documentData);
    },

    async update(documentId, documentData) {
      return this.client.put(`${this.endpoints.documents.update}/${documentId}`, documentData);
    },

    async delete(documentId) {
      return this.client.delete(`${this.endpoints.documents.delete}/${documentId}`);
    },

    async sign(documentId, signatureData) {
      return this.client.post(`${this.endpoints.documents.sign}/${documentId}/sign`, signatureData);
    },

    async export(documentId, format = 'pdf') {
      return this.client.get(`${this.endpoints.documents.export}/${documentId}/export?format=${format}`);
    },

    // Шаблоны
    async getTemplates(type = null) {
      const params = type ? { type } : {};
      return this.client.get(this.endpoints.documents.templates, params);
    },

    async getTemplate(templateType) {
      return this.client.get(`${this.endpoints.documents.templates}/${templateType}`);
    },

    async generateDocument(templateType, variables) {
      return this.client.post(this.endpoints.documents.generate, {
        template_type: templateType,
        variables
      });
    },

    // Отчеты
    async getReports(page = 1, limit = 50, type = null) {
      const params = { page, limit };
      if (type) params.type = type;
      return this.client.get(this.endpoints.documents.reports, params);
    },

    async createReport(reportData) {
      return this.client.post(this.endpoints.documents.reports, reportData);
    },

    // Акты
    async getActs(page = 1, limit = 50, status = null) {
      const params = { page, limit };
      if (status) params.status = status;
      return this.client.get(this.endpoints.documents.acts, params);
    },

    async createAct(actData) {
      return this.client.post(this.endpoints.documents.acts, actData);
    },

    // Учет товаров
    async getInventoryAnalytics(category = null) {
      const params = category ? { category } : {};
      return this.client.get(this.endpoints.documents.inventory, params);
    },

    async createProduct(productData) {
      return this.client.post(`${this.endpoints.documents.inventory}/products`, productData);
    },

    async createInventoryTransaction(transactionData) {
      return this.client.post(`${this.endpoints.documents.inventory}/transactions`, transactionData);
    },

    async createDemandForecast(forecastData) {
      return this.client.post(`${this.endpoints.documents.inventory}/forecast`, forecastData);
    },

    async generateAutoOrders() {
      return this.client.post(`${this.endpoints.documents.inventory}/auto-orders`);
    }
  };

  /**
   * Финансы
   */
  financial = {
    async getTransactions(page = 1, limit = 50, filters = {}) {
      const params = { page, limit, ...filters };
      return this.client.get(this.endpoints.financial.transactions, params);
    },

    async createTransaction(transactionData) {
      return this.client.post(this.endpoints.financial.transactions, transactionData);
    },

    async updateTransaction(transactionId, transactionData) {
      return this.client.put(`${this.endpoints.financial.transactions}/${transactionId}`, transactionData);
    },

    async deleteTransaction(transactionId) {
      return this.client.delete(`${this.endpoints.financial.transactions}/${transactionId}`);
    },

    async getCategories() {
      return this.client.get(this.endpoints.financial.categories);
    },

    async createCategory(categoryData) {
      return this.client.post(this.endpoints.financial.categories, categoryData);
    },

    async getBudgets() {
      return this.client.get(this.endpoints.financial.budgets);
    },

    async createBudget(budgetData) {
      return this.client.post(this.endpoints.financial.budgets, budgetData);
    },

    async getAnalytics(period = 'month') {
      return this.client.get(`${this.endpoints.financial.analytics}/summary?period=${period}`);
    },

    async getCashflowAnalysis(period = 'month') {
      return this.client.get(`${this.endpoints.financial.analytics}/cashflow?period=${period}`);
    },

    // Налоги
    async createTaxReport(taxReportData) {
      return this.client.post(`${this.endpoints.financial.tax}/reports`, taxReportData);
    },

    async submitTaxReport(reportId) {
      return this.client.post(`${this.endpoints.financial.tax}/reports/${reportId}/submit`);
    },

    async getTaxCalendar(year = new Date().getFullYear()) {
      return this.client.get(`${this.endpoints.financial.tax}/calendar/${year}`);
    },

    async getTaxOptimizationSuggestions() {
      return this.client.get(`${this.endpoints.financial.tax}/optimization/suggestions`);
    },

    async getTaxReminders() {
      return this.client.get(`${this.endpoints.financial.tax}/reminders`);
    },

    async getTaxCalculations() {
      return this.client.get(`${this.endpoints.financial.tax}/calculations`);
    },

    async createTaxPayment(taxPaymentData) {
      return this.client.post(`${this.endpoints.financial.tax}/payments`, taxPaymentData);
    },

    async getTaxHistory() {
      return this.client.get(`${this.endpoints.financial.tax}/history`);
    },

    // Контрагенты
    async checkContractor(contractorData) {
      return this.client.post(`${this.endpoints.financial.contractors}/check`, contractorData);
    },

    async getContractor(contractorId) {
      return this.client.get(`${this.endpoints.financial.contractors}/${contractorId}`);
    },

    // Клиенты
    async analyzeClient(clientId, analysisPeriod = 'all') {
      return this.client.post(`${this.endpoints.financial.clients}/analyze`, {
        client_id: clientId,
        analysis_period: analysisPeriod
      });
    },

    // Оптимизация бизнеса
    async createBusinessOptimization(optimizationData) {
      return this.client.post(`${this.endpoints.financial.business}/optimize`, optimizationData);
    },

    async getBusinessOptimizations(optimizationType = null, priority = null) {
      const params = {};
      if (optimizationType) params.optimization_type = optimizationType;
      if (priority) params.priority = priority;
      return this.client.get(`${this.endpoints.financial.business}/optimizations`, params);
    },

    async identifyUnprofitableDirections(directionData) {
      return this.client.post(`${this.endpoints.financial.business}/unprofitable-directions`, directionData);
    }
  };

  /**
   * Банковские операции
   */
  bank = {
    async getAccounts() {
      return this.client.get(this.endpoints.bank.accounts);
    },

    async createAccount(accountData) {
      return this.client.post(this.endpoints.bank.accounts, accountData);
    },

    async getPayments(page = 1, limit = 50, status = null) {
      const params = { page, limit };
      if (status) params.status = status;
      return this.client.get(this.endpoints.bank.payments, params);
    },

    async createPayment(paymentData) {
      return this.client.post(this.endpoints.bank.payments, paymentData);
    },

    async createRecurringPayment(paymentData) {
      return this.client.post(this.endpoints.bank.recurringPayments, paymentData);
    },

    async getRecurringPayments() {
      return this.client.get(this.endpoints.bank.recurringPayments);
    },

    async generateSBPQR(paymentData) {
      return this.client.post(`${this.endpoints.bank.qr}/sbp`, paymentData);
    },

    async generatePaymentQR(paymentData) {
      return this.client.post(`${this.endpoints.bank.qr}/payment`, paymentData);
    },

    async getQRCodes() {
      return this.client.get(this.endpoints.bank.qr);
    },

    async getConnections() {
      return this.client.get(this.endpoints.bank.connections);
    },

    async createConnection(connectionData) {
      return this.client.post(this.endpoints.bank.connections, connectionData);
    },

    async syncConnection(connectionId) {
      return this.client.post(`${this.endpoints.bank.connections}/${connectionId}/sync`);
    },

    async getTransactions(connectionId, page = 1, limit = 50) {
      const params = { page, limit };
      return this.client.get(`${this.endpoints.bank.transactions}/${connectionId}/transactions`, params);
    },

    async getAnalyticsSummary(connectionId, period = 'month') {
      return this.client.get(`${this.endpoints.bank.analytics}/${connectionId}/summary?period=${period}`);
    },

    async getCashflowAnalysis(connectionId, period = 'month') {
      return this.client.get(`${this.endpoints.bank.analytics}/${connectionId}/cashflow?period=${period}`);
    }
  };

  /**
   * Уведомления
   */
  notifications = {
    async createSmartNotification(notificationData) {
      return this.client.post(this.endpoints.notifications.smart, notificationData);
    },

    async getSmartNotifications(userId, filters = {}) {
      const params = { user_id: userId, ...filters };
      return this.client.get(this.endpoints.notifications.smart, params);
    },

    async createTemplate(templateData) {
      return this.client.post(this.endpoints.notifications.templates, templateData);
    },

    async getTemplates(type = null) {
      const params = type ? { type } : {};
      return this.client.get(this.endpoints.notifications.templates, params);
    },

    async updateUserSettings(userId, settingsData) {
      return this.client.put(`${this.endpoints.notifications.settings}/${userId}`, settingsData);
    },

    async getUserSettings(userId) {
      return this.client.get(`${this.endpoints.notifications.settings}/${userId}`);
    },

    async createRule(ruleData) {
      return this.client.post(this.endpoints.notifications.rules, ruleData);
    },

    async getRules(userId) {
      return this.client.get(`${this.endpoints.notifications.rules}?user_id=${userId}`);
    },

    async getAnalytics(userId, period = 'week') {
      return this.client.get(`${this.endpoints.notifications.analytics}/${userId}?period=${period}`);
    }
  };

  /**
   * AI сервисы
   */
  ai = {
    // Бизнес аналитика
    async analyzeCompetitors(competitorUrls, industry = null, focusAreas = []) {
      return this.client.post(`${this.endpoints.ai.business}/competitors/analyze`, {
        competitor_urls: competitorUrls,
        industry,
        focus_areas: focusAreas
      });
    },

    async analyzePricing(serviceName, currentPrice, serviceDescription, targetMarket = null, competitors = null) {
      return this.client.post(`${this.endpoints.ai.business}/pricing/analyze`, {
        service_name: serviceName,
        current_price: currentPrice,
        service_description: serviceDescription,
        target_market: targetMarket,
        competitors
      });
    },

    async generateBusinessInsights(insightType, data, priority = 'medium') {
      return this.client.post(`${this.endpoints.ai.business}/insights/generate`, {
        insight_type: insightType,
        data,
        priority
      });
    },

    async createBusinessForecast(forecastData) {
      return this.client.post(`${this.endpoints.ai.business}/forecast`, forecastData);
    },

    async generateBusinessRecommendations(recommendationData) {
      return this.client.post(`${this.endpoints.ai.business}/recommendations`, recommendationData);
    },

    async getBusinessRecommendations(filters = {}) {
      return this.client.get(`${this.endpoints.ai.business}/recommendations`, filters);
    },

    // Аналитика
    async trainModel(modelName, modelType, trainingData, parameters = null) {
      return this.client.post(`${this.endpoints.ai.analytics}/models/train`, {
        model_name: modelName,
        model_type: modelType,
        training_data: trainingData,
        parameters
      });
    },

    async makePrediction(modelName, inputData) {
      return this.client.post(`${this.endpoints.ai.analytics}/predict`, {
        model_name: modelName,
        input_data: inputData
      });
    },

    async getModels(modelType = null) {
      const params = modelType ? { model_type: modelType } : {};
      return this.client.get(this.endpoints.ai.models, params);
    },

    async getPredictions(userId, filters = {}) {
      const params = { user_id: userId, ...filters };
      return this.client.get(this.endpoints.ai.predictions, params);
    }
  };

  /**
   * Безопасность
   */
  security = {
    async setCacheValue(key, value, service = 'default', ttl = null) {
      return this.client.post(this.endpoints.security.cache, {
        key,
        service,
        ttl,
        data: value
      });
    },

    async getCacheValue(key, service = 'default') {
      return this.client.get(`${this.endpoints.security.cache}/${key}?service=${service}`);
    },

    async deleteCacheValue(key, service = 'default') {
      return this.client.delete(`${this.endpoints.security.cache}/${key}?service=${service}`);
    },

    async invalidateCache(pattern, service = 'default', level = 'all') {
      return this.client.post(`${this.endpoints.security.cache}/invalidate`, {
        pattern,
        service,
        level
      });
    },

    async getCacheStats() {
      return this.client.get(`${this.endpoints.security.cache}/stats`);
    },

    async createSecurityEvent(eventData) {
      return this.client.post(this.endpoints.security.events, eventData);
    },

    async checkIPSecurity(ipAddress) {
      return this.client.get(`${this.endpoints.security.ip}/${ipAddress}`);
    },

    async blockIPAddress(ipAddress, reason, duration = 3600) {
      const params = { ip_address: ipAddress, reason, duration };
      return this.client.post(`${this.endpoints.security.ip}/block`, params);
    },

    async getSecurityEvents(filters = {}) {
      return this.client.get(this.endpoints.security.events, filters);
    },

    async getPolicies() {
      return this.client.get(this.endpoints.security.policies);
    },

    async createPolicy(policyData) {
      return this.client.post(this.endpoints.security.policies, policyData);
    }
  };

  /**
   * Голосовой помощник
   */
  voice = {
    async processCommand(audioFile, language = 'ru', commandType = null) {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('language', language);
      if (commandType) formData.append('command_type', commandType);
      
      return this.client.post(this.endpoints.voice.command, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },

    async getAnalytics(userId, period = 'week') {
      return this.client.get(`${this.endpoints.voice.analytics}/${userId}?period=${period}`);
    },

    async updateSettings(userId, settingsData) {
      return this.client.put(`${this.endpoints.voice.settings}/${userId}`, settingsData);
    },

    async getSettings(userId) {
      return this.client.get(`${this.endpoints.voice.settings}/${userId}`);
    },

    async createEvent(eventData) {
      return this.client.post(this.endpoints.voice.events, eventData);
    },

    async createMetric(metricData) {
      return this.client.post(this.endpoints.voice.metrics, metricData);
    },

    async getEvents(filters = {}) {
      return this.client.get(this.endpoints.voice.events, filters);
    },

    async getMetrics(filters = {}) {
      return this.client.get(this.endpoints.voice.metrics, filters);
    }
  };

  /**
   * Дашборд
   */
  dashboard = {
    async getMetrics() {
      return this.client.get(this.endpoints.dashboard.metrics);
    },

    async getActivityData(period) {
      return this.client.get(`${this.endpoints.dashboard.activity}?period=${period}`);
    },

    async getAdminData() {
      return this.client.get(this.endpoints.dashboard.admin);
    },

    async getTaskDistribution() {
      return this.client.get(this.endpoints.dashboard.taskDistribution);
    }
  };

  /**
   * Подписка
   */
  subscription = {
    async getCards() {
      return this.client.get(this.endpoints.subscription.cards);
    },

    async getPaymentHistory() {
      return this.client.get(this.endpoints.subscription.payments);
    },

    async attachCard(cardData) {
      return this.client.post(`${this.endpoints.subscription.cards}/attach`, cardData);
    },

    async detachCard(cardData) {
      return this.client.post(`${this.endpoints.subscription.cards}/detach`, cardData);
    },

    async initiatePayment(companyId, cardId = null) {
      return this.client.post(this.endpoints.subscription.initiate, {
        company_id: companyId,
        card_id: cardId
      });
    },

    async confirmPayment(paymentId) {
      return this.client.post(this.endpoints.subscription.confirm, {
        payment_id: paymentId
      });
    },

    async activateTrial(companyId) {
      return this.client.post(this.endpoints.subscription.trial, {
        company_id: companyId
      });
    }
  };

  /**
   * Утилиты
   */
  async checkHealth() {
    return this.client.checkHealth();
  }

  getStatus() {
    return this.client.getStatus();
  }

  clearCache(pattern = null) {
    return this.client.clearCache(pattern);
  }
}

// Создаем и экспортируем единственный экземпляр API v2
const apiV2 = new ApiV2();

export default apiV2; 