/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from project root
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');
  const port = parseInt(env.VITE_PORT || '5173');

  return {
    plugins: [react()],
    server: {
      port,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_API_URL || env.API_URL || 'http://localhost:3001',
          changeOrigin: true,
          // Removed rewrite so /api/session/... stays /api/session/...
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  };
});
