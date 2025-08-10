import { toast } from 'react-toastify';

// Simple, working toast implementation
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, options);
  },
  error: (message, options = {}) => {
    return toast.error(message, options);
  },
  info: (message, options = {}) => {
    return toast.info(message, options);
  },
  warning: (message, options = {}) => {
    return toast.warning(message, options);
  }
};

export const showCriticalToast = showToast;

export default showToast;
