<template>
  <div class="threejs-chart">
    <!-- Контролы для управления 3D сценой -->
    <div class="chart-controls" v-if="showControls">
      <v-card class="controls-panel" elevation="4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-cube-outline</v-icon>
          3D Контролы
          <v-spacer></v-spacer>
          <v-btn icon small @click="showControls = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <!-- Тип визуализации -->
          <v-select
            v-model="chartType"
            label="Тип визуализации"
            :items="chartTypes"
            @change="changeChartType"
            class="mb-3"
          ></v-select>
          
          <!-- Цветовая схема -->
          <v-select
            v-model="colorScheme"
            label="Цветовая схема"
            :items="colorSchemes"
            @change="changeColorScheme"
            class="mb-3"
          ></v-select>
          
          <!-- Анимация -->
          <v-switch
            v-model="enableAnimation"
            label="Включить анимацию"
            @change="toggleAnimation"
            class="mb-3"
          ></v-switch>
          
          <!-- Скорость анимации -->
          <v-slider
            v-model="animationSpeed"
            label="Скорость анимации"
            min="0.1"
            max="2.0"
            step="0.1"
            thumb-label
            @change="changeAnimationSpeed"
            :disabled="!enableAnimation"
            class="mb-3"
          ></v-slider>
          
          <!-- Камера -->
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-camera</v-icon>
                Настройки камеры
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-slider
                  v-model="cameraDistance"
                  label="Расстояние камеры"
                  min="5"
                  max="50"
                  step="1"
                  thumb-label
                  @change="changeCameraDistance"
                ></v-slider>
                
                <v-slider
                  v-model="cameraRotationX"
                  label="Поворот X"
                  min="-180"
                  max="180"
                  step="5"
                  thumb-label
                  @change="changeCameraRotation"
                ></v-slider>
                
                <v-slider
                  v-model="cameraRotationY"
                  label="Поворот Y"
                  min="-180"
                  max="180"
                  step="5"
                  thumb-label
                  @change="changeCameraRotation"
                ></v-slider>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          
          <!-- Экспорт -->
          <v-divider class="my-3"></v-divider>
          
          <v-btn
            block
            color="primary"
            @click="exportScene"
            class="mb-2"
          >
            <v-icon left>mdi-download</v-icon>
            Экспорт сцены
          </v-btn>
          
          <v-btn
            block
            color="secondary"
            @click="screenshot"
          >
            <v-icon left>mdi-camera</v-icon>
            Снимок экрана
          </v-btn>
        </v-card-text>
      </v-card>
    </div>

    <!-- Кнопка показа/скрытия контролов -->
    <v-btn
      icon
      class="controls-toggle"
      @click="showControls = !showControls"
      color="primary"
    >
      <v-icon>{{ showControls ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
    </v-btn>

    <!-- Контейнер для 3D сцены -->
    <div
      ref="chartContainer"
      class="chart-container"
      :style="{ height: height + 'px' }"
    ></div>

    <!-- Информационная панель -->
    <div class="info-panel" v-if="hoveredData">
      <v-card class="info-card" elevation="4">
        <v-card-text>
          <div class="info-item">
            <strong>Значение:</strong> {{ hoveredData.value }}
          </div>
          <div class="info-item">
            <strong>Категория:</strong> {{ hoveredData.category }}
          </div>
          <div class="info-item">
            <strong>Период:</strong> {{ hoveredData.period }}
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Загрузчик -->
    <div v-if="loading" class="loading-overlay">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <div class="loading-text">Загрузка 3D сцены...</div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export default {
  name: 'ThreeJSChart',
  
  props: {
    data: {
      type: Array,
      required: true
    },
    type: {
      type: String,
      default: 'bar3d'
    },
    height: {
      type: Number,
      default: 400
    },
    width: {
      type: Number,
      default: 600
    },
    colors: {
      type: Array,
      default: () => ['#1976d2', '#42a5f5', '#90caf9', '#e3f2fd']
    },
    animate: {
      type: Boolean,
      default: true
    }
  },
  
  setup(props, { emit }) {
    // Состояние компонента
    const chartContainer = ref(null);
    const showControls = ref(true);
    const loading = ref(true);
    const hoveredData = ref(null);
    
    // Настройки 3D сцены
    const settings = reactive({
      chartType: props.type,
      colorScheme: 'default',
      enableAnimation: props.animate,
      animationSpeed: 1.0,
      cameraDistance: 15,
      cameraRotationX: 0,
      cameraRotationY: 0
    });
    
    // Three.js объекты
    let scene, camera, renderer, controls;
    let chartGroup, animationMixer;
    let raycaster, mouse;
    let animationId;
    
    // Типы визуализации
    const chartTypes = [
      { text: '3D Столбчатая диаграмма', value: 'bar3d' },
      { text: '3D Линейная диаграмма', value: 'line3d' },
      { text: '3D Точечная диаграмма', value: 'scatter3d' },
      { text: '3D Поверхность', value: 'surface3d' },
      { text: '3D Сфера данных', value: 'sphere3d' }
    ];
    
    // Цветовые схемы
    const colorSchemes = [
      { text: 'По умолчанию', value: 'default' },
      { text: 'Теплая', value: 'warm' },
      { text: 'Холодная', value: 'cool' },
      { text: 'Радужная', value: 'rainbow' },
      { text: 'Монохромная', value: 'monochrome' }
    ];
    
    // Инициализация Three.js сцены
    const initScene = () => {
      // Создание сцены
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);
      
      // Создание камеры
      camera = new THREE.PerspectiveCamera(
        75,
        props.width / props.height,
        0.1,
        1000
      );
      camera.position.set(0, 0, settings.cameraDistance);
      
      // Создание рендерера
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(props.width, props.height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Добавление рендерера в DOM
      if (chartContainer.value) {
        chartContainer.value.appendChild(renderer.domElement);
      }
      
      // Создание контролов камеры
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      // Настройка освещения
      setupLighting();
      
      // Создание группы для графика
      chartGroup = new THREE.Group();
      scene.add(chartGroup);
      
      // Настройка Raycaster для взаимодействия
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      // Обработчики событий
      setupEventListeners();
      
      // Создание графика
      createChart();
      
      // Запуск анимации
      if (settings.enableAnimation) {
        animate();
      }
      
      loading.value = false;
    };
    
    // Настройка освещения
    const setupLighting = () => {
      // Основное освещение
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
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
      // Очищаем предыдущий график
      chartGroup.clear();
      
      switch (settings.chartType) {
        case 'bar3d':
          create3DBarChart();
          break;
        case 'line3d':
          create3DLineChart();
          break;
        case 'scatter3d':
          create3DScatterChart();
          break;
        case 'surface3d':
          create3DSurfaceChart();
          break;
        case 'sphere3d':
          create3DSphereChart();
          break;
        default:
          create3DBarChart();
      }
    };
    
    // Создание 3D столбчатой диаграммы
    const create3DBarChart = () => {
      const barWidth = 0.8;
      const barHeight = 0.5;
      const spacing = 1.2;
      
      props.data.forEach((item, index) => {
        const geometry = new THREE.BoxGeometry(barWidth, item.value * barHeight, barWidth);
        const material = new THREE.MeshLambertMaterial({
          color: getColor(index),
          transparent: true,
          opacity: 0.8
        });
        
        const bar = new THREE.Mesh(geometry, material);
        bar.position.set(
          index * spacing - (props.data.length - 1) * spacing / 2,
          item.value * barHeight / 2,
          0
        );
        
        // Добавляем данные для взаимодействия
        bar.userData = {
          type: 'bar',
          data: item,
          index: index
        };
        
        chartGroup.add(bar);
        
        // Добавляем подписи
        addLabel(bar.position.x, -1, item.label);
      });
    };
    
    // Создание 3D линейной диаграммы
    const create3DLineChart = () => {
      const points = [];
      const lineGeometry = new THREE.BufferGeometry();
      
      props.data.forEach((item, index) => {
        const x = index * 2 - (props.data.length - 1);
        const y = item.value;
        const z = 0;
        
        points.push(new THREE.Vector3(x, y, z));
        
        // Добавляем точки
        const pointGeometry = new THREE.SphereGeometry(0.1);
        const pointMaterial = new THREE.MeshLambertMaterial({
          color: getColor(index)
        });
        
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(x, y, z);
        point.userData = {
          type: 'point',
          data: item,
          index: index
        };
        
        chartGroup.add(point);
      });
      
      // Создаем линию
      lineGeometry.setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1976d2 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      chartGroup.add(line);
    };
    
    // Создание 3D точечной диаграммы
    const create3DScatterChart = () => {
      props.data.forEach((item, index) => {
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshLambertMaterial({
          color: getColor(index),
          transparent: true,
          opacity: 0.7
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(
          item.x || index * 2,
          item.y || item.value,
          item.z || 0
        );
        
        sphere.userData = {
          type: 'sphere',
          data: item,
          index: index
        };
        
        chartGroup.add(sphere);
      });
    };
    
    // Создание 3D поверхности
    const create3DSurfaceChart = () => {
      const size = Math.ceil(Math.sqrt(props.data.length));
      const geometry = new THREE.PlaneGeometry(size, size, size - 1, size - 1);
      const material = new THREE.MeshLambertMaterial({
        color: 0x1976d2,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      });
      
      // Деформируем геометрию на основе данных
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        const dataIndex = Math.floor(i / positions.count * props.data.length);
        const height = props.data[dataIndex]?.value || 0;
        
        positions.setZ(i, height);
      }
      
      const surface = new THREE.Mesh(geometry, material);
      surface.rotation.x = -Math.PI / 2;
      chartGroup.add(surface);
    };
    
    // Создание 3D сферы данных
    const create3DSphereChart = () => {
      const radius = 5;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshLambertMaterial({
        color: 0x1976d2,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      chartGroup.add(sphere);
      
      // Добавляем точки данных на поверхность сферы
      props.data.forEach((item, index) => {
        const phi = Math.acos(-1 + (2 * index) / props.data.length);
        const theta = Math.sqrt(props.data.length * Math.PI) * phi;
        
        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);
        
        const pointGeometry = new THREE.SphereGeometry(0.1);
        const pointMaterial = new THREE.MeshLambertMaterial({
          color: getColor(index)
        });
        
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(x, y, z);
        point.userData = {
          type: 'sphere_point',
          data: item,
          index: index
        };
        
        chartGroup.add(point);
      });
    };
    
    // Добавление подписей
    const addLabel = (x, y, z, text) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      context.fillStyle = '#000000';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(text, 128, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      
      sprite.position.set(x, y, z);
      sprite.scale.set(2, 0.5, 1);
      
      chartGroup.add(sprite);
    };
    
    // Получение цвета
    const getColor = (index) => {
      switch (settings.colorScheme) {
        case 'warm':
          return new THREE.Color().setHSL(0.1 + index * 0.1, 0.7, 0.5);
        case 'cool':
          return new THREE.Color().setHSL(0.5 + index * 0.1, 0.7, 0.5);
        case 'rainbow':
          return new THREE.Color().setHSL(index / props.data.length, 0.7, 0.5);
        case 'monochrome':
          return new THREE.Color().setHSL(0.6, 0.3, 0.3 + index * 0.2);
        default:
          return new THREE.Color(props.colors[index % props.colors.length]);
      }
    };
    
    // Настройка обработчиков событий
    const setupEventListeners = () => {
      if (!renderer?.domElement) return;
      
      // Обработка мыши
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('click', onClick);
      
      // Обработка изменения размера
      window.addEventListener('resize', onWindowResize);
    };
    
    // Обработка движения мыши
    const onMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Raycasting для определения объекта под мышью
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(chartGroup.children, true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.data) {
          hoveredData.value = object.userData.data;
          document.body.style.cursor = 'pointer';
        }
      } else {
        hoveredData.value = null;
        document.body.style.cursor = 'default';
      }
    };
    
    // Обработка клика
    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(chartGroup.children, true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.data) {
          emit('data-click', object.userData.data);
        }
      }
    };
    
    // Обработка изменения размера окна
    const onWindowResize = () => {
      if (camera && renderer) {
        camera.aspect = props.width / props.height;
        camera.updateProjectionMatrix();
        renderer.setSize(props.width, props.height);
      }
    };
    
    // Анимация
    const animate = () => {
      if (!settings.enableAnimation) return;
      
      animationId = requestAnimationFrame(animate);
      
      // Вращение графика
      if (chartGroup) {
        chartGroup.rotation.y += 0.005 * settings.animationSpeed;
      }
      
      // Обновление контролов
      if (controls) {
        controls.update();
      }
      
      // Рендеринг
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    
    // Методы управления
    const changeChartType = () => {
      createChart();
    };
    
    const changeColorScheme = () => {
      createChart();
    };
    
    const toggleAnimation = () => {
      if (settings.enableAnimation) {
        animate();
      } else {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      }
    };
    
    const changeAnimationSpeed = () => {
      // Скорость анимации уже применяется в animate()
    };
    
    const changeCameraDistance = () => {
      if (camera) {
        camera.position.z = settings.cameraDistance;
      }
    };
    
    const changeCameraRotation = () => {
      if (camera) {
        camera.rotation.x = THREE.MathUtils.degToRad(settings.cameraRotationX);
        camera.rotation.y = THREE.MathUtils.degToRad(settings.cameraRotationY);
      }
    };
    
    const exportScene = () => {
      if (renderer) {
        const dataURL = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = '3d-chart.png';
        link.href = dataURL;
        link.click();
      }
    };
    
    const screenshot = () => {
      if (renderer) {
        const dataURL = renderer.domElement.toDataURL('image/png');
        emit('screenshot', dataURL);
      }
    };
    
    // Наблюдение за изменениями данных
    watch(() => props.data, () => {
      if (scene) {
        createChart();
      }
    }, { deep: true });
    
    // Жизненный цикл
    onMounted(async () => {
      await nextTick();
      initScene();
    });
    
    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (renderer) {
        renderer.dispose();
      }
      
      if (chartContainer.value && renderer?.domElement) {
        chartContainer.value.removeChild(renderer.domElement);
      }
      
      window.removeEventListener('resize', onWindowResize);
    });
    
    return {
      chartContainer,
      showControls,
      loading,
      hoveredData,
      settings,
      chartTypes,
      colorSchemes,
      changeChartType,
      changeColorScheme,
      toggleAnimation,
      changeAnimationSpeed,
      changeCameraDistance,
      changeCameraRotation,
      exportScene,
      screenshot
    };
  }
};
</script>

<style scoped>
.threejs-chart {
  position: relative;
  width: 100%;
}

.chart-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.controls-toggle {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.chart-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  max-width: 300px;
}

.controls-panel {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 10;
}

.info-card {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.info-item {
  margin-bottom: 8px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #666;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .chart-controls {
    max-width: 250px;
  }
  
  .controls-panel {
    font-size: 14px;
  }
}
</style> 