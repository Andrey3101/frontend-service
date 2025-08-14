// Реестр микрофронтендов для Self-Employed Platform
import { loadMicroFrontend } from './loader';

class MicroFrontendRegistry {
  constructor() {
    this.registry = new Map();
    this.loadedModules = new Map();
    this.activeModules = new Set();
    this.config = {
      baseUrl: process.env.VUE_APP_MICRO_FRONTEND_BASE_URL || 'http://localhost:3000',
      timeout: 30000,
      retryAttempts: 3
    };
  }

  // Регистрация микрофронтенда
  register(name, config) {
    if (this.registry.has(name)) {
      console.warn(`Micro-frontend ${name} already registered, updating configuration`);
    }

    const microFrontend = {
      id: name,
      name: config.name || name,
      description: config.description || '',
      version: config.version || '1.0.0',
      url: config.url,
      scope: config.scope || name,
      module: config.module || './App',
      dependencies: config.dependencies || [],
      permissions: config.permissions || [],
      status: 'registered',
      config: {
        ...this.config,
        ...config.config
      }
    };

    this.registry.set(name, microFrontend);
    console.log(`Micro-frontend ${name} registered successfully`);
    
    return microFrontend;
  }

  // Получение информации о микрофронтенде
  get(name) {
    return this.registry.get(name);
  }

  // Получение всех зарегистрированных микрофронтендов
  getAll() {
    return Array.from(this.registry.values());
  }

  // Получение доступных микрофронтендов для пользователя
  getAvailable(userPermissions = []) {
    return this.getAll().filter(mf => {
      if (mf.permissions.length === 0) return true;
      return mf.permissions.some(permission => userPermissions.includes(permission));
    });
  }

  // Загрузка микрофронтенда
  async load(name, options = {}) {
    const microFrontend = this.registry.get(name);
    
    if (!microFrontend) {
      throw new Error(`Micro-frontend ${name} not found in registry`);
    }

    if (this.loadedModules.has(name)) {
      console.log(`Micro-frontend ${name} already loaded`);
      return this.loadedModules.get(name);
    }

    try {
      console.log(`Loading micro-frontend ${name}...`);
      microFrontend.status = 'loading';

      // Проверка зависимостей
      await this.checkDependencies(microFrontend);

      // Загрузка модуля
      const module = await loadMicroFrontend(microFrontend, options);
      
      // Инициализация модуля
      const initializedModule = await this.initializeModule(microFrontend, module);
      
      // Сохранение в загруженные модули
      this.loadedModules.set(name, initializedModule);
      microFrontend.status = 'loaded';
      
      console.log(`Micro-frontend ${name} loaded successfully`);
      
      return initializedModule;
    } catch (error) {
      console.error(`Failed to load micro-frontend ${name}:`, error);
      microFrontend.status = 'error';
      microFrontend.error = error.message;
      throw error;
    }
  }

  // Проверка зависимостей
  async checkDependencies(microFrontend) {
    const missingDependencies = [];
    
    for (const dependency of microFrontend.dependencies) {
      if (!this.loadedModules.has(dependency)) {
        missingDependencies.push(dependency);
      }
    }
    
    if (missingDependencies.length > 0) {
      console.log(`Loading dependencies for ${microFrontend.name}:`, missingDependencies);
      
      for (const dependency of missingDependencies) {
        await this.load(dependency);
      }
    }
  }

  // Инициализация модуля
  async initializeModule(microFrontend, module) {
    try {
      // Проверка наличия необходимых методов
      if (typeof module.mount !== 'function') {
        throw new Error(`Module ${microFrontend.name} must have a mount method`);
      }

      if (typeof module.unmount !== 'function') {
        throw new Error(`Module ${microFrontend.name} must have an unmount method`);
      }

      // Создание обертки модуля
      const wrappedModule = {
        ...module,
        id: microFrontend.id,
        name: microFrontend.name,
        version: microFrontend.version,
        scope: microFrontend.scope,
        status: 'initialized',
        mount: async (container, props = {}) => {
          try {
            console.log(`Mounting micro-frontend ${microFrontend.name}...`);
            wrappedModule.status = 'mounted';
            this.activeModules.add(microFrontend.id);
            
            // Вызов оригинального метода mount
            const result = await module.mount(container, {
              ...props,
              registry: this,
              microFrontend
            });
            
            console.log(`Micro-frontend ${microFrontend.name} mounted successfully`);
            return result;
          } catch (error) {
            console.error(`Failed to mount micro-frontend ${microFrontend.name}:`, error);
            wrappedModule.status = 'error';
            throw error;
          }
        },
        unmount: async () => {
          try {
            console.log(`Unmounting micro-frontend ${microFrontend.name}...`);
            
            // Вызов оригинального метода unmount
            if (typeof module.unmount === 'function') {
              await module.unmount();
            }
            
            wrappedModule.status = 'unmounted';
            this.activeModules.delete(microFrontend.id);
            
            console.log(`Micro-frontend ${microFrontend.name} unmounted successfully`);
          } catch (error) {
            console.error(`Failed to unmount micro-frontend ${microFrontend.name}:`, error);
            throw error;
          }
        },
        update: async (props = {}) => {
          if (typeof module.update === 'function') {
            return await module.update(props);
          }
        }
      };

      return wrappedModule;
    } catch (error) {
      console.error(`Failed to initialize module ${microFrontend.name}:`, error);
      throw error;
    }
  }

