frontend-service

src/
├── api/
│   └── index.js
├── assets/
│   ├── styles.css         # Обновленные стили
│   ├── Gilroy-Black.woff2
│   ├── Gilroy-Regular.woff2
│   └── Gilroy-Medium.woff2
├── components/
│   ├── DraggableItem.vue
│   ├── DroppableWrapper.vue
│   ├── Sidebar.vue
│   ├── VoiceRecorderForm.vue
│   ├── Chat.vue
│   ├── TaskDetail.vue
│   └── CommentForm.vue
├── router/
│   └── index.js           # Обновленный router с Reports.vue
├── store/
│   └── index.js
├── views/
│   ├── Acts.vue
│   ├── Dashboard.vue
│   ├── Login.vue
│   ├── Profile.vue
│   ├── Tasks.vue          # Обновленная страница задач
│   ├── Users.vue
│   └── Reports.vue        # Новая страница отчетов
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
