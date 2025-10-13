import { defineConfig } from 'vite';

export default defineConfig({
  base: '/mappedin-conference-poc/',  // GitHub Pages base path
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    port: 5173,
  },
});
