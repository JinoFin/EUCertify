import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'EUCertify',
        short_name: 'EUCertify',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0f14',
        theme_color: '#0ea5e9',
        icons: []
      }
    })
  ],
  test: {
    environment: 'jsdom'
  }
})
