import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Proxy /api calls to backend in dev mode
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
            '/webhook': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            }
        }
    }
})
