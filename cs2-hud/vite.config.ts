import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps every asset reference relative so the built HUD can be
// served by Lexogrine HUD Manager from an arbitrary sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'build',
    assetsInlineLimit: 8192,
    chunkSizeWarningLimit: 1200
  },
  server: {
    port: 3500
  }
});
