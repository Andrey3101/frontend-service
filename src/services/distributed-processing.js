/**
 * Сервис распределенной обработки данных
 * Распределяет вычисления между клиентом, edge узлами и сервером
 */

class DistributedProcessing {
  constructor() {
    this.nodes = new Map();
    this.taskQueue = [];
    this.processingNodes = new Set();
    this.edgeNodes = new Map();
    this.serverEndpoints = new Map();
    this.loadBalancer = null;
    this.taskScheduler = null;
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    this.discoverNodes();
    this.setupLoadBalancer();
    this.setupTaskScheduler();
    this.startHealthMonitoring();
    this.setupWebWorkers();
  }

  /**
   * Обнаружение доступных узлов
   */
  discoverNodes() {
    // Локальный узел (клиент)
    this.nodes.set('local', {
      id: 'local',
      type: 'client',
      capabilities: ['cpu', 'memory', 'storage'],
      performance: this.measureLocalPerformance(),
      load: 0,
      health: 'healthy',
      lastSeen: Date.now()
    });

    // Edge узлы (если доступны)
    this.discoverEdgeNodes();

    // Серверные узлы
    this.discoverServerNodes();

    console.log('Discovered nodes:', Array.from(this.nodes.keys()));
  }

  /**
   * Измерение локальной производительности
   */
  measureLocalPerformance() {
    const performance = {
      cpu: navigator.hardwareConcurrency || 1,
      memory: navigator.deviceMemory || 1,
      storage: this.estimateStorageCapacity(),
      network: this.measureNetworkSpeed(),
      battery: this.getBatteryInfo()
    };

    // Бенчмарк производительности
    performance.benchmark = this.runLocalBenchmark();

    return performance;
  }

