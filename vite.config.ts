import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/r2-normal': {
        target: 'https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-normal/, ''),
      },
      '/r2-dog': {
        target: 'https://pub-4d8b3f7049bb4025a6642c75eeb71c46.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-dog/, ''),
      },
      '/r2-block': {
        target: 'https://pub-d7a7a960d42949efb84bea391aa90d4c.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-block/, ''),
      },
      '/r2-rabbit': {
        target: 'https://pub-e50795db8d0d41dd942f04a8b290f95f.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-rabbit/, ''),
      },
      '/r2-peer': {
        target: 'https://pub-026e5fdeaab545cc9c5aa34738735770.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-peer/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  }
})
