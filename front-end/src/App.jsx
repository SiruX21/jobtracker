import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from "./Header";
import HomePage from "./HomePage";
import IntroPage from "./IntroPage";
import TrackerPage from "./TrackerPage";
import SettingsPage from "./SettingsPage";
import AdminPanel from "./AdminPanel";
import EmailVerification from "./EmailVerification";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import ConfirmEmailChange from "./ConfirmEmailChange";
import VerifyNewEmail from "./VerifyNewEmail";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme !== null) {
      const isDark = savedTheme === "true";
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return isDark;
    }
    // If no saved preference, use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("darkMode", prefersDark.toString());
    return prefersDark;
  });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => {
    return window.innerWidth < 768;
  });

  // Toast settings
  const [toastPosition, setToastPosition] = useState(() => {
    return localStorage.getItem('toastPosition') || 'bottom-center';
  });

  const [toastTheme, setToastTheme] = useState(() => {
    return localStorage.getItem('toastTheme') || 'auto';
  });

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem("darkMode");
      if (savedTheme === null) {
        const newDarkMode = e.matches;
        setDarkMode(newDarkMode);
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for toast settings changes
  useEffect(() => {
    const handleToastSettingsChange = (event) => {
      const { position, theme } = event.detail;
      if (position) {
        setToastPosition(position);
        localStorage.setItem('toastPosition', position);
      }
      if (theme) {
        setToastTheme(theme);
        localStorage.setItem('toastTheme', theme);
      }
    };

    window.addEventListener('toastSettingsChanged', handleToastSettingsChange);
    return () => window.removeEventListener('toastSettingsChanged', handleToastSettingsChange);
  }, []);

  const getToastTheme = () => {
    if (toastTheme === 'auto') {
      return darkMode ? 'dark' : 'light';
    }
    return toastTheme;
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Router>
        <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
        <Routes>
          <Route
            path="/auth"
            element={<IntroPage darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/"
            element={<HomePage darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/tracker"
            element={<TrackerPage darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/settings"
            element={<SettingsPage darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/admin"
            element={<AdminPanel darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/confirm-email-change"
            element={<ConfirmEmailChange darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/verify-new-email"
            element={<VerifyNewEmail darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/verify-email"
            element={<EmailVerification darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
        </Routes>
      </Router>
      
      {/* Simple, working ToastContainer */}
      <ToastContainer
        position={toastPosition}
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={getToastTheme()}
      />
    </div>
  );
}

export default App;