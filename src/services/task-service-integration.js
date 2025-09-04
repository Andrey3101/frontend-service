/**
 * Обновленный сервис интеграции с task-service
 * Использует единый API клиент с версионированием v2
 */

import apiClient from './api-client.js';
import websocketService from './websocket-service.js';
import { getWebSocketConfig } from '../config/task-service';

class TaskServiceIntegration {
  constructor() {
    this.client = apiClient;
    this.wsService = websocketService;
  }

  /**
   * Получение списка задач
   */
  async getTasks(filters = {}) {
    return this.client.get('/v2/tasks', filters, { cache: true });
  }

  /**
   * Получение задачи по ID
   */
  async getTask(taskId) {
    return this.client.get(`/v2/tasks/${taskId}`, null, { cache: true });
  }

  /**
   * Создание новой задачи
   */
  async createTask(taskData) {
    return this.client.post('/v2/tasks', taskData);
  }

  /**
   * Обновление задачи
   */
  async updateTask(taskId, taskData) {
    return this.client.put(`/v2/tasks/${taskId}`, taskData);
  }

  /**
   * Удаление задачи
   */
  async deleteTask(taskId) {
    return this.client.delete(`/v2/tasks/${taskId}`);
  }

  /**
   * Получение комментариев к задаче
   */
  async getComments(taskId) {
    return this.client.get(`/v2/tasks/${taskId}/comments`, null, { cache: true });
  }

  /**
   * Добавление комментария
   */
  async addComment(taskId, commentData) {
    return this.client.post(`/v2/tasks/${taskId}/comments`, commentData);
  }

  /**
   * Обновление комментария
   */
  async updateComment(taskId, commentId, commentData) {
    return this.client.put(`/v2/tasks/${taskId}/comments/${commentId}`, commentData);
  }

  /**
   * Удаление комментария
   */
  async deleteComment(taskId, commentId) {
    return this.client.delete(`/v2/tasks/${taskId}/comments/${commentId}`);
  }

  /**
   * Начало отслеживания времени
   */
  async startTimeTracking(taskId) {
    return this.client.post(`/v2/tasks/${taskId}/time/start`);
  }

  /**
   * Остановка отслеживания времени
   */
  async stopTimeTracking(entryId) {
    return this.client.post(`/v2/tasks/time/stop?entry_id=${entryId}`);
  }

  /**
   * Получение отчета по времени
   */
  async getTimeReport(period = 'week') {
    return this.client.get(`/v2/tasks/time/report?period=${period}`, null, { cache: true });
  }

  /**
   * Получение активных записей времени
   */
  async getActiveTimeEntries() {
    return this.client.get('/v2/tasks/time/active', null, { cache: true });
  }

  /**
   * Получение встреч
   */
  async getMeetings(filters = {}) {
    return this.client.get('/v2/tasks/meetings', filters, { cache: true });
  }

  /**
   * Получение встречи по ID
   */
  async getMeeting(meetingId) {
    return this.client.get(`/v2/tasks/meetings/${meetingId}`, null, { cache: true });
  }

  /**
   * Создание встречи
   */
  async createMeeting(meetingData) {
    return this.client.post('/v2/tasks/meetings', meetingData);
  }

  /**
   * Обновление встречи
   */
  async updateMeeting(meetingId, meetingData) {
    return this.client.put(`/v2/tasks/meetings/${meetingId}`, meetingData);
  }

  /**
   * Удаление встречи
   */
  async deleteMeeting(meetingId) {
    return this.client.delete(`/v2/tasks/meetings/${meetingId}`);
  }

  /**
   * Получение важных дат
   */
  async getImportantDates(filters = {}) {
    return this.client.get('/v2/tasks/important-dates', filters, { cache: true });
  }

  /**
   * Получение важной даты по ID
   */
  async getImportantDate(dateId) {
    return this.client.get(`/v2/tasks/important-dates/${dateId}`, null, { cache: true });
  }

  /**
   * Создание важной даты
   */
  async createImportantDate(dateData) {
    return this.client.post('/v2/tasks/important-dates', dateData);
  }

