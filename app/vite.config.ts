import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const apiTarget = process.env.TIMBRE_API_URL ?? 'http://127.0.0.1:3333'
const proxy = {
  '/api': { target: apiTarget, changeOrigin: true },
}
export default defineConfig({
  // `/Timbre/` for the public demo on GitHub Pages (npm run build:demo).
  base: process.env.TIMBRE_BASE ?? '/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
  build: { target: 'es2022', sourcemap: true },
})