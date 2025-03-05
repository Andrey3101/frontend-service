<template>
  <v-container class="users-detail-container">
    <v-row>
      <v-col>
        <h1 class="detail-title">Детали пользователя</h1>
        <v-progress-circular v-if="loading" indeterminate color="primary" class="loading-spinner" />
        <v-alert v-else-if="error" type="error" dense>{{ error }}</v-alert>
        <v-card v-else elevation="4" class="detail-card">
          <v-card-title class="card-title">
            Пользователь #{{ user.id }}
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <p><strong>Имя:</strong> {{ user.name }}</p>
                <p><strong>Email:</strong> {{ user.email }}</p>
              </v-col>
              <v-col cols="12" sm="6">
                <p><strong>Телефон:</strong> {{ user.phone }}</p>
                <p><strong>Роль:</strong> {{ user.role }}</p>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="$router.push('/users')">Назад к пользователям</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'UsersDetail',
  setup() {
    const route = useRoute();
    const user = ref(null);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        const response = await fetch(`/api/users/${route.params.id}`); // Замените на ваш API
        if (!response.ok) throw new Error('Не удалось загрузить пользователя');
        user.value = await response.json();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return { user, loading, error };
  },
};
</script>

<style scoped>
.users-detail-container {
  padding: 20px;
}

.detail-title {
  font-family: 'Gilroy-ExtraBold', sans-serif;
  font-size: 2rem;
  color: #1976d2;
  margin-bottom: 20px;
}

.loading-spinner {
  display: block;
  margin: 20px auto;
}

.detail-card {
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.card-title {
  font-family: 'Gilroy-Bold', sans-serif;
  font-size: 1.5rem;
  color: #1976d2;
}

p {
  font-family: 'Gilroy-Regular', sans-serif;
  font-size: 1rem;
  color: #2c3e50;
  margin: 8px 0;
}

strong {
  font-family: 'Gilroy-Medium', sans-serif;
  color: #34495e;
}
</style>