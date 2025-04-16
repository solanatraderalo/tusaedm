import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // корректная генерация путей
  plugins: [react()],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ['@coinbase/wallet-sdk'] // ⛔ отключаем Coinbase SDK
  },
  resolve: {
    alias: {
      // иногда может понадобиться, если есть ошибки с импортами
      '@': '/src'
    }
  }
})
