import { toast } from 'react-toastify';

// Global toast helper - always shows toasts
export const showToast = {
  success: (message, options = {}) => toast.success(message, options),
  error: (message, options = {}) => toast.error(message, options),
  info: (message, options = {}) => toast.info(message, options),
  warning: (message, options = {}) => toast.warning(message, options),
  // Function version for backward compatibility
  show: (type, message, options = {}) => toast[type](message, options)
};

// Special toast for critical actions that should always show
export const showCriticalToast = {
  success: (message, options = {}) => toast.success(message, options),
  error: (message, options = {}) => toast.error(message, options),
  info: (message, options = {}) => toast.info(message, options),
  warning: (message, options = {}) => toast.warning(message, options),
  // Function version for backward compatibility
  show: (type, message, options = {}) => toast[type](message, options)
};

export default showToast;
