import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/mlflow-proxy': {
            target: 'http://192.168.10.252:23435',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/mlflow-proxy/, '')
          },
          '/control-proxy': {
            target: 'http://192.168.10.252:23442',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/control-proxy/, '')
          }
        }
      },
      preview: {
        port: 4173,
        host: '0.0.0.0',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        proxy: {
          '/mlflow-proxy': {
            target: 'http://192.168.10.252:23435',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/mlflow-proxy/, '')
          },
          '/control-proxy': {
            target: 'http://192.168.10.252:23442',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/control-proxy/, '')
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
