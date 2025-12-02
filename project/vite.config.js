import { defineConfig } from 'vite' 
import preact from '@preact/preset-vite' 
export default defineConfig({
  plugins: [preact()],
  // --- THE GRAND ENTRANCE (Add this!) ---
  // We place the masks here so they work for both the
  // day guards (dev server) and the night watchmen (tests).
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.js',
    // (Remove the alias from here, for it is now in the resolve block above)
  }


})


