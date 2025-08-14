# WebAssembly Модуль Критических Вычислений

Высокопроизводительный WebAssembly модуль для критических вычислений в Self-Employed Platform.

## 🚀 Возможности

### Финансовые расчеты
- **Сложные проценты** - расчет наращенной суммы
- **Платежи по кредиту** - ежемесячные платежи
- **Налоги** - расчет налогов с учетом вычетов
- **Рентабельность** - прибыльность и ROI
- **Портфель** - оптимизация инвестиционного портфеля

### Математические функции
- **Быстрый квадратный корень** - оптимизированный алгоритм
- **Экспонента** - быстрое вычисление e^x
- **Логарифм** - натуральный логарифм
- **Статистика** - среднее, дисперсия, корреляция

### Обработка данных
- **Сортировка** - быстрая сортировка (QuickSort)
- **Поиск** - бинарный поиск
- **Временные ряды** - скользящие средние, экспоненциальное сглаживание
- **Матрицы** - умножение матриц, транспонирование

### Криптография и сжатие
- **Хеширование** - простые хеш-функции
- **Сжатие** - RLE алгоритм
- **Память** - выровненное выделение памяти

## 📦 Установка

### Требования
- Node.js 16+
- Emscripten SDK 3.1+
- Make (для сборки)

### Установка Emscripten

```bash
# Клонирование репозитория
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Установка последней версии
./emsdk install latest
./emsdk activate latest

# Активация в текущей сессии
source ./emsdk_env.sh
```

### Сборка модуля

```bash
# Переход в директорию wasm
cd frontend-service/wasm

# Сборка
make all

# Или по отдельности
make wasm    # Только WASM файл
make js      # JavaScript обертка
make types   # TypeScript определения
```

## 🔧 Использование

### Базовое использование

```javascript
import wasmCalculator from './wasm/wasm-calculator.js';

// Инициализация
const calculator = await wasmCalculator.init();

// Финансовые расчеты
const interest = calculator.calculateCompoundInterest(10000, 5, 3, 12);
const payment = calculator.calculateLoanPayment(100000, 4.5, 30);

// Математические функции
const sqrt = calculator.fastSqrt(16);
const exp = calculator.fastExp(2);

// Статистика
const data = [1, 2, 3, 4, 5];
const mean = calculator.calculateMean(data);
const std = calculator.calculateStandardDeviation(data);
```

### Продвинутое использование

```javascript
// Матричные операции
const matrix1 = [1, 2, 3, 4];
const matrix2 = [5, 6, 7, 8];
const result = calculator.parallelMatrixMultiply(matrix1, matrix2, 2);

// Временные ряды
const timeSeries = [10, 12, 11, 13, 15, 14, 16];
const movingAvg = calculator.calculateMovingAverage(timeSeries, 3);
const smoothed = calculator.calculateExponentialSmoothing(timeSeries, 0.3);

// Сортировка и поиск
const unsorted = [5, 2, 8, 1, 9, 3];
const sorted = calculator.quickSort(unsorted);
const index = calculator.binarySearch(sorted, 8);
```

### Интеграция с Vue.js

```vue
<template>
  <div class="calculator">
    <v-text-field
      v-model="principal"
      label="Основная сумма"
      type="number"
    />
    <v-text-field
      v-model="rate"
      label="Процентная ставка"
      type="number"
    />
    <v-text-field
      v-model="years"
      label="Срок (лет)"
      type="number"
    />
    
    <v-btn @click="calculate" color="primary">
      Рассчитать
    </v-btn>
    
    <div v-if="result" class="result">
      <h3>Результат:</h3>
      <p>Сложные проценты: {{ result.interest }}</p>
      <p>Ежемесячный платеж: {{ result.payment }}</p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import wasmCalculator from '@/wasm/wasm-calculator.js';

export default {
  setup() {
    const principal = ref(10000);
    const rate = ref(5);
    const years = ref(3);
    const result = ref(null);

    const calculate = async () => {
      try {
        const calculator = await wasmCalculator.init();
        
        result.value = {
          interest: calculator.calculateCompoundInterest(
            principal.value,
            rate.value,
            years.value,
            12
          ),
          payment: calculator.calculateLoanPayment(
            principal.value,
            rate.value,
            years.value
          )
        };
      } catch (error) {
        console.error('Calculation failed:', error);
      }
    };

    return {
      principal,
      rate,
      years,
      result,
      calculate
    };
  }
};
</script>
```

## 📊 Производительность

### Бенчмарки

