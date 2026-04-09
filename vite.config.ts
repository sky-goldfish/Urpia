import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true
  },
  server: {
    port: 3000,
    host: true,
    headers: {
      // 允许 Mapbox GL 的 eval 和 worker 正常工作
      'Content-Security-Policy': "default-src * 'unsafe-eval' 'unsafe-inline' data: blob:; script-src * 'unsafe-eval' 'unsafe-inline' data: blob:; worker-src * 'unsafe-eval' 'unsafe-inline' data: blob: blob:; child-src * 'unsafe-eval' 'unsafe-inline' data: blob:; connect-src * data: blob:; img-src * data: blob:; style-src * 'unsafe-inline' data: blob:;",
    },
  },
})
