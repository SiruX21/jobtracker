import { toast } from 'react-toastify';

// Global toast helper that respects the notification settings
export const showToast = (type, message, options = {}) => {
  const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
  
  if (notificationsEnabled) {
    toast[type](message, options);
  }
};

// Special toast for critical actions that should always show
export const showCriticalToast = (type, message, options = {}) => {
  toast[type](message, options);
};

export default showToast;
