frontend-service

src/
├── api/
│   └── index.js
├── assets/
│   ├── styles.css
│   ├── Gilroy-Black.woff2
│   ├── Gilroy-Regular.woff2
│   └── Gilroy-Medium.woff2
├── components/
│   ├── DraggableItem.vue
│   ├── DroppableWrapper.vue
│   ├── Sidebar.vue
│   ├── VoiceRecorderForm.vue
│   └── Chat.vue           # Новый компонент чата
├── router/
│   └── index.js
├── store/
│   └── index.js
├── views/
│   ├── Acts.vue
│   ├── Dashboard.vue
│   ├── Login.vue
│   ├── Profile.vue
│   ├── Tasks.vue
│   └── Users.vue         # Удален VoiceRecorder.vue
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
