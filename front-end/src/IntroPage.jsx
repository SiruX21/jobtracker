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
        const response = await axios.post(`${config.API_BASE_URL}/login`, {
          username: formData.email, // Backend expects username field
          password: formData.password
        });
        Cookies.set("authToken", response.data.token, { expires: 1 });
        navigate("/track");
      } else {
        // Registration request (email will be used as username)
        await axios.post(`${config.API_BASE_URL}/auth/register`, {
          username: formData.email, // Use email as username
          password: formData.password
        });
        setIsLogin(true);
        setFormData({ email: formData.email, password: "", confirmPassword: "" });
        setError("");
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
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg animate-slideDown">
            <p className="text-sm">{error}</p>
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
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            !isLogin ? 'max-h-24 opacity-100 mb-4' : 'max-h-0 opacity-0'
          }`}>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!isLogin}
                className="w-full p-3 pr-14 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 ease-in-out transform focus:scale-105 hover:shadow-md"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 ease-in-out transform hover:scale-110"
              >
                {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          >
            <span className="font-semibold tracking-wide">
              {isLogin ? "Sign In" : "Create Account"}
            </span>
          </button>
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
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-all duration-200 ease-in-out transform hover:scale-105 hover:underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
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