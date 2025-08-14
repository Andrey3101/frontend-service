<template>
  <div class="threejs-chart">
    <!-- Панель управления -->
    <v-card class="control-panel" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-cube-outline</v-icon>
        3D Визуализация
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="resetCamera"
          :disabled="!isInitialized"
        >
          <v-icon>mdi-camera-reset</v-icon>
        </v-btn>
        <v-btn
          icon
          @click="toggleFullscreen"
        >
          <v-icon>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="chartType"
              label="Тип графика"
              :items="chartTypes"
              @change="updateChart"
            ></v-select>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              v-model="colorScheme"
              label="Цветовая схема"
              :items="colorSchemes"
              @change="updateColors"
            ></v-select>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-switch
              v-model="showGrid"
              label="Показать сетку"
              @change="toggleGrid"
            ></v-switch>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-switch
              v-model="showAxes"
              label="Показать оси"
              @change="toggleAxes"
            ></v-switch>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-switch
              v-model="enableAnimation"
              label="Анимация"
              @change="toggleAnimation"
            ></v-switch>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-switch
              v-model="enableInteraction"
              label="Интерактивность"
              @change="toggleInteraction"
            ></v-switch>
          </v-col>
        </v-row>
        
        <v-divider class="my-3"></v-divider>
        
        <v-row>
          <v-col cols="12" md="4">
            <v-slider
              v-model="cameraDistance"
              label="Расстояние камеры"
              min="5"
              max="50"
              step="1"
              thumb-label
              @change="updateCamera"
            ></v-slider>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-slider
              v-model="rotationSpeed"
              label="Скорость вращения"
              min="0"
              max="0.02"
              step="0.001"
              thumb-label
              @change="updateRotation"
            ></v-slider>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-slider
              v-model="pointSize"
              label="Размер точек"
              min="1"
              max="10"
              step="0.5"
              thumb-label
              @change="updatePointSize"
            ></v-slider>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Контейнер для 3D сцены -->
    <div 
      ref="chartContainer" 
      class="chart-container"
      :class="{ 'fullscreen': isFullscreen }"
    >
      <!-- Индикатор загрузки -->
      <div v-if="!isInitialized" class="loading-overlay">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="mt-3">Инициализация 3D сцены...</p>
      </div>
      
      <!-- Информационная панель -->
      <div v-if="hoveredPoint" class="info-panel">
        <v-card class="info-card" elevation="8">
          <v-card-text>
            <h4>{{ hoveredPoint.label }}</h4>
            <p><strong>X:</strong> {{ hoveredPoint.x.toFixed(2) }}</p>
            <p><strong>Y:</strong> {{ hoveredPoint.y.toFixed(2) }}</p>
            <p><strong>Z:</strong> {{ hoveredPoint.z.toFixed(2) }}</p>
            <p v-if="hoveredPoint.value"><strong>Значение:</strong> {{ hoveredPoint.value }}</p>
          </v-card-text>
        </v-card>
      </div>
      
      <!-- Статистика производительности -->
      <div v-if="showStats" class="stats-panel">
        <v-card class="stats-card" elevation="4">
          <v-card-text>
            <p><strong>FPS:</strong> {{ Math.round(fps) }}</p>
            <p><strong>Треугольники:</strong> {{ renderInfo.triangles }}</p>
            <p><strong>Точки:</strong> {{ renderInfo.points }}</p>
            <p><strong>Линии:</strong> {{ renderInfo.lines }}</p>
          </v-card-text>
        </v-card>
      </div>
    </div>
    
    <!-- Панель экспорта -->
    <v-card class="export-panel mt-4" elevation="2">
      <v-card-title>
        <v-icon class="mr-2" color="secondary">mdi-download</v-icon>
        Экспорт
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-btn
              block
              color="primary"
              @click="exportScreenshot"
              :disabled="!isInitialized"
            >
              <v-icon left>mdi-camera</v-icon>
              Снимок экрана
            </v-btn>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-btn
              block
              color="secondary"
              @click="exportModel"
              :disabled="!isInitialized"
            >
              <v-icon left>mdi-cube-scan</v-icon>
              Экспорт модели
            </v-btn>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-btn
              block
              color="success"
              @click="exportData"
              :disabled="!isInitialized"
            >
              <v-icon left>mdi-database-export</v-icon>
              Экспорт данных
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

