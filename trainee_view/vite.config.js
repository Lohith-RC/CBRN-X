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

  return {
    plugins: [react()],
    publicDir: 'public',
    assetsInclude: ['**/*.mp4'],
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
  };
});
