<template>
  <div 
    ref="container"
    class="virtual-list-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <!-- Верхний спейсер для позиционирования -->
    <div 
      :style="{ height: topSpacerHeight + 'px' }"
      class="virtual-list-spacer"
    />
    
    <!-- Видимые элементы -->
    <div 
      v-for="item in visibleItems"
      :key="item.id || item.index"
      :style="{ 
        height: itemHeight + 'px',
        transform: `translateY(${item.offsetY}px)`
      }"
      class="virtual-list-item"
      :class="{ 'virtual-list-item-selected': selectedItems.has(item.id || item.index) }"
      @click="handleItemClick(item)"
      @dblclick="handleItemDoubleClick(item)"
    >
      <slot 
        name="item" 
        :item="item.data" 
        :index="item.index"
        :isSelected="selectedItems.has(item.id || item.index)"
      >
        <div class="virtual-list-item-content">
          {{ item.data }}
        </div>
      </slot>
    </div>
    
    <!-- Нижний спейсер для позиционирования -->
    <div 
      :style="{ height: bottomSpacerHeight + 'px' }"
      class="virtual-list-spacer"
    />
    
    <!-- Индикатор загрузки -->
    <div 
      v-if="loading"
      class="virtual-list-loading"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="24"
      />
      <span class="virtual-list-loading-text">Загрузка...</span>
    </div>
    
    <!-- Индикатор конца списка -->
    <div 
      v-if="!hasMore && visibleItems.length > 0"
      class="virtual-list-end"
    >
      <span class="virtual-list-end-text">Конец списка</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

