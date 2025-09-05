import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BASE_PATH = '/nmea-widgets/'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : BASE_PATH,
  build: {
    sourcemap: true
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000
  },
  preview: {
    port: 3000
  }
}))

