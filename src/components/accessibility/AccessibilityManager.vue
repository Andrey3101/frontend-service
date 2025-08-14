<template>
  <div class="accessibility-manager">
    <!-- Кнопка открытия панели доступности -->
    <v-btn
      icon
      class="accessibility-toggle"
      @click="showPanel = !showPanel"
      :aria-label="'Открыть настройки доступности'"
    >
      <v-icon>mdi-accessibility</v-icon>
    </v-btn>

    <!-- Панель настроек доступности -->
    <v-navigation-drawer
      v-model="showPanel"
      app
      right
      temporary
      width="400"
      class="accessibility-panel"
    >
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-accessibility</v-icon>
        Настройки доступности
        <v-spacer></v-spacer>
        <v-btn icon @click="showPanel = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Визуальные настройки -->
        <v-expansion-panels v-model="activePanel" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-eye</v-icon>
              Визуальные настройки
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-switch
                v-model="settings.highContrast"
                label="Высокий контраст"
                @change="applyHighContrast"
              ></v-switch>
              
              <v-switch
                v-model="settings.largeText"
                label="Крупный текст"
                @change="applyLargeText"
              ></v-switch>
              
              <v-switch
                v-model="settings.reducedMotion"
                label="Уменьшить анимацию"
                @change="applyReducedMotion"
              ></v-switch>
              
              <v-switch
                v-model="settings.colorBlind"
                label="Режим для дальтоников"
                @change="applyColorBlind"
              ></v-switch>
              
              <v-slider
                v-model="settings.fontSize"
                label="Размер шрифта"
                min="12"
                max="24"
                step="1"
                thumb-label
                @change="applyFontSize"
              ></v-slider>
              
              <v-select
                v-model="settings.fontFamily"
                label="Шрифт"
                :items="fontOptions"
                @change="applyFontFamily"
              ></v-select>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-volume-high</v-icon>
              Аудио настройки
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-switch
                v-model="settings.screenReader"
                label="Экранный диктор"
                @change="toggleScreenReader"
              ></v-switch>
              
              <v-switch
                v-model="settings.audioDescriptions"
                label="Аудио описания"
                @change="toggleAudioDescriptions"
              ></v-switch>
              
              <v-switch
                v-model="settings.soundNotifications"
                label="Звуковые уведомления"
                @change="toggleSoundNotifications"
              ></v-switch>
              
              <v-slider
                v-model="settings.audioVolume"
                label="Громкость"
                min="0"
                max="100"
                step="5"
                thumb-label
                @change="applyAudioVolume"
              ></v-slider>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-keyboard</v-icon>
              Клавиатурная навигация
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-switch
                v-model="settings.keyboardNavigation"
                label="Подсветка фокуса"
                @change="applyKeyboardNavigation"
              ></v-switch>
              
              <v-switch
                v-model="settings.tabHighlight"
                label="Подсветка Tab"
                @change="applyTabHighlight"
              ></v-switch>
              
              <v-switch
                v-model="settings.shortcuts"
                label="Горячие клавиши"
                @change="applyShortcuts"
              ></v-switch>
              
              <v-divider class="my-3"></v-divider>
              
              <h4>Горячие клавиши:</h4>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <kbd>Tab</kbd> - Навигация по элементам
                </div>
                <div class="shortcut-item">
                  <kbd>Enter</kbd> - Активация элемента
                </div>
                <div class="shortcut-item">
                  <kbd>Escape</kbd> - Закрыть/Отмена
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl + M</kbd> - Открыть меню
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl + S</kbd> - Сохранить
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl + Z</kbd> - Отменить
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-microphone</v-icon>
              Голосовое управление
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-switch
                v-model="settings.voiceControl"
                label="Включить голосовое управление"
                @change="toggleVoiceControl"
              ></v-switch>
              
              <v-switch
                v-model="settings.voiceFeedback"
                label="Голосовая обратная связь"
                @change="toggleVoiceFeedback"
              ></v-switch>
              
              <v-select
                v-model="settings.voiceLanguage"
                label="Язык голосового управления"
                :items="voiceLanguages"
                @change="applyVoiceLanguage"
              ></v-select>
              
              <v-select
                v-model="settings.voiceSpeed"
                label="Скорость речи"
                :items="voiceSpeeds"
                @change="applyVoiceSpeed"
              ></v-select>
              
              <v-btn
                v-if="settings.voiceControl"
                color="primary"
                @click="startVoiceTraining"
                class="mt-2"
              >
                Начать обучение голоса
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-cog</v-icon>
              Дополнительные настройки
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-switch
                v-model="settings.autoSave"
                label="Автосохранение"
                @change="applyAutoSave"
              ></v-switch>
              
              <v-switch
                v-model="settings.confirmActions"
                label="Подтверждение действий"
                @change="applyConfirmActions"
              ></v-switch>
              
              <v-switch
                v-model="settings.showTooltips"
                label="Показывать подсказки"
                @change="applyTooltips"
              ></v-switch>
              
              <v-switch
                v-model="settings.altText"
                label="Альтернативный текст для изображений"
                @change="applyAltText"
              ></v-switch>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Кнопки управления -->
        <v-row class="mt-4">
          <v-col cols="6">
            <v-btn
              block
              color="secondary"
              @click="resetToDefaults"
            >
              Сбросить настройки
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              block
              color="primary"
              @click="saveSettings"
            >
              Сохранить
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-navigation-drawer>

    <!-- Индикатор доступности -->
    <div
      v-if="settings.keyboardNavigation"
      class="focus-indicator"
      :class="{ active: isFocused }"
    ></div>

    <!-- Голосовые команды -->
    <div
      v-if="settings.voiceControl"
      class="voice-commands"
      :class="{ listening: isListening }"
    >
      <v-chip
        :color="isListening ? 'error' : 'success'"
        small
        class="voice-status"
      >
        <v-icon left>
          {{ isListening ? 'mdi-microphone' : 'mdi-microphone-off' }}
        </v-icon>
        {{ isListening ? 'Слушаю...' : 'Голосовое управление активно' }}
      </v-chip>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'AccessibilityManager',
  
  setup() {
    const authStore = useAuthStore();
    
    // Состояние компонента
    const showPanel = ref(false);
    const activePanel = ref([0]);
    const isFocused = ref(false);
    const isListening = ref(false);
    
    // Настройки доступности
    const settings = reactive({
      // Визуальные
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      colorBlind: false,
      fontSize: 16,
      fontFamily: 'Roboto',
      
      // Аудио
      screenReader: false,
      audioDescriptions: false,
      soundNotifications: true,
      audioVolume: 50,
      
      // Клавиатура
      keyboardNavigation: true,
      tabHighlight: true,
      shortcuts: true,
      
      // Голос
      voiceControl: false,
      voiceFeedback: true,
      voiceLanguage: 'ru-RU',
      voiceSpeed: 'normal',
      
      // Дополнительные
      autoSave: true,
      confirmActions: false,
      showTooltips: true,
      altText: true
    });
    
    // Опции для селекторов
    const fontOptions = [
      'Roboto',
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Georgia',
      'Verdana'
    ];
    
    const voiceLanguages = [
      { text: 'Русский', value: 'ru-RU' },
      { text: 'English', value: 'en-US' },
      { text: 'Deutsch', value: 'de-DE' },
      { text: 'Français', value: 'fr-FR' }
    ];
    
    const voiceSpeeds = [
      { text: 'Медленно', value: 'slow' },
      { text: 'Нормально', value: 'normal' },
      { text: 'Быстро', value: 'fast' }
    ];
    
    // Загрузка настроек из localStorage
    const loadSettings = () => {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(settings, parsed);
        applyAllSettings();
      }
    };
    
    // Сохранение настроек
    const saveSettings = () => {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
      
      // Сохраняем в кэш
      authStore.setCachedData('accessibility_settings', settings, 86400, 'user');
      
      // Показываем уведомление
      if (settings.voiceFeedback) {
        speak('Настройки доступности сохранены');
      }
    };
    
    // Сброс к значениям по умолчанию
    const resetToDefaults = () => {
      const defaults = {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        colorBlind: false,
        fontSize: 16,
        fontFamily: 'Roboto',
        screenReader: false,
        audioDescriptions: false,
        soundNotifications: true,
        audioVolume: 50,
        keyboardNavigation: true,
        tabHighlight: true,
        shortcuts: true,
        voiceControl: false,
        voiceFeedback: true,
        voiceLanguage: 'ru-RU',
        voiceSpeed: 'normal',
        autoSave: true,
        confirmActions: false,
        showTooltips: true,
        altText: true
      };
      
      Object.assign(settings, defaults);
      applyAllSettings();
      
      if (settings.voiceFeedback) {
        speak('Настройки сброшены к значениям по умолчанию');
      }
    };
    
    // Применение всех настроек
    const applyAllSettings = () => {
      applyHighContrast();
      applyLargeText();
      applyReducedMotion();
      applyColorBlind();
      applyFontSize();
      applyFontFamily();
      applyKeyboardNavigation();
      applyTabHighlight();
      applyShortcuts();
      applyAudioVolume();
    };
    
    // Визуальные настройки
    const applyHighContrast = () => {
      document.body.classList.toggle('high-contrast', settings.highContrast);
    };
    
    const applyLargeText = () => {
      document.body.classList.toggle('large-text', settings.largeText);
    };
    
    const applyReducedMotion = () => {
      document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    };
    
    const applyColorBlind = () => {
      document.body.classList.toggle('color-blind', settings.colorBlind);
    };
    
    const applyFontSize = () => {
      document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
    };
    
    const applyFontFamily = () => {
      document.documentElement.style.setProperty('--font-family', settings.fontFamily);
    };
    
    // Аудио настройки
    const toggleScreenReader = () => {
      if (settings.screenReader) {
        initScreenReader();
      } else {
        stopScreenReader();
      }
    };
    
    const toggleAudioDescriptions = () => {
      // Логика для аудио описаний
    };
    
    const toggleSoundNotifications = () => {
      // Логика для звуковых уведомлений
    };
    
    const applyAudioVolume = () => {
      // Применение громкости
    };
    
    // Клавиатурная навигация
    const applyKeyboardNavigation = () => {
      if (settings.keyboardNavigation) {
        document.addEventListener('keydown', handleKeyboardNavigation);
      } else {
        document.removeEventListener('keydown', handleKeyboardNavigation);
      }
    };
    
    const applyTabHighlight = () => {
      document.body.classList.toggle('tab-highlight', settings.tabHighlight);
    };
    
    const applyShortcuts = () => {
      if (settings.shortcuts) {
        document.addEventListener('keydown', handleShortcuts);
      } else {
        document.removeEventListener('keydown', handleShortcuts);
      }
    };
    
    // Голосовое управление
    const toggleVoiceControl = () => {
      if (settings.voiceControl) {
        initVoiceControl();
      } else {
        stopVoiceControl();
      }
    };
    
    const toggleVoiceFeedback = () => {
      // Логика для голосовой обратной связи
    };
    
    const applyVoiceLanguage = () => {
      // Применение языка голосового управления
    };
    
    const applyVoiceSpeed = () => {
      // Применение скорости речи
    };
    
    const startVoiceTraining = () => {
      // Начало обучения голосового управления
      if (settings.voiceFeedback) {
        speak('Начинаем обучение голосовому управлению. Следуйте инструкциям на экране.');
      }
    };
    
    // Голосовой синтез
    const speak = (text) => {
      if ('speechSynthesis' in window && settings.voiceFeedback) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = settings.voiceLanguage;
        utterance.rate = settings.voiceSpeed === 'slow' ? 0.8 : settings.voiceSpeed === 'fast' ? 1.2 : 1.0;
        speechSynthesis.speak(utterance);
      }
    };
    
    // Обработчики событий
    const handleKeyboardNavigation = (event) => {
      if (event.key === 'Tab') {
        isFocused.value = true;
        setTimeout(() => {
          isFocused.value = false;
        }, 2000);
      }
    };
    
    const handleShortcuts = (event) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case 'm':
            event.preventDefault();
            showPanel.value = !showPanel.value;
            break;
          case 's':
            event.preventDefault();
            // Сохранение
            break;
          case 'z':
            event.preventDefault();
            // Отмена
            break;
        }
      }
    };
    
    // Инициализация экранного диктора
    const initScreenReader = () => {
      // Логика инициализации экранного диктора
    };
    
    const stopScreenReader = () => {
      // Остановка экранного диктора
    };
    
    // Инициализация голосового управления
    const initVoiceControl = () => {
      if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = settings.voiceLanguage;
        
        recognition.onstart = () => {
          isListening.value = true;
        };
        
        recognition.onresult = (event) => {
          const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
          handleVoiceCommand(command);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          isListening.value = false;
        };
        
        recognition.onend = () => {
          isListening.value = false;
        };
        
        recognition.start();
      }
    };
    
    const stopVoiceControl = () => {
      isListening.value = false;
    };
    
    // Обработка голосовых команд
    const handleVoiceCommand = (command) => {
      if (command.includes('открыть') || command.includes('open')) {
        if (command.includes('меню') || command.includes('menu')) {
          showPanel.value = true;
        } else if (command.includes('дашборд') || command.includes('dashboard')) {
          window.location.href = '/dashboard';
        }
      } else if (command.includes('закрыть') || command.includes('close')) {
        showPanel.value = false;
      } else if (command.includes('сохранить') || command.includes('save')) {
        saveSettings();
      }
      
      if (settings.voiceFeedback) {
        speak(`Выполнена команда: ${command}`);
      }
    };
    
    // Наблюдение за изменениями настроек
    watch(settings, () => {
      applyAllSettings();
    }, { deep: true });
    
    // Жизненный цикл
    onMounted(() => {
      loadSettings();
      applyAllSettings();
    });
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboardNavigation);
      document.removeEventListener('keydown', handleShortcuts);
    });
    
    return {
      showPanel,
      activePanel,
      isFocused,
      isListening,
      settings,
      fontOptions,
      voiceLanguages,
      voiceSpeeds,
      saveSettings,
      resetToDefaults,
      applyHighContrast,
      applyLargeText,
      applyReducedMotion,
      applyColorBlind,
      applyFontSize,
      applyFontFamily,
      toggleScreenReader,
      toggleAudioDescriptions,
      toggleSoundNotifications,
      applyAudioVolume,
      applyKeyboardNavigation,
      applyTabHighlight,
      applyShortcuts,
      toggleVoiceControl,
      toggleVoiceFeedback,
      applyVoiceLanguage,
      applyVoiceSpeed,
      startVoiceTraining
    };
  }
};
</script>

<style scoped>
.accessibility-manager {
  position: relative;
}

.accessibility-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background-color: var(--v-primary-base);
  color: white;
}

.accessibility-panel {
  z-index: 1001;
}

.shortcuts-list {
  margin-top: 16px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.shortcut-item kbd {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 2px 6px;
  margin-right: 8px;
  font-family: monospace;
  font-size: 12px;
}

.focus-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.focus-indicator.active {
  opacity: 1;
}

.focus-indicator::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%);
}

.voice-commands {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.voice-status {
  transition: all 0.3s ease;
}

.voice-commands.listening .voice-status {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* CSS переменные для настроек */
:root {
  --font-size: 16px;
  --font-family: 'Roboto', sans-serif;
}

/* Применение настроек */
.high-contrast {
  filter: contrast(150%);
}

.large-text {
  font-size: 1.2em;
}

.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

.color-blind {
  filter: grayscale(100%);
}

.tab-highlight *:focus {
  outline: 3px solid #1976d2 !important;
  outline-offset: 2px !important;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .accessibility-toggle {
    top: 10px;
    right: 10px;
  }
  
  .accessibility-panel {
    width: 100% !important;
  }
  
  .voice-commands {
    bottom: 10px;
    right: 10px;
  }
}
</style> 