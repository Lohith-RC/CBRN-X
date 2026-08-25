import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load .env so CBRSX_API_KEY / VITE_BACKEND_URL work without shell exports
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.CBRSX_API_KEY || '';
  const backend = env.VITE_BACKEND_URL || 'http://localhost:8080';

  const apiProxy = {
    '/api': {
      target: backend,
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
      target: backend,
      ws: true,
      changeOrigin: true,
    },
  };

  return {
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
  };
});
