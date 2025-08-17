<template>
  <div class="meetings-page">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-calendar-clock</v-icon>
              Планирование встреч
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                @click="showAddDialog = true"
                prepend-icon="mdi-plus"
              >
                Создать встречу
              </v-btn>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>

      <!-- Календарь встреч -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              Календарь встреч
            </v-card-title>
            
            <v-card-text>
              <v-row>
                <v-col cols="12" md="8">
                  <!-- Календарь -->
                  <v-date-picker
                    v-model="selectedDate"
                    @update:model-value="onDateSelect"
                    :events="meetingDates"
                    event-color="primary"
                    class="meeting-calendar"
                  ></v-date-picker>
                </v-col>
                
                <v-col cols="12" md="4">
                  <!-- Встречи на выбранную дату -->
                  <v-card variant="outlined">
                    <v-card-title>
                      Встречи на {{ formatDate(selectedDate) }}
                    </v-card-title>
                    
                    <v-card-text>
                      <v-list v-if="meetingsForDate.length > 0">
                        <v-list-item
                          v-for="meeting in meetingsForDate"
                          :key="meeting.id"
                          :class="getMeetingPriorityClass(meeting.priority)"
                        >
                          <template v-slot:prepend>
                            <v-icon :color="getMeetingTypeColor(meeting.meeting_type)">
                              {{ getMeetingTypeIcon(meeting.meeting_type) }}
                            </v-icon>
                          </template>
                          
                          <v-list-item-title>{{ meeting.title }}</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ formatTime(meeting.start_time) }} - {{ formatTime(meeting.end_time) }}
                          </v-list-item-subtitle>
                          
                          <template v-slot:append>
                            <v-chip
                              :color="getPriorityColor(meeting.priority)"
                              size="small"
                            >
                              {{ getPriorityText(meeting.priority) }}
                            </v-chip>
                          </template>
                        </v-list-item>
                      </v-list>
                      
                      <v-alert
                        v-else
                        type="info"
                        variant="tonal"
                        text="На эту дату встреч не запланировано"
                      ></v-alert>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Список всех встреч -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              Все встречи ({{ filteredMeetings.length }})
            </v-card-title>
            
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="searchQuery"
                    label="Поиск по названию"
                    prepend-icon="mdi-magnify"
                    clearable
                    @input="filterMeetings"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-select
                    v-model="selectedType"
                    label="Тип встречи"
                    :items="meetingTypes"
                    clearable
                    @update:model-value="filterMeetings"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-select
                    v-model="selectedPriority"
                    label="Приоритет"
                    :items="priorities"
                    clearable
                    @update:model-value="filterMeetings"
                  ></v-select>
                </v-col>
              </v-row>
              
              <v-data-table
                :headers="headers"
                :items="filteredMeetings"
                :loading="loading"
                :items-per-page="10"
                class="elevation-1 mt-4"
              >
                <template v-slot:item.meeting_type="{ item }">
                  <v-chip
                    :color="getMeetingTypeColor(item.meeting_type)"
                    size="small"
                  >
                    {{ getMeetingTypeText(item.meeting_type) }}
                  </v-chip>
                </template>
                
                <template v-slot:item.priority="{ item }">
                  <v-chip
                    :color="getPriorityColor(item.priority)"
                    size="small"
                  >
                    {{ getPriorityText(item.priority) }}
                  </v-chip>
                </template>
                
                <template v-slot:item.start_time="{ item }">
                  {{ formatDateTime(item.start_time) }}
                </template>
                
                <template v-slot:item.end_time="{ item }">
                  {{ formatDateTime(item.end_time) }}
                </template>
                
                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="viewMeeting(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="editMeeting(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    @click="deleteMeeting(item)"
                    color="error"
                  ></v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Диалог создания/редактирования встречи -->
      <v-dialog v-model="showAddDialog" max-width="800px">
        <v-card>
          <v-card-title>
            {{ editingMeeting ? 'Редактировать встречу' : 'Создать встречу' }}
          </v-card-title>
          
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="meetingForm.title"
                    label="Название встречи"
                    :rules="[rules.required]"
                    maxlength="200"
                    counter
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="meetingForm.description"
                    label="Описание"
                    rows="3"
                    maxlength="1000"
                    counter
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-select
                    v-model="meetingForm.meeting_type"
                    label="Тип встречи"
                    :items="meetingTypes"
                    :rules="[rules.required]"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-select
                    v-model="meetingForm.priority"
                    label="Приоритет"
                    :items="priorities"
                    :rules="[rules.required]"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="meetingForm.start_time"
                    label="Время начала"
                    type="datetime-local"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="meetingForm.end_time"
                    label="Время окончания"
                    type="datetime-local"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-text-field
                    v-model="meetingForm.location"
                    label="Место проведения"
                    maxlength="200"
                    counter
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-select
                    v-model="meetingForm.participants"
                    label="Участники"
                    :items="availableUsers"
                    item-title="name"
                    item-value="id"
                    multiple
                    chips
                    closable-chips
                  ></v-select>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showAddDialog = false">Отмена</v-btn>
            <v-btn
              color="primary"
              @click="saveMeeting"
              :loading="saving"
              :disabled="!valid"
            >
              {{ editingMeeting ? 'Сохранить' : 'Создать' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Диалог просмотра встречи -->
      <v-dialog v-model="showViewDialog" max-width="600px">
        <v-card>
          <v-card-title>{{ selectedMeeting?.title }}</v-card-title>
          <v-card-text v-if="selectedMeeting">
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-text</v-icon>
                </template>
                <v-list-item-title>Описание</v-list-item-title>
                <v-list-item-subtitle>{{ selectedMeeting.description || 'Описание отсутствует' }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-calendar</v-icon>
                </template>
                <v-list-item-title>Дата и время</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDateTime(selectedMeeting.start_time) }} - {{ formatDateTime(selectedMeeting.end_time) }}
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-map-marker</v-icon>
                </template>
                <v-list-item-title>Место</v-list-item-title>
                <v-list-item-subtitle>{{ selectedMeeting.location || 'Место не указано' }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-account-group</v-icon>
                </template>
                <v-list-item-title>Участники</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    v-for="participant in selectedMeeting.participants"
                    :key="participant"
                    size="small"
                    class="ma-1"
                  >
                    {{ participant }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showViewDialog = false">Закрыть</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { createMeeting, getMeetings, updateMeeting, deleteMeeting } from '@/api/index.js';

export default {
  name: 'MeetingsPage',
  
  data() {
    return {
      loading: false,
      saving: false,
      meetings: [],
      filteredMeetings: [],
      searchQuery: '',
      selectedType: null,
      selectedPriority: null,
      selectedDate: new Date().toISOString().substr(0, 10),
      showAddDialog: false,
      showViewDialog: false,
      editingMeeting: null,
      selectedMeeting: null,
      valid: false,
      
      meetingForm: {
        title: '',
        description: '',
        meeting_type: 'internal',
        priority: 'medium',
        start_time: '',
        end_time: '',
        location: '',
        participants: []
      },
      
      meetingTypes: [
        { title: 'Внутренняя', value: 'internal' },
        { title: 'С клиентом', value: 'client' },
        { title: 'С поставщиком', value: 'supplier' },
        { title: 'С партнером', value: 'partner' }
      ],
      
      priorities: [
        { title: 'Низкий', value: 'low' },
        { title: 'Средний', value: 'medium' },
        { title: 'Высокий', value: 'high' },
        { title: 'Критический', value: 'critical' }
      ],
      
      headers: [
        { title: 'Название', key: 'title', sortable: true },
        { title: 'Тип', key: 'meeting_type', sortable: true },
        { title: 'Приоритет', key: 'priority', sortable: true },
        { title: 'Начало', key: 'start_time', sortable: true },
        { title: 'Окончание', key: 'end_time', sortable: true },
        { title: 'Место', key: 'location', sortable: true },
        { title: 'Действия', key: 'actions', sortable: false }
      ],
      
      rules: {
        required: v => !!v || 'Обязательное поле'
      },
      
      availableUsers: [
        { id: '1', name: 'Иван Иванов' },
        { id: '2', name: 'Петр Петров' },
        { id: '3', name: 'Сергей Сергеев' }
      ]
    };
  },
  
  computed: {
    meetingDates() {
      return this.meetings.map(m => m.start_time.split('T')[0]);
    },
    
    meetingsForDate() {
      const dateStr = this.selectedDate;
      return this.meetings.filter(m => m.start_time.startsWith(dateStr));
    }
  },
  
  async mounted() {
    await this.loadMeetings();
  },
  
  methods: {
    async loadMeetings() {
      this.loading = true;
      try {
        // В реальности здесь будет вызов API для получения списка встреч
        // Пока используем моковые данные
        this.meetings = [
          {
            id: '1',
            title: 'Встреча с клиентом',
            description: 'Обсуждение проекта',
            meeting_type: 'client',
            priority: 'high',
            start_time: '2024-01-15T10:00:00',
            end_time: '2024-01-15T11:00:00',
            location: 'Конференц-зал',
            participants: ['Иван Иванов', 'Петр Петров']
          },
          {
            id: '2',
            title: 'Планирование недели',
            description: 'Внутренняя встреча команды',
            meeting_type: 'internal',
            priority: 'medium',
            start_time: '2024-01-16T09:00:00',
            end_time: '2024-01-16T10:00:00',
            location: 'Офис',
            participants: ['Сергей Сергеев']
          }
        ];
        this.filteredMeetings = [...this.meetings];
      } catch (error) {
        console.error('Ошибка загрузки встреч:', error);
        this.$toast.error('Ошибка загрузки встреч');
      } finally {
        this.loading = false;
      }
    },
    
    async saveMeeting() {
      if (!this.$refs.form.validate()) return;
      
      this.saving = true;
      try {
        let response;
        
        if (this.editingMeeting) {
          response = await updateMeeting(this.editingMeeting.id, this.meetingForm);
        } else {
          response = await createMeeting(this.meetingForm);
        }
        
        if (response.status === 'success') {
          await this.loadMeetings();
          this.showAddDialog = false;
          this.resetForm();
          this.$toast.success(
            this.editingMeeting ? 'Встреча обновлена' : 'Встреча создана'
          );
        }
      } catch (error) {
        console.error('Ошибка сохранения встречи:', error);
        this.$toast.error('Ошибка сохранения встречи');
      } finally {
        this.saving = false;
      }
    },
    
    async deleteMeeting(meeting) {
      if (!confirm(`Удалить встречу "${meeting.title}"?`)) return;
      
      try {
        const response = await deleteMeeting(meeting.id);
        if (response.status === 'success') {
          await this.loadMeetings();
          this.$toast.success('Встреча удалена');
        }
      } catch (error) {
        console.error('Ошибка удаления встречи:', error);
        this.$toast.error('Ошибка удаления встречи');
      }
    },
    
    editMeeting(meeting) {
      this.editingMeeting = meeting;
      this.meetingForm = { ...meeting };
      this.showAddDialog = true;
    },
    
    viewMeeting(meeting) {
      this.selectedMeeting = meeting;
      this.showViewDialog = true;
    },
    
    onDateSelect(date) {
      this.selectedDate = date;
    },
    
    filterMeetings() {
      let filtered = [...this.meetings];
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(meeting =>
          meeting.title.toLowerCase().includes(query)
        );
      }
      
      if (this.selectedType) {
        filtered = filtered.filter(meeting =>
          meeting.meeting_type === this.selectedType
        );
      }
      
      if (this.selectedPriority) {
        filtered = filtered.filter(meeting =>
          meeting.priority === this.selectedPriority
        );
      }
      
      this.filteredMeetings = filtered;
    },
    
    resetForm() {
      this.meetingForm = {
        title: '',
        description: '',
        meeting_type: 'internal',
        priority: 'medium',
        start_time: '',
        end_time: '',
        location: '',
        participants: []
      };
      this.editingMeeting = null;
      this.$refs.form.resetValidation();
    },
    
    getMeetingTypeColor(type) {
      const colors = {
        internal: 'blue',
        client: 'green',
        supplier: 'orange',
        partner: 'purple'
      };
      return colors[type] || 'grey';
    },
    
    getMeetingTypeIcon(type) {
      const icons = {
        internal: 'mdi-account-group',
        client: 'mdi-account',
        supplier: 'mdi-truck',
        partner: 'mdi-handshake'
      };
      return icons[type] || 'mdi-calendar';
    },
    
    getMeetingTypeText(type) {
      const texts = {
        internal: 'Внутренняя',
        client: 'С клиентом',
        supplier: 'С поставщиком',
        partner: 'С партнером'
      };
      return texts[type] || type;
    },
    
    getPriorityColor(priority) {
      const colors = {
        low: 'success',
        medium: 'warning',
        high: 'orange',
        critical: 'error'
      };
      return colors[priority] || 'grey';
    },
    
    getPriorityText(priority) {
      const texts = {
        low: 'Низкий',
        medium: 'Средний',
        high: 'Высокий',
        critical: 'Критический'
      };
      return texts[priority] || priority;
    },
    
    getMeetingPriorityClass(priority) {
      const classes = {
        low: 'priority-low',
        medium: 'priority-medium',
        high: 'priority-high',
        critical: 'priority-critical'
      };
      return classes[priority] || '';
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    formatTime(time) {
      return new Date(time).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatDateTime(dateTime) {
      return new Date(dateTime).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.meetings-page {
  padding: 20px;
}

.meeting-calendar {
  width: 100%;
}

.priority-low {
  border-left: 4px solid #4CAF50;
}

.priority-medium {
  border-left: 4px solid #FF9800;
}

.priority-high {
  border-left: 4px solid #FF5722;
}

.priority-critical {
  border-left: 4px solid #F44336;
}
</style> 