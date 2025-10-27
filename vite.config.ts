import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  base: '/mappedin-conference-poc/',
  root: './',
  publicDir: 'public',
  resolve: {
    alias: {
      $lib: resolve(__dirname, './src/lib'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Disable source map warnings
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 5173,
  },
  css: {
    devSourcemap: false, // Disable CSS source map warnings in dev
  },
});
