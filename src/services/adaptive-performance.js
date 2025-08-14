/**
 * Сервис адаптивной производительности
 * Автоматическая настройка под устройство и условия
 */

class AdaptivePerformance {
  constructor() {
    this.deviceProfile = null;
    this.performanceProfile = null;
    this.adaptiveSettings = {};
    this.observers = new Set();
    this.metrics = {
      fps: 0,
      memoryUsage: 0,
      batteryLevel: 1,
      networkSpeed: 'fast',
      cpuUsage: 0
    };
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  async init() {
    await this.detectDeviceProfile();
    await this.detectPerformanceProfile();
    this.setupAdaptiveSettings();
    this.startMonitoring();
    this.setupEventListeners();
  }

  /**
   * Определение профиля устройства
   */
  async detectDeviceProfile() {
    const userAgent = navigator.userAgent;
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = navigator.deviceMemory || 1;
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    
    // Определение типа устройства
    let deviceType = 'desktop';
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Определение производительности устройства
    let performanceTier = 'low';
    if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
      performanceTier = 'high';
    } else if (hardwareConcurrency >= 4 && deviceMemory >= 4) {
      performanceTier = 'medium';
    }

    // Определение возможностей устройства
    const capabilities = {
      webgl: this.checkWebGLSupport(),
      webgl2: this.checkWebGL2Support(),
      webassembly: this.checkWebAssemblySupport(),
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      cache: 'caches' in window,
      indexedDB: 'indexedDB' in window,
      webWorkers: 'Worker' in window,
      sharedWorkers: 'SharedWorker' in window,
      webRTC: 'RTCPeerConnection' in window,
      webAudio: 'AudioContext' in window,
      webVR: 'VRDisplay' in window,
      webXR: 'xr' in navigator
    };

    this.deviceProfile = {
      type: deviceType,
      performanceTier,
      hardwareConcurrency,
      deviceMemory,
      maxTouchPoints,
      capabilities,
      userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio || 1,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    console.log('Device profile detected:', this.deviceProfile);
  }

  /**
   * Определение профиля производительности
   */
  async detectPerformanceProfile() {
    // Тест производительности JavaScript
    const jsPerformance = await this.measureJSPerformance();
    
    // Тест производительности Canvas
    const canvasPerformance = await this.measureCanvasPerformance();
    
    // Тест производительности WebGL
    const webglPerformance = await this.measureWebGLPerformance();
    
    // Тест производительности памяти
    const memoryPerformance = await this.measureMemoryPerformance();

    this.performanceProfile = {
      js: jsPerformance,
      canvas: canvasPerformance,
      webgl: webglPerformance,
      memory: memoryPerformance,
      overall: this.calculateOverallPerformance(jsPerformance, canvasPerformance, webglPerformance, memoryPerformance)
    };

    console.log('Performance profile detected:', this.performanceProfile);
  }

  /**
   * Тест производительности JavaScript
   */
  async measureJSPerformance() {
    const iterations = 1000000;
    const startTime = performance.now();
    
    // Простые математические операции
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Нормализуем результат (меньше = лучше)
    const normalizedScore = Math.max(0, 100 - (duration / 10));
    
    return {
      score: Math.round(normalizedScore),
      duration,
      iterations,
      result
    };
  }

  /**
   * Тест производительности Canvas
   */
  async measureCanvasPerformance() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return { score: 0, error: 'Canvas not supported' };
    }

    canvas.width = 1000;
    canvas.height = 1000;
    
    const startTime = performance.now();
    
    // Рисуем сложную графику
    for (let i = 0; i < 1000; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 50,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
      ctx.fill();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const normalizedScore = Math.max(0, 100 - (duration / 20));
    
    return {
      score: Math.round(normalizedScore),
      duration,
      operations: 1000
    };
  }

