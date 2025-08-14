/**
 * JavaScript обертка для WebAssembly модуля критических вычислений
 */

class WASMCalculator {
  constructor() {
    this.wasmModule = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    this.fallbackMode = false;
    
    // Fallback функции для случаев, когда WASM недоступен
    this.fallbackFunctions = this.createFallbackFunctions();
    
    this.init();
  }

  /**
   * Инициализация WASM модуля
   */
  async init() {
    try {
      await this.loadWASMModule();
      this.isLoaded = true;
      console.log('WASM module loaded successfully');
    } catch (error) {
      console.warn('WASM module failed to load, using fallback functions:', error);
      this.fallbackMode = true;
    }
  }

  /**
   * Загрузка WASM модуля
   */
  async loadWASMModule() {
    if (this.isLoading) {
      return this.loadPromise;
    }

    this.isLoading = true;
    
    try {
      // Загружаем WASM модуль
      const response = await fetch('/wasm/critical-calculations.wasm');
      const wasmBuffer = await response.arrayBuffer();
      
      // Инициализируем модуль
      const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
        env: {
          memory: new WebAssembly.Memory({ initial: 256, maximum: 1024 }),
          abort: () => console.error('WASM abort'),
          emscripten_get_now: () => performance.now()
        }
      });
      
      this.wasmModule = wasmModule.instance.exports;
      this.loadPromise = Promise.resolve();
      
