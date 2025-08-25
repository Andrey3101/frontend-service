<template>
  <div class="smart-notifications">
    <!-- Заголовок -->
    <v-card class="notifications-header" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon left size="32" color="primary">mdi-bell</v-icon>
        <div>
          <div class="text-h5">Умные уведомления</div>
          <div class="text-subtitle-1 text-grey">
            AI-приоритизация и персонализация
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn-group>
          <v-btn
            :color="viewMode === 'all' ? 'primary' : ''"
            @click="viewMode = 'all'"
          >
            Все
          </v-btn>
          <v-btn
            :color="viewMode === 'important' ? 'primary' : ''"
            @click="viewMode = 'important'"
          >
            Важные
          </v-btn>
          <v-btn
            :color="viewMode === 'unread' ? 'primary' : ''"
            @click="viewMode = 'unread'"
          >
            Непрочитанные
          </v-btn>
        </v-btn-group>
      </v-card-title>
    </v-card>

    <!-- Статистика уведомлений -->
    <v-row class="notifications-stats">
      <v-col cols="12" md="3">
        <v-card class="stat-card" elevation="1">
          <v-card-text class="text-center">
            <div class="stat-value">{{ totalNotifications }}</div>
            <div class="stat-label">Всего</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="stat-card" elevation="1">
          <v-card-text class="text-center">
            <div class="stat-value important">{{ importantNotifications }}</div>
            <div class="stat-label">Важные</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="stat-card" elevation="1">
          <v-card-text class="text-center">
            <div class="stat-value unread">{{ unreadNotifications }}</div>
            <div class="stat-label">Непрочитанные</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="stat-card" elevation="1">
          <v-card-text class="text-center">
            <div class="stat-value">{{ todayNotifications }}</div>
            <div class="stat-label">Сегодня</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Настройки уведомлений -->
    <v-card class="notifications-settings" elevation="1">
      <v-card-title>
        <v-icon left>mdi-cog</v-icon>
        Настройки уведомлений
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="settings.priority"
              :items="priorityOptions"
              label="Приоритет уведомлений"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="settings.frequency"
              :items="frequencyOptions"
              label="Частота уведомлений"
            ></v-select>
          </v-col>
        </v-row>
        
        <v-row>
          <v-col cols="12" md="6">
            <v-checkbox
              v-model="settings.smartPrioritization"
              label="AI-приоритизация"
            ></v-checkbox>
            <v-checkbox
              v-model="settings.personalization"
              label="Персонализация"
            ></v-checkbox>
          </v-col>
          <v-col cols="12" md="6">
            <v-checkbox
              v-model="settings.quietHours"
              label="Тихие часы"
            ></v-checkbox>
            <v-checkbox
              v-model="settings.smartGrouping"
              label="Умная группировка"
            ></v-checkbox>
          </v-col>
        </v-row>
        
        <v-row v-if="settings.quietHours">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.quietStart"
              label="Начало тихих часов"
              type="time"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.quietEnd"
              label="Конец тихих часов"
              type="time"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveSettings">Сохранить</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Список уведомлений -->
    <v-card class="notifications-list" elevation="1">
      <v-card-title class="d-flex align-center">
        <v-icon left>mdi-bell-ring</v-icon>
        Уведомления
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="outlined"
          @click="markAllAsRead"
          :disabled="unreadNotifications === 0"
        >
          Отметить все как прочитанные
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <div v-if="filteredNotifications.length === 0" class="empty-state">
          <v-icon size="64" color="grey lighten-1" class="mb-4">
            mdi-bell-off
          </v-icon>
          <h3 class="text-h6 mb-2">Нет уведомлений</h3>
          <p class="text-body-1 text-grey">
            {{ getEmptyStateMessage() }}
          </p>
        </div>
        
        <div v-else class="notifications-container">
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{
              'unread': !notification.read,
              'important': notification.priority === 'high',
              'urgent': notification.priority === 'urgent'
            }"
            @click="markAsRead(notification)"
          >
            <div class="notification-icon">
              <v-avatar :color="getNotificationColor(notification.type)" size="40">
                <v-icon color="white" size="20">
                  {{ getNotificationIcon(notification.type) }}
                </v-icon>
              </v-avatar>
            </div>
            
            <div class="notification-content">
              <div class="notification-header">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-time">
                  {{ formatTime(notification.timestamp) }}
                </div>
              </div>
              
              <div class="notification-message">
                {{ notification.message }}
              </div>
              
              <div class="notification-meta">
                <v-chip
                  :color="getPriorityColor(notification.priority)"
                  size="small"
                  variant="outlined"
                >
                  {{ getPriorityText(notification.priority) }}
                </v-chip>
                
                <v-chip
                  v-if="notification.category"
                  :color="getCategoryColor(notification.category)"
                  size="small"
                  variant="outlined"
                >
                  {{ notification.category }}
                </v-chip>
                
                <v-chip
                  v-if="notification.aiScore"
                  :color="getAIScoreColor(notification.aiScore)"
                  size="small"
                  variant="outlined"
                >
                  AI: {{ notification.aiScore }}%
                </v-chip>
              </div>
              
              <!-- Действия уведомления -->
              <div v-if="notification.actions" class="notification-actions">
                <v-btn
                  v-for="action in notification.actions"
                  :key="action.id"
                  :color="action.color"
                  :variant="action.variant || 'outlined'"
                  size="small"
                  class="mr-2"
                  @click.stop="executeNotificationAction(action, notification)"
                >
                  <v-icon left size="16">{{ action.icon }}</v-icon>
                  {{ action.text }}
                </v-btn>
              </div>
            </div>
            
            <div class="notification-controls">
              <v-btn
                icon
                size="small"
                @click.stop="toggleNotification(notification)"
              >
                <v-icon>
                  {{ notification.read ? 'mdi-bell' : 'mdi-bell-off' }}
                </v-icon>
              </v-btn>
              
              <v-btn
                icon
                size="small"
                @click.stop="deleteNotification(notification)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- AI Аналитика уведомлений -->
    <v-card class="ai-analytics" elevation="1">
      <v-card-title>
        <v-icon left>mdi-brain</v-icon>
        AI Аналитика уведомлений
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-3">Паттерны уведомлений</h4>
            <div class="pattern-item" v-for="pattern in aiPatterns" :key="pattern.id">
              <div class="pattern-header">
                <v-icon :color="pattern.color" size="20">{{ pattern.icon }}</v-icon>
                <span class="pattern-title">{{ pattern.title }}</span>
                <v-chip :color="pattern.color" size="small">{{ pattern.confidence }}%</v-chip>
              </div>
              <div class="pattern-description">{{ pattern.description }}</div>
            </div>
          </v-col>
          
          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-3">Рекомендации</h4>
            <div class="recommendation-item" v-for="rec in aiRecommendations" :key="rec.id">
              <div class="recommendation-header">
                <v-icon :color="rec.color" size="20">{{ rec.icon }}</v-icon>
                <span class="recommendation-title">{{ rec.title }}</span>
              </div>
              <div class="recommendation-description">{{ rec.description }}</div>
              <v-btn
                :color="rec.color"
                size="small"
                variant="outlined"
                @click="applyRecommendation(rec)"
              >
                {{ rec.action }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Диалог настроек уведомлений -->
    <v-dialog v-model="advancedSettingsDialog" max-width="600">
      <v-card>
        <v-card-title>Расширенные настройки</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="advancedSettings.notificationTypes"
                  :items="notificationTypeOptions"
                  label="Типы уведомлений"
                  multiple
                  chips
                ></v-select>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="advancedSettings.channels"
                  :items="channelOptions"
                  label="Каналы уведомлений"
                  multiple
                  chips
                ></v-select>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="advancedSettings.batchSize"
                  label="Размер пакета уведомлений"
                  type="number"
                  min="1"
                  max="50"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  v-model="advancedSettings.smartDelivery"
                  label="Умная доставка"
                ></v-checkbox>
                <v-checkbox
                  v-model="advancedSettings.contextAware"
                  label="Контекстная осведомленность"
                ></v-checkbox>
                <v-checkbox
                  v-model="advancedSettings.behavioralAnalysis"
                  label="Анализ поведения"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="advancedSettingsDialog = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveAdvancedSettings">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'SmartNotifications',
  data() {
    return {
      // Режим просмотра
      viewMode: 'all',
      
      // Настройки
      settings: {
        priority: 'medium',
        frequency: 'normal',
        smartPrioritization: true,
        personalization: true,
        quietHours: false,
        smartGrouping: true,
        quietStart: '22:00',
        quietEnd: '08:00'
      },
      
      // Расширенные настройки
      advancedSettings: {
        notificationTypes: ['all'],
        channels: ['in_app'],
        batchSize: 10,
        smartDelivery: true,
        contextAware: true,
        behavioralAnalysis: true
      },
      
      // Диалоги
      advancedSettingsDialog: false,
      
      // Уведомления
      notifications: [],
      
      // Опции
      priorityOptions: [
        { text: 'Низкий', value: 'low' },
        { text: 'Средний', value: 'medium' },
        { text: 'Высокий', value: 'high' },
        { text: 'Критический', value: 'urgent' }
      ],
      
      frequencyOptions: [
        { text: 'Минимально', value: 'minimal' },
        { text: 'Нормально', value: 'normal' },
        { text: 'Часто', value: 'frequent' },
        { text: 'Максимально', value: 'maximal' }
      ],
      
      notificationTypeOptions: [
        { text: 'Все', value: 'all' },
        { text: 'Задачи', value: 'tasks' },
        { text: 'Встречи', value: 'meetings' },
        { text: 'Системные', value: 'system' },
        { text: 'Безопасность', value: 'security' }
      ],
      
      channelOptions: [
        { text: 'В приложении', value: 'in_app' },
        { text: 'Email', value: 'email' },
        { text: 'Push', value: 'push' },
        { text: 'SMS', value: 'sms' }
      ],
      
      // AI паттерны
      aiPatterns: [
        {
          id: 1,
          title: 'Пик активности',
          description: 'Большинство уведомлений приходит в 9:00-11:00',
          confidence: 87,
          color: 'success',
          icon: 'mdi-trending-up'
        },
        {
          id: 2,
          title: 'Предпочтения по типам',
          description: 'Вы чаще взаимодействуете с уведомлениями о задачах',
          confidence: 92,
          color: 'info',
          icon: 'mdi-lightbulb'
        }
      ],
      
      // AI рекомендации
      aiRecommendations: [
        {
          id: 1,
          title: 'Оптимизация времени',
          description: 'Настройте тихие часы для повышения концентрации',
          action: 'Настроить',
          color: 'primary',
          icon: 'mdi-clock'
        },
        {
          id: 2,
          title: 'Группировка уведомлений',
          description: 'Включите умную группировку для уменьшения шума',
          action: 'Включить',
          color: 'success',
          icon: 'mdi-group'
        }
      ]
    };
  },
  
  computed: {
    // Фильтрованные уведомления
    filteredNotifications() {
      let filtered = [...this.notifications];
      
      switch (this.viewMode) {
        case 'important':
          filtered = filtered.filter(n => n.priority === 'high' || n.priority === 'urgent');
          break;
        case 'unread':
          filtered = filtered.filter(n => !n.read);
          break;
      }
      
      // AI-приоритизация
      if (this.settings.smartPrioritization) {
        filtered.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      }
      
      return filtered;
    },
    
    // Статистика
    totalNotifications() {
      return this.notifications.length;
    },
    
    importantNotifications() {
      return this.notifications.filter(n => 
        n.priority === 'high' || n.priority === 'urgent'
      ).length;
    },
    
    unreadNotifications() {
      return this.notifications.filter(n => !n.read).length;
    },
    
    todayNotifications() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return this.notifications.filter(n => {
        const notificationDate = new Date(n.timestamp);
        notificationDate.setHours(0, 0, 0, 0);
        return notificationDate.getTime() === today.getTime();
      }).length;
    }
  },
  
  mounted() {
    this.loadNotifications();
    this.loadSettings();
    this.initializeAINotifications();
  },
  
  methods: {
    // Загрузка уведомлений
    async loadNotifications() {
      try {
        // Здесь должна быть загрузка с сервера
        this.notifications = this.generateSampleNotifications();
        
      } catch (error) {
        console.error('Ошибка загрузки уведомлений:', error);
      }
    },
    
    // Загрузка настроек
    async loadSettings() {
      try {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        const advanced = localStorage.getItem('advancedNotificationSettings');
        if (advanced) {
          this.advancedSettings = { ...this.advancedSettings, ...JSON.parse(advanced) };
        }
        
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
      }
    },
    
    // Инициализация AI уведомлений
    async initializeAINotifications() {
      try {
        // Анализ паттернов
        await this.analyzeNotificationPatterns();
        
        // Генерация рекомендаций
        await this.generateAIRecommendations();
        
        // Применение персонализации
        if (this.settings.personalization) {
          await this.applyPersonalization();
        }
        
      } catch (error) {
        console.error('Ошибка инициализации AI:', error);
      }
    },
    
    // Анализ паттернов уведомлений
    async analyzeNotificationPatterns() {
      // Здесь должна быть логика AI анализа
      console.log('Анализ паттернов уведомлений...');
    },
    
    // Генерация AI рекомендаций
    async generateAIRecommendations() {
      // Здесь должна быть логика генерации рекомендаций
      console.log('Генерация AI рекомендаций...');
    },
    
    // Применение персонализации
    async applyPersonalization() {
      // Здесь должна быть логика персонализации
      console.log('Применение персонализации...');
    },
    
    // Сохранение настроек
    async saveSettings() {
      try {
        localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
        
        // Отправка на сервер
        await this.$api.updateNotificationSettings(this.settings);
        
        this.showSuccessMessage('Настройки сохранены!');
        
      } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        this.showErrorMessage('Ошибка при сохранении настроек');
      }
    },
    
    // Сохранение расширенных настроек
    async saveAdvancedSettings() {
      try {
        localStorage.setItem('advancedNotificationSettings', JSON.stringify(this.advancedSettings));
        
        // Отправка на сервер
        await this.$api.updateAdvancedNotificationSettings(this.advancedSettings);
        
        this.advancedSettingsDialog = false;
        this.showSuccessMessage('Расширенные настройки сохранены!');
        
      } catch (error) {
        console.error('Ошибка сохранения расширенных настроек:', error);
        this.showErrorMessage('Ошибка при сохранении расширенных настроек');
      }
    },
    
    // Отметить все как прочитанные
    async markAllAsRead() {
      try {
        this.notifications.forEach(n => n.read = true);
        
        // Отправка на сервер
        await this.$api.markAllNotificationsAsRead();
        
        this.showSuccessMessage('Все уведомления отмечены как прочитанные!');
        
      } catch (error) {
        console.error('Ошибка отметки уведомлений:', error);
        this.showErrorMessage('Ошибка при отметке уведомлений');
      }
    },
    
    // Отметить как прочитанное
    async markAsRead(notification) {
      if (notification.read) return;
      
      try {
        notification.read = true;
        
        // Отправка на сервер
        await this.$api.markNotificationAsRead(notification.id);
        
      } catch (error) {
        console.error('Ошибка отметки уведомления:', error);
      }
    },
    
    // Переключение уведомления
    async toggleNotification(notification) {
      try {
        notification.read = !notification.read;
        
        // Отправка на сервер
        await this.$api.updateNotification(notification.id, { read: notification.read });
        
      } catch (error) {
        console.error('Ошибка переключения уведомления:', error);
      }
    },
    
    // Удаление уведомления
    async deleteNotification(notification) {
      try {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
          this.notifications.splice(index, 1);
        }
        
        // Отправка на сервер
        await this.$api.deleteNotification(notification.id);
        
        this.showSuccessMessage('Уведомление удалено!');
        
      } catch (error) {
        console.error('Ошибка удаления уведомления:', error);
        this.showErrorMessage('Ошибка при удалении уведомления');
      }
    },
    
    // Выполнение действия уведомления
    async executeNotificationAction(action, notification) {
      try {
        // Здесь должна быть логика выполнения действия
        console.log('Выполнение действия:', action.text, 'для уведомления:', notification.id);
        
        // Отметить как прочитанное
        await this.markAsRead(notification);
        
        this.showSuccessMessage(`Действие "${action.text}" выполнено!`);
        
      } catch (error) {
        console.error('Ошибка выполнения действия:', error);
        this.showErrorMessage('Ошибка при выполнении действия');
      }
    },
    
    // Применение рекомендации
    async applyRecommendation(recommendation) {
      try {
        // Здесь должна быть логика применения рекомендации
        console.log('Применение рекомендации:', recommendation.title);
        
        this.showSuccessMessage(`Рекомендация "${recommendation.title}" применена!`);
        
      } catch (error) {
        console.error('Ошибка применения рекомендации:', error);
        this.showErrorMessage('Ошибка при применении рекомендации');
      }
    },
    
    // Генерация примерных уведомлений
    generateSampleNotifications() {
      return [
        {
          id: '1',
          title: 'Новая задача назначена',
          message: 'Вам назначена задача "Разработка API для интеграции"',
          type: 'task',
          category: 'Задачи',
          priority: 'high',
          read: false,
          timestamp: new Date(),
          aiScore: 95,
          actions: [
            {
              id: 'view',
              text: 'Просмотреть',
              icon: 'mdi-eye',
              color: 'primary'
            },
            {
              id: 'accept',
              text: 'Принять',
              icon: 'mdi-check',
              color: 'success'
            }
          ]
        },
        {
          id: '2',
          title: 'Встреча через 30 минут',
          message: 'Встреча "Планирование спринта" начнется в 14:00',
          type: 'meeting',
          category: 'Встречи',
          priority: 'urgent',
          read: false,
          timestamp: new Date(Date.now() - 1800000),
          aiScore: 98,
          actions: [
            {
              id: 'join',
              text: 'Присоединиться',
              icon: 'mdi-video',
              color: 'success'
            },
            {
              id: 'reschedule',
              text: 'Перенести',
              icon: 'mdi-calendar-clock',
              color: 'warning'
            }
          ]
        },
        {
          id: '3',
          title: 'Системное обновление',
          message: 'Система будет недоступна с 02:00 до 04:00 для обновления',
          type: 'system',
          category: 'Система',
          priority: 'medium',
          read: true,
          timestamp: new Date(Date.now() - 3600000),
          aiScore: 75
        }
      ];
    },
    
    // Получение цвета уведомления
    getNotificationColor(type) {
      const colors = {
        task: '#1976d2',
        meeting: '#388e3c',
        system: '#f57c00',
        security: '#d32f2f',
        reminder: '#7b1fa2'
      };
      return colors[type] || '#666666';
    },
    
    // Получение иконки уведомления
    getNotificationIcon(type) {
      const icons = {
        task: 'mdi-checkbox-marked-circle',
        meeting: 'mdi-calendar',
        system: 'mdi-cog',
        security: 'mdi-shield',
        reminder: 'mdi-bell'
      };
      return icons[type] || 'mdi-bell';
    },
    
    // Получение цвета приоритета
    getPriorityColor(priority) {
      const colors = {
        low: 'success',
        medium: 'info',
        high: 'warning',
        urgent: 'error'
      };
      return colors[priority] || 'grey';
    },
    
    // Получение текста приоритета
    getPriorityText(priority) {
      const texts = {
        low: 'Низкий',
        medium: 'Средний',
        high: 'Высокий',
        urgent: 'Критический'
      };
      return texts[priority] || 'Неизвестно';
    },
    
    // Получение цвета категории
    getCategoryColor(category) {
      const colors = {
        'Задачи': 'primary',
        'Встречи': 'success',
        'Система': 'warning',
        'Безопасность': 'error'
      };
      return colors[category] || 'grey';
    },
    
    // Получение цвета AI оценки
    getAIScoreColor(score) {
      if (score >= 90) return 'success';
      if (score >= 70) return 'warning';
      return 'error';
    },
    
    // Форматирование времени
    formatTime(timestamp) {
      const now = new Date();
      const diff = now - new Date(timestamp);
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Только что';
      if (minutes < 60) return `${minutes} мин назад`;
      if (hours < 24) return `${hours} ч назад`;
      if (days < 7) return `${days} дн назад`;
      
      return new Date(timestamp).toLocaleDateString('ru-RU');
    },
    
    // Получение сообщения для пустого состояния
    getEmptyStateMessage() {
      switch (this.viewMode) {
        case 'important':
          return 'Нет важных уведомлений';
        case 'unread':
          return 'Все уведомления прочитаны';
        default:
          return 'Нет уведомлений для отображения';
      }
    },
    
    // Показ сообщений
    showSuccessMessage(message) {
      this.$emit('show-message', { type: 'success', text: message });
    },
    
    showErrorMessage(message) {
      this.$emit('show-message', { type: 'error', text: message });
    },
    
    showInfoMessage(message) {
      this.$emit('show-message', { type: 'info', text: message });
    }
  }
};
</script>

