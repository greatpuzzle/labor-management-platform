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
})