      return this.loadPromise;
    } catch (error) {
      this.loadPromise = Promise.reject(error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Создание fallback функций
   */
  createFallbackFunctions() {
    return {
      // Финансовые расчеты
      calculateCompoundInterest: (principal, rate, years, compoundPeriod) => {
        const r = rate / 100;
        const n = compoundPeriod;
        const t = years;
        return principal * Math.pow(1 + r/n, n*t);
      },

      calculateLoanPayment: (principal, rate, years) => {
        const r = rate / 100 / 12;
        const n = years * 12;
        if (r === 0) return principal / n;
        return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      },

      calculateTax: (amount, taxRate, deductions) => {
        const taxableIncome = amount - deductions;
        if (taxableIncome <= 0) return 0;
        return taxableIncome * (taxRate / 100);
      },

      calculateProfitMargin: (revenue, costs) => {
        if (revenue === 0) return 0;
        return ((revenue - costs) / revenue) * 100;
      },

      calculateROI: (initialInvestment, finalValue) => {
        if (initialInvestment === 0) return 0;
        return ((finalValue - initialInvestment) / initialInvestment) * 100;
      },

      // Математические функции
      fastSqrt: (x) => Math.sqrt(x),
      fastExp: (x) => Math.exp(x),
      fastLog: (x) => Math.log(x),

      // Статистические функции
      calculateMean: (data) => {
        if (data.length === 0) return 0;
        return data.reduce((sum, val) => sum + val, 0) / data.length;
      },

      calculateVariance: (data) => {
        if (data.length <= 1) return 0;
        const mean = this.fallbackFunctions.calculateMean(data);
        const sumSquares = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
        return sumSquares / (data.length - 1);
      },

      calculateStandardDeviation: (data) => {
        return Math.sqrt(this.fallbackFunctions.calculateVariance(data));
      },

      calculateCorrelation: (x, y) => {
        if (x.length !== y.length || x.length <= 1) return 0;
        
        const meanX = this.fallbackFunctions.calculateMean(x);
        const meanY = this.fallbackFunctions.calculateMean(y);
        
        let numerator = 0;
        let sumXSq = 0;
        let sumYSq = 0;
        
        for (let i = 0; i < x.length; i++) {
          const diffX = x[i] - meanX;
          const diffY = y[i] - meanY;
          
          numerator += diffX * diffY;
          sumXSq += diffX * diffX;
          sumYSq += diffY * diffY;
        }
        
        const denominator = Math.sqrt(sumXSq * sumYSq);
        if (denominator === 0) return 0;
        
        return numerator / denominator;
      }
    };
  }

  /**
   * Вызов WASM функции с fallback
   */
  callWASMFunction(functionName, ...args) {
    if (this.isLoaded && this.wasmModule && this.wasmModule[functionName]) {
      try {
        return this.wasmModule[functionName](...args);
      } catch (error) {
        console.warn(`WASM function ${functionName} failed, using fallback:`, error);
        return this.fallbackFunctions[functionName](...args);
      }
    } else {
      return this.fallbackFunctions[functionName](...args);
    }
  }

  /**
   * Финансовые расчеты
   */
  calculateCompoundInterest(principal, rate, years, compoundPeriod = 12) {
    return this.callWASMFunction('calculateCompoundInterest', principal, rate, years, compoundPeriod);
  }

  calculateLoanPayment(principal, rate, years) {
    return this.callWASMFunction('calculateLoanPayment', principal, rate, years);
  }

  calculateTax(amount, taxRate, deductions) {
    return this.callWASMFunction('calculateTax', amount, taxRate, deductions);
  }

  calculateProfitMargin(revenue, costs) {
    return this.callWASMFunction('calculateProfitMargin', revenue, costs);
  }

  calculateROI(initialInvestment, finalValue) {
    return this.callWASMFunction('calculateROI', initialInvestment, finalValue);
  }

  /**
   * Математические функции
   */
  fastSqrt(x) {
    return this.callWASMFunction('fastSqrt', x);
  }

  fastExp(x) {
    return this.callWASMFunction('fastExp', x);
  }

  fastLog(x) {
    return this.callWASMFunction('fastLog', x);
  }

  /**
   * Статистические функции
   */
  calculateMean(data) {
    if (this.isLoaded && this.wasmModule) {
      // Создаем TypedArray для WASM
      const dataArray = new Float64Array(data);
      const dataPtr = this.wasmModule.allocateAligned(dataArray.length * 8, 8);
      
      try {
        // Копируем данные в WASM память
        const wasmMemory = new Float64Array(this.wasmModule.memory.buffer, dataPtr, dataArray.length);
        wasmMemory.set(dataArray);
        
        const result = this.wasmModule.calculateMean(dataPtr, dataArray.length);
        
        return result;
      } finally {
        this.wasmModule.freeAligned(dataPtr);
      }
    } else {
      return this.fallbackFunctions.calculateMean(data);
    }
  }

  calculateVariance(data) {
    if (this.isLoaded && this.wasmModule) {
      const dataArray = new Float64Array(data);
      const dataPtr = this.wasmModule.allocateAligned(dataArray.length * 8, 8);
      
      try {
        const wasmMemory = new Float64Array(this.wasmModule.memory.buffer, dataPtr, dataArray.length);
        wasmMemory.set(dataArray);
        
        const result = this.wasmModule.calculateVariance(dataPtr, dataArray.length);
        
        return result;
      } finally {
        this.wasmModule.freeAligned(dataPtr);
      }
    } else {
      return this.fallbackFunctions.calculateVariance(data);
    }
  }

  calculateStandardDeviation(data) {
    if (this.isLoaded && this.wasmModule) {
      const dataArray = new Float64Array(data);
      const dataPtr = this.wasmModule.allocateAligned(dataArray.length * 8, 8);
      
      try {
        const wasmMemory = new Float64Array(this.wasmModule.memory.buffer, dataPtr, dataArray.length);
        wasmMemory.set(dataArray);
        
        const result = this.wasmModule.calculateStandardDeviation(dataPtr, dataArray.length);
        
        return result;
      } finally {
        this.wasmModule.freeAligned(dataPtr);
      }
    } else {
      return this.fallbackFunctions.calculateStandardDeviation(data);
    }
  }

  calculateCorrelation(x, y) {
    if (this.isLoaded && this.wasmModule) {
      const xArray = new Float64Array(x);
      const yArray = new Float64Array(y);
      
      const xPtr = this.wasmModule.allocateAligned(xArray.length * 8, 8);
      const yPtr = this.wasmModule.allocateAligned(yArray.length * 8, 8);
      
      try {
        const xMemory = new Float64Array(this.wasmModule.memory.buffer, xPtr, xArray.length);
        const yMemory = new Float64Array(this.wasmModule.memory.buffer, yPtr, yArray.length);
        
        xMemory.set(xArray);
        yMemory.set(yArray);
        
        const result = this.wasmModule.calculateCorrelation(xPtr, yPtr, xArray.length);
        
        return result;
      } finally {
        this.wasmModule.freeAligned(xPtr);
        this.wasmModule.freeAligned(yPtr);
      }
    } else {
      return this.fallbackFunctions.calculateCorrelation(x, y);
    }
  }

  /**
   * Сортировка и поиск
   */
  quickSort(data) {
    if (this.isLoaded && this.wasmModule) {
      const dataArray = new Float64Array(data);
      const dataPtr = this.wasmModule.allocateAligned(dataArray.length * 8, 8);
      
      try {
        const wasmMemory = new Float64Array(this.wasmModule.memory.buffer, dataPtr, dataArray.length);
        wasmMemory.set(dataArray);
        
        this.wasmModule.quickSort(dataPtr, 0, dataArray.length - 1);
        
        // Копируем отсортированные данные обратно
        const sortedData = Array.from(wasmMemory);
        
        return sortedData;
      } finally {
        this.wasmModule.freeAligned(dataPtr);
      }
    } else {
      return [...data].sort((a, b) => a - b);
    }
  }

  binarySearch(data, target) {
    if (this.isLoaded && this.wasmModule) {
      const dataArray = new Float64Array(data);
      const dataPtr = this.wasmModule.allocateAligned(dataArray.length * 8, 8);
      
      try {
        const wasmMemory = new Float64Array(this.wasmModule.memory.buffer, dataPtr, dataArray.length);
        wasmMemory.set(dataArray);
        
        const result = this.wasmModule.binarySearch(dataPtr, dataArray.length, target);
        
        return result;
      } finally {
        this.wasmModule.freeAligned(dataPtr);
      }
    } else {
      let left = 0;
      let right = data.length - 1;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (Math.abs(data[mid] - target) < 1e-10) {
          return mid;
        }
        
        if (data[mid] < target) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      return -1;
    }
  }

  /**
   * Анализ временных рядов
   */
  calculateMovingAverage(data, window) {
    if (this.isLoaded && this.wasmModule) {
      const dataArray = new Float64Array(data);
      const resultArray = new Float64Array(data.length - window + 1);
      
      const dataPtr = this.wasmModule.allocateAligned(dataArray.length * 8, 8);
      const resultPtr = this.wasmModule.allocateAligned(resultArray.length * 8, 8);
      
      try {
        const wasmMemory = new Float64Array(this.wasmModule.memory.buffer, dataPtr, dataArray.length);
        const resultMemory = new Float64Array(this.wasmModule.memory.buffer, resultPtr, resultArray.length);
        
        wasmMemory.set(dataArray);
        
        this.wasmModule.calculateMovingAverage(dataPtr, resultPtr, dataArray.length, window);
        
        const result = Array.from(resultMemory);
        
        return result;
      } finally {
        this.wasmModule.freeAligned(dataPtr);
        this.wasmModule.freeAligned(resultPtr);
      }
    } else {
      const result = [];
      for (let i = 0; i <= data.length - window; i++) {
        const sum = data.slice(i, i + window).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
      return result;
    }
  }

  calculateExponentialSmoothing(data, alpha) {
    if (this.isLoaded && this.wasmModule) {
      const dataArray = new Float64Array(data);
      const resultArray = new Float64Array(data.length);
      
      const dataPtr = this.wasmModule.allocateAligned(dataArray.length * 8, 8);
      const resultPtr = this.wasmModule.allocateAligned(resultArray.length * 8, 8);
      
      try {
        const wasmMemory = new Float64Array(this.wasmModule.memory.buffer, dataPtr, dataArray.length);
        const resultMemory = new Float64Array(this.wasmModule.memory.buffer, resultPtr, resultArray.length);
        
        wasmMemory.set(dataArray);
        
        this.wasmModule.calculateExponentialSmoothing(dataPtr, resultPtr, dataArray.length, alpha);
        
        const result = Array.from(resultMemory);
        
        return result;
      } finally {
        this.wasmModule.freeAligned(dataPtr);
        this.wasmModule.freeAligned(resultPtr);
      }
    } else {
      const result = [data[0]];
      for (let i = 1; i < data.length; i++) {
        result[i] = alpha * data[i] + (1 - alpha) * result[i - 1];
      }
      return result;
    }
  }

  /**
   * Матричные операции
   */
  parallelMatrixMultiply(a, b, size) {
    if (this.isLoaded && this.wasmModule) {
      const aArray = new Float64Array(a);
      const bArray = new Float64Array(b);
      const resultArray = new Float64Array(size * size);
      
      const aPtr = this.wasmModule.allocateAligned(aArray.length * 8, 8);
      const bPtr = this.wasmModule.allocateAligned(bArray.length * 8, 8);
      const resultPtr = this.wasmModule.allocateAligned(resultArray.length * 8, 8);
      
      try {
        const aMemory = new Float64Array(this.wasmModule.memory.buffer, aPtr, aArray.length);
        const bMemory = new Float64Array(this.wasmModule.memory.buffer, bPtr, bArray.length);
        const resultMemory = new Float64Array(this.wasmModule.memory.buffer, resultPtr, resultArray.length);
        
        aMemory.set(aArray);
        bMemory.set(bArray);
        
        this.wasmModule.parallelMatrixMultiply(aPtr, bPtr, resultPtr, size);
        
        const result = Array.from(resultMemory);
        
        return result;
      } finally {
        this.wasmModule.freeAligned(aPtr);
        this.wasmModule.freeAligned(bPtr);
        this.wasmModule.freeAligned(resultPtr);
      }
    } else {
      const result = new Array(size * size);
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          let sum = 0;
          for (let k = 0; k < size; k++) {
            sum += a[i * size + k] * b[k * size + j];
          }
          result[i * size + j] = sum;
        }
      }
      return result;
    }
  }

  /**
   * Бенчмаркинг
   */
  benchmarkFunction(func, input, iterations = 1000000) {
    if (this.isLoaded && this.wasmModule) {
      return this.wasmModule.benchmarkFunction(func, input, iterations);
    } else {
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        func(input);
      }
      
      const endTime = performance.now();
      return endTime - startTime;
    }
  }

  /**
   * Сравнение производительности WASM vs JavaScript
   */
  async benchmarkComparison() {
    const testData = Array.from({ length: 10000 }, () => Math.random() * 1000);
    const iterations = 100000;
    
    console.log('Running performance benchmarks...');
    
    // Тест математических функций
    const wasmSqrtTime = this.benchmarkFunction(this.fastSqrt.bind(this), 100, iterations);
    const jsSqrtTime = this.benchmarkFunction(Math.sqrt, 100, iterations);
    
    // Тест статистических функций
    const wasmMeanTime = this.benchmarkFunction(() => this.calculateMean(testData), null, 1000);
    const jsMeanTime = this.benchmarkFunction(() => this.fallbackFunctions.calculateMean(testData), null, 1000);
    
    // Тест сортировки
    const wasmSortTime = this.benchmarkFunction(() => this.quickSort([...testData]), null, 100);
    const jsSortTime = this.benchmarkFunction(() => [...testData].sort((a, b) => a - b), null, 100);
    
    const results = {
      math: {
        wasm: wasmSqrtTime,
        js: jsSqrtTime,
        improvement: ((jsSqrtTime - wasmSqrtTime) / jsSqrtTime * 100).toFixed(2)
      },
      statistics: {
        wasm: wasmMeanTime,
        js: jsMeanTime,
        improvement: ((jsMeanTime - wasmMeanTime) / jsMeanTime * 100).toFixed(2)
      },
      sorting: {
        wasm: wasmSortTime,
        js: jsSortTime,
        improvement: ((jsSortTime - wasmSortTime) / jsSortTime * 100).toFixed(2)
      }
    };
    
    console.log('Benchmark results:', results);
    return results;
  }

  /**
   * Получение статуса
   */
  getStatus() {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      fallbackMode: this.fallbackMode,
      moduleAvailable: !!this.wasmModule
    };
  }

  /**
   * Принудительная перезагрузка модуля
   */
  async reload() {
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    
    try {
      await this.loadWASMModule();
      this.isLoaded = true;
      this.fallbackMode = false;
      console.log('WASM module reloaded successfully');
    } catch (error) {
      console.error('Failed to reload WASM module:', error);
      this.fallbackMode = true;
    }
  }
}

// Создаем глобальный экземпляр
const wasmCalculator = new WASMCalculator();

export default wasmCalculator; 