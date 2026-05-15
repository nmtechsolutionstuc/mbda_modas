import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendProxy = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: backendProxy,
  },
  // Para testear desde el celular: npm run build && npm run preview
  preview: {
    port: 4173,
    host: '0.0.0.0',
    proxy: backendProxy,
  },
})
