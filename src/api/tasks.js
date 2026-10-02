/**
 * task-service: задачи, комментарии, учёт времени, статистика, подсказки,
 * массовое назначение, повторяющиеся задачи, налоговые напоминания.
 */
import { cleanParams, http } from './http.js';

// ---------------------------------------------------------------- задачи

/**
 * GET /api/tasks — список задач компании.
 * @param {{status?: import('./types.js').TaskStatus, priority?: import('./types.js').TaskPriority,
 *   assignee_id?: string, search?: string, mine?: boolean, due_from?: string, due_to?: string,
 *   sort?: 'created_at'|'-created_at'|'due_date'|'-due_date'|'priority'|'-updated_at',
 *   page?: number, limit?: number}} [params]
 *   mine=true — назначены мне или созданы мной; due_from/due_to — дата или ISO-время.
 * @returns {Promise<import('./types.js').Page<import('./types.js').Task>>}
 */
export async function listTasks(params = {}) {
  return (await http.get('/tasks', { params: cleanParams(params) })).data;
}

/**
 * GET /api/tasks/{id}
 * @param {string} id
 * @returns {Promise<import('./types.js').Task>}
 */
export async function getTask(id) {
  return (await http.get(`/tasks/${id}`)).data;
}

/**
 * POST /api/tasks — создать задачу. 201. Обязателен только title.
 * due_date — ISO 8601 ('2026-10-02T12:00:00Z') или 'YYYY-MM-DD' (сервер ставит 12:00 UTC).
 * При назначении на другого пользователя передавайте и assignee_name (сервис не ходит за именами).
 * @param {import('./types.js').TaskInput & {title: string}} data
 * @returns {Promise<import('./types.js').Task>}
 */
export async function createTask(data) {
  return (await http.post('/tasks', data)).data;
}

/**
 * PUT /api/tasks/{id} — частичное обновление (только переданные поля).
 * status='done' выставляет completed_at. user может менять только свои/назначенные задачи.
 * @param {string} id
 * @param {import('./types.js').TaskInput} data
 * @returns {Promise<import('./types.js').Task>}
 */
export async function updateTask(id, data) {
  return (await http.put(`/tasks/${id}`, data)).data;
}

/**
 * DELETE /api/tasks/{id} — 204.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTask(id) {
  await http.delete(`/tasks/${id}`);
}

/**
 * GET /api/tasks/stats — сводка по задачам компании.
 * @returns {Promise<{total: number,
 *   by_status: {todo: number, in_progress: number, done: number, cancelled: number},
 *   by_priority: {low: number, medium: number, high: number, urgent: number},
 *   overdue: number, due_today: number, completed_this_week: number}>}
 */
export async function getTaskStats() {
  return (await http.get('/tasks/stats')).data;
}

/**
 * GET /api/tasks/activity — создано/завершено по дням за последние N дней.
 * @param {{days?: number}} [params] по умолчанию 30
 * @returns {Promise<{items: {date: string, created: number, completed: number}[]}>}
 */
export async function getTaskActivity(params = {}) {
  return (await http.get('/tasks/activity', { params: cleanParams(params) })).data;
}

/**
 * GET /api/tasks/suggestions — на что обратить внимание: просроченные, срок ≤ 2 дней,
 * urgent/high в статусе todo.
 * @returns {Promise<{items: {task_id: string, title: string, reason: string}[]}>}
 */
export async function getTaskSuggestions() {
  return (await http.get('/tasks/suggestions')).data;
}

/**
 * POST /api/tasks/bulk-assign — назначить несколько задач одному исполнителю.
 * @param {{task_ids: string[], assignee_id: string, assignee_name?: string}} data
 * @returns {Promise<{updated: number}>}
 */
export async function bulkAssignTasks(data) {
  return (await http.post('/tasks/bulk-assign', data)).data;
}