export default {
  name: 'ThreeJSChart',
  
  props: {
    data: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({
        width: 800,
        height: 600,
        backgroundColor: 0x000000,
        showStats: false
      })
    }
  },
  
  emits: ['point-click', 'chart-update'],
  
  setup(props, { emit }) {
    // Состояние компонента
    const chartContainer = ref(null);
    const isInitialized = ref(false);
    const isFullscreen = ref(false);
    const showStats = ref(false);
    const hoveredPoint = ref(null);
    
    // Настройки графика
    const chartType = ref('scatter3d');
    const colorScheme = ref('viridis');
    const showGrid = ref(true);
    const showAxes = ref(true);
    const enableAnimation = ref(true);
    const enableInteraction = ref(true);
    const cameraDistance = ref(20);
    const rotationSpeed = ref(0.005);
    const pointSize = ref(3);
    
    // Three.js объекты
    let scene, camera, renderer, controls;
    let chartGroup, gridHelper, axesHelper;
    let animationId, statsId;
    let fps = 60;
    let lastTime = 0;
    
    // Данные для рендеринга
    const renderInfo = reactive({
      triangles: 0,
      points: 0,
      lines: 0
    });
    
    // Опции для селекторов
    const chartTypes = [
      { text: '3D Scatter Plot', value: 'scatter3d' },
      { text: '3D Bar Chart', value: 'bar3d' },
      { text: '3D Surface', value: 'surface3d' },
      { text: '3D Line Chart', value: 'line3d' },
      { text: '3D Heatmap', value: 'heatmap3d' }
    ];
    
    const colorSchemes = [
      { text: 'Viridis', value: 'viridis' },
      { text: 'Plasma', value: 'plasma' },
      { text: 'Inferno', value: 'inferno' },
      { text: 'Rainbow', value: 'rainbow' },
      { text: 'Custom', value: 'custom' }
    ];
    
    // Инициализация Three.js сцены
    const initScene = () => {
      if (!chartContainer.value) return;
      
      const container = chartContainer.value;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Создание сцены
      scene = new THREE.Scene();
      scene.background = new THREE.Color(props.config.backgroundColor || 0x000000);
      
      // Создание камеры
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(20, 20, 20);
      camera.lookAt(0, 0, 0);
      
      // Создание рендерера
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Добавление рендерера в контейнер
      container.appendChild(renderer.domElement);
      
      // Создание контролов
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
      
      // Создание группы для графика
      chartGroup = new THREE.Group();
      scene.add(chartGroup);
      
      // Создание сетки
      if (showGrid.value) {
        createGrid();
      }
      
      // Создание осей
      if (showAxes.value) {
        createAxes();
      }
      
      // Создание освещения
      createLighting();
      
      // Обработчики событий
      setupEventListeners();
      
      // Запуск анимации
      if (enableAnimation.value) {
        startAnimation();
      }
      
      isInitialized.value = true;
      emit('chart-update', { type: 'initialized', scene, camera, renderer });
    };
    
    // Создание сетки
    const createGrid = () => {
      if (gridHelper) {
        scene.remove(gridHelper);
      }
      
      gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x888888);
      scene.add(gridHelper);
    };
    
    // Создание осей
    const createAxes = () => {
      if (axesHelper) {
        scene.remove(axesHelper);
      }
      
      axesHelper = new THREE.AxesHelper(10);
      scene.add(axesHelper);
    };
    
    // Создание освещения
    const createLighting = () => {
      // Основное освещение
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);
      
      // Направленное освещение
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);
      
      // Точечное освещение
      const pointLight = new THREE.PointLight(0xffffff, 0.5);
      pointLight.position.set(-10, -10, -5);
      scene.add(pointLight);
    };
    
    // Создание графика
    const createChart = () => {
      if (!chartGroup) return;
      
      // Очистка предыдущего графика
      chartGroup.clear();
      
      if (props.data.length === 0) return;
      
      switch (chartType.value) {
        case 'scatter3d':
          createScatterPlot();
          break;
        case 'bar3d':
          createBarChart();
          break;
        case 'surface3d':
          createSurfaceChart();
          break;
        case 'line3d':
          createLineChart();
          break;
        case 'heatmap3d':
          createHeatmap();
          break;
      }
      
      emit('chart-update', { type: 'chart-created', chartType: chartType.value });
    };
    
    // Создание 3D scatter plot
    const createScatterPlot = () => {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];
      const sizes = [];
      
      props.data.forEach((point, index) => {
        positions.push(point.x || 0, point.y || 0, point.z || 0);
        
        // Цвета на основе цветовой схемы
        const color = getColorByScheme(index, props.data.length);
        colors.push(color.r, color.g, color.b);
        
        // Размер точек
        sizes.push(pointSize.value);
      });
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
      
      const material = new THREE.PointsMaterial({
        size: pointSize.value,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      });
      
      const points = new THREE.Points(geometry, material);
      chartGroup.add(points);
      
      // Сохранение ссылки на данные для взаимодействия
      points.userData = { originalData: props.data };
    };
    
    // Создание 3D bar chart
    const createBarChart = () => {
      props.data.forEach((bar, index) => {
        const geometry = new THREE.BoxGeometry(0.8, bar.y || 1, 0.8);
        const material = new THREE.MeshLambertMaterial({
          color: getColorByScheme(index, props.data.length).getHex()
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(bar.x || index * 2, (bar.y || 1) / 2, bar.z || 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        chartGroup.add(mesh);
      });
    };
    
    // Создание 3D surface chart
    const createSurfaceChart = () => {
      if (props.data.length < 4) return;
      
      const rows = Math.sqrt(props.data.length);
      const cols = rows;
      
      const geometry = new THREE.PlaneGeometry(20, 20, rows - 1, cols - 1);
      const positions = geometry.attributes.position.array;
      
      // Применение высоты к вершинам
      for (let i = 0; i < positions.length; i += 3) {
        const vertexIndex = Math.floor(i / 3);
        const row = Math.floor(vertexIndex / cols);
        const col = vertexIndex % cols;
        const dataIndex = row * cols + col;
        
        if (dataIndex < props.data.length) {
          positions[i + 2] = props.data[dataIndex].y || 0;
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      
      const material = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        wireframe: false,
        transparent: true,
        opacity: 0.7
      });
      
      const surface = new THREE.Mesh(geometry, material);
      surface.rotation.x = -Math.PI / 2;
      surface.receiveShadow = true;
      
      chartGroup.add(surface);
    };
    
    // Создание 3D line chart
    const createLineChart = () => {
      if (props.data.length < 2) return;
      
      const points = [];
      props.data.forEach(point => {
        points.push(new THREE.Vector3(point.x || 0, point.y || 0, point.z || 0));
      });
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      
      const line = new THREE.Line(geometry, material);
      chartGroup.add(line);
    };
    
    // Создание 3D heatmap
    const createHeatmap = () => {
      if (props.data.length < 4) return;
      
      const rows = Math.sqrt(props.data.length);
      const cols = rows;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const dataIndex = row * cols + col;
          if (dataIndex < props.data.length) {
            const point = props.data[dataIndex];
            const intensity = (point.value || 0) / 100;
            
            const geometry = new THREE.PlaneGeometry(1.8, 1.8);
            const material = new THREE.MeshBasicMaterial({
              color: getHeatmapColor(intensity),
              transparent: true,
              opacity: 0.8
            });
            
            const tile = new THREE.Mesh(geometry, material);
            tile.position.set(col * 2 - cols + 1, 0, row * 2 - rows + 1);
            tile.rotation.x = -Math.PI / 2;
            
            chartGroup.add(tile);
          }
        }
      }
    };
    
    // Получение цвета по схеме
    const getColorByScheme = (index, total) => {
      const ratio = index / total;
      
      switch (colorScheme.value) {
        case 'viridis':
          return new THREE.Color().setHSL(0.3 + ratio * 0.4, 0.8, 0.5);
        case 'plasma':
          return new THREE.Color().setHSL(0.1 + ratio * 0.8, 0.8, 0.5);
        case 'inferno':
          return new THREE.Color().setHSL(0.0 + ratio * 0.3, 0.8, 0.5);
        case 'rainbow':
          return new THREE.Color().setHSL(ratio, 0.8, 0.5);
        case 'custom':
          return new THREE.Color(0x00ff00 + index * 0x001100);
        default:
          return new THREE.Color(0x00ff00);
      }
    };
    
    // Получение цвета для heatmap
    const getHeatmapColor = (intensity) => {
      if (intensity < 0.5) {
        return new THREE.Color().lerpColors(
          new THREE.Color(0x0000ff), // Синий
          new THREE.Color(0x00ffff), // Голубой
          intensity * 2
        );
      } else {
        return new THREE.Color().lerpColors(
          new THREE.Color(0x00ffff), // Голубой
          new THREE.Color(0xff0000), // Красный
          (intensity - 0.5) * 2
        );
      }
    };
    
    // Настройка обработчиков событий
    const setupEventListeners = () => {
      if (!renderer || !chartContainer.value) return;
      
      const container = chartContainer.value;
      
      // Обработка кликов
      container.addEventListener('click', onContainerClick);
      
      // Обработка наведения
      container.addEventListener('mousemove', onContainerMouseMove);
      
      // Обработка изменения размера
      window.addEventListener('resize', onWindowResize);
      
      // Обработка клавиатуры
      window.addEventListener('keydown', onKeyDown);
    };
    
    // Обработка клика по контейнеру
    const onContainerClick = (event) => {
      if (!enableInteraction.value || !camera || !renderer) return;
      
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(chartGroup.children, true);
      
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const pointData = intersect.object.userData?.originalData?.[intersect.index];
        
        if (pointData) {
          emit('point-click', pointData);
        }
      }
    };
    
    // Обработка наведения мыши
    const onContainerMouseMove = (event) => {
      if (!enableInteraction.value || !camera || !renderer) return;
      
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(chartGroup.children, true);
      
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const pointData = intersect.object.userData?.originalData?.[intersect.index];
        
        if (pointData) {
          hoveredPoint.value = {
            ...pointData,
            x: intersect.point.x,
            y: intersect.point.y,
            z: intersect.point.z
          };
        }
      } else {
        hoveredPoint.value = null;
      }
    };
    
    // Обработка изменения размера окна
    const onWindowResize = () => {
      if (!camera || !renderer || !chartContainer.value) return;
      
      const container = chartContainer.value;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };
    
    // Обработка нажатий клавиш
    const onKeyDown = (event) => {
      switch (event.key) {
        case 'r':
        case 'R':
          resetCamera();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 's':
        case 'S':
          if (event.ctrlKey) {
            event.preventDefault();
            exportScreenshot();
          }
          break;
      }
    };
    
    // Запуск анимации
    const startAnimation = () => {
      if (animationId) return;
      
      const animate = (time) => {
        animationId = requestAnimationFrame(animate);
        
        // Обновление FPS
        if (lastTime !== 0) {
          fps = 1000 / (time - lastTime);
        }
        lastTime = time;
        
        // Вращение графика
        if (rotationSpeed.value > 0 && chartGroup) {
          chartGroup.rotation.y += rotationSpeed.value;
        }
        
        // Обновление контролов
        if (controls) {
          controls.update();
        }
        
        // Рендеринг сцены
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
          
          // Обновление статистики
          if (showStats.value) {
            renderInfo.triangles = renderer.info.render.triangles;
            renderInfo.points = renderer.info.render.points;
            renderInfo.lines = renderer.info.render.lines;
          }
        }
      };
      
      animate();
    };
    
    // Остановка анимации
    const stopAnimation = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };
    
    // Сброс камеры
    const resetCamera = () => {
      if (!camera || !controls) return;
      
      camera.position.set(20, 20, 20);
      camera.lookAt(0, 0, 0);
      controls.reset();
    };
    
    // Переключение полноэкранного режима
    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value;
      
      if (isFullscreen.value) {
        chartContainer.value.requestFullscreen();
      } else if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    
    // Экспорт снимка экрана
    const exportScreenshot = () => {
      if (!renderer) return;
      
      renderer.render(scene, camera);
      const dataURL = renderer.domElement.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `3d-chart-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    };
    
    // Экспорт модели
    const exportModel = async () => {
      if (!scene) return;
      
      try {
        const exporter = new GLTFExporter();
        const result = await exporter.parseAsync(scene);
        
        const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `3d-chart-${Date.now()}.gltf`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to export model:', error);
      }
    };
    
    // Экспорт данных
    const exportData = () => {
      const dataStr = JSON.stringify(props.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `chart-data-${Date.now()}.json`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    };
    
    // Методы обновления
    const updateChart = () => {
      createChart();
    };
    
    const updateColors = () => {
      updateChart();
    };
    
    const toggleGrid = () => {
      if (showGrid.value) {
        createGrid();
      } else if (gridHelper) {
        scene.remove(gridHelper);
        gridHelper = null;
      }
    };
    
    const toggleAxes = () => {
      if (showAxes.value) {
        createAxes();
      } else if (axesHelper) {
        scene.remove(axesHelper);
        axesHelper = null;
      }
    };
    
    const toggleAnimation = () => {
      if (enableAnimation.value) {
        startAnimation();
      } else {
        stopAnimation();
      }
    };
    
    const toggleInteraction = () => {
      if (controls) {
        controls.enabled = enableInteraction.value;
      }
    };
    
    const updateCamera = () => {
      if (!camera) return;
      
      const distance = cameraDistance.value;
      const currentDistance = camera.position.length();
      const scale = distance / currentDistance;
      
      camera.position.multiplyScalar(scale);
      camera.updateMatrixWorld();
    };
    
    const updateRotation = () => {
      // Скорость вращения обновляется в анимации
    };
    
    const updatePointSize = () => {
      updateChart();
    };
    
    // Наблюдение за изменениями
    watch(() => props.data, () => {
      if (isInitialized.value) {
        createChart();
      }
    }, { deep: true });
    
    watch(() => props.config, () => {
      if (isInitialized.value) {
        // Обновление конфигурации
        if (props.config.backgroundColor !== undefined) {
          scene.background = new THREE.Color(props.config.backgroundColor);
        }
        
        if (props.config.showStats !== undefined) {
          showStats.value = props.config.showStats;
        }
      }
    }, { deep: true });
    
    // Жизненный цикл
    onMounted(async () => {
      await nextTick();
      initScene();
      createChart();
    });
    
    onUnmounted(() => {
      stopAnimation();
      
      if (renderer) {
        renderer.dispose();
      }
      
      if (chartContainer.value && renderer) {
        chartContainer.value.removeChild(renderer.domElement);
      }
      
      // Очистка обработчиков событий
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('keydown', onKeyDown);
    });
    
    return {
      chartContainer,
      isInitialized,
      isFullscreen,
      showStats,
      hoveredPoint,
      chartType,
      colorScheme,
      showGrid,
      showAxes,
      enableAnimation,
      enableInteraction,
      cameraDistance,
      rotationSpeed,
      pointSize,
      renderInfo,
      fps,
      chartTypes,
      colorSchemes,
      resetCamera,
      toggleFullscreen,
      exportScreenshot,
      exportModel,
      exportData,
      updateChart,
      updateColors,
      toggleGrid,
      toggleAxes,
      toggleAnimation,
      toggleInteraction,
      updateCamera,
      updateRotation,
      updatePointSize
    };
  }
};
</script>

<style scoped>
.threejs-chart {
  width: 100%;
  height: 100%;
}

.control-panel {
  margin-bottom: 16px;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 600px;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.chart-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 10;
}

.info-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 5;
}

.info-card {
  max-width: 250px;
  background-color: rgba(255, 255, 255, 0.95);
}

.stats-panel {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 5;
}

.stats-card {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
}

.export-panel {
  margin-top: 16px;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .chart-container {
    height: 400px;
  }
  
  .control-panel .v-card-text {
    padding: 12px;
  }
  
  .info-panel,
  .stats-panel {
    position: relative;
    margin: 8px;
  }
}

/* Анимации */
.chart-container {
  transition: all 0.3s ease;
}

.chart-container.fullscreen {
  transition: none;
}

/* Стили для Three.js canvas */
.chart-container canvas {
  display: block;
  outline: none;
}

/* Кастомные скроллбары */
.chart-container::-webkit-scrollbar {
  width: 8px;
}

.chart-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chart-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.chart-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style> 