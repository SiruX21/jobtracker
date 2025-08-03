import React from 'react';
import { FaBars } from 'react-icons/fa';

function SettingsHeader({ 
  showMobileSidebar, 
  setShowMobileSidebar, 
  isMobile 
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold text-gray-900 dark:text-white mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Settings
          </h1>
          <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-sm' : ''}`}>
            Manage your account and application preferences
          </p>
        </div>
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={() => {
              const newShowMobileSidebar = !showMobileSidebar;
              setShowMobileSidebar(newShowMobileSidebar);
              
              // Dispatch event to close other mobile menus when opening settings sidebar
              if (newShowMobileSidebar) {
                window.dispatchEvent(new CustomEvent('settingsMobileMenuOpened'));
              }
            }}
            className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <FaBars className={`text-gray-600 dark:text-gray-400 transition-transform duration-200 ${showMobileSidebar ? 'rotate-90' : 'rotate-0'}`} />
          </button>
        )}
      </div>
    </div>
  );
}

export default SettingsHeader;
