<template>
  <div class="voice-interface">
    <!-- Основная кнопка голосового управления -->
    <v-btn
      :color="isListening ? 'error' : 'primary'"
      :icon="!isExpanded"
      :fab="!isExpanded"
      :class="[
        'voice-control-btn',
        { 'listening': isListening, 'expanded': isExpanded }
      ]"
      @click="toggleVoiceControl"
      :aria-label="isListening ? 'Остановить голосовое управление' : 'Включить голосовое управление'"
    >
      <v-icon v-if="!isListening">mdi-microphone</v-icon>
      <v-icon v-else>mdi-microphone-off</v-icon>
      
      <span v-if="isExpanded" class="ml-2">
        {{ isListening ? 'Остановить' : 'Голосовое управление' }}
      </span>
    </v-btn>

    <!-- Расширенная панель управления -->
    <v-expand-transition>
      <div v-if="isExpanded" class="voice-panel">
        <v-card class="voice-control-panel" elevation="8">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-microphone</v-icon>
            Голосовое управление
            <v-spacer></v-spacer>
            <v-btn icon @click="isExpanded = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Статус распознавания -->
            <div class="voice-status-section">
              <v-alert
                :type="isListening ? 'info' : 'success'"
                :icon="isListening ? 'mdi-microphone' : 'mdi-microphone-off'"
                class="mb-4"
              >
                {{ isListening ? 'Слушаю команды...' : 'Голосовое управление готово' }}
              </v-alert>

              <!-- Визуализация звука -->
              <div v-if="isListening" class="voice-visualization">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="voice-bar"
                  :style="{ animationDelay: `${i * 0.1}s` }"
                ></div>
              </div>
            </div>

            <!-- Настройки голоса -->
            <v-expansion-panels class="mb-4">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-cog</v-icon>
                  Настройки голоса
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="voiceSettings.language"
                        label="Язык распознавания"
                        :items="availableLanguages"
                        @change="updateVoiceSettings"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="voiceSettings.voiceType"
                        label="Тип голоса"
                        :items="availableVoices"
                        @change="updateVoiceSettings"
                      ></v-col>
                    </v-col>
                  </v-row>
                  
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-slider
                        v-model="voiceSettings.volume"
                        label="Громкость"
                        min="0"
                        max="100"
                        thumb-label
                        @change="updateVoiceSettings"
                      ></v-slider>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-slider
                        v-model="voiceSettings.speed"
                        label="Скорость речи"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        thumb-label
                        @change="updateVoiceSettings"
                      ></v-col>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Доступные команды -->
            <v-expansion-panels class="mb-4">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
                  Доступные команды
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="commands-list">
                    <div
                      v-for="category in voiceCommands"
                      :key="category.name"
                      class="command-category"
                    >
                      <h4 class="command-category-title">{{ category.title }}</h4>
                      <div class="command-items">
                        <div
                          v-for="command in category.commands"
                          :key="command.phrase"
                          class="command-item"
                        >
                          <v-chip
                            :color="command.active ? 'success' : 'grey'"
                            small
                            class="mr-2"
                          >
                            {{ command.active ? 'Активна' : 'Неактивна' }}
                          </v-chip>
                          <span class="command-phrase">"{{ command.phrase }}"</span>
                          <span class="command-description">- {{ command.description }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- История команд -->
            <v-expansion-panels class="mb-4">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-history</v-icon>
                  История команд
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="command-history">
                    <div
                      v-for="(command, index) in commandHistory"
                      :key="index"
                      class="history-item"
                      :class="{ 'success': command.success, 'error': !command.success }"
                    >
                      <div class="history-time">
                        {{ formatTime(command.timestamp) }}
                      </div>
                      <div class="history-command">
                        "{{ command.phrase }}"
                      </div>
                      <div class="history-result">
                        {{ command.result }}
                      </div>
                    </div>
                    
                    <v-btn
                      v-if="commandHistory.length > 0"
                      text
                      color="primary"
                      @click="clearHistory"
                      class="mt-2"
                    >
                      Очистить историю
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Тестирование голоса -->
            <v-card outlined class="mb-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-test-tube</v-icon>
                Тестирование голоса
              </v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="testText"
                  label="Текст для озвучивания"
                  placeholder="Введите текст для тестирования голоса"
                  outlined
                  dense
                ></v-text-field>
                
                <v-btn
                  color="primary"
                  @click="testVoice"
                  :disabled="!testText"
                  class="mr-2"
                >
                  <v-icon left>mdi-volume-high</v-icon>
                  Озвучить
                </v-btn>
                
                <v-btn
                  color="secondary"
                  @click="testRecognition"
                  :disabled="isListening"
                >
                  <v-icon left>mdi-microphone</v-icon>
                  Тест распознавания
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- Статистика использования -->
            <v-card outlined>
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-line</v-icon>
                Статистика использования
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6">
                    <div class="stat-item">
                      <div class="stat-value">{{ voiceStats.totalCommands }}</div>
                      <div class="stat-label">Всего команд</div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="stat-item">
                      <div class="stat-value">{{ voiceStats.successRate }}%</div>
                      <div class="stat-label">Успешность</div>
                    </div>
                  </v-col>
                </v-row>
                
                <v-row>
                  <v-col cols="6">
                    <div class="stat-item">
                      <div class="stat-value">{{ voiceStats.totalTime }}ч</div>
                      <div class="stat-label">Время использования</div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="stat-item">
                      <div class="stat-value">{{ voiceStats.favoriteCommand }}</div>
                      <div class="stat-label">Любимая команда</div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>

    <!-- Уведомления -->
    <v-snackbar
      v-model="showNotification"
      :color="notificationColor"
      :timeout="3000"
      top
      right
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

    <!-- Модальное окно обучения -->
    <v-dialog v-model="showTrainingModal" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-school</v-icon>
          Обучение голосовому управлению
        </v-card-title>
        
        <v-card-text>
          <p>Следуйте инструкциям для настройки голосового управления:</p>
          
          <div class="training-steps">
            <div
              v-for="(step, index) in trainingSteps"
              :key="index"
              class="training-step"
              :class="{ 'active': currentTrainingStep === index, 'completed': index < currentTrainingStep }"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <h4>{{ step.title }}</h4>
                <p>{{ step.description }}</p>
              </div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            v-if="currentTrainingStep > 0"
            text
            @click="previousTrainingStep"
          >
            Назад
          </v-btn>
          
          <v-btn
            v-if="currentTrainingStep < trainingSteps.length - 1"
            color="primary"
            @click="nextTrainingStep"
          >
            Далее
          </v-btn>
          
          <v-btn
            v-else
            color="success"
            @click="completeTraining"
          >
            Завершить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'VoiceInterface',
  
  setup() {
    const authStore = useAuthStore();
    
    // Состояние компонента
    const isExpanded = ref(false);
    const isListening = ref(false);
    const showNotification = ref(false);
    const notificationMessage = ref('');
    const notificationColor = ref('info');
    const showTrainingModal = ref(false);
    const currentTrainingStep = ref(0);
    const testText = ref('');
    
    // Настройки голоса
    const voiceSettings = reactive({
      language: 'ru-RU',
      voiceType: 'female',
      volume: 80,
      speed: 1.0,
      autoStart: false,
      continuous: true
    });
    
    // Доступные языки
    const availableLanguages = [
      { text: 'Русский', value: 'ru-RU' },
      { text: 'English', value: 'en-US' },
      { text: 'Deutsch', value: 'de-DE' },
      { text: 'Français', value: 'fr-FR' },
      { text: 'Español', value: 'es-ES' }
    ];
    
    // Доступные голоса
    const availableVoices = [
      { text: 'Женский', value: 'female' },
      { text: 'Мужской', value: 'male' },
      { text: 'Нейтральный', value: 'neutral' }
    ];
    
    // Голосовые команды
    const voiceCommands = ref([
      {
        name: 'navigation',
        title: 'Навигация',
        commands: [
          {
            phrase: 'открыть дашборд',
            description: 'Перейти на главную страницу',
            action: 'navigate',
            target: '/dashboard',
            active: true
          },
          {
            phrase: 'открыть задачи',
            description: 'Перейти к списку задач',
            action: 'navigate',
            target: '/tasks',
            active: true
          },
          {
            phrase: 'открыть клиенты',
            description: 'Перейти к списку клиентов',
            action: 'navigate',
            target: '/clients',
            active: true
          },
          {
            phrase: 'открыть аналитику',
            description: 'Перейти к аналитике',
            action: 'navigate',
            target: '/analytics',
            active: true
          }
        ]
      },
      {
        name: 'actions',
        title: 'Действия',
        commands: [
          {
            phrase: 'создать задачу',
            description: 'Открыть форму создания задачи',
            action: 'create',
            target: 'task',
            active: true
          },
          {
            phrase: 'добавить клиента',
            description: 'Открыть форму добавления клиента',
            action: 'create',
            target: 'client',
            active: true
          },
          {
            phrase: 'сохранить',
            description: 'Сохранить текущую форму',
            action: 'save',
            target: null,
            active: true
          },
          {
            phrase: 'отменить',
            description: 'Отменить текущее действие',
            action: 'cancel',
            target: null,
            active: true
          }
        ]
      },
      {
        name: 'system',
        title: 'Система',
        commands: [
          {
            phrase: 'включить темную тему',
            description: 'Переключить на темную тему',
            action: 'theme',
            target: 'dark',
            active: true
          },
          {
            phrase: 'включить светлую тему',
            description: 'Переключить на светлую тему',
            action: 'theme',
            target: 'light',
            active: true
          },
          {
            phrase: 'увеличить шрифт',
            description: 'Увеличить размер шрифта',
            action: 'font',
            target: 'increase',
            active: true
          },
          {
            phrase: 'уменьшить шрифт',
            description: 'Уменьшить размер шрифта',
            action: 'font',
            target: 'decrease',
            active: true
          }
        ]
      }
    ]);
    
    // История команд
    const commandHistory = ref([]);
    
    // Статистика использования
    const voiceStats = reactive({
      totalCommands: 0,
      successRate: 95,
      totalTime: 12.5,
      favoriteCommand: 'открыть дашборд'
    });
    
    // Шаги обучения
    const trainingSteps = ref([
      {
        title: 'Проверка микрофона',
        description: 'Убедитесь, что микрофон подключен и работает'
      },
      {
        title: 'Настройка языка',
        description: 'Выберите язык для распознавания речи'
      },
      {
        title: 'Тестирование распознавания',
        description: 'Произнесите простую команду для проверки'
      },
      {
        title: 'Настройка голоса',
        description: 'Выберите тип и настройки голоса'
      },
      {
        title: 'Завершение',
        description: 'Обучение завершено! Можете использовать голосовое управление'
      }
    ]);
    
    // Web Speech API объекты
    let recognition = null;
    let synthesis = null;
    let voices = [];
    
    // Инициализация голосового управления
    const initVoiceControl = () => {
      // Проверяем поддержку Web Speech API
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotificationMessage('Ваш браузер не поддерживает голосовое управление', 'error');
        return false;
      }
      
      if (!('speechSynthesis' in window)) {
        showNotificationMessage('Ваш браузер не поддерживает синтез речи', 'error');
        return false;
      }
      
      // Инициализация распознавания речи
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      
      recognition.continuous = voiceSettings.continuous;
      recognition.interimResults = false;
      recognition.lang = voiceSettings.language;
      
      // Обработчики событий распознавания
      recognition.onstart = () => {
        isListening.value = true;
        showNotificationMessage('Голосовое управление активно', 'success');
      };
      
      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.toLowerCase().trim();
        
        // Добавляем в историю
        addToHistory(transcript, 'Распознано');
        
        // Обрабатываем команду
        processVoiceCommand(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening.value = false;
        
        let errorMessage = 'Ошибка распознавания речи';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Речь не обнаружена';
            break;
          case 'audio-capture':
            errorMessage = 'Ошибка захвата аудио';
            break;
          case 'not-allowed':
            errorMessage = 'Доступ к микрофону запрещен';
            break;
        }
        
        showNotificationMessage(errorMessage, 'error');
      };
      
      recognition.onend = () => {
        isListening.value = false;
        
        // Автоматически перезапускаем если включен continuous режим
        if (voiceSettings.continuous && voiceSettings.autoStart) {
          setTimeout(() => {
            startRecognition();
          }, 1000);
        }
      };
      
      // Инициализация синтеза речи
      synthesis = window.speechSynthesis;
      
      // Загружаем доступные голоса
      synthesis.onvoiceschanged = () => {
        voices = synthesis.getVoices();
      };
      
      return true;
    };
    
    // Запуск распознавания
    const startRecognition = () => {
      if (recognition && !isListening.value) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to start recognition:', error);
          showNotificationMessage('Не удалось запустить распознавание', 'error');
        }
      }
    };
    
    // Остановка распознавания
    const stopRecognition = () => {
      if (recognition && isListening.value) {
        recognition.stop();
      }
    };
    
    // Переключение голосового управления
    const toggleVoiceControl = () => {
      if (isListening.value) {
        stopRecognition();
      } else {
        if (!recognition) {
          if (!initVoiceControl()) {
            return;
          }
        }
        startRecognition();
      }
    };
    
    // Обработка голосовой команды
    const processVoiceCommand = (command) => {
      let commandExecuted = false;
      
      // Ищем команду в списке
      for (const category of voiceCommands.value) {
        for (const cmd of category.commands) {
          if (cmd.active && command.includes(cmd.phrase)) {
            executeCommand(cmd);
            commandExecuted = true;
            break;
          }
        }
        if (commandExecuted) break;
      }
      
      if (!commandExecuted) {
        showNotificationMessage(`Команда "${command}" не распознана`, 'warning');
        addToHistory(command, 'Не распознана');
      }
    };
    
    // Выполнение команды
    const executeCommand = (command) => {
      try {
        switch (command.action) {
          case 'navigate':
            // Навигация
            window.location.href = command.target;
            speak(`Перехожу на ${command.target}`);
            break;
            
          case 'create':
            // Создание
            emit('create-item', command.target);
            speak(`Создаю ${command.target}`);
            break;
            
          case 'save':
            // Сохранение
            emit('save');
            speak('Сохраняю');
            break;
            
          case 'cancel':
            // Отмена
            emit('cancel');
            speak('Отменяю');
            break;
            
          case 'theme':
            // Смена темы
            emit('change-theme', command.target);
            speak(`Переключаю на ${command.target} тему`);
            break;
            
          case 'font':
            // Изменение шрифта
            emit('change-font', command.target);
            speak(`${command.target === 'increase' ? 'Увеличиваю' : 'Уменьшаю'} шрифт`);
            break;
        }
        
        addToHistory(command.phrase, 'Выполнено');
        voiceStats.totalCommands++;
        
      } catch (error) {
        console.error('Command execution error:', error);
        showNotificationMessage('Ошибка выполнения команды', 'error');
        addToHistory(command.phrase, 'Ошибка');
      }
    };
    
    // Озвучивание текста
    const speak = (text) => {
      if (!synthesis) return;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceSettings.language;
      utterance.volume = voiceSettings.volume / 100;
      utterance.rate = voiceSettings.speed;
      
      // Выбираем голос
      const voice = voices.find(v => 
        v.lang.startsWith(voiceSettings.language.split('-')[0]) &&
        (voiceSettings.voiceType === 'female' ? v.name.includes('Female') : 
         voiceSettings.voiceType === 'male' ? v.name.includes('Male') : true)
      );
      
      if (voice) {
        utterance.voice = voice;
      }
      
      synthesis.speak(utterance);
    };
    
    // Тестирование голоса
    const testVoice = () => {
      if (testText.value) {
        speak(testText.value);
      }
    };
    
    // Тестирование распознавания
    const testRecognition = () => {
      if (!isListening.value) {
        startRecognition();
        speak('Произнесите команду для тестирования');
      }
    };
    
    // Добавление в историю
    const addToHistory = (phrase, result) => {
      commandHistory.value.unshift({
        phrase,
        result,
        timestamp: new Date(),
        success: result === 'Выполнено'
      });
      
      // Ограничиваем историю
      if (commandHistory.value.length > 50) {
        commandHistory.value = commandHistory.value.slice(0, 50);
      }
    };
    
    // Очистка истории
    const clearHistory = () => {
      commandHistory.value = [];
    };
    
    // Форматирование времени
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('ru-RU');
    };
    
    // Показать уведомление
    const showNotificationMessage = (message, color = 'info') => {
      notificationMessage.value = message;
      notificationColor.value = color;
      showNotification.value = true;
    };
    
    // Обновление настроек голоса
    const updateVoiceSettings = () => {
      if (recognition) {
        recognition.lang = voiceSettings.language;
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('voice-settings', JSON.stringify(voiceSettings));
      
      // Сохраняем в кэш
      authStore.setCachedData('voice_settings', voiceSettings, 86400, 'user');
    };
    
    // Обучение
    const startTraining = () => {
      showTrainingModal.value = true;
      currentTrainingStep.value = 0;
    };
    
    const nextTrainingStep = () => {
      if (currentTrainingStep.value < trainingSteps.length - 1) {
        currentTrainingStep.value++;
      }
    };
    
    const previousTrainingStep = () => {
      if (currentTrainingStep.value > 0) {
        currentTrainingStep.value--;
      }
    };
    
    const completeTraining = () => {
      showTrainingModal.value = false;
      voiceSettings.autoStart = true;
      updateVoiceSettings();
      showNotificationMessage('Обучение завершено!', 'success');
    };
    
    // Загрузка настроек
    const loadSettings = async () => {
      try {
        // Из localStorage
        const saved = localStorage.getItem('voice-settings');
        if (saved) {
          Object.assign(voiceSettings, JSON.parse(saved));
        }
        
        // Из кэша
        const cached = await authStore.getCachedData('voice_settings', 'user');
        if (cached) {
          Object.assign(voiceSettings, cached);
        }
      } catch (error) {
        console.error('Failed to load voice settings:', error);
      }
    };
    
    // Жизненный цикл
    onMounted(() => {
      loadSettings();
      initVoiceControl();
    });
    
    onUnmounted(() => {
      if (recognition) {
        recognition.stop();
      }
      if (synthesis) {
        synthesis.cancel();
      }
    });
    
    return {
      isExpanded,
      isListening,
      showNotification,
      notificationMessage,
      notificationColor,
      showTrainingModal,
      currentTrainingStep,
      testText,
      voiceSettings,
      availableLanguages,
      availableVoices,
      voiceCommands,
      commandHistory,
      voiceStats,
      trainingSteps,
      toggleVoiceControl,
      testVoice,
      testRecognition,
      clearHistory,
      formatTime,
      updateVoiceSettings,
      startTraining,
      nextTrainingStep,
      previousTrainingStep,
      completeTraining
    };
  }
};
</script>

