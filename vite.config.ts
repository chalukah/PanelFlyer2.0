import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/ai': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/gog': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/render-png': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/render-batch': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/email-templates': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
