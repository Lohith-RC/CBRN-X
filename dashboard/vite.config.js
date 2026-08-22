import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy = {
  '/api': {
    target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: apiProxy,
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: apiProxy,
  },
});