export default {
  name: 'VirtualList',
  
  props: {
    // Данные для отображения
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    
    // Высота контейнера
    containerHeight: {
      type: Number,
      default: 400
    },
    
    // Высота каждого элемента
    itemHeight: {
      type: Number,
      default: 50
    },
    
    // Количество элементов для предзагрузки
    overscan: {
      type: Number,
      default: 5
    },
    
    // Поддержка множественного выбора
    multiSelect: {
      type: Boolean,
      default: false
    },
    
    // Поддержка бесконечной прокрутки
    infiniteScroll: {
      type: Boolean,
      default: false
    },
    
    // Функция загрузки дополнительных данных
    loadMore: {
      type: Function,
      default: null
    },
    
    // Порог для загрузки (в пикселях от конца)
    loadThreshold: {
      type: Number,
      default: 100
    },
    
    // Состояние загрузки
    loading: {
      type: Boolean,
      default: false
    },
    
    // Есть ли еще данные для загрузки
    hasMore: {
      type: Boolean,
      default: true
    },
    
    // Уникальный идентификатор для элементов
    itemKey: {
      type: String,
      default: 'id'
    }
  },

  emits: ['item-click', 'item-double-click', 'selection-change', 'scroll', 'load-more'],

  setup(props, { emit }) {
    // Ссылки на DOM элементы
    const container = ref(null);
    
    // Состояние
    const scrollTop = ref(0);
    const selectedItems = ref(new Set());
    const lastScrollTop = ref(0);
    const scrollDirection = ref('down');
    
    // Вычисляемые свойства
    const totalHeight = computed(() => props.items.length * props.itemHeight);
    
    const startIndex = computed(() => {
      const index = Math.floor(scrollTop.value / props.itemHeight);
      return Math.max(0, index - props.overscan);
    });
    
    const endIndex = computed(() => {
      const visibleCount = Math.ceil(props.containerHeight / props.itemHeight);
      const index = Math.floor(scrollTop.value / props.containerHeight) + visibleCount;
      return Math.min(props.items.length - 1, index + props.overscan);
    });
    
    const visibleItems = computed(() => {
      const items = [];
      for (let i = startIndex.value; i <= endIndex.value; i++) {
        if (props.items[i]) {
          items.push({
            id: props.items[i][props.itemKey] || i,
            index: i,
            data: props.items[i],
            offsetY: i * props.itemHeight
          });
        }
      }
      return items;
    });
    
    const topSpacerHeight = computed(() => startIndex.value * props.itemHeight);
    
    const bottomSpacerHeight = computed(() => {
      const remainingItems = props.items.length - endIndex.value - 1;
      return Math.max(0, remainingItems * props.itemHeight);
    });
    
    // Методы
    const handleScroll = (event) => {
      const target = event.target;
      scrollTop.value = target.scrollTop;
      
      // Определяем направление скролла
      scrollDirection.value = scrollTop.value > lastScrollTop.value ? 'down' : 'up';
      lastScrollTop.value = scrollTop.value;
      
      // Проверяем необходимость загрузки дополнительных данных
      if (props.infiniteScroll && props.loadMore && props.hasMore && !props.loading) {
        const scrollBottom = target.scrollTop + target.clientHeight;
        const threshold = totalHeight.value - props.loadThreshold;
        
        if (scrollBottom >= threshold) {
          emit('load-more');
          if (props.loadMore) {
            props.loadMore();
          }
        }
      }
      
      emit('scroll', {
        scrollTop: scrollTop.value,
        scrollDirection: scrollDirection.value,
        startIndex: startIndex.value,
        endIndex: endIndex.value
      });
    };
    
    const handleItemClick = (item) => {
      if (props.multiSelect) {
        if (selectedItems.value.has(item.id)) {
          selectedItems.value.delete(item.id);
        } else {
          selectedItems.value.add(item.id);
        }
      } else {
        selectedItems.value.clear();
        selectedItems.value.add(item.id);
      }
      
      emit('selection-change', Array.from(selectedItems.value));
      emit('item-click', item);
    };
    
    const handleItemDoubleClick = (item) => {
      emit('item-double-click', item);
    };
    
    const scrollToIndex = (index) => {
      if (container.value) {
        const targetScrollTop = index * props.itemHeight;
        container.value.scrollTop = targetScrollTop;
      }
    };
    
    const scrollToItem = (itemId) => {
      const index = props.items.findIndex(item => item[props.itemKey] === itemId);
      if (index !== -1) {
        scrollToIndex(index);
      }
    };
    
    const selectItem = (itemId) => {
      selectedItems.value.add(itemId);
      emit('selection-change', Array.from(selectedItems.value));
    };
    
    const deselectItem = (itemId) => {
      selectedItems.value.delete(itemId);
      emit('selection-change', Array.from(selectedItems.value));
    };
    
    const selectAll = () => {
      if (props.multiSelect) {
        props.items.forEach(item => {
          selectedItems.value.add(item[props.itemKey] || item);
        });
        emit('selection-change', Array.from(selectedItems.value));
      }
    };
    
    const deselectAll = () => {
      selectedItems.value.clear();
      emit('selection-change', []);
    };
    
    const getSelectedItems = () => {
      return props.items.filter(item => 
        selectedItems.value.has(item[props.itemKey] || item)
      );
    };
    
    const getSelectedIndices = () => {
      return props.items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => selectedItems.value.has(item[props.itemKey] || item))
        .map(({ index }) => index);
    };
    
    // Наблюдатели
    watch(() => props.items, () => {
      // Сбрасываем скролл при изменении данных
      if (container.value) {
        container.value.scrollTop = 0;
        scrollTop.value = 0;
      }
    }, { deep: true });
    
    // Жизненный цикл
    onMounted(() => {
      // Инициализация после монтирования
      nextTick(() => {
        if (container.value) {
          scrollTop.value = container.value.scrollTop;
        }
      });
    });
    
    onUnmounted(() => {
      // Очистка при размонтировании
      selectedItems.value.clear();
    });
    
    return {
      // Ссылки
      container,
      
      // Состояние
      scrollTop,
      selectedItems,
      scrollDirection,
      
      // Вычисляемые свойства
      totalHeight,
      startIndex,
      endIndex,
      visibleItems,
      topSpacerHeight,
      bottomSpacerHeight,
      
      // Методы
      handleScroll,
      handleItemClick,
      handleItemDoubleClick,
      scrollToIndex,
      scrollToItem,
      selectItem,
      deselectItem,
      selectAll,
      deselectAll,
      getSelectedItems,
      getSelectedIndices
    };
  }
};
</script>

<style scoped>
.virtual-list-container {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #ffffff;
}

.virtual-list-spacer {
  width: 100%;
}

.virtual-list-item {
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.virtual-list-item:hover {
  background-color: #f5f5f5;
}

.virtual-list-item-selected {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.virtual-list-item-selected:hover {
  background-color: #bbdefb;
}

.virtual-list-item-content {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  min-height: 50px;
}

.virtual-list-loading {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.virtual-list-loading-text {
  font-size: 14px;
  color: #666;
}

.virtual-list-end {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.virtual-list-end-text {
  font-size: 14px;
  color: #999;
  font-style: italic;
}

/* Кастомный скроллбар */
.virtual-list-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Анимации */
.virtual-list-item {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .virtual-list-container {
    border-radius: 0;
  }
  
  .virtual-list-item-content {
    padding: 8px 12px;
    min-height: 40px;
  }
  
  .virtual-list-loading,
  .virtual-list-end {
    bottom: 10px;
    padding: 12px;
  }
}
</style> 