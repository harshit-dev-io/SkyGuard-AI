import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss',
  },
  build: {
    cssMinify: 'esbuild', // <-- Disables lightningcss minifier and uses esbuild instead
  },
})