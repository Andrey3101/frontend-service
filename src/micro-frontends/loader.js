// Загрузчик микрофронтендов для Self-Employed Platform
import { EventBus } from './event-bus';

class MicroFrontendLoader {
  constructor() {
    this.eventBus = new EventBus();
    this.loadedScripts = new Set();
    this.loadedStyles = new Set();
    this.moduleCache = new Map();
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      cacheTimeout: 300000, // 5 минут
      enableCache: true
    };
  }

  // Загрузка микрофронтенда
  async loadMicroFrontend(microFrontend, options = {}) {
    const { forceReload = false, timeout = this.config.timeout } = options;
    
    try {
      console.log(`Loading micro-frontend: ${microFrontend.name}`);
      
      // Проверка кэша
      if (this.config.enableCache && !forceReload) {
        const cached = this.getCachedModule(microFrontend.id);
        if (cached) {
          console.log(`Loading ${microFrontend.name} from cache`);
          return cached;
        }
      }
      
      // Загрузка в зависимости от типа модуля
      let module;
      
      if (microFrontend.module.startsWith('http')) {
        // Внешний модуль
        module = await this.loadExternalModule(microFrontend, timeout);
      } else if (microFrontend.module.startsWith('./')) {
        // Локальный модуль
        module = await this.loadLocalModule(microFrontend, timeout);
      } else {
        // Модуль по умолчанию
        module = await this.loadDefaultModule(microFrontend, timeout);
      }
      
      // Кэширование модуля
      if (this.config.enableCache) {
        this.cacheModule(microFrontend.id, module);
      }
      
      // Уведомление о загрузке
      this.eventBus.emit('moduleLoaded', { microFrontend, module });
      
      return module;
      
    } catch (error) {
      console.error(`Failed to load micro-frontend ${microFrontend.name}:`, error);
      
      // Попытка повторной загрузки
      if (options.retryCount < this.config.retryAttempts) {
        console.log(`Retrying to load ${microFrontend.name} (attempt ${options.retryCount + 1})`);
        return this.loadMicroFrontend(microFrontend, {
          ...options,
          retryCount: (options.retryCount || 0) + 1
        });
      }
      
      // Уведомление об ошибке
      this.eventBus.emit('moduleLoadError', { microFrontend, error });
      throw error;
    }
  }

  // Загрузка внешнего модуля
  async loadExternalModule(microFrontend, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading external module: ${microFrontend.name}`));
      }, timeout);

      try {
        // Загрузка CSS если есть
        if (microFrontend.styles) {
          this.loadStyles(microFrontend.styles);
        }

        // Загрузка JavaScript
        const script = document.createElement('script');
        script.src = microFrontend.url;
        script.type = 'module';
        script.async = true;
        
        script.onload = () => {
          clearTimeout(timeoutId);
          
          // Получение модуля из глобального scope
          const module = this.getModuleFromScope(microFrontend.scope);
          if (module) {
            resolve(module);
          } else {
            reject(new Error(`Module not found in scope: ${microFrontend.scope}`));
          }
        };
        
        script.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load script: ${microFrontend.url}`));
        };
        
        document.head.appendChild(script);
        this.loadedScripts.add(microFrontend.url);
        
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Загрузка локального модуля
  async loadLocalModule(microFrontend, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading local module: ${microFrontend.name}`));
      }, timeout);

      try {
        // Динамический импорт локального модуля
        const modulePath = microFrontend.module.replace('./', '@/micro-frontends/');
        
        import(/* webpackChunkName: "[request]" */ modulePath)
          .then(module => {
            clearTimeout(timeoutId);
            resolve(module.default || module);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
          
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Загрузка модуля по умолчанию
  async loadDefaultModule(microFrontend, timeout) {
    // Создание базового модуля
    const defaultModule = {
      name: microFrontend.name,
      version: microFrontend.version,
      mount: async (container, props = {}) => {
        console.log(`Mounting default module: ${microFrontend.name}`);
        
        const div = document.createElement('div');
        div.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <h3>${microFrontend.name}</h3>
            <p>Версия: ${microFrontend.version}</p>
            <p>Это модуль по умолчанию для ${microFrontend.name}</p>
            <p>Для полной функциональности загрузите модуль с сервера</p>
          </div>
        `;
        
        container.appendChild(div);
        return div;
      },
      
      unmount: async () => {
        console.log(`Unmounting default module: ${microFrontend.name}`);
      },
      
      update: async (props = {}) => {
        console.log(`Updating default module: ${microFrontend.name}`, props);
      }
    };
    
    return defaultModule;
  }

  // Получение модуля из глобального scope
  getModuleFromScope(scope) {
    if (window[scope]) {
      return window[scope];
    }
    
    // Поиск в различных форматах
    const possibleScopes = [
      scope,
      scope.replace(/-/g, '_'),
      scope.replace(/-/g, ''),
      scope.charAt(0).toUpperCase() + scope.slice(1)
    ];
    
    for (const possibleScope of possibleScopes) {
      if (window[possibleScope]) {
        return window[possibleScope];
      }
    }
    
    return null;
  }

  // Загрузка CSS стилей
  loadStyles(styles) {
    if (Array.isArray(styles)) {
      styles.forEach(style => this.loadStyle(style));
    } else {
      this.loadStyle(styles);
    }
  }

  // Загрузка одного CSS файла
  loadStyle(styleUrl) {
    if (this.loadedStyles.has(styleUrl)) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = styleUrl;
    link.type = 'text/css';
    
    link.onload = () => {
      this.loadedStyles.add(styleUrl);
      console.log(`Style loaded: ${styleUrl}`);
    };
    
    link.onerror = () => {
      console.error(`Failed to load style: ${styleUrl}`);
    };
    
    document.head.appendChild(link);
  }

  // Кэширование модуля
  cacheModule(id, module) {
    this.moduleCache.set(id, {
      module,
      timestamp: Date.now(),
      ttl: this.config.cacheTimeout
    });
  }

  // Получение кэшированного модуля
  getCachedModule(id) {
    const cached = this.moduleCache.get(id);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.module;
    }
    
    // Удаление устаревшего кэша
    if (cached) {
      this.moduleCache.delete(id);
    }
    
    return null;
  }

  // Проверка валидности кэша
  isCacheValid(cached) {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  // Очистка кэша
  clearCache(id = null) {
    if (id) {
      this.moduleCache.delete(id);
    } else {
      this.moduleCache.clear();
    }
  }

  // Получение информации о загруженных модулях
  getLoadedModulesInfo() {
    const info = {
      total: this.moduleCache.size,
      modules: []
    };
    
    for (const [id, cached] of this.moduleCache.entries()) {
      info.modules.push({
        id,
        name: cached.module.name || 'Unknown',
        version: cached.module.version || 'Unknown',
        loadedAt: new Date(cached.timestamp),
        age: Date.now() - cached.timestamp
      });
    }
    
    return info;
  }

  // Проверка здоровья модуля
  async healthCheck(microFrontend) {
    try {
      const startTime = Date.now();
      
      // Проверка доступности URL
      const response = await fetch(microFrontend.url, {
        method: 'HEAD',
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'healthy',
          responseTime,
          statusCode: response.status
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime,
          statusCode: response.status
        };
      }
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Предзагрузка модулей
  async preloadModules(microFrontends) {
    const preloadPromises = microFrontends.map(mf => 
      this.loadMicroFrontend(mf, { preload: true }).catch(error => {
        console.warn(`Failed to preload ${mf.name}:`, error);
        return null;
      })
    );
    
    const results = await Promise.allSettled(preloadPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null);
    const failed = results.filter(r => r.status === 'rejected');
    
    console.log(`Preloaded ${successful.length} modules, ${failed.length} failed`);
    
    return {
      successful: successful.length,
      failed: failed.length,
      total: microFrontends.length
    };
  }

  // Удаление модуля
  async unloadModule(microFrontend) {
    try {
      // Вызов метода unload если есть
      const cached = this.moduleCache.get(microFrontend.id);
      if (cached && typeof cached.module.unload === 'function') {
        await cached.module.unload();
      }
      
      // Удаление из кэша
      this.moduleCache.delete(microFrontend.id);
      
      // Удаление скриптов и стилей
      this.removeScriptsAndStyles(microFrontend);
      
      console.log(`Module ${microFrontend.name} unloaded successfully`);
      
      // Уведомление об удалении
      this.eventBus.emit('moduleUnloaded', { microFrontend });
      
    } catch (error) {
      console.error(`Failed to unload module ${microFrontend.name}:`, error);
      throw error;
    }
  }

  // Удаление скриптов и стилей
  removeScriptsAndStyles(microFrontend) {
    // Удаление скриптов
    const scripts = document.querySelectorAll(`script[src="${microFrontend.url}"]`);
    scripts.forEach(script => script.remove());
    this.loadedScripts.delete(microFrontend.url);
    
    // Удаление стилей
    if (microFrontend.styles) {
      const styles = Array.isArray(microFrontend.styles) ? microFrontend.styles : [microFrontend.styles];
      styles.forEach(styleUrl => {
        const links = document.querySelectorAll(`link[href="${styleUrl}"]`);
        links.forEach(link => link.remove());
        this.loadedStyles.delete(styleUrl);
      });
    }
  }

  // Получение статистики загрузчика
  getStats() {
    return {
      loadedScripts: this.loadedScripts.size,
      loadedStyles: this.loadedStyles.size,
      cachedModules: this.moduleCache.size,
      config: { ...this.config }
    };
  }

  // Обновление конфигурации
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Loader configuration updated:', this.config);
    
    // Уведомление об изменении конфигурации
    this.eventBus.emit('configUpdated', this.config);
  }

  // Подписка на события
  on(event, callback) {
    return this.eventBus.on(event, callback);
  }

  // Отписка от событий
  off(event, callback) {
    return this.eventBus.off(event, callback);
  }
}

// Экспорт загрузчика
export const loadMicroFrontend = async (microFrontend, options = {}) => {
  const loader = new MicroFrontendLoader();
  return await loader.loadMicroFrontend(microFrontend, options);
};

export default MicroFrontendLoader; 