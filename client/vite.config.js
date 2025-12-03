// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // THIS WILL BYPASS THE PERSISTENT ERROR SCREEN
    hmr: {
        overlay: false, 
    },
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})