import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    host: '0.0.0.0',

    // 🔥 VIKTIG – Proxy til Flask
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});