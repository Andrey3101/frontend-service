/**
 * Упрощенный сервис настроек
 * Заменяет сложные сервисы theme-service, localization-service и settings-service
 */

import { reactive, watch } from 'vue';

class SettingsService {
  constructor() {
    this.settings = reactive({
      // Основные настройки
      theme: {
        mode: 'light', // light, dark, auto
        primaryColor: '#1976d2',
        accentColor: '#ff4081'
      },
      
      // Локализация
      locale: {
        language: 'ru',
        fallback: 'en',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm',
        currency: 'RUB'
      },
      
      // Интерфейс
      ui: {
        sidebarCollapsed: false,
        compactMode: false,
        animations: true,
        soundEnabled: true
      },
      
      // Уведомления
      notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        email: false
      },
      
      // Производительность
      performance: {
        cacheEnabled: true,
        preloadEnabled: true,
        analyticsEnabled: true
      }
    });
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    // Загружаем сохраненные настройки
    this.loadSettings();
    
    // Настраиваем автоматическое сохранение
    this.setupAutoSave();
    
    // Применяем текущие настройки
    this.applySettings();
    
    console.log('SettingsService: инициализирован');
  }

  /**
   * Загружает настройки из localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(this.settings, parsed);
      }
    } catch (error) {
      console.warn('SettingsService: ошибка загрузки настроек:', error);
    }
  }

  /**
   * Сохраняет настройки в localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('app_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('SettingsService: ошибка сохранения настроек:', error);
    }
  }

  /**
   * Настраивает автоматическое сохранение
   */
  setupAutoSave() {
    watch(this.settings, () => {
      this.saveSettings();
    }, { deep: true });
  }

  /**
   * Применяет текущие настройки
   */
  applySettings() {
    this.applyTheme();
    this.applyLocale();
    this.applyUI();
  }

  /**
   * Применяет тему
   */
  applyTheme() {
    const { mode, primaryColor, accentColor } = this.settings.theme;
    
    // Применяем режим темы
    document.documentElement.setAttribute('data-theme', mode);
    
    // Применяем цвета
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
    
    // Если тема auto, определяем по системным настройкам
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Применяет локализацию
   */
  applyLocale() {
    const { language, dateFormat, timeFormat, currency } = this.settings.locale;
    
    // Устанавливаем язык документа
    document.documentElement.lang = language;
    
    // Сохраняем в localStorage для других сервисов
    localStorage.setItem('app_language', language);
    localStorage.setItem('app_date_format', dateFormat);
    localStorage.setItem('app_time_format', timeFormat);
    localStorage.setItem('app_currency', currency);
  }

  /**
   * Применяет настройки UI
   */
  applyUI() {
    const { sidebarCollapsed, compactMode, animations } = this.settings.ui;
    
    // Применяем состояние сайдбара
    if (sidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    
    // Применяем компактный режим
    if (compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
    
    // Применяем анимации
    if (!animations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }

  /**
   * Получает значение настройки
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Устанавливает значение настройки
   */
  set(key, value) {
    const keys = key.split('.');
    let target = this.settings;
    
    // Проходим по пути до предпоследнего элемента
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    // Устанавливаем значение
    const lastKey = keys[keys.length - 1];
    target[lastKey] = value;
  }

  /**
   * Сбрасывает настройки к значениям по умолчанию
   */
  reset() {
    const defaultSettings = {
      theme: {
        mode: 'light',
        primaryColor: '#1976d2',
        accentColor: '#ff4081'
      },
      locale: {
        language: 'ru',
        fallback: 'en',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm',
        currency: 'RUB'
      },
      ui: {
        sidebarCollapsed: false,
        compactMode: false,
        animations: true,
        soundEnabled: true
      },
      notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        email: false
      },
      performance: {
        cacheEnabled: true,
        preloadEnabled: true,
        analyticsEnabled: true
      }
    };
    
    Object.assign(this.settings, defaultSettings);
    this.applySettings();
  }

  /**
   * Экспортирует настройки
   */
  export() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Импортирует настройки
   */
  import(settingsJson) {
    try {
      const settings = JSON.parse(settingsJson);
      Object.assign(this.settings, settings);
      this.applySettings();
      return true;
    } catch (error) {
      console.error('SettingsService: ошибка импорта настроек:', error);
      return false;
    }
  }

  /**
   * Получает статус сервиса
   */
  getStatus() {
    return {
      initialized: true,
      settingsCount: Object.keys(this.settings).length,
      lastSaved: Date.now()
    };
  }
}

// Создаем и экспортируем единственный экземпляр
const settingsService = new SettingsService();

export default settingsService; 