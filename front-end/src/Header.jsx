import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaMoon, FaSun, FaHome, FaBriefcase, FaSignInAlt, FaSignOutAlt, FaCog, FaUserShield } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import { API_BASE_URL } from "./config";

function Header({ darkMode, toggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const authToken = Cookies.get("authToken");
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleLogout = () => {
    Cookies.remove("authToken");
    navigate("/");
  };

  const isHomePage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth";

  return (
    <header className={`w-full bg-blue-800 dark:bg-blue-900 shadow-lg py-4 px-6 flex items-center justify-between transition-all duration-300 ${
      isHomePage ? "relative" : "fixed top-0 left-0 z-50"
    }`}>
      {/* Logo */}
      <div 
        className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate("/")}
      >
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-2 rounded-full shadow-lg">
          <FaBriefcase size={20} />
        </div>
        <h1 className="text-xl font-bold text-blue-100">
          JobTracker
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center space-x-4">
        {!isHomePage && (
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
            className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Applications
          </button>
        )}

        {authToken && (
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center text-white hover:text-blue-300 transition"
          >
            <FaCog className="mr-1" />
            Settings
          </button>
        )}

        {authToken && isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center text-white hover:text-red-300 transition bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg"
          >
            <FaUserShield className="mr-1" />
            Admin
          </button>
        )}

        {!authToken && !isAuthPage && (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center text-white hover:text-blue-300 transition"
          >
            <FaSignInAlt className="mr-1" />
            Sign In
          </button>
        )}

        {authToken && (
          <button
            onClick={handleLogout}
            className="flex items-center text-white hover:text-red-300 transition"
          >
            <FaSignOutAlt className="mr-1" />
            Logout
          </button>
        )}

        {/* Theme Toggle - only show if toggleTheme function is provided */}
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className="flex items-center bg-blue-500 dark:bg-blue-700 text-white px-3 py-2 rounded-full hover:bg-blue-600 dark:hover:bg-blue-800 transition"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        )}
      </nav>
    </header>
  );
}

export default Header;