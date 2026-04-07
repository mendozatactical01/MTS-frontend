import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': '/src' }
  },
  server: {
    // Proxy /api requests to the backend to avoid CORS during development
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // keep the /api prefix; if your backend expects a different path,
        // adjust rewrite accordingly.
        rewrite: (path) => path
      }
    }
  }
})