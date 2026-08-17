import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    // vocabulary-extra is a deliberately large, lazy-loaded dictionary chunk.
    chunkSizeWarningLimit: 3200,
  },
})
