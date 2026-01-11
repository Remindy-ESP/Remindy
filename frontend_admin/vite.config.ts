import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Optimisations de build
  build: {
    // Minification avec terser pour meilleure compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en production
        drop_debugger: true,
      },
    },

    // Code splitting pour optimiser le chargement
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer React vendor bundle
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },

    // Source maps désactivés en production pour performance
    sourcemap: false,

    // Avertissement si chunk > 1MB
    chunkSizeWarningLimit: 1000,

    // Répertoire de sortie
    outDir: 'dist',

    // Vider le répertoire de sortie avant build
    emptyOutDir: true,
  },

  // Configuration du serveur de dev
  server: {
    port: 5173,
    strictPort: false,
    host: true, // Écouter sur toutes les interfaces
    open: false, // Ne pas ouvrir auto le navigateur
  },

  // Configuration du serveur de preview
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },

  // Résolution des alias (optionnel)
  resolve: {
    alias: {
      '@': '/src',
    },
  },

  // Variables d'environnement
  envPrefix: 'VITE_',
});
