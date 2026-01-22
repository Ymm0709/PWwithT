import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/', // GitHub Pages base path for username.github.io
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许外部访问
    port: 5771
  }
})
