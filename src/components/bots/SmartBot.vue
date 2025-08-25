<template>
  <div class="smart-bot-container">
    <!-- Заголовок бота -->
    <v-card class="bot-header" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-avatar size="40" class="mr-3">
          <v-icon size="24" color="primary">mdi-robot</v-icon>
        </v-avatar>
        <div>
          <div class="text-h6">Умный помощник HELPER</div>
          <div class="text-caption text-grey">
            {{ botStatus === 'online' ? 'Онлайн' : 'Офлайн' }}
            <v-icon 
              :color="botStatus === 'online' ? 'success' : 'grey'"
              size="16"
              class="ml-1"
            >
              {{ botStatus === 'online' ? 'mdi-circle' : 'mdi-circle-outline' }}
            </v-icon>
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon @click="toggleBot">
          <v-icon>{{ isBotActive ? 'mdi-pause' : 'mdi-play' }}</v-icon>
        </v-btn>
      </v-card-title>
    </v-card>

    <!-- Чат с ботом -->
    <div class="chat-container" ref="chatContainer">
      <div class="chat-messages">
        <!-- Приветственное сообщение -->
        <div class="message bot-message">
          <v-avatar size="32" class="mr-2">
            <v-icon size="20" color="primary">mdi-robot</v-icon>
          </v-avatar>
          <div class="message-content">
            <div class="message-text">
              Привет! Я ваш умный помощник HELPER. Чем могу помочь?
            </div>
            <div class="message-time">{{ getCurrentTime() }}</div>
          </div>
        </div>

        <!-- Сообщения пользователя -->
        <div 
          v-for="message in userMessages" 
          :key="message.id"
          class="message user-message"
        >
          <div class="message-content">
            <div class="message-text">{{ message.text }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
          <v-avatar size="32" class="ml-2">
            <v-icon size="20" color="grey">mdi-account</v-icon>
          </v-avatar>
        </div>

        <!-- Ответы бота -->
        <div 
          v-for="message in botMessages" 
          :key="message.id"
          class="message bot-message"
        >
          <v-avatar size="32" class="mr-2">
            <v-icon size="20" color="primary">mdi-robot</v-icon>
          </v-avatar>
          <div class="message-content">
            <div class="message-text" v-html="message.text"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            
            <!-- Действия бота -->
            <div v-if="message.actions" class="message-actions">
              <v-btn
                v-for="action in message.actions"
                :key="action.id"
                :color="action.color || 'primary'"
                :variant="action.variant || 'outlined'"
                size="small"
                class="mr-2 mb-2"
                @click="executeBotAction(action)"
              >
                <v-icon left size="16">{{ action.icon }}</v-icon>
                {{ action.text }}
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Индикатор печати -->
        <div v-if="isTyping" class="message bot-message">
          <v-avatar size="32" class="mr-2">
            <v-icon size="20" color="primary">mdi-robot</v-icon>
          </v-avatar>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Панель быстрых действий -->
    <v-card class="quick-actions" elevation="1">
      <v-card-text class="py-2">
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            v-for="action in quickActions"
            :key="action.id"
            :color="action.color"
            :variant="action.variant"
            size="small"
            @click="executeQuickAction(action)"
          >
            <v-icon left size="16">{{ action.icon }}</v-icon>
            {{ action.text }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Поле ввода -->
    <v-card class="input-container" elevation="2">
      <v-card-text class="py-2">
        <div class="d-flex align-center">
          <!-- Голосовой ввод -->
          <v-btn
            icon
            :color="isRecording ? 'error' : 'primary'"
            @click="toggleVoiceInput"
            class="mr-2"
          >
            <v-icon>{{ isRecording ? 'mdi-stop' : 'mdi-microphone' }}</v-icon>
          </v-btn>

          <!-- Поле ввода -->
          <v-text-field
            v-model="userInput"
            placeholder="Введите сообщение или вопрос..."
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1 mr-2"
            @keyup.enter="sendMessage"
            :disabled="!isBotActive"
          ></v-text-field>

          <!-- Кнопка отправки -->
          <v-btn
            color="primary"
            @click="sendMessage"
            :disabled="!userInput.trim() || !isBotActive"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </div>

        <!-- Индикатор голосового ввода -->
        <div v-if="isRecording" class="voice-indicator mt-2">
          <v-progress-linear
            :model-value="voiceLevel"
            color="error"
            height="4"
          ></v-progress-linear>
          <div class="text-caption text-center mt-1">
            Запись... {{ recordingTime }}
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Диалог настроек бота -->
    <v-dialog v-model="settingsDialog" max-width="600">
      <v-card>
        <v-card-title>Настройки умного помощника</v-card-title>
        <v-card-text>
          <v-form ref="settingsForm" v-model="settingsValid">
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="botSettings.language"
                  :items="languageOptions"
                  label="Язык общения"
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="botSettings.personality"
                  :items="personalityOptions"
                  label="Стиль общения"
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="botSettings.expertise"
                  :items="expertiseOptions"
                  label="Область экспертизы"
                  multiple
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="botSettings.responseSpeed"
                  :items="speedOptions"
                  label="Скорость ответа"
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-checkbox
                  v-model="botSettings.autoSuggestions"
                  label="Автоматические предложения"
                ></v-checkbox>
                <v-checkbox
                  v-model="botSettings.voiceEnabled"
                  label="Голосовое взаимодействие"
                ></v-checkbox>
                <v-checkbox
                  v-model="botSettings.learningEnabled"
                  label="Обучение на основе взаимодействий"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="settingsDialog = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveBotSettings">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог создания отчета -->
    <v-dialog v-model="reportDialog" max-width="800">
      <v-card>
        <v-card-title>Создание отчета</v-card-title>
        <v-card-text>
          <v-form ref="reportForm" v-model="reportFormValid">
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="reportData.type"
                  :items="reportTypeOptions"
                  label="Тип отчета"
                  required
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="reportData.period"
                  :items="reportPeriodOptions"
                  label="Период"
                  required
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-datetime-picker
                  v-model="reportData.startDate"
                  label="Дата начала"
                ></v-datetime-picker>
              </v-col>
              <v-col cols="6">
                <v-datetime-picker
                  v-model="reportData.endDate"
                  label="Дата окончания"
                ></v-datetime-picker>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="reportData.metrics"
                  :items="availableMetrics"
                  label="Метрики для анализа"
                  multiple
                  chips
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="reportData.additionalInfo"
                  label="Дополнительная информация"
                  rows="3"
                  placeholder="Укажите особые требования или детали для отчета..."
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="reportDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="generateReport"
            :loading="generatingReport"
            :disabled="!reportFormValid"
          >
            Создать отчет
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог планирования встречи -->
    <v-dialog v-model="meetingDialog" max-width="600">
      <v-card>
        <v-card-title>Планирование встречи</v-card-title>
        <v-card-text>
          <v-form ref="meetingForm" v-model="meetingFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="meetingData.title"
                  label="Тема встречи"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-datetime-picker
                  v-model="meetingData.startTime"
                  label="Время начала"
                  required
                ></v-datetime-picker>
              </v-col>
              <v-col cols="6">
                <v-datetime-picker
                  v-model="meetingData.endTime"
                  label="Время окончания"
                  required
                ></v-datetime-picker>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="meetingData.participants"
                  :items="availableParticipants"
                  label="Участники"
                  multiple
                  chips
                  required
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="meetingData.description"
                  label="Описание"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="meetingData.location"
                  label="Место проведения"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="meetingDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="scheduleMeeting"
            :loading="schedulingMeeting"
            :disabled="!meetingFormValid"
          >
            Запланировать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'SmartBot',
  data() {
    return {
      // Состояние бота
      isBotActive: true,
      botStatus: 'online',
      isTyping: false,
      
      // Чат
      userMessages: [],
      botMessages: [],
      userInput: '',
      
      // Голосовой ввод
      isRecording: false,
      voiceLevel: 0,
      recordingTime: '00:00',
      recordingInterval: null,
      
      // Диалоги
      settingsDialog: false,
      reportDialog: false,
      meetingDialog: false,
      
      // Формы
      settingsValid: false,
      reportFormValid: false,
      meetingFormValid: false,
      
      // Настройки бота
      botSettings: {
        language: 'ru',
        personality: 'friendly',
        expertise: ['general', 'tasks', 'calendar'],
        responseSpeed: 'normal',
        autoSuggestions: true,
        voiceEnabled: true,
        learningEnabled: true
      },
      
      // Данные отчета
      reportData: {
        type: '',
        period: '',
        startDate: null,
        endDate: null,
        metrics: [],
        additionalInfo: ''
      },
      
      // Данные встречи
      meetingData: {
        title: '',
        startTime: null,
        endTime: null,
        participants: [],
        description: '',
        location: ''
      },
      
      // Загрузка
      generatingReport: false,
      schedulingMeeting: false,
      
      // Опции
      languageOptions: [
        { text: 'Русский', value: 'ru' },
        { text: 'English', value: 'en' },
        { text: 'Español', value: 'es' }
      ],
      
      personalityOptions: [
        { text: 'Дружелюбный', value: 'friendly' },
        { text: 'Профессиональный', value: 'professional' },
        { text: 'Краткий', value: 'concise' },
        { text: 'Подробный', value: 'detailed' }
      ],
      
      expertiseOptions: [
        { text: 'Общие вопросы', value: 'general' },
        { text: 'Управление задачами', value: 'tasks' },
        { text: 'Календарь и встречи', value: 'calendar' },
        { text: 'Аналитика и отчеты', value: 'analytics' },
        { text: 'Обучение и поддержка', value: 'support' }
      ],
      
      speedOptions: [
        { text: 'Медленно', value: 'slow' },
        { text: 'Нормально', value: 'normal' },
        { text: 'Быстро', value: 'fast' }
      ],
      
      reportTypeOptions: [
        { text: 'Отчет по задачам', value: 'tasks' },
        { text: 'Отчет по встречам', value: 'meetings' },
        { text: 'Отчет по продуктивности', value: 'productivity' },
        { text: 'Отчет по времени', value: 'time' },
        { text: 'Кастомный отчет', value: 'custom' }
      ],
      
      reportPeriodOptions: [
        { text: 'Сегодня', value: 'today' },
        { text: 'Вчера', value: 'yesterday' },
        { text: 'Неделя', value: 'week' },
        { text: 'Месяц', value: 'month' },
        { text: 'Квартал', value: 'quarter' },
        { text: 'Год', value: 'year' },
        { text: 'Кастомный период', value: 'custom' }
      ],
      
      availableMetrics: [
        { text: 'Количество задач', value: 'task_count' },
        { text: 'Время выполнения', value: 'completion_time' },
        { text: 'Продуктивность', value: 'productivity' },
        { text: 'Загруженность', value: 'workload' },
        { text: 'Качество работы', value: 'quality' }
      ],
      
      availableParticipants: [
        { text: 'Иван Петров', value: 'user1' },
        { text: 'Мария Сидорова', value: 'user2' },
        { text: 'Алексей Козлов', value: 'user3' }
      ],
      
      // Быстрые действия
      quickActions: [
        {
          id: 'help',
          text: 'Помощь',
          icon: 'mdi-help-circle',
          color: 'info',
          variant: 'outlined'
        },
        {
          id: 'report',
          text: 'Создать отчет',
          icon: 'mdi-chart-line',
          color: 'success',
          variant: 'outlined'
        },
        {
          id: 'meeting',
          text: 'Запланировать встречу',
          icon: 'mdi-calendar-plus',
          color: 'primary',
          variant: 'outlined'
        },
        {
          id: 'learn',
          text: 'Обучение',
          icon: 'mdi-school',
          color: 'warning',
          variant: 'outlined'
        }
      ]
    };
  },
  
  mounted() {
    this.initializeBot();
    this.loadBotSettings();
  },
  
  beforeDestroy() {
    this.cleanup();
  },
  
  methods: {
    // Инициализация бота
    async initializeBot() {
      try {
        // Проверка доступности
        await this.checkBotAvailability();
        
        // Загрузка контекста пользователя
        await this.loadUserContext();
        
        // Инициализация голосового ввода
        if (this.botSettings.voiceEnabled) {
          this.initializeVoiceInput();
        }
        
        console.log('Бот инициализирован');
        
      } catch (error) {
        console.error('Ошибка инициализации бота:', error);
        this.botStatus = 'offline';
      }
    },
    
    // Проверка доступности бота
    async checkBotAvailability() {
      // Здесь должна быть проверка API
      return true;
    },
    
    // Загрузка контекста пользователя
    async loadUserContext() {
      try {
        // Загрузка профиля пользователя
        const profile = await this.$api.getProfile();
        
        // Загрузка предпочтений
        const preferences = await this.$api.getUserPreferences();
        
        // Применение контекста
        this.applyUserContext(profile, preferences);
        
      } catch (error) {
        console.error('Ошибка загрузки контекста:', error);
      }
    },
    
    // Применение контекста пользователя
    applyUserContext(profile, preferences) {
      // Настройка языка
      if (preferences.language) {
        this.botSettings.language = preferences.language;
      }
      
      // Настройка стиля общения
      if (preferences.communicationStyle) {
        this.botSettings.personality = preferences.communicationStyle;
      }
      
      // Настройка экспертизы
      if (preferences.expertise) {
        this.botSettings.expertise = preferences.expertise;
      }
    },
    
    // Инициализация голосового ввода
    initializeVoiceInput() {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        console.log('Голосовой ввод доступен');
      } else {
        console.log('Голосовой ввод недоступен');
        this.botSettings.voiceEnabled = false;
      }
    },
    
    // Переключение бота
    toggleBot() {
      this.isBotActive = !this.isBotActive;
      
      if (this.isBotActive) {
        this.botStatus = 'online';
        this.showBotMessage('Бот снова активен! Чем могу помочь?');
      } else {
        this.botStatus = 'offline';
        this.showBotMessage('Бот приостановлен. Для возобновления нажмите кнопку "Включить".');
      }
    },
    
    // Отправка сообщения
    async sendMessage() {
      if (!this.userInput.trim() || !this.isBotActive) return;
      
      const message = {
        id: Date.now(),
        text: this.userInput.trim(),
        timestamp: new Date()
      };
      
      // Добавление сообщения пользователя
      this.userMessages.push(message);
      this.userInput = '';
      
      // Прокрутка к последнему сообщению
      this.scrollToBottom();
      
      // Имитация печати бота
      this.isTyping = true;
      
      // Обработка сообщения
      setTimeout(() => {
        this.processUserMessage(message);
        this.isTyping = false;
      }, 1000);
    },
    
    // Обработка сообщения пользователя
    async processUserMessage(message) {
      try {
        // Анализ намерения пользователя
        const intent = this.analyzeIntent(message.text);
        
        // Генерация ответа
        const response = await this.generateBotResponse(intent, message.text);
        
        // Показ ответа
        this.showBotMessage(response.text, response.actions);
        
        // Обучение бота
        if (this.botSettings.learningEnabled) {
          this.learnFromInteraction(message, response);
        }
        
      } catch (error) {
        console.error('Ошибка обработки сообщения:', error);
        this.showBotMessage('Извините, произошла ошибка. Попробуйте еще раз.');
      }
    },
    
    // Анализ намерения пользователя
    analyzeIntent(text) {
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('отчет') || lowerText.includes('анализ')) {
        return 'report';
      } else if (lowerText.includes('встреча') || lowerText.includes('планирование')) {
        return 'meeting';
      } else if (lowerText.includes('задача') || lowerText.includes('todo')) {
        return 'task';
      } else if (lowerText.includes('помощь') || lowerText.includes('help')) {
        return 'help';
      } else if (lowerText.includes('обучение') || lowerText.includes('учить')) {
        return 'learning';
      } else {
        return 'general';
      }
    },
    
    // Генерация ответа бота
    async generateBotResponse(intent, userText) {
      const responses = {
        report: {
          text: 'Я помогу создать отчет! Выберите тип отчета и период.',
          actions: [
            {
              id: 'create_report',
              text: 'Создать отчет',
              icon: 'mdi-chart-line',
              color: 'success'
            }
          ]
        },
        meeting: {
          text: 'Давайте запланируем встречу! Укажите детали.',
          actions: [
            {
              id: 'schedule_meeting',
              text: 'Запланировать встречу',
              icon: 'mdi-calendar-plus',
              color: 'primary'
            }
          ]
        },
        task: {
          text: 'Расскажите о задаче, которую нужно создать.',
          actions: [
            {
              id: 'create_task',
              text: 'Создать задачу',
              icon: 'mdi-checkbox-marked-circle',
              color: 'success'
            }
          ]
        },
        help: {
          text: 'Я могу помочь с созданием отчетов, планированием встреч, управлением задачами и обучением. Что именно вас интересует?',
          actions: [
            {
              id: 'show_help',
              text: 'Показать справку',
              icon: 'mdi-help-circle',
              color: 'info'
            }
          ]
        },
        learning: {
          text: 'Отлично! Я помогу вам освоить систему HELPER. С чего начнем?',
          actions: [
            {
              id: 'start_tutorial',
              text: 'Начать обучение',
              icon: 'mdi-school',
              color: 'warning'
            }
          ]
        },
        general: {
          text: 'Я понимаю ваш вопрос. Давайте разберем его подробнее или выберите одно из быстрых действий.',
          actions: []
        }
      };
      
      return responses[intent] || responses.general;
    },
    
    // Показ сообщения бота
    showBotMessage(text, actions = []) {
      const message = {
        id: Date.now(),
        text: text,
        timestamp: new Date(),
        actions: actions
      };
      
      this.botMessages.push(message);
      this.scrollToBottom();
    },
    
    // Выполнение действия бота
    executeBotAction(action) {
      switch (action.id) {
        case 'create_report':
          this.reportDialog = true;
          break;
        case 'schedule_meeting':
          this.meetingDialog = true;
          break;
        case 'create_task':
          this.createTaskFromBot();
          break;
        case 'show_help':
          this.showHelp();
          break;
        case 'start_tutorial':
          this.startTutorial();
          break;
      }
    },
    
    // Выполнение быстрого действия
    executeQuickAction(action) {
      switch (action.id) {
        case 'help':
          this.showHelp();
          break;
        case 'report':
          this.reportDialog = true;
          break;
        case 'meeting':
          this.meetingDialog = true;
          break;
        case 'learn':
          this.startTutorial();
          break;
      }
    },
    
    // Переключение голосового ввода
    async toggleVoiceInput() {
      if (this.isRecording) {
        this.stopVoiceRecording();
      } else {
        await this.startVoiceRecording();
      }
    },
    
    // Начало голосовой записи
    async startVoiceRecording() {
      try {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          
          recognition.lang = this.botSettings.language === 'ru' ? 'ru-RU' : 'en-US';
          recognition.continuous = false;
          recognition.interimResults = true;
          
          recognition.onstart = () => {
            this.isRecording = true;
            this.startVoiceTimer();
          };
          
          recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
              .map(result => result[0])
              .map(result => result.transcript)
              .join('');
            
            this.userInput = transcript;
          };
          
          recognition.onend = () => {
            this.stopVoiceRecording();
            if (this.userInput.trim()) {
              this.sendMessage();
            }
          };
          
          recognition.start();
          
        } else {
          throw new Error('Speech Recognition не поддерживается');
        }
        
      } catch (error) {
        console.error('Ошибка голосового ввода:', error);
        this.showBotMessage('Голосовой ввод недоступен в вашем браузере.');
      }
    },
    
    // Остановка голосовой записи
    stopVoiceRecording() {
      this.isRecording = false;
      this.stopVoiceTimer();
    },
    
    // Таймер голосовой записи
    startVoiceTimer() {
      let seconds = 0;
      this.recordingInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        this.recordingTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        // Имитация уровня голоса
        this.voiceLevel = Math.random() * 100;
      }, 1000);
    },
    
    // Остановка таймера голосовой записи
    stopVoiceTimer() {
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
        this.recordingTime = '00:00';
        this.voiceLevel = 0;
      }
    },
    
    // Создание задачи от бота
    createTaskFromBot() {
      this.showBotMessage('Расскажите о задаче, которую нужно создать. Например: "Создать задачу на разработку нового модуля до пятницы".');
    },
    
    // Показ справки
    showHelp() {
      const helpText = `
        <h4>Возможности бота:</h4>
        <ul>
          <li><strong>Создание отчетов</strong> - аналитика по задачам, встречам, продуктивности</li>
          <li><strong>Планирование встреч</strong> - автоматическое планирование с учетом расписания</li>
          <li><strong>Управление задачами</strong> - создание, редактирование, отслеживание</li>
          <li><strong>Обучение</strong> - интерактивные туториалы по системе</li>
          <li><strong>Поддержка</strong> - ответы на вопросы и решение проблем</li>
        </ul>
        <p>Просто опишите, что вам нужно, и я помогу!</p>
      `;
      
      this.showBotMessage(helpText);
    },
    
    // Начало обучения
    startTutorial() {
      this.showBotMessage('Отлично! Начнем обучение. Выберите тему:');
      
      setTimeout(() => {
        this.showBotMessage('', [
          {
            id: 'tutorial_basics',
            text: 'Основы системы',
            icon: 'mdi-book-open',
            color: 'primary'
          },
          {
            id: 'tutorial_tasks',
            text: 'Управление задачами',
            icon: 'mdi-checkbox-marked-circle',
            color: 'success'
          },
          {
            id: 'tutorial_calendar',
            text: 'Работа с календарем',
            icon: 'mdi-calendar',
            color: 'info'
          }
        ]);
      }, 1000);
    },
    
    // Генерация отчета
    async generateReport() {
      if (!this.$refs.reportForm.validate()) return;
      
      this.generatingReport = true;
      
      try {
        // Здесь должна быть логика генерации отчета
        const report = await this.$api.generateReport(this.reportData);
        
        this.showBotMessage(`Отчет "${this.reportData.type}" успешно создан!`);
        this.reportDialog = false;
        
        // Сброс формы
        this.resetReportForm();
        
      } catch (error) {
        console.error('Ошибка генерации отчета:', error);
        this.showBotMessage('Ошибка при создании отчета. Попробуйте еще раз.');
      } finally {
        this.generatingReport = false;
      }
    },
    
    // Планирование встречи
    async scheduleMeeting() {
      if (!this.$refs.meetingForm.validate()) return;
      
      this.schedulingMeeting = true;
      
      try {
        // Здесь должна быть логика планирования встречи
        const meeting = await this.$api.scheduleMeeting(this.meetingData);
        
        this.showBotMessage(`Встреча "${this.meetingData.title}" успешно запланирована!`);
        this.meetingDialog = false;
        
        // Сброс формы
        this.resetMeetingForm();
        
      } catch (error) {
        console.error('Ошибка планирования встречи:', error);
        this.showBotMessage('Ошибка при планировании встречи. Попробуйте еще раз.');
      } finally {
        this.schedulingMeeting = false;
      }
    },
    
    // Сохранение настроек бота
    saveBotSettings() {
      if (!this.$refs.settingsForm.validate()) return;
      
      try {
        // Сохранение в localStorage
        localStorage.setItem('botSettings', JSON.stringify(this.botSettings));
        
        // Отправка на сервер
        this.$api.updateBotSettings(this.botSettings).catch(console.error);
        
        this.showBotMessage('Настройки бота сохранены!');
        this.settingsDialog = false;
        
      } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        this.showBotMessage('Ошибка при сохранении настроек.');
      }
    },
    
    // Загрузка настроек бота
    loadBotSettings() {
      try {
        const saved = localStorage.getItem('botSettings');
        if (saved) {
          this.botSettings = { ...this.botSettings, ...JSON.parse(saved) };
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
      }
    },
    
    // Обучение на основе взаимодействий
    learnFromInteraction(userMessage, botResponse) {
      try {
        // Сохранение паттерна взаимодействия
        const interaction = {
          userInput: userMessage.text,
          botResponse: botResponse.text,
          timestamp: new Date().toISOString(),
          intent: this.analyzeIntent(userMessage.text)
        };
        
        // Сохранение в localStorage
        const interactions = JSON.parse(localStorage.getItem('botInteractions') || '[]');
        interactions.push(interaction);
        localStorage.setItem('botInteractions', JSON.stringify(interactions));
        
        // Отправка на сервер для анализа
        this.$api.saveBotInteraction(interaction).catch(console.error);
        
      } catch (error) {
        console.error('Ошибка обучения:', error);
      }
    },
    
    // Сброс формы отчета
    resetReportForm() {
      this.reportData = {
        type: '',
        period: '',
        startDate: null,
        endDate: null,
        metrics: [],
        additionalInfo: ''
      };
      this.$refs.reportForm.resetValidation();
    },
    
    // Сброс формы встречи
    resetMeetingForm() {
      this.meetingData = {
        title: '',
        startTime: null,
        endTime: null,
        participants: [],
        description: '',
        location: ''
      };
      this.$refs.meetingForm.resetValidation();
    },
    
    // Прокрутка к последнему сообщению
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    
    // Получение текущего времени
    getCurrentTime() {
      return new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // Форматирование времени
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // Очистка ресурсов
    cleanup() {
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
      }
    }
  }
};
</script>

<style scoped>
.smart-bot-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.bot-header {
  flex-shrink: 0;
  border-radius: 0;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #ffffff;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  align-items: flex-start;
  max-width: 80%;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bot-message {
  align-self: flex-start;
}

.message-content {
  background: #f0f0f0;
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 100%;
}

.user-message .message-content {
  background: #1976d2;
  color: white;
}

.message-text {
  margin-bottom: 4px;
  line-height: 1.4;
}

.message-time {
  font-size: 12px;
  color: #666;
  opacity: 0.8;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-actions {
  margin-top: 8px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.quick-actions {
  flex-shrink: 0;
  border-radius: 0;
}

.input-container {
  flex-shrink: 0;
  border-radius: 0;
}

.voice-indicator {
  padding: 0 16px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .message {
    max-width: 90%;
  }
  
  .chat-container {
    padding: 12px;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .smart-bot-container {
    background: #121212;
  }
  
  .chat-container {
    background: #1e1e1e;
  }
  
  .message-content {
    background: #2d2d2d;
    color: #ffffff;
  }
  
  .quick-actions,
  .input-container {
    background: #1e1e1e;
  }
}
</style> 