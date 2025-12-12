import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // Garantir que o Service Worker seja copiado
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  // Garantir que assets públicos sejam copiados
  publicDir: 'public',
})
