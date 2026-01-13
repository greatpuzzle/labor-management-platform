import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA plugin will be added later when compatible version is available
    // For now, PWA features can be added manually via manifest.json
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },
  server: {
    port: 5174,
    host: true, // Allow access from network
  },
  build: {
    // 캐시 버스팅을 위한 해시 생성 강화
    rollupOptions: {
      output: {
        // 파일명에 타임스탬프 추가하여 캐시 무효화
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
  },
})

