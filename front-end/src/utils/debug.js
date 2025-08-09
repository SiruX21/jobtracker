/**
 * Development-only console logging utility
 * Only logs messages when NODE_ENV is set to 'development'
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

export const debugLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debugWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

export const debugError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export default debugLog;
