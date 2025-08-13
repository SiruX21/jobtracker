import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file from the root directory (one level up from front-end)
  const env = loadEnv(mode, path.resolve(process.cwd(), '..'), '')
  
  // Debug: Log what environment variables we found
  console.log('🔧 Vite Config Debug:');
  console.log('Mode:', mode);
  console.log('Loading .env from:', path.resolve(process.cwd(), '..'));
  console.log('Found VITE_API_BASE_URL:', env.VITE_API_BASE_URL);
  console.log('Found BACKEND_URL:', env.BACKEND_URL);
  console.log('Found DOMAIN:', env.DOMAIN);
  console.log('Found FRONTEND_URL:', env.FRONTEND_URL);
  
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
      __VITE_API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || env.BACKEND_URL),
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL || env.BACKEND_URL),
      __VITE_APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'Job Tracker'),
      __VITE_VERSION__: JSON.stringify(env.VITE_VERSION || '1.0.0'),
      // Also expose other useful env vars for debugging
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    envPrefix: 'VITE_', // Only expose env vars that start with VITE_
  }
})
