/**
 * Утилиты для lazy loading компонентов
 */

import { defineAsyncComponent, h, resolveComponent } from 'vue';

/**
 * Создание асинхронного компонента с загрузчиком
 */
export function createLazyComponent(importFn, options = {}) {
  const {
    loadingComponent = 'LoadingSpinner',
    errorComponent = 'ErrorBoundary',
    delay = 200,
    timeout = 3000,
    retry = 3,
    onError = null
  } = options;

  return defineAsyncComponent({
    loader: importFn,
    loadingComponent: resolveComponent(loadingComponent),
    errorComponent: resolveComponent(errorComponent),
    delay,
    timeout,
    retry,
    onError: (error, retry, fail, attempts) => {
      console.error(`Lazy loading failed after ${attempts} attempts:`, error);
      
      if (onError) {
        onError(error, retry, fail, attempts);
      }
      
      if (attempts >= retry) {
        fail();
      } else {
        retry();
      }
    }
  });
}

/**
 * Создание компонента с предзагрузкой
 */
export function createPreloadableComponent(importFn, options = {}) {
  const {
    preload = false,
    preloadDelay = 1000,
    ...lazyOptions
  } = options;

  const component = createLazyComponent(importFn, lazyOptions);

  if (preload) {
    // Предзагружаем компонент через некоторое время
    setTimeout(() => {
      importFn();
    }, preloadDelay);
  }

  return component;
}

/**
 * Создание компонента с кэшированием
 */
export function createCachedLazyComponent(importFn, options = {}) {
  const {
    cacheKey = null,
    cacheTTL = 5 * 60 * 1000, // 5 минут
    ...lazyOptions
  } = options;

  let cachedComponent = null;
  let cacheTimestamp = 0;

  const loadComponent = async () => {
    // Проверяем кэш
    if (cachedComponent && (Date.now() - cacheTimestamp) < cacheTTL) {
      return cachedComponent;
    }

    // Загружаем компонент
    const component = await importFn();
    
    // Кэшируем
    cachedComponent = component;
    cacheTimestamp = Date.now();
    
    return component;
  };

  return createLazyComponent(loadComponent, lazyOptions);
}

/**
 * Создание компонента с приоритетной загрузкой
 */
export function createPriorityLazyComponent(importFn, options = {}) {
  const {
    priority = 'normal', // 'high', 'normal', 'low'
    ...lazyOptions
  } = options;

  const priorityMap = {
    high: { delay: 0, timeout: 5000 },
    normal: { delay: 200, timeout: 3000 },
    low: { delay: 1000, timeout: 10000 }
  };

  const priorityOptions = priorityMap[priority] || priorityMap.normal;

  return createLazyComponent(importFn, {
    ...lazyOptions,
    ...priorityOptions
  });
}

/**
 * Создание компонента с прогрессивной загрузкой
 */
export function createProgressiveLazyComponent(importFn, options = {}) {
  const {
    stages = [
      { delay: 0, timeout: 1000, retry: 1 },
      { delay: 500, timeout: 3000, retry: 2 },
      { delay: 2000, timeout: 10000, retry: 3 }
    ],
    ...lazyOptions
  } = options;

  let currentStage = 0;

  const loadWithRetry = async () => {
    try {
      return await importFn();
    } catch (error) {
      if (currentStage < stages.length - 1) {
        currentStage++;
        const stage = stages[currentStage];
        
        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, stage.delay));
        
        // Повторяем с новыми параметрами
        return await loadWithRetry();
      }
      throw error;
    }
  };

  return createLazyComponent(loadWithRetry, {
    ...lazyOptions,
    delay: stages[0].delay,
    timeout: stages[0].timeout,
    retry: stages[0].retry
  });
}

/**
 * Создание компонента с условной загрузкой
 */
export function createConditionalLazyComponent(importFn, conditionFn, options = {}) {
  const {
    fallbackComponent = null,
    ...lazyOptions
  } = options;

  return defineAsyncComponent({
    loader: async () => {
      // Проверяем условие
      if (await conditionFn()) {
        return await importFn();
      }
      
      // Возвращаем fallback компонент
      if (fallbackComponent) {
        return typeof fallbackComponent === 'string' 
          ? resolveComponent(fallbackComponent)
          : fallbackComponent;
      }
      
      // Возвращаем пустой компонент
      return {
        render() {
          return h('div', { style: 'display: none;' });
        }
      };
    },
    ...lazyOptions
  });
}

/**
 * Создание компонента с параллельной загрузкой
 */
export function createParallelLazyComponent(importFns, options = {}) {
  const {
    loadingStrategy = 'all', // 'all', 'any', 'race'
    ...lazyOptions
  } = options;

  const loadComponents = async () => {
    try {
      switch (loadingStrategy) {
        case 'all':
          return await Promise.all(importFns.map(fn => fn()));
        case 'any':
          return await Promise.any(importFns.map(fn => fn()));
        case 'race':
          return await Promise.race(importFns.map(fn => fn()));
        default:
          return await Promise.all(importFns.map(fn => fn()));
      }
    } catch (error) {
      console.error('Parallel loading failed:', error);
      throw error;
    }
  };

  return createLazyComponent(loadComponents, lazyOptions);
}

