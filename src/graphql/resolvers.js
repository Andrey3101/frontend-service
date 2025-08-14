// GraphQL резолверы для Self-Employed Platform
import { 
  getCachedData, 
  setCachedData,
  getSecurityProfile,
  getAIAnalytics,
  getRealTimeMetrics
} from '@/api';

export const resolvers = {
  // Скалярные типы
  DateTime: {
    serialize: (value) => value.toISOString(),
    parseValue: (value) => new Date(value),
    parseLiteral: (ast) => new Date(ast.value)
  },
  
  JSON: {
    serialize: (value) => JSON.stringify(value),
    parseValue: (value) => typeof value === 'string' ? JSON.parse(value) : value,
    parseLiteral: (ast) => ast.value
  },
  
  // Queries
  Query: {
    // Пользователи
    user: async (_, { id }, { dataSources }) => {
      const cacheKey = `user:${id}`;
      let user = await getCachedData(cacheKey, 'user');
      
      if (!user) {
        user = await dataSources.userAPI.getUser(id);
        if (user) {
          await setCachedData(cacheKey, user, 300, 'user');
        }
      }
      
      return user;
    },
    
    users: async (_, { companyId, role, limit = 50, offset = 0 }, { dataSources }) => {
      const cacheKey = `users:${companyId}:${role}:${limit}:${offset}`;
      let users = await getCachedData(cacheKey, 'user');
      
      if (!users) {
        users = await dataSources.userAPI.getUsers({ companyId, role, limit, offset });
        if (users) {
          await setCachedData(cacheKey, users, 300, 'user');
        }
      }
      
      return users;
    },
    
    currentUser: async (_, __, { user, dataSources }) => {
      if (!user) return null;
      
      const cacheKey = `currentUser:${user.id}`;
      let currentUser = await getCachedData(cacheKey, 'user');
      
      if (!currentUser) {
        currentUser = await dataSources.userAPI.getCurrentUser(user.id);
        if (currentUser) {
          await setCachedData(cacheKey, currentUser, 300, 'user');
        }
      }
      
      return currentUser;
    },
    
    // Компании
    company: async (_, { id }, { dataSources }) => {
      const cacheKey = `company:${id}`;
      let company = await getCachedData(cacheKey, 'company');
      
      if (!company) {
        company = await dataSources.companyAPI.getCompany(id);
        if (company) {
          await setCachedData(cacheKey, company, 600, 'company');
        }
      }
      
      return company;
    },
    
    companies: async (_, { limit = 50, offset = 0 }, { dataSources }) => {
      const cacheKey = `companies:${limit}:${offset}`;
      let companies = await getCachedData(cacheKey, 'company');
      
      if (!companies) {
        companies = await dataSources.companyAPI.getCompanies({ limit, offset });
        if (companies) {
          await setCachedData(cacheKey, companies, 600, 'company');
        }
      }
      
      return companies;
    },
    
    // Задачи
    task: async (_, { id }, { dataSources }) => {
      const cacheKey = `task:${id}`;
      let task = await getCachedData(cacheKey, 'task');
      
      if (!task) {
        task = await dataSources.taskAPI.getTask(id);
        if (task) {
          await setCachedData(cacheKey, task, 300, 'task');
        }
      }
      
      return task;
    },
    
    tasks: async (_, { userId, clientId, status, priority, dueDate, limit = 50, offset = 0 }, { dataSources }) => {
      const cacheKey = `tasks:${userId}:${clientId}:${status}:${priority}:${dueDate}:${limit}:${offset}`;
      let tasks = await getCachedData(cacheKey, 'task');
      
      if (!tasks) {
        tasks = await dataSources.taskAPI.getTasks({ 
          userId, clientId, status, priority, dueDate, limit, offset 
        });
        if (tasks) {
          await setCachedData(cacheKey, tasks, 300, 'task');
        }
      }
      
      return tasks;
    },
    
    // Клиенты
    client: async (_, { id }, { dataSources }) => {
      const cacheKey = `client:${id}`;
      let client = await getCachedData(cacheKey, 'client');
      
      if (!client) {
        client = await dataSources.clientAPI.getClient(id);
        if (client) {
          await setCachedData(cacheKey, client, 600, 'client');
        }
      }
      
      return client;
    },
    
    clients: async (_, { companyId, type, status, limit = 50, offset = 0 }, { dataSources }) => {
      const cacheKey = `clients:${companyId}:${type}:${status}:${limit}:${offset}`;
      let clients = await getCachedData(cacheKey, 'client');
      
      if (!clients) {
        clients = await dataSources.clientAPI.getClients({ companyId, type, status, limit, offset });
        if (clients) {
          await setCachedData(cacheKey, clients, 600, 'client');
        }
      }
      
      return clients;
    },
    
    // Отчеты
    report: async (_, { id }, { dataSources }) => {
      const cacheKey = `report:${id}`;
      let report = await getCachedData(cacheKey, 'report');
      
      if (!report) {
        report = await dataSources.reportAPI.getReport(id);
        if (report) {
          await setCachedData(cacheKey, report, 300, 'report');
        }
      }
      
      return report;
    },
    
    reports: async (_, { authorId, type, status, limit = 50, offset = 0 }, { dataSources }) => {
      const cacheKey = `reports:${authorId}:${type}:${status}:${limit}:${offset}`;
      let reports = await getCachedData(cacheKey, 'report');
      
      if (!reports) {
        reports = await dataSources.reportAPI.getReports({ authorId, type, status, limit, offset });
        if (reports) {
          await setCachedData(cacheKey, reports, 300, 'report');
        }
      }
      
      return reports;
    },
    
    // Акты
    act: async (_, { id }, { dataSources }) => {
      const cacheKey = `act:${id}`;
      let act = await getCachedData(cacheKey, 'act');
      
      if (!act) {
        act = await dataSources.actAPI.getAct(id);
        if (act) {
          await setCachedData(cacheKey, act, 300, 'act');
        }
      }
      
      return act;
    },
    
    acts: async (_, { clientId, status, limit = 50, offset = 0 }, { dataSources }) => {
      const cacheKey = `acts:${clientId}:${status}:${limit}:${offset}`;
      let acts = await getCachedData(cacheKey, 'act');
      
      if (!acts) {
        acts = await dataSources.actAPI.getActs({ clientId, status, limit, offset });
        if (acts) {
          await setCachedData(cacheKey, acts, 300, 'act');
        }
      }
      
      return acts;
    },
    
    // Время
    timeEntries: async (_, { userId, taskId, startDate, endDate, limit = 50, offset = 0 }, { dataSources }) => {
      const cacheKey = `timeEntries:${userId}:${taskId}:${startDate}:${endDate}:${limit}:${offset}`;
      let timeEntries = await getCachedData(cacheKey, 'time');
      
      if (!timeEntries) {
        timeEntries = await dataSources.timeAPI.getTimeEntries({ 
          userId, taskId, startDate, endDate, limit, offset 
        });
        if (timeEntries) {
          await setCachedData(cacheKey, timeEntries, 300, 'time');
        }
      }
      
      return timeEntries;
    },
    
    // Финансы
    financialAccount: async (_, { id }, { dataSources }) => {
      const cacheKey = `financialAccount:${id}`;
      let account = await getCachedData(cacheKey, 'financial');
      
      if (!account) {
        account = await dataSources.financialAPI.getAccount(id);
        if (account) {
          await setCachedData(cacheKey, account, 300, 'financial');
        }
      }
      
      return account;
    },
    
    financialAccounts: async (_, { companyId }, { dataSources }) => {
      const cacheKey = `financialAccounts:${companyId}`;
      let accounts = await getCachedData(cacheKey, 'financial');
      
      if (!accounts) {
        accounts = await dataSources.financialAPI.getAccounts(companyId);
        if (accounts) {
          await setCachedData(cacheKey, accounts, 300, 'financial');
        }
      }
      
      return accounts;
    },
    
    financialTransactions: async (_, { accountId, type, startDate, endDate, limit = 50, offset = 0 }, { dataSources }) => {
      const cacheKey = `financialTransactions:${accountId}:${type}:${startDate}:${endDate}:${limit}:${offset}`;
      let transactions = await getCachedData(cacheKey, 'financial');
      
      if (!transactions) {
        transactions = await dataSources.financialAPI.getTransactions({ 
          accountId, type, startDate, endDate, limit, offset 
        });
        if (transactions) {
          await setCachedData(cacheKey, transactions, 300, 'financial');
        }
      }
      
      return transactions;
    },
    
    // Безопасность
    securityProfile: async (_, { userId }, { dataSources }) => {
      try {
        return await getSecurityProfile();
      } catch (error) {
        console.error('Failed to get security profile:', error);
        return null;
      }
    },
    
    // AI аналитика
    aiMetrics: async (_, { userId }, { dataSources }) => {
      try {
        const metrics = await getAIAnalytics(['user_activity', 'security_events', 'performance']);
        return {
          id: `ai-${userId}`,
          userId,
          productivity: metrics.productivity || 0,
          efficiency: metrics.efficiency || 0,
          riskScore: metrics.risk_score || 0,
          recommendations: metrics.recommendations || [],
          trends: metrics.trends || [],
          lastUpdated: new Date()
        };
      } catch (error) {
        console.error('Failed to get AI metrics:', error);
        return null;
      }
    },
    
    recommendations: async (_, { userId, category }, { dataSources }) => {
      try {
        const metrics = await getAIAnalytics(['recommendations']);
        let recommendations = metrics.recommendations || [];
        
        if (category) {
          recommendations = recommendations.filter(r => r.category === category);
        }
        
        return recommendations;
      } catch (error) {
        console.error('Failed to get recommendations:', error);
        return [];
      }
    },
    
    trends: async (_, { metric, period }, { dataSources }) => {
      try {
        const metrics = await getRealTimeMetrics();
        return metrics.trends || [];
      } catch (error) {
        console.error('Failed to get trends:', error);
        return [];
      }
    },
    
    // Дашборд
    dashboardMetrics: async (_, { userId, period }, { dataSources }) => {
      const cacheKey = `dashboardMetrics:${userId}:${period}`;
      let metrics = await getCachedData(cacheKey, 'dashboard');
      
      if (!metrics) {
        metrics = await dataSources.dashboardAPI.getMetrics(userId, period);
        if (metrics) {
          await setCachedData(cacheKey, metrics, 300, 'dashboard');
        }
      }
      
      return metrics;
    },
    
    productivityReport: async (_, { userId, period }, { dataSources }) => {
      const cacheKey = `productivityReport:${userId}:${period}`;
      let report = await getCachedData(cacheKey, 'productivity');
      
      if (!report) {
        report = await dataSources.productivityAPI.getReport(userId, period);
        if (report) {
          await setCachedData(cacheKey, report, 300, 'productivity');
        }
      }
      
      return report;
    },
    
    // Поиск
    search: async (_, { query, type, limit = 20 }, { dataSources }) => {
      const cacheKey = `search:${query}:${type}:${limit}`;
      let results = await getCachedData(cacheKey, 'search');
      
      if (!results) {
        results = await dataSources.searchAPI.search(query, type, limit);
        if (results) {
          await setCachedData(cacheKey, results, 60, 'search');
        }
      }
      
      return results;
    }
  },
  
  // Mutations
  Mutation: {
    // Пользователи
    createUser: async (_, { input }, { dataSources }) => {
      const user = await dataSources.userAPI.createUser(input);
      
      // Инвалидируем кэш
      await setCachedData(`users:${input.companyId}:${input.role}:50:0`, null, 0, 'user');
      
      return user;
    },
    
    updateUser: async (_, { id, input }, { dataSources }) => {
      const user = await dataSources.userAPI.updateUser(id, input);
      
      // Инвалидируем кэш
      await setCachedData(`user:${id}`, null, 0, 'user');
      await setCachedData(`currentUser:${id}`, null, 0, 'user');
      
      return user;
    },
    
    deleteUser: async (_, { id }, { dataSources }) => {
      const success = await dataSources.userAPI.deleteUser(id);
      
      if (success) {
        // Инвалидируем кэш
        await setCachedData(`user:${id}`, null, 0, 'user');
        await setCachedData(`currentUser:${id}`, null, 0, 'user');
      }
      
      return success;
    },
    
    // Задачи
    createTask: async (_, { input }, { dataSources }) => {
      const task = await dataSources.taskAPI.createTask(input);
      
      // Инвалидируем кэш
      await setCachedData(`tasks:${input.assigneeId}:${input.clientId}:${input.status}:${input.priority}:${input.dueDate}:50:0`, null, 0, 'task');
      
      return task;
    },
    
    updateTask: async (_, { id, input }, { dataSources }) => {
      const task = await dataSources.taskAPI.updateTask(id, input);
      
      // Инвалидируем кэш
      await setCachedData(`task:${id}`, null, 0, 'task');
      
      return task;
    },
    
    deleteTask: async (_, { id }, { dataSources }) => {
      const success = await dataSources.taskAPI.deleteTask(id);
      
      if (success) {
        // Инвалидируем кэш
        await setCachedData(`task:${id}`, null, 0, 'task');
      }
      
      return success;
    },
    
    assignTask: async (_, { taskId, userId }, { dataSources }) => {
      const task = await dataSources.taskAPI.assignTask(taskId, userId);
      
      // Инвалидируем кэш
      await setCachedData(`task:${taskId}`, null, 0, 'task');
      
      return task;
    },
    
    // Клиенты
    createClient: async (_, { input }, { dataSources }) => {
      const client = await dataSources.clientAPI.createClient(input);
      
      // Инвалидируем кэш
      await setCachedData(`clients:${input.companyId}:${input.type}:${input.status}:50:0`, null, 0, 'client');
      
      return client;
    },
    
    updateClient: async (_, { id, input }, { dataSources }) => {
      const client = await dataSources.clientAPI.updateClient(id, input);
      
      // Инвалидируем кэш
      await setCachedData(`client:${id}`, null, 0, 'client');
      
      return client;
    },
    
    deleteClient: async (_, { id }, { dataSources }) => {
      const success = await dataSources.clientAPI.deleteClient(id);
      
      if (success) {
        // Инвалидируем кэш
        await setCachedData(`client:${id}`, null, 0, 'client');
      }
      
      return success;
    },
    
    // Отчеты
    createReport: async (_, { input }, { dataSources }) => {
      const report = await dataSources.reportAPI.createReport(input);
      
      // Инвалидируем кэш
      await setCachedData(`reports:${input.authorId}:${input.type}:${input.status}:50:0`, null, 0, 'report');
      
      return report;
    },
    
    updateReport: async (_, { id, input }, { dataSources }) => {
      const report = await dataSources.reportAPI.updateReport(id, input);
      
      // Инвалидируем кэш
      await setCachedData(`report:${id}`, null, 0, 'report');
      
      return report;
    },
    
    deleteReport: async (_, { id }, { dataSources }) => {
      const success = await dataSources.reportAPI.deleteReport(id);
      
      if (success) {
        // Инвалидируем кэш
        await setCachedData(`report:${id}`, null, 0, 'report');
      }
      
      return success;
    },
    
    // Акты
    createAct: async (_, { input }, { dataSources }) => {
      const act = await dataSources.actAPI.createAct(input);
      
      // Инвалидируем кэш
      await setCachedData(`acts:${input.clientId}:${input.status}:50:0`, null, 0, 'act');
      
      return act;
    },
    
    updateAct: async (_, { id, input }, { dataSources }) => {
      const act = await dataSources.actAPI.updateAct(id, input);
      
      // Инвалидируем кэш
      await setCachedData(`act:${id}`, null, 0, 'act');
      
      return act;
    },
    
    deleteAct: async (_, { id }, { dataSources }) => {
      const success = await dataSources.actAPI.deleteAct(id);
      
      if (success) {
        // Инвалидируем кэш
        await setCachedData(`act:${id}`, null, 0, 'act');
      }
      
      return success;
    },
    
    // Время
    startTimeTracking: async (_, { input }, { dataSources }) => {
      const timeEntry = await dataSources.timeAPI.startTimeTracking(input);
      
      // Инвалидируем кэш
      await setCachedData(`timeEntries:${input.userId}:${input.taskId}:${input.startTime}:${input.endTime}:50:0`, null, 0, 'time');
      
      return timeEntry;
    },
    
    stopTimeTracking: async (_, { id }, { dataSources }) => {
      const timeEntry = await dataSources.timeAPI.stopTimeTracking(id);
      
      // Инвалидируем кэш
      await setCachedData(`timeEntries:${timeEntry.userId}:${timeEntry.taskId}:${timeEntry.startTime}:${timeEntry.endTime}:50:0`, null, 0, 'time');
      
      return timeEntry;
    },
    
    updateTimeEntry: async (_, { id, input }, { dataSources }) => {
      const timeEntry = await dataSources.timeAPI.updateTimeEntry(id, input);
      
      // Инвалидируем кэш
      await setCachedData(`timeEntries:${timeEntry.userId}:${timeEntry.taskId}:${timeEntry.startTime}:${timeEntry.endTime}:50:0`, null, 0, 'time');
      
      return timeEntry;
    },
    
    deleteTimeEntry: async (_, { id }, { dataSources }) => {
      const success = await dataSources.timeAPI.deleteTimeEntry(id);
      
      if (success) {
        // Инвалидируем кэш
        await setCachedData(`timeEntries:${id}`, null, 0, 'time');
      }
      
      return success;
    },
    
    // Комментарии
    createComment: async (_, { content, taskId, reportId }, { dataSources }) => {
      const comment = await dataSources.commentAPI.createComment({ content, taskId, reportId });
      
      // Инвалидируем кэш
      if (taskId) {
        await setCachedData(`task:${taskId}`, null, 0, 'task');
      }
      if (reportId) {
        await setCachedData(`report:${reportId}`, null, 0, 'report');
      }
      
      return comment;
    },
    
    updateComment: async (_, { id, content }, { dataSources }) => {
      const comment = await dataSources.commentAPI.updateComment(id, content);
      
      // Инвалидируем кэш
      if (comment.taskId) {
        await setCachedData(`task:${comment.taskId}`, null, 0, 'task');
      }
      if (comment.reportId) {
        await setCachedData(`report:${comment.reportId}`, null, 0, 'report');
      }
      
      return comment;
    },
    
    deleteComment: async (_, { id }, { dataSources }) => {
      const comment = await dataSources.commentAPI.getComment(id);
      const success = await dataSources.commentAPI.deleteComment(id);
      
      if (success) {
        // Инвалидируем кэш
        if (comment.taskId) {
          await setCachedData(`task:${comment.taskId}`, null, 0, 'task');
        }
        if (comment.reportId) {
          await setCachedData(`report:${comment.reportId}`, null, 0, 'report');
        }
      }
      
      return success;
    },
    
    // Вложения
    uploadFile: async (_, { file, description }, { dataSources }) => {
      const attachment = await dataSources.fileAPI.uploadFile(file, description);
      return attachment;
    },
    
    deleteFile: async (_, { id }, { dataSources }) => {
      const success = await dataSources.fileAPI.deleteFile(id);
      return success;
    },
    
    // Безопасность
    updateSecuritySettings: async (_, { userId, input }, { dataSources }) => {
      const profile = await dataSources.securityAPI.updateSettings(userId, input);
      return profile;
    },
    
    enableTwoFactor: async (_, { userId }, { dataSources }) => {
      const success = await dataSources.securityAPI.enableTwoFactor(userId);
      return success;
    },
    
    disableTwoFactor: async (_, { userId }, { dataSources }) => {
      const success = await dataSources.securityAPI.disableTwoFactor(userId);
      return success;
    },
    
    // Подписка
    createSubscription: async (_, { userId, plan }, { dataSources }) => {
      const subscription = await dataSources.subscriptionAPI.create(userId, plan);
      return subscription;
    },
    
    cancelSubscription: async (_, { id }, { dataSources }) => {
      const subscription = await dataSources.subscriptionAPI.cancel(id);
      return subscription;
    },
    
    renewSubscription: async (_, { id }, { dataSources }) => {
      const subscription = await dataSources.subscriptionAPI.renew(id);
      return subscription;
    },
    
    // Финансы
    createFinancialTransaction: async (_, { accountId, type, amount, description, category }, { dataSources }) => {
      const transaction = await dataSources.financialAPI.createTransaction({
        accountId, type, amount, description, category
      });
      
      // Инвалидируем кэш
      await setCachedData(`financialTransactions:${accountId}:${type}:${new Date().toISOString()}:${new Date().toISOString()}:50:0`, null, 0, 'financial');
      
      return transaction;
    },
    
    // AI аналитика
    generateRecommendations: async (_, { userId }, { dataSources }) => {
      try {
        const recommendations = await getAIAnalytics(['recommendations']);
        return recommendations.recommendations || [];
      } catch (error) {
        console.error('Failed to generate recommendations:', error);
        return [];
      }
    },
    
    analyzeTrends: async (_, { metric, period }, { dataSources }) => {
      try {
        const trends = await getRealTimeMetrics();
        return trends.trends || [];
      } catch (error) {
        console.error('Failed to analyze trends:', error);
        return [];
      }
    }
  },
  
  // Field resolvers
  User: {
    company: async (parent, _, { dataSources }) => {
      if (!parent.companyId) return null;
      return await dataSources.companyAPI.getCompany(parent.companyId);
    },
    
    profile: async (parent, _, { dataSources }) => {
      return await dataSources.profileAPI.getProfile(parent.id);
    },
    
    subscription: async (parent, _, { dataSources }) => {
      return await dataSources.subscriptionAPI.getSubscription(parent.id);
    },
    
    tasks: async (parent, _, { dataSources }) => {
      return await dataSources.taskAPI.getTasks({ userId: parent.id });
    },
    
    clients: async (parent, _, { dataSources }) => {
      return await dataSources.clientAPI.getClients({ companyId: parent.companyId });
    },
    
    reports: async (parent, _, { dataSources }) => {
      return await dataSources.reportAPI.getReports({ authorId: parent.id });
    },
    
    acts: async (parent, _, { dataSources }) => {
      return await dataSources.actAPI.getActs({ responsibleId: parent.id });
    },
    
    timeTracking: async (parent, _, { dataSources }) => {
      return await dataSources.timeAPI.getTimeEntries({ userId: parent.id });
    },
    
    securityProfile: async (parent, _, { dataSources }) => {
      return await dataSources.securityAPI.getProfile(parent.id);
    },
    
    aiMetrics: async (parent, _, { dataSources }) => {
      try {
        const metrics = await getAIAnalytics(['user_activity', 'security_events', 'performance']);
        return {
          id: `ai-${parent.id}`,
          userId: parent.id,
          productivity: metrics.productivity || 0,
          efficiency: metrics.efficiency || 0,
          riskScore: metrics.risk_score || 0,
          recommendations: metrics.recommendations || [],
          trends: metrics.trends || [],
          lastUpdated: new Date()
        };
      } catch (error) {
        return null;
      }
    }
  },
  
  Task: {
    assignee: async (parent, _, { dataSources }) => {
      if (!parent.assigneeId) return null;
      return await dataSources.userAPI.getUser(parent.assigneeId);
    },
    
    client: async (parent, _, { dataSources }) => {
      if (!parent.clientId) return null;
      return await dataSources.clientAPI.getClient(parent.clientId);
    },
    
    attachments: async (parent, _, { dataSources }) => {
      return await dataSources.fileAPI.getAttachments(parent.id);
    },
    
    comments: async (parent, _, { dataSources }) => {
      return await dataSources.commentAPI.getComments(parent.id);
    },
    
    timeEntries: async (parent, _, { dataSources }) => {
      return await dataSources.timeAPI.getTimeEntries({ taskId: parent.id });
    }
  },
  
  Client: {
    company: async (parent, _, { dataSources }) => {
      if (!parent.companyId) return null;
      return await dataSources.companyAPI.getCompany(parent.companyId);
    },
    
    contacts: async (parent, _, { dataSources }) => {
      return await dataSources.contactAPI.getContacts(parent.id);
    },
    
    projects: async (parent, _, { dataSources }) => {
      return await dataSources.projectAPI.getProjects(parent.id);
    },
    
    financialHistory: async (parent, _, { dataSources }) => {
      return await dataSources.financialAPI.getClientTransactions(parent.id);
    }
  },
  
  Report: {
    author: async (parent, _, { dataSources }) => {
      return await dataSources.userAPI.getUser(parent.authorId);
    },
    
    responsible: async (parent, _, { dataSources }) => {
      if (!parent.responsibleId) return null;
      return await dataSources.userAPI.getUser(parent.responsibleId);
    },
    
    attachments: async (parent, _, { dataSources }) => {
      return await dataSources.fileAPI.getAttachments(parent.id);
    }
  },
  
  Act: {
    responsible: async (parent, _, { dataSources }) => {
      if (!parent.responsibleId) return null;
      return await dataSources.userAPI.getUser(parent.responsibleId);
    },
    
    client: async (parent, _, { dataSources }) => {
      if (!parent.clientId) return null;
      return await dataSources.clientAPI.getClient(parent.clientId);
    },
    
    attachments: async (parent, _, { dataSources }) => {
      return await dataSources.fileAPI.getAttachments(parent.id);
    }
  },
  
  TimeEntry: {
    user: async (parent, _, { dataSources }) => {
      return await dataSources.userAPI.getUser(parent.userId);
    },
    
    task: async (parent, _, { dataSources }) => {
      if (!parent.taskId) return null;
      return await dataSources.taskAPI.getTask(parent.taskId);
    }
  },
  
  Comment: {
    author: async (parent, _, { dataSources }) => {
      return await dataSources.userAPI.getUser(parent.authorId);
    },
    
    task: async (parent, _, { dataSources }) => {
      if (!parent.taskId) return null;
      return await dataSources.taskAPI.getTask(parent.taskId);
    },
    
    report: async (parent, _, { dataSources }) => {
      if (!parent.reportId) return null;
      return await dataSources.reportAPI.getReport(parent.reportId);
    }
  },
  
  Attachment: {
    uploadedByUser: async (parent, _, { dataSources }) => {
      return await dataSources.userAPI.getUser(parent.uploadedBy);
    }
  },
  
  Contact: {
    client: async (parent, _, { dataSources }) => {
      return await dataSources.clientAPI.getClient(parent.clientId);
    }
  },
  
  Project: {
    client: async (parent, _, { dataSources }) => {
      return await dataSources.clientAPI.getClient(parent.clientId);
    },
    
    tasks: async (parent, _, { dataSources }) => {
      return await dataSources.taskAPI.getTasks({ projectId: parent.id });
    }
  },
  
  FinancialAccount: {
    company: async (parent, _, { dataSources }) => {
      return await dataSources.companyAPI.getCompany(parent.companyId);
    },
    
    transactions: async (parent, _, { dataSources }) => {
      return await dataSources.financialAPI.getTransactions({ accountId: parent.id });
    }
  },
  
  FinancialTransaction: {
    account: async (parent, _, { dataSources }) => {
      return await dataSources.financialAPI.getAccount(parent.accountId);
    }
  }
};

export default resolvers; 