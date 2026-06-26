import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 路由懒加载Chunk配置
    rollupOptions: {
      output: {
        // 手动定义分块策略，优化打包结构
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router']
        }
      }
    },
    // 压缩体积报告
    reportCompressedSize: true,
    // 控制chunk大小警告阈值 (单位: KB)
    chunkSizeWarningLimit: 500
  }
})
