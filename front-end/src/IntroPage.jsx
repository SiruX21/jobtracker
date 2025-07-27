import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import axios from "axios"; // For API requests
import Cookies from "js-cookie"; // For managing cookies
import config from "./config"; // Import the global config
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import icons for password visibility toggle

function IntroPage({ darkMode, toggleTheme }) {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  // Remove resendCooldown, rely on backend
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Check URL params for mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
    setResendSuccess("");
  };

  // Function to switch between login and signup modes
  const switchToLogin = () => {
    setIsLogin(true);
    setFormData({ ...formData, confirmPassword: "" }); // Clear confirm password
    setError("");
    setResendSuccess("");
  };

  const switchToSignup = () => {
    setIsLogin(false);
    setError("");
    setResendSuccess("");
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (resendLoading) return;
    setResendLoading(true);
    setResendSuccess("");
    try {
      const res = await axios.post(`${config.API_BASE_URL}/auth/resend-verification`, {
        email: formData.email
      });
      setResendSuccess("Verification email sent!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };
  // Validate email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    // Validate email
    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // For signup, validate confirm password
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      if (isLogin) {
        // Login request
        const response = await axios.post(`${config.API_BASE_URL}/auth/login`, {
          username: formData.email, // Backend expects username field
          password: formData.password
        });
        Cookies.set("authToken", response.data.token, { expires: 1 });
        navigate("/tracker");
      } else {
        // Registration request (email will be used as username)
        await axios.post(`${config.API_BASE_URL}/auth/register`, {
          username: formData.email, // Use email as username
          password: formData.password
        });
        switchToLogin();
        setError("Registration successful! Please check your email for verification.");
        // Show success message briefly
        setTimeout(() => {
          setError("");
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4 transition-all duration-700 ease-in-out">
      <Header darkMode={darkMode} toggleTheme={toggleTheme} />
      
      {/* Main Form Container with Slide-in Animation */}
      <div className="mt-8 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-500 ease-out hover:shadow-3xl hover:scale-105 animate-slideInUp">
        
        {/* Header with Fade-in */}
        <div className="text-center mb-6 animate-fadeIn">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Join Us"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {isLogin ? "Sign in to your account" : "Create your new account"}
          </p>
        </div>

        {/* Error Message with Slide Down Animation */}
        {error && !error.toLowerCase().includes("verify your email") && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg animate-slideDown">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message for Registration */}
        {error && error.toLowerCase().includes("registration successful") && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg animate-slideDown">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-sm font-medium">Registration Successful!</p>
            </div>
            <p className="text-sm mt-1">Please check your email for verification instructions.</p>
          </div>
        )}

        {/* Clean Email Verification Section */}
        {error && error.toLowerCase().includes("verify your email") && isLogin && isValidEmail(formData.email) && (
          <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg animate-slideDown">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <p className="text-orange-700 dark:text-orange-300 text-sm font-medium">Email verification required</p>
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-800/30 border border-orange-300 dark:border-orange-600 rounded-md hover:bg-orange-200 dark:hover:bg-orange-700/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? "Sending..." : "Resend"}
              </button>
            </div>
            {resendSuccess && (
              <div className="mt-2 flex items-center space-x-1">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-green-600 dark:text-green-400 text-xs">{resendSuccess}</p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="mb-4 animate-slideInLeft">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 ease-in-out transform focus:scale-105 hover:shadow-md"
            />
          </div>

          {/* Password Field */}
          <div className="mb-4 relative animate-slideInRight">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
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
          </div>

          {/* Confirm Password Field for Sign Up */}
          {!isLogin && (
            <div className="mb-4 animate-slideInRight">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
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
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">✓ Passwords match</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          >
            <span className="font-semibold tracking-wide">
              {isLogin ? "Sign In" : "Create Account"}
            </span>
          </button>

          {/* Forgot Password Button - Only show for login */}
          {isLogin && (
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 underline hover:no-underline"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </form>

        {/* Toggle Section with Fade Animation */}
        <div className="mt-6 text-center animate-fadeInUp">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
            </div>
          </div>
          
          <div className="mt-4">
            {isLogin ? (
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  onClick={switchToSignup}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-all duration-200 ease-in-out transform hover:scale-105 hover:underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  onClick={switchToLogin}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-all duration-200 ease-in-out transform hover:scale-105 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntroPage;