/**
 * Обновленный интеграционный сервис для documents-service
 * Использует единый API клиент с версионированием v2
 */

import apiClient from './api-client.js';

class DocumentsServiceIntegration {
  constructor() {
    this.client = apiClient;
  }

  /**
   * Создание документа
   */
  async createDocument(templateId, data, options = {}) {
    return this.client.post('/v2/documents', {
      template_id: templateId,
      data,
      options
    });
  }

  /**
   * Получение списка документов
   */
  async getDocuments(filters = {}) {
    return this.client.get('/v2/documents', filters, { cache: true });
  }

  /**
   * Получение документа по ID
   */
  async getDocument(documentId) {
    return this.client.get(`/v2/documents/${documentId}`, null, { cache: true });
  }

  /**
   * Обновление документа
   */
  async updateDocument(documentId, documentData) {
    return this.client.put(`/v2/documents/${documentId}`, documentData);
  }

  /**
   * Удаление документа
   */
  async deleteDocument(documentId) {
    return this.client.delete(`/v2/documents/${documentId}`);
  }

  /**
   * Подписание документа
   */
  async signDocument(documentId, signatureData) {
    return this.client.post(`/v2/documents/${documentId}/sign`, signatureData);
  }

  /**
   * Экспорт документа
   */
  async exportDocument(documentId, format = 'pdf') {
    return this.client.get(`/v2/documents/${documentId}/export?format=${format}`);
  }

  /**
   * Получение шаблонов документов
   */
  async getTemplates(type = null) {
    const params = type ? { type } : {};
    return this.client.get('/v2/documents/templates', params, { cache: true });
  }

  /**
   * Получение шаблона по типу
   */
  async getTemplate(templateType) {
    return this.client.get(`/v2/documents/templates/${templateType}`, null, { cache: true });
  }

  /**
   * Генерация документа из шаблона
   */
  async generateDocument(templateType, variables) {
    return this.client.post('/v2/documents/generate', {
      template_type: templateType,
      variables
    });
  }

  /**
   * Получение отчетов
   */
  async getReports(page = 1, limit = 50, type = null) {
    const params = { page, limit };
    if (type) params.type = type;
    return this.client.get('/v2/documents/reports', params, { cache: true });
  }

  /**
   * Создание отчета
   */
  async createReport(reportData) {
    return this.client.post('/v2/documents/reports', reportData);
  }

  /**
   * Получение актов
   */
  async getActs(page = 1, limit = 50, status = null) {
    const params = { page, limit };
    if (status) params.status = status;
    return this.client.get('/v2/documents/acts', params, { cache: true });
  }

  /**
   * Создание акта
   */
  async createAct(actData) {
    return this.client.post('/v2/documents/acts', actData);
  }

  /**
   * Получение аналитики товаров
   */
  async getInventoryAnalytics(category = null) {
    const params = category ? { category } : {};
    return this.client.get('/v2/documents/inventory', params, { cache: true });
  }

  /**
   * Создание товара
   */
  async createProduct(productData) {
    return this.client.post('/v2/documents/inventory/products', productData);
  }

  /**
   * Создание транзакции товаров
   */
  async createInventoryTransaction(transactionData) {
    return this.client.post('/v2/documents/inventory/transactions', transactionData);
  }

  /**
   * Создание прогноза спроса
   */
  async createDemandForecast(forecastData) {
    return this.client.post('/v2/documents/inventory/forecast', forecastData);
  }

  /**
   * Генерация автоматических заказов
   */
  async generateAutoOrders() {
    return this.client.post('/v2/documents/inventory/auto-orders');
  }

  /**
   * Конвертация документа
   */
  async convertDocument(documentId, targetFormat) {
    return this.client.post(`/v2/documents/${documentId}/convert`, {
      target_format: targetFormat
    });
  }

  /**
   * Валидация документа
   */
  async validateDocument(documentId) {
    return this.client.post(`/v2/documents/${documentId}/validate`);
  }

  /**
   * Импорт документа
   */
  async importDocument(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });
    
    return this.client.post('/v2/documents/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Получение истории документа
   */
  async getDocumentHistory(documentId) {
    return this.client.get(`/v2/documents/${documentId}/history`, null, { cache: true });
  }

  /**
   * Восстановление версии документа
   */
  async restoreDocumentVersion(documentId, versionId) {
    return this.client.post(`/v2/documents/${documentId}/restore`, {
      version_id: versionId
    });
  }

  /**
   * Получение статистики документов
   */
  async getDocumentStats(period = 'month') {
    return this.client.get(`/v2/documents/stats?period=${period}`, null, { cache: true });
  }

  /**
   * Поиск документов
   */
  async searchDocuments(query, filters = {}) {
    const params = { query, ...filters };
    return this.client.get('/v2/documents/search', params, { cache: true });
  }

  /**
   * Получение категорий документов
   */
  async getDocumentCategories() {
    return this.client.get('/v2/documents/categories', null, { cache: true });
  }

  /**
   * Создание категории документов
   */
  async createDocumentCategory(categoryData) {
    return this.client.post('/v2/documents/categories', categoryData);
  }

  /**
   * Обновление категории документов
   */
  async updateDocumentCategory(categoryId, categoryData) {
    return this.client.put(`/v2/documents/categories/${categoryId}`, categoryData);
  }

  /**
   * Удаление категории документов
   */
  async deleteDocumentCategory(categoryId) {
    return this.client.delete(`/v2/documents/categories/${categoryId}`);
  }

  /**
   * Получение тегов документов
   */
  async getDocumentTags() {
    return this.client.get('/v2/documents/tags', null, { cache: true });
  }

  /**
   * Добавление тега к документу
   */
  async addDocumentTag(documentId, tag) {
    return this.client.post(`/v2/documents/${documentId}/tags`, { tag });
  }

  /**
   * Удаление тега из документа
   */
  async removeDocumentTag(documentId, tag) {
    return this.client.delete(`/v2/documents/${documentId}/tags/${encodeURIComponent(tag)}`);
  }

  /**
   * Получение комментариев к документу
   */
  async getDocumentComments(documentId) {
    return this.client.get(`/v2/documents/${documentId}/comments`, null, { cache: true });
  }

  /**
   * Добавление комментария к документу
   */
  async addDocumentComment(documentId, commentData) {
    return this.client.post(`/v2/documents/${documentId}/comments`, commentData);
  }

  /**
   * Обновление комментария к документу
   */
  async updateDocumentComment(documentId, commentId, commentData) {
    return this.client.put(`/v2/documents/${documentId}/comments/${commentId}`, commentData);
  }

  /**
   * Удаление комментария к документу
   */
  async deleteDocumentComment(documentId, commentId) {
    return this.client.delete(`/v2/documents/${documentId}/comments/${commentId}`);
  }

  /**
   * Проверка здоровья сервиса
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/v2/documents/health');
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
   * Получение информации о сервисе
   */
  async getServiceInfo() {
    try {
      const response = await this.client.get('/v2/documents/info');
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения информации о Documents Service: ${error.message}`);
    }
  }

  /**
   * Получение статуса сервиса
   */
  getStatus() {
    return {
      apiStatus: this.client.getStatus(),
      lastHealthCheck: this.lastHealthCheck
    };
  }
}

// Создаем и экспортируем единственный экземпляр
const documentsServiceIntegration = new DocumentsServiceIntegration();

export default documentsServiceIntegration; 