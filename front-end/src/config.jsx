// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// API Configuration - Use environment variables with fallbacks
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isDevelopment ? "http://localhost:5000" : "https://api.siru.dev");

// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || "Job Tracker";
export const VERSION = import.meta.env.VITE_VERSION || "1.0.0";

// Environment info
export const ENVIRONMENT = {
  isDevelopment,
  isProduction,
  mode: import.meta.env.MODE
};

const config = {
  API_BASE_URL,
  APP_NAME,
  VERSION,
  ENVIRONMENT,
};

export default config;