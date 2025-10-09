import { defineConfig } from 'vite'

export default defineConfig({
  base: '/mappedin-conference-poc/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html',
        'map-app': 'public/map/app.html',
        'map-index': 'public/map/index.html'
      }
    }
  }
})