/**
 * Создание компонента с предварительной загрузкой зависимостей
 */
export function createDependencyAwareLazyComponent(importFn, dependencies, options = {}) {
  const {
    preloadDependencies = true,
    dependencyTimeout = 5000,
    ...lazyOptions
  } = options;

  let dependenciesLoaded = false;

  const loadDependencies = async () => {
    if (dependenciesLoaded) return;

    try {
      await Promise.all(
        dependencies.map(dep => {
          if (typeof dep === 'function') {
            return dep();
          }
          return Promise.resolve(dep);
        })
      );
      dependenciesLoaded = true;
    } catch (error) {
      console.error('Failed to load dependencies:', error);
      throw error;
    }
  };

  const loadComponent = async () => {
    // Сначала загружаем зависимости
    await loadDependencies();
    
    // Затем загружаем основной компонент
    return await importFn();
  };

  if (preloadDependencies) {
    // Предзагружаем зависимости
    loadDependencies().catch(console.error);
  }

  return createLazyComponent(loadComponent, {
    ...lazyOptions,
    timeout: dependencyTimeout + (lazyOptions.timeout || 3000)
  });
}

/**
 * Создание компонента с мониторингом производительности
 */
export function createMonitoredLazyComponent(importFn, options = {}) {
  const {
    onLoadStart = null,
    onLoadSuccess = null,
    onLoadError = null,
    performanceMark = true,
    ...lazyOptions
  } = options;

  const loadWithMonitoring = async () => {
    const startTime = performance.now();
    const markName = `lazy-load-${Date.now()}`;
    
    if (performanceMark) {
      performance.mark(markName);
    }
    
    try {
      onLoadStart?.();
      
      const component = await importFn();
      
      const loadTime = performance.now() - startTime;
      
      if (performanceMark) {
        performance.measure(`lazy-load-${markName}`, markName);
        performance.clearMarks(markName);
      }
      
      onLoadSuccess?.(loadTime);
      
      return component;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      onLoadError?.(error, loadTime);
      throw error;
    }
  };

  return createLazyComponent(loadWithMonitoring, lazyOptions);
}

/**
 * Утилита для создания компонентов по умолчанию
 */
export const LazyComponents = {
  // Компоненты с высоким приоритетом
  HighPriority: {
    Dashboard: createPriorityLazyComponent(
      () => import('@/views/DashboardPage.vue'),
      { priority: 'high' }
    ),
    Navigation: createPriorityLazyComponent(
      () => import('@/components/SidebarForm.vue'),
      { priority: 'high' }
    )
  },

  // Компоненты с нормальным приоритетом
  Normal: {
    Tasks: createLazyComponent(() => import('@/views/TasksList.vue')),
    Reports: createLazyComponent(() => import('@/views/ReportList.vue')),
    Acts: createLazyComponent(() => import('@/views/ActsList.vue')),
    Users: createLazyComponent(() => import('@/views/UsersList.vue'))
  },

  // Компоненты с низким приоритетом
  Low: {
    Settings: createPriorityLazyComponent(
      () => import('@/views/ProfileForm.vue'),
      { priority: 'low' }
    ),
    Help: createPriorityLazyComponent(
      () => import('@/views/HelpPage.vue'),
      { priority: 'low' }
    )
  },

  // Компоненты с кэшированием
  Cached: {
    Charts: createCachedLazyComponent(
      () => import('@/components/BarChart.vue'),
      { cacheTTL: 10 * 60 * 1000 } // 10 минут
    ),
    Forms: createCachedLazyComponent(
      () => import('@/components/TaskForm.vue'),
      { cacheTTL: 5 * 60 * 1000 } // 5 минут
    )
  }
};

/**
 * Утилита для предзагрузки компонентов
 */
export function preloadComponents(components) {
  const preloadPromises = components.map(component => {
    if (typeof component === 'function') {
      return component().catch(console.error);
    }
    return Promise.resolve();
  });

  return Promise.allSettled(preloadPromises);
}

/**
 * Утилита для очистки кэша компонентов
 */
export function clearComponentCache() {
  // Очищаем кэш модулей
  if (typeof window !== 'undefined' && window.__webpack_require__) {
    // Webpack
    if (window.__webpack_require__.c) {
      Object.keys(window.__webpack_require__.c).forEach(key => {
        delete window.__webpack_require__.c[key];
      });
    }
  }
  
  // Очищаем кэш динамических импортов
  if (typeof window !== 'undefined' && window.importShim) {
    window.importShim.cache.clear();
  }
}

export default {
  createLazyComponent,
  createPreloadableComponent,
  createCachedLazyComponent,
  createPriorityLazyComponent,
  createProgressiveLazyComponent,
  createConditionalLazyComponent,
  createParallelLazyComponent,
  createDependencyAwareLazyComponent,
  createMonitoredLazyComponent,
  LazyComponents,
  preloadComponents,
  clearComponentCache
}; 