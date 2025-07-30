import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaMoon, FaSun, FaHome, FaBriefcase, FaSignInAlt, FaSignOutAlt, FaCog, FaUserShield, FaFileAlt, FaBars, FaTimes } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL } from "./config";
import LoadingScreen from "./components/shared/LoadingScreen.jsx";

function Header({ darkMode, toggleTheme, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const authToken = Cookies.get("authToken");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (authToken) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [authToken]);

  const checkAdminStatus = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // If we get here without an error, user is admin
      setIsAdmin(true);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    setShowMobileMenu(false);
    
    // Add a small delay to show the loading screen
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    Cookies.remove("authToken");
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  const isHomePage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth";

  if (logoutLoading) {
    return <LoadingScreen type="logout" />;
  }

  return (
    <>
      <header className={`w-full bg-blue-800 dark:bg-blue-900 shadow-lg transition-all duration-300 ease-in-out ${isMobile ? 'py-3 px-4' : 'py-4 px-6'} flex items-center justify-between ${
        isHomePage ? "relative" : "fixed top-0 left-0 z-50"
      }`}>
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-all duration-200 ease-in-out transform hover:scale-105"
          onClick={() => handleNavigation("/")}
        >
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-2 rounded-full shadow-lg">
            <FaBriefcase size={isMobile ? 16 : 20} />
          </div>
          <h1 className={`font-bold text-blue-100 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            JobTracker
          </h1>
        </div>

        {/* Mobile Menu Button */}
        {isMobile ? (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-white hover:text-blue-300 transition-all duration-200 ease-in-out transform hover:scale-110 p-2"
          >
            {showMobileMenu ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        ) : (
          /* Desktop Navigation Links */
          <nav className="flex items-center space-x-4">
            {authToken && (
              <button
                onClick={() => navigate("/")}
                className="flex items-center text-white hover:text-blue-300 transition"
              >
                <FaHome className="mr-1" />
                Home
              </button>
            )}
            {authToken && (
              <button
                onClick={() => navigate("/tracker")}
                className="flex items-center text-white hover:text-blue-300 transition"
              >
                <FaFileAlt className="mr-1" />
                Applications
              </button>
            )}
            {authToken && (
              <button
                onClick={() => navigate("/settings")}
                className="flex items-center text-white hover:text-blue-300 transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                <FaCog className="mr-1" />
                Settings
              </button>
            )}
            {!authToken && !isAuthPage && (
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center text-white hover:text-blue-300 transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                <FaSignInAlt className="mr-1" />
                Sign In
              </button>
            )}
            {authToken && (
              <button
                onClick={handleLogout}
                className="flex items-center text-white hover:text-red-300 transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                <FaSignOutAlt className="mr-1" />
                Logout
              </button>
            )}
            {/* Theme Toggle - only show if toggleTheme function is provided */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="flex items-center bg-blue-500 dark:bg-blue-700 text-white px-3 py-2 rounded-full hover:bg-blue-600 dark:hover:bg-blue-800 transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Mobile Navigation Menu */}
      {isMobile && showMobileMenu && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out"
          onClick={() => setShowMobileMenu(false)}
        >
          <div 
            className="bg-blue-800 dark:bg-blue-900 w-full shadow-lg transform transition-transform duration-300 ease-in-out mt-16"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="py-4 px-4 space-y-3">
              {authToken && (
                <button
                  onClick={() => handleNavigation("/")}
                  className="w-full flex items-center text-white hover:text-blue-300 transition-all duration-200 ease-in-out py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transform hover:scale-105"
                >
                  <FaHome className="mr-3" />
                  Home
                </button>
              )}
              {authToken && (
                <button
                  onClick={() => handleNavigation("/tracker")}
                  className="w-full flex items-center text-white hover:text-blue-300 transition-all duration-200 ease-in-out py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transform hover:scale-105"
                >
                  <FaFileAlt className="mr-3" />
                  Applications
                </button>
              )}
              {authToken && (
                <button
                  onClick={() => handleNavigation("/settings")}
                  className="w-full flex items-center text-white hover:text-blue-300 transition-all duration-200 ease-in-out py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transform hover:scale-105"
                >
                  <FaCog className="mr-3" />
                  Settings
                </button>
              )}
              {!authToken && !isAuthPage && (
                <button
                  onClick={() => handleNavigation("/auth")}
                  className="w-full flex items-center text-white hover:text-blue-300 transition-all duration-200 ease-in-out py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transform hover:scale-105"
                >
                  <FaSignInAlt className="mr-3" />
                  Sign In
                </button>
              )}
              {authToken && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center text-white hover:text-red-300 transition-all duration-200 ease-in-out py-3 px-4 rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transform hover:scale-105"
                >
                  <FaSignOutAlt className="mr-3" />
                  Logout
                </button>
              )}
              {/* Theme Toggle */}
              {toggleTheme && (
                <button
                  onClick={() => {
                    toggleTheme();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center text-white hover:text-blue-300 transition-all duration-200 ease-in-out py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transform hover:scale-105"
                >
                  {darkMode ? <FaSun className="mr-3" /> : <FaMoon className="mr-3" />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;