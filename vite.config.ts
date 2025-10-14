import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/mappedin-conference-poc/',  // GitHub Pages base path
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        demo: resolve(__dirname, 'dynamic-focus-demo.html'),
      },
    },
  },
  server: {
    port: 5173,
  },
});
