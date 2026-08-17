import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-mobile',
    rollupOptions: {
      input: {
        // 只打包移动端页面需要的入口
        scan: './src/pages/MobileScan.tsx',
        'mobile-visits': './src/pages/scrm/MobileVisits.tsx',
      },
    },
  },
})
