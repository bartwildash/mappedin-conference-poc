import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        map: path.resolve(__dirname, 'public/map/index.html'),
        app: path.resolve(__dirname, 'public/map/app.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: '/map',
  },
});
