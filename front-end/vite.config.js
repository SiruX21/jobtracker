import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Extract all possible hostnames from environment variables
  const getAllowedHosts = () => {
    const hosts = new Set([
      'localhost',
      '127.0.0.1'
    ]);
    
    // Add DOMAIN directly
    if (env.DOMAIN) {
      hosts.add(env.DOMAIN);
    }
    
    // Extract hostname from FRONTEND_DOMAIN
    if (env.FRONTEND_DOMAIN) {
      try {
        hosts.add(new URL(env.FRONTEND_DOMAIN).hostname);
      } catch (e) {
        // If URL parsing fails, add as-is
        hosts.add(env.FRONTEND_DOMAIN);
      }
    }
    
    // Extract hostname from FRONTEND_URL
    if (env.FRONTEND_URL) {
      try {
        hosts.add(new URL(env.FRONTEND_URL).hostname);
      } catch (e) {
        // If URL parsing fails, add as-is
        hosts.add(env.FRONTEND_URL);
      }
    }
    
    // Add common development and production domains
    hosts.add('jobtrack.dev');
    hosts.add('job.siru.dev');
    
    return Array.from(hosts).filter(Boolean);
  };
  
  return {
    plugins: [react()],
    server: {
      host: true, // Allow external connections
      port: 5173,
      allowedHosts: getAllowedHosts(),
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
