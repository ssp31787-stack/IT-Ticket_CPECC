import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
    return {
        base: isGitHubPages ? '/IT-Ticket_CPECC/' : '/',
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
    }
})
