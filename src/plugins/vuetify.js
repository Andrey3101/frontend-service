import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import { ru } from 'vuetify/locale';

// Компоненты и директивы подключаются автоматически vite-plugin-vuetify (autoImport).
export default createVuetify({
  locale: {
    locale: 'ru',
    fallback: 'ru',
    messages: { ru },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1e88e5',
          secondary: '#2c3e50',
          accent: '#64b5f6',
          success: '#43a047',
          info: '#0288d1',
          warning: '#fb8c00',
          error: '#e53935',
          background: '#f4f6f9',
          surface: '#ffffff',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VCard: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable' },
    VDataTable: { density: 'comfortable' },
    VDataTableServer: { density: 'comfortable' },
  },
});
