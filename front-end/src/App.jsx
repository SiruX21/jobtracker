import React, { useState, useEffect } from "react"; // Import useState and useEffect here
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

  // Toast settings state
  const [toastPosition, setToastPosition] = useState(() => 
    localStorage.getItem('toastPosition') || 'bottom-center'
  );
  const [toastTheme, setToastTheme] = useState(() => 
    localStorage.getItem('toastTheme') || 'auto'
  );
  
  // Notifications enabled state
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => 
    localStorage.getItem('notifications') !== 'false'
  );

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice && isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for OS color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if no manual preference is saved
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
      setToastPosition(position);
      setToastTheme(theme);
    };

    window.addEventListener('toastSettingsChanged', handleToastSettingsChange);
    return () => window.removeEventListener('toastSettingsChanged', handleToastSettingsChange);
  }, []);

  // Listen for notification setting changes
  useEffect(() => {
    const handleNotificationSettingsChange = () => {
      const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
      setNotificationsEnabled(notificationsEnabled);
    };

    // Check on mount and when localStorage changes
    handleNotificationSettingsChange();
    
    // Listen for storage events (when localStorage is changed in other tabs)
    window.addEventListener('storage', handleNotificationSettingsChange);
    
    // Listen for custom events (when localStorage is changed in same tab)
    window.addEventListener('notificationSettingsChanged', handleNotificationSettingsChange);
    
    return () => {
      window.removeEventListener('storage', handleNotificationSettingsChange);
      window.removeEventListener('notificationSettingsChanged', handleNotificationSettingsChange);
    };
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
    
    // Apply dark class to document element for global dark mode
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Router>
      <div className={`${darkMode ? "dark" : ""}`}>
        <Routes>
          <Route
            path="/"
            element={<HomePage darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/auth"
            element={<IntroPage darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/tracker"
            element={<TrackerPage darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/track"
            element={<Navigate to="/tracker" replace />}
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
            path="/verify-email"
            element={<EmailVerification darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />}
          />
        </Routes>
        
        {/* Toast Container for global notifications - only render if notifications are enabled */}
        {notificationsEnabled && (
          <ToastContainer
            position={toastPosition}
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={getToastTheme()}
            className="custom-toast-container"
          />
        )}
      </div>
    </Router>
  );
}

export default App;