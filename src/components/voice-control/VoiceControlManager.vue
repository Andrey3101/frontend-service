<template>
  <div class="voice-control-manager">
    <!-- Основная панель голосового управления -->
    <v-card class="voice-panel" elevation="4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" :color="isListening ? 'error' : 'success'">
          {{ isListening ? 'mdi-microphone' : 'mdi-microphone-off' }}
        </v-icon>
        Голосовое управление
        <v-spacer></v-spacer>
        <v-chip
          :color="isListening ? 'error' : 'success'"
          small
        >
          {{ isListening ? 'Слушаю...' : 'Готов к работе' }}
        </v-chip>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <div class="voice-status">
              <h4>Статус:</h4>
              <p><strong>Язык:</strong> {{ currentLanguage }}</p>
              <p><strong>Режим:</strong> {{ voiceMode }}</p>
              <p><strong>Чувствительность:</strong> {{ sensitivity }}%</p>
              <p><strong>Команды за сессию:</strong> {{ commandsCount }}</p>
            </div>
          </v-col>
          
          <v-col cols="12" md="6">
            <div class="voice-controls">
              <v-btn
                :color="isListening ? 'error' : 'success'"
                :loading="isInitializing"
                @click="toggleVoiceControl"
                block
                large
                class="mb-3"
              >
                <v-icon left>
                  {{ isListening ? 'mdi-stop' : 'mdi-microphone' }}
                </v-icon>
                {{ isListening ? 'Остановить' : 'Начать слушать' }}
              </v-btn>
              
              <v-btn
                color="secondary"
                @click="showSettings = true"
                block
                outlined
              >
                <v-icon left>mdi-cog</v-icon>
                Настройки
              </v-btn>
            </div>
          </v-col>
        </v-row>
        
        <!-- Индикатор уровня звука -->
        <div v-if="isListening" class="voice-level-indicator">
          <div class="level-bars">
            <div
              v-for="i in 10"
              :key="i"
              class="level-bar"
              :class="{ active: i <= currentLevel }"
              :style="{ animationDelay: `${i * 0.1}s` }"
            ></div>
          </div>
          <p class="text-center mt-2">Уровень звука: {{ currentLevel * 10 }}%</p>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Панель команд -->
    <v-card class="commands-panel mt-4" elevation="2">
      <v-card-title>
        <v-icon class="mr-2" color="primary">mdi-format-list-bulleted</v-icon>
        Доступные команды
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="refreshCommands"
          :loading="isRefreshingCommands"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col v-for="category in commandCategories" :key="category.name" cols="12" md="6" lg="4">
            <v-card class="command-category" outlined>
              <v-card-title class="d-flex align-center">
                <v-icon :color="category.color" class="mr-2">
                  {{ category.icon }}
                </v-icon>
                {{ category.name }}
              </v-card-title>
              
              <v-card-text>
                <div v-for="command in category.commands" :key="command.id" class="command-item">
                  <div class="command-header">
                    <span class="command-phrase">{{ command.phrase }}</span>
                    <v-chip
                      :color="command.status === 'active' ? 'success' : 'grey'"
                      x-small
                    >
                      {{ command.status === 'active' ? 'Активна' : 'Неактивна' }}
                    </v-chip>
                  </div>
                  <p class="command-description">{{ command.description }}</p>
                  <div class="command-actions">
                    <v-btn
                      x-small
                      text
                      color="primary"
                      @click="testCommand(command)"
                      :disabled="command.status !== 'active'"
                    >
                      Тест
                    </v-btn>
                    <v-btn
                      x-small
                      text
                      color="secondary"
                      @click="editCommand(command)"
                    >
                      Редактировать
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- История команд -->
    <v-card class="history-panel mt-4" elevation="2">
      <v-card-title>
        <v-icon class="mr-2" color="info">mdi-history</v-icon>
        История команд
        <v-spacer></v-spacer>
        <v-btn
          text
          color="error"
          @click="clearHistory"
          :disabled="commandHistory.length === 0"
        >
          Очистить
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="historyHeaders"
          :items="commandHistory"
          :items-per-page="10"
          class="elevation-1"
        >
          <template v-slot:item.timestamp="{ item }">
            {{ formatTimestamp(item.timestamp) }}
          </template>
          
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.status === 'success' ? 'success' : 'error'"
              small
            >
              {{ item.status === 'success' ? 'Успешно' : 'Ошибка' }}
            </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn
              x-small
              text
              color="primary"
              @click="repeatCommand(item)"
            >
              Повторить
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- Диалог настроек -->
    <v-dialog v-model="showSettings" max-width="600">
      <v-card>
        <v-card-title>
          Настройки голосового управления
          <v-spacer></v-spacer>
          <v-btn icon @click="showSettings = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="settingsForm" v-model="settingsValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="voiceSettings.language"
                  label="Язык распознавания"
                  :items="availableLanguages"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="voiceSettings.mode"
                  label="Режим работы"
                  :items="voiceModes"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-slider
                  v-model="voiceSettings.sensitivity"
                  label="Чувствительность микрофона"
                  min="10"
                  max="100"
                  step="5"
                  thumb-label
                  required
                ></v-slider>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-slider
                  v-model="voiceSettings.timeout"
                  label="Таймаут команды (сек)"
                  min="1"
                  max="30"
                  step="1"
                  thumb-label
                  required
                ></v-slider>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="voiceSettings.autoStart"
                  label="Автозапуск при старте приложения"
                ></v-switch>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="voiceSettings.feedback"
                  label="Голосовая обратная связь"
                ></v-switch>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="voiceSettings.noiseReduction"
                  label="Подавление шума"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="showSettings = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            @click="saveSettings"
            :disabled="!settingsValid"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Диалог редактирования команды -->
    <v-dialog v-model="showEditDialog" max-width="500">
      <v-card v-if="editingCommand">
        <v-card-title>
          Редактирование команды
          <v-spacer></v-spacer>
          <v-btn icon @click="showEditDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="editForm" v-model="editFormValid">
            <v-text-field
              v-model="editingCommand.phrase"
              label="Фраза команды"
              required
              :rules="[v => !!v || 'Фраза обязательна']"
            ></v-text-field>
            
            <v-textarea
              v-model="editingCommand.description"
              label="Описание"
              rows="2"
            ></v-textarea>
            
            <v-switch
              v-model="editingCommand.status"
              :true-value="'active'"
              :false-value="'inactive'"
              label="Активна"
            ></v-switch>
            
            <v-text-field
              v-model="editingCommand.action"
              label="Действие"
              required
              :rules="[v => !!v || 'Действие обязательно']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="showEditDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            @click="saveCommand"
            :disabled="!editFormValid"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-card>
    
    <!-- Уведомления -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'VoiceControlManager',
  
  setup() {
    const authStore = useAuthStore();
    
    // Состояние компонента
    const isListening = ref(false);
    const isInitializing = ref(false);
    const showSettings = ref(false);
    const showEditDialog = ref(false);
    const settingsValid = ref(true);
    const editFormValid = ref(true);
    const isRefreshingCommands = ref(false);
    
    // Настройки голоса
    const voiceSettings = reactive({
      language: 'ru-RU',
      mode: 'continuous',
      sensitivity: 70,
      timeout: 10,
      autoStart: false,
      feedback: true,
      noiseReduction: true
    });
    
    // Текущее состояние
    const currentLanguage = ref('Русский');
    const voiceMode = ref('Непрерывный');
    const sensitivity = ref(70);
    const commandsCount = ref(0);
    const currentLevel = ref(0);
    
    // Команды
    const commandCategories = ref([
      {
        name: 'Навигация',
        color: 'primary',
        icon: 'mdi-navigation',
        commands: [
          {
            id: 'nav-dashboard',
            phrase: 'Открыть дашборд',
            description: 'Переход на главную страницу',
            status: 'active',
            action: 'navigate:/dashboard'
          },
          {
            id: 'nav-tasks',
            phrase: 'Показать задачи',
            description: 'Переход к списку задач',
            status: 'active',
            action: 'navigate:/tasks'
          },
          {
            id: 'nav-reports',
            phrase: 'Открыть отчеты',
            description: 'Переход к отчетам',
            status: 'active',
            action: 'navigate:/reports'
          }
        ]
      },
      {
        name: 'Действия',
        color: 'success',
        icon: 'mdi-play-circle',
        commands: [
          {
            id: 'action-create',
            phrase: 'Создать задачу',
            description: 'Создание новой задачи',
            status: 'active',
            action: 'create:task'
          },
          {
            id: 'action-save',
            phrase: 'Сохранить',
            description: 'Сохранение текущих изменений',
            status: 'active',
            action: 'save'
          },
          {
            id: 'action-delete',
            phrase: 'Удалить',
            description: 'Удаление выбранного элемента',
            status: 'active',
            action: 'delete'
          }
        ]
      },
      {
        name: 'Система',
        color: 'info',
        icon: 'mdi-cog',
        commands: [
          {
            id: 'system-help',
            phrase: 'Помощь',
            description: 'Показать справку',
            status: 'active',
            action: 'help'
          },
          {
            id: 'system-settings',
            phrase: 'Настройки',
            description: 'Открыть настройки',
            status: 'active',
            action: 'settings'
          },
          {
            id: 'system-logout',
            phrase: 'Выйти',
            description: 'Выход из системы',
            status: 'active',
            action: 'logout'
          }
        ]
      }
    ]);
    
    // История команд
    const commandHistory = ref([]);
    const historyHeaders = [
      { text: 'Время', value: 'timestamp' },
      { text: 'Команда', value: 'phrase' },
      { text: 'Статус', value: 'status' },
      { text: 'Действие', value: 'action' },
      { text: 'Действия', value: 'actions', sortable: false }
    ];
    
    // Уведомления
    const snackbar = reactive({
      show: false,
      message: '',
      color: 'success',
      timeout: 3000
    });
    
    // Редактируемая команда
    const editingCommand = ref(null);
    
    // Опции для селекторов
    const availableLanguages = [
      { text: 'Русский', value: 'ru-RU' },
      { text: 'English', value: 'en-US' },
      { text: 'Deutsch', value: 'de-DE' },
      { text: 'Français', value: 'fr-FR' }
    ];
    
    const voiceModes = [
      { text: 'Непрерывный', value: 'continuous' },
      { text: 'По кнопке', value: 'button' },
      { text: 'По таймеру', value: 'timer' }
    ];
    
    // Вычисляемые свойства
    const isVoiceControlAvailable = computed(() => {
      return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    });
    
    // Методы
    const toggleVoiceControl = async () => {
      if (isListening.value) {
        stopVoiceControl();
      } else {
        await startVoiceControl();
      }
    };
    
    const startVoiceControl = async () => {
      if (!isVoiceControlAvailable.value) {
        showSnackbar('Голосовое управление не поддерживается в вашем браузере', 'error');
        return;
      }
      
      try {
        isInitializing.value = true;
        
        // Инициализация распознавания речи
        await initializeSpeechRecognition();
        
        isListening.value = true;
        showSnackbar('Голосовое управление запущено', 'success');
        
        // Запуск мониторинга уровня звука
        startAudioLevelMonitoring();
        
      } catch (error) {
        console.error('Failed to start voice control:', error);
        showSnackbar('Ошибка запуска голосового управления', 'error');
      } finally {
        isInitializing.value = false;
      }
    };
    
    const stopVoiceControl = () => {
      isListening.value = false;
      stopAudioLevelMonitoring();
      showSnackbar('Голосовое управление остановлено', 'info');
    };
    
    const initializeSpeechRecognition = () => {
      return new Promise((resolve, reject) => {
        try {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          
          recognition.continuous = voiceSettings.mode === 'continuous';
          recognition.interimResults = false;
          recognition.lang = voiceSettings.language;
          
          recognition.onstart = () => {
            console.log('Speech recognition started');
            resolve();
          };
          
          recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            console.log('Recognized:', transcript);
            
            processVoiceCommand(transcript);
          };
          
          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            reject(new Error(event.error));
          };
          
          recognition.onend = () => {
            if (isListening.value && voiceSettings.mode === 'continuous') {
              recognition.start();
            }
          };
          
          recognition.start();
          
        } catch (error) {
          reject(error);
        }
      });
    };
    
    const processVoiceCommand = (transcript) => {
      // Поиск подходящей команды
      let matchedCommand = null;
      
      for (const category of commandCategories.value) {
        for (const command of category.commands) {
          if (command.status === 'active' && 
              transcript.includes(command.phrase.toLowerCase())) {
            matchedCommand = command;
            break;
          }
        }
        if (matchedCommand) break;
      }
      
      if (matchedCommand) {
        executeCommand(matchedCommand, transcript);
      } else {
        showSnackbar(`Команда не распознана: "${transcript}"`, 'warning');
      }
      
      // Добавление в историю
      addToHistory(transcript, matchedCommand);
      commandsCount.value++;
    };
    
    const executeCommand = (command, transcript) => {
      try {
        console.log(`Executing command: ${command.phrase}`);
        
        // Выполнение действия
        const action = command.action;
        
        if (action.startsWith('navigate:')) {
          const route = action.split(':')[1];
          window.location.href = route;
        } else if (action.startsWith('create:')) {
          const type = action.split(':')[1];
          // Логика создания
          showSnackbar(`Создание ${type}...`, 'info');
        } else if (action === 'save') {
          // Логика сохранения
          showSnackbar('Сохранение...', 'info');
        } else if (action === 'delete') {
          // Логика удаления
          showSnackbar('Удаление...', 'info');
        } else if (action === 'help') {
          // Показать справку
          showSnackbar('Открытие справки...', 'info');
        } else if (action === 'settings') {
          showSettings.value = true;
        } else if (action === 'logout') {
          authStore.logout();
        }
        
        showSnackbar(`Команда выполнена: ${command.phrase}`, 'success');
        
        // Голосовая обратная связь
        if (voiceSettings.feedback) {
          speak(`Выполнено: ${command.phrase}`);
        }
        
      } catch (error) {
        console.error('Failed to execute command:', error);
        showSnackbar('Ошибка выполнения команды', 'error');
      }
    };
    
    const addToHistory = (transcript, command) => {
      const historyItem = {
        id: Date.now(),
        timestamp: new Date(),
        phrase: transcript,
        status: command ? 'success' : 'error',
        action: command ? command.action : 'none'
      };
      
      commandHistory.value.unshift(historyItem);
      
      // Ограничение размера истории
      if (commandHistory.value.length > 100) {
        commandHistory.value = commandHistory.value.slice(0, 100);
      }
    };
    
    const startAudioLevelMonitoring = () => {
      // Симуляция мониторинга уровня звука
      const interval = setInterval(() => {
        if (!isListening.value) {
          clearInterval(interval);
          return;
        }
        
        currentLevel.value = Math.floor(Math.random() * 10) + 1;
      }, 100);
    };
    
    const stopAudioLevelMonitoring = () => {
      currentLevel.value = 0;
    };
    
    const speak = (text) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voiceSettings.language;
        speechSynthesis.speak(utterance);
      }
    };
    
    const refreshCommands = async () => {
      isRefreshingCommands.value = true;
      
      try {
        // Загрузка команд с сервера
        await new Promise(resolve => setTimeout(resolve, 1000));
        showSnackbar('Команды обновлены', 'success');
      } catch (error) {
        console.error('Failed to refresh commands:', error);
        showSnackbar('Ошибка обновления команд', 'error');
      } finally {
        isRefreshingCommands.value = false;
      }
    };
    
    const testCommand = (command) => {
      showSnackbar(`Тестирование команды: ${command.phrase}`, 'info');
      executeCommand(command, command.phrase);
    };
    
    const editCommand = (command) => {
      editingCommand.value = { ...command };
      showEditDialog.value = true;
    };
    
    const saveCommand = () => {
      if (!editingCommand.value) return;
      
      // Обновление команды
      for (const category of commandCategories.value) {
        for (const command of category.commands) {
          if (command.id === editingCommand.value.id) {
            Object.assign(command, editingCommand.value);
            break;
          }
        }
      }
      
      showEditDialog.value = false;
      editingCommand.value = null;
      showSnackbar('Команда сохранена', 'success');
    };
    
    const clearHistory = () => {
      commandHistory.value = [];
      commandsCount.value = 0;
      showSnackbar('История очищена', 'info');
    };
    
    const repeatCommand = (historyItem) => {
      showSnackbar(`Повтор команды: ${historyItem.phrase}`, 'info');
      
      // Поиск и выполнение команды
      for (const category of commandCategories.value) {
        for (const command of category.commands) {
          if (command.phrase.toLowerCase().includes(historyItem.phrase.toLowerCase())) {
            executeCommand(command, historyItem.phrase);
            return;
          }
        }
      }
      
      showSnackbar('Команда не найдена', 'warning');
    };
    
    const saveSettings = () => {
      // Сохранение настроек
      Object.assign(voiceSettings, {
        language: voiceSettings.language,
        mode: voiceSettings.mode,
        sensitivity: voiceSettings.sensitivity,
        timeout: voiceSettings.timeout,
        autoStart: voiceSettings.autoStart,
        feedback: voiceSettings.feedback,
        noiseReduction: voiceSettings.noiseReduction
      });
      
      // Обновление отображения
      currentLanguage.value = availableLanguages.find(l => l.value === voiceSettings.language)?.text || 'Русский';
      voiceMode.value = voiceModes.find(m => m.value === voiceSettings.mode)?.text || 'Непрерывный';
      sensitivity.value = voiceSettings.sensitivity;
      
      showSettings.value = false;
      showSnackbar('Настройки сохранены', 'success');
      
      // Сохранение в localStorage
      localStorage.setItem('voice-settings', JSON.stringify(voiceSettings));
    };
    
    const loadSettings = () => {
      const saved = localStorage.getItem('voice-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          Object.assign(voiceSettings, parsed);
          
          // Обновление отображения
          currentLanguage.value = availableLanguages.find(l => l.value === voiceSettings.language)?.text || 'Русский';
          voiceMode.value = voiceModes.find(m => m.value === voiceSettings.mode)?.text || 'Непрерывный';
          sensitivity.value = voiceSettings.sensitivity;
        } catch (error) {
          console.error('Failed to load voice settings:', error);
        }
      }
    };
    
    const formatTimestamp = (timestamp) => {
      return new Date(timestamp).toLocaleString('ru-RU');
    };
    
    const showSnackbar = (message, color = 'success') => {
      snackbar.message = message;
      snackbar.color = color;
      snackbar.show = true;
    };
    
    // Жизненный цикл
    onMounted(() => {
      loadSettings();
      
      // Автозапуск если включен
      if (voiceSettings.autoStart) {
        startVoiceControl();
      }
    });
    
    onUnmounted(() => {
      if (isListening.value) {
        stopVoiceControl();
      }
    });
    
    return {
      isListening,
      isInitializing,
      showSettings,
      showEditDialog,
      settingsValid,
      editFormValid,
      isRefreshingCommands,
      voiceSettings,
      currentLanguage,
      voiceMode,
      sensitivity,
      commandsCount,
      currentLevel,
      commandCategories,
      commandHistory,
      historyHeaders,
      snackbar,
      editingCommand,
      availableLanguages,
      voiceModes,
      toggleVoiceControl,
      refreshCommands,
      testCommand,
      editCommand,
      saveCommand,
      clearHistory,
      repeatCommand,
      saveSettings,
      formatTimestamp
    };
  }
};
</script>

