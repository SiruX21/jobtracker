import React from "react";
import { FaMoon, FaSun, FaHome, FaBriefcase } from "react-icons/fa";

function Header({ darkMode, toggleTheme }) {
  return (
    <header className="w-full bg-blue-600 dark:bg-blue-800 shadow-md py-4 px-6 flex items-center justify-between fixed top-0 left-0 z-50">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="bg-blue-800 text-white p-2 rounded-full">
          <FaBriefcase size={20} />
        </div>
        <h1 className="text-xl font-bold text-white">
          JobTracker
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center space-x-4">
        <a
          href="#home"
          className="flex items-center text-white hover:text-blue-300 transition"
        >
          <FaHome className="mr-1" />
          Home
        </a>
        <a
          href="#applications"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          Applications
        </a>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center bg-blue-500 dark:bg-blue-700 text-white px-3 py-2 rounded-full hover:bg-blue-600 dark:hover:bg-blue-800 transition"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </nav>
    </header>
  );
}

export default Header;