  /**
   * Оценка емкости хранилища
   */
  estimateStorageCapacity() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => ({
        quota: estimate.quota,
        usage: estimate.usage,
        available: estimate.quota - estimate.usage
      }));
    }
    
    // Fallback оценка
    return {
      quota: 50 * 1024 * 1024 * 1024, // 50GB
      usage: 0,
      available: 50 * 1024 * 1024 * 1024
    };
  }

  /**
   * Измерение скорости сети
   */
  measureNetworkSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      };
    }
    
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0
    };
  }

  /**
   * Получение информации о батарее
   */
  getBatteryInfo() {
    if ('getBattery' in navigator) {
      return navigator.getBattery().then(battery => ({
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      }));
    }
    
    return {
      level: 1,
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity
    };
  }

  /**
   * Локальный бенчмарк
   */
  runLocalBenchmark() {
    const startTime = performance.now();
    
    // Простые математические операции
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      mathScore: 1000000 / duration,
      duration,
      result
    };
  }

  /**
   * Обнаружение edge узлов
   */
  discoverEdgeNodes() {
    // Проверяем доступность edge узлов
    const edgeEndpoints = [
      '/edge/node1',
      '/edge/node2',
      '/edge/node3'
    ];

    edgeEndpoints.forEach(endpoint => {
      this.checkEdgeNode(endpoint);
    });
  }

  /**
   * Проверка edge узла
   */
  async checkEdgeNode(endpoint) {
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        const nodeInfo = await response.json();
        
        this.edgeNodes.set(endpoint, {
          id: endpoint,
          type: 'edge',
          capabilities: nodeInfo.capabilities || [],
          performance: nodeInfo.performance || {},
          load: nodeInfo.load || 0,
          health: 'healthy',
          lastSeen: Date.now(),
          endpoint: endpoint
        });

        this.nodes.set(endpoint, this.edgeNodes.get(endpoint));
      }
    } catch (error) {
      console.warn(`Edge node ${endpoint} not available:`, error);
    }
  }

  /**
   * Обнаружение серверных узлов
   */
  discoverServerNodes() {
    // Серверные endpoints
    const serverEndpoints = [
      '/api/compute/node1',
      '/api/compute/node2',
      '/api/compute/node3'
    ];

    serverEndpoints.forEach(endpoint => {
      this.checkServerNode(endpoint);
    });
  }

  /**
   * Проверка серверного узла
   */
  async checkServerNode(endpoint) {
    try {
      const response = await fetch(`${endpoint}/status`, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        const nodeInfo = await response.json();
        
        this.serverEndpoints.set(endpoint, {
          id: endpoint,
          type: 'server',
          capabilities: nodeInfo.capabilities || [],
          performance: nodeInfo.performance || {},
          load: nodeInfo.load || 0,
          health: 'healthy',
          lastSeen: Date.now(),
          endpoint: endpoint
        });

        this.nodes.set(endpoint, this.serverEndpoints.get(endpoint));
      }
    } catch (error) {
      console.warn(`Server node ${endpoint} not available:`, error);
    }
  }

  /**
   * Настройка балансировщика нагрузки
   */
  setupLoadBalancer() {
    this.loadBalancer = {
      strategy: 'least-loaded', // 'round-robin', 'least-loaded', 'performance-based'
      
      selectNode: (task) => {
        const availableNodes = Array.from(this.nodes.values())
          .filter(node => node.health === 'healthy' && this.canHandleTask(node, task));
        
        if (availableNodes.length === 0) {
          return null;
        }
        
        switch (this.loadBalancer.strategy) {
          case 'round-robin':
            return this.roundRobinSelection(availableNodes);
          case 'least-loaded':
            return this.leastLoadedSelection(availableNodes);
          case 'performance-based':
            return this.performanceBasedSelection(availableNodes, task);
          default:
            return availableNodes[0];
        }
      },
      
      updateNodeLoad: (nodeId, load) => {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.load = load;
          node.lastSeen = Date.now();
        }
      }
    };
  }

  /**
   * Проверка возможности обработки задачи
   */
  canHandleTask(node, task) {
    const { requirements } = task;
    
    // Проверяем требования к CPU
    if (requirements.cpu && node.performance.cpu < requirements.cpu) {
      return false;
    }
    
    // Проверяем требования к памяти
    if (requirements.memory && node.performance.memory < requirements.memory) {
      return false;
    }
    
    // Проверяем требования к хранилищу
    if (requirements.storage && node.performance.storage?.available < requirements.storage) {
      return false;
    }
    
    // Проверяем загрузку узла
    if (node.load > 0.9) { // 90% загрузки
      return false;
    }
    
    return true;
  }

  /**
   * Выбор узла по принципу round-robin
   */
  roundRobinSelection(nodes) {
    const index = this.loadBalancer.currentIndex || 0;
    this.loadBalancer.currentIndex = (index + 1) % nodes.length;
    return nodes[index];
  }

  /**
   * Выбор наименее загруженного узла
   */
  leastLoadedSelection(nodes) {
    return nodes.reduce((min, node) => 
      node.load < min.load ? node : min
    );
  }

  /**
   * Выбор узла на основе производительности
   */
  performanceBasedSelection(nodes, task) {
    return nodes.reduce((best, node) => {
      const score = this.calculateNodeScore(node, task);
      const bestScore = this.calculateNodeScore(best, task);
      return score > bestScore ? node : best;
    });
  }

  /**
   * Расчет оценки узла
   */
  calculateNodeScore(node, task) {
    let score = 0;
    
    // Базовый score на основе производительности
    if (node.performance.benchmark) {
      score += node.performance.benchmark.mathScore * 0.3;
    }
    
    // Score на основе доступных ресурсов
    score += (1 - node.load) * 0.4;
    
    // Score на основе типа узла
    const typeScore = {
      'client': 0.5,
      'edge': 0.8,
      'server': 1.0
    };
    score += (typeScore[node.type] || 0.5) * 0.3;
    
    return score;
  }

  /**
   * Настройка планировщика задач
   */
  setupTaskScheduler() {
    this.taskScheduler = {
      queue: [],
      running: new Set(),
      maxConcurrent: 5,
      
      addTask: (task) => {
        this.taskScheduler.queue.push(task);
        this.processQueue();
      },
      
      processQueue: () => {
        while (this.taskScheduler.queue.length > 0 && 
               this.taskScheduler.running.size < this.taskScheduler.maxConcurrent) {
          const task = this.taskScheduler.queue.shift();
          this.executeTask(task);
        }
      },
      
      executeTask: async (task) => {
        this.taskScheduler.running.add(task.id);
        
        try {
          const result = await this.distributeTask(task);
          task.resolve(result);
        } catch (error) {
          task.reject(error);
        } finally {
          this.taskScheduler.running.delete(task.id);
          this.taskScheduler.processQueue();
        }
      }
    };
  }

  /**
   * Распределение задачи
   */
  async distributeTask(task) {
    // Выбираем узел для выполнения
    const selectedNode = this.loadBalancer.selectNode(task);
    
    if (!selectedNode) {
      throw new Error('No available nodes for task execution');
    }
    
    // Обновляем загрузку узла
    this.loadBalancer.updateNodeLoad(selectedNode.id, selectedNode.load + 0.1);
    
    try {
      let result;
      
      switch (selectedNode.type) {
        case 'local':
          result = await this.executeLocally(task);
          break;
        case 'edge':
          result = await this.executeOnEdge(selectedNode, task);
          break;
        case 'server':
          result = await this.executeOnServer(selectedNode, task);
          break;
        default:
          throw new Error(`Unknown node type: ${selectedNode.type}`);
      }
      
      // Уменьшаем загрузку узла
      this.loadBalancer.updateNodeLoad(selectedNode.id, Math.max(0, selectedNode.load - 0.1));
      
      return result;
    } catch (error) {
      // Уменьшаем загрузку узла при ошибке
      this.loadBalancer.updateNodeLoad(selectedNode.id, Math.max(0, selectedNode.load - 0.1));
      throw error;
    }
  }

  /**
   * Выполнение задачи локально
   */
  async executeLocally(task) {
    const { type, data, params } = task;
    
    switch (type) {
      case 'math':
        return this.executeMathTask(data, params);
      case 'statistics':
        return this.executeStatisticsTask(data, params);
      case 'sorting':
        return this.executeSortingTask(data, params);
      case 'matrix':
        return this.executeMatrixTask(data, params);
      case 'crypto':
        return this.executeCryptoTask(data, params);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  /**
   * Выполнение математических задач
   */
  executeMathTask(data, params) {
    const { operation, values } = data;
    
    switch (operation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'product':
        return values.reduce((a, b) => a * b, 1);
      case 'average':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'power':
        return Math.pow(values[0], values[1]);
      case 'root':
        return Math.pow(values[0], 1 / values[1]);
      default:
        throw new Error(`Unknown math operation: ${operation}`);
    }
  }

  /**
   * Выполнение статистических задач
   */
  executeStatisticsTask(data, params) {
    const { operation, values } = data;
    
    switch (operation) {
      case 'mean':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'variance':
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      case 'std':
        const variance = this.executeStatisticsTask({ operation: 'variance', values }, params);
        return Math.sqrt(variance);
      case 'correlation':
        if (values.length !== 2 || values[0].length !== values[1].length) {
          throw new Error('Correlation requires two arrays of equal length');
        }
        return this.calculateCorrelation(values[0], values[1]);
      default:
        throw new Error(`Unknown statistics operation: ${operation}`);
    }
  }

  /**
   * Выполнение задач сортировки
   */
  executeSortingTask(data, params) {
    const { operation, values, order = 'asc' } = data;
    
    switch (operation) {
      case 'sort':
        const sorted = [...values].sort((a, b) => order === 'asc' ? a - b : b - a);
        return sorted;
      case 'unique':
        return [...new Set(values)];
      case 'top':
        const sortedValues = [...values].sort((a, b) => b - a);
        return sortedValues.slice(0, params.limit || 10);
      default:
        throw new Error(`Unknown sorting operation: ${operation}`);
    }
  }

  /**
   * Выполнение матричных задач
   */
  executeMatrixTask(data, params) {
    const { operation, matrix1, matrix2, size } = data;
    
    switch (operation) {
      case 'multiply':
        return this.matrixMultiply(matrix1, matrix2, size);
      case 'transpose':
        return this.matrixTranspose(matrix1, size);
      case 'determinant':
        return this.matrixDeterminant(matrix1, size);
      default:
        throw new Error(`Unknown matrix operation: ${operation}`);
    }
  }

  /**
   * Выполнение криптографических задач
   */
  executeCryptoTask(data, params) {
    const { operation, input } = data;
    
    switch (operation) {
      case 'hash':
        return this.simpleHash(input);
      case 'encrypt':
        return this.simpleEncrypt(input, params.key);
      case 'decrypt':
        return this.simpleDecrypt(input, params.key);
      default:
        throw new Error(`Unknown crypto operation: ${operation}`);
    }
  }

  /**
   * Выполнение задачи на edge узле
   */
  async executeOnEdge(node, task) {
    const response = await fetch(`${node.endpoint}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    });

    if (!response.ok) {
      throw new Error(`Edge node execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Выполнение задачи на сервере
   */
  async executeOnServer(node, task) {
    const response = await fetch(`${node.endpoint}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    });

    if (!response.ok) {
      throw new Error(`Server execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Создание и настройка Web Workers
   */
  setupWebWorkers() {
    this.workers = new Map();
    this.workerPool = [];
    this.maxWorkers = navigator.hardwareConcurrency || 4;
    
    // Создаем пул workers
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker(i);
    }
  }

  /**
   * Создание Web Worker
   */
  createWorker(id) {
    const workerCode = `
      self.onmessage = function(e) {
        const { taskId, type, data, params } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'math':
              result = executeMathTask(data, params);
              break;
            case 'statistics':
              result = executeStatisticsTask(data, params);
              break;
            case 'sorting':
              result = executeSortingTask(data, params);
              break;
            default:
              throw new Error('Unknown task type');
          }
          
          self.postMessage({ taskId, result, success: true });
        } catch (error) {
          self.postMessage({ taskId, error: error.message, success: false });
        }
      };
      
      function executeMathTask(data, params) {
        const { operation, values } = data;
        
        switch (operation) {
          case 'sum':
            return values.reduce((a, b) => a + b, 0);
          case 'product':
            return values.reduce((a, b) => a * b, 1);
          case 'average':
            return values.reduce((a, b) => a + b, 0) / values.length;
          default:
            throw new Error('Unknown math operation');
        }
      }
      
      function executeStatisticsTask(data, params) {
        const { operation, values } = data;
        
        switch (operation) {
          case 'mean':
            return values.reduce((a, b) => a + b, 0) / values.length;
          case 'variance':
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          default:
            throw new Error('Unknown statistics operation');
        }
      }
      
      function executeSortingTask(data, params) {
        const { operation, values, order = 'asc' } = data;
        
        switch (operation) {
          case 'sort':
            return [...values].sort((a, b) => order === 'asc' ? a - b : b - a);
          case 'unique':
            return [...new Set(values)];
          default:
            throw new Error('Unknown sorting operation');
        }
      }
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    worker.id = id;
    worker.busy = false;
    
    this.workers.set(id, worker);
    this.workerPool.push(worker);
    
    return worker;
  }

  /**
   * Выполнение задачи в Web Worker
   */
  async executeInWorker(task) {
    const availableWorker = this.workerPool.find(worker => !worker.busy);
    
    if (!availableWorker) {
      throw new Error('No available workers');
    }
    
    return new Promise((resolve, reject) => {
      availableWorker.busy = true;
      
      const messageHandler = (e) => {
        if (e.data.taskId === task.id) {
          availableWorker.removeEventListener('message', messageHandler);
          availableWorker.busy = false;
          
          if (e.data.success) {
            resolve(e.data.result);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };
      
      availableWorker.addEventListener('message', messageHandler);
      availableWorker.postMessage(task);
    });
  }

  /**
   * Мониторинг здоровья узлов
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.checkNodeHealth();
    }, 30000); // Каждые 30 секунд
  }

  /**
   * Проверка здоровья узлов
   */
  async checkNodeHealth() {
    const now = Date.now();
    
    for (const [nodeId, node] of this.nodes) {
      // Проверяем, не устарел ли узел
      if (now - node.lastSeen > 5 * 60 * 1000) { // 5 минут
        node.health = 'stale';
      }
      
      // Проверяем edge узлы
      if (node.type === 'edge') {
        await this.checkEdgeNode(node.endpoint);
      }
      
      // Проверяем серверные узлы
      if (node.type === 'server') {
        await this.checkServerNode(node.endpoint);
      }
    }
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      totalNodes: this.nodes.size,
      healthyNodes: Array.from(this.nodes.values()).filter(n => n.health === 'healthy').length,
      localNode: this.nodes.get('local'),
      edgeNodes: Array.from(this.edgeNodes.values()),
      serverNodes: Array.from(this.serverEndpoints.values()),
      taskQueue: this.taskScheduler.queue.length,
      runningTasks: this.taskScheduler.running.size,
      workers: this.workers.size,
      availableWorkers: this.workerPool.filter(w => !w.busy).length
    };
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    // Останавливаем workers
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    
    this.workers.clear();
    this.workerPool = [];
    
    // Очищаем узлы
    this.nodes.clear();
    this.edgeNodes.clear();
    this.serverEndpoints.clear();
  }
}

// Создаем глобальный экземпляр
const distributedProcessing = new DistributedProcessing();

export default distributedProcessing; 