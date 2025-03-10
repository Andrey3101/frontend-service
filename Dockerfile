# Стадия сборки приложения
FROM node:18-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package.json package-lock.json ./
RUN npm install --silent

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Стадия развертывания
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]