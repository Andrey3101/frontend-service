/**
 * Composable для управления пагинацией
 */

import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function usePagination(options = {}) {
  const {
    initialPage = 1,
    initialItemsPerPage = 10,
    itemsPerPageOptions = [5, 10, 20, 50, 100],
    syncWithRoute = true,
    routeQueryKey = 'page',
    itemsPerPageQueryKey = 'limit',
    maxVisiblePages = 7
  } = options;

  // Состояние пагинации
  const currentPage = ref(initialPage);
  const itemsPerPage = ref(initialItemsPerPage);
  const totalItems = ref(0);
  const loading = ref(false);

  // Route и router для синхронизации с URL
  const route = useRoute();
  const router = useRouter();

  // Вычисляемые свойства
  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / itemsPerPage.value);
  });

  const startItem = computed(() => {
    return (currentPage.value - 1) * itemsPerPage.value + 1;
  });

  const endItem = computed(() => {
    const end = currentPage.value * itemsPerPage.value;
    return Math.min(end, totalItems.value);
  });

  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value;
  });

  const hasPrevPage = computed(() => {
    return currentPage.value > 1;
  });

  const visiblePages = computed(() => {
    if (totalPages.value <= maxVisiblePages) {
      return Array.from({ length: totalPages.value }, (_, i) => i + 1);
    }

    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    // Всегда показываем первую страницу
    pages.push(1);
    
    if (currentPage.value > halfVisible + 2) {
      pages.push('...');
    }
    
    // Показываем страницы вокруг текущей
    const start = Math.max(2, currentPage.value - halfVisible);
    const end = Math.min(totalPages.value - 1, currentPage.value + halfVisible);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage.value < totalPages.value - halfVisible - 1) {
      pages.push('...');
    }
    
    // Всегда показываем последнюю страницу
    if (totalPages.value > 1) {
      pages.push(totalPages.value);
    }
    
    return pages;
  });

  // Методы
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
      currentPage.value = page;
      updateRoute();
    }
  };

  const goToNextPage = () => {
    if (hasNextPage.value) {
      goToPage(currentPage.value + 1);
    }
  };

  const goToPrevPage = () => {
    if (hasPrevPage.value) {
      goToPage(currentPage.value - 1);
    }
  };

  const goToFirstPage = () => {
    goToPage(1);
  };

  const goToLastPage = () => {
    goToPage(totalPages.value);
  };

  const changeItemsPerPage = (newItemsPerPage) => {
    itemsPerPage.value = newItemsPerPage;
    // Сбрасываем на первую страницу при изменении количества элементов
    currentPage.value = 1;
    updateRoute();
  };

  const resetPagination = () => {
    currentPage.value = 1;
    itemsPerPage.value = initialItemsPerPage;
    updateRoute();
  };

  const updateRoute = () => {
    if (syncWithRoute) {
      const query = { ...route.query };
      
      if (currentPage.value > 1) {
        query[routeQueryKey] = currentPage.value.toString();
      } else {
        delete query[routeQueryKey];
      }
      
      if (itemsPerPage.value !== initialItemsPerPage) {
        query[itemsPerPageQueryKey] = itemsPerPage.value.toString();
      } else {
        delete query[itemsPerPageQueryKey];
      }
      
      router.replace({ query });
    }
  };

  const syncFromRoute = () => {
    if (syncWithRoute) {
      const pageFromRoute = parseInt(route.query[routeQueryKey]);
      const limitFromRoute = parseInt(route.query[itemsPerPageQueryKey]);
      
      if (pageFromRoute && pageFromRoute > 0) {
        currentPage.value = pageFromRoute;
      }
      
      if (limitFromRoute && itemsPerPageOptions.includes(limitFromRoute)) {
        itemsPerPage.value = limitFromRoute;
      }
    }
  };

  const setTotalItems = (total) => {
    totalItems.value = total;
    
    // Проверяем, что текущая страница не выходит за пределы
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value;
      updateRoute();
    }
  };

  const getPaginationParams = () => {
    return {
      page: currentPage.value,
      limit: itemsPerPage.value,
      offset: (currentPage.value - 1) * itemsPerPage.value
    };
  };

  const getPaginationMeta = () => {
    return {
      currentPage: currentPage.value,
      totalPages: totalPages.value,
      totalItems: totalItems.value,
      itemsPerPage: itemsPerPage.value,
      startItem: startItem.value,
      endItem: endItem.value,
      hasNextPage: hasNextPage.value,
      hasPrevPage: hasPrevPage.value
    };
  };

  // Синхронизация с route при изменении
  if (syncWithRoute) {
    watch(() => route.query, syncFromRoute, { immediate: true });
  }

  // Экспортируем все необходимые свойства и методы
  return {
    // Состояние
    currentPage,
    itemsPerPage,
    totalItems,
    loading,
    
    // Вычисляемые свойства
    totalPages,
    startItem,
    endItem,
    hasNextPage,
    hasPrevPage,
    visiblePages,
    
    // Методы
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    changeItemsPerPage,
    resetPagination,
    setTotalItems,
    getPaginationParams,
    getPaginationMeta,
    
    // Конфигурация
    itemsPerPageOptions,
    maxVisiblePages
  };
}