<style scoped>
.smart-notifications {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.notifications-header {
  margin-bottom: 16px;
  border-radius: 8px;
}

.notifications-stats {
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-value.important {
  color: #f57c00;
}

.stat-value.unread {
  color: #d32f2f;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

.notifications-settings {
  margin-bottom: 16px;
  border-radius: 8px;
}

.notifications-list {
  margin-bottom: 16px;
  border-radius: 8px;
}

.ai-analytics {
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  padding: 32px;
}

.notifications-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
  cursor: pointer;
}

.notification-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.notification-item.unread {
  background: #f3f8ff;
  border-color: #1976d2;
}

.notification-item.important {
  background: #fff3e0;
  border-color: #f57c00;
}

.notification-item.urgent {
  background: #ffebee;
  border-color: #d32f2f;
}

.notification-icon {
  margin-right: 16px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

.notification-time {
  font-size: 0.75rem;
  color: #666;
  flex-shrink: 0;
  margin-left: 16px;
}

.notification-message {
  color: #666;
  margin-bottom: 12px;
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.notification-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.notification-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 16px;
  flex-shrink: 0;
}

.pattern-item,
.recommendation-item {
  padding: 12px;
  border-radius: 8px;
  background: #f5f5f5;
  margin-bottom: 12px;
}

.pattern-header,
.recommendation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.pattern-title,
.recommendation-title {
  font-weight: 600;
  flex: 1;
}

.pattern-description,
.recommendation-description {
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Адаптивность */
@media (max-width: 768px) {
  .smart-notifications {
    padding: 8px;
  }
  
  .notification-item {
    flex-direction: column;
  }
  
  .notification-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .notification-controls {
    margin-left: 0;
    margin-top: 12px;
    flex-direction: row;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .notification-time {
    margin-left: 0;
    margin-top: 4px;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .smart-notifications {
    background: #121212;
  }
  
  .notifications-header,
  .notifications-settings,
  .notifications-list,
  .ai-analytics {
    background: #1e1e1e;
    color: #ffffff;
  }
  
  .notification-item {
    background: #2d2d2d;
    border-color: #444;
  }
  
  .notification-item.unread {
    background: #1a237e;
    border-color: #3f51b5;
  }
  
  .notification-item.important {
    background: #e65100;
    border-color: #ff9800;
  }
  
  .notification-item.urgent {
    background: #b71c1c;
    border-color: #f44336;
  }
  
  .pattern-item,
  .recommendation-item {
    background: #2d2d2d;
  }
}
</style> 