# 🔗 Интеграция Frontend с новыми сервисами

## Обзор

Этот документ описывает, как фронтенд интегрирован с новыми улучшенными сервисами через API Gateway.

## 🏗️ Архитектура интеграции

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Service                        │
│                         (Порт: 8080)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                             │
│                         (Порт: 8000)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Новые улучшенные сервисы                     │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │Enhanced    │ │  Security   │ │AI Analytics│ │   Voice     │ │
│  │  Cache     │ │  Service    │ │ Service    │ │ Assistant   │ │
│  │ (8010)     │ │  (8011)     │ │ (8012)     │ │  (8013)     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Real-time Analytics                          │ │
│  │                     (8014)                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте файл `env.example` в `.env`:

```bash
cp env.example .env
```

Отредактируйте `.env` файл:

```bash
# API Gateway Configuration
VUE_APP_API_GATEWAY=http://localhost:8000
VUE_APP_WS_GATEWAY=ws://localhost:8000

# Feature Flags
VUE_APP_ENABLE_ENHANCED_CACHE=true
VUE_APP_ENABLE_SECURITY_SERVICE=true
VUE_APP_ENABLE_AI_ANALYTICS=true
VUE_APP_ENABLE_VOICE_ASSISTANT=true
VUE_APP_ENABLE_REALTIME_ANALYTICS=true
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

### 4. Сборка для production

```bash
npm run build:prod
```

## 🔧 Конфигурация сервисов

### Enhanced Cache Service

```javascript
// Получение данных из кэша
import { getCachedData, setCachedData } from '@/api';

// Получить данные
const data = await getCachedData('user_preferences', 'user');

// Сохранить данные
await setCachedData('user_preferences', preferences, 3600, 'user');
```

### Security Service

```javascript
// Получение профиля безопасности
import { getSecurityProfile, updateSecuritySettings } from '@/api';

// Получить профиль
const securityProfile = await getSecurityProfile();

// Обновить настройки
await updateSecuritySettings({
  twoFactorEnabled: true,
  sessionTimeout: 3600
});
```

### AI Analytics Service

```javascript
// Получение AI метрик
import { getAIAnalytics, analyzeBusinessData } from '@/api';

// Получить метрики
const metrics = await getAIAnalytics(['user_activity', 'security_events']);

// Анализ бизнес-данных
const analysis = await analyzeBusinessData(salesData, 'trends');
```

### Voice Assistant Service

```javascript
// Обработка голосовых команд
import { processVoiceCommand, synthesizeSpeech } from '@/api';

// Обработать голосовую команду
const result = await processVoiceCommand(audioFile, 'ru');

// Синтезировать речь
const audio = await synthesizeSpeech('Привет, мир!', 'female', 'ru');
```

### Real-time Analytics Service

```javascript
// Подключение к real-time данным
import { connectRealTimeWebSocket, getRealTimeMetrics } from '@/api';

// Получить текущие метрики
const metrics = await getRealTimeMetrics();

// Подключиться к WebSocket
const ws = connectRealTimeWebSocket(userId, ['notifications', 'tasks']);
```

## 📱 Использование в компонентах

### Enhanced Services Component

```vue
<template>
  <EnhancedServices />
</template>

<script>
import EnhancedServices from '@/components/EnhancedServices.vue';

export default {
  components: {
    EnhancedServices
  }
};
</script>
```

### Auth Store с новыми сервисами

```javascript
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Автоматически загружает профиль безопасности и AI метрики
await authStore.login(email, password);

// Получить профиль безопасности
const securityProfile = authStore.securityProfile;

// Получить AI метрики
const aiMetrics = authStore.aiMetrics;
```

## 🔌 WebSocket интеграция

### Подключение к уведомлениям

```javascript
// В auth store автоматически подключается к real-time сервисам
const authStore = useAuthStore();

// Проверить статус подключения
const isConnected = authStore.isRealTimeConnected;

// Получить уведомления
const notifications = authStore.notifications;
```

### Кастомные WebSocket соединения

```javascript
import { connectWebSocket } from '@/api';

const ws = connectWebSocket('notifications', 'ws/notifications', userId, (data) => {
  console.log('Получено уведомление:', data);
});
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
npm run test:unit

# С покрытием
npm run test:coverage

# В режиме watch
npm run test:watch
```

### Тестирование интеграции с сервисами

```javascript
// tests/unit/services/enhanced-services.test.js
import { getCachedData, setCachedData } from '@/api';

describe('Enhanced Cache Service', () => {
  it('should set and get cached data', async () => {
    const testData = { test: 'value' };
    await setCachedData('test_key', testData, 60);
    
    const result = await getCachedData('test_key');
    expect(result).toEqual(testData);
  });
});
```

## 🐳 Docker развертывание

### Запуск с Docker Compose

```bash
# Сборка и запуск
docker-compose up --build

# Только запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f frontend
```

### Переменные окружения в Docker

```yaml
environment:
  - VUE_APP_API_GATEWAY=http://api-gateway:8000
  - VUE_APP_WS_GATEWAY=ws://api-gateway:8000
  - NODE_ENV=production
```

## 🔒 Безопасность

### Аутентификация

Все API запросы автоматически включают JWT токен:

```javascript
// Автоматически добавляется в заголовки
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### Refresh токенов

Автоматическое обновление токенов при истечении:

```javascript
// В TokenManager автоматически обновляет токены
if (response.status === 401) {
  const newToken = await tokenManager.refreshAccessToken();
  if (newToken) {
    return apiRequest(endpoint, options, timeoutKey);
  }
}
```

## 📊 Мониторинг

### Метрики производительности

```javascript
// Получение метрик сервисов
const authStore = useAuthStore();

// Размер кэша
const cacheSize = authStore.getCacheSize();

// Статус real-time подключения
const isRealtimeConnected = authStore.isRealTimeConnected;
```

### Логирование

```javascript
import { logger } from '@/utils/logger';

logger.info('Service operation completed', { service: 'cache', operation: 'get' });
logger.error('Service operation failed', { service: 'security', error: error.message });
```

## 🚨 Troubleshooting

### Частые проблемы

1. **Ошибки подключения к API Gateway**
   - Проверьте `VUE_APP_API_GATEWAY` в `.env`
   - Убедитесь, что API Gateway запущен на порту 8000

2. **Проблемы с WebSocket**
   - Проверьте `VUE_APP_WS_GATEWAY` в `.env`
   - Убедитесь, что WebSocket endpoints доступны

3. **Ошибки аутентификации**
   - Проверьте JWT токены в localStorage
   - Убедитесь, что security-service работает

4. **Проблемы с кэшем**
   - Проверьте подключение к enhanced-cache-service
   - Убедитесь, что Redis доступен

### Логи и отладка

```javascript
// Включить debug режим
VUE_APP_DEBUG=true

// Уровень логирования
VUE_APP_LOG_LEVEL=debug
```

## 📚 Дополнительные ресурсы

- [API Gateway документация](../api-gateway/README.md)
- [Enhanced Cache Service](../enhanced-cache/README.md)
- [Security Service](../security-service/README.md)
- [AI Analytics Service](../ai-analytics/README.md)
- [Voice Assistant Service](../voice-assistant/README.md)
- [Real-time Analytics Service](../realtime-analytics/README.md)

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте логи в консоли браузера
2. Проверьте статус сервисов через EnhancedServices компонент
3. Создайте issue в репозитории
4. Обратитесь к команде разработки

---

**Версия документации**: 1.0.0  
**Последнее обновление**: 2024-01-15  
**Автор**: Команда разработки Self-Employed Platform 