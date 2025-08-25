<template>
  <div class="mobile-app" :class="{ 'offline': isOffline }">
    <!-- Offline индикатор -->
    <v-alert
      v-if="isOffline"
      type="warning"
      dense
      class="offline-alert"
    >
      <v-icon left>mdi-wifi-off</v-icon>
      Работа в офлайн режиме
    </v-alert>

    <!-- Основная навигация -->
    <v-bottom-navigation
      v-model="currentTab"
      :value="currentTab"
      app
      color="primary"
      grow
    >
      <v-btn value="dashboard">
        <span>Дашборд</span>
        <v-icon>mdi-view-dashboard</v-icon>
      </v-btn>

      <v-btn value="tasks">
        <span>Задачи</span>
        <v-icon>mdi-checkbox-marked-circle</v-icon>
      </v-btn>

      <v-btn value="calendar">
        <span>Календарь</span>
        <v-icon>mdi-calendar</v-icon>
      </v-btn>

      <v-btn value="chat">
        <span>Чат</span>
        <v-icon>mdi-chat</v-icon>
        <v-badge
          v-if="unreadMessages > 0"
          :content="unreadMessages"
          color="error"
          overlap
        ></v-badge>
      </v-btn>

      <v-btn value="profile">
        <span>Профиль</span>
        <v-icon>mdi-account</v-icon>
      </v-btn>
    </v-bottom-navigation>

    <!-- Основной контент -->
    <div class="mobile-content">
      <!-- Дашборд -->
      <div v-if="currentTab === 'dashboard'" class="tab-content">
        <MobileDashboard />
      </div>

      <!-- Задачи -->
      <div v-if="currentTab === 'tasks'" class="tab-content">
        <MobileTasks />
      </div>

      <!-- Календарь -->
      <div v-if="currentTab === 'calendar'" class="tab-content">
        <MobileCalendar />
      </div>

      <!-- Чат -->
      <div v-if="currentTab === 'chat'" class="tab-content">
        <MobileChat />
      </div>

      <!-- Профиль -->
      <div v-if="currentTab === 'profile'" class="tab-content">
        <MobileProfile />
      </div>
    </div>

    <!-- Плавающая кнопка действий -->
    <v-btn
      fab
      color="primary"
      class="fab-action"
      @click="showActionMenu = !showActionMenu"
    >
      <v-icon>{{ showActionMenu ? 'mdi-close' : 'mdi-plus' }}</v-icon>
    </v-btn>

    <!-- Меню действий -->
    <v-expand-transition>
      <div v-if="showActionMenu" class="action-menu">
        <v-btn
          fab
          small
          color="success"
          class="action-btn"
          @click="createTask"
        >
          <v-icon>mdi-checkbox-marked-circle</v-icon>
        </v-btn>
        
        <v-btn
          fab
          small
          color="info"
          class="action-btn"
          @click="createMeeting"
        >
          <v-icon>mdi-calendar-plus</v-icon>
        </v-btn>
        
        <v-btn
          fab
          small
          color="warning"
          class="action-btn"
          @click="startVoiceNote"
        >
          <v-icon>mdi-microphone</v-icon>
        </v-btn>
        
        <v-btn
          fab
          small
          color="error"
          class="action-btn"
          @click="scanQR"
        >
          <v-icon>mdi-qrcode-scan</v-icon>
        </v-btn>
      </div>
    </v-expand-transition>

    <!-- Диалог создания задачи -->
    <v-dialog v-model="taskDialog" max-width="400">
      <v-card>
        <v-card-title>Новая задача</v-card-title>
        <v-card-text>
          <v-form ref="taskForm" v-model="taskFormValid">
            <v-text-field
              v-model="newTask.title"
              label="Название"
              required
              :rules="[v => !!v || 'Название обязательно']"
            ></v-text-field>
            
            <v-textarea
              v-model="newTask.description"
              label="Описание"
              rows="3"
            ></v-textarea>
            
            <v-select
              v-model="newTask.priority"
              :items="priorityOptions"
              label="Приоритет"
            ></v-select>
            
            <v-datetime-picker
              v-model="newTask.dueDate"
              label="Срок выполнения"
            ></v-datetime-picker>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="taskDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="saveTask"
            :disabled="!taskFormValid"
            :loading="savingTask"
          >
            Создать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог создания встречи -->
    <v-dialog v-model="meetingDialog" max-width="400">
      <v-card>
        <v-card-title>Новая встреча</v-card-title>
        <v-card-text>
          <v-form ref="meetingForm" v-model="meetingFormValid">
            <v-text-field
              v-model="newMeeting.title"
              label="Тема встречи"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="newMeeting.description"
              label="Описание"
              rows="3"
            ></v-textarea>
            
            <v-datetime-picker
              v-model="newMeeting.startTime"
              label="Время начала"
            ></v-datetime-picker>
            
            <v-datetime-picker
              v-model="newMeeting.endTime"
              label="Время окончания"
            ></v-datetime-picker>
            
            <v-text-field
              v-model="newMeeting.location"
              label="Место проведения"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="meetingDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="saveMeeting"
            :disabled="!meetingFormValid"
            :loading="savingMeeting"
          >
            Создать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Голосовая заметка -->
    <v-dialog v-model="voiceNoteDialog" max-width="400">
      <v-card>
        <v-card-title>Голосовая заметка</v-card-title>
        <v-card-text class="text-center">
          <div v-if="!isRecording" class="voice-controls">
            <v-btn
              fab
              large
              color="primary"
              @click="startRecording"
            >
              <v-icon size="48">mdi-microphone</v-icon>
            </v-btn>
            <p class="mt-4">Нажмите для начала записи</p>
          </div>
          
          <div v-else class="recording-controls">
            <v-btn
              fab
              large
              color="error"
              @click="stopRecording"
            >
              <v-icon size="48">mdi-stop</v-icon>
            </v-btn>
            <p class="mt-4">Запись... {{ recordingTime }}</p>
            <v-progress-circular
              indeterminate
              color="primary"
              size="32"
            ></v-progress-circular>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- QR сканер -->
    <v-dialog v-model="qrScannerDialog" max-width="400">
      <v-card>
        <v-card-title>Сканирование QR кода</v-card-title>
        <v-card-text>
          <div class="qr-scanner-container">
            <video ref="qrVideo" class="qr-video"></video>
            <canvas ref="qrCanvas" class="qr-canvas"></canvas>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="qrScannerDialog = false">Отмена</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Уведомления -->
    <v-snackbar
      v-model="showNotification"
      :color="notificationColor"
      :timeout="3000"
    >
      {{ notificationMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="showNotification = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import MobileDashboard from './MobileDashboard.vue';
import MobileTasks from './MobileTasks.vue';
import MobileCalendar from './MobileCalendar.vue';
import MobileChat from './MobileChat.vue';
import MobileProfile from './MobileProfile.vue';

export default {
  name: 'MobileApp',
  components: {
    MobileDashboard,
    MobileTasks,
    MobileCalendar,
    MobileChat,
    MobileProfile
  },
  
  data() {
    return {
      // Навигация
      currentTab: 'dashboard',
      
      // Состояние
      isOffline: false,
      showActionMenu: false,
      unreadMessages: 0,
      
      // Диалоги
      taskDialog: false,
      meetingDialog: false,
      voiceNoteDialog: false,
      qrScannerDialog: false,
      
      // Формы
      taskFormValid: false,
      meetingFormValid: false,
      
      // Новая задача
      newTask: {
        title: '',
        description: '',
        priority: 'medium',
        dueDate: null
      },
      
      // Новая встреча
      newMeeting: {
        title: '',
        description: '',
        startTime: null,
        endTime: null,
        location: ''
      },
      
      // Приоритеты
      priorityOptions: [
        { text: 'Низкий', value: 'low' },
        { text: 'Средний', value: 'medium' },
        { text: 'Высокий', value: 'high' },
        { text: 'Критический', value: 'urgent' }
      ],
      
      // Голосовая заметка
      isRecording: false,
      recordingTime: '00:00',
      recordingInterval: null,
      mediaRecorder: null,
      audioChunks: [],
      
      // QR сканер
      qrStream: null,
      
      // Уведомления
      showNotification: false,
      notificationMessage: '',
      notificationColor: 'success',
      
      // Загрузка
      savingTask: false,
      savingMeeting: false
    };
  },
  
  mounted() {
    this.initializeApp();
    this.setupServiceWorker();
    this.setupOfflineDetection();
    this.setupPushNotifications();
    this.setupGeolocation();
  },
  
  beforeDestroy() {
    this.cleanup();
  },
  
  methods: {
    // Инициализация приложения
    async initializeApp() {
      try {
        // Проверка поддержки PWA
        if ('serviceWorker' in navigator) {
          console.log('PWA поддерживается');
        }
        
        // Проверка поддержки WebRTC
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          console.log('WebRTC поддерживается');
        }
        
        // Проверка поддержки Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          console.log('Speech Recognition поддерживается');
        }
        
        // Загрузка данных пользователя
        await this.loadUserData();
        
        // Инициализация уведомлений
        this.initializeNotifications();
        
      } catch (error) {
        console.error('Ошибка инициализации:', error);
        this.showNotificationMessage('Ошибка инициализации приложения', 'error');
      }
    },
    
    // Настройка Service Worker
    async setupServiceWorker() {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker зарегистрирован:', registration);
          
          // Обработка обновлений
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          });
          
        } catch (error) {
          console.error('Ошибка регистрации Service Worker:', error);
        }
      }
    },
    
    // Определение офлайн режима
    setupOfflineDetection() {
      window.addEventListener('online', () => {
        this.isOffline = false;
        this.showNotificationMessage('Соединение восстановлено', 'success');
        this.syncOfflineData();
      });
      
      window.addEventListener('offline', () => {
        this.isOffline = true;
        this.showNotificationMessage('Работа в офлайн режиме', 'warning');
      });
      
      // Проверка текущего состояния
      this.isOffline = !navigator.onLine;
    },
    
    // Настройка Push уведомлений
    async setupPushNotifications() {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Разрешение на уведомления получено');
            this.subscribeToPushNotifications();
          }
        } catch (error) {
          console.error('Ошибка настройки уведомлений:', error);
        }
      }
    },
    
    // Подписка на Push уведомления
    async subscribeToPushNotifications() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(process.env.VUE_APP_VAPID_PUBLIC_KEY)
        });
        
        // Отправка подписки на сервер
        await this.sendPushSubscription(subscription);
        
      } catch (error) {
        console.error('Ошибка подписки на уведомления:', error);
      }
    },
    
    // Настройка геолокации
    setupGeolocation() {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.saveUserLocation(position.coords);
          },
          (error) => {
            console.log('Геолокация недоступна:', error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      }
    },
    
    // Загрузка данных пользователя
    async loadUserData() {
      try {
        // Загрузка профиля
        const profile = await this.$api.getProfile();
        this.$store.commit('setUser', profile);
        
        // Загрузка непрочитанных сообщений
        this.unreadMessages = await this.$api.getUnreadMessagesCount();
        
        // Загрузка офлайн данных
        this.loadOfflineData();
        
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    },
    
    // Инициализация уведомлений
    initializeNotifications() {
      // Проверка новых уведомлений каждые 30 секунд
      setInterval(async () => {
        if (!this.isOffline) {
          try {
            const newNotifications = await this.$api.getNewNotifications();
            this.processNewNotifications(newNotifications);
          } catch (error) {
            console.error('Ошибка проверки уведомлений:', error);
          }
        }
      }, 30000);
    },
    
    // Обработка новых уведомлений
    processNewNotifications(notifications) {
      notifications.forEach(notification => {
        // Показ push уведомления
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: notification.id
          });
        }
        
        // Обновление счетчика
        this.unreadMessages++;
        
        // Показ in-app уведомления
        this.showNotificationMessage(notification.message, 'info');
      });
    },
    
    // Создание задачи
    createTask() {
      this.taskDialog = true;
      this.showActionMenu = false;
    },
    
    // Сохранение задачи
    async saveTask() {
      if (!this.$refs.taskForm.validate()) return;
      
      this.savingTask = true;
      
      try {
        if (this.isOffline) {
          // Сохранение в офлайн хранилище
          this.saveOfflineTask(this.newTask);
          this.showNotificationMessage('Задача сохранена офлайн', 'info');
        } else {
          // Отправка на сервер
          await this.$api.createTask(this.newTask);
          this.showNotificationMessage('Задача создана', 'success');
        }
        
        this.taskDialog = false;
        this.resetTaskForm();
        
      } catch (error) {
        console.error('Ошибка создания задачи:', error);
        this.showNotificationMessage('Ошибка создания задачи', 'error');
      } finally {
        this.savingTask = false;
      }
    },
    
    // Создание встречи
    createMeeting() {
      this.meetingDialog = true;
      this.showActionMenu = false;
    },
    
    // Сохранение встречи
    async saveMeeting() {
      if (!this.$refs.meetingForm.validate()) return;
      
      this.savingMeeting = true;
      
      try {
        if (this.isOffline) {
          this.saveOfflineMeeting(this.newMeeting);
          this.showNotificationMessage('Встреча сохранена офлайн', 'info');
        } else {
          await this.$api.createMeeting(this.newMeeting);
          this.showNotificationMessage('Встреча создана', 'success');
        }
        
        this.meetingDialog = false;
        this.resetMeetingForm();
        
      } catch (error) {
        console.error('Ошибка создания встречи:', error);
        this.showNotificationMessage('Ошибка создания встречи', 'error');
      } finally {
        this.savingMeeting = false;
      }
    },
    
    // Голосовая заметка
    startVoiceNote() {
      this.voiceNoteDialog = true;
      this.showActionMenu = false;
    },
    
    // Начало записи
    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };
        
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.saveVoiceNote(audioBlob);
        };
        
        this.mediaRecorder.start();
        this.isRecording = true;
        this.startRecordingTimer();
        
      } catch (error) {
        console.error('Ошибка записи:', error);
        this.showNotificationMessage('Ошибка записи аудио', 'error');
      }
    },
    
    // Остановка записи
    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.stopRecordingTimer();
        
        // Остановка потока
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    },
    
    // Таймер записи
    startRecordingTimer() {
      let seconds = 0;
      this.recordingInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        this.recordingTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      }, 1000);
    },
    
    // Остановка таймера
    stopRecordingTimer() {
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
        this.recordingTime = '00:00';
      }
    },
    
    // Сохранение голосовой заметки
    async saveVoiceNote(audioBlob) {
      try {
        if (this.isOffline) {
          // Сохранение локально
          const url = URL.createObjectURL(audioBlob);
          this.saveOfflineVoiceNote(url);
          this.showNotificationMessage('Голосовая заметка сохранена офлайн', 'info');
        } else {
          // Отправка на сервер
          const formData = new FormData();
          formData.append('audio', audioBlob);
          await this.$api.uploadVoiceNote(formData);
          this.showNotificationMessage('Голосовая заметка сохранена', 'success');
        }
        
        this.voiceNoteDialog = false;
        
      } catch (error) {
        console.error('Ошибка сохранения голосовой заметки:', error);
        this.showNotificationMessage('Ошибка сохранения', 'error');
      }
    },
    
    // Сканирование QR
    async scanQR() {
      this.qrScannerDialog = true;
      this.showActionMenu = false;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        this.qrStream = stream;
        
        const video = this.$refs.qrVideo;
        video.srcObject = stream;
        video.play();
        
        // Запуск сканирования
        this.startQRScanning();
        
      } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        this.showNotificationMessage('Ошибка доступа к камере', 'error');
      }
    },
    
    // Запуск сканирования QR
    startQRScanning() {
      const video = this.$refs.qrVideo;
      const canvas = this.$refs.qrCanvas;
      const context = canvas.getContext('2d');
      
      const scanFrame = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Здесь должна быть логика распознавания QR кода
          // Используйте библиотеку jsQR или аналогичную
          
          // Продолжаем сканирование
          requestAnimationFrame(scanFrame);
        }
      };
      
      scanFrame();
    },
    
    // Синхронизация офлайн данных
    async syncOfflineData() {
      try {
        // Синхронизация задач
        const offlineTasks = this.getOfflineTasks();
        for (const task of offlineTasks) {
          await this.$api.createTask(task);
          this.removeOfflineTask(task.id);
        }
        
        // Синхронизация встреч
        const offlineMeetings = this.getOfflineMeetings();
        for (const meeting of offlineMeetings) {
          await this.$api.createMeeting(meeting);
          this.removeOfflineMeeting(meeting.id);
        }
        
        // Синхронизация голосовых заметок
        const offlineVoiceNotes = this.getOfflineVoiceNotes();
        for (const voiceNote of offlineVoiceNotes) {
          const response = await fetch(voiceNote.url);
          const blob = await response.blob();
          
          const formData = new FormData();
          formData.append('audio', blob);
          await this.$api.uploadVoiceNote(formData);
          
          this.removeOfflineVoiceNote(voiceNote.id);
        }
        
        this.showNotificationMessage('Данные синхронизированы', 'success');
        
      } catch (error) {
        console.error('Ошибка синхронизации:', error);
        this.showNotificationMessage('Ошибка синхронизации', 'error');
      }
    },
    
    // Показ уведомления
    showNotificationMessage(message, color = 'info') {
      this.notificationMessage = message;
      this.notificationColor = color;
      this.showNotification = true;
    },
    
    // Сброс формы задачи
    resetTaskForm() {
      this.newTask = {
        title: '',
        description: '',
        priority: 'medium',
        dueDate: null
      };
      this.$refs.taskForm.resetValidation();
    },
    
    // Сброс формы встречи
    resetMeetingForm() {
      this.newMeeting = {
        title: '',
        description: '',
        startTime: null,
        endTime: null,
        location: ''
      };
      this.$refs.meetingForm.resetValidation();
    },
    
    // Сохранение офлайн задачи
    saveOfflineTask(task) {
      const offlineTasks = JSON.parse(localStorage.getItem('offlineTasks') || '[]');
      task.id = Date.now().toString();
      task.offline = true;
      offlineTasks.push(task);
      localStorage.setItem('offlineTasks', JSON.stringify(offlineTasks));
    },
    
    // Сохранение офлайн встречи
    saveOfflineMeeting(meeting) {
      const offlineMeetings = JSON.parse(localStorage.getItem('offlineMeetings') || '[]');
      meeting.id = Date.now().toString();
      meeting.offline = true;
      offlineMeetings.push(meeting);
      localStorage.setItem('offlineMeetings', JSON.stringify(offlineMeetings));
    },
    
    // Сохранение офлайн голосовой заметки
    saveOfflineVoiceNote(url) {
      const offlineVoiceNotes = JSON.parse(localStorage.getItem('offlineVoiceNotes') || '[]');
      const voiceNote = {
        id: Date.now().toString(),
        url: url,
        timestamp: new Date().toISOString(),
        offline: true
      };
      offlineVoiceNotes.push(voiceNote);
      localStorage.setItem('offlineVoiceNotes', JSON.stringify(offlineVoiceNotes));
    },
    
    // Получение офлайн задач
    getOfflineTasks() {
      return JSON.parse(localStorage.getItem('offlineTasks') || '[]');
    },
    
    // Получение офлайн встреч
    getOfflineMeetings() {
      return JSON.parse(localStorage.getItem('offlineMeetings') || '[]');
    },
    
    // Получение офлайн голосовых заметок
    getOfflineVoiceNotes() {
      return JSON.parse(localStorage.getItem('offlineVoiceNotes') || '[]');
    },
    
    // Удаление офлайн задачи
    removeOfflineTask(id) {
      const offlineTasks = this.getOfflineTasks();
      const filtered = offlineTasks.filter(task => task.id !== id);
      localStorage.setItem('offlineTasks', JSON.stringify(filtered));
    },
    
    // Удаление офлайн встречи
    removeOfflineMeeting(id) {
      const offlineMeetings = this.getOfflineMeetings();
      const filtered = offlineMeetings.filter(meeting => meeting.id !== id);
      localStorage.setItem('offlineMeetings', JSON.stringify(filtered));
    },
    
    // Удаление офлайн голосовой заметки
    removeOfflineVoiceNote(id) {
      const offlineVoiceNotes = this.getOfflineVoiceNotes();
      const filtered = offlineVoiceNotes.filter(note => note.id !== id);
      localStorage.setItem('offlineVoiceNotes', JSON.stringify(filtered));
    },
    
    // Загрузка офлайн данных
    loadOfflineData() {
      // Загрузка данных из localStorage
      const offlineTasks = this.getOfflineTasks();
      const offlineMeetings = this.getOfflineMeetings();
      const offlineVoiceNotes = this.getOfflineVoiceNotes();
      
      // Обновление счетчиков
      this.updateOfflineCounters(offlineTasks, offlineMeetings, offlineVoiceNotes);
    },
    
    // Обновление счетчиков офлайн данных
    updateOfflineCounters(tasks, meetings, voiceNotes) {
      // Здесь можно обновить UI для показа офлайн данных
      console.log(`Офлайн: ${tasks.length} задач, ${meetings.length} встреч, ${voiceNotes.length} голосовых заметок`);
    },
    
    // Сохранение местоположения пользователя
    saveUserLocation(coords) {
      const location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('userLocation', JSON.stringify(location));
      
      // Отправка на сервер если онлайн
      if (!this.isOffline) {
        this.$api.updateUserLocation(location).catch(console.error);
      }
    },
    
    // Отправка подписки на push уведомления
    async sendPushSubscription(subscription) {
      try {
        await this.$api.subscribeToPushNotifications(subscription);
      } catch (error) {
        console.error('Ошибка отправки подписки:', error);
      }
    },
    
    // Конвертация VAPID ключа
    urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },
    
    // Показ уведомления об обновлении
    showUpdateNotification() {
      this.showNotificationMessage('Доступно обновление приложения', 'info');
    },
    
    // Очистка ресурсов
    cleanup() {
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
      }
      
      if (this.mediaRecorder && this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      
      if (this.qrStream) {
        this.qrStream.getTracks().forEach(track => track.stop());
      }
    }
  }
};
</script>

<style scoped>
.mobile-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.offline-alert {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px; /* Место для bottom navigation */
}

.tab-content {
  padding: 16px;
}

.fab-action {
  position: fixed;
  bottom: 100px;
  right: 16px;
  z-index: 1000;
}

.action-menu {
  position: fixed;
  bottom: 100px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 999;
}

.action-btn {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.qr-scanner-container {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
}

.qr-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qr-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.voice-controls,
.recording-controls {
  padding: 20px;
}

/* Адаптивность */
@media (max-width: 480px) {
  .tab-content {
    padding: 12px;
  }
  
  .fab-action {
    bottom: 90px;
    right: 12px;
  }
  
  .action-menu {
    bottom: 90px;
    right: 12px;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .mobile-app {
    background: #121212;
    color: #ffffff;
  }
}

/* Высокий контраст */
@media (prefers-contrast: high) {
  .fab-action {
    border: 2px solid #ffffff;
  }
}

/* Уменьшенное движение */
@media (prefers-reduced-motion: reduce) {
  .action-btn {
    animation: none;
  }
}
</style> 