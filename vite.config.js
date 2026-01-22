import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/', // GitHub Pages base path for username.github.io
  server: {
    port: 5771
  }
})
