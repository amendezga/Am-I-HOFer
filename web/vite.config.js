import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/pfr': {
        target: 'https://www.pro-football-reference.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/pfr/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
