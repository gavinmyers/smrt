/// <reference types="vitest" />

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from project root
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');

  const portStr = env.VITE_PORT;
  const apiUrl = env.VITE_API_URL || env.API_URL;

  if (!portStr || !apiUrl) {
    throw new Error(
      'VITE_PORT and (VITE_API_URL or API_URL) environment variables are required',
    );
  }

  const port = parseInt(portStr, 10);

  return {
    plugins: [react()],
    server: {
      port,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiUrl,
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
