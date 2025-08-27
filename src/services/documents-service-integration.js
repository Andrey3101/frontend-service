/**
 * Интеграционный сервис для documents-service
 * Обеспечивает взаимодействие между frontend и documents-service
 */

import axios from 'axios';
import { getDocumentsServiceConfig } from '../config/documents-service';

class DocumentsServiceIntegration {
  constructor() {
    this.config = getDocumentsServiceConfig();
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
   * Настраивает перехватчики для обработки ошибок
   */
  setupInterceptors() {
    // Перехватчик запросов
    this.axiosInstance.interceptors.request.use(
      (config) => {
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
      async (error) => {
        // Обрабатываем различные типы ошибок
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 400:
              this.handleBadRequest(data);
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
   * Методы для работы с документами
   */

  /**
   * Создание документа
   */
  async createDocument(templateId, data, options = {}) {
    try {
      const response = await this.axiosInstance.post('/documents', {
        template_id: templateId,
        data,
        options
      });
      
      return {
        success: true,
        document: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Получение списка документов
   */
  async getDocuments(page = 1, limit = 50, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await this.axiosInstance.get(`/documents?${params}`);
      
      return {
        success: true,
        documents: response.data.documents,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Получение документа по ID
   */
  async getDocument(documentId) {
    try {
      const response = await this.axiosInstance.get(`/documents/${documentId}`);
      
      return {
        success: true,
        document: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Обновление документа
   */
  async updateDocument(documentId, data) {
    try {
      const response = await this.axiosInstance.put(`/documents/${documentId}`, data);
      
      return {
        success: true,
        document: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Удаление документа
   */
  async deleteDocument(documentId) {
    try {
      await this.axiosInstance.delete(`/documents/${documentId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Методы для работы с шаблонами
   */

  /**
   * Получение списка шаблонов
   */
  async getTemplates(category = null, type = null) {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (type) params.append('type', type);

      const response = await this.axiosInstance.get(`/templates?${params}`);
      
      return {
        success: true,
        templates: response.data.templates,
        total: response.data.total
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Получение шаблона по ID
   */
  async getTemplate(templateId) {
    try {
      const response = await this.axiosInstance.get(`/templates/${templateId}`);
      
      return {
        success: true,
        template: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Создание шаблона
   */
  async createTemplate(templateData) {
    try {
      const response = await this.axiosInstance.post('/templates', templateData);
      
      return {
        success: true,
        template: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Обновление шаблона
   */
  async updateTemplate(templateId, templateData) {
    try {
      const response = await this.axiosInstance.put(`/templates/${templateId}`, templateData);
      
      return {
        success: true,
        template: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Удаление шаблона
   */
  async deleteTemplate(templateId) {
    try {
      await this.axiosInstance.delete(`/templates/${templateId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Методы для генерации документов
   */

  /**
   * Генерация документа из шаблона
   */
  async generateDocument(templateId, data, format = 'pdf') {
    try {
      const response = await this.axiosInstance.post('/generate', {
        template_id: templateId,
        data,
        format
      });
      
      return {
        success: true,
        document: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Конвертация документа в другой формат
   */
  async convertDocument(documentId, targetFormat) {
    try {
      const response = await this.axiosInstance.post(`/convert/${documentId}`, {
        target_format: targetFormat
      });
      
      return {
        success: true,
        converted: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Валидация документа
   */
  async validateDocument(documentId) {
    try {
      const response = await this.axiosInstance.post(`/validate/${documentId}`);
      
      return {
        success: true,
        validation: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Методы для подписи документов
   */

  /**
   * Подписание документа
   */
  async signDocument(documentId, signatureData) {
    try {
      const response = await this.axiosInstance.post(`/sign/${documentId}`, signatureData);
      
      return {
        success: true,
        signed: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Проверка подписи документа
   */
  async verifySignature(documentId) {
    try {
      const response = await this.axiosInstance.get(`/sign/${documentId}/verify`);
      
      return {
        success: true,
        verification: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Методы для экспорта и импорта
   */

  /**
   * Экспорт документа
   */
  async exportDocument(documentId, format = 'pdf') {
    try {
      const response = await this.axiosInstance.get(`/export/${documentId}`, {
        params: { format },
        responseType: 'blob'
      });
      
      return {
        success: true,
        blob: response.data,
        filename: `document_${documentId}.${format}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Импорт документа
   */
  async importDocument(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.template_id) {
        formData.append('template_id', options.template_id);
      }
      if (options.category) {
        formData.append('category', options.category);
      }

      const response = await this.axiosInstance.post('/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return {
        success: true,
        document: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Обработка ошибок
   */

  handleBadRequest(data) {
    console.error('Некорректный запрос:', data);
  }

  handleValidationError(data) {
    console.error('Ошибка валидации:', data);
  }

  handleServerError(data) {
    console.error('Ошибка сервера:', data);
  }

  handleGenericError(status, data) {
    console.error(`HTTP ${status}:`, data);
  }

  handleNetworkError() {
    console.error('Ошибка сети');
  }

  handleRequestError(error) {
    console.error('Ошибка запроса:', error);
  }

  /**
   * Проверка здоровья сервиса
   */
  async checkHealth() {
    try {
      const response = await this.axiosInstance.get('/health');
      return {
        healthy: true,
        status: response.data.status,
        timestamp: response.data.timestamp,
        version: response.data.version,
        storage: response.data.storage || {},
        templates: response.data.templates || {}
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Получение информации о сервисе
   */
  async getServiceInfo() {
    try {
      const response = await this.axiosInstance.get('/info');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения информации о documents-service:', error);
      return null;
    }
  }

  /**
   * Получение статуса сервиса
   */
  getStatus() {
    return {
      configured: !!this.config.baseURL,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      features: {
        documentGeneration: true,
        templateEngine: true,
        pdfConversion: true,
        wordConversion: true,
        digitalSigning: true,
        documentValidation: true,
        importExport: true
      }
    };
  }
}

// Создаем и экспортируем единственный экземпляр
const documentsServiceIntegration = new DocumentsServiceIntegration();

export default documentsServiceIntegration; 