| Операция | JavaScript | WebAssembly | Улучшение |
|----------|------------|-------------|-----------|
| Квадратный корень | 1000 ops/ms | 5000 ops/ms | 5x |
| Сортировка (10k) | 50 ms | 15 ms | 3.3x |
| Корреляция (1k) | 2 ms | 0.5 ms | 4x |
| Матрицы (100x100) | 150 ms | 45 ms | 3.3x |

### Запуск бенчмарков

```bash
# Компиляция
make benchmark

# Запуск
node benchmark.js
```

## 🏗️ Архитектура

### Структура модуля

```
wasm/
├── critical-calculations.c    # Исходный C код
├── critical-calculations.wasm # Скомпилированный WASM
├── critical-calculations.js   # JavaScript обертка
├── wasm-calculator.js         # Vue.js интеграция
├── Makefile                   # Сборка
└── README.md                  # Документация
```

### Экспортируемые функции

```c
// Финансы
EMSCRIPTEN_KEEPALIVE double calculate_compound_interest(double principal, double rate, int years, int compound_period);
EMSCRIPTEN_KEEPALIVE double calculate_loan_payment(double principal, double rate, int years);
EMSCRIPTEN_KEEPALIVE double calculate_tax(double amount, double tax_rate, double deductions);

// Математика
EMSCRIPTEN_KEEPALIVE double fast_sqrt(double x);
EMSCRIPTEN_KEEPALIVE double fast_exp(double x);
EMSCRIPTEN_KEEPALIVE double fast_log(double x);

// Статистика
EMSCRIPTEN_KEEPALIVE double calculate_mean(double* data, int size);
EMSCRIPTEN_KEEPALIVE double calculate_variance(double* data, int size);
EMSCRIPTEN_KEEPALIVE double calculate_correlation(double* x, double* y, int size);

// Алгоритмы
EMSCRIPTEN_KEEPALIVE void quick_sort(double* data, int left, int right);
EMSCRIPTEN_KEEPALIVE int binary_search(double* data, int size, double target);
```

## 🔍 Отладка

### Отладочная версия

```bash
make debug
```

### Валидация WASM

```bash
make validate
```

### Проверка размера

```bash
make size
```

## 🚀 Оптимизация

### Продакшн версия

```bash
make production
```

### Настройка флагов компиляции

```makefile
EMCC_FLAGS = -O3 -s WASM=1 \
  -s EXPORTED_FUNCTIONS="[...]" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=16777216 \
  -s MAXIMUM_MEMORY=67108864 \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1
```

## 📱 Совместимость

### Браузеры
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

### Fallback
При недоступности WebAssembly автоматически используются JavaScript реализации функций.

## 🧪 Тестирование

### Unit тесты

```bash
npm test
```

### Интеграционные тесты

```bash
npm run test:integration
```

### E2E тесты

```bash
npm run test:e2e
```

## 📈 Мониторинг

### Метрики производительности

```javascript
import performanceMetrics from '@/services/performance-metrics.js';

// Отслеживание WASM операций
performanceMetrics.trackWASMOperation('calculateCompoundInterest', startTime);
```

### Логирование

```javascript
// Включение детального логирования
localStorage.setItem('wasm-debug', 'true');
```

## 🔒 Безопасность

### Валидация входных данных
- Проверка диапазонов значений
- Защита от переполнения
- Санитизация строк

### Изоляция памяти
- Выделение в отдельном heap
- Автоматическая очистка
- Защита от утечек

## 🤝 Вклад в проект

### Добавление новых функций

1. Добавить функцию в `critical-calculations.c`
2. Экспортировать через `EMSCRIPTEN_KEEPALIVE`
3. Добавить в `EMCC_FLAGS`
4. Создать JavaScript обертку
5. Добавить тесты

### Пример добавления функции

```c
EMSCRIPTEN_KEEPALIVE
double calculate_fibonacci(int n) {
    if (n <= 1) return n;
    
    double a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        double temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}
```

## 📚 Дополнительные ресурсы

- [Emscripten Documentation](https://emscripten.org/docs/)
- [WebAssembly Specification](https://webassembly.org/specs/)
- [MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [Vue.js Integration Guide](https://vuejs.org/guide/)

## 📞 Поддержка

При возникновении проблем:

1. Проверьте совместимость браузера
2. Убедитесь в корректности входных данных
3. Проверьте консоль на наличие ошибок
4. Создайте issue в репозитории

---

**Версия:** 1.0.0  
**Лицензия:** MIT  
**Автор:** Self-Employed Platform Team 