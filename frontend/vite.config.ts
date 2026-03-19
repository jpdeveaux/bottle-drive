import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // This maps the alias to the physical folder outside /frontend
      '@shared': path.resolve(__dirname, '../shared'),
      '@auth': path.resolve(__dirname, './src/authFetch.ts'),
      "@context": path.resolve(__dirname, "./src/context"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },
  server: {
    watch: {
      usePolling: true, // Crucial for WSL2/Docker hot-reloading
    },
    host: true, // Listen on all addresses
    port: 5173,
    fs: {
      // Allow serving files from one level up (the shared folder)
      allow: ['..']
    },
  }
})