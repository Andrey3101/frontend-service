<template>
  <v-container class="tasks-container">
    <v-row>
      <v-col>
        <h1 class="page-title">Мои задачи</h1>
        
        <!-- Кнопка создания задачи -->
        <v-btn 
          color="primary" 
          @click="showCreateForm = true" 
          class="create-btn elevation-2"
          :loading="loading"
        >
          <v-icon left>mdi-plus</v-icon> Создать задачу
        </v-btn>
        
        <v-row class="filters">
          <v-col cols="12" sm="6">
            <v-select
              v-model="statusFilter"
              :items="['Все', ...statuses]"
              label="Фильтр по статусу"
              outlined
              dense
              @change="applyFilters"
              class="filter-select"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="assigneeFilter"
              :items="['Все', ...users.map(u => u.email)]"
              label="Фильтр по исполнителю"
              outlined
              dense
              @change="applyFilters"
              class="filter-autocomplete"
            />
          </v-col>
        </v-row>

        <!-- Индикатор загрузки -->
        <v-progress-linear 
          v-if="loading" 
          indeterminate 
          color="blue" 
          class="loading-bar"
        />

        <!-- Вывод ошибок -->
        <v-dialog v-model="showErrorModal" max-width="500px" persistent>
          <v-card>
            <v-card-title class="error-title">
              <v-icon color="error" left>mdi-alert-circle</v-icon>
              Ошибка
            </v-card-title>
            <v-card-text class="error-message">
              {{ errorMessage }}
              <div v-if="errorDetails" class="error-details">
                {{ errorDetails }}
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn 
                color="primary" 
                text 
                @click="closeErrorModal"
              >
                Закрыть
              </v-btn>
              <v-btn 
                v-if="errorMessage.includes('Подписка')"
                color="primary" 
                @click="router.push('/profile')"
              >
                Оформить подписку
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-data-table
          :headers="headers"
          :items="filteredTasks"
          :loading="loading"
          class="task-table"
          :class="{ 'tracking-row': task.isTracking }"
          v-for="task in filteredTasks"
          :key="task.task_id"
        >
          <!-- Слоты для отображения данных -->
          <template v-slot:item.priority="{ item }">
            <v-chip 
              :color="getPriorityColor(item.priority)" 
              small 
              class="priority-chip"
            >
              {{ item.priority }}
            </v-chip>
          </template>

          <template v-slot:item.progress="{ item }">
            <v-progress-linear
              :value="getProgressValue(item.status)"
              :color="getProgressColor(item.status)"
              height="8"
              rounded
              class="progress-bar"
            />
          </template>

          <template v-slot:item.total_time="{ item }">
            <span class="total-time">{{ formatTime(item.total_time) }}</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn
                  v-if="!item.isTracking"
                  icon
                  color="green"
                  @click.stop="startTracking(item)"
                  :loading="item.loading"
                  class="action-btn"
                  v-on="on"
                >
                  <v-icon>mdi-play</v-icon>
                </v-btn>
                <v-btn
                  v-else
                  icon
                  color="red"
                  @click.stop="stopTracking(item)"
                  :loading="item.loading"
                  class="action-btn"
                  v-on="on"
                >
                  <v-icon>mdi-stop</v-icon>
                </v-btn>
              </template>
              <span>{{ item.isTracking ? 'Остановить отслеживание времени' : 'Начать отслеживание времени' }}</span>
            </v-tooltip>

            <span v-if="item.isTracking" class="tracking-time">
              {{ formatTime(item.trackingTime) }}
            </span>

            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn 
                  icon 
                  class="edit-btn" 
                  @click.stop="editTask(item)"
                  v-on="on"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>Редактировать задачу</span>
            </v-tooltip>

            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn 
                  icon 
                  class="delete-btn" 
                  @click.stop="confirmDeleteTask(item.task_id)"
                  v-on="on"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>Удалить задачу</span>
            </v-tooltip>
          </template>
        </v-data-table>

        <!-- Диалог создания задачи -->
        <v-dialog v-model="showCreateForm" max-width="600px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Создание задачи</v-card-title>
            <v-card-text class="dialog-content">
              <v-text-field 
                v-model="newTask.title" 
                label="Название" 
                outlined 
                :rules="[v => !!v || 'Введите название']" 
                :error-messages="fieldErrors.title"
                @input="clearFieldError('title')"
              />
              <v-textarea 
                v-model="newTask.description" 
                label="Описание" 
                outlined 
                :error-messages="fieldErrors.description"
                @input="clearFieldError('description')"
              />
              <v-select 
                v-model="newTask.priority" 
                :items="priorities" 
                label="Приоритет" 
                outlined 
                :rules="[v => !!v || 'Выберите приоритет']" 
              />
              <v-select 
                v-model="newTask.status" 
                :items="statuses" 
                label="Статус" 
                outlined 
                :rules="[v => !!v || 'Выберите статус']" 
              />
              <v-autocomplete
                v-model="newTask.assignee"
                :items="users"
                item-text="email"
                item-value="email"
                label="Исполнитель"
                outlined
                :rules="assigneeRules"
                :error-messages="fieldErrors.assignee"
                @input="clearFieldError('assignee')"
              />
              <v-menu
                v-model="datePicker"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="newTask.due_date"
                    label="Срок выполнения"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    :rules="dateRules"
                    :error-messages="fieldErrors.due_date"
                    @input="clearFieldError('due_date')"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="newTask.due_date"
                  @input="datePicker = false"
                ></v-date-picker>
              </v-menu>
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn 
                color="grey" 
                text 
                @click="cancelCreate" 
                :disabled="loading"
              >
                Отмена
              </v-btn>
              <v-btn 
                color="primary" 
                @click="createTask" 
                :disabled="!isCreateFormValid || loading"
                :loading="loading"
              >
                Создать
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог редактирования задачи -->
        <v-dialog v-model="showEditForm" max-width="600px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">Редактирование задачи</v-card-title>
            <v-card-text class="dialog-content">
              <v-text-field 
                v-model="editTask.title" 
                label="Название" 
                outlined 
                :rules="[v => !!v || 'Введите название']"
                :error-messages="fieldErrors.title"
                @input="clearFieldError('title')"
              />
              <v-textarea 
                v-model="editTask.description" 
                label="Описание" 
                outlined 
                :error-messages="fieldErrors.description"
                @input="clearFieldError('description')"
              />
              <v-select 
                v-model="editTask.priority" 
                :items="priorities" 
                label="Приоритет" 
                outlined 
                :rules="[v => !!v || 'Выберите приоритет']" 
              />
              <v-select 
                v-model="editTask.status" 
                :items="statuses" 
                label="Статус" 
                outlined 
                :rules="[v => !!v || 'Выберите статус']" 
              />
              <v-autocomplete
                v-model="editTask.assignee"
                :items="users"
                item-text="email"
                item-value="email"
                label="Исполнитель"
                outlined
                :rules="assigneeRules"
                :error-messages="fieldErrors.assignee"
                @input="clearFieldError('assignee')"
              />
              <v-menu
                v-model="editDatePicker"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="editTask.due_date"
                    label="Срок выполнения"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    :rules="dateRules"
                    :error-messages="fieldErrors.due_date"
                    @input="clearFieldError('due_date')"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="editTask.due_date"
                  @input="editDatePicker = false"
                ></v-date-picker>
              </v-menu>
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn 
                color="grey" 
                text 
                @click="cancelEdit" 
                :disabled="loading"
              >
                Отмена
              </v-btn>
              <v-btn 
                color="primary" 
                @click="updateTask" 
                :disabled="!isEditFormValid || loading"
                :loading="loading"
              >
                Сохранить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог подтверждения удаления -->
        <v-dialog v-model="showDeleteConfirm" max-width="400px" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title delete-confirm-title">
              Удаление задачи
            </v-card-title>
            <v-card-text class="dialog-text">
              Вы уверены, что хотите удалить задачу?
              <br><br>
              <strong>Эта операция необратима!</strong>
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn 
                color="grey" 
                text 
                @click="showDeleteConfirm = false" 
                :disabled="loading"
              >
                Отмена
              </v-btn>
              <v-btn 
                color="red" 
                @click="deleteTask" 
                :loading="loading"
              >
                Подтвердить удаление
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { getMyTasks, createTask, updateTask, deleteTask, getUsers, fetchWithCsrf, startTimeTracking, stopTimeTracking, BASE_URLS } from '@/api/index.js';

