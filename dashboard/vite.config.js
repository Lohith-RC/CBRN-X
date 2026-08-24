import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The instructor dashboard authenticates interactively (username/password +
// session cookie). Do NOT inject X-API-Key here: machine keys belong to
// simulation clients calling the backend directly.

const apiProxy = {
  '/api': {
    target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
    changeOrigin: true,
  },
};

const wsProxy = {
  '/ws-telemetry': {
    target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
    changeOrigin: true,
    ws: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { ...apiProxy, ...wsProxy },
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: { ...apiProxy, ...wsProxy },
  },
});
