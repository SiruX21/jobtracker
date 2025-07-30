import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { showToast } from './utils/toast';
import { API_BASE_URL } from './config';
import Header from './Header';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

function EmailVerification({ darkMode, toggleTheme, isMobile }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [hasVerified, setHasVerified] = useState(false); // Prevent duplicate calls

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      showToast.error('Invalid verification link. No token provided.');
      return;
    }

    // Prevent duplicate verification attempts
    if (hasVerified) {
      return;
    }

    // Verify the email token
    const verifyEmail = async () => {
      if (hasVerified) return; // Double check
      
      setHasVerified(true); // Mark as attempted
      
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/verify-email?token=${token}`);
        
        if (response.status === 200) {
          setStatus('success');
          showToast.success('✅ Email verified successfully! Redirecting to login...');
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        if (error.response?.data?.error) {
          showToast.error(error.response.data.error);
        } else {
          showToast.error('Failed to verify email. Please try again or contact support.');
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate, hasVerified]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4 transition-all duration-700 ease-in-out">
      <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
      
      {/* Main Content Container */}
      <div className="mt-8 w-full max-w-md transform transition-all duration-500 ease-out">
        
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Email Verification
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Verifying your email address
          </p>
        </div>

        {/* Status Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-gray-100 p-8 rounded-xl shadow-2xl border border-white/20 dark:border-gray-700/30 animate-slideInUp">
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Verifying your email...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we confirm your email address
                </p>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="relative">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                  <svg className="h-6 w-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-green-400/20 rounded-full animate-ping"></div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Email Verified Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Welcome to Job Tracker! Your account is now active.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="relative">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  Verification Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {message}
                </p>
              </div>
              
              <button
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 font-semibold"
              >
                Go to Login Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