/**
 * Composable для пагинации с кэшированием
 */
export function useCachedPagination(options = {}) {
  const {
    cacheKey,
    cacheService,
    cacheType = 'memory',
    cacheTTL = 5 * 60 * 1000, // 5 минут
    ...paginationOptions
  } = options;

  const pagination = usePagination(paginationOptions);
  
  // Кэширование данных
  const cachedData = ref(null);
  const cacheTimestamp = ref(null);

  const getCachedData = () => {
    if (!cacheService || !cacheKey) return null;
    
    const cacheKeyWithParams = `${cacheKey}_${pagination.currentPage.value}_${pagination.itemsPerPage.value}`;
    return cacheService.get(cacheKeyWithParams, cacheType);
  };

  const setCachedData = (data) => {
    if (!cacheService || !cacheKey) return;
    
    const cacheKeyWithParams = `${cacheKey}_${pagination.currentPage.value}_${pagination.itemsPerPage.value}`;
    cacheService.set(cacheKeyWithParams, {
      data,
      timestamp: Date.now()
    }, cacheType, cacheTTL);
  };

  const invalidateCache = () => {
    if (!cacheService || !cacheKey) return;
    
    cacheService.invalidateByPattern(`^${cacheKey}`, cacheType);
  };

  const fetchWithCache = async (fetchFunction) => {
    try {
      pagination.loading.value = true;
      
      // Проверяем кэш
      const cached = getCachedData();
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        cachedData.value = cached.data;
        cacheTimestamp.value = cached.timestamp;
        return cached.data;
      }
      
      // Получаем новые данные
      const data = await fetchFunction();
      
      // Кэшируем
      setCachedData(data);
      cachedData.value = data;
      cacheTimestamp.value = Date.now();
      
      return data;
    } finally {
      pagination.loading.value = false;
    }
  };

  return {
    ...pagination,
    cachedData,
    cacheTimestamp,
    fetchWithCache,
    invalidateCache
  };
}

/**
 * Composable для бесконечной прокрутки
 */
export function useInfiniteScroll(options = {}) {
  const {
    threshold = 100, // пиксели до конца для загрузки
    ...paginationOptions
  } = options;

  const pagination = usePagination(paginationOptions);
  const loadingMore = ref(false);
  const hasMore = ref(true);

  const loadMore = async (loadFunction) => {
    if (loadingMore.value || !hasMore.value) return;
    
    try {
      loadingMore.value = true;
      const newData = await loadFunction();
      
      // Добавляем новые данные к существующим
      if (newData && newData.length > 0) {
        // Здесь нужно реализовать логику добавления данных
        // в зависимости от структуры вашего приложения
        pagination.currentPage.value++;
      } else {
        hasMore.value = false;
      }
    } finally {
      loadingMore.value = false;
    }
  };

  const resetInfiniteScroll = () => {
    pagination.resetPagination();
    hasMore.value = true;
    loadingMore.value = false;
  };

  return {
    ...pagination,
    loadingMore,
    hasMore,
    loadMore,
    resetInfiniteScroll
  };
}

export default usePagination; 