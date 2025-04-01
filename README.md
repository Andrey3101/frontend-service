frontend-service

src/
├── api/
│   └── index.js
├── assets/
    ├── font/
    └── Gilroy-Black.woff
│   ├── styles.css         
│   ├── Gilroy-Black.woff2
│   ├── Gilroy-Regular.woff2
│   └── Gilroy-Medium.woff2
├── components/
│   ├── DraggableItem.vue
│   ├── DroppableWrapper.vue
│   ├── SidebarForm.vue
│   ├── VoiceRecorderForm.vue
│   ├── BarChart.vue
│   ├── ChatForm.vue
│   ├── TaskDetail.vue
│   ├── ActsDetail.vue
│   ├── CompetitorMonitor.vue
│   ├── TaskForm.vue
│   ├── UsersDetail.vue
│   ├── PromotionRecommendations.vue
│   ├── ReportsDetail.vue
│   ├── TaxCalculator.vue
│   └── CommentForm.vue
├── router/
│   └── index.js           
├── store/
│   └── index.js
├── stores/
│   └── auth.js
├── views/
│   ├── ActsList.vue
│   ├── DashboardPage.vue
│   ├── LoginForm.vue
│   ├── ProfileForm.vue
│   ├── TasksList.vue         
│   ├── UsersList.vue
│   ├── ClientsList.vue
│   ├── NotFound.vue
│   ├── RegisterForm.vue
│   ├── ResetPassword.vue
│   └── ReportList.vue  
├── App.vue
└── main.js

- `src/main.js`: Инициализирует Vue и подключает главный компонент.
- `src/App.vue`: Главный компонент с шаблоном, логикой и стилями.
- `public/index.html`: Шаблон, куда монтируется приложение.

#### Шаг 3: Запуск проекта
1. Открыть папу проекта
   cd frontend-service
2. Запустите локальный сервер разработки
   npm run serve
