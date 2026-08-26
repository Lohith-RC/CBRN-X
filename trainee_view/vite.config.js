import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiKey = process.env.CBRSX_API_KEY || '';

const apiProxy = {
  '/api': {
    target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
    changeOrigin: true,
    // Inject API key header on proxied requests
    ...(apiKey ? {
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('X-API-Key', apiKey);
        });
      },
    } : {}),
  },
};

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  assetsInclude: ['**/*.mp4'],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
  server: {
    port: 5000,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    port: 5000,
    strictPort: true,
    host: true,
    proxy: apiProxy,
  },
});
