import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le proxy évite tout problème CORS : le front appelle /api -> redirigé vers l'API Express
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
