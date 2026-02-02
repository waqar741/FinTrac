import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Force restart 2026-01-11
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

});