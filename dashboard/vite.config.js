import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiKey = process.env.CBRSX_API_KEY || '';

const apiProxy = {
  '/api': {
    target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
    changeOrigin: true,
    ...(apiKey ? {
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('X-API-Key', apiKey);
        });
      },
    } : {}),
  },
  '/ws-telemetry': {
    target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
    ws: true,
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
