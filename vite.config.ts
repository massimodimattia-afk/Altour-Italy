import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
  build: {
    // 1. Aumentiamo leggermente il limite per evitare warning inutili
    chunkSizeWarningLimit: 800, 
    rollupOptions: {
      output: {
        // 2. Dividiamo le librerie (node_modules) in chunk separati
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Questo crea un file JS separato per ogni libreria principale
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
  },
});