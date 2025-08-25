/**
 * Сервис интеграции с task-service
 * Обеспечивает взаимодействие между frontend и backend
 */

import axios from 'axios';
import { getTaskServiceConfig } from '../config/task-service';

class TaskServiceIntegration {
  constructor() {
    this.config = getTaskServiceConfig();
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Создает экземпляр axios с базовой конфигурацией
   */
  createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return instance;
  }

  /**
   * Настраивает перехватчики для обработки ошибок и токенов
   */
  setupInterceptors() {
    // Перехватчик запросов
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Добавляем токен авторизации
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Добавляем заголовки для CORS
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Перехватчик ответов
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Обрабатываем различные типы ошибок
        if (error.response) {
          // Сервер вернул ошибку
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              this.handleUnauthorized();
              break;
            case 403:
              this.handleForbidden();
              break;
            case 404:
              this.handleNotFound();
              break;
            case 422:
              this.handleValidationError(data);
              break;
            case 500:
              this.handleServerError(data);
              break;
            default:
              this.handleGenericError(status, data);
          }
        } else if (error.request) {
          // Запрос был отправлен, но ответ не получен
          this.handleNetworkError();
        } else {
          // Ошибка при настройке запроса
          this.handleRequestError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Получает токен авторизации из localStorage
   */
  getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  /**
   * Обработчики ошибок
   */
  handleUnauthorized() {
    // Перенаправляем на страницу входа
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  handleForbidden() {
    console.error('Доступ запрещен');
  }

  handleNotFound() {
    console.error('Ресурс не найден');
  }

  handleValidationError(data) {
    console.error('Ошибка валидации:', data);
  }

  handleServerError(data) {
    console.error('Ошибка сервера:', data);
  }

  handleGenericError(status, data) {
    console.error(`Ошибка ${status}:`, data);
  }

  handleNetworkError() {
    console.error('Ошибка сети');
  }

  handleRequestError(error) {
    console.error('Ошибка запроса:', error);
  }

  /**
   * Методы для работы с задачами
   */

  /**
   * Получает список задач с фильтрами
   */
  async getTasksWithFilters(filters = {}, pagination = {}) {
    try {
      const params = new URLSearchParams();
      
      // Добавляем фильтры
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      
      // Добавляем пагинацию
      if (pagination.page) params.append('page', pagination.page);
      if (pagination.limit) params.append('limit', pagination.limit);

      const response = await this.axiosInstance.get(`/tasks?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения задач: ${error.message}`);
    }
  }

  /**
   * Создает задачу с валидацией
   */
  async createTaskWithValidation(taskData) {
    try {
      // Валидация данных
      this.validateTaskData(taskData);
      
      const response = await this.axiosInstance.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка создания задачи: ${error.message}`);
    }
  }

  /**
   * Обновляет задачу с валидацией
   */
  async updateTaskWithValidation(taskId, taskData) {
    try {
      // Валидация данных
      this.validateTaskData(taskData);
      
      const response = await this.axiosInstance.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка обновления задачи: ${error.message}`);
    }
  }

  /**
   * Удаляет задачу с подтверждением
   */
  async deleteTaskWithConfirmation(taskId) {
    try {
      const response = await this.axiosInstance.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка удаления задачи: ${error.message}`);
    }
  }

  /**
   * Получает задачу по ID
   */
  async getTask(taskId) {
    try {
      const response = await this.axiosInstance.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения задачи: ${error.message}`);
    }
  }

  /**
   * Добавляет комментарий к задаче
   */
  async addCommentToTask(taskId, commentData) {
    try {
      const response = await this.axiosInstance.post(`/tasks/${taskId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка добавления комментария: ${error.message}`);
    }
  }

  /**
   * Обновляет комментарий в задаче
   */
  async updateCommentInTask(taskId, commentId, commentData) {
    try {
      const response = await this.axiosInstance.put(`/tasks/${taskId}/comments/${commentId}`, commentData);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка обновления комментария: ${error.message}`);
    }
  }

  /**
   * Удаляет комментарий из задачи
   */
  async deleteCommentFromTask(taskId, commentId) {
    try {
      const response = await this.axiosInstance.delete(`/tasks/${taskId}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка удаления комментария: ${error.message}`);
    }
  }

  /**
   * Запускает отслеживание времени для задачи
   */
  async startTimeTrackingForTask(taskId) {
    try {
      const response = await this.axiosInstance.post(`/tasks/${taskId}/time-tracking/start`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка запуска отслеживания времени: ${error.message}`);
    }
  }

  /**
   * Останавливает отслеживание времени для записи
   */
  async stopTimeTrackingForEntry(entryId) {
    try {
      const response = await this.axiosInstance.post(`/time-tracking/${entryId}/stop`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка остановки отслеживания времени: ${error.message}`);
    }
  }

  /**
   * Массово назначает задачи пользователю
   */
  async bulkAssignTasksToUser(taskIds, assigneeId) {
    try {
      const response = await this.axiosInstance.post('/tasks/bulk-assign', {
        task_ids: taskIds,
        assignee_id: assigneeId
      });
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка массового назначения задач: ${error.message}`);
    }
  }

  /**
   * Синхронизирует все данные
   */
  async syncAllData() {
    try {
      const response = await this.axiosInstance.post('/sync/all');
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка синхронизации: ${error.message}`);
    }
  }

  /**
   * Получает статистику задач
   */
  async getTaskStatistics(status = null, period = null) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (period) params.append('period', period);

      const response = await this.axiosInstance.get(`/tasks/statistics?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения статистики: ${error.message}`);
    }
  }

  /**
   * Получает метрики производительности
   */
  async getPerformanceMetrics() {
    try {
      const response = await this.axiosInstance.get('/performance/metrics');
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения метрик производительности: ${error.message}`);
    }
  }

  /**
   * Валидация данных задачи
   */
  validateTaskData(taskData) {
    const errors = [];

    if (!taskData.title || taskData.title.trim().length === 0) {
      errors.push('Название задачи обязательно');
    }

    if (taskData.title && taskData.title.length > 255) {
      errors.push('Название задачи не может быть длиннее 255 символов');
    }

    if (taskData.description && taskData.description.length > 1000) {
      errors.push('Описание задачи не может быть длиннее 1000 символов');
    }

    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.push('Неверный формат даты выполнения');
      }
    }

    if (taskData.priority && ![1, 2, 3, 4].includes(taskData.priority)) {
      errors.push('Приоритет должен быть от 1 до 4');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  /**
   * Проверяет подключение к сервису
   */
  async checkConnection() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка подключения: ${error.message}`);
    }
  }

  /**
   * Получает информацию о сервисе
   */
  async getServiceInfo() {
    try {
      const response = await this.axiosInstance.get('/info');
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения информации о сервисе: ${error.message}`);
    }
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.axiosInstance.defaults.baseURL = this.config.baseURL;
    this.axiosInstance.defaults.timeout = this.config.timeout;
  }

  /**
   * Сбрасывает конфигурацию к значениям по умолчанию
   */
  resetConfig() {
    this.config = getTaskServiceConfig();
    this.axiosInstance.defaults.baseURL = this.config.baseURL;
    this.axiosInstance.defaults.timeout = this.config.timeout;
  }
}

// Создаем и экспортируем единственный экземпляр
const taskServiceIntegration = new TaskServiceIntegration();

export default taskServiceIntegration; 
export { TaskServiceIntegration }; 