<style scoped>
.voice-interface {
  position: relative;
}

.voice-control-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  transition: all 0.3s ease;
}

.voice-control-btn.listening {
  animation: pulse 1.5s infinite;
}

.voice-control-btn.expanded {
  border-radius: 25px;
  padding: 0 20px;
}

.voice-panel {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 999;
  max-width: 400px;
}

.voice-control-panel {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.voice-status-section {
  text-align: center;
}

.voice-visualization {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 60px;
  gap: 4px;
}

.voice-bar {
  width: 8px;
  background-color: #1976d2;
  border-radius: 4px;
  animation: voiceWave 1s ease-in-out infinite;
}

@keyframes voiceWave {
  0%, 100% { height: 20px; }
  50% { height: 40px; }
}

.commands-list {
  max-height: 300px;
  overflow-y: auto;
}

.command-category {
  margin-bottom: 20px;
}

.command-category-title {
  margin-bottom: 12px;
  color: #1976d2;
  font-size: 16px;
}

.command-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.command-phrase {
  font-weight: 500;
  margin-right: 8px;
}

.command-description {
  color: #666;
  font-size: 14px;
}

.command-history {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  border-left: 4px solid #ccc;
}

.history-item.success {
  border-left-color: #4CAF50;
  background-color: #f1f8e9;
}

.history-item.error {
  border-left-color: #f44336;
  background-color: #ffebee;
}

.history-time {
  font-size: 12px;
  color: #666;
  min-width: 80px;
}

.history-command {
  font-weight: 500;
  flex: 1;
  margin: 0 12px;
}

.history-result {
  font-size: 12px;
  color: #666;
}

.stat-item {
  text-align: center;
  padding: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1976d2;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.training-steps {
  margin-top: 20px;
}

.training-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.training-step.active {
  border-color: #1976d2;
  background-color: #e3f2fd;
}

.training-step.completed {
  border-color: #4CAF50;
  background-color: #f1f8e9;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 16px;
  flex-shrink: 0;
}

.training-step.completed .step-number {
  background-color: #4CAF50;
}

.step-content h4 {
  margin: 0 0 8px 0;
  color: #1976d2;
}

.step-content p {
  margin: 0;
  color: #666;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .voice-panel {
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .voice-control-panel {
    font-size: 14px;
  }
  
  .command-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .history-time,
  .history-result {
    margin-bottom: 4px;
  }
}
</style> 