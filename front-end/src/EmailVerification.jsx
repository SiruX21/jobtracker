import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';

const EmailVerification = ({ darkMode, toggleTheme }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    // Verify the email token
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/verify-email?token=${token}`);
        
        if (response.status === 200) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in to your account.');
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        if (error.response?.data?.error) {
          setMessage(error.response.data.error);
        } else {
          setMessage('Failed to verify email. Please try again or contact support.');
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className={`mt-6 text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Email Verification
            </h2>
          </div>
          
          <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 ${darkMode ? 'border border-gray-700' : ''}`}>
            {status === 'verifying' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Verifying your email address...
                </p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Email Verified Successfully!
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  {message}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Verification Failed
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  {message}
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Go to Login Page
                </button>
              </div>
            )}
          </div>
          
          {/* Theme toggle button */}
          <div className="text-center">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'} shadow-md transition-colors`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
