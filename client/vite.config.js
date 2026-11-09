import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: app deploys don't invalidate the cached framework code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return 'vendor-react'
          if (/[\\/]node_modules[\\/](@reduxjs|redux|react-redux|immer|reselect)[\\/]/.test(id)) return 'vendor-state'
          if (/[\\/]node_modules[\\/](@radix-ui|@floating-ui)[\\/]/.test(id)) return 'vendor-ui'
          if (/[\\/]node_modules[\\/](socket\.io-client|engine\.io-client|socket\.io-parser|axios)[\\/]/.test(id)) return 'vendor-net'
          return undefined
        },
      },
    },
  },
})