  /**
   * Обновление важной даты
   */
  async updateImportantDate(dateId, dateData) {
    return this.client.put(`/v2/tasks/important-dates/${dateId}`, dateData);
  }

  /**
   * Удаление важной даты
   */
  async deleteImportantDate(dateId) {
    return this.client.delete(`/v2/tasks/important-dates/${dateId}`);
  }

  /**
   * Получение интеграций
   */
  async getIntegrations() {
    return this.client.get('/v2/tasks/integrations', null, { cache: true });
  }

  /**
   * Получение интеграции по ID
   */
  async getIntegration(integrationId) {
    return this.client.get(`/v2/tasks/integrations/${integrationId}`, null, { cache: true });
  }

  /**
   * Создание интеграции
   */
  async createIntegration(integrationData) {
    return this.client.post('/v2/tasks/integrations', integrationData);
  }

  /**
   * Обновление интеграции
   */
  async updateIntegration(integrationId, integrationData) {
    return this.client.put(`/v2/tasks/integrations/${integrationId}`, integrationData);
  }

  /**
   * Удаление интеграции
   */
  async deleteIntegration(integrationId) {
    return this.client.delete(`/v2/tasks/integrations/${integrationId}`);
  }

  /**
   * Синхронизация интеграции
   */
  async syncIntegration(integrationId) {
    return this.client.post(`/v2/tasks/integrations/${integrationId}/sync`);
  }

  /**
   * Получение контактов
   */
  async getContacts(filters = {}) {
    return this.client.get('/v2/tasks/contacts', filters, { cache: true });
  }

  /**
   * Получение контакта по ID
   */
  async getContact(contactId) {
    return this.client.get(`/v2/tasks/contacts/${contactId}`, null, { cache: true });
  }

  /**
   * Создание контакта
   */
  async createContact(contactData) {
    return this.client.post('/v2/tasks/contacts', contactData);
  }

  /**
   * Обновление контакта
   */
  async updateContact(contactId, contactData) {
    return this.client.put(`/v2/tasks/contacts/${contactId}`, contactData);
  }

  /**
   * Удаление контакта
   */
  async deleteContact(contactId) {
    return this.client.delete(`/v2/tasks/contacts/${contactId}`);
  }

  /**
   * Получение аналитики
   */
  async getAnalytics(period = 'week') {
    return this.client.get(`/v2/tasks/analytics?period=${period}`, null, { cache: true });
  }

  /**
   * Получение предложений
   */
  async getSuggestions(text) {
    return this.client.get(`/v2/tasks/suggestions?text=${encodeURIComponent(text)}`, null, { cache: true });
  }

  /**
   * Создание предиктивной задачи
   */
  async createPredictiveTask(text, confirmSuggestion = false, suggestionAction = {}) {
    return this.client.post('/v2/tasks/predictive', {
      text,
      confirm_suggestion: confirmSuggestion,
      suggestion_action: suggestionAction
    });
  }

  /**
   * Подключение к WebSocket
   */
  async connectWebSocket() {
    const wsConfig = getWebSocketConfig();
    return this.wsService.connect(wsConfig.url);
  }

  /**
   * Отключение от WebSocket
   */
  async disconnectWebSocket() {
    return this.wsService.disconnect();
  }

  /**
   * Отправка сообщения через WebSocket
   */
  async sendWebSocketMessage(type, payload = {}) {
    return this.wsService.send({
      type,
      payload,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Подписка на WebSocket события
   */
  on(event, callback) {
    return this.wsService.on(event, callback);
  }

  /**
   * Отписка от WebSocket событий
   */
  off(event, callback) {
    return this.wsService.off(event, callback);
  }

  /**
   * Проверка здоровья сервиса
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/v2/tasks/health');
      return {
        healthy: true,
        status: response.data.status,
        timestamp: response.data.timestamp,
        version: response.data.version
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Получение статуса сервиса
   */
  getStatus() {
    return {
      wsConnected: this.wsService.isConnected,
      wsStatus: this.wsService.getStatus(),
      apiStatus: this.client.getStatus()
    };
  }
}

// Создаем и экспортируем единственный экземпляр
const taskServiceIntegration = new TaskServiceIntegration();

export default taskServiceIntegration; 
export { TaskServiceIntegration }; 