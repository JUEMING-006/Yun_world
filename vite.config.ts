import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Tauri 期望在加载 devUrl 时固定端口；本地 vite dev server 跑在 1420
// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Tauri 要求此配置，使 vite 不清空终端输出
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 不监听 Rust 文件改动，避免触发整个前端热重载
      ignored: ['**/src-tauri/**'],
    },
  },

  // 生产构建产物由 Tauri 加载
  build: {
    target: 'es2021',
    minify: 'esbuild',
    sourcemap: false,
  },
}))
