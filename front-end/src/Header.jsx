import React, { useState, useEffect, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaMoon, FaSun, FaHome, FaBriefcase, FaSignInAlt, FaSignOutAlt, FaCog, FaUserShield, FaFileAlt, FaBars, FaTimes } from "react-icons/fa";
import { Switch, Transition } from '@headlessui/react';
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL } from "./config";
import LoadingScreen from './components/shared/LoadingScreen';

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

  // Listen for settings mobile menu opening - close header mobile menu
  useEffect(() => {
    const handleSettingsMobileMenuOpened = () => {
      setShowMobileMenu(false);
    };

    window.addEventListener('settingsMobileMenuOpened', handleSettingsMobileMenuOpened);
    return () => window.removeEventListener('settingsMobileMenuOpened', handleSettingsMobileMenuOpened);
  }, []);

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
    return <LoadingScreen type="logout" darkMode={darkMode} />;
  }

  return (
    <>
      <header className={`w-full bg-blue-800 dark:bg-blue-900 shadow-lg transition-all duration-300 ease-in-out py-4 px-4 md:px-6 flex items-center justify-between ${
        isHomePage ? "relative" : "fixed top-0 left-0 z-50"
      }`}>
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-all duration-200 ease-in-out transform hover:scale-105"
          onClick={() => handleNavigation("/")}
        >
          <img 
            src="/jobtrack.png" 
            alt="jobtrack.dev logo" 
            className="h-8 md:h-10" 
          />
        </div>

        {/* Navigation - responsive layout */}
        {isMobile ? (
          /* Mobile Menu Button - show on mobile */
          <button
            onClick={() => {
              const newShowMobileMenu = !showMobileMenu;
              setShowMobileMenu(newShowMobileMenu);
              
              // Dispatch event to close other mobile menus when opening header menu
              if (newShowMobileMenu) {
                window.dispatchEvent(new CustomEvent('headerMobileMenuOpened'));
              }
            }}
            className="text-white hover:text-blue-300 transition-all duration-200 ease-in-out transform hover:scale-110 p-2"
          >
            {showMobileMenu ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        ) : (
          /* Desktop Navigation Links - show on desktop */
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
              <Switch
                checked={darkMode}
                onChange={toggleTheme}
                className="group relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-500 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 data-[checked]:bg-blue-600"
              >
                <span className="sr-only">Toggle theme</span>
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    darkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  <span
                    className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in ${
                      darkMode ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <FaMoon className="h-3 w-3 text-blue-500" />
                  </span>
                  <span
                    className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-out ${
                      darkMode ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <FaSun className="h-3 w-3 text-blue-500" />
                  </span>
                </span>
              </Switch>
            )}
          </nav>
        )}
      </header>

      {/* Mobile Navigation Menu - show on mobile only */}
      <Transition appear show={isMobile && showMobileMenu} as={Fragment}>
        {/* Overlay */}
        <Transition.Child
          as="div"
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMobileMenu(false)}
        />
        {/* Panel */}
        <Transition.Child
          as="div"
          enter="transition-transform transition-opacity duration-300"
          enterFrom="opacity-0 -translate-y-4"
          enterTo="opacity-100 translate-y-0"
          leave="transition-transform transition-opacity duration-200"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-4"
          className="fixed left-0 right-0 bg-blue-800 dark:bg-blue-900 w-full shadow-lg z-50"
          style={{ marginTop: '72px' }}
          onClick={e => e.stopPropagation()}
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
                <div className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center">
                    {darkMode ? <FaSun className="mr-3 text-white" /> : <FaMoon className="mr-3 text-white" />}
                    <span className="text-white">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <Switch
                    checked={darkMode}
                    onChange={() => {
                      toggleTheme();
                      setShowMobileMenu(false);
                    }}
                    className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-300 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 data-[checked]:bg-blue-500"
                  >
                    <span className="sr-only">Toggle theme</span>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        darkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </Switch>
                </div>
              )}
            </nav>
        </Transition.Child>
      </Transition>
    </>
  );
}

export default Header;