export default {
  name: 'TasksList',
  setup() {
    const router = useRouter();
    const toast = useToast();

    const tasks = ref([]);
    const users = ref([]);
    const loading = ref(false);
    const showErrorModal = ref(false);
    const errorMessage = ref('');
    const errorDetails = ref('');
    const fieldErrors = ref({});
    const showCreateForm = ref(false);
    const showEditForm = ref(false);
    const showDeleteConfirm = ref(false);
    const datePicker = ref(false);
    const editDatePicker = ref(false);
    const deleteTaskId = ref(null);
    const statusFilter = ref('Все');
    const assigneeFilter = ref('Все');

    const newTask = ref({
      title: '',
      description: '',
      priority: 'Средний',
      status: 'Новая',
      assignee: '',
      due_date: '',
    });

    const editTask = ref({
      task_id: null,
      title: '',
      description: '',
      priority: 'Средний',
      status: 'Новая',
      assignee: '',
      due_date: '',
    });

    const headers = [
      { text: 'Название', value: 'title', sortable: true },
      { text: 'Статус', value: 'status', sortable: true },
      { text: 'Исполнитель', value: 'assignee', sortable: true },
      { text: 'Приоритет', value: 'priority', sortable: true },
      { text: 'Прогресс', value: 'progress', sortable: false },
      { text: 'Срок', value: 'due_date', sortable: true },
      { text: 'Время', value: 'total_time', sortable: true },
      { text: 'Действия', value: 'actions', sortable: false },
    ];

    const priorities = ['Низкий', 'Средний', 'Высокий'];
    const statuses = ['Новая', 'В работе', 'Завершена', 'Отменена'];

    const dateRules = [
      (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) || 'Дата должна быть в формате YYYY-MM-DD',
    ];

    const assigneeRules = [
      (v) => !!v || 'Выберите исполнителя',
      (v) => users.value.some(user => user.email === v) || 'Исполнитель должен быть в списке пользователей',
    ];

    const isMobile = computed(() => window.innerWidth <= 960);

    const isCreateFormValid = computed(() => isFormValid(newTask.value));
    const isEditFormValid = computed(() => isFormValid(editTask.value));

    const filteredTasks = computed(() => {
      return tasks.value.filter(task => {
        const statusMatch = statusFilter.value === 'Все' || task.status === statusFilter.value;
        const assigneeMatch = assigneeFilter.value === 'Все' || task.assignee === assigneeFilter.value;
        return statusMatch && assigneeMatch;
      });
    });

    const fetchTasks = async () => {
      loading.value = true;
      try {
        const response = await getMyTasks();
        const activeTracking = await fetchWithCsrf(`${BASE_URLS.auth}/time/active`);
        const totalTimeResponse = await fetchWithCsrf(`${BASE_URLS.auth}/time/total`);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        tasks.value = Array.isArray(response?.tasks) 
          ? processTasks(response.tasks, activeTracking, totalTimeResponse) 
          : [];
      } catch (error) {
        handleError(error, 'Не удалось загрузить задачи', 'Проверьте соединение или подписку.');
      } finally {
        loading.value = false;
      }
    };

    const processTasks = (tasks, activeTracking, totalTimeResponse) => {
      const reversePriorityMap = { 1: 'Низкий', 2: 'Средний', 3: 'Высокий' };
      return tasks.map(task => {
        const active = activeTracking.find(t => t.task_id === task.id);
        const totalTime = totalTimeResponse.find(t => t.task_id === task.id)?.total_time || 0;
        const formattedTask = {
          ...task,
          task_id: task.id,
          assignee: task.assignees?.[0]?.user_id || '',
          priority: reversePriorityMap[task.priority] || task.priority,
          due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        };
        
        if (active) {
          const startTime = new Date(active.start_time).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          return {
            ...formattedTask,
            isTracking: true,
            loading: false,
            timeEntryId: active.entry_id,
            trackingTime: elapsedSeconds,
            total_time: totalTime + elapsedSeconds,
            timer: setInterval(() => {
              formattedTask.trackingTime++;
              formattedTask.total_time = totalTime + formattedTask.trackingTime;
            }, 1000),
          };
        }
        
        return {
          ...formattedTask,
          isTracking: false,
          loading: false,
          timeEntryId: null,
          trackingTime: 0,
          total_time: totalTime,
        };
      });
    };

    const fetchUsers = async () => {
      loading.value = true;
      try {
        const response = await getUsers();
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        users.value = Array.isArray(response) ? response : [];
      } catch (error) {
        handleError(error, 'Не удалось загрузить пользователей', 'Проверьте соединение или подписку.');
      } finally {
        loading.value = false;
      }
    };

    const createTask = async () => {
      if (!isCreateFormValid.value) return;
      
      loading.value = true;
      try {
        const response = await createTask(newTask.value);
        
        if (response.error) {
          if (response.errors) {
            fieldErrors.value = response.errors;
            throw new Error('Проверьте правильность заполнения полей');
          }
          throw new Error(response.error);
        }
        
        toast.success('Задача успешно создана');
        await fetchTasks();
        cancelCreate();
      } catch (error) {
        handleError(error, 'Не удалось создать задачу', 'Проверьте данные или подписку.');
      } finally {
        loading.value = false;
      }
    };

    const editTask = (task) => {
      editTask.value = { 
        task_id: task.task_id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
        due_date: task.due_date
      };
      showEditForm.value = true;
    };

    const updateTask = async () => {
      if (!isEditFormValid.value) return;
      
      loading.value = true;
      try {
        const response = await updateTask(editTask.value.task_id, editTask.value);
        
        if (response.error) {
          if (response.errors) {
            fieldErrors.value = response.errors;
            throw new Error('Проверьте правильность заполнения полей');
          }
          throw new Error(response.error);
        }
        
        toast.success('Задача успешно обновлена');
        await fetchTasks();
        cancelEdit();
      } catch (error) {
        handleError(error, 'Не удалось обновить задачу', 'Проверьте данные или подписку.');
      } finally {
        loading.value = false;
      }
    };

    const confirmDeleteTask = (taskId) => {
      deleteTaskId.value = taskId;
      showDeleteConfirm.value = true;
    };

    const deleteTask = async () => {
      loading.value = true;
      try {
        const response = await deleteTask(deleteTaskId.value);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        toast.success('Задача успешно удалена');
        await fetchTasks();
        showDeleteConfirm.value = false;
        deleteTaskId.value = null;
      } catch (error) {
        handleError(error, 'Не удалось удалить задачу', 'Проверьте данные или подписку.');
      } finally {
        loading.value = false;
      }
    };

    const cancelCreate = () => {
      showCreateForm.value = false;
      newTask.value = { 
        title: '', 
        description: '', 
        priority: 'Средний', 
        status: 'Новая', 
        assignee: '', 
        due_date: '' 
      };
      clearFieldErrors();
    };

    const cancelEdit = () => {
      showEditForm.value = false;
      editTask.value = { 
        task_id: null,
        title: '', 
        description: '', 
        priority: 'Средний', 
        status: 'Новая', 
        assignee: '', 
        due_date: '' 
      };
      clearFieldErrors();
    };

    const applyFilters = () => {
      fetchTasks();
    };

    const startTracking = async (task) => {
      task.loading = true;
      try {
        const response = await startTimeTracking(task.task_id);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        const totalTimeResponse = await fetchWithCsrf(`${BASE_URLS.auth}/time/total?task_id=${task.task_id}`);
        const totalTime = totalTimeResponse.total_time || 0;
        
        task.isTracking = true;
        task.timeEntryId = response.entry_id;
        task.trackingTime = 0;
        task.total_time = totalTime;
        
        task.timer = setInterval(() => {
          task.trackingTime++;
          task.total_time = totalTime + task.trackingTime;
        }, 1000);
        
        toast.success('Трекинг времени начат');
      } catch (error) {
        handleError(error, 'Ошибка при запуске трекинга', 'Проверьте подписку.');
      } finally {
        task.loading = false;
      }
    };

    const stopTracking = async (task) => {
      task.loading = true;
      try {
        const response = await stopTimeTracking(task.timeEntryId);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        clearInterval(task.timer);
        task.isTracking = false;
        task.timeEntryId = null;
        task.trackingTime = 0;
        
        toast.success('Трекинг времени остановлен');
        await fetchTasks();
      } catch (error) {
        handleError(error, 'Ошибка при остановке трекинга', 'Проверьте подписку.');
      } finally {
        task.loading = false;
      }
    };

    const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const clearAllTimers = () => {
      tasks.value.forEach(task => {
        if (task.timer) {
          clearInterval(task.timer);
        }
      });
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'Высокий': return 'red';
        case 'Средний': return 'orange';
        case 'Низкий': return 'green';
        default: return 'grey';
      }
    };

    const getProgressValue = (status) => {
      switch (status) {
        case 'Новая': return 0;
        case 'В работе': return 50;
        case 'Завершена': return 100;
        case 'Отменена': return 0;
        default: return 0;
      }
    };

    const getProgressColor = (status) => {
      switch (status) {
        case 'Завершена': return 'green';
        case 'В работе': return 'blue';
        case 'Отменена': return 'red';
        default: return 'grey';
      }
    };

    const isFormValid = (task) => {
      return (
        !!task?.title &&
        dateRules.every(rule => rule(task?.due_date || '') === true) &&
        !!task?.priority &&
        !!task?.status &&
        assigneeRules.every(rule => rule(task?.assignee) === true)
      );
    };

    const handleError = (error, defaultMessage, defaultDetails = '') => {
      console.error('Error:', error);
      
      let message = defaultMessage;
      let details = defaultDetails;
      
      if (error.response) {
        switch(error.response.status) {
          case 400:
            message = 'Некорректные данные';
            if (error.response.data?.errors) {
              fieldErrors.value = error.response.data.errors;
            }
            break;
          case 401:
            message = 'Требуется авторизация';
            details = 'Пожалуйста, войдите снова.';
            router.push('/login');
            break;
          case 402:
            message = 'Подписка истекла';
            details = 'Оформите подписку для продолжения работы.';
            break;
          case 403:
            message = 'Доступ запрещен';
            details = 'У вас недостаточно прав.';
            break;
          case 404:
            message = 'Данные не найдены';
            break;
          case 500:
            message = 'Ошибка сервера';
            details = 'Попробуйте позже.';
            break;
          default:
            message = error.response.data?.message || error.response.data?.detail || defaultMessage;
            details = error.response.data?.errors || defaultDetails;
        }
      } else if (error.request) {
        message = 'Проблемы с соединением';
        details = 'Проверьте интернет и попробуйте снова.';
      } else {
        message = error.message || defaultMessage;
      }
      
      showError(message, details);
    };

    const showError = (message, details = '') => {
      errorMessage.value = message;
      errorDetails.value = details;
      showErrorModal.value = true;
      toast.error(message);
    };

    const closeErrorModal = () => {
      showErrorModal.value = false;
      errorMessage.value = '';
      errorDetails.value = '';
    };

    const clearFieldErrors = () => {
      fieldErrors.value = {};
    };

    const clearFieldError = (field) => {
      if (fieldErrors.value[field]) {
        delete fieldErrors.value[field];
      }
    };

    fetchTasks();
    fetchUsers();

    return {
      tasks,
      users,
      loading,
      showErrorModal,
      errorMessage,
      errorDetails,
      fieldErrors,
      showCreateForm,
      showEditForm,
      showDeleteConfirm,
      datePicker,
      editDatePicker,
      deleteTaskId,
      statusFilter,
      assigneeFilter,
      newTask,
      editTask,
      headers,
      priorities,
      statuses,
      dateRules,
      assigneeRules,
      isMobile,
      isCreateFormValid,
      isEditFormValid,
      filteredTasks,
      fetchTasks,
      fetchUsers,
      createTask,
      editTask,
      updateTask,
      confirmDeleteTask,
      deleteTask,
      cancelCreate,
      cancelEdit,
      applyFilters,
      startTracking,
      stopTracking,
      formatTime,
      clearAllTimers,
      getPriorityColor,
      getProgressValue,
      getProgressColor,
      isFormValid,
      handleError,
      showError,
      closeErrorModal,
      clearFieldErrors,
      clearFieldError,
      router,
    };
  },
};
</script>