<style scoped>
.voice-control-manager {
  padding: 20px;
}

.voice-panel {
  margin-bottom: 16px;
}

.voice-status h4 {
  margin-bottom: 12px;
  color: #333;
}

.voice-status p {
  margin-bottom: 8px;
  font-size: 14px;
}

.voice-controls {
  display: flex;
  flex-direction: column;
}

.voice-level-indicator {
  margin-top: 20px;
  text-align: center;
}

.level-bars {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 60px;
  gap: 4px;
}

.level-bar {
  width: 8px;
  background-color: #e0e0e0;
  border-radius: 2px;
  transition: all 0.1s ease;
}

.level-bar.active {
  background-color: #4caf50;
  animation: levelPulse 0.5s ease-in-out;
}

@keyframes levelPulse {
  0% { transform: scaleY(1); }
  50% { transform: scaleY(1.2); }
  100% { transform: scaleY(1); }
}

.commands-panel {
  margin-bottom: 16px;
}

.command-category {
  margin-bottom: 16px;
}

.command-item {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.command-phrase {
  font-weight: 500;
  color: #333;
}

.command-description {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.command-actions {
  display: flex;
  gap: 8px;
}

.history-panel {
  margin-bottom: 16px;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .voice-control-manager {
    padding: 10px;
  }
  
  .voice-panel .v-card-text {
    padding: 12px;
  }
  
  .level-bars {
    height: 40px;
  }
  
  .level-bar {
    width: 6px;
  }
}

/* Анимации */
.voice-panel {
  transition: all 0.3s ease;
}

.command-category {
  transition: transform 0.2s ease;
}

.command-category:hover {
  transform: translateY(-2px);
}

/* Кастомные скроллбары */
.commands-panel ::-webkit-scrollbar {
  width: 6px;
}

.commands-panel ::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.commands-panel ::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.commands-panel ::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style> 