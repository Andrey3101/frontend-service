<template>
  <div class="virtual-board-container">
    <!-- 3D Canvas для WebGL -->
    <canvas ref="vrCanvas" class="vr-canvas"></canvas>
    
    <!-- Контроллеры VR -->
    <div class="vr-controls" v-if="!isVRMode">
      <v-btn @click="enterVR" color="primary" class="mb-2">
        <v-icon left>mdi-vr</v-icon>
        Войти в VR
      </v-btn>
      
      <v-btn @click="enterAR" color="success" class="mb-2">
        <v-icon left>mdi-camera</v-icon>
        Включить AR
      </v-btn>
    </div>

    <!-- Панель инструментов -->
    <div class="toolbar" v-if="!isVRMode">
      <v-toolbar dense>
        <v-btn-group>
          <v-btn @click="selectTool('select')" :color="currentTool === 'select' ? 'primary' : ''">
            <v-icon>mdi-cursor-default</v-icon>
          </v-btn>
          <v-btn @click="selectTool('draw')" :color="currentTool === 'draw' ? 'primary' : ''">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn @click="selectTool('text')" :color="currentTool === 'text' ? 'primary' : ''">
            <v-icon>mdi-format-text</v-icon>
          </v-btn>
          <v-btn @click="selectTool('shape')" :color="currentTool === 'shape' ? 'primary' : ''">
            <v-icon>mdi-shape</v-icon>
          </v-btn>
        </v-btn-group>

        <v-divider vertical class="mx-2"></v-divider>

        <v-btn-group>
          <v-btn @click="addStickyNote">
            <v-icon>mdi-sticky-note</v-icon>
          </v-btn>
          <v-btn @click="add3DModel">
            <v-icon>mdi-cube-outline</v-icon>
          </v-btn>
          <v-btn @click="addVideo">
            <v-icon>mdi-video</v-icon>
          </v-btn>
        </v-btn-group>

        <v-spacer></v-spacer>

        <v-btn @click="saveBoard" color="success">
          <v-icon left>mdi-content-save</v-icon>
          Сохранить
        </v-btn>
        
        <v-btn @click="exportBoard" color="info">
          <v-icon left>mdi-export</v-icon>
          Экспорт
        </v-btn>
      </v-toolbar>
    </div>

    <!-- Панель 3D объектов -->
    <div class="3d-panel" v-if="!isVRMode">
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header>
            <v-icon left>mdi-cube-outline</v-icon>
            3D Объекты
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <div class="3d-objects-grid">
              <div 
                v-for="obj in available3DObjects" 
                :key="obj.id"
                class="3d-object-item"
                @click="add3DObjectToScene(obj)"
              >
                <v-icon size="24">{{ obj.icon }}</v-icon>
                <span>{{ obj.name }}</span>
              </div>
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Диалог настроек VR -->
    <v-dialog v-model="vrSettingsDialog" max-width="500">
      <v-card>
        <v-card-title>Настройки VR/AR</v-card-title>
        <v-card-text>
          <v-form>
            <v-select
              v-model="vrSettings.quality"
              :items="vrQualityOptions"
              label="Качество рендеринга"
            ></v-select>
            
            <v-select
              v-model="vrSettings.fieldOfView"
              :items="fovOptions"
              label="Поле зрения"
            ></v-select>
            
            <v-checkbox
              v-model="vrSettings.enableHaptics"
              label="Тактильная обратная связь"
            ></v-checkbox>
            
            <v-checkbox
              v-model="vrSettings.enableSpatialAudio"
              label="Пространственный звук"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="vrSettingsDialog = false">Отмена</v-btn>
          <v-btn color="primary" @click="applyVRSettings">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default {
  name: 'VirtualBoard',
  data() {
    return {
      // Three.js компоненты
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      
      // Состояние
      isVRMode: false,
      isARMode: false,
      currentTool: 'select',
      vrSettingsDialog: false,
      
      // Настройки VR
      vrSettings: {
        quality: 'high',
        fieldOfView: 75,
        enableHaptics: true,
        enableSpatialAudio: true
      },
      
      // Доступные 3D объекты
      available3DObjects: [
        { id: 1, name: 'Куб', icon: 'mdi-cube', geometry: 'box' },
        { id: 2, name: 'Сфера', icon: 'mdi-circle', geometry: 'sphere' },
        { id: 3, name: 'Цилиндр', icon: 'mdi-cylinder', geometry: 'cylinder' },
        { id: 4, name: 'Пирамида', icon: 'mdi-triangle', geometry: 'cone' },
        { id: 5, name: 'Тор', icon: 'mdi-circle-outline', geometry: 'torus' }
      ],
      
      // Опции качества
      vrQualityOptions: [
        { text: 'Низкое', value: 'low' },
        { text: 'Среднее', value: 'medium' },
        { text: 'Высокое', value: 'high' },
        { text: 'Ультра', value: 'ultra' }
      ],
      
      // Опции поля зрения
      fovOptions: [
        { text: '60°', value: 60 },
        { text: '75°', value: 75 },
        { text: '90°', value: 90 },
        { text: '120°', value: 120 }
      ],
      
      // Сцена
      boardObjects: [],
      selectedObject: null,
      
      // Анимация
      animationId: null
    };
  },
  
  mounted() {
    this.initThreeJS();
    this.setupEventListeners();
    this.animate();
  },
  
  beforeDestroy() {
    this.cleanup();
  },
  
  methods: {
    // Инициализация Three.js
    initThreeJS() {
      const canvas = this.$refs.vrCanvas;
      
      // Сцена
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a1a);
      
      // Камера
      this.camera = new THREE.PerspectiveCamera(
        this.vrSettings.fieldOfView,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      this.camera.position.set(0, 5, 10);
      
      // Рендерер
      this.renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Контролы
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      
      // Освещение
      this.setupLighting();
      
      // Сетка
      this.addGrid();
      
      // VR поддержка
      this.setupVR();
      
      // AR поддержка
      this.setupAR();
    },
    
    // Настройка освещения
    setupLighting() {
      // Основной свет
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      this.scene.add(ambientLight);
      
      // Направленный свет
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      this.scene.add(directionalLight);
      
      // Точечный свет
      const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
      pointLight.position.set(-10, 10, -10);
      this.scene.add(pointLight);
    },
    
    // Добавление сетки
    addGrid() {
      const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x888888);
      this.scene.add(gridHelper);
    },
    
    // Настройка VR
    setupVR() {
      this.renderer.xr.enabled = true;
      
      // VR кнопка
      const vrButton = VRButton.createButton(this.renderer);
      document.body.appendChild(vrButton);
      
      // Обработчики VR
      this.renderer.setAnimationLoop(this.render);
      
      this.renderer.xr.addEventListener('sessionstart', () => {
        this.isVRMode = true;
        this.onVRSessionStart();
      });
      
      this.renderer.xr.addEventListener('sessionend', () => {
        this.isVRMode = false;
        this.onVRSessionEnd();
      });
    },
    
    // Настройка AR
    setupAR() {
      if (this.renderer.xr.isArSupported) {
        const arButton = ARButton.createButton(this.renderer, {
          sessionInit: {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: this.$refs.vrCanvas }
          }
        });
        document.body.appendChild(arButton);
        
        this.renderer.xr.addEventListener('sessionstart', () => {
          this.isARMode = true;
          this.onARSessionStart();
        });
        
        this.renderer.xr.addEventListener('sessionend', () => {
          this.isARMode = false;
          this.onARSessionEnd();
        });
      }
    },
    
    // Обработчики событий
    setupEventListeners() {
      window.addEventListener('resize', this.onWindowResize);
      
      // Обработка кликов по объектам
      this.renderer.domElement.addEventListener('click', this.onCanvasClick);
      
      // Обработка клавиатуры
      document.addEventListener('keydown', this.onKeyDown);
    },
    
    // Изменение размера окна
    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    
    // Клик по канвасу
    onCanvasClick(event) {
      if (this.currentTool !== 'select') return;
      
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      
      if (intersects.length > 0) {
        this.selectObject(intersects[0].object);
      } else {
        this.deselectObject();
      }
    },
    
    // Выбор объекта
    selectObject(object) {
      if (this.selectedObject) {
        this.selectedObject.material.emissive.setHex(0x000000);
      }
      
      this.selectedObject = object;
      object.material.emissive.setHex(0x333333);
      
      this.$emit('object-selected', object);
    },
    
    // Отмена выбора объекта
    deselectObject() {
      if (this.selectedObject) {
        this.selectedObject.material.emissive.setHex(0x000000);
        this.selectedObject = null;
      }
      
      this.$emit('object-deselected');
    },
    
    // Выбор инструмента
    selectTool(tool) {
      this.currentTool = tool;
      this.$emit('tool-changed', tool);
    },
    
    // Добавление стикера
    addStickyNote() {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      
      const stickyNote = new THREE.Mesh(geometry, material);
      stickyNote.position.set(0, 2, 0);
      stickyNote.userData = { type: 'sticky', text: 'Новая заметка' };
      
      this.scene.add(stickyNote);
      this.boardObjects.push(stickyNote);
    },
    
    // Добавление 3D модели
    add3DModel() {
      // Здесь можно добавить загрузку внешних 3D моделей
      this.add3DObjectToScene(this.available3DObjects[0]);
    },
    
    // Добавление 3D объекта в сцену
    add3DObjectToScene(objData) {
      let geometry;
      
      switch (objData.geometry) {
        case 'box':
          geometry = new THREE.BoxGeometry(1, 1, 1);
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(0.5, 32, 32);
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
          break;
        case 'cone':
          geometry = new THREE.ConeGeometry(0.5, 1, 32);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }
      
      const material = new THREE.MeshLambertMaterial({ 
        color: Math.random() * 0xffffff,
        transparent: true,
        opacity: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        1,
        (Math.random() - 0.5) * 10
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { type: '3d-object', originalData: objData };
      
      this.scene.add(mesh);
      this.boardObjects.push(mesh);
    },
    
    // Добавление видео
    addVideo() {
      // Создание видео элемента
      const video = document.createElement('video');
      video.src = '/sample-video.mp4'; // Замените на реальный источник
      video.loop = true;
      video.muted = true;
      video.play();
      
      const videoTexture = new THREE.VideoTexture(video);
      const geometry = new THREE.PlaneGeometry(2, 1.125); // 16:9 соотношение
      const material = new THREE.MeshBasicMaterial({ map: videoTexture });
      
      const videoMesh = new THREE.Mesh(geometry, material);
      videoMesh.position.set(0, 3, 0);
      videoMesh.userData = { type: 'video', videoElement: video };
      
      this.scene.add(videoMesh);
      this.boardObjects.push(videoMesh);
    },
    
    // Сохранение доски
    saveBoard() {
      const boardData = {
        objects: this.boardObjects.map(obj => ({
          type: obj.userData.type,
          position: obj.position.toArray(),
          rotation: obj.rotation.toArray(),
          scale: obj.scale.toArray(),
          userData: obj.userData
        })),
        settings: this.vrSettings,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('virtualBoard', JSON.stringify(boardData));
      this.$emit('board-saved', boardData);
    },
    
    // Экспорт доски
    exportBoard() {
      // Экспорт в различные форматы (GLTF, OBJ, etc.)
      this.$emit('board-export-requested');
    },
    
    // Вход в VR
    enterVR() {
      if (this.renderer.xr.isPresenting) {
        this.renderer.xr.getSession().end();
      } else {
        this.renderer.xr.getSession().requestReferenceSpace('local');
      }
    },
    
    // Включение AR
    enterAR() {
      if (this.renderer.xr.isPresenting) {
        this.renderer.xr.getSession().end();
      } else {
        this.renderer.xr.getSession().requestReferenceSpace('local');
      }
    },
    
    // Начало VR сессии
    onVRSessionStart() {
      console.log('VR сессия началась');
      this.setupVRControls();
    },
    
    // Конец VR сессии
    onVRSessionEnd() {
      console.log('VR сессия завершена');
      this.cleanupVRControls();
    },
    
    // Начало AR сессии
    onARSessionStart() {
      console.log('AR сессия началась');
      this.setupARControls();
    },
    
    // Конец AR сессии
    onARSessionEnd() {
      console.log('AR сессия завершена');
      this.cleanupARControls();
    },
    
    // Настройка VR контролов
    setupVRControls() {
      // Настройка контроллеров VR
    },
    
    // Очистка VR контролов
    cleanupVRControls() {
      // Очистка VR контролов
    },
    
    // Настройка AR контролов
    setupARControls() {
      // Настройка AR контролов
    },
    
    // Очистка AR контролов
    cleanupARControls() {
      // Очистка AR контролов
    },
    
    // Применение настроек VR
    applyVRSettings() {
      this.camera.fov = this.vrSettings.fieldOfView;
      this.camera.updateProjectionMatrix();
      
      // Применение качества рендеринга
      switch (this.vrSettings.quality) {
        case 'low':
          this.renderer.setPixelRatio(1);
          break;
        case 'medium':
          this.renderer.setPixelRatio(1.5);
          break;
        case 'high':
          this.renderer.setPixelRatio(2);
          break;
        case 'ultra':
          this.renderer.setPixelRatio(3);
          break;
      }
      
      this.vrSettingsDialog = false;
    },
    
    // Обработка клавиатуры
    onKeyDown(event) {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          if (this.selectedObject) {
            this.deleteSelectedObject();
          }
          break;
        case 'Escape':
          this.deselectObject();
          break;
        case 's':
        case 'S':
          if (event.ctrlKey) {
            event.preventDefault();
            this.saveBoard();
          }
          break;
      }
    },
    
    // Удаление выбранного объекта
    deleteSelectedObject() {
      if (this.selectedObject) {
        this.scene.remove(this.selectedObject);
        const index = this.boardObjects.indexOf(this.selectedObject);
        if (index > -1) {
          this.boardObjects.splice(index, 1);
        }
        this.selectedObject = null;
      }
    },
    
    // Рендеринг
    render() {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    },
    
    // Анимация
    animate() {
      this.animationId = requestAnimationFrame(this.animate);
      this.render();
    },
    
    // Очистка
    cleanup() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      
      if (this.renderer) {
        this.renderer.dispose();
      }
      
      window.removeEventListener('resize', this.onWindowResize);
      document.removeEventListener('keydown', this.onKeyDown);
    }
  }
};
</script>

<style scoped>
.virtual-board-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.vr-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.vr-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.toolbar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 8px;
}

.3d-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 300px;
}

.3d-objects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.3d-object-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.3d-object-item:hover {
  background: #f5f5f5;
  border-color: #1976d2;
}

.3d-object-item span {
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
}

/* VR/AR стили */
.vr-mode .toolbar,
.vr-mode .3d-panel {
  display: none;
}

.ar-mode .toolbar {
  background: rgba(0, 0, 0, 0.7);
  color: white;
}

/* Адаптивность */
@media (max-width: 768px) {
  .toolbar {
    left: 10px;
    right: 10px;
    transform: none;
    max-width: none;
  }
  
  .3d-panel {
    right: 10px;
    max-width: 250px;
  }
}
</style> 