<style scoped>
.tasks-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 2rem;
  font-weight: 500;
  color: #1976d2;
  margin-bottom: 20px;
  text-align: center;
}

.create-btn {
  margin-bottom: 20px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #1976d2, #2196f3);
  color: white;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.filters {
  margin-bottom: 20px;
  gap: 16px;
}

.filter-select,
.filter-autocomplete {
  border-radius: 8px;
  background-color: white;
}

.loading-bar {
  margin-bottom: 16px;
  border-radius: 4px;
}

.error-title {
  color: #d32f2f;
  font-size: 1.25rem;
  font-weight: 500;
  padding: 16px;
  border-bottom: 1px solid #ffcdd2;
}

.error-message {
  padding: 20px;
  color: #5f2120;
  font-size: 1rem;
  line-height: 1.5;
}

.error-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  font-size: 0.9rem;
}

.task-table {
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  background-color: white;
}

.task-table :deep(.v-data-table-header th) {
  background-color: #e3f2fd;
  color: #0d47a1;
  font-weight: 600;
  font-size: 0.9rem;
}

.task-table :deep(tr:hover) {
  background-color: #e3f2fd !important;
  transition: background-color 0.2s ease;
}

.tracking-row {
  background-color: #e8f5e9 !important;
}

.priority-chip {
  color: white;
  font-weight: 500;
  border-radius: 12px;
  min-width: 80px;
  justify-content: center;
}

