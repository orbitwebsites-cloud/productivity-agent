import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Inline the bundled Inter woff2 files as data URIs so the built CSS is
    // self-contained (the prototype also gets published as a single-file
    // preview where separate asset requests would 404).
    assetsInlineLimit: 1024 * 1024,
  },
})
