<template>
  <v-card class="calendar-integration" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon left color="primary">mdi-calendar</v-icon>
      Интеграция с календарем
    </v-card-title>

    <v-card-text>
      <v-alert
        v-if="integrationStatus === 'connected'"
        type="success"
        icon="mdi-check-circle"
        class="mb-4"
      >
        Локальный календарь подключен и синхронизирован
      </v-alert>

      <v-alert
        v-else-if="integrationStatus === 'error'"
        type="error"
        icon="mdi-alert-circle"
        class="mb-4"
      >
        Ошибка подключения календаря: {{ errorMessage }}
      </v-alert>

      <div v-if="integrationStatus === 'disconnected'" class="text-center py-4">
        <v-icon size="64" color="grey lighten-1">mdi-calendar-off</v-icon>
        <p class="text-h6 mt-2 text-grey">Календарь не подключен</p>
        <p class="text-body-2 text-grey">Подключите локальный календарь для синхронизации задач и встреч</p>
      </div>

      <v-list v-if="integrationStatus === 'connected'">
        <v-list-item>
          <v-list-item-icon>
            <v-icon color="success">mdi-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Автосинхронизация задач</v-list-item-title>
            <v-list-item-subtitle>Задачи автоматически создаются в календаре</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-list-item-icon>
            <v-icon color="success">mdi-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Автосинхронизация встреч</v-list-item-title>
            <v-list-item-subtitle>Встречи автоматически создаются в календаре</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-list-item-icon>
            <v-icon color="success">mdi-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Напоминания</v-list-item-title>
            <v-list-item-subtitle>Уведомления о предстоящих событиях</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider class="my-4" v-if="integrationStatus === 'connected'"></v-divider>

      <div v-if="integrationStatus === 'connected'" class="d-flex justify-space-between align-center">
        <div>
          <p class="text-caption text-grey">Последняя синхронизация</p>
          <p class="text-body-2">{{ lastSyncTime }}</p>
        </div>
        <v-btn
          color="primary"
          outlined
          small
          @click="syncCalendar"
          :loading="syncing"
          :disabled="syncing"
        >
          <v-icon left small>mdi-sync</v-icon>
          Синхронизировать
        </v-btn>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      
      <v-btn
        v-if="integrationStatus === 'disconnected'"
        color="primary"
        @click="connectCalendar"
        :loading="connecting"
        :disabled="connecting"
      >
        <v-icon left>mdi-link</v-icon>
        Подключить календарь
      </v-btn>

      <v-btn
        v-else-if="integrationStatus === 'connected'"
        color="error"
        outlined
        @click="disconnectCalendar"
        :loading="disconnecting"
        :disabled="disconnecting"
      >
        <v-icon left>mdi-link-off</v-icon>
        Отключить
      </v-btn>

      <v-btn
        v-if="integrationStatus === 'connected'"
        color="primary"
        @click="openCalendarSettings"
      >
        <v-icon left>mdi-cog</v-icon>
        Настройки
      </v-btn>
    </v-card-actions>

    <!-- Диалог настроек календаря -->
    <v-dialog v-model="settingsDialog" max-width="600">
      <v-card>
        <v-card-title>Настройки календаря</v-card-title>
        <v-card-text>
          <v-form ref="settingsForm" v-model="settingsValid">
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="calendarSettings.defaultView"
                  :items="viewOptions"
                  label="Вид по умолчанию"
                  required
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="calendarSettings.weekStart"
                  :items="weekStartOptions"
                  label="Начало недели"
                  required
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="calendarSettings.workingHoursStart"
                  label="Начало рабочего дня"
                  type="time"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="calendarSettings.workingHoursEnd"
                  label="Конец рабочего дня"
                  type="time"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="calendarSettings.timeZone"
                  :items="timeZoneOptions"
                  label="Часовой пояс"
                  required
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-checkbox
                  v-model="calendarSettings.showWeekends"
                  label="Показывать выходные"
                ></v-checkbox>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-checkbox
                  v-model="calendarSettings.autoSyncTasks"
                  label="Автосинхронизация задач"
                ></v-checkbox>
              </v-col>
              <v-col cols="6">
                <v-checkbox
                  v-model="calendarSettings.autoSyncMeetings"
                  label="Автосинхронизация встреч"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="settingsDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="saveCalendarSettings"
            :loading="savingSettings"
            :disabled="!settingsValid || savingSettings"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'CalendarIntegration',
  data() {
    return {
      integrationStatus: 'disconnected', // disconnected, connecting, connected, error
      connecting: false,
      disconnecting: false,
      syncing: false,
      savingSettings: false,
      errorMessage: '',
      lastSyncTime: 'Никогда',
      settingsDialog: false,
      settingsValid: false,
      calendarSettings: {
        defaultView: 'month',
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        weekStart: 'monday',
        timeZone: 'UTC',
        showWeekends: true,
        showHolidays: true,
        autoSyncTasks: true,
        autoSyncMeetings: true
      },
      viewOptions: [
        { text: 'День', value: 'day' },
        { text: 'Неделя', value: 'week' },
        { text: 'Месяц', value: 'month' },
        { text: 'Год', value: 'year' }
      ],
      weekStartOptions: [
        { text: 'Понедельник', value: 'monday' },
        { text: 'Воскресенье', value: 'sunday' }
      ],
      timeZoneOptions: [
        { text: 'UTC', value: 'UTC' },
        { text: 'Москва (UTC+3)', value: 'Europe/Moscow' },
        { text: 'Екатеринбург (UTC+5)', value: 'Asia/Yekaterinburg' },
        { text: 'Новосибирск (UTC+7)', value: 'Asia/Novosibirsk' },
        { text: 'Владивосток (UTC+10)', value: 'Asia/Vladivostok' }
      ]
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    }
  },
  methods: {
    async connectCalendar() {
      this.connecting = true;
      this.errorMessage = '';
      
      try {
        const response = await fetch('/api/v1/integrations/calendar/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authStore.token}`
          },
          body: JSON.stringify({
            user_id: this.authStore.user?.user_id,
            company_id: this.authStore.user?.company_id,
            settings: {}
          })
        });

        if (response.ok) {
          this.integrationStatus = 'connected';
          this.loadCalendarSettings();
          this.$emit('calendar-connected');
        } else {
          throw new Error('Failed to connect calendar');
        }
      } catch (error) {
        this.integrationStatus = 'error';
        this.errorMessage = error.message;
        console.error('Calendar connection error:', error);
      } finally {
        this.connecting = false;
      }
    },

    async disconnectCalendar() {
      this.disconnecting = true;
      
      try {
        const response = await fetch('/api/v1/integrations/calendar/1', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.authStore.token}`
          }
        });

        if (response.ok) {
          this.integrationStatus = 'disconnected';
          this.$emit('calendar-disconnected');
        }
      } catch (error) {
        console.error('Calendar disconnection error:', error);
      } finally {
        this.disconnecting = false;
      }
    },

    async syncCalendar() {
      this.syncing = true;
      
      try {
        const response = await fetch(`/api/v1/integrations/calendar/${this.authStore.user?.user_id}/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authStore.token}`
          }
        });

        if (response.ok) {
          this.lastSyncTime = new Date().toLocaleString('ru-RU');
          this.$emit('calendar-synced');
        }
      } catch (error) {
        console.error('Calendar sync error:', error);
      } finally {
        this.syncing = false;
      }
    },

    async loadCalendarSettings() {
      try {
        const response = await fetch('/api/v1/calendar/settings', {
          headers: {
            'Authorization': `Bearer ${this.authStore.token}`
          }
        });

        if (response.ok) {
          const settings = await response.json();
          this.calendarSettings = { ...this.calendarSettings, ...settings };
        }
      } catch (error) {
        console.error('Failed to load calendar settings:', error);
      }
    },

    openCalendarSettings() {
      this.settingsDialog = true;
    },

    async saveCalendarSettings() {
      this.savingSettings = true;
      
      try {
        const response = await fetch('/api/v1/calendar/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authStore.token}`
          },
          body: JSON.stringify(this.calendarSettings)
        });

        if (response.ok) {
          this.settingsDialog = false;
          this.$emit('settings-updated');
        }
      } catch (error) {
        console.error('Failed to save calendar settings:', error);
      } finally {
        this.savingSettings = false;
      }
    },

    checkIntegrationStatus() {
      // Проверяем статус интеграции при загрузке компонента
      this.loadCalendarSettings();
    }
  },
  mounted() {
    this.checkIntegrationStatus();
  }
};
</script>

<style scoped>
.calendar-integration {
  max-width: 600px;
  margin: 0 auto;
}

.v-list-item {
  padding: 8px 0;
}

.v-list-item-icon {
  margin-right: 16px;
}

.v-list-item-title {
  font-size: 14px;
  font-weight: 500;
}

.v-list-item-subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}
</style> 