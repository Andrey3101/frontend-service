import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

// Локальная разработка без Docker: `npm run dev` проксирует /api/* на сервисы,
// запущенные на localhost. Маршрутизация повторяет nginx.conf (пути не переписываются).
const services = {
  auth: 'http://127.0.0.1:8001',
  ai: 'http://127.0.0.1:8002',
  documents: 'http://127.0.0.1:8003',
  notifications: 'http://127.0.0.1:8004',
  finance: 'http://127.0.0.1:8005',
  tasks: 'http://127.0.0.1:8009',
};

// Порядок важен только для читаемости: префиксы не пересекаются.
const routes = {
  '/api/auth/': services.auth,
  '/api/users': services.auth,
  '/api/company': services.auth,
  '/api/subscription': services.auth,
  '/api/ai/': services.ai,
  '/api/clients': services.documents,
  '/api/acts': services.documents,
  '/api/invoices': services.documents,
  '/api/reports': services.documents,
  '/api/products': services.documents,
  '/api/inventory/': services.documents,
  '/api/notifications': services.notifications,
  '/api/finance/': services.finance,
  '/api/tax/': services.finance,
  '/api/bank/': services.finance,
  '/api/contractors/': services.finance,
  '/api/tasks': services.tasks,
  '/api/time/': services.tasks,
  '/api/meetings': services.tasks,
  '/api/important-dates': services.tasks,
};

const proxy = Object.fromEntries(
  Object.entries(routes).map(([prefix, target]) => [prefix, { target, changeOrigin: false }]),
);

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true, styles: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
