import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// LHM serves the built HUD from a nested route, so assets must be relative.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 8192,
    cssCodeSplit: false,
  },
  css: {
    modules: {
      // Readable class names help when debugging the HUD inside OBS.
      generateScopedName: '[name]__[local]__[hash:base64:4]',
    },
  },
});