.progress-bar {
  margin: 4px 0;
  width: 100%;
}

.total-time {
  font-size: 0.9rem;
  color: #333;
  font-family: monospace;
}

.action-btn {
  margin: 0 4px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.tracking-time {
  font-size: 0.9rem;
  color: #555;
  margin-left: 8px;
  vertical-align: middle;
  font-family: monospace;
}

.edit-btn,
.delete-btn {
  margin: 0 4px;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  color: #1976d2;
  transform: scale(1.1);
}

.delete-btn:hover {
  color: #d32f2f;
  transform: scale(1.1);
}

.dialog-card {
  border-radius: 12px;
  overflow: hidden;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  background-color: #f5f7fa;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-content {
  padding: 20px;
}

.dialog-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.delete-confirm-title {
  color: #d32f2f;
}

.dialog-text {
  font-size: 1rem;
  color: #555;
  padding: 16px;
  line-height: 1.5;
}

/* Анимации */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Адаптивность */
@media (max-width: 960px) {
  .tasks-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .create-btn {
    width: 100%;
    margin-bottom: 16px;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .task-table {
    overflow-x: auto;
  }
  
  .task-table :deep(.v-data-table-header th),
  .task-table :deep(td) {
    font-size: 0.85rem;
    padding: 8px 4px;
  }
  
  .priority-chip {
    font-size: 0.75rem;
    height: 24px;
    min-width: 70px;
  }
  
  .progress-bar {
    height: 6px;
  }
  
  .total-time {
    font-size: 0.75rem;
  }
  
  .action-btn, .edit-btn, .delete-btn {
    margin: 2px;
    width: 32px;
    height: 32px;
  }
  
  .action-btn .v-icon,
  .edit-btn .v-icon,
  .delete-btn .v-icon {
    font-size: 18px;
  }
  
  .tracking-time {
    font-size: 0.75rem;
    margin-left: 4px;
  }
  
  .dialog-content {
    padding: 16px;
  }
  
  .dialog-actions {
    flex-direction: column;
    padding: 12px;
  }
  
  .dialog-btn {
    width: 100%;
    margin: 4px 0;
  }
}

@media (max-width: 600px) {
  .tasks-container {
    padding: 12px;
  }
  
  .page-title {
    font-size: 1.3rem;
  }
  
  .task-table :deep(.v-data-table-header th),
  .task-table :deep(td) {
    font-size: 0.8rem;
    padding: 6px 2px;
  }
  
  .priority-chip {
    min-width: 60px;
  }
}
</style>