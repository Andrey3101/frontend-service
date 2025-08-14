<template>
  <div class="pagination-container">
    <!-- Информация о страницах -->
    <div class="pagination-info">
      <span class="pagination-text">
        Показано {{ startItem }}-{{ endItem }} из {{ totalItems }} записей
      </span>
      <span class="pagination-text">
        Страница {{ currentPage }} из {{ totalPages }}
      </span>
    </div>

    <!-- Навигация по страницам -->
    <div class="pagination-navigation">
      <!-- Кнопка "Первая страница" -->
      <v-btn
        :disabled="currentPage === 1"
        @click="goToPage(1)"
        icon
        small
        class="pagination-btn"
        :class="{ 'disabled': currentPage === 1 }"
      >
        <v-icon>mdi-chevron-double-left</v-icon>
      </v-btn>

      <!-- Кнопка "Предыдущая страница" -->
      <v-btn
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        icon
        small
        class="pagination-btn"
        :class="{ 'disabled': currentPage === 1 }"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>

      <!-- Номера страниц -->
      <div class="pagination-pages">
        <template v-for="page in visiblePages" :key="page">
          <!-- Многоточие -->
          <span v-if="page === '...'" class="pagination-ellipsis">
            ...
          </span>
          
          <!-- Номер страницы -->
          <v-btn
            v-else
            :class="[
              'pagination-page-btn',
              { 'active': page === currentPage }
            ]"
            @click="goToPage(page)"
            small
            text
          >
            {{ page }}
          </v-btn>
        </template>
      </div>

      <!-- Кнопка "Следующая страница" -->
      <v-btn
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        icon
        small
        class="pagination-btn"
        :class="{ 'disabled': currentPage === totalPages }"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>

      <!-- Кнопка "Последняя страница" -->
      <v-btn
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
        icon
        small
        class="pagination-btn"
        :class="{ 'disabled': currentPage === totalPages }"
      >
        <v-icon>mdi-chevron-double-right</v-icon>
      </v-btn>
    </div>

    <!-- Выбор количества элементов на странице -->
    <div class="pagination-per-page">
      <span class="pagination-text">Записей на странице:</span>
      <v-select
        v-model="localItemsPerPage"
        :items="itemsPerPageOptions"
        @change="onItemsPerPageChange"
        dense
        outlined
        hide-details
        class="pagination-select"
      />
    </div>

    <!-- Быстрая навигация -->
    <div class="pagination-quick-nav">
      <span class="pagination-text">Перейти на страницу:</span>
      <v-text-field
        v-model.number="quickPageInput"
        type="number"
        :min="1"
        :max="totalPages"
        @keyup.enter="goToQuickPage"
        dense
        outlined
        hide-details
        class="pagination-input"
        style="max-width: 80px;"
      />
      <v-btn
        @click="goToQuickPage"
        small
        outlined
        class="pagination-go-btn"
      >
        Перейти
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  
  props: {
    // Текущая страница
    currentPage: {
      type: Number,
      required: true,
      default: 1
    },
    
    // Общее количество элементов
    totalItems: {
      type: Number,
      required: true,
      default: 0
    },
    
    // Количество элементов на странице
    itemsPerPage: {
      type: Number,
      required: true,
      default: 10
    },
    
    // Опции для количества элементов на странице
    itemsPerPageOptions: {
      type: Array,
      default: () => [5, 10, 20, 50, 100]
    },
    
    // Максимальное количество видимых страниц
    maxVisiblePages: {
      type: Number,
      default: 7
    }
  },

  emits: ['page-change', 'items-per-page-change'],

  data() {
    return {
      localItemsPerPage: this.itemsPerPage,
      quickPageInput: this.currentPage
    };
  },

  computed: {
    /**
     * Общее количество страниц
     */
    totalPages() {
      return Math.ceil(this.totalItems / this.localItemsPerPage);
    },

    /**
     * Номер первого элемента на текущей странице
     */
    startItem() {
      return (this.currentPage - 1) * this.localItemsPerPage + 1;
    },

    /**
     * Номер последнего элемента на текущей странице
     */
    endItem() {
      const end = this.currentPage * this.localItemsPerPage;
      return Math.min(end, this.totalItems);
    },

    /**
     * Видимые номера страниц с многоточием
     */
    visiblePages() {
      if (this.totalPages <= this.maxVisiblePages) {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
      }

      const pages = [];
      const halfVisible = Math.floor(this.maxVisiblePages / 2);
      
      // Всегда показываем первую страницу
      pages.push(1);
      
      if (this.currentPage > halfVisible + 2) {
        pages.push('...');
      }
      
      // Показываем страницы вокруг текущей
      const start = Math.max(2, this.currentPage - halfVisible);
      const end = Math.min(this.totalPages - 1, this.currentPage + halfVisible);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (this.currentPage < this.totalPages - halfVisible - 1) {
        pages.push('...');
      }
      
      // Всегда показываем последнюю страницу
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
      
      return pages;
    }
  },

  watch: {
    /**
     * Синхронизация с внешним значением itemsPerPage
     */
    itemsPerPage(newValue) {
      this.localItemsPerPage = newValue;
    },

    /**
     * Синхронизация с внешним значением currentPage
     */
    currentPage(newValue) {
      this.quickPageInput = newValue;
    }
  },

  methods: {
    /**
     * Переход на указанную страницу
     */
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.$emit('page-change', page);
      }
    },

    /**
     * Быстрый переход на страницу
     */
    goToQuickPage() {
      const page = parseInt(this.quickPageInput);
      if (page >= 1 && page <= this.totalPages) {
        this.goToPage(page);
      } else {
        // Сброс на текущую страницу при неверном вводе
        this.quickPageInput = this.currentPage;
      }
    },

    /**
     * Изменение количества элементов на странице
     */
    onItemsPerPageChange() {
      this.$emit('items-per-page-change', this.localItemsPerPage);
    },

    /**
     * Сброс на первую страницу
     */
    resetToFirstPage() {
      this.goToPage(1);
    }
  }
};
</script>

<style scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pagination-text {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.pagination-navigation {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  color: #1976d2;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(.disabled) {
  background-color: rgba(25, 118, 210, 0.1);
  transform: scale(1.1);
}

.pagination-btn.disabled {
  color: #ccc;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-page-btn {
  min-width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.pagination-page-btn:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.pagination-page-btn.active {
  background-color: #1976d2;
  color: white;
}

.pagination-ellipsis {
  padding: 0 8px;
  color: #666;
  font-weight: bold;
}

.pagination-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-select {
  min-width: 80px;
}

.pagination-quick-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-input {
  text-align: center;
}

.pagination-go-btn {
  color: #1976d2;
  border-color: #1976d2;
}

.pagination-go-btn:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .pagination-navigation {
    justify-content: center;
  }

  .pagination-info,
  .pagination-per-page,
  .pagination-quick-nav {
    text-align: center;
  }

  .pagination-pages {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .pagination-container {
    padding: 12px;
  }

  .pagination-navigation {
    gap: 4px;
  }

  .pagination-btn {
    min-width: 32px;
    height: 32px;
  }

  .pagination-page-btn {
    min-width: 32px;
    height: 32px;
  }
}
</style> 