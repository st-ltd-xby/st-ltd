import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 每次构建注入时间戳，强制生成不同 hash，避免 Cloudflare Pages 缓存跳过上传
const buildTimestamp = () => ({
  name: 'build-timestamp',
  transform(code: string, id: string) {
    if (id.endsWith('index.html') || id.includes('main.tsx')) {
      return code.replace('__BUILD_TS__', Date.now().toString())
    }
  },
  transformIndexHtml(html: string) {
    return html.replace('__BUILD_TS__', Date.now().toString())
  },
})

export default defineConfig({
  plugins: [react(), buildTimestamp()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})