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
          // 代理后端 API 请求
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
          // 代理健康检查
          '/health': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
          // 代理上传文件
          '/uploads': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
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
