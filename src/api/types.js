/**
 * JSDoc-типы ответов API (docs/API.md). Только для документации и подсказок IDE —
 * модуль ничего не экспортирует в рантайме. Использование в JSDoc:
 *   @returns {Promise<import('@/api/types.js').Page<import('@/api/types.js').Task>>}
 *
 * Общие соглашения: ID — UUID-строки, даты-время — ISO 8601 UTC, даты — 'YYYY-MM-DD',
 * деньги — number (2 знака).
 */

/**
 * @template T
 * @typedef {{items: T[], total: number, page: number, limit: number}} Page
 */

/** @typedef {{page?: number, limit?: number}} PageParams  page с 1, limit по умолчанию 20, максимум 100 */

// ---------- auth-service ----------
/** @typedef {'self_employed'|'ip'|'ooo'} CompanyType */
/** @typedef {'owner'|'admin'|'user'} Role */
/** @typedef {{id: string, name: string, type: CompanyType, inn: string|null, created_at: string}} Company */
/**
 * @typedef {{id: string, email: string, full_name: string, phone: string|null, position: string|null,
 *   role: Role, is_active: boolean, company: Company, telegram_linked: boolean,
 *   pd_consent_at: string|null, created_at: string}} User   pd_consent_at — дата-время согласия на обработку ПДн
 */
/** @typedef {{access_token: string, token_type: 'bearer', expires_in: number, user: User}} TokenResponse */
/**
 * @typedef {{status: 'trial'|'active'|'expired', plan: 'standard', price: number,
 *   trial_ends_at: string|null, paid_until: string|null, days_left: number,
 *   auto_renew: boolean, payments_enabled: boolean}} Subscription
 */

// ---------- task-service ----------
/** @typedef {'todo'|'in_progress'|'done'|'cancelled'} TaskStatus */
/** @typedef {'low'|'medium'|'high'|'urgent'} TaskPriority */
/**
 * @typedef {{id: string, title: string, description: string, status: TaskStatus, priority: TaskPriority,
 *   due_date: string|null, assignee_id: string|null, assignee_name: string|null, created_by: string,
 *   created_by_name: string, tags: string[], company_id: string, created_at: string, updated_at: string,
 *   completed_at: string|null, comments_count: number, total_minutes: number}} Task
 */
/**
 * @typedef {{title?: string, description?: string, status?: TaskStatus, priority?: TaskPriority,
 *   due_date?: string|null, assignee_id?: string|null, assignee_name?: string|null, tags?: string[]}} TaskInput
 */
/** @typedef {{id: string, task_id: string, author_id: string, author_name: string, text: string, created_at: string, updated_at: string}} Comment */
/**
 * @typedef {{id: string, task_id: string, task_title: string, user_id: string, started_at: string,
 *   ended_at: string|null, duration_minutes: number}} TimeEntry
 */
/**
 * @typedef {{id: string, title: string, description: string, start_at: string, end_at: string,
 *   location: string, participants: string[], client_id: string|null, created_by: string,
 *   created_at: string, updated_at: string}} Meeting
 */
/**
 * @typedef {{id: string, title: string, date: string, type: 'deadline'|'birthday'|'holiday'|'payment'|'other',
 *   remind_days_before: number, description: string, created_by: string, created_at: string}} ImportantDate
 */

// ---------- documents-service ----------
/**
 * @typedef {{id: string, name: string, type: 'individual'|'ip'|'company', inn: string, kpp: string,
 *   ogrn: string, email: string, phone: string, address: string, contact_person: string, notes: string,
 *   created_at: string, updated_at: string}} Client
 */
/** @typedef {{name: string, quantity: number, unit: string, price: number, amount?: number}} DocItem */
/** @typedef {'draft'|'sent'|'signed'|'paid'|'cancelled'} DocStatus */
/**
 * @typedef {{id: string, number: string, date: string, client_id: string, client_name: string,
 *   items: DocItem[], total: number, vat_rate: number|null, status: DocStatus, notes: string,
 *   due_date: string|null, seller_name: string, seller_inn: string, paid_at: string|null,
 *   income_synced: boolean, created_by: string, created_at: string, updated_at: string}} Document
 *   Акт или счёт (due_date — только у счёта). paid_at — дата оплаты (только у status='paid');
 *   income_synced — доход по оплате выгружен в финансы (API.md, 12.1).
 */
/**
 * @typedef {{id: string, title: string, type: 'tasks'|'finance'|'time'|'clients'|'inventory',
 *   period_from: string, period_to: string, content: string, data: object, created_by: string,
 *   created_at: string, updated_at: string}} Report   content — markdown (рендерить через renderMarkdown)
 */
/**
 * @typedef {{id: string, name: string, sku: string, unit: string, price: number, cost: number,
 *   quantity: number, min_quantity: number, category: string, created_at: string, updated_at: string}} Product
 */
/**
 * @typedef {{id: string, product_id: string, product_name: string, type: 'in'|'out'|'adjust',
 *   quantity: number, note: string, created_by: string, created_at: string}} InventoryTransaction
 */

// ---------- financial-service ----------
/** @typedef {'manual'|'bank_import'|'bot'|'document'} TransactionSource */
/**
 * @typedef {{id: string, type: 'income'|'expense', amount: number, date: string, category: string,
 *   description: string, counterparty: string|null, counterparty_inn: string|null, client_id: string|null,
 *   source: TransactionSource, bank_account_id: string|null,
 *   payer_type: 'individual'|'legal'|null, document_id: string|null, npd_receipt: string|null,
 *   created_by: string, created_at: string}} Transaction
 *   document_id — акт/счёт, из оплаты которого создана операция (source='document');
 *   npd_receipt — номер чека «Мой налог» (только у доходов).
 */
/**
 * @typedef {{id: string, bank_name: string, account_number: string, bik: string|null, currency: 'RUB',
 *   balance: number|null, last_import_at: string|null, created_at: string}} BankAccount
 */

// ---------- notification-service ----------
/**
 * @typedef {{id: string, user_id: string, title: string, message: string,
 *   type: 'info'|'task'|'finance'|'system', link: string|null, is_read: boolean, created_at: string}} Notification
 */
/** @typedef {{email_enabled: boolean, telegram_enabled: boolean}} NotificationSettings */

// ---------- ai-service ----------
/**
 * @typedef {{type: 'create_task'|'add_income'|'add_expense'|'none', title?: string, amount?: number,
 *   description?: string, due_date?: string}} Intent
 */

export {};