  /**
   * Тест производительности WebGL
   */
  async measureWebGLPerformance() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return { score: 0, error: 'WebGL not supported' };
    }

    canvas.width = 512;
    canvas.height = 512;
    
    const startTime = performance.now();
    
    // Создаем простую геометрию
    const vertices = new Float32Array([
      -1, -1, 0,
       1, -1, 0,
       0,  1, 0
    ]);
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    // Рендерим несколько раз
    for (let i = 0; i < 100; i++) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const normalizedScore = Math.max(0, 100 - (duration / 5));
    
    return {
      score: Math.round(normalizedScore),
      duration,
      frames: 100
    };
  }

  /**
   * Тест производительности памяти
   */
  async measureMemoryPerformance() {
    if (!performance.memory) {
      return { score: 50, error: 'Memory API not supported' };
    }

    const memory = performance.memory;
    const usedMemory = memory.usedJSHeapSize;
    const totalMemory = memory.totalJSHeapSize;
    const memoryLimit = memory.jsHeapSizeLimit;
    
    // Оценка эффективности использования памяти
    const memoryEfficiency = (totalMemory - usedMemory) / totalMemory;
    const score = Math.round(memoryEfficiency * 100);
    
    return {
      score,
      usedMemory,
      totalMemory,
      memoryLimit,
      efficiency: memoryEfficiency
    };
  }

  /**
   * Расчет общей производительности
   */
  calculateOverallPerformance(js, canvas, webgl, memory) {
    const weights = {
      js: 0.3,
      canvas: 0.25,
      webgl: 0.25,
      memory: 0.2
    };
    
    const overallScore = (
      js.score * weights.js +
      canvas.score * weights.canvas +
      webgl.score * weights.webgl +
      memory.score * weights.memory
    );
    
    let tier = 'low';
    if (overallScore >= 80) tier = 'high';
    else if (overallScore >= 50) tier = 'medium';
    
    return {
      score: Math.round(overallScore),
      tier,
      weights
    };
  }

  /**
   * Настройка адаптивных параметров
   */
  setupAdaptiveSettings() {
    const { performanceTier } = this.deviceProfile;
    const { overall } = this.performanceProfile;
    
    // Базовые настройки по умолчанию
    this.adaptiveSettings = {
      // Рендеринг
      renderQuality: 'high',
      maxFPS: 60,
      enableVSync: true,
      enableAntiAliasing: true,
      
      // Кэширование
      cacheStrategy: 'aggressive',
      cacheSize: 'large',
      cacheTTL: 300000, // 5 минут
      
      // Загрузка
      preloadStrategy: 'aggressive',
      lazyLoadThreshold: 100,
      batchSize: 50,
      
      // Анимации
      enableAnimations: true,
      animationDuration: 300,
      enableTransitions: true,
      
      // Сетевые запросы
      requestTimeout: 10000,
      retryAttempts: 3,
      enableCompression: true,
      
      // Память
      memoryLimit: 100 * 1024 * 1024, // 100MB
      enableGarbageCollection: true,
      memoryCleanupInterval: 30000
    };

    // Адаптация под производительность устройства
    if (performanceTier === 'low' || overall.tier === 'low') {
      this.adaptiveSettings = {
        ...this.adaptiveSettings,
        renderQuality: 'low',
        maxFPS: 30,
        enableVSync: false,
        enableAntiAliasing: false,
        cacheStrategy: 'conservative',
        cacheSize: 'small',
        preloadStrategy: 'conservative',
        batchSize: 20,
        enableAnimations: false,
        enableTransitions: false,
        memoryLimit: 50 * 1024 * 1024 // 50MB
      };
    } else if (performanceTier === 'medium' || overall.tier === 'medium') {
      this.adaptiveSettings = {
        ...this.adaptiveSettings,
        renderQuality: 'medium',
        maxFPS: 45,
        enableAntiAliasing: false,
        cacheStrategy: 'balanced',
        cacheSize: 'medium',
        preloadStrategy: 'balanced',
        batchSize: 35,
        animationDuration: 400,
        memoryLimit: 75 * 1024 * 1024 // 75MB
      };
    }

    // Адаптация под тип устройства
    if (this.deviceProfile.type === 'mobile') {
      this.adaptiveSettings = {
        ...this.adaptiveSettings,
        maxFPS: Math.min(this.adaptiveSettings.maxFPS, 60),
        enableVSync: false,
        cacheSize: 'small',
        preloadStrategy: 'conservative',
        batchSize: Math.min(this.adaptiveSettings.batchSize, 30),
        animationDuration: 250,
        memoryLimit: Math.min(this.adaptiveSettings.memoryLimit, 50 * 1024 * 1024)
      };
    }

    console.log('Adaptive settings configured:', this.adaptiveSettings);
  }

  /**
   * Мониторинг производительности
   */
  startMonitoring() {
    // Мониторинг FPS
    this.monitorFPS();
    
    // Мониторинг памяти
    this.monitorMemory();
    
    // Мониторинг батареи
    this.monitorBattery();
    
    // Мониторинг сети
    this.monitorNetwork();
    
    // Мониторинг CPU
    this.monitorCPU();
  }

  /**
   * Мониторинг FPS
   */
  monitorFPS() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        
        // Адаптация на основе FPS
        this.adaptToFPS();
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Адаптация на основе FPS
   */
  adaptToFPS() {
    const { fps } = this.metrics;
    const { maxFPS } = this.adaptiveSettings;
    
    if (fps < maxFPS * 0.8) {
      // Снижаем качество рендеринга
      this.adaptiveSettings.renderQuality = 'low';
      this.adaptiveSettings.enableAntiAliasing = false;
      this.adaptiveSettings.maxFPS = Math.max(30, fps + 10);
      
      console.log('Performance degraded, reducing quality');
      this.notifyObservers('performance-degraded', { fps, maxFPS });
    } else if (fps >= maxFPS * 0.95) {
      // Повышаем качество рендеринга
      if (this.deviceProfile.performanceTier !== 'low') {
        this.adaptiveSettings.renderQuality = 'medium';
        this.adaptiveSettings.enableAntiAliasing = true;
        this.adaptiveSettings.maxFPS = Math.min(60, maxFPS + 5);
        
        console.log('Performance improved, increasing quality');
        this.notifyObservers('performance-improved', { fps, maxFPS });
      }
    }
  }

  /**
   * Мониторинг памяти
   */
  monitorMemory() {
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
        
        // Проверяем лимит памяти
        if (memory.usedJSHeapSize > this.adaptiveSettings.memoryLimit) {
          this.triggerMemoryCleanup();
        }
      }, 5000);
    }
  }

  /**
   * Очистка памяти
   */
  triggerMemoryCleanup() {
    console.log('Memory limit exceeded, triggering cleanup');
    
    // Очищаем кэш
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name !== 'static-v1') {
            caches.delete(name);
          }
        });
      });
    }
    
    // Принудительная сборка мусора
    if (window.gc) {
      window.gc();
    }
    
    this.notifyObservers('memory-cleanup', { memoryUsage: this.metrics.memoryUsage });
  }

  /**
   * Мониторинг батареи
   */
  monitorBattery() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        this.metrics.batteryLevel = battery.level;
        
        battery.addEventListener('levelchange', () => {
          this.metrics.batteryLevel = battery.level;
          
          // Адаптация под уровень батареи
          if (battery.level < 0.2) {
            this.adaptiveSettings.enableAnimations = false;
            this.adaptiveSettings.preloadStrategy = 'conservative';
            this.adaptiveSettings.cacheStrategy = 'conservative';
          }
        });
      });
    }
  }

  /**
   * Мониторинг сети
   */
  monitorNetwork() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      this.metrics.networkSpeed = connection.effectiveType || 'fast';
      
      connection.addEventListener('change', () => {
        this.metrics.networkSpeed = connection.effectiveType || 'fast';
        
        // Адаптация под скорость сети
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.adaptiveSettings.preloadStrategy = 'conservative';
          this.adaptiveSettings.cacheStrategy = 'aggressive';
          this.adaptiveSettings.enableCompression = true;
        }
      });
    }
  }

  /**
   * Мониторинг CPU
   */
  monitorCPU() {
    // Простая оценка загрузки CPU
    let lastTime = performance.now();
    let idleTime = 0;
    
    const measureCPU = () => {
      const currentTime = performance.now();
      const timeDiff = currentTime - lastTime;
      
      // Если прошло больше времени, чем ожидалось, считаем CPU свободным
      if (timeDiff > 16.67) { // 60 FPS = 16.67ms
        idleTime += timeDiff - 16.67;
      }
      
      const cpuUsage = Math.max(0, 100 - (idleTime / timeDiff) * 100);
      this.metrics.cpuUsage = Math.round(cpuUsage);
      
      lastTime = currentTime;
      idleTime = 0;
      
      setTimeout(measureCPU, 1000);
    };
    
    setTimeout(measureCPU, 1000);
  }

  /**
   * Настройка слушателей событий
   */
  setupEventListeners() {
    // Изменение размера окна
    window.addEventListener('resize', () => {
      this.deviceProfile.viewport.width = window.innerWidth;
      this.deviceProfile.viewport.height = window.innerHeight;
      this.adaptToViewport();
    });
    
    // Изменение ориентации
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.deviceProfile.viewport.width = window.innerWidth;
        this.deviceProfile.viewport.height = window.innerHeight;
        this.adaptToViewport();
      }, 100);
    });
    
    // Видимость страницы
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.adaptiveSettings.maxFPS = 10; // Снижаем FPS при скрытии
      } else {
        this.setupAdaptiveSettings(); // Восстанавливаем настройки
      }
    });
  }

  /**
   * Адаптация под размер viewport
   */
  adaptToViewport() {
    const { width, height } = this.deviceProfile.viewport;
    
    if (width < 768) {
      // Мобильное устройство
      this.adaptiveSettings.batchSize = Math.min(this.adaptiveSettings.batchSize, 20);
      this.adaptiveSettings.enableAnimations = false;
    } else if (width < 1024) {
      // Планшет
      this.adaptiveSettings.batchSize = Math.min(this.adaptiveSettings.batchSize, 35);
      this.adaptiveSettings.enableAnimations = true;
    } else {
      // Десктоп
      this.adaptiveSettings.batchSize = this.adaptiveSettings.batchSize;
      this.adaptiveSettings.enableAnimations = true;
    }
  }

  /**
   * Получение адаптивных настроек
   */
  getAdaptiveSettings() {
    return { ...this.adaptiveSettings };
  }

  /**
   * Получение профиля устройства
   */
  getDeviceProfile() {
    return { ...this.deviceProfile };
  }

  /**
   * Получение профиля производительности
   */
  getPerformanceProfile() {
    return { ...this.performanceProfile };
  }

  /**
   * Получение метрик
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Добавление наблюдателя
   */
  addObserver(observer) {
    this.observers.add(observer);
  }

  /**
   * Удаление наблюдателя
   */
  removeObserver(observer) {
    this.observers.delete(observer);
  }

  /**
   * Уведомление наблюдателей
   */
  notifyObservers(event, data) {
    this.observers.forEach(observer => {
      try {
        observer(event, data);
      } catch (error) {
        console.error('Error in adaptive performance observer:', error);
      }
    });
  }

  /**
   * Проверка поддержки WebGL
   */
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Проверка поддержки WebGL2
   */
  checkWebGL2Support() {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  /**
   * Проверка поддержки WebAssembly
   */
  checkWebAssemblySupport() {
    return typeof WebAssembly === 'object';
  }
}

// Создаем глобальный экземпляр
const adaptivePerformance = new AdaptivePerformance();

export default adaptivePerformance; 