  // Монтирование микрофронтенда
  async mount(name, container, props = {}) {
    const module = await this.load(name);
    return await module.mount(container, props);
  }

  // Размонтирование микрофронтенда
  async unmount(name) {
    const module = this.loadedModules.get(name);
    if (module) {
      return await module.unmount();
    }
  }

  // Обновление микрофронтенда
  async update(name, props = {}) {
    const module = this.loadedModules.get(name);
    if (module && typeof module.update === 'function') {
      return await module.update(props);
    }
  }

  // Получение статуса микрофронтенда
  getStatus(name) {
    const microFrontend = this.registry.get(name);
    if (!microFrontend) return 'not_found';
    
    const loadedModule = this.loadedModules.get(name);
    if (loadedModule) {
      return loadedModule.status;
    }
    
    return microFrontend.status;
  }

  // Получение активных модулей
  getActiveModules() {
    return Array.from(this.activeModules);
  }

  // Очистка всех модулей
  async cleanup() {
    console.log('Cleaning up all micro-frontends...');
    
    const unmountPromises = Array.from(this.activeModules).map(name => 
      this.unmount(name).catch(error => 
        console.error(`Failed to unmount ${name}:`, error)
      )
    );
    
    await Promise.all(unmountPromises);
    
    this.loadedModules.clear();
    this.activeModules.clear();
    
    console.log('Cleanup completed');
  }

  // Обновление конфигурации
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Registry configuration updated:', this.config);
  }

  // Получение статистики
  getStats() {
    return {
      total: this.registry.size,
      loaded: this.loadedModules.size,
      active: this.activeModules.size,
      statuses: Object.fromEntries(
        Array.from(this.registry.keys()).map(name => [
          name,
          this.getStatus(name)
        ])
      )
    };
  }

  // Проверка здоровья микрофронтенда
  async healthCheck(name) {
    const microFrontend = this.registry.get(name);
    if (!microFrontend) {
      return { status: 'not_found', error: 'Micro-frontend not registered' };
    }

    try {
      // Проверка доступности URL
      const response = await fetch(microFrontend.url, {
        method: 'HEAD',
        timeout: 5000
      });
      
      if (response.ok) {
        return { status: 'healthy', url: microFrontend.url };
      } else {
        return { status: 'unhealthy', url: microFrontend.url, statusCode: response.status };
      }
    } catch (error) {
      return { status: 'error', url: microFrontend.url, error: error.message };
    }
  }

  // Получение информации о версиях
  getVersionInfo() {
    return Array.from(this.registry.values()).map(mf => ({
      name: mf.name,
      version: mf.version,
      scope: mf.scope,
      status: this.getStatus(mf.id)
    }));
  }

  // Экспорт конфигурации
  exportConfig() {
    return {
      config: this.config,
      registry: Array.from(this.registry.values()).map(mf => ({
        id: mf.id,
        name: mf.name,
        version: mf.version,
        url: mf.url,
        scope: mf.scope,
        dependencies: mf.dependencies,
        permissions: mf.permissions
      }))
    };
  }

  // Импорт конфигурации
  importConfig(config) {
    try {
      if (config.config) {
        this.updateConfig(config.config);
      }
      
      if (config.registry) {
        for (const mfConfig of config.registry) {
          this.register(mfConfig.id, mfConfig);
        }
      }
      
      console.log('Configuration imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}

// Создание глобального экземпляра реестра
const registry = new MicroFrontendRegistry();

// Регистрация встроенных микрофронтендов
registry.register('tasks-module', {
  name: 'Tasks Management',
  description: 'Управление задачами и проектами',
  version: '1.0.0',
  url: 'http://localhost:3001',
  scope: 'tasks',
  module: './TasksApp',
  dependencies: [],
  permissions: ['tasks:read', 'tasks:write']
});

registry.register('analytics-module', {
  name: 'Analytics Dashboard',
  description: 'AI аналитика и отчеты',
  version: '1.0.0',
  url: 'http://localhost:3002',
  scope: 'analytics',
  module: './AnalyticsApp',
  dependencies: ['tasks-module'],
  permissions: ['analytics:read', 'analytics:write']
});

registry.register('finance-module', {
  name: 'Financial Management',
  description: 'Управление финансами и отчетность',
  version: '1.0.0',
  url: 'http://localhost:3003',
  scope: 'finance',
  module: './FinanceApp',
  dependencies: [],
  permissions: ['finance:read', 'finance:write']
});

registry.register('clients-module', {
  name: 'Client Management',
  description: 'Управление клиентами и CRM',
  version: '1.0.0',
  url: 'http://localhost:3004',
  scope: 'clients',
  module: './ClientsApp',
  dependencies: [],
  permissions: ['clients:read', 'clients:write']
});

// Экспорт реестра
export default registry;

// Экспорт утилит
export { MicroFrontendRegistry }; 