import { toast } from 'react-toastify';

// Debug function to test if react-toastify is working
const testToastify = () => {
  console.log('Testing react-toastify directly...');
  console.log('toast object:', toast);
  console.log('toast.success function:', toast.success);
  try {
    const result = toast.success('Direct react-toastify test');
    console.log('Direct toast call result:', result);
    return result;
  } catch (error) {
    console.error('Direct toast call failed:', error);
    return null;
  }
};

// Global toast helper - always shows toasts
export const showToast = {
  success: (message, options = {}) => {
    console.log('showToast.success called with:', message, options);
    console.log('Current ToastContainer elements:', document.querySelectorAll('[class*="Toastify"]'));
    try {
      const result = toast.success(message, options);
      console.log('Toast success result:', result);
      return result;
    } catch (error) {
      console.error('Toast success error:', error);
      // Fallback test
      testToastify();
      throw error;
    }
  },
  error: (message, options = {}) => {
    console.log('showToast.error called with:', message, options);
    try {
      const result = toast.error(message, options);
      console.log('Toast error result:', result);
      return result;
    } catch (error) {
      console.error('Toast error failed:', error);
      throw error;
    }
  },
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

// Export test function for debugging
export { testToastify };

export default showToast;
