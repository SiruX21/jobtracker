import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaMoon, FaSun, FaHome, FaBriefcase, FaSignInAlt, FaSignOutAlt, FaCog, FaUserShield, FaFileAlt } from "react-icons/fa";
import { Switch } from '@headlessui/react';
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
          <nav>
            <section className="MOBILE-MENU flex lg:hidden">
              <div
                className="HAMBURGER-ICON space-y-2 cursor-pointer"
                onClick={() => {
                  const newShowMobileMenu = !showMobileMenu;
                  setShowMobileMenu(newShowMobileMenu);
                  
                  // Dispatch event to close other mobile menus when opening header menu
                  if (newShowMobileMenu) {
                    window.dispatchEvent(new CustomEvent('headerMobileMenuOpened'));
                  }
                }}
              >
                <span className="block h-0.5 w-8 animate-pulse bg-white"></span>
                <span className="block h-0.5 w-8 animate-pulse bg-white"></span>
                <span className="block h-0.5 w-8 animate-pulse bg-white"></span>
              </div>

              <div className={showMobileMenu ? "showMenuNav" : "hideMenuNav"}>
                <div
                  className="absolute top-0 right-0 px-8 py-8 cursor-pointer"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg
                    className="h-8 w-8 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <ul className="flex flex-col items-center justify-center min-h-[250px] space-y-8">
                  {authToken && (
                    <li className="border-b border-gray-400 py-4 uppercase">
                      <button
                        onClick={() => handleNavigation("/")}
                        className="flex items-center text-gray-800 hover:text-blue-600 transition-all duration-200"
                      >
                        <FaHome className="mr-3" />
                        Home
                      </button>
                    </li>
                  )}
                  {authToken && (
                    <li className="border-b border-gray-400 py-4 uppercase">
                      <button
                        onClick={() => handleNavigation("/tracker")}
                        className="flex items-center text-gray-800 hover:text-blue-600 transition-all duration-200"
                      >
                        <FaFileAlt className="mr-3" />
                        Applications
                      </button>
                    </li>
                  )}
                  {authToken && (
                    <li className="border-b border-gray-400 py-4 uppercase">
                      <button
                        onClick={() => handleNavigation("/settings")}
                        className="flex items-center text-gray-800 hover:text-blue-600 transition-all duration-200"
                      >
                        <FaCog className="mr-3" />
                        Settings
                      </button>
                    </li>
                  )}
                  {!authToken && !isAuthPage && (
                    <li className="border-b border-gray-400 py-4 uppercase">
                      <button
                        onClick={() => handleNavigation("/auth")}
                        className="flex items-center text-gray-800 hover:text-blue-600 transition-all duration-200"
                      >
                        <FaSignInAlt className="mr-3" />
                        Sign In
                      </button>
                    </li>
                  )}
                  {authToken && (
                    <li className="border-b border-gray-400 py-4 uppercase">
                      <button
                        onClick={handleLogout}
                        className="flex items-center text-red-600 hover:text-red-800 transition-all duration-200"
                      >
                        <FaSignOutAlt className="mr-3" />
                        Logout
                      </button>
                    </li>
                  )}
                  {/* Theme Toggle */}
                  {toggleTheme && (
                    <li className="py-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-800">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
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
                    </li>
                  )}
                </ul>
              </div>
            </section>
          </nav>
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

      <style>{`
        .hideMenuNav {
          display: none;
        }
        .showMenuNav {
          display: block;
          position: fixed;
          width: 100%;
          height: 100vh;
          top: 0;
          left: 0;
          background: white;
          z-index: 50;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .dark .showMenuNav {
          background: #1f2937;
        }
        .dark .showMenuNav li button {
          color: #f3f4f6;
        }
        .dark .showMenuNav li button:hover {
          color: #3b82f6;
        }
        .dark .showMenuNav svg {
          color: #f3f4f6;
        }
      `}</style>
    </>
  );
}

export default Header;