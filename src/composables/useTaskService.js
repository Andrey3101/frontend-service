/**
 * Composable для работы с task-service
 * Предоставляет реактивные методы для работы с задачами
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTaskStore } from '@/stores/task';
import { useNotificationStore } from '@/stores/notification';
import { useSettingsStore } from '@/stores/settings';
import { useWebSocketStore } from '@/stores/websocket';
import taskServiceIntegration from '@/services/task-service-integration.js';
import { getTaskServiceConfig, checkTaskServiceHealth } from '@/services';

export function useTaskService() {
  // Состояние
  const tasks = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const connectionStatus = ref('disconnected');
  const lastSync = ref(null);
  
  // Фильтры и пагинация
  const filters = ref({
    status: null,
    priority: null,
    assignee: null,
    dueDate: null,
    search: null
  });
  
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0
  });

  // Выбранные задачи
  const selectedTasks = ref([]);
  const currentTask = ref(null);

  // Toast уведомления
  const toast = useToast();

  // Конфигурация
  const config = ref(getTaskServiceConfig());

  // Вычисляемые свойства
  const isConnected = computed(() => connectionStatus.value === 'connected');
  const hasTasks = computed(() => tasks.value.length > 0);
  const filteredTasks = computed(() => {
    let filtered = [...tasks.value];
    
    if (filters.value.status) {
      filtered = filtered.filter(task => task.status === filters.value.status);
    }
    
    if (filters.value.priority) {
      filtered = filtered.filter(task => task.priority === filters.value.priority);
    }
    
    if (filters.value.assignee) {
      filtered = filtered.filter(task => task.assignee === filters.value.assignee);
    }
    
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  });

  // Методы для работы с задачами
  const fetchTasks = async () => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await taskServiceIntegration.getTasksWithFilters(
        filters.value,
        pagination.value
      );
      
      tasks.value = result.tasks || [];
      pagination.value.total = result.total || 0;
      lastSync.value = new Date();
      
      toast.success(`Загружено ${tasks.value.length} задач`);
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка загрузки задач');
      console.error('Ошибка загрузки задач:', err);
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (taskData) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const newTask = await taskServiceIntegration.createTaskWithValidation(taskData);
      
      // Добавляем новую задачу в список
      tasks.value.unshift(newTask);
      pagination.value.total += 1;
      
      toast.success('Задача успешно создана');
      return newTask;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка создания задачи');
      console.error('Ошибка создания задачи:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateTask = async (taskId, taskData) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const updatedTask = await taskServiceIntegration.updateTaskWithValidation(taskId, taskData);
      
      // Обновляем задачу в списке
      const index = tasks.value.findIndex(task => task.id === taskId);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
      
      toast.success('Задача успешно обновлена');
      return updatedTask;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка обновления задачи');
      console.error('Ошибка обновления задачи:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteTask = async (taskId) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await taskServiceIntegration.deleteTaskWithConfirmation(taskId);
      
      // Удаляем задачу из списка
      const index = tasks.value.findIndex(task => task.id === taskId);
      if (index !== -1) {
        tasks.value.splice(index, 1);
        pagination.value.total -= 1;
      }
      
      toast.success('Задача успешно удалена');
      return true;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка удаления задачи');
      console.error('Ошибка удаления задачи:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const getTask = async (taskId) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const task = await taskServiceIntegration.getTask(taskId);
      currentTask.value = task;
      return task;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка загрузки задачи');
      console.error('Ошибка загрузки задачи:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Методы для работы с комментариями
  const addComment = async (taskId, commentData) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return null;
    }

    try {
      const comment = await taskServiceIntegration.addCommentToTask(taskId, commentData);
      
      // Обновляем задачу в списке
      const task = tasks.value.find(t => t.id === taskId);
      if (task && !task.comments) {
        task.comments = [];
      }
      if (task) {
        task.comments.push(comment);
      }
      
      toast.success('Комментарий добавлен');
      return comment;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка добавления комментария');
      console.error('Ошибка добавления комментария:', err);
      return null;
    }
  };

  const updateComment = async (taskId, commentId, commentData) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return null;
    }

    try {
      const comment = await taskServiceIntegration.updateCommentInTask(taskId, commentId, commentData);
      
      // Обновляем комментарий в задаче
      const task = tasks.value.find(t => t.id === taskId);
      if (task && task.comments) {
        const commentIndex = task.comments.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
          task.comments[commentIndex] = comment;
        }
      }
      
      toast.success('Комментарий обновлен');
      return comment;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка обновления комментария');
      console.error('Ошибка обновления комментария:', err);
      return null;
    }
  };

  const deleteComment = async (taskId, commentId) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return false;
    }

    try {
      await taskServiceIntegration.deleteCommentFromTask(taskId, commentId);
      
      // Удаляем комментарий из задачи
      const task = tasks.value.find(t => t.id === taskId);
      if (task && task.comments) {
        const commentIndex = task.comments.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
          task.comments.splice(commentIndex, 1);
        }
      }
      
      toast.success('Комментарий удален');
      return true;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка удаления комментария');
      console.error('Ошибка удаления комментария:', err);
      return false;
    }
  };

  // Методы для работы со временем
  const startTimeTracking = async (taskId) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return null;
    }

    try {
      const timeEntry = await taskServiceIntegration.startTimeTrackingForTask(taskId);
      
      // Обновляем статус задачи
      const task = tasks.value.find(t => t.id === taskId);
      if (task) {
        task.isTracking = true;
        task.timeEntryId = timeEntry.id;
      }
      
      toast.success('Отслеживание времени запущено');
      return timeEntry;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка запуска отслеживания времени');
      console.error('Ошибка запуска отслеживания времени:', err);
      return null;
    }
  };

  const stopTimeTracking = async (entryId) => {
    if (!isConnected.value) {
      error.value = 'Нет подключения к task-service';
      return null;
    }

    try {
      const timeEntry = await taskServiceIntegration.stopTimeTrackingForEntry(entryId);
      
      // Обновляем статус задачи
      const task = tasks.value.find(t => t.timeEntryId === entryId);
      if (task) {
        task.isTracking = false;
        task.timeEntryId = null;
      }
      
      toast.success('Отслеживание времени остановлено');
      return timeEntry;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка остановки отслеживания времени');
      console.error('Ошибка остановки отслеживания времени:', err);
      return null;
    }
  };

  // Методы для работы с фильтрами
  const updateFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1; // Сбрасываем страницу при изменении фильтров
    fetchTasks();
  };

  const clearFilters = () => {
    filters.value = {
      status: null,
      priority: null,
      assignee: null,
      dueDate: null,
      search: null
    };
    pagination.value.page = 1;
    fetchTasks();
  };

  // Методы для работы с пагинацией
  const goToPage = (page) => {
    pagination.value.page = page;
    fetchTasks();
  };

  const changeLimit = (limit) => {
    pagination.value.limit = limit;
    pagination.value.page = 1;
    fetchTasks();
  };

  // Методы для работы с выбором задач
  const selectTask = (task) => {
    const index = selectedTasks.value.findIndex(t => t.id === task.id);
    if (index === -1) {
      selectedTasks.value.push(task);
    } else {
      selectedTasks.value.splice(index, 1);
    }
  };

  const selectAllTasks = () => {
    if (selectedTasks.value.length === filteredTasks.value.length) {
      selectedTasks.value = [];
    } else {
      selectedTasks.value = [...filteredTasks.value];
    }
  };

  const clearSelection = () => {
    selectedTasks.value = [];
  };

  // Методы для массовых операций
  const bulkDeleteTasks = async () => {
    if (selectedTasks.value.length === 0) {
      toast.warning('Не выбрано ни одной задачи');
      return false;
    }

    const taskIds = selectedTasks.value.map(task => task.id);
    const results = await Promise.all(
      taskIds.map(taskId => deleteTask(taskId))
    );

    const successCount = results.filter(Boolean).length;
    const errorCount = results.length - successCount;

    if (successCount > 0) {
      toast.success(`Удалено ${successCount} задач`);
    }
    if (errorCount > 0) {
      toast.error(`Ошибка при удалении ${errorCount} задач`);
    }

    clearSelection();
    return successCount > 0;
  };

  const bulkAssignTasks = async (assigneeId) => {
    if (selectedTasks.value.length === 0) {
      toast.warning('Не выбрано ни одной задачи');
      return false;
    }

    const taskIds = selectedTasks.value.map(task => task.id);
    
    try {
      await taskServiceIntegration.bulkAssignTasksToUser(taskIds, assigneeId);
      
      toast.success(`Задачи назначены исполнителю`);
      clearSelection();
      fetchTasks(); // Обновляем список
      
      return true;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка массового назначения задач');
      console.error('Ошибка массового назначения задач:', err);
      return false;
    }
  };

  // Методы для синхронизации
  const syncData = async () => {
    try {
      const result = await taskServiceIntegration.syncAllData();
      
      if (result.success) {
        connectionStatus.value = 'synced';
        lastSync.value = new Date();
        toast.success(result.message);
        
        // Обновляем данные
        await fetchTasks();
      }
      
      return result;
    } catch (err) {
      error.value = err.message;
      toast.error('Ошибка синхронизации');
      console.error('Ошибка синхронизации:', err);
      return { success: false, error: err.message };
    }
  };

  const checkHealth = async () => {
    try {
      const health = await checkTaskServiceHealth(config.value);
      
      if (health.status === 'healthy') {
        connectionStatus.value = 'connected';
        lastSync.value = new Date();
      } else {
        connectionStatus.value = 'error';
      }
      
      return health;
    } catch (err) {
      connectionStatus.value = 'error';
      console.error('Ошибка проверки здоровья:', err);
      return { status: 'error', error: err.message };
    }
  };

  // Методы для статистики
  const getTaskStatistics = async (status = null, period = null) => {
    try {
      const stats = await taskServiceIntegration.getTaskStatistics(status, period);
      return stats;
    } catch (err) {
      error.value = err.message;
      console.error('Ошибка получения статистики:', err);
      return null;
    }
  };

  const getPerformanceMetrics = async () => {
    try {
      const metrics = await taskServiceIntegration.getPerformanceMetrics();
      return metrics;
    } catch (err) {
      error.value = err.message;
      console.error('Ошибка получения метрик производительности:', err);
      return null;
    }
  };

  // Инициализация при монтировании
  onMounted(async () => {
    // Проверяем здоровье сервиса
    await checkHealth();
    
    // Если подключение успешно, загружаем задачи
    if (isConnected.value) {
      await fetchTasks();
    }
  });

  // Очистка при размонтировании
  onUnmounted(() => {
    // Очищаем состояние
    tasks.value = [];
    selectedTasks.value = [];
    currentTask.value = null;
  });

  // Возвращаем все необходимые данные и методы
  return {
    // Состояние
    tasks,
    loading,
    error,
    connectionStatus,
    lastSync,
    filters,
    pagination,
    selectedTasks,
    currentTask,
    
    // Вычисляемые свойства
    isConnected,
    hasTasks,
    filteredTasks,
    
    // Методы для работы с задачами
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    
    // Методы для работы с комментариями
    addComment,
    updateComment,
    deleteComment,
    
    // Методы для работы со временем
    startTimeTracking,
    stopTimeTracking,
    
    // Методы для работы с фильтрами
    updateFilters,
    clearFilters,
    
    // Методы для работы с пагинацией
    goToPage,
    changeLimit,
    
    // Методы для работы с выбором задач
    selectTask,
    selectAllTasks,
    clearSelection,
    
    // Методы для массовых операций
    bulkDeleteTasks,
    bulkAssignTasks,
    
    // Методы для синхронизации
    syncData,
    checkHealth,
    
    // Методы для статистики
    getTaskStatistics,
    getPerformanceMetrics
  };
} 