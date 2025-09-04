import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { createPinia } from 'pinia'
import serviceManager from './services/service-manager.js'

Vue.config.productionTip = false

// Создаем Pinia store
const pinia = createPinia()

// Глобальные обработчики ошибок
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info)
  // Отправляем ошибку в систему мониторинга
  if (window.gtag) {
    window.gtag('event', 'vue_error', {
      event_category: 'error',
      event_label: info,
      value: 1
    })
  }
}

// Глобальные обработчики событий API
window.addEventListener('api:auth:logout', (event) => {
  console.log('API Logout event:', event.detail)
  // Перенаправляем на страницу входа
  router.push('/login')
})

window.addEventListener('api:network_error', (event) => {
  console.error('API Network Error:', event.detail)
  // Показываем уведомление пользователю
  if (window.$notify) {
    window.$notify.error('Ошибка сети. Проверьте подключение к интернету.')
  }
})

window.addEventListener('api:server_error', (event) => {
  console.error('API Server Error:', event.detail)
  // Показываем уведомление пользователю
  if (window.$notify) {
    window.$notify.error('Ошибка сервера. Попробуйте позже.')
  }
})

// Обработчики событий Service Manager
window.addEventListener('service-manager:initialized', (event) => {
  console.log('Services initialized:', event.detail)
})

window.addEventListener('service-manager:health_warning', (event) => {
  console.warn('Service health warning:', event.detail)
})

// Функция инициализации приложения
async function initializeApp() {
  try {
    console.log('🚀 Запуск MSB Platform...')
    
    // Инициализируем сервисы
    const initResult = await serviceManager.initialize()
    
    if (initResult.success) {
      console.log(`✅ Приложение готово к работе (${initResult.loadTime}ms)`)
      
      // Создаем Vue приложение
      new Vue({
        router,
        vuetify,
        pinia,
        render: h => h(App)
      }).$mount('#app')
      
    } else {
      throw new Error('Ошибка инициализации сервисов')
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка запуска приложения:', error)
    
    // Показываем страницу ошибки
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        background: #f5f5f5;
      ">
        <h1 style="color: #d32f2f; margin-bottom: 20px;">Ошибка запуска приложения</h1>
        <p style="color: #666; margin-bottom: 20px;">Не удалось инициализировать сервисы</p>
        <button onclick="location.reload()" style="
          padding: 10px 20px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Перезагрузить страницу</button>
      </div>
    `
  }
}

// Запускаем инициализацию
initializeApp()

// Экспортируем для отладки
window.serviceManager = serviceManager