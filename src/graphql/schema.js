// GraphQL схема для Self-Employed Platform
export const typeDefs = `
  # Скалярные типы
  scalar DateTime
  scalar JSON
  scalar Upload
  
  # Основные типы
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    role: UserRole!
    companyId: ID
    company: Company
    profile: Profile
    subscription: Subscription
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Связи
    tasks: [Task!]!
    clients: [Client!]!
    reports: [Report!]!
    acts: [Act!]!
    timeTracking: [TimeEntry!]!
    securityProfile: SecurityProfile
    aiMetrics: AIMetrics
  }
  
  type Company {
    id: ID!
    name: String!
    inn: String
    kpp: String
    address: String
    phone: String
    email: String
    website: String
    logo: String
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Связи
    users: [User!]!
    clients: [Client!]!
    financialAccounts: [FinancialAccount!]!
  }
  
  type Profile {
    id: ID!
    userId: ID!
    phone: String
    address: String
    birthDate: DateTime
    passport: Passport
    bankDetails: BankDetails
    preferences: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Subscription {
    id: ID!
    userId: ID!
    plan: SubscriptionPlan!
    status: SubscriptionStatus!
    startDate: DateTime!
    endDate: DateTime
    trialEnd: DateTime
    autoRenew: Boolean!
    paymentMethod: PaymentMethod
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    priority: TaskPriority!
    dueDate: DateTime
    estimatedHours: Float
    actualHours: Float
    assigneeId: ID
    assignee: User
    clientId: ID
    client: Client
    tags: [String!]
    attachments: [Attachment!]
    comments: [Comment!]
    timeEntries: [TimeEntry!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Client {
    id: ID!
    name: String!
    email: String
    phone: String
    companyId: ID
    company: Company
    type: ClientType!
    status: ClientStatus!
    contacts: [Contact!]
    projects: [Project!]
    financialHistory: [FinancialTransaction!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Report {
    id: ID!
    title: String!
    content: String
    type: ReportType!
    status: ReportStatus!
    authorId: ID!
    author: User
    responsibleId: ID
    responsible: User
    dueDate: DateTime
    attachments: [Attachment!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Act {
    id: ID!
    title: String!
    description: String
    status: ActStatus!
    responsibleId: ID
    responsible: User
    clientId: ID
    client: Client
    amount: Float
    currency: String
    date: DateTime
    attachments: [Attachment!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type TimeEntry {
    id: ID!
    userId: ID!
    user: User
    taskId: ID
    task: Task
    startTime: DateTime!
    endTime: DateTime
    duration: Float
    description: String
    billable: Boolean!
    rate: Float
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type SecurityProfile {
    id: ID!
    userId: ID!
    twoFactorEnabled: Boolean!
    sessionTimeout: Int!
    loginHistory: [LoginEvent!]
    securitySettings: JSON
    lastPasswordChange: DateTime
    failedLoginAttempts: Int!
    ipWhitelist: [String!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type AIMetrics {
    id: ID!
    userId: ID!
    productivity: Float
    efficiency: Float
    riskScore: Float
    recommendations: [Recommendation!]
    trends: [Trend!]
    lastUpdated: DateTime!
  }
  
  type FinancialAccount {
    id: ID!
    companyId: ID!
    company: Company
    type: AccountType!
    name: String!
    balance: Float!
    currency: String!
    transactions: [FinancialTransaction!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type FinancialTransaction {
    id: ID!
    accountId: ID!
    account: FinancialAccount
    type: TransactionType!
    amount: Float!
    currency: String!
    description: String
    category: String
    date: DateTime!
    status: TransactionStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Attachment {
    id: ID!
    filename: String!
    originalName: String!
    mimeType: String!
    size: Int!
    url: String!
    uploadedBy: ID!
    uploadedByUser: User
    createdAt: DateTime!
  }
  
  type Comment {
    id: ID!
    content: String!
    authorId: ID!
    author: User
    taskId: ID
    task: Task
    reportId: ID
    report: Report
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Contact {
    id: ID!
    clientId: ID!
    client: Client
    name: String!
    position: String
    email: String
    phone: String
    isPrimary: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type Project {
    id: ID!
    name: String!
    description: String
    clientId: ID!
    client: Client
    status: ProjectStatus!
    startDate: DateTime
    endDate: DateTime
    budget: Float
    tasks: [Task!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type LoginEvent {
    id: ID!
    userId: ID!
    timestamp: DateTime!
    ip: String
    userAgent: String
    success: Boolean!
    location: String
  }
  
  type Recommendation {
    id: ID!
    type: RecommendationType!
    title: String!
    description: String!
    priority: Priority!
    category: String
    actionable: Boolean!
    estimatedImpact: Float
    createdAt: DateTime!
  }
  
  type Trend {
    id: ID!
    metric: String!
    value: Float!
    change: Float!
    period: String!
    direction: TrendDirection!
    confidence: Float!
    createdAt: DateTime!
  }
  
  type Passport {
    series: String!
    number: String!
    issuedBy: String!
    issueDate: DateTime!
    departmentCode: String!
  }
  
  type BankDetails {
    accountNumber: String!
    bankName: String!
    bik: String!
    correspondentAccount: String!
  }
  
  type PaymentMethod {
    id: ID!
    type: PaymentMethodType!
    last4: String
    brand: String
    expiryMonth: Int
    expiryYear: Int
    isDefault: Boolean!
    createdAt: DateTime!
  }
  
  # Enums
  enum UserRole {
    USER
    MANAGER
    ADMIN
    SUPER_ADMIN
  }
  
  enum TaskStatus {
    TODO
    IN_PROGRESS
    REVIEW
    DONE
    CANCELLED
  }
  
  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }
  
  enum ClientType {
    INDIVIDUAL
    COMPANY
    FREELANCER
  }
  
  enum ClientStatus {
    ACTIVE
    INACTIVE
    PROSPECT
    FORMER
  }
  
  enum ReportType {
    WEEKLY
    MONTHLY
    QUARTERLY
    ANNUAL
    CUSTOM
  }
  
  enum ReportStatus {
    DRAFT
    IN_REVIEW
    APPROVED
    REJECTED
  }
  
  enum ActStatus {
    DRAFT
    SENT
    SIGNED
    ARCHIVED
  }
  
  enum SubscriptionPlan {
    FREE
    BASIC
    PROFESSIONAL
    ENTERPRISE
  }
  
  enum SubscriptionStatus {
    ACTIVE
    EXPIRED
    CANCELLED
    TRIAL
    PENDING
  }
  
  enum AccountType {
    CHECKING
    SAVINGS
    CREDIT
    INVESTMENT
  }
  
  enum TransactionType {
    INCOME
    EXPENSE
    TRANSFER
    ADJUSTMENT
  }
  
  enum TransactionStatus {
    PENDING
    COMPLETED
    FAILED
    CANCELLED
  }
  
  enum ProjectStatus {
    PLANNING
    ACTIVE
    ON_HOLD
    COMPLETED
    CANCELLED
  }
  
  enum RecommendationType {
    PRODUCTIVITY
    FINANCIAL
    SECURITY
    BUSINESS
    PERSONAL
  }
  
  enum Priority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }
  
  enum TrendDirection {
    UP
    DOWN
    STABLE
  }
  
  enum PaymentMethodType {
    CARD
    BANK_ACCOUNT
    DIGITAL_WALLET
  }
  
  # Input типы
  input UserInput {
    email: String!
    firstName: String
    lastName: String
    role: UserRole
    companyId: ID
  }
  
  input TaskInput {
    title: String!
    description: String
    status: TaskStatus
    priority: TaskPriority
    dueDate: DateTime
    estimatedHours: Float
    assigneeId: ID
    clientId: ID
    tags: [String!]
  }
  
  input ClientInput {
    name: String!
    email: String
    phone: String
    type: ClientType!
    status: ClientStatus
  }
  
  input ReportInput {
    title: String!
    content: String
    type: ReportType!
    status: ReportStatus
    responsibleId: ID
    dueDate: DateTime
  }
  
  input TimeEntryInput {
    taskId: ID
    startTime: DateTime!
    endTime: DateTime
    description: String
    billable: Boolean
    rate: Float
  }
  
  input SecuritySettingsInput {
    twoFactorEnabled: Boolean
    sessionTimeout: Int
    ipWhitelist: [String!]
  }
  
  # Queries
  type Query {
    # Пользователи
    user(id: ID!): User
    users(companyId: ID, role: UserRole, limit: Int, offset: Int): [User!]!
    currentUser: User
    
    # Компании
    company(id: ID!): Company
    companies(limit: Int, offset: Int): [Company!]!
    
    # Задачи
    task(id: ID!): Task
    tasks(
      userId: ID
      clientId: ID
      status: TaskStatus
      priority: TaskPriority
      dueDate: DateTime
      limit: Int
      offset: Int
    ): [Task!]!
    
    # Клиенты
    client(id: ID!): Client
    clients(
      companyId: ID
      type: ClientType
      status: ClientStatus
      limit: Int
      offset: Int
    ): [Client!]!
    
    # Отчеты
    report(id: ID!): Report
    reports(
      authorId: ID
      type: ReportType
      status: ReportStatus
      limit: Int
      offset: Int
    ): [Report!]!
    
    # Акты
    act(id: ID!): Act
    acts(
      clientId: ID
      status: ActStatus
      limit: Int
      offset: Int
    ): [Act!]!
    
    # Время
    timeEntries(
      userId: ID
      taskId: ID
      startDate: DateTime
      endDate: DateTime
      limit: Int
      offset: Int
    ): [TimeEntry!]!
    
    # Финансы
    financialAccount(id: ID!): FinancialAccount
    financialAccounts(companyId: ID!): [FinancialAccount!]!
    financialTransactions(
      accountId: ID
      type: TransactionType
      startDate: DateTime
      endDate: DateTime
      limit: Int
      offset: Int
    ): [FinancialTransaction!]!
    
    # Безопасность
    securityProfile(userId: ID!): SecurityProfile
    
    # AI аналитика
    aiMetrics(userId: ID!): AIMetrics
    recommendations(userId: ID!, category: String): [Recommendation!]!
    trends(metric: String!, period: String!): [Trend!]!
    
    # Дашборд
    dashboardMetrics(userId: ID!, period: String!): DashboardMetrics!
    productivityReport(userId: ID!, period: String!): ProductivityReport!
    
    # Поиск
    search(query: String!, type: String, limit: Int): SearchResults!
  }
  
  # Mutations
  type Mutation {
    # Пользователи
    createUser(input: UserInput!): User!
    updateUser(id: ID!, input: UserInput!): User!
    deleteUser(id: ID!): Boolean!
    
    # Задачи
    createTask(input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    assignTask(taskId: ID!, userId: ID!): Task!
    
    # Клиенты
    createClient(input: ClientInput!): Client!
    updateClient(id: ID!, input: ClientInput!): Client!
    deleteClient(id: ID!): Boolean!
    
    # Отчеты
    createReport(input: ReportInput!): Report!
    updateReport(id: ID!, input: ReportInput!): Report!
    deleteReport(id: ID!): Boolean!
    
    # Акты
    createAct(input: ReportInput!): Act!
    updateAct(id: ID!, input: ReportInput!): Act!
    deleteAct(id: ID!): Boolean!
    
    # Время
    startTimeTracking(input: TimeEntryInput!): TimeEntry!
    stopTimeTracking(id: ID!): TimeEntry!
    updateTimeEntry(id: ID!, input: TimeEntryInput!): TimeEntry!
    deleteTimeEntry(id: ID!): Boolean!
    
    # Комментарии
    createComment(content: String!, taskId: ID, reportId: ID): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
    
    # Вложения
    uploadFile(file: Upload!, description: String): Attachment!
    deleteFile(id: ID!): Boolean!
    
    # Безопасность
    updateSecuritySettings(userId: ID!, input: SecuritySettingsInput!): SecurityProfile!
    enableTwoFactor(userId: ID!): Boolean!
    disableTwoFactor(userId: ID!): Boolean!
    
    # Подписка
    createSubscription(userId: ID!, plan: SubscriptionPlan!): Subscription!
    cancelSubscription(id: ID!): Subscription!
    renewSubscription(id: ID!): Subscription!
    
    # Финансы
    createFinancialTransaction(
      accountId: ID!
      type: TransactionType!
      amount: Float!
      description: String
      category: String
    ): FinancialTransaction!
    
    # AI аналитика
    generateRecommendations(userId: ID!): [Recommendation!]!
    analyzeTrends(metric: String!, period: String!): [Trend!]!
  }
  
  # Subscriptions
  type Subscription {
    # Real-time обновления
    taskUpdated: Task!
    clientUpdated: Client!
    reportUpdated: Report!
    timeEntryCreated: TimeEntry!
    notificationReceived: Notification!
    
    # AI уведомления
    aiInsightGenerated: AIInsight!
    securityAlert: SecurityAlert!
  }
  
  # Дополнительные типы
  type DashboardMetrics {
    totalTasks: Int!
    completedTasks: Int!
    totalClients: Int!
    totalRevenue: Float!
    productivity: Float!
    trends: [Trend!]!
  }
  
  type ProductivityReport {
    userId: ID!
    period: String!
    totalHours: Float!
    billableHours: Float!
    efficiency: Float!
    tasksCompleted: Int!
    averageTaskTime: Float!
  }
  
  type SearchResults {
    query: String!
    results: [SearchResult!]!
    total: Int!
    facets: [SearchFacet!]!
  }
  
  type SearchResult {
    id: ID!
    type: String!
    title: String!
    description: String
    score: Float!
    url: String!
  }
  
  type SearchFacet {
    field: String!
    values: [FacetValue!]!
  }
  
  type FacetValue {
    value: String!
    count: Int!
  }
  
  type Notification {
    id: ID!
    userId: ID!
    type: NotificationType!
    title: String!
    message: String!
    data: JSON
    read: Boolean!
    createdAt: DateTime!
  }
  
  type AIInsight {
    id: ID!
    userId: ID!
    type: InsightType!
    title: String!
    description: String!
    confidence: Float!
    actionable: Boolean!
    createdAt: DateTime!
  }
  
  type SecurityAlert {
    id: ID!
    userId: ID!
    type: SecurityAlertType!
    severity: AlertSeverity!
    title: String!
    description: String!
    ip: String
    userAgent: String
    createdAt: DateTime!
  }
  
  enum NotificationType {
    TASK_ASSIGNED
    TASK_COMPLETED
    CLIENT_ADDED
    REPORT_DUE
    SECURITY_ALERT
    AI_INSIGHT
  }
  
  enum InsightType {
    PRODUCTIVITY
    FINANCIAL
    SECURITY
    BUSINESS
    PERSONAL
  }
  
  enum SecurityAlertType {
    SUSPICIOUS_LOGIN
    FAILED_ATTEMPT
    UNUSUAL_ACTIVITY
    DATA_BREACH
    PHISHING_ATTEMPT
  }
  
  enum AlertSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }
`;

export default typeDefs; 