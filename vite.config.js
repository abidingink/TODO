import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: false,
    // For production deployment with Cloudflare Pages
    // This ensures SPA routing works correctly
    middlewareMode: false,
  },
  // Environment variables
  define: {
    'process.env.VITE_WORKER_URL': JSON.stringify(process.env.VITE_WORKER_URL || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})