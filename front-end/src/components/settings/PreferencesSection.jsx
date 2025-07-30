import React from 'react';
import { FaPalette, FaInfoCircle, FaDownload, FaUndo } from 'react-icons/fa';

function PreferencesSection({ 
  toggleTheme, 
  darkMode, 
  notifications, 
  autoRefresh, 
  dataRetention, 
  handleSettingChange, 
  exportData,
  isMobile 
}) {
  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 className={`font-semibold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>
        Preferences
      </h2>
      
      <div className="space-y-6">
        {/* Theme */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Theme</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out transform hover:scale-105 ${isMobile ? 'w-full justify-center' : ''}`}
          >
            <FaPalette className="mr-2" />
            {darkMode ? 'Dark' : 'Light'} Mode
          </button>
        </div>

        {/* Notifications */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enable browser notifications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 dark:border-gray-600 peer-checked:bg-blue-600 group-hover:scale-105 transition-transform duration-200"></div>
          </label>
        </div>

        {/* Auto Refresh */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Auto Refresh</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically refresh job data</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 dark:border-gray-600 peer-checked:bg-blue-600 group-hover:scale-105 transition-transform duration-200"></div>
          </label>
        </div>

        {/* Data Retention */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900 dark:text-white">Data Retention</h3>
              <div className="relative group ml-2">
                <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Controls how long cached data is kept before being refreshed
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">How long to keep cached data</p>
          </div>
          <select
            value={dataRetention}
            onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
            className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ease-in-out hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 ${isMobile ? 'w-full' : ''}`}
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </select>
        </div>

        {/* Export Data */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'space-x-3'}`}>
            <button
              onClick={exportData}
              className={`flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <FaDownload className="mr-2" />
              Export Data
            </button>
            <button
              onClick={() => {
                // Reset all preferences to defaults
                handleSettingChange('notifications', true);
                handleSettingChange('autoRefresh', true);
                handleSettingChange('dataRetention', '30');
              }}
              className={`flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <FaUndo className="mr-2" />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreferencesSection;
