import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      host: true, // Allow external connections
      port: 5173,
      allowedHosts: [
        env.DOMAIN || 'localhost',
        env.FRONTEND_DOMAIN ? new URL(env.FRONTEND_DOMAIN).hostname : 'localhost',
        'localhost',
        '127.0.0.1'
      ].filter(Boolean), // Remove any undefined values
    },
    define: {
      // Make environment variables available to the client
      __VITE_API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL),
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL),
      __VITE_APP_NAME__: JSON.stringify(env.VITE_APP_NAME),
      __VITE_VERSION__: JSON.stringify(env.VITE_VERSION),
    },
    envPrefix: 'VITE_', // Only expose env vars that start with VITE_
  }
})
