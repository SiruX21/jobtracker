import React, { useState, useEffect, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';
import Header from './Header';
import PasswordStrengthIndicator from './components/PasswordStrengthIndicator';
import { FaEye, FaEyeSlash, FaLock, FaSpinner } from 'react-icons/fa';

function ResetPassword({ darkMode, toggleTheme, isMobile }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState('');
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password using backend validation
    if (!passwordValidation || !passwordValidation.valid) {
      toast.error('Please ensure your password meets all security requirements.');
      return;
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token. Please request a new password reset.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: token,
        password: formData.password
      });

      toast.success('Password reset successfully! Redirecting to login...');
      setFormData({ password: '', confirmPassword: '' });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4 transition-all duration-700 ease-in-out">
      <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
      {message && (
        <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-gray-100 p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700/30 animate-slideInUp">
          {/* Header */}
          <div className="text-center mb-6 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enter your new password below
            </p>
          </div>
          {/* Success Message */}
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg animate-slideDown">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-sm font-medium">Success!</p>
            </div>
            <p className="text-sm">{message}</p>
            <p className="text-xs mt-2 text-green-600 dark:text-green-400">
              Redirecting to login page in 3 seconds...
            </p>
          </div>
        </div>
      )}
      <Transition
        appear
        show={!message}
        as={Fragment}
        enter="transition-all duration-700 ease-out"
        enterFrom="opacity-0 translate-y-8 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition-all duration-500 ease-in"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-8 scale-95"
      >
        <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-gray-100 p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700/30 animate-slideInUp">
          {/* Header */}
          <div className="text-center mb-6 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enter your new password below
            </p>
          </div>
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg animate-slideDown">
              <p className="text-sm">{error}</p>
              {error.includes('Invalid reset') && (
                <div className="mt-2">
                  <button
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline"
                  >
                    Request new reset link
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Field */}
            <div className="animate-slideInLeft">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your new password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  className="w-full p-3 pr-14 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 ease-in-out transform focus:scale-105 hover:shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 ease-in-out transform hover:scale-110"
                >
                  {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator 
                password={formData.password}
                onValidationChange={setPasswordValidation}
                showRequirements={true}
              />
            </div>
            {/* Confirm Password Field */}
            <div className="animate-slideInRight">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className={`w-full p-3 pr-14 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 ease-in-out transform focus:scale-105 hover:shadow-md ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 ease-in-out transform hover:scale-110"
                >
                  {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400"> Passwords match</p>
              )}
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !token || !passwordValidation?.valid}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="font-semibold tracking-wide">
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </span>
            </button>
          </form>
          {/* Back to Login */}
          <div className="mt-6 text-center animate-fadeInUp">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400">or</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 dark:text-gray-400">
                Remember your password?{" "}
                <button
                  onClick={() => navigate('/auth')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-all duration-200 ease-in-out transform hover:scale-105 hover:underline"
                >
                  Back to Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}

export default ResetPassword;
