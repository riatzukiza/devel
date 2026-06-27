import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5197,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://control-plane:8788',
        changeOrigin: true,
      },
    },
  },
})
