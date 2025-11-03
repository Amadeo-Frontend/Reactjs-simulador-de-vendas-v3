import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // tudo que for /api vai para o servidor Express (localhost:4000)
      '/api': 'http://localhost:4000'
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
  // 🚫 NADA de 'define: { process.env... }' aqui
});
