<template>
  <v-container class="not-found-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="not-found-col">
        <v-card class="not-found-card" elevation="8">
          <v-card-title class="not-found-title">
            404 - Страница не найдена
          </v-card-title>
          <v-card-text class="not-found-text">
            <p>К сожалению, запрашиваемая страница не существует.</p>
            <v-img
              src="https://cdn.vuetifyjs.com/images/parallax/404.png"
              max-width="300"
              class="mx-auto my-4"
              alt="404 Illustration"
            />
            <p>Вы можете вернуться на главную страницу или войти в аккаунт.</p>
          </v-card-text>
          <v-card-actions class="not-found-actions">
            <v-btn
              color="primary"
              class="action-btn"
              @click="$router.push('/dashboard')"
              aria-label="Перейти на главную страницу"
            >
              На главную
            </v-btn>
            <v-btn
              text
              class="action-btn"
              @click="$router.push('/login')"
              aria-label="Перейти ко входу"
            >
              Войти
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'NotFound',
};
</script>

<style scoped>
.not-found-container {
  height: 100vh;
}

.not-found-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

.not-found-card {
  width: 100%;
  padding: 20px;
  text-align: center;
}

.not-found-title {
  font-size: 28px;
  font-weight: bold;
  color: #d32f2f; /* Красный цвет для акцента ошибки */
  justify-content: center;
  padding: 16px 0;
}

.not-found-text {
  font-size: 16px;
  color: #666;
}

.not-found-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 16px 0;
}

.action-btn {
  min-width: 120px;
}
</style>