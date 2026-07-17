import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

// Dev server proxies /socket.io to the backend on :3000 so the React
// app can just use same-origin socket.io-client with no CORS fuss.
// In production, Express serves the built files directly (no proxy needed).
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
