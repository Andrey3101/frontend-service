<template>
  <v-snackbar
    v-model="notify.visible"
    :color="notify.color"
    :timeout="notify.timeout"
    location="bottom end"
    multi-line
  >
    {{ notify.message }}
    <template #actions>
      <v-btn variant="text" @click="notify.hide()">Закрыть</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { useNotifyStore } from '@/stores/notify.js';

const notify = useNotifyStore();
</script>