/**
 * POST /api/tasks/recurring — создать серию задач. 201.
 * @param {import('./types.js').TaskInput & {title: string, recurrence: 'daily'|'weekly'|'monthly',
 *   count: number, start_date: string}} data  count 1..52, start_date 'YYYY-MM-DD'
 * @returns {Promise<{items: import('./types.js').Task[]}>}
 */
export async function createRecurringTasks(data) {
  return (await http.post('/tasks/recurring', data)).data;
}

/**
 * POST /api/tasks/tax-reminders — задачи-напоминания о сроках уплаты налогов
 * для типа компании из токена. 201.
 * @param {{year: number}} data
 * @returns {Promise<{items: import('./types.js').Task[]}>}
 */
export async function createTaxReminderTasks(data) {
  return (await http.post('/tasks/tax-reminders', data)).data;
}

// ---------------------------------------------------------------- комментарии

/**
 * GET /api/tasks/{id}/comments — комментарии задачи (по возрастанию даты).
 * @param {string} taskId
 * @param {{page?: number, limit?: number}} [params]
 * @returns {Promise<import('./types.js').Page<import('./types.js').Comment>>}
 */
export async function listTaskComments(taskId, params = {}) {
  return (await http.get(`/tasks/${taskId}/comments`, { params: cleanParams(params) })).data;
}

/**
 * POST /api/tasks/{id}/comments — 201.
 * @param {string} taskId
 * @param {{text: string}} data
 * @returns {Promise<import('./types.js').Comment>}
 */
export async function createTaskComment(taskId, data) {
  return (await http.post(`/tasks/${taskId}/comments`, data)).data;
}

/**
 * PUT /api/tasks/{id}/comments/{comment_id} — только автор или owner/admin.
 * @param {string} taskId
 * @param {string} commentId
 * @param {{text: string}} data
 * @returns {Promise<import('./types.js').Comment>}
 */
export async function updateTaskComment(taskId, commentId, data) {
  return (await http.put(`/tasks/${taskId}/comments/${commentId}`, data)).data;
}

/**
 * DELETE /api/tasks/{id}/comments/{comment_id} — 204.
 * @param {string} taskId
 * @param {string} commentId
 * @returns {Promise<void>}
 */
export async function deleteTaskComment(taskId, commentId) {
  await http.delete(`/tasks/${taskId}/comments/${commentId}`);
}

// ---------------------------------------------------------------- учёт времени

/**
 * POST /api/tasks/{id}/time/start — запустить таймер по задаче (активный таймер
 * пользователя, если был, останавливается). 201.
 * @param {string} taskId
 * @returns {Promise<import('./types.js').TimeEntry>}
 */
export async function startTimeTracking(taskId) {
  return (await http.post(`/tasks/${taskId}/time/start`)).data;
}

/**
 * POST /api/time/stop — остановить активный таймер текущего пользователя.
 * Нет активного → 404.
 * @param {{task_id?: string}} [data] task_id — остановить таймер конкретной задачи
 * @returns {Promise<import('./types.js').TimeEntry>}
 */
export async function stopTimeTracking(data = {}) {
  return (await http.post('/time/stop', cleanParams(data))).data;
}

/**
 * GET /api/time/active — активные таймеры текущего пользователя.
 * @returns {Promise<{items: import('./types.js').TimeEntry[]}>}
 */
export async function getActiveTimeEntries() {
  return (await http.get('/time/active')).data;
}

/**
 * GET /api/time/report — отчёт по времени за период.
 * @param {{from?: string, to?: string, user_id?: string}} [params]
 *   from/to — 'YYYY-MM-DD' или ISO; user_id — только для owner/admin (по умолчанию — я).
 * @returns {Promise<{total_minutes: number, by_task: {task_id: string, title: string, minutes: number}[],
 *   entries: import('./types.js').TimeEntry[]}>}
 */
export async function getTimeReport(params = {}) {
  return (await http.get('/time/report', { params: cleanParams(params) })).data;
}
