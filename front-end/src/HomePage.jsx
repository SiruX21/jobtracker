import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transition } from '@headlessui/react';
import Cookies from 'js-cookie';
import Header from './Header';
import { 
  FaBriefcase, FaChartLine, FaStar, FaRocket, FaLaptop, FaMobile, 
  FaSearch, FaCheck, FaBuilding, FaGlobe, FaLink, FaEnvelope, 
  FaPhone, FaCog, FaLightbulb, FaCrosshairs, FaPalette, FaTools,
  FaClipboard, FaTrophy, FaArrowUp, FaArrowDown, FaPlay
} from 'react-icons/fa';

function HomePage({ darkMode, toggleTheme, isMobile }) {
  const navigate = useNavigate();
  const [rainIcons, setRainIcons] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const authToken = Cookies.get("authToken");
    setIsAuthenticated(!!authToken);
  }, []);

  useEffect(() => {
    const iconComponents = [
      FaBriefcase, FaChartLine, FaStar, FaRocket, FaLaptop, FaMobile,
      FaSearch, FaCheck, FaBuilding, FaGlobe, FaLink, FaEnvelope,
      FaPhone, FaCog, FaLightbulb, FaCrosshairs, FaPalette, FaTools,
      FaClipboard, FaTrophy, FaArrowUp, FaArrowDown, FaPlay
    ];
    const colors = ['text-blue-300', 'text-cyan-300', 'text-blue-400', 'text-cyan-400', 'text-blue-200', 'text-cyan-200'];
    const speeds = ['rain-icon', 'rain-icon-slow', 'rain-icon-fast'];
    const sizes = ['text-xs', 'text-sm', 'text-base'];
    const opacities = ['opacity-20', 'opacity-30', 'opacity-40', 'opacity-50', 'opacity-60'];

    const generateRainIcons = () => {
      const iconCount = Math.floor(Math.random() * 30) + 40; // 40-70 icons
      const newIcons = [];

      for (let i = 0; i < iconCount; i++) {
        newIcons.push({
          id: i,
          IconComponent: iconComponents[Math.floor(Math.random() * iconComponents.length)],
          left: Math.random() * 100, // 0-100%
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: speeds[Math.floor(Math.random() * speeds.length)],
          size: sizes[Math.floor(Math.random() * sizes.length)],
          opacity: opacities[Math.floor(Math.random() * opacities.length)],
          delay: Math.random() * 8, // 0-8 second delay
        });
      }

      setRainIcons(newIcons);
    };

    // Generate icons after the call-to-action buttons appear (700ms delay + 500ms buffer)
    const rainTimer = setTimeout(() => {
      generateRainIcons();
    }, 1200);

    return () => clearTimeout(rainTimer);
  }, []);

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <Header darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile} />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-blue-900 dark:via-slate-900 dark:to-blue-950 flex flex-col items-center justify-center px-4 transition-all duration-700 ease-in-out relative overflow-hidden">
        
        {/* Animated Raining Icons - Behind everything */}
        {rainIcons.map((rainIcon) => {
          const IconComponent = rainIcon.IconComponent;
          return (
            <div
              key={rainIcon.id}
              className={`absolute ${rainIcon.speed} ${rainIcon.color} ${rainIcon.size} ${rainIcon.opacity} z-0`}
              style={{
                left: `${rainIcon.left}%`,
                animationDelay: `${rainIcon.delay}s`,
                top: '-10vh'
              }}
            >
              <IconComponent />
            </div>
          );
        })}
        
        {/* Gradient orbs for depth */}
        <div className="absolute top-20 left-1/2 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-xl opacity-50 z-0"></div>
        <div className="absolute bottom-20 right-1/2 w-24 h-24 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-xl opacity-50 z-0"></div>
        <div className="absolute top-1/3 left-1/6 w-20 h-20 bg-gradient-to-r from-blue-400/8 to-cyan-400/8 rounded-full blur-lg opacity-40 z-0"></div>
        <div className="absolute bottom-1/3 right-1/6 w-16 h-16 bg-gradient-to-r from-cyan-400/8 to-blue-400/8 rounded-full blur-lg opacity-40 z-0"></div>
        
        {/* Animated background lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full border border-blue-400/5 rounded-full"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full border border-cyan-400/5 rounded-full"></div>
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-blue-300/5 rounded-full"></div>
        </div>

        {/* Hero Section */}
        <Transition
          appear
          show={true}
          as="div"
          enter="transition-all duration-1000 ease-out"
          enterFrom="opacity-0 translate-y-8 scale-95"
          enterTo="opacity-100 translate-y-0 scale-100"
          className={`max-w-4xl mx-auto text-center relative z-10 ${isMobile ? 'px-4' : ''}`}
        >
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className={`mb-4 ${isMobile ? 'text-6xl' : 'text-8xl'}`}><FaClipboard className="mx-auto text-blue-200" /></div>
            <h1 className={`font-bold mb-4 bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-100 bg-clip-text text-transparent ${isMobile ? 'text-4xl' : 'text-6xl'}`}>
              JobTracker
            </h1>
          </div>

          {/* Main Description */}
          <Transition
            appear
            show={true}
            as="div"
            enter="transition-all duration-1000 ease-out delay-300"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            className="mb-12"
          >
            <h2 className={`font-bold text-blue-100 dark:text-blue-100 mb-6 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
              Take Control of Your Job Search Journey
            </h2>
            <p className={`text-blue-200 dark:text-blue-200 leading-relaxed mb-8 max-w-3xl mx-auto ${isMobile ? 'text-base' : 'text-xl'}`}>
              Stay organized, track your applications, and never miss an opportunity. 
              JobTracker helps you manage your job applications with ease and style.
            </p>
          </Transition>

          {/* Features Grid */}
          <Transition
            appear
            show={true}
            as="div"
            enter="transition-all duration-1000 ease-out delay-500"
            enterFrom="opacity-0 translate-y-8"
            enterTo="opacity-100 translate-y-0"
            className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'} gap-8 mb-12`}
          >
            <div className="bg-blue-800/30 dark:bg-blue-900/40 backdrop-blur-sm border border-blue-400/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center text-4xl mb-4"><FaCrosshairs className="text-blue-300" /></div>
              <h3 className="text-xl font-bold text-blue-100 dark:text-blue-100 mb-2">Track Applications</h3>
              <p className="text-blue-200 dark:text-blue-200">
                Keep track of every application with detailed status updates and notes.
              </p>
            </div>
            <div className="bg-blue-800/30 dark:bg-blue-900/40 backdrop-blur-sm border border-blue-400/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center text-4xl mb-4"><FaChartLine className="text-cyan-300" /></div>
              <h3 className="text-xl font-bold text-blue-100 dark:text-blue-100 mb-2">Visual Dashboard</h3>
              <p className="text-blue-200 dark:text-blue-200">
                See your progress at a glance with beautiful charts and statistics.
              </p>
            </div>
            <div className="bg-blue-800/30 dark:bg-blue-900/40 backdrop-blur-sm border border-blue-400/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center text-4xl mb-4"><FaRocket className="text-blue-300" /></div>
              <h3 className="text-xl font-bold text-blue-100 dark:text-blue-100 mb-2">Stay Organized</h3>
              <p className="text-blue-200 dark:text-blue-200">
                Never lose track of deadlines, interviews, or follow-ups again.
              </p>
            </div>
          </Transition>

          {/* Call to Action Buttons */}
          <Transition
            appear
            show={true}
            as="div"
            enter="transition-all duration-1000 ease-out delay-700"
            enterFrom="opacity-0 translate-y-8"
            enterTo="opacity-100 translate-y-0"
            className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-6 justify-center items-center`}
          >
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/tracker')}
                className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center ${isMobile ? 'text-base w-full' : 'text-lg min-w-48'}`}
              >
                <FaPlay className="mr-2" />
                Launch Application
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth?mode=signup')}
                  className={`bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 ${isMobile ? 'text-base w-full' : 'text-lg min-w-48'}`}
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate('/auth?mode=login')}
                  className={`bg-blue-800/30 dark:bg-blue-900/40 backdrop-blur-sm border-2 border-blue-400/30 text-blue-100 dark:text-blue-100 px-8 py-4 rounded-2xl font-bold hover:bg-blue-700/40 dark:hover:bg-blue-800/50 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 ${isMobile ? 'text-base w-full' : 'text-lg min-w-48'}`}
                >
                  Sign In
                </button>
              </>
            )}
          </Transition>

          {/* Additional Info */}
          <Transition
            appear
            show={true}
            as="div"
            enter="transition-all duration-1000 ease-out delay-900"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            className="mt-12"
          >
            <p className="text-blue-300 dark:text-blue-300 text-sm">
              {isAuthenticated 
                ? "Welcome back! Ready to manage your job applications?" 
                : "Join thousands of job seekers who have organized their search with JobTracker"
              }
            </p>
          </Transition>
        </Transition>
      </div>
    </div>
  );
}

export default HomePage;
